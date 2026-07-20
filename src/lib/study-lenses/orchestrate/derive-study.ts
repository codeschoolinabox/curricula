// cspell:ignore renderable Renderable

import deepFreezeExcept from '@utils/deep-freeze-except.js';

import embody from '../embody/index.js';
import type { Embodiment } from '../embody/types.js';
import type { Lens, Recommendation } from '../lenses/types.js';

import recoverRenderableLenses from './lib/composing/recover-renderable-lenses.js';
import type {
	JoinedLensRoster,
	JoinedLevelRoster,
} from './lib/composing/types.js';
import deriveAssessments from './lib/marking/derive-assessments.js';
import rankRecommendations from './lib/recommending/rank-recommendations.js';
import assembleParseFacts from './lib/validating/assemble-parse-facts.js';
import type { MemoizedValidate } from './lib/validating/types.js';
import type { SettledSnippet, StudyDerivation } from './types.js';

/**
 * The one derive composition per settle: embody the settled snippet with
 * the joined lens roster, assemble the parse facts and run the memoized
 * validates, classify every level, collect and rank the fitting lenses'
 * proposals — one frozen study derivation out.
 *
 * @remarks
 * Pure but for the per-instance memoized validate threaded in — the top
 * component holds it, so no memoized truth leaks across instances; its
 * remaining work is idempotence (StrictMode's double invoke and any
 * same-identity re-entry return the held verdicts without consulting a
 * level twice). Recommendations come from the fitting lenses — the union
 * of the study phases' attached refs, recovered against the joined roster,
 * each lens asked ONCE however many phases it attached to. A throwing
 * `recommend` is caught, reported loudly, and contributes nothing — the
 * region's shared graceful-arm posture for a throwing third-party callback.
 *
 * @param settled - The settled snippet every derived state keys on.
 * @param levels - The session-fixed joined level roster.
 * @param lenses - The session-fixed joined lens roster, passed to embody.
 * @param memoizedValidate - This instance's memoized validate.
 * @returns The frozen study derivation for this settle.
 */
export default function deriveStudy(
	settled: SettledSnippet,
	levels: JoinedLevelRoster,
	lenses: JoinedLensRoster,
	memoizedValidate: MemoizedValidate,
): StudyDerivation {
	// 1. Embody — the one derivation this settle keys.
	const embodiment = embody(settled.source, {
		type: settled.type,
		lenses,
	});

	// 2. Validate — the assembly once, one memoized validate per level.
	const assembled = assembleParseFacts(embodiment.facts);
	const verdicts = memoizedValidate(settled, assembled, levels);

	// 3. Classify — one assessment per level, from its verdict.
	const assessments = Object.fromEntries(
		levels.map((level) => [
			level.key,
			deriveAssessments(verdicts[level.key], level.snippetTypes, settled.type),
		]),
	);

	// 4. Recommend — the fitting lenses' proposals, collected and ranked.
	const recommendations = rankRecommendations(
		collectProposals(embodiment, lenses),
	);

	// 5. The frozen derivation — the envelope and the assessments record are
	// owned here; the other members arrive frozen by their producers and are
	// excepted as foreign (excepting a ref protects everything nested in it,
	// including level-owned violations inside the assessments).
	return deepFreezeExcept(
		{ assessments, embodiment, recommendations, verdicts },
		new Set<object>([
			embodiment,
			recommendations,
			verdicts,
			...Object.values(assessments),
		]),
	);
}

// The recommendation walk: the union of the study phases' attached refs —
// barred arms included, a phase is closed, never emptied — recovered against
// the joined roster, then each fitting lens asked once however many phases
// it attached to. The Set is transient dedup only, never frozen or kept.
function collectProposals(
	embodiment: Embodiment,
	lenses: JoinedLensRoster,
): ReadonlyArray<Recommendation> {
	// eslint-disable-next-line unicorn/prefer-spread -- Docusaurus/Babel mistranspiles `[...<Set>]` to `[<Set>]`; Array.from survives.
	const attachedUnion = Array.from(
		new Set(Object.values(embodiment.study).flatMap((phase) => phase.lenses)),
	);
	const renderable = recoverRenderableLenses(lenses, attachedUnion);
	return renderable.flatMap((lens) => askRecommend(lens, embodiment));
}

// A throwing recommend is caught, reported loudly, and proposes nothing —
// the region's shared graceful-arm posture for a throwing third-party
// callback (honoring's applicability, validating's validate).
function askRecommend(
	lens: Lens,
	embodiment: Embodiment,
): ReadonlyArray<Recommendation> {
	if (!lens.recommend) {
		return [];
	}

	try {
		return lens.recommend(embodiment);
	} catch (error: unknown) {
		console.error(
			`lens recommend threw — lens "${lens.name}" proposes nothing:`,
			error,
		);
		return [];
	}
}
