import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
	Embodiment,
	LifecyclePhase,
	LifecyclePhaseName,
} from '../../../../embody/types.js';
import type { Lens } from '../../../../lenses/types.js';
import isOpenLensReachable from '../is-open-lens-reachable.js';

function buildStudy(
	overrides: Partial<Record<LifecyclePhaseName, LifecyclePhase>> = {},
): Embodiment['study'] {
	return {
		source: { accessible: true, lenses: [] },
		tokens: { accessible: true, lenses: [] },
		ast: { accessible: true, lenses: [] },
		environment: { accessible: true, lenses: [] },
		evaluation: { accessible: true, lenses: [] },
		...overrides,
	};
}

function buildEmbodiment(
	study: Embodiment['study'] = buildStudy(),
): Embodiment {
	return {
		facts: {
			source: { ok: true, value: 'const x = 1;' },
			type: { ok: true, value: 'module' },
			tokens: { ok: false, cause: { stage: 'tokens', message: 'unparsed' } },
			ast: { ok: false, cause: { stage: 'ast', message: 'unparsed' } },
			entwined: {
				ok: false,
				cause: { stage: 'entwined', message: 'unparsed' },
			},
			environment: {
				ok: false,
				cause: { stage: 'environment', message: 'unparsed' },
			},
		},
		study,
	};
}

function buildLens(name: string, extras: Partial<Lens> = {}): Lens {
	return {
		name,
		label: name,
		applicability: () => true,
		phase: 'source',
		main: () => null,
		...extras,
	};
}

// Panel-excluded = the phase key ABSENT, never `phase: undefined` (the
// exactOptionalPropertyTypes contract).
function buildExcludedLens(name: string, extras: Partial<Lens> = {}): Lens {
	return {
		name,
		label: name,
		applicability: () => true,
		main: () => null,
		...extras,
	};
}

describe('isOpenLensReachable', () => {
	afterEach(() => vi.restoreAllMocks());

	describe('a phase-declaring lens (One / Boundaries)', () => {
		it('is reachable while an accessible phase attaches it', () => {
			const lens = buildLens('viewer');
			const embodiment = buildEmbodiment(
				buildStudy({ source: { accessible: true, lenses: [lens] } }),
			);
			expect(isOpenLensReachable(lens, embodiment)).toBe(true);
		});

		it('is unreachable when no phase attaches it', () => {
			const lens = buildLens('viewer');
			expect(isOpenLensReachable(lens, buildEmbodiment())).toBe(false);
		});

		it('is unreachable when its only attaching phase is barred', () => {
			const lens = buildLens('viewer', { phase: 'environment' });
			const embodiment = buildEmbodiment(
				buildStudy({
					environment: {
						accessible: false,
						cause: { stage: 'ast', message: 'unparsed' },
						lenses: [],
					},
				}),
			);
			expect(isOpenLensReachable(lens, embodiment)).toBe(false);
		});

		it('is reachable through ANY accessible attachment (Many)', () => {
			const lens = buildLens('viewer', { phase: ['source', 'ast'] });
			const embodiment = buildEmbodiment(
				buildStudy({ ast: { accessible: true, lenses: [lens] } }),
			);
			expect(isOpenLensReachable(lens, embodiment)).toBe(true);
		});
	});

	describe('a panel-excluded lens (Interfaces / Exceptions)', () => {
		it('is reachable while its applicability holds over the current facts', () => {
			const seen: Array<Embodiment['facts']> = [];
			const lens = buildExcludedLens('excluded', {
				applicability: (facts) => {
					seen.push(facts);
					return true;
				},
			});
			const embodiment = buildEmbodiment();
			expect([isOpenLensReachable(lens, embodiment), seen]).toEqual([
				true,
				[embodiment.facts],
			]);
		});

		it('is unreachable when its applicability refuses', () => {
			const lens = buildExcludedLens('excluded', {
				applicability: () => false,
			});
			expect(isOpenLensReachable(lens, buildEmbodiment())).toBe(false);
		});

		it('reads a throwing applicability as unreachable, loudly', () => {
			const reported = vi.spyOn(console, 'error').mockImplementation(() => {});
			const lens = buildExcludedLens('excluded', {
				applicability: () => {
					throw new Error('misbehaving gate');
				},
			});
			expect([
				isOpenLensReachable(lens, buildEmbodiment()),
				reported.mock.calls.length,
			]).toEqual([false, 1]);
		});
	});
});
