import type { EvalReport, Histogram, MetricSet, Rate } from './types.js';

/**
 * Renders an {@link EvalReport} to a markdown/console string — the eval
 * core's Report phase, render half ([`./DOCS.md`](./DOCS.md)).
 *
 * @remarks
 * Pure, sync, and lossless about honesty: the string says exactly what the
 * report measured, never more.
 *
 * - **Run header** — model, generatedAt, totalSamples, and the smoke floor —
 *   then **one section per {@link MetricSet}** (caseId, quadrant,
 *   expectedSatisfiable, samples, and its rates), in the report's order. An
 *   empty report renders the header alone.
 * - **Path-gated fields render only when present.** A curated case shows no
 *   admission/conformance lines, an uncurated case no loop lines — absence is
 *   never rendered as a fabricated `0` (the presence of a field IS the path
 *   claim, and the renderer repeats it verbatim).
 * - **A `NaN` proportion renders `—`** — a rate over no samples is undefined,
 *   not zero ({@link EvalReport}'s `Rate` contract). The `n/d` numerals still
 *   render, so an honest `0/0` stays visible.
 * - **Histograms render from their `Record` entries** (this function is the
 *   only reader of histograms): each present key with its count; an empty
 *   histogram renders `none` (measured, nothing observed — distinct from an
 *   absent histogram, which renders nothing at all).
 */
export default function formatReport(report: EvalReport): string {
	const sections = [
		renderHeader(report),
		...report.metricSets.map((metricSet) => renderSection(metricSet)),
	];

	return sections.join('\n\n');
}

/** The run-level provenance block — the only lines an empty report renders. */
function renderHeader(report: EvalReport): string {
	const smoke = report.smokeOk ? 'ok' : 'FAILED';

	return [
		'# aithor eval',
		'',
		`- model: ${report.model}`,
		`- generated: ${report.generatedAt}`,
		`- total samples: ${String(report.totalSamples)}`,
		`- smoke: ${smoke}`,
	].join('\n');
}

/**
 * One case's section. The always-present lines render unconditionally; each
 * path-gated line renders only when its field exists on the MetricSet — the
 * renderer repeats the fold's path claim, it never fabricates a `0`.
 */
function renderSection(metricSet: MetricSet): string {
	const satisfiable = metricSet.expectedSatisfiable ? 'yes' : 'no';

	return [
		`## ${metricSet.caseId} (${metricSet.quadrant})`,
		'',
		`- expected satisfiable: ${satisfiable}`,
		`- samples: ${String(metricSet.samples)}`,
		`- bring-up refusal rate: ${renderRate(metricSet.bringUpRefusalRate)}`,
		...renderRateLine('admission rate', metricSet.admissionRate),
		...renderRateLine('conformance rate', metricSet.conformanceRate),
		...renderHistogramLine('feature drift', metricSet.featureDrift),
		...renderHistogramLine('size drift', metricSet.sizeDrift),
		...renderRateLine('success rate', metricSet.successRate),
		...renderRateLine(
			'attempt-bound refusal rate',
			metricSet.attemptBoundRefusalRate,
		),
		...renderHistogramLine(
			'attempt distribution',
			metricSet.attemptDistribution,
		),
	].join('\n');
}

/** A path-gated rate line — no lines at all when the field is absent. */
function renderRateLine(
	label: string,
	rate: Rate | undefined,
): readonly string[] {
	return rate === undefined ? [] : [`- ${label}: ${renderRate(rate)}`];
}

/** `n/d (p%)`; a NaN proportion (a rate over no samples) renders `—`. */
function renderRate(rate: Rate): string {
	const percent = Number.isNaN(rate.proportion)
		? '—'
		: `${String(Math.round(rate.proportion * 100))}%`;

	return `${String(rate.numerator)}/${String(rate.denominator)} (${percent})`;
}

/**
 * A path-gated histogram line — absent field renders no line; a present but
 * empty histogram renders `none` (measured, nothing observed).
 */
function renderHistogramLine<Key extends string | number>(
	label: string,
	histogram: Histogram<Key> | undefined,
): readonly string[] {
	if (histogram === undefined) return [];

	const entries = Object.entries(histogram).map(
		([key, count]) => `${key} ×${String(count)}`,
	);
	const rendered = entries.length === 0 ? 'none' : entries.join(', ');

	return [`- ${label}: ${rendered}`];
}
