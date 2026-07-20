// cspell:ignore distractor distractors

/**
 * Domain model for the `parsons` lens — a drag-to-order code exercise.
 * The parser (`./lib/parse-parsons.ts`) splits a program's source into
 * solution lines and distractor lines, normalizing leading whitespace into
 * relative indent levels; the component shuffles them into an available pool
 * and lets the learner drag lines into a solution column and indent them. A
 * Check action grades the arrangement (order via LIS in
 * `./lib/evaluate-line-order.ts`, indentation in
 * `./lib/evaluate-indentation.ts`) and surfaces per-line correctness plus a
 * score.
 *
 * Two families of type live here:
 *
 * 1. **Domain values** (`ParsonsLine`, `ParsedParsons`, `PlacedLine`,
 *    `Arrangement`, `LineCorrectness`, `CorrectnessMap`, `EvaluationResult`,
 *    `Attempt`, the evaluator interchange types). These are runtime
 *    structures, NOT config — they may be arbitrary objects / Maps.
 * 2. **The config contract** (`ParsonsLensConfig`). This is the shape the
 *    lens reads from `LensConfig` and MUST stay `SerializableValue`-compliant
 *    (primitives + primitive arrays only — see `../types.ts`
 *    `SerializablePrimitive`), because config hashes must stay deterministic.
 *    Nested objects / functions are forbidden here.
 *
 * @see ./README.md for the public spec, glossary, and contracts.
 * @see ./DOCS.md for the architectural sketch and decision log.
 */

/**
 * One line of the parsed exercise — either a solution line or a distractor.
 *
 * @remarks
 * Produced by `parse-parsons.ts` from the source's lines. Each line gets a
 * stable `id` (used as the drag `dataTransfer` payload and as the
 * `CorrectnessMap` key). The `indent` field here is the **model** (answer)
 * indent level for solution lines; the learner's chosen indent lives
 * separately on `PlacedLine.indent`.
 *
 * - `id` — stable unique identifier (`line-<index>` over the kept source
 *   lines). Survives shuffling; keys the correctness map.
 * - `code` — the line's source text, with the `// distractor` marker (if
 *   any) and leading/trailing whitespace stripped.
 * - `indent` — the **model** indent level. For solution lines: a
 *   non-negative integer nesting level (0, 1, 2, …) from `normalizeIndents`
 *   (relative, not raw spaces); `-1` denotes an unresolved indentation (an
 *   IndentationError sentinel). For distractors: `-1` (no meaningful model
 *   indent — a distractor has no correct position).
 * - `distractor` — `true` if the source line ended with `// distractor`;
 *   such a line does NOT belong in the solution.
 *
 * **No stored model-position field.** A solution line's expected position IS
 * its index in the ordered `ParsedParsons.solution` array. The order grader
 * does NOT read a per-line position off this type — it derives the LIS input
 * per-Check by **matching each placed line's `code`** to the next-unused
 * solution line, so identical lines stay interchangeable (the learner is not
 * penalized for placing "the wrong copy" of a duplicated line). See
 * `./lib/evaluate-line-order.ts` and README § Edge cases (duplicates).
 */
export type ParsonsLine = Readonly<{
	id: string;
	code: string;
	indent: number;
	distractor: boolean;
}>;

/**
 * The parser's output: the model solution, the selected distractors, the
 * initial shuffled pool, and the extracted educator hints.
 *
 * @remarks
 * - `solution` — the solution lines in **model order** (array index =
 *   expected position), carrying their model `indent` levels. This is the
 *   answer key the grader compares against. It is never shown in work view
 *   (only in complete view).
 * - `distractors` — the selected distractor lines (a
 *   `min(maxDistractors, declared)`-sized subset; see README § Edge cases).
 *   Empty when none are declared or `maxDistractors === 0`.
 * - `pool` — the initial available-pool order: the `id`s of all `solution` +
 *   `distractor` lines, shuffled (Fisher–Yates over the injected RNG).
 * - `hints` — educator hint blocks extracted from the source's C-style
 *   block comments (removed from the orderable code); rendered read-only
 *   above the board. Empty array when none.
 *
 * Look-up of a line by `id` is the component's job over
 * `solution ∪ distractors`; the parser does not pre-build a map (kept
 * simple; the line counts are small).
 */
export type ParsedParsons = Readonly<{
	solution: ReadonlyArray<ParsonsLine>;
	distractors: ReadonlyArray<ParsonsLine>;
	pool: ReadonlyArray<string>;
	hints: ReadonlyArray<HintBlock>;
}>;

