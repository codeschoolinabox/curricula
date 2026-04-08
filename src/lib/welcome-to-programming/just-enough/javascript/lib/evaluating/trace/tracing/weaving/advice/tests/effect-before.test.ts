import { describe, expect, it } from 'vitest';

import effectBefore from '../effect-before.js';

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
		trace: [], step: 3, scopeStack: [makeScope()], iterationCounters: {},
		previousExpressionResult: null, lastReadValues: {}, lastExpressionResult: 5,
		config: {
			bindings: { kind: { let: true }, events: { assign: true } },
			operators: { assignment: true },
		},
		...overrides,
	};
}

describe('effectBefore', () => {
	describe('simple assignment (=)', () => {
		it('does not emit BindingEvent (moved to effect-after)', () => {
			const state = makeState();
			effectBefore(state, 'x', makeTag());
			expect(state.trace).toHaveLength(0);
		});

		it('does not emit when variable is not found', () => {
			const state = makeState();
			effectBefore(state, 'unknown_var', makeTag());
			expect(state.trace).toHaveLength(0);
		});
	});

	describe('compound assignment (+=, -=, etc.)', () => {
		it('emits AssignmentOperatorEvent for compound assignment', () => {
			const state = makeState({ previousExpressionResult: null, lastReadValues: {}, lastExpressionResult: 10 });
			effectBefore(state, 'x', makeTag({ operator: '+=', source: 'x += 5' }));
			const opEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => e.category === 'operator' && e.kind === 'assignment',
			);
			expect(opEvents).toHaveLength(1);
		});

		it('does not emit operator event when operators.assignment is disabled', () => {
			const state = makeState({
				config: {
					bindings: { kind: { let: true }, events: { assign: true } },
					operators: { assignment: false },
				},
				previousExpressionResult: null, lastReadValues: {}, lastExpressionResult: 10,
			});
			effectBefore(state, 'x', makeTag({ operator: '+=', source: 'x += 5' }));
			const opEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => e.category === 'operator',
			);
			expect(opEvents).toHaveLength(0);
		});
	});
});
