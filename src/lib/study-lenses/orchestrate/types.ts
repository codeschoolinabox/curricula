/**
 * @file Orchestrator-internal contract — the `<StudyLenses>` prop
 * surface, the internal state shape, and the INTERNAL EventBus event
 * taxonomy. Adapted from `study-lenses/types.ts:32-401` (the
 * pre-refactor orchestrator types).
 *
 * @remarks **Contract summary** (refer to `./README.md` and `./DOCS.md`
 * for the prose; this file is the type-level expression):
 * - Public API: three props (`snippet`, `lens?`, `configs?`). The
 *   `snippet` prop is consumed as the **initial value only** — the
 *   orchestrator seeds an internal `useState` on first render and is
 *   the sole writer thereafter. Subsequent prop changes are ignored.
 * - `configs` is maximally opaque (`Readonly<Record<string, unknown>>`);
 *   the orchestrator's resolution chain (two tiers:
 *   `module.config() ⊕ configs.lenses?.[lens]`) is an internal
 *   structural assumption pinned at the cast boundary inside
 *   `resolvePerLensConfig`.
 * - Internal state is mode-discriminated (`editor` | `lens`).
 * - The live embodiment lives in a single authoritative top-level
 *   slot (`LiveEmbodiment | null`) ALONGSIDE the mode state — NOT
 *   inside `LensModeState`. Lens-mode rendering reads the embodiment
 *   from this slot; the editor-mode gutter reads its `errors`. The slot
 *   is keyed by the `(snippet, type)` pair, refreshed by a debounced
 *   static `embody()` while editing, flushed on `editor → lens`, and
 *   re-embodied immediately on a type toggle; it survives
 *   `lens → editor` round-trips.
 * - The snippet's source type (`SnippetType`, default `'module'`,
 *   seedable via the configs orchestrator tier) lives in its own
 *   top-level slot alongside the snippet string and the live
 *   embodiment; the dock's type toggle is its only writer.
 * - The orchestrator-level configs tier (`OrchestratorConfig`, read
 *   INTERNALLY from `configs.orchestrator` at a cast boundary — NOT a
 *   public-surface widening) seeds the dock's source-type, sandbox, and
 *   run-limit slots at mount. The dock's own value types — `RunLimits`,
 *   `DockRunState`, `ChannelKind`, and the `EndReportOutcome` alias of
 *   embody's `EndReport['outcome']` — are internal-only.
 * - INTERNAL-only EventBus — no `subscribe` / `onEvent` prop on
 *   `<StudyLenses>` until a concrete LMS integration target appears.
 *   Four event names: `lens-switched` (carried forward from the
 *   pre-refactor orchestrator), `mode-changed` (the 2-mode state
 *   machine), and `type-toggled` / `sandbox-toggled` (typed now;
 *   dispatched from the dock when it is built — the
 *   typed-before-wired pattern `LensSelectionSource`'s `'panel'`
 *   followed until the phases panel landed its dispatch site).
 *
 * **What survives unchanged**: the `EventBus` shape (typed
 * dispatch/subscribe/unsubscribe/clear), per-instance ownership
 * (each `<StudyLenses>` mount owns its own bus, no global registry).
 *
 * **Open holes**:
 * - `LensSelectionSource` may still grow (a keyboard-shortcut source
 *   could land alongside). Extensions are gated — see the policy
 *   block on the union itself.
 * - `'edit-button'` is typed (the panel edit-return click site
 *   computes it) but not externally observable today, because
 *   `ModeChangedPayload` carries only `{from, to}`. A future
 *   `ModeChangedPayload.source` extension would surface it; until
 *   then it exists for completeness and test introspection.
 *
 * @remarks This file is the orchestrator's INTERNAL contract.
 * Public surface is just `StudyLensesProps`. Everything else is
 * internal-only.
 */

import type { EndReport, Snippet, SnippetType } from '../embody/types.js';
import type { LensConfig, Station } from '../lenses/types.js';

// --- Public prop surface (the only externally-visible type) ---

