/**
 * @file Layer 5: template literal + property access event correctness.
 *
 * Verifies template lifecycle (begin/evaluation/end) with cross-references,
 * and property access events with correct key/value through the full
 * Worker pipeline.
 */

import { describe, expect, it, vi } from 'vitest';

import { ALL_ENABLED, drainGenerator } from './test-helpers.js';

vi.setConfig({ testTimeout: 60000 });

describe('template event correctness', () => {
	it('template literal produces begin-evaluation-end in order', async () => {
		const { events } = await drainGenerator(
			'let name = \'world\';\nlet g = `hello ${name}`;\n', ALL_ENABLED,
		);
		const templateEvents = events.filter((e) => e.category === 'template');
		const eventTypes = templateEvents.map((e) => (e as Record<string, unknown>).event);

		expect(eventTypes).toContain('begin');
		expect(eventTypes).toContain('evaluation');
		expect(eventTypes).toContain('end');
		expect(eventTypes.indexOf('begin')).toBeLessThan(eventTypes.indexOf('evaluation'));
		expect(eventTypes.indexOf('evaluation')).toBeLessThan(eventTypes.indexOf('end'));
	});

	it('begin event has expressionCount 1', async () => {
		const { events } = await drainGenerator(
			'let name = \'world\';\nlet g = `hello ${name}`;\n', ALL_ENABLED,
		);
		const begin = events.find(
			(e) => e.category === 'template' && (e as Record<string, unknown>).event === 'begin',
		) as Record<string, unknown>;

		expect(begin.expressionCount).toBe(1);
	});

	it('evaluation event has index 0 and beginStep cross-reference', async () => {
		const { events } = await drainGenerator(
			'let name = \'world\';\nlet g = `hello ${name}`;\n', ALL_ENABLED,
		);
		const begin = events.find(
			(e) => e.category === 'template' && (e as Record<string, unknown>).event === 'begin',
		)!;
		const evaluation = events.find(
			(e) => e.category === 'template' && (e as Record<string, unknown>).event === 'evaluation',
		) as Record<string, unknown>;

		expect(evaluation.index).toBe(0);
		expect(evaluation.beginStep).toBeDefined();
	});

	it('end event has final assembled string value', async () => {
		const { events } = await drainGenerator(
			'let name = \'world\';\nlet g = `hello ${name}`;\n', ALL_ENABLED,
		);
		const end = events.find(
			(e) => e.category === 'template' && (e as Record<string, unknown>).event === 'end',
		) as Record<string, unknown>;

		expect(end.value).toEqual({ type: 'string', value: 'hello world' });
	});

	it('end event has beginStep cross-reference', async () => {
		const { events } = await drainGenerator(
			'let name = \'world\';\nlet g = `hello ${name}`;\n', ALL_ENABLED,
		);
		const begin = events.find(
			(e) => e.category === 'template' && (e as Record<string, unknown>).event === 'begin',
		)!;
		const end = events.find(
			(e) => e.category === 'template' && (e as Record<string, unknown>).event === 'end',
		) as Record<string, unknown>;

		expect(end.beginStep).toBeDefined();
	});

	it('template with 3 expressions has 3 evaluation events', async () => {
		const { events } = await drainGenerator(
			'let a = 1;\nlet b = 2;\nlet r = `${a} + ${b} = ${a + b}`;\n', ALL_ENABLED,
		);
		const evaluations = events.filter(
			(e) => e.category === 'template' && (e as Record<string, unknown>).event === 'evaluation',
		) as Record<string, unknown>[];

		expect(evaluations.length).toBe(3);
	});

	it('evaluation indices are ascending', async () => {
		const { events } = await drainGenerator(
			'let a = 1;\nlet b = 2;\nlet r = `${a} + ${b} = ${a + b}`;\n', ALL_ENABLED,
		);
		const evaluations = events.filter(
			(e) => e.category === 'template' && (e as Record<string, unknown>).event === 'evaluation',
		) as Record<string, unknown>[];
		const indices = evaluations.map((e) => e.index);

		expect(indices).toEqual([0, 1, 2]);
	});
});

describe('property access event correctness', () => {
	it('dot access has kind dot with correct key and value', async () => {
		const { events } = await drainGenerator(
			'let s = \'hello\';\nlet a = s.length;\n', ALL_ENABLED,
		);
		const dotEvents = events.filter(
			(e) => e.category === 'propertyAccess' && (e as Record<string, unknown>).kind === 'dot',
		) as Record<string, unknown>[];

		expect(dotEvents.length).toBeGreaterThan(0);
		expect(dotEvents[0].key).toBe('length');
		expect(dotEvents[0].value).toEqual({ type: 'number', value: 5 });
	});

	it('bracket access has kind bracket with correct key', async () => {
		const { events } = await drainGenerator(
			'let s = \'hello\';\nlet a = s[0];\n', ALL_ENABLED,
		);
		const bracketEvents = events.filter(
			(e) => e.category === 'propertyAccess' && (e as Record<string, unknown>).kind === 'bracket',
		) as Record<string, unknown>[];

		expect(bracketEvents.length).toBeGreaterThan(0);
		expect(bracketEvents[0].value).toEqual({ type: 'string', value: 'h' });
	});

	it('optional chaining on non-null has kind optionalChaining', async () => {
		const { events } = await drainGenerator(
			'let s = \'hello\';\nlet a = s?.length;\n', ALL_ENABLED,
		);
		const optionalEvents = events.filter(
			(e) => e.category === 'propertyAccess' && (e as Record<string, unknown>).kind === 'optionalChaining',
		) as Record<string, unknown>[];

		expect(optionalEvents.length).toBeGreaterThan(0);
		expect(optionalEvents[0].value).toEqual({ type: 'number', value: 5 });
	});

	it('optional chaining on null produces no propertyAccess event', async () => {
		// WHY: Aran short-circuits at the expression level when the base
		// is nullish. No property access occurs, so no event is emitted.
		const { events } = await drainGenerator(
			'let s = null;\nlet a = s?.length;\n', ALL_ENABLED,
		);
		const optionalEvents = events.filter(
			(e) => e.category === 'propertyAccess' && (e as Record<string, unknown>).kind === 'optionalChaining',
		);

		expect(optionalEvents.length).toBe(0);
	});
});
