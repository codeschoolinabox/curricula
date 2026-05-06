/**
 * @file Main public function — interprets JEJ errors for learners.
 *
 * @remarks Orchestrates the full pipeline: read AST from embodiment →
 * extract context → match explanation → interpolate templates → freeze
 * and return. Never throws — any internal failure produces a generic
 * fallback.
 *
 * Step 7 of the JEJ refactor (`REFACTOR-HANDOFF.md`) replaced the
 * `(source: string, error, options?)` signature with
 * `(embodiment: Snippet, error, options?)`. The entry now reads source
 * + AST off the frozen embodiment; in Phase A the embody factory is a
 * named-scenario mock, so AST-dependent suggestion paths
 * (`generateSuggestion`'s `collectDeclaredNames` "did you mean" branch
 * and `isPromptRelated` branch in `extract-context.ts`) silently
 * degrade to `undefined` against the mock's stub `Program` (`body:
 * []`). Phase B's real `embody/lib/parse/` reinstates the AST and
 * these suggestions resume working without code change here.
 */

import type { Node } from 'acorn';

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { Snippet } from '../../../embody/types.js';

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

// ─── Context to template record ─────────────────────────────

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
 * @param embodiment - The frozen `Snippet` whose source + AST provide
 *   context for interpretation. Source is read from
 *   `embodiment.source.code`; AST is read from
 *   `embodiment.parse.ast.acornNode` only when `embodiment.status.parsed
 *   === true` AND `embodiment.parse.ast` is defined (the `Partial<ParseGraph>`
 *   contract on `Snippet.parse` lets the field be missing independent
 *   of the boolean).
 * @param error - Raw error information (name, message, line, column).
 *   Decoupled from `EmbodyError` so callers can pass either the
 *   embodiment's pre-evaluation gate error (`embodiment.errors`) or a
 *   runtime evaluation error (`runInstance.endReport.error` from a
 *   resolved `streams.evaluate.run()`); callers adapt
 *   `EmbodyError → ErrorInput` at the call site.
 * @param options - Optional context (phase: 'parse' | 'runtime').
 *   Phase B alignment deferred: align with `EmbodyPhase`'s 4-value
 *   taxonomy (`parse:tokenize | parse:ast | create | evaluate`).
 *   Current mapping: `parse:tokenize | parse:ast → 'parse'`;
 *   `evaluate → 'runtime'`; `create → 'parse'` (semantically a
 *   parse-error from the learner's perspective; AST exists but
 *   script-scope creation failed).
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
function interpretError(
	embodiment: Snippet,
	error: ErrorInput,
	{ phase }: InterpretOptions = {},
): ErrorInterpretation {
	try {
		// 1. Read AST from embodiment (when parsed). The dual guard is
		// load-bearing: `Snippet.parse` is `Partial<ParseGraph>`, so
		// `parse.ast` may be absent independent of `status.parsed`.
		// eslint-disable-next-line sonarjs/todo-tag -- intentional Phase B deferral marker per AR-1 verdict; the mandated `TODO(phase-b):` token names what real embody internals will unlock without a code change here.
		// TODO(phase-b): The Phase A mock's stub Program has body: [],
		// so `generateSuggestion`'s AST-dependent paths
		// (`collectDeclaredNames` "did you mean" + `isPromptRelated`)
		// silently degrade to undefined. Phase B's real
		// `embody/lib/parse/` reinstates the AST; suggestions resume
		// working without code change here.
		const ast: Node | null =
			embodiment.status.parsed && embodiment.parse.ast
				? embodiment.parse.ast.acornNode
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

export default interpretError;
