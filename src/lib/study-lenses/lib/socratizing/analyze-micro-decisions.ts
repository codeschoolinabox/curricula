/**
 * @file The socratizing engine entry point.
 *
 * @remarks Pure function: an `Embodiment` in, a frozen `MicroDecisionResult`
 * out. Reads the source, AST, and scope environment from the embodiment's
 * facts, builds the declaration view (`deriveScopeUsage`) up front, runs every
 * point and program analyzer, filters by config, and returns a discriminated
 * union. Refuses (`ok: false`) when either required fact stage — the AST or the
 * scope environment — did not succeed, carrying that stage's cause.
 */

import type { Node } from 'acorn';

import freezeInPlace from '@utils/freeze-in-place.js';

import type { Embodiment, StageCause } from '../../embody/types.js';
import deriveScopeUsage from '../scoping/derive-scope-usage.js';
import type { ScopeUsage } from '../scoping/types.js';

import cautionAnalyzers from './analyzers/caution.js';
import clarityAnalyzers from './analyzers/clarity.js';
import comprehensionControlFlowAnalyzers from './analyzers/comprehension-control-flow.js';
import comprehensionDataAnalyzers from './analyzers/comprehension-data.js';
import comprehensionGenericAnalyzers from './analyzers/comprehension-generic.js';
import comprehensionInteractionAnalyzers from './analyzers/comprehension-interaction.js';
import comprehensionOperatorAnalyzers from './analyzers/comprehension-operators.js';
import comprehensionVariableAnalyzers from './analyzers/comprehension-variables.js';
import consistencyAnalyzers from './analyzers/consistency.js';
import easterEggAnalyzers from './analyzers/easter-egg.js';
import trapAnalyzers from './analyzers/trap.js';
import voiceProfileAnalyzers from './analyzers/voice-profile.js';
import voiceAnalyzers from './analyzers/voice.js';
import filterQuestions from './filter-questions.js';
import getChildNodes from './get-child-nodes.js';
import type {
	AnalyzerEntry,
	AnalyzerError,
	CodeQuestion,
	MicroDecisionConfig,
	MicroDecisionResult,
	ProgramAnalyzerEntry,
} from './types.js';

/**
 * Analyzes an embodiment for micro-decision and comprehension questions.
 *
 * @param embodiment - A frozen `Embodiment` from `embody()`.
 * @param config - Optional filtering configuration; every field defaults to
 *   "include everything".
 * @returns A deeply frozen `MicroDecisionResult`.
 */
export default function analyzeMicroDecisions(
	embodiment: Embodiment,
	config: MicroDecisionConfig = {},
): MicroDecisionResult {
	const { source, ast, environment } = embodiment.facts;

	// Refusal arm — ast, then environment. Either failing is a typed refusal
	// carrying that stage's cause (a valid AST almost always scopes, so the
	// environment branch is rare but honest).
	if (!ast.ok) {
		return refusal(ast.cause);
	}
	if (!environment.ok) {
		return refusal(environment.cause);
	}

	const scope = deriveScopeUsage(environment.value);

	const walked = walkAndAnalyze(ast.value, scope, source.value);
	const program = runProgramAnalyzers(ast.value, scope, source.value);
	const questions = [...walked.questions, ...program.questions];
	const errors = [...walked.errors, ...program.errors];

	const filtered = filterQuestions(questions, config);

	// `filtered` and its questions are already frozen; this freezes the envelope
	// (and `analyzerErrors`) — an idempotent re-walk of the frozen parts.
	return freezeInPlace({
		ok: true as const,
		questions: filtered,
		...(errors.length > 0 ? { analyzerErrors: errors } : {}),
	});
}

// ─── Analyzer registry ─────────────────────────────────────

/** Point analyzers: each fires on every AST node. */
const POINT_ANALYZERS: readonly AnalyzerEntry[] = [
	...voiceAnalyzers,
	...clarityAnalyzers,
	...cautionAnalyzers,
	...trapAnalyzers,
	...easterEggAnalyzers,
	...comprehensionVariableAnalyzers,
	...comprehensionControlFlowAnalyzers,
	...comprehensionInteractionAnalyzers,
	...comprehensionOperatorAnalyzers,
	...comprehensionDataAnalyzers,
];

/** Program analyzers: each fires once on the full AST. */
const PROGRAM_ANALYZERS: readonly ProgramAnalyzerEntry[] = [
	...consistencyAnalyzers,
	...comprehensionGenericAnalyzers,
	...voiceProfileAnalyzers,
];

// ─── Walk + run (functional; questions and errors accumulate as data) ──

type AnalysisResult = {
	readonly questions: readonly CodeQuestion[];
	readonly errors: readonly AnalyzerError[];
};

/** Runs every point analyzer on `node`, then recurses its children (pre-order). */
function walkAndAnalyze(
	node: Node,
	scope: ScopeUsage,
	source: string,
): AnalysisResult {
	const here = POINT_ANALYZERS.map((entry) =>
		runPointAnalyzer(node, scope, source, entry),
	);
	const children = getChildNodes(node).map((child) =>
		walkAndAnalyze(child, scope, source),
	);
	return mergeResults([...here, ...children]);
}

/** Runs every program analyzer once on the whole AST. */
function runProgramAnalyzers(
	ast: Node,
	scope: ScopeUsage,
	source: string,
): AnalysisResult {
	return mergeResults(
		PROGRAM_ANALYZERS.map((entry) =>
			runProgramAnalyzer(ast, scope, source, entry),
		),
	);
}

/** A point analyzer's outcome: at most one question, or a collected error. */
function runPointAnalyzer(
	node: Node,
	scope: ScopeUsage,
	source: string,
	entry: AnalyzerEntry,
): AnalysisResult {
	try {
		const question = entry.analyze(node, scope, source);
		return { questions: question === null ? [] : [question], errors: [] };
	} catch (error: unknown) {
		return { questions: [], errors: [analyzerError(entry.id, error)] };
	}
}

/** A program analyzer's outcome: zero or more questions, or a collected error. */
function runProgramAnalyzer(
	ast: Node,
	scope: ScopeUsage,
	source: string,
	entry: ProgramAnalyzerEntry,
): AnalysisResult {
	try {
		return { questions: entry.analyze(ast, scope, source), errors: [] };
	} catch (error: unknown) {
		return { questions: [], errors: [analyzerError(entry.id, error)] };
	}
}

/** Concatenates a list of analysis results into one. */
function mergeResults(results: readonly AnalysisResult[]): AnalysisResult {
	return {
		questions: results.flatMap((result) => result.questions),
		errors: results.flatMap((result) => result.errors),
	};
}

/** Builds a degraded-analyzer record from a thrown value. */
function analyzerError(analyzerId: string, error: unknown): AnalyzerError {
	return {
		analyzerId,
		message: error instanceof Error ? error.message : 'Unknown analyzer error',
	};
}

/** Builds the frozen refusal result from a failed stage's cause. */
function refusal(cause: StageCause): MicroDecisionResult {
	return freezeInPlace({
		ok: false as const,
		error: {
			message: cause.message,
			// Compared to `undefined`, not truthiness — offset 0 must survive.
			...(cause.offset === undefined ? {} : { offset: cause.offset }),
		},
	});
}
