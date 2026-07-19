import { describe, expect, it } from 'vitest';

import embody from '../index.js';
import type { Facts } from '../types.js';

describe('embody', () => {
	describe('defaults', () => {
		it('treats the source as a module when no type is given', () => {
			// '01' tokenizes as a script but throws under the module goal — a
			// failed tokens stage proves the default landed on 'module'
			const embodiment = embody('01');
			expect(embodiment.facts.tokens.ok).toBe(false);
		});

		it('restates the defaulted type in the facts', () => {
			const { facts } = embody('01');
			expect(facts.type.ok && facts.type.value === 'module').toBe(true);
		});

		it('a clean program with no roster studies open and empty everywhere', () => {
			const { study } = embody('let x = 1');
			expect(study).toEqual({
				source: { accessible: true, lenses: [] },
				tokens: { accessible: true, lenses: [] },
				ast: { accessible: true, lenses: [] },
				environment: { accessible: true, lenses: [] },
				evaluation: { accessible: true, lenses: [] },
			});
		});
	});

	describe('an explicit script type', () => {
		it('overrides the module default', () => {
			const embodiment = embody('01', { type: 'script' });
			expect(embodiment.facts.tokens.ok).toBe(true);
		});
	});

	describe('a mixed roster over a failing module', () => {
		// '01' as module fails at tokens → ast is barred by REAL accessibility;
		// the content-based gate reads the real Facts (false for failed tokens)
		const flowchart = {
			name: 'flowchart',
			applicability: () => true,
			phase: 'ast',
		} as const;
		const tokensOnly = {
			name: 'tokens-only',
			applicability: (facts: Facts) => facts.tokens.ok,
			phase: 'ast',
		} as const;
		const scratch = { name: 'scratch', applicability: () => true } as const;

		it('bars the ast phase through the real accessibility map', () => {
			const { study } = embody('01', {
				lenses: [flowchart, tokensOnly, scratch],
			});
			expect(study.ast.accessible).toBe(false);
		});

		it('leaves the tokens phase open — its own error renders there', () => {
			const { study } = embody('01', {
				lenses: [flowchart, tokensOnly, scratch],
			});
			expect(study.tokens.accessible).toBe(true);
		});

		it('attaches the fitting lens to its barred phase by reference', () => {
			const { study } = embody('01', {
				lenses: [flowchart, tokensOnly, scratch],
			});
			expect(study.ast.lenses[0] === flowchart).toBe(true);
		});

		it('excludes the lens whose gate declined the facts', () => {
			const { study } = embody('01', {
				lenses: [flowchart, tokensOnly, scratch],
			});
			expect(study.ast.lenses.length).toBe(1);
		});

		it('attaches the phase-less lens nowhere', () => {
			const { study } = embody('01', {
				lenses: [flowchart, tokensOnly, scratch],
			});
			expect(
				Object.values(study).every((phase) =>
					phase.lenses.every((lens) => lens !== scratch),
				),
			).toBe(true);
		});
	});
});
