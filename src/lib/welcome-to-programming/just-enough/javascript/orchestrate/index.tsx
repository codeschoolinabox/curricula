/**
 * @file `<StudyLenses>` — the package's public API surface.
 *
 * **F2.2 scope**: introduces the `OrchestratorState` mode discriminator
 * (`editor` | `lens`) as a `useState` slot. `deriveInitialMode` seeds the
 * initial state synchronously from the `lens` and `configs` props; a
 * `useEffect([lens, configs])` drives post-mount prop-change transitions.
 * The render path branches on `state.mode` instead of the previous inline
 * `registered !== undefined` check. Outward behavior is identical to F1+B.
 *
 * **F2.2 effect topology**:
 * - **Snippet slot** — seeded from `snippetProp` at mount (initial-value-only
 *   per F2.1). `setSnippet` is threaded into `EditorComponent`.
 * - **Mode slot** — `useState<OrchestratorState>` initialized via
 *   `deriveInitialMode`; driven post-mount by `useEffect([lens, configs])`.
 * - **CachedEmbodiment slot** — NOT added at F2.2 (F2.5 scope).
 * - **useEmbodiment** — still present and unconditional (removed in F2.4).
 *   Provides the `Snippet` for the lens render branch.
 * - **EventBus** — deferred to F5.
 */

import React from 'react';

import deepMerge from '../../../../utils/deep-merge.js';

import embody from '../embody/index.js';
import type { Snippet } from '../embody/types.js';

import debugPropsLens from '../lenses/debug-props/index.js';
import type { LensConfig, LensModule } from '../lenses/types.js';

import EditorComponent from './editor/index.js';
import type {
	LensModeState,
	OrchestratorState,
	StudyLensesProps,
} from './types.js';

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

/**
 * Derives the initial `OrchestratorState` from the `lens` and `configs`
 * props. Called once via the `useState` lazy initializer and again inside
 * the `useEffect([lens, configs])` functional updater for prop-change
 * transitions (with a same-state bail-out to avoid extra re-renders).
 *
 * Registered `lens` → `LensModeState`; unset or unregistered → `EditorModeState`.
 */
function deriveInitialMode(
	lens: string | undefined,
	configs: Pick<StudyLensesProps, 'configs'>['configs'],
): OrchestratorState {
	const registered = lens !== undefined ? LENS_REGISTRY[lens] : undefined;
	if (registered !== undefined) {
		return {
			mode: 'lens',
			activeLens: lens!,
			resolvedConfig: resolvePerLensConfig(registered, lens!, { configs }),
		} satisfies LensModeState;
	}
	return { mode: 'editor' };
}

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
 * **Opacity boundary cast.** The public `StudyLensesProps.configs`
 * is typed maximally-opaque (`Readonly<Record<string, unknown>>`)
 * — the type makes no statement about cascade internals. This
 * function is the orchestrator's INTERNAL structural assumption
 * point: it casts to `{ lenses?: Readonly<Record<string, unknown>> }`
 * to look up `lenses[lensName]`. The cast is a runtime trust
 * contract: if a caller hands the orchestrator a `configs` value
 * that doesn't expose a `lenses` map (or whose `lenses[lens]` is
 * not an object), the read returns `undefined` and the chain
 * falls back to `module.config()` alone.
 *
 * **Lens-prop-boundary cast.** The return-side cast to `LensConfig`
 * is the lens's strict-shape trust point: the cascade resolver
 * types per-lens values loosely, but lens components type their
 * `config` prop as `LensConfig` (primitives + primitive arrays).
 * Authors who supply richer values via `lenses.json` get undefined
 * behavior at the lens boundary — per plugin README § `lenses.json`
 * schema "Lens-config value shape".
 */
function resolvePerLensConfig(
	module: LensModule,
	lensName: string,
	props: Pick<StudyLensesProps, 'configs'>,
): LensConfig {
	const moduleDefault = module.config();
	const cascadeForLens = readCascadeLensEntry(props.configs, lensName) ?? {};
	return deepMerge(moduleDefault, cascadeForLens as LensConfig);
}

/**
 * Reads a per-lens config entry from an opaque `configs` value at the
 * orchestrator's structural-assumption boundary.
 *
 * The public `StudyLensesProps.configs` type is
 * `Readonly<Record<string, unknown>>` — it makes NO statement about
 * cascade internals. This helper encapsulates the orchestrator-internal
 * assumption that the cascade exposes `lenses[lensName]` for per-lens
 * config lookup, and adds a runtime sanity check: a non-object value at
 * `lenses[lensName]` (string, number, null, array) fails the lookup
 * and the resolution chain falls back to `module.config()` alone.
 *
 * The runtime check makes the silent-fallback claim in the prop-table
 * documentation actually robust — without it, a malformed
 * `configs.lenses[lensName]` would feed a non-object into `deepMerge`
 * and the lens would receive an undefined-behavior config.
 */
function readCascadeLensEntry(
	cascade: Readonly<Record<string, unknown>> | undefined,
	lensName: string,
): Readonly<Record<string, unknown>> | undefined {
	const asLensMap = cascade as
		| Readonly<{ lenses?: Readonly<Record<string, unknown>> }>
		| undefined;
	const entry = asLensMap?.lenses?.[lensName];
	return typeof entry === 'object' && entry !== null && !Array.isArray(entry)
		? (entry as Readonly<Record<string, unknown>>)
		: undefined;
}

export default function StudyLenses({
	snippet: snippetProp,
	lens,
	configs,
}: StudyLensesProps): React.JSX.Element {
	// Snippet slot — seeded from prop at mount only (initial-value-only).
	const [snippet, setSnippet] = React.useState(snippetProp);

	// Mode slot — initialized synchronously via deriveInitialMode; driven
	// post-mount by the useEffect below. F2.3 adds the explicit return-
	// transition tests; F2.4 narrows the embody trigger.
	const [state, setState] = React.useState<OrchestratorState>(() =>
		deriveInitialMode(lens, configs),
	);

	// Prop-change mode transition. Skips initial mount (state is already
	// correct from the lazy initializer); fires on every subsequent lens or
	// configs change, applying the full derived state including a fresh
	// resolvedConfig (so configs changes propagate to the lens component).
	const isMountedRef = React.useRef(false);
	React.useEffect(() => {
		if (!isMountedRef.current) {
			isMountedRef.current = true;
			return;
		}
		setState(deriveInitialMode(lens, configs));
	}, [lens, configs]);

	// Embody chain — still unconditional at F2.2 (removed in F2.4).
	// Memoized on snippet; provides the Snippet for the lens render branch.
	const embodiment = useEmbodiment(snippet);

	if (state.mode === 'lens') {
		const lensModule = LENS_REGISTRY[state.activeLens]!;
		return (
			<div data-orchestrator-root>
				<lensModule.Component
					embodiment={embodiment}
					config={state.resolvedConfig}
				/>
			</div>
		);
	}

	return (
		<div data-orchestrator-root>
			<EditorComponent snippet={snippet} onSnippetChange={setSnippet} />
		</div>
	);
}

export type { StudyLensesProps } from './types.js';
