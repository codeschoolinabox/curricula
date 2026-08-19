/**
 * @file The single AST descent — the anchor-stream half of the quizzing generation
 * context (see `../DOCS.md` § Execution phases). Walks a parsed JeJ AST **once** and emits two
 * sibling anchor streams: one `IdentifierAnchor` per genuine variable occurrence
 * (tagged with the usage kind read off its syntactic position) and one
 * `PropertyAccessAnchor` per non-computed member-property name (`o.x`'s `x`). This
 * is the structural place the inc-2 FLAG is mitigated: a non-computed property name
 * is never emitted into the `identifierAnchors` stream (it feeds the separate
 * `propertyAccessAnchors` stream instead), and a non-computed object-literal key is
 * emitted into neither, so the node-anchored generators that feed `resolveBinding`
 * only ever see real reference / declaration occurrences.
 */

import type { Node } from 'acorn';

import type {
	IdentifierAnchor,
	PropertyAccessAnchor,
	UsageKind,
} from './types.js';

/**
 * Descend a parsed JeJ AST once, returning the two source-ordered anchor streams:
 * `identifierAnchors` (declarations, references, and assignment targets, each
 * carrying its `[start, end)` range, name, and `usageKind`) and
 * `propertyAccessAnchors` (each non-computed member-property name `o.x`'s `x`,
 * carrying its range and name).
 *
 * @remarks
 * - **FLAG mitigation by construction.** A non-computed `MemberExpression`
 *   property (`o.x`) never enters `identifierAnchors` — it feeds the sibling
 *   `propertyAccessAnchors` stream — and a non-computed `Property` key (`{ x: 1 }`)
 *   enters neither. So `identifierAnchors` stays byte-identical to the pre-7b
 *   stream, and a downstream binding-aware generator cannot feed `resolveBinding`
 *   an occurrence that would mis-resolve. The two streams are disjoint.
 * - **One traversal.** Each node returns its own anchors concatenated field-wise
 *   with its children's, across both streams; there is no second walk.
 * - **Source-ordered, pure, total.** Anchors appear in source order; the descent
 *   mutates nothing and never throws on a parsed AST.
 *
 * @param ast - The parsed AST root (typically a `Program` node).
 * @returns The two anchor streams, in source order.
 */
export default function descendIdentifiers(ast: Node): DescentStreams {
	return collect(ast, false, false);
}

/**
 * The two anchor streams a descent yields, threaded field-wise through the one
 * downward pass. File-local: an implementation detail of the descent, projected
 * into `GenerationContext`'s `identifierAnchors` / `propertyAccessAnchors` by
 * `build-context`. `identifierAnchors` is byte-identical to the pre-7b single
 * stream; `propertyAccessAnchors` is the new sibling.
 */
type DescentStreams = Readonly<{
	identifierAnchors: readonly IdentifierAnchor[];
	propertyAccessAnchors: readonly PropertyAccessAnchor[];
}>;

/**
 * The identity element: a descent that collected nothing on either stream.
 * Frozen (arrays included) so an arm returning it directly can never leak a
 * shared mutable array into the frozen `GenerationContext`.
 */
const emptyDescent: DescentStreams = Object.freeze({
	identifierAnchors: Object.freeze([]),
	propertyAccessAnchors: Object.freeze([]),
});

/**
 * Combine two descents field-wise — "an arm's own anchors, then its children's",
 * in the `[...a, ...b]` order the pre-7b single stream used.
 */
function concat(a: DescentStreams, b: DescentStreams): DescentStreams {
	return {
		identifierAnchors: [...a.identifierAnchors, ...b.identifierAnchors],
		propertyAccessAnchors: [
			...a.propertyAccessAnchors,
			...b.propertyAccessAnchors,
		],
	};
}

/**
 * Flatten a list of descents field-wise — each stream is the source-ordered
 * concatenation of that field across the descents. Two O(N) `flatMap`s (not a
 * fold), immutable by construction.
 */
