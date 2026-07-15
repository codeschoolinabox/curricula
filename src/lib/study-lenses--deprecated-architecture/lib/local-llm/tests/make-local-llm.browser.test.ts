import { describe, expect, it } from 'vitest';

import makeLocalLlm from '../make-local-llm.js';
import makeWebllmAdapter from '../webllm-adapter.js';

// The facade end-to-end on real hardware: the real probe reports real caps, and
// (GPU-gated) the real webllm adapter brings a model up through the full wiring
// (probe → feasibility → catalog → adapter). The node suite covers the logic with
// fakes; this is the only place the real probe + real bring-up wire together.
type GpuNavigator = { gpu?: { requestAdapter: () => Promise<unknown> } };
const gpuAdapter = await (
	navigator as unknown as GpuNavigator
).gpu?.requestAdapter();
const gpuAvailable = gpuAdapter !== null && gpuAdapter !== undefined;

// A tiny, feature-free coder (no requiredFeatures) — the lightest real download.
const SMALL_CODER_ID = 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC';

describe('makeLocalLlm (real browser)', () => {
	it('probes real device capabilities through canRun', async () => {
		const llm = makeLocalLlm({ adapters: { webllm: makeWebllmAdapter() } });
		const capabilities = await llm.canRun();
		expect(typeof capabilities.webgpu).toBe('boolean');
	});

	it.skipIf(!gpuAvailable)(
		'brings a real model up end-to-end via load',
		async () => {
			const llm = makeLocalLlm({ adapters: { webllm: makeWebllmAdapter() } });
			const result = await llm.load({ model: SMALL_CODER_ID });
			expect(result.ok).toBe(true);
		},
		180_000,
	);
});
