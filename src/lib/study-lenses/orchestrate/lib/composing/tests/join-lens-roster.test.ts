import { describe, expect, it } from 'vitest';

import debugPropsLens from '../../../../lenses/debug-props/index.jsx';
import parsonsLens from '../../../../lenses/parsons/index.jsx';
import writemeLens from '../../../../lenses/writeme/index.jsx';
import joinLensRoster from '../join-lens-roster.js';

describe('joinLensRoster', () => {
	describe('no injections', () => {
		it('empty injections → exactly the built-in roster', () => {
			expect(joinLensRoster([])).toEqual([
				parsonsLens,
				writemeLens,
				debugPropsLens,
			]);
		});
	});

	describe('appending injections', () => {
		it('one injected lens → appended after the built-in roster', () => {
			const highlight = {
				name: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(joinLensRoster([highlight]).slice(-1)).toEqual([highlight]);
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
			expect(joinLensRoster([highlight, outline]).slice(-2)).toEqual([
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

		it('sorts before injections in the joined roster', () => {
			const highlight = {
				name: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(joinLensRoster([highlight])).toEqual([
				parsonsLens,
				writemeLens,
				debugPropsLens,
				highlight,
			]);
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

		it('an injection colliding with a built-in name → throws naming the offender', () => {
			const shadowingParsons = {
				name: 'parsons',
				applicability: () => false,
				main: () => null,
			};
			expect(() => joinLensRoster([shadowingParsons])).toThrow('parsons');
		});
	});
});
