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
} from '../config-gate.js';

describe('isScopeGateOpen', () => {
	it('returns true when both kind and event are enabled', () => {
		const config = { scopes: { kind: { block: true }, events: { create: true } } };
		expect(isScopeGateOpen(config, 'block', 'create')).toBe(true);
	});

	it('returns false when kind is disabled', () => {
		const config = { scopes: { kind: { block: false }, events: { create: true } } };
		expect(isScopeGateOpen(config, 'block', 'create')).toBe(false);
	});

	it('returns false when event is disabled', () => {
		const config = { scopes: { kind: { block: true }, events: { create: false } } };
		expect(isScopeGateOpen(config, 'block', 'create')).toBe(false);
	});

	it('returns false when scopes is missing', () => {
		expect(isScopeGateOpen({}, 'block', 'create')).toBe(false);
	});

	it('returns false when kind key is missing', () => {
		const config = { scopes: { kind: {}, events: { create: true } } };
		expect(isScopeGateOpen(config, 'block', 'create')).toBe(false);
	});
});

describe('isBindingGateOpen', () => {
	it('returns true when both kind and event are enabled', () => {
		const config = { bindings: { kind: { let: true }, events: { declare: true } } };
		expect(isBindingGateOpen(config, 'let', 'declare')).toBe(true);
	});

	it('returns false when kind is disabled', () => {
		const config = { bindings: { kind: { let: false }, events: { read: true } } };
		expect(isBindingGateOpen(config, 'let', 'read')).toBe(false);
	});

	it('returns false when bindings is missing', () => {
		expect(isBindingGateOpen({}, 'const', 'assign')).toBe(false);
	});
});

describe('isControlFlowGateOpen', () => {
	it('returns true for conditional when both enabled', () => {
		const config = {
			controlFlow: { kind: { conditionals: true }, events: { branch: true } },
		};
		expect(isControlFlowGateOpen(config, 'conditional', 'branch')).toBe(true);
	});

	it('returns true for loop kind when nested loops config enabled', () => {
		const config = {
			controlFlow: { kind: { loops: { while: true } }, events: { iteration: true } },
		};
		expect(isControlFlowGateOpen(config, 'while', 'iteration')).toBe(true);
	});

	it('returns false when loop kind is disabled', () => {
		const config = {
			controlFlow: { kind: { loops: { while: false } }, events: { iteration: true } },
		};
		expect(isControlFlowGateOpen(config, 'while', 'iteration')).toBe(false);
	});

	it('returns false when controlFlow is missing', () => {
		expect(isControlFlowGateOpen({}, 'while', 'iteration')).toBe(false);
	});
});

describe('isLiteralEnabled', () => {
	it('returns true when literal kind is enabled', () => {
		expect(isLiteralEnabled({ literals: { string: true } }, 'string')).toBe(true);
	});

	it('returns false when literal kind is disabled', () => {
		expect(isLiteralEnabled({ literals: { string: false } }, 'string')).toBe(false);
	});

	it('returns false when literals is missing', () => {
		expect(isLiteralEnabled({}, 'number')).toBe(false);
	});
});

describe('isOperatorEnabled', () => {
	it('resolves dot-separated path', () => {
		const config = { operators: { pure: { arithmetic: true } } };
		expect(isOperatorEnabled(config, 'pure.arithmetic')).toBe(true);
	});

	it('resolves nested negation path', () => {
		const config = { operators: { pure: { negation: { logical: true } } } };
		expect(isOperatorEnabled(config, 'pure.negation.logical')).toBe(true);
	});

	it('resolves flat shortCircuiting', () => {
		const config = { operators: { shortCircuiting: true } };
		expect(isOperatorEnabled(config, 'shortCircuiting')).toBe(true);
	});

	it('returns false when path missing', () => {
		expect(isOperatorEnabled({}, 'pure.arithmetic')).toBe(false);
	});
});

describe('isPropertyAccessEnabled', () => {
	it('returns true when access kind is enabled', () => {
		expect(isPropertyAccessEnabled({ propertyAccess: { dot: true } }, 'dot')).toBe(true);
	});

	it('returns false when missing', () => {
		expect(isPropertyAccessEnabled({}, 'bracket')).toBe(false);
	});
});

describe('isFunctionEnabled', () => {
	it('returns true when event type is enabled', () => {
		expect(isFunctionEnabled({ functions: { call: true } }, 'call')).toBe(true);
	});

	it('returns false when missing', () => {
		expect(isFunctionEnabled({}, 'return')).toBe(false);
	});
});

describe('isTemplateEnabled', () => {
	it('returns true when event type is enabled', () => {
		expect(isTemplateEnabled({ templates: { begin: true } }, 'begin')).toBe(true);
	});

	it('returns false when missing', () => {
		expect(isTemplateEnabled({}, 'evaluation')).toBe(false);
	});
});
