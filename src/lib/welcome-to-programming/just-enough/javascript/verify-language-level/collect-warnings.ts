import type { Node } from 'acorn';

import createViolation from './create-violation.js';
import getChildNodes from './get-child-nodes.js';

import type { Violation } from './types.js';

/**
 * Collects warnings from a parsed AST and source text.
 *
 * @remarks Warnings are pre-linting training wheels for beginners.
 * They flag syntax that is obviously misused, overlooked, or
 * misunderstood — things a student would write by accident or
 * ignorance, not by deliberate choice.
 *
 * Warnings never invalidate the program (`severity: 'warning'`).
 *
 * Categories:
 * - **AST-based**: `'use strict'` directive, unused expressions,
 *   camelCase naming, empty blocks, assignment-in-condition,
 *   unreachable code
 * - **Source-text-based**: tabs-not-spaces, trailing newline
 *
 * @param ast - The root AST node (typically `Program`).
 * @param source - The raw source text (for text-based checks).
 * @returns A frozen array of warning-severity {@link Violation}s.
 */
function collectWarnings(ast: Node, source: string): readonly Violation[] {
	const warnings: Violation[] = [];

	// AST-based warnings
	walkWarnings(ast, warnings);

	// Source-text-based warnings
	checkMissingSemicolons(ast, source, warnings);
	checkUnnecessarySemicolonsAfterBlocks(ast, source, warnings);
	checkTabsNotSpaces(source, warnings);
	checkTrailingNewline(source, warnings);

	return Object.freeze(warnings);
}

// -- AST-based warning checks --

/**
 * Recursive AST walk for warning detection.
 */
function walkWarnings(node: Node, warnings: Violation[]): void {
	const record = node as unknown as Record<string, unknown>;

	switch (node.type) {
		case 'ExpressionStatement': {
			checkUseStrict(node, record, warnings);
			checkUnusedExpression(node, record, warnings);
			break;
		}

		case 'VariableDeclarator': {
			checkCamelCase(node, record, warnings);
			break;
		}

		case 'BlockStatement': {
			checkEmptyBlock(node, record, warnings);
			checkUnreachableCode(record, warnings);
			break;
		}

		case 'IfStatement': {
			checkAssignmentInCondition(node, record, 'test', warnings);
			break;
		}

		case 'WhileStatement': {
			checkAssignmentInCondition(node, record, 'test', warnings);
			break;
		}

		case 'EmptyStatement': {
			warnings.push(
				createViolation(
					'EmptyStatement',
					'Unnecessary semicolon — remove the extra `;`',
					extractLocation(node),
					'warning',
				),
			);
			break;
		}
	}

	// Always recurse into children
	for (const child of getChildNodes(node)) {
		walkWarnings(child, warnings);
	}
}

/**
 * Warns about `'use strict'` directive — redundant in module mode.
 */
function checkUseStrict(
	node: Node,
	record: Record<string, unknown>,
	warnings: Violation[],
): void {
	const expr = record.expression as Record<string, unknown> | null;
	if (!expr) return;

	if (
		expr.type === 'Literal' &&
		expr.value === 'use strict'
	) {
		warnings.push(
			createViolation(
				'ExpressionStatement',
				"'use strict' is redundant — modules are always in strict mode",
				extractLocation(node),
				'warning',
			),
		);
	}
}

/**
 * Warns about expression statements whose result is not used.
 *
 * @remarks Only `CallExpression` and `AssignmentExpression` are
 * valid statement expressions. Everything else (literals, binary
 * ops, member access, typeof) is likely a mistake.
 *
 * Note: `'use strict'` directives also trigger this — that's fine,
 * they get doubly warned (redundant + unused).
 */
function checkUnusedExpression(
	node: Node,
	record: Record<string, unknown>,
	warnings: Violation[],
): void {
	const expr = record.expression as Record<string, unknown> | null;
	if (!expr) return;

	const type = expr.type as string;
	if (type === 'CallExpression' || type === 'AssignmentExpression') {
		return;
	}

	warnings.push(
		createViolation(
			'ExpressionStatement',
			'Expression result is not used — did you mean to assign it or call a function?',
			extractLocation(node),
			'warning',
		),
	);
}

