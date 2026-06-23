/**
 * @file The public contract of the device-local language-model runtime.
 *
 * This module OWNS this contract and imports nothing: a consumer (aithor in
 * `embody/`, a future agent-lens in `lenses/`) imports these types and re-maps
 * them into its own vocabulary — the dependency arrow points DOWN into this
 * `lib/` module, never up, exactly as the sandbox engine's `EngineHandle` is
 * re-mapped by embody. A {@link LoadFailure} here is what a consumer's own
 * refusal (e.g. aithor's `no-model-available`) re-maps; never the reverse.
 *
 * The runtime is CODE-ORIENTED but JeJ-agnostic: it knows models, devices, and
 * inference backends, and the shape of a coding model's reply (a fenced block,
 * an optional `<think>` trace), but nothing of JeJ, the feature subset,
 * admission, or conformance. It returns code; it never judges it — validation,
 * gating, and which {@link GenerationResult} part to use are the consumer's.
 *
 * Two impure seams sit behind a pure selection core (capability match,
 * feasibility, selection, decomposition): a stateful load-once loader and a
 * non-deterministic model call. The host injects its shipped backends as an
 * {@link AdapterMap} at construction ({@link MakeLocalLlm}); there is no global.
 *
 * Vocabulary is pinned in README.md § Ubiquitous language; the refusal map in
 * README.md § Edge cases.
 */

// ─── Generation (the model's reply, decomposed) ───────────────────────────────

/**
 * The model's reply, separated into its parts by model-format — never validated,
 * gated, or cleaned. The consumer selects which part to use per use-case
 * (curated → {@link GenerationResult.code}; raw-drift → {@link GenerationResult.raw}).
 *
 * @remarks
 * - `raw` — the BYTE-EXACT, unmodified model output. Nothing here mutates it, so
 *   the consumers that want the model's drift "as-is" read this and see exactly
 *   what the model emitted.
 * - `code` — the extracted fenced code block, or — on a fence-miss — the trimmed
 *   `raw`. A best-effort, LOSSY parse (prose can be mistaken for code); gating it
 *   is the consumer's job, never this module's.
 * - `thinkTrace` — a model's `<think>` reasoning, present only when it emits one.
 */
type GenerationResult = {
	readonly raw: string;
	readonly code: string;
	readonly thinkTrace?: string;
};

// ─── Loaded model (the run surface) ───────────────────────────────────────────

/**
 * A model brought into memory: prompt in, decomposed reply out. Always local —
 * runs on the learner's device, never a remote service. Generation is not
 * reproducible (the same prompt yields different output). Sampling defaults live
 * in the adapter, per model — there is deliberately no per-call sampling override.
 *
 * NOT a run handle: a loaded model is a thing you call `generate` on, distinct
 * from the engine/embody `*Handle` family (lazy runs you iterate).
 */
type LoadedModel = {
	readonly generate: (prompt: string) => Promise<GenerationResult>;
};

// ─── Catalog (the candidate models, as data) ──────────────────────────────────

/**
 * A model's place on the size/capability spectrum. NOT embody's evaluate-tiers
 * (run / intercept / trace) — a different axis; "rung" in prose.
 */
type SizeClass = 'tiny' | 'small' | 'mid' | 'strong';

/**
 * An on-device inference backend a model can run on. Browser-first: `webllm`,
 * `transformers-js`, and `wllama` run in a tab; `mediapipe` is maintenance-only;
 * `node-llama-cpp` / `ollama` are desktop opt-ins that break the no-install
 * property. A {@link RuntimeKind} is registered only if the host ships its
 * {@link RuntimeAdapter}.
 */
type RuntimeKind =
	| 'webllm'
	| 'transformers-js'
	| 'wllama'
	| 'mediapipe'
	| 'node-llama-cpp'
	| 'ollama';

/** A transformers.js dtype selector (picks which `model_*.onnx` file is fetched). */
type TjsDtype = 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16' | 'int8' | 'bnb4';

/**
 * The per-runtime load parameters — a discriminated union on `runtime`, because
 * the kinds genuinely diverge in how a model is named and loaded (an MLC model-id
 * string vs. an HF repo + dtype vs. a GGUF repo + file vs. a `.task` URL). An
 * adapter narrows by the `runtime` discriminant.
 */
