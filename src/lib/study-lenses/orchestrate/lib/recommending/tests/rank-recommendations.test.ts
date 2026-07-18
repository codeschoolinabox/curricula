import { describe, expect, it } from 'vitest';

import type { Lens, Recommendation } from '../../../../lenses/types.js';
import rankRecommendations from '../rank-recommendations.js';

function proposal(label: string, relevance: number): Recommendation {
	return { lens: {} as Lens, config: {}, relevance, label };
}

describe('rankRecommendations', () => {
	describe('ordering', () => {
		it('returns an empty list for no proposals', () => {
			expect(rankRecommendations([])).toEqual([]);
		});

		it('keeps a single proposal by identity', () => {
			const only = proposal('a', 0.5);
			expect(rankRecommendations([only])[0]).toBe(only);
		});

		it('orders proposals by relevance, highest first', () => {
			const ranked = rankRecommendations([
				proposal('low', 0.2),
				proposal('high', 0.9),
				proposal('mid', 0.5),
			]);
			expect(ranked.map((entry) => entry.label)).toEqual([
				'high',
				'mid',
				'low',
			]);
		});

		it('returns the collected proposal objects themselves', () => {
			const high = proposal('high', 0.9);
			const ranked = rankRecommendations([proposal('low', 0.2), high]);
			expect(ranked[0]).toBe(high);
		});

		it('keeps collected order for equal relevance', () => {
			const ranked = rankRecommendations([
				proposal('first', 0.5),
				proposal('top', 0.9),
				proposal('second', 0.5),
			]);
			expect(ranked.map((entry) => entry.label)).toEqual([
				'top',
				'first',
				'second',
			]);
		});
	});

	describe('purity', () => {
		it('does not reorder the caller’s array', () => {
			const proposals = [proposal('a', 0.2), proposal('b', 0.9)];
			rankRecommendations(proposals);
			expect(proposals.map((entry) => entry.label)).toEqual(['a', 'b']);
		});
	});

	describe('trusted scale', () => {
		it('ranks an overshooting relevance raw, never clamped down', () => {
			const ranked = rankRecommendations([
				proposal('valid', 1),
				proposal('overshoot', 1.5),
			]);
			expect(ranked.map((entry) => entry.label)).toEqual([
				'overshoot',
				'valid',
			]);
		});

		it('ranks an undershooting relevance raw, never clamped up', () => {
			const ranked = rankRecommendations([
				proposal('undershoot', -0.5),
				proposal('zero', 0),
			]);
			expect(ranked.map((entry) => entry.label)).toEqual([
				'zero',
				'undershoot',
			]);
		});
	});

	describe('frozen output', () => {
		it('freezes the empty output', () => {
			expect(Object.isFrozen(rankRecommendations([]))).toBe(true);
		});

		it('freezes the returned list', () => {
			expect(Object.isFrozen(rankRecommendations([proposal('a', 0.5)]))).toBe(
				true,
			);
		});

		it('leaves the top-ranked proposal unfrozen', () => {
			const high = proposal('high', 0.9);
			rankRecommendations([proposal('low', 0.2), high]);
			expect(Object.isFrozen(high)).toBe(false);
		});

		it('leaves a non-top proposal unfrozen', () => {
			const low = proposal('low', 0.2);
			rankRecommendations([low, proposal('high', 0.9)]);
			expect(Object.isFrozen(low)).toBe(false);
		});
	});
});
