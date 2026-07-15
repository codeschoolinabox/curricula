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
 * - a `LoadFailure` (any of local-llm's five terminal causes) →
 *   `Refusal('no-model-available')` carrying the mapped {@link NextStep} — the
 *   product-neutral next-step category derived from the terminal cause (see
 *   {@link causeToNextStep}); local-llm's `detail` is dropped at the seam.
 * - ANY throw / rejection / infra fault during the call → caught by a catch-all
 *   around the whole `load` → `Refusal('no-model-available')` with NO `nextStep` (no
 *   honest terminal cause underlies an infra fault). There is no fourth cause.
 *
 * Stateless: load-once (reuse of the handle across repair attempts) is the
 * orchestrator's job per request; cross-request fetch/cache is local-llm's. The
 * runtime is taken as the narrow `Pick<LocalLlm, 'load'>` so a test fake need only
 * supply `{ load }`; the SAME catalog instance the host injects into the runtime is
 * passed here, so the pre-check and the runtime agree by construction.
 */
import type {
	LoadFailureCause,
	LocalLlm,
	ModelCatalog,
	Selection,
} from '../../../../study-lenses--deprecated-architecture/lib/local-llm/types.js';

import type { ModelLoader, NextStep } from './types.js';

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
			return {
				cause: 'no-model-available',
				nextStep: causeToNextStep(result.cause),
			};
		} catch {
			return { cause: 'no-model-available' };
		}
	};
}

/**
 * Map a local-llm terminal {@link LoadFailureCause} to the product-neutral
 * {@link NextStep} category a `no-model-available` refusal carries. TOTAL — a new
 * local-llm cause fails to narrow to `never` here (a compile error), forcing the seam
 * to stay honest as the producer's taxonomy grows. Many-to-one: both
 * `no-feasible-model` and `all-candidates-exhausted` are device walls →
 * `use-native-app`. aithor names only the category; the lens renders it into guidance.
 */
function causeToNextStep(cause: LoadFailureCause): NextStep {
	if (cause === 'no-feasible-model' || cause === 'all-candidates-exhausted') {
		return 'use-native-app';
	}
	if (cause === 'cache-evicted') return 'reconnect';
	if (cause === 'storage-quota') return 'free-space';
	if (cause === 'fetch-failed') return 'retry';
	// Exhaustiveness: a new LoadFailureCause member fails to narrow to `never` here.
	const unreachable: never = cause;
	return unreachable;
}
