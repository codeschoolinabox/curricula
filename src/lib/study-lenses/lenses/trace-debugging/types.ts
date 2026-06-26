/**
 * @file Domain model for the `trace-debugging` harness lens. The lens runs
 * a learner's Just-Enough-JavaScript through the variables tracer (via the
 * `embodiment` prop's `evaluation.events.traceVariableLifecycle` method) and
 * dumps the streamed typed events plus the terminal settlement to the DOM,
 * with a Stop button and a seconds budget.
 *
 * Three layers (the lenses peer's two-layer convention plus one async seam):
 * - The pure-TS core (`./core.ts`) formats one event, derives the settlement
 *   display model, and formats an admission error. No React; no async.
 * - The async orchestration seam (`./run-trace.ts`) owns the call (channel-1
 *   `try/catch`), the for-await drain, the `await result` settle (channel 2),
 *   and idempotent cancel. Pure async; Node-testable against a fake handle.
 * - The React wrapper (`./index.tsx`) wires the click-kickoff Run, Stop, the
 *   seconds input, the three `<pre>` dumps, and the cleanup-cancel lifecycle.
 *
 * @remarks The trace types are imported TYPE-ONLY from `../../embody/types.ts`
 * (the lens's public contract surface — lens purity forbids runtime imports
 * from `embody/`). `InstrumentBoundaryError` is deliberately NOT among the
 * re-exports; the core detects it STRUCTURALLY (its `instrumentBoundary` brand),
 * never by a type import — see `./core.ts` `formatAdmissionError`.
 *
 * @remarks The sub-types `VariablesHalt` / `VariablesEngineError` /
 * `VariablesOutcome` are not individually re-exported by `embody/types.ts`;
 * `SettlementDisplayModel` reaches them via indexed access of the re-exported
 * `VariablesSettlement` (`VariablesSettlement['halt']`, etc.), which keeps the
 * lens pure without a deep import into the tracer tier.
 */

import type {
	VariablesTraceHandle,
	VariablesTraceEvent,
	VariablesSettlement,
} from '../../embody/types.js';

// ─── Run-state machine ──────────────────────────────────────

/**
 * The lens's UI lifecycle phase for a trace run.
 * - `idle` — no run kicked off yet (initial; also the reset target).
 * - `running` — the handle is live; events stream in; Stop is armed.
 * - `settled` — `await result` returned a settlement (channel 2), whatever its
 *   outcome (`completed` / `errored` / `cancelled` / `failed` / `timed-out`).
 * - `admission-error` — the call threw synchronously (channel 1); no run
 *   happened; the admission-error dump is shown.
 *
 * @remarks Named `TraceRunState` (not `RunState`) to avoid colliding with
 * `lib/engine`'s own `RunState` record. Cancel / timeout / error are settlement
 * OUTCOMES carried under the single `settled` phase — they are NOT separate
 * states (this mirrors the engine's own `idle | running | settled` phase model
 * one layer down). Only the pre-run synchronous throw is structurally distinct:
 * `admission-error` means no handle ever lived.
 */
type TraceRunState = 'idle' | 'running' | 'settled' | 'admission-error';

// ─── Settlement display model ───────────────────────────────

/**
 * The render-ready projection of a `VariablesSettlement` the core derives so
 * the React wrapper renders without re-deriving. Built fresh per settlement,
 * frozen. `outcome` round-trips the raw union; `headline` is a one-line human
 * summary; `detail` lines expand the carried halt / engineError / failReason.
 *
 * @remarks The raw `halt` / `engineError` / `failReason` are RETAINED (not
 * flattened to strings) so a verbatim `<pre>` dump of the settlement stays
 * faithful — `detail` is the readable gloss, not a replacement for the raw
 * data. This lens exposes no `fail()` control (Stop maps to `cancel()`), so the
 * `failed` outcome does not arise from user action, but the model handles all
 * five outcomes for faithfulness (a `failed` settlement from any source still
 * renders, with its `failReason`).
 */
