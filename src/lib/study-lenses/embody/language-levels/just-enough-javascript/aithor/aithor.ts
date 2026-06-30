/**
 * @file The orchestrator — `aithor(program, config, runtime?)` — the integration
 * core that ties the pure leaves (prompt construction, conformance) to the two
 * impure seams (the injected load-once {@link ModelLoader} and the
 * non-deterministic {@link LoadedModel} call).
 *
 * @remarks
 * Shapes a JEJ study program to a config, seeded by an input program. It resolves
 * the config's defaults — and, for a `vary` request, compiles the held aspects
 * into the feature subset / size bounds (hard) and soft-hold list BEFORE bring-up,
 * where a config-shape mistake throws — brings the model up ONCE (a bring-up
 * {@link Refusal} short-circuits out — the model call is never reached), builds the
 * prompt from the decomposed resolved pieces, and forks on `validate`:
 * - **uncurated** (`validate: false`): one model call; the byte-exact `raw` is
 *   returned unmodified beside meta — no admission, no conformance, no repair.
 * - **curated** (`validate: true`, the default): the extracted `code` faces the
 *   level's admission gate (`isJej`) then the aithor's own `conform`; a pass is
 *   shaped into a result, a fail drives a bounded repair loop (next increment),
 *   and the spent bound shapes an `attempt-bound-exhausted` refusal.
 *
 * `Meta.model` is ALWAYS the resolved id (the model that actually ran), never the
 * requested `config.model` — they differ on an empty "pick for me" request. The
 * runtime is the injected seam; omitted, it defaults to a backend-agnostic
 * runtime (empty AdapterMap) that refuses `no-model-available` until a host wires
 * a backend — value-not-throw, no `@mlc-ai/web-llm` pull-in into this core.
 */
import isJej from '../../../lib/validating/is-jej.js';

import assertVaryExclusive from './assert-vary-exclusive.js';
import buildPrompt from './build-prompt.js';
import conform from './conform.js';
import makeAithorRuntime from './make-aithor-runtime.js';
import resolveVary from './resolve-vary.js';
import type {
	AithorConfig,
	AithorResult,
	AithorRuntime,
	FeatureSubset,
	RepairContext,
	ResolvedAithorConfig,
	SizeBounds,
	SoftAspect,
} from './types.js';

const defaultRuntime: AithorRuntime = makeAithorRuntime({ adapters: {} });

// The curated attempt bound — total model calls (1 initial + up to 2 repairs).
// Fixed, not config-driven (AithorConfig has no attempts field); a tunable knob.
const MAX_ATTEMPTS = 3;

export default async function aithor(
	program: string,
	config: AithorConfig,
	runtime: AithorRuntime = defaultRuntime,
): Promise<AithorResult> {
	// The vary resolution prelude — pure, sync, and the one place a malformed
	// REQUEST throws (config-shape, distinct from the value-not-throw outcome
	// boundary), so it runs BEFORE bring-up: a vary declaring an aspect beside a
	// raw constraint, or a hard hold with no parseable, non-empty seed to read off.
	assertVaryExclusive(config);
	const resolved = resolveConfig(config);
	// `vary: {}` declares nothing — it is inert (≡ no vary), so a raw constraint
	// survives; only a vary that DECLARES an aspect resolves into hard/soft holds
	// (and the guard above already forbade it from sitting beside a raw constraint).
	const varyConfig = config.vary;
	const vary =
		varyConfig !== undefined &&
		Object.values(varyConfig).some((value) => value !== undefined)
			? resolveVary(program, varyConfig)
			: undefined;

	// Bring-up, ONCE per request (load-once): a Refusal short-circuits out — the
	// model call is never reached.
	const loaded = await runtime.loadModel(resolved.model);
	if ('cause' in loaded) {
		return { ok: false, refusal: loaded };
	}
	const { model, resolvedId } = loaded;

	// A vary's resolved HARD holds replace the raw subset/size (mutually exclusive
	// by the guard above, so there is nothing to merge); its SOFT holds ride into
	// the prompt. No vary ⇒ the raw resolved subset/size and no soft holds.
	const subset: FeatureSubset = vary?.subset ?? {
		include: resolved.include,
		exclude: resolved.exclude,
	};
	const size: SizeBounds = vary?.size ?? {
		...(resolved.lines === undefined ? {} : { lines: resolved.lines }),
		...(resolved.complexity === undefined
			? {}
			: { complexity: resolved.complexity }),
	};
	const softHolds: readonly SoftAspect[] = vary?.softHolds ?? [];

	// Uncurated: one model call, no gates run; the raw program is returned
	// byte-exact beside meta naming the model that ran. No admission, no
	// conformance, no repair.
	if (!resolved.validate) {
		const { raw } = await model.generate(
			buildPrompt(program, resolved.prompt, subset, size, undefined, softHolds),
		);
		return { ok: true, program: raw, meta: { model: resolvedId, attempts: 1 } };
	}

	// Curated: the bounded admit → conform → repair loop. Each iteration is one
	// model call (the handle is reused — load-once). A conformance failure seeds
	// the next prompt with the refused candidate + its located reasons; an
	// admission failure re-asks bare (there are no conformance violations to seed
	// with). The spent bound shapes the curated-only exhaustion refusal.
	let repair: RepairContext | undefined;
	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
		const { code } = await model.generate(
			buildPrompt(program, resolved.prompt, subset, size, repair, softHolds),
		);
		if (await isJej(code)) {
			const verdict = conform(code, subset, size);
			if (verdict.ok) {
				return {
					ok: true,
					program: code,
					meta: { model: resolvedId, attempts: attempt },
				};
			}
			// Non-empty here by construction: `code` passed isJej admission above (a
			// successful module parse), so conform's own parse cannot fail — thus
			// !verdict.ok ⇒ violations.length > 0, the non-empty tuple the cast asserts.
			repair = {
				candidate: code,
				violations: verdict.violations as RepairContext['violations'],
			};
		} else {
			// Admission failure: reset repair so a stale conformance context from a
			// prior attempt does not leak into this bare re-ask.
			repair = undefined;
		}
	}
	return { ok: false, refusal: { cause: 'attempt-bound-exhausted' } };
}

// Resolve the config's defaults inline at entry, mirroring the sibling
// RunOptions → ResolvedRunOptions pattern (Object.freeze + ?? DEFAULT, with
// optional size bounds spread only when present so `lines: 0` survives).
function resolveConfig(config: AithorConfig): ResolvedAithorConfig {
	return Object.freeze({
		prompt: config.prompt,
		model: config.model,
		validate: config.validate ?? true,
		include: config.include ?? [],
		exclude: config.exclude ?? [],
		...(config.lines === undefined ? {} : { lines: config.lines }),
		...(config.complexity === undefined
			? {}
			: { complexity: config.complexity }),
	});
}
