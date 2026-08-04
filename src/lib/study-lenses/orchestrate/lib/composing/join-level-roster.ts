/**
 * Joins the built-in level roster with the host's injected levels into the
 * session's level roster — built-ins first, injections appended after.
 *
 * @remarks
 * Append-only and loud at the author's desk: a duplicate level key anywhere
 * in the combined roster throws, naming the offender, and the empty key `''`
 * is reserved for the none-state — injecting it throws too. The result is
 * session-fixed and frozen; the level refs stay owned by their defining
 * modules, so the freeze excepts them.
 */

import deepFreezeExcept from '@utils/deep-freeze-except.js';

import type { LanguageLevel } from '../../../language-levels/types.js';

import builtInLevels from './built-in-levels.js';
import type { JoinedLevelRoster } from './types.js';

export default function joinLevelRoster(
	injected: ReadonlyArray<LanguageLevel>,
): JoinedLevelRoster {
	// The reserved key throws its own error, checked BEFORE the duplicate
	// scan (ruled): even two ''-keyed injections report the reservation,
	// never a generic collision. This guard covers the injection boundary
	// only — built-ins staying ''-free is pinned by the Interfaces test,
	// not by any runtime check.
	if (injected.some((level) => level.key === '')) {
		throw new Error(
			"joinLevelRoster: the empty level key '' is reserved for the none-state and cannot be injected",
		);
	}

	// Built-ins first, injections after. That order is this spread's
	// mechanical consequence, not a precedence claim — a built-in level
	// outranks nothing (human ruling 2026-07-30).
	const joined = [...builtInLevels, ...injected];

	// Loud at the author's desk: a duplicate key anywhere in the combined
	// roster throws — nothing silently replaces or shadows. `indexOf` always
	// finds the FIRST occurrence, so a later entry whose index differs from
	// its `indexOf` is the earliest duplicate.
	const keys = joined.map((level) => level.key);
	const collision = keys.find((key, index) => keys.indexOf(key) !== index);
	if (collision !== undefined) {
		throw new Error(
			`joinLevelRoster: duplicate level key "${collision}" — joining is append-only; rename the level`,
		);
	}

	// Freeze-what-you-own: the roster structure is this join's; the level
	// refs stay owned by their defining modules, so the freeze excepts them.
	return deepFreezeExcept(joined, new Set(joined));
}
