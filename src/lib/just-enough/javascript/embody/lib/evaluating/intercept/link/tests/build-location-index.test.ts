import { describe, it, expect } from 'vitest';

import parseProgram from '../../../../parse-old/parse-program.js';
import buildLocationIndex from '../build-location-index.js';

function indexFor(source: string) {
	const program = parseProgram(source, 'module');
	if ('message' in program) {
		throw new Error(`fixture failed to parse: ${program.message}`);
	}
	return buildLocationIndex(program, source);
}

describe('buildLocationIndex', () => {
	describe('shape', () => {
		it('produces a root with syntaxId "$"', () => {
			const index = indexFor('let x = 1;');
			expect(index.root.syntaxId).toBe('$');
			expect(index.root.type).toBe('Program');
		});

		it('astByPath contains the root keyed by "$"', () => {
			const index = indexFor('let x = 1;');
			expect(index.astByPath.get('$')).toBe(index.root);
		});

		it('exactStarts maps "1:0" to "$" for an empty Program', () => {
			const index = indexFor('');
			expect(index.exactStarts.get('1:0')).toBe('$');
		});
	});

	describe('walk', () => {
		it('builds nested children with parent linkage', () => {
			const index = indexFor('console.log(1);');
			const callExpr = index.astByPath.get('$.body.0.expression');
			expect(callExpr).toBeDefined();
			expect(callExpr!.type).toBe('CallExpression');
			expect(callExpr!.parent).toBe(index.astByPath.get('$.body.0'));
			expect(callExpr!.parent!.parent).toBe(index.root);
		});

		it('preserves array children at their original indices', () => {
			const index = indexFor('console.log(1, 2);');
			const argument0 = index.astByPath.get('$.body.0.expression.arguments.0');
			const argument1 = index.astByPath.get('$.body.0.expression.arguments.1');
			expect(argument0).toBeDefined();
			expect(argument1).toBeDefined();
			expect(argument0!.type).toBe('Literal');
			expect(argument1!.type).toBe('Literal');
		});

		it('attaches source slices matching the input range', () => {
			const source = 'let x = 1;';
			const index = indexFor(source);
			expect(index.root.source).toBe(source);
		});

		it('initializes events: [] (mutable, empty) on every node', () => {
			const index = indexFor('console.log(1);');
			for (const node of index.astByPath.values()) {
				expect(node.events).toEqual([]);
			}
		});
	});

	describe('exactStarts depth resolution', () => {
		it('innermost node wins when multiple share the same start position', () => {
			// `console.log(1);` — ExpressionStatement and its CallExpression
			// both start at line 1, column 0.
			const index = indexFor('console.log(1);');
			const pathAtStart = index.exactStarts.get('1:0');
			const node = index.astByPath.get(pathAtStart!);
			// CallExpression should beat its enclosing ExpressionStatement
			// (both share start; the call's range is tighter).
			expect(node!.type).not.toBe('Program');
			// Either ExpressionStatement → CallExpression → MemberExpression →
			// Identifier 'console' depending on tree traversal — but it must be
			// the deepest node starting at (1,0). For `console.log(1);` that
			// is the Identifier `console`.
			expect(node!.type).toBe('Identifier');
		});

		it('keeps distinct start positions in separate entries', () => {
			const index = indexFor('let x = 1;\nlet y = 2;');
			expect(index.exactStarts.has('1:0')).toBe(true);
			expect(index.exactStarts.has('2:0')).toBe(true);
			expect(index.exactStarts.get('1:0')).not.toBe(
				index.exactStarts.get('2:0'),
			);
		});
	});

	describe('children[] (generic navigation)', () => {
		it('CallExpression has callee + each argument as children, in source order', () => {
			const index = indexFor('console.log(1);');
			const callExpr = index.astByPath.get('$.body.0.expression')!;
			expect(callExpr.type).toBe('CallExpression');
			// CallExpression children: [callee MemberExpression, argument Literal]
			expect(callExpr.children.length).toBe(2);
			expect(callExpr.children[0].type).toBe('MemberExpression');
			expect(callExpr.children[1].type).toBe('Literal');
		});

		it('children entries are the SAME ASTNode references as named slots', () => {
			const index = indexFor('console.log(1);');
			const callExpr = index.astByPath.get('$.body.0.expression')!;
			const {callee} = (callExpr as unknown as { callee: unknown });
			const argumentsArray = (callExpr as unknown as { arguments: unknown[] })
				.arguments;
			// children[0] === .callee, children[1] === .arguments[0]
			expect(callExpr.children[0]).toBe(callee);
			expect(callExpr.children[1]).toBe(argumentsArray[0]);
		});

		it('Program root children include every top-level statement', () => {
			const index = indexFor('let x = 1;\nlet y = 2;\nlet z = 3;');
			expect(index.root.children.length).toBe(3);
			for (const child of index.root.children) {
				expect(child.type).toBe('VariableDeclaration');
			}
		});

		it('leaf nodes (Identifier, Literal) have empty children arrays', () => {
			const index = indexFor('let x = 1;');
			// Identifier `x` and Literal `1` are both leaves
			for (const node of index.astByPath.values()) {
				if (node.type === 'Identifier' || node.type === 'Literal') {
					expect(node.children.length).toBe(0);
				}
			}
		});

		it('children appear in source-position order', () => {
			const index = indexFor('console.log(1, 2, 3);');
			const callExpr = index.astByPath.get('$.body.0.expression')!;
			// children: [callee, arg0, arg1, arg2] — left-to-right by source position
			for (let index_ = 1; index_ < callExpr.children.length; index_++) {
				const previous = callExpr.children[index_ - 1];
				const current = callExpr.children[index_];
				expect(current.loc.start.column).toBeGreaterThanOrEqual(
					previous.loc.start.column,
				);
			}
		});

		it('TemplateLiteral interleaves quasis and expressions in source order', () => {
			// Acorn stores `expressions` and `quasis` as two parallel arrays
			// on TemplateLiteral. Without the loc-sort they would arrive
			// grouped (all quasis, then all expressions, or vice-versa).
			// `children` must reflect source order: quasi, expr, quasi.
			const index = indexFor('let s = `hello ${name} world`;');
			const tl = index.astByPath.get('$.body.0.declarations.0.init')!;
			expect(tl.type).toBe('TemplateLiteral');
			expect(tl.children.length).toBe(3);
			expect(tl.children[0].type).toBe('TemplateElement');
			expect(tl.children[1].type).toBe('Identifier');
			expect(tl.children[2].type).toBe('TemplateElement');
			// Strict ascending by column — interleave proven, no ties.
			for (let index_ = 1; index_ < tl.children.length; index_++) {
				expect(tl.children[index_].loc.start.column).toBeGreaterThan(
					tl.children[index_ - 1].loc.start.column,
				);
			}
		});
	});
});
