import { describe, expect, it } from 'vitest';

import deriveAccessibility from '../derive-accessibility.js';
import deriveFacts from '../derive-facts.js';
import joinStudy from '../join-study.js';
import LIFECYCLE_PHASE_ORDER from '../lifecycle-phase-order.js';

// hand-built fixtures — the join is structural, so no parse pipeline is
// needed; sentinel causes prove identity (no derivation says these)
const astDefect = {
	stage: 'ast',
	message: 'sentinel — no derivation says this',
} as const;

const tokensDefect = {
	stage: 'tokens',
	message: 'a second sentinel, distinct from the first',
} as const;

const allAccessible = {
	source: { accessible: true },
	tokens: { accessible: true },
	ast: { accessible: true },
	environment: { accessible: true },
	evaluation: { accessible: true },
} as const;

const nothingAttached = {
	source: [],
	tokens: [],
	ast: [],
	environment: [],
	evaluation: [],
} as const;

describe('joinStudy', () => {
	describe('five accessible phases, nothing attached', () => {
		it('round-trips as accessible with empty lens lists', () => {
			const study = joinStudy(allAccessible, nothingAttached);
			expect(study).toEqual({
				source: { accessible: true, lenses: [] },
				tokens: { accessible: true, lenses: [] },
				ast: { accessible: true, lenses: [] },
				environment: { accessible: true, lenses: [] },
				evaluation: { accessible: true, lenses: [] },
			});
		});

		it('is total over exactly the five phase names', () => {
			const study = joinStudy(allAccessible, nothingAttached);
			expect(Object.keys(study).toSorted((a, b) => a.localeCompare(b))).toEqual(
				['ast', 'environment', 'evaluation', 'source', 'tokens'],
			);
		});

		it('keys the record in the lifecycle order', () => {
			const study = joinStudy(allAccessible, nothingAttached);
			expect(Object.keys(study)).toEqual([...LIFECYCLE_PHASE_ORDER]);
		});

		it('carries no cause key on an accessible phase', () => {
			const study = joinStudy(allAccessible, nothingAttached);
			expect('cause' in study.tokens).toBe(false);
		});
	});

	describe('a barred phase', () => {
		it('still lists its fitting lenses', () => {
			const flowchart = {
				name: 'flowchart',
				applicability: () => true,
				phase: 'ast',
			} as const;
			const study = joinStudy(
				{ ...allAccessible, ast: { accessible: false, cause: astDefect } },
				{ ...nothingAttached, ast: [flowchart] },
			);
			expect(!study.ast.accessible && study.ast.lenses[0] === flowchart).toBe(
				true,
			);
		});

		it('nothing fits carries an empty list', () => {
			const study = joinStudy(
				{
					...allAccessible,
					environment: { accessible: false, cause: astDefect },
				},
				nothingAttached,
			);
			expect(
				!study.environment.accessible && study.environment.lenses.length === 0,
			).toBe(true);
		});
	});

	describe('a normally-barred phase forced accessible', () => {
		it('carries its lenses on the accessible arm', () => {
			const flowchart = {
				name: 'flowchart',
				applicability: () => true,
				phase: 'ast',
			} as const;
			const study = joinStudy(allAccessible, {
				...nothingAttached,
				ast: [flowchart],
			});
			expect(study.ast.accessible && study.ast.lenses[0] === flowchart).toBe(
				true,
			);
		});
	});

	describe('a normally-accessible phase forced barred', () => {
		it('carries the cause by identity', () => {
			const study = joinStudy(
				{
					...allAccessible,
					source: { accessible: false, cause: tokensDefect },
				},
				nothingAttached,
			);
			expect(
				!study.source.accessible && study.source.cause === tokensDefect,
			).toBe(true);
		});
	});

	describe('two phases populated at once, mixed arms', () => {
		const highlight = {
			name: 'highlight',
			applicability: () => true,
			phase: 'tokens',
		} as const;
		const outline = {
			name: 'outline',
			applicability: () => true,
			phase: 'tokens',
		} as const;
		const stepper = {
			name: 'stepper',
			applicability: () => true,
			phase: 'evaluation',
		} as const;
		const mixed = {
			...allAccessible,
			evaluation: { accessible: false, cause: astDefect },
		} as const;
		const attached = {
			...nothingAttached,
			tokens: [highlight, outline],
			evaluation: [stepper],
		} as const;

		it('the accessible tokens phase holds only its own lenses, in order', () => {
			const study = joinStudy(mixed, attached);
			expect(
				study.tokens.lenses.length === 2 &&
					study.tokens.lenses[0] === highlight &&
					study.tokens.lenses[1] === outline,
			).toBe(true);
		});

		it('the barred evaluation phase holds only its own lens', () => {
			const study = joinStudy(mixed, attached);
			expect(
				study.evaluation.lenses.length === 1 &&
					study.evaluation.lenses[0] === stepper,
			).toBe(true);
		});
	});

	describe('composed with the real accessibility deriver', () => {
		it('a real parse failure bars ast yet still lists its lens', () => {
			const flowchart = {
				name: 'flowchart',
				applicability: () => true,
				phase: 'ast',
			} as const;
			const accessibility = deriveAccessibility(
				deriveFacts({ source: '01', type: 'module' }),
			);
			const study = joinStudy(accessibility, {
				...nothingAttached,
				ast: [flowchart],
			});
			expect(!study.ast.accessible && study.ast.lenses[0] === flowchart).toBe(
				true,
			);
		});
	});
});
