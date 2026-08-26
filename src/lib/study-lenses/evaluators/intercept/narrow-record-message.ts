/**
 * @file The record path's ONE narrowing site (DOCS.md § Execution phases,
 * phase 5's narrowing half): one opaque wire message becomes one typed
 * wire record — or is answered `null`, the drop, never a guess and never
 * a message read field-by-field downstream. The worker authors the
 * COMPLETE record (types.ts Seam 3), so this mapping is a PURE narrowing:
 * the message that passes rides through by reference, deep-frozen here —
 * a fresh allocation after the engine's structured clone, nobody else's,
 * the deprecated port's freeze-where-authored constraint carried; the
 * enrichment builds the delivered event as its own object, so the frozen
 * record is never written again.
 *
 * `null` is this seam's drop answer. The engine's own drop sentinel is
 * `undefined` (the engine types' `onMessage` — returning `undefined`
 * drops, and a literal `undefined` item can therefore never be yielded);
 * the onMessage wiring maps null to that sentinel, and this function
 * deliberately never speaks `undefined` itself so a typed drop cannot be
 * conflated with the engine's vocabulary.
 *
 * The depth is the deprecated port's briefing decision B-4, carried:
 * every field the seam declares is validated to its full declared depth —
 * the four `event` literals, a finite `step` (finiteness and nothing
 * more: steps are worker-minted and legally gapped, so the narrowing
 * never renumbers and never validates contiguity), an attribution whose
 * legs travel together (a full two-position four-finite-number span WITH
 * two finite UTF-16 offsets, or `loc`/`start`/`end` all null — one
 * without the other is malformed and drops), `console`'s string `method`,
 * an args ARRAY — except the args ELEMENTS, which stay `unknown` because
 * that IS their declared depth (learner values legitimately take any
 * clone-safe shape). `return` is checked per event exactly: alert
 * present-and-`undefined` (H-3's modelled value, a real check under
 * `exactOptionalPropertyTypes`), confirm's boolean, prompt's
 * string-or-null.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { InterceptWireRecord } from './types.js';

/**
 * Narrow one opaque wire message to a typed wire record, or drop it.
 *
 * @param message - The engine's opaque item, exactly as the worker posted
 *   it across the clone boundary.
 * @returns The deep-frozen wire record — the same reference, narrowed —
 *   or `null`: the drop, never a guess.
 */
export default function narrowRecordMessage(
	message: unknown,
): InterceptWireRecord | null {
	if (typeof message !== 'object' || message === null) {
		return null;
	}
	const candidate = message as Record<string, unknown>;
	if (!hasSoundBase(candidate) || !hasSoundEventArm(candidate)) {
		return null;
	}
	// The same reference, deep-frozen here — a fresh allocation after the
	// engine's clone, nobody else's (freeze-where-authored, carried).
	// freeze-in-place rather than clone-and-freeze on the OWNERSHIP test,
	// not the parameter test: the engine hands the clone to onMessage and
	// holds no other reference to it. The engine's own freeze at yield is
	// one shallow Object.freeze on the yielded item, with interior
	// freezing of consumer payloads assigned to downstream owners — so
	// this is the one site that freezes `args` and `loc` through their
	// depth. Known limit, per DEV.md § 13: a clone-safe Map/Set a learner
	// passed inside `args` cannot be made immutable by Object.freeze —
	// its entries live in internal slots the freeze does not reach.
	return freezeInPlace(message) as InterceptWireRecord;
}

/**
 * The envelope every wire record shares: a finite step (finiteness and
 * nothing more — steps are worker-minted and legally gapped), sound
 * attribution legs, and an args ARRAY whose elements stay `unknown` (B-4's
 * declared depth).
 */
function hasSoundBase(candidate: Record<string, unknown>): boolean {
	const stepIsSound = Number.isFinite(candidate['step']);
	return (
		stepIsSound &&
		hasSoundAttribution(candidate) &&
		Array.isArray(candidate['args'])
	);
}

/**
 * The both-or-neither rule, enforced: `loc`, `start`, and `end` are null
 * together, or a full span travels WITH two finite UTF-16 offsets. An
 * absent leg drops without a presence check — `undefined` satisfies
 * neither arm, so a missing key fails exactly as a malformed value does.
 */
function hasSoundAttribution(candidate: Record<string, unknown>): boolean {
	const { loc, start, end } = candidate;
	if (loc === null) {
		return start === null && end === null;
	}
	return isFullSpan(loc) && Number.isFinite(start) && Number.isFinite(end);
}

/**
 * A full two-position span with four finite numbers — the region's guard
 * order: object-ness before any leaf read, so a malformed position drops
 * rather than throws (the deprecated port's ar-3 I3 resolution, carried).
 */
function isFullSpan(loc: unknown): boolean {
	if (typeof loc !== 'object' || loc === null) {
		return false;
	}
	const { start, end } = loc as { start?: unknown; end?: unknown };
	return isFinitePosition(start) && isFinitePosition(end);
}

function isFinitePosition(position: unknown): boolean {
	if (typeof position !== 'object' || position === null) {
		return false;
	}
	const { line, column } = position as { line?: unknown; column?: unknown };
	return Number.isFinite(line) && Number.isFinite(column);
}

/**
 * Per-event depth, exactly the declared fields: console's open string
 * method; alert's `return` present AND undefined (H-3's modelled value —
 * the one place a presence check is load-bearing, because a missing key
 * and the modelled value are indistinguishable by value alone); confirm's
 * boolean; prompt's string-or-null. An unlisted event drops.
 */
function hasSoundEventArm(candidate: Record<string, unknown>): boolean {
	const { event } = candidate;
	if (event === 'console') {
		return typeof candidate['method'] === 'string';
	}
	if (event === 'alert') {
		return (
			Object.hasOwn(candidate, 'return') && candidate['return'] === undefined
		);
	}
	if (event === 'confirm') {
		return typeof candidate['return'] === 'boolean';
	}
	if (event === 'prompt') {
		return (
			candidate['return'] === null || typeof candidate['return'] === 'string'
		);
	}
	return false;
}
