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

A module under [`lib/`][lib], a sibling of [`local-llm/`][local-llm] and
[`engine/`][engine]: the orchestrator reaches _down_ into it, it never reaches
up. It is **independent of the sibling engines** (`local-llm`, `engine`); its
one lateral dependency is the [`lib/loop-guard/`][guardloops] utility peer (§
Type ownership & dependency direction). It is emphatically **not** an
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
is realised **inside the D3 adapter**, which maps danger's outcome into the
`EvaluateHandle`'s `endReport.outcome` the orchestrator reads uniformly (not a
direct `setOutcome(result.outcome)`). Owning the union keeps the dependency
arrow honest (a `lib → orchestrate` type import would point the wrong way) and
documents, in one place, that `timed-out` / `failed` / `not-runnable` are
structurally unreachable on the bypass path.

The one dependency is **read-only** and lateral — the sibling
[`lib/loop-guard/`][guardloops] peer, whose `spliceLoopGuards(code, hooks)`
splicer the runner drives with its own guard/reset call-text factories (§ Design
commitments). "Lateral" not "up": both are `lib/` peers, so the arrow never
reaches into `embody/`. The peer re-homes the loop-guard off embody's
tsconfig-excluded legacy zone (where the older `guardLoops` verb still lives as
the oracle it was re-authored from); the runner creates and edits **nothing**
under `embody/`.

**INTERIM (2026-07-03, user-authorized ship-fast):** the shipped `dangerRun`
temporarily contradicts the paragraph above — it imports embody's legacy
`guardLoops` **directly** and applies a two-line, behavior-preserving type-fix
to `guard-loops.ts`, because `lib/loop-guard/`'s `spliceLoopGuards` typed error
boundary is still mid-TDD. Both the import and the type-fix revert on migration
to `spliceLoopGuards`. See the import comment in `danger-run.ts`.

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

[guardloops]: ../loop-guard/README.md
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
  counter rewrite the runner applies before eval by driving the
  [`lib/loop-guard/`][guardloops] peer's `spliceLoopGuards(code, hooks)` with
  its own `makeGuard`/`makeReset` call-text factories (§ Design commitments). A
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
  option, not a separate flag. `io` is danger's OWN **synchronous**
  `DangerIoMocks` (the user-I/O verbs `alert`/`confirm`/`prompt` AND `console`)
  — NOT embody's awaited `IoMocks`, so the orchestrator builds a DISTINCT sync
  danger builder (a shared `buildIoMocks()` is deliberately given up; § Type
  ownership). **Mocked** (`io` passed — e.g. the mobile / no-devtools path):
  `console` and `alert` render fire-and-forget in realtime, and
  `confirm`/`prompt` return a **sync-scripted / computed** answer; a sync mock
  cannot block for LIVE typed input, so live interactive dialogs stay **native**
  (leave the verb unset). **Native** (`io` absent, the desktop default): nothing
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
  unreachable here. A loop-guard trip is recognised by a **message-match
  predicate** (`name === 'RangeError'`, message includes `exceeded` and
  `iterations`, and only when `iterations` is set) over the `RangeError`
  danger's own `makeGuard` authors — an intra-module contract (danger writes the
  throw text and matches it) — and the runner emits the **public**
  `limit-exceeded` literal directly. The predicate mirrors embody's, which
  message-matches the same way.
- **Cancel** — the dock's Cancel, wired to the handle's `cancel()`: tear the
  iframe down and settle `cancelled` if the run has not already settled. It
  **cannot** interrupt a synchronous on-thread hang (the event loop never yields
  to run it) — only the loop-guard can break a _loop_.

## What it produces (the boundary)

