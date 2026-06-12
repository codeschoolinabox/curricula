import { describe, expect, it } from 'vitest';

import deriveStationRoster from '../derive-station-roster.js';
import STATIONS from '../stations.js';

describe('deriveStationRoster', () => {
	describe('Zero — empty registry', () => {
		it('returns the full five-station shape with empty rosters', () => {
			expect(deriveStationRoster({})).toEqual({
				source: [],
				realm: [],
				parse: [],
				creation: [],
				evaluation: [],
			});
		});

		it('derives its keys from the canonical station order', () => {
			expect(Object.keys(deriveStationRoster({}))).toEqual(STATIONS);
		});
	});

	describe('One — a single declared lens', () => {
		it('buckets the lens into exactly its declared station', () => {
			expect(
				deriveStationRoster({ a: { name: 'a', phase: 'evaluation' } }),
			).toEqual({
				source: [],
				realm: [],
				parse: [],
				creation: [],
				evaluation: ['a'],
			});
		});
	});

	describe('Many — two lenses on one station', () => {
		it('preserves registration order, not alphabetical order', () => {
			const roster = deriveStationRoster({
				z: { name: 'z', phase: 'source' },
				a: { name: 'a', phase: 'source' },
			});
			expect(roster.source).toEqual(['z', 'a']);
		});
	});

	describe('Boundaries — phase declaration shapes', () => {
		it('buckets an array-phase lens into each named station', () => {
			expect(
				deriveStationRoster({ a: { name: 'a', phase: ['source', 'parse'] } }),
			).toEqual({
				source: ['a'],
				realm: [],
				parse: ['a'],
				creation: [],
				evaluation: [],
			});
		});

		it('excludes a lens with no phase from every roster', () => {
			expect(deriveStationRoster({ a: { name: 'a' } })).toEqual({
				source: [],
				realm: [],
				parse: [],
				creation: [],
				evaluation: [],
			});
		});

		it('excludes a lens with an empty-array phase from every roster', () => {
			expect(deriveStationRoster({ a: { name: 'a', phase: [] } })).toEqual({
				source: [],
				realm: [],
				parse: [],
				creation: [],
				evaluation: [],
			});
		});

		it('does not deduplicate a station declared twice', () => {
			const roster = deriveStationRoster({
				a: { name: 'a', phase: ['source', 'source'] },
			});
			expect(roster.source).toEqual(['a', 'a']);
		});

		it('rosters the registry key when key and module name disagree', () => {
			const roster = deriveStationRoster({
				'key-name': { name: 'value-name', phase: 'parse' },
			});
			expect(roster.parse).toEqual(['key-name']);
		});

		it('rosters an empty-string key without throwing', () => {
			const roster = deriveStationRoster({ '': { name: '', phase: 'parse' } });
			expect(roster.parse).toEqual(['']);
		});
	});

	describe('Simple — frozen output', () => {
		it('freezes the roster record', () => {
			expect(
				Object.isFrozen(
					deriveStationRoster({ a: { name: 'a', phase: 'source' } }),
				),
			).toBe(true);
		});

		it('freezes a populated roster array', () => {
			const roster = deriveStationRoster({ a: { name: 'a', phase: 'source' } });
			expect(Object.isFrozen(roster.source)).toBe(true);
		});
	});
});
