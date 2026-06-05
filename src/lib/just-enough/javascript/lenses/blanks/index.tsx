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
import type { ChangeSpec, Text } from '@codemirror/state';
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

/* Inc 6.5 historical: lock non-placeholder regions via StateField +
 * transactionFilter. Inc 6.6 added per-blank visual border via the
 * `cm-blank-placeholder` decoration class. Both superseded by Inc 6.7
 * (see JSDoc immediately below). */
/**
 * Inc 6.7: replaces Inc 6.5's static lock + static `cm-blank-placeholder`
 * decoration with the fixed-width fillable-field UX:
 *
 * 1. **Length-matched positions** (sub-change A in `lib/blankenate.ts`).
 *    Each blank's `[start, end)` in the source now matches its
 *    `[from, to)` in the editor doc (no shift). Positions captured at
 *    mount; never change because auto-pad preserves width.
 *
 * 2. **Overwrite-mode transactionFilter** (sub-change B). Each
 *    insert/delete inside a blank is rewritten as a single-change
 *    overwrite — width preservation is structural (N→N chars per
 *    rewrite), no trailing-underscore counting needed:
 *    - Insert of N chars at P inside `[A, B)`: rewrite as
 *      `{from: P, to: P + N, insert: insertText}` (OVERWRITES the
 *      next N chars). Containment guard: `fromA >= p.from && fromA
 *      + N <= p.to` — typing past the blank end is rejected.
 *      Cursor → `P + N`.
 *    - Delete of N chars in `[fromA, toA)`: rewrite as
 *      `{from: fromA, to: toA, insert: '_'.repeat(N)}` (replaces
 *      with `_`s, preserving width). Cursor → `fromA`. Note this
 *      means backspace on a `_` is a no-op (replaces `_` with `_`).
 *    - Replace (selection + type, both insertLen and deleteLen > 0):
 *      explicit reject for v1.
 *    - Out-of-blank changes: reject (anchor chars are immutable).
 *
 * 3. **Correctness-aware decoration class** (sub-change C). The
 *    StateField rebuilds the DecorationSet per docChanged, deriving
 *    each blank's class from its current content vs `blank.original`:
 *    - `cm-blank-correct`: content === original
 *    - `cm-blank-incorrect`: no `_` AND content !== original
 *    - `cm-blank-unfilled`: any `_` remaining
 *
 * The wrapper's `evaluateCorrectness` useMemo still computes the
 * aggregate score for the side panel (unchanged). The StateField
 * derives per-blank visual class independently — CM6-native, no
 * React→CM6 effect plumbing for decoration updates.
 */
