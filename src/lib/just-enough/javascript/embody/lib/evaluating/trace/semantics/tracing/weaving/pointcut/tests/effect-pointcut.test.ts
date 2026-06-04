import { describe, expect, it } from 'vitest';

import createEffectPointcut from '../effect-pointcut.js';

const baseLoc = { start: { line: 1, column: 0 }, end: { line: 1, column: 5 } };

function makeTag(overrides = {}) {
	return {
		loc: baseLoc,
		node: 'AssignmentExpression',
		source: 'x = 5',
		...overrides,
	};
}

describe('createEffectPointcut', () => {
	describe('WriteEffect', () => {
		it('matches when bindings.events.assign is enabled', () => {
			const pointcut = createEffectPointcut({
				bindings: { events: { assign: true } },
			});
			const result = pointcut(
				{ type: 'WriteEffect', tag: makeTag(), variable: 'x' },
				null,
				null,
			);
			expect(result).not.toBeNull();
		});

		it('matches compound assignment when operators.assignment is enabled', () => {
			const pointcut = createEffectPointcut({
				operators: { assignment: true },
			});
			const result = pointcut(
				{
					type: 'WriteEffect',
					tag: makeTag({ operator: '+=' }),
					variable: 'x',
				},
				null,
				null,
			);
			expect(result).not.toBeNull();
		});

		it('skips when both configs disabled', () => {
			const pointcut = createEffectPointcut({
				bindings: { events: { assign: false } },
				operators: { assignment: false },
			});
			const result = pointcut(
				{ type: 'WriteEffect', tag: makeTag(), variable: 'x' },
				null,
				null,
			);
			expect(result).toBeNull();
		});

		it('returns [variable, tag]', () => {
			const pointcut = createEffectPointcut({
				bindings: { events: { assign: true } },
			});
			const tag = makeTag();
			const result = pointcut(
				{ type: 'WriteEffect', tag, variable: 'count' },
				null,
				null,
			);
			expect(result).toEqual(['count', tag]);
		});
	});

	describe('ConditionalEffect', () => {
		it('matches logical assignment when operators.assignment is enabled', () => {
			const pointcut = createEffectPointcut({
				operators: { assignment: true },
			});
			const result = pointcut(
				{ type: 'ConditionalEffect', tag: makeTag({ operator: '??=' }) },
				null,
				null,
			);
			expect(result).not.toBeNull();
		});

		it('skips when no operator in tag', () => {
			const pointcut = createEffectPointcut({
				operators: { assignment: true },
			});
			const result = pointcut(
				{ type: 'ConditionalEffect', tag: makeTag() },
				null,
				null,
			);
			expect(result).toBeNull();
		});
	});

	describe('unmatched effects', () => {
		it('returns null for ExpressionEffect', () => {
			const pointcut = createEffectPointcut({
				bindings: { events: { assign: true } },
			});
			const result = pointcut(
				{ type: 'ExpressionEffect', tag: makeTag() },
				null,
				null,
			);
			expect(result).toBeNull();
		});
	});
});
