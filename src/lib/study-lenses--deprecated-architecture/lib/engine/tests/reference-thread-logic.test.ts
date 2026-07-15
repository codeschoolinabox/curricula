import { describe, expect, it } from 'vitest';

import REFERENCE_THREAD_LOGIC from '../testing/reference-thread-logic.js';

describe('REFERENCE_THREAD_LOGIC', () => {
	describe('onMessage', () => {
		it('drops the sentinel', () => {
			expect(
				REFERENCE_THREAD_LOGIC.onMessage('reference:drop'),
			).toBeUndefined();
		});

		it('yields a string unchanged', () => {
			expect(REFERENCE_THREAD_LOGIC.onMessage('hello')).toBe('hello');
		});

		it('yields an object by reference', () => {
			const message = { step: 1 };

			expect(REFERENCE_THREAD_LOGIC.onMessage(message)).toBe(message);
		});
	});

	describe('onCall', () => {
		it('echoes a string request', () => {
			expect(REFERENCE_THREAD_LOGIC.onCall?.('ping')).toBe('ping');
		});

		it('answers null for a non-string request', () => {
			expect(REFERENCE_THREAD_LOGIC.onCall?.(42)).toBeNull();
		});
	});

	describe('refineError', () => {
		it('refines a stamped reference limit', () => {
			expect(
				REFERENCE_THREAD_LOGIC.refineError?.({
					isReferenceLimit: true,
				}),
			).toEqual({ limit: 'reference' });
		});

		it('returns undefined for an unstamped payload', () => {
			expect(
				REFERENCE_THREAD_LOGIC.refineError?.({ name: 'TypeError' }),
			).toBeUndefined();
		});

		it('returns undefined for a non-object payload', () => {
			expect(REFERENCE_THREAD_LOGIC.refineError?.('oops')).toBeUndefined();
		});
	});
});
