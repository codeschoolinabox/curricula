// cspell:ignore distractor distractors

/**
 * Lens defaults for the `parsons` lens — the pure functions
 * (`config`, `applicability`, `recommend`) that the React component module
 * (`./index.tsx`) splices into its frozen `Lens` object.
 *
 * @remarks Per the region's two-layer module convention, `core.ts` imports
 * no React. Tests run in vitest without jsdom (see `./tests/core.test.ts`).
 */

import cloneAndFreeze from '@utils/clone-and-freeze.js';
import freezeInPlace from '@utils/freeze-in-place.js';

import type {
	LensConfig,
	Recommendation,
	SerializableValue,
} from '../types.js';

/**
 * Resolves the parsons lens's configuration — applies the four documented
 * defaults and merges overrides on top (overrides win). Unknown fields in
 * `overrides` are preserved verbatim (open-shape contract). Deep-frozen via
 * `cloneAndFreeze`.
 *
 * @remarks Defaults per `./README.md` § Configuration and the
 * `ParsonsLensConfig` JSDoc:
 * - `canIndent` → `true`
 * - `maxDistractors` → `10`
 * - `indentSize` → `4`
 * - `viewMode` → `'work'`
 *
 * Per the kind contract (`../types.ts` `Lens.config`), an override key
 * present with `undefined` is treated as absent — the default applies —
 * while `null` and `false` are values and win verbatim.
 *
 * @param overrides - Partial config from the cascade's merged overrides.
 *   May be `undefined`.
 * @returns Frozen `LensConfig` with defaults applied and overrides merged.
 */
function config(overrides: Partial<LensConfig> = {}): LensConfig {
	// Drop `undefined`-valued keys BEFORE the spread: a bare spread would
	// let `{ canIndent: undefined }` shadow the default with `undefined`,
	// violating the kind contract's absent-key rule. `null`/`false` survive
	// the filter and win verbatim (no `??` / `||` coercion).
	const defined = Object.fromEntries(
		Object.entries(overrides).filter(
			(entry): entry is [string, SerializableValue] => entry[1] !== undefined,
		),
	);
	// `cloneAndFreeze` (not `freezeInPlace`) so a caller-supplied overrides
	// object/array is NOT frozen as a side-effect.
	return cloneAndFreeze<LensConfig>({
		canIndent: true,
		maxDistractors: 10,
		indentSize: 4,
		viewMode: 'work',
		...defined,
	});
}

/**
 * The parsons lens's applicability gate — `true` for every program. A
 * Parsons exercise reorders **text lines**: it reads `facts.source` only,
 * needs no syntax tree, and does not require the program to parse (a
 * deliberate divergence from AST-walking lenses). Declared with no
 * parameter because it consults no Facts at all; the kind contract's
 * `(facts) => boolean` shape is satisfied structurally. Suitability
 * (single-line / trivial programs) is a recommender concern, not a hard
 * gate.
 */
function applicability(): boolean {
	return true;
}

/**
 * Next-step proposals for this lens. Returns the shared frozen empty array
 * — parsons is offered via its gate but contributes no recommendations yet.
 * See `./README.md` § Future direction.
 */
function recommend(): ReadonlyArray<Recommendation> {
	return EMPTY_RECOMMENDATIONS;
}

/**
 * Module-level frozen-empty-array constant — shared across all `recommend`
 * calls so the empty-result return is a stable reference (no per-call
 * allocation).
 */
const EMPTY_RECOMMENDATIONS = freezeInPlace<ReadonlyArray<Recommendation>>([]);

// Intentionally unfrozen — `./index.tsx` freezes the composed `Lens`
// object at construction time, the consumer-facing freeze boundary.
const parsonsCore = { config, applicability, recommend };

export default parsonsCore;
