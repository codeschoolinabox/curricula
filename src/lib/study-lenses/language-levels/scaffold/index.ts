/**
 * The scaffold level's spine object — a trivially conforming language level
 * that tests and sandbox pages inject to exercise the level machinery. Its
 * validator flags exactly one thing: `debugger` statements, so every fit
 * mark is reachable with trivial programs (see ./README.md).
 *
 * @remarks
 * Injected-only: never on the built-in roster. The validator is
 * deterministic and order-stable — the same parse facts always produce the
 * same violations, in source order — and every violation is honestly
 * populated: real node type, the parser's own character offsets, the node's
 * dot-delimited path (the package's canonical node identity, rooted at `$`).
 * The spine object itself is deeply frozen at definition — it is a shared
 * module-level constant.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { LanguageLevel, ParseFacts, Violation } from '../types.js';

const scaffoldLevel: LanguageLevel = freezeInPlace({
	key: 'scaffold',
	label: 'Scaffold',
	validate,
	snippetTypes: ['module'],
	docs: {
		reference:
			'The scaffold level admits any parsing module without `debugger` statements — one rule, chosen so every fit mark is reachable.',
		notionalMachine:
			'No machine model of its own: the scaffold level exists to exercise level machinery, not to teach.',
	},
	editorSupport: { completion: null, format: null, hover: null },
	models: {},
});

function validate(facts: ParseFacts): ReadonlyArray<Violation> {
	return freezeInPlace(collectDebuggerStatements(facts.ast, '$'));
}

// A generic walk over every own property — arrays contribute their index as
// a path segment, syntax nodes contribute their property key — so a
// debugger statement is found in any position the grammar allows, never
// only in known containers. Property order in acorn nodes follows the
// grammar, so depth-first collection is source order.
function collectDebuggerStatements(node: unknown, path: string): Violation[] {
	if (Array.isArray(node)) {
		return node.flatMap((child, index) =>
			collectDebuggerStatements(child, `${path}.${index}`),
		);
	}
	if (!isSyntaxNode(node)) return [];

	const own =
		node.type === 'DebuggerStatement' ? [createViolation(node, path)] : [];
	const nested = Object.entries(node).flatMap(([key, value]) =>
		collectDebuggerStatements(value, `${path}.${key}`),
	);
	return [...own, ...nested];
}

type SyntaxNode = {
	readonly type: string;
	readonly start: number;
	readonly end: number;
};

function isSyntaxNode(node: unknown): node is SyntaxNode {
	if (typeof node !== 'object' || node === null) return false;
	return typeof (node as { readonly type?: unknown }).type === 'string';
}

function createViolation(node: SyntaxNode, path: string): Violation {
	return {
		location: { end: node.end, start: node.start },
		message: 'debugger statements are not part of the scaffold level',
		nodePath: path,
		nodeType: node.type,
	};
}

export default scaffoldLevel;
