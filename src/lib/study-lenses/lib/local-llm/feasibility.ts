/**
 * @file The pure selection core (DOCS § Execution phases, phase 2): narrow the
 * catalog by device capabilities and the registered adapter map, then pick — an
 * explicit named model if feasible, else the cost-aware default rung. No I/O, no
 * model. One call backs all three reader needs: the feasible set
 * (LocalLlm.feasibleModels), the chosen entry (LocalLlm.recommendedModel), and
 * the loader's pick + resolved runtime (LocalLlm.load).
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type {
	AdapterMap,
	DeviceCapabilities,
	ModelCatalog,
	ModelCatalogEntry,
	RuntimeKind,
	RuntimeLoad,
	Selection,
	SizeClass,
} from './types.js';

/** The selection core's input — capabilities + catalog + registered adapters + optional preference/selection. */
type FeasibilityInput = {
	readonly catalog: ModelCatalog;
	readonly capabilities: DeviceCapabilities;
	readonly adapters: AdapterMap;
	readonly preference?: readonly RuntimeKind[];
	readonly selection?: Selection;
};

/** The selection core's result — the feasible set, the chosen entry + its resolved runtime (null iff none chosen), and a per-entry rejection diagnosis. */
type FeasibilityResult = {
	readonly feasible: readonly ModelCatalogEntry[];
	readonly chosen: ModelCatalogEntry | null;
	readonly chosenRuntime: RuntimeKind | null;
	readonly rejections: readonly EntryRejection[];
};

/** A feasible entry paired with the runtime it resolved to (browser-first). */
type Pick = {
	readonly entry: ModelCatalogEntry;
	readonly runtime: RuntimeKind;
};

/**
 * Why one catalog entry is NOT feasible — a structured per-runtime gate failure so
 * a consumer can compose an honest diagnosis. DIAGNOSTIC (read by the no-feasible
 * `detail` and a future debug/instructor view), never a gate.
 */
type RejectionReason =
	| { readonly kind: 'no-webgpu' }
	| { readonly kind: 'missing-feature'; readonly missing: readonly string[] }
	| {
			readonly kind: 'vram-too-large';
			readonly requiredMB: number;
			readonly budgetMB: number;
	  }
	| {
			readonly kind: 'size-class-too-large';
			readonly sizeClass: SizeClass;
			readonly maxCpu: SizeClass;
	  }
	| { readonly kind: 'no-adapter'; readonly runtime: RuntimeKind };

/** One rejected catalog entry and every reason it failed (one per declared runtime). */
type EntryRejection = {
	readonly id: string;
	readonly reasons: readonly RejectionReason[];
};

/**
 * Resolves the feasible set and the cost-aware pick for a device.
 *
 * @param input - Catalog, capabilities, registered adapters, optional preference + selection.
 * @returns A frozen {@link FeasibilityResult}.
 * @throws If `selection.model` is a non-empty id absent from the catalog (a
 *   programmer error), evaluated before any feasibility reasoning.
 */
export default function selectFeasible(
	input: FeasibilityInput,
): FeasibilityResult {
	const {
		catalog,
		capabilities,
		adapters,
		preference = DEFAULT_PREFERENCE,
		selection = {},
	} = input;

	// 1. Membership precondition — fail loud BEFORE any feasibility reasoning, so
	//    a typo never masquerades as "your device can't run it".
	const named = selection.model;
	if (isNamed(named) && !catalog.some((entry) => entry.id === named)) {
		throw new Error(
			`selectFeasible: unknown model id "${named}" (not in the catalog)`,
		);
	}

	// 2. Narrow to entries feasible on a registered runtime, resolving each to its
	//    runtime (browser-first). The webgpu gate lives inside the webllm branch.
	const picks = catalog
		.map((entry) => ({
			entry,
			runtime: resolveRuntime(entry, capabilities, adapters, preference),
		}))
		.filter((pick): pick is Pick => pick.runtime !== null);

	// 3. Pick — an explicit feasible model, else the policy default over the
	//    candidates the selection constraints allow.
	const chosen = choosePick(picks, selection);

	// Freeze only what this function OWNS — the wrapper and the feasible array.
	// The entries are the caller's catalog data (readonly by contract); deep-
	// freezing them (freezeInPlace) would mutate caller-owned objects.
	return Object.freeze({
		feasible: Object.freeze(picks.map((pick) => pick.entry)),
		chosen: chosen === null ? null : chosen.entry,
		chosenRuntime: chosen === null ? null : chosen.runtime,
		rejections: diagnoseRejections(catalog, picks, capabilities, adapters),
	});
}

/** The per-entry rejection diagnosis: every catalog entry NOT in `feasible`, with the reason each declared runtime failed. Diagnostic (DOCS), never a gate. */
function diagnoseRejections(
	catalog: ModelCatalog,
	picks: readonly Pick[],
	capabilities: DeviceCapabilities,
	adapters: AdapterMap,
): readonly EntryRejection[] {
	const feasible = new Set(picks.map((pick) => pick.entry));
	// Deep-freeze: rejections are entirely own data (constructed ids + reason
	// objects), NOT the caller-owned `feasible` entries — so freezeInPlace is safe.
	return freezeInPlace(
		catalog
			.filter((entry) => !feasible.has(entry))
			.map((entry) => ({
				id: entry.id,
				reasons: rejectionReasons(entry, capabilities, adapters),
			})),
	);
}

