import path from 'node:path';

import type { Config } from '@docusaurus/types';

import createRemarkStudyLenses from './src/plugins/study-lenses/remark-study-lenses.js';
import createStudyLensesPlugin from './src/plugins/study-lenses/lifecycle-plugin.js';
import createStudySidebarGenerator from './src/plugins/study-lenses/sidebar-generator.js';

// Docusaurus invokes this config from the site root (cwd === siteDir),
// so `path.resolve(relative)` resolves against the correct base. Avoid
// `import.meta.dirname` here — Docusaurus's jiti-based loader for `.ts`
// configs does not support `import.meta`.
function studyLensContentRoot(relative: string): string {
	return path.resolve(relative);
}

const config: Config = {
	title: 'Spir@learn',
	tagline: 'What if best practice was common practice?',
	favicon: 'img/favicon.ico',

	url: 'https://codeschoolinabox.github.io',
	baseUrl: '/spiralearn/',

	organizationName: 'codeschoolinabox',
	projectName: 'spiralearn',

	onBrokenLinks: 'warn',
	onBrokenMarkdownLinks: 'warn',
	onBrokenAnchors: 'warn',

	markdown: {
		format: 'detect', // .md → standard markdown, .mdx → MDX
		hooks: {
			onBrokenMarkdownImages: 'warn',
		},
	},

	i18n: {
		defaultLocale: 'en',
		locales: ['en'],
	},

	plugins: [
		// --- COOP/COEP headers for dev server ---
		// The V2 study-lens Run button spawns a Web Worker that needs
		// cross-origin isolation (SharedArrayBuffer). These headers enable
		// that in the dev server only — they merge into Docusaurus's default
		// devServer.headers object via webpack-merge.
		//
		// Production hosting must set these headers separately (reverse
		// proxy, CDN config, etc.).
		//
		// If cross-origin resources (CDN images, external scripts) break,
		// they need `Cross-Origin-Resource-Policy: cross-origin` on their
		// server or a `crossorigin` attribute on the element.
		//
		// Note: we use devServer.headers (static) rather than
		// setupMiddlewares (function) because webpack-merge replaces
		// functions — it would overwrite Docusaurus's default
		// setupMiddlewares that adds evalSourceMapMiddleware.
		function coopCoepHeadersPlugin() {
			return {
				name: 'coop-coep-headers',
				configureWebpack() {
					return {
						devServer: {
							headers: {
								'Cross-Origin-Opener-Policy': 'same-origin',
								'Cross-Origin-Embedder-Policy': 'require-corp',
							},
						},
					};
				},
			};
		},
		// --- .js → .ts/.tsx extension resolution for webpack ---
		// The `lib/editing/` and `api/` modules use the Node ESM convention
		// of writing `.js` extension specifiers that resolve to `.ts` source
		// files (e.g. `import x from './foo.js'` where the actual file is
		// `foo.ts`). Vite/vitest handle this natively; webpack does not.
		// Now that V2 study-lens components import these modules, they're
		// pulled into the webpack bundle for the first time.
		function extensionAliasPlugin() {
			return {
				name: 'resolve-ts-extension-alias',
				configureWebpack() {
					return {
						resolve: {
							extensionAlias: {
								'.js': ['.ts', '.tsx', '.js'],
							},
							alias: {
								// Match the vitest.workspace.ts `@utils` alias
								// so `@utils/deep-freeze-in-place` (used by
								// `api/run.ts` et al.) resolves in webpack too.
								'@utils': path.resolve('src/lib/utils'),
							},
							// `recast` (used by `lib/formatting/format.ts`)
							// conditionally requires `os` for EOL detection
							// behind an `isBrowser()` guard. Webpack 5 doesn't
							// polyfill Node built-ins by default; `false`
							// resolves to an empty module so the static
							// analysis succeeds and the runtime never hits it.
							fallback: { os: false },
						},
					};
				},
			};
		},
		// --- study-lenses lifecycle plugin (watched-path globs) ---
		[
			createStudyLensesPlugin,
			{
				contentRoots: [
					'spiralearn/frogramming-and-vibetoading',
					'spiralearn/welcome-to-frogramming',
					'spiralearn/sandbox',
				],
			},
		],
		// --- Welcome to Frogramming curriculum ---
		// The legacy spiralearn/welcome-to-programming/ tree is deprecated
		// (still in the repo for now; chapter content will migrate into
		// welcome-to-frogramming/ over time, see guide.authors.md).
		[
			'@docusaurus/plugin-content-docs',
			{
				id: 'welcome-to-frogramming',
				path: 'spiralearn/welcome-to-frogramming',
				routeBasePath: 'welcome-to-frogramming',
				sidebarPath: './sidebars/welcome-to-frogramming.mjs',
				beforeDefaultRemarkPlugins: [
					[
						createRemarkStudyLenses,
						{
							contentRoot: studyLensContentRoot(
								'spiralearn/welcome-to-frogramming',
							),
						},
					],
				],
				sidebarItemsGenerator: createStudySidebarGenerator({
					contentRoot: studyLensContentRoot(
						'spiralearn/welcome-to-frogramming',
					),
				}),
			},
		],
		// --- Frogramming & Vibetoading (5-chapter affordance-cycle reshape) ---
		// The going-forward curriculum. The original 6-chapter
		// welcome-to-frogramming/ tree is preserved as a historical record,
		// still served at /welcome-to-frogramming/.
		[
			'@docusaurus/plugin-content-docs',
			{
				id: 'frogramming-and-vibetoading',
				path: 'spiralearn/frogramming-and-vibetoading',
				routeBasePath: 'frogramming-and-vibetoading',
				sidebarPath: './sidebars/frogramming-and-vibetoading.mjs',
				beforeDefaultRemarkPlugins: [
					[
						createRemarkStudyLenses,
						{
							contentRoot: studyLensContentRoot(
								'spiralearn/frogramming-and-vibetoading',
							),
						},
					],
				],
				sidebarItemsGenerator: createStudySidebarGenerator({
					contentRoot: studyLensContentRoot(
						'spiralearn/frogramming-and-vibetoading',
					),
				}),
			},
		],
		// --- Welcome to Algorithms curriculum ---
		// [
		// 	'@docusaurus/plugin-content-docs',
		// 	{
		// 		id: 'welcome-to-algorithms',
		// 		path: 'spiralearn/welcome-to-algorithms',
		// 		routeBasePath: 'welcome-to-algorithms',
		// 		sidebarPath: './sidebars/welcome-to-algorithms.mjs',
		// 		exclude: ['**/to-use/**'],
		// 	},
		// ],
		// --- Add future spiralearn here ---
		[
			'@docusaurus/plugin-content-docs',
			{
				id: 'sandbox',
				path: 'spiralearn/sandbox',
				routeBasePath: 'sandbox',
				sidebarPath: './sidebars/sandbox.mjs',
				beforeDefaultRemarkPlugins: [
					[
						createRemarkStudyLenses,
						{
							contentRoot: studyLensContentRoot('spiralearn/sandbox'),
						},
					],
				],
				sidebarItemsGenerator: createStudySidebarGenerator({
					contentRoot: studyLensContentRoot('spiralearn/sandbox'),
				}),
			},
		],
	],

	presets: [
		[
			'classic',
			{
				docs: false, // disable default docs instance — we use multi-instance plugins
				blog: false,
				theme: {
					customCss: './src/css/custom.css',
				},
			},
		],
	],

	themeConfig: {
		navbar: {
			title: 'Spir@learn',
			items: [
				{
					to: '/frogramming-and-vibetoading/',
					label: 'Frogramming & Vibetoading',
					position: 'left',
				},
				{
					to: '/welcome-to-frogramming/',
					label: 'Welcome to Frogramming (historical)',
					position: 'left',
				},
				// {
				// 	to: '/welcome-to-algorithms/',
				// 	label: 'Welcome to Algorithms',
				// 	position: 'left',
				// },
				{
					href: 'https://github.com/codeschoolinabox/spiralearn',
					label: 'GitHub',
					position: 'right',
				},
			],
		},
		footer: {
			style: 'dark',
			links: [
				{
					title: 'spiralearn',
					items: [
						{
							label: 'Frogramming & Vibetoading',
							to: '/frogramming-and-vibetoading/',
						},
						{
							label: 'Welcome to Frogramming (historical)',
							to: '/welcome-to-frogramming/',
						},
						// {
						// 	label: 'Welcome to Algorithms',
						// 	to: '/welcome-to-algorithms/',
						// },
					],
				},
				{
					title: 'Community',
					items: [
						{
							label: 'GitHub',
							href: 'https://github.com/codeschoolinabox',
						},
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()} codeschoolinabox. Built with Docusaurus.`,
		},
	},
};

export default config;
