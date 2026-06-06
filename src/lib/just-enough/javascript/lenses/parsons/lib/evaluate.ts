/**
 * @file Compose the per-line evaluators into one `EvaluationResult` for a Check —
 * NEW code. This is the "heart of Check": it takes the learner's arrangement +
 * the parsed model and produces the per-line `CorrectnessMap` (under the fixed
 * precedence `distractor > wrong-order > wrong-indent > correct`), the `unplaced`
 * pool-line states, and the aggregate `total` / `correct` / `score` / `success`.
 *
 * It delegates the actual grading to the already-vendored/new evaluators:
 * `evaluate-line-order.ts` (LIS-based order + duplicate handling) and
 * `evaluate-indentation.ts` (per-line indent for order-correct lines). This module
 * only RESOLVES their verdicts into the canonical per-line state and the score.
 *
 * Pure. Lives under `lib/` (eslint-ignored carve-out) but is our code. Unit-tested
 * in `../tests/evaluate.test.ts` (no jsdom) — the wrapper's Check handler is then
 * a thin call to `buildEvaluation` + a render of the result.
 *
 * @see ../README.md § Feedback contract (precedence + score formula).
 * @see ../DOCS.md § Architectural sketch phase 4 (Evaluate).
 */

import { evaluateLineOrder } from './evaluate-line-order.js';
import { evaluateIndentation } from './evaluate-indentation.js';
import type {
	Arrangement,
	CorrectnessMap,
	EvaluationResult,
	LineCorrectness,
	ParsedParsons,
} from '../types.js';

/**
 * Grade the learner's current arrangement against the parsed model.
 *
 * @param arrangement the learner's `{ pool, solution }` (solution carries each
 *   placed line's chosen indent level).
 * @param parsed the parser output — `solution` is the ordered answer key (code +
 *   model indent), `distractors` the selected distractor lines (for code lookup
 *   of a distractor dragged into the solution). `pool` is unused here.
 * @param canIndent whether indentation is a graded dimension. When `false`,
 *   indent is neither evaluated nor reflected in `correct` / `score`.
 * @returns the `EvaluationResult` (see `../types.ts`).
 */
export function buildEvaluation(
	arrangement: Arrangement,
	parsed: ParsedParsons,
	canIndent: boolean,
): EvaluationResult {
	// Code lookup for placed ids (a placed line is a solution OR distractor line).
	const codeById = new Map<string, string>();
	for (const line of parsed.solution) codeById.set(line.id, line.code);
	for (const line of parsed.distractors) codeById.set(line.id, line.code);

	const modelCodes = parsed.solution.map((line) => line.code);
	const modelIndents = parsed.solution.map((line) => line.indent);
	const solutionIds = new Set(parsed.solution.map((line) => line.id));

	// Delegate the actual grading. Order first (LIS + duplicate walk); indent only
	// for the order-correct lines (matchedModelIndex), and only when canIndent.
	const { order, matchedModelIndex } = evaluateLineOrder(
		arrangement.solution.map((placed) => ({
			id: placed.id,
			code: codeById.get(placed.id) ?? '',
		})),
		modelCodes,
	);
	const indentVerdicts = canIndent
		? evaluateIndentation(
				arrangement.solution.map((placed) => ({
					id: placed.id,
					indent: placed.indent,
				})),
				matchedModelIndex,
				modelIndents,
			)
		: new Map<string, 'correct' | 'wrong-indent'>();

	// Resolve each PLACED line to its single state under the precedence
	// `distractor > wrong-order > wrong-indent > correct`.
	const correctnessMap = new Map<string, LineCorrectness>();
	let correct = 0;
	let distractorPlaced = false;
	for (const placed of arrangement.solution) {
		const orderVerdict = order.get(placed.id);
		let state: LineCorrectness;
		if (orderVerdict === 'distractor') {
			state = 'distractor';
			distractorPlaced = true;
		} else if (orderVerdict === 'wrong-order') {
			state = 'wrong-order';
		} else if (canIndent && indentVerdicts.get(placed.id) === 'wrong-indent') {
			state = 'wrong-indent';
		} else {
			state = 'correct';
		}
		correctnessMap.set(placed.id, state);
		// `solutionIds.has` is LOAD-BEARING, not defensive: `evaluateLineOrder`
		// matches placed lines to the model by CODE TEXT, so a distractor whose code
		// duplicates a solution line's is graded 'correct'/'wrong-order' (not
		// 'distractor'). Without this guard such a distractor would inflate `correct`
		// and the score. (The confusing green-on-a-distractor render is intrinsic to
		// code-based matching — see evaluate-line-order.ts; the score stays honest.)
		if (state === 'correct' && solutionIds.has(placed.id)) correct++;
	}

	// `unplaced` is a POOL-line state: a SOLUTION line still in the pool. A
	// distractor left in the pool is correct-by-omission and is NOT added.
	for (const id of arrangement.pool) {
		if (solutionIds.has(id)) correctnessMap.set(id, 'unplaced');
	}

	const total = parsed.solution.length;
	const score = total === 0 ? 100 : Math.round((correct / total) * 100);
	const success = correct === total && !distractorPlaced;

	// Type-narrowing alias only (Map -> ReadonlyMap); NOT runtime-frozen. This is
	// per-Check React state consumed read-only within one render, not a
	// LensModule-level constant (those use freezeInPlace per DOCS § Deep Freeze).
	const correctnessMapReadonly: CorrectnessMap = correctnessMap;
	return { correctnessMap: correctnessMapReadonly, total, correct, score, success };
}
