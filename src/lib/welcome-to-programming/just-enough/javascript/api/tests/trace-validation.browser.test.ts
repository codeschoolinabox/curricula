/**
 * @file Layer 4b: trace() validation gate + format gate + error shapes.
 *
 * Tests that invalid code is rejected before Workers are spawned.
 * No Workers needed — all tests exercise synchronous validation paths.
 */

import { describe, expect, it, vi } from 'vitest';

import trace from '../trace.js';

vi.setConfig({ testTimeout: 60000 });

describe('trace validation gate', () => {
	describe('parse errors', () => {
		it('returns ok false for unparseable code', async () => {
			const result = await trace('let = ;');

			expect(result.ok).toBe(false);
		});

		it('sets error with kind parse', async () => {
			const result = await trace('let = ;');

			expect(result.error!.kind).toBe('parse');
		});

		it('parse error includes SyntaxError name', async () => {
			const result = await trace('let = ;');
			const error = result.error as Record<string, unknown>;

			expect(error.name).toBe('SyntaxError');
		});

		it('parse error includes line number', async () => {
			const result = await trace('let = ;');
			const error = result.error as Record<string, unknown>;

			expect(typeof error.line).toBe('number');
		});

		it('parse error has no logs property', async () => {
			const result = await trace('let = ;');

			expect(result.logs).toBeUndefined();
		});

		it('parse error has no rejections property', async () => {
			const result = await trace('let = ;');

			expect(result.rejections).toBeUndefined();
		});
	});

	describe('JeJ rejections', () => {
		it('returns ok false for code with var declaration', async () => {
			const result = await trace('var x = 5;\n');

			expect(result.ok).toBe(false);
		});

		it('sets rejections array for JeJ violations', async () => {
			const result = await trace('var x = 5;\n');

			expect(result.rejections).toBeDefined();
			expect(result.rejections!.length).toBeGreaterThan(0);
		});

		it('rejections have no error field', async () => {
			const result = await trace('var x = 5;\n');

			expect(result.error).toBeUndefined();
		});

		it('rejections have no logs field', async () => {
			const result = await trace('var x = 5;\n');

			expect(result.logs).toBeUndefined();
		});
	});

	describe('format gate', () => {
		it('returns ok false with formatting error for unformatted code', async () => {
			const result = await trace('let x=5;');

			expect(result.ok).toBe(false);
			expect(result.error!.kind).toBe('formatting');
		});

		it('format error has only kind field', async () => {
			const result = await trace('let x=5;');
			const error = result.error as Record<string, unknown>;

			expect(Object.keys(error)).toEqual(['kind']);
		});

		it('format error has empty logs array', async () => {
			const result = await trace('let x=5;');

			expect(result.logs).toEqual([]);
		});
	});

	describe('result immutability', () => {
		it('parse error result is frozen', async () => {
			const result = await trace('let = ;');

			expect(Object.isFrozen(result)).toBe(true);
		});

		it('format gate result is frozen', async () => {
			const result = await trace('let x=5;');

			expect(Object.isFrozen(result)).toBe(true);
		});
	});
});
