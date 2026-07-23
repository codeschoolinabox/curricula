import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { Embodiment } from '../../../embody/types.js';
import analyzeMicroDecisions from '../analyze-micro-decisions.js';

/**
 * Overrides a real embodiment's environment stage with a failure, keeping a
 * valid AST — the ast-then-environment refusal arm's second branch, which a
 * valid parse can't produce on its own (a guarded embody defect).
 */
function withFailedEnvironment(embodiment: Embodiment, offset = 3): Embodiment {
	return {
		...embodiment,
		facts: {
			...embodiment.facts,
			environment: {
				ok: false,
				cause: { stage: 'environment', message: 'scope exploded', offset },
			},
		},
	};
}

describe('analyzeMicroDecisions — integration', () => {
	describe('refusal arm — a required stage failed', () => {
		it('returns ok:false when tokenization fails', () => {
			const result = analyzeMicroDecisions(embody('const s = "oops;'));
			expect(result.ok).toBe(false);
		});

		it('returns ok:false when parsing fails', () => {
			const result = analyzeMicroDecisions(embody('const x = ;'));
			expect(result.ok).toBe(false);
		});

		it('the refusal carries a non-empty message string', () => {
			const result = analyzeMicroDecisions(embody('const x = ;'));
			if (result.ok) {
				throw new Error('expected ok:false');
			}
			expect(typeof result.error.message).toBe('string');
			expect(result.error.message.length).toBeGreaterThan(0);
		});

		it('returns ok:false when the environment stage fails (honest contract)', () => {
			const result = analyzeMicroDecisions(
				withFailedEnvironment(embody('const x = 1;')),
			);
			if (result.ok) {
				throw new Error('expected ok:false');
			}
			expect(result.error.message).toContain('scope exploded');
		});

		it('draws the refusal offset from the failed stage when present', () => {
			const result = analyzeMicroDecisions(
				withFailedEnvironment(embody('const x = 1;')),
			);
			if (result.ok) {
				throw new Error('expected ok:false');
			}
			expect(result.error.offset).toBe(3);
		});

		it('forwards the parser offset on an ast-stage refusal', () => {
			const result = analyzeMicroDecisions(embody('const x = ;'));
			if (result.ok) {
				throw new Error('expected ok:false');
			}
			expect(typeof result.error.offset).toBe('number');
		});

		it('forwards offset 0 (compared to null, not truthiness)', () => {
			const result = analyzeMicroDecisions(
				withFailedEnvironment(embody('const x = 1;'), 0),
			);
			if (result.ok) {
				throw new Error('expected ok:false');
			}
			expect(result.error.offset).toBe(0);
		});
	});

	describe('parsed path — questions produced', () => {
		it('returns ok:true for valid source', () => {
			const result = analyzeMicroDecisions(embody('const x = 1;'));
			expect(result.ok).toBe(true);
		});

		it('returns well-formed questions on the ok:true branch', () => {
			// `x` is a 1-char name → naming-descriptiveness fires, so this is a real
			// non-empty result, not a vacuous Array.isArray check.
			const result = analyzeMicroDecisions(embody('const x = 1;'));
			if (!result.ok) {
				throw new Error('expected ok:true');
			}
			expect(result.questions.length).toBeGreaterThan(0);
			expect(
				result.questions.every(
					(question) =>
						typeof question.id === 'string' &&
						typeof question.location.start === 'number',
				),
			).toBe(true);
		});

		it('produces real questions for analyzer-triggering source', () => {
			// let-vs-const fires on a never-reassigned let — a real parse, not the
			// quarry's empty-Program stub.
			const result = analyzeMicroDecisions(embody('let x = 5;'));
			if (!result.ok) {
				throw new Error('expected ok:true');
			}
			expect(result.questions.length).toBeGreaterThan(0);
		});

		it('analyzerErrors is absent when no analyzer threw', () => {
			const result = analyzeMicroDecisions(embody('const x = 1;'));
			if (!result.ok) {
				throw new Error('expected ok:true');
			}
			expect(result.analyzerErrors).toBeUndefined();
		});

		it('degrades gracefully: a throwing analyzer becomes an analyzerError, not a crash', () => {
			// A malformed-but-typed VariableDeclaration node (no `declarations`)
			// makes the variable analyzers throw when they iterate it — the run
			// must survive and collect the error, not propagate it.
			const base = embody('const x = 1;');
			if (!base.facts.ast.ok) {
				throw new Error('setup: ast did not derive');
			}
			const malformed: Embodiment = {
				...base,
				facts: {
					...base.facts,
					ast: {
						ok: true,
						value: {
							...base.facts.ast.value,
							body: [{ type: 'VariableDeclaration', start: 0, end: 5 }],
						} as typeof base.facts.ast.value,
					},
				},
			};
			const result = analyzeMicroDecisions(malformed);
			expect(result.ok).toBe(true);
			if (!result.ok) {
				throw new Error('expected ok:true');
			}
			expect(result.analyzerErrors).toBeDefined();
			expect(result.analyzerErrors?.length ?? 0).toBeGreaterThan(0);
		});

		it('runs program analyzers (voice-profile on a 3-statement program)', () => {
			// Exercises the AST → program-analyzer arrow, which every point-only
			// fixture leaves unwitnessed.
			const result = analyzeMicroDecisions(
				embody('const a = 1;\nconst b = 2;\nconsole.log(a, b);'),
			);
			if (!result.ok) {
				throw new Error('expected ok:true');
			}
			expect(
				result.questions.some((question) => question.id === 'voice-profile'),
			).toBe(true);
		});
	});

	describe('config filtering', () => {
		it('kind filter prunes micro-decision questions', () => {
			const unfiltered = analyzeMicroDecisions(embody('let x = 5;'));
			const filtered = analyzeMicroDecisions(embody('let x = 5;'), {
				kind: { microDecision: false },
			});
			if (!unfiltered.ok || !filtered.ok) {
				throw new Error('expected ok:true');
			}
			expect(
				unfiltered.questions.some(
					(question) => question.kind === 'micro-decision',
				),
			).toBe(true);
			expect(
				filtered.questions.every(
					(question) => question.kind !== 'micro-decision',
				),
			).toBe(true);
		});

		it('count cap trims to exactly the requested count', () => {
			const result = analyzeMicroDecisions(embody('let a = 1;\nlet b = 2;'), {
				count: 1,
			});
			if (!result.ok) {
				throw new Error('expected ok:true');
			}
			expect(result.questions).toHaveLength(1);
		});
	});

	describe('result immutability', () => {
		it('ok:true result is frozen', () => {
			const result = analyzeMicroDecisions(embody('const x = 1;'));
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('ok:true questions array is frozen', () => {
			const result = analyzeMicroDecisions(embody('const x = 1;'));
			if (!result.ok) {
				throw new Error('expected ok:true');
			}
			expect(Object.isFrozen(result.questions)).toBe(true);
		});

		it('ok:false result is frozen', () => {
			const result = analyzeMicroDecisions(embody('const x = ;'));
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('freezes each produced question', () => {
			const result = analyzeMicroDecisions(embody('let x = 5;'));
			if (!result.ok) {
				throw new Error('expected ok:true');
			}
			expect(result.questions.length).toBeGreaterThan(0);
			expect(Object.isFrozen(result.questions[0])).toBe(true);
		});
	});
});
