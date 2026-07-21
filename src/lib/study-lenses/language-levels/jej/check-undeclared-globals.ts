import freezeInPlace from '@utils/freeze-in-place.js';

import type { UnresolvedReference, Violation } from '../types.js';

import createViolation from './create-violation.js';

/**
 * Rules every reference of the scope resolution's escape list against the
 * level's vocabulary and collects one {@link Violation} per name that steps
 * outside the level.
 *
 * @remarks
 * The "Resolve the vocabulary" phase of the level's answer, taken name by
 * name in the escape list's own order: a name the level admits is the
 * realm's; a name JavaScript is known to provide but the level does not
 * admit is outside the level; anything else is left to the runtime — a typo
 * is never a level violation. The ruling reads only the reference's name;
 * the reference's node anchors the violation (type and offsets) and is
 * borrowed, never frozen. The one scope analysis lives upstream — this
 * ruling meets its escape list and derives no scopes of its own. Ordering
 * the answer by source position is the caller's join, not this ruling's.
 *
 * @param unresolvedReferences - The escape list: the references no program
 *   scope resolves, in traversal order.
 * @param admittedGlobals - The level's admitted globals — the realm table's
 *   names, derived.
 * @returns A frozen array of violations, preserving the escape list's order.
 */
export default function checkUndeclaredGlobals(
	unresolvedReferences: ReadonlyArray<UnresolvedReference>,
	admittedGlobals: ReadonlySet<string>,
): ReadonlyArray<Violation> {
	return freezeInPlace(
		unresolvedReferences.flatMap((reference) =>
			ruleReference(reference, admittedGlobals),
		),
	);
}

// vendored: relocates to a shared leaf when one exists
/**
 * Known JavaScript built-in globals — the machinery's generic datum, never
 * the level's policy. A known name the level does not admit is a violation;
 * a name absent here is the runtime's, so the set need not be exhaustive —
 * missing entries safely pass to the runtime.
 *
 * @remarks
 * `freezeInPlace` freezes the `Set` container, not its entries (a frozen
 * `Set` still answers `add`); the `ReadonlySet` contract is the compile-time
 * guard.
 */
const KNOWN_JS_GLOBALS: ReadonlySet<string> = freezeInPlace(
	new Set([
		// Constructors / namespaces
		'Object',
		'Function',
		'Array',
		'Number',
		'String',
		'Boolean',
		'Symbol',
		'BigInt',
		'Date',
		'RegExp',
		'Error',
		'TypeError',
		'RangeError',
		'ReferenceError',
		'SyntaxError',
		'URIError',
		'EvalError',
		'AggregateError',
		'Map',
		'Set',
		'WeakMap',
		'WeakSet',
		'WeakRef',
		'FinalizationRegistry',
		'Promise',
		'Proxy',
		'Reflect',
		'JSON',
		'Math',
		'Intl',
		'ArrayBuffer',
		'SharedArrayBuffer',
		'DataView',
		'Atomics',
		'Int8Array',
		'Uint8Array',
		'Uint8ClampedArray',
		'Int16Array',
		'Uint16Array',
		'Int32Array',
		'Uint32Array',
		'Float32Array',
		'Float64Array',
		'BigInt64Array',
		'BigUint64Array',
		'Iterator',
		'AsyncIterator',
		// Global functions
		'parseInt',
		'parseFloat',
		'isNaN',
		'isFinite',
		'encodeURI',
		'encodeURIComponent',
		'decodeURI',
		'decodeURIComponent',
		'escape',
		'unescape',
		'btoa',
		'atob',
		'setTimeout',
		'setInterval',
		'clearTimeout',
		'clearInterval',
		'requestAnimationFrame',
		'cancelAnimationFrame',
		'queueMicrotask',
		'structuredClone',
		'fetch',
		'AbortController',
		'AbortSignal',
		// Browser globals
		'window',
		'self',
		'globalThis',
		'document',
		'navigator',
		'location',
		'history',
		'screen',
		'localStorage',
		'sessionStorage',
		'indexedDB',
		'XMLHttpRequest',
		'Worker',
		'WebSocket',
		'EventSource',
		// DOM
		'Element',
		'HTMLElement',
		'Node',
		'NodeList',
		'Event',
		'CustomEvent',
		'MutationObserver',
		'IntersectionObserver',
		'ResizeObserver',
		// Web APIs
		'URL',
		'URLSearchParams',
		'Headers',
		'Request',
		'Response',
		'FormData',
		'Blob',
		'File',
		'FileReader',
		'TextEncoder',
		'TextDecoder',
		'crypto',
		'performance',
		'ReadableStream',
		'WritableStream',
		'TransformStream',
	]),
);

/**
 * The ruling for one escaped reference — the name alone decides: admitted is
 * the realm's; known to JavaScript but not admitted is outside the level;
 * anything else is the runtime's. The one place a reference's node anchors a
 * violation's type and offsets, and its path is carried verbatim.
 */
function ruleReference(
	reference: UnresolvedReference,
	admittedGlobals: ReadonlySet<string>,
): readonly Violation[] {
	if (admittedGlobals.has(reference.name)) {
		return [];
	}
	if (!KNOWN_JS_GLOBALS.has(reference.name)) {
		return [];
	}

	return [
		createViolation(
			reference.node.type,
			`'${reference.name}' is not available at this language level`,
			{ start: reference.node.start, end: reference.node.end },
			reference.nodePath,
		),
	];
}
