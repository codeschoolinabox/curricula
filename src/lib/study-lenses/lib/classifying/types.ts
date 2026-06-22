/**
 * @file Canonical types for the classifying module.
 *
 * The domain model in TypeScript: the five-category house taxonomy
 * (semantic — by what the element does in the NM, not Acorn's lexer
 * flag; ternary `?`/`:` are delimiters, generator `*` is a delimiter,
 * template text chunks are literals), the per-category role unions, and
 * the total per-token output shape.
 *
 * See `./README.md` for the taxonomy tables, the semantic category
 * rules, and the totality invariant these types encode.
 */

import type * as acorn from 'acorn';

/**
 * The five house syntax-element kinds. Shared vocabulary across blanks
 * (its five content-type checkboxes) and quizzing (its category
 * questions). Widening or re-binning is a cross-consumer contract
 * event, not a local edit.
 */
export type Category =
	| 'identifier'
	| 'keyword'
	| 'operator'
	| 'literal'
	| 'delimiter';

/**
 * Roles for `delimiter`-category tokens. JEJ-precise; `'other'` is the
 * total fallback. Opener roles come from the owning AST node — `block`,
 * `call-arguments`, `control-head`, or `grouping` (a paren no owner
 * claims); a closer inherits its opener's final role via the `partner`
 * link.
 */
export type DelimiterRole =
	| 'call-arguments'
	| 'control-head'
	| 'grouping'
	| 'block'
	| 'template-expression'
	| 'template-delimiter'
	| 'statement-end'
	| 'member-access'
	| 'generator'
	| 'other';

/**
 * Roles for `operator`-category tokens, keyed to the owning AST node
 * kind. `declarator-init` is the synthetic `=` of `let x = 5` —
 * distinct from `assignment` (`x = 5`) because the NM treats
 * initialization and update as different binding events.
 */
export type OperatorRole =
	| 'binary'
	| 'logical'
	| 'unary'
	| 'update'
	| 'assignment'
	| 'declarator-init'
	| 'other';

/**
 * Roles for `literal`-category tokens: the literal's kind, derived from
 * the token type. The reserved-word literals `null` / `true` / `false`
 * are literals (values, not statements — they are NOT keywords) and
 * carry `'null'` / `'boolean'` roles.
 */
export type LiteralRole =
	| 'number'
	| 'string'
	| 'boolean'
	| 'null'
	| 'regexp'
	| 'template-chunk'
	| 'other';

/**
 * Any role. `role` refines the PRIMARY category; `identifier` and
 * `keyword` primaries carry no finer role (`ClassifiedToken.role` is
 * `null` there) — usage analysis is scope-aware consumer work, not
 * token classification.
 */
export type Role = DelimiterRole | OperatorRole | LiteralRole;

/**
 * Input to `classifyTokens`, declared in acorn terms — what the
 * classifier actually walks. A parsed `Snippet` carries these values
 * on `source.code`, `raw.tokens`, and `raw.ast` (typed loosely there;
 * the narrowing cast is the caller's one-line boundary). Tests may
 * construct the same shapes with a direct `acorn.parse` call.
 */
export type ClassifyInput = {
	readonly code: string;
	readonly tokens: ReadonlyArray<acorn.Token>;
	readonly ast: acorn.Node;
};

/**
 * One classified source token. `text` is always the verbatim source
 * slice (never Acorn's processed `value`); `[start, end)` is
 * zero-indexed and half-open into the input `code`.
 *
 * `categories` is non-empty, primary first; every non-empty token has
 * exactly one semantic category after the token-stream pass. `partner`
 * is the index — into the same returned array — of this token's paired
 * delimiter (`(`/`)`, `[`/`]`, `{`/`}`, backticks, `${`/`}`), or `null`
 * for unpaired tokens.
 */
export type ClassifiedToken = {
	readonly text: string;
	readonly start: number;
	readonly end: number;
	readonly categories: ReadonlyArray<Category>;
	readonly role: Role | null;
	readonly partner: number | null;
};
