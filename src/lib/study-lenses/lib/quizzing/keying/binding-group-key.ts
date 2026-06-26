/**
 * @file The `bindingGroupKey` serializer — quizzing's binding-identity `groupKey`
 * formatter. Given a resolved `Binding`, it returns the deterministic
 * propagation-group string that keys binding-aware forms (V8 declaration-site, V12
 * declare-timing, …) on the binding identity. One member of the namespaced-key
 * family: each keying axis owns a stable prefix (see the sibling
 * `./classification-group-key.ts` for the classification axis, and `../README.md`
 * § Glossary "Group key").
 */

import type { Binding } from '../resolving/types.js';

/**
 * Format the binding-identity `groupKey` for a resolved binding.
 *
 * Keys on the binding's `declarationRange` — its stable identity: two occurrences
 * resolve to the same binding iff their `declarationRange`s are equal (each
 * declarator id has a unique span). The format is `binding:<start>-<end>`. The
 * binding's `name` is deliberately omitted: it is non-identity data that belongs
 * to the per-item `id` axis (`form/binding:x@decl`), not the propagation key —
 * keeping it out leaves the binding identity pure and the two axes distinct.
 *
 * @remarks
 * - **Pure / deterministic.** Same `Binding` → same string; no I/O, no mutation.
 *   Returns a plain string (nothing to freeze).
 * - **Collision-free.** Distinct bindings have distinct `declarationRange`s, and
 *   the `binding:` prefix can never collide with the sibling `category:` axis.
 */
export default function bindingGroupKey(binding: Binding): string {
	return `binding:${binding.declarationRange[0]}-${binding.declarationRange[1]}`;
}
