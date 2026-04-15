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
 * A file tracked during a cascade walk, paired with the mtime observed
 * at the time the walk ran. Used to revalidate cache entries against
 * the current filesystem state.
 */
type TrackedFile = Readonly<{ path: string; mtime: number }>;

type CacheEntry = Readonly<{
	config: ResolvedConfig;
	tracked: ReadonlyArray<TrackedFile>;
}>;

/**
 * Module-scoped cache. Survives across every `resolveCascade` invocation
 * within one Node process; each test file gets a fresh cache because
 * Vitest isolates module graphs per file by default. Key shape:
 * `` `${contentRoot}\0${absDir}` `` with null-byte separator so a path
 * segment containing a literal ASCII "0" cannot accidentally alias two
 * distinct (contentRoot, absDir) pairs.
 *
 * @remarks Each entry carries a snapshot of the tracked files (their
 * absolute paths + mtimes) observed during the walk that produced the
 * entry. The Revalidate phase re-walks the current ancestry and
 * compares; any divergence (set shape or any mtime) invalidates.
 *
 * @remarks Sanctioned exception to DEV.md "no mutable closures" rule —
 * see DOCS.md §Structural constraints "Module-scoped cache."
 */
const cache = new Map<string, CacheEntry>();

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

	// 1. Walk — always, so Revalidate has the current tracked set to compare.
	const tracked = walkCascade(normalizedAbsDir, normalizedContentRoot);

	// 2. Revalidate — on a cache hit with an unchanged tracked set (same
	//    paths AND same mtimes), return the cached config directly.
	const cached = cache.get(cacheKey);
	if (cached !== undefined && isTrackedUnchanged(cached.tracked, tracked)) {
		return cached.config;
	}

	// 3. Merge — fold each tracked file's contributions onto DEFAULTS.
	let merged: ResolvedConfig = DEFAULTS;
	for (const { path: configPath } of tracked) {
		merged = foldFile(merged, readLensesFile(configPath));
	}

	// 4. Freeze + 5. Store — freeze the fresh structure and cache it
	//    alongside the tracked-set snapshot for the next Revalidate.
	const config = freezeInPlace(merged);
	cache.set(cacheKey, { config, tracked });
	return config;
}

/**
 * Compares two tracked-file snapshots for structural equality — same
 * ordered path sequence AND matching mtimes per entry. A mismatch
 * means the cascade has diverged from the cached state since the last
 * compute and the cached config must not be reused.
 */
function isTrackedUnchanged(
	before: ReadonlyArray<TrackedFile>,
	now: ReadonlyArray<TrackedFile>,
): boolean {
	if (before.length !== now.length) return false;
	return before.every(
		(entry, index) =>
			entry.path === now[index]?.path &&
			entry.mtime === now[index]?.mtime,
	);
}

/**
 * Enumerates the absolute paths of `lenses.json` files from `contentRoot`
 * down to `absDir`, inclusive at both ends, pairing each with the
 * mtime observed at walk time. Missing files are skipped silently.
 * Order is root-first so the caller can fold left-to-right with
 * child-overrides-parent semantics.
 *
 * @remarks Uses `fs.statSync(p, { throwIfNoEntry: false })` — one stat
 * per candidate path instead of existsSync+stat — so the walker can
 * capture mtimes in the same pass it enumerates existence. Node 15.3+.
 */
function walkCascade(
	absDir: string,
	contentRoot: string,
): ReadonlyArray<TrackedFile> {
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
	const tracked: Array<TrackedFile> = [];
	for (const dir of ancestors) {
		const candidate = path.join(dir, 'lenses.json');
		const stat = fs.statSync(candidate, { throwIfNoEntry: false });
		if (stat !== undefined) {
			tracked.push({ path: candidate, mtime: stat.mtimeMs });
		}
	}
	return tracked;
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
