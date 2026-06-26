/**
 * @file The quizzing-domain `Binding` view — the minimal, identity-bearing result
 * of occurrence→binding resolution. Internal to the `resolving/` cluster (NOT the
 * locked public contract in `../types.ts`); free to widen additively as
 * binding-aware forms need more (e.g. a `kind` for "is this reassignable?"
 * questions). Deliberately decoupled from embody's `DeclarationInfo` so the B→C
 * scope-forest input swap (`buildScope` → `CreationEntwined.scopeTree`) leaves
 * this view and every downstream importer untouched.
 */

/**
 * A variable binding that an identifier occurrence resolves to under lexical
 * scoping.
 *
 * `declarationRange` is the declaration-site span `[start, end)` (the declarator's
 * id node — zero-indexed, half-open, matching the source-range convention) and is
 * the **stable binding identity**: two occurrences resolve to the same binding
 * iff their `declarationRange`s are equal (each declarator id has a unique span).
 * `name` is the declared name, kept for prompt/label use and to avoid re-slicing
 * the source. The `groupKey` serializer that keys binding-aware forms on this
 * identity lives at `../keying/binding-group-key.ts`; this view carries only the
 * identity.
 */
export type Binding = Readonly<{
	name: string;
	declarationRange: readonly [number, number];
}>;

/**
 * The minimal occurrence shape `resolveBinding` reads: a `start` offset (to find
 * the enclosing scope) and the identifier `text` (to look up the binding by
 * name). `ClassifiedToken` satisfies it structurally, and a node-anchored
 * generator satisfies it from an AST identifier's `{ start, name }` — so the
 * resolver is callable from both the token stream and the AST-descent anchor
 * stream without forcing a full `ClassifiedToken`.
 */
export type Occurrence = Readonly<{
	start: number;
	text: string;
}>;
