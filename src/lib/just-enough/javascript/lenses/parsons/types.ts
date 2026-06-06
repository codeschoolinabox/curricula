/**
 * @file Domain model for the `parsons` lens — a drag-to-order code exercise.
 * The vendored parser (`./lib/parse-parsons.ts`) splits a snippet into solution
 * lines and distractor lines, normalizing leading whitespace into relative
 * indent levels; the wrapper shuffles them into an available pool and lets the
 * learner drag lines into a solution column and indent them. A Check action
 * grades the arrangement (order via LIS in `./lib/evaluate-line-order.ts`,
 * indentation in `./lib/evaluate-indentation.ts`) and surfaces per-line
 * correctness plus a score.
 *
 * Two families of type live here:
 *
 * 1. **Domain values** (`ParsonsLine`, `ParsedParsons`, `PlacedLine`,
 *    `Arrangement`, `LineCorrectness`, `CorrectnessMap`, `EvaluationResult`).
 *    These are runtime structures, NOT config — they may be arbitrary objects /
 *    Maps.
 * 2. **The config contract** (`ParsonsLensConfig`). This is the shape the lens
 *    reads from `LensConfig` and MUST stay `SerializableValue`-compliant
 *    (primitives + primitive arrays only — see `../types.ts`
 *    `SerializablePrimitive`), because the orchestrator hashes config for
 *    determinism. Nested objects / functions are forbidden here.
 *
 * @see ./README.md for the public spec, glossary, and contracts.
 * @see ./DOCS.md for the architectural sketch and decision log.
 */

/**
 * One line of the parsed exercise — either a solution line or a distractor.
 *
 * @remarks
 * Produced by `parse-parsons.ts` from the snippet's lines. Each line gets a
 * stable `id` (used as the drag `dataTransfer` payload and as the
 * `CorrectnessMap` key). The `indent` field here is the **model** (answer)
 * indent level for solution lines; the learner's chosen indent lives separately
 * on `PlacedLine.indent`.
 *
 * - `id` — stable unique identifier (legacy parity: an `id_prefix + index`
 *   scheme). Survives shuffling; keys the correctness map.
 * - `code` — the line's source text, with the `// distractor` marker (if any)
 *   and leading/trailing whitespace stripped. May represent a block if the
 *   legacy `\n`-join produced one (rare; v1 treats one source line = one line).
 * - `indent` — the **model** indent level. For solution lines: a non-negative
 *   integer nesting level (0, 1, 2, …) from `normalizeIndents` (relative, not
 *   raw spaces); `-1` denotes an unresolved indentation (legacy
 *   IndentationError sentinel). For distractors: `-1` (no meaningful model
 *   indent — a distractor has no correct position).
 * - `distractor` — `true` if the source line ended with `// distractor`; such a
 *   line does NOT belong in the solution.
 *
 * **No stored model-position field.** A solution line's expected position IS its
 * index in the ordered `ParsedParsons.solution` array. The order grader does NOT
 * read a per-line position off this type — it derives the LIS input per-Check by
 * **matching each placed line's `code`** to the next-unused solution line (the
 * legacy `lastFoundCodeIndex` walk), so identical lines stay interchangeable
 * (the learner is not penalized for placing "the wrong copy" of a duplicated
 * line). See `./lib/evaluate-line-order.ts` and README § Edge cases (duplicates).
 */
export type ParsonsLine = Readonly<{
	id: string;
	code: string;
	indent: number;
	distractor: boolean;
}>;

