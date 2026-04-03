import type { Node, Program } from 'acorn';

import checkUndeclaredGlobals from './check-undeclared-globals.js';
import collectViolations from './collect-violations.js';
import parseProgram from './parse-program.js';
import getChildNodes from './get-child-nodes.js';

import type { LanguageLevel, ParseError, ValidationReport } from './types.js';

/**
 * Validates a JavaScript program against a language level.
 *
 * @remarks This is the main entry point for the validation pipeline.
 * Composes parsing and violation collection into a single frozen
 * {@link ValidationReport}.
 *
 * The pipeline:
 * 1. **Parse** — converts source to AST via acorn. Tries module mode
 *    first. If module parse fails, tries script mode; if the script
 *    AST contains a `WithStatement`, uses the script AST and sets
 *    `scriptMode: true` on the report. Otherwise keeps the original
 *    module parse error.
 * 2. **Collect violations** — walks every AST node, checking each
 *    against the language level's allowlist.
 * 3. **Scope analysis** — tracks variable declarations per block
 *    scope, flags disallowed globals (rejection).
 * 4. **Build report** — freezes everything and returns.
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
	// 1. Parse — try module mode first
	const moduleResult = parseProgram(source, 'module');

	let ast: Program;
	let scriptMode = false;

	if ('message' in moduleResult) {
		// Module parse failed — try script-mode fallback for `with`
		const scriptResult = parseProgram(source, 'script');

		if ('message' in scriptResult) {
			// Both failed — report the module error
			return Object.freeze({
				isValid: false,
				violations: Object.freeze([]),
				source,
				levelName: languageLevel.name,
				parseError: moduleResult,
			});
		}

		// Script parsed — only use it if the AST contains WithStatement
		if (hasWithStatement(scriptResult)) {
			ast = scriptResult;
			scriptMode = true;
		} else {
			// No `with` — keep the module error (something else was wrong)
			return Object.freeze({
				isValid: false,
				violations: Object.freeze([]),
				source,
				levelName: languageLevel.name,
				parseError: moduleResult,
			});
		}
	} else {
		ast = moduleResult;
	}

	// 2. Collect node violations
	const nodeViolations = collectViolations(ast, languageLevel.nodes);

	// 3. Scope analysis — disallowed globals
	const scopeViolations = languageLevel.allowedGlobals
		? checkUndeclaredGlobals(ast, languageLevel.allowedGlobals)
		: [];

	const violations = Object.freeze([
		...nodeViolations,
		...scopeViolations,
	]);

	// 4. Build report
	const report: ValidationReport = {
		isValid: violations.length === 0,
		violations,
		source,
		levelName: languageLevel.name,
	};

	if (scriptMode) {
		return Object.freeze({ ...report, scriptMode: true });
	}

	return Object.freeze(report);
}

/**
 * Checks whether an AST contains a `WithStatement` node at any depth.
 *
 * @remarks Used to decide whether a script-mode parse should replace
 * a failed module-mode parse. Only `with` justifies the fallback —
 * other strict-mode differences (octal literals, duplicate params)
 * should still report the module error.
 */
function hasWithStatement(ast: Node): boolean {
	if (ast.type === 'WithStatement') return true;
	for (const child of getChildNodes(ast)) {
		if (hasWithStatement(child)) return true;
	}
	return false;
}

export default validateProgram;
