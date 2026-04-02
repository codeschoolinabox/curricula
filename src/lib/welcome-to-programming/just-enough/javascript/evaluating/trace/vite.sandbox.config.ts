/**
 * @file Vite dev server config for the trace sandbox.
 *
 * Adds COOP/COEP headers required for SharedArrayBuffer
 * (needed for worker-based trace with SAB+Atomics I/O traps).
 *
 * Usage: npx vite --config src/lib/welcome-to-programming/just-enough/javascript/evaluating/trace/vite.sandbox.config.ts
 */

import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
	root: 'src/lib/welcome-to-programming/just-enough/javascript/evaluating/trace',
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
