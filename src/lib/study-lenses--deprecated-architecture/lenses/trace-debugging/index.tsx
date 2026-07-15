/**
 * @file React wrapper for the `trace-debugging` harness lens — default-exports
 * the `LensModule` the orchestrator's lens registry consumes. On a Run click the
 * wrapper closes the live `embodiment` and a parsed seconds budget into a `start`
 * thunk, hands it to the async seam (`./run-trace.ts`), and renders the streamed
 * lifecycle events, the terminal settlement, and any channel-1 admission error
 * into three `<pre>` dumps. The async lives entirely in the seam; this wrapper
 * holds RAW event / settlement / admission state and formats at render via
 * `./core.ts`.
 *
 * Tier-1 (`applicableTo: () => true`), recommender-inert (`recommend: () => []`),
 * and panel-excluded (no `phase`) by design — a harness / development surface,
 * not a pedagogical one. Renders a `<div data-lens="trace-debugging">` root with
 * the stable harness selectors `data-trace-control="run|stop|seconds"` and
 * `data-trace-dump="events|settlement|admission-error"`; dumps render as text in
 * `<pre>`, never `dangerouslySetInnerHTML`.
 *
 * @remarks Trace types are imported TYPE-ONLY from `../../embody/types.js` (lens
 * purity forbids a runtime import from `embody/`). The Run kickoff is a click,
 * NOT a mount effect — StrictMode double-invokes effects and would spawn two
 * worker-backed runs. The seam's controller `done` promise is intentionally not
 * referenced: it resolves on every path and never rejects, so the wrapper ignores
 * it (it lives inside the returned controller object, never floated).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';

import type {
	VariablesSettlement,
	VariablesTraceEvent,
	VariablesTraceHandle,
} from '../../../embody/types.js';
import type {
	LensConfig,
	LensModule,
	LensProps as LensProperties,
	Snippet,
} from '../types.js';

import traceDebuggingCore from './core.js';
import runTrace from './run-trace.js';
import type {
	RunTraceCallbacks,
	TraceController,
	TraceRunState,
} from './types.js';

/** Joins the streamed events into the events-dump text (one core line each). */
function renderEvents(events: ReadonlyArray<VariablesTraceEvent>): string {
	return events
		.map(function lineOf(event) {
			return traceDebuggingCore.formatEvent(event);
		})
		.join('\n');
}

/** Renders a settlement as the readable gloss (headline then detail lines). */
function renderSettlement(settlement: VariablesSettlement): string {
	const { headline, detail } =
		traceDebuggingCore.deriveSettlementModel(settlement);
	return [headline, ...detail].join('\n');
}

