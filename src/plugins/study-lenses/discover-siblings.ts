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

import fs from 'node:fs';
import path from 'node:path';

import { freezeInPlace } from '../../lib/utils/freeze.js';

import EXT_TO_LANG from './ext-to-lang.js';

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
	pageDir: string,
	config: ResolvedConfig,
): ReadonlyArray<Sibling> {
	if (config.embedSiblings.mode === 'off') {
		return freezeInPlace([]);
	}

	// TODO(B.5): recursive descent into subdirectories; currently walks
	// only pageDir itself.
	const siblings: Array<Sibling> = [];
	for (const entry of fs.readdirSync(pageDir, { withFileTypes: true })) {
		if (!entry.isFile()) continue;
		const ext = path.extname(entry.name);
		const lang = EXT_TO_LANG[ext];
		if (lang === undefined) continue;
		const lens = config.defaults[lang];
		if (lens === undefined) continue;
		const absPath = path.join(pageDir, entry.name);
		const label = entry.name.slice(0, -ext.length);
		const code = fs.readFileSync(absPath, 'utf8');
		siblings.push({ absPath, label, code, lang, lens });
	}
	return freezeInPlace(siblings);
}

export default discoverSiblings;
