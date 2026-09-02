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
 * Domain failure is a value on both verbs; rejections are reserved for
 * infrastructure faults (human ruling 2026-08-26): `load` returns a
 * {@link LoadFailure} — `unknown-model` included — and `generate` returns a
 * {@link GenerationFailure} — `aborted` included; a rejected
 * {@link CapabilityProbe} still rejects. The loaded model a consumer receives
 * is the module's own wrapper over the adapter's {@link AdapterModel}: the
 * wrapper settles pre-aborted calls before the adapter is engaged and
 * classifies escaped faults into the failure vocabulary.
 *
 * Vocabulary is pinned in README.md § Ubiquitous language; the refusal map in
 * README.md § Edge cases.
 */

// ─── Generation (the model's reply, decomposed) ───────────────────────────────

/**
 * The model's reply on success, separated into its parts by model-format —
 * never validated, gated, or cleaned. The consumer selects which part to use
 * per use-case
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

/**
 * Why one generation produced nothing — the generation-failure vocabulary
 * (human ruling 2026-08-26). Small on purpose: one call, one outcome — no
 * attempts ledger, no retry (a repair loop is the consumer's).
 *
 * @remarks
 * - `'aborted'` — the call's own {@link GenerateOptions.signal} fired, at any
 *   timing: already aborted at call time (the adapter is never engaged),
 *   mid-generation (partial text is discarded), or after settlement (a no-op).
 *   Deliberately bare — no `detail`; the aborter already knows why. The loaded
 *   model STAYS USABLE: the next `generate` proceeds normally.
 * - `'device-lost'` — the GPU dropped mid-generation. Named honestly, never
 *   recovered; the loaded model may be unusable afterwards. Same spelling as
 *   the load-side {@link AttemptCause} member, which is per-candidate
 *   diagnostic there and never load-terminal; it is a consumer-facing cause
 *   only here.
 * - `'generation-failed'` — any other backend fault; the undiscriminated
 *   consumer-facing cause (the load ledger's `'unknown'` belongs to the
 *   diagnostic vocabulary).
 */
type GenerationFailureCause = 'aborted' | 'device-lost' | 'generation-failed';

/**
 * The typed refusal of one generation — a value, never a rejection. `aborted`
 * carries no `detail` by design; the other two may carry a diagnostic one.
 */
type GenerationFailure =
	| {
			readonly ok: false;
			readonly cause: 'aborted';
	  }
	| {
			readonly ok: false;
			readonly cause: Exclude<GenerationFailureCause, 'aborted'>;
			readonly detail?: string;
	  };

/** A successful generation: the decomposed {@link GenerationResult}. */
type GenerationSuccess = {
	readonly ok: true;
	readonly result: GenerationResult;
};

/**
 * What one `generate` call resolves to — always a value; `ok` is the
 * discriminant, true exactly on the result (human ruling 2026-08-26). NOT the
 * region's `*Outcome` string unions (the engine's `SettlementOutcome`, the
 * evaluators' `EvaluationOutcome`), which name how a run ended — here the
 * outcome is the whole returned value.
 */
type GenerationOutcome = GenerationSuccess | GenerationFailure;

/** Per-call options. `signal` is the cancellation seam — see {@link LoadedModel}. */
type GenerateOptions = {
	readonly signal?: AbortSignal;
};

// ─── Loaded model (the run surface) ───────────────────────────────────────────

/**
 * A model brought into memory: prompt in, one typed outcome out. Always local —
 * runs on the learner's device, never a remote service. Generation is not
 * reproducible (the same prompt yields different output). Sampling defaults live
 * in the adapter, per model — there is deliberately no per-call sampling override.
 *
 * SHARED: every caller that resolves the same catalog id on one constructed
 * runtime receives the same instance, so ONE GENERATION AT A TIME per loaded
 * model (human ruling 2026-08-26) binds across all holders; until the deferred
 * queue exists, serializing is the consumer side's. `generate` answers once —
 * no outward stream (human ruling 2026-08-26). An abort at any timing leaves
 * the model usable. This surface is the module's own wrapper over the
 * adapter's {@link AdapterModel}: pre-aborted calls settle without engaging
 * the adapter, and escaped faults are classified into
 * {@link GenerationFailure}.
 *
 * NOT a run handle: a loaded model is a thing you call `generate` on, distinct
 * from the engine/embody `*Handle` family (lazy runs you iterate).
 */
