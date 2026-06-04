/**
 * @file Looks up the AST `nodePath` for a runtime `(line, column)`.
 *
 * Used ONLY for the residual error path: a runtime error fires outside
 * any CallExpression (e.g. bare `null.foo;`). The instrumentation phase
 * (`wrap-call-expressions.ts`) handles all in-call attribution by
 * baking nodePath into the wrap; trap functions read it directly.
 *
 * Always returns `'enclosing-fallback'` provenance — see
 * [DOCS.md § Ubiquitous Language](../DOCS.md) for the full provenance
 * vocabulary. The `'no-ast'` provenance is set by the caller for events
 * with no AST to look up.
 */

import type { LocationIndex } from './types.js';

type LookupResult = {
	readonly source: 'enclosing-fallback';
	readonly nodePath: string;
};

function lookupNodePath(
	index: LocationIndex,
	line: number,
	column: number,
): LookupResult {
	let bestPath: string | null = null;
	let bestSize = Infinity;

	for (const [path, node] of index.astByPath) {
		if (!containsPosition(node.loc, line, column)) continue;

		const size = approxSize(node.loc);
		// `<=` (not `<`) so deeper nodes (visited later in the parent-first
		// walk) win on ties — e.g. CallExpression beating its enclosing
		// ExpressionStatement when both share start position but the
		// statement extends one char further (semicolon).
		if (size <= bestSize) {
			bestSize = size;
			bestPath = path;
		}
	}

	// Universal fallback: Program root. Reachable when (line, column) is
	// outside the source range entirely — extremely rare, but the contract
	// guarantees a non-null result for any caller that has an AST in hand.
	const resolvedPath = bestPath ?? index.root.syntaxId;

	return {
		source: 'enclosing-fallback',
		nodePath: resolvedPath,
	};
}

function containsPosition(
	loc: {
		start: { line: number; column: number };
		end: { line: number; column: number };
	},
	line: number,
	column: number,
): boolean {
	// Inclusive start, exclusive end (matches acorn's convention).
	const afterStart =
		loc.start.line < line ||
		(loc.start.line === line && loc.start.column <= column);
	const beforeEnd =
		loc.end.line > line || (loc.end.line === line && loc.end.column > column);
	return afterStart && beforeEnd;
}

function approxSize(loc: {
	start: { line: number; column: number };
	end: { line: number; column: number };
}): number {
	// Coarse "source area" proxy. Multi-line nodes weighted heavily so a
	// single-line CallExpression always beats a wrapping multi-line block.
	const lineSpan = loc.end.line - loc.start.line;
	const colSpan = loc.end.column - loc.start.column;
	return lineSpan * 1_000_000 + colSpan;
}

export default lookupNodePath;
