import { describe, expect, it } from 'vitest';

import effectAfter from '../effect-after.js';

import type { TracerState, ScopeInfo } from '../../types.js';
import type { JejTag } from '../../types.js';

function makeTag(overrides: Partial<JejTag> = {}): JejTag {
	return {
		loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
		node: 'AssignmentExpression',
		source: 'x = 5',
		operator: '=',
		...overrides,
	};
}

function makeScope(overrides: Partial<ScopeInfo> = {}): ScopeInfo {
	return {
		creationStep: 1, depth: 0, kind: 'module', structure: null, structureStep: null,
		variables: { x: { kind: 'let', declarationStep: 2, initialized: true } },
		...overrides,
	};
}

function makeState(overrides: Partial<TracerState> = {}): TracerState {
	return {
		trace: [], step: 3, eventStep: 0, scopeStack: [makeScope()], iterationCounters: {},
		previousExpressionResult: null, lastReadValues: {}, lastExpressionResult: 5,
		config: {
			bindings: { kind: { let: true }, events: { assign: true } },
			operators: { assignment: true },
		},
		...overrides,
	};
}

describe('effectAfter', () => {
	describe('simple assignment (=)', () => {
		it('emits BindingEvent(assign)', () => {
			const state = makeState();
			effectAfter(state, 'x', makeTag());
			const assignEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => e.event === 'assign',
			);
			expect(assignEvents).toHaveLength(1);
		});

		it('includes value from lastExpressionResult', () => {
			const state = makeState({ lastExpressionResult: 42 });
			effectAfter(state, 'x', makeTag());
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.value).toEqual({ type: 'number', value: 42 });
		});

		it('does not emit when binding gate is closed', () => {
			const state = makeState({
				config: { bindings: { kind: { let: false }, events: { assign: true } } },
			});
			effectAfter(state, 'x', makeTag());
			expect(state.trace).toHaveLength(0);
		});

		it('does not emit when variable is not found', () => {
			const state = makeState();
			effectAfter(state, 'unknown_var', makeTag());
			expect(state.trace).toHaveLength(0);
		});
	});
});
