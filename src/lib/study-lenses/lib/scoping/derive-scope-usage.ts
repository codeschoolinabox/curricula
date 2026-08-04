/**
 * @file Flatten embody's scope environment into a per-declaration usage view.
 *
 * @remarks The single public export of `lib/scoping`. Given a snippet's scope
 * environment (embody's static scope graph, computed once via eslint-scope),
 * produces one frozen `VariableUsage` per `let`/`const` binding — its name and
 * kind, its post-declaration read/write counts, its declared identifier node,
 * and whether it is exported — gathered into a flat `ScopeUsage` that crosses
 * every scope depth.
 *
 * Pure and total: it reads embody's per-reference access classification, it
 * never re-walks the AST or recomputes scope, and it never mutates the
 * environment or any AST node (safe on deep-frozen facts). See `./README.md`
 * for the fold rule and `./DOCS.md` for the execution phases.
 */

import deepFreezeExcept from '@utils/deep-freeze-except.js';

import type { Environment, Scope, ScopeVariable } from '../../embody/types.js';

import type { ScopeUsage, VariableUsage } from './types.js';

/**
 * Projects a scope environment into a flat per-declaration usage view.
 *
 * @param environment - embody's `Environment` (the unwrapped `facts.environment`
 *   value; the caller narrows `facts.environment.ok` and passes `.value`).
 * @returns A deeply frozen `ScopeUsage` — one `VariableUsage` per `let`/`const`
 *   binding across every scope depth; non-`let`/`const` bindings are omitted.
 */
export default function deriveScopeUsage(environment: Environment): ScopeUsage {
	const allDeclarations = enumerateScopes(environment.root)
		.flatMap((scope) => scope.variables)
		.map((variable) => toVariableUsage(variable))
		.filter((usage): usage is VariableUsage => usage !== null);

	// Freeze what we own; never the borrowed identifier nodes (foreign AST
	// references we carry by identity, not objects this leaf allocated).
	const borrowedNodes = new Set(allDeclarations.map((usage) => usage.node));
	return deepFreezeExcept({ allDeclarations }, borrowedNodes);
}

// ─── Enumerate ─────────────────────────────────────────────

/**
 * The root scope and every nested scope, at every depth. Recurses
 * `childScopes` — never `byPath`, which collapses path collisions (a module's
 * global and module scopes both key on the Program node) and would drop the
 * outer scope.
 */
function enumerateScopes(scope: Scope): readonly Scope[] {
	const fromChildren = scope.childScopes.flatMap((child) =>
		enumerateScopes(child),
	);
	return [scope, ...fromChildren];
}

// ─── Select + Fold ─────────────────────────────────────────

/**
 * Keeps only `let`/`const` bindings — `var` carries `kind: 'var'` (present but
 * filtered out here), while function / parameter / class / import / catch
 * bindings carry no `kind` at all — and folds one into a `VariableUsage`:
 * name / kind / node from its declaration, read/write counts tallied from its
 * references, and `exported` from the binding's export names.
 */
function toVariableUsage(variable: ScopeVariable): VariableUsage | null {
	const declaration = variable.defs.find(
		(definition) => definition.kind === 'let' || definition.kind === 'const',
	);
	if (declaration?.kind !== 'let' && declaration?.kind !== 'const') {
		return null;
	}
	return {
		name: variable.name,
		kind: declaration.kind,
		readCount: countReads(variable),
		writeCount: countWrites(variable),
		node: declaration.name,
		// test the length: an empty array is truthy
		exported: variable.exportedNames.length > 0,
	};
}

/** References embody classified as reading the binding (`read` or `readwrite`). */
function countReads(variable: ScopeVariable): number {
	return variable.references.filter((reference) =>
		reference.access.includes('read'),
	).length;
}

/**
 * References embody classified as writing the binding (`write` or `readwrite`),
 * excluding the declaration's own initializer — a never-reassigned `let` reports
 * `0`, the prefer-`const` signal the consumers hang on.
 */
function countWrites(variable: ScopeVariable): number {
	return variable.references.filter(
		(reference) => reference.access.includes('write') && !reference.init,
	).length;
}
