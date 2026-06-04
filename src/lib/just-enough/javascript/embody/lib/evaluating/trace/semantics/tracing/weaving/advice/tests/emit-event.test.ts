import { describe, expect, it } from 'vitest';

import emitEvent from '../emit-event.js';

import type { TracerState } from '../../types.js';
import type { JejTag } from '../../types.js';

function makeState(): TracerState {
	return {
		trace: [],
		step: 0,
		scopeStack: [],
		iterationCounters: {},
		lastExpressionResult: null,
		previousExpressionResult: null,
		lastReadValues: {},
		config: { literals: { string: true } },
	};
}

function makeTag(): JejTag {
	return {
		loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 5 } },
		node: 'Literal',
		source: '"hi"',
	};
}

describe('emitEvent', () => {
	it('increments step', () => {
		const state = makeState();
		emitEvent(state, makeTag(), 'expression', 'literals.string', {
			kind: 'string',
			value: { type: 'string', value: 'hi' },
		});
		expect(state.step).toBe(1);
	});

	it('pushes event to trace', () => {
		const state = makeState();
		emitEvent(state, makeTag(), 'expression', 'literals.string', {
			kind: 'string',
			value: { type: 'string', value: 'hi' },
		});
		expect(state.trace).toHaveLength(1);
	});

	it('event has correct semantics', () => {
		const state = makeState();
		emitEvent(state, makeTag(), 'expression', 'literals.string', {
			kind: 'string',
			value: { type: 'string', value: 'hi' },
		});
		const event = state.trace[0] as Record<string, unknown>;
		expect(event.semantics).toBe('expression');
	});

	it('event has correct loc from tag', () => {
		const state = makeState();
		const tag = makeTag();
		emitEvent(state, tag, 'expression', 'literals.string', {
			kind: 'string',
			value: { type: 'string', value: 'hi' },
		});
		const event = state.trace[0] as Record<string, unknown>;
		expect(event.loc).toEqual(tag.loc);
	});

	it('event has correct node from tag', () => {
		const state = makeState();
		emitEvent(state, makeTag(), 'expression', 'literals.string', {
			kind: 'string',
			value: { type: 'string', value: 'hi' },
		});
		const event = state.trace[0] as Record<string, unknown>;
		expect(event.node).toBe('Literal');
	});

	it('event has correct source from tag', () => {
		const state = makeState();
		emitEvent(state, makeTag(), 'expression', 'literals.string', {
			kind: 'string',
			value: { type: 'string', value: 'hi' },
		});
		const event = state.trace[0] as Record<string, unknown>;
		expect(event.source).toBe('"hi"');
	});

	it('increments step for each call', () => {
		const state = makeState();
		const payload = {
			kind: 'string' as const,
			value: { type: 'string' as const, value: 'a' },
		};
		emitEvent(state, makeTag(), 'expression', 'literals.string', payload);
		emitEvent(state, makeTag(), 'expression', 'literals.string', payload);
		expect(state.step).toBe(2);
	});

	it('calls onEvent when set', () => {
		const state = makeState();
		const received: unknown[] = [];
		state.onEvent = (event) => received.push(event);
		emitEvent(state, makeTag(), 'expression', 'literals.string', {
			kind: 'string',
			value: { type: 'string', value: 'hi' },
		});
		expect(received).toHaveLength(1);
	});

	it('onEvent receives the same event as trace', () => {
		const state = makeState();
		let receivedEvent: unknown = null;
		state.onEvent = (event) => {
			receivedEvent = event;
		};
		emitEvent(state, makeTag(), 'expression', 'literals.string', {
			kind: 'string',
			value: { type: 'string', value: 'hi' },
		});
		expect(receivedEvent).toBe(state.trace[0]);
	});

	it('does not throw when onEvent is not set', () => {
		const state = makeState();
		expect(() =>
			emitEvent(state, makeTag(), 'expression', 'literals.string', {
				kind: 'string',
				value: { type: 'string', value: 'hi' },
			}),
		).not.toThrow();
	});
});
