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
 *   slot (`CachedEmbodiment | null`) ALONGSIDE the mode state — NOT
 *   inside `LensModeState`. Lens-mode rendering reads the embodiment
 *   from this slot. Cache survives `lens → editor` round-trips and is
 *   cleared only on snippet edit in editor mode.
 * - INTERNAL-only EventBus — no `subscribe` / `onEvent` prop on
 *   `<StudyLenses>` until a concrete LMS integration target appears
 *   (per WS3 handoff F5). `lens-switched` (forward from Inc-9) and
 *   `mode-changed` (new for the 2-mode state machine) are the only
 *   event names today.
 *
 * **What survives unchanged**: the `EventBus` shape (typed
 * dispatch/subscribe/unsubscribe/clear), per-instance ownership
 * (each `<StudyLenses>` mount owns its own bus, no global registry).
 *
 * **Open holes**:
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
 *   The orchestrator builds the embodiment internally on lens-open
 *   (lazy). Caller does NOT pre-build.
 * - `lens?` — Q-III educator-supplied default-mount lens name. The
 *   learner can switch via the toolbar picker (L1+); this is just
 *   the initial selection. Changes to this prop AFTER mount drive
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
 * (if any survives from a prior lens-mode session) lives in the
 * top-level `CachedEmbodiment` slot, NOT here — `EditorModeState`
 * is intentionally minimal so the discriminator's only role is
 * to name the rendered subtree.
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
 * stored in the top-level `CachedEmbodiment` slot (single
 * authoritative location); `LensModeState` carries only the
 * orchestrator's lens-mode-specific bookkeeping. `activeLens` is
 * a separate field (rather than implied by render-time prop
 * inspection) so F4's in-mode lens-switching can change it
 * without re-deriving from props.
 *
 * **Coherence invariant** (enforced by transition logic, not
 * the type system): when `state.mode === 'lens'`, the
 * orchestrator's `cachedEmbodiment` slot is non-null AND
 * `cachedEmbodiment.snippet === currentSnippet`.
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
 * @remarks The snippet string and the cached embodiment are each
 * owned in their own top-level state slot, separately from this
 * union. See `CachedEmbodiment` and `./README.md` § Cross-mode
 * embodiment cache for the cache contract.
 */
type OrchestratorState = EditorModeState | LensModeState;

/**
 * The orchestrator's lazy-embodiment memo. Single authoritative
 * storage location for the live `Snippet`; lens-mode rendering
 * reads `cachedEmbodiment.embodiment` directly. Held in a
 * separate top-level `useState` slot alongside
 * `OrchestratorState`.
 *
 * @remarks Trigger semantics (per `./README.md` § Cross-mode
 * embodiment cache):
 *
 * - Initial mount: populated atomically with `embody(snippet)` when
 *   `deriveInitialState` returns lens mode; `null` when it returns
 *   editor mode.
 * - Editor → lens transition: cache hit (`cache.snippet ===
 *   currentSnippet`) reuses `cache.embodiment`; otherwise call
 *   `embody(currentSnippet)` once and write the cache before
 *   committing the mode flip.
 * - Lens → editor transition: cache RETAINED (cross-mode survival).
 * - Snippet edit in editor mode: cache cleared (`null`).
 *
 * `snippet` field carries the source string the cached `embodiment`
 * was built from — equality check is string-identity (`===`).
 */
type CachedEmbodiment = Readonly<{
	snippet: string;
	embodiment: Snippet;
}>;

// --- Lens selection (where a switch came from) ---

/**
 * Source of a lens-selection event — useful for analytics, picker
 * highlighting logic, and (future) exercise-completion attribution.
 *
 * @remarks Sketched here; L5/L6 may grow this enumeration when they
 * land (panel click, keyboard shortcut, programmatic-prop change,
 * etc.). F5 is where the bus dispatch sites first compute and
 * supply a value.
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
