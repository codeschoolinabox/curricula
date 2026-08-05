import type { Node } from 'acorn';

import createViolation from './create-violation.js';
import type { SyntaxAllowlist, NodeRule, Violation } from './types.js';

// -- constraint validators --
// Each validator is a NodeValidator: (node: Node, nodePath: string) => true | Violation.
// They inspect node-specific properties (kind, operator, etc.) that
// acorn's minimal Node type doesn't expose, so we cast through
// Record<string, unknown> to access them safely.

/**
 * Validates that a variable declaration uses `let` or `const`.
 *
 * @remarks Rejects `var` (legacy scoping rules confuse beginners).
 * Multi-declarations like `let a = 1, b = 2` are allowed — learners
 * can explore the expressiveness and readability trade-offs of declaring
 * multiple variables in a single statement.
 */
function validateVariableDeclaration(
	node: Node,
	nodePath: string,
): true | Violation {
	const record = node as unknown as Record<string, unknown>;
	const kind = record.kind as string;

	if (kind !== 'let' && kind !== 'const') {
		return createViolation(
			'VariableDeclaration',
			`'${kind}' declarations are not allowed — use 'let' or 'const'`,
			extractLocation(node),
			nodePath,
		);
	}

	return true;
}

/**
 * Assignment operators allowed in JeJ: simple and compound.
 *
 * @remarks Includes `=` (initialization and reassignment) plus
 * compound operators that combine arithmetic or logic with
 * assignment. Compound forms are shorthand — `x += 1` is
 * equivalent to `x = x + 1`. Includes bitwise-compound assignments
 * (`&=`, `|=`, `^=`, `<<=`, `>>=`, `>>>=`). Note: `++`/`--` are
 * `UpdateExpression` nodes, not `AssignmentExpression`.
 */
const ALLOWED_ASSIGNMENT_OPERATORS = new Set([
	'=',
	'+=',
	'-=',
	'*=',
	'/=',
	'%=',
	'**=',
	'??=',
	'||=',
	'&&=',
	'&=',
	'|=',
	'^=',
	'<<=',
	'>>=',
	'>>>=',
]);

/**
 * Validates that an assignment expression uses an allowed operator
 * and targets a variable (not a property).
 *
 * @remarks Two constraints:
 * 1. Operator must be in {@link ALLOWED_ASSIGNMENT_OPERATORS}.
 * 2. Left-hand side must be an `Identifier` — property assignment
 *    (`obj.prop = value`) is blocked because JeJ has no object
 *    literals, arrays, or constructors, so there's zero valid use
 *    case. This prevents learners from accidentally overwriting
 *    built-in methods (e.g. `console.log = 5`).
 */
function validateAssignmentExpression(
	node: Node,
	nodePath: string,
): true | Violation {
	const record = node as unknown as Record<string, unknown>;
	const operator = record.operator as string;
	const left = record.left as { readonly type: string };

	if (!ALLOWED_ASSIGNMENT_OPERATORS.has(operator)) {
		return createViolation(
			'AssignmentExpression',
			`Assignment operator '${operator}' is not allowed`,
			extractLocation(node),
			nodePath,
		);
	}

	// WHY: JeJ has no object literals, no arrays, no constructors — there
	// is zero valid use case for property assignment. Blocking it prevents
	// learners from accidentally overwriting built-in methods (e.g.
	// `console.log = 5`).
	if (left.type !== 'Identifier') {
		return createViolation(
			'AssignmentExpression',
			'You can only assign to variables — property assignment is not allowed',
			extractLocation(node),
			nodePath,
		);
	}

	return true;
}

/**
 * Validates that an update expression uses `++` or `--`.
 *
 * @remarks Both prefix (`++x`, `--x`) and postfix (`x++`, `x--`)
 * forms are allowed. The `prefix` boolean on the node distinguishes
 * them but is not constrained — any combination is valid JeJ.
 */
function validateUpdateExpression(
	node: Node,
	nodePath: string,
): true | Violation {
	const operator = (node as unknown as Record<string, unknown>)
		.operator as string;
	if (operator === '++' || operator === '--') return true;
	return createViolation(
		'UpdateExpression',
		`Update operator '${operator}' is not allowed`,
		extractLocation(node),
		nodePath,
	);
}

/**
 * Binary operators allowed in JeJ: equality, comparison, arithmetic,
 * bitwise, and membership.
 *
 * @remarks Deliberately excludes `==`, `!=` (loose equality is a
 * beginner trap) and `instanceof` (class-based concept not in JeJ).
 * Bitwise operators (`&`, `|`, `^`, `<<`, `>>`, `>>>`) and `in` ARE
 * included (reference.md bitwise + membership sections).
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
	'&',
	'|',
	'^',
	'<<',
	'>>',
	'>>>',
	'in',
]);

/**
 * Validates that a binary expression uses an allowed operator.
 *
 * @remarks Checks the `operator` property against
 * {@link ALLOWED_BINARY_OPERATORS}. The violation message includes
 * the rejected operator so learners know exactly what's wrong.
 */
