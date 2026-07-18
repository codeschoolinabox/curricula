// cspell:ignore renderable Gateable

/**
 * Recovers a phase's renderable lenses: the phase's attached `Gateable` refs
 * filter the joined lens roster by reference identity — the joined roster is
 * the one truth of what this session can render.
 *
 * @remarks
 * Recovery exists because a `Gateable` cannot be rendered (embody's
 * structural view carries no component); the renderable `Lens` is found
 * again in the roster by identity — no casts, no name matching. Every
 * attached ref resolves by construction: embody gates only the roster the
 * composition root passed it, so an unknown ref is a broken embody
 * invariant — reported loudly as a defect, never gated behind development
 * mode, and dropped from the render, because nothing in the study surface
 * throws at the learner.
 */

import deepFreezeExcept from '@utils/deep-freeze-except.js';

import type { Gateable } from '../../../embody/types.js';
import type { Lens } from '../../../lenses/types.js';

import type { JoinedLensRoster } from './types.js';

export default function recoverRenderableLenses(
	roster: JoinedLensRoster,
	attached: ReadonlyArray<Gateable>,
): ReadonlyArray<Lens> {
	// The attached refs filter the ROSTER (not the reverse): iterating the
	// roster keeps the Lens type without a cast, and the output carries the
	// roster's order — the joined roster is the one truth of what this
	// session can render.
	const renderable = roster.filter((lens) => attached.includes(lens));

	// An unknown ref is a broken embody invariant. `console.error`, not the
	// siblings' `console.warn`: warn marks EXPECTED degradation (a throwing
	// listener, a rejected mount); this branch is unreachable by contract,
	// so a hit is a DEFECT — reported per occurrence in `attached` (a
	// duplicate broken entry is itself part of what's reported), never
	// dev-gated, and dropped because nothing in the study surface throws at
	// the learner. The Set is transient lookup only — never frozen, never
	// serialized (DEV.md § 13).
	const known = new Set<Gateable>(roster);
	const unknown = attached.filter((reference) => !known.has(reference));
	for (const reference of unknown) {
		console.error(
			`recoverRenderableLenses: attached lens "${reference.name}" is not in the joined roster — broken embody invariant; dropped from the render`,
		);
	}

	// Freeze-what-you-own: the recovered array is this function's; the lens
	// refs stay owned by their defining modules, so the freeze excepts them.
	return deepFreezeExcept(renderable, new Set(renderable));
}
