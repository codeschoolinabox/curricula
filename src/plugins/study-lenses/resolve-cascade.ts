/**
 * @file Cascade resolver — reads and merges `lenses.json` files.
 *
 * Walks the directory ancestry from a given target directory up to
 * (and including) the content root, collecting every `lenses.json`
 * file it encounters. Folds the collection root-first into a single
 * deep-frozen `ResolvedConfig`.
 *
 * @remarks Caching (module-scoped Map + timestamp invalidation, per
 * {@link ../DOCS.md} "Module-scoped cache") lands in A.5 / A.6. Until
 * then every call re-walks and re-reads from disk. Deep-merge for
 * `lenses.*` and array-concat for `embedSiblings.ignorePrefixes` land
 * in later A-increments when their tests force them.
 */

import fs from 'node:fs';
import path from 'node:path';

import deepMerge from '../../lib/utils/deep-merge.js';
import { freezeInPlace } from '../../lib/utils/freeze.js';

import DEFAULTS from './defaults.js';

import type { LensesConfigFile, LensName, ResolvedConfig } from './types.js';

/**
 * Module-scoped cache. Survives across every `resolveCascade` invocation
 * within one Node process; each test file gets a fresh cache because
 * Vitest isolates module graphs per file by default. Key shape:
 * `` `${contentRoot}\0${absDir}` `` with null-byte separator so a path
 * segment containing a literal ASCII "0" cannot accidentally alias two
 * distinct (contentRoot, absDir) pairs.
 *
 * @remarks Invalidation (mtime-based revalidation) lands in A.6. Until
 * then the cache is write-once-read-many per (contentRoot, absDir)
 * pair — sufficient for A.5's happy-path reference-equality contract,
 * insufficient for live-reload correctness.
 *
 * @remarks Sanctioned exception to DEV.md "no mutable closures" rule —
 * see DOCS.md §Structural constraints "Module-scoped cache."
 */
const cache = new Map<string, ResolvedConfig>();

/**
 * Resolves the effective configuration for a specific directory under
 * a specific content root.
 *
 * @param absDir - Absolute path of the directory whose configuration
 *   is being resolved. Typically the directory of the markdown file
 *   being compiled, or (for the sibling walker) the directory of the
 *   sibling-bearing page. **Caller-trusted precondition:** must be an
 *   absolute path under `contentRoot`. The remark plugin's Guard
 *   phase enforces this upstream; the resolver itself does not
 *   validate path relationships.
 * @param options - `contentRoot` is the absolute path beyond which
 *   the cascade walk stops. Files outside this root are ignored.
 *   **Must be non-empty and absolute** — the resolver throws on
 *   empty input (empty would otherwise resolve to `process.cwd()` and
 *   silently alias unrelated calls together).
 * @returns A deep-frozen `ResolvedConfig`. Once the cache lands in
 *   A.5/A.6, repeat calls with the same inputs and unchanged filesystem
 *   state will return the same frozen reference; until then a fresh
 *   object is produced every call.
 * @throws If `contentRoot` is an empty string.
 * @throws If any `lenses.json` along the cascade is syntactically
 *   invalid JSON. The error message includes the offending file path.
 *   Missing `lenses.json` files are not errors — they are skipped.
 */
function resolveCascade(
	absDir: string,
	{ contentRoot }: { readonly contentRoot: string },
): ResolvedConfig {
	if (contentRoot === '') {
		throw new Error('resolveCascade: contentRoot is required');
	}
	const normalizedAbsDir = path.resolve(absDir);
	const normalizedContentRoot = path.resolve(contentRoot);
	const cacheKey = `${normalizedContentRoot}\u0000${normalizedAbsDir}`;

	// TODO(A.6): revalidate cached entry against tracked file mtimes
	// before returning; a stale entry here is currently returned blindly.
	const cached = cache.get(cacheKey);
	if (cached !== undefined) {
		return cached;
	}

	const fresh = computeFresh(normalizedAbsDir, normalizedContentRoot);
	cache.set(cacheKey, fresh);
	return fresh;
}

/**
 * Builds a fresh `ResolvedConfig` by walking, merging, and freezing.
 * Extracted so that A.5's cache-probe logic can sit above it as a
 * thin wrapper without disturbing the compute path.
 */
