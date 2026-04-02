/**
 * @file Vite dev server config for the editor sandbox.
 *
 * Usage: npx vite --config src/lib/welcome-to-programming/editor/vite.sandbox.config.ts
 */

import { defineConfig } from 'vite';

export default defineConfig({
	root: 'src/lib/welcome-to-programming/editor',
	server: {
		headers: {
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp',
		},
	},
});
