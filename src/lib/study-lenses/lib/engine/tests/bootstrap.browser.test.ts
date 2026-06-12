import { describe, expect, it } from 'vitest';

import clearEventReady from '../worker/clear-event-ready.js';
import createBufferViews from '../worker/create-buffer-views.js';
import PROTOCOL from '../worker/protocol.js';
import type { BufferViews } from '../worker/types.js';
import writeCallResponse from '../worker/write-call-response.js';
import writeResumeSignal from '../worker/write-resume-signal.js';

type Inbox = () => Promise<unknown>;

function spawnReferenceWorker(): { worker: Worker; next: Inbox } {
	const worker = new Worker(
		new URL('../testing/test-worker-entry.ts', import.meta.url),
		{ type: 'module' },
	);
	const queue: unknown[] = [];
	const waiters: ((value: unknown) => void)[] = [];
	worker.addEventListener('message', (event) => {
		const waiter = waiters.shift();
		if (waiter) {
			waiter(event.data);
		} else {
			queue.push(event.data);
		}
	});
	worker.addEventListener('error', (event) => {
		const failure = { kind: 'load-error', message: event.message };
		const waiter = waiters.shift();
		if (waiter) {
			waiter(failure);
		} else {
			queue.push(failure);
		}
	});
	function next(): Promise<unknown> {
		if (queue.length > 0) {
			return Promise.resolve(queue.shift());
		}
		return new Promise((resolve) => {
			waiters.push(resolve);
		});
	}
	return { worker, next };
}

async function startRun(
	workerConfig: unknown,
	code: string,
	strict = true,
): Promise<{ worker: Worker; views: BufferViews; next: Inbox }> {
	const { worker, next } = spawnReferenceWorker();
	await next();
	const views = createBufferViews(new SharedArrayBuffer(PROTOCOL.BUFFER_SIZE));
	worker.postMessage({
		kind: 'setup',
		sharedBuffer: views.control.buffer,
		workerConfig,
	});
	worker.postMessage({ kind: 'execute', code, strict });
	return { worker, views, next };
}

function resumeWorker(views: BufferViews): void {
	clearEventReady(views);
	writeResumeSignal(views);
}

