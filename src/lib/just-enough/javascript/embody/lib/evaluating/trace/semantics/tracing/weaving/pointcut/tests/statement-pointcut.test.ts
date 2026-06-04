import { describe, expect, it } from 'vitest';

import createStatementPointcut from '../statement-pointcut.js';

const baseLoc = { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } };

function makeTag(overrides = {}) {
	return {
		loc: baseLoc,
		node: 'BreakStatement',
		source: 'break;',
		...overrides,
	};
}

describe('createStatementPointcut', () => {
	describe('BreakStatement → JumpEvent', () => {
		it('matches when jump is enabled', () => {
			const pointcut = createStatementPointcut({
				controlFlow: { events: { jump: true } },
			});
			const result = pointcut(
				{ type: 'BreakStatement', tag: makeTag() },
				null,
				null,
			);
			expect(result).not.toBeNull();
		});

		it('discriminant is jump', () => {
			const pointcut = createStatementPointcut({
				controlFlow: { events: { jump: true } },
			});
			const result = pointcut(
				{ type: 'BreakStatement', tag: makeTag(), label: 'break.outer' },
				null,
				null,
			);
			expect(result![0]).toBe('jump');
		});

		it('detects break kind from break-prefixed label', () => {
			const pointcut = createStatementPointcut({
				controlFlow: { events: { jump: true } },
			});
			const result = pointcut(
				{ type: 'BreakStatement', tag: makeTag(), label: 'break.loop.42' },
				null,
				null,
			);
			expect(result![1]).toBe('break');
		});

		it('detects continue kind from continue-prefixed label', () => {
			const pointcut = createStatementPointcut({
				controlFlow: { events: { jump: true } },
			});
			const result = pointcut(
				{ type: 'BreakStatement', tag: makeTag(), label: 'continue.loop.42' },
				null,
				null,
			);
			expect(result![1]).toBe('continue');
		});

		it('detects continue kind from bare continue label', () => {
			const pointcut = createStatementPointcut({
				controlFlow: { events: { jump: true } },
			});
			const result = pointcut(
				{ type: 'BreakStatement', tag: makeTag(), label: 'continue' },
				null,
				null,
			);
			expect(result![1]).toBe('continue');
		});

		it('extracts user label from break.myLabel', () => {
			const pointcut = createStatementPointcut({
				controlFlow: { events: { jump: true } },
			});
			const result = pointcut(
				{ type: 'BreakStatement', tag: makeTag(), label: 'break.outer' },
				null,
				null,
			);
			expect(result![2]).toBe('outer');
		});

		it('extracts user label from continue.myLabel', () => {
			const pointcut = createStatementPointcut({
				controlFlow: { events: { jump: true } },
			});
			const result = pointcut(
				{ type: 'BreakStatement', tag: makeTag(), label: 'continue.outer' },
				null,
				null,
			);
			expect(result![2]).toBe('outer');
		});

		it('returns null user label for synthetic break.loop labels', () => {
			const pointcut = createStatementPointcut({
				controlFlow: { events: { jump: true } },
			});
			const result = pointcut(
				{ type: 'BreakStatement', tag: makeTag(), label: 'break.loop.42' },
				null,
				null,
			);
			expect(result![2]).toBeNull();
		});

		it('returns null user label for bare continue', () => {
			const pointcut = createStatementPointcut({
				controlFlow: { events: { jump: true } },
			});
			const result = pointcut(
				{ type: 'BreakStatement', tag: makeTag(), label: 'continue' },
				null,
				null,
			);
			expect(result![2]).toBeNull();
		});

		it('skips when jump is disabled', () => {
			const pointcut = createStatementPointcut({
				controlFlow: { events: { jump: false } },
			});
			const result = pointcut(
				{ type: 'BreakStatement', tag: makeTag() },
				null,
				null,
			);
			expect(result).toBeNull();
		});
	});

	describe('unmatched statements', () => {
		it('returns null for WhileStatement', () => {
			const pointcut = createStatementPointcut({
				controlFlow: { events: { jump: true } },
			});
			const result = pointcut(
				{ type: 'WhileStatement', tag: makeTag({ node: 'WhileStatement' }) },
				null,
				null,
			);
			expect(result).toBeNull();
		});
	});
});
