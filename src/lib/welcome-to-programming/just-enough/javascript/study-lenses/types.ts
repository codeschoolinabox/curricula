/**
 * @file Shared types for the study-lenses system.
 *
 * @remarks Two module contracts (TransformModule, LensModule) and the
 * Recommendation type used by the recommender. The return type IS the
 * only difference between transforms and lenses — enforced at the type
 * level so pipelines are structurally validated.
 *
 * This file is framework-agnostic: no React, no DOM globals beyond
 * `HTMLElement` on the `LensMount` handle. Lens React wrappers mount
 * into the `LensMount.el` element; the orchestrator's core logic never
 * needs JSX.
 */

// --- Serializable config values ---

/**
 * Primitive values that can be stably hashed (JSON-safe). Function,
 * symbol, Date, and class-instance values are deliberately excluded:
 * any such value in a config makes cache keys unreliable. Callbacks
 * and instance state belong on the EventBus or on `LensMount`, not in
 * config.
 */
type SerializablePrimitive = string | number | boolean | null;

/**
 * A config value — either a primitive or a readonly array of
 * primitives. Tight by design so config hashing is deterministic.
 */
type SerializableValue =
	| SerializablePrimitive
	| ReadonlyArray<SerializablePrimitive>;

// --- Transform contract ---

type TransformConfig = Readonly<Record<string, SerializableValue>>;

/**
 * A code-to-code transformation module. Transforms accept a code string
 * and return a transformed code string. They never produce UI. Zero or
 * more transforms chain in a pipeline before a terminal lens.
 *
 * @remarks `onFailure` declares what happens when `transform()` throws:
 * `'abort'` (the orchestrator's default when the field is absent) halts
 * the pipeline and renders the original snippet in a read-only
 * diagnostic banner; `'fallthrough'` logs a warning and passes the
 * untransformed snippet to the next stage. Safety-critical transforms
 * (loopGuard, translate) rely on the abort default; cosmetic transforms
 * (format) may opt into fallthrough.
 */
type TransformModule = Readonly<{
	name: string;
	transform: (code: string, config?: TransformConfig) => string;
	config: (overrides?: Partial<TransformConfig>) => TransformConfig;
	onFailure?: TransformFailureMode;
}>;

// --- Lens contract ---

type LensConfig = Readonly<Record<string, SerializableValue>>;

/**
 * A live lens instance returned by `LensModule.lens()`. Framework-
 * agnostic DOM handle — the orchestrator owns mount/detach and caches
 * the returned record.
 *
 * @remarks
 * - `el` is the detachable HTMLElement the orchestrator inserts into
 *   and removes from the visible DOM when switching lenses. The lens
 *   renders into `el`.
 * - `dispose` is the cleanup contract: called when the cache entry is
 *   evicted or the orchestrator unmounts. The lens owns tearing down
 *   subscriptions, event listeners, and heavy DOM (e.g.
 *   CodeMirror `EditorView.destroy()`).
 * - `onSnippetChanged` is the inversion-of-control hook. When the
 *   orchestrator's snippet changes via a source OTHER than this lens
 *   itself (a transform toggle, Reset, Reset All, recommender-driven
 *   pipeline change), the orchestrator calls this hook on every cached
 *   instance that implements it. The lens decides per-semantic: the
 *   editor pushes the change as an edit (preserving undo continuity);
 *   parsons reshuffles; blanks re-blanks; trace-table re-runs. Lenses
 *   that omit the hook keep their cache entry as "stale" — on next
 *   reattach the orchestrator shows a stale-state affordance (refresh
 *   to new snippet vs. continue with old state) and the learner
 *   chooses.
 */
type LensMount = Readonly<{
	el: HTMLElement;
	dispose: () => void;
	onSnippetChanged?: (snippet: string) => void;
}>;

/**
 * A code-to-component lens module. Lenses accept a code string and
 * return a `LensMount` (framework-agnostic DOM handle). Always
 * terminal — exactly one per pipeline. Each lens self-describes its
 * relevance for a given snippet via `recommend()`.
 *
 * @remarks The `lens` function may be synchronous or asynchronous.
 * Lenses that require async setup (e.g. the editor lens dynamically
 * loading CodeMirror language modules) return a `Promise<LensMount>`;
 * lenses that can mount synchronously (highlight, parsons) return a
 * bare `LensMount`. The orchestrator awaits either form, showing a
 * lightweight mounting affordance during pending async mounts.
 */