/**
 * Props for `<StudyLenses>` — the package's public API. Three props
 * (one required, two optional) per the locked decision in
 * `../DOCS.md` § Public surface.
 *
 * @remarks **`configs` typing — MAXIMALLY OPAQUE.** The public type
 * makes NO statement about `configs`'s internal shape. Callers pass
 * whatever the plugin emits today, or whatever a hand-written
 * `<StudyLenses configs={…} />` JSX supplies. The orchestrator's
 * INTERNAL `resolvePerLensConfig` makes ONE structural assumption —
 * that the cascade exposes `lenses[lens]` for per-lens config lookup —
 * at the cast boundary inside that function (with a runtime
 * sanity check via `readCascadeLensEntry`). The public type carries
 * no such assumption, so future cascade-shape evolution (L2 default-
 * lens seam, etc.) doesn't require widening the public surface.
 *
 * The orchestrator's read of `configs.lenses[lens]` is a runtime
 * trust point, not a compile-time guarantee. Strictness against
 * the lens-side `LensConfig` is enforced at the lens-prop boundary
 * (where the orchestrator's resolution chain casts after the deep-
 * merge of tier 0 ⊕ tier 1).
 *
 * @remarks
 * - `snippet` — the source string, consumed as the **initial value
 *   only**. The orchestrator seeds an internal `useState(snippet)`
 *   on the first render and is the sole writer thereafter;
 *   subsequent changes to this prop are IGNORED. Callers who need
 *   to swap the snippet remotely should remount via React `key={…}`.
 *   The orchestrator builds the embodiment internally (live debounced
 *   static `embody()` while editing; seeded once at mount). Caller
 *   does NOT pre-build.
 * - `lens?` — educator-supplied default-mount lens; the learner can
 *   switch via the panel's station dropdowns. This is just the initial
 *   selection.
 *   Changes to this prop AFTER mount drive
 *   mode transitions (per `./README.md` § Editor-vs-lens state
 *   machine).
 * - `configs?` — opaque cascade passthrough (see § configs typing
 *   above). The paragraphs that follow describe TODAY'S plugin
 *   emission shape; they are descriptive observations, NOT type
 *   constraints. The plugin emits the whole resolved cascade from
 *   the `lenses.json` directory walk. Per-fence URL-style query
 *   overrides and sibling `@study-lens` directive JSON overrides
 *   are **deep-merged INTO `configs.lenses[lens]`** at plugin
 *   emission time, so the orchestrator reads `configs.lenses?.[lens]`
 *   as the authoritative per-lens config. Other top-level keys
 *   (`defaults`, `embedSiblings`, `exerciseSetPrefixes`) are
 *   accepted but unused today (L2 may consume them).
 *
 * **Resolution chain for any lens-name** (two tiers, post-3-prop
 * reshape):
 *
 * ```text
 * resolved(lensName) = module.config()                  // tier 0: defaults
 *                    ⊕ configs.lenses?.[lensName]       // tier 1: cascade
 *                                                       //         (post-merge with
 *                                                       //          per-fence/sibling
 *                                                       //          override at plugin time)
 * ```
 *
 * (`⊕` = deep-merge-right-wins.) There is no separate per-fence-
 * override tier on the orchestrator side — the plugin pre-merges and
 * ships the result inside `configs.lenses[lens]`. The pre-3-prop F1
 * mount-time guard (`config` without resolved `lens` → throw) is
 * gone; with no separate `config` prop, the guard has no trigger
 * surface.
 *
 * @remarks **Plugin alignment**: the Docusaurus plugin at
 * `src/plugins/study-lenses/` parses URL-style fence info-strings
 * (`js:trace?stepDelay=500` → `lens="trace"` and deep-merges
 * `{ stepDelay: "500" }` INTO `cascade.lenses["trace"]`) and the
 * `lenses.json` cascade, then emits the **three props** onto the
 * rendered `<StudyLenses>` JSX node. See WS3 handoff § Cross-handoff
 * impact for the plugin-emit narrowing schedule.
 */
type StudyLensesProps = Readonly<{
	snippet: string;
	lens?: string;
	configs?: Readonly<Record<string, unknown>>;
}>;

// --- Internal mode state (2-state machine per WS3 F2) ---

/**
 * Editor mode — home base mounted; learner edits the snippet
 * string. No active lens.
 *
 * @remarks Per `./README.md` § Glossary. The live embodiment
 * lives in the top-level `LiveEmbodiment` slot, NOT here —
 * `EditorModeState` is intentionally minimal so the discriminator's
 * only role is to name the rendered subtree.
 *
 * The edit callback (`onSnippetChange`) flows through
 * `<EditorComponent>`'s prop surface and is wired up by the
 * orchestrator at render time — not stored on this state.
 */