- **In:** a raw code `string` (the editor buffer, verbatim — never a `Snippet`)
  and a {@link DangerRunOptions}: an optional `iterations` cap (forwarded to the
  loop-guard), an optional `debuggerEnabled` flag (the `debugger;` wrap), an
  optional sync `io` (danger's own `DangerIoMocks` —
  `alert`/`confirm`/`prompt` + `console`; passed ⇒ mocked, absent ⇒ fully
  native), a reserved `type` (`'script'` only — `<script type=module>` is out of
  scope, § Excludes), and the declaration-only `strict` flag (script-mode
  `"use strict";` toggle, default true). No `seconds` — that is a dock/UI
  concern (see § Owns vs. excludes).
- **Out:** a {@link DangerRunHandle} — `{ result, cancel }`. `result` is a
  Promise that resolves **once** (never rejects, never earlier than a macrotask)
  to a {@link DangerResult}: an `outcome`, plus an `error: { name, message }`
  present only when `outcome === 'errored'`. Console/dialog **output** is _not_
  in the result — it is native (`io` absent) or routed through the `io`
  callbacks (`io` passed); the result carries only how the run ended, so the
  dock's run-state and outcome badge render uniformly across danger and worker.

There is **one caller entry point**, `dangerRun(code, options)`, called directly
by the orchestrator's `handleRun` when `sandboxMode === 'danger'`. The
which-outcome resolution and the iframe lifecycle are internal to that verb.

**Integration (deferred Phase-1 wiring).** _SUPERSEDED by D3 (the adapter):_
danger no longer widens `handleReference` — it reaches the panel through the
adapter, which WRAPS the runner's handle into a uniform `EvaluateHandle`, so
`handleReference` stays `EvaluateHandle`. `handleRun` gains a
`sandboxMode === 'danger'` branch that calls `dangerRun(snippet, …)` with the
raw buffer. A `DangerRunHandle` is still a **narrower** shape than embody's
`EvaluateHandle` (`{ result, cancel }` — no `fail`, no `AsyncIterable`); the
adapter maps danger's top-level `result.outcome` into the `EvaluateHandle`'s
`endReport.outcome` the orchestrator already reads (one reader, not a branch at
every read site). This adapter wiring is the **only** `orchestrate/`-touching
edit; it lands after the runner is proven, and the runner still imports no
`orchestrate/` surface.

## Owns vs. excludes

### Owns

- **The iframe lifecycle** — creating a permissive same-origin iframe, building
  and injecting the `<script>`, wiring the `__danger` bridge, and tearing the
  iframe down on settle or cancel.
- **Loop-guard application** — driving the peer's
  `spliceLoopGuards(code, hooks)` with danger's own `makeGuard`/`makeReset`
  call-text factories (the `var`-global increment-and-throw and the reset, cap
  embedded) for the **iterations** limit, provisioning the `loop1..loopK`
  counter globals (`K` from the returned `loopCount`) the guard calls reference,
  inline on the prefix segment to preserve line numbers, and catching the peer's
  `LoopGuardError` (malformed source) → a pre-settled `errored` handle.
  Iterations only; the dock's seconds limit is a UI concern, not this engine's
  (see Excludes).
- **The `debugger;` wrap** — a pure `(code, enabled) => code` helper, folded in
  here (danger-only, so no separate `orchestrate/lib/debugging`).
- **Outcome classification** — mapping natural completion, a thrown error, a
  loop-guard trip, and a cancel to the four-member `DangerOutcome`, using a
  message-match _predicate_ over danger's own `makeGuard`-authored `RangeError`
  and emitting the public `limit-exceeded` literal.
- **Async-settle discipline** — never settling `result` during `dangerRun`'s own
  synchronous call frame, and never firing an `io` callback in that frame either
  (injection is deferred a tick; a mock's own return is still synchronous when
  it is later invoked — see § Design commitments and § Edge cases).

### Excludes

- **Parse, validate, create, the notional machine** — danger bypasses all of
  embody by design. It never builds a `Snippet` and imports no embody engine.
- **Sandboxing** — off-thread isolation and external terminate are exactly what
  danger drops. There is no Worker and no `SharedArrayBuffer`.
