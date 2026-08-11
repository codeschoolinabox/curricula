/**
 * @file The loc wrap — intercept's second instrumentation pass, run on the
 * GUARDED source (iteration guards spliced first, on the original text).
 *
 * Rewrites every call expression it can safely enclose into a call to the
 * `__$lc` helper (types.ts Seam 5), carrying the call's own span READ FROM
 * THE ORIGINAL learner text — placement is computed against the guarded
 * text, whose columns are shifted on every line a guard or reset call was
 * spliced into, while the span reported is the learner's own (README
 * § Design commitments). The two readings are reconciled: one syntactic
 * eligibility predicate runs over both parses' call lists (briefing
 * decision B-2), and a disagreement about which wrap-eligible calls exist
 * throws the typed boundary error below — a machinery defect the assemble
 * phase settles as `'defect'`/`'unreachable-outcome'`, never a silently
 * shifted span.
 *
 * The wrap preserves the program's meaning or declines: a call whose
 * `await`/`yield` belongs to the enclosing function, one inside an optional
 * chain, a `super(…)` call, and direct `eval` are left as the learner wrote
 * them and carry no location (B-3). A `__$`-prefixed callee name marks the
 * guard protocol's own calls, which are skipped, never wrapped. The rewrite is
 * bottom-up, so nesting needs no offset bookkeeping, and every insertion is
 * same-line — lines are preserved 1:1.
 *
 * The span rides ENCODED (`'L:C:L:C'`, 1-based lines / 0-based columns —
 * the region's one encoding, B-1) and is decoded only where a record or a
 * halt needs it, worker-side.
 */

import { parse } from 'acorn';
import type { Node } from 'acorn';

/**
 * Wrap the guarded source's call expressions for loc attribution.
 *
 * @param sources - The two texts and the fixed parse goal: `guarded` is the
 *   text the rewrite splices into; `original` is the learner's own text the
 *   spans are read from; `sourceType` is the snippet's own parse goal —
 *   fixed, never inferred, so a program that parsed upstream cannot fail to
 *   parse here.
 * @returns The instrumented source. The guarded input by reference when no
 *   call is wrap-eligible.
 * @throws The typed boundary error (`locWrapBoundary: true`) when the two
 *   readings disagree about which wrap-eligible calls exist — a machinery
 *   defect, not a learner condition.
 */
export default function wrapCallExpressions(sources: WrapSources): string {
	const { guarded, original, sourceType } = sources;
	const guardedProgram = parseSource(guarded, sourceType);
	const eligible = collectEligibleCalls(guardedProgram);
	const originalEligible = collectEligibleCalls(
		parseSource(original, sourceType),
	);

	if (eligible.length !== originalEligible.length) {
		throw makeReconciliationError(
			`the two readings disagree about which wrap-eligible calls exist (guarded ${eligible.length}, original ${originalEligible.length})`,
		);
	}
	for (const [index, call] of eligible.entries()) {
		assertSameCallShape(call, originalEligible[index], index);
	}
	if (eligible.length === 0) {
		return guarded;
	}

	// Transient, identity-keyed, never frozen or serialized — the one shape
	// DEV.md § 13 reserves Map for. Pairing is by shared reading order: the
	// guard splice adds only __$-prefixed calls (filtered out) and cannot
	// reshape a learner call's subtree, so index i on one side IS index i on
	// the other once both lists passed the same predicate.
	const encodedSpans = new Map<Node, string>();
	for (const [index, call] of eligible.entries()) {
		encodedSpans.set(call, encodeSpan(originalEligible[index]));
	}

	return rewriteInterior(guardedProgram, 0, guarded.length, {
		source: guarded,
		encodedSpans,
	});
}

/** The verb's input: both texts plus the snippet's own parse goal. */
type WrapSources = {
	readonly guarded: string;
	readonly original: string;
	readonly sourceType: 'script' | 'module';
};

type RewriteContext = {
	readonly source: string;
	/** Wrapped call → its encoded span. Membership IS the wrap set — one
	 * structure, so a wrapped call can never lack its pairing. */
	readonly encodedSpans: ReadonlyMap<Node, string>;
};

