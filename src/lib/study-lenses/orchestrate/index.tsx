/**
 * @file `<StudyLenses>` — the package's public API surface.
 *
 * **Live embodiment.** The orchestrator owns one live static `embody()` of the
 * editing buffer in the `liveEmbodiment` slot (`{ snippet, embodiment }`). The
 * slot is **seeded once at mount in both modes** (the lazy `useState`
 * initializer runs `deriveInitialState`: its lens branch embodies, its editor
 * branch retains-or-seeds), **refreshed by a debounced static `embody()` while
 * editing** (a trailing-edge `useEffect([snippet])`, ~200ms idle), and **never
 * cleared on edit**. It stays content-keyed by snippet: reused on an editor →
 * lens transition when `liveEmbodiment.snippet === currentSnippet`, else
 * re-embodied inline (the flush). The transition also cancels any pending
 * debounce so no late trailing write lands after the mode flip. Program
 * execution stays lazy. See [`./DOCS.md` § Live embodiment](./DOCS.md).
 *
 * **Edit handling.** The snippet setter threaded into `EditorComponent`
 * (`handleSnippetChange`) updates snippet state only — it does NOT touch the
 * `liveEmbodiment` slot. The slot refreshes on the debounce settle, so an edit
 * reverted to the slot's snippet leaves it untouched (a no-op refresh, guarded
 * by snippet identity in the debounce effect).
 *
 * **Slots:**
 * - **Snippet slot** — seeded from `snippetProp` at mount (initial-value-only);
 *   `handleSnippetChange` (wrapping `setSnippet`) is the sole writer thereafter.
 * - **Mode slot** — `useState<OrchestratorState>` initialized via
 *   `deriveInitialState`; driven post-mount by `useEffect([lens, configs])`.
 * - **LiveEmbodiment slot** — `useState<LiveEmbodiment | null>`, projected from
 *   the same `deriveInitialState` call at first render (atomic init), then
 *   refreshed by the debounced `useEffect([snippet])`. In editor mode its
 *   `errors` feed the memoized `interpretedDiagnostics` derivation
 *   (snippet-identity guarded: a stale/null slot derives to empty), passed to
 *   `<EditorComponent>` as located `LintDiagnostic[]` — never the embodiment.
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

import debounce from '@utils/debounce.js';

import deepMerge from '../../utils/deep-merge.js';
import embody from '../embody/index.js';
import type { SnippetType } from '../embody/types.js';
import annotateLens from '../lenses/annotate/index.js';
import blanksLens from '../lenses/blanks/index.js';
import debugPropertiesLens from '../lenses/debug-props/index.js';
import parsonsLens from '../lenses/parsons/index.js';
import type { LensConfig, LensModule, Station } from '../lenses/types.js';
import writemeLens from '../lenses/writeme/index.js';

import deriveStationAvailability from './derive-station-availability.js';
import deriveStationRoster from './derive-station-roster.js';
import deriveStationStatus from './derive-station-status.js';
import Dock from './dock/index.js';
import EditorComponent from './editor/index.js';
import createEventBus from './event-bus.js';
import type { LintDiagnostic } from './lib/editing/types.js';
import deriveInterpretedDiagnostics from './lib/error-interpreting/derive-interpreted-diagnostics.js';
import PhasesPanel from './phases-panel/index.js';
import type {
	LiveEmbodiment,
	EventBus,
	LensModeState,
	LensSelectionSource,
	OrchestratorConfig,
	OrchestratorState,
	StationStatusMap,
	StudyLensesProps as StudyLensesProperties,
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
	blanks: blanksLens,
	'debug-props': debugPropertiesLens,
	parsons: parsonsLens,
	writeme: writemeLens,
});

/**
 * Per-station lens rosters — the panel's STATIC derivation, run once per
 * module load against the static registry (the same module-load posture
 * as `LENS_REGISTRY` itself). Invariant across edits; the per-edit
 * derivations (availability, status) run in the component against the
 * live slot.
 */
const STATION_ROSTER = deriveStationRoster(LENS_REGISTRY);

