# loop-guard

A pure, **line-preserving loop-guard splicer**. It takes a learner's code
`string`, finds every **guarded loop**, and splices a caller-supplied **guard
call** at the top of each loop's braced body plus a caller-supplied **reset
call** after the loop — returning the rewritten source and a count of loops
guarded. The guard/reset call **text is a parameter**; loop-guard is agnostic to
what the calls _are_.

Its single promise is **zero line shift**: the output has the exact same line
count as the input, and every original character keeps its line number. Both
consumers map runtime errors back to learner source by line, so line fidelity is
the load-bearing invariant, not a nicety.

## Where this sits

A **peer-independent** module under [`lib/`][lib], a sibling of
[`engine/`][engine] and [`danger-runner/`][danger]. Two runners consume it:

- **intercept** (under [`embody/lib/evaluating/`][evaluating]) — the sandbox
  runner ([Seam 4][interceptseam]).
- **danger** ([`danger-runner/`][danger]) — the same-origin iframe runner.

### Why this module exists

**1 — The new intercept contract can no longer use a hardcoded splicer.** The
behavior oracle ([`guard-loops.ts`][oracle]) hardcodes its guard
(`if (++loopN > max) throw …`) and its reset (`loopN = 0;`) against emitted
`var` globals. The new intercept design (Seam 4) moves the counters into a
**worker closure**, so the reset must be a **call** (`__$ir(n)`) too — "the
oracle's raw `loopN = 0;` splice … is not reproducible under injected
parameters." A splicer that serves intercept must therefore let the caller
supply **both** the guard and the reset text. That is the primary reason this
module exists: it is the oracle's behavior **re-authored with the call text
parameterized** (and, along the way, migrated recast→acorn — see
[DOCS.md][docs]).

**2 — The oracle lives in the tsconfig-excluded legacy zone.** The oracle sits
under `embody/lib/evaluating/shared/**`, which `tsconfig.json` **excludes** from
type-checking. Danger currently reaches sideways into that excluded file
([`danger-run.ts`][dangerrun] imports it read-only — permitted by
[`lib/README.md`][lib], but a dependency on unchecked legacy code). Promoting a
single, **type-checked** splicer to `lib/` gives both runners one maintained
source of truth to import **down** into, and lets danger drop its dependency on
the excluded oracle.

> **Not** a dependency-direction _permission_ fix. `lib/ → embody/lib/*` imports
> are allowed ([`lib/README.md`][lib]), and danger already imports the oracle.
> The fix is **contract** (parameterized calls the oracle can't provide) and
> **maintainability** (off the excluded legacy zone) — not "danger cannot import
> from embody."

### Scope of migration

This module's consumers are **intercept and danger** only. The oracle's other
current callers — [`run/run.ts`][run] and the separate
[`snippetry/debug`][snippetrydebug] package (its own while-only splicer) — are
**out of scope** and stay on their existing implementations. The legacy
`guardLoops` verb therefore coexists with this module's `spliceLoopGuards` for
now; that coexistence is deliberate, not an oversight.

[lib]: ../README.md
[engine]: ../engine/README.md
[danger]: ../danger-runner/README.md
[evaluating]: ../../embody/lib/evaluating/README.md
[interceptseam]: ../../embody/lib/evaluating/evaluators/intercept/types.ts
[oracle]: ../../embody/lib/evaluating/shared/guard-loops/guard-loops.ts
[docs]: ./DOCS.md
[dangerrun]: ../danger-runner/danger-run.ts
[run]: ../../embody/lib/evaluating/run/run.ts
[snippetrydebug]: ../../../snippetry/debug/guard-loops/guard-loops.ts

## Type ownership & dependency direction

This module **owns its contract and depends on no consumer.** It defines the
`MakeGuard` / `MakeReset` hook signatures and the `GuardResult` shape; the two
runners import them and pass their own call-text factories. The dependency arrow
points **down**, from each runner into this `lib/` module, never up.

**The `makeGuard` / `makeReset` signature is the shared-contract edge both
runners depend on** — treat it as LOCKED. loop-guard is its source of truth.

It **imports only `acorn` and `estree-walker`.** It imports **nothing** from
`embody/` — not the behavior oracle, not `intercept/types.ts`, not
`validate-program.ts`. The parameterized call-text is precisely what keeps
loop-guard consumer-agnostic; owning the hook types keeps the arrow honest.

## Purpose

**Find the guarded loops, splice the caller's guard/reset calls into them
without moving a single line, and report how many were guarded — nothing more.**
The module owns a single verb,
`spliceLoopGuards(code, { makeGuard, makeReset })`, and everything past that is
out of scope: what the guard call _does_ at runtime (throws? counts? both?),
where the counters live, what the iteration limit is, and how a trip is reported
are all the caller's concern, expressed entirely through the text `makeGuard` /
`makeReset` return.

Judging the code — is it valid, in-subset, worth running — is not this module's
concern either; it parses only to locate loops, and parses loudly (a malformed
input throws; the caller decides how to surface that).

## The two consumer forms (why both hooks are parameterized)

One splicer serves two runners **because** both the guard and the reset are
parameters. The forms below are illustrative — the exact text each runner
returns is finalized at its own integration (WP2 / WP4); only the hook
_signature_ is locked here.

- **intercept** — counters live in a worker closure, so both hooks return
  **calls**:
  - `makeGuard(n, loc)` → `` `__$il(${n},'${L}:${C}:${L}:${C}');` `` (the
    iteration guard; `loc` supplies the `L:C:L:C` span)
  - `makeReset(n)` → `` `__$ir(${n});` `` (the closure-counter reset)
  - intercept **ignores** `loopCount` — there are no `var` globals to provision.
- **danger** — keeps the oracle's `var loop1..loopK` model, so the hooks return
  the oracle's own text (the iteration limit `M` captured in the closure, since
  the hooks no longer take a `maxIterations` param):
  - `makeGuard(n, _loc)` →
    `` `if (++loop${n} > ${M}) throw new RangeError("Loop ${n} exceeded ${M} iterations.");` ``
  - `makeReset(n)` → `` `loop${n} = 0;` `` (assignment to the `var` global)
  - danger **uses** `loopCount` to emit `var loop1 = 0, …, loop{loopCount} = 0`
    ([`build-danger-script.ts`][dangerbuild], "never hardcoded").

