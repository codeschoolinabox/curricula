import { describe, it, expect } from 'vitest';

import formatReport from '../format-report.js';
import type { EvalReport, MetricSet } from '../types.js';

// Increment 2b — the report renderer (evals/DOCS.md "Report" phase, render half).
// Exceptions: n/a — formatReport is a pure total function over an already-honest
// EvalReport; a degenerate report renders a header, not an error.
// The `##` literal pins the case-section marker: the run header renders with a
// single `#`, so a header-only render contains no `##`.

describe('formatReport', () => {
	describe('zero — an empty report', () => {
		it('renders the run header alone — provenance present, no case sections', () => {
			const text = formatReport({
				generatedAt: '2026-07-21T09:30:00.000Z',
				model: 'qwen-test-model',
				totalSamples: 0,
				metricSets: [],
				smokeOk: true,
			});

			expect(text).toContain('qwen-test-model');
			expect(text).toContain('2026-07-21T09:30:00.000Z');
			expect(text).toContain('total samples: 0');
			expect(text).not.toContain('##');
		});
	});

	describe('one — a single case section', () => {
		it('an uncurated section carries its caseId, quadrant, and drift-rate numerals', () => {
			const text = formatReport(reportOf([uncuratedSection()]));

			expect(text).toContain('loose-uncurated-a');
			expect(text).toContain('uncurated-scratch');
			expect(text).toContain('2/4');
			expect(text).toContain('1/4');
		});

		it('a curated section carries its loop-rate numerals and an attempt-distribution entry', () => {
			const text = formatReport(reportOf([curatedSection()]));

			expect(text).toContain('tight-curated-b');
			expect(text).toContain('3/4');
			expect(text).toContain('1/4');
			expect(text).toContain('attempt distribution');
			expect(text).toContain('2 ×3');
		});

		it('expectedSatisfiable and the per-case sample count render in the section', () => {
			const uncurated = formatReport(reportOf([uncuratedSection()]));
			const curated = formatReport(reportOf([curatedSection()]));

			expect(uncurated).toContain('expected satisfiable: yes');
			expect(uncurated).toContain('- samples: 5');
			expect(curated).toContain('expected satisfiable: no');
			expect(curated).toContain('- samples: 4');
		});
	});

	describe('many — sections in report order', () => {
		it('every caseId appears, in the report’s own order', () => {
			const text = formatReport(
				reportOf([uncuratedSection(), curatedSection()]),
			);

			expect(text.indexOf('loose-uncurated-a')).toBeGreaterThan(-1);
			expect(text.indexOf('loose-uncurated-a')).toBeLessThan(
				text.indexOf('tight-curated-b'),
			);
		});

		it('each section carries its own quadrant and its own rate numerals', () => {
			const text = formatReport(
				reportOf([uncuratedSection(), curatedSection()]),
			);

			expect(text).toContain('uncurated-scratch');
			expect(text).toContain('curated-seeded');
			expect(text).toContain('2/4');
			expect(text).toContain('3/4');
		});
	});

	describe('boundaries — honest rendering pins', () => {
		it('a NaN proportion renders — and the string never says NaN', () => {
			const text = formatReport(reportOf([emptyUncuratedSection()]));

			expect(text).toContain('0/0');
			expect(text).toContain('—');
			expect(text).not.toContain('NaN');
		});

		it('a curated section renders no admission or conformance line at all', () => {
			const text = formatReport(reportOf([curatedSection()]));

			expect(text).not.toContain('admission');
			expect(text).not.toContain('conformance');
		});

		it('an uncurated section renders no success or attempt line at all', () => {
			const text = formatReport(reportOf([uncuratedSection()]));

			expect(text).not.toContain('success');
			expect(text).not.toContain('attempt');
		});

		it('a present histogram renders each entry with its count', () => {
			const text = formatReport(reportOf([uncuratedSection()]));

			expect(text).toContain('while ×2');
			expect(text).toContain('if ×1');
		});

		it('an empty-but-present histogram renders none, never a fabricated entry', () => {
			const text = formatReport(reportOf([uncuratedSection()]));

			expect(text).toContain('size drift: none');
		});

		it('an absent histogram renders nothing at all', () => {
			const text = formatReport(reportOf([curatedSection()]));

			expect(text).not.toContain('feature drift');
			expect(text).not.toContain('size drift');
		});

		it('smokeOk true and false render distinguishable smoke lines', () => {
			const passing = formatReport(reportOf([]));
			const failing = formatReport({ ...reportOf([]), smokeOk: false });

			expect(passing).toContain('smoke: ok');
			expect(failing).toContain('FAILED');
			expect(failing).not.toContain('smoke: ok');
		});
	});
});

function reportOf(metricSets: readonly MetricSet[]): EvalReport {
	return {
		generatedAt: '2026-07-21T09:30:00.000Z',
		model: 'qwen-test-model',
		totalSamples: 9,
		metricSets,
		smokeOk: true,
	};
}

function uncuratedSection(): MetricSet {
	return {
		caseId: 'loose-uncurated-a',
		quadrant: 'uncurated-scratch',
		samples: 5,
		expectedSatisfiable: true,
		bringUpRefusalRate: { numerator: 1, denominator: 5, proportion: 0.2 },
		admissionRate: { numerator: 2, denominator: 4, proportion: 0.5 },
		conformanceRate: { numerator: 1, denominator: 4, proportion: 0.25 },
		featureDrift: { while: 2, if: 1 },
		sizeDrift: {},
	};
}

function curatedSection(): MetricSet {
	return {
		caseId: 'tight-curated-b',
		quadrant: 'curated-seeded',
		samples: 4,
		expectedSatisfiable: false,
		bringUpRefusalRate: { numerator: 0, denominator: 4, proportion: 0 },
		successRate: { numerator: 3, denominator: 4, proportion: 0.75 },
		attemptBoundRefusalRate: { numerator: 1, denominator: 4, proportion: 0.25 },
		attemptDistribution: { 2: 3 },
	};
}

function emptyUncuratedSection(): MetricSet {
	return {
		caseId: 'empty-uncurated-c',
		quadrant: 'uncurated-seeded',
		samples: 0,
		expectedSatisfiable: true,
		bringUpRefusalRate: {
			numerator: 0,
			denominator: 0,
			proportion: Number.NaN,
		},
		admissionRate: { numerator: 0, denominator: 0, proportion: Number.NaN },
		conformanceRate: { numerator: 0, denominator: 0, proportion: Number.NaN },
		featureDrift: {},
		sizeDrift: {},
	};
}
