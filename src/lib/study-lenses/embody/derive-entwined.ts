import type { Comment, Node, Program, Token } from 'acorn';

import isNode from './is-node.js';
import type {
	Entwined,
	FactStage,
	NodePath,
	ParenSpan,
	ParenSpansByNode,
	Tokens,
} from './types.js';

/**
 * Derive the entwined fact stage from the source, the tokens stage, and the
 * ast stage: the source⇄tree binding, tying each node to its family, its
 * place, and its tokens, indexed for O(1) resolution from a carried path or
 * offset.
 *
 * @remarks
 * A failed upstream stage short-circuits: the entwined stage carries the
 * first upstream failure's cause unchanged — spelling precedes grammar, and
 * the origin stays named. A tree that does not span its whole source is an
 * embody defect, not learner data: loud to the developer, a tagged
 * `entwined` cause to the learner — never a throw.
 *
 * Every entwined node holds the very node the parse built, by reference —
 * never a copy — and `byPath` holds the same entwined objects the walk wired:
 * one shared graph, two entry points. Paths are `$`-rooted and dot-delimited
 * with bare array indices (`$.body.0.declarations.0`), preserving source
 * positions across array holes — the canonical node identity across the
 * package. `byOffset` maps every source offset (a UTF-16 code unit) to the
 * deepest node whose span covers it — never a hole: the Program spans the
 * whole source, so every offset resolves at least to the root. Each node ties
 * the tokens within its span, in stream order, through one shared wrapper per
 * token — chained stream-wide (`previous`/`next`, null at both ends) and
 * carrying each token's innermost node. Each node likewise ties the comments
 * within its span, in source order, through one shared wrapper per comment;
 * a comment carries its innermost node and its nearest token neighbors —
 * tokens, never comments, null past either end — and the token chain itself
 * never threads through a comment.
 *
 * The parse's record of where grouping parentheses sat arrives keyed by node
 * object and is published keyed by path — this walk is where a node's path is
 * born, so it is the only place the translation can happen. A node no pair
 * wrapped gets no entry, so the published record stays sparse.
 */
export default function deriveEntwined(
	source: string,
	tokens: FactStage<Tokens>,
	ast: FactStage<Program>,
	parenSpansByNode: ParenSpansByNode,
): FactStage<Entwined> {
	// spelling precedes grammar — the first upstream failure's cause carries,
	// its origin still named; nothing derives past it
	if (!tokens.ok) {
		return { ok: false, cause: tokens.cause };
	}
	if (!ast.ok) {
		return { ok: false, cause: ast.cause };
	}

	// a valid tree spans its whole source — byOffset's no-hole guarantee rests
	// on it. A violation is an embody defect: loud to the developer, graceful
	// data to the learner.
	if (ast.value.start !== 0 || ast.value.end !== source.length) {
		console.error(
			`deriveEntwined: the tree spans [${ast.value.start}, ${ast.value.end}) over a source ${source.length} long — broken embody invariant`,
		);
		return {
			ok: false,
			cause: {
				stage: 'entwined',
				message: 'the syntax tree does not span its source',
			},
		};
	}

	const byPath: Record<NodePath, BuildingNode> = {};
	const root = entwineNode(ast.value, '$', null, byPath);
	const byOffset = indexByOffset(root);
	const parenSpans = indexParenSpans(byPath, parenSpansByNode);
	const tokenTies = tieTokens(tokens.value.tokens, byOffset, root);
	const commentTies = tieComments(tokens.value.comments, byOffset, root);
	wireCommentNeighbors(commentTies, tokenTies);

	return { ok: true, value: { root, byPath, byOffset, parenSpans } };
}

