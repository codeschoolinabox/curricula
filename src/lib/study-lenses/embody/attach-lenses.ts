import type { Gateable, LifecyclePhaseName } from './types.js';

/**
 * Attach the fitting lenses to their declared phases, as refs — the lens
 * objects themselves, never pre-bound wrappers — so configuration resolves
 * at render time and each module stays owned by where it was defined.
 *
 * @remarks
 * A multi-phase lens attaches to every phase it declares. The record is
 * total: a phase nothing fits carries an empty list.
 */
export default function attachLenses(
	fitting: ReadonlyArray<Gateable>,
): Record<LifecyclePhaseName, readonly Gateable[]> {
	const attached: Record<LifecyclePhaseName, Gateable[]> = {
		source: [],
		tokens: [],
		ast: [],
		environment: [],
		evaluation: [],
	};
	for (const lens of fitting) {
		for (const phase of declaredPhases(lens)) {
			attached[phase].push(lens);
		}
	}
	return attached;
}

// one declared name or an array of them — normalized so the walk reads one
// way; an undeclared phase contributes nothing, naturally. `typeof` narrows
// the union where Array.isArray cannot (a ReadonlyArray member resists it).
function declaredPhases(lens: Gateable): readonly LifecyclePhaseName[] {
	if (lens.phase === undefined) {
		return [];
	}
	return typeof lens.phase === 'string' ? [lens.phase] : lens.phase;
}
