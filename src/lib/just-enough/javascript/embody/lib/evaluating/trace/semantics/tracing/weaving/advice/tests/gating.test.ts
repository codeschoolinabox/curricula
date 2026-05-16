/**
 * @file ZOMBIES tests for gating.ts — pure config predicate module.
 *
 * Covers:
 *   - 8 leaf gates (scope, binding, controlFlow, literal, template, function,
 *     propertyAccess, operator)
 *   - 5 composite gates (expression, apply, effect, statement, scopeDispatch)
 *   - filter behavior (passesFilter semantics via leaf gate API)
 *   - safe config access (asRecord semantics via degenerate-config tests)
 *
 * asRecord and passesFilter are internal helpers — tested indirectly here.
 */

import { describe, expect, it } from 'vitest';

import {
	isScopeGateOpen,
	isBindingGateOpen,
	isControlFlowGateOpen,
	isLiteralEnabled,
	isOperatorEnabled,
	isPropertyAccessEnabled,
	isFunctionEnabled,
	isTemplateEnabled,
	isAnyExpressionEnabled,
	isAnyApplyEnabled,
	isAnyEffectEnabled,
	isAnyStatementEnabled,
	isAnyScopeDispatchEnabled,
} from '../gating.js';

// ─── isScopeGateOpen ─────────────────────────────────────────────────────────

describe('isScopeGateOpen', () => {
	// Zero — degenerate inputs
	it('returns false when config is empty', () => {
		expect(isScopeGateOpen({}, 'block', 'create')).toBe(false);
	});

	it('returns false when scopes key is missing', () => {
		const config = { bindings: { kind: { block: true } } };
		expect(isScopeGateOpen(config, 'block', 'create')).toBe(false);
	});

	// One — minimal correct config
	it('returns true when both kind and event are enabled', () => {
		const config = { scopes: { kind: { block: true }, events: { create: true } } };
		expect(isScopeGateOpen(config, 'block', 'create')).toBe(true);
	});

	// Boundaries
	it('returns false when kind is disabled', () => {
		const config = { scopes: { kind: { block: false }, events: { create: true } } };
		expect(isScopeGateOpen(config, 'block', 'create')).toBe(false);
	});

	// Interfaces — non-boolean coercion (!! converts truthy/falsy values)
	it('returns true when kind and event are truthy non-boolean values', () => {
		const config = { scopes: { kind: { block: 'yes' }, events: { enter: 'true' } } };
		expect(isScopeGateOpen(config, 'block', 'enter')).toBe(true);
	});

	it('returns false when kind is falsy (0)', () => {
		const config = { scopes: { kind: { block: 0 }, events: { enter: true } } };
		expect(isScopeGateOpen(config, 'block', 'enter')).toBe(false);
	});

	it('returns false when event is disabled', () => {
		const config = { scopes: { kind: { block: true }, events: { create: false } } };
		expect(isScopeGateOpen(config, 'block', 'create')).toBe(false);
	});

	it('returns false when kind key is absent from kind map', () => {
		const config = { scopes: { kind: {}, events: { create: true } } };
		expect(isScopeGateOpen(config, 'block', 'create')).toBe(false);
	});

	// Simple — realistic JEJ shape
	it('realistic: scopes.block.enter enabled', () => {
		const config = { scopes: { kind: { block: true }, events: { enter: true } } };
		expect(isScopeGateOpen(config, 'block', 'enter')).toBe(true);
	});

	it('realistic: scopes.script.completion enabled', () => {
		const config = {
			scopes: { kind: { script: true }, events: { completion: true } },
		};
		expect(isScopeGateOpen(config, 'script', 'completion')).toBe(true);
	});
});

// ─── isBindingGateOpen ────────────────────────────────────────────────────────

