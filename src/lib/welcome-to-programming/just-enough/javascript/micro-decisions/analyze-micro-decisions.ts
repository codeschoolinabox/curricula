/**
 * @file Main entry point for the micro-decisions module.
 *
 * @remarks Pure function: source string in, frozen result out.
 * Parses internally, builds scope, runs all analyzers, filters
 * by config, and returns a discriminated union result.
 */

import buildScope from '../scope/build-scope.js';
import getChildNodes from '../validating/get-child-nodes.js';

import type { Node } from 'acorn';
import type { ScopeAnalysis } from '../scope/types.js';

import filterQuestions from './filter-questions.js';
import parseSource from './parse-source.js';

import type {
	AnalyzerError,
	CodeQuestion,
	MicroDecisionConfig,
	MicroDecisionResult,
	PointAnalyzer,
	ProgramAnalyzer,
} from './types.js';

// ─── Analyzer registry ─────────────────────────────────────

import letVsConst from './analyzers/voice.js';

/** Point analyzers: each fires on every AST node. */
const POINT_ANALYZERS: ReadonlyArray<{
	id: string;
	analyze: PointAnalyzer;
}> = [{ id: 'let-vs-const', analyze: letVsConst }];

/** Program analyzers: each fires once on the full AST. */
const PROGRAM_ANALYZERS: ReadonlyArray<{
	id: string;
	analyze: ProgramAnalyzer;
}> = [];

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
					error instanceof Error
						? error.message
						: 'Unknown analyzer error',
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
 * @remarks Pure function. Parses internally. Works in Node and browsers.
 * All config fields are optional — omitting means "include everything."
 *
 * @param source - Raw JeJ source code.
 * @param config - Optional filtering configuration.
 * @returns A frozen `MicroDecisionResult`.
 */
function analyzeMicroDecisions(
	source: string,
	config: MicroDecisionConfig = {},
): MicroDecisionResult {
	// 1. Parse
	const parseResult = parseSource(source);
	if (!parseResult.ok) {
		return Object.freeze({
			ok: false as const,
			error: parseResult.error,
		});
	}

	const ast = parseResult.ast;

	// 2. Build scope
	const scope = buildScope(ast);

	// 3. Walk AST with point analyzers
	const questions: CodeQuestion[] = [];
	const errors: AnalyzerError[] = [];

	walkAndAnalyze(ast, scope, source, POINT_ANALYZERS, questions, errors);

	// 4. Run program analyzers
	for (const { id, analyze } of PROGRAM_ANALYZERS) {
		try {
			const results = analyze(ast, scope, source);
			questions.push(...results);
		} catch (error: unknown) {
			errors.push({
				analyzerId: id,
				message:
					error instanceof Error
						? error.message
						: 'Unknown analyzer error',
			});
		}
	}

	// 5. Filter by config
	const filtered = filterQuestions(questions, config);

	// 6. Return result
	const result: MicroDecisionResult = {
		ok: true as const,
		questions: filtered,
		...(errors.length > 0 ? { analyzerErrors: Object.freeze(errors) } : {}),
	};

	return Object.freeze(result);
}

export default analyzeMicroDecisions;
