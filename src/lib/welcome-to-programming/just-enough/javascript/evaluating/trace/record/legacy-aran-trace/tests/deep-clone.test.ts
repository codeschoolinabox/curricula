import { describe, expect, it } from 'vitest';

// @ts-expect-error — untyped vendored legacy JS
import { deepClone } from '../lib/deep-clone.js';

describe('deep-clone', () => {
	describe('globalThis guard', () => {
		it('returns globalThis unchanged when passed as source', () => {
			const result = deepClone(globalThis);

			expect(result).toBe(globalThis);
		});
	});

	describe('no Element in non-browser environment', () => {
		it('does not throw when cloning an object in an environment without Element', () => {
			const obj = { a: 1, b: { c: 2 } };

			expect(() => deepClone(obj)).not.toThrow();
		});
	});
});