/**
 * The all-pending status map backing the live slot's type-level-only
 * null guard in the panel-state memo. Unreachable post-mount (the slot
 * is seeded non-null in both modes and never written null); pinned here
 * so the guard has no implementation-time improvisation.
 */
const ALL_PENDING_STATUSES: StationStatusMap = Object.freeze({
	source: 'pending',
	realm: 'pending',
	parse: 'pending',
	creation: 'pending',
	evaluation: 'pending',
});

/**
 * Idle window (ms) for the debounced live re-embody. An edit reschedules the
 * trailing-edge `embody()` of the current buffer; the slot refreshes once the
 * learner pauses for this long. Per the live-embodiment design (~150–300ms).
 */
const LIVE_REEMBODY_DEBOUNCE_MS = 200;

/**
 * Stable empty interpreted-diagnostics array. The memoized derivation returns
 * this single frozen instance on every null/stale-slot render so the editor's
 * push effect (keyed on prop identity) does not re-fire for "still nothing".
 */
const EMPTY_DIAGNOSTICS: readonly LintDiagnostic[] = Object.freeze([]);

/**
 * Single-pass initial derivation of `{ state, liveEmbodiment }` from the
 * first-render props. Both `useState` lazy initializers project from a single
 * call so `embody()` is invoked at most once at first render.
 *
 * - Registered `lens` (lens mode) — **reuse-or-embody**: reuse when
 *   `previousLiveEmbodiment.snippet === snippet`, else `embody(snippet)` once.
 * - Unset or unregistered `lens` (editor mode) — **retain-or-seed**: retain a
 *   non-null `previousLiveEmbodiment` (e.g. across a `lens → editor` transition;
 *   the post-mount transition threads the prior slot through), else seed the
 *   slot with a fresh `embody(snippet)` at mount so the gutter can paint on the
 *   first frame.
 */
function deriveInitialState(
	snippet: string,
	lens: string | undefined,
	configs: Pick<StudyLensesProperties, 'configs'>['configs'],
	previousLiveEmbodiment: LiveEmbodiment | null,
	type: SnippetType,
): {
	readonly state: OrchestratorState;
	readonly liveEmbodiment: LiveEmbodiment | null;
} {
	const registered = lens === undefined ? undefined : LENS_REGISTRY[lens];
	if (registered !== undefined) {
		// Snippet-identity reuse check: full-string identity, NOT a semantic
		// content branch. The orchestrator's snippet-content-blindness invariant
		// (DOCS § Snippet-content-blind orchestrator) forbids any substring /
		// prefix / regex / pattern test against snippet content. It asks "same
		// snippet I already embodied?", not "what does this code do?".
		const liveEmbodiment: LiveEmbodiment =
			previousLiveEmbodiment !== null &&
			previousLiveEmbodiment.snippet === snippet &&
			previousLiveEmbodiment.type === type
				? previousLiveEmbodiment
				: { snippet, type, embodiment: embody(snippet) };
		const state: LensModeState = {
			mode: 'lens',
			activeLens: lens!,
			resolvedConfig: resolvePerLensConfig(registered, lens!, configs),
		};
		return { state, liveEmbodiment };
	}
	return {
		state: { mode: 'editor' },
		// Retain-or-seed: keep a non-null slot across a lens → editor transition
		// (the live slot is keyed by the (snippet, type) pair, so retention
		// requires the type to match — a type toggle changes it, forcing a
		// re-seed under the new type); seed a fresh embodiment at editor-mode
		// mount (when the slot is still null) so the gutter can paint on the
		// first frame.
		liveEmbodiment:
			previousLiveEmbodiment !== null &&
			previousLiveEmbodiment.type === type
				? previousLiveEmbodiment
				: { snippet, type, embodiment: embody(snippet) },
	};
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
		| Readonly<{ readonly lenses?: Readonly<Record<string, unknown>> }>
		| undefined;
	const entry = asLensMap?.lenses?.[lensName];
	return typeof entry === 'object' && entry !== null && !Array.isArray(entry)
		? (entry as Readonly<Record<string, unknown>>)
		: undefined;
}

