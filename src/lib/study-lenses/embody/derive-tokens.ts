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
 * position the machine reports.
 *
 * The input-element sequence is derived by calling the shared scanning leaf
 * over the reading this function just produced — the source, tokens and
 * comments of one tokenizer pass, which is what closes the leaf's
 * input-coherence precondition by construction. The call is guarded on its
 * own, outside the tokenize catch: a leaf throw is an embody-machinery
 * defect, never learner data — loud to the developer, and the stage still
 * publishes ok, without the member. The enrichment degrades alone, barring
 * nothing.
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
		return { ok: false, cause: toStageCause(error, 'tokens') };
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
