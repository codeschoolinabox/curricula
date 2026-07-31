/**
 * Joins the built-in lens roster with the host's injected lenses into the
 * session's lens roster — built-ins first, injections appended after.
 *
 * @remarks
 * Append-only and loud at the author's desk: a duplicate lens name anywhere in
 * the combined roster throws, naming the offender, so nothing silently
 * replaces or shadows a built-in. The result is session-fixed and frozen; the
 * lens refs stay owned by their defining modules, so the freeze excepts them.
 */

import deepFreezeExcept from '@utils/deep-freeze-except.js';

import type { Lens } from '../../../lenses/types.js';

import builtInLenses from './built-in-lenses.js';
import type { JoinedLensRoster } from './types.js';

export default function joinLensRoster(
	injected: ReadonlyArray<Lens>,
): JoinedLensRoster {
	// Built-ins first, injections after. That order is this spread's
	// mechanical consequence, not a precedence claim — a built-in lens
	// outranks nothing.
	const joined = [...builtInLenses, ...injected];

	// Loud at the author's desk: a duplicate name anywhere in the combined
	// roster throws — nothing silently replaces or shadows. `indexOf` always
	// finds the FIRST occurrence, so a later entry whose index differs from
	// its `indexOf` is the earliest duplicate.
	const names = joined.map((lens) => lens.name);
	const collision = names.find((name, index) => names.indexOf(name) !== index);
	if (collision !== undefined) {
		throw new Error(
			`joinLensRoster: duplicate lens name "${collision}" — joining is append-only; rename the lens`,
		);
	}

	// Freeze-what-you-own: the roster structure is this join's; the lens
	// refs stay owned by their defining modules, so the freeze excepts them.
	return deepFreezeExcept(joined, new Set(joined));
}
