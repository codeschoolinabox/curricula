import type { Embodiment } from '../../../embody/types.js';
import type { Lens } from '../../../lenses/types.js';

/**
 * The one reachability judgment over the OPEN lens and the CURRENT
 * derivation — projected twice: the pane's render gate (skip the mount
 * this frame) and the orphan defense (dispose it). A phase-declaring lens
 * is reachable while an accessible phase attaches it; a panel-excluded
 * lens is reachable while its own applicability holds over the current
 * facts (a throwing applicability is caught, reported loudly, and reads
 * as unreachable — the region's shared graceful-arm posture).
 *
 * @remarks
 * One judgment, two projections — a divergence would mean a blank-pane
 * deadlock (the gate skips, the defense never fires) or a one-frame
 * totality violation (the defense fires, the gate mounted anyway); see
 * `../../DOCS.md` § Structural constraints.
 *
 * @param lens - The open lens, resolved from the mount roster.
 * @param embodiment - The current derivation's embodiment.
 * @returns Whether the open lens is reachable over the current facts.
 */
export default function isOpenLensReachable(
	lens: Lens,
	embodiment: Embodiment,
): boolean {
	if (lens.phase === undefined) {
		try {
			return lens.applicability(embodiment.facts);
		} catch (error: unknown) {
			// error, not the honor path's warn — a mount-time fallback is an
			// expected degradation; EVICTING an open lens is disruptive enough
			// to escalate. Callers may invoke this per render (both
			// projections, StrictMode's dev double-run included) — applicability
			// is pure over frozen facts by contract, so repetition is safe.
			console.error(
				`open-lens applicability threw — lens "${lens.name}" reads as unreachable:`,
				error,
			);
			return false;
		}
	}

	// Name equality, not reference identity: the roster's loud name-collision
	// guard makes the two coincide for any lens actually on it, and the name
	// is what the occupant carries.
	return Object.values(embodiment.study).some(
		(phase) =>
			phase.accessible &&
			phase.lenses.some((attached) => attached.name === lens.name),
	);
}
