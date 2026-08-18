<!-- cspell:ignore alikes callees forgeable instrumenter -->

# iteration-guard

The engine-backed evaluators' shared **iteration-guard semantics**: the
guard/reset call text spliced into a learner's loops, the worker-side helpers
that implement those calls, and the classification of the guard's own throw. The
package's shared [`loop-guard`][loopguard] leaf owns **where** the calls land
(loop discovery, verbatim splicing, line preservation); this module owns **what
the calls do** — count, check a cap, throw a marked error — and how a trip is
read back when the run halts.

## Where this sits

Region-internal shared machinery under [`evaluators/lib/`](../README.md),
consumed by the engine-backed evaluators (run, intercept): their assemblers call
the splice verb on the learner's source, and their worker setups install the
guard helpers and read the trip inside their halt serializers. Nothing outside
the evaluators region imports it.

It imports **down** into the package's shared [`lib/loop-guard`][loopguard] (the
one placement authority — this module authors call text and hands it to
`spliceLoopGuards`, never splicing on its own) and into nothing else. The danger
evaluator does not consume it: danger's substrate is a same-origin iframe realm
with its own `var` **counter globals** and its own classifier; this module is
the **worker-closure form** the engine-backed evaluators share.

## Why this module exists

run and intercept enforce the same iteration cap with the same worker helpers
and must classify the same trip when authoring their halts. Left per-evaluator,
three concerns drift independently: the spliced call text, the counter semantics
behind it, and the trip-reading rule. Centralizing them keeps one protocol — the
call text an assembler splices is implemented by the same module's helpers and
read back by the same module's verb, so the three can never disagree about
names, marker, or counter meaning. The house precedent is the shared
wrap-helper-name constant that keeps an instrumenter and its worker in sync;
here the coupled surface is wider — a helper name, an argument order, and a loc
encoding — so the whole call text is authored in one place.

## Ubiquitous language

- **iteration guard** — the whole discipline this module owns: guard calls
  spliced into every guarded loop, worker-closure counters behind them, a marked
  throw when a cap is exceeded, and classification of that throw at halt time.
- **guard call / reset call** — the spliced statements, in loop-guard's
  vocabulary. Here they are always the closure-counter **calls**
  `__$il(n, 'L:C:L:C');` (guard, at the top of a guarded loop's braced body) and
  `__$ir(n);` (reset, after the loop). The call text is authored here; its
  placement is loop-guard's.
- **guard helpers** — the two functions the worker setup injects so the spliced
  calls resolve: `__$il` (the guard) and `__$ir` (the reset). They ride the
  engine's injected-globals channel — `globals` is the engine's field name for
  that channel, which is why the returned record keeps it — and are distinct
  from danger's **counter globals** (`var loop1..loopK` declarations emitted
  into program text; a different mechanism for a different substrate). The `__$`
  prefix is the identifier collision guard: the names sit outside the admissible
  learner-identifier surface, so in-subset code never references or shadows them
  by accident — but the kind gate-guarantees parse and entwine, not subset
  validation, so a program CAN call a helper deliberately; the guard is against
  accident, and a deliberate garbage call degrades safely (see § Edge cases).
- **per-entry counter** — one counter per loop index, incremented by that loop's
  guard call and checked against the cap. The reset call zeroes it after the
  loop, so each **fresh entry** into a loop restarts its count — the cap is per
  loop entry, never a run total.
- **iteration count (run total)** — the never-reset count of every guarded-loop
  iteration across the whole run, incremented alongside every per-entry count
  and never zeroed by a reset. Read via `readIterationCount()` when a halt is
  authored, so every halt — natural, thrown, or tripped — carries a real count.
  It **includes** the tripping iteration: the guard increments before it
  compares.
- **cap** — the optional per-entry ceiling the guard enforces, delivered to
  `createIterationGuard` by the evaluator (its projection from the spec's
  `iterations` — this module never reads a spec). "Cap" is this module's one
  word for the concept; downstream surfaces spell it `iterations` (the spec
  field) and may spell a halt's trip flag differently — those are their names,
  mapped at their edges. Absent (`undefined`) → the helpers **count but never
  throw**. The comparison is `> cap`: a cap of `0` (or any negative) trips on
  the first pass; `Infinity` and `NaN` never trip — no finiteness validation
  lives here.
- **trip** — one guard call finding its per-entry count over the cap; the moment
  the marked limit throw is built and thrown.
- **marked limit throw** — the `RangeError` the guard throws on a trip. Its
  message is pinned contract, in the machine's own words:
  `Loop N exceeded M iterations.` (the behavior oracle's exact form —
  learner-visible, so its wording is design surface, not implementation detail).
  It carries the **trip record** under the marker key, is thrown inside the
  learner's running program, and propagates like any learner error — told apart
  from one only by the marker.
