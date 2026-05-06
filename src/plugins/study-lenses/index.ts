/**
 * @file Public entry point for the `study-lenses` plugin. Exposes
 * the three factories `docusaurus.config.ts` wires into the site:
 * the remark transformer, the lifecycle plugin, and the sidebar
 * generator. Internal modules (resolve-cascade, discover-siblings,
 * code-block-to-hast, parse-study-lens-directive,
 * defaults, ext-to-lang) stay module-private per DEV.md.
 *
 * Per DEV.md § Export Conventions, this is the single sanctioned
 * barrel file for this bounded package.
 */

export { default as createRemarkStudyLenses } from './remark-study-lenses.js';
export { default as createStudyLensesPlugin } from './lifecycle-plugin.js';
export { default as createStudySidebarGenerator } from './sidebar-generator.js';
