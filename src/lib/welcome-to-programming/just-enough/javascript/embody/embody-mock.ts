/**
 * @file `embodyMock(code).with({...})` — test-fixture builder.
 *
 * Phase A scaffolding. Produces a `Snippet` where caller-supplied
 * overrides are deep-merged (right-wins) over the base produced by
 * `embody(code)`. Designed for Step 7 / Step 11 / WS3-WS4 tests that
 * need partial-status fixtures (e.g. "give me happy mode but with
 * `status.created: false`") without tripping the sentinel logic.
 *
 * @remarks **Internal-only.** Lens authors and curriculum authors
 * never see this; it is a test-fixture helper for the package's own
 * test suites. Co-located with `embody/index.ts` so contributors
 * find it next to the real factory.
 *
 * @remarks **`.with()` is terminal**, not chainable. Each call
 * consumes one override bundle, deep-merges, deep-freezes, and
 * returns the resulting Snippet. Composing multiple overrides is the
 * caller's job (`{ ...overrideA, ...overrideB }` or successive
 * `embodyMock(code).with(merged)` calls).
 *
 * @remarks **Arrays in overrides REPLACE base arrays** (per
 * `@utils/deep-merge`). E.g. supplying `validation.violations: [v1]`
 * sets violations to `[v1]`, not "appends `v1` to existing." This
 * matches deep-merge's documented behavior and is safer than
 * concat-by-default.
 *
 * @see ./index.ts — the production-shaped factory this builder wraps
 * @see ../REFACTOR-HANDOFF.md § Step 5 — authoritative spec
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';
import deepMerge from '@utils/deep-merge.js';

import type { Snippet } from './types.js';

import embody from './index.js';

/** Recursive partial — every nested field optional. Used for override bundles. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic recursive partial
type DeepPartial<T> = T extends ReadonlyArray<unknown> | ((...arguments_: any[]) => unknown)
	? T
	: T extends object
		? { [P in keyof T]?: DeepPartial<T[P]> }
		: T;

/** Override-builder result with a single terminal `.with(overrides)` call. */
type MockBuilder = {
	readonly with: (overrides: DeepPartial<Snippet>) => Snippet;
};

/** Build the merged + frozen Snippet for `embodyMock(code).with(overrides)`. */
function buildOverriddenSnippet(
	code: string,
	overrides: DeepPartial<Snippet>,
): Snippet {
	// Build a fresh frozen base on every call so the builder never
	// mutates a previously-returned Snippet.
	const base = embody(code);
	// deepMerge returns a new object — base is not mutated.
	const merged = deepMerge(base, overrides);
	return deepFreezeInPlace(merged);
}

/**
 * Build a fresh base `Snippet` for `code` (via `embody(code)`) and
 * return a builder whose `.with(overrides)` deep-merges the supplied
 * overrides over the base, deep-freezes, and returns the resulting
 * Snippet.
 *
 * @param code - The source string used to seed the base mode (empty,
 *   parse-fail, create-fail, or happy depending on `embody(code)`'s
 *   discriminator).
 * @returns A builder with a terminal `.with` method.
 */
function embodyMock(code: string): MockBuilder {
	return {
		with: (overrides) => buildOverriddenSnippet(code, overrides),
	};
}

export default embodyMock;
