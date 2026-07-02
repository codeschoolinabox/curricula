# danger-runner

A **stand-alone danger runner**: it takes the **raw editor buffer (a `string`)**
and evaluates it as a real `<script>` in a real-window iframe on the **main
thread**, **deliberately bypassing [embody][embody]'s parse → validate → create
→ Web-Worker sandbox entirely**. It is the execution backend behind the dock's
already-locked `SandboxMode = 'danger'` toggle — the thing that gives a learner
what a Web Worker structurally cannot: a real `window`, native blocking
`alert`/`confirm`/`prompt`, and real `debugger;` devtools stepping.

The consent is in the name. Danger runs on-thread and is not externally
terminable, so a hung run **can freeze the host page** — the runner is gated
behind the educator-level `dangerAvailable` config and offered under the honest
label "danger". It is _limited_ (it keeps the loop-guard instrumentation), just
not _sandboxed_ (it drops the Worker's off-thread isolation and external
terminate). "Danger" ≠ "anything goes".

[embody]: ../../embody/README.md

## Where this sits

A **peer-independent** module under [`lib/`][lib], a sibling of
[`local-llm/`][local-llm] and [`engine/`][engine]: the orchestrator reaches
_down_ into it, it never reaches up. It is emphatically **not** an
[`embody/lib/evaluating/`][evaluating] engine. An embody engine satisfies the
`Execution` / `EvaluateHandle` / `RunInstance` contract and routes through the
Worker + `SharedArrayBuffer` machinery; **danger mode exists to bypass exactly
that machinery**, so making the runner an engine would force it to honour a
contract whose whole purpose it discards. The honest shape is a stand-alone
procedure the orchestrator calls directly with the raw `string` — not a
`Snippet` embodiment.

It is equally **not** an [`orchestrate/lib/`][orchlib] analysis helper. That
directory's locked input shape is `embodiment: Snippet` first-parameter,
**read-only, never executes user code**; the danger runner is asynchronous
_execution with side effects_ (iframe lifecycle, console capture, outcome
reporting) over a raw `string`. Analysis-not-execution is the reason; the
`embodiment`-first rule is only the symptom.

The structural precedent is [`local-llm/`][local-llm]: where a stand-alone
study-lenses lib lives, how its dev harness is bundled (a
`vite.sandbox.config.ts` with `CROSS_ORIGIN_ISOLATED = false`, which is itself
the proof that this iframe needs **no** COOP/COEP/SAB), and its browser-test
posture. **Honesty note:** that precedent is _structural only_. `local-llm`'s
`sandbox.html` is a dev eyeball-test _page_, not a runtime iframe — `local-llm`
creates no iframes and sends no `postMessage`. The iframe DOM-lifecycle
mechanics here are **genuinely novel** to this module (the sibling `engine/`
isolates with Workers, not iframes); this README does not borrow a mechanism
that does not exist.

[lib]: ../README.md
[local-llm]: ../local-llm/README.md
[engine]: ../engine/README.md
[evaluating]: ../../embody/lib/evaluating/README.md
[orchlib]: ../../orchestrate/lib/README.md

## Type ownership & dependency direction

This module **owns its contract and depends on no consumer.** It defines its own
run options, its own result, and its own mini-handle; the orchestrator imports
them and wires them into the dock's props. The dependency arrow points **down**,
from `orchestrate/` into this `lib/` module, never up — exactly as
[`local-llm`][local-llm] owns `LoadedModel` / `LoadFailure` and consumers
re-map.

The runner **imports nothing from `orchestrate/`.** Its terminal-outcome type,
`DangerOutcome`, is a hand-owned narrow union — the subset of the dock's
`EndReportOutcome` a danger run can actually produce (`completed` | `errored` |
`limit-exceeded` | `cancelled`). Subset-assignability to the dock's full union
is checked **for free at the orchestrator**, where `setOutcome(result.outcome)`
flows the value into `EndReportOutcome | null`. Owning the union keeps the
dependency arrow honest (a `lib → orchestrate` type import would point the wrong
way) and documents, in one place, that `timed-out` / `failed` / `not-runnable`
are structurally unreachable on the bypass path.

