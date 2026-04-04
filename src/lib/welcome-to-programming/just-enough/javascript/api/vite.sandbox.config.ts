/**
 * @file Vite dev server config for the API sandbox.
 *
 * Adds COOP/COEP headers required for SharedArrayBuffer
 * (needed by the run and trace wrappers).
 *
 * Usage: npx vite --config src/lib/welcome-to-programming/just-enough/javascript/api/vite.sandbox.config.ts
 */

import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
	root: 'src/lib/welcome-to-programming/just-enough/javascript/api',
	resolve: {
		alias: {
			'@utils': path.resolve(__dirname, '..', '..', '..', '..', 'utils'),
		},
	},
	optimizeDeps: {
		include: ['acorn', 'aran', 'astring', 'estree-walker'],
	},
	server: {
		headers: {
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp',
		},
	},
});