function concatAll(descents: readonly DescentStreams[]): DescentStreams {
	return {
		identifierAnchors: descents.flatMap((descent) => descent.identifierAnchors),
		propertyAccessAnchors: descents.flatMap(
			(descent) => descent.propertyAccessAnchors,
		),
	};
}

/** A descent carrying one identifier anchor and no property-access anchor. */
function idOnly(anchor: IdentifierAnchor): DescentStreams {
	return { identifierAnchors: [anchor], propertyAccessAnchors: [] };
}

/** A descent carrying one property-access anchor and no identifier anchor. */
function propertyOnly(anchor: PropertyAccessAnchor): DescentStreams {
	return { identifierAnchors: [], propertyAccessAnchors: [anchor] };
}

/**
 * Collect the anchor streams under `node`, given whether `node` sits in an
 * assignment-target position and, if so, whether the assignment is compound.
 * Each arm returns its own anchors concatenated field-wise with its children's —
 * one downward pass, no re-walk. Mirrors `embody/lib/scope/build-scope.ts`'s
 * position logic, with one deliberate divergence: a `MemberExpression`'s object is
 * always read (build-scope threads the assignment-target flag into it, which would
 * mislabel `o` in `o.x = 1` as a write; property assignment is invalid JeJ, so the
 * corrected reading is defensive precision).
 */
function collect(
	node: Node,
	isAssignmentTarget: boolean,
	isCompoundAssignment: boolean,
): DescentStreams {
	if (node.type === 'VariableDeclaration') {
		return concatAll(
			childNodes(node, 'declarations').map((declarator) =>
				collectDeclarator(declarator),
			),
		);
	}
	if (node.type === 'AssignmentExpression') {
		return collectAssignment(node);
	}
	if (node.type === 'UpdateExpression') {
		return collectUpdate(node);
	}
	if (node.type === 'MemberExpression') {
		return collectMember(node);
	}
	if (node.type === 'Property') {
		return collectProperty(node);
	}
	if (node.type === 'Identifier') {
		return idOnly(
			anchorOf(node, referenceUsage(isAssignmentTarget, isCompoundAssignment)),
		);
	}
	return concatAll(
		astChildren(node).map((child) => collect(child, false, false)),
	);
}

/**
 * A declarator contributes its `id` Identifier as a `declared` anchor and walks
 * its initializer as reads. A non-Identifier id (a destructuring pattern —
 * invalid JeJ) contributes no declaration anchor, mirroring `build-scope`.
 */
function collectDeclarator(declarator: Node): DescentStreams {
	const id = childNode(declarator, 'id');
	const init = childNode(declarator, 'init');
	return concat(
		id !== null && id.type === 'Identifier'
			? idOnly(anchorOf(id, 'declared'))
			: emptyDescent,
		init === null ? emptyDescent : collect(init, false, false),
	);
}

/** `x = …` (simple) or `x += …` (compound): the target writes, the RHS reads. */
function collectAssignment(node: Node): DescentStreams {
	const left = childNode(node, 'left');
	const right = childNode(node, 'right');
	const compound = nodeString(node, 'operator') !== '=';
	return concat(
		left === null ? emptyDescent : collect(left, true, compound),
		right === null ? emptyDescent : collect(right, false, false),
	);
}

/** `x++` / `++x`: the argument is both read and written. */
function collectUpdate(node: Node): DescentStreams {
	const argument = childNode(node, 'argument');
	if (argument === null) {
		return emptyDescent;
	}
	return argument.type === 'Identifier'
		? idOnly(anchorOf(argument, 'read-and-assigned'))
		: collect(argument, false, false);
}

/**
 * `o.x` / `o[k]`: the object always reads; the property side is delegated to
 * `propertyDescent` — a computed property (`o[k]`'s `k`) is a scope-chain
 * reference, a non-computed property (`o.x`'s `x`) is a prototype-chain lookup.
 */
