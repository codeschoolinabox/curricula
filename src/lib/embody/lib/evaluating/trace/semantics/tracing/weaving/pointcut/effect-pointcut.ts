/**
 * @file Effect pointcut — intercepts WriteEffect and ConditionalEffect.
 *
 * WriteEffect → BindingEvent(assign) and/or AssignmentOperatorEvent
 * ConditionalEffect → logical compound assignments (&&=, ||=, ??=)
 */

import type { JejTag } from '../types.js';

/**
 * Creates an effect pointcut function that checks config.
 *
 * @param config - The user's trace config
 * @returns Pointcut function for effect@before/after hooks
 */
export default function createEffectPointcut(config: Record<string, unknown>) {
	const bindings = (config.bindings ?? {}) as Record<string, unknown>;
	const bindingEvents = (bindings.events ?? {}) as Record<string, unknown>;
	const operators = (config.operators ?? {}) as Record<string, unknown>;

	/**
	 * @param node - Effect AranLang node
	 * @param _parent - Parent node (unused)
	 * @param _root - Program root (unused)
	 * @returns Point data or null
	 */
	function effectPointcut(
		node: EffectNode,
		_parent: unknown,
		_root: unknown,
	): unknown[] | null {
		if (node.type === 'WriteEffect') {
			const hasAssignConfig = bindingEvents.assign;
			const hasOperatorConfig = node.tag.operator && operators.assignment;
			if (hasAssignConfig || hasOperatorConfig) {
				return [node.variable, node.tag];
			}
			return null;
		}

		if (node.type === 'ConditionalEffect') {
			if (node.tag.operator && operators.assignment) {
				return [node.tag.operator, node.tag];
			}
			return null;
		}

		return null;
	}

	return effectPointcut;
}

type EffectNode = {
	readonly type: string;
	readonly tag: JejTag;
	readonly variable?: string;
};
