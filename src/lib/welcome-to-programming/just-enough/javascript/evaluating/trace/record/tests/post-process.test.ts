/**
 * @file Tests for postProcess — transforms raw trace entries into AranStep[].
 *
 * Hand-crafted entries mirror the shapes emitted by traceCollector
 * (see legacy-aran-trace/README.md for reference).
 */

import { describe, expect, it } from 'vitest';

import postProcess from '../post-process.js';
import type { AranStep, RawEntry } from '../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loc(
	startLine: number,
	startCol: number,
	endLine: number,
	endCol: number,
) {
	return {
		start: { line: startLine, column: startCol },
		end: { line: endLine, column: endCol },
	};
}

function entry(
	overrides: Partial<RawEntry> & { logs: readonly unknown[] },
): RawEntry {
	return {
		type: 'log',
		prefix: ' 1. line  1:0  -',
		style: '',
		loc: null,
		nodeType: null,
		...overrides,
	};
}

const DEFAULT_LOC = {
	start: { line: 0, column: 0 },
	end: { line: 0, column: 0 },
};

// ---------------------------------------------------------------------------
// Increment 3: Standard entries — variables, operators, calls, checks
// ---------------------------------------------------------------------------

describe('postProcess', () => {
	describe('variable operations', () => {
		it('parses a variable read', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					logs: ['x (read):', 42],
					loc: loc(3, 0, 3, 1),
					nodeType: 'Identifier',
				}),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('read');
			expect(steps[0].name).toBe('x');
			expect(steps[0].operator).toBeNull();
			expect(steps[0].modifier).toBeNull();
			expect(steps[0].values).toEqual([42]);
			expect(steps[0].loc).toEqual(loc(3, 0, 3, 1));
			expect(steps[0].nodeType).toBe('Identifier');
		});

		it('parses a variable declaration with kind', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					logs: ['x (declare, let)'],
					loc: loc(1, 0, 1, 10),
					nodeType: 'VariableDeclaration',
				}),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('declare');
			expect(steps[0].name).toBe('x');
			expect(steps[0].modifier).toBe('let');
			expect(steps[0].values).toEqual([]);
		});

		it('parses a variable declaration with initializer', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					logs: ['x (declare, const)'],
					loc: loc(1, 0, 1, 14),
					nodeType: 'VariableDeclaration',
				}),
				entry({
					logs: ['x (initialize):', 5],
					loc: loc(1, 10, 1, 11),
					nodeType: 'Literal',
				}),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(2);
			expect(steps[0].operation).toBe('declare');
			expect(steps[0].modifier).toBe('const');
			expect(steps[1].operation).toBe('initialize');
			expect(steps[1].name).toBe('x');
			expect(steps[1].values).toEqual([5]);
		});

		it('parses a variable assignment', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					logs: ['x (assign):', 10],
					loc: loc(4, 0, 4, 6),
					nodeType: 'AssignmentExpression',
				}),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('assign');
			expect(steps[0].name).toBe('x');
			expect(steps[0].values).toEqual([10]);
		});

		it('parses a bare declaration (no kind, no value)', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					logs: ['i (declare)'],
					loc: loc(1, 0, 1, 20),
					nodeType: 'ForOfStatement',
				}),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('declare');
			expect(steps[0].name).toBe('i');
			expect(steps[0].modifier).toBeNull();
		});
	});

	describe('operator operations', () => {
		it('parses a binary operation group and folds evaluate result', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					type: 'groupStart',
					logs: ['operation (_ + _):', 3, '+', 4],
					style: 'font-weight: bold;',
					loc: loc(1, 8, 1, 13),
					nodeType: 'BinaryExpression',
				}),
				'>>>',
				entry({ prefix: null, logs: ['(evaluates to):', 7], loc: null }),
				'<<<',
			];
			const steps = postProcess(entries) as AranStep[];
			// evaluate step is folded into binary step
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('binary');
			expect(steps[0].operator).toBe('+');
			expect(steps[0].values).toEqual([3, 4]);
			expect(steps[0].result).toBe(7);
			expect(steps[0].loc).toEqual(loc(1, 8, 1, 13));
		});

		it('parses a unary operation group and folds evaluate result', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					type: 'groupStart',
					logs: ['operation (! _):', '!', true],
					style: 'font-weight: bold;',
					loc: loc(2, 0, 2, 5),
					nodeType: 'UnaryExpression',
				}),
				'>>>',
				entry({ prefix: null, logs: ['(evaluates to):', false], loc: null }),
				'<<<',
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('unary');
			expect(steps[0].operator).toBe('!');
			expect(steps[0].values).toEqual([true]);
			expect(steps[0].result).toBe(false);
		});
	});

	describe('function call operations', () => {
		it('parses a function call group', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					type: 'groupStart',
					logs: ['add (call):', 3, ',', 4],
					loc: loc(5, 0, 5, 10),
					nodeType: 'CallExpression',
				}),
				'>>>',
				entry({
					prefix: '(returns):',
					logs: [7],
					style: 'font-weight: bold;',
					loc: null,
				}),
				'<<<',
			];
			const steps = postProcess(entries) as AranStep[];
			const callStep = steps.find((s) => s.operation === 'call');
			expect(callStep).toBeDefined();
			expect(callStep!.name).toBe('add');
			expect(callStep!.values).toEqual([3, 4]);

			const returnStep = steps.find((s) => s.operation === 'return');
			expect(returnStep).toBeDefined();
			expect(returnStep!.values).toEqual([7]);
		});

		it('parses a built-in function call', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					type: 'groupStart',
					logs: ['push (call, built-in):', 42],
					loc: loc(3, 0, 3, 12),
					nodeType: 'CallExpression',
				}),
				'>>>',
				entry({
					prefix: '(returns):',
					logs: [3],
					style: 'font-weight: bold;',
					loc: null,
				}),
				'<<<',
			];
			const steps = postProcess(entries) as AranStep[];
			const callStep = steps.find((s) => s.operation === 'call');
			expect(callStep).toBeDefined();
			expect(callStep!.name).toBe('push');
			expect(callStep!.modifier).toBe('built-in');
		});
	});

	describe('control flow operations', () => {
		it('parses a check with truthiness', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					type: 'groupStart',
					logs: ['check (if, truthy):', true],
					loc: loc(2, 4, 2, 10),
					nodeType: 'IfStatement',
				}),
				'>>>',
				entry({ prefix: '', logs: ['if (x > 0) {'] }),
				'<<<',
			];
			const steps = postProcess(entries) as AranStep[];
			const checkStep = steps.find((s) => s.operation === 'check');
			expect(checkStep).toBeDefined();
			expect(checkStep!.name).toBe('if');
			expect(checkStep!.modifier).toBe('truthy');
			expect(checkStep!.values).toEqual([true]);
			expect(checkStep!.nodeType).toBe('IfStatement');
		});

		it('parses a check without truthiness (for-of)', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					type: 'groupStart',
					logs: ['check (for-of):', [1, 2, 3]],
					loc: loc(1, 0, 1, 30),
					nodeType: 'ForOfStatement',
				}),
				'>>>',
				'<<<',
			];
			const steps = postProcess(entries) as AranStep[];
			const checkStep = steps.find((s) => s.operation === 'check');
			expect(checkStep).toBeDefined();
			expect(checkStep!.name).toBe('for-of');
			expect(checkStep!.modifier).toBeNull();
		});

		it('parses a logical operator group', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					type: 'groupStart',
					logs: ['operator (truthy && _):', true, '&&', '_'],
					loc: loc(3, 0, 3, 15),
					nodeType: 'LogicalExpression',
				}),
				'>>>',
				entry({ prefix: null, logs: ['true && getValue()'] }),
				'<<<',
			];
			const steps = postProcess(entries) as AranStep[];
			const logicalStep = steps.find((s) => s.operation === 'logical');
			expect(logicalStep).toBeDefined();
			expect(logicalStep!.operator).toBe('&&');
			expect(logicalStep!.modifier).toBe('truthy');
		});

		it('parses a conditional operator group', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					type: 'groupStart',
					logs: ['operator (falsy ?_a_:_b_):', false, '?_:_'],
					loc: loc(1, 0, 1, 20),
					nodeType: 'ConditionalExpression',
				}),
				'>>>',
				entry({
					prefix: null,
					logs: ['x ? a : b', '\n\n(evaluates to):', '_b_'],
				}),
				'<<<',
			];
			const steps = postProcess(entries) as AranStep[];
			const condStep = steps.find((s) => s.operation === 'conditional');
			expect(condStep).toBeDefined();
			expect(condStep!.operator).toBe('?:');
			expect(condStep!.modifier).toBe('falsy');
		});
	});

	// ---------------------------------------------------------------------------
	// Increment 4: Prefix-embedded + non-numbered entries
	// ---------------------------------------------------------------------------

	describe('prefix-embedded operations', () => {
		it('parses a catch entry', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					prefix: ' 5. line  8:4  - catch:',
					logs: ['some error'],
					style: 'font-weight: bold;',
					loc: loc(8, 4, 10, 1),
					nodeType: 'CatchClause',
				}),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('catch');
			expect(steps[0].values).toEqual(['some error']);
		});

		it('parses a throw entry', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					prefix: ' 3. line  5:2  - throw:',
					logs: ['thrown value'],
					style: 'font-weight: bold;',
					loc: loc(5, 2, 5, 20),
					nodeType: 'ThrowStatement',
				}),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('throw');
			expect(steps[0].values).toEqual(['thrown value']);
		});

		it('parses a break entry without label', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					prefix: ' 5. line  8:4  - break ',
					logs: [],
					style: 'font-weight: bold;',
					loc: loc(8, 4, 8, 9),
					nodeType: 'BreakStatement',
				}),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('break');
			expect(steps[0].name).toBeNull();
		});

		it('parses a break entry with label', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					prefix: ' 5. line  8:4  - break myLoop',
					logs: [],
					style: 'font-weight: bold;',
					loc: loc(8, 4, 8, 18),
					nodeType: 'BreakStatement',
				}),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('break');
			expect(steps[0].name).toBe('myLoop');
		});

		it('parses a continue entry without label', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					prefix: ' 6. line  9:4  - continue ',
					logs: [],
					style: 'font-weight: bold;',
					loc: loc(9, 4, 9, 12),
					nodeType: 'ContinueStatement',
				}),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('continue');
			expect(steps[0].name).toBeNull();
		});

		it('parses a continue entry with label', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					prefix: ' 6. line  9:4  - continue outer',
					logs: [],
					style: 'font-weight: bold;',
					loc: loc(9, 4, 9, 20),
					nodeType: 'ContinueStatement',
				}),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('continue');
			expect(steps[0].name).toBe('outer');
		});
	});

	describe('non-numbered entries', () => {
		it('parses a return entry', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					prefix: '(returns):',
					logs: [7],
					style: 'font-weight: bold;',
					loc: null,
				}),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('return');
			expect(steps[0].values).toEqual([7]);
			expect(steps[0].loc).toEqual(DEFAULT_LOC);
		});

		it('parses an evaluates-to entry', () => {
			const entries: (RawEntry | string)[] = [
				entry({ prefix: null, logs: ['(evaluates to):', 7], loc: null }),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('evaluate');
			expect(steps[0].values).toEqual([7]);
		});

		it('parses a this-binding entry', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					prefix: null,
					logs: ['this:', { name: 'window' }],
					style: 'font-weight: bold;',
					loc: null,
				}),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('this');
			expect(steps[0].values).toEqual([{ name: 'window' }]);
		});

		it('parses a hoist: var entry', () => {
			const entries: (RawEntry | string)[] = [
				entry({ prefix: '', logs: ['hoist: var x'], loc: null }),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('hoist');
			expect(steps[0].name).toBe('x');
			expect(steps[0].modifier).toBe('var');
		});

		it('parses a hoist: function entry', () => {
			const entries: (RawEntry | string)[] = [
				entry({ prefix: '', logs: ['hoist: function foo'], loc: null }),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('hoist');
			expect(steps[0].name).toBe('foo');
			expect(steps[0].modifier).toBe('function');
		});

		it('parses enter/leave entries', () => {
			const entries: (RawEntry | string)[] = [
				entry({ prefix: null, logs: ['enter ', 1], loc: null }),
				entry({ prefix: null, logs: ['leave ', 0], loc: null }),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(2);
			expect(steps[0].operation).toBe('enter');
			expect(steps[0].values).toEqual([1]);
			expect(steps[1].operation).toBe('leave');
			expect(steps[1].values).toEqual([0]);
		});

		it('parses exception entries', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					prefix: '-> execution phase:',
					logs: [],
					style: 'font-weight: bold;',
					loc: null,
				}),
				entry({
					prefix: 'TypeError',
					logs: [' run or debug code for a complete error message'],
					style: 'color:red;',
					loc: null,
				}),
			];
			const steps = postProcess(entries) as AranStep[];
			const exceptions = steps.filter((s) => s.operation === 'exception');
			expect(exceptions.length).toBeGreaterThanOrEqual(1);
		});
	});

	// ---------------------------------------------------------------------------
	// Increment 5: Depth, scope tracking, step numbering
	// ---------------------------------------------------------------------------

	describe('depth and scope tracking', () => {
		it('tracks depth from >>> and <<<', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					type: 'groupStart',
					logs: ['operation (_ + _):', 1, '+', 2],
					style: 'font-weight: bold;',
					loc: loc(1, 0, 1, 5),
					nodeType: 'BinaryExpression',
				}),
				'>>>',
				entry({ prefix: null, logs: ['(evaluates to):', 3], loc: null }),
				'<<<',
				entry({
					logs: ['x (assign):', 3],
					loc: loc(1, 4, 1, 9),
					nodeType: 'AssignmentExpression',
				}),
			];
			const steps = postProcess(entries) as AranStep[];
			// evaluate is folded into binary → 2 steps total
			expect(steps).toHaveLength(2);
			const binaryStep = steps.find((s) => s.operation === 'binary');
			const assignStep = steps.find((s) => s.operation === 'assign');
			expect(binaryStep!.depth).toBe(0);
			expect(binaryStep!.result).toBe(3);
			expect(assignStep!.depth).toBe(0);
		});

		it('infers scope type from preceding groupStart', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					type: 'groupStart',
					logs: ['add (call):', 3],
					loc: loc(1, 0, 1, 6),
					nodeType: 'CallExpression',
				}),
				'>>>',
				entry({
					logs: ['x (read):', 3],
					loc: loc(2, 2, 2, 3),
					nodeType: 'Identifier',
				}),
				'<<<',
			];
			const steps = postProcess(entries) as AranStep[];
			const innerStep = steps.find((s) => s.operation === 'read');
			expect(innerStep!.scopeType).toBe('call');
		});
	});

	describe('step numbering', () => {
		it('assigns sequential 1-indexed step numbers', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					logs: ['x (declare, let)'],
					loc: loc(1, 0, 1, 10),
					nodeType: 'VariableDeclaration',
				}),
				entry({
					logs: ['x (read):', 42],
					loc: loc(2, 0, 2, 1),
					nodeType: 'Identifier',
				}),
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(2);
			expect(steps[0].step).toBe(1);
			expect(steps[1].step).toBe(2);
		});
	});

	// ---------------------------------------------------------------------------
	// Filtering
	// ---------------------------------------------------------------------------

	describe('filtering', () => {
		it('excludes >>> and <<< string markers', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					type: 'groupStart',
					logs: ['add (call):', 1],
					loc: loc(1, 0, 1, 5),
					nodeType: 'CallExpression',
				}),
				'>>>',
				entry({
					prefix: '(returns):',
					logs: [1],
					style: 'font-weight: bold;',
					loc: null,
				}),
				'<<<',
			];
			const steps = postProcess(entries) as AranStep[];
			// No step should have >>> or <<< as content
			for (const step of steps) {
				expect(step.operation).not.toBe('>>>');
				expect(step.operation).not.toBe('<<<');
			}
		});

		it('preserves standalone evaluate steps not following operators', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					type: 'groupStart',
					logs: ['add (call):', 1],
					loc: loc(1, 0, 1, 5),
					nodeType: 'CallExpression',
				}),
				'>>>',
				entry({ prefix: null, logs: ['(evaluates to):', 42], loc: null }),
				'<<<',
			];
			const steps = postProcess(entries) as AranStep[];
			// evaluate after call (not operator) is NOT merged
			const evalStep = steps.find((s) => s.operation === 'evaluate');
			expect(evalStep).toBeDefined();
			expect(evalStep!.values).toEqual([42]);
		});

		it('folds conditional evaluate result into parent step', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					type: 'groupStart',
					logs: ['operator (truthy ?_a_:_b_):', true, '?_:_'],
					style: 'font-weight: bold;',
					loc: loc(1, 0, 1, 20),
					nodeType: 'ConditionalExpression',
				}),
				'>>>',
				entry({ prefix: null, logs: ['(evaluates to):', '_a_'], loc: null }),
				'<<<',
			];
			const steps = postProcess(entries) as AranStep[];
			expect(steps).toHaveLength(1);
			expect(steps[0].operation).toBe('conditional');
			expect(steps[0].result).toBe('_a_');
		});

		it('excludes source line echo entries (empty prefix, single string log)', () => {
			const entries: (RawEntry | string)[] = [
				entry({
					type: 'groupStart',
					logs: ['check (if, truthy):', true],
					loc: loc(2, 4, 2, 10),
					nodeType: 'IfStatement',
				}),
				'>>>',
				entry({ prefix: '', logs: ['if (x > 0) {'] }),
				'<<<',
			];
			const steps = postProcess(entries) as AranStep[];
			// Source line echo should be excluded
			const sourceEcho = steps.find(
				(s) => s.values.length === 1 && s.values[0] === 'if (x > 0) {',
			);
			expect(sourceEcho).toBeUndefined();
		});
	});
});
