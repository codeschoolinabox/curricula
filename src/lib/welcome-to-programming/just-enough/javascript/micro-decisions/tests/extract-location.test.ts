import { describe, it, expect } from 'vitest';
import { parse } from 'acorn';
import type { Node } from 'acorn';

import extractLocation from '../extract-location.js';

// ─── Test helper ────────────────────────────────────────────

function parseSource(source: string): Node {
	return parse(source, {
		ecmaVersion: 'latest',
		sourceType: 'module',
		locations: true,
	});
}

// ─── Tests ──────────────────────────────────────────────────

describe('extractLocation', () => {
	describe('extracts start/end from real AST nodes', () => {
		it('extracts location from a simple variable declaration', () => {
			const ast = parseSource('let x = 5;');
			// The first statement in the body
			const decl = (ast as unknown as { body: Node[] }).body[0]!;
			const loc = extractLocation(decl);

			expect(loc.start).toStrictEqual({ line: 1, column: 0 });
			expect(loc.end).toStrictEqual({ line: 1, column: 10 });
		});

		it('extracts location from a node on a later line', () => {
			const source = 'let x = 1;\nlet y = 2;';
			const ast = parseSource(source);
			const secondDecl = (ast as unknown as { body: Node[] }).body[1]!;
			const loc = extractLocation(secondDecl);

			expect(loc.start.line).toBe(2);
			expect(loc.end.line).toBe(2);
		});
	});

	describe('fallback for nodes without loc', () => {
		it('returns line 1, column 0 for both start and end', () => {
			const fakeNode = {
				type: 'Identifier',
				name: 'x',
				start: 0,
				end: 1,
			} as unknown as Node;

			const loc = extractLocation(fakeNode);

			expect(loc).toStrictEqual({
				start: { line: 1, column: 0 },
				end: { line: 1, column: 0 },
			});
		});
	});

	describe('acorn location conventions', () => {
		it('line numbers are 1-based', () => {
			const ast = parseSource('let x = 5;');
			const decl = (ast as unknown as { body: Node[] }).body[0]!;
			const loc = extractLocation(decl);

			expect(loc.start.line).toBe(1);
		});

		it('column numbers are 0-based', () => {
			const ast = parseSource('let x = 5;');
			const decl = (ast as unknown as { body: Node[] }).body[0]!;
			const loc = extractLocation(decl);

			expect(loc.start.column).toBe(0);
		});
	});
});
