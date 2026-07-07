import { describe, expect, it } from 'vitest';

import createLiteralEvent from '../create-literal-event.js';

describe('createLiteralEvent', () => {
	describe('category and kind', () => {
		it('category is literal', () => {
			const event = createLiteralEvent({ kind: 'string' });
			expect(event.category).toBe('literal');
		});

		it('kind matches input', () => {
			const event = createLiteralEvent({ kind: 'number' });
			expect(event.kind).toBe('number');
		});
	});

	describe('all literal kinds', () => {
		it.each([
			'string',
			'boolean',
			'number',
			'undefined',
			'null',
			'regex',
		] as const)('%s kind is accepted', (kind) => {
			const event = createLiteralEvent({ kind });
			expect(event.kind).toBe(kind);
		});
	});

	describe('errors', () => {
		it('throws on missing kind', () => {
			expect(() => createLiteralEvent({} as any)).toThrow();
		});
	});
});
