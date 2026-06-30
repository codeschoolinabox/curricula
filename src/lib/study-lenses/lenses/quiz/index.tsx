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
import type { McqQuizItem, QuizItem } from '../../lib/quizzing/types.js';
import type { LensModule, LensProps as LensProperties } from '../types.js';

import quizCore from './core.js';
import anchors from './lib/anchors.js';
import buildQuiz from './lib/build-quiz.js';
import masteryDecorations from './lib/decorations.js';
import gradeOption from './lib/grade-option.js';
import type {
	ActiveTab,
	MasteryDecos,
	MasteryState,
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

// The empty mastery state, hoisted as a stable frozen reference so the
// source-change reset is a referential no-op on mount (matches `core.ts`'s
// `EMPTY_RECOMMENDATIONS`).
const EMPTY_MASTERY = freezeInPlace<MasteryState>({});

// The empty per-item verdict map + the empty co-anchored bundle, hoisted as stable
// frozen references (the reset effects assign `EMPTY_VERDICTS` as a referential
// no-op on mount, like `EMPTY_MASTERY`; `EMPTY_BUNDLE` is the no-pick bundle).
const EMPTY_VERDICTS = freezeInPlace<VerdictsByItemId>({});
const EMPTY_BUNDLE = freezeInPlace<readonly QuizItem[]>([]);

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
									// The lens HANDLED this mousedown as an anchor pick — return
									// `true` to signal handled, so CodeMirror then `preventDefault`s
									// the browser event and skips its own built-in text-selection
									// gesture (a click on this read-only surface is a pick, never a
									// cursor/selection move; `return false` lets that gesture run —
									// and crashes jsdom's layout-less `Range.getClientRects`).
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
	// decoration field whenever the pick changes — no remount.
	useEffect(
		function syncAnchorHighlight() {
			editorView.current?.dispatch({ effects: setAnchorHit.of(pickedRange) });
		},
		[pickedRange],
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

	// Resolve the picked anchor to its co-anchored bundle, then derive the active
	// item + its verdict. `activeItem` / `activeVerdict` are DERIVED, not stored:
	// `activeVerdict` being derived is exactly why Slice A's `resetVerdictOnRepick`
	// is gone. For the one render after a re-pick — before `resetTabOnRepick` settles
	// the tab + clears verdicts — the OLD `activeTab` indexes the NEW bundle: usually
	// out-of-range (`undefined` → anchor phase, blank panel), or, if the new bundle is
	// long enough, the new bundle's item there shows (and, only when re-picking the
	// SAME token, its prior verdict) for that single frame. Both settle next frame; do
	// NOT "fix" this with a clamp that would mask a real bug.
	const bundle =
		pickedRange === null ? EMPTY_BUNDLE : anchors.itemsAt(items, pickedRange);
	const activeItem = activeTab === null ? undefined : bundle[activeTab];
	const activeVerdict =
		activeItem === undefined ? undefined : verdictsByItemId[activeItem.id];

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

	// The active tab's body, dispatched on its `item.mode` via an if-chain (mirrors
	// `grade.ts`) — each guard narrows the union before touching a mode-specific
	// field. 6a renders only the `mcq` arm; the code-surface arms (and the
	// `const _never: never` exhaustiveness assert) land in 6b/6c, so the chain ends
	// in a `return null` fallback (unreachable — the build filter admits only mcq).
	function renderActiveTab(): ReactElement | null {
		if (activeItem === undefined) return null;
		if (activeItem.mode === 'mcq') return renderMcqTab(activeItem);
		return null;
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
