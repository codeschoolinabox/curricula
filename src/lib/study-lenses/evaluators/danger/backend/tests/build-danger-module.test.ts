import { describe, expect, it } from 'vitest';

import buildDangerModule from '../build-danger-module.js';

// The trailing sentinel: a newline, then done() as the final top-level statement.
const SENTINEL = `
window.__danger.done();`;

describe('buildDangerModule', () => {
	describe('Zero — no guarded loops', () => {
		it('prepends no counter globals; appends the done sentinel verbatim', () => {
			expect(buildDangerModule('x = 1;', 0)).toBe(`x = 1;${SENTINEL}`);
		});

		it('assembles empty code literally (no smart trim)', () => {
			expect(buildDangerModule('', 0)).toBe(SENTINEL);
		});
	});

	describe('One / Two / Many — the counter prefix (glued, no line shift)', () => {
		it('prepends a single counter for one loop', () => {
			expect(buildDangerModule('x;', 1)).toBe(`var loop1 = 0; x;${SENTINEL}`);
		});

		it('prepends dense counters for two loops (not a Zero/One/Many fixture)', () => {
			expect(buildDangerModule('x;', 2)).toBe(
				`var loop1 = 0, loop2 = 0; x;${SENTINEL}`,
			);
		});

		it('prepends dense counters for several loops', () => {
			expect(buildDangerModule('x;', 3)).toBe(
				`var loop1 = 0, loop2 = 0, loop3 = 0; x;${SENTINEL}`,
			);
		});
	});

	describe('Structure — a module, not a script', () => {
		it('wraps nothing: import stays top-level, no try/catch bridge, no "use strict"', () => {
			// One full-equality assertion pins import-verbatim, no-bridge, and exact
			// sentinel placement at once — stronger than absence-of-substring checks.
			const code = "import x from 'y'; x();";
			expect(buildDangerModule(code, 0)).toBe(`${code}${SENTINEL}`);
		});

		it('the counter prefix sits legally ahead of a top-level import (var hoists)', () => {
			// The reason module mode is a separate assembler: a `var loop1 = 0;` glued
			// before a top-level `import` is legal ES module syntax (imports hoist), so
			// the guarded case must render `var … import …` without shifting a line.
			const code = "import x from 'y'; x();";
			expect(buildDangerModule(code, 1)).toBe(
				`var loop1 = 0; ${code}${SENTINEL}`,
			);
		});
	});

	describe('Boundaries — line preservation', () => {
		it('keeps every user line at its number, done() on a new line below', () => {
			const code = `a;
b;`;
			expect(buildDangerModule(code, 0)).toBe(`${code}${SENTINEL}`);
		});

		it('glues the counter prefix onto user line 1 when guarded (still no shift)', () => {
			const code = `a;
b;`;
			expect(buildDangerModule(code, 1)).toBe(
				`var loop1 = 0; ${code}${SENTINEL}`,
			);
		});

		it('preserves a trailing newline in the user code (blank line before done())', () => {
			const code = `a;
`;
			expect(buildDangerModule(code, 0)).toBe(`${code}${SENTINEL}`);
		});
	});
});
