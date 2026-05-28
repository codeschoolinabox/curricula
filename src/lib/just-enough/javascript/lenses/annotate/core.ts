/**
 * @file LensModule defaults for the `annotate` lens — the pure-TS
 * functions (`config`, `applicableTo`, `recommend`) that the React
 * wrapper (`./index.tsx`) splices into its frozen `LensModule` literal.
 *
 * @remarks Per the lenses peer's two-layer module convention, `core.ts`
 * imports no React. Tests run in vitest without jsdom (see
 * `./tests/core.test.ts`).
 */

import { freezeInPlace } from '@utils/freeze.js';

import type { LensConfig, Recommendation, Snippet } from '../types.js';

/**
 * Resolves the annotate lens's per-mount config — applies the three
 * documented defaults and merges educator-supplied overrides on top
 * (overrides win, even when the override value is `null` — per the
 * open-shape contract on `LensConfig`). Unknown fields in `overrides`
 * are preserved verbatim. The returned object is deep-frozen via
 * `freezeInPlace` so consumers cannot mutate it (covers any nested
 * primitive-array values an open-shape override may carry).
 *
 * @remarks Defaults per `./README.md` § Public API:
 * - `colorize` → `true` (Prism tokenization on)
 * - `defaultView` → `'code'` (initial active view)
 * - `eraserRadius` → `20` (eraser hit-test radius in pixels)
 *
 * @remarks Param type is `Partial<LensConfig>` (open-shape) rather than
 * `Partial<AnnotateLensConfig>` (documented-fields only) — the latter
 * is a documentation device naming the fields this lens *reads*, not a
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
	// `SerializableValue`) does not. The TS call site prevents
	// callers from passing explicit `undefined` values, so the cast is
	// safe — and is also load-bearing for structural narrowing because
	// the defaults object literal types to
	// `{ colorize: boolean; defaultView: string; eraserRadius: number }`,
	// narrower than the open-shape `Record<string, SerializableValue>`
	// that `LensConfig` requires.
	return freezeInPlace({
		colorize: true,
		defaultView: 'code',
		eraserRadius: 20,
		...overrides,
	}) as LensConfig;
}

/**
 * The annotate lens's applicability gate — always returns `true`
 * because the lens is **Tier 1** per `../README.md` § Three-tier
 * classification: code-view + drawing + notes work on any source
 * string, parseable or not. The flowchart-view is a Tier-2 sub-feature
 * surfaced at the toggle-button's `disabled` state inside the wrapper,
 * not at this gate.
 *
 * @remarks The orchestrator's recommender calls `applicableTo` as the
 * cheap O(1) filter before the richer `recommend()` ranking. For
 * Tier 1 lenses the gate is `() => true` at the `LensModule` surface
 * (see `../debug-props/index.tsx` for the inline-literal precedent);
 * here it is a named-function declaration so the core stays
 * unit-testable in vitest without jsdom.
 *
 * @param _embodiment - The frozen `Snippet` the orchestrator considers
 *   surfacing this lens for. Ignored (Tier 1).
 * @returns `true` for every snippet.
 */
function applicableTo(_embodiment: Snippet): boolean {
	return true;
}

/**
 * Block-Model placement recommendations for this lens. Returns `[]` —
 * the annotate lens appears in the orchestrator's picker (via
 * `applicableTo`) but contributes no recommendations to the
 * recommendations panel until the WS2 analysis pipeline lands. See
 * `../README.md` § Future direction and
 * `../../.planning-handoffs/02-analysis-and-recommender.md`.
 *
 * @remarks `recommend` runs only on lenses `applicableTo` already
 * admitted — it is the richer relevance computation, not the cheap
 * gate. The empty result is a deliberate placeholder, not a
 * not-applicable signal (that is `applicableTo`'s job).
 *
 * @param _embodiment - The frozen `Snippet` to rank against. Ignored
 *   until WS2 supplies the analysis surface.
 * @returns An empty array.
 */
function recommend(_embodiment: Snippet): ReadonlyArray<Recommendation> {
	return freezeInPlace<ReadonlyArray<Recommendation>>([]);
}

// Intentionally unfrozen — `./index.tsx` freezes the composed
// `LensModule` literal at construction time, which is the
// consumer-facing freeze boundary.
const annotateCore = { config, applicableTo, recommend };

export default annotateCore;
