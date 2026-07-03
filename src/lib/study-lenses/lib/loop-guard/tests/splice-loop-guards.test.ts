import { describe, expect, it } from 'vitest';

import spliceLoopGuards from '../splice-loop-guards.js';
import type { MakeGuard, MakeReset } from '../types.js';

const makeGuard: MakeGuard = (index, loc) =>
	`G${index}[${loc.start.line}:${loc.start.column}:${loc.end.line}:${loc.end.column}]`;
const makeReset: MakeReset = (index) => `R${index}`;
const hooks = { makeGuard, makeReset };

describe('spliceLoopGuards', () => {
	describe('no loops', () => {
		it('returns the input code by reference', () => {
			const code = 'let x = 5;\n';
			expect(spliceLoopGuards(code, hooks).code).toBe(code);
		});

		it('reports zero guarded loops', () => {
			expect(spliceLoopGuards('let x = 5;\n', hooks).loopCount).toBe(0);
		});
	});
});
