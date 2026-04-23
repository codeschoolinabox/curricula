# guard-loops — Architectural Sketch

> Written Phase 0, before the Phase 1 implementation increments land. The
> Refactor step of each increment is held against this document — not what
> the code does, but what shape a correct implementation must take. Domain
> terms only; no function names, no variable names, no pseudocode.

## Context

`run` is the sole consumer. The module takes a learner-provided source string
and a guard limit, walks the source's AST, and returns a transformed string
with guard statements injected into every covered loop's body. The caller
(`run.ts`) filters out the `Infinity` guard-limit case before invocation —
this module assumes a finite limit on entry.

The transformation is a string-level splice driven by AST positions. The
original source's character positions are preserved one-for-one in the output
on every line except the two lines touched per loop (the line bearing the
opening `{` and the line bearing the loop's end — the closing `}` for `while`,
`for`, and `for-of`; the end of the full `do-while` statement for `do-while`).
Line count is preserved exactly.

## Scope expansion vs HEAD

This sketch is NOT a refactor of the HEAD implementation. The coverage set
grows from `{WhileStatement}` (HEAD) to `{WhileStatement, ForStatement,
DoWhileStatement, ForOfStatement}` (target). `ForInStatement` remains
excluded.

The HEAD test at `evaluating/shared/guard-loops/tests/guard-loops.test.ts`
asserts `for-of loops are not guarded` (`result.loopCount === 0` for a
for-of input). **This test inverts** when for-of coverage lands. Inverting
it is part of the for-of increment, not a separate refactor; attempting to
preserve it would contradict the new coverage set. The Task B contract
(below) is the regression gate for behavior this sketch preserves; the
for-of, for, and do-while coverage tests are NEW behavior introduced by
this sketch and are out of the regression gate's scope.

### Why for-of is guarded, for-in is not

HEAD's original reasoning — "finite collections, no guards needed" — applies
only to provably-finite iterables. A learner can construct an infinite
iterator (generator functions are the canonical case: `function* g() { let i
= 0; while (true) yield i++; }`), and a for-of over such an iterator loops
forever. Defensive coverage is the safer default. The JeJ surface does not
statically prove iterables are finite.

`for-in` is excluded because the JeJ (Just-Enough-JavaScript) curriculum
surface omits object-property iteration entirely. If a learner writes one, a
downstream validator catches it before this module is invoked; if one
somehow reaches this module, passing it through unguarded is the same
behavior as HEAD for any non-covered AST node.

## Execution phases

1. **Parse** (sync, throws on malformed source) — Drive the source string
   through a parser that yields an AST with character-position annotations
   on loop-body boundaries. Malformed input is a loud failure; the caller is
   responsible for deciding whether to substitute an error event, retry, or
   abort.

2. **Collect** (sync, pure) — Walk the AST in an order that matches the
   learner's reading order: a loop whose keyword appears earlier in the
   source is collected earlier than a loop whose keyword appears later.
   Classify each collected node by loop type. Accept only the four covered
   types; ignore all other nodes. For each accepted node, capture the
   positions needed to plan its two insertions later.

3. **Allocate** (sync, pure) — Assign IDs in the order the collect phase
   visited them. Because collect order matches the learner's reading order,
   the loop whose `while` / `for` / `do` keyword appears earliest in the
   source receives ID `1`, the next-earliest gets `2`, and so on. Nested
   inner loops therefore receive higher IDs than their outer loops, and
   sibling loops get consecutive IDs. The total count becomes the
   `loopCount` field of the return value. If no loops were collected,
   allocation yields zero and the apply phase is a no-op.

4. **Compute offsets** (sync, pure) — Translate each collected loop's
   parser-reported positions into character offsets within the original
   source. The translation honors the parser's column-to-character-offset
   convention, including cases where the parser reports columns as visual
   widths (tabs expanded to a fixed width), so that offsets land between
   the exact characters intended regardless of indentation style in the
   learner's source.

