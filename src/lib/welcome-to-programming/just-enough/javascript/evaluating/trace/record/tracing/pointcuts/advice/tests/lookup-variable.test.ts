import { describe, expect, it } from 'vitest';

import lookupVariable from '../lookup-variable.js';

import type { TracerState, ScopeInfo } from '../../types.js';

function makeScope(overrides: Partial<ScopeInfo> = {}): ScopeInfo {
	return {
		creationStep: 1,
		depth: 0,
		kind: 'module',
		structure: null,
		structureStep: null,
		variables: {},
		...overrides,
	};
}

function makeState(scopeStack: ScopeInfo[]): TracerState {
	return {
		trace: [],
		step: 0,
		scopeStack,
		iterationCounters: {},
		lastExpressionResult: null,
		config: {},
	};
}

describe('lookupVariable', () => {
	it('finds variable in single scope', () => {
		const scope = makeScope({
			variables: { x: { kind: 'let', declarationStep: 2 } },
		});
		const state = makeState([scope]);
		const result = lookupVariable(state, 'x');
		expect(result).not.toBeNull();
		expect(result!.info.kind).toBe('let');
	});

	it('returns scope reference', () => {
		const scope = makeScope({
			creationStep: 5,
			variables: { x: { kind: 'let', declarationStep: 6 } },
		});
		const state = makeState([scope]);
		const result = lookupVariable(state, 'x');
		expect(result!.scope.creationStep).toBe(5);
	});

	it('returns declarationStep', () => {
		const scope = makeScope({
			variables: { x: { kind: 'const', declarationStep: 10 } },
		});
		const state = makeState([scope]);
		expect(lookupVariable(state, 'x')!.info.declarationStep).toBe(10);
	});

	it('returns null for unknown variable', () => {
		const state = makeState([makeScope()]);
		expect(lookupVariable(state, 'notHere')).toBeNull();
	});

	it('returns null for empty scope stack', () => {
		const state = makeState([]);
		expect(lookupVariable(state, 'x')).toBeNull();
	});

	it('finds innermost binding on shadowing', () => {
		const outer = makeScope({
			creationStep: 1,
			variables: { x: { kind: 'let', declarationStep: 2 } },
		});
		const inner = makeScope({
			creationStep: 5,
			depth: 1,
			variables: { x: { kind: 'let', declarationStep: 6 } },
		});
		const state = makeState([outer, inner]);
		const result = lookupVariable(state, 'x');
		expect(result!.info.declarationStep).toBe(6);
		expect(result!.scope.creationStep).toBe(5);
	});

	it('finds outer variable when not shadowed', () => {
		const outer = makeScope({
			creationStep: 1,
			variables: { x: { kind: 'let', declarationStep: 2 } },
		});
		const inner = makeScope({
			creationStep: 5,
			depth: 1,
			variables: { y: { kind: 'const', declarationStep: 6 } },
		});
		const state = makeState([outer, inner]);
		const result = lookupVariable(state, 'x');
		expect(result!.scope.creationStep).toBe(1);
	});
});
