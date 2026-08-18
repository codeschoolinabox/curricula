/**
 * @file The splice verb: authors the closure-counter guard/reset call text
 * and delegates placement to the shared loop-guard leaf.
 *
 * The call text is the module's half of the protocol its worker helpers
 * implement: `__$il(n, 'L:C:L:C');` at the top of each guarded loop's
 * braced body (the loc string encodes the LOOP statement's own span —
 * 1-based lines, 0-based columns — so a limit trip is attributed to its
 * loop) and `__$ir(n);` after the loop. Both factories are in-file and are
 * NOT consumer surface (README § Design commitments): pairing raw hooks
 * with the splicer at an evaluator call site is the drift hazard this
 * wrapper removes. The factories never emit a line terminator, which is
 * what makes loop-guard's `multiline-injection` failure unreachable
 * through this verb.
 *
 * Run it on the ORIGINAL learner source, before any column-shifting
 * rewrite (DOCS.md § Structural constraints — guard-first ordering).
 */

import spliceLoopGuards from '../../../lib/loop-guard/splice-loop-guards.js';
import type { LoopLoc } from '../../../lib/loop-guard/types.js';

import type { GuardResult } from './types.js';

/**
 * Splice this module's guard/reset calls into every guarded loop of
 * `code`, via loop-guard's `spliceLoopGuards`. Returns loop-guard's
 * {@link GuardResult} unchanged — `code` `===` the input when no loops
 * were guarded. Throws loop-guard's `LoopGuardError` on a malformed
 * source, loudly.
 */
export default function spliceIterationGuards(code: string): GuardResult {
	return spliceLoopGuards(code, { makeGuard, makeReset });
}

/** The guard-call factory: the loop's own span rides the call, encoded. */
function makeGuard(loopIndex: number, loc: LoopLoc): string {
	return `__$il(${loopIndex}, '${encodeLoc(loc)}');`;
}

/** The reset-call factory: index only — a reset needs no loc. */
function makeReset(loopIndex: number): string {
	return `__$ir(${loopIndex});`;
}

/** `'L:C:L:C'` — start line:column:end line:column of the loop statement. */
function encodeLoc(loc: LoopLoc): string {
	return `${loc.start.line}:${loc.start.column}:${loc.end.line}:${loc.end.column}`;
}