/** Why a rejected entry failed — one structured reason per declared runtime, in declared order. */
function rejectionReasons(
	entry: ModelCatalogEntry,
	capabilities: DeviceCapabilities,
	adapters: AdapterMap,
): readonly RejectionReason[] {
	return entry.runtimes.map((member) =>
		runtimeRejection(member.load, entry, capabilities, adapters),
	);
}

/** The single gate a runtime member failed (precondition: a member of a REJECTED entry, so it IS infeasible). */
function runtimeRejection(
	load: RuntimeLoad,
	entry: ModelCatalogEntry,
	capabilities: DeviceCapabilities,
	adapters: AdapterMap,
): RejectionReason {
	if (adapters[load.runtime] === undefined) {
		return { kind: 'no-adapter', runtime: load.runtime };
	}
	if (load.runtime === 'webllm') {
		if (!capabilities.webgpu) return { kind: 'no-webgpu' };
		const missing = missingFeatures(
			load.requiredFeatures,
			capabilities.webgpuFeatures,
		);
		if (missing.length > 0) return { kind: 'missing-feature', missing };
		const budgetMB = vramBudgetMB(capabilities);
		if (load.vramRequiredMB !== undefined && load.vramRequiredMB > budgetMB) {
			return {
				kind: 'vram-too-large',
				requiredMB: load.vramRequiredMB,
				budgetMB,
			};
		}
	}
	// CPU/WASM, or a webllm member with no declared vram (its absence falls through
	// to the size-class gate) — for a REJECTED entry the size class must exceed the
	// CPU/WASM ceiling (a vram-fitting webllm member would be feasible, never here).
	return {
		kind: 'size-class-too-large',
		sizeClass: entry.sizeClass,
		maxCpu: MAX_CPU_SIZE_CLASS,
	};
}

function isNamed(model: string | undefined): model is string {
	return model !== undefined && model !== '';
}

/** The first registered + feasible runtime for an entry (preference order), or null. */
function resolveRuntime(
	entry: ModelCatalogEntry,
	capabilities: DeviceCapabilities,
	adapters: AdapterMap,
	preference: readonly RuntimeKind[],
): RuntimeKind | null {
	const kinds = entry.runtimes
		.filter((member) => adapters[member.load.runtime] !== undefined)
		.filter((member) => isLoadFeasible(member.load, entry, capabilities))
		.map((member) => member.load.runtime);

	const preferred = preference.find((kind) => kinds.includes(kind));
	if (preferred !== undefined) return preferred;
	return kinds.length > 0 ? kinds[0] : null;
}

/** Whether a single runtime can bring an entry up on this device. */
function isLoadFeasible(
	load: RuntimeLoad,
	entry: ModelCatalogEntry,
	capabilities: DeviceCapabilities,
): boolean {
	if (load.runtime === 'webllm') {
		if (!capabilities.webgpu) return false;
		// Feature gate AFTER the presence guard: a model whose required WebGPU
		// features the adapter does not advertise is refused up front.
		if (
			!hasRequiredFeatures(load.requiredFeatures, capabilities.webgpuFeatures)
		) {
			return false;
		}
		// Buffer limits do NOT gate (DOCS § "The probed buffer limits are diagnostic,
		// not a feasibility gate"): WebLLM exposes no per-model binding requirement and
		// tries-warns-falls-back, so a binding-limited device is caught at bring-up by
		// the chain, not pre-refused here. The webllm gates are presence + advertised
		// features (above) + the system-RAM budget below — a coarse admission filter.
		if (load.vramRequiredMB !== undefined) {
			return load.vramRequiredMB <= vramBudgetMB(capabilities);
		}
		return fitsCpuSizeClass(entry.sizeClass);
	}
	// Non-webllm (CPU/WASM) runtimes carry no webgpu requirement — a tiny/small
	// model still loads (DOCS § "No-WebGPU is not an automatic refusal").
	return fitsCpuSizeClass(entry.sizeClass);
}

/** Whether the device advertises every WebGPU feature the load requires (no requirement ⇒ yes). */
function hasRequiredFeatures(
	required: readonly string[] | undefined,
	advertised: readonly string[] | undefined,
): boolean {
	return missingFeatures(required, advertised).length === 0;
}

/** The WebGPU features a load requires that the device does NOT advertise (empty ⇒ all present). */
function missingFeatures(
	required: readonly string[] | undefined,
	advertised: readonly string[] | undefined,
): readonly string[] {
	if (required === undefined) return [];
	const available = advertised ?? [];
	return required.filter((feature) => !available.includes(feature));
}

