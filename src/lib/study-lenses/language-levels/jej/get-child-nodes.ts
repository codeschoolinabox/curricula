import type { Node } from 'acorn';

/**
 * Every direct child AST node of a parent node.
 *
 * @remarks
 * A vendored tree-walk that removes the need for an `acorn-walk` dependency: it
 * reads the node's own enumerable properties and collects the values that are
 * themselves AST nodes (objects with a string `type`) or arrays of them.
 *
 * The metadata properties `type`, `start`, `end`, and `loc` sit on every acorn
 * node but are not children, so they are skipped. `null` (an
 * `IfStatement.alternate` with no `else`), primitives (a `Literal.value`), and
 * non-node objects (a `Literal.regex`) never satisfy the node check, so they
 * fall away too.
 *
 * The returned array is not frozen: the level's walks read it immediately and
 * discard it, so it is transient.
 *
 * @param node - Any acorn AST node.
 * @returns Its direct children, in property-enumeration order — array-valued
 *   properties like `BlockStatement.body` yield their children in source order.
 */
export default function getChildNodes(node: Node): readonly Node[] {
	const properties = node as unknown as Record<string, unknown>;

	return Object.keys(properties)
		.filter((key) => !isMetadataKey(key))
		.flatMap((key) => nodesIn(properties[key]));
}

/** The keys present on every acorn node that are never children. */
function isMetadataKey(key: string): boolean {
	return key === 'type' || key === 'start' || key === 'end' || key === 'loc';
}

/**
 * The AST node(s) a single property value contributes: the node items of an
 * array-valued property, the value itself if it is a node, or nothing.
 */
function nodesIn(value: unknown): readonly Node[] {
	if (Array.isArray(value)) {
		return value.filter((item): item is Node => isNode(item));
	}
	return isNode(value) ? [value] : [];
}

/**
 * Whether a value looks like an acorn AST node: a non-null object with a string
 * `type`. The minimal shape every ESTree node shares — enough because it is only
 * ever asked of values read from known acorn node properties.
 */
function isNode(value: unknown): value is Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as Record<string, unknown>).type === 'string'
	);
}
