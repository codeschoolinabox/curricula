import { describe, expect, it } from 'vitest';

import buildDangerScript from '../build-danger-script.js';

// The invariant bridge tail every script carries (DOCS.md § Execution phases 1).
const TAIL =
	' window.__danger.done(); } catch (e) { window.__danger.fail(e && e.name, e && e.message); }';

describe('buildDangerScript', () => {
	describe('Zero — no loops means no counter declarations', () => {
		it('loopCount 0 emits no `var loop…` at all', () => {
			expect(buildDangerScript('doThing();', 0)).toBe(
				`"use strict"; try { doThing();${TAIL}`,
			);
		});

		it('the assembled script never contains a loop counter when loopCount is 0', () => {
			expect(buildDangerScript('doThing();', 0)).not.toContain('loop');
		});

		it('empty code assembles literally, keeping the boundary spaces (no smart trim)', () => {
			// Both `try { ` and the tail carry their own boundary space, so empty code
			// yields a double space — the correct literal contract, not a defect to trim.
			expect(buildDangerScript('', 0)).toBe(`"use strict"; try { ${TAIL}`);
		});
	});

	describe('One / Many — counter globals track loopCount exactly', () => {
		it('loopCount 1 declares exactly loop1', () => {
			expect(buildDangerScript('doThing();', 1)).toBe(
				`"use strict"; var loop1 = 0; try { doThing();${TAIL}`,
			);
		});

		it('loopCount 3 declares loop1..loop3, comma-joined, in order', () => {
			expect(buildDangerScript('doThing();', 3)).toBe(
				`"use strict"; var loop1 = 0, loop2 = 0, loop3 = 0; try { doThing();${TAIL}`,
			);
		});

		it('the highest counter id equals loopCount (not hardcoded)', () => {
			const script = buildDangerScript('doThing();', 5);
			expect(script).toContain('loop5 = 0');
			expect(script).not.toContain('loop6');
		});
	});

	describe('Boundaries — zero line shift (the load-bearing property)', () => {
		const code = 'const a = 1;\nconst b = 2;\nconsole.log(a + b);';

		it('adds no lines: the script has the same line count as the user code', () => {
			// The prefix and the tail are both glued (no newline), so nothing above or
			// below the user code lands on its own line.
			const codeLineCount = code.split('\n').length;
			const scriptLineCount = buildDangerScript(code, 2).split('\n').length;
			expect(scriptLineCount).toBe(codeLineCount);
		});

		it('user line N stays at script line N', () => {
			const userLines = code.split('\n');
			const scriptLines = buildDangerScript(code, 2).split('\n');
			// Line 1: the whole prefix (in order) is glued ahead of the first user line.
			expect(scriptLines[0]).toBe(
				`"use strict"; var loop1 = 0, loop2 = 0; try { ${userLines[0]}`,
			);
			// Interior line: byte-identical at the same index.
			expect(scriptLines[1]).toBe(userLines[1]);
			// Last line: the user's last line with the bridge tail glued after it.
			expect(scriptLines[2]).toBe(userLines[2] + TAIL);
		});
	});

	describe('Interfaces — the assembler does no identifier-safety work', () => {
		it("passes a learner's own loop1 / __danger identifiers through unescaped", () => {
			// The assembler glues; collision-avoidance is not its job (that risk is
			// inherited from guardLoops / the shared realm, not manufactured here).
			const code = 'var loop1 = "mine"; window.__danger = null;';
			expect(buildDangerScript(code, 1)).toContain(
				'var loop1 = "mine"; window.__danger = null;',
			);
		});
	});
});
