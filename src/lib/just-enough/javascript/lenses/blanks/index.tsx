/**
 * @file React wrapper for the `blanks` lens. Default-exports the frozen
 * `LensModule` the orchestrator's lens registry consumes (post Inc 7).
 *
 * The wrapper composes the pure-TS core (`./core.ts`) + the vendored
 * lib modules (`./lib/blankenate.ts` etc.) into the blanks surface: a
 * `<div data-lens="blanks" data-view-mode="…" data-hints-level="…">`
 * root with toolbar, editor, editor header, hints panel, and Ask Me
 * button.
 *
 * **Current scope (Inc 6a + 6b + 6c + 6d):** wrapper mounts a
 * CodeMirror EditorView (6a), with a two-button view-mode toggle
 * (6b), editable in blankenated mode with noPasteExtension wired
 * (6c), and an aggregate score panel that updates per keystroke as
 * the learner fills blanks (6d). The root currently emits
 * `data-lens="blanks" data-view-mode={viewMode}`; `data-hints-level`
 * is deferred to Inc 6h when the hints panel + tier resolution land.
 * 6e–6j add the slider, content-type checkboxes, editor header, full
 * hints panel with per-blank visual feedback, URL config, and Ask Me.
 */

import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import { freezeInPlace } from '@utils/freeze.js';

import type { LensModule, LensProps as LensProperties } from '../types.js';

import blanksCore from './core.js';
import blankenate from './lib/blankenate.js';
import evaluateCorrectness from './lib/evaluate-correctness.js';
import noPasteExtension from './lib/no-paste-extension.js';
import type { BlankenateResult, ContentType, ViewMode } from './types.js';

import './blanks.css';

const ALL_CONTENT_TYPES: ReadonlyArray<ContentType> = [
	'keywords',
	'identifiers',
	'operators',
	'literals',
	'delimiters',
];

/**
 * Derives the boolean-map representation of contentTypes the
 * vendored `blankenate` expects, from the array-form `LensConfig`
 * field. Wrapper-internal — no exported type per DOCS § Structural
 * constraints.
 */
function deriveContentTypeFlags(
	contentTypes: ReadonlyArray<ContentType>,
): {
	keywords: boolean;
	identifiers: boolean;
	operators: boolean;
	literals: boolean;
	delimiters: boolean;
} {
	const set = new Set(contentTypes);
	return {
		keywords: set.has('keywords'),
		identifiers: set.has('identifiers'),
		operators: set.has('operators'),
		literals: set.has('literals'),
		delimiters: set.has('delimiters'),
	};
}

/**
 * Inc 6.5: lock non-placeholder regions.
 *
 * Builds two CodeMirror extensions for the blanks-editable surface:
 *
 * 1. A `StateField<DecorationSet>` holding one decoration mark per
 *    blank placeholder. Marks are `inclusive: true` so edits at the
 *    `from`/`to` boundary extend the range. CM auto-maps the
 *    decoration set through doc changes — typing inside a blank
 *    extends its range; deleting inside contracts it.
 *
 * 2. A `transactionFilter` that inspects each proposed change. If
 *    the change `[fromA, toA]` does NOT lie entirely within some
 *    blank's current range, the entire transaction is rejected.
 *    This means:
 *      - Inserts in the anchor (prefix / inter-blank / suffix) → REJECTED.
 *      - Inserts inside a __ → ACCEPTED, blank range extends.
 *      - Deletes inside a blank → ACCEPTED, range contracts.
 *      - Deletes crossing a blank boundary → REJECTED.
 *
 * The whitespace-fragility bug becomes architecturally unreachable:
 * the learner physically cannot edit the anchor segments.
 */
