/**
 * @file The orchestrator — `aithor(program, config, runtime?)` — the integration
 * core that ties the pure leaves (prompt construction, conformance) to the two
 * impure seams (the injected load-once {@link ModelLoader} and the
 * non-deterministic {@link LoadedModel} call).
 *
 * @remarks
 * Shapes a JEJ study program to a config, seeded by an input program. It resolves
 * the config's defaults, brings the model up ONCE (a bring-up {@link Refusal}
 * short-circuits out — the model call is never reached), builds the prompt from
 * the decomposed resolved pieces, and forks on `validate`:
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

import buildPrompt from './build-prompt.js';
import conform from './conform.js';
import makeAithorRuntime from './make-aithor-runtime.js';
import type {
	AithorConfig,
	AithorResult,
	AithorRuntime,
	FeatureSubset,
	ResolvedAithorConfig,
	SizeBounds,
} from './types.js';

const defaultRuntime: AithorRuntime = makeAithorRuntime({ adapters: {} });

export default async function aithor(
	program: string,
	config: AithorConfig,
	runtime: AithorRuntime = defaultRuntime,
): Promise<AithorResult> {
	const resolved = resolveConfig(config);

	// Bring-up, ONCE per request (load-once): a Refusal short-circuits out — the
	// model call is never reached.
	const loaded = await runtime.loadModel(resolved.model);
	if ('cause' in loaded) {
		return { ok: false, refusal: loaded };
	}
	const { model, resolvedId } = loaded;

	const subset: FeatureSubset = {
		include: resolved.include,
		exclude: resolved.exclude,
	};
	const size: SizeBounds = {
		...(resolved.lines === undefined ? {} : { lines: resolved.lines }),
		...(resolved.complexity === undefined
			? {}
			: { complexity: resolved.complexity }),
	};

	// Uncurated: one model call, no gates run; the raw program is returned
	// byte-exact beside meta naming the model that ran. No admission, no
	// conformance, no repair.
	if (!resolved.validate) {
		const { raw } = await model.generate(
			buildPrompt(program, resolved.prompt, subset, size),
		);
		return { ok: true, program: raw, meta: { model: resolvedId, attempts: 1 } };
	}

	// Curated: a single admit + conform attempt for now (the bounded repair loop
	// arrives in the next increment). A pass returns the conformant code; any
	// failure refuses for the (degenerate, single) attempt bound.
	const { code } = await model.generate(
		buildPrompt(program, resolved.prompt, subset, size),
	);
	if (await isJej(code)) {
		const verdict = conform(code, subset, size);
		if (verdict.ok) {
			return {
				ok: true,
				program: code,
				meta: { model: resolvedId, attempts: 1 },
			};
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
