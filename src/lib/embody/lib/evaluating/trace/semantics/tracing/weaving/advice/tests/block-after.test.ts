import { describe, expect, it } from 'vitest';

import blockAfter from '../block-after.js';

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
		lastExpressionResult: null,
		previousExpressionResult: null,
		lastReadValues: {},
		config: {
			scopes: { kind: { module: true }, events: { completion: true } },
		},
		...overrides,
	};
}

describe('blockAfter', () => {
	it('emits ScopeEvent(completion) when gate is open', () => {
		const state = makeState();
		blockAfter(state, 'Program', 'module', 'bare', makeTag());
		expect(state.trace).toHaveLength(1);
		expect((state.trace[0] as Record<string, unknown>).event).toBe(
			'completion',
		);
	});

	it('does not emit when gate is closed', () => {
		const state = makeState({ config: {} });
		blockAfter(state, 'Program', 'module', 'bare', makeTag());
		expect(state.trace).toHaveLength(0);
	});
});