describe('isBindingGateOpen', () => {
	// Zero — degenerate inputs
	it('returns false when config is empty', () => {
		expect(isBindingGateOpen({}, 'let', 'declare')).toBe(false);
	});

	it('returns false when bindings key is missing', () => {
		const config = { scopes: {} };
		expect(isBindingGateOpen(config, 'const', 'assign')).toBe(false);
	});

	// One — minimal correct config
	it('returns true when both kind and event are enabled, no filter', () => {
		const config = { bindings: { kind: { let: true }, events: { declare: true } } };
		expect(isBindingGateOpen(config, 'let', 'declare')).toBe(true);
	});

	// Boundaries
	it('returns false when kind is disabled', () => {
		const config = { bindings: { kind: { let: false }, events: { read: true } } };
		expect(isBindingGateOpen(config, 'let', 'read')).toBe(false);
	});

	it('returns false when event is disabled', () => {
		const config = { bindings: { kind: { let: true }, events: { read: false } } };
		expect(isBindingGateOpen(config, 'let', 'read')).toBe(false);
	});

	it('returns true when filter is empty (no restriction)', () => {
		const config = { bindings: { kind: { let: true }, events: { read: true }, filter: [] } };
		expect(isBindingGateOpen(config, 'let', 'read', 'x')).toBe(true);
	});

	it('returns true when varName is in filter', () => {
		const config = {
			bindings: { kind: { let: true }, events: { read: true }, filter: ['x', 'y'] },
		};
		expect(isBindingGateOpen(config, 'let', 'read', 'x')).toBe(true);
	});

	it('returns false when varName is NOT in filter', () => {
		const config = {
			bindings: { kind: { let: true }, events: { read: true }, filter: ['x', 'y'] },
		};
		expect(isBindingGateOpen(config, 'let', 'read', 'z')).toBe(false);
	});

	it('returns true when no varName provided (undefined passes any filter)', () => {
		const config = {
			bindings: { kind: { let: true }, events: { read: true }, filter: ['x'] },
		};
		expect(isBindingGateOpen(config, 'let', 'read')).toBe(true);
	});
});

// ─── isControlFlowGateOpen ────────────────────────────────────────────────────

describe('isControlFlowGateOpen', () => {
	// Zero
	it('returns false when config is empty', () => {
		expect(isControlFlowGateOpen({}, 'while', 'iteration')).toBe(false);
	});

	it('returns false when controlFlow is missing', () => {
		expect(isControlFlowGateOpen({ scopes: {} }, 'while', 'iteration')).toBe(false);
	});

	// One — conditional uses kind.conditionals, not kind.loops
	it('returns true for conditional when conditionals and event are enabled', () => {
		const config = {
			controlFlow: { kind: { conditionals: true }, events: { branch: true } },
		};
		expect(isControlFlowGateOpen(config, 'conditional', 'branch')).toBe(true);
	});

	// One — loop uses kind.loops[flowKind]
	it('returns true for while loop when loops.while and event are enabled', () => {
		const config = {
			controlFlow: { kind: { loops: { while: true } }, events: { iteration: true } },
		};
		expect(isControlFlowGateOpen(config, 'while', 'iteration')).toBe(true);
	});

	// Boundaries
	it('returns false when loop kind is disabled', () => {
		const config = {
			controlFlow: { kind: { loops: { while: false } }, events: { iteration: true } },
		};
		expect(isControlFlowGateOpen(config, 'while', 'iteration')).toBe(false);
	});

	it('returns false when conditionals is true but event type is false', () => {
		const config = {
			controlFlow: { kind: { conditionals: true }, events: { test: false } },
		};
		expect(isControlFlowGateOpen(config, 'conditional', 'test')).toBe(false);
	});

	it('conditional does NOT fall through to loops path — reads kind.conditionals directly', () => {
		// loops.conditional is NOT how 'conditional' flowKind is resolved
		const config = {
			controlFlow: {
				kind: { conditionals: false, loops: { conditional: true } },
				events: { branch: true },
			},
		};
		expect(isControlFlowGateOpen(config, 'conditional', 'branch')).toBe(false);
	});

	// Simple
	it('realistic: for loop iteration enabled', () => {
		const config = {
			controlFlow: { kind: { loops: { for: true } }, events: { iteration: true } },
		};
		expect(isControlFlowGateOpen(config, 'for', 'iteration')).toBe(true);
	});

	// Boundaries — passesFilter applies on the conditional path too
	it('returns false for conditional when flowKind is not in filter', () => {
		const config = {
			controlFlow: {
				kind: { conditionals: true },
				events: { test: true },
				filter: ['for'],
			},
		};
		expect(isControlFlowGateOpen(config, 'conditional', 'test')).toBe(false);
	});
});

