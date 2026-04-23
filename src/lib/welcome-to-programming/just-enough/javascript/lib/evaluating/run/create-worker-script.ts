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
 * All traps are always defined (all 19 console methods, alert, confirm,
 * prompt). Traps record ConsoleEvents and post them to the main thread.
 * I/O traps (alert/confirm/prompt) block via `Atomics.wait` until the
 * main thread writes a response to the SAB.
 */
function createWorkerScript(): string {
	return `"use strict";

// --- SAB layout constants (duplicated from worker-protocol.ts) ---

const CONTROL_INDEX = 0;
const RESPONSE_TYPE_INDEX = 1;
const NULL_FLAG_INDEX = 2;
const PAYLOAD_LENGTH_INDEX = 3;
const PAUSE_INDEX = 4;
const EVENT_READY_INDEX = 5;
const PAYLOAD_BYTE_OFFSET = 24;

const RESPONSE_STRING = 0;
const RESPONSE_BOOLEAN = 1;
const RESPONSE_VOID = 2;

const SIGNAL_IDLE = 0;
const SIGNAL_WAITING = 1;
const SIGNAL_RESPONDED = 2;

const PAUSE_RUNNING = 0;
const PAUSE_PAUSED = 1;

// --- Pause protocol (blocks Worker between events) ---

function checkPause() {
  while (Atomics.load(controlView, PAUSE_INDEX) === PAUSE_PAUSED) {
    Atomics.wait(controlView, PAUSE_INDEX, PAUSE_PAUSED);
  }
}

// --- State (set on setup message) ---

let controlView = null;
let payloadView = null;
const events = [];
var isScriptMode = false;

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
        // WHY: without scriptMode, new Function prepends "use strict"
        // as line 1, so user code starts at line 2. Subtract 1 to get
        // user line. In scriptMode, no prefix — line numbers are exact.
        if (isScriptMode) {
          if (lineNum >= 1) return lineNum;
        } else {
          if (lineNum >= 2) return lineNum - 1;
        }
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

// --- Console traps (all 19 standard methods → ConsoleEvent) ---

const CONSOLE_METHODS = [
  'log', 'debug', 'info', 'warn', 'error',
  'assert', 'table', 'dir', 'dirxml',
  'group', 'groupCollapsed', 'groupEnd',
  'count', 'countReset',
  'time', 'timeEnd', 'timeLog',
  'trace', 'clear'
];

const trappedConsole = {};
CONSOLE_METHODS.forEach(function(method) {
  trappedConsole[method] = function() {
    const args = safeCloneArgs(Array.from(arguments));
    const line = getLine();
    const event = { event: 'console', method: method, args: args, line: line };
    events.push(event);
    Atomics.store(controlView, PAUSE_INDEX, PAUSE_PAUSED);
    postMessage({ type: 'event', event: event });
    checkPause();
  };
});

// --- Dialog traps (prompt/alert/confirm → io-request) ---

function trappedAlert() {
  const args = safeCloneArgs(Array.from(arguments));
  const line = getLine();
  postMessage({ type: 'io-request', name: 'alert', args: args, line: line });
  waitForResponse();
  readResponse();
  const event = { event: 'alert', args: args, return: undefined, line: line };
  events.push(event);
  Atomics.store(controlView, PAUSE_INDEX, PAUSE_PAUSED);
  postMessage({ type: 'event', event: event });
  checkPause();
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
  Atomics.store(controlView, PAUSE_INDEX, PAUSE_PAUSED);
  postMessage({ type: 'event', event: event });
  checkPause();
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
  Atomics.store(controlView, PAUSE_INDEX, PAUSE_PAUSED);
  postMessage({ type: 'event', event: event });
  checkPause();
  return returnValue;
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
    // 0. Build loop counter declarations prefix.
    // WHY: var loop1=0,...; is prepended on the same line as "use strict"
    // (no added newline) so user code line numbers are unchanged.
    var loopDeclarations = '';
    if (msg.loopCount > 0) {
      var decls = [];
      for (var li = 1; li <= msg.loopCount; li++) {
        decls.push('loop' + li + ' = 0');
      }
      loopDeclarations = 'var ' + decls.join(', ') + '; ';
    }

    // 1. Construction phase — SyntaxError from new Function
    var fn;
    try {
      var prefix = msg.scriptMode
        ? loopDeclarations
        : ('"use strict"; ' + loopDeclarations + '\\n');
      fn = new Function('console', 'alert', 'confirm', 'prompt', prefix + msg.code);
    } catch (err) {
      var errorEvent = {
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
      var errorEvent2 = {
        event: 'error',
        name: err.name || 'Error',
        message: err.message || String(err),
        line: extractLineFromError(err),
        phase: 'execution'
      };
      events.push(errorEvent2);
      postMessage({ type: 'event', event: errorEvent2 });
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
      if (isScriptMode) {
        if (lineNum >= 1) return lineNum;
      } else {
        if (lineNum >= 2) return lineNum - 1;
      }
    }
  }
  return undefined;
}
`;
}

export default createWorkerScript;