type EditorModeState = Readonly<{
	mode: 'editor';
}>;

/**
 * Lens mode — a lens is mounted. Snippet is read-only.
 *
 * @remarks Per `./README.md` § Glossary. The frozen embodiment is
 * stored in the top-level `LiveEmbodiment` slot (single
 * authoritative location); `LensModeState` carries only the
 * orchestrator's lens-mode-specific bookkeeping. `activeLens` is
 * a separate field (rather than implied by render-time prop
 * inspection) so in-mode lens-switching can change it
 * without re-deriving from props.
 *
 * **Coherence invariant** (enforced by transition logic, not
 * the type system): when `state.mode === 'lens'`, the
 * orchestrator's `liveEmbodiment` slot is non-null AND
 * `liveEmbodiment.snippet === currentSnippet` AND
 * `liveEmbodiment.type === currentType` (a stale slot — snippet or
 * type mismatch — is a loud failure, not just a null one).
 */
type LensModeState = Readonly<{
	mode: 'lens';
	activeLens: string;
	resolvedConfig: LensConfig;
}>;

/**
 * The orchestrator's mode-discriminated state. Exactly one mode at
 * a time (no concurrent editor+lens rendering).
 *
 * @remarks The snippet string and the live embodiment are each
 * owned in their own top-level state slot, separately from this
 * union. See `LiveEmbodiment` and `./README.md` § Live embodiment
 * for the slot contract.
 */
type OrchestratorState = EditorModeState | LensModeState;

/**
 * The orchestrator's live static embodiment of the editing buffer.
 * Single authoritative storage location for the `Snippet`; lens-mode
 * rendering reads `liveEmbodiment.embodiment` directly, and the
 * editor-mode gutter + the phases panel read its `status` /
 * `errors` / `validation`. Held in a separate top-level `useState`
 * slot alongside `OrchestratorState`.
 *
 * @remarks Trigger semantics (per `./README.md` § Live embodiment):
 *
 * - Initial mount (either mode): populated atomically with a fresh
 *   `embody(snippet, { type })`.
 * - Editor mode, on edit: a debounced static `embody()` refreshes the
 *   slot on the trailing edge (~200ms idle); the slot is NOT cleared.
 * - Editor → lens transition: flush-then-read — reuse when the slot
 *   matches `(currentSnippet, currentType)`, else `embody()`
 *   synchronously inline; cancel any pending debounce.
 * - Lens → editor transition: slot RETAINED.
 * - Type toggle (dock): re-embody immediately under the new type;
 *   cancel any pending debounce (in lens mode the toggle first
 *   returns to editor mode — disposability).
 *
 * `embody()` here is static-only (no worker); program execution stays
 * lazy. `snippet` + `type` carry the source string and source type the
 * `embodiment` was built from — the staleness / reuse check is the
 * `(snippet, type)` pair (string identity on both).
 */
type LiveEmbodiment = Readonly<{
	snippet: string;
	type: SnippetType;
	embodiment: Snippet;
}>;

// --- Phases-panel derivation shapes (Cycle 2) ---

/**
 * Per-station lens rosters — the output of the panel's static
 * station-roster derivation: which registered lenses staff each
 * station's dropdown.
 *
 * @remarks Keyed by every `Station` — a station no lens targets maps to
 * an empty array (full five-key shape, never an absent key). Values are
 * lens names (registry keys) in registration order. Derived once per
 * registry load and invariant across edits — the static one of the
 * panel's three derivations (static roster · per-edit availability ·
 * per-edit status; distinct inputs and cadences, never coupled).
 * Panel-excluded lenses (no `LensModule.phase`) appear in no roster.
 */
type StationRoster = Readonly<Record<Station, readonly string[]>>;

/**
 * A station's per-edit status — the value-space of the panel's
 * station-status derivation (locked in Cycle 2 Phase 0; full model in
 * `./README.md` § Station-status model).
 *
 * @remarks `constant` — no machine status, never greys (`source`,
 * `realm`). `ok` — the machine completed this stage. `errored` — the
 * machine tripped AT this stage (machine phases only; a validation
 * refusal HIDES the LL stations via the availability derivation — it
 * never renders here). `barred` — unreachable, an earlier MACHINE phase
 * failed. `pending` — not yet reported: nothing failed before it, but
 * the machine has not instrumented this stage (honest under stubs —
 * never `ok` while a slice is stubbed, never `barred` without an
 * upstream failure).
 */
