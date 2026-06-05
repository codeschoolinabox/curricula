/**
 * @file Factory for Docusaurus's `sidebarItemsGenerator` plugin option.
 *
 * Wraps the default generator: invokes it first to get the expanded
 * sidebar-item subtree, then walks the result and rewrites category
 * labels whose current label starts with any of the configured
 * `exerciseSetPrefixes`. Non-matching categories, doc items, link
 * items — all pass through untouched.
 *
 * Transform rule per category label matching a prefix:
 *
 *   1. Strip the matching prefix (e.g. `sl-`).
 *   2. Strip a leading `NN-` / `NNN-` numeric ordering, if present.
 *   3. Split remaining on `-`, Title-Case each segment, join with space.
 *   4. If the result is empty (basename was exactly `"sl-"` or
 *      `"sl-01-"`), fall back to the ORIGINAL label and emit one
 *      `console.warn` naming the directory. (Plan permits `console.warn`
 *      as the simpler alternative to `@docusaurus/logger`; revisit if
 *      integration needs proper log-level filtering.)
 *
 * Precedence note: when multiple configured prefixes could match
 * ("sl-", "sl-0" both present), cascade-concatenation order wins
 * (root-first). First match consumed.
 */

import prettifyDirName from './prettify-dir-name.js';
import resolveCascade from './resolve-cascade.js';
import type { ResolvedConfig, SidebarGeneratorOptions } from './types.js';

/**
 * Returned shape matches Docusaurus's `SidebarItemsGeneratorOption`.
 * Not typed with the Docusaurus `SidebarItemsGenerator` directly to
 * avoid tight coupling to a specific minor version's type exports.
 */
type StudySidebarGenerator = (arguments_: {
	readonly defaultSidebarItemsGenerator: (
		arguments_: unknown,
	) => Promise<ReadonlyArray<unknown>>;
	readonly [k: string]: unknown;
}) => Promise<ReadonlyArray<unknown>>;

type SidebarItemLike = Readonly<{
	readonly type?: string;
	readonly label?: string;
	readonly items?: ReadonlyArray<unknown>;
	readonly [k: string]: unknown;
}>;

function createStudySidebarGenerator(
	options: SidebarGeneratorOptions,
): StudySidebarGenerator {
	const config: ResolvedConfig =
		'resolvedConfig' in options
			? options.resolvedConfig
			: resolveCascade(options.contentRoot, {
					contentRoot: options.contentRoot,
				});

	return async function studySidebarGenerator(arguments_) {
		const items = await arguments_.defaultSidebarItemsGenerator(arguments_);
		if (config.exerciseSetPrefixes.length === 0) return items;
		return transformItems(items, config.exerciseSetPrefixes);
	};
}

/**
 * Recursively walks the sidebar-item tree. For each `category` item
 * whose label still starts with a configured prefix, rewrites the
 * label per the Transform rule above. Non-category items (`doc`,
 * `link`, etc.) and non-matching categories pass through — but
 * children of categories are always recursed, so a non-matching
 * parent can still have matching descendants.
 */
function transformItems(
	items: ReadonlyArray<unknown>,
	prefixes: ReadonlyArray<string>,
): ReadonlyArray<unknown> {
	return items.map((item) => rewriteCategoryItem(item));

	function rewriteCategoryItem(item: unknown): unknown {
		if (typeof item !== 'object' || item === null) return item;
		const index = item as SidebarItemLike;
		if (index.type !== 'category') return item;
		const rewrittenChildren =
			index.items === undefined ? index.items : transformItems(index.items, prefixes);
		const rewrittenLabel = transformLabel(index.label ?? '', prefixes);
		return { ...index, label: rewrittenLabel, items: rewrittenChildren };
	}
}

/**
 * Delegates to the shared prettifyDirName helper for the
 * prefix-strip / numeric-strip / Title-Case-kebab pipeline.
 * Returns the original label unchanged if no prefix matches.
 */
function transformLabel(
	label: string,
	prefixes: ReadonlyArray<string>,
): string {
	// The sidebar generator only transforms labels that match a
	// configured prefix — non-matching labels pass through unchanged.
	// prettifyDirName also title-cases non-matching names, which the
	// sidebar should NOT do (Docusaurus's default naming applies there).
	const hasMatchingPrefix = prefixes.some(
		(p) => p !== '' && label.startsWith(p),
	);
	if (!hasMatchingPrefix) return label;
	return prettifyDirName(label, prefixes);
}

export default createStudySidebarGenerator;
