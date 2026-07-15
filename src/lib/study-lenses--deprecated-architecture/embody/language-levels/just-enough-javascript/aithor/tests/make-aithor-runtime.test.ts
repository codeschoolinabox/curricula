import { describe, it, expect } from 'vitest';

import DEFAULT_CATALOG from '../../../../../study-lenses/lib/local-llm/catalog.js';
import {
	webllmEntry,
	fakeProbe,
	countedAdapter,
} from '../../../../../study-lenses/lib/local-llm/tests/fakes.js';
import makeAithorRuntime from '../make-aithor-runtime.js';

// Increment 2 — make-aithor-runtime: the default-runtime factory (thin wiring).
// Smoke-level — the value-not-throw re-mapping itself is proven in
// load-model.test.ts against a fake { load }. Here we prove WIRING: the
// constructed runtime exposes a loadModel; the SAME injected catalog (not
// local-llm's DEFAULT_CATALOG) backs the membership pre-check; and a feasible
// request flows end-to-end through the REAL makeLocalLlm + injected adapter/probe
// to a ResolvedModel. Reuses local-llm's shared test doubles (a feasible webllm
// entry, a feasible probe, a counted adapter) rather than re-deriving feasibility.

describe('makeAithorRuntime', () => {
	describe('interface — constructs an AithorRuntime', () => {
		it('exposes a loadModel function even with no backends wired', () => {
			const runtime = makeAithorRuntime({ adapters: {} });

			expect(typeof runtime.loadModel).toBe('function');
		});
	});

	describe('one — a name absent from the injected catalog refuses as a value', () => {
		it('returns unknown-model (not a throw) for a name in no catalog', async () => {
			const runtime = makeAithorRuntime({
				adapters: {},
				catalog: [webllmEntry({ id: 'cat-known', vramRequiredMB: 1000 })],
			});

			const result = await runtime.loadModel('not-in-catalog');

			// Proves the loader's pre-check fires as a VALUE and short-circuits before
			// any load/probe — hermetic. (That the INJECTED catalog backs it, rather
			// than DEFAULT_CATALOG, is proven by the next two rungs.)
			expect(result).toEqual({ cause: 'unknown-model' });
		});
	});

	describe('one — the injected catalog overrides local-llm DEFAULT_CATALOG', () => {
		it('refuses a name present in DEFAULT_CATALOG but absent from the injected catalog', async () => {
			const defaultId = DEFAULT_CATALOG[0]?.id ?? '';
			expect(defaultId).not.toBe(''); // guard: the default catalog is non-empty
			expect(defaultId).not.toBe('cat-known'); // guard: distinct from injected

			const runtime = makeAithorRuntime({
				adapters: {},
				catalog: [webllmEntry({ id: 'cat-known', vramRequiredMB: 1000 })],
			});

			const result = await runtime.loadModel(defaultId);

			// If the factory wrongly pre-checked against DEFAULT_CATALOG, this name
			// would pass the pre-check and fall through to load → no-model-available.
			// unknown-model proves makeLoadModel received the INJECTED catalog instance.
			expect(result).toEqual({ cause: 'unknown-model' });
		});
	});

	describe('one — a feasible request flows end-to-end to a ResolvedModel', () => {
		it('brings up an injected catalog member through the real runtime + injected adapter', async () => {
			const runtime = makeAithorRuntime({
				adapters: { webllm: countedAdapter() },
				// 1000 MB ≤ 4096 MB (half of fakeCaps()'s default 8 GB) — feasible.
				catalog: [webllmEntry({ id: 'cat-known', vramRequiredMB: 1000 })],
				capabilityProbe: fakeProbe(),
			});

			const result = await runtime.loadModel('cat-known');

			// Proves adapters + catalog + probe were all forwarded into makeLocalLlm
			// (a forgotten adapter or probe would make the model infeasible →
			// no-model-available). resolvedId === chosen.id (make-local-llm.ts:96).
			expect('model' in result).toBe(true);
			if (!('model' in result)) throw new Error('expected a ResolvedModel');
			expect(result.resolvedId).toBe('cat-known');
		});
	});
});
