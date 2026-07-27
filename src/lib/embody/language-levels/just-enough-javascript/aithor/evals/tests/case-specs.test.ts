import { describe, expect, it } from 'vitest';

import assertVaryExclusive from '../../assert-vary-exclusive.js';
import resolveVary from '../../resolve-vary.js';
import CASE_SPECS from '../case-specs.js';
import type { CaseSpec, Quadrant } from '../types.js';

// Increment 4 — the hand-authored CaseSpec corpus (evals/DOCS.md source node).
// Exceptions: n/a — pure data; the request-shape guards (assertVaryExclusive,
// resolveVary's hard-hold seed precondition) are asserted not-to-throw instead.

describe('CASE_SPECS', () => {
	describe('corpus size — the sample protocol range', () => {
		it('carries 6–8 base cases (no vary)', () => {
			expect([6, 7, 8]).toContain(baseCases().length);
		});

		it('carries exactly 2 vary cases (with the base range, total is bounded)', () => {
			expect(varyCases().length).toBe(2);
		});
	});

	describe('coverage — every quadrant in a tight and a loose base variant', () => {
		it.each([
			'uncurated-scratch',
			'uncurated-seeded',
			'curated-scratch',
			'curated-seeded',
		] as const)('%s has a tight base case', (quadrant) => {
			expect(tightBaseCasesOf(quadrant).length).toBeGreaterThanOrEqual(1);
		});

		it.each([
			'uncurated-scratch',
			'uncurated-seeded',
			'curated-scratch',
			'curated-seeded',
		] as const)('%s has a loose base case', (quadrant) => {
			expect(looseBaseCasesOf(quadrant).length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('expectedSatisfiable labels — the refusal-signal pin', () => {
		it('exactly one case is expectedSatisfiable: false', () => {
			expect(unsatisfiableCases().length).toBe(1);
		});

		it('the unsatisfiable case is tight and curated (a refusal there is a contract pass)', () => {
			expect(
				unsatisfiableCases().every((spec) => isTight(spec) && isCurated(spec)),
			).toBe(true);
		});
	});

	describe('fixture invariants — every case', () => {
		it('every id is unique', () => {
			expect(new Set(CASE_SPECS.map((spec) => spec.id)).size).toBe(
				CASE_SPECS.length,
			);
		});

		it.each([...CASE_SPECS])(
			'$id: quadrant is derived-consistent with validate × empty-program',
			(spec) => {
				expect(spec.quadrant).toBe(derivedQuadrant(spec));
			},
		);

		it.each([...CASE_SPECS])(
			'$id: prompt is a non-empty learner ask',
			(spec) => {
				expect(spec.config.prompt.length).toBeGreaterThan(0);
			},
		);

		it.each([...CASE_SPECS])(
			'$id: model is the default pick or the proven catalog id',
			(spec) => {
				expect(['', 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC']).toContain(
					spec.config.model,
				);
			},
		);

		it('exactly one case picks its model explicitly', () => {
			expect(CASE_SPECS.filter((spec) => spec.config.model !== '').length).toBe(
				1,
			);
		});

		it.each([...CASE_SPECS])(
			'$id: passes the request-shape guard (assertVaryExclusive)',
			(spec) => {
				expect(() => assertVaryExclusive(spec.config)).not.toThrow();
			},
		);
	});

	describe('vary cases — the two documented hard-hold shapes', () => {
		it('all vary cases sit in the curated-seeded quadrant', () => {
			expect(
				varyCases().every((spec) => spec.quadrant === 'curated-seeded'),
			).toBe(true);
		});

		it('the vary shapes are pairwise distinct', () => {
			expect(
				new Set(varyCases().map((spec) => JSON.stringify(spec.config.vary)))
					.size,
			).toBe(varyCases().length);
		});

		it('one vary case holds languageLevel and size together', () => {
			expect(
				varyCases().filter(
					(spec) =>
						spec.config.vary?.languageLevel === false &&
						spec.config.vary?.size === false,
				).length,
			).toBe(1);
		});

		it('one vary case holds languageLevel alone (size freed)', () => {
			expect(
				varyCases().filter(
					(spec) =>
						spec.config.vary?.languageLevel === false &&
						spec.config.vary?.size === undefined,
				).length,
			).toBe(1);
		});

		it('no vary case declares a soft aspect (only the hard tier is ever measured)', () => {
			expect(
				varyCases().every(
					(spec) =>
						spec.config.vary?.behavior === undefined &&
						spec.config.vary?.strategy === undefined &&
						spec.config.vary?.implementation === undefined,
				),
			).toBe(true);
		});

		it.each([...varyCases()])(
			'$id: declares no raw constraint field beside vary (structural check, independent of the guard)',
			(spec) => {
				expect(
					Object.keys(spec.config).filter((key) =>
						['include', 'exclude', 'lines', 'complexity'].includes(key),
					),
				).toEqual([]);
			},
		);

		it.each([...varyCases()])(
			'$id: hard holds resolve against the seed without throwing',
			(spec) => {
				expect(() =>
					resolveVary(spec.program, spec.config.vary ?? {}),
				).not.toThrow();
			},
		);
	});

	describe('immutability', () => {
		it('the corpus array is frozen', () => {
			expect(Object.isFrozen(CASE_SPECS)).toBe(true);
		});

		it.each([...CASE_SPECS])('$id: the entry is frozen', (spec) => {
			expect(Object.isFrozen(spec)).toBe(true);
		});

		it.each([...CASE_SPECS])(
			'$id: the config is frozen (the freeze reached depth)',
			(spec) => {
				expect(Object.isFrozen(spec.config)).toBe(true);
			},
		);
	});
});

function baseCases(): readonly CaseSpec[] {
	return CASE_SPECS.filter((spec) => spec.config.vary === undefined);
}

function varyCases(): readonly CaseSpec[] {
	return CASE_SPECS.filter((spec) => spec.config.vary !== undefined);
}

function unsatisfiableCases(): readonly CaseSpec[] {
	return CASE_SPECS.filter((spec) => spec.expectedSatisfiable === false);
}

function tightBaseCasesOf(quadrant: Quadrant): readonly CaseSpec[] {
	return baseCases().filter(
		(spec) => spec.quadrant === quadrant && isTight(spec),
	);
}

function looseBaseCasesOf(quadrant: Quadrant): readonly CaseSpec[] {
	return baseCases().filter(
		(spec) => spec.quadrant === quadrant && isLoose(spec),
	);
}

function isTight(spec: CaseSpec): boolean {
	const { include, lines, complexity } = spec.config;
	return (
		(include ?? []).length > 0 &&
		(lines !== undefined || complexity !== undefined)
	);
}

function isLoose(spec: CaseSpec): boolean {
	const { include, exclude, lines, complexity } = spec.config;
	return (
		include === undefined &&
		exclude === undefined &&
		lines === undefined &&
		complexity === undefined
	);
}

function isCurated(spec: CaseSpec): boolean {
	return (
		spec.quadrant === 'curated-scratch' || spec.quadrant === 'curated-seeded'
	);
}

function derivedQuadrant(spec: CaseSpec): Quadrant {
	if (spec.config.validate === false) {
		return spec.program === '' ? 'uncurated-scratch' : 'uncurated-seeded';
	}
	return spec.program === '' ? 'curated-scratch' : 'curated-seeded';
}
