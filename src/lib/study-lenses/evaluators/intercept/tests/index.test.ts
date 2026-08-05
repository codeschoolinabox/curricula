// @vitest-environment node

/**
 * @file I7's Node tier: the refusal, proven in the environment that is
 * actually refused.
 *
 * Node has SharedArrayBuffer but no global `Worker`, so this tier reaches the
 * worker arm of the probe and CANNOT reach the shared-memory arm — the test
 * names say which is which. Everything main wires past the probe is evidenced
 * in `index.browser.test.ts` over the real transport.
 *
 * Triangulation, stated honestly (the sibling's own note, and it holds
 * identically here): every row in THIS file passes against a hardcoded
 * always-refuse `main`, because a constant reason string containing "Worker"
 * satisfies the wording row without anything ever reading `typeof Worker`.
 * The row that kills that fake lives in the other file — `does not refuse
 * where Worker and shared memory both exist` — the environment-boundary
 * crossing DEV.md sanctions (move the test file, never mock the environment
 * away). The two files triangulate as a pair; neither does it alone.
 */

import { describe, expect, it } from 'vitest';

import type { Facts } from '../../../embody/types.js';
import type { EvaluationSpec, EvaluatorRefusal } from '../../types.js';
import intercept from '../index.js';

function specFor(
	code: string,
	execution: EvaluationSpec['execution'] = 'function',
	iterations?: number,
): EvaluationSpec {
	const facts = {
		source: { ok: true, value: code },
		type: { ok: true, value: 'script' },
	} as unknown as Facts;
	// The cap is spread conditionally, never passed as an explicit undefined:
	// `exactOptionalPropertyTypes` distinguishes an absent optional field from
	// one present-and-undefined, and the kind's `iterations` means absent.
	return iterations === undefined
		? { facts, execution }
		: { facts, execution, iterations };
}

function refusalOf(spec: EvaluationSpec): EvaluatorRefusal {
	const answer = intercept.main(spec);
	if (!('refused' in answer)) {
		throw new Error('expected a refusal, got a stream');
	}
	return answer;
}

describe('intercept evaluator (node — no Worker)', () => {
	describe('identity', () => {
		it('is named intercept', () => {
			expect(intercept.name).toBe('intercept');
		});
	});

	describe('applicability', () => {
		it.each([
			['function' as const, undefined],
			['module' as const, 1000],
		])(
			'is true for a %s-axis spec, reading only the spec',
			(execution, iterations) => {
				// PINNED(D8-as-widened, human-ratified 2026-07-28: applicability stays PURE over the spec and constant-true — it never reads the ambient environment; the environment answer belongs to main)
				expect(
					intercept.applicability(specFor('1 + 1;', execution, iterations)),
				).toBe(true);
			},
		);
	});

	describe('the environment refusal', () => {
		it('refuses as data when the environment has no Worker', () => {
			expect(refusalOf(specFor('1 + 1;')).refused).toBe(true);
		});

		it('names the missing Worker capability in its reason', () => {
			// PINNED(D8-as-widened, human-ratified 2026-07-28: ONE refusal at main naming the missing capability)
			expect(refusalOf(specFor('1 + 1;')).reason).toContain('Worker');
		});

		it('refuses without throwing', () => {
			expect(() => intercept.main(specFor('1 + 1;'))).not.toThrow();
		});

		it('refuses before reading the source, so a nonsense program still refuses', () => {
			expect(refusalOf(specFor('let x = ;')).refused).toBe(true);
		});

		it('freezes the refusal it returns', () => {
			expect(Object.isFrozen(refusalOf(specFor('1 + 1;')))).toBe(true);
		});
	});

	describe('the kind contract', () => {
		it('satisfies the evaluator kind', () => {
			const probe: import('../../types.js').Evaluator = intercept;

			expect(probe.name).toBe('intercept');
		});
	});
});