// the parent↔children graph is cyclic, so nodes build by local mutation and
// only their readonly view leaves this file (precedent: guard-loops.ts) —
// no half-wired wrapper ever escapes mid-build
type BuildingNode = {
	node: Node;
	path: NodePath;
	parent: BuildingNode | null;
	children: BuildingNode[];
	tokens: BuildingToken[];
	comments: BuildingComment[];
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
 * The parse's grouping-parenthesis record, re-keyed from node objects to the
 * paths the walk just assigned them — the published form of the same data.
 * Only nodes a pair actually wrapped get a key, so the record stays sparse and
 * no empty list is ever published; the span lists themselves are handed on by
 * reference, never rebuilt.
 */
function indexParenSpans(
	byPath: Record<NodePath, BuildingNode>,
	parenSpansByNode: ParenSpansByNode,
): Record<NodePath, ReadonlyArray<ParenSpan>> {
	const parenSpans: Record<NodePath, ReadonlyArray<ParenSpan>> = {};
	for (const [path, entwined] of Object.entries(byPath)) {
		const spans = parenSpansByNode.get(entwined.node);
		if (spans !== undefined) {
			parenSpans[path] = spans;
		}
	}

	return parenSpans;
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

// the stream-wide chain wires wrapper to wrapper as they build — the same
// marked local mutation as the node graph; only the readonly view leaves
type BuildingToken = {
	token: Token;
	innermostNode: BuildingNode | null;
	previous: BuildingToken | null;
	next: BuildingToken | null;
};

/**
 * Tie every token to each node whose span contains it — one wrapper per
 * token, shared across its containing nodes: one graph, never copies.
 * Iterating the stream in order chains the wrappers stream-wide
 * (`previous`/`next`, null at both ends) and hands each its innermost node —
 * the deepest node at its start offset; the containment pass then fills
 * every per-node list, in stream order, from the span alone — a node off the
 * innermost's ancestor chain (a reused node's second wrapper, a shorthand
 * key) ties all the same.
 */
function tieTokens(
	tokens: ReadonlyArray<Token>,
	byOffset: ReadonlyArray<BuildingNode>,
	root: BuildingNode,
): readonly BuildingToken[] {
	const ties: BuildingToken[] = [];
	let previous: BuildingToken | null = null;
	for (const token of tokens) {
		const tied: BuildingToken = {
			token,
			innermostNode: byOffset[token.start],
			previous,
			next: null,
		};
		if (previous !== null) {
			previous.next = tied;
		}
		previous = tied;
		ties.push(tied);
	}

	fillContainmentRun(root, ties, tokenTieStart, tokenListOf);
	return ties;
}

// accessors for the containment pass, hoisted by name: which offset a tie
// starts at, and which per-node list it fills
function tokenTieStart(tied: BuildingToken): number {
	return tied.token.start;
}

function tokenListOf(node: BuildingNode): BuildingToken[] {
	return node.tokens;
}

/**
 * Fill a node's list with the contiguous run of ties whose start lies in its
 * half-open span `[start, end)`, then recurse into its children. Both tie
 * streams arrive sorted by start, so the run begins at a binary-searched
 * index and ends where a start passes the node's end — stream order per node
 * by construction, and a zero-width span takes nothing. Containment is the
 * whole rule: no tie leans on the innermost's ancestor chain, so wrappers
 * that chain cannot reach — a reused node's second wrapper, a shorthand
 * property's key beside or inside its value — fill like any other.
 */
function fillContainmentRun<Tie>(
	node: BuildingNode,
	ties: readonly Tie[],
	startOf: (tie: Tie) => number,
	listOf: (node: BuildingNode) => Tie[],
): void {
	const { start, end } = node.node;
	const list = listOf(node);
	for (
		let index = firstAtOrAfter(ties, startOf, start);
		index < ties.length && startOf(ties[index]) < end;
		index++
	) {
		list.push(ties[index]);
	}

	for (const child of node.children) {
		fillContainmentRun(child, ties, startOf, listOf);
	}
}

// binary search: the first index whose tie starts at or after the offset
function firstAtOrAfter<Tie>(
	ties: readonly Tie[],
	startOf: (tie: Tie) => number,
	offset: number,
): number {
	let low = 0;
	let high = ties.length;
	while (low < high) {
		const middle = (low + high) >>> 1;
		if (startOf(ties[middle]) < offset) {
			low = middle + 1;
		} else {
			high = middle;
		}
	}
	return low;
}

// the comment wrappers' token-neighbor ties wire after the per-node walk —
// the same marked local mutation as the token chain; only the readonly view
// leaves this file
type BuildingComment = {
	comment: Comment;
	innermostNode: BuildingNode | null;
	previous: BuildingToken | null;
	next: BuildingToken | null;
};

/**
 * Tie every comment to each node whose span contains it — one wrapper per
 * comment, shared across its containing nodes: one graph, never copies.
 * The same containment pass as the token ties fills every per-node list in
 * source order; each wrapper carries its innermost node — the deepest node
 * at its start. (Comments are trivia between token boundaries, and node
 * boundaries ARE token boundaries, so start-containment holds the whole
 * comment.)
 */
function tieComments(
	comments: ReadonlyArray<Comment>,
	byOffset: ReadonlyArray<BuildingNode>,
	root: BuildingNode,
): readonly BuildingComment[] {
	const ties: BuildingComment[] = [];
	for (const comment of comments) {
		ties.push({
			comment,
			innermostNode: byOffset[comment.start],
			previous: null,
			next: null,
		});
	}

	fillContainmentRun(root, ties, commentTieStart, commentListOf);
	return ties;
}

function commentTieStart(tied: BuildingComment): number {
	return tied.comment.start;
}

function commentListOf(node: BuildingNode): BuildingComment[] {
	return node.comments;
}

/**
 * Hand every comment its nearest token neighbors — tokens, never comments:
 * `previous` is the last token ending at or before the comment opens, `next`
 * the first token past that — the same token that starts at or after the
 * comment closes, because tokens and comments never overlap. The token chain
 * itself is never touched. Both inputs arrive in source order, so one cursor
 * serves every comment; comments sharing a gap share neighbors.
 */
function wireCommentNeighbors(
	commentTies: readonly BuildingComment[],
	tokenTies: readonly BuildingToken[],
): void {
	let cursor = 0;
	for (const tied of commentTies) {
		while (
			cursor < tokenTies.length &&
			tokenTies[cursor].token.end <= tied.comment.start
		) {
			cursor++;
		}
		tied.previous = cursor > 0 ? tokenTies[cursor - 1] : null;
		tied.next = cursor < tokenTies.length ? tokenTies[cursor] : null;
	}
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
 *
 * Every key is offered to the segment rule, including the ones that are never
 * children: the node check is what excludes them, so naming them a second time
 * would only be a list to keep in step.
 */
function directChildren(node: Node): readonly ChildWithSegment[] {
	const properties = node as unknown as Record<string, unknown>;

	return Object.keys(properties).flatMap((key) =>
		toSegments(key, properties[key]),
	);
}

function toSegments(key: string, value: unknown): readonly ChildWithSegment[] {
	if (!Array.isArray(value)) {
		return isNode(value) ? [{ child: value, segment: key }] : [];
	}

	return Array.from(value.entries())
		.filter((entry): entry is [number, Node] => isNode(entry[1]))
		.map(([index, child]) => ({ child, segment: `${key}.${index}` }));
}
