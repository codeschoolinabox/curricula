import { parse, type Identifier, type Node } from 'acorn';
import { analyze } from 'eslint-scope';
import { describe, expect, it } from 'vitest';

import type { LanguageLevel, ParseFacts } from '../../types.js';
import getChildNodesWithPath from '../get-child-nodes-with-path.js';
import validate from '../validate.js';

function parseFacts(source: string): ParseFacts {
	const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
	const manager = analyze(ast, { ecmaVersion: 2024, sourceType: 'module' });
	// @types/eslint-scope is stale (omits fields, types nodes as estree) — the
	// same structural read embody's derive-environment.ts documents
	const escaped = (
		manager.globalScope as unknown as {
			through: { identifier: Identifier }[];
		}
	).through;
	// the analyzer walks the very tree findPath descends, so the search always
	// hits; a miss would surface loudly in the verbatim nodePath assertions
	const unresolvedReferences = escaped.map(({ identifier }) => ({
		name: identifier.name,
		node: identifier,
		nodePath: findPath(ast, identifier, '$') ?? '',
	}));
	return { tokens: [], comments: [], ast, unresolvedReferences };
}

function findPath(node: Node, target: Node, path: string): string | null {
	if (node === target) return path;
	return (
		getChildNodesWithPath(node)
			.map(({ child, segment }) =>
				findPath(child, target, `${path}.${segment}`),
			)
			.find((found) => found !== null) ?? null
	);
}

describe('validate', () => {
	describe('an empty program', () => {
		it('produces no violations', () => {
			expect(validate(parseFacts(''))).toEqual([]);
		});
	});

	describe('one statement stepping outside both phases', () => {
		it('produces exactly two violations', () => {
			const violations = validate(parseFacts('var x = document;'));
			expect(violations).toHaveLength(2);
		});

		it('the grammar violation names the refused declaration', () => {
			const violations = validate(parseFacts('var x = document;'));
			expect(violations[0].nodeType).toBe('VariableDeclaration');
		});

		it('the grammar violation carries the var refusal message', () => {
			const violations = validate(parseFacts('var x = document;'));
			expect(violations[0].message).toBe(
				"'var' declarations are not allowed — use 'let' or 'const'",
			);
		});

		it("the grammar violation carries the statement's path", () => {
			const violations = validate(parseFacts('var x = document;'));
			expect(violations[0].nodePath).toBe('$.body.0');
		});

		it('the vocabulary violation names the escaped identifier', () => {
			const violations = validate(parseFacts('var x = document;'));
			expect(violations[1].nodeType).toBe('Identifier');
		});

		it('the vocabulary violation carries the not-available message', () => {
			const violations = validate(parseFacts('var x = document;'));
			expect(violations[1].message).toBe(
				"'document' is not available at this language level",
			);
		});

		it("the vocabulary violation carries the reference's offsets", () => {
			const violations = validate(parseFacts('var x = document;'));
			expect(violations[1].location).toEqual({ start: 8, end: 16 });
		});

		it("the vocabulary violation carries the reference's path verbatim", () => {
			const violations = validate(parseFacts('var x = document;'));
			expect(violations[1].nodePath).toBe('$.body.0.declarations.0.init');
		});
	});

	describe('a clean admitted program', () => {
		it('produces no violations', () => {
			expect(validate(parseFacts('let x = 1;\nalert(x);'))).toEqual([]);
		});

		it('a parenthesized assignment target produces no violations', () => {
			// PINNED(human ruling 2026-07-30: published ast is ESTree-shaped — parens fold away; (a) = 5 reaches the level as a plain Identifier assignment, via this file's locally-parsed ParseFacts)
			expect(validate(parseFacts('let a = 1;\n(a) = 5;'))).toEqual([]);
		});
	});

	describe('the union is ordered by source position, not by phase', () => {
		it('a vocabulary violation precedes a later grammar violation', () => {
			const violations = validate(parseFacts('document;\nvar x = 1;'));
			expect(violations.map((violation) => violation.nodeType)).toEqual([
				'Identifier',
				'VariableDeclaration',
			]);
		});

		it('the offsets ascend', () => {
			const violations = validate(parseFacts('document;\nvar x = 1;'));
			expect(violations.map((violation) => violation.location.start)).toEqual([
				0, 10,
			]);
		});
	});

	describe('findings from both phases interleave across many statements', () => {
		it('produces three violations', () => {
			const violations = validate(parseFacts('document; var x = 1; fetch;'));
			expect(violations).toHaveLength(3);
		});

		it('in source order across phases', () => {
			const violations = validate(parseFacts('document; var x = 1; fetch;'));
			expect(violations.map((violation) => violation.nodeType)).toEqual([
				'Identifier',
				'VariableDeclaration',
				'Identifier',
			]);
		});
	});

	describe('two findings at one offset keep grammar before vocabulary', () => {
		it('both findings start at the same offset', () => {
			const violations = validate(parseFacts('document instanceof xyz;'));
			expect(violations.map((violation) => violation.location.start)).toEqual([
				0, 0,
			]);
		});

		it('the grammar violation comes first', () => {
			const violations = validate(parseFacts('document instanceof xyz;'));
			expect(violations.map((violation) => violation.nodeType)).toEqual([
				'BinaryExpression',
				'Identifier',
			]);
		});
	});

	describe('a program violating only one phase', () => {
		it('only the vocabulary → one violation', () => {
			expect(validate(parseFacts('document;'))).toHaveLength(1);
		});

		it('only the grammar → one violation', () => {
			expect(validate(parseFacts('var x = 1;'))).toHaveLength(1);
		});
	});

	describe('the answer is frozen', () => {
		it('the returned array is frozen', () => {
			const violations = validate(parseFacts('var x = document;'));
			expect(Object.isFrozen(violations)).toBe(true);
		});

		it('each violation is frozen', () => {
			const violations = validate(parseFacts('var x = document;'));
			expect(Object.isFrozen(violations[0])).toBe(true);
		});
	});

	describe('the spine contract', () => {
		it("satisfies the spine's validate signature", () => {
			const spineValidate: LanguageLevel['validate'] = validate;
			expect(spineValidate).toBe(validate);
		});
	});

	describe('the same source, parsed twice, produces the same violations', () => {
		it('two consultations answer alike', () => {
			expect(validate(parseFacts('var x = document;'))).toEqual(
				validate(parseFacts('var x = document;')),
			);
		});
	});
});
