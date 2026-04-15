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

import resolveCascade from './resolve-cascade.js';

import type { ResolvedConfig, SidebarGeneratorOptions } from './types.js';

/**
 * Returned shape matches Docusaurus's `SidebarItemsGeneratorOption`.
 * Not typed with the Docusaurus `SidebarItemsGenerator` directly to
 * avoid tight coupling to a specific minor version's type exports.
 */
type StudySidebarGenerator = (args: {
	readonly defaultSidebarItemsGenerator: (
		args: unknown,
	) => Promise<ReadonlyArray<unknown>>;
	readonly [k: string]: unknown;
}) => Promise<ReadonlyArray<unknown>>;

type SidebarItemLike = Readonly<{
	type?: string;
	label?: string;
	items?: ReadonlyArray<unknown>;
	[k: string]: unknown;
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

	return async function studySidebarGenerator(args) {
		const items = await args.defaultSidebarItemsGenerator(args);
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
	return items.map((item) => {
		if (typeof item !== 'object' || item === null) return item;
		const i = item as SidebarItemLike;
		if (i.type !== 'category') return item;
		const rewrittenChildren =
			i.items !== undefined ? transformItems(i.items, prefixes) : i.items;
		const rewrittenLabel = transformLabel(i.label ?? '', prefixes);
		return { ...i, label: rewrittenLabel, items: rewrittenChildren };
	});
}

/**
 * Applies the prefix-strip / numeric-strip / Title-Case-kebab pipeline.
 * Returns the original label unchanged if no prefix matches OR if the
 * transform would produce an empty string (in which case it warns once).
 */
function transformLabel(
	label: string,
	prefixes: ReadonlyArray<string>,
): string {
	for (const prefix of prefixes) {
		if (prefix === '') continue;
		if (!label.startsWith(prefix)) continue;
		const afterPrefix = label.slice(prefix.length);
		const afterNumeric = afterPrefix.replace(/^\d+-/, '');
		if (afterNumeric === '') {
			console.warn(
				`study-lenses: empty residue after stripping prefix "${prefix}" from "${label}"; falling back to original label`,
			);
			return label;
		}
		return toTitleCase(afterNumeric);
	}
	return label;
}

/**
 * Converts a kebab-case string to Title Case: `while-loops` → `"While Loops"`.
 */
function toTitleCase(s: string): string {
	return s
		.split('-')
		.map((seg) => (seg === '' ? seg : seg[0]!.toUpperCase() + seg.slice(1)))
		.join(' ');
}

export default createStudySidebarGenerator;
