import { describe, it, expect } from 'vitest';

import type { FeatureName } from '../../types.js';
import computeMetricSet from '../compute-metric-set.js';
import type {
	CuratedSuccessOutcome,
	RefusalOutcome,
	UncuratedOutcome,
} from '../types.js';

// Increment 1 — the pure metric fold (evals/DOCS.md "Fold" phase).
// Exceptions: n/a — computeMetricSet is a pure total function over plain data;
// it never throws (a degenerate input is a 0/0 Rate, not an error).

describe('computeMetricSet', () => {
	describe('zero — no outcomes', () => {
		it('curated case → samples 0, 0/0 rates with NaN proportions, empty attempt histogram', () => {
			const result = computeMetricSet([], {
				caseId: 'tight-curated',
				quadrant: 'curated-scratch',
				expectedSatisfiable: true,
			});

			expect(result.samples).toBe(0);
			expect(result.bringUpRefusalRate).toEqual({
				numerator: 0,
				denominator: 0,
				proportion: Number.NaN,
			});
			expect(result.successRate).toEqual({
				numerator: 0,
				denominator: 0,
				proportion: Number.NaN,
			});
			expect(result.attemptBoundRefusalRate).toEqual({
				numerator: 0,
				denominator: 0,
				proportion: Number.NaN,
			});
			expect(result.attemptDistribution).toEqual({});
		});

		it('uncurated case → 0/0 drift rates with NaN proportions, empty drift histograms', () => {
			const result = computeMetricSet([], {
				caseId: 'loose-uncurated',
				quadrant: 'uncurated-scratch',
				expectedSatisfiable: true,
			});

			expect(result.samples).toBe(0);
			expect(result.admissionRate).toEqual({
				numerator: 0,
				denominator: 0,
				proportion: Number.NaN,
			});
			expect(result.conformanceRate).toEqual({
				numerator: 0,
				denominator: 0,
				proportion: Number.NaN,
			});
			expect(result.featureDrift).toEqual({});
			expect(result.sizeDrift).toEqual({});
		});
	});

	describe('one — a single outcome of each kind', () => {
		it('one clean uncurated sample → 1/1 drift rates, empty drift histograms', () => {
			const result = computeMetricSet([cleanRaw()], {
				caseId: 'loose-uncurated',
				quadrant: 'uncurated-scratch',
				expectedSatisfiable: true,
			});

			expect(result.samples).toBe(1);
			expect(result.admissionRate).toEqual({
				numerator: 1,
				denominator: 1,
				proportion: 1,
			});
			expect(result.conformanceRate).toEqual({
				numerator: 1,
				denominator: 1,
				proportion: 1,
			});
			expect(result.featureDrift).toEqual({});
			expect(result.sizeDrift).toEqual({});
			expect(result.bringUpRefusalRate).toEqual({
				numerator: 0,
				denominator: 1,
				proportion: 0,
			});
		});

		it('one drifted uncurated sample → 0/1 drift rates, its features and dimensions counted', () => {
			const result = computeMetricSet([driftedRaw(['while'], ['lines'])], {
				caseId: 'tight-uncurated',
				quadrant: 'uncurated-scratch',
				expectedSatisfiable: true,
			});

			expect(result.admissionRate).toEqual({
				numerator: 0,
				denominator: 1,
				proportion: 0,
			});
			expect(result.conformanceRate).toEqual({
				numerator: 0,
				denominator: 1,
				proportion: 0,
			});
			expect(result.featureDrift).toEqual({ while: 1 });
			expect(result.sizeDrift).toEqual({ lines: 1 });
		});

		it('one curated success (2 attempts) → 1/1 success, keyed once in the attempt histogram', () => {
			const result = computeMetricSet([success(2)], {
				caseId: 'tight-curated',
				quadrant: 'curated-scratch',
				expectedSatisfiable: true,
			});

			expect(result.samples).toBe(1);
			expect(result.successRate).toEqual({
				numerator: 1,
				denominator: 1,
				proportion: 1,
			});
			expect(result.attemptBoundRefusalRate).toEqual({
				numerator: 0,
				denominator: 1,
				proportion: 0,
			});
			expect(result.attemptDistribution).toEqual({ 2: 1 });
		});

		it('one attempt-bound-exhausted refusal → 1/1 refusal rate, NOT an attempt-histogram key', () => {
			const result = computeMetricSet([exhausted()], {
				caseId: 'tight-curated',
				quadrant: 'curated-scratch',
				expectedSatisfiable: true,
			});

			expect(result.successRate).toEqual({
				numerator: 0,
				denominator: 1,
				proportion: 0,
			});
			expect(result.attemptBoundRefusalRate).toEqual({
				numerator: 1,
				denominator: 1,
				proportion: 1,
			});
			expect(result.attemptDistribution).toEqual({});
		});

		it('one curated bring-up refusal → counted in samples and bring-up, excluded from loop rates', () => {
			const result = computeMetricSet([bringUp('curated')], {
				caseId: 'tight-curated',
				quadrant: 'curated-scratch',
				expectedSatisfiable: true,
			});

			expect(result.samples).toBe(1);
			expect(result.bringUpRefusalRate).toEqual({
				numerator: 1,
				denominator: 1,
				proportion: 1,
			});
			expect(result.successRate).toEqual({
				numerator: 0,
				denominator: 0,
				proportion: Number.NaN,
			});
			expect(result.attemptBoundRefusalRate).toEqual({
				numerator: 0,
				denominator: 0,
				proportion: Number.NaN,
			});
			expect(result.attemptDistribution).toEqual({});
		});

		it('one uncurated unknown-model refusal → counted in bring-up, excluded from drift rates', () => {
			const unknownModel: RefusalOutcome = {
				kind: 'refusal',
				cause: 'unknown-model',
				path: 'uncurated',
			};
			const result = computeMetricSet([unknownModel], {
				caseId: 'loose-uncurated',
				quadrant: 'uncurated-scratch',
				expectedSatisfiable: true,
			});

			expect(result.bringUpRefusalRate).toEqual({
				numerator: 1,
				denominator: 1,
				proportion: 1,
			});
			expect(result.admissionRate).toEqual({
				numerator: 0,
				denominator: 0,
				proportion: Number.NaN,
			});
			expect(result.conformanceRate).toEqual({
				numerator: 0,
				denominator: 0,
				proportion: Number.NaN,
			});
		});
	});

	describe('many — mixed samples fold per path', () => {
		describe('curated case: 3 successes, 1 exhausted, 1 bring-up', () => {
			const outcomes = [
				success(1),
				success(1),
				success(3),
				exhausted(),
				bringUp('curated'),
			];
			const caseInfo = {
				caseId: 'tight-curated',
				quadrant: 'curated-seeded',
				expectedSatisfiable: true,
			} as const;

			it('bring-up rate is over ALL samples', () => {
				const result = computeMetricSet(outcomes, caseInfo);
				expect(result.samples).toBe(5);
				expect(result.bringUpRefusalRate).toEqual({
					numerator: 1,
					denominator: 5,
					proportion: 0.2,
				});
			});

			it('loop rates exclude the bring-up refusal from their denominator', () => {
				const result = computeMetricSet(outcomes, caseInfo);
				expect(result.successRate).toEqual({
					numerator: 3,
					denominator: 4,
					proportion: 0.75,
				});
				expect(result.attemptBoundRefusalRate).toEqual({
					numerator: 1,
					denominator: 4,
					proportion: 0.25,
				});
			});

			it('attempt histogram keys successes only, no zero-count keys', () => {
				const result = computeMetricSet(outcomes, caseInfo);
				expect(result.attemptDistribution).toEqual({ 1: 2, 3: 1 });
			});
		});

		describe('uncurated case: 1 clean, 1 drifted, 1 bring-up', () => {
			const outcomes = [
				cleanRaw(),
				driftedRaw(['while'], ['lines']),
				bringUp('uncurated'),
			];
			const caseInfo = {
				caseId: 'tight-uncurated',
				quadrant: 'uncurated-scratch',
				expectedSatisfiable: true,
			} as const;

			it('drift rates exclude the bring-up refusal from their denominator', () => {
				const result = computeMetricSet(outcomes, caseInfo);
				expect(result.admissionRate).toEqual({
					numerator: 1,
					denominator: 2,
					proportion: 0.5,
				});
				expect(result.conformanceRate).toEqual({
					numerator: 1,
					denominator: 2,
					proportion: 0.5,
				});
			});

			it('bring-up rate is over ALL samples', () => {
				const result = computeMetricSet(outcomes, caseInfo);
				expect(result.bringUpRefusalRate).toEqual({
					numerator: 1,
					denominator: 3,
					proportion: 1 / 3,
				});
			});
		});

		it('two samples each drifting on the same feature → that feature counts 2', () => {
			const result = computeMetricSet(
				[driftedRaw(['while']), driftedRaw(['while', 'if'])],
				{
					caseId: 'tight-uncurated',
					quadrant: 'uncurated-scratch',
					expectedSatisfiable: true,
				},
			);

			expect(result.featureDrift).toEqual({ while: 2, if: 1 });
		});
	});

	describe('boundaries', () => {
		it('an all-refusal curated case keeps an honest shape (0/N success, empty histogram)', () => {
			const result = computeMetricSet([exhausted(), exhausted(), exhausted()], {
				caseId: 'unsatisfiable-curated',
				quadrant: 'curated-scratch',
				expectedSatisfiable: false,
			});

			expect(result.samples).toBe(3);
			expect(result.successRate).toEqual({
				numerator: 0,
				denominator: 3,
				proportion: 0,
			});
			expect(result.attemptBoundRefusalRate).toEqual({
				numerator: 3,
				denominator: 3,
				proportion: 1,
			});
			expect(result.attemptDistribution).toEqual({});
		});

		it('the same feature violated twice within ONE sample counts once (per-sample presence)', () => {
			const result = computeMetricSet([driftedRaw(['while', 'while'])], {
				caseId: 'tight-uncurated',
				quadrant: 'uncurated-scratch',
				expectedSatisfiable: true,
			});

			expect(result.featureDrift).toEqual({ while: 1 });
		});
	});

	describe('interfaces — path claim, carry-through, immutability', () => {
		it.each([
			'admissionRate',
			'conformanceRate',
			'featureDrift',
			'sizeDrift',
		] as const)('a curated MetricSet carries no %s key at all', (field) => {
			const result = computeMetricSet([success(1)], {
				caseId: 'tight-curated',
				quadrant: 'curated-scratch',
				expectedSatisfiable: true,
			});

			expect(field in result).toBe(false);
		});

		it.each([
			'successRate',
			'attemptBoundRefusalRate',
			'attemptDistribution',
		] as const)('an uncurated MetricSet carries no %s key at all', (field) => {
			const result = computeMetricSet([cleanRaw()], {
				caseId: 'loose-uncurated',
				quadrant: 'uncurated-scratch',
				expectedSatisfiable: true,
			});

			expect(field in result).toBe(false);
		});

		it('carries caseId, quadrant, expectedSatisfiable, and samples verbatim', () => {
			const result = computeMetricSet([cleanRaw(), cleanRaw()], {
				caseId: 'carrier-case-x9',
				quadrant: 'uncurated-seeded',
				expectedSatisfiable: false,
			});

			expect(result.caseId).toBe('carrier-case-x9');
			expect(result.quadrant).toBe('uncurated-seeded');
			expect(result.expectedSatisfiable).toBe(false);
			expect(result.samples).toBe(2);
		});

		it('expectedSatisfiable is carried, never interpreted — rates are label-independent', () => {
			const labeled = computeMetricSet([exhausted()], {
				caseId: 'tight-curated',
				quadrant: 'curated-scratch',
				expectedSatisfiable: false,
			});
			const unlabeled = computeMetricSet([exhausted()], {
				caseId: 'tight-curated',
				quadrant: 'curated-scratch',
				expectedSatisfiable: true,
			});

			expect(labeled.attemptBoundRefusalRate).toEqual(
				unlabeled.attemptBoundRefusalRate,
			);
			expect(labeled.expectedSatisfiable).toBe(false);
		});

		it('deep-freezes the MetricSet, its nested Rates, and its Histograms', () => {
			const result = computeMetricSet([success(1), driftedRaw(['while'])], {
				caseId: 'tight-curated',
				quadrant: 'curated-scratch',
				expectedSatisfiable: true,
			});

			expect(Object.isFrozen(result)).toBe(true);
			expect(Object.isFrozen(result.bringUpRefusalRate)).toBe(true);
			expect(Object.isFrozen(result.successRate)).toBe(true);
			expect(Object.isFrozen(result.attemptDistribution)).toBe(true);
		});

		it('deep-freezes the drift histograms on the uncurated path', () => {
			const result = computeMetricSet([driftedRaw(['while'], ['lines'])], {
				caseId: 'tight-uncurated',
				quadrant: 'uncurated-scratch',
				expectedSatisfiable: true,
			});

			expect(Object.isFrozen(result.featureDrift)).toBe(true);
			expect(Object.isFrozen(result.sizeDrift)).toBe(true);
			expect(Object.isFrozen(result.admissionRate)).toBe(true);
		});
	});
});

function cleanRaw(): UncuratedOutcome {
	return {
		kind: 'uncurated',
		admitted: true,
		conform: { ok: true, featureViolations: [], sizeViolations: [] },
		model: 'test-model',
	};
}

function driftedRaw(
	featureViolations: readonly FeatureName[],
	sizeViolations: readonly ('lines' | 'complexity')[] = [],
): UncuratedOutcome {
	return {
		kind: 'uncurated',
		admitted: false,
		conform: { ok: false, featureViolations, sizeViolations },
		model: 'test-model',
	};
}

function success(attempts: 1 | 2 | 3): CuratedSuccessOutcome {
	return { kind: 'curated-success', attempts, model: 'test-model' };
}

function exhausted(): RefusalOutcome {
	return { kind: 'refusal', cause: 'attempt-bound-exhausted', path: 'curated' };
}

function bringUp(path: 'curated' | 'uncurated'): RefusalOutcome {
	return { kind: 'refusal', cause: 'no-model-available', path };
}
