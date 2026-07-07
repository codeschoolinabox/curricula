import { describe, expect, it } from 'vitest';

import spliceLoopGuards from '../splice-loop-guards.js';
import type { MakeGuard, MakeReset } from '../types.js';

const makeGuard: MakeGuard = (index, loc) =>
	`G${index}[${loc.start.line}:${loc.start.column}:${loc.end.line}:${loc.end.column}]`;
const makeReset: MakeReset = (index) => `R${index}`;
const hooks = { makeGuard, makeReset };

describe('spliceLoopGuards', () => {
	describe('no loops', () => {
		it('returns the input code unchanged', () => {
			const code = 'let x = 5;\n';
			expect(spliceLoopGuards(code, hooks).code).toBe(code);
		});

		it('reports zero guarded loops', () => {
			expect(spliceLoopGuards('let x = 5;\n', hooks).loopCount).toBe(0);
		});

		it('returns a frozen result', () => {
			expect(Object.isFrozen(spliceLoopGuards('let x = 5;\n', hooks))).toBe(
				true,
			);
		});
	});

	describe('single while loop', () => {
		it('splices guard after the opening brace and reset after the closing brace', () => {
			const result = spliceLoopGuards('while (x < 10) {\n\tx++;\n}\n', hooks);
			expect(result.code).toBe('while (x < 10) {G1[1:0:3:1]\n\tx++;\n}R1\n');
		});

		it('guards an empty-bodied while loop at the tightest brace adjacency', () => {
			const result = spliceLoopGuards('while (x) {}\n', hooks);
			expect(result.code).toBe('while (x) {G1[1:0:1:12]}R1\n');
		});

		it('guards a labeled while loop at the loop-keyword span', () => {
			const result = spliceLoopGuards(
				'outer: while (x < 10) {\n\tx++;\n}\n',
				hooks,
			);
			expect(result.code).toBe(
				'outer: while (x < 10) {G1[1:7:3:1]\n\tx++;\n}R1\n',
			);
		});

		it('counts the one guarded loop', () => {
			const result = spliceLoopGuards('while (x < 10) {\n\tx++;\n}\n', hooks);
			expect(result.loopCount).toBe(1);
		});

		it('returns a frozen result when a loop was guarded', () => {
			const result = spliceLoopGuards('while (x < 10) {\n\tx++;\n}\n', hooks);
			expect(Object.isFrozen(result)).toBe(true);
		});
	});

	describe('classic for loop', () => {
		it('guards a counting for loop', () => {
			const result = spliceLoopGuards(
				'for (let i = 0; i < 10; i++) {\n\tsum += i;\n}\n',
				hooks,
			);
			expect(result.code).toBe(
				'for (let i = 0; i < 10; i++) {G1[1:0:3:1]\n\tsum += i;\n}R1\n',
			);
		});

		it('guards an empty-header for loop', () => {
			const result = spliceLoopGuards('for (;;) {\n\tbreak;\n}\n', hooks);
			expect(result.code).toBe('for (;;) {G1[1:0:3:1]\n\tbreak;\n}R1\n');
		});
	});

	describe('for-of loop', () => {
		it('guards a declaration-target for-of loop', () => {
			const result = spliceLoopGuards(
				'for (const item of items) {\n\tuse(item);\n}\n',
				hooks,
			);
			expect(result.code).toBe(
				'for (const item of items) {G1[1:0:3:1]\n\tuse(item);\n}R1\n',
			);
		});

		it('guards a destructuring for-of loop', () => {
			const result = spliceLoopGuards(
				'for (const [k, v] of entries) {\n\tuse(k);\n}\n',
				hooks,
			);
			expect(result.code).toBe(
				'for (const [k, v] of entries) {G1[1:0:3:1]\n\tuse(k);\n}R1\n',
			);
		});

		it('guards an expression-target for-of loop', () => {
			const result = spliceLoopGuards('for (x of xs) {\n\tuse(x);\n}\n', hooks);
			expect(result.code).toBe('for (x of xs) {G1[1:0:3:1]\n\tuse(x);\n}R1\n');
		});
	});

	describe('sibling loops', () => {
		it('numbers siblings in reading order with dense ids', () => {
			const result = spliceLoopGuards(
				'while (a) {\n\ta--;\n}\nwhile (b) {\n\tb--;\n}\n',
				hooks,
			);
			expect(result.code).toBe(
				'while (a) {G1[1:0:3:1]\n\ta--;\n}R1\nwhile (b) {G2[4:0:6:1]\n\tb--;\n}R2\n',
			);
		});

		it('counts both sibling loops', () => {
			const result = spliceLoopGuards(
				'while (a) {\n\ta--;\n}\nwhile (b) {\n\tb--;\n}\n',
				hooks,
			);
			expect(result.loopCount).toBe(2);
		});
	});

	describe('nested loops', () => {
		it('numbers the outer loop before the inner loop', () => {
			const result = spliceLoopGuards(
				'while (a) {\n\twhile (b) {\n\t\tb--;\n\t}\n\ta--;\n}\n',
				hooks,
			);
			expect(result.code).toBe(
				'while (a) {G1[1:0:6:1]\n\twhile (b) {G2[2:1:4:2]\n\t\tb--;\n\t}R2\n\ta--;\n}R1\n',
			);
		});

		it('applies adjacent nested insertions without corruption', () => {
			const result = spliceLoopGuards(
				'while (a) {\n\twhile (b) {}\n}\n',
				hooks,
			);
			expect(result.code).toBe(
				'while (a) {G1[1:0:3:1]\n\twhile (b) {G2[2:1:2:13]}R2\n}R1\n',
			);
		});

		it('places an inner do-while reset before the outer body close', () => {
			const result = spliceLoopGuards(
				'while (a) {\n\tdo {\n\t\tb--;\n\t} while (b > 0);\n}\n',
				hooks,
			);
			expect(result.code).toBe(
				'while (a) {G1[1:0:5:1]\n\tdo {G2[2:1:4:17]\n\t\tb--;\n\t} while (b > 0);;R2\n}R1\n',
			);
		});
	});

	describe('do-while loop', () => {
		it('resets after the full statement with a leading semicolon (explicit ;)', () => {
			const result = spliceLoopGuards(
				'do {\n\tx--;\n} while (x > 0);\n',
				hooks,
			);
			expect(result.code).toBe(
				'do {G1[1:0:3:16]\n\tx--;\n} while (x > 0);;R1\n',
			);
		});

		it('self-terminates the reset when the do-while relied on ASI (no ;)', () => {
			const result = spliceLoopGuards('do {\n\tx--;\n} while (x > 0)\n', hooks);
			expect(result.code).toBe(
				'do {G1[1:0:3:15]\n\tx--;\n} while (x > 0);R1\n',
			);
		});

		it('spans the loop-statement, not the body block, in the guard loc', () => {
			const result = spliceLoopGuards(
				'do {\n\tx--;\n} while (x > 0);\n',
				hooks,
			);
			expect(result.code).toContain('G1[1:0:3:16]');
		});

		it('counts the one guarded do-while loop', () => {
			const result = spliceLoopGuards(
				'do {\n\tx--;\n} while (x > 0);\n',
				hooks,
			);
			expect(result.loopCount).toBe(1);
		});
	});

	describe('for-in loops (not guarded)', () => {
		it('leaves a for-in loop untouched', () => {
			const code = 'for (const k in obj) {\n\tuse(k);\n}\n';
			expect(spliceLoopGuards(code, hooks).code).toBe(code);
		});

		it('does not count a for-in loop', () => {
			const code = 'for (const k in obj) {\n\tuse(k);\n}\n';
			expect(spliceLoopGuards(code, hooks).loopCount).toBe(0);
		});
	});

	describe('brace-less loops (not guarded)', () => {
		it('leaves a brace-less while untouched', () => {
			const code = 'while (x) x--;\n';
			expect(spliceLoopGuards(code, hooks).code).toBe(code);
		});

		it('leaves a brace-less do-while untouched', () => {
			const code = 'do x--; while (x > 0);\n';
			expect(spliceLoopGuards(code, hooks).code).toBe(code);
		});

		it('guards only the braced loop in a mixed pair', () => {
			const result = spliceLoopGuards(
				'while (a) { a--; }\nwhile (b) b--;\n',
				hooks,
			);
			expect(result.code).toBe(
				'while (a) {G1[1:0:1:18] a--; }R1\nwhile (b) b--;\n',
			);
		});
	});

	describe('with-wrapped loops (script-mode fallback)', () => {
		it('guards a loop inside a with statement', () => {
			const result = spliceLoopGuards(
				'with (o) {\n\twhile (o.x > 0) {\n\t\to.x--;\n\t}\n}\n',
				hooks,
			);
			expect(result.code).toBe(
				'with (o) {\n\twhile (o.x > 0) {G1[2:1:4:2]\n\t\to.x--;\n\t}R1\n}\n',
			);
		});
	});

	describe('line preservation', () => {
		it('preserves the exact line count across multiple loops', () => {
			const code =
				'let x = 0;\nwhile (a) {\n\tx++;\n}\nfor (const y of ys) {\n\tuse(y);\n}\nlog(x);\n';
			const result = spliceLoopGuards(code, hooks);
			expect(result.code.split('\n').length).toBe(code.split('\n').length);
		});

		it('leaves lines outside any loop byte-identical', () => {
			const code = 'let x = 0;\nwhile (a) {\n\tx++;\n}\nlog(x);\n';
			const result = spliceLoopGuards(code, hooks);
			expect(result.code.split('\n')[0]).toBe('let x = 0;');
		});
	});

	describe('boundary failures', () => {
		it('throws when the guard text contains a newline', () => {
			expect(() =>
				spliceLoopGuards('while (x) {\n\tx++;\n}\n', {
					makeGuard: () => 'G\n1',
					makeReset,
				}),
			).toThrow(/single-line/);
		});

		it('throws when the reset text contains a paragraph separator', () => {
			expect(() =>
				spliceLoopGuards('while (x) {\n\tx++;\n}\n', {
					makeGuard,
					makeReset: () => 'R\u20291',
				}),
			).toThrow(/single-line/);
		});

		it('throws when the guard text contains a carriage return', () => {
			expect(() =>
				spliceLoopGuards('while (x) {\n\tx++;\n}\n', {
					makeGuard: () => 'G\r1',
					makeReset,
				}),
			).toThrow(/single-line/);
		});

		it('throws when the reset text contains a line separator', () => {
			expect(() =>
				spliceLoopGuards('while (x) {\n\tx++;\n}\n', {
					makeGuard,
					makeReset: () => 'R\u20281',
				}),
			).toThrow(/single-line/);
		});

		it('throws when the source parses as neither module nor script', () => {
			expect(() => spliceLoopGuards('while (', hooks)).toThrow(
				/could not parse/,
			);
		});
	});

	describe('loc value (loop-statement span)', () => {
		it('spans the loop keyword through the loop end, not the body block', () => {
			const result = spliceLoopGuards(
				'for (\n\tlet i = 0;\n\ti < 3;\n\ti++\n) {\n\tuse(i);\n}\n',
				hooks,
			);
			expect(result.code).toBe(
				'for (\n\tlet i = 0;\n\ti < 3;\n\ti++\n) {G1[1:0:7:1]\n\tuse(i);\n}R1\n',
			);
		});

		it('reports columns as 0-based characters, not tab-expanded widths', () => {
			const result = spliceLoopGuards(
				'\twhile (x < 10) {\n\t\tx++;\n\t}\n',
				hooks,
			);
			expect(result.code).toBe(
				'\twhile (x < 10) {G1[1:1:3:2]\n\t\tx++;\n\t}R1\n',
			);
		});
	});

	describe('golden parity with the oracle (executable)', () => {
		function runGuardedIterations(
			loopSource: string,
			maxIterations: number,
		): number {
			const oracleHooks = {
				makeGuard: (index: number) =>
					`if (++loop${index} > ${maxIterations}) throw new RangeError("Loop ${index} exceeded ${maxIterations} iterations.");`,
				makeReset: (index: number) => `loop${index} = 0;`,
			};
			const { code, loopCount } = spliceLoopGuards(loopSource, oracleHooks);
			const declarations = Array.from(
				{ length: loopCount },
				(_, slot) => `loop${slot + 1} = 0`,
			).join(', ');
			// eslint-disable-next-line @typescript-eslint/no-implied-eval, sonarjs/code-eval -- executing the guarded output verifies acorn-splice parity with the recast oracle
			const evaluate = new Function(
				`var ${declarations}; let count = 0; try { ${code} } catch {} return count;`,
			);
			return evaluate() as number;
		}

		it.each([
			[-1, 0],
			[0, 0],
			[1, 1],
			[3, 3],
		])('while loop runs the body %i times before max %i trips', (max, runs) => {
			expect(runGuardedIterations('while (true) {\n\tcount++;\n}\n', max)).toBe(
				runs,
			);
		});

		it.each([
			[-1, 0],
			[0, 0],
			[1, 1],
			[3, 3],
		])('for loop runs the body %i times before max %i trips', (max, runs) => {
			expect(
				runGuardedIterations(
					'for (let i = 0; i < 100; i++) {\n\tcount++;\n}\n',
					max,
				),
			).toBe(runs);
		});

		it.each([
			[-1, 0],
			[0, 0],
			[1, 1],
			[3, 3],
		])(
			'for-of loop runs the body %i times before max %i trips',
			(max, runs) => {
				expect(
					runGuardedIterations(
						'for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {\n\tcount++;\n}\n',
						max,
					),
				).toBe(runs);
			},
		);

		it.each([
			[-1, 0],
			[0, 0],
			[1, 1],
			[3, 3],
		])(
			'do-while (ASI) runs the body %i times before max %i trips',
			(max, runs) => {
				expect(
					runGuardedIterations('do {\n\tcount++;\n} while (true)\n', max),
				).toBe(runs);
			},
		);
	});
});
