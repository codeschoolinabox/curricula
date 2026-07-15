/**
 * @file The `realmGroupKey` serializer — quizzing's realm-provenance `groupKey`
 * formatter. Given a realm-global `name`, it returns the deterministic
 * propagation-group string that keys the realm-provenance forms (V3's realm branch,
 * V5 value-category) on the realm name, so every occurrence of one realm global
 * shares a group — every `Math` reference shares `realm:Math`, every `console`
 * reference shares `realm:console`. One member of the namespaced-key family, and the
 * SEVENTH axis it introduces (after `category:` / `binding:` / `usage:` /
 * `usage-kind:` / `element-type:` / `chain:`) — but only the sixth `keying/`
 * serializer FILE, because `element-type:` is an inline key in V6b, not a file. See
 * the five sibling serializer files `./chain-group-key.ts`, `./binding-group-key.ts`,
 * `./classification-group-key.ts`, `./usage-group-key.ts`, `./usage-kind-group-key.ts`,
 * and `../README.md` § Glossary "Group key".
 *
 * Binding-agnostic by design, like `chain:` and `usage-kind:`: a realm name is never
 * a program binding (V3 keys the realm axis only after `resolveBinding` returns
 * `null`), so this axis takes a raw `name`, not a `Binding`. It is the counterpart to
 * V3's other branch — a program-declared occurrence keys `binding:<decl>` via
 * `./binding-group-key.ts`; a realm occurrence keys `realm:<name>` here.
 */

/**
 * Format the realm-provenance `groupKey` for a realm-global name.
 *
 * Keys on the `name` with a dedicated `realm:` prefix. The format is `realm:<name>`.
 *
 * @remarks
 * - **Pure / deterministic.** Same `name` → same string; no I/O, no mutation. Returns
 *   a plain string (nothing to freeze).
 * - **Collision-free.** The `realm:` prefix names its own axis, and `name` is an
 *   anchor `name` — a parsed JS Identifier's text (`IdentifierAnchor.name`), `:`-free
 *   by construction — so the two segments `realm:<name>` never blur. Callers must not
 *   pass arbitrary strings: the proof depends on the `:`-free provenance the type
 *   cannot enforce. Against the six sibling prefixes (`category:` / `binding:` /
 *   `usage:` / `usage-kind:` / `element-type:` / `chain:`), `realm:` is the only axis
 *   beginning with `r`, so it diverges at CHARACTER 1 against all six — no `realm:…`
 *   string is a prefix of, or prefixed by, any of them.
 */
export default function realmGroupKey(name: string): string {
	return `realm:${name}`;
}
