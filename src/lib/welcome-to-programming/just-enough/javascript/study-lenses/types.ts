/**
 * @file Shared types for the study-lenses system.
 *
 * @remarks Two module contracts (TransformModule, LensModule) and the
 * Recommendation type used by the recommender. The return type IS the
 * only difference between transforms and lenses — enforced at the type
 * level so pipelines are structurally validated.
 */

import type React from 'react';

// --- Transform contract ---

type TransformConfig = Readonly<Record<string, unknown>>;

/**
 * A code-to-code transformation module. Transforms accept a code string
 * and return a transformed code string. They never produce UI. Zero or
 * more transforms chain in a pipeline before a terminal lens.
 */
type TransformModule = Readonly<{
	name: string;
	transform: (code: string, config?: TransformConfig) => string;
	config: (overrides?: Partial<TransformConfig>) => TransformConfig;
}>;

// --- Lens contract ---

type LensConfig = Readonly<Record<string, unknown>>;

/**
 * A code-to-component lens module. Lenses accept a code string and
 * return a renderable component. Always terminal — exactly one per
 * pipeline. Each lens self-describes its relevance for a given snippet
 * via `recommend()`.
 */
type LensModule = Readonly<{
	name: string;
	lens: (code: string, config?: LensConfig) => React.JSX.Element;
	config: (overrides?: Partial<LensConfig>) => LensConfig;
	recommend: (analysis: AnalysisReport) => ReadonlyArray<Recommendation>;
}>;

// --- Recommendation ---

type BlockModelCell = Readonly<{
	level: 'surface' | 'execution' | 'function';
	scope: 'atoms' | 'blocks' | 'relations' | 'macro';
	nmComponents?: ReadonlyArray<string>;
}>;

/**
 * A single recommendation from a lens. A lens can return multiple
 * recommendations at different Block Model cells with different configs.
 */
type Recommendation = Readonly<{
	lens: string;
	config: LensConfig;
	relevance: number;
	blockModelCell: BlockModelCell;
	transforms?: ReadonlyArray<string>;
	label: string;
}>;

// --- Pipeline ---

/**
 * A structurally typed pipeline: zero or more transforms followed by
 * exactly one lens. Build-time validation by the plugin ensures this
 * invariant; the orchestrator trusts the prop shape.
 */
type Pipeline = Readonly<{
	transforms: ReadonlyArray<string>;
	lens: string;
}>;

// --- Snippet analysis (consumed from lib/analysis/) ---

/**
 * Placeholder for the snippet analysis report. The full type will be
 * defined in `lib/analysis/types.ts` during that module's DDD Phase 0.
 * Listed here so the `LensModule.recommend` signature is complete.
 */
type AnalysisReport = Readonly<Record<string, unknown>>;

// --- Orchestrator state ---

/**
 * The orchestrator's state shape. `initialLens` and `initialTransforms`
 * are readonly config (set once from props); `activeLens`,
 * `activeTransforms`, and `snippet` are mutable state.
 */
type OrchestratorState = Readonly<{
	originalCode: string;
	snippet: string;
	initialLens: string;
	activeLens: string;
	initialTransforms: ReadonlyArray<string>;
	activeTransforms: ReadonlyArray<string>;
	snippetName: string;
}>;

// --- Plugin → orchestrator prop contract ---

/**
 * The flat prop shape the Docusaurus plugin currently emits via
 * `<StudyLens>` (singular tag name at the JSX level; reconciled to
 * the `<StudyLenses>` orchestrator component through the swizzled
 * `MDXComponents` registry).
 *
 * @remarks The plugin does NOT yet parse comma-separated fence
 * syntax — `lens` is a single lens name today. The orchestrator
 * parses this into an internal `Pipeline`. Updating the plugin to
 * emit `Pipeline` directly is backlogged (master plan §Backlog).
 *
 * `lang` is passed through for historical reasons; the orchestrator
 * accepts it and validates that it is `'js'` (JEJ-only). Non-JS
 * values produce a console warning and a diagnostic banner.
 */
type PluginEmittedProps = Readonly<{
	code: string;
	lens?: string;
	lang?: string;
	config?: string | Readonly<Record<string, unknown>>;
}>;

// --- Event protocol (payload shapes only; dispatch mechanism is in event-bus.ts) ---

/**
 * The canonical set of event names used by the orchestrator ↔ lens
 * event protocol. Defined as a frozen const record so event names
 * are discoverable via the `EVENT_NAMES` object and type-checked via
 * the `EventName` union.
 *
 * @remarks Lens → orchestrator:
 * - `SNIPPET_CHANGED` — the `editor` lens (or any write-through lens)
 *   updates the snippet.
 * - `EXERCISE_COMPLETED` — a lens reports that the learner has
 *   completed its exercise (for future engagement tracking).
 * - `CONFIG_CHANGED` — a lens's internal config changed (e.g. blanks
 *   difficulty setting).
 *
 * Orchestrator → lens:
 * - `LENS_SWITCHED` — the active lens changed.
 * - `TRANSFORMS_CHANGED` — the active transform list changed.
 * - `STATE_RESET` — Reset was invoked (code-only).
 * - `STATE_RESET_ALL` — Reset All was invoked (code + initial lens +
 *   initial transforms + cache clear).
 * - `SNIPPET_NAME_CHANGED` — the learner updated the snippet name
 *   field.
 */
