import type { Node } from 'acorn';

/**
 * Extracts all direct child AST nodes from a given parent node.
 *
 * @remarks Replaces the need for an `acorn-walk` dependency. Walks
 * the node's own enumerable properties and collects values that look
 * like AST nodes (objects with a string `type` property) or arrays
 * containing them.
 *
 * Skips the metadata properties `type`, `start`, `end`, and `loc`
 * which are present on every acorn node but are not children. Also
 * skips `null` (e.g. `IfStatement.alternate` when there's no else),
 * primitives (e.g. `Literal.value`), and non-node objects (e.g.
 * `Literal.regex`).
 *
 * The returned array is not frozen — the caller (typically `walk` in
 * {@link collectViolations}) iterates it immediately and discards it.
 *
 * @param node - Any acorn AST node.
 * @returns A flat array of all direct child nodes, in property
 *   enumeration order. For array-valued properties like
 *   `BlockStatement.body`, children appear in source order.
 */
function getChildNodes(node: Node): readonly Node[] {
	const children: Node[] = [];

	for (const key of Object.keys(node)) {
		// skip metadata properties that aren't child nodes
		if (key === 'type' || key === 'start' || key === 'end' || key === 'loc') {
			continue;
		}

		const value = (node as unknown as Record<string, unknown>)[key];

		if (Array.isArray(value)) {
			for (const item of value) {
				if (isNode(item)) {
					children.push(item);
				}
			}
		} else if (isNode(value)) {
			children.push(value);
		}
	}

	return children;
}

/**
 * Type guard: checks if a value looks like an acorn AST node.
 *
 * @remarks Checks for a non-null object with a string `type`
 * property. This is the minimal shape shared by all ESTree nodes.
 * It will match acorn nodes but also any object with `{ type:
 * string }` — acceptable because we only call this on values
 * from known acorn node properties.
 */
function isNode(value: unknown): value is Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as Record<string, unknown>).type === 'string'
	);
}

export default getChildNodes;
