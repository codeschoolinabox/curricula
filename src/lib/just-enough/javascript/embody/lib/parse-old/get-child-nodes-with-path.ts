import type { Node } from 'acorn';

import type { ChildWithPath } from './types.js';

/**
 * Extracts all direct child AST nodes from a parent, each paired
 * with the NodePath segment that reaches it.
 *
 * @remarks The path-tracking companion to `getChildNodes`. Same
 * traversal rules — skips the metadata properties `type`, `start`,
 * `end`, `loc`; collects node-valued properties and node elements of
 * array-valued properties; skips `null`, primitives, and non-node
 * objects. The difference is the returned `segment`: `'init'` for an
 * object-valued property, `'body.0'` for an array element (the dot
 * index is the source-array position, so a null hole does not shift
 * later indices).
 *
 * Used by the validation walkers to assign `Violation.nodePath`. A
 * walker joins `parentPath` and each `segment` with `'.'` to build a
 * full Program-rooted path (e.g. `'$.body.0.declarations.0'`).
 *
 * The returned array is not frozen — callers iterate it immediately
 * and discard it (same transient contract as `getChildNodes`).
 *
 * @param node - Any acorn AST node.
 * @returns Direct children paired with their path segments, in
 *   property-enumeration order (array elements in source order).
 */
export default function getChildNodesWithPath(
	node: Node,
): readonly ChildWithPath[] {
	const children: ChildWithPath[] = [];
	const record = node as unknown as Record<string, unknown>;

	for (const key of Object.keys(node)) {
		// skip metadata properties that aren't child nodes
		if (key === 'type' || key === 'start' || key === 'end' || key === 'loc') {
			continue;
		}

		const value = record[key];

		if (Array.isArray(value)) {
			children.push(...arrayChildren(key, value));
		} else if (isNode(value)) {
			children.push({ child: value, segment: key });
		}
	}

	return children;
}

/**
 * Collects the node elements of an array-valued property, each tagged
 * with a `key.index` segment. The index is the source-array position
 * (via `.entries()`), so a null hole — e.g. a sparse array element —
 * does not shift later siblings' path segments.
 */
function arrayChildren(
	key: string,
	value: readonly unknown[],
): readonly ChildWithPath[] {
	const result: ChildWithPath[] = [];
	for (const [index, item] of value.entries()) {
		if (isNode(item)) {
			result.push({ child: item, segment: `${key}.${index}` });
		}
	}
	return result;
}

/**
 * Type guard: checks if a value looks like an acorn AST node.
 *
 * @remarks Mirrors the guard in `get-child-nodes.ts` — a non-null
 * object with a string `type` property. Kept local rather than shared
 * so the two traversal helpers stay independently readable.
 */
function isNode(value: unknown): value is Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as Record<string, unknown>).type === 'string'
	);
}
