import checkUndeclaredGlobals from './check-undeclared-globals.js';
import collectViolations from './collect-violations.js';
import parseProgram from './parse-program.js';

import type { LanguageLevel, ValidationReport } from './types.js';

/**
 * Validates a JavaScript program against a language level.
 *
 * @remarks This is the main entry point for the validation pipeline.
 * Composes parsing and violation collection into a single frozen
 * {@link ValidationReport}.
 *
 * The pipeline:
 * 1. **Parse** — converts source to AST via acorn in module mode.
 *    If parsing fails, returns immediately with `parseError` set
 *    and `isValid: false`.
 * 2. **Collect violations** — walks every AST node, checking each
 *    against the language level's allowlist.
 * 3. **Scope analysis** — tracks variable declarations per block
 *    scope, flags undeclared identifiers (error), unused variables
 *    (warning), and variable shadowing (warning).
 * 4. **Build report** — freezes everything and returns.
 *
 * Always parses in module mode (`sourceType: 'module'`). This means
 * `import`/`export` syntax is accepted by the parser and strict mode
 * is implicit — no `'use strict'` directive needed.
 *
 * Never throws. Parse errors are captured in the report. This is
 * essential for educational tools where student code frequently has
 * syntax errors that must be reported gracefully, not as exceptions.
 *
 * @param source - The raw JavaScript source code to validate.
 * @param languageLevel - The {@link LanguageLevel} configuration
 *   defining which syntax is allowed. Typically `justEnoughJs` but
 *   can be any custom level.
 * @returns A frozen {@link ValidationReport} with all violations
 *   found (or a parse error if the source is syntactically invalid).
 */
function validateProgram(
	source: string,
	languageLevel: LanguageLevel,
): ValidationReport {
	// 1. Parse — always module mode
	const parseResult = parseProgram(source, 'module');

	// parse error — return early with empty violations
	if ('message' in parseResult) {
		return Object.freeze({
			isValid: false,
			violations: Object.freeze([]),
			source,
			levelName: languageLevel.name,
			parseError: parseResult,
		});
	}

	// 2. Collect node violations
	const nodeViolations = collectViolations(parseResult, languageLevel.nodes);

	// 3. Scope analysis — undeclared globals, unused vars, shadowing
	const scopeViolations = languageLevel.allowedGlobals
		? checkUndeclaredGlobals(parseResult, languageLevel.allowedGlobals)
		: [];

	const violations = Object.freeze([
		...nodeViolations,
		...scopeViolations,
	]);

	// 4. Build report
	return Object.freeze({
		isValid: violations.every((v) => v.severity !== 'error'),
		violations,
		source,
		levelName: languageLevel.name,
	});
}

export default validateProgram;
