/**
 * @file The danger runner's one public verb: `dangerRun`. It evaluates the RAW
 * editor buffer as a real `<script>` in a permissive, same-origin, no-`sandbox`-attr
 * iframe on the MAIN thread — bypassing embody's parse → validate → create →
 * Web-Worker sandbox — and reports how it ended. It drops the sandbox (off-thread
 * isolation + external terminate); an on-thread hang can freeze the host page. That
 * is the gated, named danger (README.md § Security posture).
 *
 * This increment is the iframe CORE + cancel/latch. It composes `wrapWithDebugger`
 * → `buildDangerScript`, then owns the impure iframe lifecycle: assign the
 * `__danger = { done, fail }` bridge onto the iframe's `window` BEFORE injecting the
 * script, defer the injection a macrotask so `result` settles no earlier than a
 * macrotask, latch the first settle (first-write-wins), and tear the iframe down.
 * See DOCS.md § Execution phases.
 *
 * DEFERRED (loud, not silent): the loop-guard splice (`iterations` → `guardLoops`,
 * emitting the `loop1..loopK` counters) lands in the NEXT increment, importing from
 * the `lib/loop-guard/` re-home rather than embody's excluded source; `io` mocks
 * (`DangerRunOptions.io`) and the orchestrate wiring stay deferred too. Native
 * output only.
 */

import buildDangerScript from './build-danger-script.js';
import classifyDangerError from './classify-danger-error.js';
import type {
	DangerResult,
	DangerRunHandle,
	DangerRunOptions,
} from './types.js';
import wrapWithDebugger from './wrap-with-debugger.js';

/** The `{ done, fail }` object assigned onto the iframe's window before inject. */
type DangerBridge = {
	readonly done: () => void;
	readonly fail: (name: string, message: string) => void;
};

/**
 * Read `{ name, message }` off an unknown thrown value, cross-realm-safely: an
 * iframe-realm `Error` fails the parent's `instanceof`, so duck-type the props.
 */
function readErrorPrimitives(thrown: unknown): {
	name: string;
	message: string;
} {
	const value = thrown as { name?: unknown; message?: unknown } | null;
	return {
		name: typeof value?.name === 'string' ? value.name : 'Error',
		message:
			typeof value?.message === 'string' ? value.message : String(thrown),
	};
}

export default function dangerRun(
	code: string,
	options: DangerRunOptions,
): DangerRunHandle {
	const { iterations, debuggerEnabled } = options;
	// inc-5 deferred: io routing not yet implemented — native output only.

	let settled = false;
	let resolveResult!: (result: DangerResult) => void;
	const result = new Promise<DangerResult>(
		(resolve) => (resolveResult = resolve),
	);

	let iframe: HTMLIFrameElement | null = null;

	function teardown(): void {
		if (iframe !== null) {
			iframe.remove();
			iframe = null;
		}
	}

	// First-write-wins latch: whichever of done / fail / onerror / cancel reaches
	// here first settles the outcome; the rest are no-ops (a post-settle async throw
	// cannot change a latched outcome).
	function settle(terminal: DangerResult): void {
		if (settled) return;
		settled = true;
		teardown();
		resolveResult(terminal);
	}

	function cancel(): void {
		settle({ outcome: 'cancelled' });
	}

	// Build the script. The loop-guard (the `iterations` cap) is applied in the NEXT
	// increment (loop-guard integration): until then loopCount is 0 and a snippet
	// runs UNGUARDED. This is loud, not a silent drop — `iterations` is still threaded
	// into the classifier below, and no live caller passes it yet (the orchestrate
	// wiring is deferred). guardLoops is imported there, not here, so this strict,
	// included module does not drag embody's excluded, non-strict source into the
	// typecheck graph before its `lib/loop-guard/` re-home lands.
	const script = buildDangerScript(
		wrapWithDebugger(code, debuggerEnabled ?? false),
		0,
	);

	// A permissive, same-origin, NO-`sandbox`-attr iframe. It must be CONNECTED for
	// the script (and native dialogs / `debugger;`) to run; keep it visually hidden.
	iframe = document.createElement('iframe');
	iframe.setAttribute('aria-hidden', 'true');
	iframe.style.display = 'none';
	document.body.append(iframe);

	// Defer injection a MACROTASK so result settles no earlier than a task (the
	// orchestrator's running→settled transition can paint; an io mirror won't race
	// the channel reset). A synchronous cancel() before this fires has already torn
	// the iframe down, so the guard below skips injection.
	setTimeout(function injectScript() {
		if (settled || iframe === null) return;
		const frame = iframe;
		const frameWindow = frame.contentWindow;
		const frameDocument = frame.contentDocument;
		if (frameWindow === null || frameDocument === null) {
			settle({
				outcome: 'errored',
				error: { name: 'Error', message: 'danger iframe unavailable' },
			});
			return;
		}

		// Wire the bridge + the parse-error net BEFORE injecting (strict ordering: the
		// script settles the instant it runs).
		const bridge: DangerBridge = {
			done: () => settle({ outcome: 'completed' }),
			fail: (name, message) =>
				settle(classifyDangerError(name, message, iterations)),
		};
		(frameWindow as unknown as { __danger: DangerBridge }).__danger = bridge;
		// The 'error' listener is the ONLY net for a SYNTAX error: the assembled
		// <script> fails to PARSE, so the in-script try/catch never runs and the bridge
		// never fires. Latched, so a post-settle async throw is a harmless no-op.
		frameWindow.addEventListener(
			'error',
			function onScriptError(event: ErrorEvent) {
				const { name, message } = readErrorPrimitives(
					event.error ?? event.message,
				);
				settle(classifyDangerError(name, message, iterations));
				event.preventDefault();
			},
		);

		const scriptElement = frameDocument.createElement('script');
		scriptElement.textContent = script;
		(frameDocument.body ?? frameDocument.documentElement).append(scriptElement);
	}, 0);

	return { result, cancel };
}
