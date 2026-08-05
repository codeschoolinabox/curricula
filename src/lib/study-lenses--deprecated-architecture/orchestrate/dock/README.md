# dock

The omnipresent region's **run/debug controls surface**: a collapsible
affordance container holding the type toggle (+ adjacent script-mode hint), the
sandbox toggle, run limits, Run, Cancel, and the danger-only debugger option.
The orchestrator drives execution (the lazy half of the embody contract); the
dock configures the run and routes intent up. The run's **output no longer lives
in the dock** — the two channels render in the
[output panels](../output-panels/) beside the active surface (see
[`../README.md` § The output panels](../README.md)); the dock keeps only the
controls (run state + outcome still surface on the Run control).

The canonical design lives at [`../README.md` § The dock](../README.md) and
[`../README.md` § The omnipresent region](../README.md) — those sections are the
contract; this README is the module-local orientation.

## What lives here

```text
dock/
  README.md   (this)
  DOCS.md     architectural sketch + Mermaid
  index.tsx   <Dock> — presentation only
  tests/      vitest jsdom tests
```

## The component

`<Dock>` is **presentation only**: it renders what it is handed and routes
intent up. The orchestrator ([`../index.tsx`](../index.tsx)) owns every state
slot (source type, sandbox mode, run limits, collapse), the **run lifecycle**
(it invokes `evaluation.events.{run, intercept}` on the live embodiment and
accumulates the output), and the bus dispatch. This module imports no `embody`,
dispatches no bus events, and holds no orchestrator state. It never sees the
`Snippet` — only the derived run state and outcome cross the boundary (the
accumulated channel output now crosses to the output panels, not the dock).

Props (full contract in [`./index.tsx`](./index.tsx) JSDoc):

| Prop                    | What it carries                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `sourceType`            | current `SnippetType`; the type toggle's value                                     |
| `scriptModeHintVisible` | whether module-admissible code sits in script mode (orchestrator-derived)          |
| `sandboxMode`           | current `SandboxMode`; the sandbox toggle's value                                  |
| `dangerAvailable`       | whether the toggle offers the `danger` position (from `configs.orchestrator`)      |
| `runLimits`             | current `RunLimits` (seconds + iterations)                                         |
| `debuggerEnabled`       | danger-only; whether the debugger option is on                                     |
| `runState`              | the `DockRunState` transport phase (`idle` / `running` / `settled`)                |
| `outcome`               | `EndReportOutcome` or null — the last run's terminal classification                |
| `collapsed`             | the dock's display state                                                           |
| `on…` handlers          | type/sandbox/limit/debugger/run/cancel/collapse intent, routed to the orchestrator |

## Selectors (the stable test/sandbox surface)

Full list in [`../README.md` § Data attributes](../README.md). The dock's roots:
`data-orchestrator-dock`, `-dock-collapsed`, `-dock-type-toggle`,
`-dock-type-hint`, `-dock-sandbox-toggle`, `-dock-limit`, `-dock-debugger`,
`-dock-run`, `-dock-run-state`, `-dock-outcome`. Value-bearing attributes carry
the current value; tests anchor on attribute + value, never label text. (The
output channels' `-dock-channel` selector retired when the channels left the
dock for the output panels — now `data-orchestrator-output-channel`, see
[`../output-panels/`](../output-panels/).)

## Durable rules

- **Owns no backend.** The dock is a pure consumer of the orchestrator-run
  evaluate surface; the worker engine (and the deferred danger-iframe backend)
  sit behind the `EvaluateHandle` contract, off this module entirely. The dock
  never imports `embody` and never calls `evaluation.events.*` itself.
- **Renders the outcome verbatim.** `run()` serves any parsed snippet → a real
  outcome; `not-runnable` is the embody contract's below-parse signal. The dock
  renders whatever `outcome` it is handed, with no special-casing (no branching
  on `Snippet.source.code`, which the dock never sees anyway).
- **Danger-gated affordances are absent, not disabled.** The debugger option
  renders only when `sandboxMode === 'danger'` (and `dangerAvailable`); the
  danger toggle position is absent when `dangerAvailable` is false (mirrors the
  panel's "hidden = fully removed").
- **`run-state` and `outcome` are orthogonal.** `run-state` is the transport
  phase; `outcome` is the result, present only when `run-state` is `settled`.

## Navigation

- **Parent**: [`../README.md`](../README.md) — § The dock, § The omnipresent
  region, § Data attributes (the locked contract).
- **Sketch**: [`./DOCS.md`](./DOCS.md).
- **Evaluate contract**: [`../../embody/types.ts`](../../embody/types.ts)
  (`EvaluateHandle` / `RunInstance` / `EndReport` / `EvaluateOptions` /
  `IoMocks`) and [`../../embody/README.md` § Events](../../embody/README.md)
  (runnability tiers).
- **Dock value types**: [`../types.ts`](../types.ts) (`RunLimits`,
  `DockRunState`, `ChannelKind`, `EndReportOutcome`, `OrchestratorConfig`,
  `SandboxMode`).
