/**
 * @file NEW — CodeMirror decoration glue for the `diff` scaffold. Maps the pure
 * per-line verdict from `./diff-lines.ts` onto CodeMirror line decorations.
 *
 * - {@link buildWriteDiffField} — a self-recomputing `StateField` for the WRITE
 *   editor. On every doc change it recomputes `diffLines(doc, solution)` and
 *   emits a zero-width `Decoration.line` on each `'diff'` (typed-but-wrong) line.
 *   `'empty'` (unattempted) and `'comment'` (freebie) lines stay NEUTRAL — only
 *   typed-but-wrong lines are flagged. The field captures the solution at
 *   construction; the editor's live document is the learner's code.
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

export default buildWriteDiffField;
