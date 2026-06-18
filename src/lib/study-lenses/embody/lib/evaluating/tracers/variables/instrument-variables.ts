/**
 * @file Instruments a validated JEJ program: splices the source into
 * instrumented source carrying the `__$vr` helper calls the worker logic
 * implements. The Instrument phase of the pipeline (DOCS.md § 3).
 *
 * @remarks Pure given an instrumentable program; it throws first, then
 * splices. The boundary throw rejects the constructs that pass the JEJ gate
 * but cannot be faithfully spliced (any labeled statement — which subsumes
 * labeled break/continue — and expression-target for-of); `with` and
 * comma/sequence are NOT thrown (README § Bounded context). The transform is
 * line-preserving: no splice
 * inserts or removes a newline, so the instrumented source keeps the original
 * line count.
 *
 * The scope table (I1) drives scope-WRAP PLACEMENT — its keys are the
 * `__$vr.open` / `__$vr.close` addresses. Read resolution ("is this identifier
 * a read of a declared, in-scope binding?") needs the scope CHAIN at a node,
 * which the flat table cannot give, so the scope analysis is re-derived here
 * via `buildScope` (the same analysis I1 projects from); node paths are
 * re-derived via `buildNodePathMap`, matching the table keys and the worker's
 * addresses. The two never diverge because both are pure functions of the same
 * `program`.
 */

import type { Node, Program } from 'acorn';

import buildNodePathMap from '../../../parse-old/build-node-path-map.js';
import getChildNodes from '../../../parse-old/get-child-nodes.js';
import buildScope from '../../../scope/build-scope.js';
import type { ScopeInfo } from '../../../scope/types.js';

import type {
	InstrumentBoundaryError,
	InstrumentBoundaryReason,
	ScopeTable,
} from './types.js';

/**
 * Instruments a validated JEJ program into worker-traceable source.
 *
 * @param program - The validated JEJ `Program` AST (parsed with
 *   `preserveParens`, so `ParenthesizedExpression` nodes are present).
 * @param source - The original source string the AST was parsed from.
 * @param scopeTable - I1's clone-safe scope table; its keys address the
 *   scopes whose push/pop this transform wraps.
 * @returns The instrumented source string, line-for-line with the original.
 * @throws {InstrumentBoundaryError} On a JEJ-valid construct this tier cannot
 *   faithfully splice: any labeled statement (which subsumes labeled
 *   break/continue) or an expression-target for-of.
 */
export default function instrumentVariables(
	program: Program,
	source: string,
	scopeTable: ScopeTable,
): string {
	// 1. Boundary scan — throw before any splicing (DOCS § 3: pure given an
	//    instrumentable program; rejects, then splices).
	rejectUnsupported(program);

	// 2. Re-derive the addressing (node paths) and the read-resolution scope
	//    chain from the same program (both pure functions of `program`).
	const context: InstrumentContext = {
		source,
		scopeTable,
		nodePathMap: buildNodePathMap(program),
	};

	// 3. Rewrite the program bottom-up into instrumented source.
	return rewriteNode(program, context, buildScope(program).root);
}

// ─── Boundary scan ─────────────────────────────────────────────────────────────

/**
 * Throws a typed {@link InstrumentBoundaryError} on the JEJ-valid constructs
 * this tier cannot faithfully splice; otherwise recurses into every child.
 */
function rejectUnsupported(node: Node): void {
	// A labeled break/continue cannot exist without an enclosing LabeledStatement
	// (a parse requirement), which this pre-order scan reaches first — so
	// rejecting the label here rejects every labeled jump too.
	if (node.type === 'LabeledStatement') {
		throw createBoundaryError(
			'labeled-statement',
			'instrumentVariables: labeled statements are not supported',
		);
	}

	if (node.type === 'ForOfStatement') {
		const { left } = node as unknown as { readonly left: Node };
		if (left.type !== 'VariableDeclaration') {
			throw createBoundaryError(
				'expression-target-for-of',
				'instrumentVariables: for-of with a non-declaration target is not supported',
			);
		}
	}

	for (const child of getChildNodes(node)) {
		rejectUnsupported(child);
	}
}

/**
 * Builds the tier's typed boundary error: a real `Error` (stack + `instanceof
 * Error`) augmented with the discriminant tag and reason (types.ts).
 */
function createBoundaryError(
	reason: InstrumentBoundaryReason,
	message: string,
): InstrumentBoundaryError {
	return Object.assign(new Error(message), {
		instrumentBoundary: true as const,
		reason,
	});
}

// ─── Rewrite dispatch ──────────────────────────────────────────────────────────

/**
 * The instrumentation invariants threaded (immutably) through the descent.
 */
type InstrumentContext = {
	readonly source: string;
	readonly scopeTable: ScopeTable;
	readonly nodePathMap: ReadonlyMap<Node, string>;
};

