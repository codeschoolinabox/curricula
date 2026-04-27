/**
 * @file Type contract for `lib/ast/tokenize/`.
 *
 * Defines the events yielded by `createTokenizeGenerator`, the
 * tokenize-specific error / outcome / options / result / handle
 * shapes, and the union of all yielded event variants. Translates
 * the ubiquitous language from `glossary.md` directly into TypeScript;
 * names are load-bearing.
 *
 * The event union uses a two-level discriminant: outer `category`
 * (`'token'` | `'comment'` | `'tokenize-error'`), inner `kind`
 * (acorn TokenType label for tokens; `'Line'` | `'Block'` for
 * comments; `'tokenize'` for errors). Mirrors the pattern in
 * `lib/evaluating/trace/semantics/tracing/types.ts`.
 *
 * No runtime exports — types only. The implementation lives in
 * `tokenize.ts` (Phase 1).
 */

import type {
	BaseError,
	BaseEvent,
	SyncExecution,
} from '../shared/types.js';

// ─── Yielded event variants ──────────────────────────────────

/**
 * Yielded when acorn produces a token.
 *
 * @remarks `kind` is acorn's `TokenType.label` directly (e.g.
 * `'name'`, `'num'`, `'string'`, `'regexp'`, `'template'`, `'punc'`,
 * `'eof'`, `'=>'`, `'<<='`, …). This binds the field to acorn's
 * vocabulary; switching tokenizers would require updating every
 * consumer's `kind` switch (acceptable lock-in given acorn is the
 * curriculum's standard).
 *
 * `text` is the token's source substring (`code.slice(start, end)`).
 * Precomputed to save consumers from slicing themselves.
 *
 * `start` / `end` / `loc` are taken verbatim from the acorn token.
 */
type TokenEvent = BaseEvent & {
	readonly category: 'token';
	readonly kind: string;
	readonly text: string;
	readonly start: number;
	readonly end: number;
};

/**
 * Yielded when acorn delivers a comment via the `onComment` callback.
 *
 * @remarks Comments are NOT tokens in acorn — they're a separate
 * channel. We surface them as their own event type to preserve that
 * distinction (and to let consumers gate them on/off independently).
 *
 * `kind` is `'Line'` (`// …`) or `'Block'` (`/* … *\/`), matching
 * acorn's comment block label.
 */
type CommentEvent = BaseEvent & {
	readonly category: 'comment';
	readonly kind: 'Line' | 'Block';
	readonly text: string;
	readonly start: number;
	readonly end: number;
};

/**
 * Yielded when acorn throws a `SyntaxError` mid-tokenization.
 *
 * @remarks Always the last event in the stream when `outcome ===
 * 'tokenize-error'`. Carries the same shape acorn's exception had,
 * normalized into the codebase's `BaseError` contract.
 *
 * The `kind` discriminant is fixed at `'tokenize'` — there is only
 * one tokenize-error sub-kind. Present for shape consistency with
 * the rest of the union.
 */
type TokenizeErrorEvent = BaseEvent &
	BaseError & {
		readonly category: 'tokenize-error';
		readonly kind: 'tokenize';
	};

/**
 * Discriminated union of every event the tokenize generator yields.
 *
 * Switch on `event.category` first; then on `event.kind` if the
 * category has multiple sub-types.
 */
type TokenizeEvent = TokenEvent | CommentEvent | TokenizeErrorEvent;

// ─── Error shape (out-of-band on result) ─────────────────────

/**
 * Tokenize-time error. Stored on `result.error` when `outcome ===
 * 'tokenize-error'`; otherwise absent.
 *
 * Same content as `TokenizeErrorEvent` minus the event-stream
 * fields (`step`, `prev`, `next`, `loc` are all on the event;
 * `error` is the bare error data).
 */
type TokenizeError = BaseError & {
	readonly kind: 'tokenize';
};

// ─── Outcome ──────────────────────────────────────────────────