type StationStatus = 'constant' | 'ok' | 'errored' | 'barred' | 'pending';

/**
 * Per-station statuses — the output of the panel's per-edit
 * station-status derivation, always carrying ALL five stations.
 *
 * @remarks Computed from the live embodiment's whole `Status` +
 * `errors` only — deliberately UNCOUPLED from the availability
 * derivation (the three panel derivations have distinct inputs and
 * cadences); the panel renders the shown intersection.
 */
type StationStatusMap = Readonly<Record<Station, StationStatus>>;

// --- Dock / omnipresent-region shapes (Cycle 3) ---

/**
 * The learner-facing run-limits pair — the seconds + iterations execution
 * limits the dock exposes, threaded into embody's `EvaluateOptions`.
 *
 * @remarks "Run limits" is the learner-facing name over two embody mechanisms
 * (the run's time budget + the loop guard); a tripped limit surfaces as
 * `EndReport.outcome: 'limit-exceeded'`. See `./README.md` § Glossary.
 */
type RunLimits = Readonly<{
	seconds: number;
	iterations: number;
}>;

/**
 * The dock's transport phase — its run lifecycle, distinct from the run's
 * RESULT (`EndReportOutcome`). `'idle'` (never run) → `'running'` (handle
 * pending) → `'settled'` (handle resolved — read the outcome for HOW it ended).
 *
 * @remarks Deliberately orthogonal to the outcome: `'settled'` collapses every
 * terminal outcome (completed / errored / timed-out / …) into "the handle
 * resolved", so the two never describe the same axis at two grains. Surfaced as
 * `data-orchestrator-dock-run-state`.
 */
type DockRunState = 'idle' | 'running' | 'settled';

/**
 * The two NM I/O channels — `'user-interface'` (alert/confirm/prompt — the
 * interactive user-audience channel) and `'developer-console'` (`console.*` — the
 * passive dev-audience channel).
 *
 * @remarks Each channel renders in its **output panel** (the content-row surface
 * right of the active surface — `./output-panels/`), surfaced as
 * `data-orchestrator-output-channel="<ChannelKind>"` (renamed from the retired
 * `-dock-channel` when the channels left the dock). Homonym: an **output panel** is
 * NOT **the phases panel** — see `./README.md` § Glossary.
 */
type ChannelKind = 'user-interface' | 'developer-console';

/**
 * Per-channel dismissal flags for the output panels. `true` = the learner dismissed
 * that panel (✕); it is not rendered until the next Run resets the slot.
 *
 * @remarks A top-level orchestrator `useState` slot, reset in `handleRun` (same batch
 * as the channel-output reset). Panel **appearance** is otherwise derived, not stored:
 * the `<OutputPanels>` surface mounts only while `runState !== 'idle'`, and within it
 * a channel renders iff `!dismissed[channel]`. The User Interface panel cannot be
 * dismissed while an interaction is pending (modal). See `./README.md` § The output
 * panels.
 */
type OutputPanelDismissal = Readonly<Record<ChannelKind, boolean>>;

/**
 * A pending interactive IO request awaiting the learner's answer — the displayable
 * half of an in-flight `alert` / `confirm` / `prompt` call (`null` when nothing is
 * awaiting). A faithful, modal match for the native dialogs.
 *
 * @remarks During a run the orchestrator's async `IoMocks` (built in `handleRun`) set
 * this slot and return the Promise the worker awaits; the User Interface panel renders
 * it and routes the answer back through `onAnswer`, which resolves the Promise (the
 * resolver is held in a ref, NOT here — this carries only render data) and clears the
 * slot. The worker pauses while it awaits (run timer paused). **Single-pending
 * invariant:** the engine serializes IO on the SAB, so at most one is pending at a
 * time. Per-kind answer contract is {@link InteractionAnswer}. See
 * [`../embody/lib/evaluating/intercept/README.md`](../embody/lib/evaluating/intercept/README.md)
 * § IO execution model and `./README.md` § The output panels.
 */
type PendingInteraction =
	| Readonly<{ kind: 'alert'; message: string }>
	| Readonly<{ kind: 'confirm'; message: string }>
	| Readonly<{ kind: 'prompt'; message: string; defaultValue?: string }>;

