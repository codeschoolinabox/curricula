/**
 * @file Block pointcut — intercepts ALL blocks for scope tracking.
 *
 * Always matches because internal scope tracking needs every block, even when
 * scope events are disabled in config. The advice checks config for dispatch.
 *
 * The parent parameter is the raw AranLang parent NODE (IfStatement,
 * WhileStatement, Program, etc.) — NOT the Parent type from parent.d.ts.
 * We extract scope classification from the node's type and structure.
 */

import type { JejTag } from '../types.js';

type AranNode = {
	readonly type: string;
	readonly kind?: string;
	readonly tag?: JejTag;
	readonly then?: AranNode;
	readonly else?: AranNode;
	readonly try?: AranNode;
	readonly catch?: AranNode;
	readonly finally?: AranNode;
};

type BlockNode = {
	readonly tag: JejTag;
};

/**
 * Determines the segment kind from the AranLang parent node.
 * Maps from raw AST structure to our scope classification.
 */
function deriveSegmentKind(node: BlockNode, parent: AranNode): string {
	if (parent.type === 'IfStatement') {
		// parent.then and parent.else are the two branch blocks
		// compare by tag identity to determine which branch we are
		return parent.then?.tag === node.tag ? 'then' : 'else';
	}

	if (parent.type === 'WhileStatement') {
		return 'while';
	}

	if (parent.type === 'TryStatement') {
		if (parent.try?.tag === node.tag) return 'try';
		if (parent.catch?.tag === node.tag) return 'catch';
		return 'finally';
	}

	// BlockStatement, EffectStatement, or anything else
	return 'bare';
}

/**
 * Determines the scope kind from the AranLang parent node.
 */
function deriveScopeKind(parent: AranNode): string {
	if (parent.type === 'Program') {
		// parent.kind is 'module' | 'script' | 'eval'
		return parent.kind === 'module' ? 'module' : 'script';
	}

	if (parent.type === 'ClosureExpression') {
		return 'closure';
	}

	return 'block';
}

/**
 * Block pointcut. Always matches — scope tracking is always needed.
 *
 * @param node - SegmentBlock or RoutineBlock AranLang node
 * @param parent - The raw AranLang parent node (NOT the Parent type)
 * @param _root - Program root (unused)
 * @returns [parentType, scopeKind, segmentKind, tag]
 */
// perf: skip freeze — consumed by Aran's weaving machinery (ephemeral, serialized into code)
function blockPointcut(
	node: BlockNode,
	parent: AranNode,
	_root: unknown,
): [string, string, string, JejTag] {
	const scopeKind = deriveScopeKind(parent);
	const segmentKind = deriveSegmentKind(node, parent);

	return [parent.type, scopeKind, segmentKind, node.tag];
}

export default blockPointcut;
