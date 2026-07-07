/**
 * @file The JEJ-admission seam — `isJejCompliant(embodiment)`. A lens whose
 * analysis assumes the JEJ scope model self-gates its `applicableTo` on this
 * boolean (the `quiz` lens is the first consumer).
 *
 * @remarks Class-B re-pointable accessor (see `./DOCS.md` and the sibling
 * `../documenting/document-jej.ts`). It lives in `lib/*` — not in the lens —
 * because a lens may not import `embody/lib/validating/` (lens purity), but
 * `lib/*` may. It prefers the embodiment's recorded verdict (`validation.isJeJ`)
 * and, only when the validate stage has not run (real composition stubs
 * `validation: null` today), re-runs the SYNC `validate` over `source.code`,
 * guarded by `type === 'module'` so it shadows `status.validated` exactly
 * (structurally `false` under `script`). Uses `validate` (no format check), not
 * the async `is-jej` (whose Prettier gate would wrongly hide the lens).
 *
 * **Re-point:** when embody wires validate into real composition, the
 * re-validation arm becomes dead code and the body collapses to
 * `return embodiment.status.validated;` — callers untouched. The parameter is
 * `Snippet` (not `code: string`) precisely so it can.
 */

import validate from '../../embody/lib/validating/validate.js';
import type { Snippet } from '../../embody/types.js';

/**
 * Is the embodiment admissible at the Just Enough JavaScript level?
 *
 * @param embodiment - the frozen `Snippet` a lens is considering rendering for.
 * @returns `true` iff the snippet is JEJ-admitted (a parsed, violation-free
 *   module). See `./DOCS.md` for the verdict-first / module-guarded
 *   re-validation two-arm design and the `status.validated` re-point.
 */
export default function isJejCompliant(embodiment: Snippet): boolean {
	// Verdict-first: trust the embodiment's recorded JEJ verdict when the validate
	// stage ran. Real composition still stubs `validation: null` today, so bridge
	// by re-validating `source.code` — guarded by `type === 'module'` so this
	// shadows `status.validated` exactly (structurally false under `script`).
	// Re-point: delete the null branch → `return embodiment.status.validated;`.
	return embodiment.validation === null
		? embodiment.type === 'module' && validate(embodiment.source.code).ok
		: embodiment.validation.isJeJ;
}
