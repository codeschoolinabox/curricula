import type {
	AssignmentExpression,
	BinaryExpression,
	DoWhileStatement,
	ForOfStatement,
	ForStatement,
	Identifier,
	IfStatement,
	LogicalExpression,
	MemberExpression,
	NewExpression,
	Node,
	UnaryExpression,
	UpdateExpression,
	VariableDeclaration,
	WhileStatement,
} from 'acorn';

import freezeInPlace from '@utils/freeze-in-place.js';

import buildRealmModel from './realm-model.js';
import type { NodeRule, SyntaxAllowlist } from './types.js';

/**
 * The level's allowlist as data: the node rules the walk dispatches on, and the
 * admitted globals the vocabulary resolution reads.
 *
 * @remarks
 * Default-deny — a node type absent from `nodes` is outside the level, so a
 * `WithStatement` needs no entry: JEJ programs are modules, where `with` is a
 * SyntaxError before the level is ever consulted. Rules mapped to `true` are
 * structural nodes carrying no constraint; rules mapped to a check are admitted
 * subject to it. The admitted globals are the realm table's names, derived —
 * never authored here — so the level's world and its vocabulary cannot drift.
 * `freezeInPlace` freezes the `Set` container, not its entries (a frozen `Set`
 * still answers `add`); the `ReadonlySet` contract is the compile-time guard.
 */
const justEnoughJs: SyntaxAllowlist = freezeInPlace({
	nodes: {
		// admitted outright — structural nodes carrying no constraint
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
		// every literal form the level can produce is sanctioned — string,
		// number, boolean, null, regex, and BigInt — so there is no
		// per-literal constraint
		Literal: true,
		ConditionalExpression: true,
		ChainExpression: true,
		// calls are not gated: the reference permits computed dispatch
		// (`Math[method]()`); the member check governs the dot access itself
		CallExpression: true,

		// easter eggs — admitted, untaught
		LabeledStatement: true,
		SequenceExpression: true,

		// admitted subject to a check
		VariableDeclaration: checkVariableDeclaration,
		AssignmentExpression: checkAssignmentExpression,
		UpdateExpression: checkUpdateExpression,
		BinaryExpression: checkBinaryExpression,
		LogicalExpression: checkLogicalExpression,
		UnaryExpression: checkUnaryExpression,
		IfStatement: checkIfStatement,
		WhileStatement: checkWhileStatement,
		DoWhileStatement: checkDoWhileStatement,
		ForStatement: checkForStatement,
		ForOfStatement: checkForOfStatement,
		MemberExpression: checkMemberExpression,
		NewExpression: checkNewExpression,
	} satisfies Record<string, NodeRule>,
	admittedGlobals: new Set(buildRealmModel().bindings.map((b) => b.name)),
});

/**
 * Assignment operators the level admits: simple, compound arithmetic, compound
 * logical, and compound bitwise.
 *
 * @remarks
 * Compound forms are shorthand a learner can expand (`x += 1` is `x = x + 1`).
 * `++`/`--` are `UpdateExpression` nodes, not assignments, so they are not
 * here.
 */
