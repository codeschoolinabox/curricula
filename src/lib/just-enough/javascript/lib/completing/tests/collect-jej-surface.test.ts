import { describe, expect, it } from 'vitest';

import collectJejSurface from '../collect-jej-surface.js';

describe('collectJejSurface', () => {
	describe('keywords branch', () => {
		it.each([
			'let',
			'const',
			'if',
			'for',
			'return',
			'true',
			'false',
			'null',
			'new',
			'typeof',
			'in',
		])('emits %s with source keyword', (label) => {
			const result = collectJejSurface({
				prefix: '',
				precedingText: '',
				fullText: '',
			});
			expect(result.find((s) => s.label === label)).toEqual({
				label,
				source: 'keyword',
			});
		});
	});

	describe('globals branch', () => {
		it.each([
			'console',
			'alert',
			'String',
			'Math',
			'Date',
			'BigInt',
			'parseInt',
			'NaN',
			'Infinity',
		])('emits %s with source global', (label) => {
			const result = collectJejSurface({
				prefix: '',
				precedingText: '',
				fullText: '',
			});
			expect(result.find((s) => s.label === label)).toEqual({
				label,
				source: 'global',
			});
		});
	});

	describe('easter-egg suppression', () => {
		it('eval does NOT appear in the surface', () => {
			const labels = collectJejSurface({
				prefix: '',
				precedingText: '',
				fullText: '',
			}).map((s) => s.label);
			expect(labels).not.toContain('eval');
		});
	});

	describe('deduplication', () => {
		it('undefined appears exactly once (allowedGlobals has it as a global)', () => {
			const result = collectJejSurface({
				prefix: '',
				precedingText: '',
				fullText: '',
			});
			expect(result.filter((s) => s.label === 'undefined')).toHaveLength(1);
		});

		it('no label appears more than once across keywords and globals', () => {
			const labels = collectJejSurface({
				prefix: '',
				precedingText: '',
				fullText: '',
			}).map((s) => s.label);
			expect(new Set(labels).size).toBe(labels.length);
		});
	});
});
