/**
 * The honor path's contract: the decision a focus request resolves to at
 * mount. One union, never a throw — a wrong request is an authoring slip,
 * and its answer is the fallback arm, not an error.
 *
 * Library docs: ./README.md (mechanics) · ./DOCS.md (architecture). The
 * region glossary (../../README.md) owns the shared vocabulary.
 */

import type { LifecyclePhaseName } from '../../../embody/types.js';
import type { Lens } from '../../../lenses/types.js';

/**
 * How a focus request mounts — or gracefully does not. A phase-declaring
 * lens is honored in the first accessible phase of its own declared order;
 * a panel-excluded lens is honored after its applicability held at mount;
 * everything else — an unknown name, a barred or unattached lens, a refused
 * applicability, no request at all — is the fallback: normal rendering.
 * The decision decides mounting only; the enforcement mask applies to a
 * focus-mounted lens identically.
 */
export type MountDecision =
	| {
			readonly kind: 'honored-in-phase';
			readonly lens: Lens;
			readonly phase: LifecyclePhaseName;
	  }
	| {
			readonly kind: 'honored-panel-excluded';
			readonly lens: Lens;
	  }
	| {
			readonly kind: 'fallback';
	  };
