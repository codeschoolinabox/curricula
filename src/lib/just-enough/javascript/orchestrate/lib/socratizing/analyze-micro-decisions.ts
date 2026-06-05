/**
 * @file Main entry point for the micro-decisions module.
 *
 * @remarks Pure function: embodiment in, frozen result out.
 * Reads source and AST from the embodiment, builds scope, runs
 * all analyzers, filters by config, and returns a discriminated
 * union result.
 */

import type { Node } from 'acorn';

import getChildNodes from '../../../embody/lib/parse-old/get-child-nodes.js';
import buildScope from '../../../embody/lib/scope/build-scope.js';
import type { ScopeAnalysis } from '../../../embody/lib/scope/types.js';
import type { Snippet } from '../../../embody/types.js';

// ─── Analyzer registry ─────────────────────────────────────

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
import type {
	AnalyzerError,
	CodeQuestion,
	MicroDecisionConfig,
	MicroDecisionResult,
	PointAnalyzer,
	ProgramAnalyzer,
} from './types.js';

/** Point analyzers: each fires on every AST node. */
const POINT_ANALYZERS: ReadonlyArray<{
	id: string;
	analyze: PointAnalyzer;
}> = [
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
const PROGRAM_ANALYZERS: ReadonlyArray<{
	id: string;
	analyze: ProgramAnalyzer;
}> = [
	...consistencyAnalyzers,
	...comprehensionGenericAnalyzers,
	...voiceProfileAnalyzers,
];

// ─── AST walk ──────────────────────────────────────────────

/**
 * Walks the AST, running point analyzers on each node.
 */
function walkAndAnalyze(
	node: Node,
	scope: ScopeAnalysis,
	source: string,
	pointAnalyzers: ReadonlyArray<{ id: string; analyze: PointAnalyzer }>,
	questions: CodeQuestion[],
	errors: AnalyzerError[],
): void {
	for (const { id, analyze } of pointAnalyzers) {
		try {
			const result = analyze(node, scope, source);
			if (result !== null) {
				questions.push(result);
			}
		} catch (error: unknown) {
			errors.push({
				analyzerId: id,
				message:
					error instanceof Error ? error.message : 'Unknown analyzer error',
			});
		}
	}

	for (const child of getChildNodes(node)) {
		walkAndAnalyze(child, scope, source, pointAnalyzers, questions, errors);
	}
}

// ─── Main function ─────────────────────────────────────────

/**
 * Analyzes JeJ source code for micro-decisions and comprehension questions.
 *
 * @remarks Pure function. Reads source and AST from the embodiment.
 * Works in Node and browsers. All config fields are optional — omitting
 * means "include everything."
 *
 * Returns `{ ok: false }` when the embodiment has no parsed AST
 * (i.e. `status.parsed === false` or `raw.ast` is null).
 *
 * Analyzers receive `embodiment.raw.ast` (raw acorn `Node`), not the
 * augmented graph. `extract-location.ts` and all analyzer files in
 * `analyzers/` operate on raw acorn nodes.
 *
 * @param embodiment - Frozen Snippet from `embody()`. Source is read from
 *   `source.code`; AST from `raw.ast` (when `status.parsed`).
 * @param config - Optional filtering configuration.
 * @returns A frozen `MicroDecisionResult`.
 */
function analyzeMicroDecisions(
	embodiment: Snippet,
	config: MicroDecisionConfig = {},
): MicroDecisionResult {
	// 1. Read source from embodiment
	const source = embodiment.source.code;

	// 2. Read AST from embodiment (when parsed).
	// Per embody contract: status.parsed === true ⇒ raw.ast !== null;
	// the `&& raw.ast` check is structurally redundant given the contract
	// but type-narrows for the compiler.
	const ast: Node | null =
		embodiment.status.parsed && embodiment.raw.ast ? embodiment.raw.ast : null;

	if (ast === null) {
		const embodyError = embodiment.errors;
		return Object.freeze({
			ok: false as const,
			error: {
				message: embodyError?.message ?? 'Snippet did not produce an AST',
				...(embodyError?.loc != null
					? { location: embodyError.loc.start }
					: {}),
			},
		});
	}

	// 3. Build scope
	const scope = buildScope(ast);

	// 4. Walk AST with point analyzers
	const questions: CodeQuestion[] = [];
	const errors: AnalyzerError[] = [];

	walkAndAnalyze(ast, scope, source, POINT_ANALYZERS, questions, errors);

	// 5. Run program analyzers
	for (const { id, analyze } of PROGRAM_ANALYZERS) {
		try {
			const results = analyze(ast, scope, source);
			questions.push(...results);
		} catch (error: unknown) {
			errors.push({
				analyzerId: id,
				message:
					error instanceof Error ? error.message : 'Unknown analyzer error',
			});
		}
	}

	// 6. Filter by config
	const filtered = filterQuestions(questions, config);

	// 7. Return result
	const result: MicroDecisionResult = {
		ok: true as const,
		questions: filtered,
		...(errors.length > 0 ? { analyzerErrors: Object.freeze(errors) } : {}),
	};

	return Object.freeze(result);
}

export default analyzeMicroDecisions;
