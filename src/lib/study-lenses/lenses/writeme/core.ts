/**
 * @file Lens-contract defaults for the `writeme` lens — the pure functions
 * (`config`, `applicability`, `recommend`) that the React wrapper
 * (`./index.tsx`) splices into its frozen `Lens` object.
 *
 * @remarks Per the lenses region's two-layer module convention, `core.ts`
 * imports no React — and, per the region purity rule, embody only as types.
 * Tests run in vitest without jsdom (see `./tests/core.test.ts`).
 */

import cloneAndFreeze from '@utils/clone-and-freeze.js';
import freezeInPlace from '@utils/freeze-in-place.js';

import type { Embodiment, Facts } from '../../embody/types.js';
import type { LensConfig, Recommendation } from '../types.js';

/**
 * Module-level frozen-empty-array constant — shared across all `recommend()`
 * calls so the empty-result return is a stable reference (no per-call
 * allocation). Per `./DOCS.md` § Structural constraints / lens-contract
 * defaults return deep-frozen values.
 */
const EMPTY_RECOMMENDATIONS = freezeInPlace<ReadonlyArray<Recommendation>>([]);

/**
 * Resolves the writeme lens's per-mount config — applies the documented
 * defaults and merges the cascade's overrides on top (overrides win).
 * Unknown fields in `overrides` are preserved verbatim (open-shape contract).
 * Deep-frozen via `cloneAndFreeze`.
 *
 * @remarks Defaults per `./README.md` § The lens contract and the
 * `WritemeLensConfig` JSDoc:
 * - `viewMode` → `'write'`
 * - `colorize` → `true`
 * - `suggestions` → `false`
 * - `keepComments` → `true`
 * - `diff` → `true`
 *
 * @param overrides - The merged overrides the composition root resolved from
 *   the cascade. May be `undefined`.
 * @returns Frozen `LensConfig` with defaults applied and overrides merged.
 */
function config(overrides?: Partial<LensConfig>): LensConfig {
	// `cloneAndFreeze` (not `freezeInPlace`) so a caller-supplied overrides
	// object is NOT frozen as a side-effect. Spread preserves null/false
	// overrides verbatim (vs the `??` / `||` anti-patterns). The `as LensConfig`
	// cast widens the narrowly-typed default literal (e.g. `viewMode: 'write'`
	// rather than `SerializableValue`) to the open-shape
	// `Record<string, SerializableValue>` and crosses the
	// `exactOptionalPropertyTypes` boundary.
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
 * The writeme lens's applicability gate — returns `true` unconditionally:
 * writing the code back from memory needs neither a syntax tree nor a
 * successful parse. The lens renders `facts.source.value` as the solution and
 * grades the learner's text line-by-line, and `source` is a given stage that
 * cannot fail. Suitability (a snippet long enough to be worth retyping) is the
 * recommender's concern, not a hard applicability gate.
 *
 * @param _facts - Ignored (text-only lens; always applicable).
 */
function applicability(_facts: Facts): boolean {
	return true;
}

/**
 * Next-step proposals for this lens. Returns the shared frozen empty array —
 * writeme is offered (via `applicability`) but contributes no recommendations
 * until the analysis surface lands. See `./README.md` § Future direction.
 *
 * @param _embodiment - Ignored until the analysis surface exists.
 */
function recommend(_embodiment: Embodiment): ReadonlyArray<Recommendation> {
	return EMPTY_RECOMMENDATIONS;
}

// Intentionally unfrozen — `./index.tsx` freezes the composed `Lens` object
// at construction time, the consumer-facing freeze boundary.
const writemeCore = { config, applicability, recommend };

export default writemeCore;
