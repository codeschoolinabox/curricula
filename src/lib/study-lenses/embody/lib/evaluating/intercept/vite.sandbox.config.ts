/**
 * @file Vite dev server config for the intercept sandbox.
 *
 * Adds COOP/COEP headers required for SharedArrayBuffer.
 * Root is the whole javascript package so that intercept.ts can resolve
 * @utils and sibling imports without path gymnastics.
 *
 * Usage: npx vite --config src/lib/study-lenses/embody/lib/evaluating/intercept/vite.sandbox.config.ts
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