The one **read-only** reach _sideways_ is [`guardLoops`][guardloops] from
`embody/lib/evaluating/shared/`: the runner imports it as a pure source-rewrite
utility (see § Design commitments) but creates and edits **nothing** under
`embody/`.

> **Supersedes note.** The dock DOCS reserve this exact slot — "the deferred
> danger-iframe backend … named, not built"
> ([`orchestrate/dock/DOCS.md`][dockdocs] §§ Owns no execution backend / Out of
> scope). This module fills it. It also **supersedes the _placement_** implied
> by [`intercept/README.md`][interceptreadme] ("Worker + SAB for run/trace,
> iframe for debug"), which reads as though an iframe "debug engine" would live
> _inside_ embody satisfying the embody contract. It does not: it lives here,
> stand-alone. That intercept note still **corroborates** the core claim — the
> iframe path needs no SAB (a Worker does, because a Worker has no `window`).
> Reconciling the embody/dock docs to name this module is a separate,
> embody/dock-owner-gated change; this README only records the divergence.

[guardloops]: ../../embody/lib/evaluating/shared/guard-loops/guard-loops.ts
[dockdocs]: ../../orchestrate/dock/DOCS.md
[interceptreadme]: ../../embody/lib/evaluating/intercept/README.md
[orchreadme]: ../../orchestrate/README.md

## Purpose

**Run the learner's raw code as-written, in a real browser window, and report
how it ended — nothing more.** The runner owns a single verb,
`dangerRun(code, options)`, and everything past "did it complete, error, hit the
loop limit, or get cancelled" is out of scope:

1. **Give what a Worker cannot.** A Web Worker has no `window`, so embody must
   intercept `alert`/`confirm`/`prompt`, route them to the main thread, and
   pause the Worker on a `SharedArrayBuffer` (needing COOP/COEP). A real-window
   iframe has real, natively-blocking dialogs and real `debugger;` stepping
   **for free — no SAB, no pause machinery.** That freedom _is_ danger mode.
2. **Stay limited, not sandboxed.** The runner keeps the loop-guard iteration
   instrumentation (a runaway loop still trips `limit-exceeded`) and reports a
   dock-visible outcome. What it drops is the _sandbox_: off-thread isolation
   and external terminate. The residual — a synchronous non-loop hang that
   freezes the tab — is the irreducible danger, and it is the point.

Judging the code — is it valid, in-subset, worth showing — is not this module's
concern; danger deliberately runs code embody would refuse.

## Ubiquitous language

- **Danger run** — one evaluation of a raw code `string` in a bare iframe via
  `dangerRun`. Not an embody run: no parse, no validate, no create, no
  `Snippet`, no Worker, no `EvaluateHandle`. It produces a {@link DangerResult},
  not a `RunInstance`.
- **Danger mode** — the dock's `SandboxMode = 'danger'` toggle position that
  selects this backend. "Mode" here is the sandbox toggle position, not the
  orchestrator's editor/lens mode.
- **On-thread / non-terminable** — the precise meaning of "no sandbox": the code
  runs on the host's main thread with no off-thread isolation and no external
  terminate. This is why native dialogs block natively and `debugger;` steps —
  and why a synchronous hang freezes the host page. It is _not_ "unlimited": see
  loop-guard.
- **Loop-guard (kept as instrumentation, not sandbox)** — the per-iteration
  counter rewrite ([`guardLoops`][guardloops]) the runner applies before eval. A
  runaway loop throws and maps to `limit-exceeded`. Instrumentation is what
  danger _keeps_; the Worker thread is the sandbox it _drops_. The two are
  deliberately distinct.
- **The `__danger` bridge** — a tiny `{ done, fail }` object the runner assigns
  onto the iframe's `window` **before** the script runs. The injected script
  calls `__danger.done()` on natural completion or
  `__danger.fail(name, message)` in a top-level `catch`; those callbacks settle
  the result. Same-origin makes this a direct assignment — no `postMessage`.
- **Run limits (iterations only)** — the runner enforces the dock's
  **iterations** cap via the imported loop-guard (a trip → `limit-exceeded`).
  The dock's **seconds** limit is a dock/UI concern, not the engine's — this
  utility takes no `seconds` option (see § Owns vs. excludes).
- **Output mode (mocked vs native)** — chosen by the _presence_ of the `io`
  option, not a separate flag. `io` is shaped to **match embody's `IoMocks`**
  (the user-I/O verbs `alert`/`confirm`/`prompt` AND `console`), so the
  orchestrator's one `buildIoMocks()` builder feeds both backends. **Mocked**
  (`io` passed — e.g. the mobile / no-devtools path): the runner routes the
  iframe's `alert`/`confirm`/`prompt`/`console` through these callbacks to the
  on-screen surfaces. **Native** (`io` absent, the desktop default): nothing
  captured — real `console`, real devtools, real native dialogs — so `debugger;`
  stepping shows the learner's own code with no mock frames.
- **Debugger wrap** — the danger-only affordance that wraps the snippet with a
  `debugger;` statement above and below, so a learner with devtools open steps
  straight into their program; inert without devtools. Line-preserving (§ Design
  commitments), and loop-guard instrumentation stays deliberately **visible** in
  the stepped source — navigating a guard in the debugger teaches what a guard
  is.
- **Outcome** — the terminal classification the runner reports back: `completed`
  | `errored` | `limit-exceeded` | `cancelled`. A subset of the dock's
  `EndReportOutcome`; the rest of that union is worker/parse-specific and
  unreachable here. A loop-guard trip is recognised by embody's **message-match
  predicate** (`name === 'RangeError'`, message includes `exceeded` and
  `iterations`, and only when `iterations` is set), and the runner emits the
  **public** `limit-exceeded` literal directly — embody's internal
  `iteration-limit` is remapped upstream and is not copied here.
- **Cancel** — the dock's Cancel, wired to the handle's `cancel()`: tear the
  iframe down and settle `cancelled` if the run has not already settled. It
  **cannot** interrupt a synchronous on-thread hang (the event loop never yields
  to run it) — only the loop-guard can break a _loop_.

## What it produces (the boundary)

- **In:** a raw code `string` (the editor buffer, verbatim — never a `Snippet`)
  and a {@link DangerRunOptions}: an optional `iterations` cap (forwarded to the
  loop-guard), an optional `debuggerEnabled` flag (the `debugger;` wrap), and an
  optional `io` matching embody's `IoMocks` (`alert`/`confirm`/`prompt` +
  `console`; passed ⇒ mocked, absent ⇒ fully native). No `seconds` — that is a
  dock/UI concern (see § Owns vs. excludes).
