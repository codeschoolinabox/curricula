/**
 * @file The variables tracer's thread logic (Narrow phase, DOCS.md § 5): a
 * stateless engine {@link ThreadLogic} that maps one opaque worker message to
 * one typed {@link VariablesTraceEvent}, dropping anything malformed.
 *
 * The worker (increment 3) authors the COMPLETE clone-safe event
 * (`VariablesMessage = VariablesTraceEvent`), so this side is a near-identity
 * narrowing: a light boundary guard (discriminant + base fields) decides
 * yield-vs-drop and returns the message BY REFERENCE — the engine freezes the
 * yielded item at yield, so this module never freezes or clones. Per-variant
 * interior fields are the worker's authority and are not revalidated here. There
 * is no call channel and the worker self-authors the halt, so `onCall` and
 * `refineError` are not implemented.
 */

import type { ThreadLogic } from '../../../../../study-lenses--deprecated-architecture/lib/engine/types.js';

import type { VariablesTraceEvent } from './types.js';

/** The six lifecycle-event discriminants (types.ts seam 1). */
const EVENT_NAMES = new Set([
	'scope-push',
	'scope-pop',
	'initialize',
	'read',
	'assign',
	'increment',
]);

/**
 * A light boundary guard: a non-array object whose `event` is one of the six
 * known discriminants and whose three base fields are correctly typed. The
 * worker is the sole, well-tested message source and the engine structured-
 * clones across the boundary, so this is a contract assertion, not a realistic
 * runtime branch; per-variant interior fields are not revalidated.
 */
function isVariablesTraceEvent(value: unknown): value is VariablesTraceEvent {
	// arrays and null are `typeof 'object'`, so exclude them explicitly.
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false;
	}
	// WHY the cast: the message is contractually opaque at the engine boundary.
	const candidate = value as Record<string, unknown>;
	if (
		typeof candidate.event !== 'string' ||
		!EVENT_NAMES.has(candidate.event)
	) {
		return false;
	}
	return (
		typeof candidate.step === 'number' &&
		typeof candidate.nodePath === 'string' &&
		typeof candidate.scopeInstanceId === 'number'
	);
}

const variablesThreadLogic: ThreadLogic = Object.freeze({
	onMessage(message: unknown): unknown {
		return isVariablesTraceEvent(message) ? message : undefined;
	},
});

export default variablesThreadLogic;
