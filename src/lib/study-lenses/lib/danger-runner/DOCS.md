# danger-runner — Architecture & Decisions

Vocabulary: [README.md § Ubiquitous language](./README.md). The honest limits of
on-thread execution: [README.md § Edge cases](./README.md). The security cost of
the same-origin/no-sandbox posture: [README.md § Security posture](./README.md).
The dependency-direction exemplar this module follows (own your contract;
consumers re-map): [`../local-llm/DOCS.md`](../local-llm/DOCS.md).

## Architectural Sketch

> Written Phase 0, before implementation. The Refactor step is held against this
> document — not what the code does, but what shape it takes.

The module answers one question — _how did the learner's raw code end when run
in a real browser window?_ — behind one verb, `dangerRun(code, options)`. It is
a **stand-alone procedure, not an embody engine**: it takes the raw editor
`string` and bypasses parse → validate → create → the Web-Worker sandbox,
because danger mode exists precisely to bypass that machinery (making it an
engine would force it to honour the `EvaluateHandle` contract whose purpose it
discards).

The sketch's point is a single seam: a **pure script-assembly core** (loop-guard
rewrite, counter-global emission, `debugger;` wrap, and the `try/catch` +
`__danger` bridge, all assembled line-preservingly into one script `string`) on
one side, and an **impure iframe lifecycle** (create a permissive same-origin
iframe, wire the bridge, inject the script, latch the settle, tear down) on the
other. Everything on the pure side is data-in/data-out and Node-testable; the
impure side is browser-only (a real `window`, real native dialogs, real
`debugger;`, synchronous `<script>` settlement) and has no faithful jsdom
analogue.

## Execution phases

1. **Build the script** (sync, pure) — input: the raw `code`, `iterations?`,
   `debuggerEnabled?`, `strict?`; output: one script `string`. Drive the peer's
   [`spliceLoopGuards`](../loop-guard/README.md)`(code, { makeGuard, makeReset })`
   → `{ code, loopCount }` for the iterations limit, passing danger's own
   single-line call-text factories (the `var`-global increment-and-throw
   `RangeError` with the cap embedded, and the per-entry reset); skipped when
   `iterations` is unset. Malformed source makes the splicer throw a
   `LoopGuardError` — caught here → a **pre-settled `errored`** handle (never a
   synchronous throw out of `dangerRun`). Assemble, on a **single prefix segment
   with no newline before the user code** (so user line _N_ stays script line
   _N_): the optional `"use strict";` (only when `strict`, the default — the
   sloppy path omits it), then `var loop1 = 0, …, loop{loopCount} = 0;` (from
   the returned `loopCount`), `try {`, an optional leading `debugger;`, the
   guarded user code, an optional trailing `debugger;`, and
   `window.__danger.done(); } catch (e) { window.__danger.fail(e && e.name, e && e.message); }`.
   (Classic `type: 'script'` path only; `type: 'module'` is out of scope — see §
   Structural constraints / § Out of scope.) Error identity is read **inside**
   the iframe realm (`e.name` / `e.message`) and handed out as primitives —
   never the live `Error` (cross-realm `instanceof` is unsound).
2. **Create the iframe + wire the bridge** (impure) — create a bare same-origin
   `<iframe>` with **no `sandbox` attribute** (`about:blank`), append it to the
   document (it must be _connected_ for native dialogs and `debugger;` to work;
   it may be visually hidden), and assign
   `contentWindow.__danger = { done, fail }` — plus, when `io` is passed,
   `Object.assign` the sync mocks onto `contentWindow` (per-method: a mocked
   `log` overrides while a native `warn` is kept by merging over the iframe's
   own `console`) — **before** the script is injected (a strict ordering
   invariant — the script settles the moment it runs).
   `done()`/`fail(name, message)` settle `result` through the classifier, behind
   a **settled latch** (first-write-wins).