// ─── isLiteralEnabled ─────────────────────────────────────────────────────────

describe('isLiteralEnabled', () => {
	// Zero
	it('returns false when config is empty', () => {
		expect(isLiteralEnabled({}, 'string')).toBe(false);
	});

	it('returns false when literals key is missing', () => {
		expect(isLiteralEnabled({ scopes: {} }, 'number')).toBe(false);
	});

	// One
	it('returns true when the literal kind is enabled', () => {
		expect(isLiteralEnabled({ literals: { string: true } }, 'string')).toBe(true);
	});

	// Boundaries
	it('returns false when the literal kind is explicitly disabled', () => {
		expect(isLiteralEnabled({ literals: { string: false } }, 'string')).toBe(false);
	});

	it('returns false when asking for a different kind than what is enabled', () => {
		expect(isLiteralEnabled({ literals: { string: true } }, 'number')).toBe(false);
	});

	// Many — all JEJ-relevant literal kinds
	it.each(['string', 'number', 'boolean', 'null', 'undefined', 'regex'])(
		'literal kind %s is respected individually',
		(kind) => {
			const config = { literals: { [kind]: true } };
			expect(isLiteralEnabled(config, kind)).toBe(true);
		},
	);
});

// ─── isTemplateEnabled ────────────────────────────────────────────────────────

describe('isTemplateEnabled', () => {
	// Zero
	it('returns false when config is empty', () => {
		expect(isTemplateEnabled({}, 'begin')).toBe(false);
	});

	// One
	it('returns true when the event type is enabled', () => {
		expect(isTemplateEnabled({ templates: { begin: true } }, 'begin')).toBe(true);
	});

	// Boundaries
	it('returns false when a different event type is requested', () => {
		expect(isTemplateEnabled({ templates: { begin: true } }, 'evaluation')).toBe(false);
	});

	// Many — all template event types
	it.each(['begin', 'evaluation', 'end'])('template event %s is respected', (eventType) => {
		const config = { templates: { [eventType]: true } };
		expect(isTemplateEnabled(config, eventType)).toBe(true);
	});
});

// ─── isFunctionEnabled ────────────────────────────────────────────────────────

describe('isFunctionEnabled', () => {
	// Zero
	it('returns false when config is empty', () => {
		expect(isFunctionEnabled({}, 'call')).toBe(false);
	});

	// One — call
	it('returns true when call is enabled', () => {
		expect(isFunctionEnabled({ functions: { call: true } }, 'call')).toBe(true);
	});

	// One — return (WHY: functions.return is checked in isAnyApplyEnabled)
	it('returns true when return is enabled', () => {
		expect(isFunctionEnabled({ functions: { return: true } }, 'return')).toBe(true);
	});

	// Boundaries — filter
	it('returns true when filter is present and functionName is in filter', () => {
		const config = { functions: { call: true, filter: ['prompt', 'alert'] } };
		expect(isFunctionEnabled(config, 'call', 'prompt')).toBe(true);
	});

	it('returns false when filter is present and functionName is NOT in filter', () => {
		const config = { functions: { call: true, filter: ['prompt'] } };
		expect(isFunctionEnabled(config, 'call', 'alert')).toBe(false);
	});

	it('returns true when filter is present but no functionName provided', () => {
		const config = { functions: { call: true, filter: ['prompt'] } };
		expect(isFunctionEnabled(config, 'call')).toBe(true);
	});
});

