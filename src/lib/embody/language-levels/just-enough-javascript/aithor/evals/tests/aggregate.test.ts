import { describe, it, expect } from 'vitest';

import aggregate from '../aggregate.js';
import type { MetricSet } from '../types.js';

// Increment 2a — the run-level roll-up (evals/DOCS.md "Report" phase, roll-up half).
// Exceptions: n/a — aggregate is a pure total function over plain data; a
// degenerate input is an empty report, not an error.

describe('aggregate', () => {
	describe('zero — no metric sets', () => {
		it('empty run → totalSamples 0, smokeOk vacuously true, provenance carried verbatim', () => {
			const report = aggregate(
				[],
				'test-model-id',
				'2026-07-21T09:30:00.000Z',
				5,
			);

			expect(report).toEqual({
				generatedAt: '2026-07-21T09:30:00.000Z',
				model: 'test-model-id',
				totalSamples: 0,
				metricSets: [],
				smokeOk: true,
			});
		});
	});

	describe('one — a single case', () => {
		it('totalSamples is that case’s samples, not zero', () => {
			const report = aggregate([metricSetOf('case-a', 5)], 'm', 't', 5);

			expect(report.totalSamples).toBe(5);
		});

		it('smokeOk true when the one case hit its full count', () => {
			const report = aggregate([metricSetOf('case-a', 5)], 'm', 't', 5);

			expect(report.smokeOk).toBe(true);
		});
	});

	describe('many — several cases roll up', () => {
		it('totalSamples is the true sum across cases, short ones included', () => {
			const report = aggregate(
				[metricSetOf('case-a', 5), metricSetOf('case-b', 3)],
				'm',
				't',
				5,
			);

			expect(report.totalSamples).toBe(8);
		});

		it('smokeOk false when any case fell short of the full count', () => {
			const report = aggregate(
				[metricSetOf('case-a', 5), metricSetOf('case-b', 3)],
				'm',
				't',
				5,
			);

			expect(report.smokeOk).toBe(false);
		});

		it('smokeOk true when every case hit the full count', () => {
			const report = aggregate(
				[metricSetOf('case-a', 5), metricSetOf('case-b', 5)],
				'm',
				't',
				5,
			);

			expect(report.smokeOk).toBe(true);
		});
	});

	describe('boundaries', () => {
		it('a case that overshot samplesPerCase fails the floor too — full count means exactly', () => {
			const report = aggregate([metricSetOf('case-a', 6)], 'm', 't', 5);

			expect(report.smokeOk).toBe(false);
		});
	});

	describe('interfaces — provenance, reference carry, freeze ownership', () => {
		it('model and generatedAt are carried verbatim, never computed', () => {
			const report = aggregate(
				[metricSetOf('case-a', 5)],
				'sweep-model-1p5b',
				'2025-11-05T12:00:00.000Z',
				5,
			);

			expect(report.model).toBe('sweep-model-1p5b');
			expect(report.generatedAt).toBe('2025-11-05T12:00:00.000Z');
		});

		it('metricSets is carried by reference — the same array, not a copy', () => {
			const metricSets = [metricSetOf('case-a', 5)];
			const report = aggregate(metricSets, 'm', 't', 5);

			expect(report.metricSets).toBe(metricSets);
		});

		it('freezes the report wrapper it built', () => {
			const report = aggregate([metricSetOf('case-a', 5)], 'm', 't', 5);

			expect(Object.isFrozen(report)).toBe(true);
		});

		it('never freezes the caller’s metricSets array — freeze-what-you-own', () => {
			const metricSets = [metricSetOf('case-a', 5)];
			aggregate(metricSets, 'm', 't', 5);

			expect(Object.isFrozen(metricSets)).toBe(false);
		});
	});
});

function metricSetOf(caseId: string, samples: number): MetricSet {
	return {
		caseId,
		quadrant: 'uncurated-scratch',
		samples,
		expectedSatisfiable: true,
		bringUpRefusalRate: { numerator: 0, denominator: samples, proportion: 0 },
	};
}
