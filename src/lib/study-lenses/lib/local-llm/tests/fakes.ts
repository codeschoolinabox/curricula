/**
 * Shared test doubles for the local-llm suite (DEV.md allows shared doubles, not
 * shared data — catalog entries and capabilities overrides stay inline per test).
 * Grows per increment: the selection core (inc 3) needs a capabilities double and
 * a registration placeholder; the facade (inc 6) adds a counted adapter, a fake
 * model/probe, and a small catalog.
 */

import type {
	CapabilityProbe,
	DeviceCapabilities,
	LoadedModel,
	ModelCatalog,
	ModelCatalogEntry,
	RuntimeAdapter,
	RuntimeLoad,
	SizeClass,
} from '../types.js';

// The buffer limits (maxBufferBytes / maxStorageBufferBindingBytes) are
// deliberately OMITTED by default: feasibility treats an unreported limit as
// undefined-admit (a probe gap must not over-refuse a capable device), so a test
// that wants the buffer gate to fire must opt in with an explicit low limit.
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

// A loaded-model double whose generate echoes a canned reply (the facade tests
// exercise load-once/dedup/refusal, not generation).
export const fakeModel = (reply = ''): LoadedModel => ({
	generate: () => Promise.resolve({ raw: reply, code: reply }),
});

// A capability probe double — resolves to the given (default-feasible) caps.
export const fakeProbe =
	(caps: DeviceCapabilities = fakeCaps()): CapabilityProbe =>
	() =>
		Promise.resolve(caps);

// A counted runtime adapter for the load-once/dedup/eviction tests. `calls` pins
// how many bring-ups fired; `fail: true` rejects the bring-up (the eviction
// path). The bring-up resolves synchronously, so a sync adapter can't hold
// concurrent callers in-flight — the dedup tests instead gate the PROBE, which
// holds every concurrent load at the cache-check together.
export const countedAdapter = (options: { fail?: boolean } = {}) => {
	const calls: { load: RuntimeLoad; fetchUrl: string }[] = [];
	const adapter = ((load, fetchUrl, onProgress) => {
		calls.push({ load, fetchUrl });
		onProgress?.({ phase: 'fetch', text: 'fake', ratio: 1 });
		return options.fail
			? Promise.reject(new Error('fake bring-up failed'))
			: Promise.resolve(fakeModel());
	}) as RuntimeAdapter & { calls: typeof calls };
	return Object.assign(adapter, { calls });
};

// A small catalog double: a feasible webllm model + a CPU (wllama) model whose
// runtime tests register or omit to drive the feasible / no-feasible branches.
export const FAKE_CATALOG: ModelCatalog = [
	webllmEntry({ id: 'fake-webllm-small', sizeClass: 'small', vramRequiredMB: 1000 }),
	wllamaEntry({ id: 'fake-cpu-tiny', sizeClass: 'tiny' }),
];
