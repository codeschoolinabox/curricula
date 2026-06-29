/**
 * @file React wrapper for the `quiz` lens — Slice A. Renders a read-only,
 * un-colorized CodeMirror editor over the snippet (the lens's own decorations,
 * NOT syntax highlighting, carry meaning); clicking a syntax element highlights
 * that anchor (inc 2) and opens a question panel with the V1 prompt + options
 * (inc 3). A fallback notice renders when the snippet did not parse. Graded
 * verdicts (inc 4) build on the panel. Owns all per-mount learner state; never
 * writes to the orchestrator's snippet (single-writer invariant). Freezes +
 * default-exports the `LensModule`.
 */

import { EditorState, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import freezeInPlace from '@utils/freeze-in-place.js';

import type { ClassifiedToken } from '../../lib/classifying/types.js';
import type { McqQuizItem, Verdict } from '../../lib/quizzing/types.js';
import type { LensModule, LensProps as LensProperties } from '../types.js';

import quizCore from './core.js';
import anchors from './lib/anchors.js';
import buildQuiz from './lib/build-quiz.js';
import masteryDecorations from './lib/decorations.js';
import gradeOption from './lib/grade-option.js';
import type { MasteryDecos, MasteryState, ProgressBucket } from './types.js';

import './quiz.css';

// The picked-anchor highlight: a single `Decoration.mark` over the picked token
// range, driven by a `StateEffect` dispatched from React when the pick changes
// — so the highlight updates without remounting the read-only view.
const setAnchorHit = StateEffect.define<readonly [number, number] | null>();
const anchorMark = Decoration.mark({ class: 'cm-quiz-anchor-hit' });
const anchorHitField = StateField.define<DecorationSet>({
	create() {
		return Decoration.none;
	},
	update(decorations, transaction) {
		const hit = transaction.effects.find(
			(effect): effect is StateEffect<readonly [number, number] | null> =>
				effect.is(setAnchorHit),
		);
		// Read-only view → the doc never changes, so positions are stable and no
		// `DecorationSet.map(changes)` is needed; return the set unchanged.
		if (hit === undefined) return decorations;
		return hit.value === null
			? Decoration.none
			: Decoration.set([anchorMark.range(hit.value[0], hit.value[1])]);
	},
	provide: (field) => EditorView.decorations.from(field),
});

// The two mastery decoration channels (inc 5), painted on every same-group token
// from the per-mount `MasteryState`. One `StateField` fed by one `StateEffect`
// carrying both channels' ranges (computed by the pure `./lib/decorations.ts`);
// the read-only doc never changes, so positions are stable and no
// `DecorationSet.map(changes)` is needed. Channel 1 (progress) is an underline
// whose density `bucket` rises with mastery; channel 2 (wrong) is an independent
// overline. Both classes paint with `currentColor` (no hue), so a learner with
// color-vision deficiency reads them on separate axes — see `quiz.css`.
const setMasteryDecos = StateEffect.define<MasteryDecos>();
const progressMarks: Readonly<Record<ProgressBucket, Decoration>> = {
	1: Decoration.mark({ class: 'cm-quiz-progress cm-quiz-progress-1' }),
	2: Decoration.mark({ class: 'cm-quiz-progress cm-quiz-progress-2' }),
	3: Decoration.mark({ class: 'cm-quiz-progress cm-quiz-progress-3' }),
	4: Decoration.mark({ class: 'cm-quiz-progress cm-quiz-progress-4' }),
};
const wrongMark = Decoration.mark({ class: 'cm-quiz-wrong' });
const masteryField = StateField.define<DecorationSet>({
	create() {
		return Decoration.none;
	},
	update(decorations, transaction) {
		const effect = transaction.effects.find(
			(candidate): candidate is StateEffect<MasteryDecos> =>
				candidate.is(setMasteryDecos),
		);
		if (effect === undefined) return decorations;
		const ranges = [
			...effect.value.progress.map((entry) =>
				progressMarks[entry.bucket].range(entry.range[0], entry.range[1]),
			),
			...effect.value.wrong.map((range) => wrongMark.range(range[0], range[1])),
		];
		// `true` lets CodeMirror sort the merged channels — a token that is both
		// in-progress and wrong carries two marks at the same `from`.
		return Decoration.set(ranges, true);
	},
	provide: (field) => EditorView.decorations.from(field),
});

// The empty mastery state, hoisted as a stable frozen reference so the
// source-change reset is a referential no-op on mount (matches `core.ts`'s
// `EMPTY_RECOMMENDATIONS`).
const EMPTY_MASTERY = freezeInPlace<MasteryState>({});

// Slice A reads no config knob (the V1 form is parameterless), so the wrapper
// takes only `embodiment`; the `core.config(props.config)` resolution lands
// with the first knob (inc 8).
const QuizComponent: ComponentType<LensProperties> = function QuizComponent({
	embodiment,
}) {
	const editorContainer = useRef<HTMLDivElement | null>(null);
	const editorView = useRef<EditorView | null>(null);

	// The classified anchor stream, rebuilt only when the source changes. Held
	// in a ref so the (mount-time) mousedown handler always resolves clicks
	// against the current stream without re-creating the view.
	const model = useMemo(() => buildQuiz(embodiment), [embodiment.source.code]);
	const classified: readonly ClassifiedToken[] = model?.classified ?? [];
	const classifiedReference = useRef<readonly ClassifiedToken[]>(classified);
	classifiedReference.current = classified;

	// The V1 quiz items (one per token); the panel resolves the picked range to
	// its item via `itemsAt`.
	const items = model?.items ?? [];

	// The picked anchor's range (per-mount UI state); null when nothing — or
	// whitespace — is selected. Drives the highlight decoration.
	const [pickedRange, setPickedRange] = useState<
		readonly [number, number] | null
	>(null);

	// The verdict for the most recent answer at the picked anchor; null until the
	// learner answers. Reset whenever the pick changes (a new anchor → no verdict).
	const [verdict, setVerdict] = useState<Verdict | null>(null);

	// Per-group mastery accrued from graded answers (inc 5). Disposable practice:
	// reset on source change. Drives the two color-free decoration channels.
	const [mastery, setMastery] = useState<MasteryState>(EMPTY_MASTERY);

	useEffect(
		function mountEditor() {
			const host = editorContainer.current;
			// Always return the (idle-safe) cleanup — never an early bare/undefined
			// return. On the fallback path the host is absent, so no view is created
			// and `view?.destroy()` no-ops.
			let view: EditorView | undefined;
			if (host) {
				view = new EditorView({
					state: EditorState.create({
						doc: embodiment.source.code,
						extensions: [
							// Read-only + un-colorized: editable off, readOnly on, and NO
							// `javascript()` / `oneDark` / `syntaxHighlighting` — plain
							// black-on-white; the anchor decoration carries the only color.
							EditorView.editable.of(false),
							EditorState.readOnly.of(true),
							anchorHitField,
							masteryField,
							EditorView.domEventHandlers({
								mousedown(event, clickedView) {
									const offset = clickedView.posAtCoords({
										x: event.clientX,
										y: event.clientY,
									});
									const token =
										offset === null
											? null
											: anchors.anchorAt(offset, classifiedReference.current);
									setPickedRange(
										token === null ? null : [token.start, token.end],
									);
									// Do not preventDefault on a read-only view.
									return false;
								},
							}),
						],
					}),
					parent: host,
				});
			}
			editorView.current = view ?? null;
			return function cleanup() {
				view?.destroy();
				editorView.current = null;
			};
		},
		// Keyed on the source string only. `classified` is read via
		// `classifiedReference` (updated every render) inside the handler — NEVER add
		// `classified` / `items` to this dep array, or the view destroys +
		// recreates on every re-derive (DOCS § Structural constraints / Memo
		// outputs read through refs).
		[embodiment.source.code],
	);

	// Sync the highlight: dispatch the picked range into the mounted view's
	// decoration field whenever the pick changes — no remount.
	useEffect(
		function syncAnchorHighlight() {
			editorView.current?.dispatch({ effects: setAnchorHit.of(pickedRange) });
		},
		[pickedRange],
	);

	// Clear the pick when the source changes so a stale range never drives the
	// panel/highlight against a different snippet (AR-4 inc-2 #3). Snippet change
	// is normally an unmount+remount per disposable practice (the preview keys on
	// the code), so this guards the rare in-place embodiment-swap; it also fires
	// once on mount — a no-op, since `pickedRange` is already null at init.
	// (Clearing pickedRange cascades into resetVerdictOnRepick below; no need to
	// clear the verdict here directly. The MasteryState reset joins it here —
	// `EMPTY_MASTERY` is a stable ref, so it is a no-op on mount.)
	useEffect(
		function clearPickOnSourceChange() {
			setPickedRange(null);
			setMastery(EMPTY_MASTERY);
		},
		[embodiment.source.code],
	);

	// Clear the verdict whenever the pick changes — a freshly picked anchor has
	// no answer yet (answering does NOT change pickedRange, so a verdict persists
	// for its own anchor). Also fires once on mount (no-op — verdict is null).
	useEffect(
		function resetVerdictOnRepick() {
			setVerdict(null);
		},
		[pickedRange],
	);

	// The render-ready decoration ranges for both channels, recomputed when the
	// mastery state changes (`items` is stable per mount). Dispatched into the
	// mounted view below — no remount (the field reads it through a `StateEffect`,
	// exactly like the picked-anchor highlight).
	const masteryDecos = useMemo(
		() => masteryDecorations(items, mastery),
		[items, mastery],
	);
	useEffect(
		function syncMasteryDecorations() {
			editorView.current?.dispatch({
				effects: setMasteryDecos.of(masteryDecos),
			});
		},
		[masteryDecos],
	);

	// The question for the picked anchor (one V1 item in Slice A; itemsAt returns
	// an array for later co-anchored forms → answer-neutral tabs).
	const question =
		pickedRange === null
			? null
			: (anchors.itemsAt(items, pickedRange)[0] ?? null);

	// Grade the picked answer, then fold the verdict into mastery. A function
	// declaration (a block-bodied arrow trips `arrow-body-style`); the functional
	// `setMastery` updater reads the latest state, never the closed-over `mastery`.
	function answer(item: McqQuizItem, optionId: string): void {
		const result = gradeOption(item, optionId);
		setVerdict(result);
		setMastery((prior) => quizCore.masteryFold(prior, item, result));
	}

	if (!embodiment.status.parsed) {
		return (
			<div data-lens="quiz">
				<div data-quiz-fallback role="alert">
					The quiz lens needs parseable code.
				</div>
			</div>
		);
	}

	return (
		<div data-lens="quiz">
			<main data-quiz-editor ref={editorContainer} />
			{question ? (
				<aside data-quiz-panel>
					<p>{question.prompt}</p>
					{question.options.map((option) => (
						<button
							key={option.id}
							type="button"
							data-quiz-option={option.id}
							onClick={() => answer(question, option.id)}
						>
							{option.text}
						</button>
					))}
					{verdict ? (
						<div data-quiz-verdict={verdict.status} aria-live="polite">
							{verdict.status === 'malformed'
								? verdict.reason
								: verdict.feedback}
						</div>
					) : null}
				</aside>
			) : null}
		</div>
	);
};

const quizLens: LensModule = freezeInPlace<LensModule>({
	name: 'quiz',
	Component: QuizComponent,
	config: quizCore.config,
	applicableTo: quizCore.applicableTo,
	recommend: quizCore.recommend,
	phase: 'source',
});

export default quizLens;
