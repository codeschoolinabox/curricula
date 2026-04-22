/**
 * @file Vite dev server config for the run sandbox.
 *
 * Adds COOP/COEP headers required for SharedArrayBuffer.
 * Root is the whole javascript package so that run.ts can resolve
 * @utils and sibling imports without path gymnastics.
 *
 * Usage: npx vite --config src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/vite.sandbox.config.ts
 */

import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
	root: 'src/lib/welcome-to-programming/just-enough/javascript',
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
