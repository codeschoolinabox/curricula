/**
 * @file Canonical types for the quizzing module.
 *
 * The domain model in TypeScript: the auto-gradable `QuizItem` (a question
 * fully resolved against a snippet, carrying its own machine-derived ground
 * truth), the `Verdict` a `LearnerResponse` grades to, the answer-mode and
 * family vocabularies, and the `QuizFilter`. The two public-function
 * signatures (`generateQuiz`, `grade`) are pinned here as `GenerateQuiz` /
 * `Grade`.
 *
 * See `./README.md` for the glossary, the bounded context, and the
 * static-decidability boundary these types encode, and `./DOCS.md` for the
 * generator-pipeline sketch.
 *
 * Vocabulary borrowed from peers (shared contract — widening is a
 * cross-consumer event): `Category` / `ClassifiedToken` from `../classifying`,
 * `BlockCell` from socratizing, `NodePath` / `Snippet` from `embody`.
 */

import type { NodePath, Snippet } from '../../embody/types.js';
import type { BlockCell } from '../../orchestrate/lib/socratizing/types.js';
import type { Category, ClassifiedToken } from '../classifying/types.js';

/**
 * How a learner answers a `QuizItem`, and therefore the shape of both the
 * response and the answer key. The full end-state vocabulary (the catalog
 * names all five); the panel modes (`mcq` / `multi-mcq`) answer by option id,
 * the code-surface modes (`click-token` / `click-line` / `select-in-code`)
 * answer by source range. The `mcq`, code-surface `click-token` / `click-line`,
 * and exhaustive `select-in-code` variants of `QuizItem` / `LearnerResponse` are
 * built; `multi-mcq` is the only enumerated-not-built mode. New modes are additive
 * members (a cross-consumer contract event with the lens).
 */
export type AnswerMode =
	| 'mcq'
	| 'multi-mcq'
	| 'click-token'
	| 'click-line'
	| 'select-in-code';

/**
 * The syntax-element domain a `form` belongs to — quizzing's own coarse axis
 * above `form`. NOT classifying's `Category` (a per-token kind that is
 * sometimes a question's answer) and NOT socratizing's `Feature` (a related
 * but non-isomorphic axis; the correspondence is partial — see README §
 * Glossary). Widening this union is a cross-consumer contract event.
 */
export type Family =
	| 'variables'
	| 'operators'
	| 'literals'
	| 'keywords'
	| 'delimiters'
	| 'calls'
	| 'io';

/** One selectable choice in a panel-mode (`mcq` / `multi-mcq`) question. */
export type QuizOption = Readonly<{
	id: string;
	text: string;
}>;

/**
 * Fields every `QuizItem` carries regardless of answer mode. `anchorRange` is
 * `[start, end)` (zero-indexed, half-open into `source.code`, matching
 * classifying's range convention) — always present, since every anchor is a
 * source span. `anchorPath` is the AST node identity, present only for
 * node-anchored forms; token-anchored forms (the category-ID form) carry only
 * `anchorRange`, because a token is not an AST node and has no path. `groupKey`
 * is keyed on the classification axis the `form` uses — the category-ID form
 * uses `category:<category>`, refined to `category:<category>:<role>` where the
 * token carries a role — and is deterministic from
 * `(snippet, classified, filter)`. `unlocks` lists the distinct `groupKey`
 * string(s) — one per group the "sameness" gesture earns — that its propagation
 * peers carry (same namespace as `groupKey` above, not a new id space); it names
 * whatever key those peers hold, so it survives a later `groupKey` re-key without
 * a contract change. Lens-consumed (the propagation mechanic is the M3 lens's),
 * never read by `grade`. Absent on forms that earn nothing.
 */
export type QuizItemBase = Readonly<{
	id: string;
	family: Family;
	form: string;
	anchorRange: readonly [number, number];
	anchorPath?: NodePath;
	cells: ReadonlyArray<BlockCell>;
	prompt: string;
	groupKey: string;
	feedback: string;
	unlocks?: ReadonlyArray<string>;
}>;

