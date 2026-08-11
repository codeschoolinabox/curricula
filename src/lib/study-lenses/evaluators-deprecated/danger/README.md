# danger

The real-window evaluator. **danger** runs a learner's program in a **live,
same-origin iframe** — a real `window` with real native dialogs and a real
`debugger;` — and reports only how the run ended. It is the one evaluator whose
execution substrate is a live window rather than an off-thread worker; that
substrate is danger's whole identity, and its whole cost. A real window gives
real `alert`/`confirm`/`prompt`, a learner's own `debugger;` as a real
breakpoint, and real global scope — and, being on the main thread, it can be
frozen by a synchronous runaway the way a killable worker never is.

danger is consumed by the run lens, which zones danger's iframe as execution
substrate (not a rendered view). Like **run**, danger emits **no events** — its
whole output is the settlement.

## What lives here

```text
evaluators/danger/
  README.md      this file — what danger runs, how, for whom
  DOCS.md        why danger — decisions + its own data flow
  index.ts       the Evaluator object (default export)
  types.ts       danger's settlement details (it publishes no event union)
  backend/       the real-window runner: builds the injectable program, runs it
                 in the iframe, latches the outcome (copied from the quarry, then
                 grown for module mode; never imported across the copy)
  tests/         behavior tests over the stream + real-iframe browser tests
```

## What danger observes — nothing, until it ends

danger publishes **no event union** and never a **pending interaction**: its
real window answers its own dialogs, so there is no suspend-and-respond moment
for the stream to carry. Its whole output is the **settlement** — how the run
ended:

- **clean** — the program ran to its natural end.
- **error** — a terminal failure, in the machine's own `{ name, message }`
  words, plus danger's own `reason` discriminant (below). Engine-forced stops
  land here too: a loop-guard trip and a wall-clock timeout are errors, not a
  separate arm.
- **canceled** — the consumer stopped pulling (its lens unmounted); teardown
  resolves this arm.

**danger's richer error.** The kind's settlement error floor is
`{ name, message }` and the kind explicitly lets an evaluator carry a richer
error (imported by consumers who want it). danger does: its error also carries a
`reason: 'threw' | 'loop-cap' | 'timeout'`, mapped one-to-one from the backend
outcome. Without it, a loop-cap `RangeError` is indistinguishable from a
learner's own `RangeError`, and a timeout cannot be rendered as "timed out." The
run lens reads `reason` to render the arms distinctly; a consumer that only
reads the floor still sees a faithful `{ name, message }`. (A `SyntaxError` in
the assembled program surfaces as `threw` — only reachable as an assembler
defect, since `facts` are gate-guaranteed already parsed.)

## The two run modes

danger poses a program one of two ways, chosen by the **execution axis** the
consuming lens supplies. The two modes are **distinct build-and-settle paths**
that happen to share one iframe, one runaway-loop guard, and one outcome latch:

- **script mode** — the program is a classic, global-scope `<script>`: the
  learner's `var`/`function` declarations are real `window` globals, and the
  program runs **synchronously** the moment it is injected. Its natural end and
  any thrown error are reported by a wrapping `try/catch` bridge; a program that
  fails to _parse_ surfaces on the window `error` event. This is danger's
  original, battle-tested posture.
- **module mode** — the program is an inline `<script type="module">`: it runs
  **deferred and asynchronously**, its top level is module-scoped, and it may
  use `import` and top-level `await`. A module's `import`/`export` must stay
  top-level, so it **cannot** be wrapped in the script mode's `try/catch`
  bridge. Module mode therefore reports its end through **four distinct
  channels**:
  1. **natural end** — a sentinel the assembler appends as the module's last
     top-level statement runs only after all top-level code (and any _resolved_
     top-level `await`) → clean.
  2. **synchronous throw** — a module-evaluation throw (including the loop-guard
     `RangeError`) skips the sentinel and surfaces on the window **`error`**
     event → error.
  3. **rejected top-level `await`** — surfaces on the window
     **`unhandledrejection`** event (**not** `error`), read as the run's error.
     Missing this channel would mis-report a learner's real error as a timeout.
  4. **wall-clock timeout** — a run that never ends on its own (below).

  **Imports.** Because it is a real inline module in a real document, `import`
  resolves against the iframe document's base URL: **full-URL** specifiers
  always; **relative** specifiers once danger gives the iframe a real base (not
  `about:blank`). **Bare** specifiers (`import 'lodash'`) need an import map —
  **deferred**, not in this build.

