import { describe, expect, it } from 'vitest';

import expressionAfter from '../expression-after.js';

import type { TracerState, ScopeInfo } from '../../types.js';
import type { JejTag } from '../../types.js';

function makeTag(overrides: Partial<JejTag> = {}): JejTag {
	return {
		loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 5 } },
		node: 'Literal',
		source: '"hi"',
		...overrides,
	};
}

function makeScope(overrides: Partial<ScopeInfo> = {}): ScopeInfo {
	return {
		creationStep: 1,
		depth: 0,
		kind: 'module',
		structure: null,
		structureStep: null,
		variables: { x: { kind: 'let', declarationStep: 2, initialized: true } },
		...overrides,
	};
}

function makeState(overrides: Partial<TracerState> = {}): TracerState {
	return {
		trace: [],
		step: 3,
		scopeStack: [makeScope()],
		iterationCounters: {},
		lastExpressionResult: null,
		previousExpressionResult: null,
		lastReadValues: {},
		config: {
			literals: {
				string: true,
				number: true,
				boolean: true,
				null: true,
				undefined: true,
				regex: true,
			},
			bindings: { kind: { let: true, const: true }, events: { read: true } },
			controlFlow: {
				kind: { conditionals: true, loops: { while: true } },
				events: { test: true },
			},
			operators: { shortCircuiting: true },
		},
		...overrides,
	};
}

