/**
 * @file Pure-TS tests for the `annotate` lens flowchart-view derivation.
 * No React, no jsdom. ZOMBIES coverage of the
 * `source → Promise<FlowchartSvg>` mapping per `../README.md`
 * § View contract and `../DOCS.md` § Phase 2 Derive view content.
 */

import { describe, expect, it } from 'vitest';

import deriveFlowchartSvg from '../render-flowchart.js';

describe('deriveFlowchartSvg', () => {
	describe('parseable source', () => {
		it('resolves to a ready outcome', async () => {
			const result = await deriveFlowchartSvg(
				'function f() { if (x) { return 1; } return 2; }',
			);
			expect(result.status).toBe('ready');
		});

		it('ready outcome carries an svg string', async () => {
			const result = await deriveFlowchartSvg('function f() { return 1; }');
			expect(result).toMatchObject({ svg: expect.any(String) });
		});

		it('svg markup contains an <svg element', async () => {
			const result = await deriveFlowchartSvg('function f() { return 1; }');
			expect(result).toMatchObject({ svg: expect.stringContaining('<svg') });
		});

		it('ready outcome is frozen', async () => {
			const result = await deriveFlowchartSvg('function f() { return 1; }');
			expect(Object.isFrozen(result)).toBe(true);
		});
	});

	describe('unparseable source', () => {
		it('resolves to an error outcome (does not reject)', async () => {
			const result = await deriveFlowchartSvg('const x = (((');
			expect(result.status).toBe('error');
		});

		it('error outcome carries a non-empty message string', async () => {
			const result = await deriveFlowchartSvg('const x = (((');
			expect(result).toMatchObject({ message: expect.stringMatching(/.+/) });
		});

		it('error outcome is frozen', async () => {
			const result = await deriveFlowchartSvg('const x = (((');
			expect(Object.isFrozen(result)).toBe(true);
		});
	});
});
