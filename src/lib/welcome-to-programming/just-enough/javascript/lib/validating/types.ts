/**
 * @file Types for the JeJ validation pipeline.
 *
 * Defines the language level system and the types produced by
 * validation: violations, parse errors, and validation reports.
 *
 * These types are consumed by the public `validate()` API and
 * internally by the code object factory.
 */

import type { Node } from 'acorn';

// ─── Source locations ────────────────────────────────────────

/**
 * A line/column position in source code.
 *
 * @remarks Lines are 1-based, columns are 0-based — matching
 * acorn's output when `locations: true` is set. This convention
 * also matches most editors and terminal output, so violation
 * positions can be displayed directly without adjustment.
 */
type SourcePosition = {
	readonly line: number;
	readonly column: number;
};

/**
 * Start and end positions of a source range.
 *
 * @remarks Defines the span of source code where a violation was
 * found. Both `start` and `end` are inclusive — for single-token
 * violations (like an operator) they may be identical or nearly so.
 */
type SourceRange = {
	readonly start: SourcePosition;
	readonly end: SourcePosition;
};

// ─── Violations ──────────────────────────────────────────────

/**
 * A single language level violation found in the source.
 *
 * @remarks Contains enough information for a consumer to display
 * a meaningful message with source location context.
 *
 * - `nodeType` is the ESTree node type string (e.g.
 *   `'VariableDeclaration'`, `'BinaryExpression'`)
 * - `message` is human-readable, written for learners — it names
 *   the disallowed construct and suggests the allowed alternative
 * - `severity` is always `'rejection'` — all violations block execution
 * - `location` gives the exact source span for highlighting
 *
 * All fields are readonly. Violation objects are always frozen.
 */
type Violation = {
	readonly nodeType: string;
	readonly message: string;
	readonly severity: 'rejection';
	readonly location: SourceRange;
};

// ─── Parse errors ────────────────────────────────────────────

/**
 * A parse error from acorn when the source cannot be parsed.
 *
 * @remarks Captures the error message and position where parsing
 * failed. Returned inside {@link ValidationReport} so the
 * pipeline never throws — educational tools need graceful
 * degradation for student code with syntax errors.
 *
 * The `location` points to the character where acorn gave up,
 * which is often (but not always) where the actual mistake is.
 */
type ParseError = {
	readonly message: string;
	readonly location: SourcePosition;
};

// ─── Validation report ───────────────────────────────────────

/**
 * The result of validating a program against a language level.
 *
 * @remarks All fields are frozen (including the `violations`
 * array and each `Violation` inside it).
 *
 * - `isValid` is `true` when there are no violations and no
 *   `parseError`
 * - `parseError` is present only when acorn could not parse the
 *   source at all; in that case `violations` is empty (no AST
 *   to walk) and `isValid` is `false`
 * - `source` and `levelName` echo back inputs for traceability
 */
type ValidationReport = {
	readonly isValid: boolean;
	readonly violations: readonly Violation[];
	readonly source: string;
	readonly levelName: string;
	readonly parseError?: ParseError;
	/** True when the program was parsed in script mode for the `with`
	 * easter egg. Absent or false for normal module-mode programs. */
	readonly scriptMode?: boolean;
};

// ─── Language level ──────────────────────────────────────────

/**
 * Checks whether a specific AST node conforms to the language level.
 *
 * @remarks Returns `true` if the node passes validation. Returns
 * a {@link Violation} if the node's properties violate the
 * language level constraints.
 *
 * The `node` parameter is acorn's minimal `Node` type.
 * Validators that need specific properties (like `kind`,
 * `operator`, or `computed`) should narrow via property checks.
 *
 * @example
 * ```ts
 * const validateAssignment: NodeValidator = (node) => {
 *   const op = (node as any).operator;
 *   return op === '=' ? true : createViolation(...);
 * };
 * ```
 */
type NodeValidator = (node: Node) => true | Violation;

/**
 * A rule for a single node type in a language level.
 *
 * @remarks Used as values in the `LanguageLevel.nodes` record.
 *
 * - `true` — unconditionally allowed (structural nodes like
 *   `Program`, `BlockStatement`, `Identifier`)
 * - `false` — explicitly forbidden (produces violation immediately)
 * - `NodeValidator` — allowed with constraint checking (inspects
 *   node properties, returns `true` or a `Violation`)
 */
type NodeRule = true | false | NodeValidator;

/**
 * A complete language level configuration.
 *
 * @remarks The `nodes` record is the allowlist: any ESTree node
 * type not present as a key produces an automatic "not allowed"
 * violation. This is safer than a denylist — new JavaScript
 * features are blocked by default until explicitly allowed.
 *
 * `allowedGlobals` lists identifier names that don't need a
 * `let`/`const` declaration (e.g. `console`, `alert`).
 *
 * `allowedMemberNames` lists property names permitted in
 * non-computed dot access (e.g. `length`, `toLowerCase`).
 *
 * @example
 * ```ts
 * const myLevel: LanguageLevel = Object.freeze({
 *   name: 'My Subset',
 *   allowedGlobals: Object.freeze(new Set(['console'])),
 *   allowedMemberNames: Object.freeze(new Set(['log'])),
 *   nodes: Object.freeze({
 *     Program: true,
 *     ExpressionStatement: true,
 *     Literal: true,
 *   }),
 * });
 * ```
 */
type LanguageLevel = {
	readonly name: string;
	readonly allowedGlobals?: ReadonlySet<string>;
	readonly allowedMemberNames?: ReadonlySet<string>;
	readonly nodes: Readonly<Record<string, NodeRule>>;
};

// ─── Exports ─────────────────────────────────────────────────

export type {
	LanguageLevel,
	NodeRule,
	NodeValidator,
	ParseError,
	SourcePosition,
	SourceRange,
	ValidationReport,
	Violation,
};
