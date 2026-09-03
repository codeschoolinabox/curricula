import { tokenizer } from 'acorn';
import type { Comment, Token } from 'acorn';

import deriveInputElements from '../lib/scanning/derive-input-elements.js';

import ECMA_VERSION from './ecma-version.js';
import toStageCause from './to-stage-cause.js';
import type { FactStage, Snippet, Tokens } from './types.js';

/**
 * Derive the tokens fact stage from a snippet: the token stream together with
 * the comments the tokenizer sets aside, tokenized from the source at the
 * snippet's parse goal. On success the value also carries the input-element
 * sequence — the field's contract lives in types.ts.
 *
 * @remarks
 * The snippet type selects acorn's `sourceType` — spelling is goal-sensitive
 * (a legacy octal literal is a valid token in a script but a tokenize error in
 * a module). A source that does not tokenize is data, not a throw: the stage
 * carries a `StageCause` in the parser's own voice, with the offset and
 * position the machine reports — and beside it the failure arm publishes the
 * stage's account, the token prefix of README § Failure grammar, under the
 * same `value` name its success arm uses.
 *
 * The input-element sequence is derived by calling the shared scanning leaf
 * over the reading this function just produced — the source, tokens and
 * comments of one tokenizer pass, which is what closes the leaf's
 * input-coherence precondition by construction. Both arms call it, each
 * guarded on its own: on a successful tokenization the call sits outside the
 * tokenize catch — a leaf throw there is an embody-machinery defect, never
 * learner data, loud to the developer, and the stage still publishes ok
 * without the member; within a tokens failure the account's bounded call
 * rides the source cut at the prefix's own extent, and a throw there
 * degrades the account alone — the arm keeps its cause, the member is
 * absent, and the report speaks of the account failing. Either way the
 * derivation degrades alone, barring nothing.
 */
export default function deriveTokens(snippet: Snippet): FactStage<Tokens> {
	// acorn's own array-accumulator form of `onComment`, filled as the drain
	// below walks the tokenizer; fresh per call, so no shared mutable state.
	const comments: Comment[] = [];

	// only the tokenize is guarded here. A spelling error is the learner's own
	// data and its cause speaks in the parser's voice; the enrichment below is
	// embody's machinery, so it stays OUTSIDE this try — a defect there must
	// stay loud, never dressed up as a spelling error the learner never made.
	let tokens: Token[];
	try {
		// `Array.from`, never `[...tokenizer(…)]`: Docusaurus/Babel compiles
		// spread in loose mode to `[].concat(x)`, which wraps a non-array
		// iterable instead of draining it. That bites harder here than at the
		// Set/Map sites — a wrapped tokenizer is never DRAINED, so it never
		// throws, so this stage reports `ok` for source that does not lex and
		// every phase barred by a tokens failure silently reopens. No test in
		// this repo's harness can see it (vitest/esbuild, tsc and jsdom all
		// compile the spread correctly); only the bundled site does.
		tokens = Array.from(
			tokenizer(snippet.source, {
				sourceType: snippet.type,
				ecmaVersion: ECMA_VERSION,
				onComment: comments,
				// ranges gives tokens and comments the same [start, end] span
				// vocabulary the ast stage's nodes carry — one cross-navigation
				// currency across the parse facts. No consumer reads it yet; the
				// option lands ahead of one by ruling (facts expose what the
				// machine computes). Tests pin it on both arrays.
				ranges: true,
			}),
		);
	} catch (error) {
		// `Array.from`'s internal array is discarded when the tokenizer throws,
		// so the set-aside comments are the only channel that survives the stop
		// at this drain — the prefix's token channel has nothing to publish.
		const prefixTokens: Token[] = [];
		const cause = toStageCause(error, 'tokens');
		// the bounded sequence rides the leaf's unchanged tiling contract over
		// the source cut at the account's own extent — the end of the last
		// token or set-aside comment, whichever is later; 0 over empty channels
		try {
			const extent = Math.max(
				prefixTokens.at(-1)?.end ?? 0,
				comments.at(-1)?.end ?? 0,
			);
			const inputElements = deriveInputElements({
				code: snippet.source.slice(0, extent),
				tokens: prefixTokens,
				comments,
			});
			return {
				ok: false,
				cause,
				value: { tokens: prefixTokens, comments, inputElements },
			};
		} catch (error_) {
			// a throw here degrades the account alone: the arm keeps its cause,
			// the member is absent, and the report speaks of the account
			// failing — never of a broken machine invariant
			console.error(
				`deriveTokens: the bounded input-element derivation threw over the token prefix — the account degrades without its sequence (${
					error_ instanceof Error ? error_.message : String(error_)
				})`,
			);
			return { ok: false, cause, value: { tokens: prefixTokens, comments } };
		}
	}

	try {
		const inputElements = deriveInputElements({
			code: snippet.source,
			tokens,
			comments,
		});
		return { ok: true, value: { tokens, comments, inputElements } };
	} catch (error) {
		// a throw here is an embody-machinery defect (the leaf over a reading
		// this function itself produced) — loud to the developer, and the
		// enrichment degrades alone: the stage publishes ok without the member
		console.error(
			`deriveTokens: the input-element derivation threw over a successful tokenization — broken embody invariant (${
				error instanceof Error ? error.message : String(error)
			})`,
		);
		return { ok: true, value: { tokens, comments } };
	}
}
