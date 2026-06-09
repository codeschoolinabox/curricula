/**
 * @vitest-environment jsdom
 *
 * Unit tests for the write-editor diff `StateField` (`../lib/diff-decorations.ts`).
 * These read the DecorationSet the field computes off an `EditorState` — pure
 * state, NOT layout, so this needs no real editor (jsdom is belt-and-braces for
 * the `@codemirror/view` import). WHETHER the highlight visually renders is a
 * browser-gate assertion; WHICH lines land in the set is tested here.
 *
 * Note on semantics: `diffLines` (and therefore this field) compares the learner
 * doc to the solution strictly BY LINE INDEX — line i vs line i. It does not
 * content-track lines across inserts: inserting a line at the top shifts every
 * learner line down and makes them all mismatch their index-aligned solution
 * line. The recompute tests respect that (they MOVE a wrong line within a
 * constant line count rather than relying on content tracking).
 */

import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';

import buildWriteDiffField from '../lib/diff-decorations.js';

/** The 1-based line numbers that carry a diff decoration, in document order. */
function decoratedLines(doc: string, solution: string): number[] {
	const field = buildWriteDiffField(solution);
	const state = EditorState.create({ doc, extensions: [field] });
	const lines: number[] = [];
	state.field(field).between(0, state.doc.length, (from) => {
		lines.push(state.doc.lineAt(from).number);
	});
	return lines;
}

describe('buildWriteDiffField — write-editor diff decorations', () => {
	it('returns an empty set for an empty solution (Zero — no crash)', () => {
		expect(decoratedLines('', '')).toEqual([]);
	});

	it('flags a wrong FIRST code line (index 0 → line 1)', () => {
		// Pins the index+1 mapping at its lower boundary: a bare `index` (forgot
		// +1) would crash or mis-map here, where the existing line-2 cases pass.
		expect(decoratedLines('const x = 9;', 'const x = 1;')).toEqual([1]);
	});

	it('flags a typed-but-wrong code line (line 2)', () => {
		// Solution line 2 is `const x = 1;`; the learner typed `const x = 2;`.
		const solution = '// header\nconst x = 1;';
		const learner = '// header\nconst x = 2;';
		expect(decoratedLines(learner, solution)).toEqual([2]);
	});

	it('flags a wrong LAST code line (trailing boundary, no final newline)', () => {
		const solution = 'const a = 1;\nconst b = 2;';
		const learner = 'const a = 1;\nconst b = 9;';
		expect(decoratedLines(learner, solution)).toEqual([2]);
	});

	it('flags ALL wrong lines when several differ at once (Many; no stop-at-first)', () => {
		const solution = 'const a = 1;\nconst b = 2;\nconst c = 3;';
		const learner = 'const a = 9;\nconst b = 2;\nconst c = 9;';
		expect(decoratedLines(learner, solution)).toEqual([1, 3]);
	});

	it('flags only in-range lines when the learner has FEWER lines than the solution', () => {
		// Learner typed only line 1 (wrong); lines 2-3 have no learner counterpart.
		// diffLines resolves the missing lines to 'empty' via `learnerLines[i] ?? ''`,
		// so they stay neutral and `doc.line()` is never asked for a nonexistent line.
		const solution = 'const a = 1;\nconst b = 2;\nconst c = 3;';
		const learner = 'const a = 9;';
		expect(decoratedLines(learner, solution)).toEqual([1]);
	});

	it('does not crash when the learner has MORE lines than the solution', () => {
		// perLine is sized to the SOLUTION, so the surplus learner lines are never
		// iterated; only the in-range wrong line is flagged.
		const solution = 'const x = 1;';
		const learner = 'const x = 9;\nextra1\nextra2';
		expect(decoratedLines(learner, solution)).toEqual([1]);
	});

	it('leaves a matched code line neutral', () => {
		const solution = '// header\nconst x = 1;';
		const learner = '// header\nconst x = 1;';
		expect(decoratedLines(learner, solution)).toEqual([]);
	});

	it('leaves an unattempted (empty) code line neutral — not flagged as wrong', () => {
		// Honesty-critical: a blank line the learner has not reached is "not done",
		// NOT "wrong" — parity with how `blanks` leaves an unfilled blank neutral.
		const solution = '// header\nconst x = 1;';
		const learner = '// header\n';
		expect(decoratedLines(learner, solution)).toEqual([]);
	});

	it('leaves a comment/freebie line neutral even when it differs', () => {
		// Line 1 is comment-only (a freebie the skeleton seeds verbatim); it is
		// never graded, so a divergent comment is not flagged.
		const solution = '// header\nconst x = 1;';
		const learner = '// CHANGED\nconst x = 1;';
		expect(decoratedLines(learner, solution)).toEqual([]);
	});

	it('recomputes from one to zero when a wrong doc becomes correct', () => {
		const solution = 'const x = 1;';
		const field = buildWriteDiffField(solution);
		const state = EditorState.create({
			doc: 'const x = 9;',
			extensions: [field],
		});
		expect(state.field(field).size).toBe(1); // wrong → one decoration
		const corrected = state.update({
			changes: { from: 0, to: state.doc.length, insert: 'const x = 1;' },
		}).state;
		expect(corrected.field(field).size).toBe(0); // fixed → recomputed to zero
	});

	it('recomputes from zero to one when a correct doc becomes wrong', () => {
		const solution = 'const x = 1;';
		const field = buildWriteDiffField(solution);
		const state = EditorState.create({
			doc: 'const x = 1;',
			extensions: [field],
		});
		expect(state.field(field).size).toBe(0); // correct → no decoration
		const wronged = state.update({
			changes: { from: 0, to: state.doc.length, insert: 'const x = 9;' },
		}).state;
		expect(wronged.field(field).size).toBe(1); // wrong → recomputed to one
	});

	it('recomputes WHICH line is flagged after an edit (position, not just count)', () => {
		// Two code lines, constant count. Wrong line moves from 2 to 1 across the
		// edit — a stale-position impl (recomputes count but caches `from`) would
		// still report line 2 here. Index-aligned: editing content in place.
		const solution = 'const a = 1;\nconst b = 2;';
		const field = buildWriteDiffField(solution);
		const start = EditorState.create({
			doc: 'const a = 1;\nconst b = 9;', // line 2 wrong
			extensions: [field],
		});
		const linesBefore: number[] = [];
		start.field(field).between(0, start.doc.length, (from) => {
			linesBefore.push(start.doc.lineAt(from).number);
		});
		expect(linesBefore).toEqual([2]);

		const moved = start.update({
			changes: {
				from: 0,
				to: start.doc.length,
				insert: 'const a = 9;\nconst b = 2;',
			}, // line 1 wrong
		}).state;
		const linesAfter: number[] = [];
		moved.field(field).between(0, moved.doc.length, (from) => {
			linesAfter.push(moved.doc.lineAt(from).number);
		});
		expect(linesAfter).toEqual([1]);
	});
});
