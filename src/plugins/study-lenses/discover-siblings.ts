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
import parseStudyLensDirective from './parse-study-lens-directive.js';
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
export default function discoverSiblings(
	pageDir: string,
	config: ResolvedConfig,
): ReadonlyArray<Sibling> {
	if (config.embedSiblings.mode === 'off') {
		return freezeInPlace([]);
	}
	const siblings: Array<Sibling> = [];
	walk(pageDir, pageDir, config, siblings);
	// Sort by label for a stable, deterministic order across platforms —
	// `readdirSync` order is filesystem-dependent (alphabetical on APFS,
	// unpredictable on some Linux filesystems).
	siblings.sort((a, b) => a.label.localeCompare(b.label));
	return freezeInPlace(siblings);
}

/**
 * Recursively walks `currentDir`, pushing a `Sibling` for each eligible
 * file into `out`. Labels are computed relative to `pageDir` so nested
 * files carry their subpath for disambiguation.
 *
 * @remarks Page-boundary, ignore-prefix, and safety-exclusion filters
 * land in B.7–B.11 when their tests force them.
 */
function walk(
	currentDir: string,
	pageDir: string,
	config: ResolvedConfig,
	out: Array<Sibling>,
): void {
	for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
		const absPath = path.join(currentDir, entry.name);
		// Symlinks register as isSymbolicLink(), not isDirectory() — so the
		// isDirectory check below already refuses to follow them. Keep the
		// explicit guard here in case a future refactor changes that.
		if (entry.isSymbolicLink()) continue;
		if (entry.isDirectory()) {
			// Safety: never recurse into node_modules or hidden dirs.
			if (entry.name === 'node_modules') continue;
			if (entry.name.startsWith('.')) continue;
			// Ignore-prefix: dirname-prefix match → skip whole subtree.
			if (hasIgnoredPrefix(entry.name, config.embedSiblings.ignorePrefixes)) {
				continue;
			}
			// Page boundary: a subdirectory with its own sibling-bearing
			// page marker owns its subtree; don't leak into the outer page.
			if (isSiblingBearingPageDir(absPath)) continue;
			walk(absPath, pageDir, config, out);
			continue;
		}
		if (!entry.isFile()) continue;
		const ext = path.extname(entry.name);
		const lang = EXT_TO_LANG[ext];
		if (lang === undefined) continue;
		const cascadeLens = config.defaults[lang];
		// Gate-semantics parity with the fence-side gate at
		// `remark-study-lenses.ts` (see DOCS.md §Structural constraints).
		// `== null` covers absent key today AND explicit `null` (subtree
		// deconfiguration) after L2.6 widens the map-value type.
		if (cascadeLens == null) continue;
		const labelPath = path.relative(pageDir, absPath);
		const label = labelPath.slice(0, -ext.length).split(path.sep).join('/');
		const rawContent = fs.readFileSync(absPath, 'utf8');
		const match = parseStudyLensDirective(rawContent, absPath);
		const code = match?.strippedCode ?? rawContent;
		const lens = match?.directive.lens ?? cascadeLens;
		const sibling: Sibling =
			match?.directive.lensConfig !== undefined
				? {
						absPath,
						label,
						code,
						lang,
						lens,
						lensConfig: match.directive.lensConfig,
					}
				: { absPath, label, code, lang, lens };
		out.push(sibling);
	}
}

/**
 * A directory is a sibling-bearing page boundary if it contains
 * `index.md` or `README.md`. `index.md` takes precedence when both
 * exist (README.md then plays the contributor-facing role per the
 * AR-1 resolution in README.md §README.md-vs-index.md); for the
 * boundary check, presence of *either* is sufficient.
 */
/**
 * Returns true if the basename starts with any configured ignore prefix.
 * Empty strings are ignored (they would match every directory).
 */
function hasIgnoredPrefix(
	basename: string,
	prefixes: ReadonlyArray<string>,
): boolean {
	return prefixes.some((p) => p !== '' && basename.startsWith(p));
}

function isSiblingBearingPageDir(dir: string): boolean {
	return (
		fs.existsSync(path.join(dir, 'index.md')) ||
		fs.existsSync(path.join(dir, 'README.md'))
	);
}
