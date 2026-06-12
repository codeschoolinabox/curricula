import { describe, expect, it } from 'vitest';

import deriveStationAvailability from '../derive-station-availability.js';
import STATIONS from '../stations.js';

const ADMITTED = {
	isJeJ: true,
	isDeterministic: true,
	doesPause: false,
	formatted: true,
	violations: [],
};

const REFUSED = {
	isJeJ: false,
	isDeterministic: true,
	doesPause: false,
	formatted: true,
	violations: [],
};

describe('deriveStationAvailability', () => {
	describe('Zero — null gate output keeps LL stations shown (undetermined admission)', () => {
		it('shows all five stations in canonical order', () => {
			expect(deriveStationAvailability('module', null)).toEqual([
				'source',
				'realm',
				'parse',
				'creation',
				'evaluation',
			]);
		});

		it('derives the all-shown result from the canonical station order', () => {
			expect(deriveStationAvailability('module', null)).toEqual(STATIONS);
		});
	});

	describe('One — script type hides the non-contiguous LL set', () => {
		it('removes realm from between source and parse', () => {
			expect(deriveStationAvailability('script', null)).toEqual(
				STATIONS.filter(
					(station) => station === 'source' || station === 'parse',
				),
			);
		});
	});

	describe('Many — the admission gate decides under module type', () => {
		it('hides the LL stations when admission is refused', () => {
			expect(deriveStationAvailability('module', REFUSED)).toEqual(
				STATIONS.filter(
					(station) => station === 'source' || station === 'parse',
				),
			);
		});

		it('shows all five stations when admission holds', () => {
			expect(deriveStationAvailability('module', ADMITTED)).toEqual(STATIONS);
		});
	});

	describe('Boundaries — script wins over an admitting gate (unreachable today; totality pin)', () => {
		it('hides the LL stations for script type even when isJeJ is true', () => {
			expect(deriveStationAvailability('script', ADMITTED)).toEqual(
				STATIONS.filter(
					(station) => station === 'source' || station === 'parse',
				),
			);
		});

		it('hides the LL stations when both signals hide (OR, not XOR)', () => {
			expect(deriveStationAvailability('script', REFUSED)).toEqual(
				STATIONS.filter(
					(station) => station === 'source' || station === 'parse',
				),
			);
		});
	});

	describe('Simple — frozen output', () => {
		it('freezes the all-shown result', () => {
			expect(Object.isFrozen(deriveStationAvailability('module', null))).toBe(
				true,
			);
		});

		it('freezes the hidden-LL result', () => {
			expect(Object.isFrozen(deriveStationAvailability('script', null))).toBe(
				true,
			);
		});
	});
});
