/**
 * @file Vite dev server config for the `<Splitter>` isolation sandbox — the
 * human checkpoint for drag FEEL / limits / grabbability (jsdom computes no
 * layout, so the component tests can only pin wiring + direction).
 *
 * Usage: npx vite --config src/lib/study-lenses/orchestrate/splitter/vite.sandbox.config.ts
 * (then open the printed localhost URL and drag both dividers).
 */

import { defineConfig } from 'vite';

export default defineConfig({
	root: 'src/lib/study-lenses/orchestrate/splitter',
});
