import type { Node } from 'acorn';

import createViolation from './create-violation.js';

import type { LanguageLevel, NodeRule, Violation } from './types.js';

// -- constraint validators --
// Each validator is a NodeValidator: (node: Node) => true | Violation.
// They inspect node-specific properties (kind, operator, etc.) that
// acorn's minimal Node type doesn't expose, so we cast through
// Record<string, unknown> to access them safely.

/**
 * Validates that a variable declaration uses `let` or `const` with
 * exactly one declarator.
 *
 * @remarks Rejects `var` (legacy scoping rules confuse beginners).
 * Also rejects multi-declarations like `let a, b` — one variable per
 * statement keeps code readable and prevents beginners from hiding
 * declarations.
 */
function validateVariableDeclaration(node: Node): true | Violation {
	const record = node as unknown as Record<string, unknown>;
	const kind = record.kind as string;
	const declarations = record.declarations as unknown[];

	if (kind !== 'let' && kind !== 'const') {
		return createViolation(
			'VariableDeclaration',
			`'${kind}' declarations are not allowed — use 'let' or 'const'`,
			extractLocation(node),
		);
	}

	if (declarations.length !== 1) {
		return createViolation(
			'VariableDeclaration',
			'Only one variable per declaration — use separate statements',
			extractLocation(node),
		);
	}

	return true;
}

/**
 * Validates that only `=` assignment is used.
 *
 * @remarks Rejects compound assignment operators (`+=`, `-=`, `*=`,
 * etc.) because they introduce two concepts at once (assignment +
 * arithmetic) and learners haven't been introduced to them yet.
 * The `=` operator is the only assignment form in JeJ.
 */
function validateAssignmentExpression(node: Node): true | Violation {
	const operator = (node as unknown as Record<string, unknown>)
		.operator as string;
	if (operator === '=') return true;
	return createViolation(
		'AssignmentExpression',
		`Assignment operator '${operator}' is not allowed — use '=' only`,
		extractLocation(node),
	);
}

/**
 * Binary operators allowed in JeJ: equality, comparison, arithmetic.
 *
 * @remarks Deliberately excludes `==`, `!=` (loose equality is a
 * beginner trap), bitwise operators (`&`, `|`, `^`, `<<`, `>>`),
 * `in`, and `instanceof` (object-oriented concepts not in JeJ).
 */
const ALLOWED_BINARY_OPERATORS = new Set([
	'===',
	'!==',
	'+',
	'-',
	'*',
	'/',
	'%',
	'**',
	'>',
	'<',
	'>=',
	'<=',
]);

/**
 * Validates that a binary expression uses an allowed operator.
 *
 * @remarks Checks the `operator` property against
 * {@link ALLOWED_BINARY_OPERATORS}. The violation message includes
 * the rejected operator so learners know exactly what's wrong.
 */
function validateBinaryExpression(node: Node): true | Violation {
	const operator = (node as unknown as Record<string, unknown>)
		.operator as string;
	if (ALLOWED_BINARY_OPERATORS.has(operator)) return true;
	return createViolation(
		'BinaryExpression',
		`Binary operator '${operator}' is not allowed`,
		extractLocation(node),
	);
}

/**
 * Logical operators allowed in JeJ: AND, OR, nullish coalescing.
 *
 * @remarks All three standard logical operators are included.
 * `??` (nullish coalescing) is a safe, readable pattern for
 * default values that beginners encounter in real code.
 */
const ALLOWED_LOGICAL_OPERATORS = new Set(['&&', '||', '??']);

/**
 * Validates that a logical expression uses an allowed operator.
 *
 * @remarks Checks against {@link ALLOWED_LOGICAL_OPERATORS}.
 */
function validateLogicalExpression(node: Node): true | Violation {
	const operator = (node as unknown as Record<string, unknown>)
		.operator as string;
	if (ALLOWED_LOGICAL_OPERATORS.has(operator)) return true;
	return createViolation(
		'LogicalExpression',
		`Logical operator '${operator}' is not allowed`,
		extractLocation(node),
	);
}

/**
 * Unary operators allowed in JeJ: type checking, negation, minus.
 *
 * @remarks `typeof` is essential for type checking in exercises.
 * `!` (logical NOT) and `-` (numeric negation) are basic operators.
 * Excludes `+` (unary plus — confusing type coercion), `~` (bitwise
 * NOT), `void`, and `delete`.
 */
const ALLOWED_UNARY_OPERATORS = new Set(['typeof', '!', '-']);

/**
 * Validates that a unary expression uses an allowed operator.
 *
 * @remarks Checks against {@link ALLOWED_UNARY_OPERATORS}.
 */