3. **Inject + settle** (impure) — inject the `<script>` into the iframe's
   `contentDocument` **on a later tick** (a macrotask — `setTimeout`, not a
   microtask, which would drain before paint), so `result` settles no earlier
   than a macrotask. On the classic `type: 'script'` path the script runs to
   completion synchronously during `appendChild`, so `done`/`fail` fires before
   the append returns (the script's _synchronous_ run settles the outcome; any
   async continuation the snippet schedules fires post-settle and is
   outcome-invisible — README § Edge cases) — but the deferral means the
   orchestrator's `running` state paints first (a synchronous settle would
   coalesce `running` and `settled` into one React batch, so the running state
   would never paint). The **classifier** (`classifyDangerError`) maps a caught
   throw: a `RangeError` whose message `includes('exceeded')` &&
   `includes('iterations')`, **and only when `iterations` was set**, →
   `limit-exceeded` (the public literal; embody's internal `iteration-limit` is
   remapped upstream, not copied); every other throw → `errored` with
   `{ name, message }`.
4. **Teardown** — remove the iframe on settle or on `cancel()`. `cancel()`
   before settle removes the iframe and settles `cancelled`; after settle it is
   a no-op on the outcome (the latch). During a **synchronous hang** neither the
   settle nor `cancel()` can run — the tab freezes (the irreducible danger).

**Mocked vs native** is the _presence_ of `io`, not a flag: `io` PASSED ⇒ the
runner `Object.assign`s the sync mocks onto the iframe `window` (per-method
smart merge — a mocked `log` overrides, a native `warn` is kept) so the iframe's
`alert`/`confirm`/`prompt`/`console` route through the callbacks (to an
on-screen surface — e.g. a device without devtools); `console`/`alert` render
fire-and-forget, `confirm`/`prompt` return a sync-scripted answer, and a live
typed dialog stays NATIVE (leave the verb unset). `io` ABSENT ⇒ nothing captured
(real console, real devtools, real native dialogs), so `debugger;` stepping
shows the learner's own code with no mock frames. `io` is danger's OWN sync
`DangerIoMocks`, NOT embody's awaited `IoMocks`, so the orchestrator builds a
DISTINCT sync danger builder (the unified `buildIoMocks()` is deliberately given
up).

## Data flow

```mermaid
flowchart TD
    call[("handleRun (danger branch)<br/>raw code string + dock state")] -->|"dangerRun(code, {iterations, debuggerEnabled, io?, strict?})"| build{"build script, pure"}
    build -->|"spliceLoopGuards(code, {makeGuard, makeReset}) → {code, loopCount}<br/>emit var loop1..loopK · wrap debugger · try/catch + __danger<br/>(one prefix line, zero line-shift)"| script[("script string")]
    script -->|"create bare same-origin iframe (no sandbox attr)<br/>assign __danger + (if io) sync mocks on window BEFORE inject"| iframe{"iframe + bridge"}
    iframe -->|"inject &lt;script&gt; on a later tick<br/>(settle ≥ macrotask — running paints, no reset race)"| run{"script runs synchronously"}
    run -->|"__danger.done()"| ok[("outcome: completed")]
    run -->|"__danger.fail(name, message) → classify"| cls{"RangeError && iterations set<br/>&& msg exceeded+iterations?"}
    cls -->|"yes"| lim[("outcome: limit-exceeded")]
    cls -->|"no"| err[("outcome: errored + {name, message}")]
    iframe -.->|"cancel() before settle"| can[("outcome: cancelled")]
    run -.->|"synchronous hang"| froze(["no settle · tab frozen · cancel can't run"])
    ok --> res[("DangerResult (settle-latched, first-write-wins)")]
    lim --> res
    err --> res
    can --> res
    res -->|"result → D3 adapter → EvaluateHandle.endReport.outcome"| dock[("dock: run-state + outcome badge")]
    run -.->|"mocks route: console/alert realtime · confirm/prompt scripted return"| panels[("mocked surfaces: console + user-I/O")]
```

