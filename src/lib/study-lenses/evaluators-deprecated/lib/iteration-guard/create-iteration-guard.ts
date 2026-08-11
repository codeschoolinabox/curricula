/**
 * @file Builds one run's guard state: the two injectable helpers over
 * per-loop per-entry counters and the never-reset run total, plus the
 * halt author's run-total read.
 *
 * This is the module's declared mutable-state exception (DEV.md § 8): the
 * counter store is closure-confined, per-run disposable — one call, one
 * run, one closure — and mutated IN PLACE because `__$il` runs on every
 * iteration of every guarded loop: the steady-state path must be O(1) and
 * allocation-free, allocating only on a loop's first-ever entry.
 *
 * On a trip (`per-entry count > cap`, increment-then-compare — the
 * tripping iteration is counted), `__$il` decodes the spliced loc string,
 * deep-freezes the trip record, defines it under the marker key
 * (non-enumerable, non-writable, non-configurable — first-write, never
 * overwritten), and throws the `RangeError` with the pinned message. A
 * loc string that does not decode to four finite positions builds NO
 * record: the trip still throws — pinned message, cap held — but plain
 * and unattributable (README § Edge cases).
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import LIMIT_MARKER_KEY from './limit-marker-key.js';
import type { IterationGuard, LimitTrip, LoopLoc } from './types.js';

/**
 * Build one run's guard state. `cap` is the per-entry ceiling as given —
 * never validated, never defaulted here (C1 ruling: no iteration-cap
 * default exists; the engine wall-clock budget is the uncapped backstop).
 * Absent → the helpers count but never throw; `0`/negative trip on the
 * first pass; `Infinity`/`NaN` never trip.
 */
export default function createIterationGuard(cap?: number): IterationGuard {
	// The run-state closure: mutated in place on the per-iteration hot
	// path — allocation only on a loop's first-ever entry.
	const perEntry = new Map<number, number>();
	let runTotal = 0;

	return Object.freeze({
		globals: Object.freeze({
			__$il(loopIndex: number, locString: string): void {
				const count = (perEntry.get(loopIndex) ?? 0) + 1;
				// eslint-disable-next-line functional/immutable-data -- run-state closure, per-run disposable
				perEntry.set(loopIndex, count);
				runTotal += 1;
				if (cap !== undefined && count > cap) {
					throw buildLimitThrow(loopIndex, locString, cap);
				}
			},
			__$ir(loopIndex: number): void {
				// eslint-disable-next-line functional/immutable-data -- run-state closure, per-run disposable
				perEntry.set(loopIndex, 0);
			},
		}),
		readIterationCount(): number {
			return runTotal;
		},
	});
}

/**
 * Author the marked limit throw: pinned message; the deep-frozen trip
 * record defined under the marker key (non-enumerable, non-writable,
 * non-configurable — first-write, other stampers use their own keys). A
 * loc string that does not decode to four finite positions builds NO
 * record — the throw stays plain and unattributable, the cap still held.
 */
function buildLimitThrow(
	loopIndex: number,
	locString: string,
	cap: number,
): RangeError {
	const error = new RangeError(`Loop ${loopIndex} exceeded ${cap} iterations.`);
	const loc = decodeLocString(locString);
	if (loc !== null) {
		const trip: LimitTrip = deepFreezeInPlace({ loopIndex, loc });
		// eslint-disable-next-line functional/immutable-data -- the marker stamp IS the trip's delivery channel
		Object.defineProperty(error, LIMIT_MARKER_KEY, {
			value: trip,
			writable: false,
			enumerable: false,
			configurable: false,
		});
	}
	return error;
}

/** `'L:C:L:C'` → a deep-frozen span, or null unless four finite numbers. */
function decodeLocString(locString: string): LoopLoc | null {
	const parts = locString.split(':').map(Number);
	if (parts.length !== 4 || !parts.every((part) => Number.isFinite(part))) {
		return null;
	}
	const [startLine, startColumn, endLine, endColumn] = parts as [
		number,
		number,
		number,
		number,
	];
	return deepFreezeInPlace({
		start: { line: startLine, column: startColumn },
		end: { line: endLine, column: endColumn },
	});
}
