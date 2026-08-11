import { describe, expect, it } from 'vitest';

import buildCounters from '../build-counters.js';

describe('buildCounters', () => {
	describe('Zero — no guarded loops', () => {
		it('emits no declaration for a loopCount of 0', () => {
			expect(buildCounters(0)).toBe('');
		});
	});

	describe('One — a single guarded loop', () => {
		it('declares loop1, with a trailing space', () => {
			expect(buildCounters(1)).toBe('var loop1 = 0; ');
		});
	});

	describe('Many — several guarded loops', () => {
		it('declares dense 1-based counters in one var statement', () => {
			expect(buildCounters(3)).toBe('var loop1 = 0, loop2 = 0, loop3 = 0; ');
		});
	});

	describe('Boundaries — dense ids and line preservation', () => {
		it('declares loop1, loop2 for count 2 — full content, no id gaps', () => {
			// Full-equality (not a trailing-shape probe) so no lookup-table stub can
			// pass: 2 is neither the Zero, One, nor Many(3) fixture. Pins the exact
			// even-count output and the dense, gap-free id sequence at once.
			expect(buildCounters(2)).toBe('var loop1 = 0, loop2 = 0; ');
		});

		it('never emits a line terminator (zero line shift)', () => {
			expect(buildCounters(5)).not.toContain(String.fromCodePoint(10));
			expect(buildCounters(5)).not.toContain(String.fromCodePoint(13));
		});
	});
});