/**
 * The parser's output: the model solution, the selected distractors, and the
 * initial shuffled pool.
 *
 * @remarks
 * - `solution` — the solution lines in **model order** (array index = expected
 *   position), carrying their model `indent` levels. This is the answer key the
 *   grader compares against; a line's expected position is its index here. It is
 *   never shown in work view (only in complete view).
 * - `distractors` — the selected distractor lines (a `min(maxDistractors,
 *   declared)`-sized subset; see README § Edge cases). Empty when none are
 *   declared or `maxDistractors === 0`.
 * - `pool` — the initial available-pool order: the `id`s of all `solution` +
 *   `distractor` lines, shuffled (Fisher–Yates, bare `Math.random()`). A valid
 *   shuffle never equals the model order for a multi-line solution.
 *
 * Look-up of a line by `id` is by the wrapper over `solution ∪ distractors`;
 * the parser does not pre-build a map (kept simple; the line counts are small).
 */
export type ParsedParsons = Readonly<{
	solution: ReadonlyArray<ParsonsLine>;
	distractors: ReadonlyArray<ParsonsLine>;
	pool: ReadonlyArray<string>;
	// Educator hint blocks extracted from the snippet's `/* … */` block comments
	// (removed from the orderable code); rendered read-only above the board. See
	// `HintBlock` + `./lib/parse-parsons.ts` `extractHints`. Empty array when none.
	hints: ReadonlyArray<HintBlock>;
}>;

/**
 * An educator-authored hint block extracted from the snippet — a legacy-parity
 * feature ported from the JSParsons parsonizer (`component.js` block-comment
 * extraction). A C-style block comment (slash-star … star-slash) in the source is
 * pulled OUT of the orderable code and shown as read-only guidance above the
 * board; it is never a solution or distractor line.
 *
 * @remarks
 * Produced by `parse-parsons.ts` (Inc 9) via the legacy block-comment regex, which
 * strips the block (and its surrounding horizontal whitespace) from the code
 * before line-splitting. (The exact regex is vendored in `parse-parsons.ts`; it is
 * not reproduced here to avoid embedding a comment terminator in this doc.)
 *
 * - `summary` — when the block contains a `parsons-collapse: <text>` marker, the
 *   text after the marker becomes a collapsible `<details><summary>`; the rest of
 *   the block is the body. `null` when there is no marker (the block renders as a
 *   plain, always-visible `<pre>`).
 * - `body` — the block-comment text to display (with the `parsons-collapse:`
 *   marker line removed when `summary` is set). Whitespace is preserved.
 */
export type HintBlock = Readonly<{
	summary: string | null;
	body: string;
}>;

/**
 * A line the learner has placed into the solution column, with the indent level
 * they chose.
 *
 * @remarks
 * - `id` — references a `ParsonsLine.id`.
 * - `indent` — the **learner's** chosen indent level (non-negative integer).
 *   Starts at `0` when a line enters the solution (legacy parity: `init` zeroes
 *   all indents) and is changed only by the indent/outdent controls; it persists
 *   across reorders WITHIN the solution but resets to `0` on a pool round-trip
 *   (the pool stores no indent — `Arrangement.pool` is a list of ids). Compared
 *   against the referenced solution line's model `indent` by the indentation
 *   grader. Ignored when `config.canIndent` is `false`.
 */
export type PlacedLine = Readonly<{
	id: string;
	indent: number;
}>;