/**
 * Warns about non-camelCase variable names.
 *
 * @remarks Pattern: `/^[a-z][a-zA-Z0-9]*$/` — starts with lowercase,
 * then any alphanumeric. Single letters pass. Underscores and
 * leading uppercase fail.
 */
function checkCamelCase(
	_node: Node,
	record: Record<string, unknown>,
	warnings: Violation[],
): void {
	const id = record.id as Record<string, unknown> | null;
	if (!id || id.type !== 'Identifier') return;

	const name = id.name as string;
	const CAMEL_CASE = /^[a-z][a-zA-Z0-9]*$/;
	if (!CAMEL_CASE.test(name)) {
		warnings.push(
			createViolation(
				'VariableDeclarator',
				`'${name}' is not in camelCase — use names like 'myVariable' or 'count'`,
				extractLocation(id as unknown as Node),
				'warning',
			),
		);
	}
}

/**
 * Warns about empty block statements.
 */
function checkEmptyBlock(
	node: Node,
	record: Record<string, unknown>,
	warnings: Violation[],
): void {
	const body = record.body as unknown[];
	if (body.length === 0) {
		warnings.push(
			createViolation(
				'BlockStatement',
				'Empty block — did you forget to add code inside the curly braces?',
				extractLocation(node),
				'warning',
			),
		);
	}
}

/**
 * Warns about assignment expressions used as conditions.
 *
 * @remarks Catches `if (x = 5)` and `while (x = 0)` — beginners
 * confuse `=` with `===`.
 */
function checkAssignmentInCondition(
	node: Node,
	record: Record<string, unknown>,
	testKey: string,
	warnings: Violation[],
): void {
	const test = record[testKey] as Record<string, unknown> | null;
	if (!test) return;

	if (test.type === 'AssignmentExpression') {
		warnings.push(
			createViolation(
				node.type,
				"Assignment '=' in condition — did you mean '===' for comparison?",
				extractLocation(node),
				'warning',
			),
		);
	}
}

/**
 * Warns about unreachable code after break/continue in a block.
 */
function checkUnreachableCode(
	record: Record<string, unknown>,
	warnings: Violation[],
): void {
	const body = record.body as Node[];
	for (let i = 0; i < body.length - 1; i++) {
		const stmt = body[i];
		if (
			stmt.type === 'BreakStatement' ||
			stmt.type === 'ContinueStatement'
		) {
			const next = body[i + 1];
			warnings.push(
				createViolation(
					next.type,
					`Unreachable code after '${stmt.type === 'BreakStatement' ? 'break' : 'continue'}'`,
					extractLocation(next),
					'warning',
				),
			);
		}
	}
}

// -- Source-text-based warning checks --

/**
 * Statement types that should end with a semicolon.
 */
const SEMICOLON_REQUIRED = new Set([
	'VariableDeclaration',
	'ExpressionStatement',
	'BreakStatement',
	'ContinueStatement',
]);

/**
 * Warns about missing semicolons on statements that should have them.
 *
 * @remarks Checks `VariableDeclaration`, `ExpressionStatement`,
 * `BreakStatement`, `ContinueStatement`. Skips block-bodied
 * statements (if/while/for-of) and `EmptyStatement` (which IS a
 * semicolon). Uses `source.charAt(node.end - 1)` to check.
 */
function checkMissingSemicolons(
	ast: Node,
	source: string,
	warnings: Violation[],
): void {
	walkForSemicolons(ast, source, warnings);
}

/**
 * Recursive walk for missing semicolon detection.
 */
function walkForSemicolons(
	node: Node,
	source: string,
	warnings: Violation[],
): void {
	const record = node as unknown as Record<string, unknown>;

	if (SEMICOLON_REQUIRED.has(node.type)) {
		if (source.charAt(node.end - 1) !== ';') {
			warnings.push(
				createViolation(
					node.type,
					'Missing semicolon — add `;` at the end of the statement',
					extractLocation(node),
					'warning',
				),
			);
		}
	}

	// Recurse into block bodies
	if (node.type === 'Program' || node.type === 'BlockStatement') {
		const body = record.body as Node[];
		for (const child of body) {
			walkForSemicolons(child, source, warnings);
		}
	} else if (
		node.type === 'IfStatement' ||
		node.type === 'WhileStatement' ||
		node.type === 'ForOfStatement'
	) {
		// Recurse into control flow bodies
		for (const child of getChildNodes(node)) {
			if (child.type === 'BlockStatement') {
				walkForSemicolons(child, source, warnings);
			}
		}
	}
}