The synchronous-hang exit is not a `DangerOutcome` — it is a non-settling,
tab-freezing state, drawn dotted because it is the danger the gate exists for.
The three dotted edges are distinct off-happy-path routes — a pre-settle
`cancel`, the mocked-`io` side-effect, and the non-settling freeze — not one
category.

## Structural constraints

- **Main-thread + same-origin + no-SAB is the root fact.** It is what enables
  the synchronous readback (`contentWindow.__danger` assigned directly, no
  `postMessage`), the direct `io` mock routing, real natively-blocking dialogs,
  and real `debugger;` stepping — and it is equally the source of the
  async-settle discipline, the mocked-dialog constraint, and the freeze risk
  below. `local-llm`'s `CROSS_ORIGIN_ISOLATED = false` confirms no COOP/COEP/SAB
  is needed.
- **The iframe must be connected to the document.** A detached iframe will not
  run native dialogs / `debugger;` reliably; it is appended (possibly visually
  hidden) and removed on teardown.
- **`result` settles no earlier than a macrotask; no `io` callback fires within
  `dangerRun`'s own synchronous call frame.** The script injection is deferred a
  tick (a mock's own return, when it is later invoked on the deferred run, is
  still synchronous — that is a different axis from _when_ it fires). Without
  this, a trivial snippet settles synchronously → React coalesces `running` and
  `settled` (the running state never paints) and a synchronous `io` mirror races
  the orchestrator's `EMPTY_CHANNELS` reset. The Worker path never hit this (it
  always crossed `postMessage`).
- **The `loop1..loopK` counter globals are the runner's to emit.** Danger's
  `makeGuard`/`makeReset` call text references them (a `var`-global
  increment/reset); the peer's splicer does not declare them. `K` comes from the
  splicer's returned `loopCount`, never hardcoded. Miss them and every loopy
  snippet throws `ReferenceError` and mis-reports as `errored`.
- **Line preservation is the assembly's job.** The prefix (the optional
  `"use strict"`, counter globals, `try {`, and the leading `debugger;` when
  enabled) sits on one segment with no newline before the user code, so stepping
  and any future `error.line` correspond to the learner's editor exactly (zero
  shift, not +1).
- **The classifier is a message-match predicate, emitting the public literal.**
  `classifyDangerError(name, message, iterations)`:
  `name === 'RangeError' && iterations !== undefined && message.includes('exceeded') && message.includes('iterations')`
  → `{ outcome: 'limit-exceeded' }`; else
  `{ outcome: 'errored', error: { name, message } }`. Danger's `makeGuard`
  authors the `RangeError` text this predicate matches — an intra-module
  contract. No sentinel disambiguates it from a learner's identical `RangeError`
  (a sentinel would couple the peer's splicer to danger's classifier); embody
  message-matches the same way, so the accepted false-positive is a shared
  trade.
- **The settle-latch is first-write-wins across all four outcomes.** Whichever
  of `done` / `fail` / `cancel` reaches it first wins; the rest are no-ops. A
  post-settle async throw cannot change a latched outcome (it surfaces
  natively).
- **`io` presence is the mode (sync mocks).** `io` absent ⇒ native (real console
  with real native dialogs, clean stepping). `io` passed ⇒ the runner
  `Object.assign`s the sync mocks onto the iframe `window` and routes
  `alert`/`confirm`/`prompt`/`console` through the callbacks; `console`/`alert`
  mirror fire-and-forget (also forwarded to native so USB/remote debugging sees
  logs), `confirm`/`prompt` return a sync-scripted answer, and a live typed
  dialog stays native (leave the verb unset — a sync mock cannot block for typed
  input).