- **The dock and the output panels** — the runner reports an outcome and (in
  mocked mode) routes console + user-I/O lines through the sync `io` callbacks
  (`confirm`/`prompt` return a scripted answer; live typed dialogs stay native);
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
  is **no sentinel to disambiguate** — danger's `makeGuard` emits a plain
  `RangeError` (a sentinel would couple the peer to danger's classifier); embody
  message-matches the same way, so the trade is a deliberate, shared one.
- **The `loop1..loopK` counter globals** — danger's `makeGuard`/`makeReset` call
  text _references_ them (a `var`-global increment/reset); the peer's splicer
  does **not** declare them. The runner **must** emit
  `var loop1 = 0, …, loopK = 0` (`K` from the splicer's returned `loopCount`,
  never hardcoded) ahead of the code, or every loopy snippet throws a
  `ReferenceError` and mis-reports as `errored`.
- **Source that fails to parse** → the peer's `spliceLoopGuards` parses with
  acorn in the synchronous build and throws a `LoopGuardError` (`parse-failed`)
  _before_ the iframe exists. `dangerRun` catches it and returns a handle whose
  `result` is **pre-settled `errored`** — never a synchronous throw out of
  `dangerRun`, never a reject (the "returns a handle / never rejects" contract
  holds). Syntax-error classification thus happens in the build; the iframe's
  own `window.onerror` net then only ever matters for a throw the iframe's own
  parser rejects that acorn accepted.
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
- **A mocked `io` cannot pause the script for live input.** A passed
  `confirm`/`prompt` mock returns its value **synchronously** — a computed or
  scripted answer — because the `<script>` runs synchronously and cannot
  `await`; `console`/`alert` mocks render fire-and-forget in realtime. A sync
  mock **cannot block** the thread for a live styled-panel typed answer
  (blocking while pumping a UI is impossible in user-space JS). The asymmetry is
  deliberate and honest, not a defect: **the sandbox offers live STYLED dialogs
  (its Worker parks on a `SharedArrayBuffer` while an async mock resolves);
  danger offers live NATIVE dialogs (leave the mock unset → the real,
  thread-blocking `confirm`/`prompt`) OR sync-scripted / realtime-console mocked
  io** — never a live typed dialog the script waits on.

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
- **Result settles no earlier than a macrotask; no `io` callback fires within
  `dangerRun`'s own synchronous call frame.** A trivial snippet settles _during_
  `appendChild`; if that settle were synchronous, React would coalesce
  `setRunState('running')` and `setRunState('settled')` in one batch and the
  running state would never paint, and a synchronous `console.log` mirror would
  race the orchestrator's channel reset. Deferring the eval by a **macrotask**
  (`setTimeout`, not a microtask — a microtask drains before the browser paints,
  so `running` still would not commit) makes the run observably asynchronous and
  preserves both invariants. (The Worker path never hit this because
  `postMessage` was always async.)
- **Loop-guard via the peer's splicer (iterations only).** The runner drives the
  peer's [`spliceLoopGuards`][guardloops]`(code, { makeGuard, makeReset })`
  (pure, zero line-shift; returns `{ code, loopCount }`) for the **iterations**
  limit, authoring the two single-line call-text factories itself —
  `makeGuard(i, loc)` emits the cap-embedded `var`-global increment-and-throw
  `RangeError`, `makeReset(i)` emits the per-entry reset — and provisioning
  `loop1..loopK` from the returned `loopCount`; a trip → `limit-exceeded`, a
  malformed source → `LoopGuardError` → pre-settled `errored`. The dock's
  seconds limit is out of scope for this engine (see Excludes): the locked
  orchestrate README names a future per-iteration in-guard elapsed check for it,
  but that is an embody-owner-gated change, and a wall-clock `setTimeout` would
  be ineffective anyway (it cannot fire during a synchronous hang).
- **`debugger;` wrap is pure, guard-second, and line-preserving.**
  `wrapWithDebugger(code, enabled)` is a no-op passthrough when disabled. The
  guard rewrite runs **first** (on pure user source; zero line/column shift).
  The runner then builds the script to preserve the learner's line numbers
  exactly, mirroring embody's technique — the `"use strict"` (emitted when
  `strict`, the default), the `var loop1=0,…` counter globals, the `try {`, and
  (when enabled) the leading `debugger;` are all emitted on a single prefix
  segment **with no newline before the user code**, so user line _N_ stays
  script line _N_ (zero shift, not +1). The trailing `debugger;` and the
  `__danger.done()` call follow the last user line and shift nothing above them.
  Line fidelity matters because stepping _is_ the feature.
