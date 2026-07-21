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

		it('yields a different string unchanged', () => {
			expect(REFERENCE_THREAD_LOGIC.onMessage('world')).toBe('world');
		});

		it('yields a number unchanged', () => {
			expect(REFERENCE_THREAD_LOGIC.onMessage(42)).toBe(42);
		});

		it('yields an empty string unchanged', () => {
			expect(REFERENCE_THREAD_LOGIC.onMessage('')).toBe('');
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

		it('echoes a different string request', () => {
			expect(REFERENCE_THREAD_LOGIC.onCall?.('pong')).toBe('pong');
		});

		it('echoes an empty string request', () => {
			expect(REFERENCE_THREAD_LOGIC.onCall?.('')).toBe('');
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

		it('returns undefined for a payload stamped false', () => {
			expect(
				REFERENCE_THREAD_LOGIC.refineError?.({ isReferenceLimit: false }),
			).toBeUndefined();
		});

		it('returns undefined for a real reference-serializer non-limit halt', () => {
			expect(
				REFERENCE_THREAD_LOGIC.refineError?.({
					kind: 'throw',
					name: 'TypeError',
					message: 'boom',
					viaReference: true,
					isReferenceLimit: false,
				}),
			).toBeUndefined();
		});

		it('returns undefined for a null payload', () => {
			expect(REFERENCE_THREAD_LOGIC.refineError?.(null)).toBeUndefined();
		});

		it('returns undefined for a non-object payload', () => {
			expect(REFERENCE_THREAD_LOGIC.refineError?.('oops')).toBeUndefined();
		});
	});
});
