/**
 * @file Scope frame lifecycle on TracerState.scopeStack.
 *
 * Owns exactly: push/pop/lookup of ScopeInfo frames on the scope stack.
 * Does NOT emit events, read config, look up variables, or register bindings.
 *
 * Named exports — justified exception to one-default-export rule.
 * See AGENTS.md "Export Conventions" for the utility-module exception.
 *
 * Note: ScopeInfo.variables is intentionally mutable after pushScope returns.
 * block-declaration writes variable registrations into it during the same block.
 * This is a deliberate architectural choice — freezing ScopeInfo would prevent
 * variable registration. The freeze convention applies to emitted events, not
 * to internal tracking state.
 */

import type { TracerState, ScopeInfo } from '../types.js';

/**
 * Increments state.step, builds a ScopeInfo, pushes it onto the stack,
 * and returns the new ScopeInfo.
 *
 * step ownership: the increment belongs here — callers must NOT also increment.
 * structureStep is derived internally from structure (same step value).
 */
function pushScope(
	state: TracerState,
	args: { kind: string; structure: string | null | undefined },
): ScopeInfo {
	state.step += 1;
	const structure = args.structure ?? null;
	const scope: ScopeInfo = {
		creationStep: state.step,
		depth: state.scopeStack.length,
		kind: args.kind,
		structure,
		structureStep: structure ? state.step : null,
		variables: {},
	};
	state.scopeStack.push(scope);
	return scope;
}

/**
 * Pops and returns the innermost ScopeInfo.
 * Returns undefined (no throw) when the stack is empty.
 */
function popScope(state: TracerState): ScopeInfo | undefined {
	return state.scopeStack.pop();
}

/**
 * Returns the innermost (most recently pushed) ScopeInfo, without removing it.
 * Returns undefined when the stack is empty.
 */
function currentScope(state: TracerState): ScopeInfo | undefined {
	return state.scopeStack[state.scopeStack.length - 1];
}

/**
 * Returns the second-from-top ScopeInfo (the direct parent scope).
 * Returns undefined when the stack has fewer than 2 entries.
 */
function parentScope(state: TracerState): ScopeInfo | undefined {
	return state.scopeStack.length > 1
		? state.scopeStack[state.scopeStack.length - 2]
		: undefined;
}

/**
 * Walks the scope stack top-down to find the nearest enclosing loop scope.
 *
 * Skips scopes with null structure or structure === 'conditional'.
 * If jumpTarget is null, derives the target from the first qualifying scope found,
 * then continues to find that scope's creationStep (they will be the same scope).
 *
 * Returns null (never creationStep:0) when no matching loop scope is found.
 * creationStep:0 is impossible in valid state because pushScope always increments
 * state.step before building ScopeInfo (minimum creationStep = 1).
 */
function findNearestLoop(
	state: TracerState,
	jumpTarget: string | null,
): { structure: string; creationStep: number } | null {
	let target = jumpTarget;
	for (let i = state.scopeStack.length - 1; i >= 0; i -= 1) {
		const scope = state.scopeStack[i];
		if (!scope.structure || scope.structure === 'conditional') continue;
		if (!target) target = scope.structure;
		if (scope.structure === target) {
			return { structure: scope.structure, creationStep: scope.creationStep };
		}
	}
	return null;
}

export {
	pushScope,
	popScope,
	currentScope,
	parentScope,
	findNearestLoop,
};
