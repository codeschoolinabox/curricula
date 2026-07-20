import { describe, expect, it } from 'vitest';

import deriveAccessibility from '../derive-accessibility.js';
import deriveFacts from '../derive-facts.js';
import LIFECYCLE_PHASE_ORDER from '../lifecycle-phase-order.js';

describe('deriveAccessibility', () => {
	describe('a clean program', () => {
		it('the source phase is accessible', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			expect(deriveAccessibility(facts).source.accessible).toBe(true);
		});

		it('keys the record in the lifecycle order', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			expect(Object.keys(deriveAccessibility(facts))).toEqual([
				...LIFECYCLE_PHASE_ORDER,
			]);
		});

		it('the tokens phase is accessible', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			expect(deriveAccessibility(facts).tokens.accessible).toBe(true);
		});

		it('the ast phase is accessible', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			expect(deriveAccessibility(facts).ast.accessible).toBe(true);
		});

		it('the environment phase is accessible', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			expect(deriveAccessibility(facts).environment.accessible).toBe(true);
		});

		it('the evaluation phase is accessible', () => {
			const facts = deriveFacts({ source: 'let x = 1', type: 'script' });
			expect(deriveAccessibility(facts).evaluation.accessible).toBe(true);
		});
	});

	describe('a spelling failure', () => {
		it('the tokens phase stays accessible — its own failure renders in-phase', () => {
			const facts = deriveFacts({ source: '01', type: 'module' });
			expect(deriveAccessibility(facts).tokens.accessible).toBe(true);
		});

		it('the source phase stays accessible', () => {
			const facts = deriveFacts({ source: '01', type: 'module' });
			expect(deriveAccessibility(facts).source.accessible).toBe(true);
		});

		it('bars the ast phase with the tokens cause', () => {
			const facts = deriveFacts({ source: '01', type: 'module' });
			const accessibility = deriveAccessibility(facts);
			expect(
				!facts.tokens.ok &&
					!accessibility.ast.accessible &&
					accessibility.ast.cause === facts.tokens.cause,
			).toBe(true);
		});

		it('bars the environment phase with the tokens cause', () => {
			const facts = deriveFacts({ source: '01', type: 'module' });
			const accessibility = deriveAccessibility(facts);
			expect(
				!facts.tokens.ok &&
					!accessibility.environment.accessible &&
					accessibility.environment.cause === facts.tokens.cause,
			).toBe(true);
		});

		it('bars the evaluation phase with the tokens cause', () => {
			const facts = deriveFacts({ source: '01', type: 'module' });
			const accessibility = deriveAccessibility(facts);
			expect(
				!facts.tokens.ok &&
					!accessibility.evaluation.accessible &&
					accessibility.evaluation.cause === facts.tokens.cause,
			).toBe(true);
		});
	});

	describe('a grammar failure', () => {
		it('the ast phase stays accessible — its own error renders in-phase', () => {
			const facts = deriveFacts({ source: 'const', type: 'script' });
			expect(deriveAccessibility(facts).ast.accessible).toBe(true);
		});

		it('bars the environment phase with the ast cause', () => {
			const facts = deriveFacts({ source: 'const', type: 'script' });
			const accessibility = deriveAccessibility(facts);
			expect(
				!facts.ast.ok &&
					!accessibility.environment.accessible &&
					accessibility.environment.cause === facts.ast.cause,
			).toBe(true);
		});

		it('bars the evaluation phase with the ast cause', () => {
			const facts = deriveFacts({ source: 'const', type: 'script' });
			const accessibility = deriveAccessibility(facts);
			expect(
				!facts.ast.ok &&
					!accessibility.evaluation.accessible &&
					accessibility.evaluation.cause === facts.ast.cause,
			).toBe(true);
		});
	});

	describe('an entwining defect', () => {
		it('bars the environment phase with the very entwined cause', () => {
			const cause = {
				stage: 'entwined',
				message: 'sentinel — no derivation says this',
			} as const;
			const facts = {
				...deriveFacts({ source: 'let x = 1', type: 'script' }),
				entwined: { ok: false, cause },
			} as const;
			const accessibility = deriveAccessibility(facts);
			expect(
				!accessibility.environment.accessible &&
					accessibility.environment.cause === cause,
			).toBe(true);
		});

		it('bars the evaluation phase with the very entwined cause', () => {
			const cause = {
				stage: 'entwined',
				message: 'sentinel — no derivation says this',
			} as const;
			const facts = {
				...deriveFacts({ source: 'let x = 1', type: 'script' }),
				entwined: { ok: false, cause },
			} as const;
			const accessibility = deriveAccessibility(facts);
			expect(
				!accessibility.evaluation.accessible &&
					accessibility.evaluation.cause === cause,
			).toBe(true);
		});

		it('the ast phase stays accessible — an entwined-only defect never reaches it', () => {
			const cause = {
				stage: 'entwined',
				message: 'sentinel — no derivation says this',
			} as const;
			const facts = {
				...deriveFacts({ source: 'let x = 1', type: 'script' }),
				entwined: { ok: false, cause },
			} as const;
			expect(deriveAccessibility(facts).ast.accessible).toBe(true);
		});
	});

	describe('an environment defect', () => {
		it('the environment phase stays accessible — its own defect renders in-phase', () => {
			const cause = {
				stage: 'environment',
				message: 'sentinel — no derivation says this',
			} as const;
			const facts = {
				...deriveFacts({ source: 'let x = 1', type: 'script' }),
				environment: { ok: false, cause },
			} as const;
			expect(deriveAccessibility(facts).environment.accessible).toBe(true);
		});

		it('evaluation stays accessible — an environment defect never bars it', () => {
			const cause = {
				stage: 'environment',
				message: 'sentinel — no derivation says this',
			} as const;
			const facts = {
				...deriveFacts({ source: 'let x = 1', type: 'script' }),
				environment: { ok: false, cause },
			} as const;
			expect(deriveAccessibility(facts).evaluation.accessible).toBe(true);
		});
	});
});
