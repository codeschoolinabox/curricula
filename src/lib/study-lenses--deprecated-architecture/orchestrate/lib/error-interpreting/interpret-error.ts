/**
 * @file Main public function — interprets JEJ errors for learners.
 *
 * @remarks Orchestrates the full pipeline: read AST from embodiment →
 * extract context → match explanation → interpolate templates → freeze
 * and return. Never throws — any internal failure produces a generic
 * fallback.
 *
 * Reads source + AST off the frozen embodiment. AST-dependent suggestion
 * paths (`generateSuggestion`'s `collectDeclaredNames` "did you mean"
 * branch and `isPromptRelated` branch in `extract-context.ts`) require
 * a non-null `embodiment.raw.ast`; on tokenize-fail or parse-fail leaves
 * they fall back to `undefined` without affecting the interpreted error
 * structure.
 */

import type { Node } from 'acorn';

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { Snippet } from '../../../../embody/types.js';

import EXPLANATIONS from './explanations.js';
import extractContext from './extract-context.js';
import interpolateTemplate from './interpolate-template.js';
import matchExplanation from './match-explanation.js';
import type {
	ErrorContext,
	ErrorInput,
	ErrorInterpretation,
	InterpretOptions,
} from './types.js';

/**
 * Interprets a JEJ program error into a structured, human-friendly explanation.
 *
 * @param embodiment - The frozen `Snippet` whose source + AST provide
 *   context for interpretation. Source is read from
 *   `embodiment.source.code`; AST is read from `embodiment.raw.ast`
 *   when `embodiment.status.parsed === true`.
 * @param error - Raw error information (name, message, line, column).
 *   Decoupled from `EmbodyError` so callers can pass either the
 *   embodiment's pre-evaluation gate error (`embodiment.errors`) or a
 *   runtime evaluation error (`runInstance.endReport.error` from a
 *   resolved `snippet.evaluation.events.run()`); callers adapt
 *   `EmbodyError → ErrorInput` at the call site.
 * @param options - Optional context (phase: 'parse' | 'runtime').
 *   The 2-value public split collapses the 5 internal `EmbodyPhase`
 *   values: anything before evaluation surfaces as `'parse'` to the
 *   learner; runtime errors during evaluation surface as `'runtime'`.
 * @returns A frozen `ErrorInterpretation` with markdown fields
 *
 * @remarks Never throws. If the error cannot be matched to a known
 * pattern, returns a generic fallback interpretation.
 *
 * @example
 * ```ts
 * import embody from '../../../embody/index.js';
 *
 * const result = interpretError(
 *   embody('OK'),
 *   { name: 'ReferenceError', message: 'userName is not defined', line: 1 },
 * );
 * result.whatWentWrong; // "You used the variable `userName` but..."
 * ```
 */
export default function interpretError(
	embodiment: Snippet,
	error: ErrorInput,
	{ phase }: InterpretOptions = {},
): ErrorInterpretation {
	try {
		// 1. Read AST from embodiment (when parsed).
		// Per embody contract: status.parsed === true ⇒ raw.ast !== null;
		// the `&& raw.ast` check is structurally redundant given the contract
		// but type-narrows for the compiler.
		const ast: Node | null =
			embodiment.status.parsed && embodiment.raw.ast
				? embodiment.raw.ast
				: null;

		// 2. Extract context from error + source + AST
		const context = extractContext(error, embodiment.source.code, ast);

		// 3. Match against loaded explanation patterns
		const matchOptions: InterpretOptions = phase ? { phase } : {};
		const pattern = matchExplanation(error, EXPLANATIONS, matchOptions);

		// 4. If no match, return generic fallback
		if (!pattern) {
			return buildFallback(error, context);
		}

		// 5. Interpolate templates with context
		const record = contextToRecord(context);

		const result: ErrorInterpretation = {
			whatWentWrong: interpolateTemplate(pattern.whatWentWrong, record),
			howToFix: interpolateTemplate(pattern.howToFix, record),
			likelyMisunderstanding: interpolateTemplate(
				pattern.likelyMisunderstanding,
				record,
			),
			howToAdjust: interpolateTemplate(pattern.howToAdjust, record),
			...(pattern.seeAlso !== undefined && { seeAlso: pattern.seeAlso }),
			context,
		};

		return deepFreezeInPlace(result);
	} catch {
		// Never throw — return a minimal fallback
		return deepFreezeInPlace({
			whatWentWrong: `A \`${error.name}\` occurred: ${error.message}`,
			howToFix: 'Review your code for issues.',
			likelyMisunderstanding: 'This error could not be fully analyzed.',
			howToAdjust: 'Read the error message carefully for clues.',
		});
	}
}

/**
 * Converts an ErrorContext to a string record for template interpolation.
 */
function contextToRecord(context: ErrorContext): Record<string, string> {
	const record: Record<string, string> = {};
	if (context.errorName) record.errorName = context.errorName;
	if (context.errorMessage) record.errorMessage = context.errorMessage;
	if (context.line !== undefined) record.line = String(context.line);
	if (context.column !== undefined) record.column = String(context.column);
	if (context.name) record.name = context.name;
	if (context.actualType) record.actualType = context.actualType;
	if (context.expression) record.expression = context.expression;
	if (context.suggestion) record.suggestion = context.suggestion;
	return record;
}

function buildFallback(
	error: ErrorInput,
	context: ErrorContext,
): ErrorInterpretation {
	return deepFreezeInPlace({
		whatWentWrong: `A \`${error.name}\` occurred: ${error.message}`,
		howToFix: `Check the error message carefully and review your code ${
			error.line ? `around line ${error.line}.` : 'for issues.'
		}`,
		likelyMisunderstanding:
			'This error does not have a specific explanation yet. ' +
			'The error message itself is your best guide.',
		howToAdjust:
			'Read the error message word by word. JavaScript error messages ' +
			'are precise — each word tells you something about what went wrong.',
		context,
	});
}
