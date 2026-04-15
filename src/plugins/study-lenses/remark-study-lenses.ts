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

import path from 'node:path';

import type { Root } from 'mdast';
import type { VFile } from 'vfile';

import type { RemarkPluginOptions } from './types.js';

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

	return function remarkStudyLenses(_tree, file) {
		// 1. Guard — no path means a partial or synthetic MDX compile.
		if (file.path === undefined || file.path === '') return;
		// 1. Guard — file outside the configured content root.
		const normalizedFilePath = path.resolve(file.path);
		if (!isUnder(normalizedFilePath, normalizedContentRoot)) return;
		// TODO(D.3+): resolve + transform + embed siblings.
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

export default createRemarkStudyLenses;
