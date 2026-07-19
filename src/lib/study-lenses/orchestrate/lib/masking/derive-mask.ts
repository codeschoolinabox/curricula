import deepFreezeExcept from '@utils/deep-freeze-except.js';
import freezeInPlace from '@utils/freeze-in-place.js';

import type { LevelAssessment } from '../marking/types.js';

import type { MaskState } from './types.js';

/**
 * Project the selected level's assessment onto a mask state — the library's
 * sole phase.
 *
 * @remarks
 * Under warn nothing masks. Under strict, the masked arms are `does-not-fit`
 * (carrying the first violation) and `not-applicable-for-type` (carrying the
 * admitted types); `fits`, the `undetermined` carve-out, and the none-state
 * (`null`) all stay unmasked. The assessment arrives classified — this never
 * re-derives fit, admission, or parse status, and the undetermined carve-out
 * is inherited, not re-implemented.
 *
 * The masked state carries the level label and the cause **structurally**; the
 * top component authors the blocked sentence, so the cause's foreign payload
 * (the violation, the admitted-types array) is carried by reference, never
 * frozen or cloned here (freeze-what-you-own).
 *
 * The input carries the selected level's assessment (`null` for the
 * none-state — no level selected), the enforcement posture (warn, `false`,
 * masks nothing), and the selected level's display label, carried into a
 * masked state for the blocked sentence's single upstream author.
 *
 * @returns The mask state, frozen.
 */
export default function deriveMask({
	assessment,
	strict,
	levelLabel,
}: {
	readonly assessment: LevelAssessment | null;
	readonly strict: boolean;
	readonly levelLabel: string;
}): MaskState {
	// 1. Warn blocks nothing; the none-state has nothing to enforce.
	if (!strict || assessment === null) {
		return freezeInPlace({ masked: false });
	}

	// 2. Project the masked arms — the cause wrapper is owned, its payload
	//    (the violation, the admitted array) is foreign and rides by ref.
	if (assessment.mark === 'does-not-fit') {
		const [first] = assessment.violations;
		const masked: MaskState = {
			cause: { kind: 'violation', violation: first },
			levelLabel,
			masked: true,
		};
		return deepFreezeExcept(masked, new Set([first]));
	}
	if (assessment.mark === 'not-applicable-for-type') {
		const masked: MaskState = {
			cause: { admitted: assessment.admitted, kind: 'type-admission' },
			levelLabel,
			masked: true,
		};
		return deepFreezeExcept(masked, new Set([assessment.admitted]));
	}

	// 3. fits and the undetermined carve-out stay unmasked.
	return freezeInPlace({ masked: false });
}