function buildLockExtensions(blankResult: BlankenateResult) {
	// Compute placeholder positions in blankedCode coordinates.
	// For blank i (sorted by start): placeholderStart_i = blank.start_i
	// - sum(prev_j: blank.original_j.length - 2).
	const sortedBlanks = [...blankResult.blanks].sort(
		(a, b) => a.start - b.start,
	);
	const positions: Array<{ from: number; to: number }> = [];
	let shift = 0;
	for (const blank of sortedBlanks) {
		const from = blank.start - shift;
		positions.push({ from, to: from + 2 }); // __ is 2 chars
		shift += blank.original.length - 2;
	}

	const blankMark = Decoration.mark({
		class: 'cm-blank-placeholder',
		inclusive: true,
	});

	const blanksField = StateField.define<DecorationSet>({
		create() {
			return Decoration.set(
				positions.map((p) => blankMark.range(p.from, p.to)),
			);
		},
		update(value, tr) {
			return value.map(tr.changes);
		},
		provide: (f) => EditorView.decorations.from(f),
	});

	const lockFilter = EditorState.transactionFilter.of((tr) => {
		if (!tr.docChanged) return tr;
		const ranges = tr.startState.field(blanksField, false);
		if (!ranges) return tr;
		let allowed = true;
		tr.changes.iterChanges((fromA, toA) => {
			let withinSome = false;
			ranges.between(fromA, toA, (decoFrom, decoTo) => {
				if (fromA >= decoFrom && toA <= decoTo) {
					withinSome = true;
					return false; // stop iteration
				}
				return undefined;
			});
			if (!withinSome) allowed = false;
		});
		return allowed ? tr : [];
	});

	return [blanksField, lockFilter];
}