The guard-vs-reset **and** the intercept-vs-danger asymmetry (closure calls vs.
`var` assignment; `loopCount` used vs. ignored) is exactly why **both** hooks
are parameterized. Adopting this module is a **companion migration** for the
already-shipped `danger-runner`: its oracle import, its call site, and its
README/DOCS/types migrate off the oracle onto these hooks (a separate, WP4-gated
change — not done here).

[dangerbuild]: ../danger-runner/build-danger-script.ts

## Ubiquitous language

- **Guarded loop** — a loop node this module rewrites: a `while`, classic `for`,
  `do-while`, or `for-of` **whose body is a braced block** (`{ … }`). Anything
  else passes through untouched.
- **Guarded set** — the four accepted loop types above. `for-in` is deliberately
  excluded (the JeJ curriculum surface omits object-property iteration); a
  brace-less body is excluded because the splice anchors are the `{` and `}`
  positions, which a brace-less body does not have. The **guarded-set constant
  in the splicer** (`splice-loop-guards.ts`) is the single source of truth for
  the set; it is an internal walker filter, not public contract surface — no
  consumer passes or receives a loop type.
- **Braced body** — a loop body that is a `BlockStatement`. The guard splices
  immediately after its opening `{`; the reset splices immediately after its
  closing `}` (except do-while — see below).
- **Guard call** — the text `makeGuard(loopIndex, loc)` returns, spliced at the
  top of a guarded loop's body. loop-guard does not author it and does not know
  what it does; a runaway-loop check lives inside it (the caller's runtime
  helper), not here. It must be a **complete statement** (see § What it
  produces).
- **Reset call** — the text `makeReset(loopIndex)` returns, spliced after the
  loop so a fresh entry restarts that loop's per-entry count. Also caller-owned,
  also a complete statement.
- **Make-guard / make-reset hooks** — the two call-text factories the caller
  passes. `makeGuard(loopIndex, loc)` receives the loop's index and its own
  source span; `makeReset(loopIndex)` receives only the index (a reset needs no
  loc). Both are **the shared contract**; both must return **single-line** text.
- **Loop index** — a 1-based, **dense** id (`1, 2, …, loopCount`, no gaps),
  assigned in reading order. `makeGuard` and `makeReset` receive it so the
  caller can key per-loop counters. Density matters: danger provisions exactly
  `loopCount` counters (§ two consumer forms).
- **Reading order** — source-text order. The loop whose keyword appears earliest
  is index `1`; a nested inner loop gets a higher index than its outer; siblings
  get consecutive indices. This is the user-facing promise behind "Loop 3".
- **Loop span (`loc`)** — the **loop statement** node's own source location
  (`{ start, end }`, each `{ line, column }`), keyword through loop end —
  **not** the body block's span. It is what intercept encodes as `'L:C:L:C'` to
  attribute a limit trip to its loop. The span is **relative to the `code`
  string loop-guard was given** (§ Design commitments — loc fidelity).
- **Line-preserving splice** — every insertion is single-line text glued onto an
  existing character (after `{`, after `}`, or after the do-while tail); no
  insertion contains a line terminator, so the output's line count equals the
  input's and every original character keeps its line number.