// ─── isPropertyAccessEnabled ─────────────────────────────────────────────────

describe('isPropertyAccessEnabled', () => {
	// Zero
	it('returns false when config is empty', () => {
		expect(isPropertyAccessEnabled({}, 'dot')).toBe(false);
	});

	// One
	it('returns true when the access kind is enabled', () => {
		expect(isPropertyAccessEnabled({ propertyAccess: { dot: true } }, 'dot')).toBe(true);
	});

	// Boundaries — filter
	it('returns true when filter matches propertyName', () => {
		const config = { propertyAccess: { dot: true, filter: ['length', 'push'] } };
		expect(isPropertyAccessEnabled(config, 'dot', 'length')).toBe(true);
	});

	it('returns false when filter does not match propertyName', () => {
		const config = { propertyAccess: { dot: true, filter: ['length'] } };
		expect(isPropertyAccessEnabled(config, 'dot', 'name')).toBe(false);
	});

	// Many — bracket and optionalChaining also work
	it.each(['dot', 'bracket', 'optionalChaining'])(
		'access kind %s is respected',
		(accessKind) => {
			const config = { propertyAccess: { [accessKind]: true } };
			expect(isPropertyAccessEnabled(config, accessKind)).toBe(true);
		},
	);
});

// ─── isOperatorEnabled ────────────────────────────────────────────────────────

describe('isOperatorEnabled', () => {
	// Zero
	it('returns false when config is empty', () => {
		expect(isOperatorEnabled({}, 'pure.arithmetic')).toBe(false);
	});

	// One — dot-separated path traversal
	it('resolves dot-separated path: pure.arithmetic', () => {
		const config = { operators: { pure: { arithmetic: true } } };
		expect(isOperatorEnabled(config, 'pure.arithmetic')).toBe(true);
	});

	// Triangulation — must not pass with hardcoded `return true`
	it('returns false for a sibling path that is not enabled', () => {
		const config = { operators: { pure: { arithmetic: true } } };
		expect(isOperatorEnabled(config, 'pure.comparison')).toBe(false);
	});

	// One — flat path (no dots)
	it('resolves flat path: shortCircuiting', () => {
		const config = { operators: { shortCircuiting: true } };
		expect(isOperatorEnabled(config, 'shortCircuiting')).toBe(true);
	});

	// Many — nested three levels deep
	it('resolves triple-nested path: pure.negation.logical', () => {
		const config = { operators: { pure: { negation: { logical: true } } } };
		expect(isOperatorEnabled(config, 'pure.negation.logical')).toBe(true);
	});

	// Boundaries
	it('returns false when intermediate exists but leaf is false', () => {
		const config = { operators: { pure: { arithmetic: false } } };
		expect(isOperatorEnabled(config, 'pure.arithmetic')).toBe(false);
	});

	it('returns true when filter is empty (no restriction)', () => {
		const config = { operators: { pure: { arithmetic: true }, filter: [] } };
		expect(isOperatorEnabled(config, 'pure.arithmetic', '+')).toBe(true);
	});

	it('returns false when operator NOT in filter', () => {
		const config = { operators: { pure: { arithmetic: true }, filter: ['+', '-'] } };
		expect(isOperatorEnabled(config, 'pure.arithmetic', '*')).toBe(false);
	});

	it('returns true when operator IS in filter', () => {
		const config = { operators: { pure: { arithmetic: true }, filter: ['+', '-'] } };
		expect(isOperatorEnabled(config, 'pure.arithmetic', '+')).toBe(true);
	});

	// Boundaries — non-object intermediate node degrades gracefully
	it('returns false when intermediate node is null (pure is null → pure.arithmetic is missing)', () => {
		const config = { operators: { pure: null } };
		expect(isOperatorEnabled(config, 'pure.arithmetic')).toBe(false);
	});
});

// ─── isAnyExpressionEnabled ───────────────────────────────────────────────────