function fitsCpuSizeClass(sizeClass: SizeClass): boolean {
	return SIZE_RANK[sizeClass] <= SIZE_RANK[MAX_CPU_SIZE_CLASS];
}

/** The webllm VRAM budget for a device — half the (capped) system-RAM bucket, in MB. */
function vramBudgetMB(capabilities: DeviceCapabilities): number {
	return HALF * (capabilities.deviceMemoryGB ?? DEFAULT_MEMORY_GB) * MB_PER_GB;
}

/** Applies the selection over the feasible picks: explicit model, else policy. */
function choosePick(picks: readonly Pick[], selection: Selection): Pick | null {
	if (picks.length === 0) return null;

	// An explicit named model wins if feasible (membership already enforced);
	// present-but-infeasible resolves to null, never a throw.
	if (isNamed(selection.model)) {
		return picks.find((pick) => pick.entry.id === selection.model) ?? null;
	}

	// Honor the sizeClass ceiling (the prefer policy then picks within it).
	const ceiling = selection.sizeClass;
	const candidates =
		ceiling === undefined
			? picks
			: picks.filter(
					(pick) => SIZE_RANK[pick.entry.sizeClass] <= SIZE_RANK[ceiling],
				);
	if (candidates.length === 0) return null;

	return pickByPolicy(candidates, selection.prefer ?? 'default');
}

function pickByPolicy(
	candidates: readonly Pick[],
	prefer: NonNullable<Selection['prefer']>,
): Pick {
	if (prefer === 'max') return pickBest(candidates, isBetterMax);
	if (prefer === 'min') return pickBest(candidates, isBetterMin);
	return pickDefault(candidates);
}

/** Cost-aware: the largest rung within the cost ceiling; the cheapest if none fit it. */
function pickDefault(candidates: readonly Pick[]): Pick {
	const affordable = candidates.filter(
		(pick) => vramOf(pick) <= DEFAULT_VRAM_CEILING_MB,
	);
	// Within the ceiling, take the largest rung; if NOTHING fits the ceiling, fall
	// back to the cheapest — a heavier model stays an explicit opt-in, never the
	// silent default (README § Default model).
	if (affordable.length > 0) return pickBest(affordable, isBetterDefault);
	return pickBest(candidates, isBetterMin);
}

/** The single best pick by a comparator (total down to an id tiebreak → order-independent). Callers guarantee a non-empty pool. */
function pickBest(
	candidates: readonly Pick[],
	isBetter: (pick: Pick, best: Pick) => boolean,
): Pick {
	let best = candidates[0];
	for (const pick of candidates) {
		if (isBetter(pick, best)) {
			best = pick;
		}
	}
	return best;
}

function isBetterDefault(pick: Pick, best: Pick): boolean {
	const byRank =
		SIZE_RANK[pick.entry.sizeClass] - SIZE_RANK[best.entry.sizeClass];
	if (byRank !== 0) return byRank > 0;
	if (pick.entry.codeSpecialized !== best.entry.codeSpecialized) {
		return pick.entry.codeSpecialized;
	}
	const byVram = vramOf(pick) - vramOf(best);
	if (byVram !== 0) return byVram < 0;
	return pick.entry.id.localeCompare(best.entry.id, 'en-US') < 0;
}

function isBetterMax(pick: Pick, best: Pick): boolean {
	const byRank =
		SIZE_RANK[pick.entry.sizeClass] - SIZE_RANK[best.entry.sizeClass];
	if (byRank !== 0) return byRank > 0;
	const byVram = vramOf(pick) - vramOf(best);
	if (byVram !== 0) return byVram > 0;
	return pick.entry.id.localeCompare(best.entry.id, 'en-US') < 0;
}

function isBetterMin(pick: Pick, best: Pick): boolean {
	const byRank =
		SIZE_RANK[pick.entry.sizeClass] - SIZE_RANK[best.entry.sizeClass];
	if (byRank !== 0) return byRank < 0;
	const byVram = vramOf(pick) - vramOf(best);
	if (byVram !== 0) return byVram < 0;
	return pick.entry.id.localeCompare(best.entry.id, 'en-US') < 0;
}

/** The resolved runtime's declared VRAM, or 0 when none is declared. */
function vramOf(pick: Pick): number {
	const load = pick.entry.runtimes.find(
		(m) => m.load.runtime === pick.runtime,
	)?.load;
	if (load?.runtime === 'webllm' && load.vramRequiredMB !== undefined) {
		return load.vramRequiredMB;
	}
	return 0;
}

const DEFAULT_PREFERENCE: readonly RuntimeKind[] = [
	'webllm',
	'transformers-js',
	'wllama',
	'mediapipe',
	'node-llama-cpp',
	'ollama',
];
const SIZE_RANK: Record<SizeClass, number> = {
	tiny: 0,
	small: 1,
	mid: 2,
	strong: 3,
};
const MAX_CPU_SIZE_CLASS: SizeClass = 'small';
const HALF = 0.5;
const MB_PER_GB = 1024;
const DEFAULT_MEMORY_GB = 4;
const DEFAULT_VRAM_CEILING_MB = 2048;
