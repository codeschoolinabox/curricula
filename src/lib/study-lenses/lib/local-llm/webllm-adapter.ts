/**
 * @file The WebLLM runtime adapter (DOCS § Execution phases, phases 3-4 — the
 * load-once seam's backend driver + the generation/decomposition tail). A
 * factory with injectable, real-defaulted seams (mirrors engine/evaluate.ts's
 * `createTransport = real` rotated to a factory): production closes over the real
 * `CreateMLCEngine` + `prebuiltAppConfig`; tests inject a fake. The returned
 * closure IS the RuntimeAdapter contract. Stateless per call — load-once/dedup is
 * the facade's (make-local-llm.ts), not the adapter's.
 */

import { CreateMLCEngine, prebuiltAppConfig } from '@mlc-ai/web-llm';

import freezeInPlace from '@utils/freeze-in-place.js';

import decompose from './decompose.js';
import type { LoadProgress, LoadedModel, RuntimeAdapter } from './types.js';

type MakeWebllmAdapterDeps = {
	readonly createEngine?: typeof CreateMLCEngine;
	readonly appConfig?: typeof prebuiltAppConfig;
};

/** Per-model generation defaults — running the model well, owned here so consumers carry no sampling concern. */
type Sampling = { readonly temperature: number; readonly max_tokens: number };

/**
 * Builds the WebLLM {@link RuntimeAdapter}: it validates a webllm load against
 * the app config, brings the model up via `CreateMLCEngine` (reporting the
 * one-time fetch through `onProgress`), and returns a LoadedModel whose
 * `generate` sends the finished prompt as a single user message (no system
 * prompt) with the per-family sampling defaults, then decomposes the reply.
 *
 * @param deps - Injectable seams; default to the real WebLLM engine + app config.
 * @returns A {@link RuntimeAdapter} for the `webllm` runtime kind.
 */
export default function makeWebllmAdapter({
	createEngine = CreateMLCEngine,
	appConfig = prebuiltAppConfig,
}: MakeWebllmAdapterDeps = {}): RuntimeAdapter {
	return async function loadWebllm(
		load,
		_fetchUrl,
		onProgress,
	): Promise<LoadedModel> {
		// fetchUrl is unused: WebLLM resolves weights from its app config by
		// modelId, so the catalog's per-runtime URL is not consumed here.
		if (load.runtime !== 'webllm') {
			throw new Error(
				`webllm-adapter: expected a webllm load, received "${load.runtime}"`,
			);
		}
		assertModelExists(load.modelId, appConfig);
		const { modelId } = load;
		const sampling = samplingFor(modelId);

		const engine = await createEngine(modelId, {
			initProgressCallback: (report) =>
				onProgress?.({
					phase: inferPhase(report.text),
					text: report.text,
					ratio: report.progress,
				}),
		});

		return freezeInPlace({
			async generate(prompt) {
				const reply = await engine.chat.completions.create({
					messages: [{ role: 'user', content: prompt }],
					temperature: sampling.temperature,
					max_tokens: sampling.max_tokens,
				});
				return decompose(reply.choices[0]?.message.content ?? '');
			},
		});
	};
}

/** Throws if the modelId is not in the app config's model list (a programmer error, not a refusal). */
function assertModelExists(
	modelId: string,
	appConfig: typeof prebuiltAppConfig,
): void {
	const known = appConfig.model_list.some(
		(record) => record.model_id === modelId,
	);
	if (!known) {
		throw new Error(
			`webllm-adapter: model id not in the WebLLM app config: "${modelId}"`,
		);
	}
}

function samplingFor(modelId: string): Sampling {
	return FAMILY_SAMPLING[detectFamily(modelId)] ?? GLOBAL_SAMPLING;
}

/** Maps a modelId to a sampling family — only families whose defaults diverge from the global fallback. */
function detectFamily(modelId: string): 'coder' | 'default' {
	const id = modelId.toLowerCase();
	if (id.includes('qwen2.5-coder')) return 'coder';
	return 'default';
}

function inferPhase(text: string): LoadProgress['phase'] {
	const lower = text.toLowerCase();
	return FETCH_HINTS.some((hint) => lower.includes(hint)) ? 'fetch' : 'load';
}

// Code generation wants determinism + headroom; everything else takes the
// general-purpose fallback. Seed a family only when its defaults differ (so the
// `?? GLOBAL_SAMPLING` is the load-bearing fallback for every other family).
const FAMILY_SAMPLING: Partial<Record<'coder' | 'default', Sampling>> =
	freezeInPlace({ coder: { temperature: 0.2, max_tokens: 1024 } });
const GLOBAL_SAMPLING: Sampling = freezeInPlace({
	temperature: 0.4,
	max_tokens: 512,
});
const FETCH_HINTS: readonly string[] = freezeInPlace([
	'fetch',
	'download',
	'cache',
]);
