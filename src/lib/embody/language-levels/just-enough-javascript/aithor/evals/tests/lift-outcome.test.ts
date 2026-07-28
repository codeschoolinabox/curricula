import { describe, it, expect } from 'vitest';

import type { AithorResult, RefusalCause } from '../../types.js';
import liftOutcome from '../lift-outcome.js';
import type {
	CaseSpec,
	ConformVerdict,
	Reads,
	UncuratedOutcome,
} from '../types.js';

// Increment 3 — the boundary lift (evals/DOCS.md "Lift" phase).
// Exceptions: boundary honesty is fail-fast — an ok result with no meta, a
// refused result with no refusal, and a curated success whose attempts falls
// outside 1|2|3 all throw, since trusting them would silently poison the fold.
// Triangulation for the first test: drifted reads (pass-through by value, not
// a hardcoded clean verdict) and curated ok (variant selection by validate).

describe('liftOutcome', () => {
	describe('uncurated ok → UncuratedOutcome', () => {
		it('embeds the driver reads and the Meta model', () => {
			const outcome = liftOutcome(uncuratedSpec(), okResult(1), cleanReads());

			expect(outcome).toEqual({
				kind: 'uncurated',
				admitted: true,
				conform: { ok: true, featureViolations: [], sizeViolations: [] },
				model: 'resolved-model',
			});
		});

		it('passes drifted reads through verbatim — nothing recomputed', () => {
			const outcome = liftOutcome(uncuratedSpec(), okResult(1), driftedReads());

			expect(outcome).toEqual({
				kind: 'uncurated',
				admitted: false,
				conform: {
					ok: false,
					featureViolations: ['while'],
					sizeViolations: ['lines'],
				},
				model: 'resolved-model',
			});
		});
	});

	describe('curated ok → CuratedSuccessOutcome', () => {
		it.each([
			[1, 'model-a'],
			[2, 'model-b'],
			[3, 'model-c'],
		] as const)(
			'attempts %i and model %s flow from Meta; the reads are never touched',
			(attempts, model) => {
				const outcome = liftOutcome(
					curatedSpec(),
					okResult(attempts, model),
					poisonedReads(),
				);

				expect(outcome).toEqual({ kind: 'curated-success', attempts, model });
			},
		);
	});

	describe('refusal → RefusalOutcome', () => {
		it('curated attempt-bound-exhausted — no Meta to read, reads never touched', () => {
			const outcome = liftOutcome(
				curatedSpec(),
				refusalResult('attempt-bound-exhausted'),
				poisonedReads(),
			);

			expect(outcome).toEqual({
				kind: 'refusal',
				cause: 'attempt-bound-exhausted',
				path: 'curated',
			});
		});

		it.each(['no-model-available', 'unknown-model'] as const)(
			'bring-up %s on the curated path → path stamped curated',
			(cause) => {
				const outcome = liftOutcome(
					curatedSpec(),
					refusalResult(cause),
					poisonedReads(),
				);

				expect(outcome).toEqual({ kind: 'refusal', cause, path: 'curated' });
			},
		);

		it.each(['no-model-available', 'unknown-model'] as const)(
			'bring-up %s on the uncurated path → path stamped uncurated',
			(cause) => {
				const outcome = liftOutcome(
					uncuratedSpec(),
					refusalResult(cause),
					poisonedReads(),
				);

				expect(outcome).toEqual({ kind: 'refusal', cause, path: 'uncurated' });
			},
		);

		it('drops a refusal nextStep — the Outcome carries cause and path only', () => {
			const withNextStep: AithorResult = {
				ok: false,
				refusal: { cause: 'no-model-available', nextStep: 'retry' },
			};
			const outcome = liftOutcome(
				uncuratedSpec(),
				withNextStep,
				poisonedReads(),
			);

			expect(outcome).toEqual({
				kind: 'refusal',
				cause: 'no-model-available',
				path: 'uncurated',
			});
		});
	});

	describe('boundaries', () => {
		it('the SAME bring-up refusal stamps a different path per validate', () => {
			const sameResult = refusalResult('no-model-available');
			const curated = liftOutcome(curatedSpec(), sameResult, poisonedReads());
			const uncurated = liftOutcome(
				uncuratedSpec(),
				sameResult,
				poisonedReads(),
			);

			expect(curated).toEqual({
				kind: 'refusal',
				cause: 'no-model-available',
				path: 'curated',
			});
			expect(uncurated).toEqual({
				kind: 'refusal',
				cause: 'no-model-available',
				path: 'uncurated',
			});
		});

		it('validate absent from config → the parent default, curated', () => {
			const outcome = liftOutcome(defaultSpec(), okResult(2), poisonedReads());

			expect(outcome).toEqual({
				kind: 'curated-success',
				attempts: 2,
				model: 'resolved-model',
			});
		});

		it('an incoherent cause×path pairing is mapped, never policed', () => {
			const outcome = liftOutcome(
				uncuratedSpec(),
				refusalResult('attempt-bound-exhausted'),
				poisonedReads(),
			);

			expect(outcome).toEqual({
				kind: 'refusal',
				cause: 'attempt-bound-exhausted',
				path: 'uncurated',
			});
		});
	});

	describe('interfaces — frozen distillate, unfrozen caller data', () => {
		it('deep-freezes the uncurated outcome and its embedded verdict', () => {
			const outcome = liftOutcome(uncuratedSpec(), okResult(1), driftedReads());
			const uncurated = outcome as UncuratedOutcome;

			expect(Object.isFrozen(outcome)).toBe(true);
			expect(Object.isFrozen(uncurated.conform)).toBe(true);
			expect(Object.isFrozen(uncurated.conform.featureViolations)).toBe(true);
		});

		it('freezes the curated-success and refusal outcomes', () => {
			const success = liftOutcome(curatedSpec(), okResult(1), poisonedReads());
			const refusal = liftOutcome(
				curatedSpec(),
				refusalResult('attempt-bound-exhausted'),
				poisonedReads(),
			);

			expect(Object.isFrozen(success)).toBe(true);
			expect(Object.isFrozen(refusal)).toBe(true);
		});

		it('never freezes the caller reads — verbatim is by value, not by reference', () => {
			const reads = driftedReads();
			liftOutcome(uncuratedSpec(), okResult(1), reads);

			expect(Object.isFrozen(reads.conform)).toBe(false);
			expect(Object.isFrozen(reads.conform.featureViolations)).toBe(false);
		});
	});

	describe('exceptions — a malformed AithorResult fails fast', () => {
		it('ok without meta on the curated path → throws mentioning meta', () => {
			const malformed: AithorResult = { ok: true, program: 'let x = 1;' };

			expect(() => liftOutcome(curatedSpec(), malformed, cleanReads())).toThrow(
				'meta',
			);
		});

		it('ok without meta on the uncurated path → throws mentioning meta', () => {
			const malformed: AithorResult = { ok: true, program: 'let x = 1;' };

			expect(() =>
				liftOutcome(uncuratedSpec(), malformed, cleanReads()),
			).toThrow('meta');
		});

		it('refused without refusal → throws mentioning refusal', () => {
			const malformed: AithorResult = { ok: false };

			expect(() =>
				liftOutcome(uncuratedSpec(), malformed, cleanReads()),
			).toThrow('refusal');
		});

		it.each([0, 4, 2.5])(
			'curated ok with attempts %d → throws mentioning attempts',
			(attempts) => {
				expect(() =>
					liftOutcome(curatedSpec(), okResult(attempts), poisonedReads()),
				).toThrow('attempts');
			},
		);
	});
});