/**
 * An educator-authored hint block extracted from the source. A C-style block
 * comment in the source is pulled OUT of the orderable code and shown as
 * read-only guidance above the board; it is never a solution or distractor
 * line.
 *
 * @remarks
 * Produced by `./lib/extract-hints.ts`, which strips each block (and its
 * surrounding horizontal whitespace) from the code before line-splitting.
 *
 * - `summary` — the `parsons-collapse: <text>` label: the text after the
 *   marker (`''` when the marker is present but empty), or `null` when there
 *   is no marker. This is the PARSER's tag; the component renders EVERY
 *   block as a collapsible `<details>` and uses a non-empty `summary` as the
 *   label (`null` / `''` fall back to a default `Hint` label).
 * - `body` — the block-comment text to display (with the
 *   `parsons-collapse:` marker line removed when a marker was present).
 *   Interior whitespace is preserved; both fields render as escaped text.
 */
export type HintBlock = Readonly<{
	summary: string | null;
	body: string;
}>;

/**
 * A line the learner has placed into the solution column, with the indent
 * level they chose.
 *
 * @remarks
 * - `id` — references a `ParsonsLine.id`.
 * - `indent` — the **learner's** chosen indent level (non-negative
 *   integer). Starts at `0` when a line enters the solution and is changed
 *   only by the indent/outdent controls; it persists across reorders WITHIN
 *   the solution but resets to `0` on a pool round-trip (the pool stores no
 *   indent — `Arrangement.pool` is a list of ids). Compared against the
 *   referenced solution line's model `indent` by the indentation grader.
 *   Ignored when `config.canIndent` is `false`.
 */
export type PlacedLine = Readonly<{
	id: string;
	indent: number;
}>;

/**
 * The learner's full arrangement — the state the pure arrangement
 * transitions (`./lib/place-from-pool.ts` and friends) transform.
 *
 * @remarks
 * - `pool` — `id`s currently in the available pool (drag source), in
 *   display order.
 * - `solution` — `PlacedLine`s in the solution column, in the learner's
 *   chosen order (index = position). The grader reads this.
 *
 * Invariant: every line `id` appears in exactly one of `pool` or `solution`
 * (every transition preserves this). The union equals the parser's
 * `solution ∪ distractors` id set.
 */
export type Arrangement = Readonly<{
	pool: ReadonlyArray<string>;
	solution: ReadonlyArray<PlacedLine>;
}>;

/**
 * Per-line feedback state after a Check.
 *
 * @remarks
 * Resolved under a fixed precedence (see README § Feedback contract):
 * `distractor` > `wrong-order` > `wrong-indent` > `correct` for placed
 * lines; `unplaced` is a **pool-line** state (a solution line still in the
 * pool) and is NEVER set as a `data-correctness` value on a solution `<li>`.
 *
 * - `correct` — right relative order AND (when `canIndent`) right indent
 *   level.
 * - `wrong-order` — a placed line not in the LIS of placed lines' model
 *   positions (it should move). Indent is NOT evaluated for such a line.
 * - `wrong-indent` — order-correct but indent level ≠ model level (only
 *   when `canIndent`).
 * - `distractor` — a distractor line wrongly placed in the solution.
 * - `unplaced` — a solution line still left in the available pool.
 *
 * **Anti-leak rendering (the component, not this type):** all five states
 * are computed, but the feedback never reveals which lines are distractors.
 * `distractor` is rendered identically to `wrong-order` ("wrong place"), and
 * `unplaced` is **not rendered at all** — a missing solution line lowers the
 * score instead of marking the pool line (which would identify the
 * distractors by elimination). Only `correct` / `wrong-order` /
 * `wrong-indent` appear as distinct learner feedback (and in the legend).
 * `distractor` and `unplaced` remain in the model for the score, `success`,
 * and the history snapshot.
 */
export type LineCorrectness =
	| 'correct'
	| 'wrong-order'
	| 'wrong-indent'
	| 'distractor'
	| 'unplaced';

/**
 * Per-line correctness, keyed by `ParsonsLine.id`.
 *
 * @remarks
 * `Map` (not `Record`) for stable insertion order and O(1) lookup during the
 * per-render feedback pass. Includes entries for placed lines (one of the
 * four placed states) and for unplaced solution lines (`'unplaced'`,
 * computed but not rendered). Distractors left in the pool are
 * correct-by-omission and are NOT included (silently fine).
 */
export type CorrectnessMap = ReadonlyMap<string, LineCorrectness>;