function validateBinaryExpression(
	node: Node,
	nodePath: string,
): true | Violation {
	const operator = (node as unknown as Record<string, unknown>)
		.operator as string;
	if (ALLOWED_BINARY_OPERATORS.has(operator)) return true;
	return createViolation(
		'BinaryExpression',
		`Binary operator '${operator}' is not allowed`,
		extractLocation(node),
		nodePath,
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
function validateLogicalExpression(
	node: Node,
	nodePath: string,
): true | Violation {
	const operator = (node as unknown as Record<string, unknown>)
		.operator as string;
	if (ALLOWED_LOGICAL_OPERATORS.has(operator)) return true;
	return createViolation(
		'LogicalExpression',
		`Logical operator '${operator}' is not allowed`,
		extractLocation(node),
		nodePath,
	);
}

/**
 * Unary operators allowed in JeJ: type checking, negation, minus, void.
 *
 * @remarks `typeof` is essential for type checking in exercises.
 * `!` (logical NOT) and `-` (numeric negation) are basic operators.
 * `~` (bitwise NOT) is allowed (reference.md bitwise section). `void`
 * is an easter egg — not in reference.md. Excludes `+` (unary plus —
 * confusing type coercion) and `delete`.
 */
const ALLOWED_UNARY_OPERATORS = new Set(['typeof', '!', '-', '~', 'void']);

/**
 * Validates that a unary expression uses an allowed operator.
 *
 * @remarks Checks against {@link ALLOWED_UNARY_OPERATORS}.
 */
function validateUnaryExpression(
	node: Node,
	nodePath: string,
): true | Violation {
	const operator = (node as unknown as Record<string, unknown>)
		.operator as string;
	if (ALLOWED_UNARY_OPERATORS.has(operator)) return true;
	return createViolation(
		'UnaryExpression',
		`Unary operator '${operator}' is not allowed`,
		extractLocation(node),
		nodePath,
	);
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
function validateIfStatement(node: Node, nodePath: string): true | Violation {
	const record = node as unknown as Record<string, unknown>;
	const consequent = record.consequent as { readonly type: string };
	const alternate = record.alternate as { readonly type: string } | null;

	if (consequent.type !== 'BlockStatement') {
		return createViolation(
			'IfStatement',
			'if/else bodies must use curly braces `{}`',
			extractLocation(node),
			nodePath,
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
			nodePath,
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
function validateWhileStatement(
	node: Node,
	nodePath: string,
): true | Violation {
	const body = (node as unknown as Record<string, unknown>).body as {
		readonly type: string;
	};

	if (body.type !== 'BlockStatement') {
		return createViolation(
			'WhileStatement',
			'while body must use curly braces `{}`',
			extractLocation(node),
			nodePath,
		);
	}

	return true;
}

/**
 * Validates a for-of statement: block body required.
 *
 * @remarks Body must be `BlockStatement` — **rejection** (same as
 * if/while). Both `let` and `const` are accepted for the iteration
 * variable head.
 */
function validateForOfStatement(
	node: Node,
	nodePath: string,
): true | Violation {
	const record = node as unknown as Record<string, unknown>;
	const body = record.body as { readonly type: string };

	if (body.type !== 'BlockStatement') {
		return createViolation(
			'ForOfStatement',
			'for-of body must use curly braces `{}`',
			extractLocation(node),
			nodePath,
		);
	}

	return true;
}

/**
 * Validates a do-while statement: block body required.
 */
function validateDoWhileStatement(
	node: Node,
	nodePath: string,
): true | Violation {
	const body = (node as unknown as Record<string, unknown>).body as {
		readonly type: string;
	};

	if (body.type !== 'BlockStatement') {
		return createViolation(
			'DoWhileStatement',
			'do-while body must use curly braces `{}`',
			extractLocation(node),
			nodePath,
		);
	}

	return true;
}

/**
 * Validates a for statement: block body required.
 */
function validateForStatement(node: Node, nodePath: string): true | Violation {
	const body = (node as unknown as Record<string, unknown>).body as {
		readonly type: string;
	};

	if (body.type !== 'BlockStatement') {
		return createViolation(
			'ForStatement',
			'for body must use curly braces `{}`',
			extractLocation(node),
			nodePath,
		);
	}

	return true;
}

/**
 * Creates a member expression validator that rejects property names on
 * a provided blocklist (allow-all-except-blocklist).
 *
 * @remarks Factory pattern — derives the blocked set from the
 * {@link SyntaxAllowlist} config rather than duplicating it as a
 * module-level constant. No type checking — `.log` on a string is
 * a runtime error, not our problem. We only check the property name.
 *
 * Non-computed dot access to a blocklisted name is a violation; every
 * other dot name passes. Computed access (bracket indexing) is always
 * allowed and never gated — see DOCS.md § Member model (accepted
 * residual hole).
 */
function createMemberValidator(
	blockedNames: ReadonlySet<string>,
): (node: Node, nodePath: string) => true | Violation {
	return function validateMemberExpression(
		node: Node,
		nodePath: string,
	): true | Violation {
		const record = node as unknown as Record<string, unknown>;
		const computed = record.computed as boolean;

		if (computed) return true;

		const property = record.property as {
			readonly type: string;
			readonly name: string;
		};
		if (!blockedNames.has(property.name)) return true;

		return createViolation(
			'MemberExpression',
			`Property '.${property.name}' is not available at this language level`,
			extractLocation(node),
			nodePath,
		);
	};
}

/**
 * Validates a new expression: only `new Date(...)` is allowed.
 *
 * @remarks reference.md makes `new Date()` the sole use of `new` in JeJ
 * (it yields a Date whose methods return primitives). Any other
 * constructor (`new Foo()`, `new RegExp(...)`) is rejected. This is a
 * syntactic name check on the callee identifier, not identity tracking
 * (see DOCS.md decision #5).
 */
function validateNewExpression(node: Node, nodePath: string): true | Violation {
	const callee = (node as unknown as Record<string, unknown>).callee as {
		readonly type: string;
		readonly name?: string;
	};
	if (callee.type === 'Identifier' && callee.name === 'Date') return true;
	return createViolation(
		'NewExpression',
		"'new' is only allowed with Date (new Date()) at this language level",
		extractLocation(node),
		nodePath,
	);
}

// -- location helper --

/**
 * Extracts a {@link SourceRange} from an acorn node.
 *
 * @remarks Uses the non-null assertion on `loc` because acorn always
 * provides it when parsed with `locations: true` (which
 * {@link parseProgram} guarantees). Duplicated across validator files
 * (`collect-violations.ts`, `check-undeclared-globals.ts`) to keep
 * each file self-contained.
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
 * Property names FORBIDDEN in non-computed member expressions.
 *
 * @remarks Single source of truth — used by both the
 * {@link createMemberValidator} factory and exposed on the
 * {@link SyntaxAllowlist} config for external consumers. Two tiers:
 * array-returning string methods reference.md excludes (arrays are out
 * of JeJ scope), and reflection / prototype-escape names with no JeJ
 * use. Every name NOT listed here passes dot access
 * (allow-all-except-blocklist). `toString` / `valueOf` are intentionally
 * absent — reference.md allows them (e.g. `(255).toString(16)`). See
 * DOCS.md § Member model.
 */
const BLOCKED_MEMBER_NAMES: ReadonlySet<string> = Object.freeze(
	new Set([
		// array-returning string methods — arrays are out of JeJ scope
		'split',
		'match',
		'matchAll',
		// reflection / prototype-escape names — no JeJ use
		'constructor',
		'__proto__',
		'prototype',
		'call',
		'apply',
		'bind',
		'__defineGetter__',
		'__defineSetter__',
		'__lookupGetter__',
		'__lookupSetter__',
		'caller',
		'arguments',
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
 * `ClassDeclaration`, `ThrowStatement`, `NewExpression`, and many
 * others. These are blocked by default — learners see a clear "not
 * allowed at this language level" message directing them to the
 * allowed alternative.
 */
const justEnoughJs: SyntaxAllowlist = Object.freeze({
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
			'Math',
			'RegExp',
			'Date',
			'BigInt',
			'parseInt',
			'parseFloat',
			'undefined',
			'NaN',
			'Infinity',
			'eval', // easter egg — not in reference.md
		]),
	),

	blockedMemberNames: BLOCKED_MEMBER_NAMES,

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
		// All literal forms JeJ can produce are allowed: string, number,
		// boolean, null, undefined, regex, and BigInt (42n). reference.md
		// sanctions every form, so there is no per-literal constraint.
		Literal: true,
		ConditionalExpression: true,
		ChainExpression: true,
		// CallExpression is unconditionally allowed — reference.md permits
		// computed calls (`Math[method]()`), so calls are not gated. The
		// member blocklist governs dot access (DOCS.md § Member model).
		CallExpression: true,
		// WHY: preserveParens in parser creates ParenthesizedExpression
		// nodes. Allowing them here lets `(a + b) * c` pass validation
		// and gives trace visualization anchor nodes for grouping.
		ParenthesizedExpression: true,

		// easter eggs — not in reference.md
		LabeledStatement: true,
		SequenceExpression: true,
		WithStatement: true,

		// allowed with constraints — validator functions check
		// node-specific properties
		VariableDeclaration: validateVariableDeclaration,
		IfStatement: validateIfStatement,
		WhileStatement: validateWhileStatement,
		DoWhileStatement: validateDoWhileStatement,
		ForStatement: validateForStatement,
		ForOfStatement: validateForOfStatement,
		MemberExpression: createMemberValidator(BLOCKED_MEMBER_NAMES),
		NewExpression: validateNewExpression,
		AssignmentExpression: validateAssignmentExpression,
		UpdateExpression: validateUpdateExpression,
		BinaryExpression: validateBinaryExpression,
		LogicalExpression: validateLogicalExpression,
		UnaryExpression: validateUnaryExpression,
	} satisfies Record<string, NodeRule>),
});

export default justEnoughJs;
