import { parse } from 'acorn';
import type { Node, ParenthesizedExpression, Program } from 'acorn';
import { isDummy, parse as looseParse } from 'acorn-loose';

import ECMA_VERSION from './ecma-version.js';
import isNode from './is-node.js';
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
 * carries a `StageCause` in the parser's own voice — and beside it the failure
 * arm publishes the stage's account, the recovered tree of README § Failure
 * grammar: the recovering reader's re-read of the source, its invented nodes
 * enumerated, under the same `value` name the success arm uses.
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

	// only the parse is guarded. A grammar error is the learner's own data and
	// the cause built from it speaks in the parser's voice; the fold below is
	// embody's machinery, so it stays OUTSIDE this try — a defect there must
	// stay loud, never dressed up as a grammar error the learner never made.
	let program: Program;
	try {
		// the parser reads the source itself — acorn has no tokens→AST entry
		// point; the tokens stage gates this derivation, never feeds it.
		program = parse(snippet.source, {
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
	} catch (error) {
		return toRecoveredDerivation(toStageCause(error, 'ast'), snippet);
	}

	return {
		ast: { ok: true, value: program },
		parenSpansByNode: foldGroupingParens(program),
	};
}

function toFailedDerivation(cause: StageCause): AstDerivation {
	// nothing to record: the fold never ran, because there was no tree to fold
	return { ast: { ok: false, cause }, parenSpansByNode: new Map() };
}

/**
 * The recovering reader's derivation over a program that lexes but does not
 * parse: acorn-loose re-reads the source once — the one re-read the
 * per-instrument constraint admits — bridging what the source lacks by
 * inventing the least structure that lets reading continue. The recovered
 * tree rides the failure arm as the stage's account beside the machine's own
 * cause, and the reader's grouping-paren record leaves as the derivation's
 * second half, exactly as the machine's would. Deliberately its own function
 * beside `toFailedDerivation`: the tokens short-circuit must never recover
 * (a tokens failure publishes no recovered tree), and the split keeps that
 * true by shape.
 *
 * The read and the fold are guarded as one unit, unlike the machine arm,
 * where the fold stays outside the try because it walks a tree the parser
 * validated. Here both are one account derivation over an instrument's
 * unvalidated output, and README § Failure grammar rules the whole class: a
 * defect while deriving an account degrades that account alone — the arm
 * keeps its cause, no member publishes (an unfolded tree would carry
 * parenthesis nodes no path may traverse), and the report speaks of the
 * account failing, never of a broken machine invariant.
 */
function toRecoveredDerivation(
	cause: StageCause,
	snippet: Snippet,
): AstDerivation {
	// recovering is embody machinery deriving an account: a throw from it
	// degrades the account alone — the arm keeps the machine's cause, no
	// member publishes, and the report speaks of the account failing
	try {
		// the reader mirrors the machine's options so the recovered tree reads
		// the source under the same goal, language year, span vocabulary, and
		// paren recording the machine's tree would have carried
		const recovered = looseParse(snippet.source, {
			sourceType: snippet.type,
			ecmaVersion: ECMA_VERSION,
			ranges: true,
			preserveParens: true,
		});
		// the fold mutates the tree in place, so it runs before the invention
		// walk — every enumerated node is a node of the published tree
		const parenSpansByNode = foldGroupingParens(recovered);
		return {
			ast: {
				ok: false,
				cause,
				value: recovered,
				invented: enumerateInventions(recovered),
			},
			parenSpansByNode,
		};
	} catch (error) {
		console.error(
			`deriveAst: deriving the recovered account threw over a grammar failure — the account degrades without its tree (${
				error instanceof Error ? error.message : String(error)
			})`,
		);
		return { ast: { ok: false, cause }, parenSpansByNode: new Map() };
	}
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
function foldGroupingParens(program: Program): ParenSpansByNode {
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
			const held = unwrapGroupingParens(value, spansByNode);
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
		const held = unwrapGroupingParens(element, spansByNode);
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
function unwrapGroupingParens(
	node: Node,
	spansByNode: Map<Node, ReadonlyArray<ParenSpan>>,
): Node {
	if (!isGroupingParens(node)) {
		return node;
	}

	const spans: ParenSpan[] = [];
	let held: Node = node;
	while (isGroupingParens(held)) {
		spans.push({ start: held.start, end: held.end });
		held = held.expression;
	}
	spansByNode.set(held, spans);

	return held;
}

/** Whether the parse built this node around a pair of grouping parentheses. */
function isGroupingParens(node: Node): node is ParenthesizedExpression {
	return node.type === 'ParenthesizedExpression';
}

/**
 * Every invented node of the recovered tree — the nodes the recovering
 * reader supplied where the grammar demanded something the source lacks —
 * by reference into the tree itself, each once, in tree-walk order. A
 * reading the reader bridged without inventing enumerates none: an empty
 * enumeration beside a published tree is a legal state. The transient Set
 * guards the one-wrapper-per-slot reuse the parse permits (see NodePath);
 * Array.from, never a spread — the Docusaurus loose-mode hazard the
 * tokenizer drain documents applies to spreading any non-array iterable.
 */
function enumerateInventions(recovered: Program): ReadonlyArray<Node> {
	const invented = new Set<Node>();
	collectInventions(recovered, invented);
	return Array.from(invented);
}

function collectInventions(node: Node, invented: Set<Node>): void {
	if (isDummy(node)) {
		invented.add(node);
	}
	for (const child of childNodes(node)) {
		collectInventions(child, invented);
	}
}

// a node's direct child nodes, from object-valued and array-valued slots
// alike — the node check is what excludes every non-child key
function childNodes(node: Node): readonly Node[] {
	const slots = node as unknown as Record<string, unknown>;
	return Object.values(slots).flatMap((value) =>
		(Array.isArray(value) ? value : [value]).filter(
			(element): element is Node => isNode(element),
		),
	);
}
