import { tokenizer } from 'acorn';
import type { Comment } from 'acorn';

import ECMA_VERSION from './ecma-version.js';
import toStageCause from './to-stage-cause.js';
import type { FactStage, Snippet, Tokens } from './types.js';

/**
 * Derive the tokens fact stage from a snippet: the token stream together with
 * the comments the tokenizer sets aside, tokenized from the source at the
 * snippet's parse goal.
 *
 * @remarks
 * The snippet type selects acorn's `sourceType` — spelling is goal-sensitive
 * (a legacy octal literal is a valid token in a script but a tokenize error in
 * a module). A source that does not tokenize is data, not a throw: the stage
 * carries a `StageCause` in the parser's own voice, with the offset and
 * position the machine reports.
 */
export default function deriveTokens(snippet: Snippet): FactStage<Tokens> {
	// acorn's own array-accumulator form of `onComment`, filled as the drain
	// below walks the tokenizer; fresh per call, so no shared mutable state.
	const comments: Comment[] = [];
	try {
		// This bites harder here than at the Set/Map sites: a
		// wrapped tokenizer is never DRAINED, so it never throws, so this
		// stage reports `ok` for source that does not lex — and every phase
		// barred by a tokens failure silently reopens. No test in this repo's
		// harness can see it (vitest/esbuild, tsc and jsdom all compile the
		// spread correctly); only the bundled site does.
		// eslint-disable-next-line unicorn/prefer-spread -- Docusaurus/Babel mistranspiles `[...<iterable>]` to `[<iterable>]`; Array.from survives.
		const tokens = Array.from(
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

		return { ok: true, value: { tokens, comments } };
	} catch (error) {
		return { ok: false, cause: toStageCause(error, 'tokens') };
	}
}
