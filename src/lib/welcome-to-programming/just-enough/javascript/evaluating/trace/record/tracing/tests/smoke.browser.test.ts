/**
 * @file Smoke test for browser test infrastructure.
 *
 * Verifies that the browser environment supports SharedArrayBuffer
 * and Web Workers — prerequisites for trace integration tests.
 */

import { describe, expect, it } from 'vitest';

describe('browser test infrastructure', () => {
	it('SharedArrayBuffer is available', () => {
		expect(typeof SharedArrayBuffer).toBe('function');
	});

	it('can create a SharedArrayBuffer', () => {
		const sab = new SharedArrayBuffer(64);
		expect(sab.byteLength).toBe(64);
	});

	it('Atomics is available', () => {
		expect(typeof Atomics).toBe('object');
	});

	it('can create a Worker from blob URL', () => {
		const blob = new Blob(['postMessage("ok")'], {
			type: 'application/javascript',
		});
		const url = URL.createObjectURL(blob);
		const worker = new Worker(url);

		return new Promise<void>((resolve) => {
			worker.onmessage = (e) => {
				expect(e.data).toBe('ok');
				worker.terminate();
				URL.revokeObjectURL(url);
				resolve();
			};
		});
	});

	it('Worker can use SharedArrayBuffer', () => {
		const sab = new SharedArrayBuffer(4);
		const view = new Int32Array(sab);
		Atomics.store(view, 0, 0);

		const workerCode = `
			self.onmessage = function(e) {
				const view = new Int32Array(e.data);
				Atomics.store(view, 0, 42);
				postMessage('done');
			};
		`;
		const blob = new Blob([workerCode], {
			type: 'application/javascript',
		});
		const url = URL.createObjectURL(blob);
		const worker = new Worker(url);

		return new Promise<void>((resolve) => {
			worker.onmessage = () => {
				expect(Atomics.load(view, 0)).toBe(42);
				worker.terminate();
				URL.revokeObjectURL(url);
				resolve();
			};
			worker.postMessage(sab);
		});
	});
});
