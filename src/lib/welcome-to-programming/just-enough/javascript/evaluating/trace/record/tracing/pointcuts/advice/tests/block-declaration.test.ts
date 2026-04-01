import { describe, expect, it } from 'vitest';

import blockDeclaration from '../block-declaration.js';

import type { TracerState, ScopeInfo } from '../../types.js';
import type { JejTag } from '../../types.js';

function makeTag(overrides: Partial<JejTag> = {}): JejTag {
	return {
		loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
		node: 'VariableDeclaration',
		source: 'let x = 5',
		bindingKind: 'let',
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
		lastExpressionResult: null,
		config: {
			bindings: {
				kind: { let: true, const: true },
				events: { declare: true, initialize: true, available: true },
			},
		},
		...overrides,
	};
}

describe('blockDeclaration', () => {
	describe('variable registration', () => {
		it('records variable in current scope', () => {
			const state = makeState();
			blockDeclaration(state, { x: 5 }, 'Program', 'module', 'bare', makeTag());
			expect(state.scopeStack[0].variables.x).toBeDefined();
		});

		it('records variable kind', () => {
			const state = makeState();
			blockDeclaration(state, { x: 5 }, 'Program', 'module', 'bare', makeTag({ bindingKind: 'const' }));
			expect(state.scopeStack[0].variables.x.kind).toBe('const');
		});

		it('records declarationStep', () => {
			const state = makeState({ step: 5 });
			blockDeclaration(state, { x: 5 }, 'Program', 'module', 'bare', makeTag());
			expect(state.scopeStack[0].variables.x.declarationStep).toBe(6);
		});

		it('records variables even when config is disabled', () => {
			const state = makeState({ config: {} });
			blockDeclaration(state, { x: 5 }, 'Program', 'module', 'bare', makeTag());
			expect(state.scopeStack[0].variables.x).toBeDefined();
		});

		it('skips Aran parameters', () => {
			const state = makeState();
			blockDeclaration(state, { 'catch.error': null, x: 5 }, 'Program', 'module', 'bare', makeTag());
			expect(state.scopeStack[0].variables['catch.error']).toBeUndefined();
			expect(state.scopeStack[0].variables.x).toBeDefined();
		});
	});

	describe('BindingEvent(declare)', () => {
		it('emits declare event when gate is open', () => {
			const state = makeState();
			blockDeclaration(state, { x: 5 }, 'Program', 'module', 'bare', makeTag());
			const declareEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => e.event === 'declare',
			);
			expect(declareEvents).toHaveLength(1);
		});

		it('does not emit when bindings kind is disabled', () => {
			const state = makeState({
				config: { bindings: { kind: { let: false }, events: { declare: true } } },
			});
			blockDeclaration(state, { x: 5 }, 'Program', 'module', 'bare', makeTag());
			expect(state.trace).toHaveLength(0);
		});

		it('does not emit when declare event is disabled', () => {
			const state = makeState({
				config: { bindings: { kind: { let: true }, events: { declare: false } } },
			});
			blockDeclaration(state, { x: 5 }, 'Program', 'module', 'bare', makeTag());
			expect(state.trace).toHaveLength(0);
		});
	});

	describe('BindingEvent(initialize) and BindingEvent(available)', () => {
		it('emits initialize for non-deadzone values', () => {
			const state = makeState();
			blockDeclaration(state, { x: 5 }, 'Program', 'module', 'bare', makeTag());
			const initEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => e.event === 'initialize',
			);
			expect(initEvents).toHaveLength(1);
		});

		it('emits available for non-deadzone values', () => {
			const state = makeState();
			blockDeclaration(state, { x: 5 }, 'Program', 'module', 'bare', makeTag());
			const availEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => e.event === 'available',
			);
			expect(availEvents).toHaveLength(1);
		});

		it('does not emit initialize for deadzone (symbol) values', () => {
			const state = makeState();
			const deadzone = Symbol('aran.deadzone');
			blockDeclaration(state, { x: deadzone }, 'Program', 'module', 'bare', makeTag());
			const initEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => e.event === 'initialize',
			);
			expect(initEvents).toHaveLength(0);
		});

		it('does not emit available for deadzone values', () => {
			const state = makeState();
			const deadzone = Symbol('aran.deadzone');
			blockDeclaration(state, { x: deadzone }, 'Program', 'module', 'bare', makeTag());
			const availEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => e.event === 'available',
			);
			expect(availEvents).toHaveLength(0);
		});

		it('still emits declare for deadzone values', () => {
			const state = makeState();
			const deadzone = Symbol('aran.deadzone');
			blockDeclaration(state, { x: deadzone }, 'Program', 'module', 'bare', makeTag());
			const declareEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => e.event === 'declare',
			);
			expect(declareEvents).toHaveLength(1);
		});
	});

	describe('multiple variables', () => {
		it('handles multiple variables in one frame', () => {
			const state = makeState();
			blockDeclaration(state, { x: 5, y: 10 }, 'Program', 'module', 'bare', makeTag());
			expect(state.scopeStack[0].variables.x).toBeDefined();
			expect(state.scopeStack[0].variables.y).toBeDefined();
		});
	});
});
