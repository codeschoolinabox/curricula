/**
 * @file Remark plugin factory — the orchestrator that composes the
 * cascade resolver, code-block transform, and sibling walker into the
 * end-to-end pipeline Docusaurus calls for every `.md` / `.mdx` file.
 *
 * Five phases per {@link ./DOCS.md} §Remark transformer:
 *   1. Guard         — skip when no path or outside content root.
 *   2. Resolve       — pull `ResolvedConfig` from the cascade resolver.
 *   3. Transform     — walk `code` nodes; emit `mdxJsxFlowElement` via
 *                      `codeBlockToJsx` when their language is configured.
 *   4. Embed siblings — for `index.md` (or `README.md` when alone),
 *                       append per-block StudyLenses nodes (bottom mode)
 *                       or a Docusaurus `<Tabs>` tree (tabs mode).
 *   5. (Heading)     — optional section-heading node appended before
 *                      the embed block when configured.
 */

import fs from 'node:fs';
import path from 'node:path';

import type { Code, Root } from 'mdast';
import type { VFile } from 'vfile';

import deepMerge from '../../lib/utils/deep-merge.js';

import codeBlockToJsx from './code-block-to-jsx.js';
import type { StudyLensesJsxNode } from './code-block-to-jsx.js';
import discoverSiblings from './discover-siblings.js';
import prettifyDirName from './prettify-dir-name.js';
import resolveCascade from './resolve-cascade.js';
import type { RemarkPluginOptions, ResolvedConfig, Sibling } from './types.js';

type Transformer = (tree: Root, file: VFile) => void;

/**
 * Builds a remark transformer bound to a specific docs instance's
 * content root.
 *
 * @param options - `contentRoot` scopes both file-path filtering (the
 *   transformer skips files outside) and the cascade resolver's walk
 *   bounds. Absolute path required — throws if empty at factory time.
 * @returns A transformer function Docusaurus registers in
 *   `beforeDefaultRemarkPlugins` for each docs-instance plugin.
 */
function createRemarkStudyLenses(options: RemarkPluginOptions): Transformer {
	if (options.contentRoot === '') {
		throw new Error('createRemarkStudyLenses: contentRoot is required');
	}
	const normalizedContentRoot = path.resolve(options.contentRoot);

	return function remarkStudyLenses(tree, file) {
		// 1. Guard — no path means a partial or synthetic MDX compile.
		if (file.path === undefined || file.path === '') return;
		const normalizedFilePath = path.resolve(file.path);
		if (!isUnder(normalizedFilePath, normalizedContentRoot)) return;

		// 2. Resolve — pull the effective config for this file's directory.
		const config = resolveCascade(path.dirname(normalizedFilePath), {
			contentRoot: normalizedContentRoot,
		});

		// 2b. Read per-file frontmatter override (Docusaurus pre-populates
		//     vfile.data.frontMatter before beforeDefaultRemarkPlugins runs).
		const frontMatter = (file.data.frontMatter ?? {}) as Record<
			string,
			unknown
		>;
		const frontmatterDefaultLens =
			typeof frontMatter.defaultLens === 'string'
				? frontMatter.defaultLens
				: undefined;

		// 3. Transform — rewrite fences whose language is configured.
		for (let index = 0; index < tree.children.length; index++) {
			const node = tree.children[index];
			if (node?.type !== 'code') continue;
			const jsx = transformFence(node, config, frontmatterDefaultLens);
			if (jsx !== undefined) (tree.children as ReadonlyArray<unknown>)[index] = jsx;
		}

		// 4. Embed siblings — only for sibling-bearing pages.
		if (!isSiblingBearingPageFile(normalizedFilePath)) return;
		if (config.embedSiblings.mode === 'off') return;
		const siblings = discoverSiblings(path.dirname(normalizedFilePath), config);
		if (siblings.length === 0) return;
		const groups = groupSiblings(siblings);
		for (const group of groups) {
			// Root group: depth-2 heading from sectionHeading config.
			if (group.groupKey === '') {
				if (config.embedSiblings.sectionHeading !== null) {
					tree.children.push({
						type: 'heading',
						depth: 2,
						children: [
							{
								type: 'text',
								value: config.embedSiblings.sectionHeading,
							},
						],
					});
				}
			} else {
				// Subdirectory group: depth-3 heading from prettified dirname.
				const heading = prettifyDirName(
					group.groupKey,
					config.exerciseSetPrefixes,
				);
				tree.children.push({
					type: 'heading',
					depth: 3,
					children: [{ type: 'text', value: heading }],
				});
			}
			if (config.embedSiblings.mode === 'tabs') {
				appendTabsEmbed(tree, group.members, group.groupKey, config);
			} else {
				appendBottomEmbed(tree, group.members, config);
			}
		}
	};
}

