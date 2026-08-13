/**
 * @file The default capability probe — reads the live device into a conservative
 * DeviceCapabilities heuristic (DOCS § Execution phases, phase 1). The module's
 * default CapabilityProbe; make-local-llm injects or defaults to it.
 *
 * Browser-only: it reads navigator.gpu / navigator.deviceMemory /
 * navigator.storage and the WASM features, none of which node exposes — so
 * fidelity is verified in a real browser (probe-capabilities.browser.test.ts),
 * never with a hand-rolled navigator stub (a false-fidelity lie). The pure
 * arithmetic (the memory cap) is split into bucket-device-memory.ts and
 * node-unit tested there.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import bucketDeviceMemory from './bucket-device-memory.js';
import type { DeviceCapabilities } from './types.js';

// Minimal local types for the untyped WebGPU + Device-Memory boundary APIs
// (@webgpu/types is not a dependency; only the fields this probe reads are modeled).
type GpuAdapterLike = {
	readonly limits: {
		readonly maxBufferSize: number;
		readonly maxStorageBufferBindingSize: number;
	};
	readonly features: ReadonlySet<string>;
};
type ProbeNavigator = Navigator & {
	readonly gpu?: {
		readonly requestAdapter: () => Promise<GpuAdapterLike | null>;
	};
	readonly deviceMemory?: number;
};

/**
 * Probes the live device for its {@link DeviceCapabilities} — a conservative
 * heuristic, never an exact resource readout (the browser does not expose total
 * VRAM). WebGPU presence, its adapter's buffer limits and advertised features, a
 * coarse memory bucket, storage headroom, and the WASM features for a CPU
 * fallback. Optional fields are omitted (never `undefined`) when the device does
 * not report them.
 *
 * @returns A frozen {@link DeviceCapabilities}.
 */
export default async function probeCapabilities(): Promise<DeviceCapabilities> {
	const nav = navigator as ProbeNavigator;

	const adapter = await requestAdapter(nav);
	const { deviceMemory } = nav;
	const storageQuota = await estimateStorageQuota(nav);

	const result: DeviceCapabilities = {
		webgpu: adapter !== null,
		wasm: { threads: hasWasmThreads(), simd: hasWasmSimd() },
		...(adapter === null
			? {}
			: {
					maxBufferBytes: adapter.limits.maxBufferSize,
					maxStorageBufferBindingBytes:
						adapter.limits.maxStorageBufferBindingSize,
					// `Array.from`, never `[...<Set>]`: Docusaurus/Babel
					// compiles spread in loose mode to `[].concat(x)`, which
					// would report the Set itself as the one feature present.
					webgpuFeatures: Array.from(adapter.features),
				}),
		...(deviceMemory === undefined
			? {}
			: { deviceMemoryGB: bucketDeviceMemory(deviceMemory) }),
		...(storageQuota === undefined ? {} : { storageQuotaBytes: storageQuota }),
	};

	return freezeInPlace(result);
}

const WASM_SIMD_PROBE = new Uint8Array([
	0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8,
	0, 65, 0, 253, 15, 253, 98, 11,
]);

/** The WebGPU adapter, or null when WebGPU is absent or `requestAdapter` fails. */
async function requestAdapter(
	nav: ProbeNavigator,
): Promise<GpuAdapterLike | null> {
	if (nav.gpu === undefined) return null;
	try {
		return await nav.gpu.requestAdapter();
	} catch {
		return null;
	}
}

/** The storage quota in bytes, or undefined when the device does not report it. */
async function estimateStorageQuota(
	nav: ProbeNavigator,
): Promise<number | undefined> {
	// Optional-chain `storage`: lib.dom types it non-optional, but a non-standard
	// runtime can omit it — never let a missing API throw out of the probe.
	const { storage } = nav as { readonly storage?: StorageManager };
	const estimate = await storage?.estimate();
	return estimate?.quota;
}

function hasWasmThreads(): boolean {
	// WASM threads require a SharedArrayBuffer; availability is probed directly. In
	// standard browsers SAB needs cross-origin isolation, but it can also be
	// force-enabled by a launch flag — so this checks SAB, not isolation.
	return typeof SharedArrayBuffer !== 'undefined';
}

function hasWasmSimd(): boolean {
	// Validate a minimal module that uses a v128 op (the wasm-feature-detect SIMD
	// probe); WebAssembly.validate is true iff the engine supports fixed-width SIMD.
	return WebAssembly.validate(WASM_SIMD_PROBE);
}
