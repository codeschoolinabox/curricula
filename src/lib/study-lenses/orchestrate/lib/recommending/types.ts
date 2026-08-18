/**
 * The ranking library's contract.
 *
 * Library docs: ./README.md (mechanics) · ./DOCS.md (architecture). The
 * region glossary (../../README.md) owns the shared vocabulary.
 */

import type { Recommendation } from '../../../lenses/types.js';

/**
 * Collected recommendations, ordered for rendering: relevance descending on the
 * lens contract's shared 0–1 scale; equal relevance keeps the collected
 * order (stable ties). Frozen. Ranking trusts the scale — an out-of-range
 * relevance is the proposing lens's contract bug, never repaired here.
 */
export type RankedRecommendations = ReadonlyArray<Recommendation>;
