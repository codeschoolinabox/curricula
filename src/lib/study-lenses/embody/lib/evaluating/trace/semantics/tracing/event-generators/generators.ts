/**
 * @file Config-mirroring namespace object
 *
 * Maps config paths to generator functions. If you know `operators.pure.arithmetic`
 * in the config, you know `generators.operators.pure.arithmetic` is the factory.
 */

import createBindingEvent from './binding/create-binding-event.js';
import createPropertyAccessEvent from './property-access/create-property-access-event.js';
import createPureOperatorEvent from './operator/create-pure-operator-event.js';
import createShortCircuitingOperatorEvent from './operator/create-short-circuiting-operator-event.js';
import createAssignmentOperatorEvent from './operator/create-assignment-operator-event.js';
import createLiteralEvent from './literal/create-literal-event.js';
import createTemplateBeginEvent from './template/create-template-begin-event.js';
import createTemplateEvaluationEvent from './template/create-template-evaluation-event.js';
import createTemplateEndEvent from './template/create-template-end-event.js';
import createScopeEvent from './scope/create-scope-event.js';
import createTestEvent from './control-flow/create-test-event.js';
import createBranchEvent from './control-flow/create-branch-event.js';
import createIterationEvent from './control-flow/create-iteration-event.js';
import createJumpEvent from './control-flow/create-jump-event.js';
import createDoEvent from './control-flow/create-do-event.js';
import createForInitializeEvent from './control-flow/create-for-initialize-event.js';
import createForIncrementEvent from './control-flow/create-for-increment-event.js';
import createFunctionCallEvent from './function/create-function-call-event.js';
import createFunctionReturnEvent from './function/create-function-return-event.js';
import createWithEvent from './with/create-with-event.js';

/**
 * Namespace object mirroring the config structure.
 * Each leaf is a generator function (or thin wrapper pre-filling fixed fields).
 */
const generators = {
	bindings: {
		declare: createBindingEvent,
		initialize: createBindingEvent,
		available: createBindingEvent,
		assign: createBindingEvent,
		read: createBindingEvent,
	},

	propertyAccess: {
		dot: createPropertyAccessEvent,
		bracket: createPropertyAccessEvent,
		optionalChaining: createPropertyAccessEvent,
	},

	operators: {
		pure: {
			arithmetic: createPureOperatorEvent,
			addition: createPureOperatorEvent,
			comparison: createPureOperatorEvent,
			typeof: createPureOperatorEvent,
			negation: {
				logical: createPureOperatorEvent,
				bitwise: createPureOperatorEvent,
			},
			bitwise: createPureOperatorEvent,
		},
		shortCircuiting: createShortCircuitingOperatorEvent,
		assignment: createAssignmentOperatorEvent,
	},

	literals: {
		string: createLiteralEvent,
		boolean: createLiteralEvent,
		number: createLiteralEvent,
		undefined: createLiteralEvent,
		null: createLiteralEvent,
		regex: createLiteralEvent,
	},

	templates: {
		begin: createTemplateBeginEvent,
		evaluation: createTemplateEvaluationEvent,
		end: createTemplateEndEvent,
	},

	scopes: {
		create: createScopeEvent,
		enter: createScopeEvent,
		interrupt: createScopeEvent,
		completion: createScopeEvent,
		leave: createScopeEvent,
	},

	controlFlow: {
		test: createTestEvent,
		branch: createBranchEvent,
		iteration: createIterationEvent,
		jump: createJumpEvent,
		do: createDoEvent,
		setup: createForInitializeEvent,
		increment: createForIncrementEvent,
	},

	functions: {
		call: createFunctionCallEvent,
		return: createFunctionReturnEvent,
	},

	with: {
		enter: createWithEvent,
		leave: createWithEvent,
	},
};

export default generators;
