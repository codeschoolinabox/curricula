/**
 * @file Per-instance lens cache for the study-lenses orchestrator.
 *
 * `createLensCache` returns a dumb container keyed by
 * `(lens-name, config-hash)` that stores live `LensMount` handles.
 * Content is NOT part of the key — the cache does not churn on
 * snippet changes (DOCS.md §3).
 *
 * @remarks
 * - Keys collapse by-value: calling `set('editor', { a: 1, b: 2 }, …)`
 *   then `set('editor', { b: 2, a: 1 }, …)` replaces the same entry,
 *   because the hash sorts top-level keys before stringifying.
 *   `LensConfig` is flat (`Readonly<Record<string, SerializableValue>>`
 *   where `SerializableValue` is primitive-or-primitive-array), so
 *   top-level sort is sufficient.
 * - The cache is a pure container. **Disposal is the caller's
 *   responsibility** — `set` with a colliding key silently replaces
 *   the prior entry WITHOUT calling its `dispose()`; `delete` and
 *   `clear` do not dispose either. Callers that care about cleanup
 *   (e.g. orchestrator unmount, Reset All) iterate via `forEach` and
 *   call `dispose()` themselves before removing entries.
 * - `visit(callback)` exists so the orchestrator can implement the
 *   IoC hook on external snippet changes: walk every cached mount
 *   and invoke `onSnippetChanged(newSnippet)` when the mount
 *   declares it (DOCS.md §3, 5a). Iteration order is **insertion
 *   order** (first `set` = first visited; overwrites retain the
 *   original slot). Named `visit` rather than `forEach` to avoid
 *   clashing with array-method linting on a non-array handle.
 */

import { freezeInPlace } from '@utils/freeze.js';

import type { LensConfig, LensMount } from './types.js';

type LensCacheEntry = {
	readonly name: string;
	readonly config: LensConfig;
	readonly mount: LensMount;
};

type LensCache = {
	readonly get: (name: string, config: LensConfig) => LensMount | undefined;
	readonly set: (name: string, config: LensConfig, mount: LensMount) => void;
	readonly has: (name: string, config: LensConfig) => boolean;
	readonly delete: (name: string, config: LensConfig) => void;
	readonly visit: (callback: (entry: LensCacheEntry) => void) => void;
	readonly clear: () => void;
};

function hashKey(name: string, config: LensConfig): string {
	// Array#toSorted is ES2023; tsconfig lib target is ES2022 → use Array#sort.
	// Object.keys() returns a fresh array, so in-place sort is safe.
	// eslint-disable-next-line unicorn/no-array-sort -- see above
	const sortedKeys = Object.keys(config).sort((a, b) => a.localeCompare(b));
	const sorted: Record<string, LensConfig[string]> = {};
	for (const key of sortedKeys) {
		sorted[key] = config[key];
	}
	return JSON.stringify([name, sorted]);
}

/**
 * Creates a new, empty per-instance lens cache.
 *
 * @returns A frozen `LensCache` handle. Populate lazily as the
 *   orchestrator resolves lenses; inspect via `visit` for
 *   cross-cutting operations (IoC snippet push); clear at unmount
 *   after dispose-iterate.
 */
function createLensCache(): LensCache {
	const entries = new Map<string, LensCacheEntry>();

	function get(name: string, config: LensConfig): LensMount | undefined {
		return entries.get(hashKey(name, config))?.mount;
	}

	function set(name: string, config: LensConfig, mount: LensMount): void {
		entries.set(hashKey(name, config), { name, config, mount });
	}

	function has(name: string, config: LensConfig): boolean {
		return entries.has(hashKey(name, config));
	}

	function deleteEntry(name: string, config: LensConfig): void {
		entries.delete(hashKey(name, config));
	}

	function visit(callback: (entry: LensCacheEntry) => void): void {
		for (const entry of entries.values()) {
			callback(entry);
		}
	}

	function clear(): void {
		entries.clear();
	}

	return freezeInPlace({
		get,
		set,
		has,
		delete: deleteEntry,
		visit,
		clear,
	});
}

export default createLensCache;