const EVENT_NAMES = Object.freeze({
	SNIPPET_CHANGED: 'snippet-changed',
	EXERCISE_COMPLETED: 'exercise-completed',
	CONFIG_CHANGED: 'config-changed',
	LENS_SWITCHED: 'lens-switched',
	TRANSFORMS_CHANGED: 'transforms-changed',
	STATE_RESET: 'state-reset',
	STATE_RESET_ALL: 'state-reset-all',
	SNIPPET_NAME_CHANGED: 'snippet-name-changed',
} as const);

type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];

/**
 * Payload shape for `snippet-changed`. Dispatched by a lens when the
 * learner has edited the snippet. `source` identifies the lens that
 * produced the change (useful for filtering in re-entrant dispatches).
 */
type SnippetChangedPayload = Readonly<{
	snippet: string;
	source: string;
}>;

/**
 * Payload shape for `exercise-completed`. Dispatched by a lens when
 * the learner completes its exercise (e.g. all blanks filled
 * correctly). Carries lens-specific completion data.
 */
type ExerciseCompletedPayload = Readonly<{
	lens: string;
	durationMs: number;
	attempts: number;
}>;

/**
 * Payload shape for `config-changed`. Dispatched when a lens's
 * internal config changes (e.g. blanks-difficulty slider).
 */
type ConfigChangedPayload = Readonly<{
	lens: string;
	config: LensConfig;
}>;

/**
 * Payload shape for `lens-switched`. Dispatched by the orchestrator
 * after the active lens changes. `previous` may be null on first
 * mount.
 */
type LensSwitchedPayload = Readonly<{
	previous: string | null;
	next: string;
}>;

/**
 * Payload shape for `transforms-changed`. Dispatched by the
 * orchestrator after a transform toggle or recommender-driven
 * pipeline change. Carries the previous and next transform lists.
 */
type TransformsChangedPayload = Readonly<{
	previous: ReadonlyArray<string>;
	next: ReadonlyArray<string>;
}>;

/**
 * Payload shape for `state-reset` (Reset, code-only). Dispatched by
 * the orchestrator after Reset. Carries the code that the snippet was
 * restored to (the original `code` prop).
 */
type StateResetPayload = Readonly<{
	snippet: string;
}>;

/**
 * Payload shape for `state-reset-all` (Reset All, full). Dispatched
 * by the orchestrator after Reset All. Carries the full restored
 * state.
 */
type StateResetAllPayload = Readonly<{
	snippet: string;
	lens: string;
	transforms: ReadonlyArray<string>;
}>;

/**
 * Payload shape for `snippet-name-changed`. Dispatched by the
 * orchestrator when the learner updates the snippet name field.
 */
type SnippetNameChangedPayload = Readonly<{
	name: string;
}>;

/**
 * Type-level mapping from event name to its payload shape. The
 * `EventBus.dispatch` / `EventBus.subscribe` generics index this map
 * to constrain payload types per event name.
 */
type EventPayloadMap = Readonly<{
	'snippet-changed': SnippetChangedPayload;
	'exercise-completed': ExerciseCompletedPayload;
	'config-changed': ConfigChangedPayload;
	'lens-switched': LensSwitchedPayload;
	'transforms-changed': TransformsChangedPayload;
	'state-reset': StateResetPayload;
	'state-reset-all': StateResetAllPayload;
	'snippet-name-changed': SnippetNameChangedPayload;
}>;

type EventPayload<N extends EventName> = EventPayloadMap[N];

/**
 * Listener callback shape. Listeners are invoked synchronously in
 * registration order when their event is dispatched.
 */
type EventListener<N extends EventName> = (
	payload: EventPayload<N>,
) => void;

/**
 * Per-instance typed pub/sub bus. Each orchestrator owns its own
 * bus — isolation is structural (no DOM, no global registry).
 *
 * @remarks Dispatch semantics: synchronous; listeners execute in
 * registration order; a thrown listener is caught, warned, and does
 * not abort remaining listeners; re-entrant dispatch is permitted
 * (depth-first). See `DOCS.md §Structural constraints` for the
 * full contract.
 */
type EventBus = Readonly<{
	dispatch<N extends EventName>(name: N, payload: EventPayload<N>): void;
	subscribe<N extends EventName>(name: N, listener: EventListener<N>): void;
	unsubscribe<N extends EventName>(name: N, listener: EventListener<N>): void;
	clear(): void;
}>;

// --- Transform failure mode (AR-1 Concern #10 — awaiting user approval
//     to wire into TransformModule.onFailure) ---

/**
 * Declared failure semantics for a transform. Not yet part of
 * `TransformModule` — pending user decision per AR-1 Concern #10.
 *
 * - `'abort'` — transform failure renders the original snippet in a
 *   read-only diagnostic panel (no lens mounted). Safe default.
 * - `'fallthrough'` — transform failure falls back to the
 *   untransformed snippet + console warning. Useful for cosmetic
 *   transforms (format) where the untransformed code is still safe
 *   and useful.
 */
type TransformFailureMode = 'abort' | 'fallthrough';

export type {
	TransformModule,
	TransformConfig,
	LensModule,
	LensConfig,
	BlockModelCell,
	Recommendation,
	Pipeline,
	AnalysisReport,
	OrchestratorState,
	PluginEmittedProps,
	EventName,
	SnippetChangedPayload,
	ExerciseCompletedPayload,
	ConfigChangedPayload,
	LensSwitchedPayload,
	TransformsChangedPayload,
	StateResetPayload,
	StateResetAllPayload,
	SnippetNameChangedPayload,
	EventPayloadMap,
	EventPayload,
	EventListener,
	EventBus,
	TransformFailureMode,
};

export { EVENT_NAMES };
