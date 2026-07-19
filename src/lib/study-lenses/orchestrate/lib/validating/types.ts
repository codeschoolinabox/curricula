/**
 * The validation library's contracts: the assembled parse facts and the
 * level verdict.
 *
 * Library docs: ./README.md (mechanics) · ./DOCS.md (architecture). The
 * region glossary (../../README.md) pins `level verdict` against its
 * near-homonyms (fit mark, lens fit).
 */

import type { ParseFacts, Violation } from '../../../language-levels/types.js';

/**
 * The assembly's result: the parse facts a level consumes, or `null` — the
 * undetermined signal — when the tokens or ast stage failed. On `null`, no
 * level is consulted; every verdict for that settle is undetermined by the
 * caller's own hand.
 */
export type AssembledParseFacts = ParseFacts | null;

/**
 * What one memoized validate produces for one level over the settled code:
 * undetermined while the code does not parse, else validated, carrying the
 * level's violations — possibly none.
 */
export type LevelVerdict =
	| { readonly kind: 'undetermined' }
	| {
			readonly kind: 'validated';
			readonly violations: ReadonlyArray<Violation>;
	  };

/**
 * Every registered level's verdict for one settle, keyed by level key. The
 * none-state key `''` never appears here — it is a label, not a level;
 * callers branch on the none-state before indexing.
 */
export type VerdictsByLevel = Readonly<Record<string, LevelVerdict>>;
