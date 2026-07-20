/**
 * @file CodeMirror decoration glue for the `diff` scaffold's READ half — the
 * read-view "diff pair" marker. The WRITE half lives in
 * `./diff-decorations.ts`; both share `diffLines`, the `index + 1` line
 * mapping, and the `cm-writeme-*-line` idiom.
 */

import { StateField } from '@codemirror/state';
import type { EditorState } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';

import diffLines from './diff-lines.js';

/**
 * Build the read-editor "diff pair" marker field. Unlike the write field this is
 * STATIC — the read editor is read-only, so its document (the solution) never
 * changes; the markers are computed once from the learner's progress captured at
 * read-view entry. Recompute happens by remounting the read editor (the wrapper
 * keys the read mount on `viewMode` / `diff`), not by a doc transaction.
 *
 * @param learner - the learner's current code (`learnerCode ?? startingTemplate`).
 * @param solution - the original source (the read editor's document).
 * @returns a `StateField<DecorationSet>` (also a CodeMirror `Extension`): add it to
 *   the read editor, or read it off an `EditorState` via `state.field(returnedField)`
 *   to inspect the marker set in a test.
 */
export default function buildReadMarkerField(
	learner: string,
	solution: string,
): StateField<DecorationSet> {
	return StateField.define<DecorationSet>({
		create(state) {
			return computeReadMarkerDecorations(state, learner, solution);
		},
		// Static: the read editor is read-only, so its document never changes.
		// `update` returns the prior set verbatim (no recompute) — the markers are
		// fixed at read-view entry; progress changes by remounting the read editor.
		update(value) {
			return value;
		},
		provide: (field) => EditorView.decorations.from(field),
	});
}

// The read-view "diff pair" marker: a SOLUTION line the learner has not yet
// reproduced (typed-but-wrong OR not-yet-typed). Distinct from the write editor's
// "wrong" red — this is a study cue ON the solution that focuses what is still
// missing, never a view of the learner's code.
const todoLineDecoration = Decoration.line({ class: 'cm-writeme-todo-line' });

/**
 * Map the learner's progress onto markers on the READ-view solution editor: one
 * zero-width `Decoration.line` per solution code line the learner has NOT matched
 * (`'diff'` or `'empty'` — i.e. anything but `'match'`). `'comment'` freebie lines
 * are never marked; matched lines are left clean (done). The read editor's doc IS
 * the solution, so `perLine.length === state.doc.lines` and the `index + 1`
 * mapping always resolves (the guard mirrors the write field for symmetry).
 */
function computeReadMarkerDecorations(
	state: EditorState,
	learner: string,
	solution: string,
): DecorationSet {
	const { perLine } = diffLines(learner, solution);
	const ranges = perLine.flatMap((status, index) =>
		(status === 'diff' || status === 'empty') && index + 1 <= state.doc.lines
			? [todoLineDecoration.range(state.doc.line(index + 1).from)]
			: [],
	);
	return Decoration.set(ranges, true);
}