/** Node keys that never hold child nodes; everything else is walked. */
const META_KEYS = new Set(['type', 'start', 'end', 'loc']);

/**
 * An await/yield inside these belongs to the nested function, not to the
 * function enclosing the call being judged — the walk never descends past
 * them. `StaticBlock` is deliberately absent: the grammar forbids a direct
 * await/yield there, and any function nested inside one is already covered.
 */
const FUNCTION_BOUNDARY_TYPES = new Set([
	'FunctionDeclaration',
	'FunctionExpression',
	'ArrowFunctionExpression',
]);

const SUSPENSION_TYPES = new Set(['AwaitExpression', 'YieldExpression']);

/** The keys that continue a chain's spine downward from its root. */
const SPINE_KEYS = new Set(['callee', 'object']);

/** Fixed parse goal, loud on failure — never a fallback (README § Design
 * commitments: the same goal the snippet was parsed with). */
function parseSource(code: string, sourceType: 'script' | 'module'): Node {
	return parse(code, { ecmaVersion: 'latest', sourceType, locations: true });
}

/**
 * Every wrap-eligible call in pre-order reading order — the one predicate
 * both readings share (briefing decision B-2). A call is eligible unless:
 * its callee name carries the `__$` prefix (the guard protocol's own
 * calls); its callee is `Super` or direct `eval` (a call whose scope is its
 * own call site); it sits anywhere inside an optional chain (wrapping an
 * interior link would defeat the chain's short-circuit); or an
 * `await`/`yield` belonging to the enclosing function sits anywhere in its
 * own subtree (the wrap's arrow would change what suspends, or not parse).
 */
function collectEligibleCalls(root: Node): readonly Node[] {
	const calls: Node[] = [];
	visitForCalls(root, 'none', calls);
	return calls;
}

/**
 * Where a node sits relative to an optional chain: `'none'` outside one,
 * `'root'` for the chain's outermost expression (whose span covers the whole
 * chain, so wrapping it is safe), `'interior'` for a link reached by
 * descending the chain's SPINE from that root — the only position where a
 * wrap would defeat the short-circuit (human ruling H-5). A call reached
 * off any other key, an argument especially, leaves the spine and is judged
 * by the ordinary rules.
 */
type SpinePosition = 'none' | 'root' | 'interior';

function visitForCalls(
	node: Node,
	position: SpinePosition,
	calls: Node[],
): void {
	eachChildNode(node, function collectChild(child, key) {
		const childPosition = spinePositionOf(node, position, key);
		if (child.type === 'CallExpression' && isEligible(child, childPosition)) {
			calls.push(child);
		}
		visitForCalls(child, childPosition, calls);
	});
}

function spinePositionOf(
	node: Node,
	position: SpinePosition,
	key: string,
): SpinePosition {
	if (node.type === 'ChainExpression') {
		return key === 'expression' ? 'root' : 'none';
	}
	if (position === 'none' || !SPINE_KEYS.has(key)) {
		return 'none';
	}
	return 'interior';
}

function isEligible(call: Node, position: SpinePosition): boolean {
	if (position === 'interior') {
		return false;
	}
	// WHY the cast: acorn's public `Node` type carries only type/start/end/loc;
	// per-node fields (callee, arguments, name) are reached through documented
	// narrow casts, the same bridge loop-guard's walker uses.
	const { callee } = call as unknown as { callee: Node };
	if (callee.type === 'Super') {
		return false;
	}
	if (callee.type === 'Identifier') {
		const { name } = callee as unknown as { name: string };
		if (name.startsWith('__$') || name === 'eval') {
			return false;
		}
	}
	return !subtreeSuspends(call);
}

/** True when the call's own subtree holds an await/yield that belongs to
 * the function enclosing the call — nested function bodies are opaque. */
function subtreeSuspends(node: Node): boolean {
	let suspends = false;
	eachChildNode(node, function inspectChild(child) {
		if (suspends || FUNCTION_BOUNDARY_TYPES.has(child.type)) {
			return;
		}
		if (SUSPENSION_TYPES.has(child.type) || subtreeSuspends(child)) {
			suspends = true;
		}
	});
	return suspends;
}

