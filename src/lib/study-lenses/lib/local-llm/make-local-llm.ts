/**
 * @file The constructed runtime's public surface (MakeLocalLlm, types.ts) — the
 * facade that wires the pure selection core (feasibility.ts) to the impure
 * lifecycle: probe → resolve pick → bring up via the registered adapter with
 * load-once + in-flight dedup → report the resolved pick. The which-model /
 * which-runtime resolution is internal behind the one `load` verb.
 */

/* eslint-disable functional/immutable-data -- the load-once cache is this module's
   declared mutable core; every write is in this file */

import freezeInPlace from '@utils/freeze-in-place.js';

import DEFAULT_CATALOG from './catalog.js';
import selectFeasible from './feasibility.js';
import probeCapabilities from './probe-capabilities.js';
import type {
	DeviceCapabilities,
	LoadedModel,
	LoadProgress,
	LoadResult,
	LocalLlm,
	LocalLlmConfig,
	Selection,
} from './types.js';

/**
 * Builds a {@link LocalLlm} from its construction config: the host injects the
 * {@link LocalLlmConfig.adapters} it ships; `catalog`, `capabilityProbe`, and the
 * runtime `preference` order default to the module's own (browser-first).
 *
 * @param config - The construction config.
 * @returns The constructed runtime surface (deep-frozen).
 */
export default function makeLocalLlm(config: LocalLlmConfig): LocalLlm {
	const {
		adapters,
		catalog = DEFAULT_CATALOG,
		capabilityProbe = probeCapabilities,
		preference,
	} = config;

	// SEAM 1: the load-once cache — one in-flight/settled bring-up per resolved id.
	// Caching the PROMISE (not the model) is what lets concurrent loads share one
	// bring-up; a rejected promise is evicted (catch, below) so a retry re-attempts.
	const cache = new Map<string, Promise<LoadedModel>>();

	// The pure selection core backs all three reader needs; omit the optional keys
	// when absent (exactOptionalPropertyTypes), so `preference` undefined falls
	// through to feasibility's own browser-first default (one source of truth).
	function select(capabilities: DeviceCapabilities, selection?: Selection) {
		return selectFeasible({
			catalog,
			capabilities,
			adapters,
			...(preference === undefined ? {} : { preference }),
			...(selection === undefined ? {} : { selection }),
		});
	}

	async function load(
		selection?: Selection,
		onProgress?: (progress: LoadProgress) => void,
	): Promise<LoadResult> {
		const capabilities = await capabilityProbe();
		// Throws on an unknown model name — a programmer error, deliberately NOT
		// inside the try below (an unknown name is never a returned LoadFailure).
		const { chosen, chosenRuntime } = select(capabilities, selection);
		if (chosen === null || chosenRuntime === null) {
			return freezeInPlace({ ok: false, cause: 'no-feasible-model' });
		}

		const member = chosen.runtimes.find(
			(option) => option.load.runtime === chosenRuntime,
		);
		const adapter = adapters[chosenRuntime];
		if (member === undefined || adapter === undefined) {
			// Unreachable: selectFeasible only resolves a runtime present in BOTH the
			// entry and the adapter map. Guard satisfies the types and surfaces a
			// broken invariant loudly rather than bringing up the wrong model.
			throw new Error(
				`makeLocalLlm: resolved runtime "${chosenRuntime}" has no member/adapter for "${chosen.id}"`,
			);
		}

		const inFlight = cache.get(chosen.id);
		const bringUp =
			inFlight ?? adapter(member.load, member.fetchUrl, onProgress);
		if (inFlight === undefined) cache.set(chosen.id, bringUp);

		try {
			const model = await bringUp;
			return freezeInPlace({
				ok: true,
				model,
				resolvedId: chosen.id,
				resolvedRuntime: chosenRuntime,
			});
		} catch {
			// Not memoized — drop the failed promise so a retry re-attempts the fetch.
			// Delete only if the cache still holds THIS promise: a late joiner of a
			// failed bring-up must not evict a fresh retry already in flight.
			if (cache.get(chosen.id) === bringUp) cache.delete(chosen.id);
			return freezeInPlace({ ok: false, cause: 'fetch-failed' });
		}
	}

	// freezeInPlace freezes only the returned surface; the cache Map lives in the
	// closure (unreachable here), so the load-once state stays mutable by design.
	return freezeInPlace({
		canRun: capabilityProbe,
		feasibleModels: (capabilities: DeviceCapabilities) =>
			select(capabilities).feasible,
		recommendedModel: (
			capabilities: DeviceCapabilities,
			selection?: Selection,
		) => select(capabilities, selection).chosen,
		load,
	});
}
