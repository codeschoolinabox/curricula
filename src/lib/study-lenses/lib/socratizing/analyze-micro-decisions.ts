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

	const { questions, errors } = collectAnalysis(ast.value, scope, source.value);

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

// ─── Walk + run ────────────────────────────────────────────

type AnalysisResult = {
	readonly questions: readonly CodeQuestion[];
	readonly errors: readonly AnalyzerError[];
};

/**
 * Runs every point analyzer over every node (pre-order) and every program
 * analyzer once, accumulating questions and errors.
 *
 * @remarks Flattening a tree in one pass needs a single shared accumulator:
 * this owns two private buffers, appends as it walks, and lets only the readonly
 * `AnalysisResult` escape — a deliberate, contained departure from the "return
 * new objects" default to keep the walk O(n) in the node count (the immutable
 * per-level `flatMap`-merge it replaced was O(n²) on deep/linear ASTs). An
 * analyzer that throws is degraded into an `AnalyzerError`, never propagated.
 */
function collectAnalysis(
	ast: Node,
	scope: ScopeUsage,
	source: string,
): AnalysisResult {
	const questions: CodeQuestion[] = [];
	const errors: AnalyzerError[] = [];

	function walkPoints(node: Node): void {
		for (const entry of POINT_ANALYZERS) {
			try {
				const question = entry.analyze(node, scope, source);
				if (question !== null) {
					questions.push(question);
				}
			} catch (error: unknown) {
				errors.push(analyzerError(entry.id, error));
			}
		}
		for (const child of getChildNodes(node)) {
			walkPoints(child);
		}
	}
	walkPoints(ast);

	for (const entry of PROGRAM_ANALYZERS) {
		try {
			for (const question of entry.analyze(ast, scope, source)) {
				questions.push(question);
			}
		} catch (error: unknown) {
			errors.push(analyzerError(entry.id, error));
		}
	}

	return { questions, errors };
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
