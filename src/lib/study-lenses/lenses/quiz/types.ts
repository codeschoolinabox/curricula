/**
 * @file Domain model for the `quiz` lens — a click-an-element,
 * answer-a-question, get-graded study surface. The lens consumes two pure
 * peers: `lib/classifying` (`classifyTokens` → the clickable anchor set)
 * and `lib/quizzing` (`generateQuiz` → the questions; `grade` → the
 * verdict). It re-implements neither; this file declares only the lens's
 * own types — the config surface, the two-channel mastery contract, and
 * the picked-anchor bundle the panel renders.
 *
 * Two layers (per the lenses peer's two-layer module convention):
 * - The pure-TS core (`./core.ts` + `./lib/build-quiz.ts` +
 *   `./lib/anchors.ts`) produces the `LensModule` defaults, the
 *   `{ classified, items }` quiz model (parse → classify → generate →
 *   V1-scope filter), and the pure anchor / item resolution
 *   (`anchorAt` / `itemsAt`).
 * - The React wrapper (`./index.tsx`) mounts the read-only, un-colorized
 *   CodeMirror editor, captures clicks, owns the per-mount UI state
 *   (picked anchor, selected option, verdict), and renders the panel.
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

import type {
	McqQuizItem,
	QuizItem,
	Verdict,
} from '../../lib/quizzing/types.js';

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

// ─── Picked anchor (the panel's input bundle) ───────────────

/**
 * The learner's current selection: the clicked source span plus the quiz
 * item(s) resolved at it. Produced by the wrapper from the click pipeline
 * — `anchorAt(offset, classified)` gives the token (hence the `range`),
 * and `itemsAt(items, range)` gives the `items`.
 *
 * @remarks `items` is an array because a single range can carry several
 * co-anchored forms (the panel then shows answer-neutral tabs). In Slice
 * A the V1 form-scope filter (`./lib/build-quiz.ts`) leaves exactly one
 * `McqQuizItem` per range, so the array holds one and the panel renders
 * single-item; the array shape is the seam later slices widen (admitting
 * V7 mcq → tabs) without re-shaping the panel. Typed as `McqQuizItem`
 * because Slice A renders only the panel `mcq` variant; widens to
 * `QuizItem` when code-as-answer modes land. `[start, end)` is the
 * half-open source range, matching classifying / quizzing.
 */
type PickedAnchor = Readonly<{
	range: readonly [number, number];
	items: ReadonlyArray<McqQuizItem>;
}>;

// ─── Mastery (two-channel; contract captured, fold deferred) ─

/**
 * Per-group mastery state — **two orthogonal, color-free channels** so a
 * learner with color-vision deficiency reads both on independent visual
 * axes (a hue pairing like red/green would collapse them):
 *
 * - `progress` — channel 1: a monotonic-up accrual of how much of this
 *   group is mastered. Rendered as a non-hue cue (e.g. underline density /
 *   fill). The **range/intent is pinned here** (0 = untouched, rising with
 *   correct answers; earned propagation bulk-credits it); the exact
 *   accrual **curve** (consecutive-correct counter vs. a 0..1 ratio vs. a
 *   threshold-to-unlock) is the inc-5 fold's design call, left for the
 *   Phase-0 human gate.
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
 * keyed by `item.groupKey`. **Signature only; deferred to inc 5.** Slice A
 * does not accrue mastery (it surfaces the per-answer `Verdict`), so no
 * implementation of this type exists yet; it is pinned here so inc 5
 * implements against a fixed contract.
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

export type {
	QuizLensConfig,
	PickedAnchor,
	GroupMastery,
	MasteryState,
	MasteryFold,
};
