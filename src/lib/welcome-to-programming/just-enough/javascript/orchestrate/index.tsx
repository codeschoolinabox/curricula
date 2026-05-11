/**
 * @file `<StudyLenses>` — the package's public API surface.
 *
 * **F1+B scope** (after the 3-prop reshape): three-prop component
 * skeleton + `embody(snippet)` chain wiring + editor home-base mount +
 * single-entry static lens-registry dispatch (the `debug-props`
 * meta-lens) for sandbox-harness verification.
 *
 * The chain: `snippet → embody(snippet) → frozen Snippet → either a
 * registered lens module's Component (when `lens` matches a registry
 * key) OR the editor home base (otherwise)`, per the locked decisions
 * in [`./README.md` § Public API](./README.md) and the F1 narrowing
 * block in the same file.
 *
 * **F1+B effect topology**:
 * - **Three-prop signature is the public contract.** Accepts
 *   `{ snippet, lens?, configs? }`. Every prop typechecks and round-
 *   trips through the dispatch. The pre-3-prop F1 mount-time guard
 *   (`config` supplied without a resolved-default lens → throw) is
 *   gone: with no separate `config` prop, the guard has no trigger
 *   surface. The cascade-supplied default seam is L2-deferred.
 * - **B partial lens dispatch.** When `lens` matches a key in
 *   `LENS_REGISTRY` (currently only `'debug-props'`), the orchestrator
 *   mounts that lens with the embodied `Snippet` + a resolved
 *   `LensConfig` (per the two-tier per-lens config resolution chain
 *   `module.config() ⊕ configs.lenses?.[lens]` at `./README.md`
 *   § Per-lens config resolution chain). When `lens` is unset OR not
 *   in the registry, F1 narrowing applies: the editor home base
 *   mounts and any `configs.lenses[lens]` supplied alongside an
 *   unregistered `lens` is silently unused (the silent-drop case is
 *   surfaced in the README's F1 narrowing block).
 * - **No mode discriminator yet.** F2 introduces the editor-vs-lens
 *   2-mode state machine; today the dispatch is direct
 *   (`lens-registered? → mount lens : mount editor`).
 * - **No format pre-processing.** `embody` checks format compliance.
 * - **Internal-only EventBus deferred to F5.** No events fire today.
 */

import React from 'react';

import deepMerge from '../../../../utils/deep-merge.js';

import embody from '../embody/index.js';
import type { Snippet } from '../embody/types.js';

import debugPropsLens from '../lenses/debug-props/index.js';
import type { LensConfig, LensModule } from '../lenses/types.js';

import EditorComponent from './editor/index.js';
import type { StudyLensesProps } from './types.js';

/**
 * Single-entry static lens registry — the orchestrator's bootstrap
 * dispatch surface for B.7. Keyed by `LensModule.name`. F4 grows the
 * registry with the first pedagogical trial lens; the shape decision
 * (static map vs. runtime `register()` API) is open-spec at the
 * lenses peer (per `../lenses/DOCS.md` §Out of scope, "The lens
 * registry itself").
 */
const LENS_REGISTRY: Readonly<Record<string, LensModule>> = Object.freeze({
	'debug-props': debugPropsLens,
});

function useEmbodiment(snippet: string): Snippet {
	const embodiment = React.useMemo(() => embody(snippet), [snippet]);
	React.useDebugValue(embodiment);
	return embodiment;
}

/**
 * Computes the per-lens resolved config per the two-tier chain at
 * [`./README.md` § Per-lens config resolution chain]:
 *
 *     resolved(lens) = module.config() ⊕ configs.lenses?.[lens]
 *
 * `⊕` is deep-merge-right-wins. Per-fence URL-style queries and
 * sibling `@study-lens` directive JSON are pre-merged INTO
 * `configs.lenses[lens]` at plugin emission time, so there is no
 * separate per-fence-override tier on the orchestrator side.
 *
 * The cast to `LensConfig` at the return boundary is the
 * lens-prop-boundary trust point: the cascade resolver types per-lens
 * values loosely as `Record<string, unknown>`, but lens components
 * type their `config` prop as `LensConfig` (primitives + primitive
 * arrays). Authors who supply richer values via `lenses.json` get
 * undefined behavior at the lens boundary — per plugin README
 * § `lenses.json` schema "Lens-config value shape".
 */
function resolvePerLensConfig(
	module: LensModule,
	lensName: string,
	props: Pick<StudyLensesProps, 'configs'>,
): LensConfig {
	const moduleDefault = module.config();
	const cascadeForLens = props.configs?.lenses?.[lensName] ?? {};
	return deepMerge(moduleDefault, cascadeForLens as LensConfig);
}

export default function StudyLenses({
	snippet,
	lens,
	configs,
}: StudyLensesProps): React.JSX.Element {
	// Embody chain. Wrapped in a custom hook so React DevTools surfaces
	// the value via `useDebugValue` when inspecting `<StudyLenses>`.
	// Memoized on snippet — a fresh Snippet is derived synchronously
	// on every snippet change. Per `./DOCS.md` § F1+B narrowing of the
	// effect-topology table, this broadened trigger fires
	// unconditionally; F2 narrows it to mode → lens transitions once
	// the discriminator lands.
	const embodiment = useEmbodiment(snippet);

	// B.7: lens-mount dispatch. When `lens` matches a registered key,
	// route to that lens's React component with the embodied Snippet
	// and a resolved per-lens config. When `lens` is unset OR not in
	// the registry, F1 narrowing applies: the editor home base mounts.
	const registered = lens !== undefined ? LENS_REGISTRY[lens] : undefined;
	if (registered !== undefined) {
		const resolvedConfig = resolvePerLensConfig(registered, lens!, {
			...(configs !== undefined ? { configs } : {}),
		});
		return (
			<div data-orchestrator-root>
				<registered.Component embodiment={embodiment} config={resolvedConfig} />
			</div>
		);
	}

	return (
		<div data-orchestrator-root>
			<EditorComponent snippet={snippet} />
		</div>
	);
}

export type { StudyLensesProps } from './types.js';