describe('isAnyExpressionEnabled', () => {
	// Zero
	it('returns false when config is empty', () => {
		expect(isAnyExpressionEnabled({})).toBe(false);
	});

	// One — each literal kind activates expression@after
	it('returns true when literals.string is enabled', () => {
		expect(isAnyExpressionEnabled({ literals: { string: true } })).toBe(true);
	});

	// Many — all literal kinds must be wired (triangulates against checking only 'string')
	it.each(['number', 'boolean', 'null', 'undefined', 'regex'])(
		'returns true when literals.%s is enabled',
		(kind) => {
			expect(isAnyExpressionEnabled({ literals: { [kind]: true } })).toBe(true);
		},
	);

	it('returns true when bindings.events.read is enabled', () => {
		expect(isAnyExpressionEnabled({ bindings: { events: { read: true } } })).toBe(true);
	});

	it('returns true when operators.shortCircuiting is enabled', () => {
		expect(isAnyExpressionEnabled({ operators: { shortCircuiting: true } })).toBe(true);
	});

	it('returns true when controlFlow.events.test is enabled', () => {
		expect(isAnyExpressionEnabled({ controlFlow: { events: { test: true } } })).toBe(true);
	});

	// Many — multiple enabled at once
	it('returns true when multiple gates are enabled', () => {
		expect(
			isAnyExpressionEnabled({
				literals: { number: true },
				bindings: { events: { read: true } },
			}),
		).toBe(true);
	});

	// Simple — realistic JEJ shape: variables only
	it('realistic: only variables.read enabled → expression hook needed', () => {
		expect(
			isAnyExpressionEnabled({
				bindings: { events: { read: true } },
			}),
		).toBe(true);
	});
});

// ─── isAnyApplyEnabled ────────────────────────────────────────────────────────

describe('isAnyApplyEnabled', () => {
	// Zero
	it('returns false when config is empty', () => {
		expect(isAnyApplyEnabled({})).toBe(false);
	});

	// One — each major gate
	it('returns true when functions.call is enabled', () => {
		expect(isAnyApplyEnabled({ functions: { call: true } })).toBe(true);
	});

	it('returns true when functions.return is enabled', () => {
		// WHY: functions.return is checked — apply@around intercepts all calls
		// including return value instrumentation
		expect(isAnyApplyEnabled({ functions: { return: true } })).toBe(true);
	});

	it('returns true when operators.pure.arithmetic is enabled', () => {
		expect(isAnyApplyEnabled({ operators: { pure: { arithmetic: true } } })).toBe(true);
	});

	it('returns true when propertyAccess.dot is enabled', () => {
		expect(isAnyApplyEnabled({ propertyAccess: { dot: true } })).toBe(true);
	});

	it('returns true when templates.begin is enabled', () => {
		expect(isAnyApplyEnabled({ templates: { begin: true } })).toBe(true);
	});

	// Boundaries — negation sub-paths
	it('returns true when operators.pure.negation.logical is enabled', () => {
		expect(
			isAnyApplyEnabled({ operators: { pure: { negation: { logical: true } } } }),
		).toBe(true);
	});

	// Many — all remaining OR branches (each alone must activate apply@around)
	it.each([
		['pure.addition', { operators: { pure: { addition: true } } }],
		['pure.comparison', { operators: { pure: { comparison: true } } }],
		['pure.typeof', { operators: { pure: { typeof: true } } }],
		['pure.bitwise', { operators: { pure: { bitwise: true } } }],
		['negation.bitwise', { operators: { pure: { negation: { bitwise: true } } } }],
		['operators.shortCircuiting', { operators: { shortCircuiting: true } }],
		['operators.assignment', { operators: { assignment: true } }],
		['propertyAccess.bracket', { propertyAccess: { bracket: true } }],
		['propertyAccess.optionalChaining', { propertyAccess: { optionalChaining: true } }],
		['templates.evaluation', { templates: { evaluation: true } }],
		['templates.end', { templates: { end: true } }],
	] as const)('returns true when %s is enabled', (_label, config) => {
		expect(isAnyApplyEnabled(config)).toBe(true);
	});

	// Simple — realistic: only operators active
	it('realistic: only pure arithmetic → apply hook needed', () => {
		expect(
			isAnyApplyEnabled({
				operators: { pure: { arithmetic: true, comparison: true } },
			}),
		).toBe(true);
	});
});

