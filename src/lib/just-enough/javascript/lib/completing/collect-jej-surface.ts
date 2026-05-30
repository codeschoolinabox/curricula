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
 * - Inc C — adds a dot-receiver branch emitting a curated ~28-entry
 *   member union (no receiver-type inference; same list for `str.`,
 *   `(5).`, `Math.`, etc.).
 */

import type { Program } from 'acorn';

import buildScope from '../../embody/lib/scope/build-scope.js';
import justEnoughJs from '../../embody/lib/validating/just-enough-js.js';
import type { CompletionRequest } from '../../orchestrate/lib/editing/types.js';

import type { Suggestion } from './types.js';

export const KEYWORDS: readonly string[] = [
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

export const SUPPRESSED_GLOBALS: ReadonlySet<string> = new Set(['eval']);

/**
 * Curated member-name union emitted in dot-receiver context. One
 * union for all receivers (no type inference — `str.`, `(5).`,
 * `Math.`, `console.` all show the same list). Pedagogically
 * scannable; 28 commonly-useful names from `String`, `Number`,
 * and `Math` that JEJ allows.
 */
export const CURATED_MEMBERS: readonly string[] = [
	'length',
	'toString',
	'valueOf',
	'charAt',
	'charCodeAt',
	'slice',
	'substring',
	'toUpperCase',
	'toLowerCase',
	'indexOf',
	'includes',
	'startsWith',
	'endsWith',
	'repeat',
	'trim',
	'concat',
	'replace',
	'replaceAll',
	'toFixed',
	'toPrecision',
	'abs',
	'floor',
	'ceil',
	'round',
	'max',
	'min',
	'pow',
	'sqrt',
];

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
	inDotContext = false,
): readonly Suggestion[] {
	if (inDotContext) {
		return CURATED_MEMBERS.map(function asMember(label) {
			return { label, source: 'member' as const };
		});
	}

	const keywordLabels = new Set(KEYWORDS);
	const allowedGlobals = justEnoughJs.allowedGlobals ?? new Set<string>();

	const keywordSuggestions: readonly Suggestion[] = KEYWORDS.map(
		function asKeyword(label) {
			return { label, source: 'keyword' as const };
		},
	);

	// `Array.from(<Set>)` instead of `[...<Set>]` — the Docusaurus/Babel
	// transpile pipeline mangles iterable spread to a one-element array
	// wrapping the iterable. Array.from uses the iterable protocol via a
	// different code path that survives the transpile.
	// eslint-disable-next-line unicorn/prefer-spread -- Docusaurus/Babel mistranspiles `[...<Set>]` to `[<Set>]`; Array.from survives.
	const globalSuggestions: readonly Suggestion[] = Array.from(allowedGlobals)
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
	// eslint-disable-next-line unicorn/prefer-spread -- Docusaurus/Babel mistranspiles `[...<Set>]` to `[<Set>]`; Array.from survives.
	const uniqueNames = Array.from(new Set(declaredNames)).filter(
		function isVisibleLocal(name) {
			return !keywordLabels.has(name) && !allowedGlobals.has(name);
		},
	);
	return uniqueNames.map(function asLocal(name) {
		return { label: name, source: 'local' as const };
	});
}

export default collectJejSurface;
