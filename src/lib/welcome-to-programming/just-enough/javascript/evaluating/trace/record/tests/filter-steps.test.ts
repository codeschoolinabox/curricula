/**
 * @file Tests for filterSteps — post-trace filtering of AranStep[].
 *
 * Hand-crafted AranStep fixtures test each filter dimension independently.
 */

import { describe, expect, it } from 'vitest';

import filterSteps, { fillConfig } from '../filter-steps.js';
import type { AranStep } from '../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_LOC = Object.freeze({
	start: Object.freeze({ line: 1, column: 0 }),
	end: Object.freeze({ line: 1, column: 10 }),
});

function step(overrides: Partial<AranStep> = {}): AranStep {
	return {
		step: 1,
		loc: DEFAULT_LOC,
		operation: 'read',
		name: 'x',
		operator: null,
		modifier: null,
		values: [42],
		depth: 0,
		scopeType: null,
		nodeType: 'Identifier',
		...overrides,
	};
}

function loc(startLine: number, endLine: number = startLine) {
	return {
		start: { line: startLine, column: 0 },
		end: { line: endLine, column: 10 },
	};
}

// ---------------------------------------------------------------------------
// fillConfig
// ---------------------------------------------------------------------------

describe('fillConfig', () => {
	it('returns all-enabled defaults for empty options', () => {
		const config = fillConfig({});

		expect(config.variables).toBe(true);
		expect(config.operators).toBe(true);
		expect(config.controlFlow).toBe(true);
		expect(config.functions).toBe(true);
		expect(config.functionDeclarations).toBe(true);
		expect(config.this).toBe(true);
		expect(config.errorHandling).toBe(true);
		expect(config.enterLeave).toBe(true);
	});

	it('converts filter lists to Sets', () => {
		const config = fillConfig({
			filter: { operatorsList: ['+', '-'] },
		});

		expect(config.filter.operatorsList).toBeInstanceOf(Set);
		expect(config.filter.operatorsList.has('+')).toBe(true);
		expect(config.filter.operatorsList.has('*')).toBe(false);
	});

	it('resolves name filter to Set', () => {
		const config = fillConfig({
			filter: { names: ['x', 'y'] },
		});

		expect(config.filter.names).toBeInstanceOf(Set);
		expect(config.filter.names.has('x')).toBe(true);
		expect(config.filter.names.has('z')).toBe(false);
	});

	it('defaults name filter to empty Set (keep all)', () => {
		const config = fillConfig({});

		expect(config.filter.names).toBeInstanceOf(Set);
		expect(config.filter.names.size).toBe(0);
	});

	it('defaults range to 1..100_000', () => {
		const config = fillConfig({});

		expect(config.range.start).toBe(1);
		expect(config.range.end).toBe(100_000);
	});

	it('defaults data fields to all enabled', () => {
		const config = fillConfig({});

		expect(config.data).toEqual({
			loc: true,
			values: true,
			nodeType: true,
			depth: true,
		});
	});
});

// ---------------------------------------------------------------------------
// filterSteps — category filters
// ---------------------------------------------------------------------------

