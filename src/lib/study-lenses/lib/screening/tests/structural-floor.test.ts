import { parse, type Program } from 'acorn';
import { describe, expect, it } from 'vitest';

import collectViolations from '../collect-violations.js';
import PARSE_SETTINGS from '../parse-settings.js';
import STRUCTURAL_FLOOR from '../structural-floor.js';

function programOf(source: string): Program {
	return parse(source, { ...PARSE_SETTINGS, sourceType: 'module' });
}

describe('STRUCTURAL_FLOOR', () => {
	describe('the published table', () => {
		it('names exactly five node types', () => {
			expect(Object.keys(STRUCTURAL_FLOOR)).toHaveLength(5);
		});

		it('the program envelope is admitted', () => {
			expect(STRUCTURAL_FLOOR.Program).toBe(true);
		});

		it('every named type is admitted outright', () => {
			expect(Object.values(STRUCTURAL_FLOOR)).toEqual([
				true,
				true,
				true,
				true,
				true,
			]);
		});

		it('the five are envelope, two wrappers, identifier, literal', () => {
			const named = Object.keys(STRUCTURAL_FLOOR).toSorted((left, right) =>
				left.localeCompare(right),
			);
			expect(named).toEqual([
				'BlockStatement',
				'ExpressionStatement',
				'Identifier',
				'Literal',
				'Program',
			]);
		});
	});

	describe('deliberately absent', () => {
		it('the declaration statement — it comes from the inventory', () => {
			expect('VariableDeclaration' in STRUCTURAL_FLOOR).toBe(false);
		});

		it('the binding site — admitting it alone grants no expression', () => {
			expect('VariableDeclarator' in STRUCTURAL_FLOOR).toBe(false);
		});

		it('the empty statement — a bare semicolon is never load-bearing', () => {
			expect('EmptyStatement' in STRUCTURAL_FLOOR).toBe(false);
		});
	});

	describe('the published value', () => {
		it('is frozen', () => {
			expect(Object.isFrozen(STRUCTURAL_FLOOR)).toBe(true);
		});
	});

	describe('as the walk reads it', () => {
		it('admits a floor-typed program whole', () => {
			const program = programOf('"s"; { n; }');
			const violations = collectViolations(program, STRUCTURAL_FLOOR);
			expect(violations).toEqual([]);
		});

		it('refuses a declaration at both of its nodes', () => {
			const program = programOf('let n = 3; { n; }');
			const violations = collectViolations(program, STRUCTURAL_FLOOR);
			expect(violations.map((violation) => violation.nodeType)).toEqual([
				'VariableDeclaration',
				'VariableDeclarator',
			]);
		});
	});
});
