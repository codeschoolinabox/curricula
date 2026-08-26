/**
 * @file The `usageGroupKey` serializer — quizzing's binding × use-type `groupKey`
 * formatter. Given a resolved `Binding` and a `UsageKind`, it returns the
 * deterministic propagation-group string that keys the usage-kind form (V7)
 * and the binding × use-type sameness form (V10b) on the pair
 * `(binding identity, use-type)`. One member of the namespaced-key family: each
 * keying axis owns a stable prefix (see the siblings `./binding-group-key.ts` and
 * `./classification-group-key.ts`, and `../README.md` § Glossary "Group key").
 *
 * This is the structure the README/DOCS anticipate for the `usage:` axis when it
 * "gains binding × use-type grain at V10b": a key that ties together every
 * occurrence of one binding used one way, superseding the per-occurrence
 * group-of-one (`usage:<start>-<end>`) once the usage-kind form (V7) adopts it.
 */

import type { UsageKind } from '../context/types.js';
import type { Binding } from '../resolving/types.js';

/**
 * Format the binding × use-type `groupKey` for a resolved binding and a use-type.
 *
 * Keys on the binding's `declarationRange` (its stable identity — the same span
 * `bindingGroupKey` uses) refined by the `usageKind`, so two occurrences share a
 * group iff they resolve to the same binding AND are used the same way. The format
 * is `usage:<decl-start>-<decl-end>:<usageKind>`. Three segments distinguish it
 * from `bindingGroupKey`'s two-segment `binding:<start>-<end>` and from V7's
 * unresolved-global fallback `usage:occ:<start>-<end>`.
 *
 * @remarks
 * - **Pure / deterministic.** Same `(binding, usageKind)` → same string; no I/O, no
 *   mutation. Returns a plain string (nothing to freeze).
 * - **Collision-free.** The `usage:` prefix names the usage axis; `UsageKind` is a
 *   closed kebab union containing no `:`, and the declaration span is numeric, so
 *   the three segments never blur and the key never collides with the sibling
 *   `binding:` / `category:` / `usage-kind:` axes.
 */
export default function usageGroupKey(
	binding: Binding,
	usageKind: UsageKind,
): string {
	return `usage:${binding.declarationRange[0]}-${binding.declarationRange[1]}:${usageKind}`;
}
