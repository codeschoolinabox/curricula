import { describe, it, expect } from 'vitest';

import validateProgram from '../validate-program.js';
import justEnoughJs from '../just-enough-js.js';
import createViolation from '../create-violation.js';
import type { LanguageLevel } from '../types.js';

describe('validateProgram', () => {
	describe('valid programs', () => {
		it('returns isValid true for a conforming program', () => {
			const report = validateProgram(
				'let x = 5;\nconsole.log(x);\n',
				justEnoughJs,
			);
			expect(report.isValid).toBe(true);
			expect(report.violations).toHaveLength(0);
		});

		it('returns isValid true for an empty program', () => {
			const report = validateProgram('', justEnoughJs);
			expect(report.isValid).toBe(true);
		});

		it('includes the source in the report', () => {
			const source = 'let x = 5;';
			const report = validateProgram(source, justEnoughJs);
			expect(report.source).toBe(source);
		});

		it('includes the level name in the report', () => {
			const report = validateProgram('let x = 5;', justEnoughJs);
			expect(report.levelName).toBe('Just Enough JavaScript');
		});

		it('parses in module mode (import/export syntax accepted)', () => {
			const levelWithImport = {
				...justEnoughJs,
				nodes: {
					...justEnoughJs.nodes,
					ImportDeclaration: true,
					ImportDefaultSpecifier: true,
				},
			};
			const report = validateProgram(
				"import x from './y.js';",
				levelWithImport,
			);
			expect(report.parseError).toBeUndefined();
		});
	});

	describe('invalid programs', () => {
		it('returns isValid false with violations', () => {
			const report = validateProgram('var x = 5;', justEnoughJs);
			expect(report.isValid).toBe(false);
			expect(report.violations.length).toBeGreaterThan(0);
		});
	});

	describe('parse errors', () => {
		it('returns isValid false with parseError for syntax errors', () => {
			const report = validateProgram('let = ;', justEnoughJs);
			expect(report.isValid).toBe(false);
			expect(report.parseError).toBeDefined();
			expect(report.parseError!.message).toBeTruthy();
		});

		it('has empty violations when there is a parse error', () => {
			const report = validateProgram('let = ;', justEnoughJs);
			expect(report.violations).toHaveLength(0);
		});
	});

	describe('module mode', () => {
		it('does not produce strict-mode violations', () => {
			const report = validateProgram('let x = 5;', justEnoughJs);
			const strictViolation = report.violations.find((v) =>
				v.message.includes('use strict'),
			);
			expect(strictViolation).toBeUndefined();
		});
	});

	describe('severity affects isValid', () => {
		it('is valid when all violations are warnings', () => {
			// custom level where Literal produces a warning instead of a rejection
			const warningOnLiteral: LanguageLevel = {
				name: 'warning-test',
				nodes: {
					Program: true,
					ExpressionStatement: true,
					Literal: (node) =>
						createViolation(
							'Literal',
							'literals produce a warning in this test level',
							{
								start: { line: 1, column: 0 },
								end: { line: 1, column: 1 },
							},
							'warning',
						),
				},
			};
			const report = validateProgram('5;', warningOnLiteral);
			const warnings = report.violations.filter(
				(v) => v.severity === 'warning',
			);
			const rejections = report.violations.filter((v) => v.severity === 'rejection');
			expect(rejections).toHaveLength(0);
			expect(warnings.length).toBeGreaterThan(0);
			expect(report.isValid).toBe(true);
		});

		it('is invalid when there are rejection-severity violations', () => {
			const report = validateProgram('var x = 5;', justEnoughJs);
			const rejections = report.violations.filter((v) => v.severity === 'rejection');
			expect(rejections.length).toBeGreaterThan(0);
			expect(report.isValid).toBe(false);
		});

		it('var declaration produces rejection-severity violations', () => {
			const report = validateProgram('var x = 5;\nconsole.log(x);', justEnoughJs);
			const rejections = report.violations.filter((v) => v.severity === 'rejection');
			expect(rejections.length).toBeGreaterThan(0);
			expect(rejections[0].nodeType).toBe('VariableDeclaration');
		});
	});

	describe('report is frozen', () => {
		it('top-level report is frozen', () => {
			const report = validateProgram('let x = 5;', justEnoughJs);
			expect(Object.isFrozen(report)).toBe(true);
		});

		it('violations array is frozen', () => {
			const report = validateProgram('var x = 5;', justEnoughJs);
			expect(Object.isFrozen(report.violations)).toBe(true);
		});
	});
});
