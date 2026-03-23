import { afterEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error — untyped vendored legacy JS
import { traceCollector } from '../lib/trace-collector.js';
// @ts-expect-error — untyped vendored legacy JS
import { print } from '../lib/trace-log.js';
// @ts-expect-error — untyped vendored legacy JS
import { state } from '../data/state.js';

describe('print', () => {
	afterEach(() => {
		traceCollector.reset();
		// clean up any worker context mock
		delete (globalThis as Record<string, unknown>).WorkerGlobalScope;
		delete (globalThis as Record<string, unknown>).self;
		delete (globalThis as Record<string, unknown>).postMessage;
	});

	describe('non-worker context (Node)', () => {
		it('pushes entry to traceCollector', () => {
			state.loggedSteps = 1;

			print({ prefix: 'test:', logs: ['hello'] });

			const entries = traceCollector.getEntries();

			expect(entries.length).toBe(1);
			expect(entries[0].prefix).toContain('test:');
		});

		it('does not call postMessage', () => {
			state.loggedSteps = 1;
			const spy = vi.fn();
			(globalThis as Record<string, unknown>).postMessage = spy;
			// WorkerGlobalScope is NOT defined — not a worker context

			print({ prefix: 'test:', logs: ['hello'] });

			expect(spy).not.toHaveBeenCalled();
		});
	});

	describe('worker context', () => {
		it('calls postMessage when WorkerGlobalScope is defined', () => {
			state.loggedSteps = 1;
			const spy = vi.fn();
			// Mock worker environment: WorkerGlobalScope exists and self is an instance
			const FakeWorkerGlobalScope = class {};
			const fakeSelf = Object.create(FakeWorkerGlobalScope.prototype);
			(globalThis as Record<string, unknown>).WorkerGlobalScope =
				FakeWorkerGlobalScope;
			(globalThis as Record<string, unknown>).self = fakeSelf;
			(globalThis as Record<string, unknown>).postMessage = spy;

			print({ prefix: 'test:', logs: ['hello'] });

			expect(spy).toHaveBeenCalled();
		});
	});
});
