/**
 * Condense tsc output to a count plus locations. Every diagnostic counts —
 * a location-less global diagnostic still increments; a false zero is the
 * worst failure this oracle can produce.
 *
 * @typedef {import('./types.mjs').TscResult} TscResult
 *
 * @param {string} stdout
 * @returns {TscResult}
 */
export default function parseTscOutput(stdout) {
	let count = 0;
	/** @type {string[]} */
	const locations = [];
	for (const line of stdout.split('\n')) {
		const located = /^(.+\(\d+,\d+\)): error TS\d+:/.exec(line);
		if (located) {
			count += 1;
			locations.push(located[1]);
			continue;
		}
		if (/^error TS\d+:/.test(line)) count += 1;
	}
	return { count, locations };
}