type RuntimeLoad =
	| {
			readonly runtime: 'webllm';
			readonly modelId: string;
			readonly quant: 'q4f16_1' | 'q4f32_1' | 'q0f16' | 'q0f32';
			readonly vramRequiredMB?: number;
			readonly contextWindowSize?: number;
			readonly lowResourceRequired?: boolean;
	  }
	| {
			readonly runtime: 'transformers-js';
			readonly repoId: string;
			readonly preferredDtype: TjsDtype;
			readonly availableDtypes: readonly TjsDtype[];
			/** Gemma-3-family ONNX only (onnxruntime#26732): force fp32 on WebGPU. */
			readonly forceFp32OnWebGPU?: boolean;
	  }
	| {
			readonly runtime: 'wllama';
			readonly repo: string;
			readonly file: string;
			readonly quant: string;
			/** GGUF > 2 GB: point at the `-00001-of-N` shard. */
			readonly splitFirstShard?: string;
	  }
	| {
			readonly runtime: 'mediapipe';
			readonly modelAssetPath: string;
			readonly quant: string;
			readonly deprecated: true;
	  }
	| {
			readonly runtime: 'node-llama-cpp' | 'ollama';
			readonly modelRef: string;
			readonly quant: string;
	  };

/**
 * One candidate model. The `id` is the open-string name a caller passes (the
 * catalog is data, a growing array — never an enum). `license` is PER-MODEL: a
 * family is not uniformly licensed (e.g. one Coder size is non-Apache, only one
 * Gemma generation is Apache), so it is mandatory and never inferred from
 * `family`. Each `runtimes` member binds the runtime-specific
 * {@link RuntimeLoad} to its weights URL.
 */
type ModelCatalogEntry = {
	readonly id: string;
	readonly family: string;
	readonly params: string;
	readonly sizeClass: SizeClass;
	readonly license: string;
	readonly codeSpecialized: boolean;
	readonly openWeights?: 'yes' | 'no' | 'partial';
	readonly codeCapability?: string;
	readonly runtimes: readonly {
		readonly load: RuntimeLoad;
		readonly fetchUrl: string;
		readonly notes?: string;
	}[];
	readonly sources?: readonly string[];
};

/** The open, growing set of candidate models. Data, not an enum. */
type ModelCatalog = readonly ModelCatalogEntry[];

// ─── Runtime adapters (the backend drivers) ───────────────────────────────────

/**
 * Progress for the ONE-TIME weight fetch (later loads are from cache, offline).
 * `ratio` is 0..1 when the backend reports it; `text` is a human-facing phase
 * label.
 */
type LoadProgress = {
	readonly phase: 'fetch' | 'load';
	readonly text: string;
	readonly ratio?: number;
};

/**
 * A per-runtime-kind backend driver: it turns a catalog entry's
 * {@link RuntimeLoad} into a uniform {@link LoadedModel}, reporting the one-time
 * fetch through `onProgress`. One adapter per {@link RuntimeKind}, not per model.
 * (A different sense of "adapter" than `lib/`'s shape-producing callback adapters
 * — this one drives a backend.) The host supplies the adapters it ships.
 */
type RuntimeAdapter = (
	load: RuntimeLoad,
	fetchUrl: string,
	onProgress?: (progress: LoadProgress) => void,
) => Promise<LoadedModel>;

/**
 * The host-supplied map of runtime kind → adapter, given at construction. The
 * host registers ONLY the runtimes it ships; a model whose runtimes are all
 * absent from the map is not feasible here.
 */
type AdapterMap = Partial<Record<RuntimeKind, RuntimeAdapter>>;

// ─── Device capability & selection (the pure core's inputs) ───────────────────

/**
 * A device probe result — a CONSERVATIVE HEURISTIC, not an exact resource
 * readout (the browser does not expose total VRAM). Feasibility leans on the
 * WebGPU adapter's buffer limits and a coarse memory bucket with a safety margin.
 */
type DeviceCapabilities = {
	readonly webgpu: boolean;
	readonly maxBufferBytes?: number;
	readonly maxStorageBufferBindingBytes?: number;
	/** `navigator.deviceMemory`, coarse and capped (≤ 8 GB buckets). */
	readonly deviceMemoryGB?: number;
	readonly storageQuotaBytes?: number;
	readonly wasm: {
		readonly threads: boolean;
		readonly simd: boolean;
	};
};

/** Probes the device for its {@link DeviceCapabilities}. Injectable for tests. */
type CapabilityProbe = () => Promise<DeviceCapabilities>;

