/**
 * @file Walks scopeStack top-down to find a variable's owning scope and metadata.
 *
 * Shadowing works naturally: inner scope's binding is found first. When inner
 * scope pops, outer scope's binding is found again.
 */

import type { TracerState, ScopeInfo, VariableInfo } from '../types.js';

/**
 * Looks up a variable by name, walking the scope stack from top (innermost)
 * to bottom (outermost).
 *
 * @param state - Tracer state with scopeStack
 * @param name - Variable name to find
 * @returns The owning scope and variable info, or null if not found
 */
export default function lookupVariable(
	state: TracerState,
	name: string,
): { scope: ScopeInfo; info: VariableInfo } | null {
	for (let i = state.scopeStack.length - 1; i >= 0; i -= 1) {
		const scope = state.scopeStack[i];
		if (name in scope.variables) {
			return { scope, info: scope.variables[name] };
		}
	}
	return null;
}
