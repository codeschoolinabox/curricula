import { describe, expect, it } from 'vitest';

import type { DangerResult } from '../backend/types.js';
import toSettlement from '../to-settlement.js';

describe('toSettlement', () => {
	it('maps completed → clean (no error arm)', () => {
		expect(toSettlement({ outcome: 'completed' })).toStrictEqual({
			ended: 'clean',
		});
	});

	it('maps cancelled → canceled (no error arm)', () => {
		expect(toSettlement({ outcome: 'cancelled' })).toStrictEqual({
			ended: 'canceled',
		});
	});

	it('maps errored → error with reason "threw", carrying the machine words', () => {
		const result: DangerResult = {
			outcome: 'errored',
			error: { name: 'TypeError', message: 'x is not a function' },
		};
		expect(toSettlement(result)).toStrictEqual({
			ended: 'error',
			error: {
				name: 'TypeError',
				message: 'x is not a function',
				reason: 'threw',
			},
		});
	});

	it('maps limit-exceeded → error with reason "loop-cap"', () => {
		const result: DangerResult = {
			outcome: 'limit-exceeded',
			error: { name: 'RangeError', message: 'Loop 1 exceeded 3 iterations.' },
		};
		expect(toSettlement(result)).toStrictEqual({
			ended: 'error',
			error: {
				name: 'RangeError',
				message: 'Loop 1 exceeded 3 iterations.',
				reason: 'loop-cap',
			},
		});
	});

	it('maps timed-out → error with reason "timeout"', () => {
		const result: DangerResult = {
			outcome: 'timed-out',
			error: { name: 'Error', message: 'exceeded its 5s wall-clock budget' },
		};
		expect(toSettlement(result)).toStrictEqual({
			ended: 'error',
			error: {
				name: 'Error',
				message: 'exceeded its 5s wall-clock budget',
				reason: 'timeout',
			},
		});
	});

	it('an error outcome missing its payload yields a loud, well-formed fallback (never undefined/undefined)', () => {
		// The backend guarantees an error payload on every non-clean, non-cancel
		// outcome; a missing one is an unreachable backend defect. It must NOT surface
		// as `{ reason }` alone (undefined name/message at the learner) — a well-formed
		// error with an actionable message and the reason rides through instead.
		expect(toSettlement({ outcome: 'errored' })).toStrictEqual({
			ended: 'error',
			error: {
				name: 'Error',
				message:
					'danger run ended in error with no error payload (backend defect)',
				reason: 'threw',
			},
		});
	});
});