type LoadedModel = {
	readonly generate: (
		prompt: string,
		options?: GenerateOptions,
	) => Promise<GenerationOutcome>;
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
			/**
			 * WebGPU features this model REQUIRES to load (e.g. `'shader-f16'`).
			 * Feasibility refuses the model on a device whose adapter does not
			 * advertise all of them (see {@link DeviceCapabilities.webgpuFeatures}) —
			 * a conservative gate, so an incompatible device is refused up front
			 * rather than failing mid-bring-up. Matched case-sensitively, so use the
			 * WebGPU spec's lower-case feature names.
			 */
			readonly requiredFeatures?: readonly string[];
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
 * What a {@link RuntimeAdapter} produces: the backend-facing generate seam the
 * module wraps into the public {@link LoadedModel}. The adapter resolves the
 * RAW decomposed result and lets faults escape as rejections — outcome
 * construction (the `ok` union, abort settlement, fault classification) is the
 * wrapper's, the generation-side sibling of the load chain's error
 * classification. For every call that reaches it, the adapter's obligations
 * (README § Ubiquitous language, Runtime adapter): honor the signal as soon as
 * its backend allows; an abort ends only that call; the model stays usable at
 * ANY abort timing.
 */
type AdapterModel = {
	readonly generate: (
		prompt: string,
		signal?: AbortSignal,
	) => Promise<GenerationResult>;
};

/**
 * A per-runtime-kind backend driver: it turns a catalog entry's
 * {@link RuntimeLoad} into a uniform {@link AdapterModel} — which the module
 * wraps into the public {@link LoadedModel} — reporting the one-time
 * fetch through `onProgress`. One adapter per {@link RuntimeKind}, not per model.
 * (A different sense of "adapter" than `lib/`'s shape-producing callback adapters
 * — this one drives a backend.) The host supplies the adapters it ships.
 */
type RuntimeAdapter = (
	load: RuntimeLoad,
	fetchUrl: string,
	onProgress?: (progress: LoadProgress) => void,
) => Promise<AdapterModel>;

/**
 * The host-supplied map of runtime kind → adapter, given at construction. The
 * host registers ONLY the runtimes it ships; a model whose runtimes are all
 * absent from the map is not feasible here.
 */
type AdapterMap = Partial<Record<RuntimeKind, RuntimeAdapter>>;

// ─── Device capability & selection (the pure core's inputs) ───────────────────

/**
 * A device probe result — a CONSERVATIVE HEURISTIC, not an exact resource
 * readout (the browser does not expose total VRAM). Feasibility is a COARSE
 * ADMISSION FILTER: WebGPU presence, the WebGPU features a model advertises, and a
 * coarse SYSTEM-RAM bucket (`navigator.deviceMemory`, not a VRAM readout) with a
 * safety margin. The probed buffer limits (`maxBufferBytes` /
 * `maxStorageBufferBindingBytes`) are DIAGNOSTIC, not a gate — there is no binding
 * per-model buffer requirement, so a binding-limited device is caught at bring-up
 * and descended, not pre-refused; the limits inform `canRun` and a failure's `detail`.
 */
type DeviceCapabilities = {
	readonly webgpu: boolean;
	readonly maxBufferBytes?: number;
	readonly maxStorageBufferBindingBytes?: number;
	/**
	 * The WebGPU features the adapter advertises (e.g. `'shader-f16'`). Feasibility
	 * checks a model's {@link RuntimeLoad} `requiredFeatures` against this set;
	 * absent/empty means none were detected (no WebGPU, or none reported).
	 *
	 * An open `string[]`, not a closed union — WebGPU's feature set grows, and the
	 * catalog is data, not an enum; locking it would foreclose new features the way
	 * an enum would foreclose the catalog.
	 */
	readonly webgpuFeatures?: readonly string[];
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
 * - `prefer` — `'default'` (cost-aware balance, NOT the largest feasible),
 *   `'max'` (the ceiling the device can run), or `'min'` (the smallest).
 */
type Selection = {
	readonly model?: string;
	readonly sizeClass?: SizeClass;
	readonly prefer?: 'default' | 'max' | 'min';
};

// ─── Load result & failure (the boundary out) ─────────────────────────────────

/**
 * Why no model could be brought up — this module's own refusal vocabulary, which
 * consumers re-map (aithor collapses every cause to `no-model-available`, then
 * derives an actionable next step). `load` tries a CHAIN of feasible
 * `(model, runtime)` candidates; a cause is either **pre-flight** (the chain never
 * ran) or **post-flight** (a candidate was attempted and failed) — see
 * {@link LoadFailure}. Causes are **delivery-agnostic**: a cause names a device or
 * availability limit, never a product or a "download the app" string — the
 * consumer owns that mapping.
 *
 * @remarks
 * - `'no-feasible-model'` — **pre-flight** (selection-time, pure): zero feasible
 *   candidates — no catalog entry is admitted by the coarse feasibility filter on
 *   any registered runtime (no WebGPU; or no model whose advertised features and
 *   memory budget fit; or no CPU/WASM candidate; or a named model not feasible).
 *   The pre-flight gate can surface this BEFORE any bring-up. Terminal — the
 *   consumer recommends a native runtime.
 * - `'unknown-model'` — **pre-flight** (selection-time, pure): the requested
 *   name is absent from the catalog. Its own cause, kept distinct so a typo
 *   never masquerades as a device limit — a returned refusal, no longer a
 *   throw (human ruling 2026-08-26). An EMPTY name is not unknown: it is the
 *   pick-for-me request.
 * - `'all-candidates-exhausted'` — **post-flight** terminal: feasible candidates
 *   existed but every one failed bring-up with mixed/device causes. Only knowable
 *   AFTER attempting (not pre-flight-surfaceable). Terminal — the consumer
 *   recommends a native runtime.
 * - `'fetch-failed'` — **post-flight**: a candidate's one-time weight fetch failed
 *   reachable-but-failed (network). Retriable; the terminal cause when every
 *   candidate failed this way.
 * - `'storage-quota'` — **post-flight**: a candidate's weights could not be cached
 *   (capacity). The actionable next step is freeing disk space.
 * - `'cache-evicted'` — **post-flight**: a previously-cached candidate was evicted
 *   and cannot be refetched offline. The next step is reconnecting (or a native
 *   runtime for durable offline).
 *
 * `'device-lost'` is NOT a load-terminal cause: a GPU dropping during bring-up
 * is recorded per-candidate in the diagnostic {@link LoadAttempt.cause} and
 * folds to `'all-candidates-exhausted'`. (At generation time it IS a
 * consumer-facing cause — {@link GenerationFailureCause}.)
 */
type LoadFailureCause =
	| 'no-feasible-model'
	| 'unknown-model'
	| 'all-candidates-exhausted'
	| 'fetch-failed'
	| 'storage-quota'
	| 'cache-evicted';

/**
 * The cause vocabulary for ONE candidate's failed bring-up — a DIAGNOSTIC ledger
 * cause, deliberately richer than the consumer-facing {@link LoadFailureCause}: it
 * names `'device-lost'` (GPU dropped during bring-up) and `'unknown'`
 * (undiscriminated) honestly per-attempt without bloating the public terminal
 * vocabulary. The chain promotes a terminal {@link LoadFailureCause} from these by
 * precedence; the richer set rides the returned failure's diagnostic ledger —
 * visible there, but never terminal, and the consumer relay reads only
 * {@link LoadFailure.cause}.
 */
type AttemptCause =
	| 'fetch-failed'
	| 'storage-quota'
	| 'cache-evicted'
	| 'device-lost'
	| 'unknown';

/**
 * One candidate's bring-up outcome in the fallback chain — the honest per-attempt
 * ledger entry. DIAGNOSTIC: read by tests and a future debug/instructor view, NOT
 * by the consumer relay (which reads only the terminal {@link LoadFailure.cause}).
 */
type LoadAttempt = {
	readonly id: string;
	readonly runtime: RuntimeKind;
	readonly cause: AttemptCause;
	readonly detail?: string;
};

/**
 * The structured refusal: a named cause, never a half-loaded model. A pre-flight /
 * post-flight discriminated union on `cause` — `'no-feasible-model'` and
 * `'unknown-model'` are the two pre-flight causes (the chain never ran, so
 * there are no attempts); every other cause is **post-flight** and carries a
 * NON-EMPTY `attempts` ledger (≥1 candidate was tried and failed). The
 * non-empty tuple makes an empty ledger on a post-flight failure a compile
 * error — the contract's forcing function for the TDD chain. `detail` is a
 * human-readable message (dev/log/instructor-facing, and the only failure
 * field a string-only seam can carry); the structured `attempts` ledger is
 * diagnostic.
 */
type LoadFailure =
	| {
			readonly ok: false;
			readonly cause: 'no-feasible-model' | 'unknown-model';
			readonly detail?: string;
	  }
	| {
			readonly ok: false;
			readonly cause: Exclude<
				LoadFailureCause,
				'no-feasible-model' | 'unknown-model'
			>;
			readonly detail?: string;
			readonly attempts: readonly [LoadAttempt, ...LoadAttempt[]];
	  };

/**
 * A successful load. The resolved pick is always REPORTED (a heuristic default is
 * never a black box): `resolvedId` and `resolvedRuntime` name what was chosen —
 * the WINNING candidate of the fallback chain. `resolvedId` stays honest across a
 * runtime switch by construction: each `(model, runtime, quant)` build is its own
 * catalog entry with its own id (the shared `family` field groups builds of one
 * model), so a chain that descends or switches runtime reports the artifact that
 * actually ran, never the requested one.
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
 * Domain failure is a value on both verbs (human ruling 2026-08-26): an
 * unknown model name yields the pre-flight `unknown-model` {@link LoadFailure}
 * — no longer a throw — and a device or availability limit yields its own
 * cause. A rejected {@link CapabilityProbe} still propagates as a rejection —
 * a broken probe is an infrastructure fault, not a refusal; `canRun` exposes
 * the probe directly and rejects on the same fault.
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
	GenerationFailureCause,
	GenerationFailure,
	GenerationSuccess,
	GenerationOutcome,
	GenerateOptions,
	LoadedModel,
	AdapterModel,
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
	AttemptCause,
	LoadAttempt,
	LoadFailure,
	LoadSuccess,
	LoadResult,
	LocalLlm,
	LocalLlmConfig,
	MakeLocalLlm,
};
