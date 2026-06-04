import { describe, expect, it } from 'vitest';

import guardLoops from '../guard-loops.js';

const MAX = 100;

describe('guardLoops', () => {
	describe('no loops', () => {
		it('returns original code unchanged', () => {
			const code = 'let x = 5;\n';
			const result = guardLoops(code, MAX);
			expect(result.code).toBe(code);
		});

		it('returns loopCount 0', () => {
			const result = guardLoops('let x = 5;\n', MAX);
			expect(result.loopCount).toBe(0);
		});
	});

	describe('single while loop', () => {
		it('injects guard check after opening brace', () => {
			const code = 'while (x < 10) {\n\tx++;\n}\n';
			const result = guardLoops(code, MAX);
			expect(result.code).toContain(
				`{ if (++loop1 > ${MAX}) throw new RangeError`,
			);
		});

		it('injects counter reset after closing brace', () => {
			const code = 'while (x < 10) {\n\tx++;\n}\n';
			const result = guardLoops(code, MAX);
			expect(result.code).toContain('} loop1 = 0;');
		});

		it('preserves original condition unchanged', () => {
			const code = 'while (x < 10) {\n\tx++;\n}\n';
			const result = guardLoops(code, MAX);
			// Condition is not modified — no comma operator, no prefix
			expect(result.code).toContain('while (x < 10) {');
		});

		it('returns loopCount 1', () => {
			const code = 'while (x < 10) {\n\tx++;\n}\n';
			const result = guardLoops(code, MAX);
			expect(result.loopCount).toBe(1);
		});

		it('does not shift line numbers', () => {
			const code = 'let x = 0;\nwhile (x < 10) {\n\tx++;\n}\nconsole.log(x);\n';
			const result = guardLoops(code, MAX);
			const lines = result.code.split('\n');
			// Line 1: let x = 0;
			expect(lines[0]).toBe('let x = 0;');
			// Line 2: while (...)  — still on line 2
			expect(lines[1]).toMatch(/^while/);
			// Line 4: console.log(x); — still on same line number
			expect(lines[4]).toMatch(/console\.log\(x\)/);
		});

		it('does not shift condition column', () => {
			const code = 'while (x < 10) {\n\tx++;\n}\n';
			const result = guardLoops(code, MAX);
			// The while line starts with the original text — condition
			// column is unchanged because guard is injected AFTER the {
			const whileLine = result.code.split('\n')[0];
			expect(whileLine).toMatch(/^while \(x < 10\) \{/);
		});
	});

	describe('multiple loops', () => {
		it('numbers loops in reading order', () => {
			const code = 'while (a) {\n\ta++;\n}\nwhile (b) {\n\tb++;\n}\n';
			const result = guardLoops(code, MAX);
			expect(result.code).toContain('++loop1');
			expect(result.code).toContain('++loop2');
		});

		it('returns correct loopCount', () => {
			const code = 'while (a) {\n\ta++;\n}\nwhile (b) {\n\tb++;\n}\n';
			const result = guardLoops(code, MAX);
			expect(result.loopCount).toBe(2);
		});

		it('outer loop gets lower number than inner', () => {
			const code = 'while (a) {\n\twhile (b) {\n\t\tb++;\n\t}\n\ta++;\n}\n';
			const result = guardLoops(code, MAX);
			const firstGuard = result.code.indexOf('++loop1');
			const secondGuard = result.code.indexOf('++loop2');
			expect(firstGuard).toBeLessThan(secondGuard);
		});
	});

	describe('for-of coverage', () => {
		describe('single for-of', () => {
			it('injects guard after opening brace', () => {
				const code = 'for (const item of items) {\n\tconsole.log(item);\n}\n';
				const result = guardLoops(code, MAX);
				expect(result.code).toContain(
					`{ if (++loop1 > ${MAX}) throw new RangeError`,
				);
			});

			it('injects counter reset after closing brace', () => {
				const code = 'for (const item of items) {\n\tconsole.log(item);\n}\n';
				const result = guardLoops(code, MAX);
				expect(result.code).toContain('} loop1 = 0;');
			});

			it('returns loopCount 1', () => {
				const code = 'for (const item of items) {\n\tconsole.log(item);\n}\n';
				const result = guardLoops(code, MAX);
				expect(result.loopCount).toBe(1);
			});

			it('preserves original for-of header unchanged', () => {
				const code = 'for (const item of items) {\n\tconsole.log(item);\n}\n';
				const result = guardLoops(code, MAX);
				expect(result.code).toContain('for (const item of items) {');
			});

			it('handles destructuring head', () => {
				const code = 'for (const [k, v] of entries) {\n\tlog(k, v);\n}\n';
				const result = guardLoops(code, MAX);
				expect(result.code).toContain('++loop1');
				expect(result.loopCount).toBe(1);
			});
		});

		describe('runtime behavior (Task B contract)', () => {
			it.each([
				[-1, []],
				[0, []],
				[1, [1]],
				[3, [1, 2, 3]],
			])(
				'maxIterations = %i runs for-of body %p times before throwing',
				(max, expected) => {
					const executed: number[] = [];
					// Long iterable. The guard fires based on iteration count,
					// not iterable length — defensive coverage's whole point.
					const items = Array.from({ length: 1000 }, (_, i) => i);
					const code = 'for (const n of items) { executed.push(loop1); }\n';
					const result = guardLoops(code, max);
					// eslint-disable-next-line no-new-func
					const fn = new Function('loop1', 'items', 'executed', result.code);
					expect(() => fn(0, items, executed)).toThrow(RangeError);
					expect(executed).toEqual(expected);
				},
			);
		});
	});

	describe('guard execution behavior', () => {
		it('guarded code executes correctly with loopN parameters', () => {
			const code = 'while (x < 3) {\n\tx++;\n}\n';
			const result = guardLoops(code, MAX);

			// Pass loop1 as a parameter initialized to 0
			// eslint-disable-next-line no-new-func
			const fn = new Function('loop1', 'x', result.code + '\nreturn x;');
			const finalX = fn(0, 0);
			expect(finalX).toBe(3);
		});

		it('guard throws RangeError on infinite loop', () => {
			const code = 'while (true) {\n\tx++;\n}\n';
			const result = guardLoops(code, 5);

			// eslint-disable-next-line no-new-func
			const fn = new Function('loop1', 'x', result.code);
			expect(() => fn(0, 0)).toThrow(RangeError);
			expect(() => fn(0, 0)).toThrow(/Loop 1 exceeded 5 iterations/);
		});

		it('bakes maxIterations into the code', () => {
			const code = 'while (true) {\n\tx++;\n}\n';
			const result = guardLoops(code, 42);
			expect(result.code).toContain('> 42)');
			expect(result.code).toContain('exceeded 42 iterations');
		});
	});

	describe('counter reset', () => {
		it('resets counter after closing brace', () => {
			const code = 'while (x < 3) {\n\tx++;\n}\n';
			const result = guardLoops(code, MAX);
			expect(result.code).toContain('} loop1 = 0;');
		});

		it('nested inner loop resets between outer iterations', () => {
			// Outer runs 2 times, inner runs 3 times per outer = 6 total
			// With limit of 5, this should NOT throw because the reset
			// brings the inner counter back to 0 each outer iteration
			const code = [
				'while (outerCount < 2) {',
				'\tlet innerCount = 0;',
				'\twhile (innerCount < 3) {',
				'\t\tinnerCount++;',
				'\t}',
				'\touterCount++;',
				'}',
				'',
			].join('\n');
			const result = guardLoops(code, 5);

			// eslint-disable-next-line no-new-func
			const fn = new Function(
				'loop1',
				'loop2',
				'outerCount',
				result.code + '\nreturn outerCount;',
			);
			// Should complete without throwing — inner resets each outer iteration
			expect(fn(0, 0, 0)).toBe(2);
		});
	});

	describe('iteration threshold edge cases', () => {
		// Template shape per maxIterations — one assertion per value.
		it.each([
			[-1, 'if (++loop1 > -1)'],
			[0, 'if (++loop1 > 0)'],
			[1, 'if (++loop1 > 1)'],
			[100, 'if (++loop1 > 100)'],
		])('maxIterations = %i → template contains %p', (max, expected) => {
			const result = guardLoops('while (true) {\n\tx++;\n}\n', max);
			expect(result.code).toContain(expected);
		});

		// Runtime behavior — triangulated. A stub that always throws (or
		// never throws) cannot produce all four {max → executed} pairs.
		it.each([
			[-1, []],
			[0, []],
			[1, [1]],
			[3, [1, 2, 3]],
		])(
			'maxIterations = %i runs body %p times before throwing',
			(max, expected) => {
				const executed: number[] = [];
				const code = 'while (true) { executed.push(loop1); }\n';
				const result = guardLoops(code, max);
				// eslint-disable-next-line no-new-func
				const fn = new Function('loop1', 'executed', result.code);
				expect(() => fn(0, executed)).toThrow(RangeError);
				expect(executed).toEqual(expected);
			},
		);
	});

	describe('for-loop coverage', () => {
		describe('single for loop', () => {
			it('injects guard after opening brace', () => {
				const code = 'for (let i = 0; i < 10; i++) {\n\ttotal += i;\n}\n';
				const result = guardLoops(code, MAX);
				expect(result.code).toContain(
					`{ if (++loop1 > ${MAX}) throw new RangeError`,
				);
			});

			it('injects counter reset after closing brace', () => {
				const code = 'for (let i = 0; i < 10; i++) {\n\ttotal += i;\n}\n';
				const result = guardLoops(code, MAX);
				expect(result.code).toContain('} loop1 = 0;');
			});

			it('returns loopCount 1', () => {
				const code = 'for (let i = 0; i < 10; i++) {\n\ttotal += i;\n}\n';
				const result = guardLoops(code, MAX);
				expect(result.loopCount).toBe(1);
			});

			it('preserves original for-header unchanged', () => {
				const code = 'for (let i = 0; i < 10; i++) {\n\ttotal += i;\n}\n';
				const result = guardLoops(code, MAX);
				expect(result.code).toContain('for (let i = 0; i < 10; i++) {');
			});

			it('does not shift line numbers', () => {
				const code =
					'let total = 0;\nfor (let i = 0; i < 5; i++) {\n\ttotal += i;\n}\nconsole.log(total);\n';
				const result = guardLoops(code, MAX);
				const lines = result.code.split('\n');
				expect(lines[0]).toBe('let total = 0;');
				expect(lines[1]).toMatch(/^for/);
				expect(lines[4]).toMatch(/console\.log\(total\)/);
			});
		});

		describe('mixed while + for', () => {
			it('numbers in reading order across loop types', () => {
				const code =
					'while (a) {\n\ta++;\n}\nfor (let i = 0; i < 3; i++) {\n\ti++;\n}\n';
				const result = guardLoops(code, MAX);
				const firstWhileGuard = result.code.indexOf('++loop1');
				const secondForGuard = result.code.indexOf('++loop2');
				expect(firstWhileGuard).toBeLessThan(secondForGuard);
				expect(result.loopCount).toBe(2);
			});

			it('for inside while gets higher ID', () => {
				const code =
					'while (a) {\n\tfor (let i = 0; i < 3; i++) {\n\t\ti++;\n\t}\n}\n';
				const result = guardLoops(code, MAX);
				const whileGuard = result.code.indexOf('++loop1');
				const forGuard = result.code.indexOf('++loop2');
				expect(whileGuard).toBeLessThan(forGuard);
				expect(result.loopCount).toBe(2);
			});
		});

		describe('for-loop edge cases', () => {
			it('handles for without init', () => {
				const code = 'for (; i < 10; i++) {\n\ti++;\n}\n';
				const result = guardLoops(code, MAX);
				expect(result.code).toContain('++loop1');
				expect(result.loopCount).toBe(1);
			});

			it('handles for without update', () => {
				const code = 'for (let i = 0; i < 10;) {\n\ti++;\n}\n';
				const result = guardLoops(code, MAX);
				expect(result.code).toContain('++loop1');
				expect(result.loopCount).toBe(1);
			});

			it('handles fully bare for (;;)', () => {
				const code = 'for (;;) {\n\tbreak;\n}\n';
				const result = guardLoops(code, MAX);
				expect(result.code).toContain('++loop1');
				expect(result.loopCount).toBe(1);
			});
		});

		describe('do-while coverage', () => {
			describe('explicit trailing semicolon', () => {
				it('injects guard after opening brace of do body', () => {
					const code = 'do {\n\tx--;\n} while (x > 0);\n';
					const result = guardLoops(code, MAX);
					expect(result.code).toContain(
						`do { if (++loop1 > ${MAX}) throw new RangeError`,
					);
				});

				it('injects reset with leading semicolon after trailing ;', () => {
					const code = 'do {\n\tx--;\n} while (x > 0);\n';
					const result = guardLoops(code, MAX);
					// Note: reset text is `; loop1 = 0;` (leading ; for ASI safety)
					expect(result.code).toContain('; loop1 = 0;');
				});

				it('returns loopCount 1', () => {
					const code = 'do {\n\tx--;\n} while (x > 0);\n';
					const result = guardLoops(code, MAX);
					expect(result.loopCount).toBe(1);
				});

				it('preserves original do-while shape unchanged', () => {
					const code = 'do {\n\tx--;\n} while (x > 0);\n';
					const result = guardLoops(code, MAX);
					expect(result.code).toContain('} while (x > 0);');
				});

				it('does not shift line numbers', () => {
					const code =
						'let x = 3;\ndo {\n\tx--;\n} while (x > 0);\nconsole.log(x);\n';
					const result = guardLoops(code, MAX);
					const lines = result.code.split('\n');
					expect(lines[0]).toBe('let x = 3;');
					expect(lines[1]).toMatch(/^do/);
					expect(lines[4]).toMatch(/console\.log\(x\)/);
				});
			});

			describe('ASI (no trailing semicolon)', () => {
				it('still injects guard and reset', () => {
					const code = 'do {\n\tx--;\n} while (x > 0)\n';
					const result = guardLoops(code, MAX);
					expect(result.code).toContain('++loop1');
					expect(result.code).toContain('; loop1 = 0;');
					expect(result.loopCount).toBe(1);
				});

				it('reset leading ; prevents fusion with while(cond) as its body', () => {
					const code = 'do {\n\tx--;\n} while (x > 0)\n';
					const result = guardLoops(code, MAX);
					// If reset had no leading ;, the ASI case would produce
					// `while (x > 0) loop1 = 0;` which parses as an infinite
					// `while (x > 0) { loop1 = 0; }`. Leading ; prevents this.
					expect(result.code).toMatch(/while \(x > 0\);\s*loop1 = 0;/);
				});
			});

			describe('mixed with while + for', () => {
				it('reading-order numbering across all three types', () => {
					const code = [
						'while (a) {',
						'\ta++;',
						'}',
						'for (let i = 0; i < 3; i++) {',
						'\ti++;',
						'}',
						'do {',
						'\tb--;',
						'} while (b > 0);',
						'',
					].join('\n');
					const result = guardLoops(code, MAX);
					const loop1 = result.code.indexOf('++loop1');
					const loop2 = result.code.indexOf('++loop2');
					const loop3 = result.code.indexOf('++loop3');
					expect(loop1).toBeLessThan(loop2);
					expect(loop2).toBeLessThan(loop3);
					expect(result.loopCount).toBe(3);
				});
			});

			describe('runtime behavior (Task B contract)', () => {
				it.each([
					[-1, 'if (++loop1 > -1)'],
					[0, 'if (++loop1 > 0)'],
					[1, 'if (++loop1 > 1)'],
					[100, 'if (++loop1 > 100)'],
				])('maxIterations = %i → template contains %p', (max, expected) => {
					const result = guardLoops('do {\n\tx++;\n} while (true);\n', max);
					expect(result.code).toContain(expected);
				});

				it.each([
					[-1, []],
					[0, []],
					[1, [1]],
					[3, [1, 2, 3]],
				])(
					'maxIterations = %i runs do-body %p times before throwing',
					(max, expected) => {
						const executed: number[] = [];
						const code = 'do { executed.push(loop1); } while (true);\n';
						const result = guardLoops(code, max);
						// eslint-disable-next-line no-new-func
						const fn = new Function('loop1', 'executed', result.code);
						expect(() => fn(0, executed)).toThrow(RangeError);
						expect(executed).toEqual(expected);
					},
				);
			});
		});

		describe('for-loop runtime behavior (Task B contract)', () => {
			it.each([
				[-1, 'if (++loop1 > -1)'],
				[0, 'if (++loop1 > 0)'],
				[1, 'if (++loop1 > 1)'],
				[100, 'if (++loop1 > 100)'],
			])('maxIterations = %i → template contains %p', (max, expected) => {
				const result = guardLoops(
					'for (let i = 0; i < 1000; i++) {\n\tx++;\n}\n',
					max,
				);
				expect(result.code).toContain(expected);
			});

			it.each([
				[-1, []],
				[0, []],
				[1, [1]],
				[3, [1, 2, 3]],
			])(
				'maxIterations = %i runs for-body %p times before throwing',
				(max, expected) => {
					const executed: number[] = [];
					const code =
						'for (let i = 0; i < 1000; i++) { executed.push(loop1); }\n';
					const result = guardLoops(code, max);
					// eslint-disable-next-line no-new-func
					const fn = new Function('loop1', 'executed', result.code);
					expect(() => fn(0, executed)).toThrow(RangeError);
					expect(executed).toEqual(expected);
				},
			);
		});
	});

	describe('brace-less loop bodies (skip guard)', () => {
		it('skips while loop with no braces — loopCount 0', () => {
			const result = guardLoops('while (x > 0) x--;\n', MAX);
			expect(result.loopCount).toBe(0);
			expect(result.code).toBe('while (x > 0) x--;\n');
		});

		it('skips for loop with no braces — loopCount 0', () => {
			const result = guardLoops('for (let i = 0; i < 10; i++) i;\n', MAX);
			expect(result.loopCount).toBe(0);
		});

		it('skips for-of loop with no braces — loopCount 0', () => {
			const result = guardLoops('for (const x of xs) log(x);\n', MAX);
			expect(result.loopCount).toBe(0);
		});

		it('guards braced loop but skips sibling brace-less loop', () => {
			const code = 'while (a) { a--; }\nwhile (b) b--;\n';
			const result = guardLoops(code, MAX);
			expect(result.loopCount).toBe(1);
			expect(result.code).toContain('++loop1');
			expect(result.code).not.toContain('++loop2');
		});
	});
});