/**
 * Bottom-up rewrite of one range: each topmost wrapped call in the range is
 * enclosed as `__$lc('<span>', () => <interior>)`, its own interior
 * rewritten first by the recursion — so nesting needs no offset
 * bookkeeping, and a declined call's text still carries its wrapped inner
 * calls.
 */
function rewriteInterior(
	container: Node,
	start: number,
	end: number,
	context: RewriteContext,
): string {
	const topmost = collectTopmostWrapped(container, context.encodedSpans);
	topmost.sort((left, right) => left.start - right.start);

	let result = '';
	let cursor = start;
	for (const call of topmost) {
		result += context.source.slice(cursor, call.start);
		result += `__$lc('${spanOf(call, context)}', () => ${rewriteInterior(call, call.start, call.end, context)})`;
		cursor = call.end;
	}
	return result + context.source.slice(cursor, end);
}

/** The pairing read, loud on the impossible miss — a silently empty span
 * would be the exact mis-attribution this module exists to prevent. */
function spanOf(call: Node, context: RewriteContext): string {
	const span = context.encodedSpans.get(call);
	if (span === undefined) {
		throw new Error(
			'wrapCallExpressions: a wrapped call lost its span pairing — a machinery defect, never a learner condition',
		);
	}
	return span;
}

/** The wrapped calls under `container` that no other wrapped call encloses
 * first — the recursion handles deeper ones inside each call's own rewrite. */
function collectTopmostWrapped(
	container: Node,
	encodedSpans: ReadonlyMap<Node, string>,
): Node[] {
	const topmost: Node[] = [];
	eachChildNode(container, function findTopmost(child) {
		if (encodedSpans.has(child)) {
			topmost.push(child);
			return;
		}
		topmost.push(...collectTopmostWrapped(child, encodedSpans));
	});
	return topmost;
}

/** Walks a node's direct child nodes — array-valued and single — in key
 * order, skipping the meta keys. */
function eachChildNode(
	node: Node,
	visit: (child: Node, key: string) => void,
): void {
	for (const key of Object.keys(node)) {
		if (META_KEYS.has(key)) {
			continue;
		}
		const value = (node as unknown as Record<string, unknown>)[key];
		const items = Array.isArray(value) ? value : [value];
		for (const item of items) {
			if (isNode(item)) {
				visit(item, key);
			}
		}
	}
}

function isNode(value: unknown): value is Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as { readonly type?: unknown }).type === 'string'
	);
}

/** `'L:C:L:C'` — the region's one span encoding (B-1), read from the
 * ORIGINAL text's parse. */
function encodeSpan(call: Node): string {
	const { loc } = call as unknown as {
		loc: {
			start: { line: number; column: number };
			end: { line: number; column: number };
		};
	};
	return `${loc.start.line}:${loc.start.column}:${loc.end.line}:${loc.end.column}`;
}

/**
 * The pairwise leg of the reconciliation: index i on one reading must be
 * the same call as index i on the other. Count equality alone would let two
 * unrelated same-count texts reconcile silently and mis-attribute every
 * span — the structural fingerprint (callee type, argument count) catches a
 * stale-original caller bug without re-implementing the eligibility
 * predicate it verifies.
 */
function assertSameCallShape(
	guardedCall: Node,
	originalCall: Node,
	index: number,
): void {
	const guarded = fingerprintOf(guardedCall);
	const original = fingerprintOf(originalCall);
	if (guarded !== original) {
		throw makeReconciliationError(
			`the two readings pair different calls at position ${index + 1} (guarded ${guarded}, original ${original})`,
		);
	}
}

function fingerprintOf(call: Node): string {
	const { callee, arguments: callArguments } = call as unknown as {
		callee: Node;
		arguments: readonly unknown[];
	};
	return `${callee.type}/${callArguments.length}`;
}

/** The typed boundary error (loop-guard's shape): a machinery defect the
 * assemble phase settles as 'defect'/'unreachable-outcome', never a
 * silently shifted span. */
function makeReconciliationError(detail: string): Error {
	return Object.assign(
		new Error(
			`wrapCallExpressions: ${detail} — a machinery defect, never a learner condition`,
		),
		{
			locWrapBoundary: true as const,
			reason: 'reconciliation-mismatch' as const,
		},
	);
}
