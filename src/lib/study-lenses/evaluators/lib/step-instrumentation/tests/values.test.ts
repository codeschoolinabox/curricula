import { describe, expect, it } from 'vitest';

import describeValue from '../runtime/describe.js';
import representValue from '../runtime/represent-value.js';
import type { ResolveEvent } from '../types.js';
import undescribe from '../undescribe.js';

import traceInNode from './pipeline-harness.js';

describe('ValueRepresentation', () => {
	it.skip('NaN, negative zero, and bigint survive representation', () => {
		expect([
			representValue(Number.NaN),
			representValue(-0),
			representValue(5n),
		]).toEqual([
			{ type: 'number', value: Number.NaN, isNaN: true },
			{ type: 'number', value: -0, isNegative: true },
			{ type: 'bigint', value: '5' },
		]);
	});

	it.skip('an Error represents name and message', () => {
		expect(representValue(new TypeError('boom'))).toEqual({
			type: 'error',
			name: 'TypeError',
			message: 'boom',
		});
	});

	it.skip('Symbol() carries description undefined', () => {
		expect(representValue(Symbol())).toEqual({
			type: 'symbol',
			description: undefined,
		});
	});

	it.skip("a resolve carries its expression's value", () => {
		const { events } = traceInNode('1 + 2;');
		expect(
			events.some(
				(event) =>
					event.semantics === 'resolve' &&
					event.value.type === 'number' &&
					event.value.value === 3,
			),
		).toBe(true);
	});

	it.skip('a resolve carries represented undefined', () => {
		const { events } = traceInNode('let u; u;');
		expect(
			events.some(
				(event) =>
					event.semantics === 'resolve' && event.value.type === 'undefined',
			),
		).toBe(true);
	});

	it.skip('a reassigned Promise does not undo promise classification', () => {
		const { events } = traceInNode(
			'Promise = function fake() {}; Promise.resolve;',
			{ data: { scopes: false } },
		);
		expect(events.length).toBeGreaterThan(0);
	});
});

describe('the deep snapshot codec', () => {
	it.skip("a scope snapshot carries the binding's value at that step", () => {
		const { events } = traceInNode('let a = 1; a = 2; a;');
		const firstRead = events.find(
			(event): event is ResolveEvent =>
				event.semantics === 'resolve' && event.scopes !== undefined,
		);
		expect(firstRead?.scopes?.[0]?.a).toBeDefined();
	});

	it.skip('a TDZ binding snapshots unreadable-tdz', () => {
		const { events } = traceInNode('let early = 1; let late = 2;');
		const beforeLate = events.find(
			(event): event is ResolveEvent =>
				event.semantics === 'resolve' && event.scopes !== undefined,
		);
		expect(beforeLate?.scopes?.[0]?.late).toEqual({ unreadable: 'tdz' });
	});

	it.skip('a var binding honestly snapshots undefined', () => {
		const { events } = traceInNode('let first = 1; var v = 2;');
		const beforeV = events.find(
			(event): event is ResolveEvent =>
				event.semantics === 'resolve' && event.scopes !== undefined,
		);
		expect(beforeV?.scopes?.[0]?.v).toMatchObject({
			described: [{ category: 'primitive', type: 'undefined' }, []],
		});
	});

	it.skip('a getter-bearing literal snapshots without invoking the getter', () => {
		const { thrown } = traceInNode('const o = { get g() { return o.g; } }; o;');
		expect(thrown).toBeUndefined();
	});

	it.skip('a bigint describes faithfully', () => {
		expect(describeValue(10n)[0]).toEqual({
			category: 'primitive',
			type: 'bigint',
			value: '10',
		});
	});

	it.skip('a null-prototype object describes without crashing', () => {
		expect(() => describeValue(Object.create(null))).not.toThrow();
	});

	it.skip('an Error describes at least name and message', () => {
		const [, heap] = describeValue(new RangeError('deep'));
		expect(heap[0]).toMatchObject({
			type: 'error',
			name: 'RangeError',
			message: 'deep',
		});
	});

	it.skip('a cyclic object survives describe', () => {
		const a: Record<string, unknown> = {};
		a.self = a;
		expect(() => describeValue(a)).not.toThrow();
	});

	it.skip('two refs to one object share a heap slot', () => {
		const shared = { tag: 1 };
		const [, heap] = describeValue({ left: shared, right: shared });
		expect(heap).toHaveLength(2);
	});

	it.skip('snapshots carry own-enumerable string keys only', () => {
		const value: Record<string, number> = { visible: 1 };
		Object.defineProperty(value, 'hidden', { value: 2, enumerable: false });
		const [, heap] = describeValue(value);
		expect(heap[0]?.entries.map(([key]) => key)).toEqual(['visible']);
	});

	it.skip('a traced function value arrives as a callable fake', () => {
		const revived = undescribe(describeValue(function real() {}));
		expect(typeof revived).toBe('function');
	});

	it.skip("a class instance's constructor name survives", () => {
		// eslint-disable-next-line functional/no-classes -- the case under test IS a class instance's constructor name
		class Species {}
		const revived = undescribe(describeValue(new Species()));
		expect((revived as object).constructor.name).toBe('Species');
	});

	it.skip('constructor identity does not bridge undescribe calls', () => {
		// eslint-disable-next-line functional/no-classes -- the case under test IS cross-call constructor identity
		class Twice {}
		const first = undescribe(describeValue(new Twice()));
		const second = undescribe(describeValue(new Twice()));
		expect((first as object).constructor).not.toBe(
			(second as object).constructor,
		);
	});
});

describe('logs and dt', () => {
	it.skip('logs attach to the next step', () => {
		const { events } = traceInNode('console.log("line"); let x = 1;');
		expect(
			events.some((event) =>
				event.semantics === 'resolve' && event.logs !== undefined
					? event.logs.length > 0
					: false,
			),
		).toBe(true);
	});

	it.skip('logged objects snapshot at log time', () => {
		const { events } = traceInNode(
			'const o = { n: 1 }; console.log(o.n); o.n = 2; o.n;',
		);
		const logged = events.find(
			(event): event is ResolveEvent =>
				event.semantics === 'resolve' && Boolean(event.logs?.length),
		);
		expect(logged?.logs?.[0]?.[0]).toEqual({ type: 'number', value: 1 });
	});

	it.skip('logs on filtered steps re-attach', () => {
		const { events } = traceInNode('console.log("kept"); let x = 1; x;', {
			statements: { expressionStatement: false },
		});
		expect(
			events.some((event) =>
				event.semantics === 'resolve' ? Boolean(event.logs?.length) : false,
			),
		).toBe(true);
	});

	it.skip('logs presence per event kind at defaults', () => {
		const { events } = traceInNode('let x = 1;');
		const anchor = events[0];
		expect((anchor as { logs?: unknown }).logs).toBeUndefined();
	});

	it.skip('dt is monotonic non-decreasing', () => {
		const { events } = traceInNode('1; 2; 3;');
		const dts = events
			.filter((event) => event.semantics === 'resolve')
			.map((event) => event.dt ?? 0);
		expect(dts.toSorted((left, right) => left - right)).toEqual(dts);
	});
});
