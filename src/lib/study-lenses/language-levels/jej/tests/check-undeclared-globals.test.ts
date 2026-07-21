import {
	parse,
	type ExpressionStatement,
	type Identifier,
	type Program,
} from 'acorn';
import { describe, expect, it } from 'vitest';

import checkUndeclaredGlobals from '../check-undeclared-globals.js';
import justEnoughJs from '../just-enough-js.js';

function programOf(source: string): Program {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'module',
		locations: true,
	});
}

function identifierOf(source: string): Identifier {
	return (programOf(source).body[0] as ExpressionStatement)
		.expression as Identifier;
}

function secondIdentifierOf(source: string): Identifier {
	return (programOf(source).body[1] as ExpressionStatement)
		.expression as Identifier;
}

describe('checkUndeclaredGlobals', () => {
	describe('an empty escape list', () => {
		it('produces no violations', () => {
			const violations = checkUndeclaredGlobals([], new Set<string>());
			expect(violations).toEqual([]);
		});
	});

	describe("an admitted name is the realm's", () => {
		it('produces no violations', () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'alert',
						node: identifierOf('alert;'),
						nodePath: '$.body.0.expression',
					},
				],
				new Set(['alert']),
			);
			expect(violations).toEqual([]);
		});
	});

	describe('a known name the level does not admit is outside the level', () => {
		it('produces exactly one violation', () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'document',
						node: identifierOf('document;'),
						nodePath: '$.body.0.expression',
					},
				],
				new Set<string>(),
			);
			expect(violations).toHaveLength(1);
		});

		it("names the reference's node type", () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'document',
						node: identifierOf('document;'),
						nodePath: '$.body.0.expression',
					},
				],
				new Set<string>(),
			);
			expect(violations[0].nodeType).toBe('Identifier');
		});

		it('carries the not-available message for the name', () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'document',
						node: identifierOf('document;'),
						nodePath: '$.body.0.expression',
					},
				],
				new Set<string>(),
			);
			expect(violations[0].message).toBe(
				"'document' is not available at this language level",
			);
		});

		it("carries the node's own character offsets", () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'document',
						node: identifierOf('document;'),
						nodePath: '$.body.0.expression',
					},
				],
				new Set<string>(),
			);
			expect(violations[0].location).toEqual({ start: 0, end: 8 });
		});

		it("carries the reference's path verbatim", () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'document',
						node: identifierOf('document;'),
						nodePath: '$.body.0.expression',
					},
				],
				new Set<string>(),
			);
			expect(violations[0].nodePath).toBe('$.body.0.expression');
		});
	});

	describe('two known names the level does not admit', () => {
		it('produce two violations', () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'document',
						node: identifierOf('document; fetch;'),
						nodePath: '$.body.0.expression',
					},
					{
						name: 'fetch',
						node: secondIdentifierOf('document; fetch;'),
						nodePath: '$.body.1.expression',
					},
				],
				new Set<string>(),
			);
			expect(violations).toHaveLength(2);
		});

		it("follow the escape list's order, not source-position order", () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'fetch',
						node: secondIdentifierOf('document; fetch;'),
						nodePath: '$.body.1.expression',
					},
					{
						name: 'document',
						node: identifierOf('document; fetch;'),
						nodePath: '$.body.0.expression',
					},
				],
				new Set<string>(),
			);
			expect(violations.map((violation) => violation.nodePath)).toEqual([
				'$.body.1.expression',
				'$.body.0.expression',
			]);
		});

		it('the same name twice produces one violation per reference', () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'document',
						node: identifierOf('document; document;'),
						nodePath: '$.body.0.expression',
					},
					{
						name: 'document',
						node: secondIdentifierOf('document; document;'),
						nodePath: '$.body.1.expression',
					},
				],
				new Set<string>(),
			);
			expect(violations.map((violation) => violation.nodePath)).toEqual([
				'$.body.0.expression',
				'$.body.1.expression',
			]);
		});
	});

	describe("a name neither admitted nor known is the runtime's", () => {
		it('a typo produces no violations', () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'xyzNotAThing',
						node: identifierOf('xyzNotAThing;'),
						nodePath: '$.body.0.expression',
					},
				],
				new Set<string>(),
			);
			expect(violations).toEqual([]);
		});
	});

	describe('mixed admitted, known, and unknown names', () => {
		it('only the known name the level does not admit produces a violation', () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'alert',
						node: identifierOf('alert;'),
						nodePath: '$.body.0.expression',
					},
					{
						name: 'document',
						node: identifierOf('document;'),
						nodePath: '$.body.1.expression',
					},
					{
						name: 'xyzNotAThing',
						node: identifierOf('xyzNotAThing;'),
						nodePath: '$.body.2.expression',
					},
				],
				new Set(['alert']),
			);
			expect(violations.map((violation) => violation.nodePath)).toEqual([
				'$.body.1.expression',
			]);
		});
	});

	describe("a name both admitted and known to JavaScript is the realm's", () => {
		it("the level's own 'Math' produces no violations", () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'Math',
						node: identifierOf('Math;'),
						nodePath: '$.body.0.expression',
					},
				],
				justEnoughJs.admittedGlobals,
			);
			expect(violations).toEqual([]);
		});

		it("the level's own 'parseInt' produces no violations", () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'parseInt',
						node: identifierOf('parseInt;'),
						nodePath: '$.body.0.expression',
					},
				],
				justEnoughJs.admittedGlobals,
			);
			expect(violations).toEqual([]);
		});
	});

	describe('the ruling is case-sensitive', () => {
		it("admitting 'math' does not admit the known 'Math'", () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'Math',
						node: identifierOf('Math;'),
						nodePath: '$.body.0.expression',
					},
				],
				new Set(['math']),
			);
			expect(violations).toHaveLength(1);
		});

		it("'math' is not the known 'Math', so it is the runtime's", () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'math',
						node: identifierOf('math;'),
						nodePath: '$.body.0.expression',
					},
				],
				new Set<string>(),
			);
			expect(violations).toEqual([]);
		});
	});

	describe("the ruling reads only the reference's name", () => {
		it("an unknown name is the runtime's even when its node spells a known one", () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'xyzNotAThing',
						node: identifierOf('document;'),
						nodePath: '$.body.0.expression',
					},
				],
				new Set<string>(),
			);
			expect(violations).toEqual([]);
		});
	});

	describe('the answer is frozen', () => {
		it('the returned array is frozen', () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'document',
						node: identifierOf('document;'),
						nodePath: '$.body.0.expression',
					},
				],
				new Set<string>(),
			);
			expect(Object.isFrozen(violations)).toBe(true);
		});

		it('each violation is frozen', () => {
			const violations = checkUndeclaredGlobals(
				[
					{
						name: 'document',
						node: identifierOf('document;'),
						nodePath: '$.body.0.expression',
					},
				],
				new Set<string>(),
			);
			expect(Object.isFrozen(violations[0])).toBe(true);
		});

		it('the borrowed identifier node is never frozen', () => {
			const node = identifierOf('document;');
			checkUndeclaredGlobals(
				[{ name: 'document', node, nodePath: '$.body.0.expression' }],
				new Set<string>(),
			);
			expect(Object.isFrozen(node)).toBe(false);
		});
	});
});
