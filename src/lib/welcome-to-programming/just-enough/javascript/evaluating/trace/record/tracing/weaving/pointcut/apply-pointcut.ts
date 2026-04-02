/**
 * @file Apply pointcut — intercepts ALL ApplyExpression nodes.
 *
 * Classifies calls at weave time by inspecting the callee:
 * - IntrinsicExpression callee → point[0] is the intrinsic name
 * - Template literal (tag.templateStrings exists) → point[0] is 'template'
 * - Real function call → point[0] is 'call'
 *
 * The advice dispatches on point[0], same pattern as expression-after.
 */

import type { JejTag } from '../types.js';

type CalleeNode = {
	readonly type: string;
	readonly intrinsic?: string;
};

/**
 * Classifies an ApplyExpression at weave time.
 *
 * @param node - ApplyExpression AranLang node
 * @param _parent - Parent node (unused)
 * @param _root - Program root (unused)
 * @returns [discriminant, tag] — discriminant is intrinsic name, 'template', or 'call'
 */
// perf: skip freeze — consumed by Aran's weaving machinery
function applyPointcut(
	node: { readonly tag: JejTag; readonly callee?: CalleeNode },
	_parent: unknown,
	_root: unknown,
): [string, JejTag] {
	if (node.callee?.type === 'IntrinsicExpression' && node.callee.intrinsic) {
		return [node.callee.intrinsic, node.tag];
	}

	if (node.tag.templateStrings) {
		return ['template', node.tag];
	}

	return ['call', node.tag];
}

export default applyPointcut;
