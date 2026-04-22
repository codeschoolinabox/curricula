import { describe, expect, it } from 'vitest';

import createWorkerScript from '../create-worker-script.js';

const ALL_CONSOLE_METHODS = [
	'log', 'debug', 'info', 'warn', 'error',
	'assert', 'table', 'dir', 'dirxml',
	'group', 'groupCollapsed', 'groupEnd',
	'count', 'countReset',
	'time', 'timeEnd', 'timeLog',
	'trace', 'clear',
] as const;

describe('createWorkerScript', () => {
	describe('returns valid JavaScript', () => {
		it('returns a non-empty string', () => {
			const script = createWorkerScript();
			expect(typeof script).toBe('string');
			expect(script.length).toBeGreaterThan(0);
		});

		it('is parseable as JavaScript', () => {
			const script = createWorkerScript();
			expect(() => new Function(script)).not.toThrow();
		});
	});

	describe('console trap — ConsoleEvent format', () => {
		it('emits event discriminant "console" (not "log" or "assert")', () => {
			const script = createWorkerScript();
			expect(script).toContain("event: 'console'");
			expect(script).not.toContain("event: 'log'");
			expect(script).not.toContain("event: 'assert'");
		});

		it('emits method field from the CONSOLE_METHODS array', () => {
			const script = createWorkerScript();
			expect(script).toContain('method: method');
		});

		it('defines all 19 console methods in CONSOLE_METHODS', () => {
			const script = createWorkerScript();
			for (const method of ALL_CONSOLE_METHODS) {
				expect(script).toContain(`'${method}'`);
			}
		});

		it('builds trappedConsole via forEach over CONSOLE_METHODS', () => {
			const script = createWorkerScript();
			expect(script).toContain('CONSOLE_METHODS');
			expect(script).toContain('trappedConsole');
			expect(script).toContain('forEach');
		});
	});

	describe('dialog traps', () => {
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

		it('posts io-request for alert, confirm, prompt', () => {
			const script = createWorkerScript();
			expect(script).toContain("'io-request'");
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
		it('references Atomics.wait for I/O blocking and pause', () => {
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

		it('calls checkPause after posting each console event', () => {
			const script = createWorkerScript();
			expect(script).toContain('checkPause');
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
