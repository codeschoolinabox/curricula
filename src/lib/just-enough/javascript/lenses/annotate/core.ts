/**
 * @file LensModule defaults for the `annotate` lens — exposes the
 * `config` factory that resolves educator-supplied overrides against
 * the three documented defaults. Subsequent increments grow this file
 * with `applicableTo` and `recommend`, assembled alongside `config` in
 * the file's default-exported record. The React wrapper (`./index.tsx`)
 * imports the record to populate the `LensModule` literal at
 * `Object.freeze` time.
 *
 * @remarks Per the lenses peer's two-layer module convention, `core.ts`
 * imports no React. Tests run in vitest without jsdom (see
 * `./tests/core.test.ts`).
 */

import type { LensConfig } from '../types.js';

/**
 * Resolves the annotate lens's per-mount config — applies the three
 * documented defaults and merges educator-supplied overrides on top
 * (overrides win, even when the override value is `null` — per the
 * open-shape contract on `LensConfig`). Unknown fields in `overrides`
 * are preserved verbatim. The returned object is frozen (shallow —
 * `LensConfig` value-types are primitives + primitive arrays; the
 * outer record is the consumer-facing surface).
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
	// that `LensConfig` requires. Mirrors the precedent at
	// `../debug-props/index.tsx § debugPropsConfig`.
	return Object.freeze({
		colorize: true,
		defaultView: 'code',
		eraserRadius: 20,
		...overrides,
	}) as LensConfig;
}

const annotateCore = { config };

export default annotateCore;