5. **Plan insertions** (sync, pure) — For each loop, produce two insertion
   requests. The **guard insertion** targets the position immediately after
   the loop body's opening brace; its text is the iteration-guard statement
   for that loop's ID. The **reset insertion** targets the position
   immediately after the loop's closing structure: the closing brace of the
   body for `while`, `for`, and `for-of`; the parser-reported end of the
   full statement for `do-while`. For `do-while`, the end-of-statement
   position may be the character after the trailing `;` of `while (cond);`
   if the learner wrote one, or the character after the closing `)` of
   `while (cond)` if the learner relied on ASI (Automatic Semicolon
   Insertion). The reset text for `do-while` must begin with a statement
   terminator (see § Reset self-termination below).

6. **Apply** (sync, pure) — Sort all planned insertions by offset
   descending. Splice each insertion into the source string in that order.
   Descending order is load-bearing: applying a lower-offset insertion first
   would shift every higher-offset position and invalidate the remaining
   plan. Return the spliced string paired with `loopCount`.

## Structural constraints

- **Parse is loud.** Malformed source throws; no fallback to unguarded code.
  The caller decides how to surface the failure to the consumer.

- **Collect order is source-text reading order.** The loop whose keyword
  appears earliest in the source is visited first. This is the user-facing
  promise: error messages saying "Loop 3" refer to the third loop a reader
  sees when scanning the source top-to-bottom. Any AST traversal strategy
  is acceptable as long as it preserves this ordering; for the JeJ-covered
  constructs the obvious top-down traversal suffices.

- **Only four loop types are accepted.** `ForInStatement` and any other AST
  node type pass through unmodified. The `LoopType` union in `types.ts` is
  the single source of truth for the coverage set.

- **Empty collection ⇒ identity.** When the Collect phase yields zero
  loops, the returned `code` is strictly identical (`===`) to the input, not
  merely equivalent. No parse-reprint round-trip is performed. `loopCount`
  is `0`.

- **ID range is dense.** `loopCount === N` means the emitted code references
  exactly the identifiers `loop1, loop2, …, loopN` — no gaps. The caller
  (Worker script) uses `loopCount` to provision matching declarations in a
  single `var loop1 = 0, loop2 = 0, …, loopN = 0;` statement; non-contiguous
  IDs would leave referenced counters undefined.

- **Counter identifier format is a cross-module contract.** Emitted counter
  identifiers are the literal prefix `loop` concatenated with the decimal ID,
  1-indexed, no separator (`loop1`, `loop2`, …, `loop10`, …). Changing this
  format is a breaking change coordinated with `create-worker-script.ts`.

- **Offset computation honors the parser's column convention.** Implementations
  must not assume columns are raw character positions; the parser may report
  columns as visual widths with tabs expanded. Insertion offsets are computed
  by walking characters and accumulating visual width until the parser's
  reported column is reached.

- **Apply processes insertions from highest offset to lowest.** Any other
  order invalidates unapplied offsets and produces garbled output.

- **Do-while's reset point is the full statement's end, not the body's
  end.** All other covered loop types put the reset immediately after the
  body's closing brace. `do-while` puts it at the parser-reported end of
  the full `DoWhileStatement` node.

- **Reset self-termination (do-while only).** The reset text for
  `do-while` must begin with a statement terminator so that ASI-relied-upon
  inputs do not fuse the reset into the `while (cond)` tail as its body.
  `while (cond) loop1 = 0;` parses as `while (cond) { loop1 = 0; }` — an
  infinite loop, not a reset. The reset text therefore begins with `;` for
  `do-while`; the extra empty-statement effect is harmless in all cases.

- **Zero line shift.** No inserted text contains a newline. Every line
  number in the original source maps to the same line number in the output.

- **Zero column shift.** Every character in the original source that was
  not displaced by an insertion retains its original `{line, column}`
  position in the output. Insertions glue onto existing characters (after
  `{`, after `}`, after `;` or `)` for do-while) — they do not interleave
  into the middle of a line's existing content.