- **`type` is `'script'` only; module mode is out of scope.** The sync-settle
  mechanics — the synchronous `appendChild` run, the top-level
  `var loop1..loopK` window globals, and the direct `window.__danger` bridge —
  depend on a classic inline `<script>`. A `<script type=module>` is
  deferred/async and module-scoped, which breaks all three; rather than admit a
  value that silently breaks the contract, `type` is reserved as the single
  literal `'script'` (§ Out of scope names the module-mode redesign). `strict`
  toggles the `"use strict";` directive (default true).
- **The seconds limit is out of scope (a dock/UI concern).** The engine takes
  only the loop-guard `iterations` cap. The locked orchestrate README names a
  future per-iteration in-guard elapsed check for danger's seconds, but that is
  an embody-owner-gated change; a wall-clock `setTimeout` would be ineffective
  anyway (it cannot fire during a synchronous hang).
- **Imports: nothing from `orchestrate/`; the `lib/loop-guard/` peer's
  `spliceLoopGuards` read-only (embody's legacy `shared/guard-loops/` is only
  the oracle it was re-authored from).** `DangerOutcome` is hand-owned; its
  subset-assignability to `EndReportOutcome` is realised inside the D3 adapter's
  outcome mapping, not by a backwards import or a direct
  `setOutcome(result.outcome)`. **INTERIM (2026-07-03, user-authorized
  ship-fast):** the shipped `dangerRun` instead imports embody's legacy
  `guardLoops` directly (with a two-line behavior-preserving type-fix to
  `guard-loops.ts`) until `spliceLoopGuards`' typed error boundary lands; both
  revert on migration. See the import comment in `danger-run.ts`.

### Internal pure helpers (the pure side of the seam)

The pure side factors into three data-in/data-out helpers, their exact
signatures pinned in Phase 1: a **debugger-wrap transform** (a no-op when
disabled; otherwise `debugger;` above and below, line-preservingly); a **script
assembler** (an optional `"use strict"`, the counter globals, a `try/catch`, and
the `__danger` bridge, its counter count taken from the splicer's `loopCount`,
never hardcoded); and the **outcome classifier** (the message-match predicate
above).

## Deferred increment plan (Phase 1+ — gated on the human DDD gate; do not start)

1. **iframe core** — create/connect the iframe, inject the raw `<script>`, map
   natural completion → `completed` and a thrown/syntax error → `errored`,
   teardown, and the async-settle discipline. Standalone, browser-testable.
   Carries two triangulating cases — `completed` on a natural return and
   `errored` on a top-level throw — so the `try/catch` bridge cannot be faked to
   a constant.