function collectMember(node: Node): DescentStreams {
	const object = childNode(node, 'object');
	const property = childNode(node, 'property');
	return concat(
		object === null ? emptyDescent : collect(object, false, false),
		propertyDescent(property, nodeFlag(node, 'computed')),
	);
}

/**
 * The property side of a member expression. A computed property (`o[k]`'s `k`) is
 * a real scope-chain reference → recurse into `identifierAnchors` (unchanged from
 * pre-7b). A non-computed property (`o.x`'s `x`) is a prototype-chain lookup that
 * feeds `propertyAccessAnchors`. The non-Identifier else-branch is unreachable on
 * valid parsed JS (`o.<expr>` requires bracket access) — drop it rather than
 * recurse, so a malformed node can never surface a phantom scope-chain anchor.
 */
function propertyDescent(
	property: Node | null,
	computed: boolean,
): DescentStreams {
	if (property === null) {
		return emptyDescent;
	}
	if (computed) {
		return collect(property, false, false);
	}
	return property.type === 'Identifier'
		? propertyOnly(propertyAnchorOf(property))
		: emptyDescent;
}

/** `{ x: … }` / `{ [k]: … }`: the value always reads; the key reads only if computed (a non-computed key enters neither stream). */
function collectProperty(node: Node): DescentStreams {
	const key = childNode(node, 'key');
	const value = childNode(node, 'value');
	return concat(
		nodeFlag(node, 'computed') && key !== null
			? collect(key, false, false)
			: emptyDescent,
		value === null ? emptyDescent : collect(value, false, false),
	);
}

/** The usage kind of a referenced identifier, from its assignment context. */
function referenceUsage(
	isAssignmentTarget: boolean,
	isCompoundAssignment: boolean,
): UsageKind {
	if (!isAssignmentTarget) {
		return 'read';
	}
	return isCompoundAssignment ? 'read-and-assigned' : 'assigned';
}

/** Build an anchor from an Identifier node and its usage kind. */
function anchorOf(node: Node, usageKind: UsageKind): IdentifierAnchor {
	return {
		range: [node.start, node.end],
		name: nodeString(node, 'name'),
		usageKind,
	};
}

/**
 * Build a property-access anchor from a non-computed member-property Identifier
 * node. Its `range` is the property identifier's own span (matching `anchorOf`),
 * not the enclosing member expression's — so V4's `anchorRange` highlights `.x`,
 * not `o.x`. No `usageKind`: a property name is a prototype-chain lookup.
 */
function propertyAnchorOf(propertyNode: Node): PropertyAccessAnchor {
	return {
		range: [propertyNode.start, propertyNode.end],
		name: nodeString(propertyNode, 'name'),
	};
}

function childNode(node: Node, key: string): Node | null {
	const value = (node as unknown as Record<string, unknown>)[key];
	return isAstNode(value) ? value : null;
}

function childNodes(node: Node, key: string): readonly Node[] {
	const value = (node as unknown as Record<string, unknown>)[key];
	return Array.isArray(value) ? value.filter((item) => isAstNode(item)) : [];
}

function astChildren(node: Node): readonly Node[] {
	const record = node as unknown as Record<string, unknown>;
	return Object.entries(record).flatMap(function childrenOf([key, value]) {
		if (key === 'parent') {
			return [];
		}
		if (Array.isArray(value)) {
			return value.filter((item) => isAstNode(item));
		}
		return isAstNode(value) ? [value] : [];
	});
}

function isAstNode(value: unknown): value is Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as { readonly type?: unknown }).type === 'string'
	);
}

function nodeFlag(node: Node, key: string): boolean {
	return (node as unknown as Record<string, unknown>)[key] === true;
}

function nodeString(node: Node, key: string): string {
	return (node as unknown as Record<string, unknown>)[key] as string;
}
