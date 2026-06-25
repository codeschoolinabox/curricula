/**
 * @file The default-runtime factory (Phase-1 wiring) — a thin construction over
 * the real local-llm runtime, producing the {@link AithorRuntime} seam `aithor`
 * injects.
 *
 * @remarks
 * local-llm requires the host to register the backends it ships (there is no
 * default `AdapterMap`, and aithor bundles no backend of its own), so this factory
 * takes a HOST-SUPPLIED `AdapterMap`, constructs `makeLocalLlm` with that map AND
 * the catalog aithor holds, and wires {@link makeLoadModel} with the SAME catalog
 * instance — so the loader's membership pre-check and the runtime's feasibility
 * agree by construction (local-llm exposes no membership predicate; identity of
 * the catalog is what makes them agree). The catalog defaults to local-llm's
 * `DEFAULT_CATALOG`, resolved ONCE here and passed to both.
 *
 * `AithorRuntimeConfig` mirrors `LocalLlmConfig`'s fields but is its OWN type —
 * this factory returns an `AithorRuntime` (`{ loadModel }`), not a `LocalLlm`. The
 * local-only invariant is anchored in code on this default path: it always
 * constructs local-llm, which has no remote path. The value-not-throw re-mapping
 * lives in {@link makeLoadModel}; this file is wiring only.
 */
import DEFAULT_CATALOG from '../../../../lib/local-llm/catalog.js';
import makeLocalLlm from '../../../../lib/local-llm/make-local-llm.js';
import type {
	AdapterMap,
	CapabilityProbe,
	ModelCatalog,
	RuntimeKind,
} from '../../../../lib/local-llm/types.js';

import makeLoadModel from './load-model.js';
import type { AithorRuntime } from './types.js';

// Mirrors LocalLlmConfig's fields but is aithor's OWN type — keep in sync if
// local-llm/types.ts widens LocalLlmConfig.
type AithorRuntimeConfig = {
	readonly adapters: AdapterMap;
	readonly catalog?: ModelCatalog;
	readonly capabilityProbe?: CapabilityProbe;
	readonly preference?: readonly RuntimeKind[];
};

export default function makeAithorRuntime(
	config: AithorRuntimeConfig,
): AithorRuntime {
	// Resolve the catalog ONCE and pass the SAME instance to BOTH makeLocalLlm
	// (feasibility) and makeLoadModel (the membership pre-check). This matters when
	// a catalog is INJECTED: both must see the host's catalog, not one the host's
	// and the other local-llm's default. (local-llm exposes no membership
	// predicate, so the pre-check and feasibility agree only by sharing the array.)
	const catalog = config.catalog ?? DEFAULT_CATALOG;

	const llm = makeLocalLlm({
		adapters: config.adapters,
		catalog,
		// exactOptionalPropertyTypes: forward optional keys only when present
		// (mirroring make-local-llm.ts's own select() spread).
		...(config.capabilityProbe === undefined
			? {}
			: { capabilityProbe: config.capabilityProbe }),
		...(config.preference === undefined
			? {}
			: { preference: config.preference }),
	});

	return { loadModel: makeLoadModel(llm, catalog) };
}
