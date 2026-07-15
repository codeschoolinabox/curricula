import { describe, it, expect } from 'vitest';

import lintJej from '../lint-jej.js';

describe('lintJej', () => {
	describe('clean input', () => {
		it('empty string yields no diagnostics', () => {
			expect(lintJej('')).toHaveLength(0);
		});

		it('valid JEJ yields no diagnostics', () => {
			expect(lintJej('let x = 5;')).toHaveLength(0);
		});
	});

	describe('a single rejection', () => {
		it('flags one violation for a var declaration', () => {
			expect(lintJej('var x = 5;')).toHaveLength(1);
		});

		it('the diagnostic message names the offending construct', () => {
			const [d] = lintJej('var x = 5;');
			expect(d.message).toContain('var');
		});

		it('the diagnostic severity is rejection', () => {
			const [d] = lintJej('var x = 5;');
			expect(d.severity).toBe('rejection');
		});

		it('the diagnostic source is JEJ', () => {
			const [d] = lintJej('var x = 5;');
			expect(d.source).toBe('JEJ');
		});

		it('the diagnostic line forwards the violation location', () => {
			const [d] = lintJej('\nvar x = 5;');
			expect(d.line).toBe(2);
		});
	});

	describe('many rejections', () => {
		it('flags one diagnostic per violating statement', () => {
			expect(lintJej('var x = 5;\nvar y = 6;')).toHaveLength(2);
		});
	});

	describe('a parse failure', () => {
		it('yields exactly one diagnostic', () => {
			expect(lintJej('let x = ;')).toHaveLength(1);
		});

		it('the parse diagnostic severity is error, not rejection', () => {
			const [d] = lintJej('let x = ;');
			expect(d.severity).toBe('error');
		});

		it('the parse diagnostic source is JEJ', () => {
			const [d] = lintJej('let x = ;');
			expect(d.source).toBe('JEJ');
		});

		it('the parse diagnostic carries a non-empty message', () => {
			const [d] = lintJej('let x = ;');
			expect(d.message.length).toBeGreaterThan(0);
		});

		it('the parse diagnostic line forwards the error location', () => {
			const [d] = lintJej('\nlet x = ;');
			expect(d.line).toBe(2);
		});
	});

	describe('rejection diagnostics carry rich DocEntry payload', () => {
		it('var rejection attaches the DocEntry for var', () => {
			const [d] = lintJej('var x = 5;');
			expect(d.entry).toBeDefined();
			expect(d.entry?.isJEJ).toBe(false);
			expect(d.entry?.whyNotInJej).toBeTruthy();
		});

		it('function rejection attaches the DocEntry via first-word extraction', () => {
			const [d] = lintJej('function foo() {}');
			expect(d.entry?.isJEJ).toBe(false);
			expect(d.entry?.description).toBeTruthy();
		});

		it('arrow rejection attaches the DocEntry via arrow detection', () => {
			const [d] = lintJej('const f = (a) => a;');
			expect(d.entry?.isJEJ).toBe(false);
		});

		it('split rejection attaches the DocEntry via last-identifier extraction', () => {
			const result = lintJej("'a'.split(',')");
			const splitDiag = result.find(function findSplit(d) {
				return d.entry?.whyNotInJej?.includes('split') === true;
			});
			expect(splitDiag?.entry?.isJEJ).toBe(false);
		});

		it('parse failures do NOT carry an entry payload', () => {
			const [d] = lintJej('let x = ;');
			expect(d.entry).toBeUndefined();
		});
	});

	describe('return value is frozen', () => {
		it('returns a frozen array', () => {
			expect(Object.isFrozen(lintJej('var x = 5;'))).toBe(true);
		});

		it('freezes each rejection diagnostic', () => {
			expect(Object.isFrozen(lintJej('var x = 5;')[0])).toBe(true);
		});

		it('freezes the synthesized parse diagnostic', () => {
			expect(Object.isFrozen(lintJej('let x = ;')[0])).toBe(true);
		});
	});
});
