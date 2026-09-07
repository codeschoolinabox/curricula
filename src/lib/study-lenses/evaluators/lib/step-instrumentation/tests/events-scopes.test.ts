import { describe, expect, it } from 'vitest';

import traceInNode from './pipeline-harness.js';

describe('the scope lifecycle', () => {
	it.skip('a block scope creates then enters', () => {
		const { events } = traceInNode('{ let inner = 1; }');
		const blockEvents = events.filter(
			(event) => event.category === 'scope' && event.kind === 'block',
		);
		expect(
			blockEvents
				.slice(0, 2)
				.map((event) => (event as { event: string }).event),
		).toEqual(['create', 'enter']);
	});

	it.skip('a for scope pushes per iteration', () => {
		const { events } = traceInNode('for (let i = 0; i < 2; i = i + 1) { i; }');
		expect(
			events.filter(
				(event) =>
					event.category === 'scope' &&
					event.kind === 'for' &&
					(event as { event: string }).event === 'create',
			),
		).toHaveLength(2);
	});

	it.skip('a function scope pushes per call', () => {
		const { events } = traceInNode('function f() {} f(); f();');
		expect(
			events.filter(
				(event) =>
					event.category === 'scope' &&
					event.kind === 'function' &&
					(event as { event: string }).event === 'create',
			),
		).toHaveLength(2);
	});

	it.skip('a break emits its pop reason before the jump', () => {
		const { events } = traceInNode('while (true) { break; } "after";');
		const pop = events.find(
			(event) =>
				event.category === 'scope' &&
				(event as { reason?: string }).reason === 'break',
		);
		const jump = events.find((event) => event.category === 'jump');
		expect((pop as { step: number }).step).toBeLessThan(
			(jump as { step: number }).step,
		);
	});

	it.skip('a catch scope creates on the caught path', () => {
		const { events } = traceInNode('try { missing; } catch (error) { error; }');
		expect(
			events.some(
				(event) => event.category === 'scope' && event.kind === 'catch',
			),
		).toBe(true);
	});

	it.skip('a scope declare burst carries every binding at entry', () => {
		const { events } = traceInNode('let a = 1; var b = 2;');
		const declares = events.filter(
			(event) =>
				event.category === 'variable' &&
				(event as { event: string }).event === 'declare',
		);
		expect(
			declares
				.map((event) => (event as { name: string }).name)
				.toSorted((left, right) => left.localeCompare(right)),
		).toEqual(['a', 'b']);
	});
});
