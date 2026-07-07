/**
 * @file LensModule defaults for the `quiz` lens — the pure-TS functions
 * (`config`, `applicableTo`, `recommend`) that the React wrapper
 * (`./index.tsx`) splices into its frozen `LensModule` literal.
 *
 * @remarks Per the lenses peer's two-layer module convention, `core.ts`
 * imports no React. Tests run in vitest without jsdom (see
 * `./tests/core.test.ts` and `./tests/mastery.test.ts`). Beyond the three
 * `LensModule` defaults, this file holds the inc-5 mastery fold (a pure
 * reducer over `MasteryState`) that `./index.tsx` splices in alongside them.
 */

import cloneAndFreeze from '@utils/clone-and-freeze.js';
import freezeInPlace from '@utils/freeze-in-place.js';

import isJejCompliant from '../../lib/admitting/is-jej-compliant.js';
import type { LensConfig, Recommendation, Snippet } from '../types.js';

import type { GroupMastery, MasteryFold, MasteryState } from './types.js';

/**
 * Module-level frozen-empty-array constant — shared across all `recommend()`
 * calls so the empty-result return is a stable reference (no per-call
 * allocation). Per the architectural sketch (`./DOCS.md` § Structural
 * constraints / LensModule defaults return deep-frozen values).
 */
const EMPTY_RECOMMENDATIONS = freezeInPlace<ReadonlyArray<Recommendation>>([]);

/**
 * Resolves the quiz lens's per-mount config. Slice A reads **no required
 * knobs** — the V1 category-ID form has none — so the resolver merges
 * educator-supplied overrides over an empty default set and freezes the
 * result; unknown fields in `overrides` are preserved verbatim (open-shape
 * contract). The future `categories` allow-list (`./README.md` § Public API)
 * merges the same way when the config-filtering increment consumes it.
 *
 * @param overrides - Partial config bundle from the educator's per-fence
 *   directive or `lenses.json` cascade. May be `undefined`.
 * @returns Frozen `LensConfig` with overrides applied.
 */
function config(overrides?: Partial<LensConfig>): LensConfig {
	// `cloneAndFreeze` (not `freezeInPlace`) so a caller-supplied array override
	// is not frozen in place as a side effect. Spread preserves null overrides
	// verbatim (vs the `??` anti-pattern). The `as LensConfig` cast widens the
	// object literal to the open-shape record and crosses the
	// `exactOptionalPropertyTypes` boundary `Partial<LensConfig>` opens.
	return cloneAndFreeze({ ...overrides }) as LensConfig;
}

/**
 * The quiz lens's applicability gate — **Tier 2 + JEJ admission** per
 * `../README.md` § Three-tier classification. Returns
 * `embodiment.status.parsed && isJejCompliant(embodiment)`: the lens classifies
 * tokens and generates questions whose ground truth (scope, TDZ, creation-phase)
 * is statically decidable ONLY because JEJ excludes functions/`var`/`class`. An
 * unparseable snippet has nothing to anchor; a parseable-but-non-JEJ one would
 * yield confidently-wrong answers, so the lens gates itself out (the JEJ matrix
 * lives in `../../lib/admitting/`; `status.parsed` short-circuits first).
 *
 * @param embodiment - The frozen `Snippet` the orchestrator considers
 *   surfacing this lens for.
 * @returns `true` when the snippet parsed successfully and is JEJ-admitted.
 */
function applicableTo(embodiment: Snippet): boolean {
	return embodiment.status.parsed && isJejCompliant(embodiment);
}

/**
 * Block-Model placement recommendations for this lens. Returns the shared
 * frozen empty array in Slice A — the real coverage report (mapping
 * `QuizItem.cells` `BlockCell` → `Recommendation.blockModelCell`
 * `BlockModelCell`) is the final increment. See `./README.md` § Future
 * direction.
 *
 * @param _embodiment - Ignored until the coverage-report increment lands.
 * @returns The module-level frozen empty array (no per-call allocation).
 */
function recommend(_embodiment: Snippet): ReadonlyArray<Recommendation> {
	return EMPTY_RECOMMENDATIONS;
}

/**
 * The per-correct-answer accrual step for `progress` — four correct answers
 * saturate a group to `1` (the `0..1` curve ruled at the Phase-0 human gate,
 * 2026-06-28). Module-local: the fold is the only reader, and the channel-1
 * decoration buckets in `./index.tsx` derive from this same quarter grid.
 */
