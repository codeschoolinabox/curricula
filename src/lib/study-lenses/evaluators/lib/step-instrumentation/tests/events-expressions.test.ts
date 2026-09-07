import { describe, expect, it } from 'vitest';

import traceInNode from './pipeline-harness.js';

describe('the split and the expression layer', () => {
	it.skip("a resolve is the next event on its expression's nodePath", () => {
		const { events } = traceInNode('1 + 2;');
		const operatorIndex = events.findIndex(
			(event) => event.category === 'operator',
		);
		expect(events[operatorIndex + 1]).toMatchObject({
			semantics: 'resolve',
			nodePath: (events[operatorIndex] as { nodePath: string }).nodePath,
		});
	});

	it.skip('dependent false frees resolves', () => {
		const { events } = traceInNode('1 + 2;', {
			expression: false,
			resolve: { dependent: false },
		});
		expect(events.some((event) => event.semantics === 'resolve')).toBe(true);
	});

	it.skip('subkind gates bake per operator', () => {
		const { events } = traceInNode('1 + 2; 3 < 4;', {
			expression: { operators: { comparison: false } },
		});
		expect(
			events
				.filter((event) => event.category === 'operator')
				.map((event) => (event as { subkind: string }).subkind),
		).toEqual(['addition']);
	});

	it.skip('a sequence expression events under comma', () => {
		const { events } = traceInNode('(1, 2);');
		expect(
			events.some(
				(event) =>
					event.category === 'operator' &&
					(event as { subkind?: string }).subkind === 'comma',
			),
		).toBe(true);
	});

	it.skip('an array literal events with its kind', () => {
		const { events } = traceInNode('[1, 2];');
		expect(
			events.some(
				(event) =>
					event.category === 'literal' &&
					(event as { kind: string }).kind === 'array',
			),
		).toBe(true);
	});

	it.skip("a template's begin, evaluations, and end share its one site", () => {
		const { events } = traceInNode('const n = 1; `a${n}b`;');
		const templateEvents = events.filter(
			(event) => event.category === 'template',
		);
		expect(
			new Set(
				templateEvents.map((event) => (event as { nodePath: string }).nodePath),
			).size,
		).toBe(1);
	});

	it.skip('a doWhile body events before its first test', () => {
		const { events } = traceInNode(
			'let i = 0; do { i = i + 1; } while (i < 1);',
		);
		const doEvent = events.find(
			(event) =>
				event.category === 'loop' &&
				(event as { event: string }).event === 'do',
		);
		const test = events.find(
			(event) =>
				event.category === 'loop' &&
				(event as { event: string }).event === 'test',
		);
		expect((doEvent as { step: number }).step).toBeLessThan(
			(test as { step: number }).step,
		);
	});

	it.skip('an if test carries its value and coerced result', () => {
		const { events } = traceInNode('if ("truthy") { 1; }');
		const test = events.find(
			(event) =>
				event.category === 'conditional' &&
				(event as { event: string }).event === 'test',
		);
		expect(test).toMatchObject({
			value: { type: 'string', value: 'truthy' },
			result: true,
		});
	});

	it.skip('a break events with its target', () => {
		const { events } = traceInNode('while (true) { break; }');
		const jump = events.find((event) => event.category === 'jump');
		expect(jump).toMatchObject({ kind: 'break', target: 'while' });
	});

	it.skip('a this read events with its resolved value', () => {
		const { events } = traceInNode('this;');
		expect(
			events.some(
				(event) =>
					event.category === 'this' &&
					(event as { event: string }).event === 'read',
			),
		).toBe(true);
	});

	it.skip('a return statement events with its written value', () => {
		const { events } = traceInNode('function f() { return 7; } f();');
		const returnEvent = events.find(
			(event) =>
				event.category === 'function' &&
				(event as { event: string }).event === 'return',
		);
		expect(returnEvent).toMatchObject({ value: { type: 'number', value: 7 } });
	});

	it.skip('a method call reports access then call', () => {
		const { events } = traceInNode(
			'const o = { m: function () { return 1; } }; o.m();',
		);
		const propertyIndex = events.findIndex(
			(event) => event.category === 'property',
		);
		const callIndex = events.findIndex(
			(event) =>
				event.category === 'function' &&
				(event as { event: string }).event === 'call',
		);
		expect(propertyIndex).toBeLessThan(callIndex);
	});

	it.skip('nested expressions each report once', () => {
		const { events } = traceInNode('(1 + 2) * 3;');
		expect(
			events.filter((event) => event.category === 'operator'),
		).toHaveLength(2);
	});

	it.skip("a return's value is faithful", () => {
		const { events } = traceInNode('function f() { return 7; "DEAD"; } f();');
		expect(
			events.some(
				(event) =>
					event.semantics === 'resolve' &&
					event.value.type === 'string' &&
					event.value.value === 'DEAD',
			),
		).toBe(false);
	});

	it.skip("continue semantics per r8's ruling", () => {
		const { events } = traceInNode(
			'let hits = 0; for (let i = 0; i < 3; i = i + 1) { if (i === 1) { continue; } hits = hits + 1; }',
		);
		expect(
			events.findLast(
				(event) =>
					event.category === 'assignment' &&
					(event as { target: string }).target === 'hits',
			),
		).toMatchObject({ value: { type: 'number', value: 2 } });
	});

	it.skip("let capture per r8's ruling", () => {
		const { events } = traceInNode(
			'const fs = []; for (let i = 0; i < 3; i = i + 1) { fs.push(function () { return i; }); } fs[0]();',
		);
		expect(
			events.findLast((event) => event.semantics === 'resolve'),
		).toMatchObject({ value: { type: 'number', value: 0 } });
	});

	it.skip('postfix returns old value', () => {
		const { events } = traceInNode('let n = 5; n++;');
		const increment = events.find(
			(event) =>
				event.semantics === 'resolve' &&
				(event as { kind: string }).kind === 'increment',
		);
		expect(increment).toMatchObject({ value: { type: 'number', value: 5 } });
	});

	it.skip('prefix returns new value', () => {
		const { events } = traceInNode('let n = 5; ++n;');
		const increment = events.find(
			(event) =>
				event.semantics === 'resolve' &&
				(event as { kind: string }).kind === 'increment',
		);
		expect(increment).toMatchObject({ value: { type: 'number', value: 6 } });
	});

	it.skip('string increment stores native ToNumeric', () => {
		const { events } = traceInNode('let s = "5"; s++; s;');
		expect(
			events.findLast((event) => event.semantics === 'resolve'),
		).toMatchObject({ value: { type: 'number', value: 6 } });
	});

	it.skip('a sync arrow reports define', () => {
		const { events } = traceInNode('const f = () => 1;');
		expect(
			events.some(
				(event) =>
					event.category === 'function' &&
					(event as { event: string }).event === 'define' &&
					(event as { arrow?: true }).arrow === true,
			),
		).toBe(true);
	});

	it.skip('an async arrow stays async', () => {
		const { events } = traceInNode('const p = (async () => 1)();');
		expect(
			events.some(
				(event) =>
					event.semantics === 'resolve' &&
					event.value.type === 'object' &&
					(event.value as { className?: string }).className === 'Promise',
			),
		).toBe(true);
	});

	it.skip('a function expression reports define', () => {
		const { events } = traceInNode('const f = function named() {};');
		const define = events.find(
			(event) =>
				event.category === 'function' &&
				(event as { event: string }).event === 'define',
		);
		expect(define).toMatchObject({ name: 'named' });
	});

	it.skip("an assignment's LHS identifier yields no read step; its computed key does", () => {
		const { events } = traceInNode('const a = [0]; let k = 0; a[k] = 1;');
		expect(
			events.some(
				(event) =>
					event.category === 'variable' &&
					(event as { event: string }).event === 'read' &&
					(event as { name: string }).name === 'k',
			),
		).toBe(true);
	});

	it.skip("a typo'd method call's error shape per r8(xi)", () => {
		const { thrown } = traceInNode('const o = {}; o.missing();');
		expect(String((thrown as Error).message)).toContain(
			'o.missing is not a function',
		);
	});

	it.skip('a non-null optional call keeps its receiver', () => {
		const { events } = traceInNode(
			'const o = { m: function () { return this === o; } }; o.m();',
		);
		expect(
			events.some(
				(event) =>
					event.semantics === 'resolve' &&
					event.value.type === 'boolean' &&
					event.value.value === true,
			),
		).toBe(true);
	});

	it.skip('a shortCircuited operator says so outright', () => {
		const { events } = traceInNode('true || missing;');
		const operator = events.find(
			(event) =>
				event.category === 'operator' &&
				(event as { kind: string }).kind === 'shortCircuiting',
		);
		expect(operator).toMatchObject({ shortCircuited: true });
	});
});