function buildLockExtensions(blankResult: BlankenateResult) {
	// Inc 6.7 length-matched: doc positions === source positions
	// because the placeholder is `_`.repeat(blank.original.length).
	// Captured once at mount; auto-pad preserves blank widths so these
	// positions never shift.
	const sortedBlanks = [...blankResult.blanks].sort(
		(a, b) => a.start - b.start,
	);
	const positions = sortedBlanks.map((blank) => ({
		from: blank.start,
		to: blank.end,
		original: blank.original,
	}));

	function deriveClass(content: string, original: string): string {
		if (content === original) return 'cm-blank-correct';
		if (content.includes('_')) return 'cm-blank-unfilled';
		return 'cm-blank-incorrect';
	}

	function buildDecorationSet(doc: Text): DecorationSet {
		// Zero-width blanks (`original === ''`) are not pedagogically
		// meaningful — they have no characters to fill. Skip them at
		// decoration-set construction so the StateField never has to
		// reason about empty ranges (which the autoPad rejection at
		// "trailing underscores < insertLen" would silently confuse for
		// a "blank is full" state). AR-4 Inc 6.7 guard.
		return Decoration.set(
			positions
				.filter(({ from, to }) => to > from)
				.map(({ from, to, original }) => {
					const content = doc.sliceString(from, to);
					const cls = deriveClass(content, original);
					return Decoration.mark({ class: cls }).range(from, to);
				}),
			true,
		);
	}

	const blanksField = StateField.define<DecorationSet>({
		create(state) {
			return buildDecorationSet(state.doc);
		},
		// Performance note (AR-4 Inc 6.7): rebuilds the entire
		// DecorationSet from scratch on every docChanged transaction —
		// O(N) per keystroke where N = blanks count. Fine at typical
		// snippet sizes (5–20 blanks). At 100+ blanks per snippet the
		// per-keystroke cost becomes measurable. Optimization path
		// (when needed): consult `tr.changes.touchesRange(p.from, p.to)`
		// per blank, reclassify only the touched blank(s), and call
		// `value.map(tr.changes)` for the rest. Positions are stable
		// (auto-pad preserves width), so position-mapping is identity.
		update(value, tr) {
			if (!tr.docChanged) return value;
			return buildDecorationSet(tr.newDoc);
		},
		provide: (f) => EditorView.decorations.from(f),
	});

	// Multi-cursor caveat (AR-4 Inc 6.7): `iterChanges` may fire multiple
	// times for one transaction (multi-cursor + simultaneous edit, or
	// programmatic multi-change dispatch). `primarySelection` is
	// overwritten by each iteration — only one cursor is returned even
	// if two blanks were filled. In practice CM6 multi-cursor is
	// uncommon for this use case (learners type single-char inserts via
	// keyboard, and noPasteExtension blocks bulk paste), so the
	// limitation is low risk. Worth surfacing if multi-cursor support
	// is ever explicitly added.
	//
	// Inc 6.7 overwrite mode (user-directed UX refinement): each blank
	// behaves as a fixed-width "form field". Typing at any position
	// inside a blank OVERWRITES the char there (whether it's `_` or a
	// previously-typed char). Backspace replaces the char-before-cursor
	// with `_`. Delete-forward replaces the char-at-cursor with `_`.
	// Width is preserved by construction (each rewrite is N→N chars,
	// never net-zero-length-shift required). Replaces typing-as-consume-
	// trailing-underscore from the earlier Inc 6.7 design.
	const lockFilter = EditorState.transactionFilter.of((tr) => {
		if (!tr.docChanged) return tr;

		const newChanges: ChangeSpec[] = [];
		let allowed = true;
		let primarySelection: number | undefined;

		tr.changes.iterChanges(
			(fromA: number, toA: number, _fromB: number, _toB: number, inserted: Text) => {
				const insertText = inserted.toString();
				const insertLen = insertText.length;
				const deleteLen = toA - fromA;

				// Defensive (AR-4 Inc 6.7 MINOR 4): a zero-width no-op
				// change (insertLen === 0 && deleteLen === 0) would
				// produce a spurious cursor-set transaction. CM6
				// usually prunes these before calling the filter, but
				// IME and programmatic dispatches may not. Skip them.
				if (insertLen === 0 && deleteLen === 0) return;

				if (insertLen > 0 && deleteLen === 0) {
					// Pure insert → overwrite the next `insertLen` chars
					// starting at `fromA`. The OVERWRITE range
					// `[fromA, fromA + insertLen)` must fit entirely
					// inside a blank — typing past the blank end is
					// rejected (would corrupt anchor text).
					const overwriteEnd = fromA + insertLen;
					const blank = positions.find(
						(p) => fromA >= p.from && overwriteEnd <= p.to,
					);
					if (!blank) {
						allowed = false;
						return;
					}
					newChanges.push({
						from: fromA,
						to: overwriteEnd,
						insert: insertText,
					});
					primarySelection = overwriteEnd;
				} else if (insertLen === 0 && deleteLen > 0) {
					// Pure delete → preserve blank width. The DELETE range
					// `[fromA, toA)` must fit entirely inside a blank.
					const blank = positions.find(
						(p) => fromA >= p.from && toA <= p.to,
					);
					if (!blank) {
						allowed = false;
						return;
					}

					// Inc 6.7 directional compaction for deleting `_`s:
					// when the deleted range is a single `_`, the
					// deletion compacts typed chars in the direction
					// opposite to the freed space. The direction is
					// derived from the cursor position BEFORE the delete:
					//
					//   - cursor === toA → backspace (cursor was AFTER
					//     the deleted char). Chars right of the `_`
					//     shift left; new `_` pads at blank.to (end).
					//     Cursor → fromA (standard backspace move).
					//
					//   - cursor === fromA → Del (cursor was AT the
					//     deleted char). Chars left of the `_` shift
					//     right; new `_` pads at blank.from (front).
					//     Cursor → fromA + 1 (matches the rightward
					//     shift of left-side text).
					//
					// Single-char-only: multi-char range deletes (e.g.
					// programmatic) fall back to the in-place `_`
					// replacement (no compaction) for simplicity.
					const deletedContent = tr.startState.doc.sliceString(
						fromA,
						toA,
					);
					if (deleteLen === 1 && deletedContent === '_') {
						const cursorBefore = tr.startState.selection.main.head;
						if (cursorBefore === toA) {
							// Backspace on `_`: shift right-text left, pad at end.
							newChanges.push({ from: fromA, to: toA });
							newChanges.push({ from: blank.to, insert: '_' });
							primarySelection = fromA;
						} else if (cursorBefore === fromA) {
							// Del on `_`: shift left-text right, pad at front.
							newChanges.push({ from: fromA, to: toA });
							newChanges.push({ from: blank.from, insert: '_' });
							primarySelection = fromA + 1;
						} else {
							// Cursor neither at fromA nor toA (programmatic
							// or unusual): fall through to in-place replace.
							newChanges.push({
								from: fromA,
								to: toA,
								insert: '_',
							});
							primarySelection = fromA;
						}
					} else {
						// Multi-char delete OR deleted content includes
						// typed chars: in-place replace with `_`s.
						newChanges.push({
							from: fromA,
							to: toA,
							insert: '_'.repeat(deleteLen),
						});
						primarySelection = fromA;
					}
				} else {
					// Replace (selection + type) — explicit reject for v1.
					// Could be supported by combining the overwrite logic
					// above with a length-mismatch guard, but defer.
					allowed = false;
				}
			},
		);

		if (!allowed) return [];

		return {
			changes: newChanges,
			selection:
				primarySelection === undefined
					? undefined
					: { anchor: primarySelection },
		};
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
					<div
						data-blanks-editor-header
						data-header-mode={viewMode}
						data-header-difficulty={String(difficulty)}
						data-header-blanks-total={String(evaluation.total)}
						data-header-blanks-remaining={String(evaluation.unfilled)}
						aria-live="polite"
					>
						Mode: <strong>{viewMode}</strong> · Difficulty: {difficulty}%
						{' · '}Blanks: {evaluation.total} · Remaining: {evaluation.unfilled}
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
