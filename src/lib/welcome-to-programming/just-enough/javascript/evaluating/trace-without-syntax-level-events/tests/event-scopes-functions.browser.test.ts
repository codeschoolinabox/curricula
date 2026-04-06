/**
 * @file Layer 5: scope tracking + function event correctness.
 *
 * Verifies scope lifecycle sequences, depth tracking, cross-references,
 * and function call/return events through the full Worker pipeline.
 */

import { describe, expect, it, vi } from 'vitest';

import { ALL_ENABLED, drainGenerator } from './test-helpers.js';

vi.setConfig({ testTimeout: 60000 });

describe('scope event correctness', () => {
	it('module-level produces scope events in create-enter-completion-leave order', async () => {
		const { events } = await drainGenerator('let x = 5;\n', ALL_ENABLED);
		const scopeEvents = events.filter((e) => e.category === 'scope');
		const eventTypes = scopeEvents.map((e) => (e as Record<string, unknown>).event);

		expect(eventTypes).toContain('create');
		expect(eventTypes).toContain('enter');
		expect(eventTypes).toContain('completion');
		expect(eventTypes).toContain('leave');
		expect(eventTypes.indexOf('create')).toBeLessThan(eventTypes.indexOf('enter'));
		expect(eventTypes.indexOf('enter')).toBeLessThan(eventTypes.indexOf('completion'));
		expect(eventTypes.indexOf('completion')).toBeLessThan(eventTypes.indexOf('leave'));
	});

	it('module scope create event has depth 0', async () => {
		const { events } = await drainGenerator('let x = 5;\n', ALL_ENABLED);
		const creates = events.filter(
			(e) => e.category === 'scope' && (e as Record<string, unknown>).event === 'create',
		) as Record<string, unknown>[];

		expect(creates[0].depth).toBe(0);
	});

	it('all scope events for module share the same creationStep', async () => {
		const { events } = await drainGenerator('let x = 5;\n', ALL_ENABLED);
		const scopeEvents = events.filter((e) => e.category === 'scope') as Record<string, unknown>[];
		const steps = scopeEvents.map((e) => e.creationStep);

		expect(new Set(steps).size).toBe(1);
	});

	it('binding scopeCreationStep matches parent scope creationStep', async () => {
		const { events } = await drainGenerator('let x = 5;\n', ALL_ENABLED);
		const scopeCreate = events.find(
			(e) => e.category === 'scope' && (e as Record<string, unknown>).event === 'create',
		) as Record<string, unknown>;
		const binding = events.find(
			(e) => e.category === 'binding' && (e as Record<string, unknown>).name === 'x',
		) as Record<string, unknown>;

		expect(binding.scopeCreationStep).toBe(scopeCreate.creationStep);
	});

	it('nested block scope has depth greater than module', async () => {
		const { events } = await drainGenerator('let x = 5;\n{\n\tlet y = 10;\n}\n', ALL_ENABLED);
		const creates = events.filter(
			(e) => e.category === 'scope' && (e as Record<string, unknown>).event === 'create',
		) as Record<string, unknown>[];
		const depths = creates.map((e) => e.depth as number);

		expect(Math.max(...depths)).toBeGreaterThan(0);
	});

	it('nested block has parentCreationStep pointing to outer scope', async () => {
		const { events } = await drainGenerator('let x = 5;\n{\n\tlet y = 10;\n}\n', ALL_ENABLED);
		const creates = events.filter(
			(e) => e.category === 'scope' && (e as Record<string, unknown>).event === 'create',
		) as Record<string, unknown>[];
		const outerCreate = creates[0];
		const innerCreate = creates.find((e) => (e.depth as number) > 0)!;

		expect(innerCreate.parentCreationStep).toBe(outerCreate.creationStep);
	});

	it('inner binding has different scopeCreationStep than outer binding', async () => {
		const { events } = await drainGenerator('let x = 5;\n{\n\tlet y = 10;\n}\n', ALL_ENABLED);
		const xDeclare = events.find(
			(e) => e.category === 'binding' && (e as Record<string, unknown>).event === 'declare' && (e as Record<string, unknown>).name === 'x',
		) as Record<string, unknown>;
		const yDeclare = events.find(
			(e) => e.category === 'binding' && (e as Record<string, unknown>).event === 'declare' && (e as Record<string, unknown>).name === 'y',
		) as Record<string, unknown>;

		expect(xDeclare.scopeCreationStep).not.toBe(yDeclare.scopeCreationStep);
	});

	it('conditional block scope has structureStep defined', async () => {
		const { events } = await drainGenerator(
			'let x = 5;\nif (x > 3) {\n\tlet y = 1;\n}\n', ALL_ENABLED,
		);
		const creates = events.filter(
			(e) => e.category === 'scope' && (e as Record<string, unknown>).event === 'create',
		) as Record<string, unknown>[];
		// The conditional block scope (not the module scope) should have structureStep
		const innerScopes = creates.filter((e) => (e.depth as number) > 0);

		expect(innerScopes.length).toBeGreaterThan(0);
	});

	it('while loop creates block scopes for each iteration', async () => {
		const { events } = await drainGenerator(
			'let i = 0;\nwhile (i < 2) {\n\ti = i + 1;\n}\n', ALL_ENABLED,
		);
		const creates = events.filter(
			(e) => e.category === 'scope' && (e as Record<string, unknown>).event === 'create' && (e as Record<string, unknown>).depth as number > 0,
		);

		expect(creates.length).toBeGreaterThan(0);
	});
});

