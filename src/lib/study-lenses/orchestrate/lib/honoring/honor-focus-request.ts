import deepFreezeExcept from '@utils/deep-freeze-except.js';

import type {
	Embodiment,
	Facts,
	LifecyclePhase,
	LifecyclePhaseName,
} from '../../../embody/types.js';
import type { Lens } from '../../../lenses/types.js';

import type { MountDecision } from './types.js';

/**
 * Resolve a focus request to the mount decision it earns — honored through
 * fit and accessibility, or gracefully not honored at all. One pure decision,
 * taken once at mount; never a throw, because a wrong `lens` prop is an
 * authoring slip, not a learner-facing failure.
 *
 * @remarks
 * A phase-declaring lens is honored only when the embodiment shows it BOTH
 * attached to and accessible at one of its declared phases — fit and
 * accessibility as embody derived them, never re-derived here — mounting at
 * the first such phase in the lens's OWN declared order (no second
 * phase-order truth). A panel-excluded lens (declaring no phase) is honored
 * by running its own applicability over the embodiment's facts once, at
 * mount; a throwing applicability is caught, reported loudly, and resolves to
 * the fallback — the same rule embody applies to every gate it wraps. Every
 * other input — an unknown name, no request, a barred or unattached lens, a
 * refused applicability — is the fallback arm: normal rendering. The decision
 * decides mounting only; the enforcement mask applies to a focus-mounted lens
 * identically.
 */
export default function honorFocusRequest({
	request,
	roster,
	embodiment,
}: {
	readonly request?: string;
	readonly roster: ReadonlyArray<Lens>;
	readonly embodiment: Embodiment;
}): MountDecision {
	// 1. Resolve the request against the joined roster.
	if (request === undefined) return freezeDecision({ kind: 'fallback' });

	const requested = roster.find((lens) => lens.name === request);
	if (requested === undefined) return freezeDecision({ kind: 'fallback' });

	// 2. Judge the mount by the lens's kind of declaration.
	if (requested.phase === undefined) {
		return freezeDecision(judgePanelExcludedMount(requested, embodiment.facts));
	}
	return freezeDecision(
		judgePhaseDeclaredMount(requested, requested.phase, embodiment.study),
	);
}

// The decision structure is ours to freeze at the boundary; the carried lens
// ref is foreign — owned by its defining module — so it is excepted, never
// frozen (freeze-what-you-own, the composing/recommending precedent).
function freezeDecision(decision: MountDecision): MountDecision {
	const foreignReferences = 'lens' in decision ? [decision.lens] : [];
	return deepFreezeExcept(decision, new Set(foreignReferences));
}

// A phase-declaring lens is judged by the embodiment's study layer alone —
// embody already ran its gate, so consulting applicability here would mint a
// second fit truth. Attachment is reference identity, the region's rule for
// recovering its own lenses from attached refs.
function judgePhaseDeclaredMount(
	lens: Lens,
	declared: LifecyclePhaseName | ReadonlyArray<LifecyclePhaseName>,
	study: Embodiment['study'],
): MountDecision {
	const declaredOrder = typeof declared === 'string' ? [declared] : declared;

	for (const phase of declaredOrder) {
		// WHY the widening: the study Record's type promises all five phase
		// keys, but a host-injected lens can carry an out-of-contract phase
		// name at runtime — the guard keeps "never a throw" true for that
		// authoring slip too.
		const payload: LifecyclePhase | undefined = study[phase];
		if (payload?.accessible && payload.lenses.includes(lens)) {
			return { kind: 'honored-in-phase', lens, phase };
		}
	}
	return { kind: 'fallback' };
}

// The region's one applicability call outside embody's wrapper, so the
// wrapper's rule applies here too: a throwing gate is not applicable —
// reported loudly, never rethrown at the learner.
function judgePanelExcludedMount(lens: Lens, facts: Facts): MountDecision {
	try {
		return lens.applicability(facts)
			? { kind: 'honored-panel-excluded', lens }
			: { kind: 'fallback' };
	} catch (error: unknown) {
		console.warn(
			`honorFocusRequest: applicability of lens "${lens.name}" threw at mount; falling back to normal rendering`,
			error,
		);
		return { kind: 'fallback' };
	}
}
