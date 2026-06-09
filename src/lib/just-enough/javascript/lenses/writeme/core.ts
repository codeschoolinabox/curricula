/**
 * @file LensModule defaults for the `writeme` lens — the pure-TS functions
 * (`config`, `applicableTo`, `recommend`) that the React wrapper (`./index.tsx`)
 * splices into its frozen `LensModule` literal.
 *
 * @remarks Per the lenses peer's two-layer module convention, `core.ts` imports
 * no React. Tests run in vitest without jsdom (see `./tests/core.test.ts`).
 */

import { cloneAndFreeze, freezeInPlace } from '@utils/freeze.js';

import type { LensConfig, Recommendation, Snippet } from '../types.js';

/**
 * Module-level frozen-empty-array constant — shared across all `recommend()`
 * calls so the empty-result return is a stable reference (no per-call
 * allocation). Per `./DOCS.md` § Structural constraints / LensModule defaults
 * return deep-frozen values.
 */
const EMPTY_RECOMMENDATIONS = freezeInPlace<ReadonlyArray<Recommendation>>([]);

/**
 * Resolves the writeme lens's per-mount config — applies the documented
 * defaults and merges educator-supplied overrides on top (overrides win).
 * Unknown fields in `overrides` are preserved verbatim (open-shape contract).
 * Deep-frozen via `cloneAndFreeze`.
 *
 * @remarks Defaults per `./README.md` § Public API and the `WritemeLensConfig`
 * JSDoc:
 * - `viewMode` → `'write'`
 * - `colorize` → `true`
 * - `suggestions` → `false`
 * - `keepComments` → `true`
 * - `diff` → `true`
 *
 * @param overrides - Partial config from the educator's per-fence directive or
 *   `lenses.json` cascade. May be `undefined`.
 * @returns Frozen `LensConfig` with defaults applied and overrides merged.
 */
function config(overrides?: Partial<LensConfig>): LensConfig {
	// `cloneAndFreeze` (not `freezeInPlace`) so a caller-supplied overrides
	// object is NOT frozen as a side-effect. Spread preserves null/false
	// overrides verbatim (vs the `??` / `||` anti-patterns). The `as LensConfig`
	// cast widens the narrowly-typed default literal (e.g. `viewMode: 'write'`
	// rather than `SerializableValue`) to the open-shape
	// `Record<string, SerializableValue>` and crosses the
	// `exactOptionalPropertyTypes` boundary (see blanks/core.ts for the rationale).
	return cloneAndFreeze({
		viewMode: 'write',
		colorize: true,
		suggestions: false,
		keepComments: true,
		diff: true,
		...overrides,
	}) as LensConfig;
}

/**
 * The writeme lens's applicability gate — **Tier 1** per `../README.md`
 * § Three-tier classification. Returns `true` unconditionally: writing the code
 * back from memory needs neither an AST nor a successful parse. A deliberate
 * divergence from `blanks` (Tier 2, `status.parsed`); suitability (a snippet
 * long enough to be worth retyping) is the recommender's concern, not a hard
 * applicability gate.
 *
 * @param _embodiment - Ignored (text-only lens; always applicable).
 */
function applicableTo(_embodiment: Snippet): boolean {
	return true;
}

/**
 * Block-Model placement recommendations for this lens. Returns the shared frozen
 * empty array — writeme appears in the picker (via `applicableTo`) but
 * contributes no recommendations until the WS2 analysis pipeline lands. See
 * `./README.md` § Future direction.
 *
 * @param _embodiment - Ignored until WS2 supplies the analysis surface.
 */
function recommend(_embodiment: Snippet): ReadonlyArray<Recommendation> {
	return EMPTY_RECOMMENDATIONS;
}

// Intentionally unfrozen — `./index.tsx` freezes the composed `LensModule`
// literal at construction time, the consumer-facing freeze boundary.
const writemeCore = { config, applicableTo, recommend };

export default writemeCore;
