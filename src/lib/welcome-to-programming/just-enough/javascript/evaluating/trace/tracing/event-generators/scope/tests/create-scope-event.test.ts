import { describe, expect, it } from 'vitest';

import createScopeEvent from '../create-scope-event.js';

describe('createScopeEvent', () => {
	describe('category and fields', () => {
		it('category is scope', () => {
			const event = createScopeEvent({
				kind: 'module',
				event: 'create',
				depth: 0,
				creationStep: 0,
			});
			expect(event.category).toBe('scope');
		});

		it('kind and event match', () => {
			const event = createScopeEvent({
				kind: 'block',
				event: 'enter',
				depth: 1,
				creationStep: 3,
				parentCreationStep: 0,
			});
			expect(event.kind).toBe('block');
			expect(event.event).toBe('enter');
		});
	});

	describe('optional fields', () => {
		it('parentCreationStep absent on top-level module', () => {
			const event = createScopeEvent({
				kind: 'module',
				event: 'create',
				depth: 0,
				creationStep: 0,
			});
			expect(event).not.toHaveProperty('parentCreationStep');
		});

		it('parentCreationStep present on nested scope', () => {
			const event = createScopeEvent({
				kind: 'block',
				event: 'create',
				depth: 1,
				creationStep: 5,
				parentCreationStep: 0,
			});
			expect(event.parentCreationStep).toBe(0);
		});

		it('structure and structureStep both present', () => {
			const event = createScopeEvent({
				kind: 'block',
				event: 'create',
				depth: 1,
				creationStep: 5,
				parentCreationStep: 0,
				structure: 'while',
				structureStep: 4,
			});
			expect(event.structure).toBe('while');
			expect(event.structureStep).toBe(4);
		});

		it('structure absent on bare block', () => {
			const event = createScopeEvent({
				kind: 'block',
				event: 'create',
				depth: 1,
				creationStep: 5,
				parentCreationStep: 0,
			});
			expect(event).not.toHaveProperty('structure');
			expect(event).not.toHaveProperty('structureStep');
		});

		it('label present when provided', () => {
			const event = createScopeEvent({
				kind: 'block',
				event: 'create',
				depth: 1,
				creationStep: 5,
				parentCreationStep: 0,
				structure: 'while',
				structureStep: 4,
				label: 'outer',
			});
			expect(event.label).toBe('outer');
		});
	});

	describe('errors', () => {
		it('throws on depth < 0', () => {
			expect(() =>
				createScopeEvent({ kind: 'block', event: 'create', depth: -1, creationStep: 0 }),
			).toThrow();
		});

		it('throws when structure without structureStep', () => {
			expect(() =>
				createScopeEvent({
					kind: 'block',
					event: 'create',
					depth: 1,
					creationStep: 5,
					structure: 'for',
				}),
			).toThrow();
		});

		it('throws when structureStep without structure', () => {
			expect(() =>
				createScopeEvent({
					kind: 'block',
					event: 'create',
					depth: 1,
					creationStep: 5,
					structureStep: 4,
				}),
			).toThrow();
		});
	});
});
