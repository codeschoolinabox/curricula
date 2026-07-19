import { tokenizer } from 'acorn';
import type { Comment, Position } from 'acorn';

import type { FactStage, Snippet, StageCause, Tokens } from './types.js';

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
	// acorn's own array-accumulator form of `onComment`, filled as the spread
	// drains the tokenizer; fresh per call, so no shared mutable state.
	const comments: Comment[] = [];
	try {
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
	} catch (error) {
		return { ok: false, cause: toTokensCause(error) };
	}
}

// acorn throws SyntaxError decorated with `pos` (source offset) and `loc`
// (line/column) — neither typed on the error: an untyped-library boundary read.
function toTokensCause(error: unknown): StageCause {
	const acornError = error as SyntaxError & { pos?: number; loc?: Position };
	return {
		stage: 'tokens',
		// the cast cannot make a non-Error throw carry `.message` — read it only
		// from a real Error, else stringify (the contract requires a string)
		message: error instanceof Error ? error.message : String(error),
		// compared to `undefined`, not truthiness — a truthy spread would drop
		// offset 0, which the tokenizer reports whenever the failure opens the
		// source.
		...(acornError.pos === undefined ? {} : { offset: acornError.pos }),
		// project loc to a plain pair — acorn's Position instance carries an
		// `offset()` method the contract does not declare; expose the fields the
		// contract owns, never the foreign instance.
		...(acornError.loc
			? {
					position: {
						line: acornError.loc.line,
						column: acornError.loc.column,
					},
				}
			: {}),
	};
}
