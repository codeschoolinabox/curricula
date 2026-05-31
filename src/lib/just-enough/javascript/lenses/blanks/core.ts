/**
 * @file LensModule defaults for the `blanks` lens — the pure-TS
 * functions (`config`, `applicableTo`, `recommend`) that the React
 * wrapper (`./index.tsx`) splices into its frozen `LensModule` literal.
 *
 * @remarks Per the lenses peer's two-layer module convention, `core.ts`
 * imports no React. Tests run in vitest without jsdom (see
 * `./tests/core.test.ts`).
 *
 * @remarks Follows the [`../annotate/core.ts`](../annotate/core.ts)
 * precedent of bundling the three trivial LensModule trio functions in
 * one file rather than splitting per [04 § Lens file structure]
 * (../../.planning-handoffs/04-lens-migration.md). The substantive
 * algorithms live in `./derive-blanks.ts` and `./validate-answer.ts`.
 */

import { freezeInPlace } from '@utils/freeze.js';

import type { LensConfig, Recommendation, Snippet } from '../types.js';

/**
 * Resolves the blanks lens's per-mount config — applies the documented
 * defaults and merges educator-supplied overrides on top (overrides
 * win, per the open-shape contract on `LensConfig`). Unknown fields in
 * `overrides` are preserved verbatim. The returned object is frozen
 * via `freezeInPlace` so consumers cannot mutate it.
 *
 * @remarks Defaults per `./README.md` § Public API:
 * - `difficulty` → `50` (probability `0.5` per eligible token)
 * - `tokenCategories` → `['keywords', 'identifiers', 'operators',
 *   'literals']` (all four categories enabled)
 * - `seed` is intentionally unset; the wrapper computes a per-mount
 *   random seed at first render via `useMemo([])` when `config.seed`
 *   is unset, so each mount produces a fresh exercise.
 *
 * @remarks Param type is `Partial<LensConfig>` (open-shape) rather than
 * `Partial<BlanksLensConfig>` (documented-fields only) — the latter is
 * a documentation device naming the fields this lens *reads*, not a
 * narrowing on the fields callers may *pass*. Unknown educator fields
 * pass through untouched.
 *
 * @param overrides - Partial config bundle from the educator's per-fence
 *   directive or `lenses.json` cascade. May be `undefined`.
 * @returns Frozen `LensConfig` with defaults applied and overrides
 *   merged on top.
 */
function config(overrides?: Partial<LensConfig>): LensConfig {
	// `Partial<LensConfig>` admits `undefined` values under
	// `exactOptionalPropertyTypes`; `LensConfig` (Record of
	// `SerializableValue`) does not. The TS call site prevents callers
	// from passing explicit `undefined` values, so the cast is safe —
	// and is also load-bearing for structural narrowing because the
	// defaults object literal types to
	// `{ difficulty: number; tokenCategories: string[] }`, narrower
	// than the open-shape `Record<string, SerializableValue>` that
	// `LensConfig` requires.
	return freezeInPlace({
		difficulty: 50,
		tokenCategories: ['keywords', 'identifiers', 'operators', 'literals'],
		...overrides,
	}) as LensConfig;
}

/**
 * The blanks lens's applicability gate — returns
 * `embodiment.status.parsed`. **Tier 2** per `../README.md` §
 * Three-tier classification: the lens needs a valid AST to identify
 * tokens by category. A parse-failed snippet has no AST to walk.
 *
 * @remarks The chain `parsed ⇒ tokenized` (per `../../embody/types.ts`
 * § Status booleans) guarantees `embodiment.raw.tokens` is non-null
 * whenever this returns `true`, which is what
 * [`./derive-blanks.ts`](./derive-blanks.ts) needs for the position
 * sub-step of the two-pass derivation.
 *
 * @param embodiment - The frozen `Snippet` the orchestrator considers
 *   surfacing this lens for.
 * @returns `true` when the embodiment is parsed; `false` otherwise.
 */
function applicableTo(embodiment: Snippet): boolean {
	return embodiment.status.parsed;
}

/**
 * Block-Model placement recommendations for this lens. Returns `[]` —
 * the blanks lens appears in the orchestrator's picker (via
 * `applicableTo`) but contributes no recommendations to the
 * recommendations panel until WS2's analysis pipeline lands. See
 * `../README.md` § Future direction and
 * `../../.planning-handoffs/02-analysis-and-recommender.md`.
 *
 * @remarks `recommend` runs only on lenses `applicableTo` already
 * admitted. The empty result is a deliberate placeholder, not a
 * not-applicable signal (that is `applicableTo`'s job).
 *
 * @param _embodiment - The frozen `Snippet` to rank against. Ignored
 *   until WS2 supplies the analysis surface.
 * @returns An empty array (frozen).
 */
function recommend(_embodiment: Snippet): ReadonlyArray<Recommendation> {
	return freezeInPlace<ReadonlyArray<Recommendation>>([]);
}

// Intentionally unfrozen — `./index.tsx` freezes the composed
// `LensModule` literal at construction time, which is the
// consumer-facing freeze boundary. (Mirrors `../annotate/core.ts`.)
const blanksCore = { config, applicableTo, recommend };

export default blanksCore;