type NodeRewriter = (
	node: Node,
	context: InstrumentContext,
	scope: ScopeInfo,
) => string;

/**
 * Returns the instrumented text for one node, given the scope it sits in.
 * Bottom-up: every handler embeds its children's already-rewritten text, so
 * there is no offset bookkeeping across the tree (generalizes
 * `intercept/wrap-call-expressions.ts`). A node type with no dedicated handler
 * falls to {@link rewriteChildren} (a faithful rebuild with reads wrapped).
 */
function rewriteNode(
	node: Node,
	context: InstrumentContext,
	scope: ScopeInfo,
): string {
	const handler = REWRITERS[node.type] ?? rewriteChildren;
	return handler(node, context, scope);
}

// ─── Scope-wrapping handlers ─────────────────────────────────────────────────────

/** Program: always the script scope — wrap the whole body. */
function rewriteProgram(
	node: Node,
	context: InstrumentContext,
	scope: ScopeInfo,
): string {
	const { body } = node as unknown as { readonly body: readonly Node[] };
	const inner = rewriteRange(body, node.start, node.end, context, scope);
	return wrapScope(scopePath(node, context), inner);
}

/**
 * Block: a declaring block (its path is a scope-table key) gets the scope wrap;
 * a non-declaring block keeps only its braces (the NM elides empty scopes).
 */
function rewriteBlock(
	node: Node,
	context: InstrumentContext,
	scope: ScopeInfo,
): string {
	const blockScope = findChildScope(node, scope);
	const { body } = node as unknown as { readonly body: readonly Node[] };
	const inner = rewriteRange(
		body,
		node.start + 1,
		node.end - 1,
		context,
		blockScope,
	);
	const path = scopePath(node, context);
	if (context.scopeTable[path]) {
		return `{${wrapScope(path, inner)}}`;
	}
	return `{${inner}}`;
}

/**
 * Classic `for`: a declaring head (`for (let i …)`) gets ONE synthesized
 * for-scope wrapping the whole loop (open before, close after — not
 * per-iteration); the loop landing clear always follows.
 */
function rewriteFor(
	node: Node,
	context: InstrumentContext,
	scope: ScopeInfo,
): string {
	const loop = rewriteChildren(node, context, scope);
	const path = scopePath(node, context);
	if (context.scopeTable[path]) {
		return `${wrapScope(path, loop)}${LANDED}`;
	}
	return `${loop}${LANDED}`;
}

/**
 * for-of: per-iteration scope. The body block carries the open, an initialize
 * of the loop binding (never TDZ there), and the try/finally close; the loop
 * landing clear follows the statement.
 */
function rewriteForOf(
	node: Node,
	context: InstrumentContext,
	scope: ScopeInfo,
): string {
	const { left, right, body } = node as unknown as {
		readonly left: Node;
		readonly right: Node;
		readonly body: Node;
	};
	const forOfScope = findChildScope(node, scope);
	const path = scopePath(node, context);

	const binding = forOfBindingId(left);
	const { name } = binding as unknown as { readonly name: string };
	// The binding id's path (not the declarator's) is the initialize attribution:
	// a for-of head has no initializer expression, so the id is the highlight target.
	const initialize = `${HELPER}.initialize(${JSON.stringify(
		scopePath(binding, context),
	)}, ${JSON.stringify(name)}, ${name}, true); `;

	const { body: statements } = body as unknown as {
		readonly body: readonly Node[];
	};
	const bodyInner = rewriteRange(
		statements,
		body.start + 1,
		body.end - 1,
		context,
		forOfScope,
	);
	const wrappedBody = `{${wrapScope(path, bodyInner, initialize)}}`;

	const head = `${context.source.slice(node.start, left.end)}${context.source.slice(
		left.end,
		right.start,
	)}${rewriteNode(right, context, scope)}${context.source.slice(
		right.end,
		body.start,
	)}`;

	return `${head}${wrappedBody}${LANDED}`;
}

/** while / do-while: no synthesized scope, but the loop landing clear follows. */
function rewriteUnscopedLoop(
	node: Node,
	context: InstrumentContext,
	scope: ScopeInfo,
): string {
	return `${rewriteChildren(node, context, scope)}${LANDED}`;
}

// ─── Declaration / value handlers ───────────────────────────────────────────────

/** Rewrites each declarator into an `initialize` wrap, preserving the rest. */
function rewriteVariableDeclaration(
	node: Node,
	context: InstrumentContext,
	scope: ScopeInfo,
): string {
	const { declarations } = node as unknown as {
		readonly declarations: readonly Node[];
	};
	let result = '';
	let index = node.start;
	for (const declarator of declarations) {
		result += context.source.slice(index, declarator.start);
		result += rewriteDeclarator(declarator, context, scope);
		index = declarator.end;
	}
	result += context.source.slice(index, node.end);
	return result;
}