/**
 * The learner's answer to a {@link PendingInteraction}, routed up via the output
 * panels' `onAnswer` and passed to the run's held resolver. Mirrors the natives
 * per-kind: `alert` → `undefined` (native returns `void`); `confirm` → `boolean`;
 * `prompt` → `string | null`.
 */
type InteractionAnswer = undefined | boolean | string | null;

/**
 * The terminal classification of one run — embody's `EndReport['outcome']`
 * union, aliased under an orchestrator-local name so dock code renders an
 * outcome without re-importing embody internals at each site.
 *
 * @remarks Present (on `data-orchestrator-dock-outcome`) only when the
 * `DockRunState` is `'settled'`. The full union lives in
 * [`../embody/types.ts`](../embody/types.ts).
 */
type EndReportOutcome = EndReport['outcome'];

/**
 * The orchestrator-level configs tier — read INTERNALLY from
 * `configs.orchestrator` at a cast boundary (the same structural-assumption
 * pattern as `configs.lenses`, via a `readOrchestratorConfig` helper), NOT a
 * widening of the maximally-opaque public `StudyLensesProps['configs']`.
 *
 * @remarks Seeds the dock's top-level state slots at mount; unconfigured fields
 * fall back to built-in defaults and reset on remount (the LMS owns persistence
 * — disposability). See `./README.md` § Orchestrator-level settings.
 *
 * - `initialType` — seeds the source-type slot (default `'module'`).
 * - `dangerAvailable` — whether the sandbox toggle offers the `'danger'`
 *   position (educators may remove it per page; default `false`).
 * - `runLimits` — seeds the run-limits slots (partial; unset fields use
 *   built-in defaults).
 */
type OrchestratorConfig = Readonly<{
	initialType?: SnippetType;
	dangerAvailable?: boolean;
	runLimits?: Readonly<{ seconds?: number; iterations?: number }>;
}>;

// --- Lens selection (where a switch came from) ---

/**
 * Source of a lens-selection event — useful for analytics, panel
 * highlighting logic, and (future) exercise-completion attribution.
 *
 * @remarks Current enumeration (each value pinned to a dispatch site):
 * - `'initial'` — the one-time post-commit `useEffect([])` that fires
 *   when first render lands in lens mode.
 * - `'prop'` — the prop-change effect (`useEffect([lens, configs])`)
 *   that fires when an external consumer changes the lens prop.
 * - `'panel'` — a phases-panel station dropdown's `onChange` handler
 *   (the Cycle-2 dispatch site this value was reserved for; it replaced
 *   the toolbar picker's retired `'picker'` value, which left the union
 *   WITH its dispatch site — every value stays pinned to a live site).
 * - `'edit-button'` — the panel's edit-return `<button>`'s `onClick`
 *   handler. This site does NOT dispatch `lens-switched`; the source
 *   value is computed by `applyTransition` but never reaches a bus
 *   subscriber (see the "Open holes" note on `ModeChangedPayload`).
 *
 * **Extension policy.** Adding a value to this union requires:
 * 1. An AR-1 design review (this is a contract, not an implementation
 *    detail — silent widening has caused alignment drift before).
 * 2. A defensible dispatch site that supplies the value at runtime.
 * 3. A `README.md` glossary entry naming the affordance the value
 *    represents.
 * Only the human can waive the AR-1 step. Agents do not self-waive.
 */
type LensSelectionSource = 'panel' | 'prop' | 'initial' | 'edit-button';

// --- INTERNAL EventBus taxonomy ---

/**
 * Internal event names. INTERNAL-ONLY — never exposed via a
 * `subscribe` / `onEvent` prop on `<StudyLenses>` until a concrete
 * LMS integration target appears.
 *
 * @remarks Each name maps to a payload shape via `EventPayloadMap`.
 * The taxonomy is `lens-switched`, `mode-changed`, `type-toggled`,
 * and `sandbox-toggled` — the latter two are typed now and dispatch
 * from the dock when it is built (the typed-before-wired pattern
 * `LensSelectionSource`'s `'panel'` followed until the phases panel
 * landed its dispatch site). Later cycles may add
 * `exercise-completed`, `lens-mount-error`.
 */
const EVENT_NAMES = Object.freeze({
	LENS_SWITCHED: 'lens-switched',
	MODE_CHANGED: 'mode-changed',
	TYPE_TOGGLED: 'type-toggled',
	SANDBOX_TOGGLED: 'sandbox-toggled',
} as const);

