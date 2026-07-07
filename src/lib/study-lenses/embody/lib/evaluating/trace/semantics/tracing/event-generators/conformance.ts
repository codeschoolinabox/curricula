/**
 * @file Compile-time conformance helpers for event generators.
 *
 * Each generator returns a hand-written `*DomainFields` type — the canonical
 * event's fields minus the base fields the dispatcher stamps. Because the
 * dispatcher merges then casts (`create-trace-event.ts` `as TraceEvent`), the
 * hand-written type has no automatic tie-back to `../types.ts`. These helpers
 * restore a tie-back the standalone tsc probe enforces.
 *
 * FLAT events (literal, property, operators, templates, function-call, scope,
 * jump) use full bidirectional conformance:
 *   `Expect<Equal<*DomainFields, DistributiveOmit<*Event, keyof BaseEvent>>>`
 * — any change to the canonical event the generator fails to mirror fails the
 * probe.
 *
 * DISCRIMINATED events (BindingEvent, ConditionalEvent, LoopEvent) cannot use
 * `Equal`: the contract writes them as `BaseEvent & {common} & (variant-union)`
 * — an intersection-of-union that `Omit`/`Extract`/`DistributiveOmit` all
 * collapse to the common keys, discarding the per-variant fields (no generic TS
 * expression recovers them). Those generators tie back two weaker-but-real
 * ways: (1) a one-directional shape check
 *   `Expect<[*DomainFields] extends [DistributiveOmit<*Event, keyof BaseEvent>]
 *   ? true : false>`
 * ties the common fields + the discriminant set to types.ts; (2) the
 * generator's own `: *DomainFields` return annotation forces a correctly-
 * narrowed body — a flat or mis-shaped return fails to compile. Residual
 * per-variant field drift is covered by human/AR review, not the type system.
 *
 * `DistributiveOmit` distributes `Omit` over a genuine top-level union; for the
 * intersection-of-union contracts above it reduces to a plain (collapsing)
 * `Omit`, which is exactly what the one-directional check compares against.
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
