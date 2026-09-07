/**
 * The shared halt-author builder (human ruling 2026-08-25): closes over
 * one run's iteration guard and returns the author an evaluator's worker
 * setup registers with the engine. The author fires on EVERY worker-side
 * stop and stamps the shared core — natural, errorName/message (non-Error
 * throws classified), the guard's structural trip, the real run total,
 * and the engine's structural phase — then hands the core to the
 * per-evaluator finisher (identity when absent). README.md § The skeleton
 * carries the contract; the authored record is deliberately unfrozen (it
 * crosses a postMessage boundary — clone-safe shape is the binding
 * requirement, and `trip` is the guard's by reference).
 *
 * Mini-Phase-0 stub: the signature is the contract; the body lands under
 * this unit's TDD rows.
 */

import type { SerializeHalt } from '../../../lib/engine/types.js';
import type { IterationGuard } from '../iteration-guard/types.js';

import type { FinishHalt } from './types.js';

export default function buildHaltAuthor(
	_guard: IterationGuard,
	_finish?: FinishHalt<unknown>,
): SerializeHalt {
	throw new Error('not implemented — the halt-author TDD rows land the body');
}
