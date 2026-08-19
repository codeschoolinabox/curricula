import { describe, expect, it } from 'vitest';

import refuseAbsentCapability from '../refuse-absent-capability.js';

describe('refuseAbsentCapability', () => {
	describe('Z — both capabilities absent', () => {
		it('names the worker first — the arm order is pinned', () => {
			const refusal = refuseAbsentCapability('run', {
				worker: false,
				sharedMemory: false,
			});
			expect(refusal?.reason).toBe(
				'run needs a Worker (this looks like server-side rendering or plain Node) to sandbox a program; this environment has none',
			);
		});
	});

	describe('O — one capability absent', () => {
		it('words the worker sentence exactly', () => {
			const refusal = refuseAbsentCapability('run', {
				worker: false,
				sharedMemory: true,
			});
			expect(refusal?.reason).toBe(
				'run needs a Worker (this looks like server-side rendering or plain Node) to sandbox a program; this environment has none',
			);
		});

		it('words the shared-memory sentence exactly', () => {
			const refusal = refuseAbsentCapability('run', {
				worker: true,
				sharedMemory: false,
			});
			expect(refusal?.reason).toBe(
				'run needs SharedArrayBuffer (the page is not cross-origin isolated — it needs COOP/COEP headers) to sandbox a program; this environment has none',
			);
		});
	});

	describe('S — both capabilities present, the simple pass', () => {
		it('answers null', () => {
			const verdict = refuseAbsentCapability('run', {
				worker: true,
				sharedMemory: true,
			});
			expect(verdict).toBeNull();
		});
	});

	describe('I — the refusal shape', () => {
		it('is a structured refusal', () => {
			const refusal = refuseAbsentCapability('run', {
				worker: false,
				sharedMemory: false,
			});
			expect(refusal?.refused).toBe(true);
		});

		it('is frozen', () => {
			const refusal = refuseAbsentCapability('run', {
				worker: false,
				sharedMemory: false,
			});
			expect(Object.isFrozen(refusal)).toBe(true);
		});

		it('opens with the given evaluator name', () => {
			const refusal = refuseAbsentCapability('intercept', {
				worker: false,
				sharedMemory: true,
			});
			expect(refusal?.reason.startsWith('intercept needs')).toBe(true);
		});
	});
});
