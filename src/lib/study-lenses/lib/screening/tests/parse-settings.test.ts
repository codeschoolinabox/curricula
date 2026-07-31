import { parse } from 'acorn';
import { describe, expect, it } from 'vitest';

import ECMA_VERSION from '../../../embody/ecma-version.js';
import PARSE_SETTINGS from '../parse-settings.js';

describe('PARSE_SETTINGS', () => {
	describe('the published options', () => {
		it('names no option beyond the two', () => {
			expect(Object.keys(PARSE_SETTINGS)).toHaveLength(2);
		});

		it('the language year → 2024', () => {
			expect(PARSE_SETTINGS.ecmaVersion).toBe(2024);
		});

		it('the source spans → on', () => {
			expect(PARSE_SETTINGS.ranges).toBe(true);
		});
	});

	describe('deliberately absent', () => {
		it('line/column — a violation carries offsets', () => {
			expect('locations' in PARSE_SETTINGS).toBe(false);
		});
	});

	describe('as acorn reads them', () => {
		it('a parsed statement carries its source span', () => {
			expect(
				parse('42;', { ...PARSE_SETTINGS, sourceType: 'module' }).body[0].range,
			).toEqual([0, 3]);
		});

		it('the published year admits syntax an older one refuses', () => {
			expect(() =>
				parse('a?.b;', { ...PARSE_SETTINGS, sourceType: 'module' }),
			).not.toThrow();
		});
	});

	describe('the published value', () => {
		it('is frozen', () => {
			expect(Object.isFrozen(PARSE_SETTINGS)).toBe(true);
		});
	});

	describe('deliberately absent', () => {
		it('the parse goal — it varies per source', () => {
			// PINNED(Phase-0 2437801d: the parse goal stays with the caller)
			expect('sourceType' in PARSE_SETTINGS).toBe(false);
		});
	});

	describe('the duplicated language year', () => {
		it("equals the embody region's numeral", () => {
			// PINNED(Phase-0 2437801d: the language year is duplicated on purpose — this test is the alarm)
			expect(PARSE_SETTINGS.ecmaVersion).toBe(ECMA_VERSION);
		});
	});
});
