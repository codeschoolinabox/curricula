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
};