- **Out:** a {@link DangerRunHandle} — `{ result, cancel }`. `result` is a
  Promise that resolves **once** (never rejects, never earlier than a microtask)
  to a {@link DangerResult}: an `outcome`, plus an `error: { name, message }`
  present only when `outcome === 'errored'`. Console/dialog **output** is _not_
  in the result — it is native (`io` absent) or routed through the `io`
  callbacks (`io` passed); the result carries only how the run ended, so the
  dock's run-state and outcome badge render uniformly across both backends.

There is **one caller entry point**, `dangerRun(code, options)`, called directly
by the orchestrator's `handleRun` when `sandboxMode === 'danger'`. The
which-outcome resolution and the iframe lifecycle are internal to that verb.

**Integration (deferred Phase-1 wiring).** `handleRun` gains a
`sandboxMode === 'danger'` branch that calls `dangerRun(snippet, …)` with the
raw buffer. Because a `DangerRunHandle` is a **narrower** shape than embody's
`EvaluateHandle` (`{ result, cancel }` — no `fail`, no `AsyncIterable`), the
orchestrator's `handleReference` slot widens to hold either, and the
orchestrator adapts danger's top-level `result.outcome` **up** to the same
`{ outcome }` reader it already uses for the worker's
`runInstance.endReport.outcome` (one reader, not a branch at every read site).
This wiring is the **only** `orchestrate/`-touching edit; it lands after the
runner is proven, and the runner still imports no `orchestrate/` surface.