### The execution-axis mapping

The kind's execution axis is `'function' | 'module'`
(`EvaluationSpec.execution`). danger maps its two modes onto that axis with **no
change to the kind contract**:

| `spec.execution` | danger mode | posture                                          |
| ---------------- | ----------- | ------------------------------------------------ |
| `'function'`     | script      | classic **global-scope** `<script>`              |
| `'module'`       | module      | inline **module-scope** `<script type="module">` |

The consuming lens sets `execution` coherently with the snippet type
(`facts.type`: `'script' → 'function'`, `'module' → 'module'`); danger's
applicability assumes that coherent pairing and does not re-validate it.

**A learner-visible divergence, stated plainly.** The execution engine defines
`execution: 'function'` as a `new Function` **function scope** (top-level
`var`/`function` are _locals_). danger poses `'function'` as a classic **global
scope** (top-level `var`/`function` are _real `window` globals_). Same axis
value, materially different observable behavior: `var x = 1; alert(window.x)`
prints `undefined` under an engine-backed evaluator and `1` under danger. This
is **not** the kind's strict-vs-sloppy collapse (which is semantically
invisible) — it is a real scope divergence, **forced** by danger's substrate:
the copied `<script>` backend _is_ global scope, and the loop-guard's
`loop1..loopK` counters _require_ top-level scope. It is accepted, and named
here so no consumer assumes uniform scope across evaluators. danger does no
`new Function` or `eval`; its two postures are script and module, nothing else.

## Backend capabilities (danger-owned, not on the spec)

Three concerns live on the backend's own options, not on `EvaluationSpec` — the
kind contract stays untouched:

- **io** — **io mocks** (`console`/`alert`/`confirm`/`prompt`) may be installed
  on the window _before_ the program runs, the same before-inject assignment
  that wires danger's own outcome bridge. Unmocked verbs stay **native** (real
  blocking dialogs). **The io mocks MUST be synchronous** — this is a hard
  constraint, not a convenience: danger runs a real synchronous `<script>`,
  which cannot `await`, so a promise-returning mock would coerce to
  `[object Promise]` at the call site. A mocked `confirm`/`prompt` therefore
  returns its scripted answer **directly** (a plain value), never a `Promise`;
  the mock type encodes this (no `| Promise` arm). Their role here is
  **deterministic browser tests**; rendering a program's I/O to the four
  audiences is **intercept's** job (danger emits no events), not danger's.
- **debugger** — danger's "real `debugger;`" identity is that a learner's
  **own** `debugger;` is a real breakpoint (a live window, unlike a worker) — it
  needs no injection. Separately, the backend can **bracket** a run with
  injected `debugger;` statements (step-from-the-top); that bracketing is an
  **opt-in** backend option, **default off** — not silently always-on.
- **wall-clock timeout** — a seconds budget (default 5) bounds a run that never
  ends on its own. A module suspended on a never-settling top-level `await`
  leaves the thread free, so the timeout fires, settles a `timeout`-reason
  **error**, and tears the window down. It **cannot** rescue a _synchronous_
  freeze — no timer preempts a frozen main thread; only the loop-guard breaks
  that (see Rules).

## How danger satisfies the kind contract

- **name** — `'danger'`.
- **applicability** — **permissive and pure over the spec**: danger runs
  whatever it is handed; applicability reads only the spec, never the ambient
  environment. (Whether a `document` exists is answered at `main`, as a refusal
  — below — not by applicability, which must stay pure so the options list is
  not environment-dependent.)
