/**
 * @file Static module registry for the study-lenses orchestrator.
 *
 * The registry is the authoritative source of truth for which transforms
 * and lenses are available at runtime. Every `TransformModule` and
 * `LensModule` must be registered here before the orchestrator can
 * include it in a pipeline.
 *
 * @remarks Design constraints (from DOCS.md §Bounded context):
 * - Pure TypeScript — no React, no DOM. Testable in vitest without
 *   jsdom.
 * - Shared name namespace: a name can be registered at most once across
 *   both transforms and lenses. Attempting to register a duplicate name
 *   (same name as any already-registered transform OR lens) throws
 *   synchronously.
 * - Caller-owned modules are shallow-spread and frozen on registration so
 *   the registry is insulated from post-registration top-level mutation.
 *   Function-valued properties are preserved by reference (deepClone
 *   converts functions to metadata — wrong for module contracts).
 * - `getTransform` / `getLens` return the frozen stored copy or
 *   `undefined` — never throw on unknown names (Pipeline validation is
 *   the caller's responsibility).
 */

import { freezeInPlace } from '@utils/freeze.js';

import type { LensModule, Registry, TransformModule } from './types.js';

function isTransformModule(
	m: TransformModule | LensModule,
): m is TransformModule {
	return 'transform' in m;
}

/**
 * Creates a new, empty module registry.
 *
 * @returns A mutable registry. Populate it at application boot by
 *   calling `register()` once per module.
 *
 * @example
 * const registry = createRegistry();
 * registry.register(formatTransform);
 * registry.register(editorLens);
 *
 * registry.getTransform('format');  // → formatTransform (frozen)
 * registry.getLens('editor');       // → editorLens (frozen)
 * registry.getLens('format');       // → undefined (registered as transform)
 */
function createRegistry(): Registry {
	const transforms = new Map<string, TransformModule>();
	const lenses = new Map<string, LensModule>();

	function register(module: TransformModule | LensModule): void {
		if (!module.name) {
			throw new Error('Registry: module name must be a non-empty string');
		}
		if (transforms.has(module.name) || lenses.has(module.name)) {
			throw new Error(
				`Registry: duplicate name "${module.name}" — each name may be registered at most once across transforms and lenses`,
			);
		}
		// Shallow spread isolates from caller's reference; freezeInPlace preserves function properties
		// (deepClone converts functions to metadata objects, which breaks the module contract).
		const frozen = freezeInPlace({ ...module });
		if (isTransformModule(frozen)) {
			transforms.set(frozen.name, frozen);
		} else {
			lenses.set(frozen.name, frozen);
		}
	}

	function getTransform(name: string): TransformModule | undefined {
		return transforms.get(name);
	}

	function getLens(name: string): LensModule | undefined {
		return lenses.get(name);
	}

	return freezeInPlace({ register, getTransform, getLens });
}

export default createRegistry;
