/**
 * @file `<StudyLenses>` — the package's public API surface.
 *
 * **F1+B scope** (after B.7): four-prop component skeleton +
 * mount-time guard for `config` supplied without a resolved-default
 * lens + `embody(snippet)` chain wiring + editor home-base mount +
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
 * - **Four-prop signature is the public contract.** Accepts
 *   `{ snippet, lens?, config?, configs? }`. Every prop typechecks
 *   and rounds-trips through the dispatch.
 * - **F1 mount-time guard.** If `config` is supplied AND `lens` is
 *   unset AND `configs?.default` is unset, throw at mount with a clear
 *   message (per WS3 handoff line 54). The cascade-supplied default
 *   seam (`configs.default`) is L2-deferred; today the guard reduces
 *   to "throw if `config` is supplied without `lens`."
 * - **B partial lens dispatch.** When `lens` matches a key in
 *   `LENS_REGISTRY` (currently only `'debug-props'`), the orchestrator
 *   mounts that lens with the embodied `Snippet` + a resolved
 *   `LensConfig` (per the per-lens config resolution chain at
 *   `./README.md` § Per-lens config resolution chain). When `lens` is
 *   unset OR not in the registry, F1 narrowing applies: the editor
 *   home base mounts and any `config` supplied alongside an
 *   unregistered `lens` is silently dropped (the silent-drop case is
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
 * Computes the per-lens resolved config per the chain at
 * [`./README.md` § Per-lens config resolution chain]:
 *
 *     resolved(lens) = module.config()
 *                   ⊕ configs?.[lens]
 *                   ⊕ (lens === resolvedDefault ? config : {})
 *
 * `⊕` is deep-merge-right-wins. At F1+B `resolvedDefault === lens`
 * always (no cascade-supplied default seam yet); the conditional
 * decoration is preserved so L2's extension is a one-line change.
 */
function resolvePerLensConfig(
	module: LensModule,
	lensName: string,
	props: Pick<StudyLensesProps, 'config' | 'configs'>,
): LensConfig {
	const moduleDefault = module.config();
	const cascadeForLens = props.configs?.[lensName] ?? {};
	// At F1+B, `resolvedDefault` IS `lensName` always — there is no
	// cascade-supplied default seam yet (`configs.default` is L2-deferred).
	// L2 replaces the right side of this assignment with the cascade-
	// resolved default once that seam lands; the conditional below then
	// becomes meaningful for non-default-lens mounts.
	const resolvedDefault = lensName;
	const perFence = lensName === resolvedDefault ? (props.config ?? {}) : {};
	return deepMerge(deepMerge(moduleDefault, cascadeForLens), perFence);
}

export default function StudyLenses({
	snippet,
	lens,
	config,
	configs,
}: StudyLensesProps): React.JSX.Element {
	if (
		config !== undefined &&
		lens === undefined &&
		configs?.default === undefined
	) {
		throw new Error(
			'<StudyLenses>: `config` requires a resolved default lens. Set `lens={…}` or `configs.default={…}` (or omit `config`).',
		);
	}
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
			...(config !== undefined ? { config } : {}),
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