// ─── isAnyEffectEnabled ───────────────────────────────────────────────────────

describe('isAnyEffectEnabled', () => {
	// Zero
	it('returns false when config is empty', () => {
		expect(isAnyEffectEnabled({})).toBe(false);
	});

	// One — assign
	it('returns true when bindings.events.assign is enabled', () => {
		expect(isAnyEffectEnabled({ bindings: { events: { assign: true } } })).toBe(true);
	});

	// One — initialize (WHY: TDZ variables — initialize fires even when assign is disabled)
	it('returns true when bindings.events.initialize is enabled', () => {
		expect(isAnyEffectEnabled({ bindings: { events: { initialize: true } } })).toBe(true);
	});

	// One — available (same WHY as initialize: TDZ lifecycle)
	it('returns true when bindings.events.available is enabled', () => {
		expect(isAnyEffectEnabled({ bindings: { events: { available: true } } })).toBe(true);
	});

	// One — operators.assignment
	it('returns true when operators.assignment is enabled', () => {
		expect(isAnyEffectEnabled({ operators: { assignment: true } })).toBe(true);
	});

	// Boundaries — TDZ interaction: initialize fires even when assign is disabled
	it('returns true when initialize is enabled but assign is disabled (TDZ lifecycle)', () => {
		expect(
			isAnyEffectEnabled({
				bindings: { events: { assign: false, initialize: true } },
			}),
		).toBe(true);
	});

	// Simple — realistic: variables initialize only
	it('realistic: only bindings.events.initialize → effect hook needed', () => {
		expect(
			isAnyEffectEnabled({
				bindings: { events: { initialize: true } },
			}),
		).toBe(true);
	});
});

// ─── isAnyStatementEnabled ────────────────────────────────────────────────────

describe('isAnyStatementEnabled', () => {
	// Zero
	it('returns false when config is empty', () => {
		expect(isAnyStatementEnabled({})).toBe(false);
	});

	// One
	it('returns true when controlFlow.events.jump is enabled', () => {
		expect(isAnyStatementEnabled({ controlFlow: { events: { jump: true } } })).toBe(true);
	});

	// Boundaries — other events do NOT activate statement hook
	it('returns false when controlFlow.events.test is enabled but not jump', () => {
		expect(isAnyStatementEnabled({ controlFlow: { events: { test: true } } })).toBe(false);
	});

	// Simple
	it('realistic: break/continue enabled → statement hook needed', () => {
		expect(
			isAnyStatementEnabled({ controlFlow: { events: { jump: true } } }),
		).toBe(true);
	});
});

// ─── isAnyScopeDispatchEnabled ────────────────────────────────────────────────

describe('isAnyScopeDispatchEnabled', () => {
	// Zero
	it('returns false when config is empty', () => {
		expect(isAnyScopeDispatchEnabled({})).toBe(false);
	});

	// One — each event type activates scope dispatch
	it.each(['create', 'enter', 'completion', 'interrupt', 'leave'])(
		'returns true when scopes.events.%s is enabled',
		(eventType) => {
			expect(
				isAnyScopeDispatchEnabled({ scopes: { events: { [eventType]: true } } }),
			).toBe(true);
		},
	);

	// Many — multiple active
	it('returns true when multiple scope events are enabled', () => {
		expect(
			isAnyScopeDispatchEnabled({
				scopes: { events: { enter: true, leave: true } },
			}),
		).toBe(true);
	});

	// Simple — realistic: only leave
	it('realistic: only scopes.events.leave → block-after and block-throwing need registering', () => {
		expect(
			isAnyScopeDispatchEnabled({ scopes: { events: { leave: true } } }),
		).toBe(true);
	});
});
