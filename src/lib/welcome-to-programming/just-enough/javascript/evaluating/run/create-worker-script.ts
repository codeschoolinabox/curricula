/**
 * @file Generates a self-contained JavaScript string that runs as a
 * Web Worker via Blob URL.
 *
 * @remarks The worker script cannot import modules (Blob URL limitation),
 * so all logic is inlined. The SAB read-side protocol is duplicated
 * from worker-protocol.ts — see DOCS.md § Worker script duplication.
 *
 * The setup message handler is fully synchronous — see DOCS.md §
 * Why two-step protocol for the invariant this depends on.
 */

/**
 * Returns a complete JavaScript source string for the execution worker.
 *
 * @remarks The returned string, when loaded as a Blob URL worker:
 * 1. Listens for a `setup` message — stores SAB views, defines traps
 * 2. Listens for an `execute` message — runs learner code via
 *    `new Function` with trapped globals as arguments
 *
 * All traps are always defined (console.log, console.assert, alert,
 * confirm, prompt). Traps record events and post them to the main
 * thread. I/O traps (alert/confirm/prompt) block via `Atomics.wait`
 * until the main thread writes a response to the SAB.
 */
function createWorkerScript(): string {
	return `"use strict";

// --- SAB layout constants (duplicated from worker-protocol.ts) ---

const CONTROL_INDEX = 0;
const RESPONSE_TYPE_INDEX = 1;
const NULL_FLAG_INDEX = 2;
const PAYLOAD_LENGTH_INDEX = 3;
const PAYLOAD_BYTE_OFFSET = 16;

const RESPONSE_STRING = 0;
const RESPONSE_BOOLEAN = 1;
const RESPONSE_VOID = 2;

const SIGNAL_IDLE = 0;
const SIGNAL_WAITING = 1;
const SIGNAL_RESPONDED = 2;

// --- State (set on setup message) ---

let controlView = null;
let payloadView = null;
const events = [];

// --- Line extraction ---

function getLine() {
  try {
    throw new Error();
  } catch (e) {
    const lines = (e.stack || '').split('\\n');
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/:(\\d+):\\d+\\)?$/);
      if (match) {
        const lineNum = parseInt(match[1], 10);
        // WHY: new Function wraps code with "use strict" as line 1,
        // so user code starts at line 2. Subtract 1 to get user line.
        if (lineNum >= 2) return lineNum - 1;
      }
    }
    return undefined;
  }
}

// --- SAB read-side protocol (duplicated from worker-protocol.ts) ---

const textDecoder = new TextDecoder();

function waitForResponse() {
  Atomics.store(controlView, CONTROL_INDEX, SIGNAL_WAITING);
  Atomics.wait(controlView, CONTROL_INDEX, SIGNAL_WAITING);
}

function readResponse() {
  const responseType = Atomics.load(controlView, RESPONSE_TYPE_INDEX);

  if (responseType === RESPONSE_VOID) {
    Atomics.store(controlView, CONTROL_INDEX, SIGNAL_IDLE);
    return { type: 'void' };
  }

  if (responseType === RESPONSE_BOOLEAN) {
    const flag = Atomics.load(controlView, NULL_FLAG_INDEX);
    Atomics.store(controlView, CONTROL_INDEX, SIGNAL_IDLE);
    return { type: 'boolean', value: flag === 1 };
  }

  const nullFlag = Atomics.load(controlView, NULL_FLAG_INDEX);
  if (nullFlag === 1) {
    Atomics.store(controlView, CONTROL_INDEX, SIGNAL_IDLE);
    return { type: 'string', value: null };
  }

  const byteLength = Atomics.load(controlView, PAYLOAD_LENGTH_INDEX);
  const encoded = payloadView.slice(0, byteLength);
  const value = textDecoder.decode(encoded);
  Atomics.store(controlView, CONTROL_INDEX, SIGNAL_IDLE);
  return { type: 'string', value: value };
}

// --- Structured clone safety ---

function safeCloneArgs(args) {
  try {
    // WHY: test that args survive structured clone before postMessage.
    // Functions and symbols cause DataCloneError.
    structuredClone(args);
    return args;
  } catch (e) {
    return args.map(function (a) {
      try {
        structuredClone(a);
        return a;
      } catch (e2) {
        return String(a);
      }
    });
  }
}

// --- Traps ---

const trappedConsole = {
  log() {
    const args = safeCloneArgs(Array.from(arguments));
    const line = getLine();
    const event = { event: 'log', args: args, line: line };
    events.push(event);
    postMessage({ type: 'event', event: event });
  },
  assert() {
    const args = safeCloneArgs(Array.from(arguments));
    const line = getLine();
    const event = { event: 'assert', args: args, line: line };
    events.push(event);
    postMessage({ type: 'event', event: event });
  }
};

function trappedAlert() {
  const args = safeCloneArgs(Array.from(arguments));
  const line = getLine();
  postMessage({ type: 'io-request', name: 'alert', args: args, line: line });
  waitForResponse();
  readResponse();
  const event = { event: 'alert', args: args, return: undefined, line: line };
  events.push(event);
  postMessage({ type: 'event', event: event });
}

function trappedConfirm() {
  const args = safeCloneArgs(Array.from(arguments));
  const line = getLine();
  postMessage({ type: 'io-request', name: 'confirm', args: args, line: line });
  waitForResponse();
  const response = readResponse();
  const returnValue = response.value;
  const event = { event: 'confirm', args: args, return: returnValue, line: line };
  events.push(event);
  postMessage({ type: 'event', event: event });
  return returnValue;
}

function trappedPrompt() {
  const args = safeCloneArgs(Array.from(arguments));
  const line = getLine();
  postMessage({ type: 'io-request', name: 'prompt', args: args, line: line });
  waitForResponse();
  const response = readResponse();
  const returnValue = response.value;
  const event = { event: 'prompt', args: args, return: returnValue, line: line };
  events.push(event);
  postMessage({ type: 'event', event: event });
  return returnValue;
}

// --- Message handler ---

self.onmessage = function (e) {
  const msg = e.data;

  if (msg.type === 'setup') {
    controlView = new Int32Array(msg.sharedBuffer, 0, 4);
    payloadView = new Uint8Array(msg.sharedBuffer, PAYLOAD_BYTE_OFFSET);
    return;
  }

  if (msg.type === 'execute') {
    // 1. Construction phase — SyntaxError from new Function
    let fn;
    try {
      fn = new Function(
        'console', 'alert', 'confirm', 'prompt',
        '"use strict";\\n' + msg.code
      );
    } catch (err) {
      const errorEvent = {
        event: 'error',
        name: err.name || 'Error',
        message: err.message || String(err),
        phase: 'creation'
      };
      events.push(errorEvent);
      postMessage({ type: 'event', event: errorEvent });
      postMessage({ type: 'complete' });
      return;
    }

    // 2. Execution phase — runtime errors
    try {
      fn(trappedConsole, trappedAlert, trappedConfirm, trappedPrompt);
    } catch (err) {
      const errorEvent = {
        event: 'error',
        name: err.name || 'Error',
        message: err.message || String(err),
        line: extractLineFromError(err),
        phase: 'execution'
      };
      events.push(errorEvent);
      postMessage({ type: 'event', event: errorEvent });
    }

    postMessage({ type: 'complete' });
  }
};

function extractLineFromError(err) {
  if (!err || !err.stack) return undefined;
  const lines = err.stack.split('\\n');
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/:(\\d+):\\d+\\)?$/);
    if (match) {
      const lineNum = parseInt(match[1], 10);
      if (lineNum >= 2) return lineNum - 1;
    }
  }
  return undefined;
}
`;
}

export default createWorkerScript;
