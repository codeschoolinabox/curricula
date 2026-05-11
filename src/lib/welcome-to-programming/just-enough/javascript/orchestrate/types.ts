/**
 * @file Orchestrator-internal contract — the `<StudyLenses>` prop
 * surface, the internal state shape, and the INTERNAL EventBus event
 * taxonomy. Adapted from `study-lenses/types.ts:32-401` (the
 * pre-refactor orchestrator types).
 *
 * @remarks **What changed from the pre-refactor shape**:
 * - Replace the multi-prop `<StudyLenses code? lens? lensConfig?
 *   transforms? height? autoFocus? lenses>` API with the locked
 *   **three-prop API**: `<StudyLenses snippet lens? configs?>`
 *   (per `../DOCS.md` § Public surface). `configs` carries the whole
 *   resolved cascade; per-fence URL-style queries and sibling
 *   `@study-lens` directive JSON are deep-merged INTO
 *   `configs.lenses[lens]` at plugin emission time. Resolution chain
 *   collapses to two tiers:
 *   `resolved(lens) = module.config() ⊕ configs.lenses?.[lens]`.
 *   The pre-3-prop `config?` prop is absorbed; the F1 mount-time
 *   guard (`config` without resolved `lens` → throw) is gone with it.
 * - Drop `transforms` prop and `TransformModule`-related types
 *   entirely (no transforms tier in the new architecture).
 * - Replace `OrchestratorState`'s always-active-lens shape with a
 *   2-mode discriminated-union state (`editor` | `lens`), per WS3
 *   handoff F2.
 * - Add `embodiment` cache slot to lens-mode state — built lazily on
 *   editor → lens transition, invalidated on every snippet edit (per
 *   WS3 handoff F3).
 * - Drop `Registry` type — the lens registry shape is open-spec
 *   (likely a static import-list); F4 Phase 0 settles. This file
 *   pins only the orchestrator-side consumer of the registry, not
 *   the registry itself.
 * - Trim `EVENT_NAMES` to the post-refactor taxonomy: keep
 *   `lens-switched` (carries forward from Inc-9), add `mode-changed`
 *   (new for the 2-mode state machine). Defer `exercise-completed`,
 *   `lens-mount-error` to F5+.
 * - INTERNAL-only — no `subscribe` / `onEvent` prop on
 *   `<StudyLenses>` until a concrete LMS integration target appears
 *   (per WS3 handoff F5).
 *
 * **What survives unchanged**: the `EventBus` shape (typed
 * dispatch/subscribe/unsubscribe/clear), per-instance ownership
 * (each `<StudyLenses>` mount owns its own bus, no global registry).
 *
 * **TBD markers** — F1 Phase 0 locks these specifics:
 * - `OrchestratorState.lens.embodiment` may need a discriminator for
 *   "embody-in-flight" vs "embody-resolved" if F3 lifts the sync
 *   contract; sketched here as sync-only for now.
 * - `LensSelectionSource` enumeration may grow with L5/L6 (panel
 *   click vs picker change vs keyboard shortcut).
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
 * @remarks
 * - `snippet` — the source string. The orchestrator builds the
 *   embodiment internally on lens-open (lazy). Caller does NOT
 *   pre-build.
 * - `lens?` — Q-III educator-supplied default-mount lens name. The
 *   learner can switch via the toolbar picker; this is just the
 *   initial selection.
 * - `configs?` — the **whole resolved cascade** (opaque passthrough)
 *   from the Docusaurus plugin's `lenses.json` directory walk.
 *   Per-fence URL-style query overrides and sibling `@study-lens`
 *   directive JSON overrides are **deep-merged INTO
 *   `configs.lenses[lens]`** at plugin emission time, so the
 *   orchestrator reads `configs.lenses?.[lens]` as the authoritative
 *   per-lens config. Other top-level keys (`defaults`,
 *   `embedSiblings`, `exerciseSetPrefixes`) are accepted but unused
 *   at F1+B (L2 may consume them).
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
 *
 * **`configs` typing.** The structural shape is the plugin's
 * `ResolvedConfig` (`{ defaults, embedSiblings, lenses, … }`); the
 * orchestrator types it loosely here as a record-with-`lenses` so
 * the plugin's exact `ResolvedConfig` shape stays a plugin-internal
 * detail. The orchestrator only reads `configs.lenses?.[lensName]`
 * for the per-lens config; other top-level keys (`defaults`,
 * `embedSiblings`, `exerciseSetPrefixes`) are accepted via
 * TypeScript's structural width-permissiveness and unused at F1+B.
 *
 * The inner per-lens value is typed as
 * `Readonly<Record<string, unknown>>` — **deliberately wider than
 * the lens-side `LensConfig`** — because the plugin's cascade
 * resolver does not validate against the lens-side schema (see
 * plugin README § `lenses.json` schema "Lens-config value shape").
 * Strictness is enforced at the lens-prop boundary (where the
 * orchestrator's resolution chain casts to `LensConfig` after
 * deep-merging tier 0 ⊕ tier 1) — a runtime trust point, not a
 * compile-time guarantee at the `<StudyLenses>` public API.
 */
