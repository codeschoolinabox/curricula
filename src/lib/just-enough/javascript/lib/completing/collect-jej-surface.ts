/**
 * @file Collect the raw JEJ surface — the union of JEJ-allowed
 * tokens at the cursor position, BEFORE the blocked-marker overlay
 * runs. See DOCS.md § Execution phases / Collect JEJ surface.
 *
 * Increment history:
 * - Inc A — keyword set ∪ JEJ-allowed globals (minus easter-egg
 *   `eval`). No AST inspection. No dot-receiver branch.
 * - Inc B — adds ∪ scope-tree locals from
 *   `buildScope(ast).allDeclarations`, dedup'd by name and skipping
 *   collisions with keywords/globals (language vocabulary wins).
 * - Inc C (future) — adds a dot-receiver branch emitting a curated
 *   member union.
 */

import type { Program } from 'acorn';

import buildScope from '../../embody/lib/scope/build-scope.js';
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
function collectJejSurface(
	_request: CompletionRequest,
	ast?: Program,
): readonly Suggestion[] {
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

	const localSuggestions: readonly Suggestion[] = ast
		? collectLocals(ast, keywordLabels, allowedGlobals)
		: [];

	return [...keywordSuggestions, ...globalSuggestions, ...localSuggestions];
}

/**
 * Walk every declaration in every scope of the program and emit each
 * as a local Suggestion. Dedup'd by name (first occurrence wins —
 * insertion-order from buildScope's depth-first walk). Skipped if
 * the label is already in keywords or globals (the language-level
 * vocabulary takes precedence over user identifiers with the same
 * name).
 */
function collectLocals(
	ast: Program,
	keywordLabels: ReadonlySet<string>,
	allowedGlobals: ReadonlySet<string>,
): readonly Suggestion[] {
	const analysis = buildScope(ast);
	const declaredNames = analysis.allDeclarations.map(function pickName(declaration) {
		return declaration.name;
	});
	const uniqueNames = [...new Set(declaredNames)].filter(
		function isVisibleLocal(name) {
			return !keywordLabels.has(name) && !allowedGlobals.has(name);
		},
	);
	return uniqueNames.map(function asLocal(name) {
		return { label: name, source: 'local' as const };
	});
}

export default collectJejSurface;
