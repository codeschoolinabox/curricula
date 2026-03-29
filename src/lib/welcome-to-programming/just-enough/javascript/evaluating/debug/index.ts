/**
 * @module debug
 *
 * Debug engine — execute learner JavaScript in a sandboxed iframe with
 * `debugger` breakpoints before and after their code.
 *
 * Returns an async generator that yields 0-1 DebugEvents and returns
 * a DebugResult. No SAB pause (iframe, not Worker). No event streaming
 * — yields nothing on success, yields one error event on failure.
 *
 * ## Why an iframe?
 *
 * The learner's code runs in a same-origin iframe so it gets its own global
 * scope. This prevents variable collisions with the host page and gives us a
 * disposable execution context — when the iframe is removed, everything it
 * allocated (timers, listeners, DOM nodes) is garbage-collected.
 *
 * ## Why two module scripts?
 *
 * Module scripts inserted into the same document execute in insertion order.
 * Script 2 cannot run until Script 1 completes — including any time the user
 * spends paused in the DevTools debugger. This gives us a reliable "done"
 * signal without polling or timers.
 *
 * ## Concurrency
 *
 * Each call gets a unique `callId` (monotonic counter). The `postMessage`
 * listener filters by both `event.source` (iframe window) and `event.data`
 * (callId), so concurrent debug calls don't interfere with each other.
 *
 * ## Preconditions
 *
 * - **DevTools must be open** before calling debug, otherwise the browser
 *   silently skips `debugger` statements and the code runs straight through.
 * - The host page must be served from a context where same-origin iframe
 *   access is allowed (i.e. `contentDocument` is not null).
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';
import guardLoops from './guard-loops/guard-loops.js';
import type { DebugEvent, DebugResult } from '../../api/types.js';

/**
 * CSS to position the iframe offscreen. The iframe must exist in the DOM
 * (scripts won't execute in a detached iframe), but it has no visual purpose.
 */
const IFRAME_HIDDEN_STYLES = `
  position: absolute;
  top: -9999px;
  left: -9999px;
  width: 1px;
  height: 1px;
  border: none;
  visibility: hidden;
  pointer-events: none;
  z-index: -1;
`;

// WHY: Module-level mutable state for generating unique call IDs. Acceptable
// because debug has side effects by design (creates DOM elements,
// postMessage), not a pure utility. Each call needs a unique ID to prevent
// cross-talk between concurrent invocations.
let callCounter = 0;

/**
 * Creates an async generator that debugs code in an iframe.
 *
 * @param code - The learner's JavaScript source code to execute
 * @param maxIterations - If provided, injects body-injection loop guards
 *   that throw RangeError after this many iterations. These guards use
 *   body injection (not comma-in-condition) so learners see readable
 *   guard code in DevTools.
 * @returns Async generator yielding 0-1 DebugEvents, returning DebugResult
 */
async function* createDebugGenerator(
	code: string,
	maxIterations?: number,
): AsyncGenerator<DebugEvent, DebugResult> {
	// Empty/whitespace code — no-op, return immediately
	if (!code?.trim()) {
		console.warn('No code to execute');
		return deepFreezeInPlace({ ok: true as const, logs: [] });
	}

	// 1. Transform code: guard loops if configured
	// WHY no formatCode: formatting is now a pipeline gate in api/debug.ts.
	// Code reaching this point is already formatted.
	const finalCode = maxIterations
		? (guardLoops(code, maxIterations) as string)
		: code;

	// 2. Create isolated execution environment
	const callId = `debug-${++callCounter}`;

	const wrapper = document.createElement('div');
	wrapper.id = callId;
	wrapper.style.display = 'none';
	document.body.appendChild(wrapper);

	const iframe = document.createElement('iframe');
	iframe.style.cssText = IFRAME_HIDDEN_STYLES;

	try {
		await new Promise<void>((resolve, reject) => {
			function onMessage(event: MessageEvent) {
				if (event.source !== iframe.contentWindow) return;
				if (event.data !== callId) return;

				window.removeEventListener('message', onMessage);
				resolve();
			}

			window.addEventListener('message', onMessage);

			iframe.onload = () => {
				const iframeDocument = iframe.contentDocument;

				if (!iframeDocument) {
					window.removeEventListener('message', onMessage);
					reject(new Error('Failed to access iframe document'));
					return;
				}

				// Script 1: learner code wrapped in debugger statements
				const codeScript = document.createElement('script');
				codeScript.type = 'module';
				codeScript.textContent = `debugger;\n\n\n\n${finalCode}\n\n\ndebugger;\n`;

				// Script 2: completion signal — runs only after Script 1 finishes
				const doneScript = document.createElement('script');
				doneScript.type = 'module';
				doneScript.textContent = `window.parent.postMessage('${callId}', '*');\n`;

				iframeDocument.body.appendChild(codeScript);
				iframeDocument.body.appendChild(doneScript);
			};

			wrapper.appendChild(iframe);
		});
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));
		const errorEvent: DebugEvent = {
			event: 'error',
			name: error.name,
			message: error.message,
		};

		yield errorEvent;

		if (error.name === 'RangeError') {
			return deepFreezeInPlace({
				ok: false as const,
				error: {
					kind: 'iteration-limit' as const,
					name: error.name,
					message: error.message,
					phase: 'execution' as const,
					limit: maxIterations ?? 0,
				},
				logs: [errorEvent],
			});
		}

		return deepFreezeInPlace({
			ok: false as const,
			error: {
				kind: 'javascript' as const,
				name: error.name,
				message: error.message,
				phase: 'creation' as const,
			},
			logs: [errorEvent],
		});
	} finally {
		wrapper.remove();
	}

	// Success — no events, empty logs
	return deepFreezeInPlace({ ok: true as const, logs: [] });
}

export default createDebugGenerator;