function curatedSpec(): CaseSpec {
	return {
		id: 'tight-curated',
		quadrant: 'curated-scratch',
		program: '',
		config: { prompt: 'a tiny program', model: 'test-model', validate: true },
		expectedSatisfiable: true,
	};
}

function uncuratedSpec(): CaseSpec {
	return {
		id: 'loose-uncurated',
		quadrant: 'uncurated-scratch',
		program: '',
		config: { prompt: 'a tiny program', model: 'test-model', validate: false },
		expectedSatisfiable: true,
	};
}

function defaultSpec(): CaseSpec {
	return {
		id: 'default-curated',
		quadrant: 'curated-scratch',
		program: '',
		config: { prompt: 'a tiny program', model: 'test-model' },
		expectedSatisfiable: true,
	};
}

function okResult(attempts: number, model = 'resolved-model'): AithorResult {
	return { ok: true, program: 'let x = 1;', meta: { model, attempts } };
}

function refusalResult(cause: RefusalCause): AithorResult {
	return { ok: false, refusal: { cause } };
}

function cleanReads(): Reads {
	return {
		admitted: true,
		conform: { ok: true, featureViolations: [], sizeViolations: [] },
	};
}

function driftedReads(): Reads {
	return {
		admitted: false,
		conform: {
			ok: false,
			featureViolations: ['while'],
			sizeViolations: ['lines'],
		},
	};
}

function poisonedReads(): Reads {
	return {
		get admitted(): boolean {
			throw new Error('reads.admitted must not be read on this path');
		},
		get conform(): ConformVerdict {
			throw new Error('reads.conform must not be read on this path');
		},
	};
}
