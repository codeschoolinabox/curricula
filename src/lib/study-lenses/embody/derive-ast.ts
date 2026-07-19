import { parse } from 'acorn';
import type { Program } from 'acorn';

import ECMA_VERSION from './ecma-version.js';
import toStageCause from './to-stage-cause.js';
import type { FactStage, Snippet, Tokens } from './types.js';

/**
 * Derive the ast fact stage from a snippet: the syntax tree parsed from the
 * source at the snippet's parse goal, gated by the tokens stage.
 *
 * @remarks
 * The snippet type selects acorn's `sourceType` — grammar is goal-sensitive
 * (an import declaration parses in a module but is a grammar error in a
 * script). A failed tokens stage short-circuits: the ast stage carries the
 * tokens cause unchanged — spelling precedes grammar, and the failure's origin
 * stays named. A source that does not parse is data, not a throw: the stage
 * carries a `StageCause` in the parser's own voice.
 */
export default function deriveAst(
	snippet: Snippet,
	tokens: FactStage<Tokens>,
): FactStage<Program> {
	// spelling precedes grammar — a failed tokens stage short-circuits, carrying
	// the same cause object so the origin stays named; nothing re-parses.
	if (!tokens.ok) {
		return { ok: false, cause: tokens.cause };
	}

	try {
		// the parser reads the source itself — acorn has no tokens→AST entry
		// point; the tokens stage gates this derivation, never feeds it.
		const ast = parse(snippet.source, {
			sourceType: snippet.type,
			ecmaVersion: ECMA_VERSION,
			// ranges feeds the environment stage: eslint-scope's resolution reads
			// `node.range` and throws without it. A test pins this option (unlike
			// the ecmaVersion numeral, whose effect has no cheap local observable).
			ranges: true,
		});

		return { ok: true, value: ast };
	} catch (error) {
		return { ok: false, cause: toStageCause(error, 'ast') };
	}
}
