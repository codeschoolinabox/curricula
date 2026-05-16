/**
 * @file Public entry point for the JEJ (Just Enough JavaScript) package.
 *
 * `<StudyLenses>` is the primary export. Callers render a snippet into a
 * learning environment by mounting this component. The orchestrator builds
 * the embodiment internally — callers supply only a source string.
 *
 * `embody` is NOT exported. Lens authors and curriculum authors consume
 * `<StudyLenses>`; they do not call `embody` directly.
 *
 * @remarks Legacy named exports (`run`, `trace`, `validate`, `parse`,
 * `format`, `checkFormat`) from the pre-refactor API are not present —
 * this entry point is new. Migration: use `<StudyLenses snippet={…} />`
 * as the primary entry.
 */

export { default as StudyLenses } from './orchestrate/index.js';
export type { StudyLensesProps } from './orchestrate/types.js';
