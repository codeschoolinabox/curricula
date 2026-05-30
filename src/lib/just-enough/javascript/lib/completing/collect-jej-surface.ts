/**
 * @file Collect the raw JEJ surface — the union of JEJ-allowed
 * tokens at the cursor position, BEFORE the blocked-marker overlay
 * runs. See DOCS.md § Execution phases / Collect JEJ surface.
 *
 * Inc A: keyword set ∪ JEJ-allowed globals (minus easter-egg
 *   `eval`). No AST inspection. No dot-receiver branch.
 * Inc B: extends to ∪ scope-chain locals from `buildScope(ast)`.
 * Inc C: extends to a dot-receiver branch emitting a curated
 *   member union.
 */

import justEnoughJs from '../../embody/lib/validating/just-enough-js.js';
import type { CompletionRequest } from '../../orchestrate/lib/editing/types.js';

import type { Suggestion } from './types.js';

const KEYWORDS: readonly string[] = [
	'let',
	'const',
	'if',
	'else',
	'for',
	'while',
	'do',
	'break',
	'continue',
	'return',
	'true',
	'false',
	'null',
	'new',
	'typeof',
	'in',
];

const SUPPRESSED_GLOBALS: ReadonlySet<string> = new Set(['eval']);

/**
 * Collect the JEJ-allowed suggestion union for the given completion
 * request.
 *
 * @param req - The structured completion request from the editor.
 * @returns Read-only array of suggestions before the blocked-marker
 *   overlay runs. Each suggestion has a `label` and a `source`
 *   identifying which sub-collector emitted it.
 */
function collectJejSurface(_request: CompletionRequest): readonly Suggestion[] {
	const keywordLabels = new Set(KEYWORDS);
	const allowedGlobals = justEnoughJs.allowedGlobals ?? new Set<string>();

	const keywordSuggestions: readonly Suggestion[] = KEYWORDS.map(
		function asKeyword(label) {
			return { label, source: 'keyword' as const };
		},
	);

	const globalSuggestions: readonly Suggestion[] = [...allowedGlobals]
		.filter(function isJejGlobal(label) {
			return !SUPPRESSED_GLOBALS.has(label) && !keywordLabels.has(label);
		})
		.map(function asGlobal(label) {
			return { label, source: 'global' as const };
		});

	return [...keywordSuggestions, ...globalSuggestions];
}

export default collectJejSurface;