2. **iteration guard** — drive the `lib/loop-guard/` peer's `spliceLoopGuards`
   with danger's own `makeGuard`/`makeReset` call-text factories, provision the
   `loop1..loopK` globals from the returned `loopCount`, catch `LoopGuardError`
   (malformed source) → pre-settled `errored`, and the `limit-exceeded` classify
   (the message-match predicate over danger's own `RangeError`). The peer
   already exists; this increment is danger's call-text factories + wiring.
3. **cancel/teardown** — `cancel()` + the settled latch.
4. **debugger wrap** — `wrapWithDebugger`, wired line-preservingly into the
   build.
5. **`io` mocks** — route the iframe's `alert`/`confirm`/`prompt`/`console`
   through the `io` callbacks when passed (native when absent).
6. **`handleRun` danger branch + adapter wiring** — the ONLY
   `orchestrate/`-touching increment: the `sandboxMode === 'danger'` branch, the
   D3 adapter that WRAPS the danger handle into a uniform `EvaluateHandle` (so
   `handleReference` stays `EvaluateHandle` — no widening) and maps danger's
   outcome into `endReport.outcome`, and passing a DISTINCT sync danger io
   builder as `io` when mocked (NOT the worker's `buildIoMocks()`). Deferred and
   coordinated (index.tsx is shared).

## Verification (deferred — named here, not built in Phase 0)

- **Pure helpers** — Node unit tests for `wrapWithDebugger`, `buildDangerScript`
  (assert user line numbers are unshifted), and `classifyDangerError` (the
  predicate and the accepted false-positive).
- **The iframe runner** — a `*.browser.test.ts` (precedent: `local-llm`'s
  sandbox and the `intercept/tests/*.browser.test.ts` suites), one case per
  transport-distinct settlement: `completed`, `errored`, `limit-exceeded`,
  `cancelled`. A `vite.sandbox.config.ts` (with `CROSS_ORIGIN_ISOLATED = false`)
  hosts an eyeball-test harness for the freeze/dialog/`debugger;` behaviours
  that cannot be asserted (a frozen tab would freeze the runner).
- **Docs** — `markdownlint-cli2` (the repo gate; line-length left to Prettier)
  and `prettier --check`.

## Out of scope

- **HTML hosting templates** — danger evaluates pure JS as a `<script>`; hosting
  a full HTML document is backlogged, not this surface.
- **The Worker path** — `sandboxMode === 'worker'` is embody's intercept engine,
  unchanged and not this module's.
- **Module mode (`<script type=module>`)** — a `type: 'module'` run has entirely
  different settlement mechanics (deferred/async, module-scoped: no top-level
  `var` counter globals, no synchronous `window.__danger` bridge), so `type` is
  reserved as the single literal `'script'` today. Admitting `'module'` and
  building its distinct guard/bridge/settle path is an explicit, separate
  decision, not this module's current surface.
- **Rendering** — the dock's run-state/outcome badge and the on-screen
  console/dialog surfaces are the orchestrator's / output-panels' to render; the
  runner reports an outcome and (mocked mode) emits io lines through the `io`
  callbacks.
- **The seconds limit** — a dock/UI concern, not the engine's; this utility
  takes no `seconds` option. Any future enforcement (the locked orchestrate
  README names a per-iteration in-guard elapsed check) is an orchestrate/embody
  matter.
- **Cross-origin isolation** — a `postMessage`-readback redesign that would
  trade the synchronous settle for a little more isolation is an explicit,
  separate decision, not this module's posture.
- **Deciding mocked-vs-native** — the heuristic (touch / no-devtools, or an
  explicit dock control) that resolves into whether the orchestrator passes `io`
  is the orchestrator's; the runner only sees `io` presence.
- **The embody/dock docs reconciliation** — naming this module in
  `intercept/README.md` and `dock/DOCS.md` is a separate, owner-gated change;
  this module only records the divergence (README.md § Supersedes note).

## Related

- [`./README.md`](./README.md) — what this module is (the one verb, the
  ubiquitous language, the security posture, owns vs. excludes).
- [`./types.ts`](./types.ts) — the contract in TypeScript (the options, the
  result, the mini-handle, and danger's own sync `io` mocks, `DangerIoMocks`).
- [`../../orchestrate/README.md`](../../orchestrate/README.md) §§ Danger mode /
  Run limits / Execution backends behind one contract — the locked product
  intent this implements behind.
- [`../../orchestrate/dock/DOCS.md`](../../orchestrate/dock/DOCS.md) — the
  reserved "deferred danger-iframe backend" slot this fills (the dock owns no
  backend).
- The loop-guard splicer — the [`lib/loop-guard/`](../loop-guard/README.md)
  peer's `spliceLoopGuards`, imported read-only and driven with danger's own
  `makeGuard`/`makeReset` factories; its oracle (re-authored from, never
  imported) is embody's legacy
  [`shared/guard-loops/`](../../embody/lib/evaluating/shared/guard-loops/guard-loops.ts).
  And [`intercept.ts`](../../embody/lib/evaluating/intercept/intercept.ts) —
  embody's own RangeError→`limit-exceeded` message-match this classifier
  mirrors.
- [`../local-llm/DOCS.md`](../local-llm/DOCS.md) and
  [`../engine/DOCS.md`](../engine/DOCS.md) — the stand-alone `lib/` exemplars
  (own your contract; browser-only transport fidelity).
