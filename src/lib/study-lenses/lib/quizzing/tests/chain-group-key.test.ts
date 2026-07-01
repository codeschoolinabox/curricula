import { describe, expect, it } from 'vitest';

import bindingGroupKey from '../keying/binding-group-key.js';
import chainGroupKey from '../keying/chain-group-key.js';
import categoryRoleGroupKey from '../keying/classification-group-key.js';
import usageKindGroupKey from '../keying/usage-kind-group-key.js';

// No Zero/empty-name case: `name` is an anchor name (a parsed JS Identifier's
// text), so the empty string is unreachable by construction (see the serializer's
// `@remarks` provenance note).

describe('chainGroupKey', () => {
	describe('One', () => {
		it('serializes a scope-chain name to a chain key', () => {
			expect(chainGroupKey('scope-chain', 'Math')).toBe(
				'chain:scope-chain:Math',
			);
		});

		it('serializes a prototype-chain name to a chain key', () => {
			expect(chainGroupKey('prototype-chain', 'length')).toBe(
				'chain:prototype-chain:length',
			);
		});
	});

	describe('Many', () => {
		it('keys the same name in different chains into distinct groups', () => {
			expect(chainGroupKey('scope-chain', 'x')).not.toBe(
				chainGroupKey('prototype-chain', 'x'),
			);
		});

		it('keys different names in the same chain into distinct groups', () => {
			expect(chainGroupKey('scope-chain', 'Math')).not.toBe(
				chainGroupKey('scope-chain', 'console'),
			);
		});

		it('groups a name-in-role regardless of which binding wins (unlike the binding axis)', () => {
			// two shadowed `x` bindings: the binding axis keys them apart by site...
			expect(
				bindingGroupKey({ name: 'x', declarationRange: [4, 5], kind: 'let' }),
			).not.toBe(
				bindingGroupKey({ name: 'x', declarationRange: [20, 21], kind: 'let' }),
			);
			// ...but both are scope-chain `x`, so both key the one binding-agnostic
			// chain group — chainGroupKey takes only (role, name), never a span.
			expect(chainGroupKey('scope-chain', 'x')).toBe('chain:scope-chain:x');
		});
	});

	describe('Boundaries — collision-free vs the other axes', () => {
		it('does not start with the binding / usage / usage-kind / element-type prefixes', () => {
			const key = chainGroupKey('prototype-chain', 'length');
			expect(key.startsWith('binding:')).toBe(false);
			expect(key.startsWith('usage:')).toBe(false);
			expect(key.startsWith('usage-kind:')).toBe(false);
			expect(key.startsWith('element-type:')).toBe(false);
		});

		it('is neither a prefix of nor prefixed by a category key', () => {
			const chainKey = chainGroupKey('scope-chain', 'Math');
			const categoryKey = categoryRoleGroupKey('identifier', null);
			expect(chainKey.startsWith(categoryKey)).toBe(false);
			expect(categoryKey.startsWith(chainKey)).toBe(false);
		});

		it('never equals a usage-kind key even when the name shadows a use-type', () => {
			expect(chainGroupKey('scope-chain', 'read')).not.toBe(
				usageKindGroupKey('read'),
			);
		});

		it('keeps the role and name segments distinct when the name equals the role', () => {
			expect(chainGroupKey('scope-chain', 'scope-chain')).toBe(
				'chain:scope-chain:scope-chain',
			);
			expect(chainGroupKey('scope-chain', 'scope-chain')).not.toBe(
				chainGroupKey('prototype-chain', 'scope-chain'),
			);
		});
	});
});
