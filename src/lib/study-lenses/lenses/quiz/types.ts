/**
 * @file Domain model for the `quiz` lens — a click-an-element,
 * answer-a-question, get-graded study surface. The lens consumes two pure
 * peers: `lib/classifying` (`classifyTokens` → the clickable anchor set)
 * and `lib/quizzing` (`generateQuiz` → the questions; `grade` → the
 * verdict). It re-implements neither; this file declares only the lens's
 * own types — the config surface, the two-channel mastery contract
 * (the per-group state, the fold that accrues it, and the color-free
 * decoration channels that render it), and the panel / answer-phase state
 * inc 6 adds (the active tab, the per-item verdicts, and the staged
 * code-answer selection).
 *
 * Two layers (per the lenses peer's two-layer module convention):
 * - The pure-TS core (`./core.ts` + `./lib/build-quiz.ts` +
 *   `./lib/anchors.ts` + `./lib/grade-ranges.ts`) produces the `LensModule`
 *   defaults, the `{ classified, items }` quiz model (parse → classify →
 *   generate → `item.mode` filter), and the pure anchor / item resolution
 *   (`anchorAt` / `itemsAt`).
 * - The React wrapper (`./index.tsx`) mounts the read-only, un-colorized
 *   CodeMirror editor, captures clicks, owns the per-mount UI state (picked
 *   anchor, active tab, per-item verdicts, pending selection, mastery), and
 *   renders the answer-neutral tabs + panel.
 *
 * @remarks The lens does NOT mutate `embodiment` (deep-frozen per the
 * `embody/` contract) or `config`. The picked anchor, the learner's
 * selection, and the verdict exist only in per-mount React state — no
 * `localStorage`, no module-level cache, no refs across mounts, no URL
 * persistence. See `../README.md` § Disposable practice.
 *
 * @remarks `LensConfig` (from `../types.ts`) is the wrapper's prop type
 * for `config`; the lens reads only the known fields and ignores the
 * rest. Per-lens narrowing is captured in `QuizLensConfig` below — it
 * documents the known fields but does NOT exclude unknown ones (config is
 * open-shape at the contract boundary). Every documented field is
 * `SerializableValue`-compliant (primitives or `ReadonlyArray<primitive>`)
 * — nested objects are forbidden by `LensConfig`'s contract per
 * `../types.ts` JSDoc on `SerializablePrimitive`.
 *
 * @remarks Mastery scope. The two-channel mastery encoding
 * (`GroupMastery` / `MasteryState`) and the fold's signature
 * (`MasteryFold`) are declared here in Phase 0 so the full contract is
 * captured, but Slice A does **not** implement the fold — it shows the
 * per-answer `Verdict` only. The fold and the decorations are inc 5
 * (Slice B). See `./README.md` § Glossary (Mastery — two channels).
 */

import type { QuizItem, Verdict } from '../../lib/quizzing/types.js';

// ─── Config surface ─────────────────────────────────────────

/**
 * Per-lens narrowing of `LensConfig` (`../types.ts`) — documents the
 * fields the `quiz` lens reads, all optional. Does NOT exclude unknown
 * fields (config is open-shape at the contract boundary); the wrapper
 * reads the known fields and preserves the rest verbatim.
 *
 * @remarks Slice A reads **no required knobs** — the V1 category-ID form
 * has no parameters (the five categories and the prompt are fixed). The
 * config surface widens with the catalog: the natural first knob is a
 * `categories` allow-list (which token categories stay clickable),
 * encoded as a flat `ReadonlyArray<string>` to comply with
 * `SerializableValue` (e.g. `categories: ['identifier', 'keyword']`) —
 * never a nested object. That knob lands with the config-filtering
 * increment (it maps to the upstream `QuizFilter`); it is declared here as
 * documentation of the intended shape, not consumed in Slice A.
 */
type QuizLensConfig = Readonly<{
	categories?: ReadonlyArray<string>;
}>;

// ─── Mastery (two-channel; state + fold) ────────────────────

/**
 * Per-group mastery state — **two orthogonal, color-free channels** so a
 * learner with color-vision deficiency reads both on independent visual
 * axes (a hue pairing like red/green would collapse them):
 *
 * - `progress` — channel 1: a monotonic-up accrual of how much of this
 *   group is mastered. Rendered as a non-hue cue (e.g. underline density /
 *   fill). The **range/intent is pinned here** (0 = untouched, rising with
 *   correct answers; earned propagation bulk-credits it); the accrual
 *   **curve is 0..1** — ruled at the Phase-0 human gate (over a
 *   consecutive-correct counter or a threshold-to-unlock); inc 5's fold
 *   implements the 0..1 accrual.
 * - `wrong` — channel 2: an outstanding "answered incorrectly, not yet
 *   re-mastered" mark. Toggles `true` on an `incorrect` verdict, clears on
 *   re-mastery. Rendered on an axis independent of `progress` (e.g. a
 *   marker / badge), never penalized by a `malformed` verdict (a UI bug,
 *   not a wrong learner).
 *
 * @remarks Declared in Phase 0; the fold that populates it is inc 5
 * (Slice B), not Slice A.
 */
type GroupMastery = Readonly<{
	progress: number;
	wrong: boolean;
}>;

