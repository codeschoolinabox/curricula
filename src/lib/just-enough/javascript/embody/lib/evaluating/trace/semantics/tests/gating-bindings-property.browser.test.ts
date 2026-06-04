/**
 * @file Layer 4a: bindings + propertyAccess gating (14 tests).
 *
 * Tests that config booleans for bindings (2D: kind × events)
 * and propertyAccess (flat) correctly gate events through the
 * full Worker pipeline.
 */

import { describe, expect, it, vi } from 'vitest';

import { ALL_ENABLED, withOverride, drainGenerator } from './test-helpers.js';

vi.setConfig({ testTimeout: 60000 });

describe('bindings gating', () => {
	const CODE = 'let x = 1;\nconst y = 2;\nlet z = x;\nx = 3;\n';

	describe('kind gating', () => {
		it('disabling bindings.kind.let removes let binding events', async () => {
			const config = withOverride(ALL_ENABLED, 'bindings.kind.let', false);
			const { events } = await drainGenerator(CODE, config);
			const letBindings = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).kind === 'let',
			);
			const constBindings = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).kind === 'const',
			);

			expect(letBindings.length).toBe(0);
			expect(constBindings.length).toBeGreaterThan(0);
		});

		it('disabling bindings.kind.const removes const binding events', async () => {
			const config = withOverride(ALL_ENABLED, 'bindings.kind.const', false);
			const { events } = await drainGenerator(CODE, config);
			const constBindings = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).kind === 'const',
			);
			const letBindings = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).kind === 'let',
			);

			expect(constBindings.length).toBe(0);
			expect(letBindings.length).toBeGreaterThan(0);
		});

		it('disabling bindings.kind.global does not crash', async () => {
			const config = withOverride(ALL_ENABLED, 'bindings.kind.global', false);
			const { result } = await drainGenerator('let x = 5;\n', config);

			expect(result.ok).toBe(true);
		});
	});

	describe('event gating', () => {
		it('disabling bindings.events.declare removes declare events', async () => {
			const config = withOverride(
				ALL_ENABLED,
				'bindings.events.declare',
				false,
			);
			const { events } = await drainGenerator(CODE, config);
			const declareEvents = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).event === 'declare',
			);
			const initEvents = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).event === 'initialize',
			);

			expect(declareEvents.length).toBe(0);
			expect(initEvents.length).toBeGreaterThan(0);
		});

		it('disabling bindings.events.initialize removes initialize events', async () => {
			const config = withOverride(
				ALL_ENABLED,
				'bindings.events.initialize',
				false,
			);
			const { events } = await drainGenerator(CODE, config);
			const initEvents = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).event === 'initialize',
			);
			const declareEvents = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).event === 'declare',
			);

			expect(initEvents.length).toBe(0);
			expect(declareEvents.length).toBeGreaterThan(0);
		});

		it('disabling bindings.events.available removes available events', async () => {
			const config = withOverride(
				ALL_ENABLED,
				'bindings.events.available',
				false,
			);
			const { events } = await drainGenerator(CODE, config);
			const availableEvents = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).event === 'available',
			);
			const declareEvents = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).event === 'declare',
			);

			expect(availableEvents.length).toBe(0);
			expect(declareEvents.length).toBeGreaterThan(0);
		});

		it('disabling bindings.events.assign removes assign events', async () => {
			const config = withOverride(ALL_ENABLED, 'bindings.events.assign', false);
			const { events } = await drainGenerator(CODE, config);
			const assignEvents = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).event === 'assign',
			);
			const declareEvents = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).event === 'declare',
			);

			expect(assignEvents.length).toBe(0);
			expect(declareEvents.length).toBeGreaterThan(0);
		});

		it('disabling bindings.events.read removes read events', async () => {
			const config = withOverride(ALL_ENABLED, 'bindings.events.read', false);
			const { events } = await drainGenerator(CODE, config);
			const readEvents = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).event === 'read',
			);
			const declareEvents = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).event === 'declare',
			);

			expect(readEvents.length).toBe(0);
			expect(declareEvents.length).toBeGreaterThan(0);
		});
	});

	describe('2D gating', () => {
		it('disabling kind.let with all events enabled still removes let events', async () => {
			const config = withOverride(ALL_ENABLED, 'bindings.kind.let', false);
			const { events } = await drainGenerator(CODE, config);
			const letBindings = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).kind === 'let',
			);

			expect(letBindings.length).toBe(0);
		});
	});

	describe('filter', () => {
		it('filter limits to named bindings only', async () => {
			const config = withOverride(ALL_ENABLED, 'bindings.filter', ['x']);
			const { events } = await drainGenerator(
				'let x = 1;\nlet y = 2;\n',
				config,
			);
			const xBindings = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).name === 'x',
			);
			const yBindings = events.filter(
				(e) =>
					e.category === 'binding' &&
					(e as Record<string, unknown>).name === 'y',
			);

			expect(xBindings.length).toBeGreaterThan(0);
			expect(yBindings.length).toBe(0);
		});
	});
});

