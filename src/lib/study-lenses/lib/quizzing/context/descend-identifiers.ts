/**
 * @file The single AST descent — Phase 2 of the quizzing generation context (see
 * `../DOCS.md` § Execution phases). Walks a parsed JeJ AST **once** and emits one
 * `IdentifierAnchor` per genuine variable occurrence, tagged with the usage kind
 * read off its syntactic position. This is the structural place the inc-2 FLAG is
 * mitigated: a non-reference identifier (a non-computed `MemberExpression`
 * property name `o.x`, or a non-computed object-literal key) is never emitted, so
 * the node-anchored generators that feed `resolveBinding` only ever see real
 * reference / declaration occurrences.
 */

import type { Node } from 'acorn';

import type { IdentifierAnchor, UsageKind } from './types.js';

/**
 * Descend a parsed JeJ AST once, returning the source-ordered stream of
 * identifier anchors (declarations, references, and assignment targets), each
 * carrying its `[start, end)` range, name, and `usageKind`.
 *
 * @remarks
 * - **FLAG mitigation by construction.** The descent does not recurse into the
 *   non-reference identifier positions — a non-computed `MemberExpression`
 *   property (`o.x`) or a non-computed `Property` key (`{ x: 1 }`) — so no anchor
 *   is ever produced for them. A downstream binding-aware generator therefore
 *   cannot feed `resolveBinding` an occurrence that would mis-resolve.
 * - **One traversal.** Each node returns its own anchors concatenated with its
 *   children's; there is no second walk.
 * - **Source-ordered, pure, total.** Anchors appear in source order; the descent
 *   mutates nothing and never throws on a parsed AST.
 *
 * @param ast - The parsed AST root (typically a `Program` node).
 * @returns The identifier-anchor stream, in source order.
 */
export default function descendIdentifiers(
	ast: Node,
): readonly IdentifierAnchor[] {
	return collect(ast, false, false);
}

/**
 * Collect the identifier anchors under `node`, given whether `node` sits in an
 * assignment-target position and, if so, whether the assignment is compound.
 * Each arm returns its own anchors concatenated with its children's — one
 * downward pass, no re-walk. Mirrors `embody/lib/scope/build-scope.ts`'s position
 * logic, with one deliberate divergence: a `MemberExpression`'s object is always
 * read (build-scope threads the assignment-target flag into it, which would
 * mislabel `o` in `o.x = 1` as a write; property assignment is invalid JeJ, so
 * the corrected reading is defensive precision).
 */
function collect(
	node: Node,
	isAssignmentTarget: boolean,
	isCompoundAssignment: boolean,
): readonly IdentifierAnchor[] {
	if (node.type === 'VariableDeclaration') {
		return childNodes(node, 'declarations').flatMap((declarator) =>
			collectDeclarator(declarator),
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
		return [
			anchorOf(node, referenceUsage(isAssignmentTarget, isCompoundAssignment)),
		];
	}
	return astChildren(node).flatMap((child) => collect(child, false, false));
}

/**
 * A declarator contributes its `id` Identifier as a `declared` anchor and walks
 * its initializer as reads. A non-Identifier id (a destructuring pattern —
 * invalid JeJ) contributes no declaration anchor, mirroring `build-scope`.
 */
function collectDeclarator(declarator: Node): readonly IdentifierAnchor[] {
	const id = childNode(declarator, 'id');
	const init = childNode(declarator, 'init');
	return [
		...(id !== null && id.type === 'Identifier'
			? [anchorOf(id, 'declared')]
			: []),
		...(init === null ? [] : collect(init, false, false)),
	];
}

/** `x = …` (simple) or `x += …` (compound): the target writes, the RHS reads. */
function collectAssignment(node: Node): readonly IdentifierAnchor[] {
	const left = childNode(node, 'left');
	const right = childNode(node, 'right');
	const compound = nodeString(node, 'operator') !== '=';
	return [
		...(left === null ? [] : collect(left, true, compound)),
		...(right === null ? [] : collect(right, false, false)),
	];
}

/** `x++` / `++x`: the argument is both read and written. */
function collectUpdate(node: Node): readonly IdentifierAnchor[] {
	const argument = childNode(node, 'argument');
	if (argument === null) {
		return [];
	}
	return argument.type === 'Identifier'
		? [anchorOf(argument, 'read-and-assigned')]
		: collect(argument, false, false);
}

/** `o.x` / `o[k]`: the object always reads; the property reads only if computed. */
function collectMember(node: Node): readonly IdentifierAnchor[] {
	const object = childNode(node, 'object');
	const property = childNode(node, 'property');
	return [
		...(object === null ? [] : collect(object, false, false)),
		...(nodeFlag(node, 'computed') && property !== null
			? collect(property, false, false)
			: []),
	];
}

/** `{ x: … }` / `{ [k]: … }`: the value always reads; the key reads only if computed. */
function collectProperty(node: Node): readonly IdentifierAnchor[] {
	const key = childNode(node, 'key');
	const value = childNode(node, 'value');
	return [
		...(nodeFlag(node, 'computed') && key !== null
			? collect(key, false, false)
			: []),
		...(value === null ? [] : collect(value, false, false)),
	];
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
