/**
 * @file Pure-core unit tests for `<Splitter>` — the jsdom-independent
 * correctness surface (`../geometry.ts`). These carry the real px arithmetic;
 * the component tests (`./index.test.tsx`) only pin wiring/direction. Covers
 * `clampBasis`, `resolveMaxBasisPx` (incl. the ratified `containerPx <= 0`
 * guard), `nextBasis` (the {row,column} × {first,second} sign matrix + clamp),
 * and `nextBasisFromKey` (each key × clamp boundary).
 */

import { describe, expect, it } from 'vitest';

import geometry from '../geometry.js';
import type { SplitOrientation } from '../types.js';

const {
	clampBasis,
	nextBasis,
	nextBasisFromKey,
	rescaleBasis,
	resolveMaxBasisPx,
} = geometry;

describe('clampBasis', () => {
	it('returns the value unchanged when inside [minPx, maxPx]', () => {
		expect(clampBasis(200, 100, 400)).toBe(200);
	});

	it('raises a below-min value to minPx', () => {
		expect(clampBasis(40, 100, 400)).toBe(100);
	});

	it('lowers an above-max value to maxPx', () => {
		expect(clampBasis(900, 100, 400)).toBe(400);
	});

	it('is idempotent at the boundaries', () => {
		expect(clampBasis(100, 100, 400)).toBe(100);
		expect(clampBasis(400, 100, 400)).toBe(400);
	});

	it('degrades safely to the floor when the interval is inverted (min > max)', () => {
		// Precondition is minPx <= maxPx; if ever violated the floor wins —
		// deterministic, never NaN.
		expect(clampBasis(300, 400, 100)).toBe(400);
	});
});

describe('resolveMaxBasisPx', () => {
	it('returns maxPx unchanged when maxFraction is unset', () => {
		expect(resolveMaxBasisPx({ maxPx: 500, containerPx: 1000 })).toBe(500);
	});

	it('caps at containerPx * maxFraction when that is below maxPx', () => {
		// 1000 * 0.6 = 600 < 800 → 600 wins.
		expect(
			resolveMaxBasisPx({ maxPx: 800, maxFraction: 0.6, containerPx: 1000 }),
		).toBe(600);
	});

	it('keeps maxPx when the fraction cap is above it', () => {
		// 1000 * 0.6 = 600 > 500 → maxPx (500) wins.
		expect(
			resolveMaxBasisPx({ maxPx: 500, maxFraction: 0.6, containerPx: 1000 }),
		).toBe(500);
	});

	it('returns maxPx at the exact-equality boundary (fraction cap === maxPx)', () => {
		// 1000 * 0.6 = 600 === maxPx → 600 either way.
		expect(
			resolveMaxBasisPx({ maxPx: 600, maxFraction: 0.6, containerPx: 1000 }),
		).toBe(600);
	});

	it('SKIPS the fraction cap when the container is unmeasured (containerPx === 0)', () => {
		// The ratified guard: jsdom / pre-layout measures 0 → fall back to maxPx
		// (never collapse the max to 0 and pin everything to minPx).
		expect(
			resolveMaxBasisPx({ maxPx: 500, maxFraction: 0.6, containerPx: 0 }),
		).toBe(500);
	});

	it('SKIPS the fraction cap when the container measures negative', () => {
		expect(
			resolveMaxBasisPx({ maxPx: 500, maxFraction: 0.6, containerPx: -20 }),
		).toBe(500);
	});
});

describe('nextBasis — sign matrix over {orientation} × {sizedPane}', () => {
	const base = {
		startBasisPx: 200,
		startCoord: 100,
		minPx: 0,
		maxPx: 1000,
	} as const;

	// A positive drag delta (currentCoord > startCoord) along the split axis.
	const POSITIVE_DELTA = 60;
	const forward = base.startCoord + POSITIVE_DELTA; // 160
	const backward = base.startCoord - POSITIVE_DELTA; // 40

	for (const orientation of ['row', 'column'] as SplitOrientation[]) {
		it(`sizedPane 'first' + ${orientation}: a forward drag GROWS the basis by the delta`, () => {
			expect(
				nextBasis({
					...base,
					currentCoord: forward,
					orientation,
					sizedPane: 'first',
				}),
			).toBe(260);
		});

		it(`sizedPane 'second' + ${orientation}: a forward drag SHRINKS the basis (sign inverted)`, () => {
			expect(
				nextBasis({
					...base,
					currentCoord: forward,
					orientation,
					sizedPane: 'second',
				}),
			).toBe(140);
		});

		it(`sizedPane 'first' + ${orientation}: a backward drag shrinks the basis`, () => {
			expect(
				nextBasis({
					...base,
					currentCoord: backward,
					orientation,
					sizedPane: 'first',
				}),
			).toBe(140);
		});

		it(`sizedPane 'second' + ${orientation}: a backward drag GROWS the basis (4th sign cell)`, () => {
			expect(
				nextBasis({
					...base,
					currentCoord: backward,
					orientation,
					sizedPane: 'second',
				}),
			).toBe(260);
		});
	}

	it('is orientation-INVARIANT: row and column agree for the same sizedPane + delta', () => {
		const row = nextBasis({
			...base,
			currentCoord: forward,
			orientation: 'row',
			sizedPane: 'first',
		});
		const column = nextBasis({
			...base,
			currentCoord: forward,
			orientation: 'column',
			sizedPane: 'first',
		});
		expect(row).toBe(column);
		// Pin the concrete value too, so a same-wrong-value stub (Object.is
		// treats NaN === NaN) cannot make this a false green.
		expect(row).toBe(260);
	});

	it('is orientation-INVARIANT for sizedPane second too (closes the other half)', () => {
		const row = nextBasis({
			...base,
			currentCoord: forward,
			orientation: 'row',
			sizedPane: 'second',
		});
		const column = nextBasis({
			...base,
			currentCoord: forward,
			orientation: 'column',
			sizedPane: 'second',
		});
		expect(row).toBe(column);
		expect(row).toBe(140);
	});

	it('clamps a large forward drag to maxPx (sizedPane first)', () => {
		expect(
			nextBasis({
				startBasisPx: 200,
				startCoord: 100,
				currentCoord: 100_000,
				orientation: 'row',
				sizedPane: 'first',
				minPx: 0,
				maxPx: 1000,
			}),
		).toBe(1000);
	});

	it('clamps a large forward drag to minPx (sizedPane second, inverted)', () => {
		expect(
			nextBasis({
				startBasisPx: 200,
				startCoord: 100,
				currentCoord: 100_000,
				orientation: 'row',
				sizedPane: 'second',
				minPx: 0,
				maxPx: 1000,
			}),
		).toBe(0);
	});
});

