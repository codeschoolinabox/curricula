/**
 * @file React wrapper for the `quiz` lens. Renders a read-only, un-colorized
 * CodeMirror editor over the snippet (the lens's own decorations, NOT syntax
 * highlighting, carry meaning); clicking a syntax element highlights that anchor
 * and opens a question panel. Co-anchored items render as **answer-neutral tabs**
 * (inc 6); the active tab's body grades against machine-derived ground truth and
 * the verdict is held **per item** (`VerdictsByItemId`), so switching tabs never
 * shows one question's verdict under another. A fallback notice renders when the
 * snippet did not parse. Owns all per-mount learner state (picked anchor, active
 * tab, per-item verdicts, mastery); never writes to the orchestrator's snippet
 * (single-writer invariant). Freezes + default-exports the `LensModule`.
 */

import { EditorState, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, ReactElement } from 'react';

import freezeInPlace from '@utils/freeze-in-place.js';

import type { ClassifiedToken } from '../../lib/classifying/types.js';
import type {
	CodeSurfaceQuizItem,
	McqQuizItem,
	QuizItem,
	SelectInCodeQuizItem,
} from '../../lib/quizzing/types.js';
import type { LensModule, LensProps as LensProperties } from '../types.js';

import quizCore from './core.js';
import anchors from './lib/anchors.js';
import buildQuiz from './lib/build-quiz.js';
import masteryDecorations from './lib/decorations.js';
import gradeOption from './lib/grade-option.js';
import gradeRanges from './lib/grade-ranges.js';
import toggleRange from './lib/pending.js';
import type {
	ActiveTab,
	MasteryDecos,
	MasteryState,
	PendingSelection,
	ProgressBucket,
	VerdictsByItemId,
} from './types.js';

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

// The answer-phase staged-selection highlight (inc 6c) — the fourth decoration
// axis. A `Decoration.mark` per staged range (`.cm-quiz-pending`, a box outline,
// never text-decoration), driven by a `StateEffect` dispatched from React when
// `pendingSelection` changes; the read-only doc never changes, so positions are
// stable and no `DecorationSet.map(changes)` is needed. Empty (so invisible) in
// anchor phase, since pending is cleared on every tab change.
const setPendingDecos = StateEffect.define<PendingSelection>();
const pendingMark = Decoration.mark({ class: 'cm-quiz-pending' });
const pendingField = StateField.define<DecorationSet>({
	create() {
		return Decoration.none;
	},
	update(decorations, transaction) {
		const effect = transaction.effects.find(
			(candidate): candidate is StateEffect<PendingSelection> =>
				candidate.is(setPendingDecos),
		);
		if (effect === undefined) return decorations;
		// `true` lets CodeMirror sort the staged ranges (source order not guaranteed).
		return Decoration.set(
			effect.value.map((range) => pendingMark.range(range[0], range[1])),
			true,
		);
	},
	provide: (field) => EditorView.decorations.from(field),
});

// The empty mastery state, hoisted as a stable frozen reference so the
// source-change reset is a referential no-op on mount (matches `core.ts`'s
// `EMPTY_RECOMMENDATIONS`).
const EMPTY_MASTERY = freezeInPlace<MasteryState>({});

// The empty per-item verdict map + the empty co-anchored bundle, hoisted as stable
// frozen references (the reset effects assign `EMPTY_VERDICTS` as a referential
// no-op on mount, like `EMPTY_MASTERY`; `EMPTY_BUNDLE` is the no-pick bundle).
const EMPTY_VERDICTS = freezeInPlace<VerdictsByItemId>({});
const EMPTY_BUNDLE = freezeInPlace<readonly QuizItem[]>([]);

// The empty pending selection, hoisted as a stable frozen reference (the
// [activeTab] reset assigns it as a referential no-op when already empty).
const EMPTY_PENDING = freezeInPlace<PendingSelection>([]);

