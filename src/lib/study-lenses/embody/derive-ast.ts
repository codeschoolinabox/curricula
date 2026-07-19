import { parse } from 'acorn';
import type { Program } from 'acorn';

import ECMA_VERSION from './ecma-version.js';
import type { FactStage, Snippet } from './types.js';

/**
 * Derive the ast fact stage from a snippet: the syntax tree parsed from the
 * source at the snippet's parse goal.
 *
 * @remarks
 * The snippet type selects acorn's `sourceType` — grammar is goal-sensitive
 * (an import declaration parses in a module but is a grammar error in a
 * script).
 *
 * @throws acorn's SyntaxError when the source does not parse.
 */
export default function deriveAst(snippet: Snippet): FactStage<Program> {
	// the parser reads the source itself — acorn has no tokens→AST entry point;
	// the tokens stage gates phase accessibility, never this input.
	const ast = parse(snippet.source, {
		sourceType: snippet.type,
		ecmaVersion: ECMA_VERSION,
		// ranges feeds the environment stage: eslint-scope's resolution reads
		// `node.range` and throws without it. A test pins this option (unlike
		// the ecmaVersion numeral, whose effect has no cheap local observable).
		ranges: true,
	});

	return { ok: true, value: ast };
}
