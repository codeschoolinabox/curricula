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
