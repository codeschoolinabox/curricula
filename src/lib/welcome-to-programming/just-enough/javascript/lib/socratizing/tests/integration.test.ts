import { describe, it, expect } from 'vitest';

import analyzeMicroDecisions from '../analyze-micro-decisions.js';

describe('analyzeMicroDecisions — integration', () => {
	describe('parse behavior', () => {
		it('returns ok: true for valid code', () => {
			const result = analyzeMicroDecisions('let count = 5;');
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
	});

	describe('first analyzer: let-vs-const', () => {
		it('detects a let that could be const', () => {
			const result = analyzeMicroDecisions('let count = 5;');
			expect(result.ok).toBe(true);
			if (result.ok) {
				const letVsConst = result.questions.filter(
					(q) => q.id === 'let-vs-const',
				);
				expect(letVsConst).toHaveLength(1);
				expect(letVsConst[0].kind).toBe('micro-decision');
			}
		});

		it('does not flag let that is reassigned', () => {
			const result = analyzeMicroDecisions(
				'let count = 5;\ncount = 10;',
			);
			expect(result.ok).toBe(true);
			if (result.ok) {
				const letVsConst = result.questions.filter(
					(q) => q.id === 'let-vs-const',
				);
				expect(letVsConst).toHaveLength(0);
			}
		});
	});

	describe('multiple analyzers fire', () => {
		it('detects multiple patterns in a real program', () => {
			const source = [
				'let input = prompt("enter a number:");',
				'let message = "";',
				'if (input === null) {',
				'  message = "cancelled";',
				'} else {',
				'  message = `you entered: ${input}`;',
				'}',
				'console.log(message);',
			].join('\n');

			const result = analyzeMicroDecisions(source);
			expect(result.ok).toBe(true);
			if (result.ok) {
				const ids = result.questions.map((q) => q.id);
				// Should fire several analyzers on this code
				expect(ids.length).toBeGreaterThan(1);
				// Should include at least these patterns
				expect(ids).toContain('input-validation-strategy');
				expect(ids).toContain('string-construction');
				expect(ids).toContain('console-log-audience');
			}
		});
	});

	describe('config filtering', () => {
		it('no config returns all questions', () => {
			const result = analyzeMicroDecisions('let count = 5;');
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.questions.length).toBeGreaterThan(0);
			}
		});

		it('kind filter excludes micro-decisions', () => {
			const result = analyzeMicroDecisions('let count = 5;', {
				kind: { microDecision: false },
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				for (const q of result.questions) {
					expect(q.kind).toBe('comprehension');
				}
			}
		});

		it('feature filter excludes variable questions', () => {
			const result = analyzeMicroDecisions('let count = 5;', {
				features: { variables: false },
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				const varQuestions = result.questions.filter(
					(q) => q.feature === 'variables',
				);
				expect(varQuestions).toHaveLength(0);
			}
		});

		it('register filter removes comparative questions', () => {
			const result = analyzeMicroDecisions('let count = 5;', {
				register: { comparative: false },
			});
			expect(result.ok).toBe(true);
			if (result.ok) {
				for (const q of result.questions) {
					const registers = q.questions.map((sub) => sub.register);
					expect(registers).not.toContain('comparative');
				}
			}
		});

		it('count caps results', () => {
			const result = analyzeMicroDecisions(
				'let alpha = 1;\nlet bravo = 2;\nlet charlie = 3;',
				{ count: 1 },
			);
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.questions).toHaveLength(1);
			}
		});

		it('range filter limits to line range', () => {
			const result = analyzeMicroDecisions(
				'let alpha = 1;\nlet bravo = 2;\nlet charlie = 3;',
				{ range: { start: 2, end: 2 } },
			);
			expect(result.ok).toBe(true);
			if (result.ok) {
				for (const q of result.questions) {
					expect(q.location.start.line).toBeLessThanOrEqual(2);
					expect(q.location.end.line).toBeGreaterThanOrEqual(2);
				}
			}
		});
	});

	describe('result immutability', () => {
		it('result is frozen', () => {
			const result = analyzeMicroDecisions('let count = 5;');
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('questions array is frozen', () => {
			const result = analyzeMicroDecisions('let count = 5;');
			if (result.ok) {
				expect(Object.isFrozen(result.questions)).toBe(true);
			}
		});
	});
});
