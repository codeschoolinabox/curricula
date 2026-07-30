import { describe, expect, it } from 'vitest';
import parseTscOutput from '../parse-tsc-output.mjs';

describe('parseTscOutput', () => {
	it('reads empty output as zero errors', () => {
		expect(parseTscOutput('')).toEqual({ count: 0, locations: [] });
	});

	it('counts a single error with its location', () => {
		const out = "src/a.ts(5,3): error TS2304: Cannot find name 'x'.\n";
		expect(parseTscOutput(out)).toEqual({
			count: 1,
			locations: ['src/a.ts(5,3)'],
		});
	});

	it('counts several errors across files', () => {
		const out = [
			"src/a.ts(5,3): error TS2304: Cannot find name 'x'.",
			"lib/b.ts(9,1): error TS7006: Parameter 'y' implicitly has an 'any' type.",
			'',
		].join('\n');
		expect(parseTscOutput(out)).toEqual({
			count: 2,
			locations: ['src/a.ts(5,3)', 'lib/b.ts(9,1)'],
		});
	});

	it('ignores non-error noise lines', () => {
		const out = 'Some banner\nsrc/a.ts(5,3): error TS2304: x\nDone.\n';
		expect(parseTscOutput(out)).toEqual({
			count: 1,
			locations: ['src/a.ts(5,3)'],
		});
	});

	it('counts a location-less global diagnostic without inventing a location', () => {
		const out = "error TS6053: File 'x.ts' not found.\n";
		expect(parseTscOutput(out)).toEqual({ count: 1, locations: [] });
	});
});