const BlanksComponent: ComponentType<LensProperties> = function BlanksComponent({
	embodiment,
	config,
}) {
	// Memoize resolved config on the `config` prop (stable reference from
	// the orchestrator). Without this, `blanksCore.config()` produces a
	// fresh frozen clone on every render — including a fresh
	// `contentTypes` array — which would cascade into spurious
	// `blankenate` re-rolls whenever a parent re-renders (load-bearing
	// once Inc 6b adds local state to the wrapper).
	const resolved = useMemo(() => blanksCore.config(config), [config]);
	const initialDifficulty =
		typeof resolved.difficulty === 'number' ? resolved.difficulty : 50;
	// Inc 6e: difficulty is now LOCAL state, seeded from the prop config.
	// The slider mutates this directly; the blankenate useMemo deps now
	// include `difficulty` so the blank set re-derives per drag.
	const [difficulty, setDifficulty] = useState<number>(initialDifficulty);

	// Inc 6f: contentTypes is now LOCAL state, seeded from the prop
	// config (default = all five). The checkboxes mutate this directly;
	// the blankenate useMemo deps include `contentTypes` so the blank
	// set re-derives per toggle.
	//
	// Defensive: filter the prop-supplied array against ALL_CONTENT_TYPES
	// rather than casting blindly. An educator config with a typo (e.g.
	// `contentTypes: ['keywrds']`) degrades to the all-five default
	// element-by-element rather than silently breaking blankenate.
	const initialContentTypes: ReadonlyArray<ContentType> = Array.isArray(
		resolved.contentTypes,
	)
		? (resolved.contentTypes as ReadonlyArray<unknown>).filter(
				(t): t is ContentType =>
					(ALL_CONTENT_TYPES as ReadonlyArray<string>).includes(t as string),
			)
		: ALL_CONTENT_TYPES;
	const [contentTypes, setContentTypes] =
		useState<ReadonlyArray<ContentType>>(initialContentTypes);

	// View-mode state (Inc 6b). Seeded from config.viewMode (default
	// 'blankenated' via blanksCore.config). The toggle preserves the
	// learner's in-progress edits across mode swaps (AR-1 lock —
	// disposable-practice governs unmount, not within-mount toggle).
	const initialViewMode: ViewMode =
		resolved.viewMode === 'complete' ? 'complete' : 'blankenated';
	const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);

	// Learner edits state (Inc 6c). null = no edits yet → editor uses
	// blankedCode on first mount. Once the learner types, the
	// updateListener captures the current doc into learnerCode; later
	// toggles back to blankenated re-mount with learnerCode (not the
	// original blankedCode) so in-progress work is preserved.
	const [learnerCode, setLearnerCode] = useState<string | null>(null);
	// Ref mirror of learnerCode — read by the EditorView-mount effect at
	// mount-time. The effect MUST NOT have learnerCode in its dep array
	// (would feedback-loop: keystroke → setLearnerCode → re-render →
	// effect re-fires → view.destroy → lost focus → "feels read-only").
	const learnerCodeRef = useRef<string | null>(learnerCode);
	learnerCodeRef.current = learnerCode;

	// Memoize the blankenate call on (source, resolved). `resolved` is
	// itself memoized on `config`, so the dep chain is stable when the
	// orchestrator keeps the prop stable. Per DOCS § Phase 2: synchronous
	// during first render — no flicker between an empty editor and a
	// __-filled re-render.
	const blankResult = useMemo(
		() =>
			blankenate(
				embodiment.source.code,
				difficulty / 100,
				deriveContentTypeFlags(contentTypes),
			),
		// Inc 6e/6f: difficulty + contentTypes are LOCAL state, so each
		// is an independent signal for re-derivation. blankResult identity
		// changes on slider drag (6e) or checkbox toggle (6f) → the
		// mountEditorView effect remounts the editor with the new
		// blankedCode. The change handlers (handleDifficultyChange /
		// handleContentTypeToggle) also reset learnerCode per DOCS § Phase 2:
		// "Re-derivation on settings change resets the correctness map."
		[embodiment.source.code, difficulty, contentTypes],
	);

	// Defense-in-depth: in production `applicableTo` gates on
	// `status.parsed`, so unparseable embodiments never reach the wrapper.
	// If one does (e.g. the picker bypasses the recommender), render the
	// fallback panel. We gate on `embodiment.status.parsed` directly
	// (canonical signal) rather than on `blankResult === null` because
	// some embody failure modes (e.g. validate-stage failures) carry
	// parseable source strings, where Acorn-inside-blankenate succeeds
	// but the embodiment is still marked unparsed.
	const showFallback = !embodiment.status.parsed || blankResult === null;

	const editorContainer = useRef<HTMLDivElement | null>(null);
	const editorView = useRef<EditorView | null>(null);

	// Inc 6e: difficulty change handler. Updates local difficulty AND
	// resets learnerCode so the new (different) blank positions start
	// from a clean slate. Per DOCS § Phase 2: "Re-derivation on settings
	// change resets the correctness map" — the wrapper does NOT preserve
	// correctness across re-rolls because the old learner answers no
	// longer correspond to new blank positions.
	function handleDifficultyChange(
		event: React.ChangeEvent<HTMLInputElement>,
	): void {
		const next = Number(event.target.value);
		setDifficulty(next);
		setLearnerCode(null);
	}

	// Inc 6f: toggle a content-type category in/out of the eligible set.
	// Same reset-learnerCode logic as the slider — the new blank set has
	// different positions, so the old typed text no longer aligns.
	function handleContentTypeToggle(type: ContentType): void {
		setContentTypes((current) =>
			current.includes(type)
				? current.filter((t) => t !== type)
				: [...current, type],
		);
		setLearnerCode(null);
	}

	// Inc 6d: per-blank correctness wiring + aggregate score display.
	// evaluateCorrectness is pure; recomputes on learnerCode change
	// (typing dispatches setLearnerCode) and on blankResult change
	// (snippet / future-difficulty / future-content-types).
	const evaluation = useMemo(() => {
		if (blankResult === null) {
			return { score: 100, total: 0, correct: 0, incorrect: 0, unfilled: 0 };
		}
		// The doc the learner is editing — learnerCode if they typed,
		// blankedCode otherwise. evaluateCorrectness compares against
		// blank.original at each anchor position.
		const currentDoc = learnerCode ?? blankResult.blankedCode;
		const result = evaluateCorrectness(
			currentDoc,
			blankResult.blanks,
			blankResult.originalCode,
		);
		return {
			score: result.score,
			total: result.total,
			correct: result.correct,
			incorrect: result.incorrect,
			unfilled: result.unfilled,
		};
	}, [learnerCode, blankResult]);

	// Mount the CodeMirror EditorView. Destroy + recreate on STRUCTURAL
	// changes only: viewMode flips, or blankResult re-derives (source /
	// difficulty / contentTypes change). Per-keystroke `learnerCode`
	// updates flow through the updateListener into React state but MUST
	// NOT re-fire this effect — that would feedback-loop and destroy
	// the EditorView mid-typing.
	//
	// Inc 6c:
	//   - blankenated mode → editable, noPasteExtension wired,
	//     updateListener captures learner edits into learnerCode state.
	//   - complete mode → read-only, no paste extension, no listener
	//     reaction to docChanged.
	useEffect(
		function mountEditorView() {
			const host = editorContainer.current;
			if (!host) return;

			const isBlankenated = viewMode === 'blankenated';

			// Derive the initial document INSIDE the effect closure so
			// learnerCode is read from the ref (not state-as-dep). Toggle
			// back to blankenated picks up the latest in-progress edits;
			// fresh mount with no edits uses blankedCode.
			const initialDoc =
				blankResult === null
					? embodiment.source.code
					: isBlankenated
						? (learnerCodeRef.current ?? blankResult.blankedCode)
						: blankResult.originalCode;

			const updateListener = EditorView.updateListener.of(function onUpdate(
				update,
			) {
				if (!update.docChanged) return;
				if (!isBlankenated) return;
				// Mirror the learner's edit into local state. The wrapper's
				// updateListener NEVER calls the orchestrator's snippet setter
				// per the single-writer invariant (DOCS § Structural constraints
				// "CodeMirror writes to local state, never to setSnippet").
				setLearnerCode(update.state.doc.toString());
			});

			const state = EditorState.create({
				doc: initialDoc,
				extensions: [
					basicSetup,
					javascript(),
					oneDark,
					EditorView.editable.of(isBlankenated),
					EditorState.readOnly.of(!isBlankenated),
					updateListener,
					...(isBlankenated ? [noPasteExtension()] : []),
					// Inc 6.5: lock non-placeholder regions. Only when in
					// blankenated mode AND we have a blankResult (defense-
					// in-depth fallback path doesn't render the editor).
					...(isBlankenated && blankResult !== null
						? buildLockExtensions(blankResult)
						: []),
				],
			});
			const view = new EditorView({ state, parent: host });
			editorView.current = view;

			return function cleanup() {
				view.destroy();
				editorView.current = null;
			};
		},
		// Intentionally minimal deps: structural remounts only.
		// learnerCode is read via ref above; including it here would
		// recreate the regression bug fixed in Inc 6c.
		// embodiment.source.code is captured via blankResult (memoized on
		// embodiment.source.code + resolved); including it here directly
		// would just duplicate the blankResult-driven remount path.
		[viewMode, blankResult],
	);

	// Render: on null blankResult (defense-in-depth) render ONLY the
	// fallback panel, not toolbar + editor. README § Edge cases says
	// the wrapper renders the fallback "rather than the editor."
	return (
		<div data-lens="blanks" data-view-mode={viewMode}>
			{showFallback ? (
				<div
					data-blanks-fallback="parse-fail"
					role="alert"
					style={{ padding: '0.5rem', color: '#c33' }}
				>
					Snippet did not parse — the blanks lens requires a parseable
					source (defense-in-depth; applicableTo should have prevented
					mount).
				</div>
			) : (
				<>
					<div data-blanks-toolbar role="toolbar">
						<button
							type="button"
							data-view-toggle="blankenated"
							aria-pressed={viewMode === 'blankenated' ? 'true' : 'false'}
							onClick={() => setViewMode('blankenated')}
						>
							📝 Blankenated Code
						</button>
						<button
							type="button"
							data-view-toggle="complete"
							aria-pressed={viewMode === 'complete' ? 'true' : 'false'}
							onClick={() => setViewMode('complete')}
						>
							📖 Complete Code
						</button>
						<label data-difficulty-control>
							Difficulty: {difficulty}%
							<input
								type="range"
								min="0"
								max="100"
								value={difficulty}
								onChange={handleDifficultyChange}
								data-difficulty-slider
								aria-label="Blanks difficulty (0 to 100)"
							/>
						</label>
						<fieldset data-content-types>
							<legend>Eligible token categories</legend>
							{ALL_CONTENT_TYPES.map((type) => (
								<label key={type}>
									<input
										type="checkbox"
										checked={contentTypes.includes(type)}
										onChange={() => handleContentTypeToggle(type)}
										data-content-type={type}
									/>
									{type}
								</label>
							))}
						</fieldset>
					</div>
					<div ref={editorContainer} data-blanks-editor-host />
					<div
						data-blanks-score={String(evaluation.score)}
						data-blanks-total={String(evaluation.total)}
						data-blanks-correct={String(evaluation.correct)}
						aria-live="polite"
						style={{
							padding: '0.5rem 0',
							fontFamily: 'system-ui, sans-serif',
							fontSize: '0.9rem',
						}}
					>
						Score: {evaluation.score}%
						{evaluation.total > 0 && (
							<>
								{' '}
								({evaluation.correct} / {evaluation.total} blanks)
							</>
						)}
					</div>
				</>
			)}
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
