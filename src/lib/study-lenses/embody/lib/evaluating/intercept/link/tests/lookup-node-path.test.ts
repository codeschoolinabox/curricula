import { describe, it, expect } from 'vitest';

import parseProgram from '../../../../parse-old/parse-program.js';
import buildLocationIndex from '../build-location-index.js';
import lookupNodePath from '../lookup-node-path.js';

function indexFor(source: string) {
	const program = parseProgram(source, 'module');
	if ('message' in program) {
		throw new Error(`fixture failed to parse: ${program.message}`);
	}
	return buildLocationIndex(program, source);
}

describe('lookupNodePath', () => {
	describe('always returns enclosing-fallback', () => {
		// `'exact'` provenance was removed when the universal CallExpression
		// wrap (__$ic) replaced Error.stack-based attribution. lookupNodePath
		// is now used only on the residual error path (runtime errors fired
		// outside any wrapped call), where 'enclosing-fallback' is the
		// only honest answer.
		it('returns enclosing-fallback even when (line, col) matches a node start', () => {
			const index = indexFor('let x = 1;');
			const result = lookupNodePath(index, 1, 0);
			expect(result.source).toBe('enclosing-fallback');
		});

		it('returns the deepest containing node when (line, col) matches a node start', () => {
			const index = indexFor('console.log(1);');
			// At 1:0 the deepest containing node is still found correctly,
			// just labeled enclosing-fallback rather than 'exact'.
			const result = lookupNodePath(index, 1, 0);
			expect(result.source).toBe('enclosing-fallback');
			expect(index.astByPath.get(result.nodePath)!.type).toBe('Identifier');
		});
	});

	describe('enclosing fallback', () => {
		it('returns source: enclosing-fallback when no node starts at (line, col)', () => {
			const index = indexFor('console.log(1);');
			// Position 1:7 is inside `console.log` but not at any node's start
			// (it's mid-token within the MemberExpression).
			const result = lookupNodePath(index, 1, 7);
			expect(result.source).toBe('enclosing-fallback');
		});

		it('fallback picks the deepest containing node', () => {
			const index = indexFor('console.log(1);');
			const result = lookupNodePath(index, 1, 7);
			// Inside `console.log` but mid-MemberExpression — the smallest
			// containing node should be the MemberExpression itself, not the
			// Program or ExpressionStatement.
			const node = index.astByPath.get(result.nodePath);
			expect(node!.type).toBe('MemberExpression');
		});
	});

	describe('universal root fallback', () => {
		it('returns root with enclosing-fallback when (line, col) is outside source', () => {
			const index = indexFor('let x = 1;');
			// Line 99 is way past the source end.
			const result = lookupNodePath(index, 99, 0);
			expect(result.source).toBe('enclosing-fallback');
			expect(result.nodePath).toBe('$');
		});
	});
});
