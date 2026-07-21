import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { FeatureName, RefusalCause } from '../types.js';

import type {
	CuratedSuccessOutcome,
	Histogram,
	MetricSet,
	Outcome,
	Quadrant,
	Rate,
	UncuratedOutcome,
} from './types.js';

/**
 * The pure metric fold: rolls one case's sampled {@link Outcome}s into its
 * path-gated {@link MetricSet}.
 *
 * @remarks
 * Pure and sync — the eval core's Fold phase ([`./DOCS.md`](./DOCS.md)): plain
 * data in, frozen plain data out; no runtime, no `aithor`, no gates. `caseInfo`
 * carries the case's identity verbatim onto the result — `quadrant` is a
 * derived label trusted, never re-derived, and `expectedSatisfiable` is
 * carried, never interpreted (the report reads it later).
 *
 * Path-gating is structural: the case's `quadrant` decides which optional
 * fields exist. A curated case carries `successRate` /
 * `attemptBoundRefusalRate` / `attemptDistribution` and none of the drift
 * fields; an uncurated case carries `admissionRate` / `conformanceRate` /
 * `featureDrift` / `sizeDrift` and none of the loop fields;
 * `bringUpRefusalRate` is on both. The presence of a field IS the path claim.
 *
 * Counting contract (the ratified pins):
 * - `featureDrift` counts per-sample PRESENCE, not per-node violations —
 *   `conform` emits one violation per offending node, so a feature is deduped
 *   within each sample before counting: `featureDrift[X]` = "# of samples that
 *   drifted on X". (`sizeDrift` is already ≤ 1 per dimension per sample.)
 * - Non-bring-up curated samples are exhaustive over curated-success XOR
 *   `attempt-bound-exhausted` — no third bucket. Bring-up refusals are
 *   excluded from both those denominators, and an exhausted refusal is never
 *   an `attemptDistribution` key (a curated-SUCCESS-only histogram; the
 *   spent-the-bound load surfaces in `attemptBoundRefusalRate`).
 * - A `Rate` over no samples is `0/0` with `NaN` proportion, never a
 *   fabricated `0`; a histogram never carries zero-count keys (absent = zero).
 */
export default function computeMetricSet(
	outcomes: readonly Outcome[],
	caseInfo: Pick<MetricSet, 'caseId' | 'quadrant' | 'expectedSatisfiable'>,
): MetricSet {
	const { caseId, quadrant, expectedSatisfiable } = caseInfo;
	const bringUpCount = outcomes.filter((outcome) =>
		isBringUpRefusal(outcome),
	).length;
	const pathMetrics = isCuratedQuadrant(quadrant)
		? curatedMetrics(outcomes)
		: uncuratedMetrics(outcomes);

	return deepFreezeInPlace({
		caseId,
		quadrant,
		samples: outcomes.length,
		expectedSatisfiable,
		bringUpRefusalRate: rateOf(bringUpCount, outcomes.length),
		...pathMetrics,
	});
}

// Transient internal lookup (never returned or frozen) — DEV.md §13 allows Set here.
const BRING_UP_CAUSES: ReadonlySet<RefusalCause> = new Set([
	'no-model-available',
	'unknown-model',
]);

/** The curated-only roll-up: loop load over non-bring-up curated samples. */
function curatedMetrics(
	outcomes: readonly Outcome[],
): Required<
	Pick<
		MetricSet,
		'successRate' | 'attemptBoundRefusalRate' | 'attemptDistribution'
	>
> {
	const successes = outcomes.filter(
		(outcome): outcome is CuratedSuccessOutcome =>
			outcome.kind === 'curated-success',
	);
	const exhaustedCount = outcomes.filter((outcome) =>
		isAttemptBoundRefusal(outcome),
	).length;
	const denominator = successes.length + exhaustedCount;

	return {
		successRate: rateOf(successes.length, denominator),
		attemptBoundRefusalRate: rateOf(exhaustedCount, denominator),
		attemptDistribution: histogramOf(
			successes.map((success) => success.attempts),
		),
	};
}

/** The uncurated-only roll-up: the drift gap over the raw (non-bring-up) samples. */
function uncuratedMetrics(
	outcomes: readonly Outcome[],
): Required<
	Pick<
		MetricSet,
		'admissionRate' | 'conformanceRate' | 'featureDrift' | 'sizeDrift'
	>
> {
	const raws = outcomes.filter(
		(outcome): outcome is UncuratedOutcome => outcome.kind === 'uncurated',
	);
	const admittedCount = raws.filter((raw) => raw.admitted).length;
	const conformingCount = raws.filter((raw) => raw.conform.ok).length;

	return {
		admissionRate: rateOf(admittedCount, raws.length),
		conformanceRate: rateOf(conformingCount, raws.length),
		featureDrift: histogramOf(raws.flatMap((raw) => driftedFeaturesOf(raw))),
		sizeDrift: histogramOf(raws.flatMap((raw) => raw.conform.sizeViolations)),
	};
}

/**
 * Each feature at most once per sample — `conform` emits one violation per
 * offending node, so within-sample recurrences are deduped here to keep
 * `featureDrift[X]` = "# of samples that drifted on X", not "# of nodes".
 */
function driftedFeaturesOf(outcome: UncuratedOutcome): readonly FeatureName[] {
	const { featureViolations } = outcome.conform;
	return featureViolations.filter(
		(feature, index) => featureViolations.indexOf(feature) === index,
	);
}

/** `proportion` is honest division: 0/0 is `NaN` (undefined), never a fabricated 0. */
function rateOf(numerator: number, denominator: number): Rate {
	return { numerator, denominator, proportion: numerator / denominator };
}

/** Frequency count as a plain partial record — zero-count keys are absent, never 0. */
function histogramOf<Key extends string | number>(
	keys: readonly Key[],
): Histogram<Key> {
	const uniqueKeys = keys.filter((key, index) => keys.indexOf(key) === index);
	const entries = uniqueKeys.map(
		(key) =>
			[key, keys.filter((candidate) => candidate === key).length] as const,
	);
	// Object.fromEntries widens the keys to string; the entries' keys are exactly Key.
	return Object.fromEntries(entries) as Histogram<Key>;
}

function isCuratedQuadrant(quadrant: Quadrant): boolean {
	return quadrant === 'curated-scratch' || quadrant === 'curated-seeded';
}

function isBringUpRefusal(outcome: Outcome): boolean {
	return outcome.kind === 'refusal' && BRING_UP_CAUSES.has(outcome.cause);
}

function isAttemptBoundRefusal(outcome: Outcome): boolean {
	return (
		outcome.kind === 'refusal' && outcome.cause === 'attempt-bound-exhausted'
	);
}
