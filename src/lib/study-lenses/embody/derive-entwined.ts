import type { Node, Program, Token } from 'acorn';

import type {
	Entwined,
	EntwinedComment,
	EntwinedToken,
	FactStage,
	NodePath,
	Tokens,
} from './types.js';

/**
 * Derive the entwined fact stage from the syntax tree and the token stream:
 * the source⇄tree binding, tying each node to its family, its place, and its
 * tokens, indexed for O(1) resolution from a carried path or offset.
 *
 * @remarks
 * Every entwined node holds the very node the parse built, by reference —
 * never a copy — and `byPath` holds the same entwined objects the walk wired:
 * one shared graph, two entry points. Paths are `$`-rooted and dot-delimited
 * with bare array indices (`$.body.0.declarations.0`), preserving source
 * positions across array holes — the canonical node identity across the
 * package. `byOffset` maps every source offset (a UTF-16 code unit) to the
 * deepest node whose span covers it — never a hole: the Program spans the
 * whole source, so every offset resolves at least to the root. Each node ties
 * the tokens within its span, in stream order, through one shared wrapper per
 * token. The wrappers' chain ties and the per-node comment ties are empty.
 */
export default function deriveEntwined(
	ast: Program,
	tokens: Tokens,
): FactStage<Entwined> {
	const byPath: Record<NodePath, BuildingNode> = {};
	const root = entwineNode(ast, '$', null, byPath);
	const byOffset = indexByOffset(root);
	tieTokens(tokens.tokens, byOffset);

	return { ok: true, value: { root, byPath, byOffset } };
}

// the parent↔children graph is cyclic, so nodes build by local mutation and
// only their readonly view leaves this file (precedent: guard-loops.ts) —
// no half-wired wrapper ever escapes mid-build
type BuildingNode = {
	node: Node;
	path: NodePath;
	parent: BuildingNode | null;
	children: BuildingNode[];
	tokens: EntwinedToken[];
	comments: EntwinedComment[];
};

function entwineNode(
	node: Node,
	path: NodePath,
	parent: BuildingNode | null,
	byPath: Record<NodePath, BuildingNode>,
): BuildingNode {
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

/**
 * Every source offset mapped to the deepest node whose span covers it.
 * No hole is possible: acorn extends the Program span over leading and
 * trailing trivia, so the root's own fill reaches every slot. The fill leans
 * only on `root.node.end` — deliberately never on `root.node.start === 0`.
 */
function indexByOffset(root: BuildingNode): ReadonlyArray<BuildingNode> {
	const byOffset = Array.from({ length: root.node.end }, () => root);
	for (const child of root.children) {
		fillSpans(child, byOffset);
	}
	return byOffset;
}

// parents write before children (depth-first), so the deepest covering node
// is the last writer. Spans are half-open — a node's `end` offset belongs to
// its parent — and a zero-width span writes nothing. Identical-span siblings
// tie-break by enumeration order (the later-enumerated wins; pinned by test).
function fillSpans(entwined: BuildingNode, byOffset: BuildingNode[]): void {
	for (let offset = entwined.node.start; offset < entwined.node.end; offset++) {
		byOffset[offset] = entwined;
	}
	for (const child of entwined.children) {
		fillSpans(child, byOffset);
	}
}

/**
 * Tie every token to each node whose span contains it — one wrapper per
 * token, shared across its containing nodes: one graph, never copies.
 * Iterating the stream in order keeps every per-node list in stream order.
 */
function tieTokens(
	tokens: ReadonlyArray<Token>,
	byOffset: ReadonlyArray<BuildingNode>,
): void {
	for (const token of tokens) {
		const tied: EntwinedToken = {
			token,
			innermostNode: null,
			previous: null,
			next: null,
		};
		// nodes align to token boundaries — a node covering the token's start
		// contains the whole token, so the ancestor chain from the deepest node
		// there is exactly the set of containing nodes
		let node: BuildingNode | null = byOffset[token.start];
		while (node !== null) {
			node.tokens.push(tied);
			node = node.parent;
		}
	}
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