/**
 * Declarator → `initialize`: `let x = RHS` wraps the RHS eagerly (`explicit:
 * true`); the implicit `let x;` inserts an initializer (`explicit: false`).
 */
function rewriteDeclarator(
	node: Node,
	context: InstrumentContext,
	scope: ScopeInfo,
): string {
	const { id, init } = node as unknown as {
		readonly id: Node;
		readonly init: Node | null;
	};
	const { name } = id as unknown as { readonly name: string };
	const path = JSON.stringify(scopePath(node, context));
	const nameLiteral = JSON.stringify(name);

	if (init) {
		const prefix = context.source.slice(node.start, init.start);
		const value = rewriteNode(init, context, scope);
		return `${prefix}${HELPER}.initialize(${path}, ${nameLiteral}, (${value}), true)`;
	}
	const idText = context.source.slice(node.start, node.end);
	return `${idText} = ${HELPER}.initialize(${path}, ${nameLiteral}, undefined, false)`;
}

/**
 * Assignment to a declared binding → `assign`. Simple `=` passes the RHS
 * eagerly as the trailing `incoming` (it evaluates before the prior read);
 * compound/logical forms run the original expression inside the writer thunk
 * (real coercion / real short-circuit). A non-declared target is left to the
 * generic descent (the RHS reads still wrap).
 */
function rewriteAssignment(
	node: Node,
	context: InstrumentContext,
	scope: ScopeInfo,
): string {
	const { left, right, operator } = node as unknown as {
		readonly left: Node;
		readonly right: Node;
		readonly operator: string;
	};
	if (!isBindingTarget(left, scope)) {
		return rewriteChildren(node, context, scope);
	}

	const { name } = left as unknown as { readonly name: string };
	const path = JSON.stringify(scopePath(node, context));
	const nameLiteral = JSON.stringify(name);
	const value = rewriteNode(right, context, scope);

	if (operator === '=') {
		// The writer param uses the reserved `__$vr` prefix (not `v`) so it cannot
		// shadow the target when the target itself is named `v`.
		return `${HELPER}.assign(${path}, ${nameLiteral}, "=", () => ${name}, (__$vrIncoming) => (${name} = __$vrIncoming), (${value}))`;
	}
	return `${HELPER}.assign(${path}, ${nameLiteral}, ${JSON.stringify(
		operator,
	)}, () => ${name}, () => (${name} ${operator} ${value}))`;
}

/**
 * Update of a declared binding → `increment`; the writer thunk runs the
 * original `x++` / `++x` (real `ToNumeric`). Any other argument falls to the
 * generic descent.
 */
function rewriteUpdate(
	node: Node,
	context: InstrumentContext,
	scope: ScopeInfo,
): string {
	const { argument, operator, prefix } = node as unknown as {
		readonly argument: Node;
		readonly operator: string;
		readonly prefix: boolean;
	};
	if (!isBindingTarget(argument, scope)) {
		return rewriteChildren(node, context, scope);
	}

	const { name } = argument as unknown as { readonly name: string };
	const form = prefix ? 'prefix' : 'postfix';
	const original = context.source.slice(node.start, node.end);
	return `${HELPER}.increment(${JSON.stringify(
		scopePath(node, context),
	)}, ${JSON.stringify(name)}, ${JSON.stringify(operator)}, ${JSON.stringify(
		form,
	)}, () => ${name}, () => ${original})`;
}

/** Member access: wrap the object (a read); never the non-computed property. */
function rewriteMember(
	node: Node,
	context: InstrumentContext,
	scope: ScopeInfo,
): string {
	const { object, property, computed } = node as unknown as {
		readonly object: Node;
		readonly property: Node;
		readonly computed: boolean;
	};
	const objectText = rewriteNode(object, context, scope);
	if (computed) {
		const between = context.source.slice(object.end, property.start);
		const propertyText = rewriteNode(property, context, scope);
		const tail = context.source.slice(property.end, node.end);
		return `${objectText}${between}${propertyText}${tail}`;
	}
	return `${objectText}${context.source.slice(object.end, node.end)}`;
}

/** Standalone read of a declared binding → thunked `read`; else verbatim. */
function rewriteIdentifier(
	node: Node,
	context: InstrumentContext,
	scope: ScopeInfo,
): string {
	const { name } = node as unknown as { readonly name: string };
	if (!isDeclared(name, scope)) {
		return context.source.slice(node.start, node.end);
	}
	return `${HELPER}.read(${JSON.stringify(
		scopePath(node, context),
	)}, ${JSON.stringify(name)}, () => ${name})`;
}

