/**
 * @file The public contract of the shared loop-guard splicer.
 *
 * This module OWNS this contract and imports NOTHING: the two runners
 * (intercept, danger) import these hook signatures and pass their own
 * call-text factories — the dependency arrow points DOWN into this `lib/`
 * module, never up. The `MakeGuard` / `MakeReset` signature is the locked
 * shared edge both runners depend on; loop-guard is its source of truth.
 *
 * loop-guard is agnostic to what the guard/reset calls DO: the semantics
 * (throw, count, stamp a loc), the counter home, the iteration limit, and the
 * trip report are all folded into what the factories return. The guarded set
 * (`while` / classic `for` / `do-while` / `for-of` with a braced body) is an
 * INTERNAL walker filter, not part of this public surface — no consumer passes
 * or receives a loop type, so no `LoopType` is exported here.
 *
 * Vocabulary is pinned in README.md § Ubiquitous language; the internal phases
 * (parse → collect → allocate → plan → apply) and the loc-fidelity ordering
 * constraint in DOCS.md.
 */

// ─── Position & span (acorn `locations: true` shape) ──────────────────────────

/**
 * A source position — 1-based line, 0-based column, matching acorn's
 * `locations: true` output.
 */
type Position = { readonly line: number; readonly column: number };

/**
 * A guarded loop's own source span, passed to {@link MakeGuard}. It is the
 * **loop statement** node's location (keyword through loop end), NOT the body
 * block's span — a limit trip is attributed to the loop, so intercept encodes
 * this as `'L:C:L:C'`. Its line numbers are always faithful to the learner's
 * source; its columns are faithful only when loop-guard ran before any
 * column-shifting rewriter (DOCS.md § loc fidelity).
 */
type LoopLoc = { readonly start: Position; readonly end: Position };

// ─── The two hooks (the locked shared contract) ───────────────────────────────

/**
 * Produces the guard-call text spliced at the top of a guarded loop's braced
 * body. `loopIndex` is 1-based and dense (`1..loopCount` in reading order);
 * `loc` is the loop's own span. MUST return a single-line, complete statement
 * (including any trailing `;`) — a multi-line return throws
 * {@link LoopGuardError} because it would break line preservation.
 */
type MakeGuard = (loopIndex: number, loc: LoopLoc) => string;

/**
 * Produces the reset-call text spliced after a guarded loop, so a fresh entry
 * restarts that loop's per-entry count. `loopIndex` is 1-based and dense; a
 * reset needs no `loc`. MUST return a single-line, complete statement. For a
 * do-while, loop-guard prepends a `;` to this text (the caller cannot, since
 * `makeReset` does not know the loop type).
 */
type MakeReset = (loopIndex: number) => string;

/**
 * The caller-supplied call-text factories — the one options argument to
 * {@link SpliceLoopGuards}. Shaped to let intercept (closure-counter calls) and
 * danger (`var`-global assignment) each vary the text through one splicer.
 */
type SpliceHooks = {
	readonly makeGuard: MakeGuard;
	readonly makeReset: MakeReset;
};

// ─── Result & error (the terminal shapes) ─────────────────────────────────────

/**
 * The result of one splice. `code` is the rewritten source, line-for-line with
 * the input — strictly `===` the input when no loops were guarded (no
 * parse-reprint round-trip). `loopCount` is the number of loops guarded; ids
 * ran `1..loopCount`. danger provisions exactly `loopCount` counter globals
 * from it; intercept (closure counters) ignores it.
 */
type GuardResult = { readonly code: string; readonly loopCount: number };

/**
 * The one typed failure this module throws. A real `Error` (stack +
 * `instanceof Error`) augmented with a discriminant tag and reason:
 *
 * - `parse-failed` — the source parsed as neither module nor script.
 * - `multiline-injection` — a `makeGuard`/`makeReset` return contained an ES
 *   line terminator (`\n`, `\r`, ` `, ` `), which would silently shift
 *   line numbers and break the line-preservation invariant both runners rely on.
 */
type LoopGuardError = Error & {
	readonly loopGuardBoundary: true;
	readonly reason: 'parse-failed' | 'multiline-injection';
};

// ─── The verb (the one public entry point) ────────────────────────────────────

/**
 * Splice caller-supplied guard/reset calls into every guarded loop in `code`
 * without moving a line, and report how many were guarded. Synchronous; parses
 * loudly (throws {@link LoopGuardError} on malformed source).
 */
type SpliceLoopGuards = (code: string, hooks: SpliceHooks) => GuardResult;

export type {
	Position,
	LoopLoc,
	MakeGuard,
	MakeReset,
	SpliceHooks,
	GuardResult,
	LoopGuardError,
	SpliceLoopGuards,
};
