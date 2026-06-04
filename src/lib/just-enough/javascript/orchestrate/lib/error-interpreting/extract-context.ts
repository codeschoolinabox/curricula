/**
 * @file Extracts structured context from an error and its source code.
 *
 * @remarks Combines error message parsing (regex) with optional AST
 * analysis to build an `ErrorContext` used for template interpolation.
 * All extraction is best-effort — missing fields are `undefined`.
 */

import type { Node } from 'acorn';
import { walk } from 'estree-walker';

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import findNodeAtLine from './find-node-at-line.js';
import type { ErrorContext, ErrorInput } from './types.js';

// ─── Name extraction patterns ───────────────────────────────

// "x is not defined" → "x"
const NOT_DEFINED_RE = /^(\S+) is not defined/;

// "Cannot access 'x' before initialization" → "x"
const TDZ_RE = /Cannot access '(\w+)' before initialization/;

// "Cannot read properties of null (reading 'x')" → "x"
const NULL_PROP_RE =
	/Cannot read properties of (?:null|undefined) \(reading '(\w+)'\)/;

// "x is not a function" → "x"
const NOT_FUNCTION_RE = /^(\S+) is not a function/;

/**
 * Extracts a human-readable identifier from the error message.
 */
function extractName(message: string): string | undefined {
	const patterns = [NOT_DEFINED_RE, TDZ_RE, NULL_PROP_RE, NOT_FUNCTION_RE];
	for (const pattern of patterns) {
		const match = pattern.exec(message);
		if (match) {
			return match[1];
		}
	}
	return undefined;
}

// ─── Source line extraction ─────────────────────────────────

/**
 * Extracts the source line at a given 1-based line number.
 */
function extractSourceLine(
	source: string,
	line: number | undefined,
): string | undefined {
	if (line === undefined || line < 1) {
		return undefined;
	}
	const lines = source.split('\n');
	const index = line - 1;
	return index < lines.length ? lines[index].trim() : undefined;
}

// ─── AST-based suggestion generation ────────────────────────

/**
 * Collects all declared variable names from the AST.
 */
function collectDeclaredNames(ast: Node): readonly string[] {
	const names: readonly string[] = [];

	walk(ast as any, {
		enter(node: any) {
			if (node.type === 'VariableDeclarator' && node.id?.name) {
				names.push(node.id.name as string);
			}
		},
	});

	return names;
}

/**
 * Simple similarity check: returns true when one name is a
 * case-insensitive match or a prefix of the other (length >= 3).
 */
function isSimilar(a: string, b: string): boolean {
	const al = a.toLowerCase();
	const bl = b.toLowerCase();
	if (al === bl) {
		return true;
	}
	if (al.length >= 3 && bl.startsWith(al)) {
		return true;
	}
	if (bl.length >= 3 && al.startsWith(bl)) {
		return true;
	}
	return false;
}

/**
 * Generates a suggestion based on error type and AST context.
 */
function generateSuggestion(
	error: ErrorInput,
	name: string | undefined,
	ast: Node | null,
	node: Node | undefined,
): string | undefined {
	// "not defined" + AST → check for similar variable names
	if (error.message.includes('is not defined') && name && ast) {
		const declared = collectDeclaredNames(ast);
		const similar = declared.find((d) => d !== name && isSimilar(d, name));
		if (similar) {
			return `Did you mean \`${similar}\`?`;
		}
	}

	// null property access + prompt() on the same line → suggest null check
	if (error.message.includes('Cannot read properties of null') && node) {
		const hasPrompt = isPromptRelated(node);
		if (hasPrompt) {
			return 'Check if `prompt()` returned `null` (user clicked Cancel) before using the result.';
		}
	}

	// const assignment → suggest let
	if (error.message.includes('Assignment to constant variable')) {
		return 'If you need to change this variable later, declare it with `let` instead of `const`.';
	}

	return undefined;
}

/**
 * Checks whether a node or its ancestors involve a prompt() call.
 * Simple heuristic: looks for "prompt" identifier in the node tree.
 */
function isPromptRelated(node: Node): boolean {
	let found = false;
	walk(node as any, {
		enter(child: any) {
			if (child.type === 'Identifier' && child.name === 'prompt') {
				found = true;
			}
		},
	});
	return found;
}

// ─── Main function ──────────────────────────────────────────

/**
 * Extracts structured context from an error, source, and optional AST.
 *
 * @param error - The error to analyze
 * @param source - The JEJ program source code
 * @param ast - Pre-parsed AST (or `null` if parsing failed). Typed as
 *   `Node | null` so the entry can pass `embodiment.raw.ast` (typed as
 *   `AcornNode | null`) without an extra cast.
 * @returns A frozen `ErrorContext` with all available fields
 */
function extractContext(
	error: ErrorInput,
	source: string,
	ast: Node | null,
): Readonly<ErrorContext> {
	const name = extractName(error.message);
	const expression = extractSourceLine(source, error.line);
	const node = ast && error.line ? findNodeAtLine(ast, error.line) : undefined;
	const suggestion = generateSuggestion(error, name, ast, node);

	const context: ErrorContext = {
		errorName: error.name,
		errorMessage: error.message,
		...(error.line !== undefined && { line: error.line }),
		...(error.column !== undefined && { column: error.column }),
		...(name !== undefined && { name }),
		...(expression !== undefined && { expression }),
		...(suggestion !== undefined && { suggestion }),
	};

	return deepFreezeInPlace(context);
}

export default extractContext;
