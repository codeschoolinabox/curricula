import deepFreezeExcept from '@utils/deep-freeze-except.js';

import type { EvalReport, MetricSet } from './types.js';

/**
 * The run-level roll-up: folds all per-case {@link MetricSet}s into one
 * {@link EvalReport}, computing the total sample count and the one floor.
 *
 * @remarks
 * Pure and sync — the eval core's Report phase, roll-up half
 * ([`./DOCS.md`](./DOCS.md)): plain data in, frozen plain data out. Provenance
 * is passed in, never computed here — `generatedAt` and `model` are the
 * driver's to stamp (a pure unit reads no clock), and both are carried onto
 * the report verbatim.
 *
 * The floor (the run's ONLY assertion — the harness reports, it never gates):
 * - `smokeOk` = every case's `samples` equals `samplesPerCase` **exactly** —
 *   "every case produced its FULL count of well-formed Outcomes". Not
 *   "≥1 success": an all-refusal case passes smoke (a refusal is a
 *   well-formed Outcome). A short count fails the floor, and so does an
 *   over-count — either way the harness did not do precisely what the
 *   protocol says it did.
 * - Over zero cases the floor is vacuously `true` — "every case" over none
 *   holds; a no-case run is an empty report, not a broken harness.
 *
 * `totalSamples` is the sum of each case's `samples`. `metricSets` is carried
 * onto the report **by reference**, and the freeze honors ownership: only the
 * report wrapper this function built is frozen — the caller's array is never
 * frozen or walked into (each entry arrives already frozen from the Fold
 * phase; the array itself remains the caller's to own).
 */
export default function aggregate(
	metricSets: readonly MetricSet[],
	model: string,
	generatedAt: string,
	samplesPerCase: number,
): EvalReport {
	const totalSamples = metricSets.reduce(
		(sum, metricSet) => sum + metricSet.samples,
		0,
	);
	const smokeOk = metricSets.every(
		(metricSet) => metricSet.samples === samplesPerCase,
	);

	return deepFreezeExcept(
		{ generatedAt, model, totalSamples, metricSets, smokeOk },
		new Set([metricSets]),
	);
}
