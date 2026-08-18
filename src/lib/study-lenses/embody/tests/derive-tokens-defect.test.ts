import { afterEach, describe, expect, it, vi } from 'vitest';

import deriveTokens from '../derive-tokens.js';

// The one state no snippet can reach: the leaf itself defecting. The module
// mock simulates it — the healthy suite lives in derive-tokens.test.ts,
// untouched by the mock; this file pins the degradation contract alone.
vi.mock('../../lib/scanning/derive-input-elements.js', () => ({
	default: () => {
		throw new Error('forced leaf defect');
	},
}));

afterEach(() => {
	vi.restoreAllMocks();
});

describe.skip('deriveTokens — a defecting enrichment derivation', () => {
	it('still publishes the tokens stage value', () => {
		const stage = deriveTokens({ source: 'let x = 1', type: 'script' });
		expect(stage.ok && stage.value.tokens).toHaveLength(4);
	});

	it('publishes the value without the member', () => {
		const stage = deriveTokens({ source: 'let x = 1', type: 'script' });
		expect(stage.ok && stage.value.inputElements).toBeUndefined();
	});

	it('reports the defect loudly', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		deriveTokens({ source: 'let x = 1', type: 'script' });
		expect(errorSpy).toHaveBeenCalledTimes(1);
	});
});
