/**
 * @file Pipeline execution for the study-lenses orchestrator.
 *
 * `executePipeline` threads a code string through a pre-validated
 * `Pipeline`'s transforms (in declared order) and returns the
 * transformed code alongside the already-resolved lens name so the
 * orchestrator can hand it to the lens-mount phase.
 *
 * @remarks Design constraints (from DOCS.md §Execution phases 2, §Structural constraints):
 * - Pure TypeScript — no React, no DOM. Testable in vitest without jsdom.
 * - Transforms run in declared order, threaded as `string → string`.
 * - Each transform receives its resolved config: the module's own
 *   defaults merged with any override from `pipeline.configs[name]`
 *   (via `module.config(overrides)`).
 * - `onFailure` semantics: `'fallthrough'` → `console.warn` + skip
 *   this transform (accumulated stays unchanged), continue with the
 *   next; `'abort'` or absent (`undefined`) → rethrow the original
 *   error, propagating to the orchestrator.
 * - Pipeline is assumed pre-validated by `validatePipeline`. If a
 *   transform name is absent from the registry at execution time, a
 *   loud invariant error is thrown — the caller violated the
 *   "pre-validated" contract.
 * - Returns a fresh, deep-frozen object (never the input reference).
 */

import { freezeInPlace } from '@utils/freeze.js';

import type { Pipeline, Registry } from './types.js';

/**
 * Executes a pre-validated Pipeline against a code string.
 *
 * @param code - The initial snippet to thread through the transforms.
 * @param pipeline - A pre-validated `Pipeline`. Transform names must be
 *   present in the registry; the lens is already resolved.
 * @param registry - The module registry used to resolve transform names.
 * @returns A new frozen object `{ transformedCode, resolvedLens }`.
 *   `transformedCode` is the output of the last transform (or the
 *   input code when `pipeline.transforms` is empty). `resolvedLens`
 *   echoes `pipeline.lens`.
 * @throws {Error} Invariant: if a transform name is not in the registry
 *   (pipeline was not validated). Also rethrows any transform error
 *   whose module has `onFailure === 'abort'` or no `onFailure`.
 *
 * @remarks A transform declared with `onFailure: 'fallthrough'` does
 *   NOT halt the pipeline on throw; instead a `console.warn` is
 *   emitted, the accumulated code is left unchanged, and iteration
 *   continues with the next transform.
 *
 *   `onFailure` only gates throws from `module.transform`. A throw
 *   from `module.config(override)` always propagates — config errors
 *   are never silently swallowed.
 */
function executePipeline(
	code: string,
	pipeline: Pipeline,
	registry: Registry,
): { readonly transformedCode: string; readonly resolvedLens: string } {
	let accumulated = code;
	for (const name of pipeline.transforms) {
		const transformModule = registry.getTransform(name);
		if (!transformModule) {
			throw new Error(
				`Pipeline: transform "${name}" not in registry (pipeline was not validated)`,
			);
		}
		const override = pipeline.configs?.[name];
		const config = transformModule.config(override);
		try {
			accumulated = transformModule.transform(accumulated, config);
		} catch (error) {
			if (transformModule.onFailure === 'fallthrough') {
				console.warn(
					`Pipeline: transform "${name}" failed (fallthrough); continuing with untransformed code`,
					error,
				);
			} else {
				throw error;
			}
		}
	}

	return freezeInPlace({
		transformedCode: accumulated,
		resolvedLens: pipeline.lens,
	});
}

export default executePipeline;