/**
 * The grader's return shape: per-line correctness plus aggregate counts and
 * score.
 *
 * @remarks
 * - `correctnessMap` — per-line states (see `CorrectnessMap`).
 * - `total` — number of **solution lines** (distractors excluded). Unplaced
 *   solution lines DO count toward `total` (so omission lowers the score).
 * - `correct` — number of solution lines that are fully correct (right
 *   order, and right indent when `canIndent`).
 * - `score` — `total === 0 ? 100 : Math.round(correct / total * 100)`. The
 *   `total === 0` branch (empty source) is a vacuously-complete exercise at
 *   100%, not `NaN%`.
 * - `success` — `correct === total && no distractors placed` (the binary
 *   pass condition): every solution line present, in order, correctly
 *   indented (when `canIndent`), and no distractor occupying the solution.
 */
export type EvaluationResult = Readonly<{
	correctnessMap: CorrectnessMap;
	total: number;
	correct: number;
	score: number;
	success: boolean;
}>;

/**
 * One logged Check attempt for the attempt-history modal. Each Check appends
 * an `Attempt`; the learner can open a modal to review what they tried.
 *
 * @remarks
 * The history lives in per-mount React state only — it persists across
 * Reset but dies on unmount, consistent with disposable practice (no
 * cross-mount persistence; see README § Attempt history).
 *
 * - `index` — the 1-based attempt number (display order).
 * - `score` / `success` — the `EvaluationResult` aggregates at Check time.
 * - `snapshot` — the SOLUTION column as it was when checked: each placed
 *   line's `code`, chosen `indent`, and resolved `correctness`, in placed
 *   order. Rendered read-only in the modal; frozen at Check time — the modal
 *   never re-grades.
 */
export type Attempt = Readonly<{
	index: number;
	score: number;
	success: boolean;
	snapshot: ReadonlyArray<
		Readonly<{ code: string; indent: number; correctness: LineCorrectness }>
	>;
}>;

/** A line the learner placed in the solution column: its id and visible code. */
export type PlacedCode = Readonly<{ id: string; code: string }>;

/**
 * The order verdict for a single placed line (pre-precedence; indent is a
 * separate dimension). Produced by `./lib/evaluate-line-order.ts`.
 */
export type OrderVerdict = 'correct' | 'wrong-order' | 'distractor';

/**
 * The order grader's return shape (`./lib/evaluate-line-order.ts`).
 *
 * @remarks
 * - `order` — per placed-line id → its order verdict, in placed order.
 * - `matchedModelIndex` — per ORDER-CORRECT placed-line id → the matched
 *   model-solution index, so `./lib/evaluate-indentation.ts` can compare
 *   against that model line's indent level. Distractor and wrong-order lines
 *   are absent.
 */
export type LineOrderResult = Readonly<{
	order: ReadonlyMap<string, OrderVerdict>;
	matchedModelIndex: ReadonlyMap<string, number>;
}>;

/**
 * Indent verdict for an order-correct line (other lines are not
 * indent-graded). Produced by `./lib/evaluate-indentation.ts`.
 */
export type IndentVerdict = 'correct' | 'wrong-indent';

/**
 * The fields this lens reads from `LensConfig`. Does NOT exclude additional
 * fields — `LensConfig` is open-shape at the contract boundary — but
 * documents what the lens looks for and the defaults applied when a field is
 * absent.
 *
 * @remarks
 * All fields are `SerializableValue` (primitives only — no nested objects
 * or functions), per `../types.ts` `LensConfig`. A deferred seeded-RNG
 * (`random: () => number`) is deliberately NOT a config field (a function is
 * non-serializable); it would be injected at the call-site by the component
 * — see README § Future direction.
 *
 * Documentation type: no runtime import consumes this alias — the component
 * narrows the open-shape `LensConfig` field-by-field at its boundary. This
 * is the canonical statement of the fields and their defaults.
 *
 * - `canIndent?: boolean` (default `true`) — whether indentation is a
 *   graded dimension. When `false`, indent controls are hidden and
 *   indentation is excluded from grading and the score.
 * - `maxDistractors?: number` (default `10`) — cap on distractor lines
 *   shown. Actual count is `min(maxDistractors, declared)`. `0` suppresses
 *   distractors.
 * - `indentSize?: number` (default `4`) — visual spaces per indent level
 *   (presentation only; grading compares levels, not raw spaces).
 * - `viewMode?: 'work' | 'complete'` (default `'work'`) — initial view.
 */
export type ParsonsLensConfig = Readonly<{
	canIndent?: boolean;
	maxDistractors?: number;
	indentSize?: number;
	viewMode?: 'work' | 'complete';
}>;
