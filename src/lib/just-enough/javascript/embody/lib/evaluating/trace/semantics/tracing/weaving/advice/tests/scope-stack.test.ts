import { describe, expect, it } from 'vitest';

import {
	pushScope,
	popScope,
	currentScope,
	parentScope,
	findNearestLoop,
} from '../scope-stack.js';

import type { TracerState, ScopeInfo } from '../../types.js';

function makeScope(overrides: Partial<ScopeInfo> = {}): ScopeInfo {
	return {
		creationStep: 1,
		depth: 0,
		kind: 'block',
		structure: null,
		structureStep: null,
		variables: {},
		...overrides,
	};
}

function makeState(overrides: Partial<TracerState> = {}): TracerState {
	return {
		trace: [],
		step: 0,
		eventStep: 0,
		scopeStack: [],
		iterationCounters: {},
		lastExpressionResult: null,
		previousExpressionResult: null,
		lastReadValues: {},
		config: {},
		variableKinds: {},
		lastEmittedNodePath: '',
		lastEmittedTag: null,
		visitCounts: {},
		...overrides,
	};
}

// ─── pushScope ──────────────────────────────────────────────────────────────

describe('pushScope', () => {
	it('Z: empty stack, step=0 → step becomes 1, returns ScopeInfo with depth=0, creationStep=1', () => {
		const state = makeState({ step: 0, scopeStack: [] });
		const result = pushScope(state, { kind: 'block', structure: null });
		expect(state.step).toBe(1);
		expect(result.creationStep).toBe(1);
		expect(result.depth).toBe(0);
	});

	it('O: returned ScopeInfo has all 6 fields', () => {
		const state = makeState();
		const result = pushScope(state, { kind: 'module', structure: 'while' });
		expect(result).toHaveProperty('creationStep');
		expect(result).toHaveProperty('depth');
		expect(result).toHaveProperty('kind');
		expect(result).toHaveProperty('structure');
		expect(result).toHaveProperty('structureStep');
		expect(result).toHaveProperty('variables');
	});

	it('O: variables is {} (empty, mutable)', () => {
		const state = makeState();
		const result = pushScope(state, { kind: 'block', structure: null });
		expect(result.variables).toEqual({});
		result.variables['x'] = { kind: 'let', declarationStep: 1, initialized: false };
		expect(result.variables['x']).toBeDefined();
	});

	it('O: step increments by exactly 1 — guards against double-increment during migration', () => {
		const state = makeState({ step: 5 });
		pushScope(state, { kind: 'block', structure: null });
		expect(state.step).toBe(6);
	});

	it('B: structure null → structureStep null', () => {
		const state = makeState();
		const result = pushScope(state, { kind: 'block', structure: null });
		expect(result.structure).toBeNull();
		expect(result.structureStep).toBeNull();
	});

	it('B: structure "while" → structureStep equals creationStep', () => {
		const state = makeState();
		const result = pushScope(state, { kind: 'block', structure: 'while' });
		expect(result.structure).toBe('while');
		expect(result.structureStep).toBe(result.creationStep);
	});

	it('B: structure undefined → treated as null (structureStep null, structure null)', () => {
		const state = makeState();
		const result = pushScope(state, { kind: 'block', structure: undefined });
		expect(result.structure).toBeNull();
		expect(result.structureStep).toBeNull();
	});

	it('M: push 3 → depths 0/1/2, step increments 1 each, each creationStep = its own step', () => {
		const state = makeState({ step: 0 });
		const s1 = pushScope(state, { kind: 'module', structure: null });
		const s2 = pushScope(state, { kind: 'block', structure: null });
		const s3 = pushScope(state, { kind: 'block', structure: null });

		expect(s1.depth).toBe(0);
		expect(s2.depth).toBe(1);
		expect(s3.depth).toBe(2);

		expect(s1.creationStep).toBe(1);
		expect(s2.creationStep).toBe(2);
		expect(s3.creationStep).toBe(3);

		expect(state.step).toBe(3);
	});
});

// ─── popScope ───────────────────────────────────────────────────────────────

describe('popScope', () => {
	it('Z: empty stack → returns undefined, no throw', () => {
		const state = makeState({ scopeStack: [] });
		expect(() => popScope(state)).not.toThrow();
		expect(popScope(state)).toBeUndefined();
	});

	it('O: push one, pop → returns it; stack empty after', () => {
		const state = makeState();
		const pushed = pushScope(state, { kind: 'block', structure: null });
		const popped = popScope(state);
		expect(popped).toBe(pushed);
		expect(state.scopeStack).toHaveLength(0);
	});

	it('M: push 3, pop 3 → LIFO order; each pop returns the most recently pushed', () => {
		const state = makeState();
		const s1 = pushScope(state, { kind: 'module', structure: null });
		const s2 = pushScope(state, { kind: 'block', structure: null });
		const s3 = pushScope(state, { kind: 'block', structure: 'for' });

		expect(popScope(state)).toBe(s3);
		expect(popScope(state)).toBe(s2);
		expect(popScope(state)).toBe(s1);
		expect(state.scopeStack).toHaveLength(0);
	});
});

// ─── currentScope ───────────────────────────────────────────────────────────

describe('currentScope', () => {
	it('Z: empty stack → undefined', () => {
		const state = makeState({ scopeStack: [] });
		expect(currentScope(state)).toBeUndefined();
	});

	it('O: 1 item → returns it', () => {
		const scope = makeScope({ creationStep: 7 });
		const state = makeState({ scopeStack: [scope] });
		expect(currentScope(state)).toBe(scope);
	});

	it('M: 3 items → returns innermost (last pushed), not outermost', () => {
		const outer = makeScope({ creationStep: 1, depth: 0 });
		const middle = makeScope({ creationStep: 2, depth: 1 });
		const inner = makeScope({ creationStep: 3, depth: 2 });
		const state = makeState({ scopeStack: [outer, middle, inner] });
		expect(currentScope(state)).toBe(inner);
	});
});

