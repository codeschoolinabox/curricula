import { describe, it, expect } from 'vitest';

import parseProgram from '../../../../parse/parse-program.js';
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
			const arg0 = index.astByPath.get('$.body.0.expression.arguments.0');
			const arg1 = index.astByPath.get('$.body.0.expression.arguments.1');
			expect(arg0).toBeDefined();
			expect(arg1).toBeDefined();
			expect(arg0!.type).toBe('Literal');
			expect(arg1!.type).toBe('Literal');
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
			expect(index.exactStarts.get('1:0')).not.toBe(index.exactStarts.get('2:0'));
		});
	});
});
