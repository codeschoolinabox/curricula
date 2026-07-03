import { describe, expect, it } from 'vitest';

import blockBefore from '../block-before.js';

import type { TracerState, ScopeInfo } from '../../types.js';
import type { JejTag } from '../../types.js';

function makeTag(overrides: Partial<JejTag> = {}): JejTag {
	return {
		loc: { start: { line: 5, column: 0 }, end: { line: 5, column: 20 } },
		node: 'WhileStatement',
		source: 'while (x < 5) {}',
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
		step: 2,
		scopeStack: [
			makeScope(),
			makeScope({ creationStep: 2, depth: 1, kind: 'block' }),
		],
		iterationCounters: {},
		lastExpressionResult: null,
		previousExpressionResult: null,
		lastReadValues: {},
		config: {
			scopes: { kind: { block: true, module: true }, events: { enter: true } },
			controlFlow: {
				kind: { conditionals: true, loops: { while: true, doWhile: true } },
				events: { branch: true, iteration: true, do: true },
			},
		},
		...overrides,
	};
}

describe('blockBefore', () => {
	describe('ScopeEvent(enter)', () => {
		it('emits ScopeEvent(enter) when gate is open', () => {
			const state = makeState();
			blockBefore(state, 'Program', 'block', 'bare', makeTag());
			const enterEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => e.category === 'scope' && e.event === 'enter',
			);
			expect(enterEvents).toHaveLength(1);
		});

		it('does not emit when scope gate is closed', () => {
			const state = makeState({ config: {} });
			blockBefore(state, 'Program', 'block', 'bare', makeTag());
			expect(state.trace).toHaveLength(0);
		});
	});

	describe('BranchEvent', () => {
		it('emits consequent branch for then segment', () => {
			const state = makeState();
			blockBefore(
				state,
				'IfStatement',
				'block',
				'then',
				makeTag({ node: 'IfStatement' }),
			);
			const branchEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => e.category === 'conditional' && e.event === 'branch',
			);
			expect(branchEvents).toHaveLength(1);
			expect(branchEvents[0].branch).toBe('consequent');
		});

		it('emits alternate branch for else segment', () => {
			const state = makeState();
			blockBefore(
				state,
				'IfStatement',
				'block',
				'else',
				makeTag({ node: 'IfStatement' }),
			);
			const branchEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => e.category === 'conditional' && e.event === 'branch',
			);
			expect(branchEvents[0].branch).toBe('alternate');
		});

		it('does not emit branch when controlFlow gate is closed', () => {
			const state = makeState({ config: {} });
			blockBefore(state, 'IfStatement', 'block', 'then', makeTag());
			const branchEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => (e as Record<string, unknown>).event === 'branch',
			);
			expect(branchEvents).toHaveLength(0);
		});
	});

	describe('IterationEvent', () => {
		it('emits IterationEvent for while segment', () => {
			const state = makeState();
			blockBefore(
				state,
				'WhileStatement',
				'block',
				'while',
				makeTag({ loopKind: 'while' }),
			);
			const iterEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => e.category === 'loop' && e.event === 'iteration',
			);
			expect(iterEvents).toHaveLength(1);
		});

		it('iteration index starts at 0', () => {
			const state = makeState();
			blockBefore(
				state,
				'WhileStatement',
				'block',
				'while',
				makeTag({ loopKind: 'while' }),
			);
			const iterEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => e.event === 'iteration',
			);
			expect(iterEvents[0].index).toBe(0);
		});

		it('increments iteration counter', () => {
			const state = makeState();
			const tag = makeTag({ loopKind: 'while' });
			blockBefore(state, 'WhileStatement', 'block', 'while', tag);
			expect(state.iterationCounters['5:0']).toBe(1);
		});

		it('counter increments across calls', () => {
			const state = makeState();
			const tag = makeTag({ loopKind: 'while' });
			blockBefore(state, 'WhileStatement', 'block', 'while', tag);
			blockBefore(state, 'WhileStatement', 'block', 'while', tag);
			expect(state.iterationCounters['5:0']).toBe(2);
		});
	});

	describe('DoEvent', () => {
		it('emits DoEvent for doWhile loops', () => {
			const state = makeState();
			blockBefore(
				state,
				'WhileStatement',
				'block',
				'while',
				makeTag({ loopKind: 'doWhile' }),
			);
			const doEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => e.category === 'loop' && e.event === 'do',
			);
			expect(doEvents).toHaveLength(1);
		});

		it('does not emit DoEvent for while loops', () => {
			const state = makeState();
			blockBefore(
				state,
				'WhileStatement',
				'block',
				'while',
				makeTag({ loopKind: 'while' }),
			);
			const doEvents = (state.trace as Record<string, unknown>[]).filter(
				(e) => e.event === 'do',
			);
			expect(doEvents).toHaveLength(0);
		});
	});

	describe('loop guard', () => {
		it('throws RangeError when maxIterations exceeded', () => {
			const state = makeState({ config: { maxIterations: 2 } });
			const tag = makeTag({ loopKind: 'while' });
			blockBefore(state, 'WhileStatement', 'block', 'while', tag);
			blockBefore(state, 'WhileStatement', 'block', 'while', tag);
			expect(() =>
				blockBefore(state, 'WhileStatement', 'block', 'while', tag),
			).toThrow(RangeError);
		});

		it('does not throw when under limit', () => {
			const state = makeState({ config: { maxIterations: 10 } });
			const tag = makeTag({ loopKind: 'while' });
			expect(() =>
				blockBefore(state, 'WhileStatement', 'block', 'while', tag),
			).not.toThrow();
		});

		it('does not throw when maxIterations is not configured', () => {
			const state = makeState({ config: {} });
			const tag = makeTag({ loopKind: 'while' });
			blockBefore(state, 'WhileStatement', 'block', 'while', tag);
			blockBefore(state, 'WhileStatement', 'block', 'while', tag);
			expect(() =>
				blockBefore(state, 'WhileStatement', 'block', 'while', tag),
			).not.toThrow();
		});
	});
});