/**
 * The learner's full arrangement — the state the drag reducer (`./lib/arrange.ts`)
 * transforms.
 *
 * @remarks
 * - `pool` — `id`s currently in the available pool (drag source), in display
 *   order.
 * - `solution` — `PlacedLine`s in the solution column, in the learner's chosen
 *   order (index = position). The grader reads this.
 *
 * Invariant: every line `id` appears in exactly one of `pool` or `solution`
 * (the reducer preserves this). The union equals the parser's
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
 * `distractor` > `wrong-order` > `wrong-indent` > `correct` for placed lines;
 * `unplaced` is a **pool-line** state (a solution line still in the pool) and is
 * NEVER set as a `data-correctness` value on a solution `<li>`.
 *
 * - `correct` — right relative order AND (when `canIndent`) right indent level.
 * - `wrong-order` — a placed line not in the LIS of placed lines' model
 *   positions (it should move). Indent is NOT evaluated for such a line.
 * - `wrong-indent` — order-correct but indent level ≠ model level (only when
 *   `canIndent`).
 * - `distractor` — a distractor line wrongly placed in the solution.
 * - `unplaced` — a solution line still left in the available pool (a "missing"
 *   hint on the pool line).
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
 * per-render feedback pass. Includes entries for placed lines (one of the four
 * placed states) and for unplaced solution lines (`'unplaced'`). Distractors
 * left in the pool are correct-by-omission and are NOT included (silently
 * fine).
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
 * - `correct` — number of solution lines that are fully correct (right order,
 *   and right indent when `canIndent`).
 * - `score` — `total === 0 ? 100 : Math.round(correct / total * 100)`. The
 *   `total === 0` branch (empty snippet) is a vacuously-complete exercise at
 *   100%, not `NaN%`.
 * - `success` — `correct === total && no distractors placed` (the binary
 *   pass condition; legacy parity for "is the exercise solved").
 *
 * NOTE: the percentage `score` is a V2 cross-lens convention (the legacy parsons
 * graded only the binary `success`); `success` preserves the legacy's pass/fail
 * semantics alongside it. This is **equivalent to the legacy
 * `errors.length === 0`** (`parsons.js` L723): a placed distractor makes
 * `correct < total` (the distractor occupies a slot, so a solution line is
 * unplaced) AND maps to the legacy "too many lines" error; an unplaced solution
 * line makes `correct < total` AND maps to "too few lines"; a wrong order or
 * (when `canIndent`) wrong indent makes that line not `correct`. Conversely
 * `correct === total` with no placed distractor means every solution line is
 * present, in order, and (when `canIndent`) correctly indented — zero legacy
 * errors.
 */
export type EvaluationResult = Readonly<{
	correctnessMap: CorrectnessMap;
	total: number;
	correct: number;
	score: number;
	success: boolean;
}>;

/**
 * One logged Check attempt for the attempt-history modal — a legacy-parity feature
 * ported from the JSParsons parsonizer (`component.js` `registerGuess` / "review
 * guesses"). Each Check appends an `Attempt`; the learner can open a modal to
 * review what they tried.
 *
 * @remarks
 * Wired in Inc 11. The history lives in per-mount React state only — it persists
 * across Reset (faithful: the legacy keeps `guesses` across reshuffle) but dies on
 * unmount, consistent with the disposable-practice invariant (no cross-mount
 * persistence; see README § Conventions inherited).
 *
 * - `index` — the 1-based attempt number (display order).
 * - `score` / `success` — the `EvaluationResult` aggregates at Check time.
 * - `snapshot` — the SOLUTION column as it was when checked: each placed line's
 *   `code`, chosen `indent`, and resolved `correctness`, in placed order. Rendered
 *   read-only in the modal (a faithful "see what I tried" view rather than the
 *   legacy's DOM clone).
 */
export type Attempt = Readonly<{
	index: number;
	score: number;
	success: boolean;
	snapshot: ReadonlyArray<
		Readonly<{ code: string; indent: number; correctness: LineCorrectness }>
	>;
}>;

/**
 * The fields this lens reads from `LensConfig`. Does NOT exclude additional
 * fields — `LensConfig` is open-shape at the contract boundary — but documents
 * what the lens looks for and the defaults applied when a field is absent.
 *
 * @remarks
 * All fields are `SerializableValue` (primitives only — no nested objects or
 * functions), per `../types.ts` `LensConfig`. The deferred seeded-RNG
 * (`random: () => number`) is deliberately NOT a config field (a function is
 * non-serializable); it would be injected at the call-site by the wrapper — see
 * README § Future direction.
 *
 * - `canIndent?: boolean` (default `true`) — whether indentation is a graded
 *   dimension. When `false`, indent controls are hidden and indentation is
 *   excluded from grading and the score.
 * - `maxDistractors?: number` (default `10`) — cap on distractor lines shown.
 *   Actual count is `min(maxDistractors, declared)`. `0` suppresses distractors.
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
