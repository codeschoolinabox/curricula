/**
 * @file Parses JeJ code and returns a frozen parse result.
 *
 * @remarks Wraps `parseProgram` from the validating layer to expose
 * the parse step as a standalone public API. Consumers who need only
 * syntax checking can use this directly. Also replicates the
 * module/script fallback for `with` statements.
 *
 * Never throws. Parse errors are represented in the result.
 */

import deepFreeze from '@utils/deep-freeze.js';
import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';
import parseProgram from '../validating/parse-program.js';
import getChildNodes from '../validating/get-child-nodes.js';

import type { Node } from 'acorn';
import type { ParseResult } from './types.js';

/**
 * Parses JavaScript source into an acorn AST.
 *
 * @param code - JavaScript source to parse
 * @returns A frozen {@link ParseResult} — check `ok` first,
 *   then read `ast` (success) or `error` (failure).
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
			with: true as const,
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

/** Converts a validating-layer ParseError into the API-layer error shape. */
function buildParseResultError(parseError: {
	message: string;
	location: { line: number; column: number };
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
