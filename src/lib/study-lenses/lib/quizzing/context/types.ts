/**
 * @file Internal types for the quizzing generation context — the per-node
 * identifier-anchor stream the single AST descent produces and the node-anchored
 * generators (V7 usage-kind, V8 declaration-site) consume. NOT part of the locked
 * public contract (`../types.ts`); these are resolving-cluster-style internal
 * types, free to widen additively as node-anchored forms need more. See
 * `../DOCS.md` § Execution phases, Phase 2 (the single AST descent → per-node
 * anchor streams).
 */

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
 * names (`o.x`) and non-computed object-literal keys are **never** emitted — the
 * descent excludes those positions by construction, so a binding-aware generator
 * never feeds `resolveBinding` a non-reference occurrence (the inc-2 FLAG
 * mitigation).
 */
export type IdentifierAnchor = Readonly<{
	range: readonly [number, number];
	name: string;
	usageKind: UsageKind;
}>;
