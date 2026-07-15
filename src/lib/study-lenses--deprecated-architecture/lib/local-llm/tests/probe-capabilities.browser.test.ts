import { describe, expect, it } from 'vitest';

import probeCapabilities from '../probe-capabilities.js';

const MAX_DEVICE_MEMORY_GB = 8;

// Probe once for the WebGPU skip-gate only; each test re-probes for its own
// assertion (no shared fixture). WebGPU is absent on headless/GPU-less lanes, so
// the adapter-limit tests are skipped there and exercised only on a real GPU.
const { webgpu: webgpuAvailable } = await probeCapabilities();

describe('probeCapabilities (real browser)', () => {
	it('webgpu is a boolean', async () => {
		const caps = await probeCapabilities();
		expect(typeof caps.webgpu).toBe('boolean');
	});

	it('wasm.simd is true on this engine (fixed-width SIMD is supported)', async () => {
		const caps = await probeCapabilities();
		expect(caps.wasm.simd).toBe(true);
	});

	it('wasm.threads is true where SharedArrayBuffer is enabled', async () => {
		const caps = await probeCapabilities();
		expect(caps.wasm.threads).toBe(true);
	});

	it('storageQuotaBytes is a number', async () => {
		const caps = await probeCapabilities();
		expect(typeof caps.storageQuotaBytes).toBe('number');
	});

	it('deviceMemoryGB, when reported, is within the ceiling', async () => {
		const { deviceMemoryGB } = await probeCapabilities();
		expect(
			deviceMemoryGB === undefined || deviceMemoryGB <= MAX_DEVICE_MEMORY_GB,
		).toBe(true);
	});

	it.skipIf(!webgpuAvailable)(
		'reports a numeric maxBufferBytes when a WebGPU adapter exists (GPU-only)',
		async () => {
			const caps = await probeCapabilities();
			expect(typeof caps.maxBufferBytes).toBe('number');
		},
	);

	it.skipIf(!webgpuAvailable)(
		'reports a numeric maxStorageBufferBindingBytes when a WebGPU adapter exists (GPU-only)',
		async () => {
			const caps = await probeCapabilities();
			expect(typeof caps.maxStorageBufferBindingBytes).toBe('number');
		},
	);

	it.skipIf(!webgpuAvailable)(
		'webgpuFeatures is a string array when a WebGPU adapter exists (GPU-only)',
		async () => {
			const caps = await probeCapabilities();
			expect(Array.isArray(caps.webgpuFeatures)).toBe(true);
		},
	);

	it.skipIf(!webgpuAvailable)(
		'webgpuFeatures has at least one entry on a conformant adapter (GPU-only)',
		async () => {
			const caps = await probeCapabilities();
			expect((caps.webgpuFeatures ?? []).length).toBeGreaterThanOrEqual(1);
		},
	);

	it.skipIf(webgpuAvailable)(
		'webgpuFeatures is absent (not just undefined) when WebGPU is unavailable',
		async () => {
			const caps = await probeCapabilities();
			expect('webgpuFeatures' in caps).toBe(false);
		},
	);
});
