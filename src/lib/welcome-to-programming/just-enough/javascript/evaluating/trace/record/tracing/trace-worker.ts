/**
 * @file Worker module for Aran-based trace execution.
 *
 * Loaded via dynamic import() from a classic worker blob URL (see index.ts).
 * Each worker instance is disposable — MUST NOT be reused.
 *
 * Message protocol:
 *   main → worker: 'setup' (SAB for I/O traps + pause) → 'execute' (code + state)
 *   worker → main: 'entry' (per-event streaming) → 'complete' | 'error'
 *
 * Advice functions are imported at module level (Vite bundles them).
 * They're registered on globalThis so Aran's readGlobalVariable finds them.
 */

// --- Advice imports (Vite bundles these into the worker) ---

import blockSetup from './weaving/advice/block-setup.js';
import blockBefore from './weaving/advice/block-before.js';
import blockDeclaration from './weaving/advice/block-declaration.js';
import blockAfter from './weaving/advice/block-after.js';
import blockThrowing from './weaving/advice/block-throwing.js';
import blockTeardown from './weaving/advice/block-teardown.js';
import expressionAfter from './weaving/advice/expression-after.js';
import applyAround from './weaving/advice/apply-around.js';
import effectBefore from './weaving/advice/effect-before.js';
import statementBefore from './weaving/advice/statement-before.js';

// --- SAB layout constants (from run/worker-protocol.ts) ---

const CONTROL_INDEX = 0;
const RESPONSE_TYPE_INDEX = 1;
const NULL_FLAG_INDEX = 2;
const PAYLOAD_LENGTH_INDEX = 3;
const PAUSE_INDEX = 4;
const PAYLOAD_BYTE_OFFSET = 20;

const RESPONSE_BOOLEAN = 1;
const RESPONSE_VOID = 2;

const SIGNAL_IDLE = 0;
const SIGNAL_WAITING = 1;

const PAUSE_PAUSED = 1;

// --- SAB state (set on 'setup' message) ---

let controlView: Int32Array | null = null;
let payloadView: Uint8Array | null = null;

// --- Register advice globals on globalThis ---
// WHY: Aran's weave generates code that calls aran.readGlobalVariable("_jej_block_setup")
// to get the advice function. readGlobalVariable looks at globalThis.
// Names MUST match the keys in createAspect's adviceGlobals.

const adviceMap: Record<string, Function> = {
	_jej_block_setup: blockSetup,
	_jej_block_before: blockBefore,
	_jej_block_declaration: blockDeclaration,
	_jej_block_after: blockAfter,
	_jej_block_throwing: blockThrowing,
	_jej_block_teardown: blockTeardown,
	_jej_expression_after: expressionAfter,
	_jej_apply_around: applyAround,
	_jej_effect_before: effectBefore,
	_jej_statement_before: statementBefore,
};

for (const [name, fn] of Object.entries(adviceMap)) {
	(globalThis as Record<string, unknown>)[name] = fn;
}

// --- I/O traps (SAB-blocking, defined before eval) ---
// WHY: Workers have no native prompt/confirm/alert. These traps block
// the worker via Atomics.wait while the main thread shows real dialogs.

const textDecoder = new TextDecoder();

function waitForResponse(): void {
	if (!controlView) return;
	Atomics.store(controlView, CONTROL_INDEX, SIGNAL_WAITING);
	Atomics.wait(controlView, CONTROL_INDEX, SIGNAL_WAITING);
}

function readResponse(): { type: string; value: unknown } {
	if (!controlView || !payloadView) {
		return { type: 'string', value: null };
	}

	const responseType = Atomics.load(controlView, RESPONSE_TYPE_INDEX);

	if (responseType === RESPONSE_VOID) {
		Atomics.store(controlView, CONTROL_INDEX, SIGNAL_IDLE);
		return { type: 'void', value: undefined };
	}

	if (responseType === RESPONSE_BOOLEAN) {
		const flag = Atomics.load(controlView, NULL_FLAG_INDEX);
		Atomics.store(controlView, CONTROL_INDEX, SIGNAL_IDLE);
		return { type: 'boolean', value: flag === 1 };
	}

	// RESPONSE_STRING
	const nullFlag = Atomics.load(controlView, NULL_FLAG_INDEX);
	if (nullFlag === 1) {
		Atomics.store(controlView, CONTROL_INDEX, SIGNAL_IDLE);
		return { type: 'string', value: null };
	}

	const byteLength = Atomics.load(controlView, PAYLOAD_LENGTH_INDEX);
	const encoded = payloadView.slice(0, byteLength);
	const value = textDecoder.decode(encoded);
	Atomics.store(controlView, CONTROL_INDEX, SIGNAL_IDLE);
	return { type: 'string', value };
}

globalThis.prompt = function prompt(...args: unknown[]): string | null {
	postMessage({ type: 'io-request', name: 'prompt', args });
	waitForResponse();
	const response = readResponse();
	return response.value as string | null;
};

globalThis.confirm = function confirm(...args: unknown[]): boolean {
	postMessage({ type: 'io-request', name: 'confirm', args });
	waitForResponse();
	const response = readResponse();
	return response.value as boolean;
};

globalThis.alert = function alert(...args: unknown[]): void {
	postMessage({ type: 'io-request', name: 'alert', args });
	waitForResponse();
	readResponse();
};

// --- Pause protocol (blocks Worker between events) ---

function checkPause(): void {
	if (!controlView) return;
	while (Atomics.load(controlView, PAUSE_INDEX) === PAUSE_PAUSED) {
		Atomics.wait(controlView, PAUSE_INDEX, PAUSE_PAUSED);
	}
}

// --- Message handler ---

export function handleMessage(e: MessageEvent): void {
	const msg = e.data;

	if (msg.type === 'setup') {
		controlView = new Int32Array(msg.sharedBuffer, 0, 5);
		payloadView = new Uint8Array(msg.sharedBuffer, PAYLOAD_BYTE_OFFSET);
		return;
	}

	if (msg.type === 'execute') {
		const { instrumentedCode } = msg;

		// Set global event callback for per-event streaming.
		// WHY: Aran JSON-clones initialState into the code, losing onEvent
		// (functions aren't serializable). block-setup (first hook to fire)
		// picks up this global and sets state.onEvent from it. All subsequent
		// hooks inherit onEvent because block-setup returns the state.
		(globalThis as Record<string, unknown>).__jej_onEvent = function onEvent(event: unknown): void {
			postMessage({ type: 'entry', entry: event });
			checkPause();
		};

		try {
			// eslint-disable-next-line no-new-func
			new Function(instrumentedCode)();
		} catch (err: unknown) {
			postMessage({
				type: 'error',
				message: err instanceof Error ? err.message : String(err),
				name: err instanceof Error ? err.name : 'Error',
				phase: 'execution',
			});
		}

		postMessage({ type: 'complete' });
	}
}
