/**
 * @file The record path's ONE narrowing site (DOCS.md phase 7): one opaque
 * worker message becomes one typed, deep-frozen record — or is dropped,
 * never guessed at.
 *
 * The worker authors the COMPLETE record (types.ts Seam 1), so this mapping
 * is a PURE narrowing: the message that passes rides through by reference,
 * frozen here — a fresh allocation after the engine's structured clone,
 * nobody else's, which is exactly the freeze-where-authored constraint
 * (DOCS.md § Structural constraints). Returning nothing IS the engine's
 * drop sentinel, so a malformed message costs one drop and the run
 * continues.
 *
 * The depth is briefing decision B-4: every field the seam declares is
 * validated to its full declared depth — the four `kind` literals, a finite
 * `step`, a `loc` that is null or a full two-position four-finite-number
 * span, `console`'s string `method`, an args ARRAY — except the args
 * ELEMENTS, which stay `unknown` because that IS their declared depth
 * (learner values legitimately take any clone-safe shape). `returnValue`
 * is checked per kind exactly: alert present-and-`undefined` (H-3's
 * modelled value, a real check under `exactOptionalPropertyTypes`),
 * confirm's boolean, prompt's string-or-null.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { InterceptRecord } from './types.js';

/**
 * Narrow one opaque worker message to a typed record, or drop it.
 *
 * @param message - The engine's opaque item, exactly as the worker posted
 *   it across the clone boundary.
 * @returns The deep-frozen record — the same reference, narrowed — or
 *   `undefined`: the drop, never a guess.
 */
export default function narrowRecordMessage(
	message: unknown,
): InterceptRecord | undefined {
	if (typeof message !== 'object' || message === null) {
		return;
	}
	const candidate = message as Record<string, unknown>;
	if (!hasSoundBase(candidate) || !hasSoundKindArm(candidate)) {
		return;
	}
	// The same reference, deep-frozen here — a fresh allocation after the
	// engine's clone, nobody else's (freeze-where-authored). Known limit,
	// per DEV.md § 13: a clone-safe Map/Set a learner passed inside `args`
	// cannot be made immutable by Object.freeze — its entries live in
	// internal slots the freeze does not reach.
	return freezeInPlace(message) as InterceptRecord;
}

/** The envelope every record shares: a finite step, a STATED loc arm (null
 * or a full span — an absent key is a drop, never an inferred null), and an
 * args ARRAY whose elements stay `unknown` (B-4's declared depth). */
function hasSoundBase(candidate: Record<string, unknown>): boolean {
	const stepIsSound = Number.isFinite(candidate['step']);
	const locIsStated =
		Object.hasOwn(candidate, 'loc') && isLocArm(candidate['loc']);
	return stepIsSound && locIsStated && Array.isArray(candidate['args']);
}

/** `null`, or a full two-position span with four finite numbers — the
 * region's guard order: object-ness before any leaf read, so a malformed
 * position drops rather than throws. */
function isLocArm(loc: unknown): boolean {
	if (loc === null) {
		return true;
	}
	if (typeof loc !== 'object') {
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

/** Per-kind depth, exactly the declared fields: console's open string
 * method; alert's returnValue present AND undefined (H-3's modelled value —
 * a presence-only check would accept a malformed record); confirm's
 * boolean; prompt's string-or-null. An unlisted kind drops. */
function hasSoundKindArm(candidate: Record<string, unknown>): boolean {
	const { kind } = candidate;
	if (kind === 'console') {
		return typeof candidate['method'] === 'string';
	}
	if (kind === 'alert') {
		return (
			Object.hasOwn(candidate, 'returnValue') &&
			candidate['returnValue'] === undefined
		);
	}
	if (kind === 'confirm') {
		return typeof candidate['returnValue'] === 'boolean';
	}
	if (kind === 'prompt') {
		return (
			candidate['returnValue'] === null ||
			typeof candidate['returnValue'] === 'string'
		);
	}
	return false;
}