/**
 * Warns about `;` immediately after `}` of block-bodied control flow.
 *
 * @remarks Catches `if (true) {};` and `while (false) {};` — beginners
 * sometimes add a semicolon after closing braces out of habit.
 */
function checkUnnecessarySemicolonsAfterBlocks(
	ast: Node,
	source: string,
	warnings: Violation[],
): void {
	walkForUnnecessarySemicolons(ast, source, warnings);
}

/**
 * Recursive walk for unnecessary semicolons after blocks.
 */
function walkForUnnecessarySemicolons(
	node: Node,
	source: string,
	warnings: Violation[],
): void {
	const record = node as unknown as Record<string, unknown>;

	if (
		node.type === 'IfStatement' ||
		node.type === 'WhileStatement' ||
		node.type === 'ForOfStatement'
	) {
		// Check if the character after this statement's end is `;`
		const nextChar = source.charAt(node.end);
		if (nextChar === ';') {
			const line =
				source.substring(0, node.end + 1).split('\n').length;
			warnings.push(
				createViolation(
					node.type,
					'Unnecessary semicolon after closing brace — remove the `;`',
					{
						start: { line, column: 0 },
						end: { line, column: 0 },
					},
					'warning',
				),
			);
		}
	}

	// Recurse
	if (node.type === 'Program' || node.type === 'BlockStatement') {
		const body = record.body as Node[];
		for (const child of body) {
			walkForUnnecessarySemicolons(child, source, warnings);
		}
	} else {
		for (const child of getChildNodes(node)) {
			walkForUnnecessarySemicolons(child, source, warnings);
		}
	}
}

/**
 * Warns about leading spaces (should use tabs for accessibility).
 *
 * @remarks Tabs are more accessible — each user can configure
 * their preferred visual width. Only flags lines that have
 * leading spaces followed by non-whitespace content.
 */
function checkTabsNotSpaces(source: string, warnings: Violation[]): void {
	const lines = source.split('\n');
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		// Only flag lines with leading spaces before non-whitespace
		if (/^ +\S/.test(line)) {
			warnings.push(
				createViolation(
					'Program',
					'Use tabs for indentation, not spaces — tabs are more accessible',
					{
						start: { line: i + 1, column: 0 },
						end: { line: i + 1, column: line.length },
					},
					'warning',
				),
			);
		}
	}
}

/**
 * Warns when source doesn't end with exactly one newline.
 *
 * @remarks Files should end with exactly one `\n`. Missing newline
 * or multiple trailing newlines/blank lines both produce a warning.
 * Empty source is exempt (nothing to check).
 */
function checkTrailingNewline(source: string, warnings: Violation[]): void {
	if (source.length === 0) return;

	const lines = source.split('\n');
	const lastLine = lines.length;

	if (!source.endsWith('\n')) {
		warnings.push(
			createViolation(
				'Program',
				'File should end with a newline character',
				{
					start: { line: lastLine, column: 0 },
					end: { line: lastLine, column: 0 },
				},
				'warning',
			),
		);
	} else if (source.endsWith('\n\n')) {
		warnings.push(
			createViolation(
				'Program',
				'File should end with exactly one newline — remove extra blank lines at the end',
				{
					start: { line: lastLine, column: 0 },
					end: { line: lastLine, column: 0 },
				},
				'warning',
			),
		);
	}
}

/**
 * Extracts a source range from an acorn node's `loc` property.
 */
function extractLocation(node: Node) {
	const loc = node.loc;
	if (loc) {
		return {
			start: { line: loc.start.line, column: loc.start.column },
			end: { line: loc.end.line, column: loc.end.column },
		};
	}
	return {
		start: { line: 1, column: 0 },
		end: { line: 1, column: 0 },
	};
}

export default collectWarnings;