type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];

/**
 * Payload for `lens-switched`. Fires when the active lens changes
 * inside lens mode (a station-dropdown selection).
 *
 * @remarks `previous` may be `null` on the very first lens-mount
 * (editor → lens transition); subsequent in-mode switches always
 * have a non-null previous. `source` is optional because the
 * orchestrator does not require subscribers to discriminate by
 * source: subscribers that care about provenance (analytics, future
 * audit) read the field; subscribers that only care about the
 * lens-mount transition ignore it. Each dispatch site that can
 * compute a defensible `LensSelectionSource` supplies one; sites
 * without a meaningful source omit it.
 */
type LensSwitchedPayload = Readonly<{
	previous: string | null;
	next: string;
	source?: LensSelectionSource;
}>;

/**
 * Payload for `mode-changed`. Fires on editor ↔ lens mode
 * transitions.
 *
 * @remarks Subscribers that need to inspect the new active lens (on
 * editor → lens) can correlate this with the subsequent
 * `lens-switched` dispatch — they fire in the same React commit, in
 * deterministic order (mode-changed before lens-switched).
 */
type ModeChangedPayload = Readonly<{
	from: 'editor' | 'lens';
	to: 'editor' | 'lens';
}>;

/**
 * The dock's execution-backend selector — `'worker'` (the sandboxed
 * default) or `'danger'` (iframe script-tag evaluation). See
 * `./README.md` § The dock.
 */
type SandboxMode = 'worker' | 'danger';

/**
 * Payload for `type-toggled`. Fires when the dock's type toggle
 * changes the snippet's source type (script ↔ module). Dispatch site
 * lands with the dock; typed-before-wired.
 */
type TypeToggledPayload = Readonly<{
	from: SnippetType;
	to: SnippetType;
}>;

/**
 * Payload for `sandbox-toggled`. Fires when the dock's sandbox toggle
 * changes the execution backend (worker ↔ danger). Dispatch site lands
 * with the dock; typed-before-wired.
 */
type SandboxToggledPayload = Readonly<{
	from: SandboxMode;
	to: SandboxMode;
}>;

/**
 * Type-level mapping from event name to payload shape. The
 * `EventBus.dispatch` / `EventBus.subscribe` generics index this map
 * to constrain payload types per event name.
 */
type EventPayloadMap = Readonly<{
	'lens-switched': LensSwitchedPayload;
	'mode-changed': ModeChangedPayload;
	'type-toggled': TypeToggledPayload;
	'sandbox-toggled': SandboxToggledPayload;
}>;

type EventPayload<N extends EventName> = EventPayloadMap[N];

/**
 * Listener callback shape. Listeners are invoked synchronously in
 * registration order when their event is dispatched.
 */
type EventListener<N extends EventName> = (payload: EventPayload<N>) => void;

/**
 * Per-instance typed pub/sub bus. Each orchestrator owns its own
 * bus — isolation is structural (no DOM, no global registry).
 *
 * @remarks Dispatch semantics carry forward from
 * `study-lenses/types.ts:396-401`: synchronous; listeners execute
 * in registration order; a thrown listener is caught, warned, and
 * does not abort remaining listeners; re-entrant dispatch is
 * permitted (depth-first). See `./DOCS.md` § Internal event taxonomy
 * for the full contract.
 */
type EventBus = Readonly<{
	dispatch<N extends EventName>(name: N, payload: EventPayload<N>): void;
	subscribe<N extends EventName>(
		name: N,
		listener: EventListener<N>,
	): () => void;
	unsubscribe<N extends EventName>(name: N, listener: EventListener<N>): void;
	clear(): void;
}>;

export type {
	StudyLensesProps,
	OrchestratorState,
	EditorModeState,
	LensModeState,
	LiveEmbodiment,
	StationRoster,
	StationStatus,
	StationStatusMap,
	RunLimits,
	DockRunState,
	ChannelKind,
	OutputPanelDismissal,
	PendingInteraction,
	InteractionAnswer,
	EndReportOutcome,
	OrchestratorConfig,
	LensSelectionSource,
	SandboxMode,
	EventName,
	EventPayload,
	EventPayloadMap,
	EventListener,
	EventBus,
	LensSwitchedPayload,
	ModeChangedPayload,
	TypeToggledPayload,
	SandboxToggledPayload,
};

export { EVENT_NAMES };