function validateUnaryExpression(node: Node): true | Violation {
	const operator = (node as unknown as Record<string, unknown>)
		.operator as string;
	if (ALLOWED_UNARY_OPERATORS.has(operator)) return true;
	return createViolation(
		'UnaryExpression',
		`Unary operator '${operator}' is not allowed`,
		extractLocation(node),
	);
}

/**
 * Validates that a literal is a basic type (string, number, boolean,
 * null, undefined).
 *
 * @remarks Rejects regex literals (`/pattern/flags` — acorn marks
 * these with a `regex` property) and BigInt literals (`123n` — acorn
 * marks these with a `bigint` property). Both are advanced features
 * outside JeJ's scope. Regular string, number, boolean, null, and
 * undefined literals all pass.
 */
function validateLiteral(node: Node): true | Violation {
	const record = node as unknown as Record<string, unknown>;
	if (record.regex) {
		return createViolation(
			'Literal',
			'Regular expression literals are not allowed',
			extractLocation(node),
		);
	}
	if (record.bigint !== undefined) {
		return createViolation(
			'Literal',
			'BigInt literals are not allowed',
			extractLocation(node),
		);
	}
	return true;
}

/**
 * Validates that an if statement uses block bodies (curly braces).
 *
 * @remarks Braceless control flow is dangerous for beginners —
 * dangling else, accidentally adding a second line that looks
 * indented but isn't in the block. JeJ requires `{}` on all
 * branches. The `alternate` may be `null` (no else), a
 * `BlockStatement` (else with braces), or an `IfStatement`
 * (else-if chain).
 */
function validateIfStatement(node: Node): true | Violation {
	const record = node as unknown as Record<string, unknown>;
	const consequent = record.consequent as { type: string };
	const alternate = record.alternate as { type: string } | null;

	if (consequent.type !== 'BlockStatement') {
		return createViolation(
			'IfStatement',
			'if/else bodies must use curly braces `{}`',
			extractLocation(node),
		);
	}

	if (
		alternate !== null &&
		alternate.type !== 'BlockStatement' &&
		alternate.type !== 'IfStatement'
	) {
		return createViolation(
			'IfStatement',
			'if/else bodies must use curly braces `{}`',
			extractLocation(node),
		);
	}

	return true;
}

/**
 * Validates that a while statement uses a block body (curly braces).
 *
 * @remarks Same reasoning as {@link validateIfStatement} — braceless
 * loops are error-prone for beginners.
 */
function validateWhileStatement(node: Node): true | Violation {
	const body = (node as unknown as Record<string, unknown>).body as {
		type: string;
	};

	if (body.type !== 'BlockStatement') {
		return createViolation(
			'WhileStatement',
			'while body must use curly braces `{}`',
			extractLocation(node),
		);
	}

	return true;
}

/**
 * Validates a for-of statement: block body required, `const` head
 * preferred.
 *
 * @remarks Two checks with different severities:
 * 1. Body must be `BlockStatement` — **rejection** (same as if/while).
 * 2. Head should use `const` — **warning** (convention, not a hard
 *    rule). The iteration variable shouldn't be reassigned, so
 *    `const` is the right default. `let` works but suggests the
 *    learner doesn't know the convention yet.
 *
 * If both apply (braceless + let), the rejection takes priority — the
 * `const` hint is noise when the structure itself is wrong.
 */
function validateForOfStatement(node: Node): true | Violation {
	const record = node as unknown as Record<string, unknown>;
	const body = record.body as { type: string };
	const left = record.left as { type: string; kind: string };

	if (body.type !== 'BlockStatement') {
		return createViolation(
			'ForOfStatement',
			'for-of body must use curly braces `{}`',
			extractLocation(node),
		);
	}

	if (left.kind !== 'const') {
		return createViolation(
			'ForOfStatement',
			"use 'const' for the iteration variable in for-of loops",
			extractLocation(node),
			'warning',
		);
	}

	return true;
}

/**
 * Creates a member expression validator that checks property names
 * against a provided allowlist.
 *
 * @remarks Factory pattern — derives the allowed set from the
 * {@link LanguageLevel} config rather than duplicating it as a
 * module-level constant. No type checking — `.log` on a string is
 * a runtime error, not our problem. We only check the property name.
 *
 * Computed access (bracket indexing) is always allowed.
 */
function createMemberValidator(
	allowedNames: ReadonlySet<string>,
): (node: Node) => true | Violation {
	return function validateMemberExpression(node: Node): true | Violation {
		const record = node as unknown as Record<string, unknown>;
		const computed = record.computed as boolean;

		if (computed) return true;

		const property = record.property as { type: string; name: string };
		if (allowedNames.has(property.name)) return true;

		return createViolation(
			'MemberExpression',
			`Property '.${property.name}' is not allowed at this language level`,
			extractLocation(node),
		);
	};
}

