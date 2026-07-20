import { describe, expect, it } from 'vitest';

import attachLenses from '../attach-lenses.js';
import LIFECYCLE_PHASE_ORDER from '../lifecycle-phase-order.js';

describe('attachLenses', () => {
	describe('an empty fitting list', () => {
		it('attaches nothing anywhere', () => {
			const attached = attachLenses([]);
			expect(attached.evaluation).toEqual([]);
		});

		it('keys the record in the lifecycle order', () => {
			expect(Object.keys(attachLenses([]))).toEqual([...LIFECYCLE_PHASE_ORDER]);
		});
	});

	describe('a single-phase lens', () => {
		it('attaches to its declared phase by reference', () => {
			const spotlight = {
				name: 'spotlight',
				applicability: () => true,
				phase: 'source',
			} as const;
			expect(attachLenses([spotlight]).source[0]).toBe(spotlight);
		});

		it('leaves an undeclared phase empty', () => {
			const spotlight = {
				name: 'spotlight',
				applicability: () => true,
				phase: 'source',
			} as const;
			expect(attachLenses([spotlight]).environment).toEqual([]);
		});

		it('attaches to the environment phase by reference', () => {
			const scopes = {
				name: 'scopes',
				applicability: () => true,
				phase: 'environment',
			} as const;
			expect(attachLenses([scopes]).environment[0]).toBe(scopes);
		});
	});

	describe('two lenses on different phases', () => {
		it('the tokens phase holds only its own lens', () => {
			const highlight = {
				name: 'highlight',
				applicability: () => true,
				phase: 'tokens',
			} as const;
			const outline = {
				name: 'outline',
				applicability: () => true,
				phase: 'ast',
			} as const;
			const attached = attachLenses([highlight, outline]);
			expect(
				attached.tokens.length === 1 && attached.tokens[0] === highlight,
			).toBe(true);
		});

		it('the ast phase holds only its own lens', () => {
			const highlight = {
				name: 'highlight',
				applicability: () => true,
				phase: 'tokens',
			} as const;
			const outline = {
				name: 'outline',
				applicability: () => true,
				phase: 'ast',
			} as const;
			const attached = attachLenses([highlight, outline]);
			expect(attached.ast.length === 1 && attached.ast[0] === outline).toBe(
				true,
			);
		});
	});

	describe('a multi-phase lens', () => {
		it('attaches to both declared phases by the same reference', () => {
			const twin = {
				name: 'twin',
				applicability: () => true,
				phase: ['tokens', 'ast'],
			} as const;
			const attached = attachLenses([twin]);
			expect(attached.tokens[0] === twin && attached.ast[0] === twin).toBe(
				true,
			);
		});
	});

	describe('two lenses on the same phase', () => {
		it('both attach, in fitting order', () => {
			const stepper = {
				name: 'stepper',
				applicability: () => true,
				phase: 'evaluation',
			} as const;
			const console_ = {
				name: 'console',
				applicability: () => true,
				phase: 'evaluation',
			} as const;
			const attached = attachLenses([stepper, console_]);
			expect(
				attached.evaluation[0] === stepper &&
					attached.evaluation[1] === console_,
			).toBe(true);
		});
	});

	describe('a lens with no declared phase', () => {
		it('attaches nowhere, quietly', () => {
			const scratch = { name: 'scratch', applicability: () => true } as const;
			const attached = attachLenses([scratch]);
			expect(Object.values(attached).every((list) => list.length === 0)).toBe(
				true,
			);
		});
	});

	describe('a lens declaring an empty phase list', () => {
		it('attaches nowhere — the array branch, distinct from undeclared', () => {
			const drifter = {
				name: 'drifter',
				applicability: () => true,
				phase: [],
			} as const;
			const attached = attachLenses([drifter]);
			expect(Object.values(attached).every((list) => list.length === 0)).toBe(
				true,
			);
		});
	});
});
