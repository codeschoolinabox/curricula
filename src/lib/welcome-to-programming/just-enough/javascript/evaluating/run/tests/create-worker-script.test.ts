import { describe, expect, it } from 'vitest';

import createWorkerScript from '../create-worker-script.js';

describe('createWorkerScript', () => {
	describe('returns valid JavaScript', () => {
		it('returns a non-empty string', () => {
			const script = createWorkerScript();
			expect(typeof script).toBe('string');
			expect(script.length).toBeGreaterThan(0);
		});

		it('is parseable as JavaScript', () => {
			const script = createWorkerScript();
			// new Function validates syntax without executing
			expect(() => new Function(script)).not.toThrow();
		});
	});

	describe('defines expected trap names', () => {
		it('contains console.log trap', () => {
			const script = createWorkerScript();
			expect(script).toContain('log');
		});

		it('contains console.assert trap', () => {
			const script = createWorkerScript();
			expect(script).toContain('assert');
		});

		it('contains alert trap', () => {
			const script = createWorkerScript();
			expect(script).toContain('trappedAlert');
		});

		it('contains confirm trap', () => {
			const script = createWorkerScript();
			expect(script).toContain('trappedConfirm');
		});

		it('contains prompt trap', () => {
			const script = createWorkerScript();
			expect(script).toContain('trappedPrompt');
		});
	});

	describe('worker message handling', () => {
		it('handles setup message type', () => {
			const script = createWorkerScript();
			expect(script).toContain("'setup'");
		});

		it('handles execute message type', () => {
			const script = createWorkerScript();
			expect(script).toContain("'execute'");
		});

		it('uses new Function for code execution', () => {
			const script = createWorkerScript();
			expect(script).toContain('new Function');
		});

		it('adds use strict prefix', () => {
			const script = createWorkerScript();
			expect(script).toContain('use strict');
		});
	});

	describe('SAB protocol integration', () => {
		it('references Atomics.wait for I/O blocking', () => {
			const script = createWorkerScript();
			expect(script).toContain('Atomics.wait');
		});

		it('references Atomics.load for reading responses', () => {
			const script = createWorkerScript();
			expect(script).toContain('Atomics.load');
		});

		it('references Atomics.store for resetting signals', () => {
			const script = createWorkerScript();
			expect(script).toContain('Atomics.store');
		});
	});

	describe('error phase separation', () => {
		it('distinguishes creation phase errors', () => {
			const script = createWorkerScript();
			expect(script).toContain('creation');
		});

		it('distinguishes execution phase errors', () => {
			const script = createWorkerScript();
			expect(script).toContain('execution');
		});
	});
});
