/**
 * @file LensModule defaults for the `blanks` lens — the pure-TS
 * functions (`config`, `applicableTo`, `recommend`) that the React
 * wrapper (`./index.tsx`) splices into its frozen `LensModule` literal.
 *
 * @remarks Per the lenses peer's two-layer module convention, `core.ts`
 * imports no React. Tests run in vitest without jsdom (see
 * `./tests/core.test.ts`).
 */

import { cloneAndFreeze, freezeInPlace } from '@utils/freeze.js';

import type { LensConfig, Recommendation, Snippet } from '../types.js';

/**
 * Module-level frozen-empty-array constant — shared across all
 * `recommend()` calls so the empty-result return is a stable reference
 * (no per-call allocation). Per the architectural sketch
 * (`./DOCS.md` § Structural constraints / LensModule defaults return
 * deep-frozen values).
 */
const EMPTY_RECOMMENDATIONS = freezeInPlace<ReadonlyArray<Recommendation>>([]);

/**
 * Resolves the blanks lens's per-mount config — applies the four
 * documented defaults and merges educator-supplied overrides on top
 * (overrides win). Unknown fields in `overrides` are preserved verbatim
 * (open-shape contract). The returned object is deep-frozen via
 * `freezeInPlace`.
 *
 * @remarks Defaults per `./README.md` § Public API and the
 * `BlanksLensConfig` JSDoc:
 * - `difficulty` → `50`
 * - `contentTypes` → `['keywords', 'identifiers', 'operators', 'literals']`
 * - `viewMode` → `'blankenated'`
 * - `hintsLevel` → `'auto'`
 *
 * @param overrides - Partial config bundle from the educator's per-fence
 *   directive or `lenses.json` cascade. May be `undefined`.
 * @returns Frozen `LensConfig` with defaults applied and overrides
 *   merged on top.
 */
function config(overrides?: Partial<LensConfig>): LensConfig {
	// `cloneAndFreeze` (not `freezeInPlace`) so a caller-supplied
	// `contentTypes` array is NOT mutated as a side-effect — see
	// `./tests/core.test.ts` "contentTypes override is a fresh array"
	// + "caller-side input array remains mutable after config() returns".
	// Spread preserves null overrides verbatim (vs the `??` anti-pattern).
	//
	// The `as LensConfig` cast is load-bearing for two reasons:
	// 1. The defaults object literal types narrower (e.g.
	//    `difficulty: number` rather than `SerializableValue`); cast
	//    widens to the open-shape `Record<string, SerializableValue>`.
	// 2. `Partial<LensConfig>` admits `undefined` values under
	//    `exactOptionalPropertyTypes`; `LensConfig` does not. The cast
	//    crosses that boundary.
	return cloneAndFreeze({
		difficulty: 50,
		contentTypes: ['keywords', 'identifiers', 'operators', 'literals'],
		viewMode: 'blankenated',
		hintsLevel: 'auto',
		...overrides,
	}) as LensConfig;
}

/**
 * The blanks lens's applicability gate — **Tier 2** per
 * `../README.md` § Three-tier classification. Returns
 * `embodiment.status.parsed`: the vendored `blankenate` walks an Acorn
 * AST; an unparseable snippet has no AST to walk.
 *
 * @param embodiment - The frozen `Snippet` the orchestrator considers
 *   surfacing this lens for.
 * @returns `true` when the snippet parsed successfully.
 */
function applicableTo(embodiment: Snippet): boolean {
	return embodiment.status.parsed;
}

/**
 * Block-Model placement recommendations for this lens. Returns the
 * shared frozen empty array — the blanks lens appears in the
 * orchestrator's picker (via `applicableTo`) but contributes no
 * recommendations until the WS2 analysis pipeline lands. See
 * `./README.md` § Future direction.
 *
 * @param _embodiment - Ignored until WS2 supplies the analysis surface.
 * @returns The module-level frozen empty array (no per-call allocation).
 */
function recommend(_embodiment: Snippet): ReadonlyArray<Recommendation> {
	return EMPTY_RECOMMENDATIONS;
}

// Intentionally unfrozen — `./index.tsx` freezes the composed
// `LensModule` literal at construction time, which is the
// consumer-facing freeze boundary.
const blanksCore = { config, applicableTo, recommend };

export default blanksCore;
