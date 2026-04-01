import { describe, expect, it } from 'vitest';

import applyAround from '../apply-around.js';

import type { TracerState, ScopeInfo } from '../../types.js';
import type { JejTag } from '../../types.js';

function makeTag(overrides: Partial<JejTag> = {}): JejTag {
	return {
		loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
		node: 'BinaryExpression',
		source: '2 + 3',
		...overrides,
	};
}

function makeScope(overrides: Partial<ScopeInfo> = {}): ScopeInfo {
	return {
		creationStep: 1, depth: 0, kind: 'module', structure: null, structureStep: null,
		variables: {},
		...overrides,
	};
}

function makeState(overrides: Partial<TracerState> = {}): TracerState {
	return {
		trace: [], step: 2, scopeStack: [makeScope()], iterationCounters: {},
		lastExpressionResult: null,
		config: {
			operators: { pure: { arithmetic: true, addition: true, comparison: true, typeof: true, negation: { logical: true, bitwise: true }, bitwise: true } },
			propertyAccess: { dot: true, bracket: true },
			functions: { call: true, return: true },
			templates: { begin: true, evaluation: true, end: true },
		},
		...overrides,
	};
}

// helpers simulating Aran intrinsic functions
function fakeBinaryOp(operator: string, left: unknown, right: unknown): unknown {
	if (operator === '+') return (left as number) + (right as number);
	if (operator === '===') return left === right;
	return undefined;
}

function fakeUnaryOp(operator: string, operand: unknown): unknown {
	if (operator === '!') return !operand;
	if (operator === 'typeof') return typeof operand;
	return undefined;
}

function fakeGetProp(object: unknown, key: string): unknown {
	return (object as Record<string, unknown>)[key];
}