- **do-while full-statement end** — a do-while's reset splices at the **full
  statement's** end (`node.end`), after the learner's trailing `;`, or after the
  `while (cond)` closing `)` when the learner relied on ASI — **not** after the
  body `}` (that would land the reset between the `}` and the `while`, a syntax
  error). loop-guard prepends a `;` to the do-while reset as belt-and-suspenders
  (see § Design commitments).
- **Parse fallback** — loop-guard parses `sourceType: 'module'` first and falls
  back to `sourceType: 'script'` if module parsing throws, so admissible `with`
  code (script-only) still parses. Loop grammar is identical in both modes, so
  the fallback only widens acceptance; it never changes a loop's offsets.

## What it produces (the boundary)

- **In:** a raw code `string` and a `{ makeGuard, makeReset }` pair of call-text
  factories. Each factory must return a **single-line, complete statement** —
  including any trailing `;` (loop-guard adds no termination of its own except
  the do-while reset's leading `;`, which the caller cannot supply because
  `makeReset(index)` does not know the loop is a do-while). No iteration limit,
  no counter names, no error text — those are all folded into what the factories
  return.
- **Out:** a `GuardResult` — `{ code, loopCount }`. `code` is the spliced source
  (line-for-line with the input; strictly `===` the input when no loops were
  found). `loopCount` is the number of loops guarded (ids ran `1..loopCount`).

There is **one entry point**,
`spliceLoopGuards(code, { makeGuard, makeReset })`, called synchronously. It
throws a typed `LoopGuardError` on a malformed source (both parse modes failed →
`reason: 'parse-failed'`) or on a factory that returns multi-line text (→
`reason: 'multiline-injection'`, which would break line preservation).

## Owns vs. excludes

### Owns

- **Parse (loud), module→script fallback** — turning the source into an acorn
  AST with `locations: true`; throwing `LoopGuardError`
  (`reason: 'parse-failed'`) when neither mode parses.
- **Collect in reading order** — a pre-order walk that keeps only the guarded
  set with a braced body, capturing each loop's splice offsets and its own
  `loc`.
- **Allocate dense 1-based indices** and the `loopCount`.
- **Plan & apply the splices** — guard after `{`, reset after `}` (or the
  do-while full-statement end), applied highest-offset-first so earlier splices
  never shift later ones. The do-while `;` prefix is the **only** text
  loop-guard authors of its own.
- **Guard the line-preserving invariant at the boundary** — reject a factory
  return that contains any ES line terminator (`reason: 'multiline-injection'`).

### Excludes

- **The guard/reset call semantics** — what the calls do (throw, count, stamp a
  loc), where the counters live, what the iteration limit is, and how a trip is
  reported. All caller-owned, expressed as the factory return text.
- **Statement termination is the caller's, spacing is the caller's.** loop-guard
  splices factory text **verbatim**; the trailing `;` that makes a call a
  statement, and any leading space for readability, are the caller's to include.
  The only character loop-guard contributes is the do-while reset's leading `;`.
