import { describe, expect, it } from 'vitest';

import createStatementPointcut from '../statement-pointcut.js';

const baseLoc = { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } };

function makeTag(overrides = {}) {
	return { loc: baseLoc, node: 'BreakStatement', source: 'break;', ...overrides };
}

describe('createStatementPointcut', () => {
	describe('BreakStatement → JumpEvent', () => {
		it('matches when jump is enabled', () => {
			const pointcut = createStatementPointcut({ controlFlow: { events: { jump: true } } });
			const result = pointcut(
				{ type: 'BreakStatement', tag: makeTag() },
				null,
				null,
			);
			expect(result).not.toBeNull();
		});

		it('discriminant is jump', () => {
			const pointcut = createStatementPointcut({ controlFlow: { events: { jump: true } } });
			const result = pointcut(
				{ type: 'BreakStatement', tag: makeTag(), label: 'outer' },
				null,
				null,
			);
			expect(result![0]).toBe('jump');
		});

		it('includes label', () => {
			const pointcut = createStatementPointcut({ controlFlow: { events: { jump: true } } });
			const result = pointcut(
				{ type: 'BreakStatement', tag: makeTag(), label: 'outer' },
				null,
				null,
			);
			expect(result![1]).toBe('outer');
		});

		it('skips when jump is disabled', () => {
			const pointcut = createStatementPointcut({ controlFlow: { events: { jump: false } } });
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
			const pointcut = createStatementPointcut({ controlFlow: { events: { jump: true } } });
			const result = pointcut(
				{ type: 'WhileStatement', tag: makeTag({ node: 'WhileStatement' }) },
				null,
				null,
			);
			expect(result).toBeNull();
		});

		it('returns null for DebuggerStatement', () => {
			const pointcut = createStatementPointcut({ controlFlow: { events: { jump: true } } });
			const result = pointcut(
				{ type: 'DebuggerStatement', tag: makeTag({ node: 'DebuggerStatement' }) },
				null,
				null,
			);
			expect(result).toBeNull();
		});
	});
});
