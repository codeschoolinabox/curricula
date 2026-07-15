import { describe, expect, it } from 'vitest';

import usageGroupKey from '../keying/usage-group-key.js';
import usageKindGroupKey from '../keying/usage-kind-group-key.js';

describe('usageKindGroupKey', () => {
	describe('One', () => {
		it('serializes a use-type to a cross-variable usage-kind key', () => {
			expect(usageKindGroupKey('read')).toBe('usage-kind:read');
		});
	});

	describe('Many', () => {
		it('serializes each of the four usage kinds to its own key', () => {
			expect([
				usageKindGroupKey('declared'),
				usageKindGroupKey('read'),
				usageKindGroupKey('assigned'),
				usageKindGroupKey('read-and-assigned'),
			]).toEqual([
				'usage-kind:declared',
				'usage-kind:read',
				'usage-kind:assigned',
				'usage-kind:read-and-assigned',
			]);
		});

		it('keys two different use-types into distinct groups', () => {
			expect(usageKindGroupKey('declared')).not.toBe(usageKindGroupKey('read'));
		});
	});

	describe('Boundaries', () => {
		it('never collides with the binding-scoped usage axis for the same kind', () => {
			expect(usageKindGroupKey('read')).not.toBe(
				usageGroupKey(
					{ name: 'x', declarationRange: [4, 5], kind: 'let' },
					'read',
				),
			);
		});

		it('is not a prefix of the binding-scoped usage axis for the same kind', () => {
			const crossVariable = usageKindGroupKey('read');
			const bindingScoped = usageGroupKey(
				{ name: 'x', declarationRange: [4, 5], kind: 'let' },
				'read',
			);
			expect(bindingScoped.startsWith(crossVariable)).toBe(false);
		});

		it('does not start with the binding-scoped usage prefix (usage:)', () => {
			expect(usageKindGroupKey('read').startsWith('usage:')).toBe(false);
		});
	});

	describe('Simple', () => {
		it('keys identically for the same input', () => {
			expect(usageKindGroupKey('assigned')).toEqual(
				usageKindGroupKey('assigned'),
			);
		});
	});
});
