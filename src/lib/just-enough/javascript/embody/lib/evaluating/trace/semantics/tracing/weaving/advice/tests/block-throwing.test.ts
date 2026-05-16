import { describe, expect, it } from 'vitest';

import blockThrowing from '../block-throwing.js';

import type { TracerState, ScopeInfo } from '../../types.js';
import type { JejTag } from '../../types.js';

function makeTag(): JejTag {
	return { loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } }, node: 'Program', source: '' };
}

function makeScope(overrides: Partial<ScopeInfo> = {}): ScopeInfo {
	return { creationStep: 1, depth: 0, kind: 'module', structure: null, structureStep: null, variables: {}, ...overrides };
}

function makeState(overrides: Partial<TracerState> = {}): TracerState {
	return {
		trace: [], step: 1, scopeStack: [makeScope()], iterationCounters: {},
		lastExpressionResult: null, previousExpressionResult: null, lastReadValues: {},
		config: { scopes: { kind: { module: true }, events: { interrupt: true } } },
		...overrides,
	};
}

describe('blockThrowing', () => {
	it('returns the error value', () => {
		const state = makeState();
		const error = new Error('test');
		const result = blockThrowing(state, error, 'Program', 'module', 'bare', makeTag());
		expect(result).toBe(error);
	});

	it('returns error even when config is empty', () => {
		const state = makeState({ config: {} });
		const error = new Error('test');
		expect(blockThrowing(state, error, 'Program', 'module', 'bare', makeTag())).toBe(error);
	});

	it('emits ScopeEvent(interrupt) when gate is open', () => {
		const state = makeState();
		blockThrowing(state, new Error('test'), 'Program', 'module', 'bare', makeTag());
		expect(state.trace).toHaveLength(1);
		expect((state.trace[0] as Record<string, unknown>).event).toBe('interrupt');
	});

	it('does not emit when gate is closed', () => {
		const state = makeState({ config: {} });
		blockThrowing(state, new Error('test'), 'Program', 'module', 'bare', makeTag());
		expect(state.trace).toHaveLength(0);
	});
});
