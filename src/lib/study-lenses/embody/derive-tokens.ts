import { tokenizer } from 'acorn';
import type { Comment } from 'acorn';

import type { FactStage, Snippet, Tokens } from './types.js';

/**
 * Derive the tokens fact stage from a snippet: the token stream together with
 * the comments the tokenizer sets aside, tokenized from the source at the
 * snippet's parse goal.
 *
 * @remarks
 * The snippet type selects acorn's `sourceType` — spelling is goal-sensitive
 * (a legacy octal literal is a valid token in a script but a tokenize error in
 * a module).
 *
 * @throws acorn's SyntaxError when the source does not tokenize.
 */
export default function deriveTokens(snippet: Snippet): FactStage<Tokens> {
	// acorn's own array-accumulator form of `onComment`, filled as the spread
	// drains the tokenizer; fresh per call, so no shared mutable state.
	const comments: Comment[] = [];
	const tokens = [
		...tokenizer(snippet.source, {
			sourceType: snippet.type,
			// Numeric, not 'latest' — the environment stage shares this parse goal
			// with eslint-scope, whose ES6 gate is `ecmaVersion >= 6`: a string
			// fails that comparison and silently degrades every scope to ES5.
			ecmaVersion: 2024,
			onComment: comments,
		}),
	];

	return { ok: true, value: { tokens, comments } };
}
