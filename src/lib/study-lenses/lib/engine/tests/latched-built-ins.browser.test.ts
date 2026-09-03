import { describe, expect, it } from 'vitest';

import clearEventReady from '../worker/clear-event-ready.js';
import createBufferViews from '../worker/create-buffer-views.js';
import PROTOCOL from '../worker/protocol.js';
import type { BufferViews } from '../worker/types.js';
import writeResumeSignal from '../worker/write-resume-signal.js';

type Inbox = () => Promise<unknown>;

function spawnSourceWorker(source: string): { worker: Worker; next: Inbox } {
	const url = URL.createObjectURL(
		new Blob([source], { type: 'text/javascript' }),
	);
	const worker = new Worker(url, { type: 'module' });
	URL.revokeObjectURL(url);
	return { worker, next: inboxFor(worker) };
}

function spawnReferenceWorker(): { worker: Worker; next: Inbox } {
	const worker = new Worker(
		new URL('../testing/test-worker-entry.ts', import.meta.url),
		{ type: 'module' },
	);
	return { worker, next: inboxFor(worker) };
}

async function startRun(
	workerConfig: unknown,
	code: string,
	strict = true,
	execution: 'function' | 'module' = 'function',
): Promise<{ worker: Worker; views: BufferViews; next: Inbox }> {
	const { worker, next } = spawnReferenceWorker();
	await next();
	const views = createBufferViews(new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE));
	worker.postMessage({
		kind: 'setup',
		sharedBuffer: views.control.buffer,
		workerConfig,
	});
	worker.postMessage({ kind: 'execute', code, strict, execution });
	return { worker, views, next };
}

function resumeWorker(views: BufferViews): void {
	clearEventReady(views);
	writeResumeSignal(views);
}

// WHY the bound: an unlatched read on the module path throws inside a floating
// promise, so nothing reaches the thread at all. Racing a sentinel turns that
// silence into a readable failure instead of a suite-level timeout.
function within(next: Inbox, ms = 500): Promise<unknown> {
	return Promise.race([
		next(),
		new Promise((resolve) => setTimeout(() => resolve('NOTHING ARRIVED'), ms)),
	]);
}

function inboxFor(worker: Worker): Inbox {
	const queue: unknown[] = [];
	const waiters: ((value: unknown) => void)[] = [];
	function deliver(value: unknown): void {
		const waiter = waiters.shift();
		if (waiter) {
			waiter(value);
		} else {
			queue.push(value);
		}
	}
	worker.addEventListener('message', (event) => {
		deliver(event.data);
	});
	worker.addEventListener('error', (event) => {
		deliver({ threw: event.message });
	});
	return function next(): Promise<unknown> {
		if (queue.length > 0) {
			return Promise.resolve(queue.shift());
		}
		return new Promise((resolve) => {
			waiters.push(resolve);
		});
	};
}

