/**
 * @file `<StudyLenses>` — the package's public API surface.
 *
 * **F3 status** — lazy embodiment on need is satisfied by F2.4 (transition-only
 * trigger) + F2.5 (eager edit invalidation). Evaluation phases inside a
 * mounted lens are **lens-internal**: lenses call `snippet.evaluation.events.*`
 * directly on the embodiment they hold; no orchestrator round-trip.
 * See [`./DOCS.md` § F3 — lazy embodiment realized] for the full satisfaction
 * analysis + sentinel-blindness invariant.
 *
 * **F2.5 scope**: edit invalidation. The snippet setter passed to
 * `EditorComponent` is wrapped so that any snippet edit eagerly clears the
 * `cachedEmbodiment` slot, per the cache contract documented in DOCS.md
 * § Effect topology (Embodiment-on-edit invalidation row). This makes the
 * editor → lens transition after an edit always re-embody, even if the
 * learner happens to undo their edit back to the cached snippet value.
 *
 * **F2.4 scope** (preserved): `embody()` fires only on mode → lens
 * transitions, never on keystrokes. The `cachedEmbodiment` slot is the
 * single embodiment store; `useEmbodiment` is gone. Cache is RETAINED
 * across `lens → editor` round trips and reused on `editor → lens` when
 * `cache.snippet === currentSnippet` (cache-hit shortcut, observable only
 * for the lens → editor → lens with no intervening edit case).
 *
 * **F2.4 effect topology**:
 * - **Snippet slot** — seeded from `snippetProp` at mount (initial-value-only
 *   per F2.1). `handleSnippetChange` (wrapping `setSnippet`) is threaded into
 *   `EditorComponent`; the wrapper also clears `cachedEmbodiment` (F2.5).
 * - **Mode slot** — `useState<OrchestratorState>` initialized via
 *   `deriveInitialState`; driven post-mount by `useEffect([lens, configs])`.
 * - **CachedEmbodiment slot** — `useState<CachedEmbodiment | null>`, projected
 *   from the same `deriveInitialState` call at first render (atomic init).
 *   Populated on editor → lens, retained on lens → editor.
 * - **Embody trigger** — fires inside the transition path only: at first
 *   render when initial mode is lens, OR inside the prop-change effect when
 *   transitioning editor → lens without a cache hit.
 * - **EventBus** — per-instance bus owned by a `useRef`, exposed via
 *   `forwardRef` + `useImperativeHandle` for tests. Initial-mount dispatch
 *   fires from a one-time post-commit `useEffect([])` when the first commit
 *   lands in lens mode (`source: 'initial'`). Prop-driven transitions
 *   dispatch from the `useEffect([lens, configs])` body after the state
 *   setters fire, diffing against a `prevStateRef` and emitting
 *   `mode-changed` + `lens-switched(source: 'prop')` per the DOCS.md
 *   dispatch-ordering rule. See `./event-bus.ts` for the bus runtime and
 *   `./DOCS.md` § Internal event taxonomy for the full contract.
 */

import React from 'react';

import deepMerge from '../../../utils/deep-merge.js';

import embody from '../embody/index.js';

import annotateLens from '../lenses/annotate/index.js';
import debugPropsLens from '../lenses/debug-props/index.js';
import type { LensConfig, LensModule } from '../lenses/types.js';

import EditorComponent from './editor/index.js';
import createEventBus from './event-bus.js';
import Toolbar from './toolbar.js';
import type {
	CachedEmbodiment,
	EventBus,
	LensModeState,
	OrchestratorState,
	StudyLensesProps,
} from './types.js';

/**
 * Static lens registry — the orchestrator's bootstrap
 * dispatch surface for B.7. Keyed by `LensModule.name`. F4 grows the
 * registry with the first pedagogical trial lens; the shape decision
 * (static map vs. runtime `register()` API) is open-spec at the
 * lenses peer (per `../lenses/DOCS.md` §Out of scope, "The lens
 * registry itself").
 */
const LENS_REGISTRY: Readonly<Record<string, LensModule>> = Object.freeze({
	annotate: annotateLens,
	'debug-props': debugPropsLens,
});

/**
 * Registered lens names, in registration order. Stable reference passed
 * to `<Toolbar lensNames={LENS_NAMES} />` so the picker's option list
 * doesn't recompute per render.
 */
const LENS_NAMES: readonly string[] = Object.freeze(Object.keys(LENS_REGISTRY));