type SettlementDisplayModel = Readonly<{
	/** The raw five-member outcome union, surfaced as-is. */
	outcome: VariablesSettlement['outcome'];
	/** One-line human summary, e.g. `errored — TypeError at $.body.1`. */
	headline: string;
	/** Expanded lines: halt fields, engineError cause/name/message, failReason. */
	detail: ReadonlyArray<string>;
	/** The worker-authored stop, when present (completed / errored); else null. */
	halt: VariablesSettlement['halt'];
	/** The engine-authored error, when the engine ended the run; else undefined. */
	engineError: VariablesSettlement['engineError'];
	/** The consumer fail reason, present only on a `failed` settlement. */
	failReason: VariablesSettlement['failReason'];
	/** Wall-clock duration the engine reported (capped at the seconds budget). */
	durationMs: number;
}>;

// ─── run-trace.ts orchestration seam ────────────────────────

/**
 * Thunk that performs the embody call. The seam wraps this in its channel-1
 * `try/catch`, so an admission throw is caught at the seam, not the React
 * wrapper. The wrapper closes the live `embodiment` and the resolved `seconds`
 * over this thunk before handing it to the seam.
 */
type StartTrace = () => VariablesTraceHandle;

/**
 * Mounted-guard predicate. The wrapper passes a ref-backed `() =>
 * mountedRef.current`; the seam checks it before every state-bearing callback
 * so a late event / settlement arriving after unmount is dropped (no
 * set-state-after-unmount).
 *
 * @remarks This gates the CALLBACK only — never the for-await pull. The drain
 * keeps pulling to completion regardless of mounted state (see {@link RunTrace}).
 */
type IsMounted = () => boolean;

/**
 * The seam's callbacks. All carry RAW data — formatting/derivation is the React
 * wrapper's call into `./core.ts`, keeping `run-trace.ts` free of display
 * concerns. `onAdmissionError` receives the caught throw verbatim (the wrapper
 * formats it via `formatAdmissionError`).
 */
type RunTraceCallbacks = Readonly<{
	/** One streamed event, in arrival order. Mounted-guarded. */
	onEvent: (event: VariablesTraceEvent) => void;
	/** The terminal settlement (channel 2). Mounted-guarded. */
	onSettlement: (settlement: VariablesSettlement) => void;
	/** The synchronous admission throw (channel 1), raw. Mounted-guarded. */
	onAdmissionError: (error: unknown) => void;
}>;

/**
 * The controller `runTrace` returns and the React wrapper stores in a ref.
 *
 * @remarks `cancel` is idempotent and null-safe: a no-op after settle, when the
 * run never started (a channel-1 throw), or on a second call — the engine's stop
 * is first-write-wins and `settle` is idempotent. Stop, the unmount cleanup, and
 * an embodiment-identity change all reach `cancel`.
 *
 * @remarks `runTrace` returns synchronously with the controller even though the
 * drain is async — the controller is available before the first event so Stop
 * can cancel immediately. `done` resolves after the drain completes AND
 * `onSettlement` has fired; the wrapper ignores it (`void`), tests await it for
 * determinism. `done` resolves on EVERY path and never rejects: the seam wraps
 * the drain in a `try/finally` whose cancel is **itself guarded** (the handle's
 * `cancel` is contracted idempotent but NOT no-throw — it forwards bare to the
 * engine's worker/iframe teardown — so a throwing cancel is swallowed) and which
 * catches callback throws — so the wrapper may ignore it without a `.catch`.
 */
type TraceController = Readonly<{
	cancel: () => void;
	done: Promise<void>;
}>;

/**
 * The orchestration-seam signature. Owns the call (channel 1), the for-await
 * drain (mounted-guarded append), the `await result` settle (channel 2), and
 * idempotent cancel.
 *
 * @remarks Load-bearing invariant: claiming the handle's async iterator imposes
 * backpressure, so an abandoned `for await` would hang the worker and leave
 * `result` pending forever. The drain MUST pull every event to `{ done: true }`
 * or route through `cancel()` (break-out == cancel) — it never early-returns out
 * of the loop without draining (a `try/finally` with a guarded cancel guarantees
 * this on any abnormal exit). The tracer's `result` getter re-maps the settled engine promise
 * on each access (a fresh `.then`), so the seam reads it exactly once — a
 * cleanliness discipline (avoid the redundant re-map), not a correctness need; a
 * second read would be harmless.
 */
type RunTrace = (
	start: StartTrace,
	callbacks: RunTraceCallbacks,
	isMounted: IsMounted,
) => TraceController;

// ─── Exports ────────────────────────────────────────────────

export type {
	TraceRunState,
	SettlementDisplayModel,
	StartTrace,
	IsMounted,
	RunTraceCallbacks,
	TraceController,
	RunTrace,
};