// Convention pinned here (approved-design, value-centric): the arrow keys move
// the REPORTED value (aria-valuenow, which IS the basis) — ArrowUp/ArrowRight
// raise it, ArrowDown/ArrowLeft lower it — independent of orientation and
// sizedPane (the DDD signature deliberately omits both). This matches ARIA
// slider semantics; the VISUAL divider direction it produces per config is a
// UX-feel question deferred to the human Sandbox checkpoint, not encoded here.
describe('nextBasisFromKey', () => {
	const base = { currentPx: 100, stepPx: 16, minPx: 0, maxPx: 200 } as const;

	it('ArrowRight grows the basis by stepPx', () => {
		expect(nextBasisFromKey({ ...base, key: 'ArrowRight' })).toBe(116);
	});

	it('ArrowUp grows the basis by stepPx', () => {
		expect(nextBasisFromKey({ ...base, key: 'ArrowUp' })).toBe(116);
	});

	it('ArrowLeft shrinks the basis by stepPx', () => {
		expect(nextBasisFromKey({ ...base, key: 'ArrowLeft' })).toBe(84);
	});

	it('ArrowDown shrinks the basis by stepPx', () => {
		expect(nextBasisFromKey({ ...base, key: 'ArrowDown' })).toBe(84);
	});

	it('Home jumps to minPx', () => {
		expect(nextBasisFromKey({ ...base, key: 'Home' })).toBe(0);
	});

	it('End jumps to maxPx', () => {
		expect(nextBasisFromKey({ ...base, key: 'End' })).toBe(200);
	});

	it('leaves the basis unchanged for an unrelated key', () => {
		expect(nextBasisFromKey({ ...base, key: 'a' })).toBe(100);
	});

	it('clamps an ArrowRight nudge to maxPx at the ceiling', () => {
		expect(
			nextBasisFromKey({
				currentPx: 195,
				key: 'ArrowRight',
				stepPx: 16,
				minPx: 0,
				maxPx: 200,
			}),
		).toBe(200);
	});

	it('clamps an ArrowLeft nudge to minPx at the floor', () => {
		expect(
			nextBasisFromKey({
				currentPx: 5,
				key: 'ArrowLeft',
				stepPx: 16,
				minPx: 0,
				maxPx: 200,
			}),
		).toBe(0);
	});
});

describe('rescaleBasis (proportional resize — preserves the basis fraction)', () => {
	it('grows the basis by the container-extent ratio', () => {
		// 200 was 40% of a 500 container; at 800 it stays 40% → 320.
		expect(
			rescaleBasis({
				currentPx: 200,
				previousExtentPx: 500,
				nextExtentPx: 800,
				minPx: 0,
				maxPx: 1000,
			}),
		).toBe(320);
	});

	it('shrinks the basis proportionally when the container shrinks', () => {
		expect(
			rescaleBasis({
				currentPx: 200,
				previousExtentPx: 500,
				nextExtentPx: 250,
				minPx: 0,
				maxPx: 1000,
			}),
		).toBe(100);
	});

	it('clamps the rescaled basis into [minPx, maxPx]', () => {
		expect(
			rescaleBasis({
				currentPx: 400,
				previousExtentPx: 500,
				nextExtentPx: 5000,
				minPx: 0,
				maxPx: 1000,
			}),
		).toBe(1000);
	});

	it('does NOT rescale on the first measure (previousExtentPx === 0) — only clamps', () => {
		expect(
			rescaleBasis({
				currentPx: 200,
				previousExtentPx: 0,
				nextExtentPx: 800,
				minPx: 0,
				maxPx: 1000,
			}),
		).toBe(200);
	});

	it('does NOT rescale when the previous extent is degenerate (negative guard)', () => {
		expect(
			rescaleBasis({
				currentPx: 200,
				previousExtentPx: -10,
				nextExtentPx: 800,
				minPx: 50,
				maxPx: 1000,
			}),
		).toBe(200);
	});
});
