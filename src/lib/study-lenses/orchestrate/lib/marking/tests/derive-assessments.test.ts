import { describe, expect, it } from 'vitest';

import type {
	SnippetType,
	Violation,
} from '../../../../language-levels/types.js';
import type { LevelVerdict } from '../../validating/types.js';
import deriveAssessments from '../derive-assessments.js';

function violation(nodeType: string, start: number): Violation {
	return {
		nodeType,
		message: `${nodeType} is not allowed at this level`,
		location: { start, end: start + nodeType.length },
		nodePath: `Program.body.0.${nodeType}`,
	};
}

const undetermined: LevelVerdict = { kind: 'undetermined' };

function validated(violations: ReadonlyArray<Violation> = []): LevelVerdict {
	return { kind: 'validated', violations };
}

describe('deriveAssessments', () => {
	describe('the undetermined carve-out', () => {
		it('classifies an undetermined verdict as undetermined', () => {
			expect(deriveAssessments(undetermined, ['module'], 'module')).toEqual({
				mark: 'undetermined',
			});
		});

		it('lets undetermined win when the current type is not admitted', () => {
			expect(deriveAssessments(undetermined, ['module'], 'script')).toEqual({
				mark: 'undetermined',
			});
		});

		it('lets undetermined win even when the level admits nothing', () => {
			expect(deriveAssessments(undetermined, [], 'module')).toEqual({
				mark: 'undetermined',
			});
		});
	});

	describe('a determined, admitted verdict', () => {
		it('fits when parsed, type admitted, and no violations', () => {
			expect(deriveAssessments(validated([]), ['module'], 'module')).toEqual({
				mark: 'fits',
			});
		});

		it('admits when the current type is among several admitted types', () => {
			expect(
				deriveAssessments(validated([]), ['script', 'module'], 'module'),
			).toEqual({ mark: 'fits' });
		});

		it('does not fit when violations are present, carrying them', () => {
			const violations = [violation('DebuggerStatement', 3)];
			const assessment = deriveAssessments(
				validated(violations),
				['module'],
				'module',
			);
			expect(assessment).toEqual({ mark: 'does-not-fit', violations });
		});

		it('carries the verdict violations by reference, never copied', () => {
			const violations = [
				violation('DebuggerStatement', 3),
				violation('WithStatement', 20),
			];
			const assessment = deriveAssessments(
				validated(violations),
				['module'],
				'module',
			);
			if (assessment.mark === 'does-not-fit') {
				expect(assessment.violations).toBe(violations);
			} else {
				throw new Error(`expected does-not-fit, got ${assessment.mark}`);
			}
		});
	});

	describe('type admission', () => {
		it('is not applicable when the level admits nothing', () => {
			expect(deriveAssessments(validated([]), [], 'module')).toEqual({
				mark: 'not-applicable-for-type',
				admitted: [],
			});
		});

		it('is not applicable when the type is not admitted, carrying the admitted types', () => {
			expect(deriveAssessments(validated([]), ['module'], 'script')).toEqual({
				mark: 'not-applicable-for-type',
				admitted: ['module'],
			});
		});

		it('carries the admitted types by reference, never copied', () => {
			const admitted: ReadonlyArray<SnippetType> = ['module'];
			const assessment = deriveAssessments(validated([]), admitted, 'script');
			if (assessment.mark === 'not-applicable-for-type') {
				expect(assessment.admitted).toBe(admitted);
			} else {
				throw new Error(`expected not-applicable, got ${assessment.mark}`);
			}
		});

		it('judges type admission before violations (not-applicable wins over does-not-fit)', () => {
			const assessment = deriveAssessments(
				validated([violation('DebuggerStatement', 3)]),
				['module'],
				'script',
			);
			expect(assessment).toEqual({
				mark: 'not-applicable-for-type',
				admitted: ['module'],
			});
		});
	});

	describe('frozen output', () => {
		it('freezes the undetermined assessment', () => {
			expect(
				Object.isFrozen(deriveAssessments(undetermined, ['module'], 'module')),
			).toBe(true);
		});

		it('freezes the fits assessment', () => {
			expect(
				Object.isFrozen(deriveAssessments(validated([]), ['module'], 'module')),
			).toBe(true);
		});

		it('freezes the not-applicable assessment', () => {
			expect(
				Object.isFrozen(deriveAssessments(validated([]), ['module'], 'script')),
			).toBe(true);
		});

		it('freezes the does-not-fit assessment', () => {
			expect(
				Object.isFrozen(
					deriveAssessments(
						validated([violation('DebuggerStatement', 3)]),
						['module'],
						'module',
					),
				),
			).toBe(true);
		});

		it('leaves the carried admitted array unfrozen (freeze-what-you-own)', () => {
			const admitted: ReadonlyArray<SnippetType> = ['module'];
			deriveAssessments(validated([]), admitted, 'script');
			expect(Object.isFrozen(admitted)).toBe(false);
		});

		it('leaves the carried violations array unfrozen (freeze-what-you-own)', () => {
			const violations = [violation('DebuggerStatement', 3)];
			deriveAssessments(validated(violations), ['module'], 'module');
			expect(Object.isFrozen(violations)).toBe(false);
		});

		it('leaves a carried violation object unfrozen (freeze-what-you-own)', () => {
			const single = violation('DebuggerStatement', 3);
			deriveAssessments(validated([single]), ['module'], 'module');
			expect(Object.isFrozen(single)).toBe(false);
		});
	});
});
