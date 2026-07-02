import { describe, expect, it } from 'vitest';

import bindingGroupKey from '../keying/binding-group-key.js';
import chainGroupKey from '../keying/chain-group-key.js';
import categoryRoleGroupKey from '../keying/classification-group-key.js';
import realmGroupKey from '../keying/realm-group-key.js';
import usageGroupKey from '../keying/usage-group-key.js';
import usageKindGroupKey from '../keying/usage-kind-group-key.js';

// No Zero/empty-name case: `name` is an anchor name (a parsed JS Identifier's text),
// so the empty string is unreachable by construction (see the serializer's
// `@remarks` provenance note).

describe('realmGroupKey', () => {
	describe('One', () => {
		it('serializes a realm name to a realm key', () => {
			expect(realmGroupKey('Math')).toBe('realm:Math');
		});
	});

	describe('Many', () => {
		it('keys different realm names into distinct groups', () => {
			expect(realmGroupKey('Math')).not.toBe(realmGroupKey('console'));
		});

		it('keys every occurrence of one realm name into the same group', () => {
			expect(realmGroupKey('parseInt')).toBe(realmGroupKey('parseInt'));
			expect(realmGroupKey('parseInt')).toBe('realm:parseInt');
		});
	});

	describe('Boundaries — collision-free vs the other six axes', () => {
		it('does not start with any sibling axis prefix', () => {
			const key = realmGroupKey('Math');
			expect(key.startsWith('category:')).toBe(false);
			expect(key.startsWith('binding:')).toBe(false);
			expect(key.startsWith('usage:')).toBe(false);
			expect(key.startsWith('usage-kind:')).toBe(false);
			expect(key.startsWith('element-type:')).toBe(false);
			expect(key.startsWith('chain:')).toBe(false);
		});

		it('is neither a prefix of nor prefixed by a category key', () => {
			const realmKey = realmGroupKey('Math');
			const categoryKey = categoryRoleGroupKey('identifier', null);
			expect(realmKey.startsWith(categoryKey)).toBe(false);
			expect(categoryKey.startsWith(realmKey)).toBe(false);
		});

		it('never collides with the binding axis for a name shared with a program binding', () => {
			// a realm `Math` and a program `let Math` key different axes
			expect(realmGroupKey('Math')).not.toBe(
				bindingGroupKey({
					name: 'Math',
					declarationRange: [4, 8],
					kind: 'let',
				}),
			);
		});

		it('never equals a chain, usage, or usage-kind key for a shared token', () => {
			// checked against the LIVE sibling serializers, not just literals, so a
			// future prefix drift in any of them surfaces here.
			expect(realmGroupKey('read')).not.toBe(usageKindGroupKey('read'));
			expect(realmGroupKey('read')).not.toBe(
				usageGroupKey(
					{ name: 'x', declarationRange: [0, 1], kind: 'let' },
					'read',
				),
			);
			expect(realmGroupKey('Math')).not.toBe(
				chainGroupKey('scope-chain', 'Math'),
			);
		});

		it('is a dumb formatter — it does not gate poison names', () => {
			// gating lives in the shim / generator; the serializer only formats
			expect(realmGroupKey('toString')).toBe('realm:toString');
		});
	});

	describe('Simple', () => {
		it('is deterministic', () => {
			expect(realmGroupKey('Math')).toBe(realmGroupKey('Math'));
		});
	});
});
