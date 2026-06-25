# trace-debugging

A harness/debug lens that runs a learner's Just-Enough-JavaScript through the
variables tracer — via the embodiment's
`evaluation.events.traceVariableLifecycle` method — and dumps the **streamed**
typed lifecycle events plus the terminal **settlement** to the DOM, with a Stop
button and a seconds budget. It is the readable proof that the tracer streams,
settles, cancels, and times out inside the real study-lenses UI. It is **not** a
pedagogical surface; treat it the way you'd treat a debug HUD.

## What this lens is

A [`LensModule`](../types.ts) like any other:

- `name`: `"trace-debugging"`
- `Component`: a React wrapper that, on a **Run** click, kicks off a trace run
  through the `embodiment` prop's `traceVariableLifecycle`, streams events into a
  `<pre>` dump, shows the settlement, and exposes **Stop** plus a **seconds**
  input.
- `config`: returns a frozen empty object by default; merging external overrides
  follows the same merge-and-freeze shape as [`debug-props`](../debug-props/).
- `applicableTo`: always `true`. Tier-1; the lens mounts against any `Snippet`.
  Admissibility is decided at **call time** (channel 1, below), not by
  `applicableTo` — so the lens stays mountable even on a snippet the tracer will
  reject. The embody method's JSDoc makes this explicit: its guard is inverted
  vs the NM tiers, so it says _"Guard with `try/catch` instead"_
  ([`../../embody/types.ts`](../../embody/types.ts) § `traceVariableLifecycle`).
- `recommend`: always `[]`. Recommender-inert; the lens never surfaces in the
  Q-II recommendations panel.
- `phase`: deliberately **ABSENT** — panel-excluded. The lens teaches no
  lifecycle phase and never appears in a phases-panel station dropdown; it stays
  registered and reachable via the `lens` prop, which is how sandbox harnesses
  mount it.

## Why this lens exists

The variables tracer
([`../../embody/lib/evaluating/tracers/variables/`](../../embody/lib/evaluating/tracers/variables/))
is complete and AR-5'd, and the embody surface now exposes it as
`traceVariableLifecycle` — a raw method returning the tracer's **own** typed
handle (not the `AnyNMEvent` adapter `trace.variables`). This lens is the
**first real UI consumer** of that handle. It exists to prove, in a real
cross-origin-isolated browser, that a learner program streams its variable
lifecycle, settles with an outcome, cancels on demand, and times out cleanly.

The streaming behaviour (rather than a one-shot `await result` dump) is a
deliberate, locked decision: the definition of done needs an **observable Stop**
and a **live timeout**, and only a streamed run can demonstrate cancel
mid-stream. This lens is **not** the polished prediction/quiz lens (a separate,
later pedagogical surface); it is the harness that makes the tracer legible.

## Glossary

The lens's ubiquitous language. Tracer-owned vocabulary (the six event
variants, _halt_, _engine error_, _value snapshot_) is **consumed, not
redefined** — see
[`../../embody/lib/evaluating/tracers/variables/README.md`](../../embody/lib/evaluating/tracers/variables/README.md).

- **Trace run** — one end-to-end consumption of a `VariablesTraceHandle`: the
  call, the streamed events, and the terminal settlement.
- **Run state** — the lens's UI lifecycle phase: `idle` (no run kicked off),
  `running` (handle live, events streaming), `settled` (a settlement arrived),
  `admission-error` (the call threw synchronously; no run happened). The exported
  type is `TraceRunState` (prefixed to avoid colliding with `lib/engine`'s own
  `RunState` record). `settled` covers all five settlement _outcomes_; only the
  pre-run synchronous throw lands in `admission-error`.
- **Streamed event** — one `VariablesTraceEvent` pulled from the handle's async
  iteration and appended verbatim to the events dump (one of the six lifecycle
  variants).
- **Settlement** — the terminal `VariablesSettlement` from `await result`: how
  the run ended (`completed`/`errored`/`cancelled`/`failed`/`timed-out`) plus
  the carried halt, engine error, and duration. Never a throw (channel 2).
