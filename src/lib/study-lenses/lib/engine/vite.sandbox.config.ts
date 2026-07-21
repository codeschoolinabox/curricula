/**
 * @file Vite dev-server config for engine sandbox pages: serves the
 * COOP/COEP headers SharedArrayBuffer requires (the engine's vitest
 * browser project ships its own header middleware; this config is for
 * standalone dev pages, which arrive with the evaluators wiring work).
 *
 * Root is the whole study-lenses package so engine files resolve
 * sibling and @utils imports without path gymnastics.
 *
 * Usage: npx vite --config src/lib/study-lenses/lib/engine/vite.sandbox.config.ts
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