/** break / continue (unlabeled — labeled are rejected): mark the abrupt flag. */
function rewriteBreakContinue(node: Node, context: InstrumentContext): string {
	const reason = node.type === 'BreakStatement' ? 'break' : 'continue';
	return `${HELPER}.abrupt(${JSON.stringify(reason)}); ${context.source.slice(
		node.start,
		node.end,
	)}`;
}

// ─── Generic reconstruction ─────────────────────────────────────────────────────

/**
 * Rebuilds a node's text with each direct child replaced by its rewrite,
 * preserving the original characters between children (the pass-through case).
 */
function rewriteChildren(
	node: Node,
	context: InstrumentContext,
	scope: ScopeInfo,
): string {
	const children = getChildNodes(node).toSorted((a, b) => a.start - b.start);
	let result = '';
	let index = node.start;
	for (const child of children) {
		result += context.source.slice(index, child.start);
		result += rewriteNode(child, context, scope);
		index = child.end;
	}
	result += context.source.slice(index, node.end);
	return result;
}

/**
 * Rebuilds a statement list between two offsets (a block's or program's
 * interior), rewriting each statement and preserving surrounding whitespace
 * (so the line count is preserved).
 */
function rewriteRange(
	statements: readonly Node[],
	from: number,
	to: number,
	context: InstrumentContext,
	scope: ScopeInfo,
): string {
	let result = '';
	let index = from;
	for (const statement of statements) {
		result += context.source.slice(index, statement.start);
		result += rewriteNode(statement, context, scope);
		index = statement.end;
	}
	result += context.source.slice(index, to);
	return result;
}

// ─── Splice builders ─────────────────────────────────────────────────────────────

/**
 * The scope wrap (no newlines): open, an optional prelude (the for-of binding
 * initialize), then the body bracketed by `try` / `catch` (records the error
 * reason and rethrows) / `finally` (the close). The caller supplies any
 * enclosing braces.
 */
function wrapScope(path: string, inner: string, prelude = ''): string {
	const pathLiteral = JSON.stringify(path);
	return `${HELPER}.open(${pathLiteral}); ${prelude}try {${inner}} catch (__$e) { ${HELPER}.abrupt("error"); throw __$e; } finally { ${HELPER}.close(${pathLiteral}); }`;
}

// ─── Scope + path helpers ────────────────────────────────────────────────────────

/** The `$`-rooted node path — the scope-table key and the worker's address. */
function scopePath(node: Node, context: InstrumentContext): string {
	// The node is reachable from `program`, so the path is always present.
	return context.nodePathMap.get(node)!;
}

/**
 * The child scope whose AST node matches `node` (a block / for-of). Falls back
 * to the parent for a for-of body block, which build-scope merges into the
 * for-of scope (mirrors `validating/check-undeclared-globals.ts`).
 */
function findChildScope(node: Node, parentScope: ScopeInfo): ScopeInfo {
	return (
		parentScope.children.find((child) => child.node === node) ?? parentScope
	);
}

/** True when `target` is an identifier resolving to a declared binding. */
function isBindingTarget(target: Node, scope: ScopeInfo): boolean {
	return (
		target.type === 'Identifier' &&
		isDeclared((target as unknown as { readonly name: string }).name, scope)
	);
}

/** True when `name` resolves to a let/const declaration in the scope chain. */
function isDeclared(name: string, scope: ScopeInfo): boolean {
	let current: ScopeInfo | null = scope;
	while (current) {
		if (current.declarations.has(name)) {
			return true;
		}
		current = current.parent;
	}
	return false;
}

/** The single binding id of a for-of head (`for (const x of …)`). */
function forOfBindingId(left: Node): Node {
	const [declarator] = (
		left as unknown as { readonly declarations: readonly Node[] }
	).declarations;
	return (declarator as unknown as { readonly id: Node }).id;
}

// ─── Constants ───────────────────────────────────────────────────────────────────

/** The worker-injected helper namespace (types.ts seam 3). */
const HELPER = '__$vr';

/** The post-loop abrupt-flag clear (types.ts seam 4). */
const LANDED = `${HELPER}.landed();`;

/** Dispatch table — node type → handler; absent types use {@link rewriteChildren}. */
const REWRITERS: Readonly<Record<string, NodeRewriter>> = {
	Program: rewriteProgram,
	BlockStatement: rewriteBlock,
	ForStatement: rewriteFor,
	ForOfStatement: rewriteForOf,
	WhileStatement: rewriteUnscopedLoop,
	DoWhileStatement: rewriteUnscopedLoop,
	VariableDeclaration: rewriteVariableDeclaration,
	AssignmentExpression: rewriteAssignment,
	UpdateExpression: rewriteUpdate,
	MemberExpression: rewriteMember,
	Identifier: rewriteIdentifier,
	BreakStatement: rewriteBreakContinue,
	ContinueStatement: rewriteBreakContinue,
};