type StudyLensesProps = Readonly<{
	snippet: string;
	lens?: string;
	configs?: Readonly<{
		lenses?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
	}>;
}>;

// --- Internal mode state (2-state machine per WS3 F2) ---

/**
 * Editor mode — home base mounted; learner edits the snippet
 * string. No active lens, no embodiment built. Picker is visible.
 *
 * @remarks Per WS3 handoff F2 + `./DOCS.md` § Lifecycle modes.
 */
type EditorModeState = Readonly<{
	mode: 'editor';
}>;

/**
 * Lens mode — a lens is mounted with a frozen embodiment + config
 * bundle as React props. Snippet is read-only. Picker is still
 * visible (Q-I autonomy guarantee).
 *
 * @remarks Per WS3 handoff F2 + F3. The `embodiment` is built lazily
 * on editor → lens transition and survives lens-mode switches; it's
 * invalidated only on snippet edit (which forces an editor → lens
 * round-trip to rebuild).
 */
type LensModeState = Readonly<{
	mode: 'lens';
	activeLens: string;
	embodiment: Snippet;
	resolvedConfig: LensConfig | undefined;
}>;

/**
 * The orchestrator's mode-discriminated state. Exactly one mode at
 * a time (no concurrent editor+lens rendering).
 *
 * @remarks The snippet string itself is owned separately (controlled
 * by the editor; lives in `<StudyLenses>`'s `useState` independent
 * of mode). When a snippet edit fires, it updates the snippet state
 * AND invalidates any cached embodiment in lens mode (forcing the
 * orchestrator to surface a "stale, please re-open lens" affordance
 * OR transition automatically — F3 Phase 0 picks).
 */
type OrchestratorState = EditorModeState | LensModeState;

// --- Lens selection (where a switch came from) ---

/**
 * Source of a lens-selection event — useful for analytics, picker
 * highlighting logic, and (future) exercise-completion attribution.
 *
 * @remarks Sketched here; F1 Phase 0 may grow this enumeration as
 * L5/L6 land (panel click, keyboard shortcut, programmatic-prop
 * change, etc.).
 */
type LensSelectionSource = 'picker' | 'panel' | 'prop' | 'initial';

// --- INTERNAL EventBus taxonomy ---

/**
 * Internal event names. INTERNAL-ONLY — never exposed via a
 * `subscribe` / `onEvent` prop on `<StudyLenses>` until a concrete
 * LMS integration target appears (per WS3 handoff F5).
 *
 * @remarks Each name maps to a payload shape via `EventPayloadMap`.
 * F5 implements `lens-switched` and `mode-changed`; later
 * increments add `exercise-completed`, `lens-mount-error`.
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
 * have a non-null previous.
 */
type LensSwitchedPayload = Readonly<{
	previous: string | null;
	next: string;
	source: LensSelectionSource;
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