## Owns vs. excludes

### Owns

- **The iframe lifecycle** — creating a permissive same-origin iframe, building
  and injecting the `<script>`, wiring the `__danger` bridge, and tearing the
  iframe down on settle or cancel.
- **Loop-guard application** — running [`guardLoops`][guardloops] over the code
  for the **iterations** limit and emitting the `loop1..loopK` counter globals
  the guard references but does not declare (see § Edge cases), inline on the
  prefix segment to preserve line numbers. Iterations only; the dock's seconds
  limit is a UI concern, not this engine's (see Excludes).
- **The `debugger;` wrap** — a pure `(code, enabled) => code` helper, folded in
  here (danger-only, so no separate `orchestrate/lib/debugging`).
- **Outcome classification** — mapping natural completion, a thrown error, a
  loop-guard trip, and a cancel to the four-member `DangerOutcome`, using
  embody's message-match _predicate_ but emitting the public `limit-exceeded`
  literal.
- **Async-settle discipline** — never settling `result` synchronously and never
  invoking an `io` callback synchronously within the `dangerRun(...)` call (see
  § Design commitments).

### Excludes

- **Parse, validate, create, the notional machine** — danger bypasses all of
  embody by design. It never builds a `Snippet` and imports no embody engine.
- **Sandboxing** — off-thread isolation and external terminate are exactly what
  danger drops. There is no Worker and no `SharedArrayBuffer`.
- **The dock and the output panels** — the runner reports an outcome and (in
  mocked mode) routes console + user-I/O lines through the `io` callbacks;
  _rendering_ run-state, the outcome badge, and the on-screen console/dialog
  surface is the orchestrator's and the output-panels module's. The runner
  imports no React and no `orchestrate/` surface.
- **The seconds limit** — a dock/UI concern, not the core danger engine's
  function: this utility takes no `seconds` option. Whether and how the dock's
  seconds field is ever enforced for danger — the locked [orchestrate
  README][orchreadme] names a future per-iteration in-guard elapsed check — is
  an orchestrate/embody matter, not this module's. (A wall-clock `setTimeout`
  would be ineffective anyway: it cannot fire during a synchronous hang.)

## Edge cases (the honest limits)

Danger has no domain "refusals" — it runs whatever string it is handed. Its edge
cases are the **honest limits of on-thread execution**, each of which the design
names rather than hides:

- **A synchronous non-loop hang** (e.g. `while (true) {}` with an empty body
  still has a body and _is_ guarded; but `for (;;) ;`, unbounded recursion, or
  `"x".repeat(1e12)`) → the tab **freezes**. `result` never settles, `cancel()`
  cannot run (the event loop never yields), and no on-thread timer can fire.
  This is the irreducible danger, gated by `dangerAvailable` + the name. The
  loop-guard catches _loops_, not this.
- **A runaway guarded loop** → the loop-guard throws
  `RangeError("Loop N exceeded M iterations.")`, classified to `limit-exceeded`.
  **Only applies when `iterations` is set** — with no cap the guard is not
  applied and any `RangeError` is genuinely the learner's, classified `errored`.
- **No `iterations` cap is a library affordance, not a live dock path.** The
  dock caller always supplies `runLimits.iterations` (a non-optional `number`),
  so the "no cap" branch above is a library/test affordance and the classifier's
  `iterations`-set gate — not a state the current product path reaches. The
  option stays optional so the runner is usable/testable standalone.
- **A learner who literally throws `RangeError("… exceeded … iterations")`** → a
  documented, accepted false-positive: it classifies as `limit-exceeded`. There
  is **no sentinel to disambiguate** — the guard throws a plain `RangeError` and
  a sentinel would require editing `guardLoops` (forbidden); embody itself
  message-matches, so this module inherits that exact trade.