/**
 * Single-pass initial derivation of `{ state, cache }` from the first-render
 * props. Both `useState` lazy initializers project from a single call so
 * `embody()` is invoked at most once at first render (in lens mode).
 *
 * - Registered `lens` + `prevCache.snippet === snippet` → cache hit; reuse.
 * - Registered `lens` + cache miss → call `embody(snippet)` once; fresh cache.
 * - Unset or unregistered `lens` → editor mode; cache passes through unchanged
 *   (callers seed `null` at mount; the post-mount effect retains the cache
 *   across `lens → editor` transitions).
 */
function deriveInitialState(
	snippet: string,
	lens: string | undefined,
	configs: Pick<StudyLensesProps, 'configs'>['configs'],
	prevCache: CachedEmbodiment | null,
): { state: OrchestratorState; cache: CachedEmbodiment | null } {
	const registered = lens !== undefined ? LENS_REGISTRY[lens] : undefined;
	if (registered !== undefined) {
		// Cache-key check: full-string identity, NOT a semantic content branch.
		// The orchestrator's sentinel-blindness invariant (DOCS § F3 — lazy
		// embodiment realized) forbids any substring / prefix / regex / pattern
		// test against snippet content. This is the only snippet-string compare
		// in the orchestrator, and it asks "same snippet I already embodied?",
		// not "what does this code do?".
		const cache: CachedEmbodiment =
			prevCache !== null && prevCache.snippet === snippet
				? prevCache
				: { snippet, embodiment: embody(snippet) };
		const state: LensModeState = {
			mode: 'lens',
			activeLens: lens!,
			resolvedConfig: resolvePerLensConfig(registered, lens!, configs),
		};
		return { state, cache };
	}
	return { state: { mode: 'editor' }, cache: prevCache };
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
	configs: Readonly<Record<string, unknown>> | undefined,
): LensConfig {
	const moduleDefault = module.config();
	const cascadeForLens = readCascadeLensEntry(configs, lensName) ?? {};
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

/**
 * Test-time handle on a `<StudyLenses>` instance. Exposes the per-mount
 * `EventBus` so test harnesses (and, later, the L1 sandbox page) can
 * subscribe to internal events without the bus appearing on the public
 * prop surface.
 *
 * @remarks Consumers SHOULD NOT pass a ref in production code. The ref is
 * an internal-test affordance; the public contract is the three props
 * (`snippet`, `lens?`, `configs?`). An LMS-facing event-subscribe seam,
 * if it ever lands, will be a separate prop designed against a concrete
 * host's needs — not the raw internal bus.
 */
type StudyLensesHandle = Readonly<{ bus: EventBus }>;

const StudyLenses = React.forwardRef<StudyLensesHandle, StudyLensesProps>(
	function StudyLenses(
		{ snippet: snippetProp, lens, configs },
		ref,
	): React.JSX.Element {
		// Per-instance EventBus — created lazily so re-renders don't construct
		// a throwaway bus on every render. The ref slot holds the same bus for
		// the full lifetime of the mount.
		const busRef = React.useRef<EventBus | null>(null);
		if (busRef.current === null) {
			busRef.current = createEventBus();
		}
		React.useImperativeHandle(ref, () => ({ bus: busRef.current! }), []);

		// Snippet slot — seeded from prop at mount only (initial-value-only).
		const [snippet, setSnippet] = React.useState(snippetProp);

		// F5b.2 initial-mount dispatch guard. Survives StrictMode's
		// mount → cleanup → remount cycle so the dispatch fires exactly once
		// per real mount, not once per discarded-render pair.
		const initialDispatchFiredRef = React.useRef(false);

		// Atomic init: derive both state and cache from a single call so embody()
		// fires at most once at first render. The tuple is held in its own state
		// slot for clarity; React never re-runs the lazy initializer.
		const [initialDerived] = React.useState(() =>
			deriveInitialState(snippetProp, lens, configs, null),
		);
		const [state, setState] = React.useState<OrchestratorState>(
			initialDerived.state,
		);
		const [cachedEmbodiment, setCachedEmbodiment] =
			React.useState<CachedEmbodiment | null>(initialDerived.cache);

		// Ref shadow for cache — lets the mode-transition effect read the latest
		// cache without depending on `snippet` (which would re-fire the effect on
		// every keystroke). Updated during render; only read inside post-commit
		// effects (never during render), which keeps the StrictMode discarded-
		// render case correct: the discarded render's write is overwritten by the
		// committed render's write before any effect fires.
		const cachedEmbodimentRef = React.useRef(cachedEmbodiment);
		cachedEmbodimentRef.current = cachedEmbodiment;

		// Ref shadow for snippet — same rationale and same read-only-in-effect
		// invariant as cachedEmbodimentRef above.
		const snippetRef = React.useRef(snippet);
		snippetRef.current = snippet;

		// F5b.2 initial-mount dispatch. If the first commit landed in lens
		// mode, dispatch mode-changed(editor→lens) then
		// lens-switched(null → activeLens, 'initial') on the per-instance
		// bus. Editor-mode initial mount dispatches nothing — there is no
		// transition to announce. The fire-once guard
		// (`initialDispatchFiredRef`) keeps the dispatch idempotent under
		// React StrictMode's discarded-mount cycle.
		React.useEffect(() => {
			if (initialDispatchFiredRef.current) return;
			const initialState = initialDerived.state;
			if (initialState.mode !== 'lens') return;
			initialDispatchFiredRef.current = true;
			const bus = busRef.current!;
			bus.dispatch('mode-changed', { from: 'editor', to: 'lens' });
			bus.dispatch('lens-switched', {
				previous: null,
				next: initialState.activeLens,
				source: 'initial',
			});
		}, []);

		// F5b prop-change diff seed. Tracks the most-recently committed state
		// so the prop-change effect can compute mode + activeLens transitions
		// for bus dispatch. Seeded to the initial state at mount and updated
		// after every transition. Read inside post-commit effects only.
		const prevStateRef = React.useRef<OrchestratorState>(initialDerived.state);

		// Prop-change mode transition. Skips initial mount (state/cache already
		// seeded); fires on lens or configs change only. Calls `setState` and
		// `setCachedEmbodiment` sequentially — React 18 auto-batching folds them
		// into a single commit (per DOCS § Atomic transition mechanism).
		//
		// F5b.4-F5b.6: after the state setters fire, the transition handler
		// diffs prevStateRef against the just-computed `next.state` and
		// dispatches mode-changed (when mode flipped) and lens-switched (when
		// next is lens mode and the activeLens differs from the previous lens
		// reading). Both use source: 'prop'. Dispatch ordering: mode-changed
		// before lens-switched within the same React commit per DOCS contract.
		const isMountedRef = React.useRef(false);
		React.useEffect(() => {
			if (!isMountedRef.current) {
				isMountedRef.current = true;
				return;
			}
			const next = deriveInitialState(
				snippetRef.current,
				lens,
				configs,
				cachedEmbodimentRef.current,
			);
			setState(next.state);
			setCachedEmbodiment(next.cache);

			const prev = prevStateRef.current;
			const bus = busRef.current!;
			if (prev.mode !== next.state.mode) {
				bus.dispatch('mode-changed', { from: prev.mode, to: next.state.mode });
			}
			if (next.state.mode === 'lens') {
				const previousLens = prev.mode === 'lens' ? prev.activeLens : null;
				if (previousLens !== next.state.activeLens) {
					bus.dispatch('lens-switched', {
						previous: previousLens,
						next: next.state.activeLens,
						source: 'prop',
					});
				}
			}
			prevStateRef.current = next.state;
		}, [lens, configs]);

		// F2.5: edit invalidation. Any snippet edit eagerly clears the cache so a
		// subsequent editor → lens transition always re-embodies, per the cache
		// contract documented in DOCS.md § Effect topology (Embodiment-on-edit
		// invalidation row). Empty deps are safe: React guarantees setter identity
		// is stable across renders. The two setters fire from a synthetic onChange
		// event, so React 18 auto-batches them into a single commit.
		const handleSnippetChange = React.useCallback((next: string) => {
			setSnippet(next);
			setCachedEmbodiment(null);
		}, []);

		if (state.mode === 'lens') {
			// Invariant (enforced by transition logic): mode='lens' ⇒ cache non-null
			// AND cache.snippet === current snippet. A null cache here means a
			// transition path forgot to populate it — surface loudly rather than
			// silently dereferencing.
			if (cachedEmbodiment === null) {
				throw new Error(
					'orchestrator invariant violated: lens mode requires non-null cachedEmbodiment',
				);
			}
			const lensModule = LENS_REGISTRY[state.activeLens]!;
			return (
				<div data-orchestrator-root>
					<Toolbar lensNames={LENS_NAMES} />
					<lensModule.Component
						embodiment={cachedEmbodiment.embodiment}
						config={state.resolvedConfig}
					/>
				</div>
			);
		}

		return (
			<div data-orchestrator-root>
				<Toolbar lensNames={LENS_NAMES} />
				<EditorComponent
					snippet={snippet}
					onSnippetChange={handleSnippetChange}
				/>
			</div>
		);
	},
);

export default StudyLenses;

export type { StudyLensesProps } from './types.js';
export type { StudyLensesHandle };
