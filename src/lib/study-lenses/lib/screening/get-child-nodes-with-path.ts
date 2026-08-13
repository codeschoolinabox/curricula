import type { Node } from 'acorn';

import type { ChildWithPath } from './types.js';

/**
 * Every direct child AST node of a parent, each paired with the path segment
 * that reaches it.
 *
 * @remarks
 * An object-valued property yields its key (`'init'`); an array element yields
 * `'key.index'` where the index is the source-array position — so a hole does
 * not renumber its later siblings. `null`, primitives, and non-node objects — a
 * `Literal.regex` record, and the numeric span array the published settings add
 * — never satisfy the node check, so they contribute no segment.
 *
 * The caller's walk joins its parent path with each `segment` to form a full
 * Program-rooted node path (e.g. `'$.body.0.declarations.0'`) as it descends —
 * paths are carried inline, never built into a separate map.
 *
 * The returned array is not frozen: it is read immediately and discarded, so it
 * is transient.
 *
 * @param node - Any acorn AST node.
 * @returns Its direct children paired with their path segments, in
 *   property-enumeration order (array elements in source order).
 */
export default function getChildNodesWithPath(
	node: Node,
): readonly ChildWithPath[] {
	const properties = node as unknown as Record<string, unknown>;

	return Object.keys(properties)
		.filter((key) => !isMetadataKey(key))
		.flatMap((key) => segmentedChildren(key, properties[key]));
}

/** The keys present on every acorn node that are never children. */
function isMetadataKey(key: string): boolean {
	return key === 'type' || key === 'start' || key === 'end' || key === 'loc';
}

/**
 * The child(ren) one property value contributes, each tagged with its segment:
 * a `key.index` segment per node element of an array-valued property (the index
 * is the source position, preserved across holes), a bare `key` segment if the
 * value is itself a node, or nothing.
 */
function segmentedChildren(
	key: string,
	value: unknown,
): readonly ChildWithPath[] {
	if (!Array.isArray(value)) {
		return isNode(value) ? [{ child: value, segment: key }] : [];
	}

	return Array.from(value.entries())
		.filter((entry): entry is [number, Node] => isNode(entry[1]))
		.map(([index, child]) => ({ child, segment: `${key}.${index}` }));
}

/**
 * Whether a value looks like an acorn AST node: a non-null object with a string
 * `type`. Small enough to read inline, so it stays beside its one caller rather
 * than becoming a shared export.
 */
function isNode(value: unknown): value is Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as Record<string, unknown>).type === 'string'
	);
}
