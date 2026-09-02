// cspell:ignore renderable

import { afterEach, describe, expect, it, vi } from 'vitest';

import recoverRenderableLenses from '../recover-renderable-lenses.js';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('recoverRenderableLenses', () => {
	describe('nothing attached', () => {
		it('empty attached refs → no renderable lenses', () => {
			const highlight = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(recoverRenderableLenses([highlight], [])).toEqual([]);
		});
	});

	describe('recovering attached lenses', () => {
		it('one attached roster ref → exactly that lens', () => {
			const highlight = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(recoverRenderableLenses([highlight], [highlight])).toEqual([
				highlight,
			]);
		});

		it('recovered lenses follow the roster order, not the attached order', () => {
			const highlight = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			const outline = {
				name: 'outline',
				label: 'outline',
				applicability: () => true,
				main: () => null,
			};
			const trace = {
				name: 'trace',
				label: 'trace',
				applicability: () => true,
				main: () => null,
			};
			expect(
				recoverRenderableLenses(
					[highlight, outline, trace],
					[trace, highlight],
				),
			).toEqual([highlight, trace]);
		});

		it('the same ref attached twice is recovered once', () => {
			const highlight = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(
				recoverRenderableLenses([highlight], [highlight, highlight]),
			).toEqual([highlight]);
		});
	});

	describe('identity, never name', () => {
		it('a same-named impostor object is not recovered', () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			const highlight = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			const impostor = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(recoverRenderableLenses([highlight], [impostor])).toEqual([]);
		});
	});

	describe('frozen output', () => {
		it('the recovered array is frozen', () => {
			const highlight = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			expect(
				Object.isFrozen(recoverRenderableLenses([highlight], [highlight])),
			).toBe(true);
		});

		it('a recovered lens ref stays unfrozen', () => {
			const highlight = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			recoverRenderableLenses([highlight], [highlight]);
			expect(Object.isFrozen(highlight)).toBe(false);
		});
	});

	describe('unknown attached refs', () => {
		it('known refs are still recovered alongside an unknown one', () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			const highlight = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			const mystery = {
				name: 'mystery',
				label: 'mystery',
				applicability: () => true,
				main: () => null,
			};
			expect(
				recoverRenderableLenses([highlight], [highlight, mystery]),
			).toEqual([highlight]);
		});

		it('an unknown ref is reported naming it', () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const highlight = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			const mystery = {
				name: 'mystery',
				label: 'mystery',
				applicability: () => true,
				main: () => null,
			};
			recoverRenderableLenses([highlight], [mystery]);
			expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('mystery'));
		});

		it('two unknown refs → two reports', () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const mystery = {
				name: 'mystery',
				label: 'mystery',
				applicability: () => true,
				main: () => null,
			};
			const phantom = {
				name: 'phantom',
				label: 'phantom',
				applicability: () => true,
				main: () => null,
			};
			recoverRenderableLenses([], [mystery, phantom]);
			expect(errorSpy).toHaveBeenCalledTimes(2);
		});

		it('an empty roster with an unknown ref recovers nothing', () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			const mystery = {
				name: 'mystery',
				label: 'mystery',
				applicability: () => true,
				main: () => null,
			};
			expect(recoverRenderableLenses([], [mystery])).toEqual([]);
		});

		it('an empty roster still reports the unknown ref', () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const mystery = {
				name: 'mystery',
				label: 'mystery',
				applicability: () => true,
				main: () => null,
			};
			recoverRenderableLenses([], [mystery]);
			expect(errorSpy).toHaveBeenCalledTimes(1);
		});

		it('the same unknown ref attached twice → two reports', () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const mystery = {
				name: 'mystery',
				label: 'mystery',
				applicability: () => true,
				main: () => null,
			};
			recoverRenderableLenses([], [mystery, mystery]);
			expect(errorSpy).toHaveBeenCalledTimes(2);
		});

		it('a fully-known render reports nothing', () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const highlight = {
				name: 'highlight',
				label: 'highlight',
				applicability: () => true,
				main: () => null,
			};
			recoverRenderableLenses([highlight], [highlight]);
			expect(errorSpy).toHaveBeenCalledTimes(0);
		});
	});
});
