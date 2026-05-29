/**
 * @file Types for the JeJ validation pipeline.
 *
 * Defines the language level system and the types produced by
 * validation: violations, parse errors, and validation reports.
 *
 * These types are consumed by the public `validate()` API and
 * internally by the code object factory.
 */

import type { Node, Program } from 'acorn';

import type { ParseError, ParseResultError } from '../parse-old/types.js';

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
 * found, copied verbatim from acorn's `loc` (with `locations: true`).
 * Per acorn's convention, `start` is the position of the first
 * character and `end` is **exclusive** — it points one past the last
 * character (e.g. the identifier `x` at column 4 has `end.column` 5).
 * A consumer rendering a half-open `[start, end)` range needs no
 * adjustment; one wanting an inclusive last position subtracts one.
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
 * a meaningful message with source location context AND to locate
 * the offending node in the AST.
 *
 * - `nodeType` is the ESTree node type string (e.g.
 *   `'VariableDeclaration'`, `'BinaryExpression'`)
 * - `message` is human-readable, written for learners — it names
 *   the disallowed construct and suggests the allowed alternative
 * - `severity` is always `'rejection'` — all violations block execution
 * - `location` gives the exact source span for highlighting
 * - `nodePath` is a NodePath rooted at the Program node identifying
 *   the offending node (e.g. `'$.body.0.declarations.0'`). The
 *   collecting walker assigns it; consumers that need to navigate
 *   the AST to the violation (lens highlighting, structured
 *   tooling) read it directly. Matches the `nodePath` convention
 *   used elsewhere in the package (the tracer's event identity,
 *   `embody/types.ts` § Source location primitives).
 *
 * All fields are readonly. Violation objects are always frozen.
 */
type Violation = {
	readonly nodeType: string;
	readonly message: string;
	readonly severity: 'rejection';
	readonly location: SourceRange;
	readonly nodePath: string;
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
	/** The parsed acorn `Program`. Present whenever parsing succeeded
	 * (even if violations were collected). Absent only when `parseError`
	 * is present. Consumers needing the AST for tooling (e.g. intercept's
	 * AST entwining link layer) read this directly. */
	readonly ast?: Program;
};

// ─── Public API result types ─────────────────────────────────

/**
 * Code is not properly formatted.
 *
 * @remarks Returned when the format check pipeline gate rejects
 * code that is valid JeJ but doesn't match the expected format.
 * The UI should show a "Format your code" prompt, not a generic
 * error message.
 *
 * This is a learning environment constraint — unformatted JeJ
 * code is valid JavaScript and will run elsewhere.
 *
 * Lives here (rather than in `lib/formatting/`) because the type
 * is part of the unified result-error vocabulary consumed by
 * `BaseResult.error`. `lib/formatting/check-format` returns a
 * separate `CheckFormatResult` shape; the API-shaped error
 * `FormattingResultError` is what surfaces in `BaseResult` when a
 * downstream pipeline includes a format gate.
 */
type FormattingResultError = {
	readonly kind: 'formatting';
};

/**
 * Base result shape used by `validate(code)` and as the
 * compositional root for execution result types.
 *
 * @remarks
 * - `ok` is `true` when the code passes all checks that ran.
 * - `error` is set when a check produced a single error.
 * - `rejections` is set when language-level validation found
 *   violations (code parsed but isn't valid JeJ).
 *
 * Parse error and rejections are mutually exclusive: if code
 * can't parse, there are no rejections (no AST to walk).
 *
 * The `E` type parameter widens the error union for callers that
 * need to express runtime error kinds. Defaults to the validate-stage
 * errors only (`ParseResultError | FormattingResultError`):
 *
 * - `validate(code)` returns `BaseResult` (default narrow error).
 * - Execution wrappers (`run`/`trace`/`debug`) compose their own
 *   result types like `BaseResult<ResultError> & { logs?: ... }`,
 *   widening to include `JavaScriptResultError`, `TimeoutResultError`,
 *   etc., declared in their own modules.
 *
 * @typeParam E - the error union for this result. Defaults to
 *   `ParseResultError | FormattingResultError`.
 */
type BaseResult<E = ParseResultError | FormattingResultError> = {
	readonly ok: boolean;
	readonly error?: E;
	readonly rejections?: readonly Violation[];
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
 * The `nodePath` parameter is the offending node's Program-rooted
 * NodePath, supplied by the collecting walker (looked up from
 * `buildNodePathMap`). Validators forward it to `createViolation`
 * so every `Violation` carries its position — validators check
 * legality, the walker knows position.
 *
 * @example
 * ```ts
 * const validateAssignment: NodeValidator = (node, nodePath) => {
 *   const op = (node as any).operator;
 *   return op === '=' ? true : createViolation(..., nodePath);
 * };
 * ```
 */
type NodeValidator = (node: Node, nodePath: string) => true | Violation;

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
	BaseResult,
	FormattingResultError,
	LanguageLevel,
	NodeRule,
	NodeValidator,
	SourcePosition,
	SourceRange,
	ValidationReport,
	Violation,
};