const TraceDebuggingComponent: ComponentType<LensProperties> =
	function TraceDebuggingComponent({ embodiment }) {
		const [runState, setRunState] = useState<TraceRunState>('idle');
		const [events, setEvents] = useState<ReadonlyArray<VariablesTraceEvent>>(
			[],
		);
		const [settlement, setSettlement] = useState<VariablesSettlement | null>(
			null,
		);
		// Holder: a thrown `undefined`/`null` is still "present", so presence is
		// read off `runState === 'admission-error'`, never the value's nullishness.
		const [admission, setAdmission] = useState<{
			readonly thrown: unknown;
		} | null>(null);
		const [seconds, setSeconds] = useState<string>('');

		const mountedReference = useRef<boolean>(false);
		const controllerReference = useRef<TraceController | null>(null);
		// Monotonic run generation: a run's callbacks no-op once a newer run (or a
		// remount) supersedes it, so a stale run's late settlement cannot clobber.
		const generationReference = useRef<number>(0);

		// Set true in this effect's body / reset false in THIS effect's cleanup, so
		// StrictMode's mount→unmount→mount leaves the live instance's ref `true`. The
		// cleanup also cancels a still-draining run, so unmount tears down its worker.
		useEffect(function trackMounted() {
			mountedReference.current = true;
			return function untrackMounted() {
				mountedReference.current = false;
				controllerReference.current?.cancel();
			};
		}, []);

		// The seam mounted-guards every callback, so these setters need no extra
		// guard. RAW data in; formatting happens at render.
		const callbacks = useMemo<RunTraceCallbacks>(function buildCallbacks() {
			return {
				onEvent(event) {
					// State is already `running` (set by handleRun before the run
					// started); appending is the only work here.
					setEvents(function append(previous) {
						return [...previous, event];
					});
				},
				onSettlement(incoming) {
					setSettlement(incoming);
					setRunState('settled');
				},
				onAdmissionError(error) {
					setAdmission({ thrown: error });
					setRunState('admission-error');
				},
			};
		}, []);

		function handleRun(): void {
			// Tear down a still-draining prior run before starting a new one (a
			// rapid re-Run): idempotent + a no-op when there is no prior or the
			// prior already settled, so it never races a clean run.
			controllerReference.current?.cancel();
			// Claim this run's generation; the prior run's `isMounted` now reads
			// false, so its late callbacks no-op instead of clobbering this run.
			generationReference.current += 1;
			const generation = generationReference.current;
			// Empty / non-numeric / ≤0 → OMIT the budget (never an error — the call
			// validates source, not the budget; `Number('')` is 0, hence `> 0`).
			const parsed = Number(seconds);
			const options =
				seconds.trim() !== '' && Number.isFinite(parsed) && parsed > 0
					? { seconds: parsed }
					: undefined;
			function start(): VariablesTraceHandle {
				return embodiment.evaluation.events.traceVariableLifecycle(options);
			}
			// Per-run mounted guard: gates the seam's callbacks on BOTH mount state
			// AND run identity, so a superseded run is fully gated off.
			function isMounted(): boolean {
				return (
					mountedReference.current && generation === generationReference.current
				);
			}
			setEvents([]);
			setSettlement(null);
			setAdmission(null);
			setRunState('running');
			controllerReference.current = runTrace(start, callbacks, isMounted);
		}

		function handleStop(): void {
			// Cancel settles the run `cancelled` (channel 2), which flows through
			// onSettlement; do NOT setState here (it would race the real settlement).
			controllerReference.current?.cancel();
		}

		function handleSecondsChange(
			event: React.ChangeEvent<HTMLInputElement>,
		): void {
			setSeconds(event.target.value);
		}

		const admissionText =
			runState === 'admission-error' && admission !== null
				? traceDebuggingCore.formatAdmissionError(admission.thrown)
				: '';

		return (
			<div data-lens="trace-debugging">
				<div>
					<button type="button" data-trace-control="run" onClick={handleRun}>
						Run
					</button>
					<button
						type="button"
						data-trace-control="stop"
						onClick={handleStop}
						disabled={runState !== 'running'}
					>
						Stop
					</button>
					<input
						type="number"
						data-trace-control="seconds"
						aria-label="seconds budget"
						value={seconds}
						onChange={handleSecondsChange}
					/>
				</div>
				<pre data-trace-dump="events">{renderEvents(events)}</pre>
				<pre data-trace-dump="settlement">
					{settlement === null ? '' : renderSettlement(settlement)}
				</pre>
				<pre data-trace-dump="admission-error">{admissionText}</pre>
			</div>
		);
	};

const traceDebuggingLens: LensModule = Object.freeze({
	name: 'trace-debugging',
	Component: TraceDebuggingComponent,
	config: function traceDebuggingConfig(
		overrides?: Partial<LensConfig>,
	): LensConfig {
		// Mirror debug-props: spread + freeze + cast (the freeze guards downstream
		// mutation; the cast acknowledges `Partial<LensConfig>` admits `undefined`
		// values that `LensConfig` does not — prevented at the call site).
		return Object.freeze({ ...overrides }) as LensConfig;
	},
	applicableTo: function traceDebuggingApplicableTo(
		_embodiment: Snippet,
	): boolean {
		return true;
	},
	recommend: function traceDebuggingRecommend(_embodiment: Snippet) {
		return [];
	},
});

export default traceDebuggingLens;
