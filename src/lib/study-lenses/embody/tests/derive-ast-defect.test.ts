import { afterEach, describe, expect, it, vi } from 'vitest';

import deriveAst from '../derive-ast.js';
import deriveTokens from '../derive-tokens.js';

// The one state no snippet can reach: the recovering reader itself defecting.
// The module mock simulates it — the healthy suite lives in derive-ast.test.ts,
// untouched by the mock; this file pins the degradation contract alone.
vi.mock('acorn-loose', () => ({
	parse: () => {
		throw new Error('forced reader defect');
	},
}));

afterEach(() => {
	vi.restoreAllMocks();
});

describe('deriveAst — a defecting recovering reader over a grammar failure', () => {
	it('keeps its cause beside the degraded account', () => {
		const snippet = { source: 'const x = ;', type: 'module' } as const;
		const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
		expect(!stage.ok && stage.cause.stage).toBe('ast');
	});

	it('publishes no recovered tree', () => {
		const snippet = { source: 'const x = ;', type: 'module' } as const;
		const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
		expect(!stage.ok && stage.value).toBeUndefined();
	});

	it('enumerates no inventions', () => {
		const snippet = { source: 'const x = ;', type: 'module' } as const;
		const { ast: stage } = deriveAst(snippet, deriveTokens(snippet));
		expect(!stage.ok && stage.invented).toBeUndefined();
	});

	it('records nothing', () => {
		const snippet = { source: 'const x = ;', type: 'module' } as const;
		const derivation = deriveAst(snippet, deriveTokens(snippet));
		expect(derivation.parenSpansByNode.size).toBe(0);
	});

	it('reports the defect loudly', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const snippet = { source: 'const x = ;', type: 'module' } as const;
		deriveAst(snippet, deriveTokens(snippet));
		expect(errorSpy).toHaveBeenCalledTimes(1);
	});
});