describe('bootstrap', () => {
	describe('ready handshake', () => {
		it('posts ready on load', async () => {
			const { worker, next } = spawnReferenceWorker();
			const first = await next();
			worker.terminate();

			expect(first).toEqual({ kind: 'ready' });
		});
	});

	describe('execution and emission', () => {
		it('posts the message an executing program emits', async () => {
			const { worker, next } = await startRun({}, "emit('hi');");
			const first = await next();
			worker.terminate();

			expect(first).toEqual({ kind: 'message', message: 'hi' });
		});

		it('posts two emissions in worker-post order', async () => {
			const { worker, views, next } = await startRun(
				{},
				"emit('a'); emit('b');",
			);
			const first = (await next()) as { message: string };
			resumeWorker(views);
			const second = (await next()) as { message: string };
			worker.terminate();

			expect([first.message, second.message]).toEqual(['a', 'b']);
		});
	});

	describe('halt authoring', () => {
		it('posts the engine-default natural-end halt when serializeHalt is omitted', async () => {
			const { worker, next } = await startRun({ omitSerializeHalt: true }, '');
			const halt = await next();
			worker.terminate();

			expect(halt).toEqual({
				kind: 'halt',
				haltKind: 'natural-end',
				payload: { name: 'natural-end', message: '' },
			});
		});

		it('posts the engine-default throw halt when serializeHalt is omitted', async () => {
			const { worker, next } = await startRun(
				{ omitSerializeHalt: true },
				"throw new TypeError('boom');",
			);
			const halt = await next();
			worker.terminate();

			expect(halt).toEqual({
				kind: 'halt',
				haltKind: 'throw',
				payload: { name: 'TypeError', message: 'boom' },
			});
		});

		it('invokes the consumer serializer on natural end', async () => {
			const { worker, next } = await startRun({}, '');
			const halt = await next();
			worker.terminate();

			expect(halt).toEqual({
				kind: 'halt',
				haltKind: 'natural-end',
				payload: {
					kind: 'natural-end',
					name: 'natural-end',
					message: '',
					viaReference: true,
				},
			});
		});

		it('invokes the consumer serializer on a thrown error', async () => {
			const { worker, next } = await startRun({}, "throw new Error('kapot');");
			const halt = (await next()) as { payload: { message: string } };
			worker.terminate();

			expect(halt.payload.message).toBe('kapot');
		});
	});

	describe('pause protocol', () => {
		it('holds the program paused while the emission awaits disposal', async () => {
			const { worker, next } = await startRun({}, "emit('x');");
			await next();
			const raced = await Promise.race([
				next().then(() => 'halt-arrived'),
				new Promise((resolve) => {
					setTimeout(() => resolve('still-paused'), 100);
				}),
			]);
			worker.terminate();

			expect(raced).toBe('still-paused');
		});

		it('resumes the program when the thread releases the pause', async () => {
			const { worker, views, next } = await startRun({}, "emit('x');");
			await next();
			resumeWorker(views);
			const halt = (await next()) as { kind: string };
			worker.terminate();

			expect(halt.kind).toBe('halt');
		});
	});

	describe('call round-trip', () => {
		it('returns the thread-written response into the program', async () => {
			const { worker, views, next } = await startRun({}, "emit(call('ping'));");
			const request = await next();
			expect(request).toEqual({ kind: 'call', request: 'ping' });
			writeCallResponse(views, 'pong');
			const emitted = await next();
			worker.terminate();

			expect(emitted).toEqual({ kind: 'message', message: 'pong' });
		});
	});

	describe('strict flag', () => {
		it('runs sloppy-mode constructs under strict false', async () => {
			const { worker, next } = await startRun(
				{},
				'with (Math) { emit(PI); }',
				false,
			);
			const first = await next();
			worker.terminate();

			expect(first).toEqual({ kind: 'message', message: Math.PI });
		});

		it('halts with a SyntaxError under strict true', async () => {
			const { worker, next } = await startRun(
				{},
				'with (Math) { emit(PI); }',
				true,
			);
			const halt = (await next()) as { payload: { name: string } };
			worker.terminate();

			expect(halt.payload.name).toBe('SyntaxError');
		});
	});

	describe('worker-global channel', () => {
		it('exposes globals installed on globalThis to the program', async () => {
			const { worker, next } = await startRun(
				{
					installWorkerGlobal: {
						name: '__referenceGlobal',
						value: 'installed',
					},
				},
				'emit(__referenceGlobal);',
			);
			const first = await next();
			worker.terminate();

			expect(first).toEqual({ kind: 'message', message: 'installed' });
		});
	});

	describe('consumer failures post failure, never throw', () => {
		it('rejects a non-identifier global key', async () => {
			const { worker, next } = await startRun({ invalidGlobalKey: '1bad' }, '');
			const failure = await next();
			worker.terminate();

			expect(failure).toEqual({
				kind: 'failure',
				name: 'EngineSetupError',
				message: expect.stringContaining('1bad'),
			});
		});

		it('rejects a reserved word as a global key', async () => {
			const { worker, next } = await startRun({ invalidGlobalKey: 'if' }, '');
			const failure = (await next()) as { kind: string };
			worker.terminate();

			expect(failure.kind).toBe('failure');
		});

		it('reports a throwing consumer setup', async () => {
			const { worker, next } = await startRun({ throwInSetup: true }, '');
			const failure = await next();
			worker.terminate();

			expect(failure).toEqual({
				kind: 'failure',
				name: 'EngineSetupError',
				message: expect.stringContaining('reference setup throw'),
			});
		});

		it('reports a throwing halt serializer', async () => {
			const { worker, next } = await startRun(
				{ throwInSerializeHalt: true },
				'',
			);
			const failure = await next();
			worker.terminate();

			expect(failure).toEqual({
				kind: 'failure',
				name: 'EngineHaltError',
				message: expect.stringContaining('reference serializer throw'),
			});
		});

		it('reports an execute arriving before setup', async () => {
			const { worker, next } = spawnReferenceWorker();
			await next();
			worker.postMessage({ kind: 'execute', code: '', strict: true });
			const failure = await next();
			worker.terminate();

			expect(failure).toEqual({
				kind: 'failure',
				name: 'EngineSetupError',
				message: expect.stringContaining('before setup'),
			});
		});
	});
});
