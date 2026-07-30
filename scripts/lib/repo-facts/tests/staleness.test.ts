import { describe, expect, it } from 'vitest';
import isStale from '../staleness.mjs';

describe('isStale', () => {
	it('treats a just-written timestamp as fresh', () => {
		expect(
			isStale('2026-07-29T18:00:00Z', '2026-07-29T18:00:05Z', 60_000),
		).toBe(false);
	});

	it('treats a timestamp past the max age as stale', () => {
		expect(
			isStale('2026-07-29T17:00:00Z', '2026-07-29T18:00:05Z', 60_000),
		).toBe(true);
	});

	it('treats the exact boundary as fresh', () => {
		expect(
			isStale('2026-07-29T18:00:00Z', '2026-07-29T18:01:00Z', 60_000),
		).toBe(false);
	});

	it('treats one millisecond past the boundary as stale', () => {
		expect(
			isStale('2026-07-29T18:00:00Z', '2026-07-29T18:01:00.001Z', 60_000),
		).toBe(true);
	});

	it('treats an unparsable timestamp as stale', () => {
		expect(isStale('not-a-time', '2026-07-29T18:00:00Z', 60_000)).toBe(true);
	});
});
