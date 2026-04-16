/**
 * @file Public entry for the `study` lens component.
 *
 * The swizzled `src/theme/MDXComponents.js` imports from this path at
 * Phase 3 (one-line flip); resolving via `index.ts` keeps the import
 * stable against future file renames inside this directory.
 */

export { default } from './study-lens.js';
export type { StudyLensProps } from './study-lens.js';
// `narrowToStudyOptions` is intentionally NOT re-exported — it's an
// internal helper that tests import directly from `./study-lens.js`.
// Keeping the public barrel minimal avoids accidental consumer coupling.
