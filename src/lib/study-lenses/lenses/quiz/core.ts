/**
 * @file LensModule defaults for the `quiz` lens — the pure-TS functions
 * (`config`, `applicableTo`, `recommend`) that the React wrapper
 * (`./index.tsx`) splices into its frozen `LensModule` literal.
 *
 * @remarks Per the lenses peer's two-layer module convention, `core.ts`
 * imports no React. Tests run in vitest without jsdom (see
 * `./tests/core.test.ts`). The Slice-B mastery fold (a pure reducer over
 * `MasteryState`) will join this file; Slice A ships only the three
 * `LensModule` defaults.
 */

import cloneAndFreeze from '@utils/clone-and-freeze.js';
import freezeInPlace from '@utils/freeze-in-place.js';

import type { LensConfig, Recommendation, Snippet } from '../types.js';

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
 * The quiz lens's applicability gate — **Tier 2** per `../README.md`
 * § Three-tier classification. Returns `embodiment.status.parsed`: the lens
 * classifies tokens and generates questions from the AST, so an unparseable
 * snippet has nothing to anchor.
 *
 * @param embodiment - The frozen `Snippet` the orchestrator considers
 *   surfacing this lens for.
 * @returns `true` when the snippet parsed successfully.
 */
function applicableTo(embodiment: Snippet): boolean {
	return embodiment.status.parsed;
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

// Intentionally unfrozen — `./index.tsx` freezes the composed `LensModule`
// literal at construction time, which is the consumer-facing freeze boundary.
const quizCore = { config, applicableTo, recommend };

export default quizCore;
