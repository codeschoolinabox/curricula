/**
 * @file Layer 4a: templates + scopes gating (12 tests).
 *
 * Tests that config booleans for templates (flat per event type)
 * and scopes (2D: kind × events) correctly gate events through
 * the full Worker pipeline.
 */

import { describe, expect, it, vi } from 'vitest';

import { ALL_ENABLED, withOverride, drainGenerator } from './test-helpers.js';

vi.setConfig({ testTimeout: 60000 });

describe('templates gating', () => {
	const CODE = 'let name = "world";\nlet g = `hello ${name}`;\n';

	it('disabling templates.begin removes begin events', async () => {
		const config = withOverride(ALL_ENABLED, 'templates.begin', false);
		const { events } = await drainGenerator(CODE, config);
		const beginEvents = events.filter(
			(e) => e.category === 'template' && (e as Record<string, unknown>).event === 'begin',
		);
		const endEvents = events.filter(
			(e) => e.category === 'template' && (e as Record<string, unknown>).event === 'end',
		);

		expect(beginEvents.length).toBe(0);
		expect(endEvents.length).toBeGreaterThan(0);
	});

	it('disabling templates.evaluation removes evaluation events', async () => {
		const config = withOverride(ALL_ENABLED, 'templates.evaluation', false);
		const { events } = await drainGenerator(CODE, config);
		const evalEvents = events.filter(
			(e) => e.category === 'template' && (e as Record<string, unknown>).event === 'evaluation',
		);
		const beginEvents = events.filter(
			(e) => e.category === 'template' && (e as Record<string, unknown>).event === 'begin',
		);

		expect(evalEvents.length).toBe(0);
		expect(beginEvents.length).toBeGreaterThan(0);
	});

	it('disabling templates.end removes end events', async () => {
		const config = withOverride(ALL_ENABLED, 'templates.end', false);
		const { events } = await drainGenerator(CODE, config);
		const endEvents = events.filter(
			(e) => e.category === 'template' && (e as Record<string, unknown>).event === 'end',
		);
		const beginEvents = events.filter(
			(e) => e.category === 'template' && (e as Record<string, unknown>).event === 'begin',
		);

		expect(endEvents.length).toBe(0);
		expect(beginEvents.length).toBeGreaterThan(0);
	});
});

describe('scopes gating', () => {
	const CODE = 'let x = 5;\n{\n  let y = 10;\n}\n';

	describe('kind gating', () => {
		it('disabling scopes.kind.module removes module scope events', async () => {
			const config = withOverride(ALL_ENABLED, 'scopes.kind.module', false);
			const { events } = await drainGenerator(CODE, config);
			const moduleScopes = events.filter(
				(e) => e.category === 'scope' && (e as Record<string, unknown>).kind === 'module',
			);
			const blockScopes = events.filter(
				(e) => e.category === 'scope' && (e as Record<string, unknown>).kind === 'block',
			);

			expect(moduleScopes.length).toBe(0);
			expect(blockScopes.length).toBeGreaterThan(0);
		});

		it('disabling scopes.kind.block removes block scope events', async () => {
			const config = withOverride(ALL_ENABLED, 'scopes.kind.block', false);
			const { events } = await drainGenerator(CODE, config);
			const blockScopes = events.filter(
				(e) => e.category === 'scope' && (e as Record<string, unknown>).kind === 'block',
			);

			expect(blockScopes.length).toBe(0);
		});

		it('disabling scopes.kind.block also suppresses module scope events', async () => {
			// WHY: Aran processes module scope through block@setup. When
			// block kind is disabled, module scope events are also suppressed.
			// This coupling is an Aran architectural constraint, not a bug.
			const config = withOverride(ALL_ENABLED, 'scopes.kind.block', false);
			const { events } = await drainGenerator('let x = 5;\n', config);
			const moduleScopes = events.filter(
				(e) => e.category === 'scope' && (e as Record<string, unknown>).kind === 'module',
			);

			expect(moduleScopes.length).toBe(0);
		});

		it('disabling scopes.kind.script does not crash', async () => {
			const config = withOverride(ALL_ENABLED, 'scopes.kind.script', false);
			const { result } = await drainGenerator('let x = 5;\n', config);

			expect(result.ok).toBe(true);
		});
	});

	describe('event gating', () => {
		it('disabling scopes.events.create removes create events', async () => {
			const config = withOverride(ALL_ENABLED, 'scopes.events.create', false);
			const { events } = await drainGenerator(CODE, config);
			const createEvents = events.filter(
				(e) => e.category === 'scope' && (e as Record<string, unknown>).event === 'create',
			);
			const enterEvents = events.filter(
				(e) => e.category === 'scope' && (e as Record<string, unknown>).event === 'enter',
			);

			expect(createEvents.length).toBe(0);
			expect(enterEvents.length).toBeGreaterThan(0);
		});

		it('disabling scopes.events.enter removes enter events', async () => {
			const config = withOverride(ALL_ENABLED, 'scopes.events.enter', false);
			const { events } = await drainGenerator(CODE, config);
			const enterEvents = events.filter(
				(e) => e.category === 'scope' && (e as Record<string, unknown>).event === 'enter',
			);
			const createEvents = events.filter(
				(e) => e.category === 'scope' && (e as Record<string, unknown>).event === 'create',
			);

			expect(enterEvents.length).toBe(0);
			expect(createEvents.length).toBeGreaterThan(0);
		});

		it('disabling scopes.events.completion removes completion events', async () => {
			const config = withOverride(ALL_ENABLED, 'scopes.events.completion', false);
			const { events } = await drainGenerator(CODE, config);
			const completionEvents = events.filter(
				(e) => e.category === 'scope' && (e as Record<string, unknown>).event === 'completion',
			);
			const createEvents = events.filter(
				(e) => e.category === 'scope' && (e as Record<string, unknown>).event === 'create',
			);

			expect(completionEvents.length).toBe(0);
			expect(createEvents.length).toBeGreaterThan(0);
		});

		it('disabling scopes.events.leave removes leave events', async () => {
			const config = withOverride(ALL_ENABLED, 'scopes.events.leave', false);
			const { events } = await drainGenerator(CODE, config);
			const leaveEvents = events.filter(
				(e) => e.category === 'scope' && (e as Record<string, unknown>).event === 'leave',
			);
			const createEvents = events.filter(
				(e) => e.category === 'scope' && (e as Record<string, unknown>).event === 'create',
			);

			expect(leaveEvents.length).toBe(0);
			expect(createEvents.length).toBeGreaterThan(0);
		});

		it('disabling scopes.events.interrupt removes interrupt events', async () => {
			const config = withOverride(ALL_ENABLED, 'scopes.events.interrupt', false);
			const { events } = await drainGenerator(
				'for (let i = 0; i < 3; i = i + 1) {\n  if (i === 1) {\n    break;\n  }\n}\n', config,
			);
			const interruptEvents = events.filter(
				(e) => e.category === 'scope' && (e as Record<string, unknown>).event === 'interrupt',
			);
			const createEvents = events.filter(
				(e) => e.category === 'scope' && (e as Record<string, unknown>).event === 'create',
			);

			expect(interruptEvents.length).toBe(0);
			expect(createEvents.length).toBeGreaterThan(0);
		});
	});
});
