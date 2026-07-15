/**
 * @file Cap a device-memory reading to the runtime's conservative ceiling — the
 * pure arithmetic leaf of the capability probe (probe-capabilities.ts), split
 * out so it is node-unit testable independent of the GPU-gated browser probe.
 */

/**
 * Caps a device-memory reading (in GB) to the conservative ceiling.
 *
 * `navigator.deviceMemory` is already coarse-bucketed by the browser ({0.25,
 * 0.5, 1, 2, 4, 8}); this is a defensive cap so feasibility never plans around a
 * larger reading than the runtime should trust. The browser never exposes total
 * VRAM, so capability matching stays a conservative heuristic.
 *
 * @param gb - A device-memory reading in GB.
 * @returns The reading, capped at the ceiling.
 */
export default function bucketDeviceMemory(gb: number): number {
	return Math.min(gb, MAX_DEVICE_MEMORY_GB);
}

const MAX_DEVICE_MEMORY_GB = 8;