- **marker** — the single own property `__$iterationLimit`, defined on the
  marked throw at construction as **non-enumerable, non-writable,
  non-configurable**, whose value is the trip record. One key carries
  recognition and payload both, so no bare `loc`/`loopIndex` properties exist to
  collide with any other error stamper. Written at construction and never
  overwritten; any other instrumentation that stamps errors writes its **own**
  keys, first-write-wins. Non-enumerable so learner-facing inspection
  (`Object.keys`, spreads, JSON) never leaks instrumentation. The key lives in
  one shared constant both the stamp site and the classification import — never
  retyped.
- **trip record** — the marker's value: the tripped loop's 1-based index
  (loop-guard's dense reading-order id) and its decoded span,
  `{ loopIndex, loc }`.
- **loc string** — loop-guard's `'L:C:L:C'` encoding of the **loop statement's
  own span** (start line:column:end line:column; 1-based lines, 0-based
  columns), embedded in the guard-call text at splice time. It is **decoded at
  throw time** into a plain `{ start: { line, column }, end: { line, column } }`
  span (loop-guard's `LoopLoc` shape) carried in the trip record — clone-safe
  data, so a halt author reads a structured span directly and the string form
  never crosses the worker boundary.
- **classification** — the halt-time question "was this throw the guard's, and
  where did it trip?", answered by `readLimitTrip` inside an evaluator's halt
  serializer. This **is** the engine's consumer-owned limit classification (the
  engine's halt vocabulary deliberately has no `limit` kind); it lives
  worker-side, where the raw thrown value still exists — nothing downstream
  re-classifies, and no name or message text is ever inspected. Classification
  is **total by construction: the whole body rides one throw-guard** —
  accessor-safety (presence checked without invoking getters) narrows what the
  guard must catch, it is not the guard's boundary, so a thrown value whose very
  property inspection throws (a trapping proxy) is still `null`, never an
  escape. **Well-formed** means the full `LimitTrip` depth: a finite-number
  `loopIndex` and a `loc` carrying four finite line/column positions — anything
  less (missing fields, wrong types, non-finite numbers, a truncated span) is
  `null`.
- **halt serializer** — the engine's `serializeHalt` seam, where classification
  runs: worker-side, same realm as the throw, authoring the clone-safe halt
  payload. What that payload looks like is each evaluator's; see § Owns vs.
  excludes.

## The three verbs (the boundary)

- **`spliceIterationGuards(code) → GuardResult`** — authors the closure-counter
  call text (guard with the loop's loc string, reset without) and delegates
  placement to loop-guard's `spliceLoopGuards`. In: the learner's source,
  **before any column-shifting rewrite** (see § Design commitments — ordering).
  Out: loop-guard's `GuardResult`, passed through and imported from loop-guard —
  never re-declared — carrying the spliced source (line-for-line; `===` the
  input when no loops) and the guarded-loop count, which closure-counter
  consumers are free to ignore. Throws loop-guard's `LoopGuardError` on a
  malformed source, loudly; loop-guard's other failure, `multiline-injection`,
  is **unreachable through this verb** because the call text authored here is
  single-line by construction — an invariant of this module, not luck.
- **`createIterationGuard(cap?) → { globals: { __$il, __$ir }, readIterationCount }`**
  — builds one run's guard state: per-loop per-entry counters and the run total,
  closed over and **mutated in place**. `globals` is what a worker setup injects
  (named for the engine's injected-globals channel; its shape is declared here,
  structurally assignable to the engine's globals record — the engine's types
  are mirrored, never imported). `readIterationCount()` returns the run total
  for the halt author — it is **not** injected. The closure is this module's
  only mutable state, and it is per-run disposable: one call, one run, one
  closure.
- **`readLimitTrip(thrown) → LimitTrip | null`** — the classification verb: the
  trip record when the value carries a well-formed marker, `null` otherwise —
  `null` **is** the "not a trip" answer, so a consumer that only needs
  recognition checks for `null` and never touches the throw's properties itself.
  The record comes back **by reference** — the stamped object, never a copy,
  never re-frozen. Total over `unknown` and never throws: marker presence is
  checked without invoking accessors, the payload read rides a try/catch, and a
  malformed payload (a forged marker with garbage) is `null`, not an exception —
  a throw escaping the halt serializer would be a worker crash, which
  classification must never cause.

## Owns vs. excludes

### Owns

- The guard/reset **call text** (the `__$il`/`__$ir` statement forms, loc-string
  encoding included) and its delegation to loop-guard.
- The **helper semantics**: per-entry counters, the run total, the `> cap`
  check, the marked throw — its pinned message and its marker.
- The **marker shape, the trip record, and their classification verb**. The
  marker key and the record's field names never leave this module: consumers
  hold a `LimitTrip`, not a property path.

### Excludes

- **Placement.** Which loops are guarded (the guarded set), where text lands,
  line preservation — loop-guard's, entirely. This module never walks an AST.
- **The cap's origin and meaning.** Projecting a spec's `iterations` into a cap
  — including any validation, defaulting, or finiteness policy — is the
  evaluator's; this module takes the number it is given and compares.
- **Halt authoring.** What a halt payload looks like, which `LimitTrip` fields
  ride it and under what names, and what an unrecognized throw becomes are each
  evaluator's halt-serializer decisions. This module answers one classification
  and exposes one count.
- **Injection.** Delivering the helpers into the running program (the engine's
  injected-globals channel) is the evaluator's worker setup — but see § Design
  commitments: splice and inject are one obligation.
- **Wrapping other instrumentation.** The call-expression loc wrap (`__$lc`) is
  intercept's own instrumenter, not this module — the shared protocol here is
  exactly the pair every engine-backed evaluator needs.

## Edge cases

- **No cap ⇒ count-only.** `createIterationGuard()` with no cap counts per-entry
  and run totals but never throws — the run total on a natural halt is always
  real. "Absent" means `undefined` alone: `null` is not a valid cap and its
  handling (like all cap validation) is the evaluator's, upstream.
- **Cap `0` or negative ⇒ first-pass trip.** `1 > 0` on the first guard call;
  there is no "at least one iteration" grace. A cap of `N` permits **exactly N
  completed iterations** of a loop entry and trips before the (N+1)th body runs
  — the guard sits at the top of the body.
- **Cap `Infinity` or `NaN` ⇒ never trips.** `count > Infinity` and
  `count > NaN` are never true; no finiteness gate exists here.
- **A loop never entered** has a per-entry count of zero and contributes nothing
  to the run total; `__$ir` for an index that never incremented is a harmless
  zeroing.
- **Spliced but not injected ⇒ `ReferenceError` in every guarded loop.** Source
  that carries `__$il(...)` calls whose helpers were never delivered fails on
  the first iteration of the first loop, presented to the learner as their own
  error. See § Design commitments — the two verbs are one obligation.
- **Learner look-alikes pass through.** `readLimitTrip` is `null` for every
  learner throw — including a `RangeError` with the guard's exact message text,
  a hostile thrown value whose property access throws, and a trapping proxy
  whose very property inspection throws. Only a well-formed marker classifies.
- **A deliberate garbage helper call degrades safely.** `__$il` called
  out-of-protocol (a loc string that does not decode to four finite positions)
  still counts and still enforces the cap, but a trip throws a **plain**
  `RangeError` — pinned message, no marker — because a trip record is built only
  from a clean decode. The cap holds; the trip is simply unattributable and
  classifies as the program's own error.
- **No loops ⇒ identity.** `spliceIterationGuards` returns the source by
  reference (loop-guard's zero-loop contract) — guards, helpers, and caps are
  all inert on loop-free code.

## Design commitments

- **Structural classification, never message-matching.** `readLimitTrip` reads
  the marker key as an own property. Name/message inspection is forgeable by
  ordinary learner code (`throw new RangeError('…exceeded…')`). Honestly stated,
  the marker is **accident-proofing, not malice-proofing**: a property key is
  not identifier-guarded the way the `__$` helper _names_ are, so a program that
  deliberately writes a `__$iterationLimit` property can forge a trip — no
  learner does that by accident, and deliberate forgery is the sandbox's
  concern, not the classifier's. A string key is chosen over a module-scope
  symbol deliberately: with the payload private behind `readLimitTrip`, the
  symbol's extra strictness buys nothing, and the string stays greppable and
  devtools-visible.
- **The marker is one key, payload inside, non-enumerable, first-write.** No
  top-level `loc` or `loopIndex` properties are stamped on the error — the trip
  record lives under the marker key, so another error stamper (intercept's
  call-loc wrap stamps errors that propagate through wrapped calls) can never
  overwrite the loop span: each instrument writes only its own key,
  first-write-wins, and the guard's record is written at construction.
  Non-enumerable keeps instrumentation out of learner-visible enumeration.
- **The message is contract.** `Loop N exceeded M iterations.` — pinned verbatim
  (oracle parity; danger's classifier message-matches this same form, and the
  learner reads it). Classification never depends on it.
- **Decode at throw time.** The loc string is decoded into loop-guard's
  `LoopLoc` shape **when the marked throw is built**, worker-side, so the trip
  record is already clone-safe structured data. Halt serializers read the
  record; the `'L:C:L:C'` form never crosses the worker boundary.
- **Per-entry cap, run-total accounting — two counters, one increment site.**
  `__$il` increments both (increment, then compare — the tripping iteration is
  counted); `__$ir` resets only per-entry. The cap question ("did THIS entry run
  away?") and the accounting question ("how much work did the whole run do?")
  never share a counter.
- **The guard is a per-iteration hot path.** `__$il` runs on every iteration of
  every guarded loop: its steady-state path is O(1) and allocation-free — an
  in-place mutable counter store, allocating only on a loop's first-ever entry,
  never copy-on-write. This is the module's declared mutable-state exception
  (per-run disposable, closure-confined), and the accompanying lint disable is
  expected, with its justification comment. No loop-count parameter is taken:
  the store initializes lazily per loop index, so the splice result and the
  worker side stay uncoupled.
- **Always instrumented — a deliberate divergence from the behavior oracle.**
  The oracle skipped guard splicing entirely when no finite cap was set; here
  guards are spliced and helpers count on **every** run, cap or no cap, because
  the halt contract wants a real iteration count on every halt. The price is
  honest: an uncapped run pays one call and two counter writes per guarded
  iteration, and a pathological uncapped loop now spends that overhead until the
  engine's wall-clock budget ends the run. The rejected alternative — skip
  splicing when uncapped, zero overhead, no run total on natural halts — is
  recorded here so it is not "restored" as a fix.
- **Splice and inject are one obligation.** An evaluator that calls
  `spliceIterationGuards` MUST inject `createIterationGuard`'s helpers in its
  worker setup, and vice versa — half the pair is a `ReferenceError` in every
  guarded loop (see § Edge cases). The pairing lives inside each evaluator; this
  module keeps the two halves in one place so the pairing is one import.
- **Ordering is the consumer's, and guard-first is the rule.** The loc string is
  faithful to the learner's columns only if `spliceIterationGuards` runs on the
  **original source**. An evaluator that also rewrites calls (intercept) must
  splice guards first and keep its rewriter off `__$`-prefixed callees. The
  residual is stated honestly: the guard call spliced after a body's `{` shifts
  the columns of same-line body content, so a later rewriter computing spans
  from the guarded source inherits that shift on such lines — which is also why
  the compact `'L:C:L:C'` encoding matters: the guard text's **length** is part
  of the disturbance it causes. This module reports honest positions for the
  string it gets and cannot solve ordering for its caller.
- **One protocol, one home; the surface is the three verbs.** The call-text
  factories behind `spliceIterationGuards` are not consumer surface — house file
  conventions make them importable, but the README names the wrapper as the
  module's only splice-side entry, and pairing hooks with the splicer directly
  at an evaluator call site is a drift hazard this module exists to remove.
- **Per-run disposability.** An iteration-guard closure serves exactly one run;
  nothing is shared across runs, so counters can never leak between evaluations.

## Testing posture

Pure and synchronous throughout ⇒ **node tests only**. Call text is asserted
through the splice verb's exact-output pins (statement forms, loc-string
encoding) — the factories are non-surface (§ Design commitments), so the verb is
the only observable window onto them; loop-guard's own three gates already pin
placement, so placement is not re-covered here beyond one representative
pass-through. The guard state is driven directly as functions: counter
arithmetic, cap edges (`0`, negative, `Infinity`, `NaN`, absent), reset
isolation between loop indices, run-total monotonicity and its includes-the-trip
accounting, and the marked throw's shape (name, pinned message, non-enumerable
marker, decoded span, loop index). Classification is truth-tabled over marked
throws, learner look-alikes (matching name and message, no marker), malformed
markers (shallow objects, wrong types, non-finite positions), non-object values,
a **hostile thrown value** whose property access throws, and a **trapping
proxy** whose property inspection itself throws — the inputs that could
otherwise crash a worker. One test pins the first-write precedence rule: the
trip record survives a second stamper writing its own key onto the same error.
One compile-time probe pins the mirror: `globals` assigns to a plain readonly
string-keyed record, locking the structural-assignability claim against engine
drift. The helpers' behavior **inside a real worker** is each evaluator's
browser-tier evidence, not this module's.

## Navigation

- Parent: [`../README.md`](../README.md) — the region-internal shared `lib/`.
- Region: [`../../README.md`](../../README.md) — the evaluator kind this serves
  (`iterations` arrives on the evaluation spec).
- Placement authority: [`lib/loop-guard`][loopguard] — the splicer, its guarded
  set, and the locked `MakeGuard`/`MakeReset` hook contract; also the home of
  the `GuardResult` and `LoopLoc` types this module re-exports through its
  boundary rather than re-declaring.
- [`./DOCS.md`](./DOCS.md) — the architectural sketch and `## Data flow`.
- [`./types.ts`](./types.ts) — the contract in TypeScript.

[loopguard]: ../../../lib/loop-guard/README.md
