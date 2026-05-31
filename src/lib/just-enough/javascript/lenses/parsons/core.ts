/**
 * @file LensModule defaults for the `parsons` lens — the pure-TS
 * functions (`config`, `applicableTo`, `recommend`) that the React
 * wrapper (`./index.tsx`) splices into its frozen `LensModule` literal.
 *
 * @remarks Per the lenses peer's two-layer module convention, `core.ts`
 * imports no React. Tests run in vitest without jsdom (see
 * `./tests/core.test.ts`).
 *
 * @remarks Follows the [`../annotate/core.ts`](../annotate/core.ts)
 * and [`../blanks/core.ts`](../blanks/core.ts) precedent of bundling
 * the three trivial LensModule trio functions in one file. The
 * substantive algorithm lives in `./shuffle.ts`.
 */

import { freezeInPlace } from '@utils/freeze.js';

import type { LensConfig, Recommendation, Snippet } from '../types.js';

/**
 * Resolves the parsons lens's per-mount config — applies overrides on
 * top (overrides win, per the open-shape contract on `LensConfig`).
 * Unknown fields in `overrides` are preserved verbatim. The returned
 * object is frozen via `freezeInPlace` so consumers cannot mutate it.
 *
 * @remarks v1 ships with no documented defaults: the only field the
 * lens reads is `seed`, which is intentionally unset by default. The
 * wrapper computes a per-mount random seed at first render via
 * `useMemo([])` when `config.seed` is unset, so each mount produces a
 * fresh shuffle. Pinning `seed` in config reproduces the same shuffle
 * across remounts (useful for tests).
 *
 * @remarks Param type is `Partial<LensConfig>` (open-shape) rather
 * than `Partial<ParsonsLensConfig>` (documented-fields only) — the
 * latter is a documentation device naming the fields this lens
 * *reads*, not a narrowing on the fields callers may *pass*. Unknown
 * educator fields pass through untouched.
 *
 * @param overrides - Partial config bundle from the educator's per-
 *   fence directive or `lenses.json` cascade. May be `undefined`.
 * @returns Frozen `LensConfig` with overrides applied (empty when no
 *   overrides are supplied).
 */
function config(overrides?: Partial<LensConfig>): LensConfig {
	// No defaults in v1 — `seed` is intentionally absent from the
	// spread base; the wrapper computes a per-mount random seed when
	// `seed` is unset in the resolved config.
	//
	// `Partial<LensConfig>` admits `undefined` values under
	// `exactOptionalPropertyTypes`; `LensConfig` (Record of
	// `SerializableValue`) does not. The TS call site prevents callers
	// from passing explicit `undefined` values, so the cast is safe —
	// and is also load-bearing for the spread-result structural
	// narrowing: `{ ...overrides }` infers `Record<string,
	// SerializableValue | undefined>`, not the `LensConfig` co-domain
	// without `undefined`.
	return freezeInPlace({ ...overrides }) as LensConfig;
}

/**
 * The parsons lens's applicability gate — always returns `true`.
 * **Tier 1** per `../README.md` § Three-tier classification: line
 * ordering needs only the source string, not parse status. The lens
 * does not read `embodiment`; the `() => true` literal is intentional
 * and matches the [`../annotate/`](../annotate/) precedent.
 *
 * @param _embodiment - The frozen `Snippet`. Ignored (Tier 1).
 * @returns `true` for every snippet.
 */
function applicableTo(_embodiment: Snippet): boolean {
	return true;
}

/**
 * Block-Model placement recommendations for this lens. Returns `[]` —
 * the parsons lens appears in the orchestrator's picker (via
 * `applicableTo`) but contributes no recommendations to the
 * recommendations panel until WS2's analysis pipeline lands.
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
// consumer-facing freeze boundary.
const parsonsCore = { config, applicableTo, recommend };

export default parsonsCore;