const MASTERY_STEP = 0.25;

/**
 * The mastery fold (inc 5; earned propagation inc 7) — folds one graded
 * interaction into the per-`groupKey` mastery state. A pure reducer: returns a
 * new frozen `MasteryState` with the credited group(s) updated and every other
 * group shared by reference.
 *
 * - **correct** → accrues one `MASTERY_STEP` toward the `1` ceiling (`Math.min`)
 *   across the deduped set `{ item.groupKey } ∪ (item.unlocks ?? [])` (earned
 *   propagation). The item's OWN group also clears `wrong` (re-mastery); each
 *   propagated PEER gets **progress only** — its `wrong` mark is preserved
 *   (cleared solely by re-answering that peer's own question). The dedup
 *   collapses the sameness forms' self-membership asymmetry (V10a/b carry their
 *   own key in `unlocks`, V10c omits it) so every group is credited exactly
 *   once. A form with no `unlocks` (every mcq / click-token) reduces to the
 *   single own-group update — byte-identical to inc 5.
 * - **incorrect** → `wrong` is set on the item's own group only; `progress` is
 *   unchanged (monotonic-up, so a wrong answer never erases earned progress) and
 *   propagation does NOT fire (a wrong answer earns nothing for its peers).
 * - **malformed** → no-op: returns `prior` by reference. A caller / UI bug
 *   never moves mastery; the identity return also lets React's
 *   `setMastery(prior => …)` bail the decoration dispatch.
 *
 * A `groupKey` absent from `prior` initializes at `progress: 0` before the
 * verdict applies. The fold keeps no per-item record (`GroupMastery` is
 * `{ progress, wrong }` only), so re-answering the same token accrues again —
 * intended for disposable practice (monotonic, capped at `1`). Keyed on
 * `groupKey`, never `item.id`: mastery is a property of the concept group, not
 * the individual question — which is why one correct sameness gesture can credit
 * several groups at once.
 *
 * @param prior - The mastery state before this interaction (frozen; `{}` at
 *   mount).
 * @param item - The graded quiz item; its `groupKey` and (on `correct`) its
 *   `unlocks` propagation peers are read.
 * @param verdict - The `grade` outcome for the learner's answer.
 * @returns A new frozen `MasteryState` (or `prior` unchanged on `malformed`).
 */
const masteryFold: MasteryFold = function masteryFold(prior, item, verdict) {
	if (verdict.status === 'malformed') return prior;
	if (verdict.status === 'incorrect') {
		// Incorrect flags only the OWN group; progress is unchanged (monotonic-up)
		// and propagation never fires — a wrong answer earns nothing for its peers.
		const priorProgress = prior[item.groupKey]?.progress ?? 0;
		return freezeInPlace({
			...prior,
			[item.groupKey]: { progress: priorProgress, wrong: true },
		});
	}
	// Correct → accrue one MASTERY_STEP across the deduped set {groupKey} ∪ unlocks
	// (earned propagation). The dedup collapses the sameness forms' self-membership
	// asymmetry (V10a/b carry their own key in `unlocks`, V10c omits it) so every
	// group is credited exactly once. The OWN group clears its `wrong` (re-mastery);
	// a propagated PEER gets progress only, keeping its prior `wrong` (cleared solely
	// by re-answering that peer's own question). unlocks-less forms (mcq /
	// click-token) reduce to the single own-group update — byte-identical to inc 5.
	const groups = new Set([item.groupKey, ...(item.unlocks ?? [])]);
	let next: MasteryState = prior;
	for (const key of groups) {
		const isOwnGroup = key === item.groupKey;
		const priorProgress = prior[key]?.progress ?? 0;
		const priorWrong = prior[key]?.wrong ?? false;
		const group: GroupMastery = {
			progress: Math.min(1, priorProgress + MASTERY_STEP),
			wrong: isOwnGroup ? false : priorWrong,
		};
		next = { ...next, [key]: group };
	}
	// `freezeInPlace` is a DEEP freeze, so freezing the final assembled `next` also
	// freezes every new `group`; `prior`'s untouched (already-frozen) groups are
	// copied by reference across the spreads and left as-is.
	return freezeInPlace(next);
};

// Intentionally unfrozen — `./index.tsx` freezes the composed `LensModule`
// literal at construction time, which is the consumer-facing freeze boundary.
const quizCore = { config, applicableTo, recommend, masteryFold };

export default quizCore;
