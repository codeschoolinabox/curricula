// cspell:ignore reassignability

/**
 * @file The `resolveBinding` resolver — quizzing's permanent occurrence→binding
 * resolution layer. Given an identifier occurrence and the scope forest (from
 * `./read-scope-forest.ts`), it returns the binding the occurrence resolves to
 * under lexical, shadowing-aware scoping. The forest carries tracked
 * declarations but no occurrence→binding edges; this walk adds them. See
 * `../DOCS.md` § Structural constraints, "Reads through the accessor
 * seam".
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { TrackedDeclaration, ScopeForest, ForestScope } from './types.js';
import type { Binding, Occurrence } from './types.js';

/**
 * Resolve an identifier occurrence to the binding it lexically refers to.
 *
 * Descends to the deepest scope containing `occurrence.start`, then climbs the
 * parent chain returning the first scope that declares `occurrence.text` (inner
 * shadows outer — standard lexical scoping).
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
	forest: ScopeForest,
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
function findScopeAtOffset(offset: number, scope: ForestScope): ForestScope {
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
 * The resolution-time twin of the projection's build-time descent, over the
 * frozen `ForestScope` tree.
 */
function lookupBinding(
	name: string,
	scope: ForestScope,
): TrackedDeclaration | null {
	let current: ForestScope | null = scope;
	while (current !== null) {
		const declaration = current.declarations[name];
		if (declaration !== undefined) {
			return declaration;
		}
		current = current.parent;
	}
	return null;
}

/**
 * Project an embody `TrackedDeclaration` onto the minimal quizzing `Binding` view:
 * the declared name, the declaration-site span (the binding identity), and the
 * declaration `kind` (`let` / `const`, copied straight off `TrackedDeclaration.kind`
 * for reassignability questions). Frozen, matching the module's frozen-output
 * contract.
 */
function toBinding(declaration: TrackedDeclaration): Binding {
	const binding: Binding = {
		name: declaration.name,
		declarationRange: [declaration.node.start, declaration.node.end],
		kind: declaration.kind,
	};
	deepFreezeInPlace(binding);
	return binding;
}