type LensModule = Readonly<{
	name: string;
	lens: (
		code: string,
		config?: LensConfig,
	) => LensMount | Promise<LensMount>;
	config: (overrides?: Partial<LensConfig>) => LensConfig;
	recommend: (analysis: AnalysisReport) => ReadonlyArray<Recommendation>;
}>;

// --- Recommendation ---

/**
 * A cell in the 3D Block Model grid (Schulte 2008 + NM-components
 * extension).
 *
 * - `level` — comprehension level (text surface, execution, function).
 * - `scope` — comprehension scope (atoms, blocks, relations, macro).
 * - `nmComponents` — the **unordered set of NM components** present
 *   in the snippet. Valid values are the 10 outer categories from the
 *   syntax tracer's `StepCategory` enum, defined at
 *   `../lib/evaluating/trace/syntax/types.ts`:
 *   `expression`, `resolve`, `statement`, `scope`, `control-flow`,
 *   `initialization`, `for-init`, `write`, `emit`, `error`.
 *   String-typed (not a union) while the syntax tracer's Phase 0.1
 *   kind-level sub-enums are still TBD. A lens may tag MULTIPLE
 *   categories per recommendation.
 *
 * @see `.planning-handoffs/01-NM-components.md` for the 3rd-dim contract.
 */
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
 * The flat prop shape the Docusaurus plugin emits via `<StudyLenses>`
 * JSX nodes, resolved to the orchestrator component through the
 * swizzled `MDXComponents` registry.
 *
 * @remarks `transforms` carries the comma-separated ordered list of
 * transform names from the fence's Option-A suffix (e.g.
 * `js:format,loopGuard,editor` → `transforms="format,loopGuard"`,
 * `lens="editor"`). The orchestrator parses it via
 * `transforms?.split(',').filter(Boolean) ?? []` to construct a
 * `Pipeline`. When absent, the pipeline has no transforms.
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
	/** Comma-separated ordered transform names from the fence suffix. */
	transforms?: string;
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

// --- Transform failure mode ---

/**
 * Declared failure semantics for a transform. Wired into
 * `TransformModule.onFailure`; the orchestrator defaults to `'abort'`
 * when a transform omits the field.
 *
 * - `'abort'` — transform failure renders the original snippet in a
 *   read-only diagnostic panel (no lens mounted). Safe default.
 * - `'fallthrough'` — transform failure falls back to the
 *   untransformed snippet + console warning. Useful for cosmetic
 *   transforms (format) where the untransformed code is still safe
 *   and useful.
 */
type TransformFailureMode = 'abort' | 'fallthrough';

// ─── Registry ───────────────────────────────────────────────────────

/**
 * A module registry. Callers create one instance per application
 * lifetime via `createRegistry`. The registry is NOT a global
 * singleton — the orchestrator owns its registry instance.
 *
 * @remarks `register` mutates the registry (intentional — registries
 * are populated at boot then queried; no structural need to make them
 * immutable). `getTransform` and `getLens` are safe to call from any
 * context.
 */
type Registry = {
	/**
	 * Registers a transform or lens module.
	 *
	 * @param module - The module to register. Must have a non-empty
	 *   `name` that has not been registered before (across both
	 *   transforms and lenses).
	 * @throws {Error} If `module.name` is already registered.
	 */
	register(module: TransformModule | LensModule): void;

	/**
	 * Returns the registered transform with the given name, or
	 * `undefined` if no transform with that name exists.
	 *
	 * @remarks Does NOT throw on unknown names. Pipeline validation
	 *   is responsible for surfacing unknown-name errors to the
	 *   orchestrator.
	 */
	getTransform(name: string): TransformModule | undefined;

	/**
	 * Returns the registered lens with the given name, or `undefined`
	 * if no lens with that name exists.
	 *
	 * @remarks Does NOT throw on unknown names.
	 */
	getLens(name: string): LensModule | undefined;
};

export type {
	SerializablePrimitive,
	SerializableValue,
	TransformModule,
	TransformConfig,
	TransformFailureMode,
	LensModule,
	LensConfig,
	LensMount,
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
	Registry,
};

export { EVENT_NAMES };
