/**
 * @file Cascade resolver — reads and merges `lenses.json` files.
 *
 * Walks the directory ancestry from a given target directory up to
 * (and including) the content root, collecting every `lenses.json`
 * file it encounters. Folds the collection root-first into a single
 * deep-frozen `ResolvedConfig`. Caches results keyed by
 * `(contentRoot, absDir)` with timestamp-based invalidation.
 *
 * @remarks The cache lives at module scope — it must survive across
 * every remark-plugin invocation within one build and across every
 * dev-server rebuild within one process. See {@link ../DOCS.md}
 * "Module-scoped cache" structural constraint for the rationale.
 */

import DEFAULTS from './defaults.js';

import type { ResolvedConfig } from './types.js';

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
	_absDir: string,
	_options: { readonly contentRoot: string } = { contentRoot: '' },
): ResolvedConfig {
	// TODO(A.2): Fake It — returns DEFAULTS unconditionally; A.2 triangulates.
	return DEFAULTS;
}

export default resolveCascade;
