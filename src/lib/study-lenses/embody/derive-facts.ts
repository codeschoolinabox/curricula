import deriveAst from './derive-ast.js';
import deriveEntwined from './derive-entwined.js';
import deriveEnvironment from './derive-environment.js';
import deriveTokens from './derive-tokens.js';
import type { Facts, Snippet } from './types.js';

/**
 * Derive the Facts from a snippet: the six tagged stages, threaded once in
 * dependency order — source and type restated as given, tokens through
 * environment derived, each failure carried with its origin named.
 *
 * @remarks
 * The assembly re-tags nothing: every downstream deriver already carries the
 * first upstream failure's cause, so the origin a consumer reads is the one
 * the failing stage wrote. Each stage derives exactly once — the bound
 * results thread forward, never a second derivation.
 */
export default function deriveFacts(snippet: Snippet): Facts {
	const tokens = deriveTokens(snippet);
	const { ast, parenSpansByNode } = deriveAst(snippet, tokens);
	const entwined = deriveEntwined(
		snippet.source,
		tokens,
		ast,
		parenSpansByNode,
	);
	const environment = deriveEnvironment(snippet.type, ast, entwined);

	return {
		source: { ok: true, value: snippet.source },
		tokens,
		ast,
		entwined,
		environment,
		type: { ok: true, value: snippet.type },
	};
}
