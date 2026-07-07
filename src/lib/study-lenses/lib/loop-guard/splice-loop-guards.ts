/**
 * @file The shared loop-guard splicer — the one verb this module owns.
 *
 * Finds every guarded loop (`while` / classic `for` / `do-while` / `for-of`
 * with a braced body) in a source string and splices caller-supplied guard/reset
 * call text into it, without moving a line. See README.md § Ubiquitous language
 * for the vocabulary and DOCS.md for the parse → collect → allocate → plan →
 * apply phase model this implements.
 */

import { parse } from 'acorn';
import type { Node } from 'acorn';
import { walk } from 'estree-walker';

import type {
	GuardResult,
	LoopLoc,
	MakeGuard,
	MakeReset,
	SpliceHooks,
} from './types.js';

export default function spliceLoopGuards(
	code: string,
	{ makeGuard, makeReset }: SpliceHooks,
): GuardResult {
	const loops = collectLoops(parseSource(code));

	// Empty ⇒ identity: return the input string itself, no reprint.
	if (loops.length === 0) {
		return Object.freeze({ code, loopCount: 0 });
	}

	const insertions = loops.flatMap((loop, index) =>
		planInsertions(loop, index + 1, makeGuard, makeReset),
	);

	// Highest offset first is load-bearing — splicing a lower offset first would
	// shift every higher offset and invalidate the rest of the plan.
	insertions.sort((left, right) => right.offset - left.offset);

	let result = code;
	for (const { offset, text } of insertions) {
		result = result.slice(0, offset) + text + result.slice(offset);
	}

	return Object.freeze({ code: result, loopCount: loops.length });
}

/**
 * AST node types this module guards — the single source of truth for the guarded
 * set. Internal: no consumer passes or receives a loop type.
 */
const GUARDED_LOOP_TYPES = [
	'WhileStatement',
	'ForStatement',
	'ForOfStatement',
	'DoWhileStatement',
] as const;
type LoopType = (typeof GUARDED_LOOP_TYPES)[number];

/**
 * The loop-node shape we depend on. acorn annotates every node with absolute
 * offsets (`start`/`end`) and, under `locations: true`, a `loc`; `body` is on
 * every loop statement but not on the base `Node` type.
 */
type LoopNode = {
	readonly body: {
		readonly type: string;
		readonly start: number;
		readonly end: number;
	};
	readonly loc: LoopLoc;
};

type CollectedLoop = {
	readonly loopType: LoopType;
	readonly bodyStart: number;
	readonly bodyEnd: number;
	readonly stmtEnd: number;
	readonly loc: LoopLoc;
};

type Insertion = { readonly offset: number; readonly text: string };

/**
 * Parses to an AST with absolute offsets and locations. Module semantics first,
 * script as a fallback so admissible script-only source (e.g. `with`) still
 * parses; loop grammar is identical across modes, so the fallback only widens
 * acceptance.
 */
function parseSource(code: string): Node {
	try {
		return parse(code, {
			ecmaVersion: 'latest',
			sourceType: 'module',
			locations: true,
		});
	} catch {
		return parse(code, {
			ecmaVersion: 'latest',
			sourceType: 'script',
			locations: true,
		});
	}
}

/**
 * Walks the AST in reading order (pre-order) and collects every guarded loop
 * with a braced body, capturing its splice offsets and its own span.
 */
function collectLoops(ast: Node): readonly CollectedLoop[] {
	const loops: CollectedLoop[] = [];
	// estree-walker types nodes as the estree union, not acorn's `Node`; one
	// documented cast bridges them (the oracle does the same).
	(
		walk as unknown as (
			node: Node,
			handlers: { enter(node: Node): void },
		) => void
	)(ast, {
		enter(node) {
			if (!isGuardedLoopType(node.type)) {
				return;
			}
			const loop = node as unknown as LoopNode;
			if (loop.body.type !== 'BlockStatement') {
				return;
			}
			loops.push({
				loopType: node.type,
				bodyStart: loop.body.start,
				bodyEnd: loop.body.end,
				stmtEnd: node.end,
				loc: loop.loc,
			});
		},
	});
	return loops;
}

function isGuardedLoopType(type: string): type is LoopType {
	return (GUARDED_LOOP_TYPES as readonly string[]).includes(type);
}

/**
 * The two insertions for one loop: the guard immediately after the body's
 * opening brace, and the reset after the loop's closing structure — the body's
 * `}` for every type except `do-while`, whose reset goes at the full statement's
 * end (past the trailing `while (cond);`). The do-while reset text is prefixed
 * with `;` so it stays a fresh statement regardless of the caller's text (the
 * do-while grammar already force-terminates after `)`, so this is a harmless
 * belt-and-suspenders — see DOCS.md § Reset self-termination).
 */
function planInsertions(
	loop: CollectedLoop,
	index: number,
	makeGuard: MakeGuard,
	makeReset: MakeReset,
): readonly Insertion[] {
	const isDoWhile = loop.loopType === 'DoWhileStatement';
	const resetOffset = isDoWhile ? loop.stmtEnd : loop.bodyEnd;
	const reset = makeReset(index);
	return [
		{ offset: loop.bodyStart + 1, text: makeGuard(index, loop.loc) },
		{ offset: resetOffset, text: isDoWhile ? `;${reset}` : reset },
	];
}