- **Settlement display model** — the render-ready projection of a settlement the
  pure core derives: the outcome, a one-line headline, expanded detail lines,
  and the retained raw halt/engineError/failReason/duration.
- **Admission throw** — the synchronous throw at the `traceVariableLifecycle`
  call site on **inadmissible input** (channel 1): a canned scenario, non-JEJ
  source, unparseable source, or a JEJ-valid-but-unsupported construct. This is
  the embody method's own framing — _"inadmissible input … THROWS synchronously
  at the call"_ ([`../../embody/types.ts`](../../embody/types.ts) §
  `traceVariableLifecycle`). It **subsumes** the tracer's JEJ admission gate (the
  non-JEJ shape is one of the four); it is NOT a synonym for that validate-phase
  gate alone, nor for embody's `validation.isJeJ` admission.
- **Admission error (text)** — the formatted, human-readable string the lens
  shows for an admission throw.
- **Channel 1 / Channel 2** — the synchronous-throw error channel (caught by
  `try/catch` at the call) / the settlement channel (`await result`, which never
  throws).
- **Kickoff** — starting a trace run on a Run _click_, NOT in a `useEffect`
  (StrictMode double-invokes effects and would spawn two worker-backed runs).
- **Cancel** — tearing down a live run via `handle.cancel()`: idempotent, and
  reached by the Stop button, the unmount cleanup, and an embodiment-identity
  change. Breaking out of a `for await` is equivalent to cancel.
- **Drain** — the `for await` loop that pulls **every** streamed event to
  completion (each append guarded by a mounted check) and then awaits the
  result, leaving no undrained iterable behind — an abandoned claimed iterator
  would hang the worker.
- **Seconds budget** — the optional `{ seconds }` time limit forwarded to the
  call; an exhausted budget settles `timed-out`.
- **Fake handle seam** — a test double satisfying `VariablesTraceHandle` (an
  async generator plus a `result` promise plus `cancel`/`fail` spies, settling
  as `cancelled` on iterator return) — the Node-testability surface; no
  `vi.mock`.

## The contract this lens consumes

The lens is **pure** against the embodiment (see the lenses peer's
[§ Conventions](../README.md)): it touches the tracer **only** through the
`embodiment` prop, and imports the trace types **type-only** from
[`../../embody/types.ts`](../../embody/types.ts) (the public re-export surface).

- **Access path** —
  `embodiment.evaluation.events.traceVariableLifecycle({ seconds? })`, returning
  a `VariablesTraceHandle`. The `evaluation.events` route is the orchestrator
  convention.
- **Handle** — an `AsyncIterable<VariablesTraceEvent>` whose `result` getter
  resolves to `{ events, settlement }`, plus `cancel()` and `fail(reason?)`.
  Breaking the `for await` equals `cancel()`.
- **Two error channels:**
  - **Channel 1 (synchronous admission throw)** — the call throws at the call
    site on inadmissible input, so the call is wrapped in `try/catch`. Four throw
    shapes, with pairwise-disjoint detection: a plain `Error` whose message
    carries one of three stable prefixes (`canned scenario`, `not valid
    JavaScript`, `not Just-Enough-JavaScript`), or a structurally-branded
    `InstrumentBoundaryError` (carries an own `instrumentBoundary === true`
    discriminant and a `reason`). The boundary error is **not** on the embody
    re-export surface, so it is detected by its structural brand, never by a type
    import. **Detection order is load-bearing:** because `InstrumentBoundaryError`
    _extends_ `Error`, the structural brand is checked **first** and the three
    message prefixes **second** — otherwise a branded error whose message
    happened to contain a prefix substring would mis-route.
  - **Channel 2 (settlement)** — a run that proceeds ends only through `await
    result`, never by throwing. The settlement carries one of five outcomes;
    cancel and timeout are settlement _outcomes_, not errors. This lens exposes
    no `fail()` control (Stop maps to `cancel()`), so the `failed` outcome does
    not arise from user action — but the settlement display model handles all
    five outcomes faithfully (retaining `failReason`), so a `failed` settlement
    from any source still renders legibly.

