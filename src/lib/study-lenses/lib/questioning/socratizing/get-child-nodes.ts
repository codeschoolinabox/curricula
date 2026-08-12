// PROVENANCE: micro-vendor of the point-analyzer child-node walk from
// `src/lib/embody/lib/parse-old/get-child-nodes.ts` (pure-acorn, zero deps).
// Vendored so `lib/questioning/socratizing/` owns its walk without a runtime
// import into
// the standalone `embody` tree. Restructured from the source's imperative
// push-loop into this leaf's functional idiom (the embody source is
// eslint-ignored; this dir is linted) — BEHAVIOURALLY identical, with
// `tests/get-child-nodes.test.ts` as the reconciliation anchor (Zero/One/Many
// plus the regex, sparse-array, generic-key, and metadata-skip boundaries).
// A DIFFERENT 59-LOC walker lives at `language-levels/jej/get-child-nodes.ts`
// — do not conflate.

import type { Node } from 'acorn';

/**
 * Extracts all direct child AST nodes from a given parent node.
 *
 * @remarks Replaces the need for an `acorn-walk` dependency. Walks the node's
 * own enumerable properties and collects values that look like AST nodes
 * (objects with a string `type` property) or the node-shaped items of
 * array-valued properties.
 *
 * Skips the metadata properties `type`, `start`, `end`, and `loc` (present on
 * every acorn node but not children). Also skips `null` (e.g.
 * `IfStatement.alternate` when there's no else — including holes inside sparse
 * arrays), primitives (e.g. `Literal.value`), and non-node objects (e.g.
 * `Literal.regex`).
 *
 * The returned array is transient — callers (the point-analyzer walk and
 * `collect-nodes`) iterate it immediately and discard it.
 *
 * @param node - Any acorn AST node.
 * @returns A flat array of all direct child nodes, in property enumeration
 *   order. For array-valued properties like `BlockStatement.body`, children
 *   appear in source order.
 */
export default function getChildNodes(node: Node): readonly Node[] {
	const record = node as unknown as Record<string, unknown>;
	return Object.keys(record)
		.filter(
			(key) =>
				key !== 'type' && key !== 'start' && key !== 'end' && key !== 'loc',
		)
		.flatMap((key) => asArray(record[key]))
		.filter((value): value is Node => isNode(value));
}

/** Wrap a single value, or pass an array through, so children flatten uniformly. */
function asArray(value: unknown): readonly unknown[] {
	return Array.isArray(value) ? value : [value];
}

/**
 * Type guard: checks if a value looks like an acorn AST node.
 *
 * @remarks Checks for a non-null object with a string `type` property — the
 * minimal shape shared by all ESTree nodes. It will match acorn nodes but also
 * any object with `{ type: string }`; acceptable because we only call it on
 * values drawn from acorn node properties.
 */
function isNode(value: unknown): value is Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as Record<string, unknown>).type === 'string'
	);
}
