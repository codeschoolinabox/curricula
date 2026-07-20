/**
 * @file Vite dev server config for the local-llm sandbox.
 *
 * Root is the study-lenses package so the sandbox's relative `./*.ts` imports,
 * the transitive `@utils/freeze-in-place.js` alias, and `@mlc-ai/web-llm` from
 * node_modules all resolve (mirrors run/vite.sandbox.config.ts).
 *
 * COOP/COEP are OFF by default: WebLLM's main-thread WebGPU path needs no
 * SharedArrayBuffer, and COEP `require-corp` can block the HuggingFace CDN
 * weight fetch. Flip CROSS_ORIGIN_ISOLATED only for a future threaded-WASM adapter.
 *
 * Usage: npx vite --config src/lib/study-lenses/lib/local-llm/vite.sandbox.config.ts
 */
import path from 'node:path';

import { defineConfig } from 'vite';

const CROSS_ORIGIN_ISOLATED = false;

export default defineConfig({
	root: 'src/lib/study-lenses',
	resolve: { alias: { '@utils': path.resolve('src/lib/utils') } },
	server: {
		headers: CROSS_ORIGIN_ISOLATED
			? {
					'Cross-Origin-Opener-Policy': 'same-origin',
					'Cross-Origin-Embedder-Policy': 'require-corp',
				}
			: {},
	},
});
