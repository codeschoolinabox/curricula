import deepFreezeExcept from '@utils/deep-freeze-except.js';
import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { SnippetType } from '../../../language-levels/types.js';
import type { LevelVerdict } from '../validating/types.js';

import type { LevelAssessment } from './types.js';

/**
 * Classify one level's verdict into the four-valued assessment the selector
 * and the mask both project — computed once per settle and per level.
 *
 * @remarks
 * One Classify phase, judged in a fixed order. The undetermined carve-out
 * wins first: an undetermined verdict IS the parse status, so it classifies
 * `undetermined` no matter what type admission would say — a typo never reads
 * as a level violation, and the parse phases' supports stay available. Only
 * on a determined verdict does type admission decide next
 * (`not-applicable-for-type`, carrying the admitted types), then the
 * verdict's violations (`does-not-fit`, carrying them), else `fits`.
 *
 * The assessment carries its cause so no downstream surface re-derives:
 * `not-applicable-for-type` carries the admitted types (the type-admission
 * cause renders from them), `does-not-fit` carries the violations (the mask
 * names the first). Both carried arrays are foreign — the admitted array is
 * the caller's, the violations ride a validated verdict — so the owned
 * assessment object is frozen at the boundary while those references are left
 * untouched (freeze-what-you-own).
 *
 * @param verdict - This level's verdict for the settle (undetermined while the
 *   code does not parse, else validated with its violations).
 * @param admitted - The snippet types this level admits.
 * @param currentType - The snippet type the learner is reading under.
 * @returns This level's assessment, frozen.
 */
export default function deriveAssessments(
	verdict: LevelVerdict,
	admitted: ReadonlyArray<SnippetType>,
	currentType: SnippetType,
): LevelAssessment {
	// 1. The undetermined carve-out wins, regardless of type admission.
	if (verdict.kind === 'undetermined') {
		return deepFreezeInPlace({ mark: 'undetermined' });
	}

	// 2. Type admission — not applicable carries the admitted types.
	if (!admitted.includes(currentType)) {
		return deepFreezeExcept(
			{ admitted, mark: 'not-applicable-for-type' },
			new Set([admitted]),
		);
	}

	// 3. The verdict's violations decide the rest.
	if (verdict.violations.length > 0) {
		return deepFreezeExcept(
			{ mark: 'does-not-fit', violations: verdict.violations },
			new Set([verdict.violations]),
		);
	}

	return deepFreezeInPlace({ mark: 'fits' });
}
