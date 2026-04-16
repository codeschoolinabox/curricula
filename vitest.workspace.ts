import path from 'node:path';
import { defineWorkspace } from 'vitest/config';

const alias = {
	'@utils': path.resolve(__dirname, 'src/lib/utils'),
};

export default defineWorkspace([
	{
		resolve: { alias },
		test: {
			name: 'unit',
			include: ['src/{lib,plugins}/**/*.test.ts'],
			exclude: ['src/lib/**/*.browser.test.ts'],
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
						res.setHeader(
							'Cross-Origin-Opener-Policy',
							'same-origin',
						);
						res.setHeader(
							'Cross-Origin-Embedder-Policy',
							'require-corp',
						);
						next();
					});
				},
			},
		],
		test: {
			name: 'browser',
			include: ['src/lib/**/*.browser.test.ts'],
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
