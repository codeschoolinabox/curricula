/**
 * @file Vite dev server config for the editor sandbox.
 *
 * Usage: npx vite --config src/lib/just-enough/javascript/orchestrate/lib/editing/vite.sandbox.config.ts
 */

import path from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
	root: 'src/lib/just-enough/javascript/orchestrate/lib/editing',
	resolve: {
		alias: {
			// Editor files import from @utils/... — resolve to src/lib/utils
			// (6 levels up from orchestrate/lib/editing/).
			'@utils': path.resolve(
				__dirname,
				'..',
				'..',
				'..',
				'..',
				'..',
				'..',
				'utils',
			),
		},
	},
	optimizeDeps: {
		// Transitive deps that need pre-bundling when api/* modules load
		// (same set as api/vite.sandbox.config.ts — lib/editing pulls in
		// the JeJ runtime stack once any API wrapper is imported).
		include: ['acorn', 'aran', 'astring', 'estree-walker'],
	},
	server: {
		headers: {
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp',
		},
	},
});