describe('expressionAfter', () => {
	describe('always returns result', () => {
		it('returns the result value', () => {
			const result = expressionAfter(
				makeState(),
				'hello',
				'literal',
				makeTag({ literalKind: 'string' }),
			);
			expect(result).toBe('hello');
		});

		it('returns result when config is empty', () => {
			const result = expressionAfter(
				makeState({ config: {} }),
				42,
				'literal',
				makeTag({ literalKind: 'number' }),
			);
			expect(result).toBe(42);
		});

		it('returns result for unknown discriminant', () => {
			const result = expressionAfter(makeState(), 'val', 'unknown', makeTag());
			expect(result).toBe('val');
		});
	});

	describe('sets lastExpressionResult', () => {
		it('stores raw result in state', () => {
			const state = makeState();
			expressionAfter(state, 42, 'literal', makeTag({ literalKind: 'number' }));
			expect(state.lastExpressionResult).toBe(42);
		});

		it('stores result even when config is empty', () => {
			const state = makeState({ config: {} });
			expressionAfter(
				state,
				'hello',
				'literal',
				makeTag({ literalKind: 'string' }),
			);
			expect(state.lastExpressionResult).toBe('hello');
		});
	});

	describe('literal discriminant', () => {
		it('emits LiteralEvent for string', () => {
			const state = makeState();
			expressionAfter(
				state,
				'hello',
				'literal',
				makeTag({ literalKind: 'string' }),
			);
			expect(state.trace).toHaveLength(1);
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.category).toBe('literal');
			expect(event.kind).toBe('string');
		});

		it('emits LiteralEvent for number', () => {
			const state = makeState();
			expressionAfter(
				state,
				42,
				'literal',
				makeTag({ literalKind: 'number', node: 'Literal', source: '42' }),
			);
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.kind).toBe('number');
		});

		it('does not emit when literal kind is disabled', () => {
			const state = makeState({ config: { literals: { string: false } } });
			expressionAfter(
				state,
				'hello',
				'literal',
				makeTag({ literalKind: 'string' }),
			);
			expect(state.trace).toHaveLength(0);
		});
	});

	describe('read discriminant', () => {
		it('emits BindingEvent(read)', () => {
			const state = makeState();
			expressionAfter(
				state,
				5,
				'read',
				'x',
				makeTag({ node: 'Identifier', source: 'x' }),
			);
			expect(state.trace).toHaveLength(1);
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.category).toBe('variable');
			expect(event.event).toBe('read');
		});

		it('includes variable name', () => {
			const state = makeState();
			expressionAfter(
				state,
				5,
				'read',
				'x',
				makeTag({ node: 'Identifier', source: 'x' }),
			);
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.name).toBe('x');
		});

		it('includes scopeCreationStep from lookup', () => {
			const state = makeState();
			expressionAfter(
				state,
				5,
				'read',
				'x',
				makeTag({ node: 'Identifier', source: 'x' }),
			);
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.scopeCreationStep).toBe(1);
		});

		it('includes declarationStep from lookup', () => {
			const state = makeState();
			expressionAfter(
				state,
				5,
				'read',
				'x',
				makeTag({ node: 'Identifier', source: 'x' }),
			);
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.declarationStep).toBe(2);
		});

		it('does not emit when binding gate is closed', () => {
			const state = makeState({
				config: { bindings: { kind: { let: false }, events: { read: true } } },
			});
			expressionAfter(state, 5, 'read', 'x', makeTag());
			expect(state.trace).toHaveLength(0);
		});

		it('does not emit when variable is not found', () => {
			const state = makeState();
			expressionAfter(state, 5, 'read', 'unknown_var', makeTag());
			expect(state.trace).toHaveLength(0);
		});
	});

	describe('test discriminant', () => {
		it('emits TestEvent', () => {
			const state = makeState();
			expressionAfter(
				state,
				true,
				'test',
				'conditional',
				makeTag({ node: 'IfStatement', source: 'y > 5' }),
			);
			expect(state.trace).toHaveLength(1);
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.category).toBe('controlFlow');
			expect(event.event).toBe('test');
		});

		it('result is boolean outcome', () => {
			const state = makeState();
			expressionAfter(state, 'truthy string', 'test', 'conditional', makeTag());
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.result).toBe(true);
		});

		it('includes coercion when value is not boolean', () => {
			const state = makeState();
			expressionAfter(state, 'truthy', 'test', 'conditional', makeTag());
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.coercion).toEqual({ type: 'boolean', value: true });
		});

		it('does not include coercion when value is boolean', () => {
			const state = makeState();
			expressionAfter(state, true, 'test', 'conditional', makeTag());
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.coercion).toBeUndefined();
		});

		it('does not emit when controlFlow gate is closed', () => {
			const state = makeState({ config: {} });
			expressionAfter(state, true, 'test', 'conditional', makeTag());
			expect(state.trace).toHaveLength(0);
		});

		it('deletes iteration counter on false loop test', () => {
			const state = makeState();
			state.iterationCounters['5:0'] = 3;
			expressionAfter(
				state,
				false,
				'test',
				'while',
				makeTag({
					loc: { start: { line: 5, column: 0 }, end: { line: 5, column: 20 } },
				}),
			);
			expect(state.iterationCounters['5:0']).toBeUndefined();
		});

		it('does not delete iteration counter on true loop test', () => {
			const state = makeState();
			state.iterationCounters['5:0'] = 3;
			expressionAfter(
				state,
				true,
				'test',
				'while',
				makeTag({
					loc: { start: { line: 5, column: 0 }, end: { line: 5, column: 20 } },
				}),
			);
			expect(state.iterationCounters['5:0']).toBe(3);
		});

		it('does not delete counter for conditional tests', () => {
			const state = makeState();
			state.iterationCounters['5:0'] = 3;
			expressionAfter(
				state,
				false,
				'test',
				'conditional',
				makeTag({
					loc: { start: { line: 5, column: 0 }, end: { line: 5, column: 20 } },
				}),
			);
			expect(state.iterationCounters['5:0']).toBe(3);
		});
	});

	describe('shortCircuiting discriminant', () => {
		it('emits ShortCircuitingOperatorEvent', () => {
			const state = makeState();
			expressionAfter(state, false, 'shortCircuiting', '&&', makeTag());
			expect(state.trace).toHaveLength(1);
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.category).toBe('operator');
			expect(event.kind).toBe('shortCircuiting');
		});

		it('detects short-circuit for && (falsy result)', () => {
			const state = makeState();
			expressionAfter(state, false, 'shortCircuiting', '&&', makeTag());
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.shortCircuited).toBe(true);
		});

		it('detects no short-circuit for && (truthy result)', () => {
			const state = makeState({ previousExpressionResult: 'leftVal' });
			expressionAfter(state, 'rightVal', 'shortCircuiting', '&&', makeTag());
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.shortCircuited).toBeUndefined();
			expect(event.right).toBeDefined();
		});

		it('detects short-circuit for || (truthy result)', () => {
			const state = makeState();
			expressionAfter(state, 'truthy', 'shortCircuiting', '||', makeTag());
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.shortCircuited).toBe(true);
		});

		it('detects short-circuit for ?? (non-nullish result)', () => {
			const state = makeState();
			expressionAfter(state, 0, 'shortCircuiting', '??', makeTag());
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.shortCircuited).toBe(true);
		});

		it('does not emit when config is disabled', () => {
			const state = makeState({ config: {} });
			expressionAfter(state, false, 'shortCircuiting', '&&', makeTag());
			expect(state.trace).toHaveLength(0);
		});

		it('still returns result', () => {
			const result = expressionAfter(
				makeState(),
				'result',
				'shortCircuiting',
				'&&',
				makeTag(),
			);
			expect(result).toBe('result');
		});
	});
});
