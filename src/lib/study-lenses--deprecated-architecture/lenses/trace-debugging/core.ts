/**
 * @file Pure-TS derivation core for the `trace-debugging` lens — the three
 * stateless projections the React wrapper renders without re-deriving:
 * `formatEvent` (projection #1 — one streamed lifecycle event → one verbatim,
 * readable line), `deriveSettlementModel` (projection #2 — a terminal settlement
 * → the render-ready display model), and `formatAdmissionError` (projection #3 —
 * a channel-1 admission throw → the admission-error line). No React, no async;
 * testable in vitest without jsdom (see `./tests/core.test.ts`).
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
 * read them namespaced (`traceDebuggingCore.formatEvent` /
 * `traceDebuggingCore.deriveSettlementModel` /
 * `traceDebuggingCore.formatAdmissionError`) — the projections in `./DOCS.md`
 * § Trace derivation that feed the events dump, the settlement surface, and the
 * admission-error surface.
 */

import type {
	VariablesSettlement,
	VariablesTraceEvent,
} from '../../../embody/types.js';

import type { SettlementDisplayModel } from './types.js';

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
 * Projects a terminal `VariablesSettlement` into the render-ready
 * `SettlementDisplayModel` the React shell renders without re-deriving: the raw
 * `outcome`, a one-line `headline`, expanded `detail` lines, and the RETAINED
 * raw halt / engineError / failReason / durationMs (the readable gloss never
 * replaces the raw data — a verbatim `<pre>` dump stays faithful; see
 * `./types.ts` § SettlementDisplayModel and `./DOCS.md` § Trace derivation,
 * projection #2).
 *
 * @remarks Routes on `settlement.outcome` via an early-return if-chain (NOT a
 * `switch` — banned by `no-restricted-syntax`); an unexpected outcome falls
 * through to a defensive headline read via a widening cast (mirrors
 * `formatEvent`). `failReason` (`unknown`) is stringified through the private
 * {@link stringifyFailReason} — a string passes through, a non-string degrades
 * to a typeof label, NEVER `JSON.stringify` (an unbounded / circular failReason
 * would throw in the render path; see `./DOCS.md` § Trace derivation, projection
 * #2). The model and its `detail` array are both frozen.
 *
 * @param settlement - The terminal settlement from `await handle.result`.
 * @returns A frozen `SettlementDisplayModel`.
 */
function deriveSettlementModel(
	settlement: VariablesSettlement,
): SettlementDisplayModel {
	return Object.freeze({
		outcome: settlement.outcome,
		headline: deriveHeadline(settlement),
		detail: deriveDetail(settlement),
		halt: settlement.halt,
		engineError: settlement.engineError,
		failReason: settlement.failReason,
		durationMs: settlement.durationMs,
	});
}

/**
 * Projects a CHANNEL-1 admission throw (the synchronous throw at the
 * `traceVariableLifecycle` call site on inadmissible input) into the
 * human-readable line the lens shows in the `admission-error` state. Classifies
 * the caught throw into four pairwise-disjoint shapes (see `./DOCS.md` § The two
 * channels): the structurally-branded boundary error FIRST (it extends `Error`,
 * so its brand must be checked before the message — otherwise a branded error
 * whose message contained a family substring would mis-route), then the three
 * stable authored message families (`not available on canned scenario` /
 * `not valid JavaScript` / `not Just-Enough-JavaScript`) matched with
 * `.includes` (NOT `.startsWith` — the real messages are prefixed
 * `traceVariableLifecycle:` / `traceVariables:`). A recognized family surfaces
 * its message from the family token onward (dropping the internal tier prefix);
 * an unrecognized `Error` message degrades to a graceful verbatim fallback (a
 * tier-side reword fails soft, not silently); a non-`Error` throw degrades to
 * its crash-safe string form via the shared {@link stringifyFailReason}.
 *
 * @remarks The boundary error is NOT on the embody re-export surface, so it is
 * detected by its structural brand ({@link isInstrumentBoundaryError}), never a
 * type import — the same lens-purity constraint as {@link isOpaqueValue}. The
 * exact text is this module's choice, pinned by `./tests/core.test.ts`. Never
 * throws.
 *
 * @param error - The value caught from the channel-1 `try/catch` (`unknown`).
 * @returns A single admission-error line (never throws).
 */
function formatAdmissionError(error: unknown): string {
	return `admission refused: ${admissionDetail(error)}`;
}

/**
 * Derives the one-line `headline`: the raw outcome, plus the single datum that
 * distinguishes that outcome class when one exists (errorName + nodePath, engine
 * cause, fail reason). Outcomes with no distinguishing data (`completed`,
 * `cancelled`) and absent-data boundaries (`errored` with no halt + no
 * engineError, `timed-out` with no engineError, `failed` with no reason) collapse
 * to the BARE outcome — never `at null` / `— undefined`. Routes via an
 * early-return if-chain (NOT a `switch` — banned by `no-restricted-syntax`); an
 * unexpected outcome falls through to a defensive cast (mirrors `formatEvent`).
 */
function deriveHeadline(settlement: VariablesSettlement): string {
	if (settlement.outcome === 'completed') {
		return 'completed';
	}
	if (settlement.outcome === 'errored') {
		if (settlement.halt === null) {
			// Engine-side errored end (a hook/worker failure) with no worker halt:
			// name the engineError, never dereference the null halt.
			return `errored — ${settlement.engineError?.name ?? 'error'}`;
		}
		return settlement.halt.nodePath === null
			? `errored — ${settlement.halt.errorName}`
			: `errored — ${settlement.halt.errorName} at ${settlement.halt.nodePath}`;
	}
	if (settlement.outcome === 'timed-out') {
		return settlement.engineError === undefined
			? 'timed-out'
			: `timed-out — ${settlement.engineError.cause}`;
	}
	if (settlement.outcome === 'cancelled') {
		return 'cancelled';
	}
	if (settlement.outcome === 'failed') {
		return settlement.failReason === undefined
			? 'failed'
			: `failed — ${stringifyFailReason(settlement.failReason)}`;
	}
	return `${(settlement as { outcome: string }).outcome} — unknown outcome`;
}

/**
 * Builds the ordered `detail` lines: the error-relevant halt fields (errorName /
 * message / nodePath, each dropped when empty / null — the redundant `natural`
 * boolean stays in the retained raw `halt`), then the engineError block (cause /
 * name / message), then the `failReason` line. Assembled immutably (candidate
 * lines then `.filter`, no `.push` mutation), frozen, and never empty — an
 * all-absent settlement (a clean cancel) yields the single `(no detail)` marker.
 */
function deriveDetail(settlement: VariablesSettlement): ReadonlyArray<string> {
	const failReasonLine =
		settlement.failReason === undefined
			? null
			: `failReason: ${stringifyFailReason(settlement.failReason)}`;
	const lines = [
		...haltDetailLines(settlement.halt),
		...engineDetailLines(settlement.engineError),
		failReasonLine,
	].filter((line): line is string => line !== null);
	return Object.freeze(lines.length === 0 ? ['(no detail)'] : lines);
}

/**
 * The error-relevant lines for a worker halt (errorName / message / nodePath),
 * each dropped when empty or null; `[]` when there is no halt. The `natural`
 * boolean is intentionally omitted — it is redundant with errorName presence and
 * stays in the retained raw `halt`.
 */
function haltDetailLines(
	halt: VariablesSettlement['halt'],
): ReadonlyArray<string> {
	if (halt === null) {
		return [];
	}
	return [
		halt.errorName === '' ? null : `errorName: ${halt.errorName}`,
		halt.message === '' ? null : `message: ${halt.message}`,
		halt.nodePath === null ? null : `nodePath: ${halt.nodePath}`,
	].filter((line): line is string => line !== null);
}

/**
 * The engine-error lines (cause / name / message), name and message dropped when
 * empty; `[]` when the engine did not end the run.
 */
function engineDetailLines(
	engineError: VariablesSettlement['engineError'],
): ReadonlyArray<string> {
	if (engineError === undefined) {
		return [];
	}
	return [
		`engine cause: ${engineError.cause}`,
		engineError.name === '' ? null : `engine error: ${engineError.name}`,
		engineError.message === ''
			? null
			: `engine message: ${engineError.message}`,
	].filter((line): line is string => line !== null);
}

/**
 * Defensively stringifies a `failReason` (`unknown`) for display: a string
 * passes through verbatim; a clone-safe primitive renders as itself; anything
 * else (object / function / symbol) degrades to a `<typeof>` label. It NEVER
 * `JSON.stringify`s (an unbounded or circular failReason would throw in the
 * render path) and NEVER `String()`s an object/symbol (a symbol throws; an
 * object yields `[object Object]`). See `./DOCS.md` § Trace derivation,
 * projection #2. Distinct from {@link renderValue} (which is for tracer
 * `ValueSnapshot`s and JSON-quotes strings); failReasons want pass-through.
 */
function stringifyFailReason(reason: unknown): string {
	if (typeof reason === 'string') {
		return reason;
	}
	if (
		typeof reason === 'number' ||
		typeof reason === 'boolean' ||
		typeof reason === 'bigint'
	) {
		return String(reason);
	}
	if (reason === null) {
		return 'null';
	}
	return `<${typeof reason}>`;
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

/**
 * The stable authored substrings identifying each recognized channel-1 message
 * family, in detection order. Matched with `.includes` (NOT `.startsWith`)
 * because the real messages are prefixed `traceVariableLifecycle:` /
 * `traceVariables:`, so these tokens are interior. The text is owned by the
 * embody / tracer tier (`embody/index.ts`,
 * `embody/lib/evaluating/trace/variables/trace-variables.ts`) — a tier-side
 * reword breaks this classifier, which is why an unrecognized message still
 * renders via the graceful fallback in {@link admissionDetail}.
 */
const ADMISSION_FAMILY_TOKENS: readonly string[] = [
	'not available on canned scenario',
	'not valid JavaScript',
	'not Just-Enough-JavaScript',
];

/**
 * The admission-error detail tail {@link formatAdmissionError} prepends
 * `admission refused: ` to (the prefix lives in ONE place — no duplicate
 * literal). The structural brand is checked FIRST (a boundary error extends
 * `Error` and may carry a message containing a family substring), then the
 * family tokens, then the graceful verbatim fallback for an unrecognized `Error`
 * message, then the crash-safe stringify for a non-`Error` throw.
 */
function admissionDetail(error: unknown): string {
	if (isInstrumentBoundaryError(error)) {
		return `unsupported construct (${error.reason})`;
	}
	if (error instanceof Error) {
		const familyToken = ADMISSION_FAMILY_TOKENS.find((token) =>
			error.message.includes(token),
		);
		// `indexOf(familyToken)` is always ≥ 0 here — `familyToken` came from the
		// same `.includes` match, so it is present (no `slice(-1)` footgun). The
		// slice drops the internal tier prefix; an unrecognized message (no family
		// token) surfaces verbatim — the soft fallback (a tier reword never blanks
		// the dump).
		return familyToken === undefined
			? error.message
			: error.message.slice(error.message.indexOf(familyToken));
	}
	return stringifyFailReason(error);
}

/**
 * Local narrowing shape for the tracer's structurally-branded boundary error.
 * Lens purity forbids importing `InstrumentBoundaryError` (not on the embody
 * re-export surface anyway), so the brand is matched by shape — the same tag
 * idiom as {@link isOpaqueValue}. `reason` is typed `string` (not the tier's
 * two-member union) so an unexpected future reason still renders defensively.
 */
type InstrumentBoundaryLike = Error & {
	readonly instrumentBoundary: true;
	readonly reason: string;
};

/**
 * Structural type-guard for the boundary error. The `instanceof Error` gate is
 * load-bearing — a plain object carrying the brand shape is NOT a boundary error
 * and must route to the non-Error path, not the reason branch.
 */
function isInstrumentBoundaryError(
	error: unknown,
): error is InstrumentBoundaryLike {
	return (
		error instanceof Error &&
		'instrumentBoundary' in error &&
		(error as { instrumentBoundary?: unknown }).instrumentBoundary === true
	);
}

const traceDebuggingCore = {
	formatEvent,
	deriveSettlementModel,
	formatAdmissionError,
};

export default traceDebuggingCore;