// Whether an item is answered by a gesture in the read-only editor (a code
// surface) rather than the panel (mcq). The derived answer-phase flag is
// `armed = isCodeSurface(activeItem) && !activeVerdict` — a graded code-surface
// tab is disarmed (back in anchor phase).
function isCodeSurface(
	item: QuizItem | undefined,
): item is CodeSurfaceQuizItem | SelectInCodeQuizItem {
	return (
		item !== undefined &&
		(item.mode === 'click-token' ||
			item.mode === 'click-line' ||
			item.mode === 'select-in-code')
	);
}

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

	// The admitted quiz items (the mcq forms co-anchored across the snippet); the
	// panel resolves the picked range to its bundle via `itemsAt`. Mirrored into a
	// ref the `[pickedRange]` reset effect reads, so it never closes over a stale
	// `items` — the same discipline as `classifiedReference`. (Today `items` only
	// changes with the source, which also nulls `pickedRange` and short-circuits the
	// effect, so this is consistency + future-proofing more than a live hazard.)
	const items = model?.items ?? EMPTY_BUNDLE;
	const itemsReference = useRef<readonly QuizItem[]>(items);
	itemsReference.current = items;

	// Mirror refs the mount-time `mousedown` handler reads so it knows, every
	// render, whether the editor is armed (answer phase) and which item to grade —
	// without re-binding the handler (the CM-lens remount scar). `armedReference`
	// carries the DERIVED `armed` (which folds in `!activeVerdict`), so a graded
	// code-surface tab is correctly disarmed; both are assigned after the pick +
	// tab derivation below.
	const armedReference = useRef<boolean>(false);
	const activeItemReference = useRef<QuizItem | undefined>(undefined);

	// The picked anchor's range (per-mount UI state); null when nothing — or
	// whitespace — is selected. Drives the highlight decoration.
	const [pickedRange, setPickedRange] = useState<
		readonly [number, number] | null
	>(null);

	// Which co-anchored tab is active — an index into the picked bundle, or null
	// when no tab is armed. Reset to the mode-aware default (first mcq) on re-pick;
	// the lens's "never auto-arm" invariant lives in `anchors.defaultActiveTab`.
	const [activeTab, setActiveTab] = useState<ActiveTab>(null);

	// The per-item verdicts for the CURRENT pick — one `Verdict` per answered item
	// id. Replaces Slice A's single verdict: with co-anchored tabs a lone verdict
	// would render under the wrong tab on a switch. Cleared on re-pick / source
	// change; preserved across a tab switch (the within-pick isolation it exists for).
	const [verdictsByItemId, setVerdictsByItemId] =
		useState<VerdictsByItemId>(EMPTY_VERDICTS);

	// Per-group mastery accrued from graded answers (inc 5). Disposable practice:
	// reset on source change. Drives the two color-free decoration channels.
	const [mastery, setMastery] = useState<MasteryState>(EMPTY_MASTERY);

	// The ranges the learner has staged in answer phase (empty in anchor phase).
	// Single-slot for click-token (a click replaces); a toggle-set for
	// select-in-code (6c). Cleared on any tab change (the single-owner reset).
	const [pendingSelection, setPendingSelection] =
		useState<PendingSelection>(EMPTY_PENDING);

	// Resolve the picked anchor to its co-anchored bundle, then derive the active
	// item, its verdict, and the answer-phase `armed` flag. `activeItem` /
	// `activeVerdict` / `armed` are DERIVED, not stored: `activeVerdict` being
	// derived is why Slice A's `resetVerdictOnRepick` is gone, and `armed` being
	// derived is why there is no stored phase flag. For the one render after a
	// re-pick — before `resetTabOnRepick` settles the tab + clears verdicts — the
	// OLD `activeTab` indexes the NEW bundle: usually out-of-range (`undefined` →
	// anchor phase, blank panel), or, if the new bundle is long enough, the new
	// bundle's item there shows (and, only when re-picking the SAME token, its prior
	// verdict) for that single frame. Both settle next frame; do NOT "fix" this with
	// a clamp that would mask a real bug. The derivation lives ABOVE the effects so
	// `syncAnchorHighlight` can read `armed` (suppressing the anchor-hit in answer
	// phase); the mount handler reads `armed` / `activeItem` through the refs below.
	const bundle =
		pickedRange === null ? EMPTY_BUNDLE : anchors.itemsAt(items, pickedRange);
	const activeItem = activeTab === null ? undefined : bundle[activeTab];
	const activeVerdict =
		activeItem === undefined ? undefined : verdictsByItemId[activeItem.id];
	// The answer phase: the active tab is a code surface AND it has not been graded
	// yet (a verdict disarms — README § Interaction contract step 6). The handler
	// branches on `armed` (not the item's mode), so a graded code tab re-picks
	// rather than re-staging.
	const armed = isCodeSurface(activeItem) && activeVerdict === undefined;
	activeItemReference.current = activeItem;
	armedReference.current = armed;

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
							pendingField,
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
									if (armedReference.current) {
										// Answer phase: an in-token click STAGES the range —
										// click-token replaces (single slot); select-in-code toggles
										// (exact-equality membership). A null/whitespace click is a
										// no-op (it neither exits answer phase nor grades).
										if (token !== null) {
											const range: readonly [number, number] = [
												token.start,
												token.end,
											];
											const isToggle =
												activeItemReference.current?.mode === 'select-in-code';
											setPendingSelection((previous) =>
												isToggle ? toggleRange(previous, range) : [range],
											);
										}
									} else {
										// Anchor phase: the click re-picks (or clears on whitespace).
										setPickedRange(
											token === null ? null : [token.start, token.end],
										);
									}
									// The lens HANDLED this mousedown (a pick or a stage) — return
									// `true` to signal handled, so CodeMirror `preventDefault`s the
									// browser event and skips its built-in text-selection gesture (a
									// click on this read-only surface is a pick or an answer, never a
									// cursor move; `return false` lets that gesture run — and crashes
									// jsdom's layout-less `Range.getClientRects`).
									return true;
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
	// decoration field whenever the pick (or the phase) changes — no remount. The
	// anchor-hit background is SUPPRESSED in answer phase (dispatch null), so the
	// picked token and the staged tokens read on distinct axes (DOCS § Pending
	// selection is a fourth axis).
	useEffect(
		function syncAnchorHighlight() {
			editorView.current?.dispatch({
				effects: setAnchorHit.of(armed ? null : pickedRange),
			});
		},
		[pickedRange, armed],
	);

	// Clear the pick + the durable mastery + the per-item verdicts when the source
	// changes, so nothing stale drives the panel against a different snippet (AR-4
	// inc-2 #3). Snippet change is normally an unmount+remount per disposable
	// practice (the preview keys on the code), so this guards the rare in-place
	// embodiment-swap; it also fires once on mount — a no-op, since every target is
	// already its stable empty. `activeTab` is NOT reset here: nulling `pickedRange`
	// cascades into `resetTabOnRepick` below, which owns the `activeTab` reset (the
	// single-owner discipline — a second `setActiveTab` here would be a redundant
	// double-write).
	useEffect(
		function clearPickOnSourceChange() {
			setPickedRange(null);
			setMastery(EMPTY_MASTERY);
			setVerdictsByItemId(EMPTY_VERDICTS);
		},
		[embodiment.source.code],
	);

	// On every re-pick (a new anchor, or a clear to null), clear the pick's verdicts
	// and reset the active tab to the new bundle's mode-aware default (first mcq,
	// else null/unarmed). Reads `items` via `itemsReference` (not the closed-over
	// `items`), so the effect stays keyed on `[pickedRange]` alone without going
	// stale. Mastery persists (it is the durable cross-pick record). Replaces Slice
	// A's `resetVerdictOnRepick` — `activeVerdict` is now derived, not stored.
	useEffect(
		function resetTabOnRepick() {
			setVerdictsByItemId(EMPTY_VERDICTS);
			setActiveTab(
				pickedRange === null
					? null
					: anchors.defaultActiveTab(
							anchors.itemsAt(itemsReference.current, pickedRange),
						),
			);
		},
		[pickedRange],
	);

	// Clear the staged pending selection whenever the active tab changes — the
	// SINGLE owner of the pending reset. This covers tab-switch, re-pick (which
	// resets `activeTab` via `resetTabOnRepick`), and source-change (which cascades
	// through `pickedRange` → `activeTab`). A second `setPendingSelection` in those
	// effects would be the double-write the single-owner discipline forbids (mirrors
	// `activeTab`'s single reset owner).
	useEffect(
		function clearPendingOnTabChange() {
			setPendingSelection(EMPTY_PENDING);
		},
		[activeTab],
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

	// Sync the staged-selection highlight (the 4th axis): dispatch the pending
	// ranges into `pendingField` whenever they change — no remount, exactly like
	// the picked-anchor + mastery highlights above.
	useEffect(
		function syncPendingDecorations() {
			editorView.current?.dispatch({
				effects: setPendingDecos.of(pendingSelection),
			});
		},
		[pendingSelection],
	);

	// Grade the picked mcq answer into the per-item verdict map, then fold it into
	// mastery. Function declarations (a block-bodied arrow trips `arrow-body-style`);
	// both setters are functional updaters reading the latest state, never a
	// closed-over value. Re-answering overwrites this item's verdict (the buttons
	// stay live — the inc-5 behavior).
	function answer(item: McqQuizItem, optionId: string): void {
		const result = gradeOption(item, optionId);
		setVerdictsByItemId((prior) =>
			freezeInPlace({ ...prior, [item.id]: result }),
		);
		setMastery((prior) => quizCore.masteryFold(prior, item, result));
	}

	// Grade the staged code-surface answer into the per-item verdict map, then fold
	// it into mastery — the code-surface analogue of `answer`. The verdict makes
	// `armed` false (the `!activeVerdict` disarm), returning the editor to anchor
	// phase; pending is cleared by the tab-switch / re-pick of a retry. `confirm` and
	// `cancel` are React panel handlers (re-created each render), so they read the
	// latest `activeItem` / `pendingSelection` directly — unlike the mount-bound
	// `mousedown` handler, which must read refs. The `isCodeSurface` guard makes the
	// never-`malformed` invariant explicit + type-narrows: an mcq active tab is
	// anchor phase (its Confirm never renders), so `confirm` only ever grades a
	// code-surface item.
	function confirm(): void {
		if (activeItem === undefined || !isCodeSurface(activeItem)) return;
		const result = gradeRanges(activeItem, pendingSelection);
		setVerdictsByItemId((prior) =>
			freezeInPlace({ ...prior, [activeItem.id]: result }),
		);
		setMastery((prior) => quizCore.masteryFold(prior, activeItem, result));
	}

	// Leave answer phase without grading: reset to the bundle's default (first mcq)
	// tab, which makes `armed` false (anchor phase); the [activeTab] effect clears
	// pending. `defaultActiveTab` is non-null here — an armed bundle has a
	// co-anchored mcq (V1 co-anchors every token).
	function cancel(): void {
		setActiveTab(anchors.defaultActiveTab(bundle));
	}

	// The `mcq` arm: the prompt + one option button per choice. Extracted (B2) so
	// `item.options` is read only inside the `mode === 'mcq'`-narrowed scope —
	// outside a mode guard, JSX touches only `QuizItemBase` fields.
	function renderMcqTab(item: McqQuizItem): ReactElement {
		return (
			<>
				<p>{item.prompt}</p>
				{item.options.map((option) => (
					<button
						key={option.id}
						type="button"
						data-quiz-option={option.id}
						onClick={() => answer(item, option.id)}
					>
						{option.text}
					</button>
				))}
			</>
		);
	}

	// The code-surface arm (click-token + select-in-code): the prompt + the
	// answer-phase controls. Confirm grades the staged ranges (count-bearing so the
	// staged size is visible); Cancel returns to anchor phase. Both render only
	// while armed — after grading, the editor is disarmed and the shared verdict
	// region (below) stands alone. One renderer serves both code modes (they differ
	// only in how a click STAGES — DOCS § Why unify the code-surface substrate).
	function renderCodeSurfaceTab(
		item: CodeSurfaceQuizItem | SelectInCodeQuizItem,
	): ReactElement {
		return (
			<>
				<p>{item.prompt}</p>
				{armed ? (
					<>
						<button type="button" data-quiz-confirm onClick={confirm}>
							Confirm ({pendingSelection.length} selected)
						</button>
						<button type="button" data-quiz-cancel onClick={cancel}>
							Cancel
						</button>
					</>
				) : null}
			</>
		);
	}

	// The active tab's body, dispatched on its `item.mode` via an if-chain (mirrors
	// `grade.ts`) — each guard narrows the union before touching a mode-specific
	// field. All three admitted modes now have arms (`mcq`; the code surfaces
	// `click-token` / `click-line` / `select-in-code`), so the chain is exhaustive:
	// the trailing `const _never: never = activeItem` makes any unhandled mode a
	// COMPILE error (the mirror of `grade.ts`'s dispatch), replacing the 6a/6b
	// `return null` fallback.
	function renderActiveTab(): ReactElement | null {
		if (activeItem === undefined) return null;
		if (activeItem.mode === 'mcq') return renderMcqTab(activeItem);
		if (
			activeItem.mode === 'click-token' ||
			activeItem.mode === 'click-line' ||
			activeItem.mode === 'select-in-code'
		) {
			return renderCodeSurfaceTab(activeItem);
		}
		// Exhaustive — every admitted mode has an arm above (mcq + the three code
		// surfaces), so this is unreachable. The `never` assign on the discriminant
		// (`.mode` — asserting on the object doesn't reduce a member whose `mode` is a
		// union) is the compile-time guard: a new mode fails to compile here. The
		// throw surfaces the impossible loudly rather than rendering a bad value.
		const _never: never = activeItem.mode;
		throw new Error(`unhandled quiz item mode: ${String(_never)}`);
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
			<main
				data-quiz-editor
				data-quiz-phase={armed ? 'answer' : 'anchor'}
				ref={editorContainer}
			/>
			{activeItem ? (
				<aside data-quiz-panel>
					{/* Minimal ARIA tabs — role=tablist/tab + aria-selected is the a11y
					    floor; the fuller pattern (role=tabpanel + aria-controls + roving
					    tabindex) is deferred to 6b/6c, when the panel body gains
					    Confirm/cancel and a tabpanel landmark earns its keep. */}
					{bundle.length > 1 ? (
						<div data-quiz-tablist role="tablist">
							{bundle.map((item, index) => (
								<button
									key={item.id}
									type="button"
									role="tab"
									data-quiz-tab={item.id}
									aria-selected={activeTab === index ? 'true' : 'false'}
									onClick={() => setActiveTab(index)}
								>
									{index + 1}
								</button>
							))}
						</div>
					) : null}
					{renderActiveTab()}
					{activeVerdict ? (
						<div data-quiz-verdict={activeVerdict.status} aria-live="polite">
							{activeVerdict.status === 'malformed'
								? activeVerdict.reason
								: activeVerdict.feedback}
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
