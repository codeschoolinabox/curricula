/**
 * @file The constructed runtime's public surface (MakeLocalLlm, types.ts) — the
 * facade that wires the pure selection core (feasibility.ts) to the impure
 * lifecycle: probe → resolve pick → bring up via the registered adapter with
 * load-once + in-flight dedup → report the resolved pick. The which-model /
 * which-runtime resolution is internal behind the one `load` verb.
 */

/* eslint-disable functional/immutable-data -- this module's declared mutable cores:
   the load-once cache (a Map) and the per-load attempts ledger (an array); every
   write is in this file */

import freezeInPlace from '@utils/freeze-in-place.js';

import DEFAULT_CATALOG from './catalog.js';
import classifyLoadError from './classify-load-error.js';
import selectFeasible from './feasibility.js';
import probeCapabilities from './probe-capabilities.js';
import promoteTerminal from './promote-terminal-cause.js';
import type {
	DeviceCapabilities,
	LoadAttempt,
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
		// inside the descent below (an unknown name is never a returned LoadFailure).
		const { chosen, feasible, rejections, chain } = select(
			capabilities,
			selection,
		);
		if (chosen === null) {
			return freezeInPlace({
				ok: false,
				cause: 'no-feasible-model',
				detail: noFeasibleDetail(feasible.length, rejections),
			});
		}

		// Descend the chain: the cost-aware default first, then its smaller / CPU
		// siblings. The FIRST candidate that brings up wins and is reported honestly
		// (resolvedId names the artifact that actually ran, across a runtime switch).
		// A failure is intermediate — evict its rejected promise and try the next
		// rung; the learner never opts into the fallback, the descent is silent.
		const attempts: LoadAttempt[] = [];
		for (const candidate of chain) {
			const adapter = adapters[candidate.runtime];
			if (adapter === undefined) {
				// Unreachable: selectFeasible only chains a runtime present in the
				// adapter map. The guard satisfies the partial AdapterMap type and
				// surfaces a broken invariant loudly rather than skipping silently.
				throw new Error(
					`makeLocalLlm: chained runtime "${candidate.runtime}" has no adapter for "${candidate.entry.id}"`,
				);
			}

			// Cache per the candidate's catalog id (unique across the chain — each
			// entry appears at most once). The get-then-set is synchronous (no await
			// between), so concurrent loads arriving together dedup to one bring-up
			// under the JS single-thread model; an await inserted here would break it.
			const inFlight = cache.get(candidate.entry.id);
			const bringUp =
				inFlight ?? adapter(candidate.load, candidate.fetchUrl, onProgress);
			if (inFlight === undefined) cache.set(candidate.entry.id, bringUp);

			try {
				// Sequential by design: await this rung, and only on its failure
				// attempt the next — the descent never fetches candidates in parallel.
				const model = await bringUp;
				return freezeInPlace({
					ok: true,
					model,
					resolvedId: candidate.entry.id,
					resolvedRuntime: candidate.runtime,
				});
			} catch (error) {
				// Drop the failed promise so a retry re-attempts; record the attempt in
				// the ledger and descend. Delete only if the cache still holds THIS
				// promise (a late joiner of a failed bring-up must not evict a fresh
				// retry already in flight).
				if (cache.get(candidate.entry.id) === bringUp) {
					cache.delete(candidate.entry.id);
				}
				attempts.push({
					id: candidate.entry.id,
					runtime: candidate.runtime,
					...classifyLoadError(error),
				});
			}
		}

		// The chain is exhausted — every candidate failed. The ledger is non-empty (a
		// non-null `chosen` guarantees ≥1 chain rung, and a success returns inside the
		// loop), so promoteTerminal folds it to the honest terminal cause while the
		// refusal carries the full diagnostic ledger.
		const [first, ...rest] = attempts;
		if (first === undefined) {
			// Unreachable: selectFeasible guarantees chosen !== null ⇒ the chain is
			// headed by that chosen entry (length ≥ 1), so the loop ran ≥1 rung and
			// reaching here means every rung failed — the ledger has ≥1 attempt. The
			// guard narrows it to the contract's non-empty tuple.
			throw new Error(
				'makeLocalLlm: exhausted chain produced no attempts (broken invariant)',
			);
		}
		const ledger: readonly [LoadAttempt, ...LoadAttempt[]] = [first, ...rest];
		return freezeInPlace({
			ok: false,
			cause: promoteTerminal(ledger),
			attempts: ledger,
		});
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

// The per-entry rejection diagnosis surfaced by selectFeasible (internal to
// feasibility.ts — derived here rather than imported, keeping that file's
// default-only export). Used only to compose the no-feasible `detail` string.
type EntryRejection = ReturnType<typeof selectFeasible>['rejections'][number];
type RejectionReason = EntryRejection['reasons'][number];

/**
 * The honest reason a load resolved to no model, for the pre-flight refusal's
 * diagnostic `detail` (DDD §5: the reason rides in `detail`). `chosen` is null on
 * two distinct kinds of path, which must NOT be conflated (a teaching tool must
 * never misdescribe the device): a genuinely empty feasible set — answered with a
 * per-entry breakdown of which catalog models were rejected and why — vs. a
 * non-empty feasible set the caller's own selection excluded. Dev/log/instructor-
 * facing; the consumer reads `cause`.
 */
function noFeasibleDetail(
	feasibleCount: number,
	rejections: readonly EntryRejection[],
): string {
	if (feasibleCount > 0) {
		return 'A feasible model exists, but the requested selection (a sizeClass ceiling, or a named model not feasible on this device) excluded every candidate.';
	}
	if (rejections.length === 0) {
		return 'No catalog models were available to evaluate.';
	}
	const lines = rejections.map(
		(rejection) =>
			`  ${rejection.id}: ${rejection.reasons
				.map((reason) => describeReason(reason))
				.join('; ')}`,
	);
	return `No catalog model is feasible on this device:\n${lines.join('\n')}`;
}

/** One rejection reason as a product-neutral, learner/instructor-readable clause. */
function describeReason(reason: RejectionReason): string {
	if (reason.kind === 'no-webgpu') {
		return 'requires WebGPU, which this device reports unavailable';
	}
	if (reason.kind === 'missing-feature') {
		return `requires WebGPU feature(s) not advertised: ${reason.missing.join(', ')}`;
	}
	if (reason.kind === 'vram-too-large') {
		return `needs ~${Math.round(reason.requiredMB)} MB VRAM, over the ~${Math.round(reason.budgetMB)} MB budget`;
	}
	if (reason.kind === 'size-class-too-large') {
		return `size class '${reason.sizeClass}' exceeds the CPU/WASM ceiling '${reason.maxCpu}'`;
	}
	// 'no-adapter' — the only remaining kind. The typed binding is a compile-time
	// exhaustiveness guard: a new RejectionReason kind would fail to narrow here.
	const noAdapter: Extract<RejectionReason, { kind: 'no-adapter' }> = reason;
	return `no registered runtime (needs '${noAdapter.runtime}')`;
}
