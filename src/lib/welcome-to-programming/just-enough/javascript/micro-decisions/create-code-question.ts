/**
 * @file Factory for building CodeQuestion objects.
 *
 * @remarks Validates required fields and returns a frozen
 * CodeQuestion. Used by all analyzers to ensure consistent
 * output shape and immutability.
 */

import type {
	Audience,
	BlockCell,
	Category,
	CodeQuestion,
	CodeQuestionKind,
	Feature,
	Level,
	PBSILevel,
	Question,
} from './types.js';

import type { SourceRange } from '../validating/types.js';

// ─── Input type ────────────────────────────────────────────

type CodeQuestionInput = {
	readonly id: string;
	readonly kind: CodeQuestionKind;
	readonly category: Category;
	readonly feature: Feature;
	readonly levels: readonly Level[];
	readonly location: SourceRange;
	readonly nodeType: string;
	readonly context: string;
	readonly questions: readonly Question[];
	readonly block: readonly BlockCell[];
	readonly pbsi: readonly PBSILevel[];
	readonly audiences: readonly Audience[];
};

// ─── Factory ───────────────────────────────────────────────

/**
 * Creates a frozen CodeQuestion from the given input.
 *
 * @remarks Freezes the result and all nested arrays/objects
 * that we own. Does not freeze `location` (it may already be
 * frozen from `extractLocation`).
 *
 * @param input - All fields for the CodeQuestion.
 * @returns A frozen CodeQuestion.
 */
function createCodeQuestion(input: CodeQuestionInput): CodeQuestion {
	const question: CodeQuestion = {
		id: input.id,
		kind: input.kind,
		category: input.category,
		feature: input.feature,
		levels: Object.freeze([...input.levels]),
		location: input.location,
		nodeType: input.nodeType,
		context: input.context,
		questions: Object.freeze(
			input.questions.map((q) => Object.freeze({ ...q })),
		),
		block: Object.freeze([...input.block]),
		pbsi: Object.freeze([...input.pbsi]),
		audiences: Object.freeze([...input.audiences]),
	};

	return Object.freeze(question);
}

export default createCodeQuestion;

export type { CodeQuestionInput };
