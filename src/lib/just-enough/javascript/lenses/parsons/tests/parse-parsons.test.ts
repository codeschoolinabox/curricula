import { describe, expect, it } from 'vitest';

import {
	normalizeIndents,
	parseLines,
	parseParsons,
} from '../lib/parse-parsons.js';

describe('parse-parsons', () => {
	describe('normalizeIndents — raw leading-whitespace counts to relative levels', () => {
		describe('Zero / One', () => {
			it('returns [] for no lines', () => {
				expect(normalizeIndents([])).toEqual([]);
			});

			it('maps a single flush-left line to level 0', () => {
				expect(normalizeIndents([0])).toEqual([0]);
			});

			it('flags a single indented first line as -1 (IndentationError)', () => {
				expect(normalizeIndents([4])).toEqual([-1]);
			});
		});

		describe('Many — nesting in and out', () => {
			it('indent-in then back to a seen level: [0,2,2,0] -> [0,1,1,0]', () => {
				expect(normalizeIndents([0, 2, 2, 0])).toEqual([0, 1, 1, 0]);
			});

			it('two levels deep then dedent one: [0,2,4,2] -> [0,1,2,1]', () => {
				expect(normalizeIndents([0, 2, 4, 2])).toEqual([0, 1, 2, 1]);
			});

			it('dedent back to flush-left: [0,2,0] -> [0,1,0]', () => {
				expect(normalizeIndents([0, 2, 0])).toEqual([0, 1, 0]);
			});

			it('treats any same raw indent as the same level regardless of size', () => {
				// tabs vs spaces do not matter — only the relative structure.
				expect(normalizeIndents([0, 8, 8, 0])).toEqual([0, 1, 1, 0]);
			});
		});

		describe('Boundaries — unresolvable dedent is an IndentationError (-1)', () => {
			it('dedent to a level never seen yields -1', () => {
				expect(normalizeIndents([2, 0])).toEqual([-1, -1]);
			});

			it('mid-sequence dedent to an unseen raw level is -1, then recovers', () => {
				// 0 -> 4 -> 2 -> 0: raw 2 was never a prior line, so index 2 is
				// -1 (IndentationError); index 3 (raw 0) recovers via the level of
				// the earlier raw-0 line. Defends against a wrong
				// "rank by sorted distinct raw values" implementation.
				expect(normalizeIndents([0, 4, 2, 0])).toEqual([0, 1, -1, 0]);
			});
		});
	});

	describe('parseLines — split into solution + distractors (pure)', () => {
		describe('Zero — empty / blank-only', () => {
			it('returns empty arrays for empty source', () => {
				expect(parseLines('')).toEqual({ solution: [], distractors: [] });
			});

			it('drops blank / whitespace-only lines', () => {
				expect(parseLines('\n   \n\t\n')).toEqual({
					solution: [],
					distractors: [],
				});
			});
		});

		describe('One', () => {
			it('parses a single solution line at level 0', () => {
				expect(parseLines('let x = 1;')).toEqual({
					solution: [
						{ id: 'line-0', code: 'let x = 1;', indent: 0, distractor: false },
					],
					distractors: [],
				});
			});

			it('parses a single distractor (marker stripped, indent -1)', () => {
				expect(parseLines('foo(); // distractor')).toEqual({
					solution: [],
					distractors: [
						{ id: 'line-0', code: 'foo();', indent: -1, distractor: true },
					],
				});
			});
		});

		describe('Many — interleaved, indented, mixed', () => {
			it('splits solution and distractor lines, preserving source-order ids', () => {
				const result = parseLines('a();\nb(); // distractor\nc();');
				expect(result.solution).toEqual([
					{ id: 'line-0', code: 'a();', indent: 0, distractor: false },
					{ id: 'line-2', code: 'c();', indent: 0, distractor: false },
				]);
				expect(result.distractors).toEqual([
					{ id: 'line-1', code: 'b();', indent: -1, distractor: true },
				]);
			});

			it('normalizes nested-block indentation to relative levels', () => {
				const result = parseLines(
					'function f() {\n\treturn 1;\n}',
				);
				expect(result.solution.map((l) => l.indent)).toEqual([0, 1, 0]);
				expect(result.solution.map((l) => l.code)).toEqual([
					'function f() {',
					'return 1;',
					'}',
				]);
			});
		});

		describe('Boundaries — marker + trim variants', () => {
			it('accepts the no-space marker //distractor', () => {
				const result = parseLines('bar(); //distractor');
				expect(result.distractors[0]?.code).toBe('bar();');
				expect(result.distractors[0]?.distractor).toBe(true);
			});

			it('strips the marker and trims surrounding whitespace', () => {
				const result = parseLines('   gum();   // distractor   ');
				expect(result.distractors[0]?.code).toBe('gum();');
			});

			it('does not treat a mid-line "distractor" word as the marker', () => {
				// only a trailing // distractor comment marks a distractor.
				const result = parseLines('const distractor = 1;');
				expect(result.solution).toHaveLength(1);
				expect(result.distractors).toHaveLength(0);
			});

			it('drops a line that is only the marker (empty code after strip)', () => {
				expect(parseLines('// distractor')).toEqual({
					solution: [],
					distractors: [],
				});
			});

			it('ids skip blank lines (a blank between lines consumes no id)', () => {
				const result = parseLines('a();\n\nc();');
				expect(result.solution.map((l) => l.id)).toEqual(['line-0', 'line-1']);
			});

			it('strips trailing CR on CRLF source so code has no \\r', () => {
				const result = parseLines('a();\r\nb(); // distractor\r\nc();');
				expect(result.solution.map((l) => l.code)).toEqual(['a();', 'c();']);
				expect(result.distractors[0]?.code).toBe('b();');
			});

			it('an indented first solution line gets indent -1 (IndentationError sentinel)', () => {
				const result = parseLines('  return x;');
				expect(result.solution).toEqual([
					{ id: 'line-0', code: 'return x;', indent: -1, distractor: false },
				]);
			});
		});
	});

	describe('parseParsons — selection + shuffle (injectable random)', () => {
		const SRC =
			'a();\nb();\nc();\nx(); // distractor\ny(); // distractor\nz(); // distractor';

		it('selects min(maxDistractors, declared) distractors', () => {
			const result = parseParsons(SRC, 2, () => 0);
			// 3 declared, cap 2 -> 2 selected; 3 solution lines.
			expect(result.solution).toHaveLength(3);
			expect(result.distractors).toHaveLength(2);
		});

		it('caps at the declared count when maxDistractors exceeds it (no undefined)', () => {
			const result = parseParsons(SRC, 10, () => 0);
			expect(result.distractors).toHaveLength(3);
			// the declined legacy bug pushed `undefined` past the end:
			expect(result.distractors.every((d) => d !== undefined)).toBe(true);
		});

		it('handles zero declared distractors (no crash, pool is the solution)', () => {
			const result = parseParsons('a();\nb();\nc();', 10, () => 0);
			expect(result.distractors).toHaveLength(0);
			expect(result.pool).toHaveLength(3);
		});

		it('clamps a negative maxDistractors to zero', () => {
			const result = parseParsons(SRC, -1, () => 0);
			expect(result.distractors).toHaveLength(0);
		});

		it('actually shuffles the pool (deterministic order under a fixed RNG)', () => {
			// Standard Fisher-Yates with random()=0 swaps each i down with index 0.
			// Pool ['line-0','line-1','line-2']: i=2 swap(2,0)->[2,1,0];
			// i=1 swap(1,0)->[1,2,0]. A no-op shuffle would leave source order,
			// so this pins that the shuffle runs.
			const result = parseParsons('a();\nb();\nc();', 0, () => 0);
			expect(result.pool).toEqual(['line-1', 'line-2', 'line-0']);
		});

		it('suppresses distractors entirely when maxDistractors is 0', () => {
			const result = parseParsons(SRC, 0, () => 0);
			expect(result.distractors).toHaveLength(0);
			// pool is exactly the 3 solution ids.
			expect([...result.pool].sort()).toEqual(['line-0', 'line-1', 'line-2']);
		});

		it('pool is a permutation of the solution + selected-distractor ids', () => {
			const result = parseParsons(SRC, 2, () => 0);
			const expectedIds = [
				...result.solution.map((l) => l.id),
				...result.distractors.map((l) => l.id),
			].sort();
			expect([...result.pool].sort()).toEqual(expectedIds);
			expect(result.pool).toHaveLength(5);
		});

		it('selected distractors are a subset of the declared distractors', () => {
			const declaredIds = parseLines(SRC).distractors.map((l) => l.id);
			const result = parseParsons(SRC, 2, () => 0);
			for (const d of result.distractors) {
				expect(declaredIds).toContain(d.id);
			}
		});

		it('leaves the solution lines (order + content) untouched by random', () => {
			const a = parseParsons(SRC, 3, () => 0);
			const b = parseParsons(SRC, 3, () => 0.999);
			expect(a.solution).toEqual(b.solution);
		});
	});
});