/**
 * The lens's mastery accumulator — one `GroupMastery` per `groupKey` (the
 * propagation axis carried on every `QuizItem`: `category:<category>` /
 * `binding:…` / `usage:…`). Keyed on `groupKey`, NOT item id, because
 * mastery propagates across every item sharing a group — that is what
 * `groupKey` / `unlocks` are for.
 *
 * @remarks Per-mount React state (disposable practice); empty at mount.
 * Slice A does not populate it.
 */
type MasteryState = Readonly<Record<string, GroupMastery>>;

/**
 * The mastery fold — folds one graded interaction into the mastery state,
 * keyed by `item.groupKey`. Implemented by `quizCore.masteryFold`
 * (`./core.ts`, inc 5); the wrapper folds each graded `Verdict` into the
 * per-mount `MasteryState`, which then drives the decoration channels below.
 *
 * @remarks A `malformed` verdict is a no-op (returns `prior` unchanged) —
 * mastery is never moved by a caller / UI bug. A `correct` verdict raises
 * `progress` (and, for sameness forms, propagation bulk-credits the
 * `groupKey`s named by `item.unlocks`); an `incorrect` verdict sets
 * `wrong`.
 */
type MasteryFold = (
	prior: MasteryState,
	item: QuizItem,
	verdict: Verdict,
) => MasteryState;

// ─── Mastery decorations (the two color-free render channels) ─

/**
 * The progress channel's density level for one group — channel 1 rendered as
 * underline density (dotted → dashed → solid → thick), NOT hue. The four
 * buckets map 1:1 onto the four reachable non-zero `progress` values under the
 * `MASTERY_STEP` (`0.25`) grid (`0.25 → 1` … `1 → 4`), so the encoding is
 * lossless: every distinct mastery level reads as a distinct underline.
 */
type ProgressBucket = 1 | 2 | 3 | 4;

/**
 * The render-ready decoration ranges for one mount, derived from the quiz items
 * and the current `MasteryState` by `./lib/decorations.ts` (`masteryDecorations`).
 * Two independent, color-free channels so a learner with color-vision deficiency
 * reads both on separate visual axes:
 *
 * - `progress` — channel 1: one entry per same-group token with `progress > 0`,
 *   carrying the token `range` and its density `bucket` (the underline).
 * - `wrong` — channel 2: the `range` of every same-group token whose group is
 *   flagged `wrong` (an independent non-hue mark, e.g. an overline).
 *
 * Both lists carry one entry **per token** (not per group), so mastery earned on
 * one element paints every element sharing its `groupKey`. The wrapper hands this
 * to a CodeMirror `StateField` via a `StateEffect`; `./index.tsx` owns that glue.
 */
type MasteryDecos = Readonly<{
	progress: ReadonlyArray<
		Readonly<{ range: readonly [number, number]; bucket: ProgressBucket }>
	>;
	wrong: ReadonlyArray<readonly [number, number]>;
}>;

// ─── Panel / answer-phase state (inc 6) ─────────────────────

/**
 * Which co-anchored tab is active in the panel — an index into the array
 * `itemsAt` returns for the picked range, or `null` when no tab is armed.
 *
 * @remarks The default is the **first `mcq` item** in the bundle (V1 co-anchors
 * every token, so one always exists — see `./README.md` § Form scoping); a
 * bundle with no `mcq` item resolves to `null` (anchor phase). This mode-aware
 * default is what keeps the editor from ever **auto-arming**: entering the answer
 * phase is always an explicit tab selection, never a side effect of
 * `generateQuiz`'s emission order. Per-mount React state; resets to its default
 * on re-pick / source change.
 */
type ActiveTab = number | null;

/**
 * The per-item verdict map — one `Verdict` per answered `QuizItem.id`, for the
 * **current pick**. Replaces Slice A's single `verdict`: with co-anchored tabs a
 * lone verdict would render under the wrong tab when the learner switches tabs,
 * so the verdict is keyed by item id and the active tab reads its own
 * (`verdictsByItemId[activeItem.id]`).
 *
 * @remarks Scoped to the pick: cleared on re-pick (a fresh attempt) and on source
 * change; **preserved across a tab switch** (the within-pick isolation that is the
 * sole reason this type exists). The durable cross-pick record is `MasteryState`
 * (per `groupKey`), not this — see `./README.md` § Interaction contract (reset
 * matrix). Per-mount React state.
 */
type VerdictsByItemId = Readonly<Record<string, Verdict>>;

/**
 * The answer-phase staged selection — the source ranges the learner has clicked
 * for the active code-surface tab, before confirming. The two code-surface modes
 * share this one substrate, differing only in how a click stages: `click-token`
 * keeps it **single-slot** (a click replaces it with `[range]`), `select-in-code`
 * keeps it a **toggle-set** (a click toggles membership on exact `[start, end]`
 * equality). A **Confirm** control grades the staged ranges via `grade`.
 *
 * @remarks Empty in anchor phase; cleared on re-pick / tab switch / source change.
 * Per-mount React state; updated through a **functional** setter (never closing
 * over the current value), mirroring the inc-5 `setMastery` reducer pattern.
 */
type PendingSelection = ReadonlyArray<readonly [number, number]>;

export type {
	QuizLensConfig,
	GroupMastery,
	MasteryState,
	MasteryFold,
	ProgressBucket,
	MasteryDecos,
	ActiveTab,
	VerdictsByItemId,
	PendingSelection,
};
