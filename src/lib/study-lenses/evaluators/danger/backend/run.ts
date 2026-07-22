/**
 * @file The danger runner's one public verb: `run`. It evaluates the RAW
 * editor buffer as a real `<script>` in a permissive, same-origin, no-`sandbox`-attr
 * iframe on the MAIN thread — bypassing embody's parse → validate → create →
 * Web-Worker sandbox — and reports how it ended. It drops the sandbox (off-thread
 * isolation + external terminate); an on-thread hang can freeze the host page. That
 * is the gated, named danger (README.md § Security posture).
 *
 * Composes `spliceLoopGuards` (`lib/loop-guard/`) → `wrapWithDebugger` →
 * `buildDangerScript` (script mode) or `buildDangerModule` (module mode), then owns
 * the impure iframe lifecycle: assign the `__danger` bridge onto the iframe's
 * `window` BEFORE injecting, wire the window `error` / `unhandledrejection` nets and
 * (module mode) a real `<base href>`, defer the injection a macrotask so `result`
 * settles no earlier than a macrotask, arm the wall-clock timeout, latch the first
 * settle (first-write-wins), and tear the iframe down. See DOCS.md § Execution phases.
 *
 * Provided `io` mocks (`DangerRunOptions.io`) are installed on the iframe window
 * before inject; unmocked verbs stay native. A synchronous freeze (unbraced
 * `for(;;)`, deep recursion) is irreducible — no timer preempts a frozen main thread.
 */

import spliceLoopGuards from '../../../lib/loop-guard/splice-loop-guards.js';

import buildDangerModule from './build-danger-module.js';
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

export default function run(
	code: string,
	options: DangerRunOptions,
): DangerRunHandle {
	const { iterations, debuggerEnabled, io } = options;
	const type = options.type ?? 'script';
	const seconds = options.seconds ?? 5;
	// `type` selects the program assembler and the module-only report channels;
	// `seconds` bounds the wall-clock timeout. The synchronous `io` mocks are
	// installed on the iframe window before inject (below).

	let settled = false;
	let resolveResult!: (result: DangerResult) => void;
	const result = new Promise<DangerResult>(
		(resolve) => (resolveResult = resolve),
	);

	let iframe: HTMLIFrameElement | null = null;
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	function teardown(): void {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
			timeoutId = undefined;
		}
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

	// Build phase — synchronous. With a cap, spliceLoopGuards splices the guard/reset
	// call text into each braced loop (its `loopCount` drives the `loop1..loopK`
	// globals buildDangerScript emits) and parses via acorn, throwing a typed
	// `LoopGuardError` on unparseable source — so the build is wrapped: a parse/guard
	// throw settles errored (deferred a tick, never synchronously) rather than throwing
	// out of `run`. `iterations` unset ⇒ no guard (loopCount 0). The cap rides the hook
	// closures (loop-guard is agnostic to what the guard/reset text does).
	let built: { code: string; loopCount: number };
	try {
		built =
			iterations === undefined
				? { code, loopCount: 0 }
				: spliceLoopGuards(code, {
						makeGuard: (n) =>
							`if (++loop${n} > ${iterations}) throw new RangeError("Loop ${n} exceeded ${iterations} iterations.");`,
						makeReset: (n) => `loop${n} = 0;`,
					});
	} catch (buildError) {
		const { name, message } = readErrorPrimitives(buildError);
		setTimeout(() => settle(classifyDangerError(name, message, iterations)), 0);
		return { result, cancel };
	}
	const wrapped = wrapWithDebugger(built.code, debuggerEnabled ?? false);
	const source =
		type === 'module'
			? buildDangerModule(wrapped, built.loopCount)
			: buildDangerScript(wrapped, built.loopCount);

	// A permissive, same-origin, NO-`sandbox`-attr iframe. It must be CONNECTED for
	// the script (and native dialogs / `debugger;`) to run; keep it visually hidden.
	iframe = document.createElement('iframe');
	iframe.setAttribute('aria-hidden', 'true');
	iframe.style.display = 'none';
	document.body.append(iframe);

	// Wall-clock timeout: bounds an otherwise-endless async run (a never-settling
	// top-level await leaves the thread free, so this fires). Cleared on any settle
	// (teardown). It CANNOT preempt a synchronous freeze — no timer runs on a frozen
	// main thread; only the loop-guard breaks that.
	timeoutId = setTimeout(
		() =>
			settle({
				outcome: 'timed-out',
				error: {
					name: 'Error',
					message: `danger run exceeded its ${seconds}s wall-clock budget`,
				},
			}),
		seconds * 1000,
	);

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
		// module mode: a rejected top-level `await` surfaces as an unhandled rejection,
		// NOT the `error` event — without this net it falls through to the timeout and
		// mis-reports a real error as "timed out". Fail loud on the rejection.
		if (type === 'module') {
			frameWindow.addEventListener(
				'unhandledrejection',
				function onRejection(event: PromiseRejectionEvent) {
					const { name, message } = readErrorPrimitives(event.reason);
					settle(classifyDangerError(name, message, iterations));
					event.preventDefault();
				},
			);
		}

		// Install the provided synchronous io mocks on the iframe window BEFORE inject
		// (the same before-inject window as the bridge). ONLY provided verbs are
		// assigned — unmocked verbs stay native; `console` MERGES per-method, so an
		// unmocked method stays native too. The mocks must be sync: a real synchronous
		// `<script>` cannot await, and a promise would coerce to `[object Promise]`.
		if (io !== undefined) {
			if (io.alert !== undefined) {
				frameWindow.alert = io.alert;
			}
			if (io.confirm !== undefined) {
				frameWindow.confirm = io.confirm;
			}
			if (io.prompt !== undefined) {
				frameWindow.prompt = io.prompt;
			}
			if (io.console !== undefined) {
				// `console` is not on the DOM `Window` type (it is a global), so reach it
				// through the same cast pattern the `__danger` bridge uses above.
				Object.assign(
					(frameWindow as unknown as { console: object }).console,
					io.console,
				);
			}
		}

		// module mode: give the srcless iframe a real base URL (its default is
		// about:blank) so relative import specifiers resolve; full-URL specifiers work
		// without it. Injected before the module script runs.
		if (type === 'module') {
			const base = frameDocument.createElement('base');
			base.href = globalThis.location.href;
			(frameDocument.head ?? frameDocument.documentElement).append(base);
		}

		const scriptElement = frameDocument.createElement('script');
		if (type === 'module') {
			scriptElement.type = 'module';
		}
		scriptElement.textContent = source;
		(frameDocument.body ?? frameDocument.documentElement).append(scriptElement);
	}, 0);

	return { result, cancel };
}

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
