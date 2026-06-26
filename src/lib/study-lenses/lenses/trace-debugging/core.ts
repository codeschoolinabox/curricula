/**
 * @file Pure-TS derivation core for the `trace-debugging` lens — the stateless
 * projections the React wrapper renders without re-deriving. The first (this
 * increment) is `formatEvent`: one streamed lifecycle event → one verbatim,
 * readable line. `deriveSettlementModel` and `formatAdmissionError` join it in
 * later increments. No React, no async; testable in vitest without jsdom (see
 * `./tests/core.test.ts`).
 *
 * @remarks Trace types are imported TYPE-ONLY from `../../embody/types.js` (the
 * lens's public contract surface — lens purity forbids any runtime import from
 * `embody/` or the tracer tier; see `./DOCS.md` § Structural constraints). A
 * `ValueSnapshot` is rendered here structurally — the tracer's internal snapshot
 * helper is not importable, so `formatEvent` owns its own crash-safe value
 * rendering (the opaque-placeholder brand is detected by shape, never by a type
 * import).
 *
 * @remarks Export shape follows the lenses peer's constant-file convention
 * (mirrors `../writeme/core.ts`): the named projection functions are bundled
 * into `traceDebuggingCore` and default-exported at the bottom, so consumers
 * read them namespaced (`traceDebuggingCore.formatEvent`) — projection #1 in
 * `./DOCS.md` § Trace derivation (the per-event rendering feeding the events dump).
 */

import type { VariablesTraceEvent } from '../../embody/types.js';

/**
 * Renders one streamed lifecycle event as a single verbatim, readable line: a
 * `step`-stamped, `nodePath`-attributed dump that distinguishes all six variants
 * (`scope-push` / `scope-pop` / `initialize` / `read` / `assign` / `increment`)
 * and degrades to a defensive fallback line on an unknown `.event` (never
 * throws — a malformed event must still render legibly). The exact line format
 * is this module's choice, pinned by `./tests/core.test.ts`.
 *
 * @remarks The events dump is the newline-join of these lines (one per streamed
 * event); see `./DOCS.md` § Trace derivation, projection #1. `scopeInstanceId`
 * is intentionally omitted from the line (a runtime correlation id whose
 * scope-vs-binding reading a one-liner cannot convey faithfully).
 *
 * @param event - One `VariablesTraceEvent` pulled from the handle, verbatim.
 * @returns A single line (no trailing newline) describing the event.
 */
function formatEvent(event: VariablesTraceEvent): string {
	const base = `step ${event.step} ${event.nodePath} ${event.event.toUpperCase()}`;
	if (event.event === 'scope-push') {
		return `${base} ${event.scopeKind} vars=[${event.variables
			.map((variable) => `${variable.name}:${variable.kind}`)
			.join(', ')}]`;
	}
	if (event.event === 'scope-pop') {
		return `${base} ${event.scopeKind} reason=${event.reason} vars=[${event.variables
			.map((variable) =>
				variable.status === 'initialized'
					? `${variable.name}:${variable.kind}=${renderValue(variable.value)}`
					: `${variable.name}:${variable.kind}(${variable.status})`,
			)
			.join(', ')}]`;
	}
	if (event.event === 'initialize') {
		return `${base} ${event.name} = ${renderValue(event.value)} (${
			event.explicit ? 'explicit' : 'implicit'
		})`;
	}
	if (event.event === 'read') {
		return `${base} ${event.name} → ${renderValue(event.value)}`;
	}
	if (event.event === 'assign') {
		// `wrote: false` (a short-circuited `??=`/`||=`/`&&=`) carries NO
		// `nextValue` — branch on `wrote` and never read it, so no spurious
		// `→ undefined` leaks into the line.
		return event.wrote
			? `${base} ${event.name} ${event.operator} : ${renderValue(event.priorValue)} → ${renderValue(event.nextValue)}`
			: `${base} ${event.name} ${event.operator} (no write)`;
	}
	if (event.event === 'increment') {
		return `${base} ${event.name} ${event.operator} ${event.form} : ${renderValue(event.priorValue)} → ${renderValue(event.nextValue)} returns ${renderValue(event.returnedValue)}`;
	}
	// Defensive: a malformed event must still render, never throw. The six
	// guards above narrow `event` to `never` here, so the tag is read through a
	// widening cast (matches the `as unknown as` fixtures).
	return `[unknown event] ${(event as { event: string }).event}`;
}

/**
 * Renders a `ValueSnapshot` (`unknown`) as a short, readable string without
 * throwing. A structured-clone-safe primitive renders as itself; the opaque
 * placeholder (see {@link isOpaqueValue}) renders structurally via its
 * `typeOf`. `bigint` is special-cased because `JSON.stringify` throws on it;
 * `undefined` renders literally (an implicit `let x;` initialize carries a real
 * `undefined` value, distinct from an absent field).
 *
 * @param value - A clone-safe primitive or an opaque placeholder.
 * @returns A readable rendering (never throws).
 */
function renderValue(value: unknown): string {
	if (isOpaqueValue(value)) {
		return `<opaque ${value.typeOf}>`;
	}
	if (value === undefined) {
		return 'undefined';
	}
	if (value === null) {
		return 'null';
	}
	if (typeof value === 'bigint') {
		return `${String(value)}n`;
	}
	if (typeof value === 'string') {
		return JSON.stringify(value);
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	if (value instanceof Date) {
		return value.toISOString();
	}
	if (value instanceof RegExp) {
		return String(value);
	}
	// Defensive only — a real `ValueSnapshot` is a clone-safe primitive or the
	// opaque placeholder (functions/symbols arrive opaque-wrapped), so this is
	// unreachable in practice. `JSON.stringify` can still throw on a circular
	// object, so the try/catch keeps the never-throw contract honest even on the
	// malformed input this fallback exists to absorb.
	try {
		return JSON.stringify(value);
	} catch {
		return '[unserializable]';
	}
}

/**
 * Structural type-guard for the tracer's opaque-value placeholder. Lens purity
 * forbids a type import of the tracer's `OpaqueValue`, so the brand is detected
 * by shape (`opaqueValue === true`), never by name.
 */
function isOpaqueValue(
	value: unknown,
): value is { readonly opaqueValue: true; readonly typeOf: string } {
	return (
		typeof value === 'object' &&
		value !== null &&
		(value as { opaqueValue?: unknown }).opaqueValue === true
	);
}

const traceDebuggingCore = { formatEvent };

export default traceDebuggingCore;
