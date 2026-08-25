/**
 * @file The `categoryRoleGroupKey` serializer — quizzing's classification-axis
 * `groupKey` formatter. Given a token's primary `Category` and its `Role` (or
 * `null`), it returns the deterministic propagation-group string that keys
 * classification forms (the category-ID form and later role-aware forms). One
 * member of the namespaced-key family: each keying axis owns a stable prefix and
 * refines within it (see the sibling `./binding-group-key.ts` for the
 * binding-identity axis, and `../README.md` § Glossary "Group key").
 */

import type { Category, Role } from '../../../classifying/types.js';

/**
 * Format the classification-axis `groupKey` for a token's category and role.
 *
 * The classification axis keys on `Category`, refined by `Role` where the token
 * carries one: a `null` role collapses to the bare `category:<category>`, a
 * present role appends `category:<category>:<role>`. `identifier` and `keyword`
 * carry `role: null` permanently (classifying refines only delimiter / operator
 * / literal), so their keys are the bare two-segment form. The `:` separator is
 * collision-free — `Category` is a closed five-value enum and `Role` a closed
 * kebab union, neither containing `:`.
 *
 * @remarks
 * - **Pure / deterministic.** Same `(category, role)` → same string; no I/O, no
 *   mutation. Returns a plain string (nothing to freeze).
 * - **Namespaced.** The `category:` prefix names the classification axis and can
 *   never collide with the sibling `binding:` axis.
 */
export default function categoryRoleGroupKey(
	category: Category,
	role: Role | null,
): string {
	return role === null
		? `category:${category}`
		: `category:${category}:${role}`;
}
