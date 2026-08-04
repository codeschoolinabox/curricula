import { parse } from 'acorn';
import type { Node, ParenthesizedExpression, Program } from 'acorn';

import ECMA_VERSION from './ecma-version.js';
import toStageCause from './to-stage-cause.js';
import type {
	AstDerivation,
	FactStage,
	ParenSpan,
	ParenSpansByNode,
	Snippet,
	StageCause,
	Tokens,
} from './types.js';

/**
 * Derive the ast fact stage from a snippet: the syntax tree parsed from the
 * source at the snippet's parse goal, gated by the tokens stage — together with
 * the parse's own record of where grouping parentheses sat.
 *
 * @remarks
 * The snippet type selects acorn's `sourceType` — grammar is goal-sensitive
 * (an import declaration parses in a module but is a grammar error in a
 * script). A failed tokens stage short-circuits: the ast stage carries the
 * tokens cause unchanged — spelling precedes grammar, and the failure's origin
 * stays named. A source that does not parse is data, not a throw: the stage
 * carries a `StageCause` in the parser's own voice.
 *
 * The parse recognizes grouping parentheses; this stage drops them again before
 * returning, so the published tree is ESTree-shaped and no path ever traverses
 * a pair. Where they sat leaves as the derivation's second half, for the
 * entwining stage to publish against node paths.
 */
export default function deriveAst(
	snippet: Snippet,
	tokens: FactStage<Tokens>,
): AstDerivation {
	// spelling precedes grammar — a failed tokens stage short-circuits, carrying
	// the same cause object so the origin stays named; nothing re-parses.
	if (!tokens.ok) {
		return toFailedDerivation(tokens.cause);
	}

	try {
		// the parser reads the source itself — acorn has no tokens→AST entry
		// point; the tokens stage gates this derivation, never feeds it.
		const program = parse(snippet.source, {
			sourceType: snippet.type,
			ecmaVersion: ECMA_VERSION,
			// ranges feeds the environment stage: eslint-scope's resolution reads
			// `node.range` and throws without it. A test pins this option (unlike
			// the ecmaVersion numeral, whose effect has no cheap local observable).
			ranges: true,
			// the parser is the only authority on which parentheses group an
			// expression: a call's, a parameter list's and a control head's are not
			// nodes at all, and neither the source text nor the token stream
			// recovers that judgment. Keeping them is what makes the record below
			// possible; the fold that follows is this option's counterpart, and the
			// pair leaves the tree exactly as it would parse without either.
			preserveParens: true,
		});
		const parenSpansByNode = foldGroupings(program);

		return { ast: { ok: true, value: program }, parenSpansByNode };
	} catch (error) {
		return toFailedDerivation(toStageCause(error, 'ast'));
	}
}

function toFailedDerivation(cause: StageCause): AstDerivation {
	// nothing to record: the fold never ran, because there was no tree to fold
	return { ast: { ok: false, cause }, parenSpansByNode: new Map() };
}

/**
 * Drop every grouping-parenthesis wrapper the parse built, rewiring each slot
 * to the expression its pair held, and record where each pair sat against the
 * node it wrapped.
 *
 * The tree is the parser's own, edited in place before it leaves this file:
 * slots are reassigned, never rebuilt, so every surviving node keeps its
 * identity, its span, and the very `range` array the parse gave it.
 */
function foldGroupings(program: Program): ParenSpansByNode {
	const spansByNode = new Map<Node, ReadonlyArray<ParenSpan>>();
	foldSlots(program, spansByNode);

	return spansByNode;
}

// `Object.keys` snapshots the names before the walk rewires anything, and
// assigning a key that already exists leaves enumeration order untouched — which
// is what keeps the published tree indistinguishable from a parse that never saw
// a pair, down to the order a consumer enumerates each node's children in.
function foldSlots(
	node: Node,
	spansByNode: Map<Node, ReadonlyArray<ParenSpan>>,
): void {
	const slots = node as unknown as Record<string, unknown>;

	for (const key of Object.keys(slots)) {
		const value = slots[key];
		if (Array.isArray(value)) {
			foldElements(value, spansByNode);
		} else if (isNode(value)) {
			const held = unwrapGroupings(value, spansByNode);
			slots[key] = held;
			foldSlots(held, spansByNode);
		}
	}
}

// an element is rewritten at its own index, never filtered into a fresh array:
// rebuilding would collapse an elision (`[(1), , (2)]`) and shift every later
// sibling one position earlier.
function foldElements(
	elements: unknown[],
	spansByNode: Map<Node, ReadonlyArray<ParenSpan>>,
): void {
	for (let index = 0; index < elements.length; index++) {
		const element = elements[index];
		if (!isNode(element)) {
			continue;
		}
		const held = unwrapGroupings(element, spansByNode);
		elements[index] = held;
		foldSlots(held, spansByNode);
	}
}

/**
 * The expression a stack of grouping parentheses held, with every pair's span
 * recorded against it — outermost first, which is ascending `start` and the
 * order the source reads. A node no pair wrapped comes back untouched and earns
 * no entry: the record is sparse, and an empty list is never made.
 */
function unwrapGroupings(
	node: Node,
	spansByNode: Map<Node, ReadonlyArray<ParenSpan>>,
): Node {
	if (!isGrouping(node)) {
		return node;
	}

	const spans: ParenSpan[] = [];
	let held: Node = node;
	while (isGrouping(held)) {
		spans.push({ start: held.start, end: held.end });
		held = held.expression;
	}
	spansByNode.set(held, spans);

	return held;
}

/** Whether the parse built this node around a pair of grouping parentheses. */
function isGrouping(node: Node): node is ParenthesizedExpression {
	return node.type === 'ParenthesizedExpression';
}

/**
 * Whether a value looks like an acorn node: a non-null object with a string
 * `type`. The minimal shape every ESTree node shares — and the whole guarantee
 * this walk needs, which is why it carries no metadata-key list: `start` and
 * `end` are numbers, `range` is a pair of them, and a source location has no
 * `type`, so none of them can pass the check.
 */
function isNode(value: unknown): value is Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as Record<string, unknown>).type === 'string'
	);
}
