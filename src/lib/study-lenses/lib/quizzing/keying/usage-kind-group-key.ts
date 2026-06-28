/**
 * @file The `usageKindGroupKey` serializer — quizzing's cross-variable use-type
 * `groupKey` formatter. Given a `UsageKind`, it returns the deterministic
 * propagation-group string that keys the cross-variable sameness form (V10c) on
 * the bare use-type, regardless of which variable each occurrence belongs to. One
 * member of the namespaced-key family, and the fourth axis it introduces: each
 * keying axis owns a stable prefix (see the siblings `./binding-group-key.ts`,
 * `./classification-group-key.ts`, `./usage-group-key.ts`, and `../README.md`
 * § Glossary "Group key").
 *
 * Distinct from `./usage-group-key.ts`: that axis (`usage:<decl>:<kind>`) is
 * binding-scoped — it groups occurrences of ONE binding used one way. This axis
 * (`usage-kind:<kind>`) is binding-agnostic — it groups every occurrence used one
 * way, across all variables. The two prefixes (`usage:` vs `usage-kind:`) keep the
 * axes collision-free.
 */

import type { UsageKind } from '../context/types.js';

/**
 * Format the cross-variable use-type `groupKey` for a use-type.
 *
 * Keys on the bare `usageKind` with a dedicated `usage-kind:` prefix — no binding
 * identity, because the cross-variable form deliberately groups across bindings.
 * The format is `usage-kind:<usageKind>`.
 *
 * @remarks
 * - **Pure / deterministic.** Same `usageKind` → same string; no I/O, no mutation.
 *   Returns a plain string (nothing to freeze).
 * - **Collision-free.** The `usage-kind:` prefix names its own axis; `UsageKind` is
 *   a closed kebab union with no `:`. It can never collide with the sibling
 *   `usage:` axis: `usage-kind:read` shares no prefix boundary with
 *   `usage:<decl>:read` (their sixth character — 1-indexed — diverges: `-` in
 *   `usage-kind:` vs `:` in `usage:`).
 */
export default function usageKindGroupKey(usageKind: UsageKind): string {
	return `usage-kind:${usageKind}`;
}
