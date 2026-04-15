import type { Config } from '@docusaurus/types';

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
		// --- Welcome to Programming curriculum ---
		[
			'@docusaurus/plugin-content-docs',
			{
				id: 'welcome-to-programming',
				path: 'spiralearn/welcome-to-programming',
				routeBasePath: 'welcome-to-programming',
				sidebarPath: './sidebars/welcome-to-programming.mjs',
				exclude: [
					'**/to-use/**',                                        // teaching-only resources (never shown)
					'3-devs-computers-users/**',                           // chapter 3 — content in design
					'4-devs-computers-users-agents/**',                    // chapter 4 — content in design
					// --- author/process docs (not learner-facing) ---
					'**/research-framing.md',
					'**/teaching-tips.md',
					'learning-objectives--to-sort.md',
					'sidebar-control-guide.md',
					// --- ch2 legacy/scratch dirs (kept in repo, hidden from TOC) ---
					'2-devs-computers/*/from-inside-js/**',
					'2-devs-computers/*/from-welcome-to-js/**',
					'2-devs-computers/2.1-running-a-program/errors/**',
					'2-devs-computers/2.1-running-a-program/0-errorsss/**',
					'2-devs-computers/2.2-program-state/devtools-debugger/**',
					'2-devs-computers/2.2-program-state/predictive-stepping/**',
					'2-devs-computers/2.2-program-state/the-computer/**',
					'2-devs-computers/2.2-program-state/1-predicting-execution/**',
					'2-devs-computers/2.2-program-state/1-variables/**',
					'2-devs-computers/2.2-program-state/isolating-javascript.md',
					'2-devs-computers/2.2-program-state/trace-tables.md',
					'2-devs-computers/2.3-asserting/2-comparing-and-asserting/**',
					'2-devs-computers/2.3-asserting/3-value-swaps/**',
					'2-devs-computers/2.3-asserting/study.json',
					'2-devs-computers/2.5-control-flow/**',                // no landing page yet
					'2-devs-computers/2.6+-deeper-into-computing/**',      // no landing page yet
					// --- just-enough-javascript: keep visible, hide flashcards ---
					'just-enough-javascript/flashcards/**',
				],
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
					to: '/welcome-to-programming/',
					label: 'Welcome to Programming',
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
							label: 'Welcome to Programming',
							to: '/welcome-to-programming/',
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