describe('propertyAccess gating', () => {
	describe('flat gating', () => {
		it('disabling propertyAccess.dot removes dot access events', async () => {
			const config = withOverride(ALL_ENABLED, 'propertyAccess.dot', false);
			const { events } = await drainGenerator(
				'let s = "hello";\nlet a = s.length;\nlet b = s[0];\n',
				config,
			);
			const dotEvents = events.filter(
				(e) =>
					e.category === 'propertyAccess' &&
					(e as Record<string, unknown>).kind === 'dot',
			);
			const bracketEvents = events.filter(
				(e) =>
					e.category === 'propertyAccess' &&
					(e as Record<string, unknown>).kind === 'bracket',
			);

			expect(dotEvents.length).toBe(0);
			expect(bracketEvents.length).toBeGreaterThan(0);
		});

		it('disabling propertyAccess.bracket removes bracket access events', async () => {
			const config = withOverride(ALL_ENABLED, 'propertyAccess.bracket', false);
			const { events } = await drainGenerator(
				'let s = "hello";\nlet a = s.length;\nlet b = s[0];\n',
				config,
			);
			const bracketEvents = events.filter(
				(e) =>
					e.category === 'propertyAccess' &&
					(e as Record<string, unknown>).kind === 'bracket',
			);
			const dotEvents = events.filter(
				(e) =>
					e.category === 'propertyAccess' &&
					(e as Record<string, unknown>).kind === 'dot',
			);

			expect(bracketEvents.length).toBe(0);
			expect(dotEvents.length).toBeGreaterThan(0);
		});

		it('disabling propertyAccess.optionalChaining removes optional chaining events', async () => {
			const config = withOverride(
				ALL_ENABLED,
				'propertyAccess.optionalChaining',
				false,
			);
			const { events } = await drainGenerator(
				'let s = "hello";\nlet a = s?.length;\nlet b = s.length;\n',
				config,
			);
			const optionalEvents = events.filter(
				(e) =>
					e.category === 'propertyAccess' &&
					(e as Record<string, unknown>).kind === 'optionalChaining',
			);
			const dotEvents = events.filter(
				(e) =>
					e.category === 'propertyAccess' &&
					(e as Record<string, unknown>).kind === 'dot',
			);

			expect(optionalEvents.length).toBe(0);
			expect(dotEvents.length).toBeGreaterThan(0);
		});
	});

	describe('filter', () => {
		it('filter limits to named properties', async () => {
			const config = withOverride(ALL_ENABLED, 'propertyAccess.filter', [
				'length',
			]);
			const { events } = await drainGenerator(
				'let s = "hello";\nlet a = s.length;\nlet b = s[0];\n',
				config,
			);
			const lengthEvents = events.filter(
				(e) =>
					e.category === 'propertyAccess' &&
					(e as Record<string, unknown>).key === 'length',
			);
			const indexEvents = events.filter(
				(e) =>
					e.category === 'propertyAccess' &&
					(e as Record<string, unknown>).key === 0,
			);

			expect(lengthEvents.length).toBeGreaterThan(0);
			expect(indexEvents.length).toBe(0);
		});
	});
});
