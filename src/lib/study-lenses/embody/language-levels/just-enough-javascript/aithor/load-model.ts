/**
 * @file The loader adapter seam — aithor's value-not-throw re-mapping of the
 * injected local-llm runtime's `load` verb into a {@link ModelLoader}.
 *
 * @remarks
 * local-llm is NOT uniformly value-not-throw: `load` THROWS on an unknown model
 * name, RETURNS a `LoadFailure` for a device/availability limit, and REJECTS when
 * its capability probe (or any infrastructure step) faults. This seam absorbs all
 * three into aithor's `ok`-boolean vocabulary so a refusal is always a VALUE:
 * - a NON-EMPTY name absent from the injected `catalog` → `Refusal('unknown-model')`,
 *   via a membership pre-check BEFORE `load` (so local-llm's unknown-name throw is
 *   never reached). The pre-check is gated on a non-empty name, mirroring
 *   local-llm's own `isNamed`: an EMPTY name is the "pick for me" request — mapped
 *   to a MODEL-LESS `Selection` ({}), never `{ model: '' }` — and passes through.
 * - a `LoadSuccess` → `ResolvedModel` (the handle + `resolvedId`; local-llm's
 *   device-tier `resolvedRuntime` and the `ok` discriminant are dropped — the
 *   backend is HOW, invisible to a study program's reader).
 * - a `LoadFailure` (either cause) → `Refusal('no-model-available')` (its `detail`
 *   is dropped — a {@link Refusal} carries only a cause).
 * - ANY throw / rejection / infra fault during the call → caught by a catch-all
 *   around the whole `load` → `Refusal('no-model-available')`. There is no fourth
 *   cause.
 *
 * Stateless: load-once (reuse of the handle across repair attempts) is the
 * orchestrator's job per request; cross-request fetch/cache is local-llm's. The
 * runtime is taken as the narrow `Pick<LocalLlm, 'load'>` so a test fake need only
 * supply `{ load }`; the SAME catalog instance the host injects into the runtime is
 * passed here, so the pre-check and the runtime agree by construction.
 */
import type {
	LocalLlm,
	ModelCatalog,
	Selection,
} from '../../../../lib/local-llm/types.js';

import type { ModelLoader } from './types.js';

export default function makeLoadModel(
	runtime: Pick<LocalLlm, 'load'>,
	catalog: ModelCatalog,
): ModelLoader {
	return async function loadModel(name) {
		if (name !== '' && !catalog.some((entry) => entry.id === name)) {
			return { cause: 'unknown-model' };
		}

		const selection: Selection = name === '' ? {} : { model: name };

		// Catch-all around the WHOLE call (the call site, not just the await): a
		// non-empty unknown name local-llm would throw on is already pre-checked
		// out above, but a propagated probe fault or any infra throw/rejection
		// folds here into no-model-available — there is no fourth cause.
		try {
			const result = await runtime.load(selection);
			if (result.ok) {
				return { model: result.model, resolvedId: result.resolvedId };
			}
			return { cause: 'no-model-available' };
		} catch {
			return { cause: 'no-model-available' };
		}
	};
}
