import { describe, expect, it } from 'vitest';

import blockTeardown from '../block-teardown.js';

import type { TracerState, ScopeInfo } from '../../types.js';
import type { JejTag } from '../../types.js';

function makeTag(): JejTag {
	return {
		loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
		node: 'Program',
		source: '',
	};
}

function makeScope(overrides: Partial<ScopeInfo> = {}): ScopeInfo {
	return {
		creationStep: 1,
		depth: 0,
		kind: 'module',
		structure: null,
		structureStep: null,
		variables: {},
		...overrides,
	};
}

function makeState(overrides: Partial<TracerState> = {}): TracerState {
	return {
		trace: [],
		step: 1,
		scopeStack: [makeScope()],
		iterationCounters: {},
		lastExpressionResult: null, previousExpressionResult: null, lastReadValues: {},
		config: {
			scopes: { kind: { module: true, block: true }, events: { leave: true } },
		},
		...overrides,
	};
}

describe('blockTeardown', () => {
	describe('scope stack', () => {
		it('pops scope from scopeStack', () => {
			const state = makeState();
			blockTeardown(state, 'Program', 'module', 'bare', makeTag());
			expect(state.scopeStack).toHaveLength(0);
		});

		it('pops only the top scope', () => {
			const outer = makeScope({ creationStep: 1, depth: 0 });
			const inner = makeScope({ creationStep: 3, depth: 1, kind: 'block' });
			const state = makeState({ scopeStack: [outer, inner] });
			blockTeardown(state, 'IfStatement', 'block', 'then', makeTag());
			expect(state.scopeStack).toHaveLength(1);
			expect(state.scopeStack[0].creationStep).toBe(1);
		});
	});

	describe('ScopeEvent(leave) dispatch', () => {
		it('emits ScopeEvent(leave) when gate is open', () => {
			const state = makeState();
			blockTeardown(state, 'Program', 'module', 'bare', makeTag());
			expect(state.trace).toHaveLength(1);
		});

		it('emitted event has event leave', () => {
			const state = makeState();
			blockTeardown(state, 'Program', 'module', 'bare', makeTag());
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.event).toBe('leave');
		});

		it('does not emit when scope kind is disabled', () => {
			const state = makeState({
				config: { scopes: { kind: { module: false }, events: { leave: true } } },
			});
			blockTeardown(state, 'Program', 'module', 'bare', makeTag());
			expect(state.trace).toHaveLength(0);
		});

		it('does not emit when leave event is disabled', () => {
			const state = makeState({
				config: { scopes: { kind: { module: true }, events: { leave: false } } },
			});
			blockTeardown(state, 'Program', 'module', 'bare', makeTag());
			expect(state.trace).toHaveLength(0);
		});

		it('still pops scope when events disabled', () => {
			const state = makeState({ config: {} });
			blockTeardown(state, 'Program', 'module', 'bare', makeTag());
			expect(state.scopeStack).toHaveLength(0);
		});
	});
});