describe('latched built-ins', () => {
	describe('platform capability', () => {
		it('a detached postMessage reaches the thread from a worker global scope', async () => {
			const { worker, next } = spawnSourceWorker(
				"const post = postMessage;\npost('detached');",
			);
			const first = await next();
			worker.terminate();

			expect(first).toBe('detached');
		});

		it('a listener registered through a captured globalThis still receives messages', async () => {
			const { worker, next } = spawnSourceWorker(
				"const GLOBAL = globalThis;\nGLOBAL.addEventListener('message', (event) => postMessage(event.data));",
			);
			worker.postMessage('round-trip');
			const first = await next();
			worker.terminate();

			expect(first).toBe('round-trip');
		});
	});

	describe('a program that rebinds nothing', () => {
		it('function path — the natural-end halt arrives', async () => {
			const { worker, next } = await startRun({ omitSerializeHalt: true }, '');
			const halt = await within(next);
			worker.terminate();

			expect(halt).toEqual({
				kind: 'halt',
				haltKind: 'natural-end',
				payload: { name: 'natural-end', message: '' },
			});
		});

		it('module path — the natural-end halt arrives', async () => {
			const { worker, next } = await startRun(
				{ omitSerializeHalt: true },
				'',
				true,
				'module',
			);
			const halt = await within(next);
			worker.terminate();

			expect(halt).toEqual({
				kind: 'halt',
				haltKind: 'natural-end',
				payload: { name: 'natural-end', message: '' },
			});
		});
	});

	describe('one rebound global', () => {
		it('function path — nulling postMessage does not cost the program its halt', async () => {
			const { worker, next } = await startRun(
				{ omitSerializeHalt: true },
				'globalThis.postMessage = null;',
			);
			const halt = await within(next);
			worker.terminate();

			expect(halt).toEqual({
				kind: 'halt',
				haltKind: 'natural-end',
				payload: { name: 'natural-end', message: '' },
			});
		});

		it('module path — nulling postMessage does not cost the program its halt', async () => {
			const { worker, next } = await startRun(
				{ omitSerializeHalt: true },
				'globalThis.postMessage = null;',
				true,
				'module',
			);
			const halt = await within(next);
			worker.terminate();

			expect(halt).toEqual({
				kind: 'halt',
				haltKind: 'natural-end',
				payload: { name: 'natural-end', message: '' },
			});
		});
	});

	describe('several rebound globals at once', () => {
		it('rebinding postMessage, URL, Error and String together still yields a faithful halt', async () => {
			const { worker, next } = await startRun(
				{ omitSerializeHalt: true },
				'globalThis.postMessage = null;\nglobalThis.URL = null;\nglobalThis.Error = null;\nglobalThis.String = null;\nthrow new TypeError("boom");',
				true,
				'module',
			);
			const halt = await within(next);
			worker.terminate();

			expect(halt).toEqual({
				kind: 'halt',
				haltKind: 'throw',
				payload: { name: 'TypeError', message: 'boom', phase: 'evaluation' },
			});
		});

		it.skip('replacing Atomics.store still pauses between two emissions', async () => {
			const { worker, views, next } = await startRun(
				{},
				'Atomics.store = function () {};\nemit("a");\nemit("b");',
			);
			const first = (await within(next)) as { message: string };
			resumeWorker(views);
			const second = (await within(next)) as { message: string };
			worker.terminate();

			expect([first.message, second.message]).toEqual(['a', 'b']);
		});
	});

	describe('which writes reach the engine globals', () => {
		it('module path — an explicit global write lands on the shared global object', async () => {
			const { worker, next } = await startRun(
				{},
				'globalThis.probe = 1;\nemit(globalThis.probe === 1);',
				true,
				'module',
			);
			const first = (await within(next)) as { message: boolean };
			worker.terminate();

			expect(first.message).toBe(true);
		});

		it('module path — a top-level var does not land on the shared global object', async () => {
			const { worker, next } = await startRun(
				{},
				'var probe = 1;\nemit(globalThis.probe === 1);',
				true,
				'module',
			);
			const first = (await within(next)) as { message: boolean };
			worker.terminate();

			expect(first.message).toBe(false);
		});

		it('function path, sloppy — an undeclared assignment lands on the shared global object', async () => {
			const { worker, next } = await startRun(
				{},
				'probe = 1;\nemit(globalThis.probe === 1);',
				false,
			);
			const first = (await within(next)) as { message: boolean };
			worker.terminate();

			expect(first.message).toBe(true);
		});

		it('function path — a top-level var is a wrapper local', async () => {
			const { worker, next } = await startRun(
				{},
				'var probe = 1;\nemit(globalThis.probe === 1);',
			);
			const first = (await within(next)) as { message: boolean };
			worker.terminate();

			expect(first.message).toBe(false);
		});
	});

	describe('each built-in the program can reach after it starts', () => {
		it.skip('a replaced Atomics.notify still delivers the emission', async () => {
			const { worker, next } = await startRun(
				{},
				'Atomics.notify = function () {};\nemit("through");',
			);
			const first = (await within(next)) as { message: string };
			worker.terminate();

			expect(first.message).toBe('through');
		});

		it.skip('a replaced Atomics.load still returns the thread response into the program', async () => {
			const { worker, next } = await startRun(
				{},
				'Atomics.load = function () { return 0; };\nemit(call("ping"));',
			);
			const first = await within(next);
			worker.terminate();

			expect(first).toEqual({ kind: 'call', request: 'ping' });
		});

		it('nulling URL still revokes the blob and reaches the natural end', async () => {
			const { worker, next } = await startRun(
				{ omitSerializeHalt: true },
				'globalThis.URL = null;',
				true,
				'module',
			);
			const halt = await within(next);
			worker.terminate();

			expect(halt).toEqual({
				kind: 'halt',
				haltKind: 'natural-end',
				payload: { name: 'natural-end', message: '' },
			});
		});

		it('a replaced Error constructor does not cost the halt its name', async () => {
			const { worker, next } = await startRun(
				{ omitSerializeHalt: true },
				'globalThis.Error = function () {};\nthrow new TypeError("boom");',
			);
			const halt = await within(next);
			worker.terminate();

			expect(halt).toEqual({
				kind: 'halt',
				haltKind: 'throw',
				payload: { name: 'TypeError', message: 'boom', phase: 'evaluation' },
			});
		});
	});

	describe('the boundaries of the guarantee', () => {
		it('the engine default halt author is immune to a replaced String', async () => {
			const { worker, next } = await startRun(
				{ omitSerializeHalt: true },
				'globalThis.String = function () { return "CLOBBERED"; };\nthrow {};',
			);
			const halt = (await within(next)) as { payload: { message: string } };
			worker.terminate();

			expect(halt.payload.message).toBe('[object Object]');
		});

		it('consumer worker logic latches its own — a replaced String reaches the consumer halt author', async () => {
			const { worker, next } = await startRun(
				{},
				'globalThis.String = function () { return "CLOBBERED"; };\nthrow {};',
			);
			const halt = (await within(next)) as { payload: { message: string } };
			worker.terminate();

			expect(halt.payload.message).toBe('CLOBBERED');
		});

		it('a redefined Error hasInstance still reaches the halt author — a named residual, not a covered one', async () => {
			const { worker, next } = await startRun(
				{ omitSerializeHalt: true },
				'Object.defineProperty(Error, Symbol.hasInstance, { value: () => false });\nthrow new TypeError("boom");',
			);
			const halt = (await within(next)) as { payload: { name: string } };
			worker.terminate();

			expect(halt.payload.name).toBe('Error');
		});
	});

	describe('additional sanity', () => {
		it('module path — a nulled postMessage does not cost the program its emission', async () => {
			const { worker, next } = await startRun(
				{},
				'globalThis.postMessage = null;\nemit("still here");',
				true,
				'module',
			);
			const first = (await within(next)) as { message: string };
			worker.terminate();

			expect(first.message).toBe('still here');
		});

		it('function path — rebinding the whole Atomics namespace does not cost the program its emission', async () => {
			const { worker, next } = await startRun(
				{},
				'globalThis.Atomics = null;\nemit("still here");',
			);
			const first = (await within(next)) as { message: string };
			worker.terminate();

			expect(first.message).toBe('still here');
		});
	});
});
