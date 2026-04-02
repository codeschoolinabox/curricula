/**
 * @file Hinting module — AST-based warning detection for JeJ code.
 *
 * Owns warning detection (misconceptions and code smells). Called by
 * `api/hint.ts` after validation passes. Scope-analysis warnings
 * (unused vars, shadowing) remain in `validating/`.
 */

export { default as collectWarnings } from './collect-warnings.js';
export type { HintResult } from '../api/types.js';