/**
 * Discriminator on `TokenizeResult.outcome`.
 *
 * @remarks First-write-wins semantics (mirrors intercept's
 * termination protocol). Once one cause sets the outcome, later
 * triggers are ignored.
 *
 * - `'complete'` — acorn reached EOF naturally; the EOF token is
 *   the last `TokenEvent` in the stream.
 * - `'cancel'` — consumer called `handle.cancel()` (or `break`-ed
 *   out of `for ... of`); events captured before the halt are
 *   preserved.
 * - `'fail'` — consumer called `handle.fail(reason)`; `result.reason`
 *   carries the supplied payload.
 * - `'tokenize-error'` — acorn threw a `SyntaxError` mid-stream;
 *   `result.error` carries the normalized error.
 *
 * No `'error'` catch-all — sync tokenize has no async/Worker
 * machinery to fail mid-stream beyond what these four cover.
 */
type TokenizeOutcome = 'complete' | 'cancel' | 'fail' | 'tokenize-error';

// ─── Options ──────────────────────────────────────────────────

/**
 * Construction-time options for `createTokenizeGenerator`. All
 * optional; default behavior is "yield every event in the stream."
 *
 * @remarks Gates which event categories fire. Mirrors the NMConfig
 * pattern from `lib/evaluating/trace/syntax/types.ts` — top-level
 * boolean flags, one per gate. Setting a flag to `false` skips
 * yielding events of that category.
 *
 * - `tokens` defaults to `true`. Setting `false` produces a stream
 *   of comments + the optional final error event only — useful
 *   for consumers that want to observe comments without the noise.
 * - `comments` defaults to `true`. Setting `false` produces a
 *   token-only stream — useful for consumers indifferent to
 *   commentary.
 *
 * Tokenize-error events are NOT gateable: when acorn throws, the
 * consumer needs to know.
 */
type TokenizeOptions = {
	readonly tokens?: boolean;
	readonly comments?: boolean;
};

// ─── Result ───────────────────────────────────────────────────

/**
 * Settled artifact returned by awaiting the handle. Frozen.
 *
 * @remarks
 * - `code` is the source string echoed back (saves consumers from
 *   threading it alongside the result).
 * - `events` is the full yielded stream in source order. Every
 *   event has its `prev` and `next` pointers wired (the doubly-
 *   linked chain). `events[i].step === i + 1`.
 * - `outcome` discriminates the termination cause.
 * - `error` is present iff `outcome === 'tokenize-error'`.
 * - `reason` is present iff `outcome === 'fail'`; otherwise absent.
 * - `options` is the resolved options object (defaults filled in).
 */
type TokenizeResult = {
	readonly code: string;
	readonly events: readonly TokenizeEvent[];
	readonly outcome: TokenizeOutcome;
	readonly error?: TokenizeError;
	readonly reason?: unknown;
	readonly options: TokenizeOptions;
};

// ─── Handle ───────────────────────────────────────────────────

/**
 * Consumer-facing object returned by `createTokenizeGenerator`.
 *
 * @remarks Composes:
 * - `Iterable<TokenizeEvent>` — sync iteration via `for ... of`.
 * - `PromiseLike<TokenizeResult>` — `await handle` resolves to the
 *   settled result.
 * - `SyncExecution<TokenizeEvent, TokenizeResult>` — composes (1)
 *   and (2) plus `.result` / `.cancel`. From `lib/ast/shared/`.
 * - tokenize-specific eager fields: `.code`, `.options`.
 * - tokenize-specific termination: `.fail(reason)`.
 *
 * Settle once; replay via re-iteration yields the same event
 * references in the same order, no re-tokenization.
 */
type TokenizeHandle = SyncExecution<TokenizeEvent, TokenizeResult> & {
	/** The source string, echoed for convenient access without
	 * holding a reference alongside the handle. */
	readonly code: string;

	/** The resolved options object (defaults filled in). */
	readonly options: TokenizeOptions;

	/** Consumer-driven structured termination. `reason` is stored
	 * verbatim on `result.reason` (frozen-in-place if a plain object,
	 * otherwise stored by reference). First-write-wins with cancel
	 * and tokenize-error. */
	readonly fail: (reason?: unknown) => void;
};

// ─── Exports ─────────────────────────────────────────────────

export type {
	TokenEvent,
	CommentEvent,
	TokenizeErrorEvent,
	TokenizeEvent,
	TokenizeError,
	TokenizeOutcome,
	TokenizeOptions,
	TokenizeResult,
	TokenizeHandle,
};