- **Injection text leading whitespace is load-bearing.** Guard-insertion
  text begins with a single space so that `{` followed by the injection
  reads as `{ if (...) throw ...` rather than `{if (...) throw ...`.
  Reset-insertion text similarly begins with whitespace (or `;` + space
  for `do-while`) so that the reset reads cleanly in the output. Tests
  that assert on exact substrings (`'} loop1 = 0;'`) depend on this.

## Implementation freedom

The six phases are *named responsibilities*, not *function boundaries*. A
correct implementation may realize them as one function with labeled
sections, as six small functions, or any grouping in between. The sketch is
neutral on function decomposition as long as each phase's responsibility is
traceable in the code. The HEAD implementation at
`evaluating/shared/guard-loops/guard-loops.ts` is a single ~80-line function
with phases inlined; that shape is an acceptable target for this sketch.

## Out of scope

- **Declaring counter variables.** This module emits statements that refer
  to `loop1`, `loop2`, … by name. The caller (via the Worker script's
  setup region) is responsible for declaring and initializing those
  identifiers. A missing or wrongly-initialized declaration is a caller
  defect.

- **The `new Function` wrapper that makes the transformed code executable.**
  The Worker wraps the transformed source in `new Function(...)` to evaluate
  it. This module's output is the body of that function. The wrapper's
  shape — which globals are trapped, what error-event shape wraps runtime
  failures — is the Worker's concern.

- **Filtering the guard limit.** This module assumes the limit is finite.
  `Infinity` handling lives upstream in `run.ts`, which decides not to
  invoke this module when guards should be skipped entirely. If `Infinity`
  is passed anyway, the module emits its normal guard, which never fires
  (`++loopN > Infinity` is always false). The module does not defend
  against caller-side filter misses; a caller-side regression is how that
  bug would surface.

- **Runtime semantics of the injected guards.** Whether `++loopN > max`
  actually throws at runtime depends on the caller declaring `loopN` as
  a numeric-initialized global and on the Worker's `new Function` wrapper
  evaluating the transformed string. Correctness at that layer is a
  caller contract, verified by `run`-level integration tests.

- **Line-number reporting in thrown errors.** The `RangeError` messages
  injected by this module contain the loop's ID and limit but not a line
  number; line tracking for runtime errors is handled by the Worker's
  `Error.stack`-based line extraction, not by the injected guard text.

- **Per-loop-type behavior differences.** The template is uniform across
  the four covered types; only the reset insertion point (and the
  do-while-specific leading `;` in the reset text) differs. No other
  type-specific logic exists.

- **Internal phase-boundary types.** The public type surface (`types.ts`)
  exports only `LoopType` and `GuardResult`. Intermediate phase data
  structures (the collected loop list, the insertion plan) are
  implementation details, not part of the module's public contract.

- **Caching, memoization, or source-map generation.** The transformation
  is a single pure function call per invocation; callers that need
  caching build it externally.

## Task B contract (regression gate)

The existing behavior for edge-case guard limits is preserved across every
covered loop type. This is the regression gate for behavior that exists at
HEAD (currently for `while` only); the for / do-while / for-of increments
extend the same template to the new types, and the same table holds:

- `maxIterations = -1` — `++loopN > -1` is true on the first iteration,
  guard throws, zero body executions.
- `maxIterations = 0` — `++loopN > 0` is true on the first iteration,
  guard throws, zero body executions.
- `maxIterations = 1` — body runs once; on the second entry, `++loopN > 1`
  is true, guard throws.
- `maxIterations = 3` — body runs three times; on the fourth entry,
  `++loopN > 3` is true, guard throws.

`maxIterations = Infinity` is filtered by the caller; not a concern of this
module.

Any new loop type added to the `LoopType` union in the future must extend
`tests/guard-loops.test.ts` with a parameterized suite over
`maxIterations ∈ {-1, 0, 1, 3}` asserting body-execution counts.
