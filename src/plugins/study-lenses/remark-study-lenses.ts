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
 *                       append per-block StudyLens nodes (bottom mode)
 *                       or a Docusaurus `<Tabs>` tree (tabs mode).
 *   5. (Heading)     — optional section-heading node appended before
 *                      the embed block when configured.
 */

import fs from 'node:fs';
import path from 'node:path';

import deepMerge from '../../lib/utils/deep-merge.js';

import codeBlockToJsx from './code-block-to-jsx.js';
import discoverSiblings from './discover-siblings.js';
import prettifyDirName from './prettify-dir-name.js';
import resolveCascade from './resolve-cascade.js';

import type { Code, Root } from 'mdast';
import type { VFile } from 'vfile';

import type { StudyLensJsxNode } from './code-block-to-jsx.js';
import type { ResolvedConfig, RemarkPluginOptions, Sibling } from './types.js';

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
function createRemarkStudyLenses(
	options: RemarkPluginOptions,
): Transformer {
	if (options.contentRoot === '') {
		throw new Error(
			'createRemarkStudyLenses: contentRoot is required',
		);
	}
	const normalizedContentRoot = path.resolve(options.contentRoot);

	return function remarkStudyLenses(tree, file) {
		// 1. Guard — no path means a partial or synthetic MDX compile.
		if (file.path === undefined || file.path === '') return;
		const normalizedFilePath = path.resolve(file.path);
		if (!isUnder(normalizedFilePath, normalizedContentRoot)) return;

		// 2. Resolve — pull the effective config for this file's directory.
		const config = resolveCascade(
			path.dirname(normalizedFilePath),
			{ contentRoot: normalizedContentRoot },
		);

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
		for (let i = 0; i < tree.children.length; i++) {
			const node = tree.children[i];
			if (node === undefined || node.type !== 'code') continue;
			const jsx = transformFence(node, config, frontmatterDefaultLens);
			if (jsx !== undefined) (tree.children as Array<unknown>)[i] = jsx;
		}

		// 4. Embed siblings — only for sibling-bearing pages.
		if (!isSiblingBearingPageFile(normalizedFilePath)) return;
		if (config.embedSiblings.mode === 'off') return;
		const siblings = discoverSiblings(
			path.dirname(normalizedFilePath),
			config,
		);
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
): ReadonlyArray<{ groupKey: string; members: ReadonlyArray<Sibling> }> {
	const map = new Map<string, Sibling[]>();
	for (const s of siblings) {
		const slashIdx = s.label.indexOf('/');
		const key = slashIdx === -1 ? '' : s.label.slice(0, slashIdx);
		const arr = map.get(key);
		if (arr !== undefined) arr.push(s);
		else map.set(key, [s]);
	}
	const groups: Array<{ groupKey: string; members: ReadonlyArray<Sibling> }> =
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
 * Appends one `mdxJsxFlowElement` `<StudyLens>` node per sibling to the
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
		const lensConfig = resolveEmittedLensConfig(config, sibling);
		const jsx = codeBlockToJsx(
			codeNode,
			lensConfig === undefined
				? { lens: sibling.lens, lang: sibling.lang }
				: { lens: sibling.lens, lang: sibling.lang, lensConfig },
		);
		(tree.children as Array<unknown>).push(jsx);
	}
}

/**
 * Appends a single `<Tabs>` `mdxJsxFlowElement` to the tree. Its
 * children are one `<TabItem>` per sibling (in the walker's
 * alphabetical-by-label order). Each `<TabItem>` carries `value` and
 * `label` attributes matching the sibling's label, and contains
 * exactly one `mdxJsxFlowElement` `<StudyLens>` child produced by
 * `codeBlockToJsx` — same emission path as in-page fences and
 * bottom-mode embeds.
 *
 * The plugin emits `<Tabs>` / `<TabItem>` / `<StudyLens>` as
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
		const lensConfig = resolveEmittedLensConfig(config, sibling);
		const innerJsx = codeBlockToJsx(
			inner,
			lensConfig === undefined
				? { lens: sibling.lens, lang: sibling.lang }
				: { lens: sibling.lens, lang: sibling.lang, lensConfig },
		);
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
	(tree.children as Array<unknown>).push(tabs);
}

/**
 * Deep-merges the directive's raw `lensConfig` (on the `Sibling`) over
 * the cascade's `lenses[lens]`. Returns `undefined` when both sides are
 * empty so the downstream `codeBlockToJsx` omits the `config` attribute.
 */
function resolveEmittedLensConfig(
	config: ResolvedConfig,
	sibling: Sibling,
): Readonly<Record<string, unknown>> | undefined {
	const cascade = config.lenses[sibling.lens];
	const directive = sibling.lensConfig;
	if (cascade === undefined && directive === undefined) return undefined;
	if (directive === undefined) return cascade;
	if (cascade === undefined) return directive;
	return deepMerge(cascade, directive);
}

/**
 * Rewrites one fenced-code-block MDAST node if its language is
 * configured in `config.defaults`. Unconfigured-language fences are
 * left alone (configured-languages rule).
 *
 * Lens resolution precedence (most-specific wins):
 *   fence `:suffix`   >   frontmatterDefaultLens   >   cascade `defaults[lang]`
 *
 * The configured-languages gate fires at the outermost layer: the
 * fence's `lang` must be present in `config.defaults` for transformation
 * to happen AT ALL — frontmatter does not lift unconfigured languages.
 */
function transformFence(
	node: Code,
	config: ReturnType<typeof resolveCascade>,
	frontmatterDefaultLens: string | undefined,
): StudyLensJsxNode | undefined {
	const info = node.lang;
	if (info === null || info === undefined) return;

	const [lang, suffix] = info.split(':', 2);
	if (lang === undefined || lang === '') return;

	const cascadeDefaultLens = config.defaults[lang];
	if (cascadeDefaultLens === undefined) return; // configured-languages rule

	const lens = suffix ?? frontmatterDefaultLens ?? cascadeDefaultLens;
	const lensConfig = config.lenses[lens];
	return codeBlockToJsx(node, { lens, lang, lensConfig });
}

export default createRemarkStudyLenses;