/**
 * Validates a call expression: rejects computed member calls like
 * `str['toLowerCase']()`.
 *
 * @remarks Computed method calls are a way to circumvent the
 * property name allowlist — the string `'toLowerCase'` isn't
 * visible as a property name in the AST. This validator catches
 * that pattern. Regular calls (identifier callee, non-computed
 * member callee) pass through.
 */
function validateCallExpression(node: Node): true | Violation {
	const callee = (node as unknown as Record<string, unknown>).callee as {
		type: string;
		computed?: boolean;
	};

	if (callee.type === 'MemberExpression' && callee.computed === true) {
		return createViolation(
			'CallExpression',
			'Computed method calls are not allowed — use dot notation',
			extractLocation(node),
		);
	}

	return true;
}

// -- location helper --

/**
 * Extracts a {@link SourceRange} from an acorn node.
 *
 * @remarks Uses the non-null assertion on `loc` because acorn always
 * provides it when parsed with `locations: true` (which
 * {@link parseProgram} guarantees). Duplicated across validator files
 * (`collect-violations.ts`, `collect-warnings.ts`,
 * `check-undeclared-globals.ts`) to keep each file self-contained.
 */
function extractLocation(node: Node) {
	const loc = node.loc!;
	return {
		start: { line: loc.start.line, column: loc.start.column },
		end: { line: loc.end.line, column: loc.end.column },
	};
}

// -- the language level --

/**
 * Allowed property names for non-computed member expressions.
 *
 * @remarks Single source of truth — used by both the
 * {@link createMemberValidator} factory and exposed on the
 * {@link LanguageLevel} config for external consumers.
 */
const ALLOWED_MEMBER_NAMES: ReadonlySet<string> = Object.freeze(
	new Set([
		// string methods
		'toLowerCase',
		'toUpperCase',
		'includes',
		'replaceAll',
		'trim',
		'trimStart',
		'trimEnd',
		'indexOf',
		'slice',
		'at',
		'concat',
		'repeat',
		'padStart',
		'padEnd',
		// string/readable properties
		'length',
		// console methods
		'log',
		'assert',
		// Number static methods
		'isNaN',
	]),
);

/**
 * The "Just Enough JavaScript" language level configuration.
 *
 * @remarks Defines the ceiling of JS features available in the JeJ
 * curriculum. Must match `reference.md` (the learner-facing cheat
 * sheet) — any drift between code and docs is a bug.
 *
 * The entire object is deeply frozen. The `nodes` record uses the
 * allowlist pattern: any ESTree node type not listed here produces
 * an automatic violation. Node types set to `true` are
 * unconditionally allowed (structural nodes that carry no
 * language-level constraints). Node types mapped to validator
 * functions are allowed only when the validator returns `true`.
 *
 * **What's NOT here is as important as what is.** Absent node types
 * include `FunctionDeclaration`, `ArrowFunctionExpression`,
 * `ClassDeclaration`, `UpdateExpression` (`++`/`--`),
 * `ThrowStatement`, `NewExpression`, and many others. These are
 * blocked by default — learners see a clear "not allowed at this
 * language level" message directing them to the allowed alternative.
 */
const justEnoughJs: LanguageLevel = Object.freeze({
	name: 'Just Enough JavaScript',

	allowedGlobals: Object.freeze(
		new Set([
			'console',
			'alert',
			'confirm',
			'prompt',
			'String',
			'Number',
			'Boolean',
			'undefined',
			'NaN',
			'Infinity',
		]),
	),

	allowedMemberNames: ALLOWED_MEMBER_NAMES,

	nodes: Object.freeze({
		// unconditionally allowed — structural nodes with no
		// language-level constraints
		Program: true,
		ExpressionStatement: true,
		Identifier: true,
		VariableDeclarator: true,
		BlockStatement: true,
		BreakStatement: true,
		ContinueStatement: true,
		EmptyStatement: true,
		TemplateLiteral: true,
		TemplateElement: true,
		ConditionalExpression: true,
		ChainExpression: true,

		// allowed with constraints — validator functions check
		// node-specific properties
		VariableDeclaration: validateVariableDeclaration,
		IfStatement: validateIfStatement,
		WhileStatement: validateWhileStatement,
		ForOfStatement: validateForOfStatement,
		MemberExpression: createMemberValidator(ALLOWED_MEMBER_NAMES),
		CallExpression: validateCallExpression,
		AssignmentExpression: validateAssignmentExpression,
		BinaryExpression: validateBinaryExpression,
		LogicalExpression: validateLogicalExpression,
		UnaryExpression: validateUnaryExpression,
		Literal: validateLiteral,
	} satisfies Record<string, NodeRule>),
});

export default justEnoughJs;
