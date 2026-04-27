/**
 * @file Type contract for `lib/ast/parse/`.
 *
 * Defines the events yielded by `createParseGenerator`, the parse-
 * specific error / outcome / options / result / handle shapes, the
 * enriched AST node shape, and the union of all yielded event
 * variants.
 *
 * The event union uses a two-level discriminant: outer `category`
 * (`'token'` | `'comment'` | `'node-enter'` | `'node-exit'` |
 * `'parse-error'`), inner `kind` (acorn `TokenType.label` for tokens;
 * `'Line'` | `'Block'` for comments; ESTree node `type` for node-
 * events; `'parse'` for errors). Mirrors the pattern in
 * `lib/evaluating/trace/semantics/tracing/types.ts`.
 *
 * Token and comment events are imported from `lib/ast/tokenize/` —
 * both modules use the same shapes. Parse adds three event variants
 * (node-enter, node-exit, parse-error).
 *
 * No runtime exports — types only. The implementation lives in
 * `parse.ts` (Phase 1).
 */

import type { Node, Program } from 'acorn';

import type { StepCategory } from '../../evaluating/trace/syntax/types.js';
import type {
	CommentEvent,
	TokenEvent,
} from '../tokenize/types.js';
import type {
	BaseError,
	BaseEvent,
	SyncExecution,
} from '../shared/types.js';

// ─── AST node — acorn Node enriched with entwining fields ────

/**
 * An acorn ESTree node enriched with the entwining metadata wired
 * during the parse engine's settle phase. Every node in `result.ast`
 * (the Program root and every descendant) is an `AstNode`.
 *
 * @remarks Cycles via `parent` ↔ `children` are intentional and
 * allowed under deep-freeze (cycles are wired BEFORE freeze; the
 * freeze locks them in place).
 *
 * Field reference:
 * - `parent` — null only on the Program root; otherwise the immediate
 *   ancestor.
 * - `children` — direct ESTree children, in source order. Empty for
 *   leaves.
 * - `text` — `code.slice(start, end)` precomputed.
 * - `tokens` — `TokenEvent`s whose source ranges fall within this
 *   node's `[start, end)`. Same references as in `result.events`
 *   (filtered, not cloned).
 * - `roleInParent` — categorical role label. `null` only on the
 *   Program root. Type is `string` (rules-derived; common values
 *   include `'condition'`, `'consequent'`, `'alternate'`, `'callee'`,
 *   `'argument-N'`, `'init'`, `'declarator-N'`, `'body'`, `'object'`,
 *   `'property'`, `'left'`, `'right'`, `'discriminant'`, `'case-N'`).
 * - `willEmit` — predicted `trace/syntax` step categories that this
 *   node will fire at runtime, drawn from a static lookup table keyed
 *   on ESTree `type`. May be empty if no runtime category applies
 *   (e.g. the Program root itself).
 * - `precedence` / `associativity` — present on `BinaryExpression` /
 *   `LogicalExpression` / `AssignmentExpression`; absent otherwise.
 */
type AstNode = Node & {
	readonly parent: AstNode | null;
	readonly children: readonly AstNode[];
	readonly text: string;
	readonly tokens: readonly TokenEvent[];
	readonly roleInParent: string | null;
	readonly willEmit: readonly StepCategory[];
	readonly precedence?: number;
	readonly associativity?: 'left' | 'right';
};

// ─── Yielded event variants (parse-owned) ────────────────────

/**
 * Yielded when the depth-first AST walk begins visiting a node.
 *
 * @remarks `kind` is the node's ESTree `type` (e.g. `'Program'`,
 * `'IfStatement'`, `'BinaryExpression'`, `'CallExpression'`). Pairs
 * 1:1 with a corresponding `NodeExitEvent` for the same node;
 * `enterEvent.node === exitEvent.node` after settle.
 */
type NodeEnterEvent = BaseEvent & {
	readonly category: 'node-enter';
	readonly kind: string;
	readonly node: AstNode;
};

/**
 * Yielded when the depth-first AST walk finishes visiting a node
 * (after all its children have been entered and exited).
 *
 * @remarks Pairs 1:1 with a corresponding `NodeEnterEvent`. The
 * post-order timing makes this useful for "node fully constructed"
 * UI moments.
 */
type NodeExitEvent = BaseEvent & {
	readonly category: 'node-exit';
	readonly kind: string;
	readonly node: AstNode;
};

/**
 * Yielded when acorn throws a `SyntaxError` during parsing.
 *
 * @remarks Always the last event in the stream when `outcome ===
 * 'parse-error'`. Acorn's single-pass parser does not cleanly separate
 * lexical from grammatical errors at the API boundary, so we use
 * one event variant for both — the consumer reads `event.message`
 * (and `error.message` on the result) for the human-readable cause.
 *
 * The `kind` discriminant is fixed at `'parse'`. Present for shape
 * consistency with the rest of the union.
 */
type ParseErrorEvent = BaseEvent &
	BaseError & {
		readonly category: 'parse-error';
		readonly kind: 'parse';
	};

/**
 * Discriminated union of every event the parse generator yields.
 *
 * Switch on `event.category` first; then on `event.kind` if the
 * category has multiple sub-types (token/node-enter/node-exit).
 *
 * `TokenEvent` and `CommentEvent` are imported from `lib/ast/tokenize/`
 * — both modules share the same shapes. The parse stream interleaves
 * them with node-enter / node-exit by source/walk order.
 */
type ParseEvent =
	| TokenEvent
	| CommentEvent
	| NodeEnterEvent
	| NodeExitEvent
	| ParseErrorEvent;

// ─── Error shape (out-of-band on result) ─────────────────────

