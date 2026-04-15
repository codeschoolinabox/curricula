/**
 * @file Docusaurus lifecycle plugin — contributes watched-path globs
 * so the dev server recompiles MDX when `lenses.json` or sibling `.js`
 * files change.
 *
 * This is a thin shell: no `loadContent`, no `contentLoaded`, no
 * theme components. It exists only to give Docusaurus's file watcher
 * (chokidar) the extra paths it wouldn't otherwise know to watch,
 * since our remark plugin reads files outside Docusaurus's default
 * `.md`/`.mdx` scope.
 */

import path from 'node:path';

import type { LifecyclePluginOptions } from './types.js';

type LoadContext = Readonly<{ siteDir: string }>;

type StudyLensesPlugin = Readonly<{
	name: string;
	getPathsToWatch: () => ReadonlyArray<string>;
}>;

/**
 * Builds the Docusaurus lifecycle plugin.
 *
 * @param context - Docusaurus passes a `LoadContext` with at least
 *   `siteDir` (absolute path). Globs are resolved against this root.
 * @param options - `contentRoots` is the list of docs-instance content
 *   paths (relative to `siteDir`) this plugin should watch.
 */
function createStudyLensesPlugin(
	context: LoadContext,
	options: LifecyclePluginOptions,
): StudyLensesPlugin {
	return {
		name: 'study-lenses',
		getPathsToWatch() {
			return options.contentRoots.flatMap((root) => [
				`${path.resolve(context.siteDir, root)}/**/lenses.json`,
				`${path.resolve(context.siteDir, root)}/**/*.js`,
			]);
		},
	};
}

export default createStudyLensesPlugin;