- **The `loop1..loopK` counter globals** — `guardLoops` _references_ them but
  does **not** declare them (embody's Worker setup emits them). The runner
  **must** emit `var loop1 = 0, …, loopK = 0` (K from the guard's returned
  `loopCount`, never hardcoded) ahead of the code, or every loopy snippet throws
  a `ReferenceError` and mis-reports as `errored`.
- **A settled run, then Cancel** — a synchronous run settles _during_
  `appendChild`, before any human can click; a later `cancel()` is a no-op on
  the outcome (a settled latch, first-write-wins) and merely removes an inert
  iframe.
- **A stray async throw** (e.g. the learner's own
  `setTimeout(() => { throw … })`) fires _after_ the synchronous script has
  already settled; the first-write-wins latch means it **cannot change** the
  settled `DangerOutcome`. It surfaces natively (devtools/console) like any
  uncaught error — it is **not folded into the outcome**. (The iframe's own
  `window.onerror`, installed before eval, only ever matters for a throw that
  beats the settle, which the top-level `try/catch` already covers — so async
  throws are outcome-invisible by design.)

## Design commitments

- **Bypass is the point; limited-not-sandboxed is the discipline.** The runner
  drops parse/validate/create and the Worker sandbox, but keeps the loop-guard
  instrumentation and a dock-visible outcome. Dropping the guard would be a
  defect.
- **Same-origin, permissive, main-thread iframe — no COOP/COEP/SAB.** A bare
  `<iframe>` with **no `sandbox` attribute** (`about:blank`) gives a real
  `window`, natively-blocking dialogs, and real `debugger;` stepping. A
  locked-down `<iframe sandbox=…>` is rejected: without `allow-modals` it
  suppresses native dialogs, and containment kills the real-window/debugger
  behaviour that is the whole purpose. `CROSS_ORIGIN_ISOLATED = false` (as in
  `local-llm`) confirms no SAB is needed. The security cost is stated in full
  below.
- **Result settles no earlier than a microtask; `io` callbacks never fire
  synchronously within `dangerRun(...)`.** A trivial snippet settles _during_
  `appendChild`; if that settle were synchronous, React would coalesce
  `setRunState('running')` and `setRunState('settled')` in one batch and the
  running state would never paint, and a synchronous `console.log` mirror would
  race the orchestrator's channel reset. Deferring the eval by a microtask/task
  makes the run observably asynchronous and preserves both invariants. (The
  Worker path never hit this because `postMessage` was always async.)
- **Loop-guard reused read-only (iterations only).** The runner imports
  [`guardLoops`][guardloops] (pure
  `(code, maxIterations) => { code, loopCount }`, zero line-shift) for the
  **iterations** limit; a trip → `limit-exceeded`. The dock's seconds limit is
  out of scope for this engine (see Excludes): the locked orchestrate README
  names a future per-iteration in-guard elapsed check for it, but that is an
  embody-owner-gated change, and a wall-clock `setTimeout` would be ineffective
  anyway (it cannot fire during a synchronous hang).
- **`debugger;` wrap is pure, guard-second, and line-preserving.**
  `wrapWithDebugger(code, enabled)` is a no-op passthrough when disabled. The
  guard rewrite runs **first** (on pure user source; zero line/column shift).
  The runner then builds the script to preserve the learner's line numbers
  exactly, mirroring embody's technique — the `"use strict"`, the
  `var loop1=0,…` counter globals, the `try {`, and (when enabled) the leading
  `debugger;` are all emitted on a single prefix segment **with no newline
  before the user code**, so user line _N_ stays script line _N_ (zero shift,
  not +1). The trailing `debugger;` and the `__danger.done()` call follow the
  last user line and shift nothing above them. Line fidelity matters because
  stepping _is_ the feature.
- **`io` presence is the mode.** `io` absent ⇒ nothing captured (clean stepping;
  real console + real native dialogs). `io` passed ⇒ the runner routes
  `alert`/`confirm`/`prompt`/`console` through the callbacks; console mirroring
  also forwards to native so USB/remote debugging still sees logs.
- **Outcome is the only mandatory report.** `DangerResult` carries an `outcome`
  and, for the errored case, `{ name, message }` **primitives** — never the live
  `Error` (the iframe realm has its own `RangeError`; a cross-realm `instanceof`
  in the parent is unsound, so error identity is read _inside_ the iframe and
  passed out as primitives). Console/dialog output is native or routed through
  `io`, never piped into the result.

## Security posture

Same-origin + permissive + main-thread is **strictly more exposure than the
Worker path**, and the design says so plainly rather than claiming an isolation
it does not have:

- The iframe shares the parent's origin, so learner code reaching
  `window.parent` / `window.top` has **full host DOM access and same-origin
  storage** — cookies, `localStorage`, any LMS session on the page. It can _read
  and mutate host state_, not merely hang the tab.
- A synchronous hang **freezes the host page**, and nothing on-thread can
  recover it (the loop-guard catches loops only).

These are accepted, not mitigated away, because they are inseparable from the
real-window/debugger behaviour danger exists to provide. The mitigations are
honest scoping, not containment: the `dangerAvailable` educator config
**defaults off**, so danger is an opt-in an educator grants; the "danger" label
carries the consent; and the README-level expectation is set that the page may
freeze. A `sandbox`-attributed iframe is _not_ a mitigation here — it would
defeat the feature. If future isolation is wanted without losing native
dialogs/debugger, that is a cross-origin redesign (a `postMessage` readback,
losing the synchronous settle) and an explicit, separate decision — not this
module's posture.

## Testing posture

The runner's real surface is **browser-only**: a real `window`, real native
dialogs, real `debugger;`, and synchronous `<script>` settlement have no
faithful jsdom analogue. The test boundary follows [`engine/`][engine] and
[`local-llm`][local-llm]: a green Node fake is evidence for _logic_, never for
the real transport.

- **Pure helpers are unit-tested without a browser** — `wrapWithDebugger` (pure
  string transform), the script-builder (the `"use strict"` + counter-globals +
  `try/catch` assembly, line-preservation checked by asserting user line numbers
  are unshifted), and the outcome classifier (the RangeError message-match
  predicate) are data-in/data-out and fully ZOMBIES-coverable in Node.
- **The iframe runner is real-only** — a `*.browser.test.ts` (precedent:
  `local-llm`'s sandbox + `intercept/tests/*.browser.test.ts`) covers one case
  per transport-distinct settlement: `completed`, `errored`, `limit-exceeded`,
  `cancelled`. This is **deferred verification named in `DOCS.md`**, not built
  in Phase 0.
- **The synchronous-hang freeze is not unit-testable** — asserting a frozen tab
  would freeze the test runner. It is a documented invariant, exercised only by
  hand behind `dangerAvailable`.

## Navigation

- Parent: [`../README.md`](../README.md) — the package-level shared `lib/` (what
  belongs here; peer-independence).
- Structural exemplar: [`../local-llm/README.md`](../local-llm/README.md) — a
  stand-alone `lib/` runtime and the doc/dependency-direction template (own your
  contract; consumers re-map). Note its `sandbox.html` is a dev harness, not a
  runtime iframe.
- Sibling isolator: [`../engine/README.md`](../engine/README.md) — the generic
  sandboxed evaluator that isolates with a Worker (the path danger deliberately
  is _not_).
- The locked contract this implements behind:
  [`../../orchestrate/README.md`](../../orchestrate/README.md) §§ Danger mode /
  Debugger option / Run limits / Execution backends behind one contract, and
  [`../../orchestrate/dock/DOCS.md`](../../orchestrate/dock/DOCS.md) (the
  reserved "deferred danger-iframe backend" slot this fills).
- Read-only utility: [`guardLoops`][guardloops] — the pure loop-guard rewrite
  the runner applies (importing fine; editing embody not).
- [`./DOCS.md`](./DOCS.md) — this module's architecture sketch and the deferred
  increment plan.
- [`./types.ts`](./types.ts) — the contract in TypeScript (the run options, the
  result, the mini-handle, the `io` mocks matching embody's `IoMocks`).