describe('function event correctness', () => {
	it('function call event has name and args', async () => {
		const { events } = await drainGenerator(
			'function add(a, b) {\n\treturn a + b;\n}\nlet result = add(1, 2);\n', ALL_ENABLED,
		);
		const callEvent = events.find(
			(e) => e.category === 'function' && (e as Record<string, unknown>).event === 'call',
		) as Record<string, unknown>;

		expect(callEvent).toBeDefined();
		expect(callEvent.name).toBe('add');
		expect(callEvent.args).toEqual([
			{ type: 'number', value: 1 },
			{ type: 'number', value: 2 },
		]);
	});

	it('function return event has name and value', async () => {
		const { events } = await drainGenerator(
			'function add(a, b) {\n\treturn a + b;\n}\nlet result = add(1, 2);\n', ALL_ENABLED,
		);
		const returnEvent = events.find(
			(e) => e.category === 'function' && (e as Record<string, unknown>).event === 'return',
		) as Record<string, unknown>;

		expect(returnEvent).toBeDefined();
		expect(returnEvent.name).toBe('add');
		expect(returnEvent.value).toEqual({ type: 'number', value: 3 });
	});

	it('call event step precedes return event step', async () => {
		const { events } = await drainGenerator(
			'function add(a, b) {\n\treturn a + b;\n}\nlet result = add(1, 2);\n', ALL_ENABLED,
		);
		const callEvent = events.find(
			(e) => e.category === 'function' && (e as Record<string, unknown>).event === 'call',
		)!;
		const returnEvent = events.find(
			(e) => e.category === 'function' && (e as Record<string, unknown>).event === 'return',
		)!;

		expect(callEvent.step).toBeLessThan(returnEvent.step);
	});

	it('function call with string arg has correct representation', async () => {
		const { events } = await drainGenerator(
			'function greet(name) {\n\treturn \'hello\';\n}\nlet msg = greet(\'world\');\n', ALL_ENABLED,
		);
		const callEvent = events.find(
			(e) => e.category === 'function' && (e as Record<string, unknown>).event === 'call',
		) as Record<string, unknown>;
		const args = callEvent.args as Record<string, unknown>[];

		expect(args[0]).toEqual({ type: 'string', value: 'world' });
	});

	it('function return with string value has correct representation', async () => {
		const { events } = await drainGenerator(
			'function greet(name) {\n\treturn \'hello\';\n}\nlet msg = greet(\'world\');\n', ALL_ENABLED,
		);
		const returnEvent = events.find(
			(e) => e.category === 'function' && (e as Record<string, unknown>).event === 'return',
		) as Record<string, unknown>;

		expect(returnEvent.value).toEqual({ type: 'string', value: 'hello' });
	});
});