- **`io` presence is the mode (sync mocks).** `io` absent ⇒ nothing captured
  (clean stepping; real console + real native dialogs). `io` passed ⇒ the runner
  forwards `(message[, defaultValue])` to the
  `alert`/`confirm`/`prompt`/`console` mocks and returns each mock's SYNC return
  verbatim — danger defines no answer policy (a fixed/seeded/echoed answer is
  the caller's builder's business); so `confirm`/`prompt` return a scripted
  answer, a native-blocking typed dialog stays native (leave the verb unset),
  and console mirroring is fire-and-forget, also forwarded to native so
  USB/remote debugging still sees logs.
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
- **A passed `io` mock is learner-reachable code.** The sync mocks are
  `Object.assign`'d onto the iframe's `window` (§ Design commitments / DOCS.md §
  Execution phases), so the learner's own script — running in the SAME realm —
  can read or override `window.alert`/`confirm`/`prompt`/`console`. An accepted
  exposure, inseparable from same-origin injection (the same realm openness that
  makes the direct `__danger` bridge and native dialogs work).
- **The `__danger` bridge and `loop1..loopK` counters are on the same window.**
  They are assigned before the learner's script, in the same realm, so learner
  code can read/override/forge them: a top-level `__danger.done()` pre-empts the
  first-write-wins latch and masks a later real error (the badge would lie); a
  reassigned counter defeats its own guard (risking the freeze that is already
  the accepted danger). Accepted, inseparable from the same-realm injection that
  makes the direct bridge and native dialogs work — teaching-integrity-wise the
  learner only fools their own run.

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
  string transform), the script-builder (an optional `"use strict"` +
  counter-globals + `try/catch` assembly, line-preservation checked by asserting
  user line numbers are unshifted), and the outcome classifier (the RangeError
  message-match predicate) are data-in/data-out and fully ZOMBIES-coverable in
  Node.
- **The iframe runner is real-only** — a `*.browser.test.ts` (precedent:
  `local-llm`'s sandbox + `intercept/tests/*.browser.test.ts`) covers one case
  per transport-distinct settlement: `completed`, `errored`, `limit-exceeded`,
  `cancelled`. **STATUS (2026-07-03): this `*.browser.test.ts` is now BUILT and
  green (14 cases)**; only the eyeball harness for freeze / dialog / `debugger;`
  remains deferred.
- **The synchronous-hang freeze is not unit-testable** — asserting a frozen tab
  would freeze the test runner. It is a documented invariant, exercised only by
  hand behind `dangerAvailable`.

## Navigation

- Parent: [`../README.md`](../README.md) — the package-level shared `lib/` (what
  belongs here; independence from the sibling engines).
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
- The loop-guard splicer: [`lib/loop-guard/`][guardloops] — the `lib/` peer
  whose `spliceLoopGuards(code, hooks)` the runner drives with its own
  `makeGuard`/`makeReset` factories. Its oracle (the source it was re-authored
  from, never an import target) is embody's legacy
  [`shared/guard-loops/`](../../embody/lib/evaluating/shared/guard-loops/guard-loops.ts);
  the runner imports the peer and edits nothing under `embody/`.
- [`./DOCS.md`](./DOCS.md) — this module's architecture sketch and the deferred
  increment plan.
- [`./types.ts`](./types.ts) — the contract in TypeScript (the run options, the
  result, the mini-handle, and danger's own sync `io` mocks, `DangerIoMocks`).
