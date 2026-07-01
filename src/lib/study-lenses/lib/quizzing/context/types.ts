/**
 * @file Internal types for the quizzing generation context — the two anchor
 * streams the single AST descent produces (the `identifierAnchors` stream the
 * node-anchored generators V7 usage-kind / V8 declaration-site consume, and the
 * `propertyAccessAnchors` stream the program-anchored V4 two-chains reads) plus the
 * scope forest. NOT part of the locked public contract (`../types.ts`); these are
 * resolving-cluster-style internal types, free to widen additively as forms need
 * more. See `../DOCS.md` § Execution phases, Phase 2 (the single AST descent → two
 * per-node anchor streams).
 */

import type { ScopeAnalysis } from '../../../embody/lib/scope/types.js';
import type { ClassifiedToken } from '../../classifying/types.js';

/**
 * How an identifier occurrence uses its variable, read off the AST position
 * alone: `declared` (a declarator id), `read` (a reference that uses the value),
 * `assigned` (a simple `=` assignment target), or `read-and-assigned` (a compound
 * `+=` target or an `x++` update — both reads and writes). This is V7's answer
 * key; it needs no binding resolution, only syntactic position.
 */
export type UsageKind = 'declared' | 'read' | 'assigned' | 'read-and-assigned';

/**
 * One genuine variable occurrence in the source, as the single AST descent emits
 * it: its `[start, end)` `range` (zero-indexed, half-open — a node-anchored
 * item's `anchorRange`), the identifier `name`, and its `usageKind`. Property
 * names (`o.x`) and non-computed object-literal keys are **never** emitted into
 * **this** stream — the descent routes non-computed member property names to the
 * separate `PropertyAccessAnchor` stream (which no binding-aware generator reads)
 * and drops object-literal keys entirely, so a binding-aware generator never feeds
 * `resolveBinding` a non-reference occurrence (the inc-2 FLAG mitigation).
 */
export type IdentifierAnchor = Readonly<{
	range: readonly [number, number];
	name: string;
	usageKind: UsageKind;
}>;

/**
 * One non-computed member-property occurrence (`o.x`'s `x`, `str.length`'s
 * `length`), as the single AST descent emits it into the second, sibling stream:
 * its `[start, end)` `range` — the **property identifier's own span** (a V4
 * prototype-chain item's `anchorRange`), not the whole member expression — and the
 * property `name`. It carries **no** `usageKind`: a property name is a
 * prototype-chain lookup (`proto-check`), not a scope-chain binding use, so
 * read / write / declare semantics do not apply. Only V4 "two chains" reads this
 * stream (for its prototype-chain items); no binding-aware generator does, so a
 * property name can never reach `resolveBinding` (the inc-2 FLAG holds by
 * construction — the two streams are disjoint).
 */
export type PropertyAccessAnchor = Readonly<{
	range: readonly [number, number];
	name: string;
}>;

/**
 * The single read-only bundle every generator receives — the chokepoint that
 * owns "what a generator sees" (DOCS § Execution phases, Phase 2). Carries the
 * pre-computed `classified` token stream (the per-token generators' input), the
 * two anchor streams from one AST descent — `identifierAnchors` (the per-node
 * generators' input) and `propertyAccessAnchors` (the program-anchored V4's
 * prototype-chain input) — and the lexical scope `forest` the binding-aware
 * generators resolve occurrences through. Surfaces join this bundle as their
 * consumers land; the V1 path needs none of them.
 */
export type GenerationContext = Readonly<{
	classified: readonly ClassifiedToken[];
	identifierAnchors: readonly IdentifierAnchor[];
	propertyAccessAnchors: readonly PropertyAccessAnchor[];
	forest: ScopeAnalysis;
}>;
