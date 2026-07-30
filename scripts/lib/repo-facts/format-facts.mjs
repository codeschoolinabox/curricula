/**
 * The Emit phase's formatter (scripts/DOCS.md § Measured-facts oracle). The
 * header line is contract, verbatim, on its own line — downstream skills and
 * briefs quote it. Condense owns a value's shape; this owns the report's
 * assembly around the values.
 *
 * @typedef {import('./types.mjs').Measurement} Measurement
 *
 * @param {Measurement[]} measurements
 * @param {string} generatedAt ISO 8601 emission time.
 * @returns {string}
 */
export default function formatFacts(measurements, generatedAt) {
	const header = `MEASURED AT ${generatedAt}, not asserted — supersedes any memory or handoff claim about these numbers.`;
	return [header, ...measurements.map(formatMeasurement)].join('\n\n');
}

/**
 * @param {Measurement} measurement
 * @returns {string}
 */
function formatMeasurement({ label, command, value, timestamp }) {
	const attribution = `  (via \`${command}\` at ${timestamp})`;
	if (value.includes('\n')) {
		const indented = value
			.split('\n')
			.map((line) => `  ${line}`)
			.join('\n');
		return `${label}:\n${indented}\n${attribution}`;
	}
	return `${label}: ${value}\n${attribution}`;
}
