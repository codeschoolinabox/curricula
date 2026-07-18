import { describe, expect, it } from 'vitest';

import joinLensRoster from '../join-lens-roster.js';

describe('joinLensRoster', () => {
	describe('no injections', () => {
		it('empty injections → the empty built-in roster', () => {
			expect(joinLensRoster([])).toEqual([]);
		});
	});

	describe('appending injections', () => {
		it('one injected lens → a roster of exactly that lens', () => {
			const highlight = {
				name: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(joinLensRoster([highlight])).toEqual([highlight]);
		});

		it('preserves the given injection order', () => {
			const highlight = {
				name: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			const outline = {
				name: 'outline',
				applicability: () => true,
				main: () => null,
			};
			expect(joinLensRoster([highlight, outline])).toEqual([
				highlight,
				outline,
			]);
		});
	});

	describe('frozen output', () => {
		it('a populated joined roster is frozen', () => {
			const highlight = {
				name: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(Object.isFrozen(joinLensRoster([highlight]))).toBe(true);
		});

		it('an injected lens ref stays unfrozen', () => {
			const highlight = {
				name: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			joinLensRoster([highlight]);
			expect(Object.isFrozen(highlight)).toBe(false);
		});
	});

	describe('the built-in roster', () => {
		it('contains no entry named "scaffold"', () => {
			expect(joinLensRoster([]).some((lens) => lens.name === 'scaffold')).toBe(
				false,
			);
		});
	});

	describe('name collisions', () => {
		it('a duplicate lens name → throws', () => {
			const highlight = {
				name: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			const shadowing = {
				name: 'highlight',
				applicability: () => false,
				main: () => null,
			};
			expect(() => joinLensRoster([highlight, shadowing])).toThrow();
		});

		it('the collision error names the offending lens', () => {
			const highlight = {
				name: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			const shadowing = {
				name: 'highlight',
				applicability: () => false,
				main: () => null,
			};
			expect(() => joinLensRoster([highlight, shadowing])).toThrow('highlight');
		});

		it('the same lens ref injected twice → throws', () => {
			const highlight = {
				name: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(() => joinLensRoster([highlight, highlight])).toThrow();
		});
	});
});
