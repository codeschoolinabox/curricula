import { describe, expect, it } from 'vitest';

import wrapWithDebugger from '../wrap-with-debugger.js';

describe('wrapWithDebugger', () => {
	describe('Zero — disabled is a no-op passthrough', () => {
		it('returns multi-line code byte-identical when disabled', () => {
			const code = 'const a = 1;\nconst b = 2;\nconsole.log(a + b);';
			expect(wrapWithDebugger(code, false)).toBe(code);
		});

		it('returns empty code unchanged when disabled', () => {
			expect(wrapWithDebugger('', false)).toBe('');
		});
	});

	describe('One — enabled wraps a single line, glued above + own line below', () => {
		it('leading debugger is glued to the first line (no newline before user code)', () => {
			expect(wrapWithDebugger('doThing();', true)).toBe(
				'debugger; doThing();\ndebugger;',
			);
		});

		it('the leading segment shares line 1 with the user code', () => {
			const out = wrapWithDebugger('doThing();', true);
			expect(out.split('\n')[0]).toBe('debugger; doThing();');
		});

		it('the trailing debugger is the last line, on its own', () => {
			const out = wrapWithDebugger('doThing();', true);
			expect(out.split('\n').at(-1)).toBe('debugger;');
		});
	});

	describe('Many — enabled preserves every user line number', () => {
		const code = 'const a = 1;\nconst b = 2;\nconsole.log(a + b);';

		it('user line N stays at output line N (leading glued to line 1, interior untouched)', () => {
			const userLines = code.split('\n');
			const outLines = wrapWithDebugger(code, true).split('\n');
			// Line 1: leading debugger glued to the first user line.
			expect(outLines[0]).toBe(`debugger; ${userLines[0]}`);
			// Interior + last user lines: byte-identical, same index.
			expect(outLines[1]).toBe(userLines[1]);
			expect(outLines[2]).toBe(userLines[2]);
		});

		it('adds exactly one line (the trailing debugger) below the user code', () => {
			const userLineCount = code.split('\n').length;
			const outLineCount = wrapWithDebugger(code, true).split('\n').length;
			expect(outLineCount).toBe(userLineCount + 1);
		});

		it('the trailing debugger sits below the last user line', () => {
			const out = wrapWithDebugger(code, true);
			expect(out.endsWith('\ndebugger;')).toBe(true);
		});

		it('preserves a trailing blank line in the user code (no smart trim)', () => {
			// A near-universal editor-buffer shape. A `.replace(/\n$/, '')`-style
			// cleanup would swallow the trailing blank line and shift the last user
			// line — forbidden. The blank line is an ordinary preserved line.
			expect(wrapWithDebugger('const a = 1;\n', true)).toBe(
				'debugger; const a = 1;\n\ndebugger;',
			);
		});
	});

	describe('Boundaries — enabled on empty code', () => {
		it('wraps empty code without shifting anything', () => {
			expect(wrapWithDebugger('', true)).toBe('debugger; \ndebugger;');
		});
	});

	describe('Interfaces — code already containing debugger passes through the wrap unchanged', () => {
		it('does not strip or dedupe a learner debugger; (visible, not touched)', () => {
			const code = 'debugger;\nconst a = 1;';
			expect(wrapWithDebugger(code, true)).toBe(
				'debugger; debugger;\nconst a = 1;\ndebugger;',
			);
		});
	});
});
