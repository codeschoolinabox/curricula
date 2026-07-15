/**
 * @file The `chainGroupKey` serializer — quizzing's chain-resolution `groupKey`
 * formatter. Given a `ChainRole` and an identifier `name`, it returns the
 * deterministic propagation-group string that keys the two-chains form (V4) on the
 * pair `(resolution chain, name)`, so every occurrence of one name resolved through
 * one chain shares a group — every bare `Math` reference shares
 * `chain:scope-chain:Math`, every `.length` property access shares
 * `chain:prototype-chain:length`. One member of the namespaced-key family, and the
 * sixth axis it introduces: each keying axis owns a stable prefix (see the siblings
 * `./binding-group-key.ts`, `./classification-group-key.ts`, `./usage-group-key.ts`,
 * `./usage-kind-group-key.ts`, and `../README.md` § Glossary "Group key").
 *
 * Binding-agnostic by design: which chain resolves a name is a syntactic-position
 * fact, independent of which binding wins under shadowing — two shadowed `x`
 * bindings both key `chain:scope-chain:x`, because both are resolved by walking the
 * scope chain (the mastery signal V4 groups on). This is the chain-resolution
 * parallel to the `usage-kind:` (binding-agnostic) vs `usage:` (binding-scoped)
 * split: V4 never resolves a binding, so this axis takes a raw `name`, not a
 * `Binding`.
 */

import type { ChainRole } from '../context/types.js';

/**
 * Format the chain-resolution `groupKey` for a role and a name.
 *
 * Keys on the pair `(role, name)` with a dedicated `chain:` prefix. The format is
 * `chain:<role>:<name>`.
 *
 * @remarks
 * - **Pure / deterministic.** Same `(role, name)` → same string; no I/O, no
 *   mutation. Returns a plain string (nothing to freeze).
 * - **Collision-free.** The `chain:` prefix names its own axis. `ChainRole` is a
 *   closed two-member kebab union containing no `:`, and `name` is an anchor `name`
 *   — a parsed JS Identifier's text (`IdentifierAnchor.name` /
 *   `PropertyAccessAnchor.name`), `:`-free by construction — so the three segments
 *   `chain:<role>:<name>` never blur. Callers must not pass arbitrary strings: the
 *   proof depends on the `:`-free provenance the type cannot enforce. Against the
 *   five sibling prefixes, `chain:` shares only a first character with `category:`,
 *   and the two diverge at character 2 (`h` vs `a`), so no `chain:…` string is a
 *   prefix of — or prefixed by — a `category:…` string; against `binding:` /
 *   `usage:` / `usage-kind:` / `element-type:` divergence is at character 1.
 */
export default function chainGroupKey(role: ChainRole, name: string): string {
	return `chain:${role}:${name}`;
}
