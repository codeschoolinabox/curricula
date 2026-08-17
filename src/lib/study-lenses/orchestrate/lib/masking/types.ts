/**
 * The mask library's contracts: the surface classes and the mask state.
 *
 * Library docs: ./README.md (mechanics) · ./DOCS.md (architecture). The
 * region README owns the enforcement story these types serve.
 */

import type { SnippetType, Violation } from '../../../language-levels/types.js';

/**
 * The mask's three-way split of rendered surfaces — VOCABULARY ONLY: no
 * runtime consumer types against this. A surface's class is a static
 * fact of what it IS, and containment decides nothing: editor-based
 * surfaces are always alive; the
 * meta-level NODES that must survive every posture are never masked —
 * earned by acting on the boundary, by explaining it, by carrying the
 * region's voice, or by naming the pane's occupant (human ruling
 * 2026-08-17); everything else is maskable under strict.
 *
 * The roster of class-2 nodes lives in the region README, not here: this
 * type is vocabulary, and an enumeration kept in two places drifts.
 * `'meta-node'` rather than `'meta-control'`: two of the class's members
 * are not controls — the announcer and the nameplate — so the older
 * literal under-named what it labelled.
 */
export type SurfaceClass = 'editor-based' | 'meta-node' | 'maskable';

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
