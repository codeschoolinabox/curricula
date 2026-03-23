/**
 * @file Vite dev server config for the API sandbox.
 *
 * Adds COOP/COEP headers required for SharedArrayBuffer
 * (needed by the run and trace wrappers).
 *
 * Usage: npx vite --config src/lib/just-enough-javascript/api/vite.sandbox.config.ts
 */

import { defineConfig } from 'vite';

export default defineConfig({
	root: 'src/lib/just-enough-javascript/api',
	server: {
		headers: {
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp',
		},
	},
});
