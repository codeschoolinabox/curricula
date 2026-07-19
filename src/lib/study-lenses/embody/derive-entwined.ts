import type { Node, Program } from 'acorn';

import type { Entwined, EntwinedNode, FactStage, NodePath } from './types.js';

/**
 * Derive the entwined fact stage from the syntax tree: the source⇄tree
 * binding, tying each node to its family and indexing the graph for O(1)
 * resolution from a carried path.
 *
 * @remarks
 * Every entwined node holds the very node the parse built, by reference —
 * never a copy — and `byPath` holds the same entwined objects the walk wired:
 * one shared graph, two entry points. Paths are `$`-rooted and dot-delimited
 * with bare array indices (`$.body.0.declarations.0`), preserving source
 * positions across array holes — the canonical node identity across the
 * package. The graph ties nodes only: the offset index and the per-node
 * token and comment ties are empty.
 */
export default function deriveEntwined(ast: Program): FactStage<Entwined> {
	const byPath: Record<NodePath, EntwinedNode> = {};
	const root = entwineNode(ast, '$', null, byPath);

	return { ok: true, value: { root, byPath, byOffset: [] } };
}

// the parent↔children graph is cyclic, so nodes build by local mutation and
// only their readonly view leaves this file (precedent: guard-loops.ts) —
// no half-wired wrapper ever escapes mid-build
type BuildingNode = Omit<EntwinedNode, 'children'> & {
	children: EntwinedNode[];
};

function entwineNode(
	node: Node,
	path: NodePath,
	parent: EntwinedNode | null,
	byPath: Record<NodePath, EntwinedNode>,
): EntwinedNode {
	const entwined: BuildingNode = {
		node,
		path,
		parent,
		children: [],
		tokens: [],
		comments: [],
	};
	byPath[path] = entwined;

	for (const { child, segment } of directChildren(node)) {
		entwined.children.push(
			entwineNode(child, `${path}.${segment}`, entwined, byPath),
		);
	}

	return entwined;
}

/** The keys present on every acorn node that are never children. */
function isMetadataKey(key: string): boolean {
	// `range` needs no entry: its two numbers fail the node check below, so it
	// contributes no segments either way — the check is the guarantee
	return key === 'type' || key === 'start' || key === 'end' || key === 'loc';
}

type ChildWithSegment = {
	readonly child: Node;
	readonly segment: string;
};

/**
 * A node's direct children, each tagged with its path segment: a bare `key`
 * for an object-valued property, `key.index` per node element of an
 * array-valued one — the index is the source position, kept across array
 * holes so later siblings' paths stay stable. The returned array is
 * transient: read immediately and discarded, never frozen.
 */
function directChildren(node: Node): readonly ChildWithSegment[] {
	const properties = node as unknown as Record<string, unknown>;

	return Object.keys(properties)
		.filter((key) => !isMetadataKey(key))
		.flatMap((key) => toSegments(key, properties[key]));
}

function toSegments(key: string, value: unknown): readonly ChildWithSegment[] {
	if (!Array.isArray(value)) {
		return isNode(value) ? [{ child: value, segment: key }] : [];
	}

	return [...value.entries()]
		.filter((entry): entry is [number, Node] => isNode(entry[1]))
		.map(([index, child]) => ({ child, segment: `${key}.${index}` }));
}

/**
 * Whether a value looks like an acorn node: a non-null object with a string
 * `type`. The minimal shape every ESTree node shares.
 */
function isNode(value: unknown): value is Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as Record<string, unknown>).type === 'string'
	);
}
