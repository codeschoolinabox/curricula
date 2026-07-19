import { describe, expect, it } from 'vitest';

import type {
	SnippetType,
	Violation,
} from '../../../../language-levels/types.js';
import type { LevelAssessment } from '../../marking/types.js';
import deriveMask from '../derive-mask.js';

function violation(message: string): Violation {
	return {
		nodeType: 'DebuggerStatement',
		message,
		location: { start: 0, end: 8 },
		nodePath: 'body.0',
	};
}

function doesNotFit(violations: ReadonlyArray<Violation>): LevelAssessment {
	return { mark: 'does-not-fit', violations };
}

function notApplicable(admitted: ReadonlyArray<SnippetType>): LevelAssessment {
	return { mark: 'not-applicable-for-type', admitted };
}

describe('deriveMask', () => {
	describe('the none-state, nothing masks', () => {
		it('does not mask when no level is selected under strict', () => {
			expect(
				deriveMask({ assessment: null, strict: true, levelLabel: 'None' }),
			).toEqual({ masked: false });
		});

		it('does not mask when no level is selected under warn', () => {
			expect(
				deriveMask({ assessment: null, strict: false, levelLabel: 'None' }),
			).toEqual({ masked: false });
		});
	});

	describe('under warn, nothing masks', () => {
		it('does not mask a does-not-fit assessment', () => {
			expect(
				deriveMask({
					assessment: doesNotFit([violation('debugger')]),
					strict: false,
					levelLabel: 'Beginner',
				}),
			).toEqual({ masked: false });
		});

		it('does not mask a not-applicable-for-type assessment', () => {
			expect(
				deriveMask({
					assessment: notApplicable(['module']),
					strict: false,
					levelLabel: 'Beginner',
				}),
			).toEqual({ masked: false });
		});

		it('does not mask a fitting assessment', () => {
			expect(
				deriveMask({
					assessment: { mark: 'fits' },
					strict: false,
					levelLabel: 'Beginner',
				}),
			).toEqual({ masked: false });
		});

		it('does not mask an undetermined assessment', () => {
			expect(
				deriveMask({
					assessment: { mark: 'undetermined' },
					strict: false,
					levelLabel: 'Beginner',
				}),
			).toEqual({ masked: false });
		});
	});

	describe('under strict, conforming marks stay unmasked', () => {
		it('does not mask a fitting assessment', () => {
			expect(
				deriveMask({
					assessment: { mark: 'fits' },
					strict: true,
					levelLabel: 'Beginner',
				}),
			).toEqual({ masked: false });
		});

		it('does not mask an undetermined assessment — the carve-out wins', () => {
			expect(
				deriveMask({
					assessment: { mark: 'undetermined' },
					strict: true,
					levelLabel: 'Beginner',
				}),
			).toEqual({ masked: false });
		});
	});

	describe('under strict, does-not-fit masks', () => {
		it('masks, naming the level and the first violation', () => {
			const first = violation('first');
			expect(
				deriveMask({
					assessment: doesNotFit([first, violation('second')]),
					strict: true,
					levelLabel: 'Beginner',
				}),
			).toEqual({
				masked: true,
				levelLabel: 'Beginner',
				cause: { kind: 'violation', violation: first },
			});
		});

		it('carries the offending violation by reference', () => {
			const first = violation('first');
			const result = deriveMask({
				assessment: doesNotFit([first, violation('second')]),
				strict: true,
				levelLabel: 'Beginner',
			});
			expect(
				result.masked && result.cause.kind === 'violation'
					? result.cause.violation
					: null,
			).toBe(first);
		});
	});

	describe('under strict, not-applicable-for-type masks', () => {
		it('masks, naming the level and the admitted types', () => {
			expect(
				deriveMask({
					assessment: notApplicable(['module']),
					strict: true,
					levelLabel: 'Advanced',
				}),
			).toEqual({
				masked: true,
				levelLabel: 'Advanced',
				cause: { kind: 'type-admission', admitted: ['module'] },
			});
		});

		it('carries the admitted-types array by reference', () => {
			const admitted: ReadonlyArray<SnippetType> = ['module'];
			const result = deriveMask({
				assessment: notApplicable(admitted),
				strict: true,
				levelLabel: 'Advanced',
			});
			expect(
				result.masked && result.cause.kind === 'type-admission'
					? result.cause.admitted
					: null,
			).toBe(admitted);
		});
	});

	describe('frozen output', () => {
		it('freezes the unmasked state', () => {
			expect(
				Object.isFrozen(
					deriveMask({
						assessment: { mark: 'fits' },
						strict: true,
						levelLabel: 'Beginner',
					}),
				),
			).toBe(true);
		});

		it('freezes the masked state', () => {
			expect(
				Object.isFrozen(
					deriveMask({
						assessment: doesNotFit([violation('debugger')]),
						strict: true,
						levelLabel: 'Beginner',
					}),
				),
			).toBe(true);
		});

		it('freezes the violation cause wrapper', () => {
			const result = deriveMask({
				assessment: doesNotFit([violation('debugger')]),
				strict: true,
				levelLabel: 'Beginner',
			});
			expect(result.masked && Object.isFrozen(result.cause)).toBe(true);
		});

		it('freezes the type-admission cause wrapper', () => {
			const result = deriveMask({
				assessment: notApplicable(['module']),
				strict: true,
				levelLabel: 'Beginner',
			});
			expect(result.masked && Object.isFrozen(result.cause)).toBe(true);
		});

		it('leaves the foreign violation unfrozen', () => {
			const first = violation('debugger');
			deriveMask({
				assessment: doesNotFit([first]),
				strict: true,
				levelLabel: 'Beginner',
			});
			expect(Object.isFrozen(first)).toBe(false);
		});

		it('leaves the foreign admitted-types array unfrozen', () => {
			const admitted: ReadonlyArray<SnippetType> = ['module'];
			deriveMask({
				assessment: notApplicable(admitted),
				strict: true,
				levelLabel: 'Beginner',
			});
			expect(Object.isFrozen(admitted)).toBe(false);
		});
	});
});
