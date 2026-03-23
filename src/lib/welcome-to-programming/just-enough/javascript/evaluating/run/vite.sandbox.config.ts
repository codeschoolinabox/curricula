/**
 * @file Vite dev server config for the run sandbox.
 *
 * Adds COOP/COEP headers required for SharedArrayBuffer.
 *
 * Usage: npx vite --config src/lib/just-enough-javascript/evaluating/run/vite.sandbox.config.ts
 */

import { defineConfig } from 'vite';

export default defineConfig({
	root: 'src/lib/just-enough-javascript/evaluating/run',
	server: {
		headers: {
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp',
		},
	},
});