// ─── parentScope ────────────────────────────────────────────────────────────

describe('parentScope', () => {
	it('Z: empty stack → undefined', () => {
		const state = makeState({ scopeStack: [] });
		expect(parentScope(state)).toBeUndefined();
	});

	it('O: 1 item → undefined (no parent)', () => {
		const state = makeState({ scopeStack: [makeScope()] });
		expect(parentScope(state)).toBeUndefined();
	});

	it('O: 2 items → returns the first pushed (index 0)', () => {
		const first = makeScope({ creationStep: 1 });
		const second = makeScope({ creationStep: 2 });
		const state = makeState({ scopeStack: [first, second] });
		expect(parentScope(state)).toBe(first);
	});

	it('M: 3 items → returns index 1 (second from top), not top or bottom', () => {
		const bottom = makeScope({ creationStep: 1, depth: 0 });
		const mid = makeScope({ creationStep: 2, depth: 1 });
		const top = makeScope({ creationStep: 3, depth: 2 });
		const state = makeState({ scopeStack: [bottom, mid, top] });
		expect(parentScope(state)).toBe(mid);
	});
});

// ─── findNearestLoop ────────────────────────────────────────────────────────

describe('findNearestLoop', () => {
	it('Z: empty stack → null', () => {
		const state = makeState({ scopeStack: [] });
		expect(findNearestLoop(state, null)).toBeNull();
	});

	it('O: one loop scope, jumpTarget=null → derives target, returns { structure, creationStep }', () => {
		const state = makeState({
			scopeStack: [makeScope({ structure: 'while', structureStep: 1, creationStep: 1 })],
		});
		const result = findNearestLoop(state, null);
		expect(result).not.toBeNull();
		expect(result!.structure).toBe('while');
		expect(result!.creationStep).toBe(1);
	});

	it('O: one loop scope, explicit jumpTarget="while" → matches directly', () => {
		const state = makeState({
			scopeStack: [makeScope({ structure: 'while', creationStep: 3 })],
		});
		const result = findNearestLoop(state, 'while');
		expect(result!.structure).toBe('while');
		expect(result!.creationStep).toBe(3);
	});

	it('B: explicit jumpTarget="for" but only "while" in stack → null (no match)', () => {
		const state = makeState({
			scopeStack: [makeScope({ structure: 'while', creationStep: 1 })],
		});
		expect(findNearestLoop(state, 'for')).toBeNull();
	});

	it('B: jumpTarget=null, stack has only conditional scopes → null (no loop to derive target from)', () => {
		const state = makeState({
			scopeStack: [
				makeScope({ structure: 'conditional', creationStep: 1 }),
				makeScope({ structure: 'conditional', creationStep: 2 }),
			],
		});
		expect(findNearestLoop(state, null)).toBeNull();
	});

	it('B: conditional scope at top, loop scope below → returns loop scope (conditional skipped)', () => {
		const state = makeState({
			scopeStack: [
				makeScope({ structure: 'while', creationStep: 1, depth: 0 }),
				makeScope({ structure: 'conditional', creationStep: 2, depth: 1 }),
			],
		});
		const result = findNearestLoop(state, null);
		expect(result!.structure).toBe('while');
		expect(result!.creationStep).toBe(1);
	});

	it('B: scope with null structure at top, loop scope below → returns loop scope (null-structure skipped)', () => {
		const state = makeState({
			scopeStack: [
				makeScope({ structure: 'for', creationStep: 1, depth: 0 }),
				makeScope({ structure: null, creationStep: 2, depth: 1 }),
			],
		});
		const result = findNearestLoop(state, null);
		expect(result!.structure).toBe('for');
		expect(result!.creationStep).toBe(1);
	});

	it('M: nested loops [while outer, for inner], jumpTarget=null → returns innermost "for"', () => {
		const state = makeState({
			scopeStack: [
				makeScope({ structure: 'while', creationStep: 1, depth: 0 }),
				makeScope({ structure: 'for', creationStep: 5, depth: 1 }),
			],
		});
		const result = findNearestLoop(state, null);
		expect(result!.structure).toBe('for');
		expect(result!.creationStep).toBe(5);
	});

	it('B: explicit jumpTarget="while" with [while-outer, conditional, for-inner] → returns outer "while", not inner "for"', () => {
		// Forces scope.structure === target comparison to be load-bearing:
		// a buggy "return first qualifying scope" implementation would return the
		// inner 'for' (top of stack), but the correct answer is the outer 'while'.
		const state = makeState({
			scopeStack: [
				makeScope({ structure: 'while', creationStep: 1, depth: 0 }),
				makeScope({ structure: 'conditional', creationStep: 2, depth: 1 }),
				makeScope({ structure: 'for', creationStep: 3, depth: 2 }),
			],
		});
		const result = findNearestLoop(state, 'while');
		expect(result!.structure).toBe('while');
		expect(result!.creationStep).toBe(1);
	});

	it('B: explicit jumpTarget="for" with [while, conditional, for] → returns innermost "for", skipping conditional', () => {
		// Explicit non-null target where the matching scope is not at the top,
		// with non-qualifying scopes between top and the match.
		const state = makeState({
			scopeStack: [
				makeScope({ structure: 'while', creationStep: 1, depth: 0 }),
				makeScope({ structure: 'conditional', creationStep: 2, depth: 1 }),
				makeScope({ structure: 'for', creationStep: 7, depth: 2 }),
			],
		});
		const result = findNearestLoop(state, 'for');
		expect(result!.structure).toBe('for');
		expect(result!.creationStep).toBe(7);
	});
});
