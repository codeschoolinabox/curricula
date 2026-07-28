/**
 * @file Behavior tests for the splice verb: exact call-text pins (statement
 * forms, loc-string encoding) through the verb — the factories are in-file
 * non-surface, so the verb is the only honest window onto them — plus
 * identity, one representative pass-through, and the loud parse failure.
 * Placement is loop-guard's, already pinned by its own gates; it is not
 * re-covered here. ZOMBIES order. The exceptions pin rides vitest's
 * asymmetric-matcher arm of `toThrow` (matched against the thrown value);
 * `objectContaining` types as `any`, so one `as Error` cast satisfies the
 * typed signature.
 */

import { describe, expect, it } from 'vitest';

import spliceIterationGuards from '../splice-iteration-guards.js';

describe('spliceIterationGuards', () => {
	describe('zero — no guarded loops', () => {
		it('returns loop-free source by reference', () => {
			const source = 'const x = 1;\nconsole.log(x);\n';

			expect(spliceIterationGuards(source).code).toBe(source);
		});

		it('reports zero loops on loop-free source', () => {
			expect(spliceIterationGuards('const x = 1;\n').loopCount).toBe(0);
		});
	});

	describe('one — a single while loop', () => {
		it('splices the guard call with the loop-statement span and the reset after the loop', () => {
			const source = 'while (x) {\n\tstep();\n}\n';

			expect(spliceIterationGuards(source).code).toBe(
				"while (x) {__$il(1, '1:0:3:1');\n\tstep();\n}__$ir(1);\n",
			);
		});

		it('counts the guarded loop', () => {
			expect(spliceIterationGuards('while (x) {\n\tstep();\n}\n').loopCount).toBe(
				1,
			);
		});
	});

	describe('many — nested loops in reading order', () => {
		it('assigns dense 1-based indices outer-first, each guard carrying its own loop span', () => {
			const source = 'while (a) {\n\tfor (const x of xs) {\n\t\tf(x);\n\t}\n}\n';

			expect(spliceIterationGuards(source).code).toBe(
				"while (a) {__$il(1, '1:0:5:1');\n\tfor (const x of xs) {__$il(2, '2:1:4:2');\n\t\tf(x);\n\t}__$ir(2);\n}__$ir(1);\n",
			);
		});

		it('counts both guarded loops', () => {
			const source = 'while (a) {\n\tfor (const x of xs) {\n\t\tf(x);\n\t}\n}\n';

			expect(spliceIterationGuards(source).loopCount).toBe(2);
		});
	});

	describe('boundaries — do-while reset text, unguarded pass-through', () => {
		it('rides the do-while full-statement reset without adding its own terminator', () => {
			const source = 'do {\n\tf();\n} while (x);\n';

			expect(spliceIterationGuards(source).code).toContain(
				'} while (x);;__$ir(1);',
			);
		});

		it('passes an unguarded shape through untouched and uncounted', () => {
			const source = 'for (const k in obj) {\n\tf(k);\n}\n';

			expect(spliceIterationGuards(source)).toEqual({
				code: source,
				loopCount: 0,
			});
		});
	});

	describe('interface — the pass-through result shape', () => {
		it('returns exactly the code and loopCount pair', () => {
			expect(
				Object.keys(spliceIterationGuards('while (x) {\n}\n')).toSorted((a, b) =>
					a.localeCompare(b),
				),
			).toEqual(['code', 'loopCount']);
		});
	});

	describe('exceptions — malformed source', () => {
		it('throws the typed loop-guard boundary failure with the parse-failed reason', () => {
			expect(() => spliceIterationGuards('let = ;')).toThrow(
				expect.objectContaining({
					loopGuardBoundary: true,
					reason: 'parse-failed',
				}) as Error,
			);
		});
	});
});