/**
 * Parse-time error. Stored on `result.error` when `outcome ===
 * 'parse-error'`; otherwise absent.
 *
 * Same content as `ParseErrorEvent` minus the event-stream fields.
 */
type ParseError = BaseError & {
	readonly kind: 'parse';
};

// ─── Outcome ──────────────────────────────────────────────────

/**
 * Discriminator on `ParseResult.outcome`.
 *
 * @remarks First-write-wins semantics (mirrors intercept's and
 * tokenize's termination protocol). Once one cause sets the outcome,
 * later triggers are ignored.
 *
 * - `'complete'` — acorn produced a full AST and the depth-first
 *   walk finished naturally.
 * - `'cancel'` — consumer called `handle.cancel()` (or `break`-ed
 *   out of `for ... of`); events captured before the halt are
 *   preserved.
 * - `'fail'` — consumer called `handle.fail(reason)`; `result.reason`
 *   carries the supplied payload.
 * - `'parse-error'` — acorn threw a `SyntaxError` (lexical OR
 *   grammatical — acorn's single-pass parser does not separate them
 *   at the API boundary); `result.error` carries the normalized
 *   error; `result.ast === null`.
 *
 * No `'tokenize-error'` outcome — parse subsumes both. (The tokenize
 * module has its own `'tokenize-error'` outcome for the lexical-only
 * use case.)
 */
type ParseOutcome = 'complete' | 'cancel' | 'fail' | 'parse-error';

// ─── Options ──────────────────────────────────────────────────

/**
 * Construction-time options for `createParseGenerator`. All optional;
 * default behavior is "yield every event, populate every metadata
 * field."
 *
 * @remarks Top-level boolean flags, one per gateable category.
 * Mirrors `lib/ast/tokenize/types.ts`'s `TokenizeOptions`.
 *
 * - `tokens` defaults to `true`. When `false`, no `TokenEvent`s are
 *   emitted (the underlying tokenization still happens — it's a
 *   stream filter, not an engine reconfiguration).
 * - `comments` defaults to `true`.
 * - `nodeEnter` / `nodeExit` default to `true`. Setting either to
 *   `false` produces an asymmetric stream — useful for consumers
 *   that only care about pre- or post-order visits.
 *
 * Pedagogical metadata population (`text`, `parent`, `children`,
 * `tokens`, `roleInParent`, `willEmit`, `precedence`, `associativity`
 * on each `AstNode`) is NOT gateable — it's always populated. The
 * cost is a single depth-first walk; the convenience is large.
 *
 * `parse-error` events are NOT gateable: when acorn throws, the
 * consumer needs to know.
 */
type ParseOptions = {
	readonly tokens?: boolean;
	readonly comments?: boolean;
	readonly nodeEnter?: boolean;
	readonly nodeExit?: boolean;
};

// ─── Result ───────────────────────────────────────────────────

/**
 * Settled artifact returned by awaiting the handle. Frozen.
 *
 * @remarks
 * - `code` is the source string echoed back.
 * - `events` is the full yielded stream in source/walk order. Every
 *   event has its `prev` and `next` pointers wired (the doubly-linked
 *   chain). `events[i].step === i + 1`.
 * - `ast` is the Program node (an `AstNode` with all entwining
 *   fields wired) when `outcome === 'complete'`, OR `null` on any
 *   failure path. Acorn does not recover from syntax errors; we do
 *   not expose a partial AST.
 * - `outcome` discriminates the termination cause.
 * - `error` is present iff `outcome === 'parse-error'`.
 * - `reason` is present iff `outcome === 'fail'`; otherwise absent.
 * - `scriptMode` is present and `true` iff the script-mode fallback
 *   was used to support a `WithStatement` (the `with` easter egg);
 *   absent or `false` otherwise.
 * - `options` is the resolved options object (defaults filled in).
 */
type ParseResult = {
	readonly code: string;
	readonly events: readonly ParseEvent[];
	readonly ast: AstNode | null;
	readonly outcome: ParseOutcome;
	readonly error?: ParseError;
	readonly reason?: unknown;
	readonly scriptMode?: boolean;
	readonly options: ParseOptions;
};

// ─── Handle ───────────────────────────────────────────────────

/**
 * Consumer-facing object returned by `createParseGenerator`.
 *
 * @remarks Composes:
 * - `Iterable<ParseEvent>` — sync iteration via `for ... of`.
 * - `PromiseLike<ParseResult>` — `await handle` resolves to the
 *   settled result.
 * - `SyncExecution<ParseEvent, ParseResult>` — composes (1) and (2)
 *   plus `.result` / `.cancel`. From `lib/ast/shared/`.
 * - parse-specific eager fields: `.code`, `.options`.
 * - parse-specific termination: `.fail(reason)`.
 *
 * Settle once; replay via re-iteration yields the same event
 * references in the same order, no re-parsing.
 */
type ParseHandle = SyncExecution<ParseEvent, ParseResult> & {
	/** The source string, echoed for convenient access. */
	readonly code: string;

	/** The resolved options object (defaults filled in). */
	readonly options: ParseOptions;

	/** Consumer-driven structured termination. `reason` is stored
	 * verbatim on `result.reason` (frozen-in-place if a plain object,
	 * otherwise stored by reference). First-write-wins with cancel
	 * and parse-error. */
	readonly fail: (reason?: unknown) => void;
};

// ─── Re-export of acorn Program for consumer convenience ─────

export type { Program };

// ─── Exports ─────────────────────────────────────────────────

export type {
	AstNode,
	NodeEnterEvent,
	NodeExitEvent,
	ParseErrorEvent,
	ParseEvent,
	ParseError,
	ParseOutcome,
	ParseOptions,
	ParseResult,
	ParseHandle,
};
