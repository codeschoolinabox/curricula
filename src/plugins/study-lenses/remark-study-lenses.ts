/**
 * @file Remark plugin factory — the orchestrator that composes the
 * cascade resolver, code-block transform, and sibling walker into the
 * end-to-end pipeline Docusaurus calls for every `.md` / `.mdx` file.
 *
 * Five phases per {@link ./DOCS.md} §Remark transformer:
 *   1. Guard         — skip when no path or outside content root.
 *   2. Resolve       — pull `ResolvedConfig` from the cascade resolver.
 *   3. Transform     — walk `code` nodes; mutate via `codeBlockToHast`
 *                      when their language is configured.
 *   4. Embed siblings — for `index.md` (or `README.md` when alone),
 *                       append per-block StudyLens nodes (bottom mode)
 *                       or a Docusaurus `<Tabs>` tree (tabs mode).
 *   5. (Heading)     — optional section-heading node appended before
 *                      the embed block when configured.
 */

import fs from 'node:fs';
import path from 'node:path';

import codeBlockToHast from './code-block-to-hast.js';
import discoverSiblings from './discover-siblings.js';
import resolveCascade from './resolve-cascade.js';

import type { Code, Root } from 'mdast';
import type { VFile } from 'vfile';

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

		// 3. Transform — rewrite fences whose language is configured.
		for (const node of tree.children) {
			if (node.type !== 'code') continue;
			transformFence(node, config);
		}

		// 4. Embed siblings — only for sibling-bearing pages.
		if (!isSiblingBearingPageFile(normalizedFilePath)) return;
		if (config.embedSiblings.mode === 'off') return;
		const siblings = discoverSiblings(
			path.dirname(normalizedFilePath),
			config,
		);
		if (siblings.length === 0) return;
		appendBottomEmbed(tree, siblings, config);
		// TODO(D.10): tabs-mode embed.
		// TODO(D.11): section heading above the embed block.
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
 * Appends one hast-shaped `<StudyLens>` node per sibling to the tree's
 * children. Each appended node is a fresh synthetic `code` MDAST node
 * mutated via `codeBlockToHast`, so the same rendering path that
 * handles in-page fences handles embed-bottom siblings.
 */
function appendBottomEmbed(
	tree: Root,
	siblings: ReadonlyArray<Sibling>,
	config: ResolvedConfig,
): void {
	for (const sibling of siblings) {
		const node: Code = {
			type: 'code',
			lang: sibling.lang,
			value: sibling.code,
			meta: null,
		};
		codeBlockToHast(node, {
			lens: sibling.lens,
			lang: sibling.lang,
			lensConfig: config.lenses[sibling.lens],
		});
		tree.children.push(node);
	}
}

/**
 * Rewrites one fenced-code-block MDAST node if its language is
 * configured in `config.defaults`. Unconfigured-language fences are
 * left alone (configured-languages rule). Explicit `:<suffix>` on the
 * info string overrides the default lens for that language.
 */
function transformFence(
	node: Code,
	config: ReturnType<typeof resolveCascade>,
): void {
	const info = node.lang;
	if (info === null || info === undefined) return;

	const [lang, suffix] = info.split(':', 2);
	if (lang === undefined || lang === '') return;

	const defaultLens = config.defaults[lang];
	if (defaultLens === undefined) return; // configured-languages rule

	const lens = suffix ?? defaultLens;
	const lensConfig = config.lenses[lens];
	codeBlockToHast(node, { lens, lang, lensConfig });
}

export default createRemarkStudyLenses;