/**
 * Returns true when `child` is `ancestor` itself or any descendant.
 * Uses `path.relative` so trailing-slash / double-separator variants
 * compare correctly.
 */
function isUnder(child: string, ancestor: string): boolean {
	const rel = path.relative(ancestor, child);
	return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/**
 * Decides whether THIS file is the sibling-bearing page for its
 * directory, using the precedence rule from DOCS.md §Sibling-bearing-
 * page precedence:
 *   - `index.md` always qualifies
 *   - `README.md` qualifies only when no `index.md` exists in the
 *     same directory
 *   - any other basename does not
 *
 * This is file-level; contrast with `discover-siblings`'s dir-level
 * `isSiblingBearingPageDir`, which asks "does this dir mark a page
 * boundary during descent" (presence of EITHER marker).
 */
function isSiblingBearingPageFile(absFilePath: string): boolean {
	const basename = path.basename(absFilePath);
	if (basename === 'index.md') return true;
	if (basename !== 'README.md') return false;
	return !fs.existsSync(path.join(path.dirname(absFilePath), 'index.md'));
}

/**
 * Groups siblings by first path segment of their label. Root-level
 * files (no `/` in label) land in the `""` group. Empty groups are
 * filtered out (a subdirectory whose files all failed the configured-
 * languages filter would produce an empty group; emitting `<Tabs>`
 * with zero children crashes Docusaurus).
 */
function groupSiblings(
	siblings: ReadonlyArray<Sibling>,
): ReadonlyArray<{ readonly groupKey: string; readonly members: ReadonlyArray<Sibling> }> {
	const map = new Map<string, readonly Sibling[]>();
	for (const s of siblings) {
		const slashIndex = s.label.indexOf('/');
		const key = slashIndex === -1 ? '' : s.label.slice(0, slashIndex);
		const array = map.get(key);
		if (array === undefined) {map.set(key, [s]);}
		else {array.push(s);}
	}
	const groups: ReadonlyArray<{ readonly groupKey: string; readonly members: ReadonlyArray<Sibling> }> =
		[];
	// Root group first (if it exists and is non-empty).
	const root = map.get('');
	if (root !== undefined && root.length > 0) {
		groups.push({ groupKey: '', members: root });
	}
	// Subdirectory groups in alphabetical order by key.
	const sortedKeys = [...map.keys()]
		.filter((k) => k !== '')
		.sort((a, b) => a.localeCompare(b));
	for (const key of sortedKeys) {
		const members = map.get(key)!;
		if (members.length > 0) groups.push({ groupKey: key, members });
	}
	return groups;
}

/**
 * Appends one `mdxJsxFlowElement` `<StudyLenses>` node per sibling to the
 * tree's children. Uses `codeBlockToJsx` so `rehype-raw` preserves the
 * PascalCase component name (see `code-block-to-jsx.ts` for the rationale).
 */
function appendBottomEmbed(
	tree: Root,
	siblings: ReadonlyArray<Sibling>,
	config: ResolvedConfig,
): void {
	for (const sibling of siblings) {
		const codeNode: Code = {
			type: 'code',
			lang: sibling.lang,
			value: sibling.code,
			meta: null,
		};
		const configs = mergeOverrideIntoCascade(
			config,
			sibling.lens,
			sibling.lensConfig,
		);
		const jsx = codeBlockToJsx(codeNode, {
			lens: sibling.lens,
			configs,
		});
		(tree.children as ReadonlyArray<unknown>).push(jsx);
	}
}

/**
 * Appends a single `<Tabs>` `mdxJsxFlowElement` to the tree. Its
 * children are one `<TabItem>` per sibling (in the walker's
 * alphabetical-by-label order). Each `<TabItem>` carries `value` and
 * `label` attributes matching the sibling's label, and contains
 * exactly one `mdxJsxFlowElement` `<StudyLenses>` child produced by
 * `codeBlockToJsx` — same emission path as in-page fences and
 * bottom-mode embeds.
 *
 * The plugin emits `<Tabs>` / `<TabItem>` / `<StudyLenses>` as
 * `mdxJsxFlowElement` nodes; `rehype-raw` preserves them via its
 * passThrough list. The swizzled `MDXComponents` imports `Tabs` +
 * `TabItem` from `@theme/` (they're not in the default registry).
 */
function appendTabsEmbed(
	tree: Root,
	siblings: ReadonlyArray<Sibling>,
	groupKey: string,
	config: ResolvedConfig,
): void {
	const tabItems = siblings.map((sibling) => {
		// Within a group, labels are relative to the group — strip the
		// `groupKey/` prefix so tabs read `01-declare`, not
		// `sl-01-variables/01-declare`.
		const tabLabel =
			groupKey === ''
				? sibling.label
				: sibling.label.slice(groupKey.length + 1);
		const inner: Code = {
			type: 'code',
			lang: sibling.lang,
			value: sibling.code,
			meta: null,
		};
		const configs = mergeOverrideIntoCascade(
			config,
			sibling.lens,
			sibling.lensConfig,
		);
		const innerJsx = codeBlockToJsx(inner, {
			lens: sibling.lens,
			configs,
		});
		return {
			type: 'mdxJsxFlowElement' as const,
			name: 'TabItem',
			attributes: [
				{
					type: 'mdxJsxAttribute' as const,
					name: 'value',
					value: tabLabel,
				},
				{
					type: 'mdxJsxAttribute' as const,
					name: 'label',
					value: tabLabel,
				},
			],
			children: [innerJsx],
		};
	});

	const tabs = {
		type: 'mdxJsxFlowElement' as const,
		name: 'Tabs',
		attributes: [],
		children: tabItems,
	};

	// Cast: the `mdxJsxFlowElement` node type is provided by mdast-util-mdx-jsx
	// (the MDX MDAST extension). Docusaurus's processor allows these via
	// `rehype-raw`'s passThrough list in .md mode and natively in .mdx mode.
	(tree.children as ReadonlyArray<unknown>).push(tabs);
}

/**
 * Returns a structurally-fresh `ResolvedConfig` whose `lenses[lensName]`
 * entry is the deep-merge of the cascade's existing entry (base) over
 * the supplied `override` (wins on conflict). When neither side
 * contributes a `lensName` entry the cascade ships unchanged. The
 * resolver's deep-frozen `ResolvedConfig` is NEVER mutated — only the
 * `lenses` subtree is cloned (other top-level keys reference the
 * frozen subtrees by-reference; they are immutable).
 *
 * The result rides as the whole-cascade `configs` attribute on the
 * emitted `<StudyLenses>` JSX (the 3-prop reshape: per-fence/sibling
 * override is folded INTO `configs.lenses[lens]` at emission time, no
 * separate `config` prop).
 */
function mergeOverrideIntoCascade(
	config: ResolvedConfig,
	lensName: string | undefined,
	override: Readonly<Record<string, unknown>> | undefined,
): ResolvedConfig {
	if (lensName === undefined || override === undefined) return config;
	const cascadeEntry = config.lenses[lensName];
	const mergedEntry =
		cascadeEntry === undefined ? override : deepMerge(cascadeEntry, override);
	return {
		...config,
		lenses: {
			...config.lenses,
			[lensName]: mergedEntry,
		},
	};
}

/**
 * Rewrites one fenced-code-block MDAST node if its language is
 * configured in `config.defaults`. Unconfigured-language fences are
 * left alone (configured-languages rule).
 *
 * Lens resolution precedence (most-specific wins, populates the
 * emitted `lens` attribute):
 *   fence `:suffix` (URL-style lens name)  >  frontmatterDefaultLens  >  none
 *
 * Cascade `defaults[lang]` ONLY gates whether the fence transforms;
 * it does NOT populate `lens` (per AR-1 locked decision 1; the
 * cascade-supplied default seam is L2-deferred — at F1+B a bare fence
 * with no resolved lens emits no `lens` prop and the orchestrator
 * mounts the editor home base).
 *
 * Suffix parsing (URL-style):
 *   <lensName>[?<key>[=<value>]( &<key>[=<value>] )*]
 *
 *   - empty `lensName` (e.g. `js:` or `js:?key=value`) → fence
 *     left untransformed (malformed).
 *   - `lensName` populates the emitted `lens` attribute.
 *   - query (when present) parses to a record of URL-semantic
 *     values: string for `key=value`, array of strings for
 *     `key=v1,v2,…`, boolean `true` for `key` (no `=`), empty string
 *     for `key=` (empty value). No numeric coercion at parse time —
 *     lenses coerce at config-read time.
 *   - parsed query is deep-merged INTO `cascade.lenses[lensName]`
 *     via `mergeOverrideIntoCascade`; the result rides inside the
 *     whole-cascade `configs` attribute (3-prop reshape — no separate
 *     `config` prop).
 */
function transformFence(
	node: Code,
	config: ReturnType<typeof resolveCascade>,
	frontmatterDefaultLens: string | undefined,
): StudyLensesJsxNode | undefined {
	const info = node.lang;
	if (info === null || info === undefined) return;

	const colonIndex = info.indexOf(':');
	const lang = colonIndex === -1 ? info : info.slice(0, colonIndex);
	const suffix = colonIndex === -1 ? undefined : info.slice(colonIndex + 1);
	if (lang === '') return;

	if (config.defaults[lang] === undefined) return; // configured-languages rule

	let lens: string | undefined;
	let parsedQuery: Readonly<Record<string, unknown>> | undefined;

	if (suffix === undefined) {
		// Bare fence (no `:suffix`): only frontmatter populates `lens`.
		// Cascade `defaults[lang]` does NOT populate it (locked decision 1).
		lens = frontmatterDefaultLens;
	} else {
		const queryIndex = suffix.indexOf('?');
		const lensName = queryIndex === -1 ? suffix : suffix.slice(0, queryIndex);
		if (lensName === '') return; // malformed: empty lens name
		lens = lensName;
		if (queryIndex !== -1) {
			const queryString = suffix.slice(queryIndex + 1);
			if (queryString !== '') {
				const parsed = parseFenceQuery(queryString);
				// Skip vacuous queries (e.g. `?&` or `?&&`) so
				// `configs.lenses[lens]` isn't overlaid with an empty
				// merge (which would be a no-op but produces noise).
				if (Object.keys(parsed).length > 0) parsedQuery = parsed;
			}
		}
	}

	const configs = mergeOverrideIntoCascade(config, lens, parsedQuery);
	// `exactOptionalPropertyTypes`: build the params via conditional
	// spread so undefined keys are omitted entirely rather than passed
	// as `key: undefined`.
	return codeBlockToJsx(node, {
		...(lens === undefined ? {} : { lens }),
		configs,
	});
}

/**
 * Parses a URL-style query string into a flat record of values. Each
 * key/value pair is separated by `&`. Values follow URL-semantic
 * conventions:
 *   - `key=value` → string `"value"`
 *   - `key=v1,v2,v3` → array of strings `["v1","v2","v3"]`
 *   - `key` (no `=`) → boolean `true`
 *   - `key=` (empty value) → empty string `""`
 *
 * No numeric coercion happens at parse time — every value is a string,
 * an array of strings, or a boolean. Lenses coerce at config-read time.
 *
 * @remarks
 * - **Duplicate keys.** `?a=1&a=2` → `{a:"2"}`. The `&`-split is
 *   iterated left-to-right and each subsequent assignment to the
 *   same key overwrites the previous value — last occurrence wins.
 *   No multi-value accumulation; the result is a flat record.
 *   Mechanically equivalent to
 *   `Object.fromEntries(new URLSearchParams(queryStr))` for
 *   ASCII-safe keys (with the caveat that `URLSearchParams`
 *   percent-decodes its inputs, which this parser does not — fence
 *   queries are not URL-encoded).
 * - **Empty segments.** `?a=1&&b=2` (repeated `&`) → `{a:"1", b:"2"}`.
 *   The split-and-skip-empty loop quietly drops empty segments. Same
 *   leniency applies to a leading `&` (`?&a=1`) or trailing `&`
 *   (`?a=1&`). This matches lenient URL-parser behavior.
 */
function parseFenceQuery(queryString: string): Readonly<Record<string, unknown>> {
	const out: Record<string, unknown> = {};
	for (const part of queryString.split('&')) {
		if (part === '') continue;
		const eqIndex = part.indexOf('=');
		if (eqIndex === -1) {
			out[part] = true;
			continue;
		}
		const key = part.slice(0, eqIndex);
		const rawValue = part.slice(eqIndex + 1);
		if (rawValue.includes(',')) {
			out[key] = rawValue.split(',');
		} else {
			out[key] = rawValue;
		}
	}
	return out;
}

export default createRemarkStudyLenses;
