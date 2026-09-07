import { describe, expect, it } from 'vitest';

import traceInNode from './pipeline-harness.js';

describe('the binding lifecycle', () => {
	it.skip('a let binding declares into the TDZ then initializes at its line', () => {
		const { events } = traceInNode('let x = 5;');
		expect(
			events
				.filter((event) => event.category === 'variable' && event.name === 'x')
				.map((event) => (event as { event: string }).event),
		).toEqual(['declare', 'initialize', 'available']);
	});

	it.skip('a var binding initializes undefined at scope entry', () => {
		const { events } = traceInNode('var v = 9;');
		const initialize = events.find(
			(event) =>
				event.category === 'variable' &&
				(event as { event: string }).event === 'initialize' &&
				event.name === 'v',
		);
		expect(initialize).toMatchObject({
			kind: 'var',
			explicit: false,
			value: { type: 'undefined' },
		});
	});

	it.skip('a function declaration initializes to its function at scope entry', () => {
		const { events } = traceInNode('function f() {} f;');
		const initialize = events.find(
			(event) =>
				event.category === 'variable' &&
				(event as { event: string }).event === 'initialize' &&
				event.name === 'f',
		);
		expect(initialize).toMatchObject({
			kind: 'function',
			value: { type: 'function' },
		});
	});

	it.skip('a function declaration emits no statement event at its line', () => {
		const { events } = traceInNode('function g() { return 1; }');
		expect(
			events.some(
				(event) =>
					event.semantics === 'statement' &&
					event.type === 'FunctionDeclaration',
			),
		).toBe(false);
	});

	it.skip('a param binding initializes to its argument', () => {
		const { events } = traceInNode('function f(x) { return x; } f(2);');
		const initialize = events.find(
			(event) =>
				event.category === 'variable' &&
				(event as { event: string }).event === 'initialize' &&
				event.name === 'x',
		);
		expect(initialize).toMatchObject({
			kind: 'param',
			value: { type: 'number', value: 2 },
		});
	});

	it.skip('a read event pairs with a resolve carrying the value', () => {
		const { events } = traceInNode('let a = 3; a;');
		const readIndex = events.findIndex(
			(event) =>
				event.category === 'variable' &&
				(event as { event: string }).event === 'read',
		);
		expect(events[readIndex + 1]).toMatchObject({
			semantics: 'resolve',
			value: { type: 'number', value: 3 },
		});
	});

	it.skip('an assignment fires the operator view and the binding view on one nodePath', () => {
		const { events } = traceInNode('let a = 1; a = 2;');
		const assignment = events.find((event) => event.category === 'assignment');
		const update = events.find(
			(event) =>
				event.category === 'variable' &&
				(event as { event: string }).event === 'update',
		);
		expect((assignment as { nodePath: string }).nodePath).toBe(
			(update as { nodePath: string }).nodePath,
		);
	});
});
