/**
 * @file Lens-module contract — every lens under `lenses/<name>/` exports
 * a default `LensModule` satisfying this type. Adapted from
 * `study-lenses/types.ts:64-120` (the pre-refactor LensModule shape).
 *
 * @remarks **What changed from the pre-refactor shape**:
 * - Drop `LensMount` (framework-agnostic DOM handle) — lenses are React
 *   components now; React reconciles mount/unmount.
 * - Drop the `lens(code, config) => LensMount` method — replaced by
 *   `Component`, a React component taking `embodiment` + `config` props.
 * - Drop `onSnippetChanged` IoC hook — per the locked "disposable
 *   practice" decision in `../README.md` § Pedagogical first principles
 *   (implication 5), lens state is per-mount; snippet change → unmount
 *   + remount, no in-place propagation.
 * - Add `applicableTo(embodiment)` — the WS2 recommender's
 *   applicability filter calls this to gate which lenses are even
 *   considered for a given embodiment (per `../DOCS.md` §Pedagogical
 *   grounding §Recommender = Applicability filter + Ranking engine).
 *
 * **What survives unchanged**: `name` (registry identity),
 * `config(overrides?)` (config factory), plus the supporting types
 * `LensConfig`, `BlockModelCell`, `Recommendation`, and
 * `SerializableValue` / `SerializablePrimitive`. `recommend` survives
 * but its parameter changed from a separate `AnalysisReport` to the
 * frozen `Snippet` (the embodiment) directly — analysis is an internal
 * helper inside `orchestrate/lib/recommender/`, not a separate hand-off
 * type lenses consume. `BlockModelCell` and `Recommendation` migrate
 * ownership to WS2's `orchestrate/lib/recommender/types.ts` per
 * `02-analysis-and-recommender.md`; this file re-exports them as the
 * lens-facing surface until that lock-in lands.
 *
 * **What was DELETED from `study-lenses/types.ts` and is NOT here**:
 * - `TransformModule`, `TransformConfig`, `TransformFailureMode` —
 *   no transforms tier in the new architecture (transforms-as-lens-
 *   internal-concern; see `../DOCS.md` § Locked decisions).
 * - `Pipeline`, `PluginEmittedProps` — the new `<StudyLenses snippet
 *   lens? config?>` prop trio replaces both. The plugin's emission
 *   contract narrows accordingly (see WS3 handoff Cross-handoff
 *   impact note about plugin alignment).
 * - `OrchestratorState`, `EventBus`, `EventName`, `EVENT_NAMES`,
 *   `Registry`, all `*Payload` event types — these migrate to
 *   `orchestrate/types.ts` as the orchestrator-internal
 *   contract (not lens-facing).
 *
 * @remarks **Two-layer module shape** (per
 * [`./README.md`](./README.md) § How to add a lens): the lens lives
 * across two files in `lenses/<name>/`:
 *
 * - A pure-TS core (e.g. `core.ts`) — display derivation, validation,
 *   scoring. Testable in vitest **without** `jsdom`.
 * - A light React wrapper (e.g. `index.tsx`) — exports `Component`,
 *   the React component that takes `embodiment` + `config` as props,
 *   instantiates the core, and renders UI. Testable with `jsdom` +
 *   `@testing-library/react`.
 *
 * The React wrapper keeps imports off the core (no React inside core
 * files) so the core can be unit-tested in node without DOM stubs.
 */

import type { ComponentType } from 'react';

import type { Snippet } from '../embody/types.js';

// --- Placeholders for WS2-owned types (see 02-analysis-and-recommender.md) ---

/**
 * 3D Block Model grid cell (Schulte 2008 + NM-components extension).
 * Owned by `orchestrate/lib/recommender/types.ts` (WS2). Recommendations
 * place themselves on this grid.
 *
 * The `nmComponents` field is the unordered set of NM-component
 * categories present in the snippet — the 3rd Block Model dimension
 * per WS1 (`.planning-handoffs/01-NM-components.md`).
 *
 * @see `../lib/evaluating/trace/syntax/types.ts` `StepCategory` — the
 *      canonical enum supplying the NM-component category names.
 * @remarks Adapted from `study-lenses/types.ts:142-146`. The shape
 * survives the refactor; ownership migrates to WS2 during
 * REFACTOR-HANDOFF Step 9.
 */
type BlockModelCell = Readonly<{
	readonly level: 'surface' | 'execution' | 'function';
	readonly scope: 'atoms' | 'blocks' | 'relations' | 'macro';
	readonly nmComponents?: ReadonlyArray<string>;
}>;

/**
 * A single recommendation from a lens. A lens can return multiple
 * recommendations at different Block Model cells with different
 * configs. Owned by `orchestrate/lib/recommender/types.ts` (WS2).
 *
 * @remarks Adapted from `study-lenses/types.ts:148-159`. Drop the
 * `transforms` field (no transforms tier in the new architecture);
 * everything else survives.
 */