const ALLOWED_ASSIGNMENT_OPERATORS: ReadonlySet<string> = new Set([
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
 * Binary operators the level admits: strict equality, comparison, arithmetic,
 * bitwise, and membership.
 *
 * @remarks
 * Deliberately excludes `==` and `!=` (loose equality is a coercion trap the
 * level does not teach) and `instanceof` (a class-shaped concept with nothing
 * to stand on here). Bitwise operators and `in` are within the reference.
 */
const ALLOWED_BINARY_OPERATORS: ReadonlySet<string> = new Set([
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
 * Logical operators the level admits — all three JavaScript has.
 *
 * @remarks
 * `??` is within the level: a safe, readable default-value pattern learners
 * meet in real code, and its short-circuit is part of the notional machine.
 */
const ALLOWED_LOGICAL_OPERATORS: ReadonlySet<string> = new Set([
	'&&',
	'||',
	'??',
]);

/**
 * Unary operators the level admits: type inspection, negation, and two eggs.
 *
 * @remarks
 * `typeof`, `!`, and `-` are the taught surface; `~` is within the bitwise
 * reference; `void` is an easter egg. Excludes unary `+` (a coercion trap the
 * level does not teach) and `delete` (property mutation is outside the level).
 */
const ALLOWED_UNARY_OPERATORS: ReadonlySet<string> = new Set([
	'typeof',
	'!',
	'-',
	'~',
	'void',
]);

/**
 * Property names refused in dot access — the level's member policy is
 * allow-all-except these.
 *
 * @remarks
 * Two tiers: array-returning string methods (arrays are outside the level),
 * and reflection / prototype-escape names with no admitted use. `toString` and
 * `valueOf` are deliberately absent — the reference sanctions them. The level's
 * own datum: no machinery reads it, so it lives with the check that does.
 *
 * WHY: this set is module-private, so `tests/just-enough-js.test.ts` asserts
 * every entry behaviorally — a name added here needs its refusal test added in
 * lockstep, or the change ships untested.
 */
const BLOCKED_MEMBER_NAMES: ReadonlySet<string> = new Set([
	'split',
	'match',
	'matchAll',
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
]);

/**
 * Admits `let` and `const` declarations; refuses `var`.
 *
 * @remarks
 * Legacy `var` scoping is a machine this level does not teach — its notional
 * machine models only `let` and `const`. Multi-declarator statements
 * (`let a = 1, b = 2`) are admitted: learners can weigh the expressiveness
 * trade-off themselves.
 */
function checkVariableDeclaration(node: Node): true | string {
	const { kind } = node as VariableDeclaration;
	if (kind === 'let' || kind === 'const') return true;
	return `'${kind}' declarations are not allowed — use 'let' or 'const'`;
}

/**
 * Admits assignments with an admitted operator to a bare variable; refuses
 * unknown operators and property targets.
 *
 * @remarks
 * With no object literals, arrays, or constructors in the level, property
 * assignment has no admitted use — and blocking it keeps a learner from
 * overwriting a built-in method (`console.log = 5`).
 */
function checkAssignmentExpression(node: Node): true | string {
	const { operator, left } = node as AssignmentExpression;

	if (!ALLOWED_ASSIGNMENT_OPERATORS.has(operator)) {
		return `Assignment operator '${operator}' is not allowed`;
	}
	if (left.type !== 'Identifier') {
		return 'You can only assign to variables — property assignment is not allowed';
	}

	return true;
}

/**
 * Admits `++` and `--`, prefix or postfix; refuses anything else.
 *
 * @remarks
 * The `prefix` flag is not constrained — either form is within the level. The
 * argument is not constrained either (`x.y++` is admitted): unlike assignment,
 * the update operators were left target-unconstrained when the level was
 * quarried, and the walk's member check still governs the dot access itself.
 */
function checkUpdateExpression(node: Node): true | string {
	// typed as string, not UpdateOperator: the defensive arm below handles a
	// node beyond acorn's own type universe, and the wider type keeps the
	// refusal's template from narrowing to `never`
	const { operator }: { operator: string } = node as UpdateExpression;
	if (operator === '++' || operator === '--') return true;
	return `Update operator '${operator}' is not allowed`;
}

/** Admits the operators in {@link ALLOWED_BINARY_OPERATORS}; refuses the rest. */
function checkBinaryExpression(node: Node): true | string {
	const { operator } = node as BinaryExpression;
	if (ALLOWED_BINARY_OPERATORS.has(operator)) return true;
	return `Binary operator '${operator}' is not allowed`;
}

/** Admits `&&`, `||`, and `??`; refuses anything else. */
function checkLogicalExpression(node: Node): true | string {
	const { operator } = node as LogicalExpression;
	if (ALLOWED_LOGICAL_OPERATORS.has(operator)) return true;
	return `Logical operator '${operator}' is not allowed`;
}

/** Admits the operators in {@link ALLOWED_UNARY_OPERATORS}; refuses the rest. */
function checkUnaryExpression(node: Node): true | string {
	const { operator } = node as UnaryExpression;
	if (ALLOWED_UNARY_OPERATORS.has(operator)) return true;
	return `Unary operator '${operator}' is not allowed`;
}

/**
 * Admits `if`/`else` with block bodies; refuses braceless branches.
 *
 * @remarks
 * Braceless control flow invites the dangling-else and the looks-indented
 * trap. The alternate may be `null` (no `else`), a block, or another
 * `IfStatement` — an `else if` chain is that statement's own rule's problem.
 */
function checkIfStatement(node: Node): true | string {
	const { consequent } = node as IfStatement;
	// acorn types `alternate` as optional; the parse always materializes null
	const alternate = (node as IfStatement).alternate ?? null;

	if (consequent.type !== 'BlockStatement') {
		return 'if/else bodies must use curly braces `{}`';
	}
	if (
		alternate !== null &&
		alternate.type !== 'BlockStatement' &&
		alternate.type !== 'IfStatement'
	) {
		return 'if/else bodies must use curly braces `{}`';
	}

	return true;
}

/** Admits `while` with a block body; refuses a braceless one. */
function checkWhileStatement(node: Node): true | string {
	const { body } = node as WhileStatement;
	if (body.type === 'BlockStatement') return true;
	return 'while body must use curly braces `{}`';
}

/** Admits `do…while` with a block body; refuses a braceless one. */
function checkDoWhileStatement(node: Node): true | string {
	const { body } = node as DoWhileStatement;
	if (body.type === 'BlockStatement') return true;
	return 'do-while body must use curly braces `{}`';
}

/** Admits `for` with a block body; refuses a braceless one. */
function checkForStatement(node: Node): true | string {
	const { body } = node as ForStatement;
	if (body.type === 'BlockStatement') return true;
	return 'for body must use curly braces `{}`';
}

/**
 * Admits `for…of` with a block body; refuses a braceless one.
 *
 * @remarks
 * The head is not constrained here: a `let` or `const` head is a
 * `VariableDeclaration`, met by its own rule when the walk reaches it.
 */
function checkForOfStatement(node: Node): true | string {
	const { body } = node as ForOfStatement;
	if (body.type === 'BlockStatement') return true;
	return 'for-of body must use curly braces `{}`';
}

/**
 * Admits every dot access except the blocked names; never gates computed
 * access.
 *
 * @remarks
 * Allow-all-except: any property name passes but
 * {@link BLOCKED_MEMBER_NAMES}. Computed access (`Math[method]()`) is admitted
 * unconditionally — the level admits guarded dynamic dispatch, and a syntactic
 * check cannot tell that from an escape (the documented residual hole; the
 * policy protects the taught surface, it is not a sandbox). No type checking:
 * `.log` on a string is the runtime's business, only the name is met here.
 */
function checkMemberExpression(node: Node): true | string {
	const member = node as MemberExpression;
	if (member.computed) return true;

	// a non-computed property is an Identifier (a PrivateIdentifier needs a
	// class, which no rule admits) — narrowed for its name
	const { name } = member.property as Identifier;
	if (!BLOCKED_MEMBER_NAMES.has(name)) return true;
	return `Property '.${name}' is not available at this language level`;
}

/**
 * Admits `new Date(…)` and nothing else `new`.
 *
 * @remarks
 * The sole admitted constructor: a Date's methods return only primitives,
 * mutate nothing, and introduce reference types without demanding the rest of
 * the object model. A syntactic name check on an `Identifier` callee — not
 * identity tracking, so a shadowed `Date` is beyond it.
 */
function checkNewExpression(node: Node): true | string {
	const { callee } = node as NewExpression;
	if (callee.type === 'Identifier' && callee.name === 'Date') return true;
	return "'new' is only allowed with Date (new Date()) at this language level";
}

export default justEnoughJs;
