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
 *   is refreshed by a debounced static `embody()` while editing and
 *   flushed on `editor → lens`; it survives `lens → editor` round-trips.
 * - INTERNAL-only EventBus — no `subscribe` / `onEvent` prop on
 *   `<StudyLenses>` until a concrete LMS integration target appears.
 *   `lens-switched` (carried forward from the pre-refactor
 *   orchestrator) and `mode-changed` (new for the 2-mode state
 *   machine) are the only event names today.
 *
 * **What survives unchanged**: the `EventBus` shape (typed
 * dispatch/subscribe/unsubscribe/clear), per-instance ownership
 * (each `<StudyLenses>` mount owns its own bus, no global registry).
 *
 * **Open holes**:
 * - `LensSelectionSource` may still grow: `'panel'` is typed but
 *   unwired (reserved for the future Cycle-2 phase-station dispatch
 *   site, deferred); a keyboard-shortcut source could land alongside.
 *   Extensions are gated — see the policy block on the union itself.
 * - `'edit-button'` is typed (the toolbar edit-return click site
 *   computes it) but not externally observable today, because
 *   `ModeChangedPayload` carries only `{from, to}`. A future
 *   `ModeChangedPayload.source` extension would surface it; until
 *   then it exists for completeness and test introspection.
 *
 * @remarks This file is the orchestrator's INTERNAL contract.
 * Public surface is just `StudyLensesProps`. Everything else is
 * internal-only.
 */

import type { Snippet } from '../embody/types.js';
import type { LensConfig } from '../lenses/types.js';

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
 *   switch via the picker. This is just the initial selection.
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
 * `liveEmbodiment.snippet === currentSnippet` (a stale slot is a
 * loud failure, not just a null one).
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
 * editor-mode gutter + (Cycle-2) phase panel read its `status` /
 * `errors` / `validation`. Held in a separate top-level `useState`
 * slot alongside `OrchestratorState`.
 *
 * @remarks Trigger semantics (per `./README.md` § Live embodiment):
 *
 * - Initial mount (either mode): populated atomically with a fresh
 *   `embody(snippet)`.
 * - Editor mode, on edit: a debounced static `embody()` refreshes the
 *   slot on the trailing edge (~200ms idle); the slot is NOT cleared.
 * - Editor → lens transition: flush-then-read — reuse when
 *   `liveEmbodiment.snippet === currentSnippet`, else `embody()`
 *   synchronously inline; cancel any pending debounce.
 * - Lens → editor transition: slot RETAINED.
 *
 * `embody()` here is static-only (no worker); program execution stays
 * lazy. `snippet` carries the source the `embodiment` was built from —
 * the staleness / reuse check is string-identity (`===`).
 */
type LiveEmbodiment = Readonly<{
	snippet: string;
	embodiment: Snippet;
}>;

/**
 * @deprecated Transitional alias for {@link LiveEmbodiment}. The slot was
 * renamed `cachedEmbodiment` → `liveEmbodiment` for the live-embodiment
 * contract; this alias keeps pre-rename call sites compiling until the
 * orchestrator implementation is migrated (Cycle 1, increment 2a), after
 * which it is removed.
 */
type CachedEmbodiment = LiveEmbodiment;

// --- Lens selection (where a switch came from) ---

/**
 * Source of a lens-selection event — useful for analytics, picker
 * highlighting logic, and (future) exercise-completion attribution.
 *
 * @remarks Current enumeration (each value pinned to a dispatch site):
 * - `'initial'` — the one-time post-commit `useEffect([])` that fires
 *   when first render lands in lens mode.
 * - `'prop'` — the prop-change effect (`useEffect([lens, configs])`)
 *   that fires when an external consumer changes the lens prop.
 * - `'picker'` — the toolbar lens-picker `<select>`'s `onChange`
 *   handler.
 * - `'edit-button'` — the toolbar's edit-return `<button>`'s `onClick`
 *   handler. This site does NOT dispatch `lens-switched`; the source
 *   value is computed by `applyTransition` but never reaches a bus
 *   subscriber (see the "Open holes" note on `ModeChangedPayload`).
 * - `'panel'` — reserved for the future Cycle-2 phase-station
 *   dispatch site (deferred; typed but unwired).
 *
 * **Extension policy.** Adding a value to this union requires:
 * 1. An AR-1 design review (this is a contract, not an implementation
 *    detail — silent widening has caused alignment drift before).
 * 2. A defensible dispatch site that supplies the value at runtime.
 * 3. A `README.md` glossary entry naming the affordance the value
 *    represents.
 * Only the human can waive the AR-1 step. Agents do not self-waive.
 */
type LensSelectionSource =
	| 'picker'
	| 'panel'
	| 'prop'
	| 'initial'
	| 'edit-button';

// --- INTERNAL EventBus taxonomy ---

/**
 * Internal event names. INTERNAL-ONLY — never exposed via a
 * `subscribe` / `onEvent` prop on `<StudyLenses>` until a concrete
 * LMS integration target appears.
 *
 * @remarks Each name maps to a payload shape via `EventPayloadMap`.
 * Today's taxonomy is `lens-switched` and `mode-changed`; later
 * cycles add `exercise-completed`, `lens-mount-error`.
 */
const EVENT_NAMES = Object.freeze({
	LENS_SWITCHED: 'lens-switched',
	MODE_CHANGED: 'mode-changed',
} as const);

type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];

/**
 * Payload for `lens-switched`. Fires when the active lens changes
 * inside lens mode (picker change OR panel cell selection).
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
 * Type-level mapping from event name to payload shape. The
 * `EventBus.dispatch` / `EventBus.subscribe` generics index this map
 * to constrain payload types per event name.
 */
type EventPayloadMap = Readonly<{
	'lens-switched': LensSwitchedPayload;
	'mode-changed': ModeChangedPayload;
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
	CachedEmbodiment,
	LensSelectionSource,
	EventName,
	EventPayload,
	EventPayloadMap,
	EventListener,
	EventBus,
	LensSwitchedPayload,
	ModeChangedPayload,
};

export { EVENT_NAMES };
