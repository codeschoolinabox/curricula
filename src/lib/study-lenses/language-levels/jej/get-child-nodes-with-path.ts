import type { Node } from 'acorn';

/**
 * Every direct child AST node of a parent, each paired with the path segment
 * that reaches it.
 *
 * @remarks
 * The path-tracking companion to `getChildNodes`, and a vendored tree-walk: the
 * same traversal rules, but each child carries a `segment`. An object-valued
 * property yields its key (`'init'`); an array element yields `'key.index'`
 * where the index is the source-array position — so a `null` hole leaves later
 * siblings' indices unshifted. `null`, primitives, and non-node objects (a
 * `Literal.regex`) never satisfy the node check, so they contribute no segment.
 *
 * A path-map builder joins a parent path with each `segment` to form a full
 * Program-rooted node path (e.g. `'$.body.0.declarations.0'`).
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

/**
 * A direct child paired with the path segment that reaches it from its parent.
 *
 * Kept local rather than in `./types.ts`: this is vendored-machinery vocabulary,
 * not a level model, and promoting it would route every parallel Wave-0 sibling
 * increment through one shared types file. A path-map builder infers this shape
 * structurally from the return type — no import needed.
 */
type ChildWithPath = {
	readonly child: Node;
	readonly segment: string;
};

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

	return [...value.entries()]
		.filter((entry): entry is [number, Node] => isNode(entry[1]))
		.map(([index, child]) => ({ child, segment: `${key}.${index}` }));
}

/**
 * Whether a value looks like an acorn AST node: a non-null object with a string
 * `type`. Kept local (not shared with `getChildNodes`) so each vendored
 * traversal stays independently readable.
 */
function isNode(value: unknown): value is Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as Record<string, unknown>).type === 'string'
	);
}
