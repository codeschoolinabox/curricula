import { describe, it, expect } from 'vitest';

import analyzeMicroDecisions from '../analyze-micro-decisions.js';

describe('analyzeMicroDecisions — integration', () => {
	describe('parse behavior', () => {
		it('returns ok: true for valid code', () => {
			const result = analyzeMicroDecisions('let x = 5;');
			expect(result.ok).toBe(true);
		});

		it('returns ok: false for unparseable code', () => {
			const result = analyzeMicroDecisions('}}}invalid{{{');
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.message).toBeTruthy();
			}
		});

		it('returns ok: true with empty questions for empty program', () => {
			const result = analyzeMicroDecisions('');
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.questions).toHaveLength(0);
			}
		});

		it('returns ok: true with empty questions for const-only code', () => {
			const result = analyzeMicroDecisions('const x = 5;');
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.questions).toHaveLength(0);
			}
		});
	});

	describe('first analyzer: let-vs-const', () => {
		it('detects a let that could be const', () => {
			const result = analyzeMicroDecisions('let x = 5;');
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.questions).toHaveLength(1);
				expect(result.questions[0].id).toBe('let-vs-const');
				expect(result.questions[0].kind).toBe('micro-decision');
			}
		});

		it('does not flag let that is reassigned', () => {
			const result = analyzeMicroDecisions('let x = 5;\nx = 10;');
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.questions).toHaveLength(0);
			}
		});
	});

	describe('config filtering', () => {
		it('no config returns all questions', () => {
			const result = analyzeMicroDecisions('let x = 5;');
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.questions.length).toBeGreaterThan(0);
			}
		});

		it('kind filter excludes micro-decisions', () => {
			const result = analyzeMicroDecisions('let x = 5;', {
				kind: { microDecision: false },
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.questions).toHaveLength(0);
			}
		});

		it('feature filter excludes variable questions', () => {
			const result = analyzeMicroDecisions('let x = 5;', {
				features: { variables: false },
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.questions).toHaveLength(0);
			}
		});

		it('register filter removes comparative questions', () => {
			const result = analyzeMicroDecisions('let x = 5;', {
				register: { comparative: false },
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.questions).toHaveLength(1);
				const q = result.questions[0];
				const registers = q.questions.map((q) => q.register);
				expect(registers).not.toContain('comparative');
				expect(registers).toContain('open');
				expect(registers).toContain('pointed');
			}
		});

		it('count caps results', () => {
			const result = analyzeMicroDecisions(
				'let a = 1;\nlet b = 2;\nlet c = 3;',
				{ count: 1 },
			);
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.questions).toHaveLength(1);
			}
		});

		it('range filter limits to line range', () => {
			const result = analyzeMicroDecisions(
				'let a = 1;\nlet b = 2;\nlet c = 3;',
				{ range: { start: 2, end: 2 } },
			);
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.questions).toHaveLength(1);
				expect(result.questions[0].context).toContain('b');
			}
		});
	});

	describe('result immutability', () => {
		it('result is frozen', () => {
			const result = analyzeMicroDecisions('let x = 5;');
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('questions array is frozen', () => {
			const result = analyzeMicroDecisions('let x = 5;');
			if (result.ok) {
				expect(Object.isFrozen(result.questions)).toBe(true);
			}
		});
	});
});
