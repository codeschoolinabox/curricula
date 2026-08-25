import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import embody from '../../../embody/index.js';
import spellmeCore from '../core.js';

// The one state no program text can reach: embody's own input-element
// derivation defecting, so the tokens stage publishes `ok` WITHOUT the
// published member. `vi.mock` of an internal sibling is a code smell (DEV.md
// § Dependency-order coverage), and the exception is earned narrowly here —
// the leaf's own suite in `../../../lib/scanning/tests/` covers it directly
// and completely, and this mock is the only constructor for a state the types
// admit and no source text reaches. The file is mock-poisoned throughout, so
// it holds no healthy control; `./core.test.ts`'s `applicability` block is the
// pairing that carries the healthy arm. The console spy is here because every
// `embody()` below drives `deriveTokens`'s catch, which reports the defect
// loudly by design.
vi.mock('../../../lib/scanning/derive-input-elements.js', () => ({
	default: () => {
		throw new Error('forced leaf defect');
	},
}));

beforeEach(() => {
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('spellme core — a defecting input-element derivation', () => {
	it('embody publishes the tokens stage without the member', () => {
		const stage = embody('let x = 1').facts.tokens;
		expect(stage.ok && stage.value.inputElements).toBeUndefined();
	});

	it('declines applicability', () => {
		expect(spellmeCore.applicability(embody('let x = 1').facts)).toBe(false);
	});

	it('refuses to read a stream, throwing a TypeError', () => {
		expect(() => spellmeCore.readStream(embody('let x = 1').facts)).toThrow(
			TypeError,
		);
	});
});
