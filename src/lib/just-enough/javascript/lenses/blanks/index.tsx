/**
 * @file React wrapper for the `blanks` lens. Default-exports the
 * frozen `LensModule` the orchestrator's lens registry consumes. The
 * wrapper composes the pure-TS core (`./core.js`, `./derive-blanks.js`,
 * `./validate-answer.js`) into the fill-in-the-blank surface: a
 * `<div data-lens="blanks">` root with a toolbar (difficulty slider,
 * category checkboxes, score readout) and a display surface
 * (`<pre><code>` with `<input>` elements at blank positions).
 *
 * Per `./DOCS.md` § Execution phases, this wrapper owns Phases 4–7:
 * render the surface, re-derive on toolbar-knob changes (resetting
 * learner answers), validate per-blank correctness, aggregate the
 * score.
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';

import { freezeInPlace } from '@utils/freeze.js';

import type { LensModule, LensProps as LensProperties } from '../types.js';

import blanksCore from './core.js';
import deriveBlanks from './derive-blanks.js';
import type { TokenCategory } from './types.js';
import validateAnswer from './validate-answer.js';

const ALL_CATEGORIES: ReadonlyArray<TokenCategory> = [
	'keywords',
	'identifiers',
	'operators',
	'literals',
];

/**
 * The full set of valid `TokenCategory` strings. Used to validate
 * educator-supplied `tokenCategories` overrides before they reach the
 * derivation function (which silently drops unknown categories).
 */
const VALID_CATEGORIES: ReadonlySet<string> = new Set(ALL_CATEGORIES);

/**
 * Narrow `resolved.tokenCategories` (an unknown-shape `LensConfig`
 * field) to `ReadonlyArray<TokenCategory>`. Falls back to all four
 * when the field is absent or not an array. When the field IS an
 * array, unknown entries are filtered out (which may produce `[]` —
 * the all-categories-disabled state is a legitimate educator choice
 * and matches the v1 "empty categories → zero blanks" contract).
 */
function normalizeCategories(
	value: unknown,
): ReadonlyArray<TokenCategory> {
	if (!Array.isArray(value)) return ALL_CATEGORIES;
	const filtered = value.filter((entry): entry is TokenCategory =>
		typeof entry === 'string' && VALID_CATEGORIES.has(entry),
	);
	return filtered;
}

/**
 * Narrow `resolved.difficulty` (an unknown-shape `LensConfig` field)
 * to a number. Falls back to `50` when the field is absent, not a
 * number, or non-finite (`NaN`/`Infinity`). The derivation function
 * clamps the value to `[0, 100]` internally.
 */
function normalizeDifficulty(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 50;
}

const BlanksComponent: ComponentType<LensProperties> =
	function BlanksComponent({ embodiment, config }) {
		const resolved = blanksCore.config(config);

		const [tokenCategories, setTokenCategories] = useState<
			ReadonlyArray<TokenCategory>
		>(() => normalizeCategories(resolved.tokenCategories));
		const [difficulty, setDifficulty] = useState<number>(() =>
			normalizeDifficulty(resolved.difficulty),
		);

		// Per-mount seed: pinned `config.seed` if present, else a random
		// uint32 computed once at first render. The core's selection
		// function is pure (takes seed as input); the wrapper owns the
		// non-determinism source per DOCS § Structural constraints
		// "Seeded selection is deterministic, wrapper-randomized by
		// default". `Math.random()` is correct here — this is not
		// cryptographic; it picks which subset of tokens to blank.
		const seed = useMemo(
			function computeSeed() {
				if (typeof resolved.seed === 'number') return resolved.seed;
				// eslint-disable-next-line sonarjs/pseudo-random -- per-mount blank selection, not cryptographic
				return Math.floor(Math.random() * 0x1_00_00_00_00);
			},
			[],
		);

		const derivation = useMemo(
			function deriveOnChange() {
				return deriveBlanks(embodiment, difficulty, tokenCategories, seed);
			},
			[embodiment, difficulty, tokenCategories, seed],
		);

		const [learnerAnswers, setLearnerAnswers] = useState<
			Readonly<Record<number, string>>
		>({});

		// Phase 5 contract per DOCS § Execution phases: when derivation
		// changes (toolbar knob change, embodiment change), learner-
		// answer state resets to empty. The new blanks have different
		// positions/indices/answers; preserving prior text would map
		// it onto unrelated blanks.
		useEffect(
			function resetAnswersOnReDerivation() {
				setLearnerAnswers({});
			},
			[derivation],
		);

		const blankCount = derivation.blanks.length;
		let correctCount = 0;
		for (const blank of derivation.blanks) {
			const learnerAnswer = learnerAnswers[blank.index] ?? '';
			if (validateAnswer(blank.answer, learnerAnswer) === 'correct') {
				correctCount += 1;
			}
		}
		const score =
			blankCount === 0 ? 0 : Math.round((correctCount / blankCount) * 100);

		function handleAnswerChange(index: number, value: string): void {
			setLearnerAnswers(function updateAnswer(previous) {
				return { ...previous, [index]: value };
			});
		}

		function handleDifficultyChange(
			event: React.ChangeEvent<HTMLInputElement>,
		): void {
			const next = Number.parseInt(event.target.value, 10);
			if (Number.isFinite(next)) setDifficulty(next);
		}

		function handleCategoryToggle(category: TokenCategory): void {
			setTokenCategories(function toggleCategory(previous) {
				if (previous.includes(category)) {
					return previous.filter(function notCategory(entry) {
						return entry !== category;
					});
				}
				return [...previous, category];
			});
		}

		return (
			<div data-lens="blanks">
				<div data-blanks-toolbar="true">
					<label>
						Difficulty
						<input
							type="range"
							min="0"
							max="100"
							value={difficulty}
							onChange={handleDifficultyChange}
							data-blanks-difficulty="true"
						/>
					</label>
					{ALL_CATEGORIES.map(function renderCategory(category) {
						return (
							<label key={category}>
								<input
									type="checkbox"
									data-category={category}
									checked={tokenCategories.includes(category)}
									onChange={function toggleThisCategory() {
										handleCategoryToggle(category);
									}}
								/>
								{category}
							</label>
						);
					})}
					<output data-blanks-score="true" aria-live="polite">
						{`${score}% (${correctCount}/${blankCount})`}
					</output>
				</div>
				<pre data-blanks-display="true">
					<code>
						{derivation.fragments.map(function renderFragment(fragment, position) {
							if (fragment.kind === 'text') {
								return <span key={position}>{fragment.text}</span>;
							}
							return (
								<input
									key={position}
									type="text"
									data-blank-index={fragment.index}
									aria-label={`blank ${fragment.index + 1}`}
									value={learnerAnswers[fragment.index] ?? ''}
									onChange={function updateThisBlank(event) {
										handleAnswerChange(fragment.index, event.target.value);
									}}
								/>
							);
						})}
					</code>
				</pre>
			</div>
		);
	};

const blanksLens: LensModule = freezeInPlace<LensModule>({
	name: 'blanks',
	Component: BlanksComponent,
	config: blanksCore.config,
	applicableTo: blanksCore.applicableTo,
	recommend: blanksCore.recommend,
});

export default blanksLens;
