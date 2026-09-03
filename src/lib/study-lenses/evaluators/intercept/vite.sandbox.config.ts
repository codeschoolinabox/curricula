/* cspell:ignore COEP Embedder vite Vite */
/**
 * @file Vite dev-server config for intercept's sandbox page: serves the
 * COOP/COEP headers SharedArrayBuffer requires. Rooted at the whole
 * study-lenses package (the engine config's own precedent) so sibling
 * and @utils imports resolve without path gymnastics.
 *
 * Usage: npx vite --config src/lib/study-lenses/evaluators/intercept/vite.sandbox.config.ts
 * then open  /evaluators/intercept/sandbox.html
 */

import path from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
	root: 'src/lib/study-lenses',
	resolve: {
		alias: {
			'@utils': path.resolve('src/lib/utils'),
		},
	},
	server: {
		headers: {
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp',
		},
	},
});
