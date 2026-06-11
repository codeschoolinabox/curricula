/**
 * @file Per-line INDENT correctness for a Parsons arrangement — NEW code,
 * porting the indent check of the legacy `LineBasedGrader.grade`
 * (`parsons.js` L705–719: `code_line.indent !== model_line.indent`).
 *
 * Indent is graded **only for order-correct lines** (per the precedence
 * `distractor > wrong-order > wrong-indent > correct` in `../README.md`
 * § Feedback contract): a misordered line is flagged to move first, and its
 * indent is not surfaced. The set of order-correct lines and their matched model
 * positions comes from `evaluate-line-order.ts` (`matchedModelIndex`), which
 * resolves duplicate lines to their own model index — so a line that appears
 * twice at different nesting depths is graded against the depth of the copy it
 * actually matched.
 *
 * This module is `canIndent`-agnostic: it always grades. The wrapper decides
 * whether to invoke it (skips when `config.canIndent` is false). Pure.
 */

/** Indent verdict for an order-correct line (others are not indent-graded). */
export type IndentVerdict = 'correct' | 'wrong-indent';

/**
 * Grade the indent level of each ORDER-CORRECT placed line against its matched
 * model line's level.
 *
 * @param learnerIndents the learner's chosen indent level per placed line id.
 * @param matchedModelIndex order-correct line id → matched model-solution index
 *   (from `evaluateLineOrder`). Only these ids are graded.
 * @param modelIndents the model solution lines' indent levels, in model order.
 * @returns order-correct line id → `'correct'` (level matches the model) or
 *   `'wrong-indent'` (level differs). Keyed only by the ids in
 *   `matchedModelIndex` (iteration follows that map; the downstream
 *   `CorrectnessMap` composition is by-id lookup, so this order is not
 *   load-bearing). The caller normally guarantees every matched id is in
 *   `learnerIndents` and every matched index is within `modelIndents`; if either
 *   does not hold the line degrades to `'wrong-indent'` rather than throwing. The
 *   degrade is made EXPLICIT (both the learner level and the expected level must
 *   be defined to be eligible for `'correct'`): relying on `learner === expected`
 *   alone is unsafe, since `undefined === undefined` would coincide to `'correct'`
 *   when a missing id AND an out-of-range index occur together.
 */
export default function evaluateIndentation(
	learnerIndents: ReadonlyArray<{ id: string; indent: number }>,
	matchedModelIndex: ReadonlyMap<string, number>,
	modelIndents: ReadonlyArray<number>,
): ReadonlyMap<string, IndentVerdict> {
	const learnerById = new Map<string, number>();
	for (const { id, indent } of learnerIndents) {
		learnerById.set(id, indent);
	}
	const result = new Map<string, IndentVerdict>();
	for (const [id, modelIndex] of matchedModelIndex) {
		const learnerIndent = learnerById.get(id);
		const expected: number | undefined = modelIndents[modelIndex];
		// Both must be defined to be eligible for 'correct'; `undefined ===
		// undefined` would otherwise mis-mark a missing-id + out-of-range line.
		const correct =
			learnerIndent !== undefined &&
			expected !== undefined &&
			learnerIndent === expected;
		result.set(id, correct ? 'correct' : 'wrong-indent');
	}
	return result;
}