## Public API

The default export is a `LensModule` whose `Component` accepts the standard
[`LensProps`](../types.ts):

```tsx
<TraceDebuggingLens.Component embodiment={frozenSnippet} config={resolvedConfig} />
```

The wrapper renders a root element carrying `data-lens="trace-debugging"` and a
set of stable harness/test selectors:

- `data-trace-control="run" | "stop" | "seconds"` — the interactive controls.
- `data-trace-dump="events" | "settlement" | "admission-error"` — the three
  `<pre>` output surfaces.

These selectors are stable; renaming or removing one is a contract change.

## How to navigate the code

- `index.tsx` — default export: the `LensModule` with the React `Component`.
  Owns the click-kickoff Run, the Stop/seconds controls, the three dumps, and the
  cleanup-cancel / cancel-on-embodiment-identity lifecycle.
- `core.ts` — pure-TS derivation: `formatEvent`, `deriveSettlementModel`,
  `formatAdmissionError`. No React, no async; testable in vitest without `jsdom`.
- `run-trace.ts` — the async orchestration seam: owns the call (channel-1
  `try/catch`), the drain, the settle (channel 2), and idempotent cancel. It
  exists for **Node-testability, not reuse** — see [`./DOCS.md`](./DOCS.md).
- `types.ts` — `TraceRunState`, `SettlementDisplayModel`, and the seam types.
- `tests/core.test.ts` — vitest, no jsdom. ZOMBIES coverage of the pure core.
- `tests/run-trace.test.ts` — the seam driven against a fake handle (no jsdom, no
  Worker).
- `tests/component.test.tsx` — vitest + jsdom + `@testing-library/react`. Drives
  the wrapper with a **faked `embodiment` prop** (no `vi.mock`).
- `tests/trace-debugging.browser.test.ts` — real Worker; drives the seam against
  a real `embody(<JEJ>)` embodiment for the four settlement classes.

## Conventions inherited

Follows all conventions in [`../README.md`](../README.md) and
[`../DOCS.md`](../DOCS.md). Notable inheritance:

- **Two-layer module shape**, here extended with one orchestration seam —
  `core.ts` (pure) + `run-trace.ts` (pure async) + `index.tsx` (React).
- **`data-lens="trace-debugging"` on the wrapper's root element** — load-bearing
  for sandbox harnesses.
- **`embodiment` parameter name** wherever a function takes a `Snippet`.
- **Disposable practice** — the lens cancels its run on unmount; no cross-mount
  state, no `localStorage`, no refs across mounts.
- **Read-only views** — the lens never mutates `embodiment` or `config`.
- **No branching on `embodiment.source.code`** — the lens forwards source to the
  tracer but never uses it as a branching key.
- **Display content is text, never markup** — dumps render via `<pre>`, never
  `dangerouslySetInnerHTML`.
- **Named function declarations** for multi-statement logic (block-bodied arrows
  are forbidden), and `Array.from(...)` over `[...iterable]` for Sets/Maps (a
  Babel-loose mistranspile only the production build catches).

## Navigation

- **Parent**: [`../README.md`](../README.md) — the lenses peer.
- **Architectural sketch**: [`./DOCS.md`](./DOCS.md).
- **Type contract**: [`./types.ts`](./types.ts).
- **Lens contract**: [`../types.ts`](../types.ts) — `LensModule` + `LensProps` +
  `LensConfig`.
- **Embodiment contract**: [`../../embody/types.ts`](../../embody/types.ts) — the
  `Snippet` the lens consumes and the `traceVariableLifecycle` method.
- **The tracer it ultimately drives**:
  [`../../embody/lib/evaluating/tracers/variables/`](../../embody/lib/evaluating/tracers/variables/).
- **Orchestrator that mounts this lens**:
  [`../../orchestrate/`](../../orchestrate/) — see § Public API for the
  `lens="trace-debugging"` dispatch path.
