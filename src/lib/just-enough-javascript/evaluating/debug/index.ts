/**
 * @module debug
 *
 * Debug lens — execute learner JavaScript in a sandboxed iframe with
 * `debugger` breakpoints before and after their code.
 *
 * ## Why an iframe?
 *
 * The learner's code runs in a same-origin iframe so it gets its own global
 * scope. This prevents variable collisions with the host page and gives us a
 * disposable execution context — when the iframe is removed, everything it
 * allocated (timers, listeners, DOM nodes) is garbage-collected.
 *
 * ## Lifecycle (per call)
 *
 * ```
 * debug(code, maxIterations?)
 *   ├─ guard loops (if maxIterations provided)
 *   ├─ format code (prettier/standalone)
 *   ├─ create wrapper <div> + hidden <iframe>
 *   ├─ append to document.body
 *   ├─ iframe loads → inject two <script type="module"> tags:
 *   │    ├─ script 1: debugger; <learner code> debugger;
 *   │    └─ script 2: postMessage(callId) back to parent
 *   ├─ parent receives message → removes wrapper → resolves Promise
 *   └─ no DOM artifacts remain
 * ```
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
 * (callId), so concurrent `debug()` calls don't interfere with each other.
 *
 * ## Preconditions
 *
 * - **DevTools must be open** before calling `debug()`, otherwise the browser
 *   silently skips `debugger` statements and the code runs straight through.
 * - The host page must be served from a context where same-origin iframe
 *   access is allowed (i.e. `contentDocument` is not null).
 */

import guardLoops from './guard-loops/guard-loops.js';
import formatCode from './format/format.js';

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
// because debug() has side effects by design (creates DOM elements,
// postMessage), not a pure utility. Each call needs a unique ID to prevent
// cross-talk between concurrent invocations.
let callCounter = 0;

/**
 * Execute learner JavaScript in a hidden iframe with `debugger` breakpoints.
 *
 * The learner's code is wrapped as:
 * ```js
 * debugger;    // ← pause here so the learner can open Sources panel
 *
 * <their code>
 *
 * debugger;    // ← pause again so they can inspect final state
 * ```
 *
 * @param code - The learner's JavaScript source code to execute.
 * @param maxIterations - If provided, injects loop guards that throw
 *        RangeError after this many iterations. Omit to skip loop guarding.
 *
 * @returns A Promise that resolves after execution completes (including any
 *          time spent paused at `debugger` breakpoints). Rejects if the
 *          iframe's `contentDocument` is inaccessible (cross-origin or
 *          blocked by browser policy).
 *
 * @example
 * ```ts
 * // Basic usage — resolves when the learner finishes stepping through
 * await debug('let x = 1;\nlet y = 2;\nconsole.log(x + y);');
 *
 * // With loop guards — throws after 100 iterations
 * await debug('while (true) { }', 100);
 *
 * // Empty or whitespace-only code is a no-op
 * await debug('');   // logs a warning, resolves immediately
 * ```
 */
async function debug(code: string, maxIterations?: number): Promise<void> {
	if (!code?.trim()) {
		console.warn('No code to execute');
		return;
	}

	// 1. Transform code: guard loops (if configured), then format
	const guardedCode = maxIterations
		? (guardLoops(code, maxIterations) as string)
		: code;
	const finalCode = await formatCode(guardedCode);

	// 2. Create isolated execution environment
	const callId = `debug-${++callCounter}`;

	const wrapper = document.createElement('div');
	wrapper.id = callId;
	wrapper.style.display = 'none';
	document.body.appendChild(wrapper);

	const iframe = document.createElement('iframe');
	iframe.style.cssText = IFRAME_HIDDEN_STYLES;

	return new Promise<void>((resolve, reject) => {
		// Filter messages by source (this iframe) and data (this call's ID)
		// to prevent cross-talk between concurrent debug() invocations.
		function onMessage(event: MessageEvent) {
			if (event.source !== iframe.contentWindow) return;
			if (event.data !== callId) return;

			window.removeEventListener('message', onMessage);
			wrapper.remove();
			resolve();
		}

		window.addEventListener('message', onMessage);

		iframe.onload = () => {
			const iframeDocument = iframe.contentDocument;

			if (!iframeDocument) {
				window.removeEventListener('message', onMessage);
				wrapper.remove();
				reject(new Error('Failed to access iframe document'));
				return;
			}

			// Script 1: learner code wrapped in debugger statements
			const codeScript = document.createElement('script');
			codeScript.type = 'module';
			codeScript.textContent = `debugger;\n\n\n\n${finalCode}\n\n\ndebugger;\n`;

			// Script 2: completion signal — runs only after Script 1 finishes
			// (module scripts in the same document execute in insertion order)
			const doneScript = document.createElement('script');
			doneScript.type = 'module';
			doneScript.textContent = `window.parent.postMessage('${callId}', '*');\n`;

			iframeDocument.body.appendChild(codeScript);
			iframeDocument.body.appendChild(doneScript);
		};

		wrapper.appendChild(iframe);
	});
}

export default debug;