describe('filterSteps', () => {
	describe('category filters', () => {
		it('filters out variable operations when variables is false', () => {
			const steps = [
				step({ step: 1, operation: 'read', name: 'x' }),
				step({ step: 2, operation: 'declare', name: 'y' }),
				step({ step: 3, operation: 'assign', name: 'z' }),
				step({ step: 4, operation: 'initialize', name: 'w' }),
			];
			const result = filterSteps(steps, { variables: false });

			expect(result).toHaveLength(0);
		});

		it('filters out binary operations when operators is false', () => {
			const steps = [
				step({ step: 1, operation: 'binary', name: null, operator: '+' }),
			];
			const result = filterSteps(steps, { operators: false });

			expect(result).toHaveLength(0);
		});

		it('filters out unary operations when operators is false', () => {
			const steps = [
				step({ step: 1, operation: 'unary', name: null, operator: '!' }),
			];
			const result = filterSteps(steps, { operators: false });

			expect(result).toHaveLength(0);
		});

		it('filters out logical operations when operators is false', () => {
			const steps = [
				step({ step: 1, operation: 'logical', name: null, operator: '&&' }),
			];
			const result = filterSteps(steps, { operators: false });

			expect(result).toHaveLength(0);
		});

		it('filters out conditional operations when operators is false', () => {
			const steps = [
				step({ step: 1, operation: 'conditional', name: null, operator: '?:' }),
			];
			const result = filterSteps(steps, { operators: false });

			expect(result).toHaveLength(0);
		});

		it('filters out check operations when controlFlow is false', () => {
			const steps = [step({ step: 1, operation: 'check', name: null })];
			const result = filterSteps(steps, { controlFlow: false });

			expect(result).toHaveLength(0);
		});

		it('filters out break operations when controlFlow is false', () => {
			const steps = [step({ step: 1, operation: 'break', name: null })];
			const result = filterSteps(steps, { controlFlow: false });

			expect(result).toHaveLength(0);
		});

		it('filters out call operations when functions is false', () => {
			const steps = [step({ step: 1, operation: 'call', name: 'add' })];
			const result = filterSteps(steps, { functions: false });

			expect(result).toHaveLength(0);
		});

		it('filters out return operations when functions is false', () => {
			const steps = [
				step({ step: 1, operation: 'return', name: null, depth: 1 }),
			];
			const result = filterSteps(steps, { functions: false });

			expect(result).toHaveLength(0);
		});

		it('filters out this operations when this is false', () => {
			const steps = [
				step({ step: 1, operation: 'this', name: null, depth: 1 }),
			];
			const result = filterSteps(steps, { this: false });

			expect(result).toHaveLength(0);
		});

		it('filters out catch operations when errorHandling is false', () => {
			const steps = [step({ step: 1, operation: 'catch', name: null })];
			const result = filterSteps(steps, { errorHandling: false });

			expect(result).toHaveLength(0);
		});

		it('filters out throw operations when errorHandling is false', () => {
			const steps = [step({ step: 1, operation: 'throw', name: null })];
			const result = filterSteps(steps, { errorHandling: false });

			expect(result).toHaveLength(0);
		});

		it('filters out enter/leave when enterLeave is false', () => {
			const steps = [
				step({ step: 1, operation: 'enter', name: null }),
				step({ step: 2, operation: 'leave', name: null }),
			];
			const result = filterSteps(steps, { enterLeave: false });

			expect(result).toHaveLength(0);
		});

		it('filters out function hoists when functionDeclarations is false', () => {
			const steps = [
				step({
					step: 1,
					operation: 'hoist',
					name: 'foo',
					modifier: 'function',
				}),
			];
			const result = filterSteps(steps, { functionDeclarations: false });

			expect(result).toHaveLength(0);
		});

		it('keeps variable hoists when functionDeclarations is false', () => {
			const steps = [
				step({ step: 1, operation: 'hoist', name: 'x', modifier: 'var' }),
			];
			const result = filterSteps(steps, { functionDeclarations: false });

			expect(result).toHaveLength(1);
		});

		it('never filters exception operations', () => {
			const steps = [step({ step: 1, operation: 'exception', name: null })];
			const result = filterSteps(steps, {
				variables: false,
				operators: false,
				controlFlow: false,
				functions: false,
				errorHandling: false,
			});

			expect(result).toHaveLength(1);
		});

		it('never filters evaluate operations at depth 0', () => {
			const steps = [
				step({ step: 1, operation: 'evaluate', name: null, depth: 0 }),
			];
			const result = filterSteps(steps, { operators: false });

			expect(result).toHaveLength(1);
		});
	});

	// ---------------------------------------------------------------------------
	// Depth coherence
	// ---------------------------------------------------------------------------

	describe('depth coherence', () => {
		it('removes children when parent group step is filtered', () => {
			const steps = [
				step({ step: 1, operation: 'call', name: 'add', depth: 0 }),
				step({ step: 2, operation: 'this', name: null, depth: 1 }),
				step({ step: 3, operation: 'read', name: 'a', depth: 1 }),
				step({ step: 4, operation: 'return', name: null, depth: 1 }),
				step({ step: 5, operation: 'read', name: 'b', depth: 0 }),
			];
			const result = filterSteps(steps, { functions: false });

			// call at depth 0 filtered → this/read/return at depth 1 also gone
			// read 'b' at depth 0 survives
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('b');
		});

		it('preserves nested children when parent passes', () => {
			const steps = [
				step({ step: 1, operation: 'call', name: 'add', depth: 0 }),
				step({
					step: 2,
					operation: 'binary',
					name: null,
					operator: '+',
					depth: 1,
				}),
				step({ step: 3, operation: 'evaluate', name: null, depth: 2 }),
				step({ step: 4, operation: 'return', name: null, depth: 1 }),
			];
			const result = filterSteps(steps, {});

			expect(result).toHaveLength(4);
		});

		it('handles nested filtered groups correctly', () => {
			const steps = [
				step({ step: 1, operation: 'call', name: 'outer', depth: 0 }),
				step({
					step: 2,
					operation: 'binary',
					name: null,
					operator: '+',
					depth: 1,
				}),
				step({ step: 3, operation: 'evaluate', name: null, depth: 2 }),
				step({ step: 4, operation: 'return', name: null, depth: 1 }),
			];
			// Filter operators → binary at depth 1 removed → evaluate at depth 2 also removed
			const result = filterSteps(steps, { operators: false });

			expect(result).toHaveLength(2);
			expect(result[0].operation).toBe('call');
			expect(result[1].operation).toBe('return');
		});
	});

	// ---------------------------------------------------------------------------
	// List filters
	// ---------------------------------------------------------------------------

	describe('list filters', () => {
		it('filters operators by operatorsList', () => {
			const steps = [
				step({ step: 1, operation: 'binary', name: null, operator: '+' }),
				step({ step: 2, operation: 'binary', name: null, operator: '-' }),
			];
			const result = filterSteps(steps, {
				filter: { operatorsList: ['+'] },
			});

			expect(result).toHaveLength(1);
			expect(result[0].operator).toBe('+');
		});

		it('filters controlFlow by controlFlowList using check name', () => {
			const steps = [
				step({ step: 1, operation: 'check', name: 'if', modifier: 'truthy' }),
				step({
					step: 2,
					operation: 'check',
					name: 'while',
					modifier: 'truthy',
				}),
			];
			const result = filterSteps(steps, {
				filter: { controlFlowList: ['if'] },
			});

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('if');
		});

		it('controlFlowList does not filter break/continue steps', () => {
			const steps = [
				step({ step: 1, operation: 'break', name: null }),
				step({ step: 2, operation: 'continue', name: 'outer' }),
			];
			const result = filterSteps(steps, {
				filter: { controlFlowList: ['if'] },
			});

			expect(result).toHaveLength(2);
		});

		it('filters controlFlow list also matches catch/throw by operation', () => {
			const steps = [
				step({ step: 1, operation: 'catch', name: null }),
				step({ step: 2, operation: 'throw', name: null }),
			];
			const result = filterSteps(steps, {
				filter: { controlFlowList: ['catch'] },
			});

			expect(result).toHaveLength(1);
			expect(result[0].operation).toBe('catch');
		});
	});

	// ---------------------------------------------------------------------------
	// Name whitelist filter
	// ---------------------------------------------------------------------------

	describe('name whitelist filter', () => {
		it('keeps only whitelisted names', () => {
			const steps = [
				step({ step: 1, operation: 'read', name: 'x' }),
				step({ step: 2, operation: 'read', name: 'y' }),
				step({ step: 3, operation: 'call', name: 'add' }),
			];
			const result = filterSteps(steps, {
				filter: { names: ['x', 'add'] },
			});

			expect(result).toHaveLength(2);
			expect(result[0].name).toBe('x');
			expect(result[1].name).toBe('add');
		});

		it('empty names array keeps everything', () => {
			const steps = [
				step({ step: 1, operation: 'read', name: 'x' }),
				step({ step: 2, operation: 'read', name: 'y' }),
			];
			const result = filterSteps(steps, {
				filter: { names: [] },
			});

			expect(result).toHaveLength(2);
		});

		it('filters across categories (variables, calls, checks)', () => {
			const steps = [
				step({ step: 1, operation: 'read', name: 'x' }),
				step({ step: 2, operation: 'call', name: 'add' }),
				step({ step: 3, operation: 'check', name: 'if', modifier: 'truthy' }),
				step({ step: 4, operation: 'read', name: 'y' }),
				step({ step: 5, operation: 'call', name: 'remove' }),
			];
			const result = filterSteps(steps, {
				filter: { names: ['x', 'add', 'if'] },
			});

			expect(result).toHaveLength(3);
			expect(result[0].name).toBe('x');
			expect(result[1].name).toBe('add');
			expect(result[2].name).toBe('if');
		});

		it('nameless steps always pass name filter', () => {
			const steps = [
				step({ step: 1, operation: 'binary', name: null, operator: '+' }),
			];
			const result = filterSteps(steps, {
				filter: { names: ['x'] },
			});

			expect(result).toHaveLength(1);
		});
	});

	// ---------------------------------------------------------------------------
	// Range filter
	// ---------------------------------------------------------------------------

	describe('range filter', () => {
		it('filters steps outside the line range', () => {
			const steps = [
				step({ step: 1, loc: loc(1), operation: 'read', name: 'a' }),
				step({ step: 2, loc: loc(5), operation: 'read', name: 'b' }),
				step({ step: 3, loc: loc(10), operation: 'read', name: 'c' }),
			];
			const result = filterSteps(steps, { range: { start: 3, end: 7 } });

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('b');
		});

		it('steps with default loc (line 0) pass range filter', () => {
			const defaultLoc = {
				start: { line: 0, column: 0 },
				end: { line: 0, column: 0 },
			};
			const steps = [
				step({ step: 1, loc: defaultLoc, operation: 'evaluate', name: null }),
			];
			const result = filterSteps(steps, { range: { start: 5, end: 10 } });

			expect(result).toHaveLength(1);
		});
	});

	// ---------------------------------------------------------------------------
	// Data field stripping
	// ---------------------------------------------------------------------------

	describe('data field stripping', () => {
		it('strips loc when data.loc is false', () => {
			const steps = [step({ step: 1 })];
			const result = filterSteps(steps, { data: { loc: false } });

			expect(result[0]).not.toHaveProperty('loc');
		});

		it('strips values when data.values is false', () => {
			const steps = [step({ step: 1, values: [1, 2, 3] })];
			const result = filterSteps(steps, { data: { values: false } });

			expect(result[0]).not.toHaveProperty('values');
		});

		it('strips result when data.values is false', () => {
			const binaryStep = {
				...step({
					step: 1,
					operation: 'binary',
					operator: '+',
					name: null,
					values: [3, 4],
				}),
				result: 7,
			};
			const result = filterSteps([binaryStep], { data: { values: false } });

			expect(result[0]).not.toHaveProperty('values');
			expect(result[0]).not.toHaveProperty('result');
		});

		it('keeps result when data.values is true', () => {
			const binaryStep = {
				...step({
					step: 1,
					operation: 'binary',
					operator: '+',
					name: null,
					values: [3, 4],
				}),
				result: 7,
			};
			const result = filterSteps([binaryStep], {});

			expect(result[0].values).toEqual([3, 4]);
			expect((result[0] as AranStep & { result: unknown }).result).toBe(7);
		});

		it('strips nodeType when data.nodeType is false', () => {
			const steps = [step({ step: 1, nodeType: 'Identifier' })];
			const result = filterSteps(steps, { data: { nodeType: false } });

			expect(result[0]).not.toHaveProperty('nodeType');
		});

		it('strips depth and scopeType when data.depth is false', () => {
			const steps = [step({ step: 1, depth: 2, scopeType: 'call' })];
			const result = filterSteps(steps, { data: { depth: false } });

			expect(result[0]).not.toHaveProperty('depth');
			expect(result[0]).not.toHaveProperty('scopeType');
		});

		it('keeps all fields when data config is all true', () => {
			const steps = [step({ step: 1 })];
			const result = filterSteps(steps, {});

			expect(result[0]).toHaveProperty('loc');
			expect(result[0]).toHaveProperty('values');
			expect(result[0]).toHaveProperty('nodeType');
			expect(result[0]).toHaveProperty('depth');
		});
	});

	// ---------------------------------------------------------------------------
	// Re-numbering
	// ---------------------------------------------------------------------------

	describe('re-numbering', () => {
		it('re-numbers steps to 1-indexed after filtering', () => {
			const steps = [
				step({ step: 1, operation: 'read', name: 'x' }),
				step({ step: 2, operation: 'binary', name: null, operator: '+' }),
				step({ step: 3, operation: 'read', name: 'y' }),
			];
			const result = filterSteps(steps, { operators: false });

			expect(result).toHaveLength(2);
			expect(result[0].step).toBe(1);
			expect(result[1].step).toBe(2);
		});
	});

	// ---------------------------------------------------------------------------
	// Combined filters
	// ---------------------------------------------------------------------------

	describe('combined filters', () => {
		it('applies category + name filter + range together', () => {
			const steps = [
				step({ step: 1, operation: 'read', name: 'x', loc: loc(1) }),
				step({ step: 2, operation: 'read', name: 'y', loc: loc(2) }),
				step({ step: 3, operation: 'read', name: 'x', loc: loc(5) }),
				step({
					step: 4,
					operation: 'binary',
					name: null,
					operator: '+',
					loc: loc(2),
				}),
			];
			const result = filterSteps(steps, {
				operators: false,
				filter: { names: ['x'] },
				range: { start: 1, end: 3 },
			});

			// step 1: read x at line 1 → passes all
			// step 2: read y at line 2 → fails names whitelist
			// step 3: read x at line 5 → fails range
			// step 4: binary at line 2 → fails category (nameless, passes name filter)
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('x');
			expect(result[0].step).toBe(1);
		});
	});

	// ---------------------------------------------------------------------------
	// Empty input / default behavior
	// ---------------------------------------------------------------------------

	describe('edge cases', () => {
		it('returns empty array for empty input', () => {
			const result = filterSteps([], {});

			expect(result).toHaveLength(0);
		});

		it('returns all steps when no options provided', () => {
			const steps = [
				step({ step: 1, operation: 'read', name: 'x' }),
				step({ step: 2, operation: 'binary', name: null, operator: '+' }),
				step({ step: 3, operation: 'call', name: 'foo' }),
			];
			const result = filterSteps(steps);

			expect(result).toHaveLength(3);
		});
	});
});
