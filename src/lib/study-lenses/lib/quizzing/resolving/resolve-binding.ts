/**
 * @file The `resolveBinding` resolver — quizzing's permanent occurrence→binding
 * resolution layer. Given an identifier occurrence and the scope forest (from
 * `./read-scope-forest.ts`), it returns the binding the occurrence resolves to
 * under lexical, shadowing-aware scoping. `buildScope` produces a forest plus
 * read/write counts but no occurrence→binding edges; this walk adds them. See
 * `../DOCS.md` § "The accessor-helper seam" (the occurrence→binding row is
 * permanent — only its scope-forest input migrates B→C).
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type {
	DeclarationInfo,
	ScopeAnalysis,
	ScopeInfo,
} from '../../../embody/lib/scope/types.js';

import type { Binding, Occurrence } from './types.js';

/**
 * Resolve an identifier occurrence to the binding it lexically refers to.
 *
 * Descends to the deepest scope containing `occurrence.start`, then climbs the
 * parent chain returning the first scope that declares `occurrence.text` (inner
 * shadows outer — the same model as `buildScope`'s own declaration lookup).
 *
 * @remarks
 * - It answers *which binding is this name bound to here* — it does **not** decide
 *   whether the occurrence is semantically a variable reference. Distinguishing a
 *   reference from a property name (`obj.foo`) or a declaration site needs AST
 *   position the occurrence (`start` + `text`) does not carry, so it is the
 *   **caller's** responsibility: binding-aware generators must feed only real
 *   reference / declaration occurrences. With a same-named in-scope variable, a
 *   property-name occurrence would mis-resolve to that variable — a known,
 *   documented precondition, not a bug to fix in this leaf.
 * - **Known boundary:** a self-shadowing `for (const v of v)` resolves the iterable
 *   `v` to the loop binding rather than the outer one (the for-of node range
 *   contains its own iterable); pathological in JeJ teaching code, accepted.
 * - **Total / never throws.** Returns `null` when no binding for the name is
 *   visible at the position (global, undeclared, or property-name occurrence).
 * - **Declaration-site occurrences resolve to their own binding** (wanted by the
 *   declaration-site and provenance forms).
 * - **Pure / frozen.** Reads the frozen forest without mutation; the returned
 *   `Binding` (and its range tuple) is frozen.
 */
export default function resolveBinding(
	occurrence: Occurrence,
	forest: ScopeAnalysis,
): Binding | null {
	const scope = findScopeAtOffset(occurrence.start, forest.root);
	const declaration = lookupBinding(occurrence.text, scope);
	return declaration === null ? null : toBinding(declaration);
}

/**
 * Descend to the deepest scope whose node range contains `offset`. Scope node
 * ranges nest by AST containment and siblings are disjoint, so the first child
 * that contains the offset is the one to recurse into; a scope with no such child
 * is the innermost one for that offset.
 */
function findScopeAtOffset(offset: number, scope: ScopeInfo): ScopeInfo {
	for (const child of scope.children) {
		if (child.node.start <= offset && offset < child.node.end) {
			return findScopeAtOffset(offset, child);
		}
	}
	return scope;
}

/**
 * Climb the scope chain outward from `scope`, returning the first declaration of
 * `name` (inner shadows outer), or null when no scope in the chain declares it.
 * Mirrors `buildScope`'s own (unexported) declaration lookup, over the frozen
 * `ScopeInfo` tree.
 */
function lookupBinding(name: string, scope: ScopeInfo): DeclarationInfo | null {
	let current: ScopeInfo | null = scope;
	while (current !== null) {
		const declaration = current.declarations.get(name);
		if (declaration !== undefined) {
			return declaration;
		}
		current = current.parent;
	}
	return null;
}

/**
 * Project an embody `DeclarationInfo` onto the minimal quizzing `Binding` view:
 * the declared name, the declaration-site span (the binding identity), and the
 * declaration `kind` (`let` / `const`, copied straight off `DeclarationInfo.kind`
 * for reassignability questions). Frozen, matching the module's frozen-output
 * contract.
 */
function toBinding(declaration: DeclarationInfo): Binding {
	const binding: Binding = {
		name: declaration.name,
		declarationRange: [declaration.node.start, declaration.node.end],
		kind: declaration.kind,
	};
	deepFreezeInPlace(binding);
	return binding;
}
