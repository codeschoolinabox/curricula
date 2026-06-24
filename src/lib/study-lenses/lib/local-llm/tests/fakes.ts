/**
 * Shared test doubles for the local-llm suite (DEV.md allows shared doubles, not
 * shared data — catalog entries and capabilities overrides stay inline per test).
 * Grows per increment: the selection core (inc 3) needs a capabilities double and
 * a registration placeholder; the facade (inc 6) adds the counted/gated adapter.
 */

import type {
	DeviceCapabilities,
	ModelCatalogEntry,
	RuntimeAdapter,
	SizeClass,
} from '../types.js';

export const fakeCaps = (
	over: Partial<DeviceCapabilities> = {},
): DeviceCapabilities => ({
	webgpu: true,
	deviceMemoryGB: 8,
	wasm: { threads: true, simd: true },
	...over,
});

// Entry builders: only the behavioral variables (id, sizeClass, vram, code-spec)
// are surfaced so each test reads as its delta; the rest is fixed boilerplate.
export const webllmEntry = (
	over: {
		id?: string;
		sizeClass?: SizeClass;
		vramRequiredMB?: number;
		codeSpecialized?: boolean;
		requiredFeatures?: readonly string[];
	} = {},
): ModelCatalogEntry => {
	const id = over.id ?? 'model-a';
	return {
		id,
		family: 'test',
		params: '0.5B',
		sizeClass: over.sizeClass ?? 'small',
		license: 'Apache-2.0',
		codeSpecialized: over.codeSpecialized ?? false,
		runtimes: [
			{
				load: {
					runtime: 'webllm',
					modelId: `${id}-MLC`,
					quant: 'q4f16_1',
					...(over.vramRequiredMB === undefined
						? {}
						: { vramRequiredMB: over.vramRequiredMB }),
					...(over.requiredFeatures === undefined
						? {}
						: { requiredFeatures: over.requiredFeatures }),
				},
				fetchUrl: `https://example.test/${id}`,
			},
		],
	};
};

export const wllamaEntry = (
	over: { id?: string; sizeClass?: SizeClass } = {},
): ModelCatalogEntry => {
	const id = over.id ?? 'cpu-model';
	return {
		id,
		family: 'test',
		params: '0.3B',
		sizeClass: over.sizeClass ?? 'tiny',
		license: 'Apache-2.0',
		codeSpecialized: false,
		runtimes: [
			{
				load: {
					runtime: 'wllama',
					repo: `${id}-repo`,
					file: 'model.gguf',
					quant: 'Q4_K_M',
				},
				fetchUrl: `https://example.test/${id}`,
			},
		],
	};
};

// A registration placeholder: selectFeasible only checks that a runtime is
// present in the adapter map — it never invokes the adapter — so this throws if
// ever actually called, surfacing a test that wrongly drives a real load.
export const registeredAdapter: RuntimeAdapter = () => {
	throw new Error('registeredAdapter must not be invoked in selection tests');
};
