import type {
	Gateable,
	LifecyclePhase,
	LifecyclePhaseName,
	StageCause,
} from './types.js';

/**
 * One phase's accessibility, as the accessibility map derives it — restated
 * structurally to match that deriver's return; never imported from it (the
 * local-type convention).
 */
type PhaseAccessibility =
	| { readonly accessible: true }
	| { readonly accessible: false; readonly cause: StageCause };

/**
 * Join accessibility with the attached lenses into the study layer: a total
 * record over the five phases, each carrying its reachability and the lenses
 * that fit it.
 *
 * @remarks
 * Both arms list the lenses, so a barred phase still shows what would render
 * there — the phase is closed, not emptied.
 */
export default function joinStudy(
	accessibility: Record<LifecyclePhaseName, PhaseAccessibility>,
	attached: Record<LifecyclePhaseName, readonly Gateable[]>,
): Record<LifecyclePhaseName, LifecyclePhase> {
	return {
		source: joinPhase(accessibility.source, attached.source),
		tokens: joinPhase(accessibility.tokens, attached.tokens),
		ast: joinPhase(accessibility.ast, attached.ast),
		environment: joinPhase(accessibility.environment, attached.environment),
		evaluation: joinPhase(accessibility.evaluation, attached.evaluation),
	};
}

// both arms carry the lenses — a barred phase still shows what would render;
// the cause and the lenses list both ride by identity, never rebuilt — the
// array attachLenses built is the one the freeze step will freeze
function joinPhase(
	phase: PhaseAccessibility,
	lenses: readonly Gateable[],
): LifecyclePhase {
	return phase.accessible
		? { accessible: true, lenses }
		: { accessible: false, cause: phase.cause, lenses };
}