function computeFresh(
	absDir: string,
	contentRoot: string,
): ResolvedConfig {
	// 1. Walk — enumerate lenses.json paths from contentRoot down to absDir.
	const configPaths = walkCascade(absDir, contentRoot);

	// 2. Merge — fold each file's contributions onto DEFAULTS, root-first.
	let merged: ResolvedConfig = DEFAULTS;
	for (const configPath of configPaths) {
		const file = readLensesFile(configPath);
		merged = foldFile(merged, file);
	}

	// 3. Freeze — deep-freeze the fresh structure before returning.
	return freezeInPlace(merged);
}

/**
 * Enumerates the absolute paths of `lenses.json` files from `contentRoot`
 * down to `absDir`, inclusive at both ends. Missing files are filtered
 * out silently. Order is root-first so the caller can fold left-to-right
 * with child-overrides-parent semantics.
 */
function walkCascade(
	absDir: string,
	contentRoot: string,
): ReadonlyArray<string> {
	const ancestors: Array<string> = [];
	let current = absDir;
	// Second condition is a safety net — if the caller-trusted
	// precondition "absDir under contentRoot" is violated, bail at
	// filesystem root (`path.dirname('/') === '/'`) instead of looping.
	while (current !== contentRoot && current !== path.dirname(current)) {
		ancestors.unshift(current);
		current = path.dirname(current);
	}
	ancestors.unshift(contentRoot);
	return ancestors
		.map((dir) => path.join(dir, 'lenses.json'))
		.filter((p) => fs.existsSync(p));
}

/**
 * Reads and parses one `lenses.json` file. Throws with the file path
 * included in the error message on invalid JSON.
 */
function readLensesFile(configPath: string): LensesConfigFile {
	const raw = fs.readFileSync(configPath, 'utf8');
	try {
		return JSON.parse(raw) as LensesConfigFile;
	} catch (error) {
		const message =
			error instanceof Error ? error.message : String(error);
		throw new Error(`Malformed lenses.json at ${configPath}: ${message}`);
	}
}

/**
 * Folds one file's contributions onto a base config, producing a fresh
 * structure. Shallow merge for every top-level field except
 * `exerciseSetPrefixes`, which concatenates-and-dedupes across the
 * cascade. Deep-merge for `lenses.*` and array-concat for
 * `embedSiblings.ignorePrefixes` land in later increments when their
 * tests force them.
 */
function foldFile(
	base: ResolvedConfig,
	file: LensesConfigFile,
): ResolvedConfig {
	return {
		defaults: { ...base.defaults, ...(file.defaults ?? {}) },
		embedSiblings: {
			...base.embedSiblings,
			...(file.embedSiblings ?? {}),
		},
		lenses: mergeLenses(base.lenses, file.lenses ?? {}),
		exerciseSetPrefixes: [
			...new Set([
				...base.exerciseSetPrefixes,
				...(file.exerciseSetPrefixes ?? []),
			]),
		],
	};
}

/**
 * Merges two `lenses` maps. For each lens name present in either side,
 * the result carries a deep-merge of the two configs — child keys
 * extend parent keys within the same named lens; child values win on
 * conflict. Lens names present in only one side pass through untouched.
 *
 * @remarks Uses the shared `deepMerge` utility whose contract replaces
 * arrays rather than concatenating them. A lens config with an array
 * field — e.g. `lenses.highlight.markers` — thus replaces that array
 * across the cascade, not extends it. If a future lens needs array-
 * concat semantics within its config, it either uses object keys
 * instead or gets a dedicated merge strategy at the call site.
 */
function mergeLenses(
	base: Readonly<Record<LensName, Readonly<Record<string, unknown>>>>,
	file: Readonly<Record<LensName, Readonly<Record<string, unknown>>>>,
): Readonly<Record<LensName, Readonly<Record<string, unknown>>>> {
	const result: Record<LensName, Readonly<Record<string, unknown>>> = {
		...base,
	};
	for (const [lensName, lensConfig] of Object.entries(file)) {
		result[lensName] = deepMerge(base[lensName] ?? {}, lensConfig);
	}
	return result;
}

export default resolveCascade;
