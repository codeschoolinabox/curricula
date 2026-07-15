import { describe, expect, it } from 'vitest';

import classifyLoadError from '../classify-load-error.js';

describe('classifyLoadError', () => {
	describe('cause — degrades to unknown', () => {
		it('a generic Error is unknown', () => {
			expect(classifyLoadError(new Error('boom')).cause).toBe('unknown');
		});
		it('a non-error value is unknown', () => {
			expect(classifyLoadError('a string').cause).toBe('unknown');
		});
		it('a nullish value is unknown', () => {
			expect(classifyLoadError(null).cause).toBe('unknown');
		});
	});

	describe('cause — storage-quota', () => {
		it('a QuotaExceededError DOMException', () => {
			expect(
				classifyLoadError(new DOMException('over quota', 'QuotaExceededError'))
					.cause,
			).toBe('storage-quota');
		});
		it('a duck-typed { name: QuotaExceededError } (cross-realm)', () => {
			expect(classifyLoadError({ name: 'QuotaExceededError' }).cause).toBe(
				'storage-quota',
			);
		});
		it('a message naming the quota', () => {
			expect(
				classifyLoadError(new Error('The quota has been exceeded.')).cause,
			).toBe('storage-quota');
		});
	});

	describe('cause — cache-evicted', () => {
		// Production path is the NotFoundError NAME (a raw OPFS/Cache miss). The message
		// patterns are best-effort: wllama's real eviction string is "Model is deleted
		// from the cache; …" (AR-3 web-verified against wllama source).
		it('a NotFoundError DOMException', () => {
			expect(
				classifyLoadError(new DOMException('entry gone', 'NotFoundError')).cause,
			).toBe('cache-evicted');
		});
		it('a duck-typed { name: NotFoundError } (cross-realm)', () => {
			expect(classifyLoadError({ name: 'NotFoundError' }).cause).toBe(
				'cache-evicted',
			);
		});
		it("wllama's real 'deleted from the cache' message", () => {
			expect(
				classifyLoadError(
					new Error('Model is deleted from the cache; call ModelManager to redownload'),
				).cause,
			).toBe('cache-evicted');
		});
	});

	describe('cause — device-lost (ledger-only, folds terminally)', () => {
		// WebLLM throws a DeviceLostError (its real name + message), NOT OperationError,
		// and GPUDevice.lost is a resolved Promise WebLLM converts — so the classifier
		// only ever sees DeviceLostError (AR-3 web-verified against web-llm src/error.ts).
		it("WebLLM's DeviceLostError (the real shape, by name)", () => {
			expect(
				classifyLoadError({
					name: 'DeviceLostError',
					message:
						'The WebGPU device was lost while loading the model. This often occurs due to running out of memory (OOM).',
				}).cause,
			).toBe('device-lost');
		});
		it('a message naming a lost device (gap-tolerant: "device was lost")', () => {
			expect(classifyLoadError(new Error('the GPU device was lost')).cause).toBe(
				'device-lost',
			);
		});
	});

	describe('cause — fetch-failed', () => {
		it('a TypeError from fetch', () => {
			expect(classifyLoadError(new TypeError('Failed to fetch')).cause).toBe(
				'fetch-failed',
			);
		});
		it('an HTTP error status (>= 400)', () => {
			expect(classifyLoadError({ status: 503 }).cause).toBe('fetch-failed');
		});
		it('a message naming the network', () => {
			expect(classifyLoadError(new Error('network request failed')).cause).toBe(
				'fetch-failed',
			);
		});
		it("Safari's 'Load failed' network message", () => {
			expect(classifyLoadError(new TypeError('Load failed')).cause).toBe(
				'fetch-failed',
			);
		});
	});

	describe('cause — precedence + boundaries', () => {
		it('most-specific wins: a fetch TypeError that ALSO names quota → storage-quota', () => {
			expect(
				classifyLoadError(new TypeError('failed to fetch: quota exceeded'))
					.cause,
			).toBe('storage-quota');
		});
		it('device-lost (by name) beats a fetch-shaped message', () => {
			expect(
				classifyLoadError({
					name: 'DeviceLostError',
					message: 'failed to fetch while the device was lost',
				}).cause,
			).toBe('device-lost');
		});
		it('a status below 400 is not a fetch error → unknown', () => {
			expect(classifyLoadError({ status: 399 }).cause).toBe('unknown');
		});
		it('a status at 400 is a fetch error', () => {
			expect(classifyLoadError({ status: 400 }).cause).toBe('fetch-failed');
		});
		it('a plain network error does NOT mislabel as cache-evicted', () => {
			expect(classifyLoadError(new TypeError('Failed to fetch')).cause).toBe(
				'fetch-failed',
			);
		});
	});

	describe('detail — the seam-crossing hint', () => {
		it('carries the error name + message (name: message)', () => {
			expect(classifyLoadError(new Error('boom')).detail).toMatch(/Error: boom/);
		});
		it('truncates a very long message', () => {
			const long = 'x'.repeat(10_000);
			const { detail } = classifyLoadError(new Error(long));
			if (detail === undefined) throw new Error('expected a detail');
			expect(detail.length).toBeLessThan(600);
			expect(detail.endsWith('…')).toBe(true);
		});
		it('is omitted when there is no message', () => {
			expect(classifyLoadError(null).detail).toBeUndefined();
		});
	});
});
