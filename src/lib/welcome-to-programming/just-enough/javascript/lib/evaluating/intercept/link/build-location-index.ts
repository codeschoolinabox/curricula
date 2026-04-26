/**
 * @file Builds a `LocationIndex` from a validated acorn `Program`.
 *
 * Walks the AST once, producing a parallel tree of `ASTNode` objects
 * (enriched with `syntaxId`, `parent`, `source`, mutable `events: []`)
 * plus two maps: `astByPath` for nodePath → node lookup, and `exactStarts`
 * for `(line, column) → nodePath` exact-start matching.
 *
 * The acorn AST is NOT mutated — children are recursively converted to
 * the project's `ASTNode` shape and re-attached under the same keys so
 * consumers can navigate `node.body`, `node.expression`, etc. naturally.
 *
 * Contract:
 * - Path convention: `'$'` for Program, `'$.body.0'` for first statement,
 *   `'$.body.0.expression'` for nested. Matches trace's documented style.
 * - `exactStarts` collisions: deepest node wins (parent set first, child
 *   overwrites during recursion).
 * - `events` arrays start empty; `link()` mutates them in place before
 *   the result is frozen.
 */

import type { Node, Program } from 'acorn';

import type { ASTNode, LocationIndex, SourceLocation } from './types.js';

const META_KEYS = new Set(['type', 'start', 'end', 'loc']);

function isAcornNode(value: unknown): value is Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as { type?: unknown }).type === 'string'
	);
}

function cloneLoc(loc: Node['loc']): SourceLocation {
	const safeLoc = loc as { start: { line: number; column: number }; end: { line: number; column: number } };
	return {
		start: { line: safeLoc.start.line, column: safeLoc.start.column },
		end: { line: safeLoc.end.line, column: safeLoc.end.column },
	};
}

function buildLocationIndex(program: Program, source: string): LocationIndex {
	const astByPath = new Map<string, ASTNode>();
	const exactStarts = new Map<string, string>();

	const root = walk(program, null, '$', source, astByPath, exactStarts);

	return { astByPath, exactStarts, root };
}

function walk(
	acornNode: Node,
	parent: ASTNode | null,
	path: string,
	source: string,
	astByPath: Map<string, ASTNode>,
	exactStarts: Map<string, string>,
): ASTNode {
	const start = (acornNode as { start: number }).start;
	const end = (acornNode as { end: number }).end;

	const astNode = {
		syntaxId: path,
		parent,
		type: acornNode.type,
		loc: cloneLoc(acornNode.loc),
		source: source.slice(start, end),
		events: [],
	} as unknown as ASTNode & Record<string, unknown>;

	astByPath.set(path, astNode);

	const startKey = `${astNode.loc.start.line}:${astNode.loc.start.column}`;
	// Deepest-wins: parent's entry is set here BEFORE we recurse, so any
	// child starting at the same position will overwrite it below.
	exactStarts.set(startKey, path);

	for (const key of Object.keys(acornNode)) {
		if (META_KEYS.has(key)) continue;

		const value = (acornNode as unknown as Record<string, unknown>)[key];

		if (Array.isArray(value)) {
			const childArray: unknown[] = [];
			for (let i = 0; i < value.length; i++) {
				const item = value[i];
				if (isAcornNode(item)) {
					const childPath = `${path}.${key}.${i}`;
					childArray.push(
						walk(item, astNode, childPath, source, astByPath, exactStarts),
					);
				} else {
					// Preserve non-node items (rare — e.g. holes in array patterns)
					// at their original index so downstream indexing is stable.
					childArray.push(item);
				}
			}
			astNode[key] = childArray;
		} else if (isAcornNode(value)) {
			const childPath = `${path}.${key}`;
			astNode[key] = walk(value, astNode, childPath, source, astByPath, exactStarts);
		} else {
			// Primitive (Literal.value, Identifier.name, operator strings) or
			// non-node object (Literal.regex { pattern, flags }) — copy as-is.
			astNode[key] = value;
		}
	}

	return astNode;
}

export default buildLocationIndex;
