/**
 * The classification library's contracts: the per-level assessment the
 * selector and the mask both project.
 *
 * Library docs: ./README.md (mechanics) · ./DOCS.md (architecture). The
 * region's `FitMark` (../../types.ts) is the assessment's mark vocabulary.
 */

import type { SnippetType, Violation } from '../../../language-levels/types.js';

/**
 * One level's classification of the current code, with the cause its mark
 * needs downstream. The `mark` arms are exactly the region's `FitMark`
 * values; the undetermined carve-out wins over type admission.
 */
export type LevelAssessment =
	| { readonly mark: 'undetermined' }
	| { readonly mark: 'fits' }
	| {
			readonly mark: 'not-applicable-for-type';
			readonly admitted: ReadonlyArray<SnippetType>;
	  }
	| {
			readonly mark: 'does-not-fit';
			readonly violations: ReadonlyArray<Violation>;
	  };

/**
 * Every registered level's assessment for one settle, keyed by level key.
 * The none-state key `''` never appears here — it is a label, not a level;
 * callers branch on the none-state before indexing.
 */
export type AssessmentsByLevel = Readonly<Record<string, LevelAssessment>>;