type Recommendation = Readonly<{
	readonly lens: string;
	readonly config: LensConfig;
	readonly relevance: number;
	readonly blockModelCell: BlockModelCell;
	readonly label: string;
}>;

// --- Lens config (survives unchanged from pre-refactor) ---

/**
 * Serialisable primitive — the only value-types `LensConfig` admits.
 * Function, symbol, Date, and class-instance values are deliberately
 * excluded so config hashes are deterministic.
 *
 * @remarks Adapted from `study-lenses/types.ts:24-30`.
 */
type SerializablePrimitive = string | number | boolean | null;

type SerializableValue =
	| SerializablePrimitive
	| ReadonlyArray<SerializablePrimitive>;

/**
 * A lens's configuration — flat record of primitives + primitive
 * arrays. Tight by design so per-lens defaults can merge with
 * educator-supplied overrides without schema drift.
 *
 * @remarks Adapted from `study-lenses/types.ts:66`. Survives unchanged.
 */
type LensConfig = Readonly<Record<string, SerializableValue>>;

// --- Lens props (NEW — replaces the pre-refactor `LensMount` model) ---

/**
 * Props every lens's React `Component` receives. The `embodiment` is
 * frozen (immutable per the `embody/` contract); the `config` is the
 * resolved per-lens config bundle (defaults merged with educator
 * overrides from the per-fence directive or `lenses.json` cascade).
 *
 * @remarks Lenses MUST NOT mutate `embodiment` (it's deep-frozen) or
 * `config` (also frozen). UI state lives in the lens's local
 * `useState` / `useReducer` — never persisted across mount cycles.
 * See `../README.md` § Disposable practice.
 */
type LensProperties = Readonly<{
	readonly embodiment: Snippet;
	readonly config?: LensConfig;
}>;

// --- LensModule (the contract every lens satisfies) ---

/**
 * A lens module's default export. Each lens at `lenses/<name>/`
 * exports a `LensModule` with the same `name` as the directory.
 *
 * @remarks Adapted from `study-lenses/types.ts:99-120` (pre-refactor
 * `LensModule`). Changes per file-header @remarks above.
 *
 * **Registry identity**: the orchestrator's lens registry is keyed by
 * `name`. Two lenses with the same name is an error. The picker
 * dropdown enumerates `name`s; the recommender ranks them.
 *
 * **Component**: the React wrapper around the lens's pure-TS core.
 * Mounting and unmounting are React's job; the lens does NOT export
 * a `dispose()` — when the snippet changes the orchestrator unmounts
 * the lens via React's natural reconciliation, and React calls any
 * `useEffect` cleanups inside the lens for resource teardown.
 *
 * **Async setup**: lenses that need async setup (e.g. dynamically
 * loading CodeMirror language modules) handle that inside the
 * Component (`useEffect` + state-machine, or `React.lazy` +
 * `<Suspense>`). The LensModule's surface stays synchronous; only
 * its rendering is async.
 *
 * **applicableTo + recommend**: split surfaces for the WS2
 * recommender. `applicableTo` is a fast pure boolean (parse-failed
 * snippet → false for AST-dependent lenses); `recommend` is the
 * richer relevance computation that runs only on applicable lenses.
 * Splitting them keeps the recommender's applicability-filter pass
 * cheap. Both take the frozen `Snippet` (the embodiment) directly —
 * analysis is an internal helper inside `orchestrate/lib/recommender/`,
 * not a separate hand-off type lenses consume.
 *
 * **Three-tier classification gating** (per
 * [`./README.md`](./README.md) § Three-tier classification): Tier 1
 * (text-only) lenses' `applicableTo` always returns `true`. Tier 2
 * (AST-dependent) lenses return `embodiment.status.parsed`. Tier 3
 * (dynamic) lenses return `embodiment.status.created`.
 */
type LensModule = Readonly<{
	readonly name: string;
	readonly Component: ComponentType<LensProperties>;
	readonly config: (overrides?: Partial<LensConfig>) => LensConfig;
	readonly applicableTo: (embodiment: Snippet) => boolean;
	readonly recommend: (embodiment: Snippet) => ReadonlyArray<Recommendation>;
}>;

export type {
	SerializablePrimitive,
	SerializableValue,
	LensConfig,
	LensProperties as LensProps,
	LensModule,
	BlockModelCell,
	Recommendation,
};

// Re-export Snippet from embody so lens authors can import the lens
// surface from one place (`'../../lenses/types.js'`) without having to
// reach into `embody/types.ts` directly. Type-only — runtime imports
// from `embody/` (top) remain forbidden per the lens-purity rule.
export type { Snippet } from '../embody/types.js';