/**
 * A panel single/multi-select question. `options` are the rendered choices;
 * `answerOptionIds` are the correct option id(s) — an array even for
 * single-select, so the shape is stable when `multi-mcq` lands.
 */
export type McqQuizItem = QuizItemBase &
	Readonly<{
		mode: 'mcq';
		options: ReadonlyArray<QuizOption>;
		answerOptionIds: ReadonlyArray<string>;
	}>;

/**
 * A code-surface question answered by clicking source range(s). One variant
 * covers both `click-token` and `click-line`: the item shape and the grading are
 * identical — the answer key is `targetRanges` and a response is graded by exact
 * set-equality of ranges — they differ only in the lens's capture mechanic (a
 * token span vs. a line span), which quizzing does not model. `targetRanges` are
 * the `[start, end)` spans a correct response must hit exactly (order-insensitive,
 * no partial credit); it is a generator invariant that they are **non-empty** — a
 * code-surface item with zero targets is a generator bug, not a question.
 * `select-in-code` is its own variant (`SelectInCodeQuizItem`): the
 * multi-select-and-confirm exhaustive-selection genre, graded by the same exact
 * set-equality — a sibling, not a member of this single-/line-click variant.
 */
export type CodeSurfaceQuizItem = QuizItemBase &
	Readonly<{
		mode: 'click-token' | 'click-line';
		targetRanges: ReadonlyArray<readonly [number, number]>;
	}>;

/**
 * A code-surface question answered by selecting **every** source range that
 * satisfies the form's predicate — the exhaustive-selection genre (the sameness
 * forms V10a/b/c and later block-selection forms): "click every occurrence of
 * this variable", "select the declarations of all variables used in this block".
 * Its own variant under the rule **one variant per assessment gesture, capture
 * mechanics folded within**: `click-token` / `click-line` are one gesture (a
 * single click, one span) and share `CodeSurfaceQuizItem`; `select-in-code` is a
 * different gesture (multi-select-and-confirm, N targets, exhaustiveness the
 * graded skill) — the gesture quizzing does not model, but the genre boundary it
 * marks is real. Today this is a structural twin of `CodeSurfaceQuizItem` (only
 * `targetRanges`); the duplication is **deliberate** — the variants are kept
 * separate because the exhaustive genre is expected to diverge, not collapsed
 * into a shared supertype. `targetRanges` is the **complete** target set a correct
 * answer must hit; grading is the **same exact set-equality** as the other
 * code-surface modes — binary, no partial credit — because "find the complete set"
 * *is* an exact-match test (a partial selection is `incorrect`, never partially
 * credited). It is a generator invariant that `targetRanges` is **non-empty**.
 * This variant carries **no** missed/extra data and no feedback shape beyond the
 * inherited `feedback: string`: quizzing supplies the complete target set so the
 * lens *can* render formative "you missed these / wrongly included these"
 * feedback from `targetRanges` and the learner's selection; the `Verdict` stays
 * binary and one-sided (it never echoes the answer key).
 */
export type SelectInCodeQuizItem = QuizItemBase &
	Readonly<{
		mode: 'select-in-code';
		targetRanges: ReadonlyArray<readonly [number, number]>;
	}>;

/**
 * A generated quiz question, anchored to one source element, carrying its own
 * machine-derived ground truth. Discriminated on `mode`. Three variants are built:
 * the panel `mcq`, the code-surface `click-token` / `click-line`
 * (`CodeSurfaceQuizItem`), and the exhaustive-selection `select-in-code`
 * (`SelectInCodeQuizItem`) — the latter two both range-based and graded by exact
 * set-equality. `multi-mcq` is the only remaining enumerated-not-built mode: it
 * widens `McqQuizItem.mode` (same option-id shape — set-equality grading already
 * handles it). Adding it is a cross-consumer contract event with the lens.
 */
export type QuizItem = McqQuizItem | CodeSurfaceQuizItem | SelectInCodeQuizItem;

