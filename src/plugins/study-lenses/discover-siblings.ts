/**
 * @file Sibling walker — collects `.js` files under a sibling-bearing
 * page's directory for embedding into the rendered markdown output.
 *
 * Walks downward from a given page directory. Descent halts at three
 * kinds of boundary:
 *
 * - **Page boundaries** — subdirectories that contain their own
 *   sibling-bearing page (`index.md` or, when `index.md` is absent,
 *   `README.md`). Files beyond belong to that other page.
 * - **Ignore-prefixed directories** — subdirectories whose name starts
 *   with any prefix in `config.embedSiblings.ignorePrefixes`.
 * - **Safety exclusions** — `node_modules/`, hidden directories
 *   (leading dot), symlinks (not followed).
 *
 * Files whose language identifier (derived from the extension via
 * `ext-to-lang.ts`) is not a key in `config.defaults` are skipped per
 * the configured-languages rule — the walker does NOT assign a
 * fallback lens for unconfigured languages.
 */

import type { ResolvedConfig, Sibling } from './types.js';

/**
 * Enumerates the sibling `.js` files that should be auto-embedded into
 * a sibling-bearing page's rendered output.
 *
 * @param pageDir - Absolute path of the sibling-bearing page's
 *   directory. **Caller-trusted precondition:** must be an existing
 *   directory; the remark plugin's Guard phase verifies upstream.
 * @param config - Resolved configuration for `pageDir` (as produced by
 *   the cascade resolver). The walker consults `embedSiblings.mode`,
 *   `embedSiblings.ignorePrefixes`, and `defaults[lang]`.
 * @returns A deep-frozen, alphabetically-sorted array of `Sibling`
 *   entries. Empty if `embedSiblings.mode === 'off'`, if no `.js`
 *   files match the configured-languages filter, or if the walk
 *   encounters only ignored/boundary directories.
 */
function discoverSiblings(
	_pageDir: string,
	_config: ResolvedConfig,
): ReadonlyArray<Sibling> {
	// TODO(B.4): Fake It — returns []; B.4 triangulates with an actual walk.
	return [];
}

export default discoverSiblings;
