/**
 * @file Parses JeJ source code with a fallback chain.
 *
 * @remarks Fallback order:
 * 1. Module mode (JeJ default)
 * 2. Script mode + WithStatement check (for the `with` easter egg)
 * 3. Module mode + allowExpression (partial code / fragments)
 *
 * Returns a discriminated union: `{ ok: true, ast }` or
 * `{ ok: false, error }`.
 *
 * Retained only for its own unit test (`tests/parse-source.test.ts`).
 * Not imported by the production entry (`analyze-micro-decisions.ts`)
 * or by any analyzer test file — those call `acorn.parse()` directly
 * via their own local helpers. Deletion (along with the self-test)
 * deferred to a follow-up commit.
 */

import { parse } from 'acorn';
import type { Node } from 'acorn';

import type { SourcePosition } from '../../../embody/lib/validating/types.js';

import type { ParseResult } from './types.js';

// ─── Parse options ─────────────────────────────────────────

const BASE_OPTIONS = {
	ecmaVersion: 'latest' as const,
	locations: true,
	preserveParens: true,
};

// ─── Helpers ───────────────────────────────────────────────

/**
 * Checks if the AST contains a WithStatement at any depth.
 */
function hasWithStatement(node: Node): boolean {
	if (node.type === 'WithStatement') {
		return true;
	}
	const record = node as unknown as Record<string, unknown>;
	for (const key of Object.keys(record)) {
		if (key === 'type' || key === 'start' || key === 'end' || key === 'loc') {
			continue;
		}
		const value = record[key];
		if (Array.isArray(value)) {
			for (const item of value) {
				if (isNode(item) && hasWithStatement(item)) {
					return true;
				}
			}
		} else if (isNode(value) && hasWithStatement(value)) {
			return true;
		}
	}
	return false;
}

/**
 * Minimal node check (same as get-child-nodes.ts).
 */
function isNode(value: unknown): value is Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as Record<string, unknown>).type === 'string'
	);
}

/**
 * Extracts a SourcePosition from an acorn SyntaxError.
 */
function extractErrorLocation(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- acorn SyntaxError has non-standard properties
	error: any,
): SourcePosition | undefined {
	if (typeof error.loc === 'object' && error.loc !== null) {
		return {
			line: error.loc.line ?? 1,
			column: error.loc.column ?? 0,
		};
	}
	return undefined;
}

// ─── Main function ─────────────────────────────────────────

/**
 * Parses JeJ source code with a three-step fallback chain.
 *
 * @param source - Raw source code string.
 * @returns A `ParseResult`: `{ ok: true, ast }` or `{ ok: false, error }`.
 */
function parseSource(source: string): ParseResult {
	// 1. Module mode (JeJ default)
	try {
		const ast = parse(source, { ...BASE_OPTIONS, sourceType: 'module' });
		return { ok: true, ast };
	} catch {
		// Fall through to script mode
	}

	// 2. Script mode + WithStatement check
	try {
		const ast = parse(source, { ...BASE_OPTIONS, sourceType: 'script' });
		if (hasWithStatement(ast)) {
			return { ok: true, ast };
		}
		// Script parsed but no `with` — don't accept script mode for normal code
	} catch {
		// Fall through to expression mode
	}

	// 3. Module mode + allowExpression (partial code)
	try {
		const ast = parse(source, {
			...BASE_OPTIONS,
			sourceType: 'module',
			allowImportExportEverywhere: true,
		});
		return { ok: true, ast };
	} catch {
		// All fallbacks failed
	}

	// Build error from the first (module) parse attempt
	try {
		parse(source, { ...BASE_OPTIONS, sourceType: 'module' });
	} catch (error: unknown) {
		const location = extractErrorLocation(error);
		return {
			ok: false,
			error: {
				message:
					error instanceof Error
						? error.message
						: 'Failed to parse source',
				...(location ? { location } : {}),
			},
		};
	}

	// Should not reach here, but defensive
	return {
		ok: false,
		error: { message: 'Failed to parse source' },
	};
}

export default parseSource;