describe('applyAround', () => {
	describe('always returns call result', () => {
		it('returns Reflect.apply result', () => {
			const callee = (a: number, b: number) => a + b;
			const result = applyAround(makeState(), callee, undefined, [2, 3], 'call', makeTag());
			expect(result).toBe(5);
		});

		it('returns result even when config is empty', () => {
			const callee = () => 42;
			const result = applyAround(makeState({ config: {} }), callee, undefined, [], 'call', makeTag());
			expect(result).toBe(42);
		});
	});

	describe('sets lastExpressionResult', () => {
		it('stores call result in state', () => {
			const state = makeState();
			const callee = () => 99;
			applyAround(state, callee, undefined, [], 'call', makeTag());
			expect(state.lastExpressionResult).toBe(99);
		});
	});

	describe('binary operator (aran.performBinaryOperation)', () => {
		it('emits PureOperatorEvent for +', () => {
			const state = makeState();
			applyAround(state, fakeBinaryOp, undefined, ['+', 2, 3], 'aran.performBinaryOperation', makeTag());
			expect(state.trace).toHaveLength(1);
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.category).toBe('operator');
			expect(event.kind).toBe('pure');
			expect(event.subkind).toBe('addition');
		});

		it('emits comparison subkind for ===', () => {
			const state = makeState();
			applyAround(state, fakeBinaryOp, undefined, ['===', 1, 1], 'aran.performBinaryOperation', makeTag({ source: '1 === 1' }));
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.subkind).toBe('comparison');
		});

		it('does not emit when config is disabled', () => {
			const state = makeState({ config: {} });
			applyAround(state, fakeBinaryOp, undefined, ['+', 2, 3], 'aran.performBinaryOperation', makeTag());
			expect(state.trace).toHaveLength(0);
		});
	});

	describe('unary operator (aran.performUnaryOperation)', () => {
		it('emits PureOperatorEvent for !', () => {
			const state = makeState();
			applyAround(state, fakeUnaryOp, undefined, ['!', true], 'aran.performUnaryOperation', makeTag({ source: '!true' }));
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.subkind).toBe('negation.logical');
		});

		it('emits typeof subkind', () => {
			const state = makeState();
			applyAround(state, fakeUnaryOp, undefined, ['typeof', 'hello'], 'aran.performUnaryOperation', makeTag({ source: 'typeof x' }));
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.subkind).toBe('typeof');
		});
	});

	describe('property access (aran.getValueProperty)', () => {
		it('emits PropertyAccessEvent', () => {
			const state = makeState();
			const obj = { length: 5 };
			applyAround(state, fakeGetProp, undefined, [obj, 'length'], 'aran.getValueProperty', makeTag({ accessKind: 'dot', source: 'str.length' }));
			expect(state.trace).toHaveLength(1);
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.category).toBe('propertyAccess');
			expect(event.kind).toBe('dot');
		});
	});

	describe('function call (call)', () => {
		it('emits FunctionCallEvent and FunctionReturnEvent', () => {
			const state = makeState();
			const callee = function myFunc(x: number) { return x * 2; };
			applyAround(state, callee, undefined, [5], 'call', makeTag({ source: 'myFunc(5)' }));
			expect(state.trace).toHaveLength(2);
			const callEvent = state.trace[0] as Record<string, unknown>;
			const returnEvent = state.trace[1] as Record<string, unknown>;
			expect(callEvent.event).toBe('call');
			expect(returnEvent.event).toBe('return');
		});

		it('call event has function name', () => {
			const state = makeState();
			const callee = function myFunc() { return 1; };
			applyAround(state, callee, undefined, [], 'call', makeTag());
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.name).toBe('myFunc');
		});

		it('uses anonymous for unnamed functions', () => {
			const state = makeState();
			applyAround(state, () => 1, undefined, [], 'call', makeTag());
			// arrow functions have empty string name, not undefined
			const event = state.trace[0] as Record<string, unknown>;
			expect(typeof event.name).toBe('string');
		});

		it('does not emit when functions.call is disabled', () => {
			const state = makeState({ config: { functions: { call: false, return: true } } });
			const callee = function f() { return 1; };
			applyAround(state, callee, undefined, [], 'call', makeTag());
			const callEvents = (state.trace as Record<string, unknown>[]).filter((e) => e.event === 'call');
			expect(callEvents).toHaveLength(0);
		});
	});

	describe('template literal (template)', () => {
		it('emits TemplateBeginEvent', () => {
			const state = makeState();
			const concat = function concat(...parts: string[]) { return parts.join(''); };
			const tag = makeTag({
				templateStrings: ['hello ', ' world'],
				templateExpressionCount: 1,
				source: '`hello ${name} world`',
			});
			applyAround(state, concat, '', ['hello ', 'Bob', ' world'], 'template', tag);
			const beginEvents = (state.trace as Record<string, unknown>[]).filter((e) => e.event === 'begin');
			expect(beginEvents).toHaveLength(1);
		});

		it('emits TemplateEvaluationEvent per expression', () => {
			const state = makeState();
			const concat = function concat(...parts: string[]) { return parts.join(''); };
			const tag = makeTag({
				templateStrings: ['a', 'b', 'c'],
				templateExpressionCount: 2,
				source: '`a${x}b${y}c`',
			});
			applyAround(state, concat, '', ['a', 10, 'b', 20, 'c'], 'template', tag);
			const evalEvents = (state.trace as Record<string, unknown>[]).filter((e) => e.event === 'evaluation');
			expect(evalEvents).toHaveLength(2);
		});

		it('emits TemplateEndEvent', () => {
			const state = makeState();
			const concat = function concat(...parts: string[]) { return parts.join(''); };
			const tag = makeTag({
				templateStrings: ['hello ', ''],
				templateExpressionCount: 1,
				source: '`hello ${name}`',
			});
			applyAround(state, concat, '', ['hello ', 'Bob', ''], 'template', tag);
			const endEvents = (state.trace as Record<string, unknown>[]).filter((e) => e.event === 'end');
			expect(endEvents).toHaveLength(1);
		});
	});

	describe('unknown intrinsic', () => {
		it('does not emit events for aran.toPropertyKey', () => {
			const state = makeState();
			const callee = (x: unknown) => String(x);
			applyAround(state, callee, undefined, ['foo'], 'aran.toPropertyKey', makeTag());
			expect(state.trace).toHaveLength(0);
		});

		it('still returns the call result', () => {
			const callee = (x: unknown) => String(x);
			const result = applyAround(makeState(), callee, undefined, ['foo'], 'aran.toPropertyKey', makeTag());
			expect(result).toBe('foo');
		});
	});
});
