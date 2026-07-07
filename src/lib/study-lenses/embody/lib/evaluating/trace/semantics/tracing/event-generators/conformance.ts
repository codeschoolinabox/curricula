/**
 * @file Compile-time conformance helpers for event generators.
 *
 * Each generator returns a hand-written `*DomainFields` type — the canonical
 * event's fields minus the base fields the dispatcher stamps. Because the
 * dispatcher merges then casts (`create-trace-event.ts` `as TraceEvent`), the
 * hand-written type has no automatic tie-back to `../types.ts`. A per-generator
 * `Expect<Equal<*DomainFields, DistributiveOmit<*Event, keyof BaseEvent>>>`
 * assertion restores it: a change to the canonical event that the generator
 * fails to mirror becomes a standalone-tsc-probe error at the generator.
 *
 * `DistributiveOmit` (not the built-in `Omit`) is required because the
 * discriminated-union events (BindingEvent, ConditionalEvent, LoopEvent,
 * ScopeEvent) are unions of intersections — a plain `Omit` over such a union
 * collapses every variant to the common keys, discarding the per-variant
 * fields the generator produces.
 */

/** `Omit` that distributes over a union, preserving each variant's members. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
	? Omit<T, K>
	: never;

/** True only when A and B are the exact same type (readonly + optional included). */
export type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
		? true
		: false;

/** Compile error unless T resolves to exactly `true`. */
export type Expect<T extends true> = T;