/**
 * An optional caller preference over the feasible set — selection/preference
 * ONLY, never sampling. Absent, the runtime picks the cost-aware default model.
 *
 * @remarks
 * - `model` — an explicit catalog id; wins if feasible.
 * - `sizeClass` — a target/ceiling rung.
 * - `maxDownloadMB` — a download budget cap (metered connections).
 * - `prefer` — `'default'` (cost-aware balance, NOT the largest feasible),
 *   `'max'` (the ceiling the device can run), or `'min'` (the smallest).
 */
type Selection = {
	readonly model?: string;
	readonly sizeClass?: SizeClass;
	readonly maxDownloadMB?: number;
	readonly prefer?: 'default' | 'max' | 'min';
};

// ─── Load result & failure (the boundary out) ─────────────────────────────────

/**
 * Why no model could be brought up — this module's own refusal vocabulary, which
 * consumers re-map (aithor collapses both to `no-model-available`).
 *
 * @remarks
 * - `'no-feasible-model'` — selection-time (pure): no catalog entry fits the
 *   device on any registered runtime, or a named model is not feasible.
 * - `'fetch-failed'` — load-time (impure): a model's one-time weight fetch failed
 *   (network down, or a cache evicted while offline and unrefetchable).
 *
 * An UNKNOWN model name (absent from the catalog) is NOT a cause — it is a
 * programmer error and throws, never a {@link LoadFailure}.
 */
type LoadFailureCause = 'no-feasible-model' | 'fetch-failed';

/** The structured refusal: a named cause, never a half-loaded model. */
type LoadFailure = {
	readonly ok: false;
	readonly cause: LoadFailureCause;
	readonly detail?: string;
};

/**
 * A successful load. The resolved pick is always REPORTED (a heuristic default is
 * never a black box): `resolvedId` and `resolvedRuntime` name what was chosen.
 */
type LoadSuccess = {
	readonly ok: true;
	readonly model: LoadedModel;
	readonly resolvedId: string;
	readonly resolvedRuntime: RuntimeKind;
};

/**
 * What `load` resolves to. Follows the package's `ok`-boolean convention — the
 * boolean is the discriminant; `true` carries the loaded model + resolved pick,
 * `false` carries the failure cause.
 */
type LoadResult = LoadSuccess | LoadFailure;

// ─── The runtime (factory + public surface) ───────────────────────────────────

/**
 * The constructed runtime's single public surface. `feasibleModels` and
 * `recommendedModel` are the PURE selection core (sync, given capabilities);
 * `canRun` is the async probe; `load` is the async lifecycle with one caller
 * entry point (the which-model / which-runtime resolution is internal).
 *
 * `load` throws on an unknown model name (a programmer error); a device or
 * availability limit yields a {@link LoadFailure}, not a throw.
 */
type LocalLlm = {
	readonly canRun: () => Promise<DeviceCapabilities>;
	readonly feasibleModels: (
		capabilities: DeviceCapabilities,
	) => readonly ModelCatalogEntry[];
	readonly recommendedModel: (
		capabilities: DeviceCapabilities,
		selection?: Selection,
	) => ModelCatalogEntry | null;
	readonly load: (
		selection?: Selection,
		onProgress?: (progress: LoadProgress) => void,
	) => Promise<LoadResult>;
};

/**
 * Construction config. The host injects the {@link AdapterMap} it ships
 * (required); `catalog`, `capabilityProbe`, and the runtime `preference` order
 * default to the module's own (browser-first), and are injectable for tests.
 */
type LocalLlmConfig = {
	readonly adapters: AdapterMap;
	readonly catalog?: ModelCatalog;
	readonly capabilityProbe?: CapabilityProbe;
	readonly preference?: readonly RuntimeKind[];
};

/** Builds a {@link LocalLlm} from its construction config. */
type MakeLocalLlm = (config: LocalLlmConfig) => LocalLlm;

// ─── Exports ──────────────────────────────────────────────────────────────────

export type {
	GenerationResult,
	LoadedModel,
	SizeClass,
	RuntimeKind,
	TjsDtype,
	RuntimeLoad,
	ModelCatalogEntry,
	ModelCatalog,
	LoadProgress,
	RuntimeAdapter,
	AdapterMap,
	DeviceCapabilities,
	CapabilityProbe,
	Selection,
	LoadFailureCause,
	LoadFailure,
	LoadSuccess,
	LoadResult,
	LocalLlm,
	LocalLlmConfig,
	MakeLocalLlm,
};