- **main** — returns a **lazy** evaluation stream: nothing runs when `main` is
  called; the backend run starts when the consumer **first pulls** the stream.
  danger emits no events, so the first pull starts the run, awaits it, resolves
  the companion `settled` promise, and completes the iterator. The stream is a
  **hand-rolled async iterator**, not an async generator: with zero events there
  is a single, run-length `.next()`, and an async generator's `.return()` would
  queue _behind_ that in-flight pull — so `main`'s iterator instead calls the
  backend's `cancel()` **out of band** on `.return()`, which settles the backend
  and thereby resolves the pending pull as canceled. Prompt cancellation of a
  long-but-live async module depends on this. When `main` structurally cannot
  run (no `document` — server-side), it returns a **refusal**, never a throw.
- **settlement mapping** — the backend's terminal outcome maps onto the kind's
  settlement, one-to-one: natural end → clean; a throw / loop-cap / timeout →
  error (with the matching `reason`); cancel → canceled.

## Rules danger obeys

Every rule in the [region README](../README.md#rules-every-evaluator-obeys)
holds. danger's own emphases:

- **Real window, not a view.** danger's iframe is execution substrate the run
  lens zones; danger draws no view and owns no rendered DOM of its own.
- **Main-thread facts, read directly.** danger runs on the main thread, so it
  reads `spec.facts.source.value` directly — no clone-safe projection (that rule
  is for off-thread backends). It narrows any derived stage it reads once, per
  the region's gate-guaranteed rule.
- **The outcome bridge is forgeable, and that is accepted.** the program shares
  danger's window, so a learner could overwrite the bridge danger calls to
  report its end; this is the same accepted exposure the classic `<script>`
  posture has always carried — documented, not defended against.
- **A synchronous freeze is irreducible.** the loop-guard breaks braced runaway
  loops; an unbraced `for(;;)`, deep recursion, or any synchronous non-yielding
  hang freezes the tab, and no cancel or timeout can run. This is the price of
  the real-window substrate — the execution engine pays a killable worker to
  avoid it; danger does not, by design.

## Prerequisite

danger drives the **`lib/loop-guard/`** shared leaf. That leaf is ported from
the quarry into greenfield as danger's **first increment**, _before_ any danger
code imports it. danger never imports the loop guard from
`--deprecated-architecture/` (an up-into-the-quarry arrow-direction violation) —
the port is the prerequisite, not an interim shim.

## Glossary — danger terms

The [package glossary](../../README.md) and the
[region glossary](../README.md#glossary--region-terms) own the shared meanings;
these add danger's own. Note the **backend seam**: the backend speaks of a run's
**outcome**; the kind speaks of a **settlement**. They name the same thing at
two layers — `main` maps outcome → settlement.

- **real window** — the same-origin, no-`sandbox`-attribute iframe danger
  injects the program into: real `window`, real native dialogs, real
  `debugger;`. Not a rendered view — execution substrate.
- **script mode / module mode** — danger's two postures for a program: a classic
  global-scope `<script>` (synchronous), or an inline `<script type="module">`
  (deferred, module-scoped, `import`/top-level-`await`-capable).
- **outcome bridge** — the pair of functions danger installs on the window
  before the program runs, by which the program reports its natural end (or, in
  script mode, a caught throw) back to danger.
- **outcome latch** — the first-write-wins gate that fixes the run's terminal
  outcome: whichever of natural-end, a surfaced throw, the timeout, or a cancel
  reaches it first wins; the rest are inert.
- **reason** — danger's error discriminant (`threw` | `loop-cap` | `timeout`),
  carried on the settlement's error above the kind's `{ name, message }` floor.
- **io mocks** — synchronous stand-ins for `console`/`alert`/`confirm`/`prompt`,
  installed on the window before the run; unmocked verbs stay native.
- **wall-clock timeout** — the seconds budget that settles an otherwise-endless
  run as a `timeout`-reason error and tears the window down.

## Navigation

- Region: [`../README.md`](../README.md) — the evaluator kind's mechanics ·
  [`../DOCS.md`](../DOCS.md) · [`../types.ts`](../types.ts) — the kind contract.
- [`DOCS.md`](./DOCS.md) — danger's decisions + its own data flow.
- [`types.ts`](./types.ts) — danger's settlement details.
- Shared leaf: [`../../lib/loop-guard/`](../../lib/loop-guard/) — the
  runaway-loop guard danger drives (ported as danger's first increment; see
  Prerequisite).
