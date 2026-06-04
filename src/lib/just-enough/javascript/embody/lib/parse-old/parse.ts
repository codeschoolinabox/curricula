/**
 * @file Parses JeJ code and returns a frozen parse result.
 *
 * @remarks Public entry of `lib/parse/`. Wraps `parseProgram` (the
 * module's acorn primitive) with the `with`-statement script-mode
 * fallback and shapes the result as a frozen {@link ParseResult}.
 * Consumers who need only syntax checking can use this directly.
 *
 * Never throws. Parse errors are represented in the result.
 *
 * TODO: future enhancement — augment AST nodes with learner-facing
 * fields (e.g. plain-English descriptions of node roles, suggested
 * next steps, links to `reference.md` sections, similar pedagogical
 * metadata) to make the AST more learn/teach/explore-able. Specifics
 * deferred until a consumer use case appears. When this lands, an AST
 * augmentation pass will sit between the script-mode fallback decision
 * and the result-shape phase; the data-flow diagram in DOCS.md will
 * gain a corresponding node.
 */

import type { Node } from 'acorn';

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';
import deepFreeze from '@utils/deep-freeze.js';

import getChildNodes from './get-child-nodes.js';
import parseProgram from './parse-program.js';
import type { ParseResult } from './types.js';

/**
 * Parses JavaScript source into a frozen `ParseResult`.
 *
 * @param code - JavaScript source to parse
 * @returns A frozen {@link ParseResult} — check `ok` first,
 *   then read `ast` (success) or `error` (failure). On `with`-statement
 *   programs that pass via script-mode fallback, `scriptMode` is `true`.
 */
function parse(code: string): ParseResult {
	const moduleResult = parseProgram(code, 'module');

	if (!('message' in moduleResult)) {
		// Module parse succeeded
		return deepFreezeInPlace({
			ok: true as const,
			code,
			ast: deepFreeze(moduleResult),
		});
	}

	// Module failed — try script-mode fallback for `with`
	const scriptResult = parseProgram(code, 'script');

	if ('message' in scriptResult) {
		// Both failed — report the module error
		return deepFreezeInPlace({
			ok: false as const,
			code,
			error: buildParseResultError(moduleResult),
		});
	}

	// Script parsed — only use it if AST contains WithStatement
	if (hasWithStatement(scriptResult)) {
		return deepFreezeInPlace({
			ok: true as const,
			code,
			ast: deepFreeze(scriptResult),
			scriptMode: true as const,
		});
	}

	// No `with` — keep the module error
	return deepFreezeInPlace({
		ok: false as const,
		code,
		error: buildParseResultError(moduleResult),
	});
}

/** Checks whether an AST contains a `WithStatement` at any depth. */
function hasWithStatement(node: Node): boolean {
	if (node.type === 'WithStatement') return true;
	for (const child of getChildNodes(node)) {
		if (hasWithStatement(child)) return true;
	}
	return false;
}

/** Converts a `parseProgram` ParseError into the API-shape error. */
function buildParseResultError(parseError: {
	readonly message: string;
	readonly location: { readonly line: number; readonly column: number };
}) {
	return {
		kind: 'parse' as const,
		name: 'SyntaxError',
		message: parseError.message,
		line: parseError.location.line,
		column: parseError.location.column,
	};
}

export default parse;
