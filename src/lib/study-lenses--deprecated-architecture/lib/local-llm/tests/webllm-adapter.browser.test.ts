import { describe, expect, it } from 'vitest';

import type { RuntimeLoad } from '../types.js';
import makeWebllmAdapter from '../webllm-adapter.js';

// Real WebGPU + a real (~900 MB) model download + real inference — gated to a GPU
// lane and skipped on headless/GPU-less lanes. This is the only place the real
// CreateMLCEngine fetch/load/generate path is exercised (README § Testing posture:
// transport fidelity is real-only).
type GpuNavigator = { gpu?: { requestAdapter: () => Promise<unknown> } };
const gpuAdapter = await (
	navigator as unknown as GpuNavigator
).gpu?.requestAdapter();
const gpuAvailable = gpuAdapter !== null && gpuAdapter !== undefined;

const SMALL_CODER: RuntimeLoad = {
	runtime: 'webllm',
	modelId: 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC',
	quant: 'q4f16_1',
};

describe('makeWebllmAdapter (real browser)', () => {
	it('constructs an adapter function in a real browser (the bring-up is GPU-gated below)', () => {
		expect(typeof makeWebllmAdapter()).toBe('function');
	});

	it.skipIf(!gpuAvailable)(
		'brings a real model up and generate returns non-empty raw',
		async () => {
			const model = await makeWebllmAdapter()(SMALL_CODER, '');
			const result = await model.generate(
				'Write a one-line JavaScript statement that logs hello.',
			);
			expect(result.raw.length).toBeGreaterThan(0);
		},
		180_000,
	);
});
