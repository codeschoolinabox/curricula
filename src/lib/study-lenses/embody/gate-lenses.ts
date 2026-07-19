import type { Facts, Gateable } from './types.js';

/**
 * Gate the roster over the Facts: every phase-declaring lens has its
 * applicability run exactly once, wrapped; the fitting lenses come back as
 * the same references they arrived as.
 *
 * @remarks
 * Panel-excluded lenses — no declared phase — are never consulted: they
 * mount only by explicit request, the orchestrator's concern. A gate that
 * throws is treated as not applicable, loudly: a lens defect must not take
 * the panel down.
 */
export default function gateLenses(
	facts: Facts,
	roster: ReadonlyArray<Gateable>,
): readonly Gateable[] {
	return roster.filter(
		(lens) => lens.phase !== undefined && applies(lens, facts),
	);
}

// a throwing gate is a lens defect, not a panel failure — treated as not
// applicable, loudly, and every other gate still runs: each wrap is its own
function applies(lens: Gateable, facts: Facts): boolean {
	try {
		return lens.applicability(facts);
	} catch (error) {
		console.error(
			`gateLenses: the ${lens.name} gate threw — treated as not applicable (${
				error instanceof Error ? error.message : String(error)
			})`,
		);
		return false;
	}
}