/**
 * What the learner submitted, shaped by the answer mode. Discriminated on `mode`
 * so `grade` detects a response whose mode does not match the item's (a caller /
 * UI bug) rather than mis-grading it: a panel mode answers by option id(s); a
 * single-/line-click code-surface mode by `clickedRanges`; the exhaustive
 * `select-in-code` mode by `selectedRanges` (the multi-select set the learner
 * built and confirmed). Named `LearnerResponse`, not `Response`, to avoid the DOM
 * `Response` global in the React-side lens. Widens additively alongside
 * `QuizItem`.
 */
export type LearnerResponse =
	| Readonly<{ mode: 'mcq'; selectedOptionIds: ReadonlyArray<string> }>
	| Readonly<{
			mode: 'click-token' | 'click-line';
			clickedRanges: ReadonlyArray<readonly [number, number]>;
	  }>
	| Readonly<{
			mode: 'select-in-code';
			selectedRanges: ReadonlyArray<readonly [number, number]>;
	  }>;

/**
 * The outcome of grading one `LearnerResponse` against one `QuizItem`.
 * Discriminated on `status`:
 * - `correct` / `incorrect` — the answer was interpretable and judged;
 *   `feedback` is the NM-vocabulary explanation to surface. Grading is binary
 *   (exact match of the answer key — no partial credit). The correct answer
 *   itself is not echoed: the lens reveals it from the item's answer key it
 *   already holds.
 * - `malformed` — the response could not be interpreted against this item (a
 *   mode mismatch or unknown option id — a caller / UI bug, not a wrong
 *   learner). `reason` is a developer diagnostic; the lens does not penalize
 *   mastery for it. `grade` is total and never throws.
 */
export type Verdict =
	| Readonly<{ status: 'correct'; feedback: string }>
	| Readonly<{ status: 'incorrect'; feedback: string }>
	| Readonly<{ status: 'malformed'; reason: string }>;

/**
 * Configuration for `generateQuiz`. Mirrors socratizing's
 * `MicroDecisionConfig` filtering *semantics* (not its literal shape — a
 * flatter `Partial<Record<…, boolean>>` suffices because every `Family` /
 * `Category` value is a single lowercase token, so no kebab→camel key map is
 * needed). All fields optional:
 * - an omitted group imposes no filter; an all-false group excludes everything
 *   (a present key set `false` excludes that value; a missing key still
 *   passes);
 * - groups are AND-ed; a multi-value group is OR-ed within;
 * - `range` is 1-based inclusive line numbers — an item is kept when its
 *   `anchorRange` line span overlaps it (any overlap, not containment);
 * - `count` caps the source-ordered result last (`0` ≡ omitted — no cap).
 */
export type QuizFilter = Readonly<{
	families?: Readonly<Partial<Record<Family, boolean>>>;
	categories?: Readonly<Partial<Record<Category, boolean>>>;
	range?: Readonly<{ start: number; end: number }>;
	count?: number;
}>;

/**
 * The content entry point. Runs the registered generators over `snippet` and
 * its pre-computed `classified` tokens, applies `filter`, and returns a frozen,
 * source-ordered array. Quizzing never calls `classifyTokens` — `classified`
 * arrives as a parameter (see README § Public API for the input asymmetry).
 * Throws on null / unparsed input: it is called behind the consumer's
 * `status.parsed` gate, and a valid `classified` already implies a successful
 * parse, so a missing AST here is a caller bug to surface (the same posture as
 * the sibling `classifyTokens`).
 */
export type GenerateQuiz = (
	snippet: Snippet,
	classified: ReadonlyArray<ClassifiedToken>,
	filter?: QuizFilter,
) => ReadonlyArray<QuizItem>;

/**
 * The grading entry point. A pure comparator: reads only the item and the
 * response (never the snippet — the item carries its own ground truth),
 * dispatches on `item.mode`, and returns a frozen `Verdict`. Total and
 * non-throwing — it runs in the lens's interaction loop on every click.
 */
export type Grade = (item: QuizItem, response: LearnerResponse) => Verdict;
