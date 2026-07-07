/**
 * @file Expression pointcut — intercepts expressions based on config.
 *
 * Handles: PrimitiveExpression (literals), ReadExpression (binding reads),
 * ConditionalExpression (short-circuiting), and test position detection.
 *
 * Every point array starts with a discriminant string so the advice can
 * dispatch unambiguously by checking point[0].
 */

import type { JejTag } from '../types.js';
import ARAN_PARAMETERS from '../aran-parameters.js';

/**
 * Creates an expression pointcut that checks config.
 *
 * @param config - The user's trace config
 * @returns Pointcut function for expression@after hook
 */
export default function createExpressionPointcut(
	config: Record<string, unknown>,
) {
	const literals = (config.literals ?? {}) as Record<string, unknown>;
	const bindings = (config.bindings ?? {}) as Record<string, unknown>;
	const bindingEvents = (bindings.events ?? {}) as Record<string, unknown>;
	const operators = (config.operators ?? {}) as Record<string, unknown>;
	const controlFlow = (config.controlFlow ?? {}) as Record<string, unknown>;
	const controlFlowEvents = (controlFlow.events ?? {}) as Record<
		string,
		unknown
	>;

	function isInTestPosition(node: ExpressionNode, parent: ParentNode): boolean {
		// WHY tag identity, not node identity: our wrapPointcut creates shallow
		// copies of node and parent. parent.test (original Aran reference) and
		// node (our copy) are different objects. Tag identity works because
		// tagMap.get() returns the same JejTag reference for the same hash.
		return (
			(parent.type === 'IfStatement' || parent.type === 'WhileStatement') &&
			parent.test?.tag === node.tag
		);
	}

	// perf: skip freeze — consumed by Aran's weaving machinery
	function expressionPointcut(
		node: ExpressionNode,
		parent: ParentNode,
		_root: unknown,
	): unknown[] | null {
		// Test position detection (checked first — any expression type can be in test position)
		if (isInTestPosition(node, parent) && controlFlowEvents.test) {
			// A genuine `while`'s test child never inherits `loopKind` (instrument
			// stamps it on the loop STATEMENT node; for/forOf/doWhile survive via
			// Aran's desugaring reusing that tag). When it's absent, the parent
			// type is the discriminant: WhileStatement → 'while', else IfStatement.
			const testSource =
				node.tag.loopKind ??
				(parent.type === 'WhileStatement' ? 'while' : 'conditional');
			return ['test', testSource, node.tag];
		}

		// PrimitiveExpression → LiteralEvent
		if (node.type === 'PrimitiveExpression') {
			const kind = node.tag.literalKind;
			if (kind && literals[kind]) {
				return ['literal', node.tag];
			}
			return null;
		}

		// ReadExpression → BindingEvent(read)
		// Skip Aran internal parameters — only user variables produce binding events
		if (node.type === 'ReadExpression') {
			if (
				bindingEvents.read &&
				node.variable &&
				!ARAN_PARAMETERS.has(node.variable)
			) {
				return ['read', node.variable, node.tag];
			}
			return null;
		}

		// ConditionalExpression → ShortCircuitingOperatorEvent
		if (node.type === 'ConditionalExpression') {
			if (node.tag.operator && operators.shortCircuiting) {
				return ['shortCircuiting', node.tag.operator, node.tag];
			}
			return null;
		}

		return null;
	}

	return expressionPointcut;
}

type ExpressionNode = {
	readonly type: string;
	readonly tag: JejTag;
	readonly variable?: string;
	readonly primitive?: unknown;
};

type ParentNode = {
	readonly type: string;
	readonly test?: ExpressionNode;
};
