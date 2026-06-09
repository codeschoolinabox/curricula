/**
 * @file NEW — CodeMirror decoration glue for the `diff` scaffold. Maps the pure
 * per-line verdict from `./diff-lines.ts` onto CodeMirror line decorations. Both
 * halves of the diff PAIR live here (one cohesive feature, sharing `diffLines`,
 * the `index + 1` line mapping, and the `cm-writeme-*-line` idiom):
 *
 * - {@link buildWriteDiffField} — a self-recomputing `StateField` for the WRITE
 *   editor. On every doc change it recomputes `diffLines(doc, solution)` and
 *   emits a zero-width `Decoration.line` on each `'diff'` (typed-but-wrong) line.
 *   `'empty'` (unattempted) and `'comment'` (freebie) lines stay NEUTRAL — only
 *   typed-but-wrong lines are flagged. The field captures the solution at
 *   construction; the editor's live document is the learner's code.
 * - {@link buildReadMarkerField} — a STATIC `StateField` for the read-only READ
 *   editor (whose document IS the solution). It marks every solution line the
 *   learner has not yet reproduced (`'diff'` OR `'empty'` — the complement of
 *   `'match'`/`'comment'`); computed once from the learner's progress captured at
 *   read-view entry, never recomputed (the read doc never changes).
 *
 * Why a `StateField` (not React-pushed decorations): the write editor mounts once
 * and the learner types into it continuously; recomputing from `tr.state` inside
 * the editor keeps the highlight in lockstep with the document without a React
 * round trip (parity with `blanks`' `buildDiffDecorations`). The decoration
 * MAPPING — which lines land in the set — is unit-tested by reading the field
 * value off an `EditorState` (pure state, jsdom-feasible); whether the highlight
 * visually renders is a browser-gate assertion (jsdom has no CodeMirror layout).
 *
 * This directory (`lenses/writeme/lib/**`) is eslint-ignored per `eslint.config.mjs`.
 */

import { StateField } from '@codemirror/state';
import type { EditorState } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';

import diffLines from './diff-lines.js';

// Zero-width line decoration; CodeMirror rejects a non-empty line-decoration range.
const diffLineDecoration = Decoration.line({ class: 'cm-writeme-diff-line' });

/**
 * Map the live document's per-line diff verdict onto line decorations: one
 * zero-width `Decoration.line` per `'diff'` (typed-but-wrong) line, anchored at
 * the line start. `perLine` is index-aligned to the SOLUTION's lines (0-based);
 * the editor's lines are 1-based, hence `index + 1`. The `<= doc.lines` guard is
 * provably never taken for a well-formed verdict — a `'diff'` only arises when the
 * learner line is non-empty (`diff-lines.ts`: a blank/absent learner line is
 * `'empty'`), so its 1-based line necessarily exists in the doc. It is kept purely
 * as a module-boundary guard so a future change to `diffLines`' contract can never
 * make `doc.line()` throw.
 */
function computeWriteDiffDecorations(
	state: EditorState,
	solution: string,
): DecorationSet {
	const { perLine } = diffLines(state.doc.toString(), solution);
	const ranges = perLine.flatMap((status, index) =>
		status === 'diff' && index + 1 <= state.doc.lines
			? [diffLineDecoration.range(state.doc.line(index + 1).from)]
			: [],
	);
	return Decoration.set(ranges, true);
}

/**
 * Build the write-editor diff `StateField`. The returned field recomputes its
 * `DecorationSet` from the live document on every doc change, marking each
 * `'diff'`-status line (indexed 1:1 with `diffLines(doc, solution).perLine`).
 *
 * @param solution - the original source (`embodiment.source.code`) to diff against.
 * @returns a `StateField<DecorationSet>` (also a CodeMirror `Extension`): drop it
 *   into the editor's diff compartment, or read it off an `EditorState` via
 *   `state.field(returnedField)` to inspect the decoration set in a test.
 */
function buildWriteDiffField(solution: string): StateField<DecorationSet> {
	return StateField.define<DecorationSet>({
		create(state) {
			return computeWriteDiffDecorations(state, solution);
		},
		update(value, transaction) {
			// Full recompute on any doc change (parity with blanks' diff field) —
			// cheap (O(lines)) and keeps positions correct after edits that shift
			// lines. Non-doc transactions (selection, focus) reuse the prior set.
			return transaction.docChanged
				? computeWriteDiffDecorations(transaction.state, solution)
				: value;
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
function buildReadMarkerField(
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

export default buildWriteDiffField;
export { buildReadMarkerField };
