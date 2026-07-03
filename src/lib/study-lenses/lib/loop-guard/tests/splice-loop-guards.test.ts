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
			expect(result.code).toBe('outer: while (x < 10) {G1[1:7:3:1]\n\tx++;\n}R1\n');
		});

		it('counts the one guarded loop', () => {
			const result = spliceLoopGuards('while (x < 10) {\n\tx++;\n}\n', hooks);
			expect(result.loopCount).toBe(1);
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
});
