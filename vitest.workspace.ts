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
			include: ['src/lib/**/*.test.ts'],
			exclude: ['src/lib/**/*.browser.test.ts'],
			environment: 'node',
		},
	},
	{
		resolve: { alias },
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
