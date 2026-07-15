import { describe, expect, it } from 'vitest';

import aithor from '../aithor.js';
import makeWebllmRuntime from '../webllm-runtime.js';

// Real WebGPU + a real (~900 MB) model download + real inference, driven through
// aithor's WHOLE seam: makeWebllmRuntime() → makeAithorRuntime → makeLocalLlm →
// the webllm adapter → CreateMLCEngine → generate → AithorResult. Gated to a GPU
// lane and skipped on headless/GPU-less lanes. This is the ONLY place aithor's
// injected loadModel/generate seam is proven to carry a real local-model bring-up
// end-to-end — the guarantee that is NOT distinguishable in Node, where
// webllm-wired vs no-adapter both converge on no-model-available without a real
// WebGPU engine (see webllm-runtime.test.ts § triangulation ceiling). Mirrors
// local-llm's webllm-adapter.browser.test.ts: same GPU gate, same small coder
// model (no requiredFeatures → no feasibility surprise), same 180s budget.
type GpuNavigator = { gpu?: { requestAdapter: () => Promise<unknown> } };
const gpuAdapter = await (
	navigator as unknown as GpuNavigator
).gpu?.requestAdapter();
const gpuAvailable = gpuAdapter !== null && gpuAdapter !== undefined;

// The smallest catalog coder with NO requiredFeatures — so an explicit pick never
// feasibility-refuses for a missing 'shader-f16' (which would fail, not skip).
const SMALL_CODER_ID = 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC';

describe('aithor with makeWebllmRuntime (real browser)', () => {
	// Constructs the runtime under Vite's browser bundler in real Chromium without
	// throwing — isolates "build works in-browser" from the seam call below. (The
	// Node unit covers the same shape; this re-attests it in the browser context.)
	it('builds the runtime in real Chromium without invoking the engine', () => {
		const runtime = makeWebllmRuntime();
		expect(typeof runtime.loadModel).toBe('function');
	});

	// Value-not-throw in the REAL browser module graph: an unknown model id
	// pre-checks to a Refusal value (no GPU, no download), never a thrown rejection
	// escaping @mlc-ai/web-llm. Also triangulates the gated success case below — a
	// second, distinct outcome path, so the file is not a pass-everything stub.
	it('refuses an unknown model id as a value, without a GPU', async () => {
		const result = await aithor(
			'',
			{ prompt: 'x', model: 'not-a-real-model-id', validate: false },
			makeWebllmRuntime(),
		);

		expect(result.ok).toBe(false);
		expect(result.refusal?.cause).toBe('unknown-model');
	});

	it.skipIf(!gpuAvailable)(
		'carries a real bring-up + generation through the seam to an uncurated result',
		async () => {
			const result = await aithor(
				'',
				{
					prompt: 'Write a one-line JavaScript statement that logs hello.',
					model: SMALL_CODER_ID,
					validate: false,
				},
				makeWebllmRuntime(),
			);

			expect(result.ok).toBe(true);
			expect(result.refusal).toBeUndefined();
			expect(result.program).toBeDefined();
			expect((result.program ?? '').length).toBeGreaterThan(0);
			// meta.model is the RESOLVED id (the model that actually ran); for an
			// explicit pick it equals the requested id — proving the seam reported
			// the artifact that ran, not a silent substitution.
			expect(result.meta?.model).toBe(SMALL_CODER_ID);
			expect(result.meta?.attempts).toBe(1);
		},
		180_000,
	);
});
