import { describe, expect, it } from 'vitest';

import createBindingEvent from '../create-binding-event.js';

describe('createBindingEvent', () => {
	describe('category and fixed fields', () => {
		it('category is binding', () => {
			const event = createBindingEvent({
				kind: 'let',
				event: 'declare',
				name: 'x',
				scopeCreationStep: 0,
			});
			expect(event.category).toBe('binding');
		});

		it('kind matches input', () => {
			const event = createBindingEvent({
				kind: 'const',
				event: 'declare',
				name: 'x',
				scopeCreationStep: 0,
			});
			expect(event.kind).toBe('const');
		});

		it('name matches input', () => {
			const event = createBindingEvent({
				kind: 'let',
				event: 'declare',
				name: 'myVar',
				scopeCreationStep: 0,
			});
			expect(event.name).toBe('myVar');
		});
	});

	describe('declare event', () => {
		it('no value field', () => {
			const event = createBindingEvent({
				kind: 'let',
				event: 'declare',
				name: 'x',
				scopeCreationStep: 0,
			});
			expect(event).not.toHaveProperty('value');
		});

		it('no declarationStep', () => {
			const event = createBindingEvent({
				kind: 'let',
				event: 'declare',
				name: 'x',
				scopeCreationStep: 0,
			});
			expect(event).not.toHaveProperty('declarationStep');
		});
	});

	describe('initialize event', () => {
		it('includes value', () => {
			const event = createBindingEvent({
				kind: 'let',
				event: 'initialize',
				name: 'x',
				scopeCreationStep: 0,
				declarationStep: 1,
				value: { type: 'number', value: 5 },
			});
			expect(event.value).toEqual({ type: 'number', value: 5 });
		});

		it('includes explicit flag', () => {
			const event = createBindingEvent({
				kind: 'let',
				event: 'initialize',
				name: 'x',
				scopeCreationStep: 0,
				declarationStep: 1,
				value: { type: 'undefined' },
				explicit: false,
			});
			expect(event.explicit).toBe(false);
		});

		it('includes declarationStep', () => {
			const event = createBindingEvent({
				kind: 'let',
				event: 'initialize',
				name: 'x',
				scopeCreationStep: 0,
				declarationStep: 3,
				value: { type: 'number', value: 5 },
			});
			expect(event.declarationStep).toBe(3);
		});
	});

	describe('read event', () => {
		it('includes value', () => {
			const event = createBindingEvent({
				kind: 'let',
				event: 'read',
				name: 'x',
				scopeCreationStep: 0,
				declarationStep: 1,
				value: { type: 'string', value: 'hello' },
			});
			expect(event.value).toEqual({ type: 'string', value: 'hello' });
		});
	});

	describe('global binding', () => {
		it('no declarationStep on global read', () => {
			const event = createBindingEvent({
				kind: 'global',
				event: 'read',
				name: 'Math',
				scopeCreationStep: 0,
				value: { type: 'function', name: 'Math' },
			});
			expect(event).not.toHaveProperty('declarationStep');
		});
	});

	describe('explicit only on initialize', () => {
		it('no explicit on declare', () => {
			const event = createBindingEvent({
				kind: 'let',
				event: 'declare',
				name: 'x',
				scopeCreationStep: 0,
			});
			expect(event).not.toHaveProperty('explicit');
		});

		it('no explicit on read', () => {
			const event = createBindingEvent({
				kind: 'let',
				event: 'read',
				name: 'x',
				scopeCreationStep: 0,
				declarationStep: 1,
				value: { type: 'number', value: 5 },
			});
			expect(event).not.toHaveProperty('explicit');
		});
	});

	describe('errors', () => {
		it('throws on empty name', () => {
			expect(() =>
				createBindingEvent({
					kind: 'let',
					event: 'declare',
					name: '',
					scopeCreationStep: 0,
				}),
			).toThrow();
		});

		it('throws on missing value for read', () => {
			expect(() =>
				createBindingEvent({
					kind: 'let',
					event: 'read',
					name: 'x',
					scopeCreationStep: 0,
					declarationStep: 1,
				} as any),
			).toThrow();
		});
	});
});
