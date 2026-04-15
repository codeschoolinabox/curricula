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

import { freezeInPlace } from '../../lib/utils/freeze.js';

import DEFAULTS from './defaults.js';

import type { LensesConfigFile, ResolvedConfig } from './types.js';

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
 *   validate.
 * @param options - `contentRoot` is the absolute path beyond which
 *   the cascade walk stops. Files outside this root are ignored.
 *   **Caller-trusted precondition:** must be an absolute path that
 *   is an ancestor of (or equal to) `absDir`.
 * @returns A deep-frozen `ResolvedConfig`. Repeat calls with the same
 *   inputs and unchanged filesystem state return the same frozen
 *   reference (cache hit).
 * @throws If any `lenses.json` along the cascade is syntactically
 *   invalid JSON. The error message includes the offending file path.
 *   Missing `lenses.json` files are not errors — they are skipped.
 */
function resolveCascade(
	absDir: string,
	{ contentRoot }: { readonly contentRoot: string } = { contentRoot: '' },
): ResolvedConfig {
	// Normalize at the boundary so trailing-slash / relative-segment
	// variants compare equal by string in the walk below.
	const normalizedAbsDir = path.resolve(absDir);
	const normalizedContentRoot = path.resolve(contentRoot);

	// 1. Walk — enumerate lenses.json paths from contentRoot down to absDir.
	const configPaths = walkCascade(normalizedAbsDir, normalizedContentRoot);

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
		lenses: { ...base.lenses, ...(file.lenses ?? {}) },
		exerciseSetPrefixes: [
			...new Set([
				...base.exerciseSetPrefixes,
				...(file.exerciseSetPrefixes ?? []),
			]),
		],
	};
}

export default resolveCascade;
