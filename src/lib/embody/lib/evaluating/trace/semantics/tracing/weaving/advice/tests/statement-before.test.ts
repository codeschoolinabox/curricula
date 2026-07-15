import { describe, expect, it } from 'vitest';

import statementBefore from '../statement-before.js';

import type { TracerState, ScopeInfo } from '../../types.js';
import type { JejTag } from '../../types.js';

function makeTag(overrides: Partial<JejTag> = {}): JejTag {
	return {
		loc: { start: { line: 3, column: 2 }, end: { line: 3, column: 8 } },
		node: 'BreakStatement',
		source: 'break;',
		jumpTarget: 'while',
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
		step: 5,
		scopeStack: [
			makeScope(),
			makeScope({
				creationStep: 3,
				depth: 1,
				kind: 'block',
				structure: 'while',
			}),
		],
		iterationCounters: {},
		lastExpressionResult: null,
		previousExpressionResult: null,
		lastReadValues: {},
		config: {
			controlFlow: { kind: { loops: { while: true } }, events: { jump: true } },
		},
		...overrides,
	};
}

describe('statementBefore', () => {
	describe('break', () => {
		it('emits JumpEvent for break', () => {
			const state = makeState();
			statementBefore(state, 'jump', 'break', null, makeTag());
			expect(state.trace).toHaveLength(1);
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.category).toBe('jump');
			expect(event.event).toBe('jump');
		});

		it('event has kind break', () => {
			const state = makeState();
			statementBefore(state, 'jump', 'break', null, makeTag());
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.kind).toBe('break');
		});

		it('event has correct target', () => {
			const state = makeState();
			statementBefore(
				state,
				'jump',
				'break',
				null,
				makeTag({ jumpTarget: 'while' }),
			);
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.target).toBe('while');
		});
	});

	describe('continue', () => {
		it('emits JumpEvent with kind continue', () => {
			const state = makeState();
			statementBefore(state, 'jump', 'continue', null, makeTag());
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.kind).toBe('continue');
		});
	});

	describe('labels', () => {
		it('includes label when present', () => {
			const state = makeState();
			statementBefore(state, 'jump', 'break', 'myLabel', makeTag());
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.label).toBe('myLabel');
		});

		it('omits label when null', () => {
			const state = makeState();
			statementBefore(state, 'jump', 'break', null, makeTag());
			const event = state.trace[0] as Record<string, unknown>;
			expect(event.label).toBeUndefined();
		});
	});

	describe('config gating', () => {
		it('does not emit when controlFlow gate is closed', () => {
			const state = makeState({ config: {} });
			statementBefore(state, 'jump', 'break', null, makeTag());
			expect(state.trace).toHaveLength(0);
		});
	});
});
