/**
 * @file Dev smoke harness for the `trace-debugging` lens. Mounts the lens's React
 * `Component` DIRECTLY with a REAL `embody(code)` so the live variables tracer
 * runs — the tracer streams over a Web Worker backed by a SharedArrayBuffer,
 * which requires a CROSS-ORIGIN-ISOLATED page (COOP/COEP headers). This is the
 * sandbox checkpoint surface: edit the JEJ source, set a seconds budget, click
 * Run, and watch the streamed events, the terminal settlement, and (on
 * inadmissible input) the admission-error dump. `key={code}` forces a fresh mount
 * per edit so a prior run's dumps clear.
 *
 * **Console tee (richness probe):** the real embodiment's handle is wrapped so
 * every RAW `VariablesTraceEvent` is logged to the console AS THE LENS'S CONSUMER
 * PULLS IT (`[trace-debugging] event #N`), plus the terminal settlement
 * (`[trace-debugging] settlement`). The on-screen events dump renders only a
 * one-line gloss per event (dropping `scopeInstanceId`, the full variable bursts,
 * prior/next/returned values, …); the console shows the FULL raw objects so the
 * emitted data can be judged for building richer learning surfaces. This tee
 * lives only in this dev harness — the production lens does no logging.
 *
 * **How to use** (after `npm run start`):
 *
 * 1. Open `http://localhost:3000/spiralearn/trace-debugging-smoke` (note the
 *    `/spiralearn/` baseUrl).
 * 2. In the devtools console confirm `crossOriginIsolated === true`. If `false`,
 *    the COOP/COEP headers are missing and no real trace can run — stop and fix
 *    the dev-server headers first.
 * 3. Run the default sample (completed), then a `while (true) {}` with a high
 *    budget and click Stop (cancelled), a non-JEJ source (admission-error), and a
 *    `while (true) {}` with seconds `0.2` (timed-out). Expand the logged event
 *    objects in the console to inspect every field.
 *
 * @vitest-skip — Docusaurus auto-routes `src/pages/*.tsx`; this is a page, not a
 * unit test.
 */

import Layout from '@theme/Layout';
import React from 'react';

import embody from '@site/src/lib/study-lenses/embody/index.js';
import type {
	Snippet,
	TraceVariableLifecycleOptions,
	VariablesTraceEvent,
	VariablesTraceHandle,
} from '@site/src/lib/study-lenses/embody/types.js';
import traceDebuggingLens from '@site/src/lib/study-lenses/lenses/trace-debugging/index.js';

const SAMPLE = 'let total = 0;\nfor (let i = 0; i < 5; i++) {\n\ttotal += i;\n}';

/**
 * Tees each streamed event (and the terminal settlement) to the console as the
 * lens's consumer pulls it, then yields/returns it unchanged. Delegates
 * `cancel`/`fail`; breaking the `for await` still propagates cancel to the inner
 * handle (the inner `for await` here gets its `return()` → the real iterator's
 * cancel). The logged objects are the RAW `VariablesTraceEvent`s / settlement.
 */
function loggingHandle(handle: VariablesTraceHandle): VariablesTraceHandle {
	async function* teeEvents(): AsyncGenerator<VariablesTraceEvent> {
		let index = 0;
		for await (const event of handle) {
			console.log(`[trace-debugging] event #${index}`, event);
			index += 1;
			yield event;
		}
	}
	return {
		[Symbol.asyncIterator]: teeEvents,
		get result() {
			return handle.result.then(function logSettlement(resolved) {
				console.log('[trace-debugging] settlement', resolved.settlement);
				return resolved;
			});
		},
		cancel: () => handle.cancel(),
		fail: (reason?: unknown) => handle.fail(reason),
	};
}

/**
 * A real embodiment whose `traceVariableLifecycle` returns a console-tee'd handle
 * (everything else delegates to the real snippet). The lens consumes it exactly
 * as it would the real one; only the streamed events/settlement are observed.
 */
function embodyWithLogging(code: string): Snippet {
	const real = embody(code);
	return {
		...real,
		evaluation: {
			...real.evaluation,
			events: {
				...real.evaluation.events,
				traceVariableLifecycle: (
					options?: TraceVariableLifecycleOptions,
				): VariablesTraceHandle =>
					loggingHandle(
						real.evaluation.events.traceVariableLifecycle(options),
					),
			},
		},
	} as Snippet;
}

export default function TraceDebuggingSmoke(): React.JSX.Element {
	const [code, setCode] = React.useState<string>(SAMPLE);

	return (
		<Layout
			title="trace-debugging smoke"
			description="WS4 trace-debugging lens harness"
		>
			<main style={{ maxWidth: 860, margin: '2rem auto', padding: '0 1rem' }}>
				<h1>trace-debugging lens smoke</h1>
				<p>
					Mounts the lens with a <strong>real</strong> <code>embody(code)</code>{' '}
					— the variables tracer runs in a Web Worker over a SharedArrayBuffer,
					which needs a <strong>cross-origin-isolated</strong> page (COOP/COEP).
					Confirm <code>crossOriginIsolated === true</code> in the console first.
					Edit the JEJ source, set a seconds budget, and click Run: the streamed
					lifecycle events fill the events dump, then the terminal settlement
					appears. Stop a runaway loop to settle <code>cancelled</code>; a
					non-JEJ source shows the admission-error dump; a low seconds budget on{' '}
					<code>while (true) {'{}'}</code> settles <code>timed-out</code>.
				</p>
				<p>
					<strong>Open the console:</strong> every raw{' '}
					<code>VariablesTraceEvent</code> is logged as it streams (
					<code>[trace-debugging] event #N</code>), plus the terminal settlement
					— the full objects, not the one-line dump.
				</p>

				<label style={{ display: 'block', marginBottom: 8 }}>
					JEJ source:
					<textarea
						value={code}
						onChange={function onCodeChange(event) {
							setCode(event.target.value);
						}}
						rows={10}
						style={{ width: '100%', fontFamily: 'monospace' }}
					/>
				</label>

				<div
					data-trace-debugging-smoke-mount
					style={{ border: '1px solid #ccc', padding: '1rem' }}
				>
					<traceDebuggingLens.Component
						key={code}
						embodiment={embodyWithLogging(code)}
						config={traceDebuggingLens.config()}
					/>
				</div>
			</main>
		</Layout>
	);
}