/**
 * Reads the orchestrator-level config tier from an opaque `configs` value at
 * the orchestrator's structural-assumption boundary — the same cast pattern as
 * `readCascadeLensEntry`. The public `StudyLensesProps.configs` makes no
 * statement about `configs.orchestrator`; this helper encapsulates the
 * assumption that, when present, it is an `OrchestratorConfig`-shaped object,
 * with a runtime sanity check: a non-object value (string, number, null,
 * array) fails the read and the dock's slots fall back to built-in defaults.
 */
function readOrchestratorConfig(
	cascade: Readonly<Record<string, unknown>> | undefined,
): OrchestratorConfig | undefined {
	const asConfigMap = cascade as
		| Readonly<{ readonly orchestrator?: unknown }>
		| undefined;
	const entry = asConfigMap?.orchestrator;
	return typeof entry === 'object' && entry !== null && !Array.isArray(entry)
		? (entry as OrchestratorConfig)
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
type StudyLensesHandle = Readonly<{ readonly bus: EventBus }>;

const StudyLenses = React.forwardRef<StudyLensesHandle, StudyLensesProperties>(
	function StudyLenses(
		{ snippet: snippetProperty, lens, configs },
		reference,
	): React.JSX.Element {
		// Per-instance EventBus — created lazily so re-renders don't construct
		// a throwaway bus on every render. The ref slot holds the same bus for
		// the full lifetime of the mount.
		const busReference = React.useRef<EventBus | null>(null);
		if (busReference.current === null) {
			busReference.current = createEventBus();
		}
		React.useImperativeHandle(
			reference,
			() => ({ bus: busReference.current! }),
			[],
		);

		// Snippet slot — seeded from prop at mount only (initial-value-only).
		const [snippet, setSnippet] = React.useState(snippetProperty);

		// Source-type slot — seeded once at mount from `configs.orchestrator`
		// (a mount-only seed; the dock's type toggle becomes its writer in a
		// later increment). Read via `typeReference` inside post-commit
		// handlers/effects (the same read-only-in-effects invariant as
		// `snippetReference`) so the trailing-edge re-embody and the prop-change
		// transition never capture a stale type.
		const [type, setType] = React.useState<SnippetType>(
			() => readOrchestratorConfig(configs)?.initialType ?? 'module',
		);
		const typeReference = React.useRef(type);
		typeReference.current = type;

		// F5b.2 initial-mount dispatch guard. Survives StrictMode's
		// mount → cleanup → remount cycle so the dispatch fires exactly once
		// per real mount, not once per discarded-render pair.
		const initialDispatchFiredReference = React.useRef(false);

		// Atomic init: derive both state and the live slot from a single call so
		// embody() fires at most once at first render. The tuple is held in its
		// own state slot for clarity; React never re-runs the lazy initializer.
		// `type` is the source type already resolved by the slot above (passed in,
		// not re-read — the config seed is a mount-once read).
		const [initialDerived] = React.useState(() =>
			deriveInitialState(snippetProperty, lens, configs, null, type),
		);
		const [state, setState] = React.useState<OrchestratorState>(
			initialDerived.state,
		);
		const [liveEmbodiment, setLiveEmbodiment] =
			React.useState<LiveEmbodiment | null>(initialDerived.liveEmbodiment);

		// Ref shadow for the live slot — lets the mode-transition effect read the
		// latest slot without depending on `snippet` (which would re-fire it on
		// every keystroke). Updated during render; only read inside post-commit
		// effects (never during render), which keeps the StrictMode discarded-
		// render case correct: the discarded render's write is overwritten by the
		// committed render's write before any effect fires.
		const liveEmbodimentReference = React.useRef(liveEmbodiment);
		liveEmbodimentReference.current = liveEmbodiment;

		// Ref shadow for snippet — same rationale and same read-only-in-effect
		// invariant as liveEmbodimentRef above.
		const snippetReference = React.useRef(snippet);
		snippetReference.current = snippet;

		// Interpreted gutter diagnostics — derived from the live embodiment's
		// errors; the editor NEVER receives the embodiment, only the located
		// LintDiagnostic[]. GUARD (load-bearing): in editor mode the slot may
		// be STALE mid-debounce (it holds the previous buffer's embodiment
		// until the ~200ms settle; the loud coherence guards are lens-mode
		// only). A stale or null slot derives to the stable EMPTY_DIAGNOSTICS
		// rather than painting the old buffer's error onto the new one
		// (≤1-debounce-window staleness per DOCS § Interpreted diagnostics,
		// "Coherence"). Sequential ifs, not `liveEmbodiment?.snippet ===
		// snippet ? …`: the optional-chain form loses the non-null narrowing
		// the embodiment read needs (the repo's prefer-optional-chain
		// catch-22). The memo itself is load-bearing: an inline derivation
		// would mint a fresh array identity every render and fire the
		// editor's push effect (effect dispatch + forced lint pass) on every
		// orchestrator render instead of only when the slot or snippet moves.
		const interpretedDiagnostics = React.useMemo(
			function deriveGutterDiagnostics(): readonly LintDiagnostic[] {
				if (liveEmbodiment === null) return EMPTY_DIAGNOSTICS;
				if (liveEmbodiment.snippet !== snippet) return EMPTY_DIAGNOSTICS;
				// Error-free short-circuit (AR-4): the adapter returns a FRESH
				// frozen [] when errors are null, which would re-fire the
				// editor's identity-keyed push effect on every clean settle.
				// Returning the stable sentinel keeps "still nothing" pushless.
				if (liveEmbodiment.embodiment.errors === null) {
					return EMPTY_DIAGNOSTICS;
				}
				return deriveInterpretedDiagnostics(liveEmbodiment.embodiment);
			},
			[liveEmbodiment, snippet],
		);

		// Phases-panel per-edit derivations — shown stations (availability) +
		// per-station statuses, derived from the live slot at its own cadence
		// (the panel reads the latest live value at debounce cadence — no
		// staleness blanking, unlike the gutter memo above: a mid-debounce
		// panel shows the previous settle's staircase, per DOCS.md § Why a
		// live (debounced) embodiment, "One slot, two freshness contracts").
		// The null branch is type-level-only (the slot is
		// seeded non-null in both modes and never written null) and pins to
		// zero-stations + all-pending. The memo keeps the panel's array/map
		// prop identities stable across unrelated orchestrator renders.
		const { shownStations, statusMap } = React.useMemo(
			function derivePanelState(): {
				readonly shownStations: readonly Station[];
				readonly statusMap: StationStatusMap;
			} {
				if (liveEmbodiment === null) {
					return { shownStations: [], statusMap: ALL_PENDING_STATUSES };
				}
				const { embodiment } = liveEmbodiment;
				return {
					shownStations: deriveStationAvailability(
						liveEmbodiment.type,
						embodiment.validation,
					),
					statusMap: deriveStationStatus(embodiment.status, embodiment.errors),
				};
			},
			[liveEmbodiment],
		);

		// Live re-embody on edit — a trailing-edge debounced static embody of the
		// current buffer, one instance per mount (held in a ref, lazy-initialized
		// like the bus above so re-renders don't build a throwaway). The empty
		// catch is defense-in-depth at the detached-timer boundary: a throw on a
		// timer callback has no React error boundary above it, so swallowing keeps
		// the prior slot value rather than tearing down the editor. (The inline
		// flush-on-transition embody, by contrast, leans on embody's
		// total-on-`string` contract — see DOCS § Live embodiment, the
		// try/catch-asymmetry note.)
		function reembodyCurrentSnippet(nextSnippet: string): void {
			try {
				setLiveEmbodiment({
					snippet: nextSnippet,
					type: typeReference.current,
					embodiment: embody(nextSnippet),
				});
			} catch {
				/* keep the prior slot on a stray background throw */
			}
		}
		const reembodyReference = React.useRef<
			(((nextSnippet: string) => void) & { cancel: () => void }) | null
		>(null);
		if (reembodyReference.current === null) {
			reembodyReference.current = debounce(
				reembodyCurrentSnippet,
				LIVE_REEMBODY_DEBOUNCE_MS,
			);
		}

		// F5b.2 initial-mount dispatch. If the first commit landed in lens
		// mode, dispatch mode-changed(editor→lens) then
		// lens-switched(null → activeLens, 'initial') on the per-instance
		// bus. Editor-mode initial mount dispatches nothing — there is no
		// transition to announce. The fire-once guard
		// (`initialDispatchFiredRef`) keeps the dispatch idempotent under
		// React StrictMode's discarded-mount cycle.
		React.useEffect(function fireInitialLensDispatch() {
			if (initialDispatchFiredReference.current) return;
			const initialState = initialDerived.state;
			if (initialState.mode !== 'lens') return;
			initialDispatchFiredReference.current = true;
			const bus = busReference.current!;
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
		const previousStateReference = React.useRef<OrchestratorState>(
			initialDerived.state,
		);

		// Shared transition handler. The prop-change effect (`source:
		// 'prop'`), the panel dropdowns (`source: 'panel'`), and the
		// edit-return button all route through this single helper so the
		// diff/dispatch contract is enforced in one place. Reads snippet + the live slot from refs to avoid re-firing
		// the prop-change effect on every snippet keystroke; reads `configs`
		// from the live closure so each call captures the current cascade.
		function applyTransition(
			nextLens: string | undefined,
			source: LensSelectionSource,
			nextType: SnippetType = typeReference.current,
		): void {
			// Cancel any pending debounced re-embody before flipping. The flush
			// below brings the slot to the exact current buffer, and a mode flip
			// does not change `snippet`, so the [snippet] debounce effect's own
			// cleanup does not fire here — without this, a trailing-edge embody
			// could land a late setLiveEmbodiment AFTER the flip, mutating what a
			// mounted lens renders against. `.cancel()` is an idle-safe no-op when
			// nothing is pending — which is every non-(editor→lens) transition,
			// since the editor is structurally absent in lens mode so no edit can
			// arm the debounce there. Hence the unconditional placement is safe.
			reembodyReference.current?.cancel();
			const next = deriveInitialState(
				snippetReference.current,
				nextLens,
				configs,
				liveEmbodimentReference.current,
				nextType,
			);
			setState(next.state);
			setLiveEmbodiment(next.liveEmbodiment);

			const previous = previousStateReference.current;
			const bus = busReference.current!;
			if (previous.mode !== next.state.mode) {
				bus.dispatch('mode-changed', {
					from: previous.mode,
					to: next.state.mode,
				});
			}
			if (next.state.mode === 'lens') {
				const previousLens =
					previous.mode === 'lens' ? previous.activeLens : null;
				if (previousLens !== next.state.activeLens) {
					bus.dispatch('lens-switched', {
						previous: previousLens,
						next: next.state.activeLens,
						source,
					});
				}
			}
			previousStateReference.current = next.state;
		}

		// Prop-change mode transition. Skips initial mount (state + live slot
		// already seeded); fires on lens or configs change only. Calls
		// `applyTransition`
		// with `source: 'prop'`. The state setters land in a single React 18
		// commit; the dispatches fire synchronously after.
		const isMountedReference = React.useRef(false);
		React.useEffect(
			function applyLensPropTransition() {
				if (!isMountedReference.current) {
					isMountedReference.current = true;
					return;
				}
				applyTransition(lens, 'prop');
				// `applyTransition` closes over the current render's `configs`
				// and the stable refs; no extra dep needed beyond [lens, configs].
				// eslint-disable-next-line react-hooks/exhaustive-deps
			},
			[lens, configs],
		);

		// Debounced live re-embody. A snippet edit schedules a trailing-edge
		// embody of the current buffer into the live slot; the slot is never
		// cleared, only refreshed on settle. A NEW dedicated mount guard (NOT
		// `isMountedReference`, which `applyLensPropTransition` owns) skips the
		// first run, where the seed already embodied — sharing the guard would let
		// one effect flip it before the other reads it, scheduling a stray
		// re-embody at mount. The snippet-identity check is the deeper backstop:
		// it skips the refresh whenever the slot already holds this snippet —
		// covering both an edit reverted to the seeded buffer AND a StrictMode
		// remount (whose discarded first run already flipped the mount guard, so
		// the identity check, not the guard, is what prevents a spurious
		// re-embody there). Cleanup cancels any pending timer, so a StrictMode
		// mount → unmount → remount leaves no duplicate trailing-edge embody.
		const debounceMountGuardReference = React.useRef(false);
		React.useEffect(
			function scheduleLiveReembody() {
				const reembody = reembodyReference.current!;
				const isInitialMount = !debounceMountGuardReference.current;
				debounceMountGuardReference.current = true;
				const alreadyCurrent =
					liveEmbodimentReference.current?.snippet === snippet;
				// Skip the seed mount (already embodied) and any edit that lands
				// back on the slot's snippet (nothing to refresh); otherwise
				// schedule the trailing-edge re-embody.
				if (!isInitialMount && !alreadyCurrent) {
					reembody(snippet);
				}
				return function cancelPendingReembody() {
					reembody.cancel();
				};
			},
			[snippet],
		);

		// Panel-driven transitions. A station dropdown passes the chosen lens
		// name; the handler routes through the shared transition logic with
		// `source: 'panel'` (the dispatch site the reservation in
		// `LensSelectionSource` named). The sentinel (empty string) is
		// filtered at the panel boundary so this handler only ever sees real
		// lens names.
		function handleLensSelect(name: string): void {
			applyTransition(name, 'panel');
		}

		// L1.10: edit-return transitions. The panel's edit button drives
		// `lens → editor`. Passing `undefined` as the lens target routes
		// `deriveInitialState` through the editor branch; `applyTransition`
		// then dispatches `mode-changed({from: 'lens', to: 'editor'})` and
		// skips `lens-switched` because next.state.mode !== 'lens'. The
		// `'edit-button'` source value is unused on this dispatch path
		// (no lens-switched fires) but is the semantically correct
		// attribution per `LensSelectionSource`.
		function handleEditReturn(): void {
			applyTransition(undefined, 'edit-button');
		}

		// Single-writer snippet update — the editor is the only surface that
		// mutates snippet state, and this threads its edits into `setSnippet`. It
		// deliberately does NOT touch the live slot directly: the debounced
		// re-embody effect refreshes the slot on settle, and the slot is never
		// cleared on edit — it stays content-keyed by snippet, so an edit reverted
		// to the slot's snippet is a no-op refresh (and a reuse at the next
		// editor → lens transition). Wrapped in `useCallback([])` for a stable
		// prop identity so the editor isn't re-created on every render.
		const handleSnippetChange = React.useCallback(function handleSnippetChange(
			next: string,
		) {
			setSnippet(next);
		}, []);

		// Dock collapse slot — the omnipresent region's display state. The dock
		// is presentation-only; the orchestrator owns the collapse bit and the
		// toggle handler and threads them down as props (the same split the
		// phases panel follows).
		const [collapsed, setCollapsed] = React.useState(false);
		function handleCollapseToggle(): void {
			setCollapsed((previous) => !previous);
		}

		// Type toggle (dock) — flips the source type. `applyTransition` cancels any
		// pending debounced re-embody and re-seeds the live slot under the
		// EXPLICITLY-threaded new type (not the still-stale `typeReference.current`,
		// which only updates on the next render); from lens mode it routes through
		// the editor branch first (disposability + the (snippet, type) coherence
		// invariant). `setType` flips the slot in the same React batch. The
		// `'edit-button'` source is unused on the → editor path (no lens-switched
		// fires there).
		function handleTypeToggle(): void {
			const { current: currentType } = typeReference;
			const next: SnippetType = currentType === 'module' ? 'script' : 'module';
			setType(next);
			applyTransition(undefined, 'edit-button', next);
			busReference.current!.dispatch('type-toggled', {
				from: currentType,
				to: next,
			});
		}

		// The panel's active lens is derived from state, NOT held in a
		// panel-side slot. State remains the single source of truth (per
		// README § Picker-vs-prop ownership). Lens mode names the active
		// lens (each station rostering it shows it as its dropdown value);
		// editor mode passes null and every dropdown shows the sentinel.
		const activeLens = state.mode === 'lens' ? state.activeLens : null;

		// The dock's script-mode hint shows when module-admissible code (the
		// admission gate accepted it) sits in script mode — the one state where
		// the LL stations are absent with nothing in the gutter to say why.
		// Snippet-content-blind: reads the gate's `validation` output, never the
		// source. Honest under stubs: real code carries `validation: null` until
		// the validating slice lands, so the hint stays dormant there (the
		// `EVAL_*`/`OK` apex scenarios drive `isJeJ: true` for tests).
		const scriptModeHintVisible =
			type === 'script' &&
			liveEmbodiment?.embodiment.validation?.isJeJ === true;

		if (state.mode === 'lens') {
			// Coherence invariant (enforced by transition logic; the type system
			// cannot): mode='lens' ⇒ the live slot is non-null AND
			// liveEmbodiment.snippet === current snippet. A null OR stale slot here
			// means a transition path forgot to flush it — fail loud rather than
			// render a lens against the wrong (or missing) embodiment. The
			// transition's flush makes this unreachable on every legitimate render;
			// see DOCS § Coherence invariant.
			if (liveEmbodiment === null) {
				throw new Error(
					'orchestrator invariant violated: lens mode requires a non-null live embodiment',
				);
			}
			if (liveEmbodiment.snippet !== snippet) {
				throw new Error(
					'orchestrator invariant violated: lens mode requires a live embodiment matching the current snippet (stale slot)',
				);
			}
			if (liveEmbodiment.type !== type) {
				throw new Error(
					'orchestrator invariant violated: lens mode requires a live embodiment matching the current source type (stale slot)',
				);
			}
			const lensModule = LENS_REGISTRY[state.activeLens];
			return (
				<div data-orchestrator-root>
					<PhasesPanel
						stations={shownStations}
						roster={STATION_ROSTER}
						statusMap={statusMap}
						activeLens={activeLens}
						onLensSelect={handleLensSelect}
						editButtonVisible
						onEditReturn={handleEditReturn}
					/>
					<lensModule.Component
						embodiment={liveEmbodiment.embodiment}
						config={state.resolvedConfig}
					/>
					<section
						data-orchestrator-omnipresent-region
						aria-label="study tools"
					>
						<Dock
							collapsed={collapsed}
							onCollapseToggle={handleCollapseToggle}
							sourceType={type}
							scriptModeHintVisible={scriptModeHintVisible}
							onTypeToggle={handleTypeToggle}
						/>
					</section>
				</div>
			);
		}

		// editor-mode branch: state.mode === 'editor' by exhaustion (the
		// lens-mode branch above returned). The edit button is unconditionally
		// hidden in editor mode per the L1 contract; passing `false` directly
		// (rather than `state.mode === 'lens'`) makes the type-narrowed branch
		// explicit at this call site.
		return (
			<div data-orchestrator-root>
				<PhasesPanel
					stations={shownStations}
					roster={STATION_ROSTER}
					statusMap={statusMap}
					activeLens={activeLens}
					onLensSelect={handleLensSelect}
					editButtonVisible={false}
					onEditReturn={handleEditReturn}
				/>
				<EditorComponent
					snippet={snippet}
					onSnippetChange={handleSnippetChange}
					interpretedDiagnostics={interpretedDiagnostics}
				/>
				<section data-orchestrator-omnipresent-region aria-label="study tools">
					<Dock
						collapsed={collapsed}
						onCollapseToggle={handleCollapseToggle}
						sourceType={type}
						scriptModeHintVisible={scriptModeHintVisible}
						onTypeToggle={handleTypeToggle}
					/>
				</section>
			</div>
		);
	},
);

export default StudyLenses;

export type { StudyLensesProps } from './types.js';
export type { StudyLensesHandle };
