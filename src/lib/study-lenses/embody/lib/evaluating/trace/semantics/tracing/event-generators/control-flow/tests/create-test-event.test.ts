import { describe, expect, it } from 'vitest';

import createTestEvent from '../create-test-event.js';

describe('createTestEvent', () => {
	describe('conditional kinds → category conditional', () => {
		describe('if', () => {
			it('category is conditional', () => {
				const event = createTestEvent({
					kind: 'if',
					value: { type: 'boolean', value: true },
					result: true,
					scopeCreationStep: 0,
				});
				expect(event.category).toBe('conditional');
			});

			it('kind is if', () => {
				const event = createTestEvent({
					kind: 'if',
					value: { type: 'boolean', value: true },
					result: true,
					scopeCreationStep: 0,
				});
				expect(event.kind).toBe('if');
			});

			it('coercion absent when not provided', () => {
				const event = createTestEvent({
					kind: 'if',
					value: { type: 'boolean', value: false },
					result: false,
					scopeCreationStep: 0,
				});
				expect(event).not.toHaveProperty('coercion');
			});
		});

		describe('ternary', () => {
			it('category is conditional', () => {
				const event = createTestEvent({
					kind: 'ternary',
					value: { type: 'boolean', value: true },
					result: true,
					scopeCreationStep: 0,
				});
				expect(event.category).toBe('conditional');
			});

			it('kind is ternary', () => {
				const event = createTestEvent({
					kind: 'ternary',
					value: { type: 'boolean', value: true },
					result: true,
					scopeCreationStep: 0,
				});
				expect(event.kind).toBe('ternary');
			});
		});
	});

	describe('loop kinds → category loop', () => {
		describe('while', () => {
			it('category is loop', () => {
				const event = createTestEvent({
					kind: 'while',
					value: { type: 'string', value: 'hello' },
					result: true,
					scopeCreationStep: 3,
				});
				expect(event.category).toBe('loop');
			});

			it('kind is while', () => {
				const event = createTestEvent({
					kind: 'while',
					value: { type: 'string', value: 'hello' },
					result: true,
					scopeCreationStep: 3,
				});
				expect(event.kind).toBe('while');
			});
		});

		it.each(['doWhile', 'for'] as const)('%s → category loop', (kind) => {
			const event = createTestEvent({
				kind,
				value: { type: 'boolean', value: true },
				result: true,
				scopeCreationStep: 1,
			});
			expect(event.category).toBe('loop');
		});

		it.each(['doWhile', 'for'] as const)('%s → kind threaded', (kind) => {
			const event = createTestEvent({
				kind,
				value: { type: 'boolean', value: true },
				result: true,
				scopeCreationStep: 1,
			});
			expect(event.kind).toBe(kind);
		});
	});

	describe('event is always test', () => {
		it('if → event test', () => {
			const event = createTestEvent({
				kind: 'if',
				value: { type: 'boolean', value: true },
				result: true,
				scopeCreationStep: 0,
			});
			expect(event.event).toBe('test');
		});
	});

	describe('value passthrough', () => {
		it('threads the raw tested value verbatim', () => {
			const event = createTestEvent({
				kind: 'if',
				value: { type: 'number', value: 42 },
				result: true,
				scopeCreationStep: 0,
			});
			expect(event.value).toEqual({ type: 'number', value: 42 });
		});
	});

	describe('coercion', () => {
		it('present when provided', () => {
			const event = createTestEvent({
				kind: 'while',
				value: { type: 'string', value: 'hello' },
				result: true,
				scopeCreationStep: 3,
				coercion: { type: 'boolean', value: true },
			});
			expect(event.coercion).toEqual({ type: 'boolean', value: true });
		});

		it('result carries the coerced boolean, distinct from the raw value', () => {
			const event = createTestEvent({
				kind: 'if',
				value: { type: 'string', value: '' },
				result: false,
				scopeCreationStep: 0,
			});
			expect(event.result).toBe(false);
		});
	});

	describe('no label field (dropped from control-flow events)', () => {
		it('never carries label', () => {
			const event = createTestEvent({
				kind: 'while',
				value: { type: 'boolean', value: true },
				result: true,
				scopeCreationStep: 0,
			});
			expect(event).not.toHaveProperty('label');
		});
	});

	describe('scopeCreationStep threaded', () => {
		it('carries the provided step', () => {
			const event = createTestEvent({
				kind: 'if',
				value: { type: 'boolean', value: true },
				result: true,
				scopeCreationStep: 7,
			});
			expect(event.scopeCreationStep).toBe(7);
		});
	});
});