- **Counter declarations** — loop-guard emits statements that _reference_
  per-loop counters (via the caller's calls); declaring/initializing them is
  caller work (danger's `var loop1..loopK`; intercept's closure).
- **Source maps, caching, memoization** — one pure call per invocation; a caller
  that needs any of these builds it around the call.

## Edge cases

- **No loops ⇒ identity.** Zero guarded loops returns the input `code` by
  reference (`===`), `loopCount 0` — no parse-reprint round-trip.
- **`for-in` and brace-less bodies pass through** unmodified and are not
  counted. A mixed source (one braced loop, one brace-less) guards only the
  braced one. The **unguarded runaway is then the runner's problem, and the two
  runners differ**: intercept's worker terminate is the backstop; **danger has
  none** — a synchronous brace-less infinite loop freezes the host tab, a
  documented, accepted limit of on-thread execution ([danger README][danger] §
  Edge cases), not a "time budget" this module falls back on.
- **do-while, ASI (no trailing `;`)** — the reset still lands correctly at
  `node.end` (after `)`); the `;` prefix keeps it an unambiguous fresh
  statement.
- **Nested & sibling loops** — indices follow reading order (outer before inner,
  earlier sibling first); the highest-offset-first apply keeps nested splices
  from corrupting each other.
- **`with`-wrapped loops** parse via the script-mode fallback and are guarded
  normally. (The fallback intentionally accepts _any_ script-parseable source,
  dropping `validate-program`'s `WithStatement` gate — that gate is an
  error-message nicety for a validator; this module does not judge validity, and
  the fallback is strictly more permissive, so it never rejects what the
  validator accepted.)
- **Malformed source** throws `LoopGuardError` (`reason: 'parse-failed'`).
- **A factory that returns text with any line terminator** (`\n`, `\r`, ` `,
  ` `) throws `LoopGuardError` (`reason: 'multiline-injection'`) rather than
  silently desyncing line numbers.

## Design commitments

- **Line preservation is the headline invariant.** Every insertion is
  single-line and glued onto an existing character. A test asserts input and
  output have equal line counts across a multi-loop, multi-line fixture; the
  boundary check (over the full ES line-terminator set) makes a violating
  factory fail loudly instead of silently.
- **loc fidelity is input-relative — a WP2 ordering constraint.** The `loc`
  loop-guard passes to `makeGuard` is the loop's span **in the `code` string it
  was handed**. Its _line_ numbers are always faithful to the learner's source
  (every transform here and in intercept is line-preserving); its _column_
  numbers are faithful only if no column-shifting rewriter ran first. intercept
  currently runs [`wrapCallExpressions`][interceptorder] **before** the guard,
  which shifts columns on lines with wrapped calls. To keep `L:C:L:C`
  learner-faithful, **WP2 must run loop-guard on the original source**
  (guard-first) and teach `wrapCallExpressions` to skip `__$`-prefixed callees
  (Seam 4 guarantees `__$*` is outside the JeJ surface). This module does not
  and cannot solve ordering for its caller — it only documents the constraint
  and reports honest positions for the string it gets.
- **acorn absolute offsets — no visual-column math.** acorn nodes carry absolute
  character offsets (`node.body.start` is the `{`; `.end` is one past the `}`),
  so guard = `body.start + 1`, reset = `body.end` (or do-while `node.end`). The
  behavior oracle used recast (visual columns) and needed tab-aware offset math;
  acorn deletes that machinery entirely.
- **Highest-offset-first apply is load-bearing.** Splicing a lower offset first
  would shift every higher offset and invalidate the plan. No two insertions
  ever share an offset (a guard sits at an open-brace+1, a reset at a close
  position), so a stable sort is not required.
- **Consumer text spliced verbatim; loop-guard owns only the do-while `;`.** The
  do-while grammar force-terminates the statement after `)` (the ECMAScript
  do-while special ASI case), so the `;` is **redundant** belt-and-suspenders —
  it cannot fuse the reset into the `while` tail because the do-while is already
  complete at `)`. It is kept because it is harmless (an empty statement) and
  matches the oracle. The genuinely load-bearing do-while difference is the
  reset **offset** (`node.end`, not `body.end`).
- **Both guard AND reset are parameterized.** See § The two consumer forms — the
  intercept closure-counter reset must be a call, so the reset text cannot be
  hardcoded.
- **`loc` is the loop statement's own span**, not the body's — a limit trip is
  attributed to the loop, so the consumer receives the loop's location.

[interceptorder]: ../../embody/lib/evaluating/intercept/intercept.ts

## Testing posture

Pure, synchronous, data-in/data-out ⇒ **node tests only** (no worker, no
browser). Single-line, index/loc-encoding factory fakes make every assertion
check placement _and_ the no-newline invariant at once. Three gates pin fidelity
(see [DOCS.md § Regression gates][docs]):

- **Golden parity** reproduces the oracle's guard/reset text through the
  factories and reuses the oracle's `new Function` iteration-count table
  (`maxIterations ∈ {-1,0,1,3}`) to prove the acorn splice positions are
  behaviorally identical to the recast oracle.
- **Loc-value fixtures** assert the exact start/end line+column the guard
  factory receives — the parity suite can't, since the oracle's text carried no
  loc — for a multi-line-header loop, a tab-indented loop, and a nested loop,
  pinning that `loc` is the loop-statement span in acorn's 0-based-column
  convention.
- **Line-count + adjacency** asserts equal line counts across a multi-loop
  fixture and an adjacency fixture (nested, consecutive siblings, do-while last
  in an outer body), so the distinct-offset property the apply-sort relies on
  can't silently break.

## Navigation

- Parent: [`../README.md`](../README.md) — the package-level shared `lib/`
  (peer-independence rules).
- Behavior oracle (re-authored, **not** imported — tsconfig-excluded):
  [`guard-loops.ts`][oracle] and its
  [`DOCS.md`](../../embody/lib/evaluating/shared/guard-loops/DOCS.md).
- Structural template:
  [`instrument-variables.ts`](../../embody/lib/evaluating/trace/variables/instrument-variables.ts)
  — the acorn `.start`/`.end` string-splice pattern.
- The locked consumer contract this serves: [intercept Seam 4][interceptseam].
- [`./DOCS.md`](./DOCS.md) — the architectural sketch and `## Data flow`.
- [`./types.ts`](./types.ts) — the contract in TypeScript.
