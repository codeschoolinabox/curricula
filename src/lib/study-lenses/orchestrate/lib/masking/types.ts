/**
 * The mask library's contracts: the surface classes and the mask state.
 *
 * Library docs: ./README.md (mechanics) · ./DOCS.md (architecture). The
 * region README owns the enforcement story these types serve.
 */

import type { SnippetType, Violation } from '../../../language-levels/types.js';

/**
 * The mask's three-way split of rendered surfaces — VOCABULARY ONLY: the
 * classification is a static fact of the render tree (containment decides,
 * no runtime consumer types against this). A surface's class is a static
 * fact of what it IS: editor-based surfaces are always alive;
 * meta-level controls (the selector, both toggles, the guide) are never
 * masked; everything else is maskable under strict.
 */
export type SurfaceClass = 'editor-based' | 'meta-control' | 'maskable';

/**
 * Why the maskable surfaces are covered: the first violation, or the
 * type-admission facts. Structural, never prose — the top component formats
 * the blocked sentence, the same owner that formats the barred-phase cause.
 */
export type MaskCause =
	| { readonly kind: 'violation'; readonly violation: Violation }
	| {
			readonly kind: 'type-admission';
			readonly admitted: ReadonlyArray<SnippetType>;
	  };

/**
 * Whether the maskable surfaces are covered, and — when they are — the
 * level's label and the structural cause the blocked state renders from.
 */
export type MaskState =
	| { readonly masked: false }
	| {
			readonly masked: true;
			readonly levelLabel: string;
			readonly cause: MaskCause;
	  };
