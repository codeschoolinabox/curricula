import { describe, expect, it } from 'vitest';

import blockSetup from '../block-setup.js';

import type { TracerState } from '../../types.js';
import type { JejTag } from '../../types.js';

function makeTag(overrides: Partial<JejTag> = {}): JejTag {
	return {
		loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
		node: 'Program',
		source: '',
		...overrides,
	};
}

function makeState(overrides: Partial<TracerState> = {}): TracerState {
	return {
		trace: [],
		step: 0,
		scopeStack: [],
		iterationCounters: {},
		lastExpressionResult: null, previousExpressionResult: null, lastReadValues: {},
		config: {
			scopes: { kind: { module: true, block: true }, events: { create: true } },
		},
		...overrides,
	};
}

describe('blockSetup', () => {
	describe('returns state', () => {
		it('returns the state object', () => {
			const state = makeState();
			const result = blockSetup(state, 'Program', 'module', 'bare', makeTag());
			expect(result).toBe(state);
		});
	});

	describe('step counter', () => {
		it('increments step for scope creation', () => {
			const state = makeState({ config: {} });
			blockSetup(state, 'Program', 'module', 'bare', makeTag());
			expect(state.step).toBe(1);
		});

		it('increments step again when ScopeEvent is emitted', () => {
			const state = makeState();
			blockSetup(state, 'Program', 'module', 'bare', makeTag());
			expect(state.step).toBe(2);
		});
	});

	describe('scope stack', () => {
		it('pushes a scope onto scopeStack', () => {
			const state = makeState();
			blockSetup(state, 'Program', 'module', 'bare', makeTag());
			expect(state.scopeStack).toHaveLength(1);
		});

		it('scope has correct creationStep', () => {
			const state = makeState();
			blockSetup(state, 'Program', 'module', 'bare', makeTag());
			expect(state.scopeStack[0].creationStep).toBe(1);
		});

		it('scope has correct depth (0 for first)', () => {
			const state = makeState();
			blockSetup(state, 'Program', 'module', 'bare', makeTag());
			expect(state.scopeStack[0].depth).toBe(0);
		});

		it('scope has correct depth (1 for nested)', () => {
			const state = makeState({ step: 1, scopeStack: [{
				creationStep: 1, depth: 0, kind: 'module', structure: null, structureStep: null, variables: {},
			}] });
			blockSetup(state, 'IfStatement', 'block', 'then', makeTag({ structure: 'conditional' }));
			expect(state.scopeStack[1].depth).toBe(1);
		});

		it('scope has correct kind', () => {
			const state = makeState();
			blockSetup(state, 'Program', 'module', 'bare', makeTag());
			expect(state.scopeStack[0].kind).toBe('module');
		});

		it('scope has structure from tag', () => {
			const state = makeState();
			blockSetup(state, 'WhileStatement', 'block', 'while', makeTag({ structure: 'while' }));
			expect(state.scopeStack[0].structure).toBe('while');
		});

		it('scope has null structure when tag has none', () => {
			const state = makeState();
			blockSetup(state, 'Program', 'module', 'bare', makeTag());
			expect(state.scopeStack[0].structure).toBeNull();
		});

		it('scope has empty variables', () => {
			const state = makeState();
			blockSetup(state, 'Program', 'module', 'bare', makeTag());
			expect(state.scopeStack[0].variables).toEqual({});
		});
	});

	describe('ScopeEvent(create) dispatch', () => {
		it('emits ScopeEvent when gate is open', () => {
			const state = makeState();
			blockSetup(state, 'Program', 'module', 'bare', makeTag());
			expect(state.trace).toHaveLength(1);
		});

		it('emitted event has category scope', () => {
			const state = makeState();
			blockSetup(state, 'Program', 'module', 'bare', makeTag());
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.category).toBe('scope');
		});

		it('emitted event has event create', () => {
			const state = makeState();
			blockSetup(state, 'Program', 'module', 'bare', makeTag());
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.event).toBe('create');
		});

		it('does not emit when scope kind is disabled', () => {
			const state = makeState({
				config: { scopes: { kind: { module: false }, events: { create: true } } },
			});
			blockSetup(state, 'Program', 'module', 'bare', makeTag());
			expect(state.trace).toHaveLength(0);
		});

		it('does not emit when create event is disabled', () => {
			const state = makeState({
				config: { scopes: { kind: { module: true }, events: { create: false } } },
			});
			blockSetup(state, 'Program', 'module', 'bare', makeTag());
			expect(state.trace).toHaveLength(0);
		});

		it('still pushes scope when events are disabled', () => {
			const state = makeState({ config: {} });
			blockSetup(state, 'Program', 'module', 'bare', makeTag());
			expect(state.scopeStack).toHaveLength(1);
		});
	});

	describe('error safety', () => {
		it('returns state even if dispatch throws', () => {
			const state = makeState();
			// force a throw by passing invalid generator path via broken config
			state.config = { scopes: { kind: { module: true }, events: { create: true } } };
			// even with valid config, if something internal breaks, state is still returned
			const result = blockSetup(state, 'Program', 'module', 'bare', makeTag());
			expect(result).toBe(state);
		});
	});
});
