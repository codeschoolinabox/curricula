/**
 * @file Main public function — interprets JEJ errors for learners.
 *
 * @remarks Orchestrates the full pipeline: parse → extract context →
 * match explanation → interpolate templates → freeze and return.
 * Never throws — any internal failure produces a generic fallback.
 */

import type {
	ErrorContext,
	ErrorInput,
	ErrorInterpretation,
	InterpretOptions,
} from './types.js';

import EXPLANATIONS from './explanations.js';
import matchExplanation from './match-explanation.js';
import extractContext from './extract-context.js';
import interpolateTemplate from './interpolate-template.js';
import parseBestEffort from './parse-best-effort.js';
import deepFreezeInPlace from '../../../../utils/deep-freeze-in-place.js';

// ─── Context to template record ─────────────────────────────

/**
 * Converts an ErrorContext to a string record for template interpolation.
 */
function contextToRecord(ctx: ErrorContext): Record<string, string> {
	const record: Record<string, string> = {};
	if (ctx.errorName) record.errorName = ctx.errorName;
	if (ctx.errorMessage) record.errorMessage = ctx.errorMessage;
	if (ctx.line !== undefined) record.line = String(ctx.line);
	if (ctx.column !== undefined) record.column = String(ctx.column);
	if (ctx.name) record.name = ctx.name;
	if (ctx.actualType) record.actualType = ctx.actualType;
	if (ctx.expression) record.expression = ctx.expression;
	if (ctx.suggestion) record.suggestion = ctx.suggestion;
	return record;
}

// ─── Generic fallback ───────────────────────────────────────

function buildFallback(
	error: ErrorInput,
	context: ErrorContext,
): ErrorInterpretation {
	return deepFreezeInPlace({
		whatWentWrong: `A \`${error.name}\` occurred: ${error.message}`,
		howToFix:
			'Check the error message carefully and review your code ' +
			(error.line ? `around line ${error.line}.` : 'for issues.'),
		likelyMisunderstanding:
			'This error does not have a specific explanation yet. ' +
			'The error message itself is your best guide.',
		howToAdjust:
			'Read the error message word by word. JavaScript error messages ' +
			'are precise — each word tells you something about what went wrong.',
		context,
	});
}

// ─── Main function ──────────────────────────────────────────

/**
 * Interprets a JEJ program error into a structured, human-friendly explanation.
 *
 * @param source - The JEJ program source code
 * @param error - Raw error information (name, message, line, column)
 * @param options - Optional context (phase: 'parse' | 'runtime')
 * @returns A frozen `ErrorInterpretation` with markdown fields
 *
 * @remarks Never throws. If the error cannot be matched to a known
 * pattern, returns a generic fallback interpretation.
 *
 * @example
 * ```ts
 * const result = interpretError(
 *   'console.log(userName);',
 *   { name: 'ReferenceError', message: 'userName is not defined', line: 1 },
 * );
 * result.whatWentWrong; // "You used the variable `userName` but..."
 * ```
 */
function interpretError(
	source: string,
	error: ErrorInput,
	{ phase }: InterpretOptions = {},
): ErrorInterpretation {
	try {
		// 1. Best-effort parse
		const ast = parseBestEffort(source);

		// 2. Extract context from error + source + AST
		const context = extractContext(error, source, ast);

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

export default interpretError;
