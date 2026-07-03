/**
 * @file The shared loop-guard splicer — the one verb this module owns.
 *
 * Finds every guarded loop (`while` / classic `for` / `do-while` / `for-of`
 * with a braced body) in a source string and splices caller-supplied guard/reset
 * call text into it, without moving a line. See README.md § Ubiquitous language
 * for the vocabulary and DOCS.md for the parse → collect → allocate → plan →
 * apply phase model this implements.
 */

import type { GuardResult, SpliceHooks } from './types.js';

export default function spliceLoopGuards(
	code: string,
	_hooks: SpliceHooks,
): GuardResult {
	// Zero case (Fake It): no loops means no guard/reset calls, so the hooks are
	// unused here; Increment 2 triangulates this away once a real loop is guarded.
	return Object.freeze({ code, loopCount: 0 });
}
