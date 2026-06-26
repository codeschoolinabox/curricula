/**
 * @file The pure selection core (DOCS § Execution phases, phase 2): narrow the
 * catalog by device capabilities and the registered adapter map, then pick — an
 * explicit named model if feasible, else the cost-aware default rung. No I/O, no
 * model. One call backs all three reader needs: the feasible set
 * (LocalLlm.feasibleModels), the chosen entry (LocalLlm.recommendedModel), and
 * the loader's pick + resolved runtime (LocalLlm.load).
 */

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

/** The selection core's result — the feasible set, the chosen entry, and its resolved runtime (null iff none chosen). */
type FeasibilityResult = {
	readonly feasible: readonly ModelCatalogEntry[];
	readonly chosen: ModelCatalogEntry | null;
	readonly chosenRuntime: RuntimeKind | null;
};

/** A feasible entry paired with the runtime it resolved to (browser-first). */
type Pick = {
	readonly entry: ModelCatalogEntry;
	readonly runtime: RuntimeKind;
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
	});
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
		// Gate on the probed WebGPU buffer limits (DOCS § "Feasibility consumes the
		// probed buffer limits"): a device whose binding/buffer limit is below the
		// model's derived need is refused HERE, at pre-flight, rather than failing
		// mid-bring-up. Sits after the webgpu presence guard, so an undefined limit
		// only ever means "WebGPU present, limit unreported" (a probe gap → admit).
		if (!meetsBufferLimits(load, capabilities)) return false;
		if (load.vramRequiredMB !== undefined) {
			const budgetMB =
				HALF * (capabilities.deviceMemoryGB ?? DEFAULT_MEMORY_GB) * MB_PER_GB;
			return load.vramRequiredMB <= budgetMB;
		}
		return fitsCpuSizeClass(entry.sizeClass);
	}
	// Non-webllm (CPU/WASM) runtimes carry no webgpu requirement — a tiny/small
	// model still loads (DOCS § "No-WebGPU is not an automatic refusal").
	return fitsCpuSizeClass(entry.sizeClass);
}

/**
 * Whether the device's probed WebGPU buffer limits clear the model's derived
 * binding need. Both limits gate (DOCS § "Feasibility consumes the probed buffer
 * limits"); each is undefined-admit (a probe gap must not over-refuse a capable
 * device). The need is DERIVED from `vramRequiredMB` — the contract carries no
 * exact per-model buffer requirement, so this is a conservative heuristic — clamped
 * to the 128 MiB WebGPU spec floor so a value-less or tiny model is never wrongly
 * refused. The binding limit is the effective gate (a storage binding can never
 * exceed its buffer, so `maxStorageBufferBindingBytes ≤ maxBufferBytes` always); the
 * buffer-size leg is the DOCS-named second gate.
 */
function meetsBufferLimits(
	load: Extract<RuntimeLoad, { runtime: 'webllm' }>,
	capabilities: DeviceCapabilities,
): boolean {
	const required =
		load.vramRequiredMB === undefined
			? WEBGPU_MIN_BINDING_BYTES
			: Math.max(
					WEBGPU_MIN_BINDING_BYTES,
					load.vramRequiredMB * BYTES_PER_MB * VRAM_TO_BINDING_RATIO,
				);
	const { maxStorageBufferBindingBytes, maxBufferBytes } = capabilities;
	if (
		maxStorageBufferBindingBytes !== undefined &&
		maxStorageBufferBindingBytes < required
	) {
		return false;
	}
	return maxBufferBytes === undefined || maxBufferBytes >= required;
}

/** Whether the device advertises every WebGPU feature the load requires (no requirement ⇒ yes). */
function hasRequiredFeatures(
	required: readonly string[] | undefined,
	advertised: readonly string[] | undefined,
): boolean {
	if (required === undefined || required.length === 0) return true;
	const available = advertised ?? [];
	return required.every((feature) => available.includes(feature));
}

function fitsCpuSizeClass(sizeClass: SizeClass): boolean {
	return SIZE_RANK[sizeClass] <= SIZE_RANK[MAX_CPU_SIZE_CLASS];
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
const BYTES_PER_MB = 1024 * 1024;
// The WebGPU spec minimum maxStorageBufferBindingSize (128 MiB) — the floor a
// limited device (Firefox/Android) pins to. A model never needs LESS than this.
const WEBGPU_MIN_BINDING_BYTES = 134_217_728;
// Conservative VRAM→binding ratio: published WebLLM per-model bindings run
// ~0.13–0.27× VRAM, so 0.30 never UNDER-requires (which would re-admit a device
// that then fails mid-bring-up). A heuristic, not WebLLM's exact value.
const VRAM_TO_BINDING_RATIO = 0.3;
