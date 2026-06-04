import path from 'node:path';
import { defineWorkspace } from 'vitest/config';

const alias = {
	'@utils': path.resolve(__dirname, 'src/lib/utils'),
	// `@site/` is Docusaurus's webpack alias pointing at the site root;
	// unit tests need it too so cross-tree imports (`@site/src/plugins/...`)
	// resolve. Production Docusaurus provides the same alias via its
	// webpack config.
	'@site': path.resolve(__dirname, ''),
	// Docusaurus `BrowserOnly` + `CodeBlock` are runtime-provided by the
	// Docusaurus bundle; in tests we stub them to render their children
	// (BrowserOnly) or a plain <pre> (CodeBlock) so component tests run
	// under jsdom without Docusaurus's build-time module resolution.
	'@docusaurus/BrowserOnly': path.resolve(
		__dirname,
		'vitest-stubs/docusaurus-BrowserOnly.tsx',
	),
	'@theme/CodeBlock': path.resolve(
		__dirname,
		'vitest-stubs/theme-CodeBlock.tsx',
	),
};

export default defineWorkspace([
	{
		resolve: { alias },
		test: {
			name: 'unit',
			include: ['src/{lib,plugins}/**/*.test.{ts,tsx}'],
			exclude: [
				'src/lib/**/*.browser.test.ts',
				// WIP tracer redesign — Phase B2 / Step B7 work deferred per
				// EMBODY-IMPL-HANDOFF.md. Tests run against half-landed types
				// would give misleading green signals.
				'src/lib/just-enough/javascript/embody/lib/evaluating/trace/semantics/**',
			],
			environment: 'node',
			// WHY server.deps.inline for CM packages: CodeMirror 6 uses
			// instanceof checks on its Extension class. Vitest's default
			// externalization can load @codemirror/state twice (once via
			// Vite transform for files we own, once via Node ESM for deps
			// in node_modules), breaking the instanceof check with
			// "Unrecognized extension value in extension set". Inlining
			// forces single-instance loading through Vite's transformer.
			// See https://vitest.dev/config/#server-deps-inline
			server: {
				deps: {
					// WHY inline these: CodeMirror 6 uses instanceof checks on its
					// Extension class. Without inlining, Vitest's Node ESM loader
					// can resolve @codemirror/state twice (once via the codemirror
					// meta-package's internal import, once via our direct import),
					// breaking the instanceof check with "Unrecognized extension
					// value in extension set". Inlining forces single-instance
					// loading through Vite's transformer.
					inline: [/^@codemirror\//, 'codemirror'],
				},
			},
		},
	},
	{
		resolve: { alias },
		optimizeDeps: {
			include: ['acorn', 'aran', 'astring', 'estree-walker'],
		},
		plugins: [
			{
				name: 'coop-coep-headers',
				configureServer(server) {
					server.middlewares.use(function coopCoep(_req, res, next) {
						res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
						res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
						next();
					});
				},
			},
		],
		test: {
			name: 'browser',
			include: ['src/lib/**/*.browser.test.ts'],
			exclude: [
				// WIP tracer redesign — Phase B2 / Step B7 work deferred per
				// EMBODY-IMPL-HANDOFF.md. Tests run against half-landed types
				// would give misleading green signals.
				'src/lib/just-enough/javascript/embody/lib/evaluating/trace/semantics/**',
			],
			// WHY sequential + retry: browser tests spawn Workers with
			// SharedArrayBuffer pause protocol. Running test files in
			// parallel exhausts the browser's Worker thread pool, causing
			// postMessage delivery failures. Sequential execution + retry
			// handles the rare single-Worker scheduling delay.
			fileParallelism: false,
			retry: 2,
			browser: {
				enabled: true,
				name: 'chromium',
				provider: 'playwright',
				headless: true,
				providerOptions: {
					launch: {
						args: ['--enable-features=SharedArrayBuffer'],
					},
				},
			},
		},
	},
]);
