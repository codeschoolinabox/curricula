/**
 * @file Generates the trapless worker script as a self-contained
 * JavaScript string, served to the browser via Blob URL.
 *
 * @remarks
 * The script cannot import modules (Blob URL limitation), so the
 * SAB read protocol is duplicated inline (see
 * `lib/evaluating/run/worker-protocol.ts` for the typed source).
 *
 * **Trapless** — no `console` traps. Programs that call
 * `console.log` write to the worker's native console (visible in
 * browser dev tools, not captured by this engine).
 *
 * Dialog traps for `prompt`/`alert`/`confirm` post `io-request`
 * messages and block on `Atomics.wait` until the main thread writes
 * the response into the SAB. Unlike intercept, the dialog traps do
 * **not** emit events on the post-response tail — they simply
 * return the value to the learner code.
 *
 * Errors are reported by riding on the `complete` message itself
 * (no separate event channel), with a `phase: 'creation' | 'execution'`
 * discriminant.
 */

/**
 * Returns a complete JavaScript source string for the trapless
 * execution worker.
 *
 * @remarks The returned string, when loaded as a Blob URL worker:
 * 1. Listens for a `setup` message — stores SAB views.
 * 2. Listens for an `execute` message — runs learner code via
 *    `new Function` with dialog traps as arguments.
 * 3. Posts `complete` (with optional `error` payload) when done.
 */
export default function createWorkerScript(): string {
	return `"use strict";

// --- SAB layout constants (duplicated from worker-protocol.ts) ---

const CONTROL_INDEX = 0;
const RESPONSE_TYPE_INDEX = 1;
const NULL_FLAG_INDEX = 2;
const PAYLOAD_LENGTH_INDEX = 3;
const PAYLOAD_BYTE_OFFSET = 24;

const RESPONSE_STRING = 0;
const RESPONSE_BOOLEAN = 1;
const RESPONSE_VOID = 2;

const SIGNAL_IDLE = 0;
const SIGNAL_WAITING = 1;
const SIGNAL_RESPONDED = 2;

// --- State (set on setup message) ---

let controlView = null;
let payloadView = null;

// --- Line extraction ---
//
// The trapless engine always prepends \`"use strict"; \` to learner
// code (no scriptMode easter egg — the \`with\` easter egg lives in
// intercept). User code therefore starts at worker-script line 2;
// subtract 1 to get the user-facing line number.

function getLine() {
  try {
    throw new Error();
  } catch (e) {
    const lines = (e.stack || '').split('\\n');
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/:(\\d+):\\d+\\)?$/);
      if (match) {
        const lineNum = parseInt(match[1], 10);
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

// --- Structured clone safety (for io-request args) ---

function safeCloneArgs(args) {
  try {
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

// --- Dialog traps (prompt/alert/confirm → io-request, no event emit) ---

function trappedAlert() {
  const args = safeCloneArgs(Array.from(arguments));
  const line = getLine();
  postMessage({ type: 'io-request', name: 'alert', args: args, line: line });
  waitForResponse();
  readResponse();
  return undefined;
}

function trappedConfirm() {
  const args = safeCloneArgs(Array.from(arguments));
  const line = getLine();
  postMessage({ type: 'io-request', name: 'confirm', args: args, line: line });
  waitForResponse();
  const response = readResponse();
  return response.value;
}

function trappedPrompt() {
  const args = safeCloneArgs(Array.from(arguments));
  const line = getLine();
  postMessage({ type: 'io-request', name: 'prompt', args: args, line: line });
  waitForResponse();
  const response = readResponse();
  return response.value;
}

// --- Message handler ---

self.onmessage = function (e) {
  const msg = e.data;

  if (msg.type === 'setup') {
    controlView = new Int32Array(msg.sharedBuffer, 0, 6);
    payloadView = new Uint8Array(msg.sharedBuffer, PAYLOAD_BYTE_OFFSET);
    return;
  }

  if (msg.type === 'execute') {
    // 0. Build loop counter declarations prefix on the same line as
    // "use strict" — keeps user line numbers unchanged.
    var loopDeclarations = '';
    if (msg.loopCount > 0) {
      var decls = [];
      for (var li = 1; li <= msg.loopCount; li++) {
        decls.push('loop' + li + ' = 0');
      }
      loopDeclarations = 'var ' + decls.join(', ') + '; ';
    }

    // 1. Construction phase — SyntaxError from new Function
    //    NOTE: the trapless engine does NOT pass a 'console'
    //    parameter, so learner code's \`console.log\` resolves to
    //    the worker's native global console.
    //    The "use strict" prefix is unconditional — run does not
    //    support intercept's scriptMode \`with\` easter egg.
    var fn;
    try {
      var prefix = '"use strict"; ' + loopDeclarations + '\\n';
      fn = new Function('alert', 'confirm', 'prompt', prefix + msg.code);
    } catch (err) {
      postMessage({
        type: 'complete',
        error: {
          name: err.name || 'Error',
          message: err.message || String(err),
          phase: 'creation'
        }
      });
      return;
    }

    // 2. Execution phase — runtime errors
    try {
      fn(trappedAlert, trappedConfirm, trappedPrompt);
    } catch (err) {
      postMessage({
        type: 'complete',
        error: {
          name: err.name || 'Error',
          message: err.message || String(err),
          line: extractLineFromError(err),
          phase: 'execution'
        }
      });
      return;
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
