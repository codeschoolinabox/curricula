/**
 * @file Vite dev server config for the trace sandbox.
 *
 * Adds COOP/COEP headers required for SharedArrayBuffer
 * (needed for worker-based trace with SAB+Atomics I/O traps).
 *
 * Usage: npx vite --config src/lib/just-enough-javascript/evaluating/trace/vite.sandbox.config.ts
 */

import { defineConfig } from 'vite';

export default defineConfig({
	root: 'src/lib/just-enough-javascript/evaluating/trace',
	server: {
		headers: {
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp',
		},
	},
});
