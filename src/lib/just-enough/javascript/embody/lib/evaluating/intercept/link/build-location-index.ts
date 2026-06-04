/**
 * @file Builds a `LocationIndex` from a validated acorn `Program`.
 *
 * Walks the AST once, producing a parallel tree of `ASTNode` objects
 * (enriched with `syntaxId`, `parent`, `source`, `events: []`)
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
 * - **AST nodes are `Object.freeze`-immutable from the moment they're
 *   built** (shallow freeze applied at the end of each `walk(node)` call,
 *   after children are sorted into source order). The `events` array
 *   reference itself is locked — consumers can't reassign
 *   `node.events = ...` — but the array is still mutable until completion:
 *   `enrichEvent` (in [intercept.ts](../intercept.ts)) pushes back-refs
 *   into it as events arrive. `deepFreezeInPlace` at completion freezes
 *   the array too. Same shape contract as the events at yield time:
 *   the surrounding object is frozen; specific mutable sub-arrays
 *   accumulate during the run before the final freeze.
 */

import type { Node, Program } from 'acorn';

import type { ASTNode, LocationIndex, SourceLocation } from './types.js';

const META_KEYS = new Set(['type', 'start', 'end', 'loc']);

function isAcornNode(value: unknown): value is Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as { readonly type?: unknown }).type === 'string'
	);
}

function cloneLoc(loc: Node['loc']): SourceLocation {
	const safeLoc = loc as {
		readonly start: { readonly line: number; readonly column: number };
		readonly end: { readonly line: number; readonly column: number };
	};
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
	astByPath: ReadonlyMap<string, ASTNode>,
	exactStarts: ReadonlyMap<string, string>,
): ASTNode {
	const {start} = (acornNode as { readonly start: number });
	const {end} = (acornNode as { readonly end: number });

	// `children` is mutable until the result is frozen; we push every
	// direct AST descendant here in source order so consumers have a
	// generic walk path that doesn't require knowing ESTree property
	// names per node type. The same ASTNode references are also stored
	// under their named slots (.body, .callee, .arguments, etc.) below.
	const childrenList: readonly ASTNode[] = [];

	const astNode = {
		syntaxId: path,
		parent,
		type: acornNode.type,
		loc: cloneLoc(acornNode.loc),
		source: source.slice(start, end),
		events: [],
		children: childrenList,
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
			const childArray: readonly unknown[] = [];
			for (const [index, item] of value.entries()) {
				if (isAcornNode(item)) {
					const childPath = `${path}.${key}.${index}`;
					const childAstNode = walk(
						item,
						astNode,
						childPath,
						source,
						astByPath,
						exactStarts,
					);
					childArray.push(childAstNode);
					childrenList.push(childAstNode);
				} else {
					// Preserve non-node items (rare — e.g. holes in array patterns)
					// at their original index so downstream indexing is stable.
					childArray.push(item);
				}
			}
			astNode[key] = childArray;
		} else if (isAcornNode(value)) {
			const childPath = `${path}.${key}`;
			const childAstNode = walk(
				value,
				astNode,
				childPath,
				source,
				astByPath,
				exactStarts,
			);
			astNode[key] = childAstNode;
			childrenList.push(childAstNode);
		} else {
			// Primitive (Literal.value, Identifier.name, operator strings) or
			// non-node object (Literal.regex { pattern, flags }) — copy as-is.
			astNode[key] = value;
		}
	}

	// ESTree mostly produces children in source order via Object.keys, but
	// TemplateLiteral splits its parts into two parallel arrays (`quasis`
	// and `expressions`) that interleave at runtime. Sort by loc.start so
	// `children` always reflects source order regardless of node type.
	childrenList.sort((left, right) =>
		left.loc.start.line === right.loc.start.line
			? left.loc.start.column - right.loc.start.column
			: left.loc.start.line - right.loc.start.line,
	);

	// Shallow freeze: locks the astNode's own properties (events,
	// children, parent, named ESTree slots) — consumers can't reassign
	// them. The `events` array remains mutable until completion;
	// enrichEvent pushes back-refs through the cast. The `children`
	// array's order is locked-in at this point (sorted just above) so
	// further pushes are not expected. See file-header docblock.
	Object.freeze(astNode);

	return astNode;
}

export default buildLocationIndex;
