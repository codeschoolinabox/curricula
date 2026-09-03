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

describe('deriveTokens — a defecting enrichment derivation', () => {
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

describe('deriveTokens — a defecting bounded derivation over a failing tokenization', () => {
	it('still publishes the prefix account', () => {
		const stage = deriveTokens({ source: '@', type: 'module' });
		expect(!stage.ok && stage.value?.tokens).toEqual([]);
	});

	it('keeps its cause beside the degraded account', () => {
		const stage = deriveTokens({ source: '@', type: 'module' });
		expect(!stage.ok && stage.cause.stage).toBe('tokens');
	});

	it('publishes the account without the bounded sequence', () => {
		const stage = deriveTokens({ source: '@', type: 'module' });
		expect(!stage.ok && stage.value?.inputElements).toBeUndefined();
	});

	it('reports the defect loudly', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		deriveTokens({ source: '@', type: 'module' });
		expect(errorSpy).toHaveBeenCalledTimes(1);
	});
});
