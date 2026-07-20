// cspell:ignore entwined failable

/**
 * @file Domain model for the `debug-props` meta-lens: the props summary —
 * the serializable view-model the pure core derives from the two props
 * every lens receives (the frozen embodiment and its resolved config).
 *
 * Lens docs: ./README.md (what + selector contract) · ./DOCS.md
 * (architecture). The region contract lives in ../types.ts; the embodiment
 * contract in ../../embody/types.ts.
 */

import type {
	FactStageName,
	FailableStageName,
	LifecyclePhaseName,
} from '../../embody/types.js';
import type { LensConfig } from '../types.js';

/**
 * One fact stage, summarized. The ok arm carries a compact `description`
 * of the stage's value — a count (`'4 tokens'`), or the snippet type
 * (`'module'`). The failed arm carries the stage's `causeMessage` in the
 * machine's own words — the summary reports, it never rephrases. Only a
 * failable stage can appear failed: `source` and `type` are given, so the
 * failed arm narrows to `FailableStageName`.
 */
export type FactStageSummary =
	| {
			readonly stage: FactStageName;
			readonly ok: true;
			readonly description: string;
	  }
	| {
			readonly stage: FailableStageName;
			readonly ok: false;
			readonly causeMessage: string;
	  };

/**
 * One lifecycle phase's study payload, summarized: whether the phase is
 * accessible and the names of the lenses attached to it. A barred phase
 * additionally carries the barring cause's message.
 */
export type StudyPhaseSummary =
	| {
			readonly phase: LifecyclePhaseName;
			readonly accessible: true;
			readonly lenses: ReadonlyArray<string>;
	  }
	| {
			readonly phase: LifecyclePhaseName;
			readonly accessible: false;
			readonly lenses: ReadonlyArray<string>;
			readonly causeMessage: string;
	  };

/**
 * The props summary: six fact-stage entries in stage order, five
 * study-phase entries in lifecycle order, and the resolved configuration
 * record echoed as frozen data. Serializable throughout — counts and
 * messages, never object graphs.
 */
export type PropertiesSummary = {
	readonly facts: ReadonlyArray<FactStageSummary>;
	readonly study: ReadonlyArray<StudyPhaseSummary>;
	readonly config: LensConfig;
};
