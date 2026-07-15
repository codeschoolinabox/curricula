/**
 * @file The `readScopeForest` accessor — quizzing's Class-B scope-shim. Given a
 * parsed snippet, it returns the lexical scope forest (`ScopeAnalysis`) that the
 * occurrence→binding resolver reads through. See `./resolve-binding.ts` for the
 * resolution layer and `../DOCS.md` § "The accessor-helper seam" for the Class
 * A/B/C table this realizes.
 */

import type { Node } from 'acorn';

import buildScope from '../../../../embody/lib/scope/build-scope.js';
import type { ScopeAnalysis } from '../../../../embody/lib/scope/types.js';
import type { Snippet } from '../../../../embody/types.js';

/**
 * The lexical scope forest for a parsed snippet.
 *
 * Class-B scope-shim accessor (named for the domain question — "the scope
 * forest"). Today the body builds the forest from `buildScope(raw.ast)`; when
 * embody ships `CreationEntwined.scopeTree` the **body** is replaced to read that
 * surface instead — the name and every caller stay untouched (the B→C input
 * swap).
 *
 * @remarks
 * - **Precondition:** a parsed snippet. The caller sits behind the parse gate (a
 *   valid `classified` already implies a successful parse), so a missing AST here
 *   is a caller bug to surface — this throws, mirroring `generateQuiz`'s gate. Per
 *   embody's contract `status.parsed === true` implies `raw.ast !== null`; the
 *   `&& raw.ast` guard is structurally redundant but type-narrows for the compiler.
 * - **Pure.** No mutation; the returned `ScopeAnalysis` is `buildScope`'s own
 *   deeply-frozen output.
 *
 * @throws Error when the snippet is unparsed (no AST).
 */
export default function readScopeForest(snippet: Snippet): ScopeAnalysis {
	const ast: Node | null =
		snippet.status.parsed && snippet.raw.ast ? snippet.raw.ast : null;
	if (ast === null) {
		throw new Error(
			'readScopeForest requires a parsed snippet: status.parsed must be true and raw.ast present',
		);
	}
	return buildScope(ast);
}
