/**
 * @file Factory for building CodeQuestion objects.
 *
 * @remarks Assembles the required fields and returns a deeply frozen
 * CodeQuestion. Used by all analyzers to ensure a consistent output shape and
 * immutability. `input` is caller-provided (an analyzer's inline literals), so
 * the factory clones-then-freezes via `@utils/clone-and-freeze` — the caller's
 * arrays/objects are never mutated, and every level (including each question's
 * optional `hints`) is frozen.
 */

import cloneAndFreeze from '@utils/clone-and-freeze.js';

import type { CodeQuestion, CodeQuestionInput } from './types.js';

// ─── Factory ───────────────────────────────────────────────

/**
 * Creates a deeply frozen CodeQuestion from the given input.
 *
 * @param input - All fields for the CodeQuestion.
 * @returns A deeply frozen CodeQuestion (a fresh reference; `input` untouched).
 */
export default function createCodeQuestion(
	input: CodeQuestionInput,
): CodeQuestion {
	const question: CodeQuestion = {
		id: input.id,
		kind: input.kind,
		category: input.category,
		feature: input.feature,
		levels: input.levels,
		location: input.location,
		nodeType: input.nodeType,
		context: input.context,
		questions: input.questions,
		block: input.block,
		pbsi: input.pbsi,
		audiences: input.audiences,
	};

	return cloneAndFreeze(question);
}
