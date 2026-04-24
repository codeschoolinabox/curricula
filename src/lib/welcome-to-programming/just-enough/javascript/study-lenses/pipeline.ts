/**
 * @file Pipeline validation for the study-lenses orchestrator.
 *
 * `validatePipeline` resolves a caller-provided `Pipeline` against a
 * `Registry` and returns a new, frozen `Pipeline` that is safe to hand to
 * the pipeline-execution phase. Transform-name problems are author errors
 * and throw; lens-name problems degrade gracefully to the default lens
 * (`'editor'`) with a console warning, so a missing or misspelled lens
 * never takes a whole page down.
 *
 * @remarks Design constraints (from DOCS.md §Execution phases 1b, §Structural constraints):
 * - Pure TypeScript — no React, no DOM. Testable in vitest without
 *   jsdom.
 * - Transforms are validated in declared order; the first failure throws
 *   immediately, subsequent transforms are not inspected.
 * - Lens-name fallback is the orchestrator's only silent degradation path
 *   — every other name error is loud.
 * - The returned object is always a fresh reference (never the input
 *   Pipeline) because the function always spreads, even in the all-valid
 *   case. Deep-frozen via `freezeInPlace`.
 */

import { freezeInPlace } from '@utils/freeze.js';

import type { Pipeline, Registry } from './types.js';

const FALLBACK_LENS = 'editor';

/**
 * Validates a caller-provided Pipeline against the given Registry and
 * returns a new frozen Pipeline with the lens resolved.
 *
 * @param pipeline - The caller-provided pipeline: ordered transform names
 *   plus one terminal lens name.
 * @param registry - The module registry to resolve names against.
 * @returns A new frozen `Pipeline` with `lens` resolved to either the
 *   caller's name (if registered) or `'editor'` (fallback).
 * @throws {Error} If any transform name is unknown, or if any transform
 *   name collides with a registered lens name (type-mismatch).
 * @throws {Error} If the lens name collides with a registered transform
 *   name (type-mismatch).
 *
 * @remarks An unknown lens name or empty-string lens does NOT throw;
 *   instead the resolved lens is rewritten to `'editor'` and a
 *   `console.warn` is emitted. The orchestrator is trusted to have
 *   registered an `'editor'` lens at boot.
 *
 *   Separately, any key in `pipeline.configs` that does not correspond
 *   to a name in `pipeline.transforms` or the resolved lens emits a
 *   `console.warn` (stray configs — author provided a config for a
 *   module not in this pipeline). The key is NOT removed; executors
 *   simply ignore it. Loud but non-fatal — helps surface cascade-source
 *   drift (e.g. a rename of a transform that left a `lenses.json`
 *   entry behind).
 */
function validatePipeline(pipeline: Pipeline, registry: Registry): Pipeline {
	for (const name of pipeline.transforms) {
		if (registry.getLens(name)) {
			throw new Error(
				`Pipeline: "${name}" is registered as a lens, cannot be used as a transform`,
			);
		}
		if (!registry.getTransform(name)) {
			throw new Error(`Pipeline: unknown transform "${name}"`);
		}
	}

	const { lens } = pipeline;
	if (registry.getTransform(lens)) {
		throw new Error(
			`Pipeline: "${lens}" is registered as a transform, cannot be used as a lens`,
		);
	}

	const lensModule = registry.getLens(lens);
	const resolvedLens = lensModule ? lens : FALLBACK_LENS;
	if (!lensModule) {
		console.warn(
			`Pipeline: unknown lens "${lens}" — falling back to "${FALLBACK_LENS}"`,
		);
	}

	const { transforms, configs } = pipeline;
	if (configs) {
		const knownNames = new Set<string>([...transforms, resolvedLens]);
		for (const configName of Object.keys(configs)) {
			if (!knownNames.has(configName)) {
				console.warn(
					`Pipeline: config provided for "${configName}" but it is not in the pipeline (ignored)`,
				);
			}
		}
	}

	return freezeInPlace({ ...pipeline, lens: resolvedLens });
}

export default validatePipeline;
