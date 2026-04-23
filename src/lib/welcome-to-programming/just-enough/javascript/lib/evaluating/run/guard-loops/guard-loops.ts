/**
 * @file Body-injection loop guard for the run engine.
 *
 * Prevents infinite loops by injecting iteration checks directly after
 * the opening `{` of each `while` loop body, and counter resets after
 * the closing `}`. Zero line shift, zero column shift on the condition.
 *
 * @remarks
 * **Before:** `while (x < 10) {\n\tx++;\n}\n`
 * **After:**  `while (x < 10) { if (++loop1 > 100) throw new RangeError(...);\n\tx++;\n} loop1 = 0;\n`
 *
 * Counter variables (`loop1`, `loop2`, ...) are NOT declared in the
 * source code. They are passed as named parameters to `new Function`
 * by the worker script (see create-worker-script.ts), initialized to 0.
 *
 * Each counter is reset to 0 after its loop's closing `}` so that
 * nested inner loops do not accumulate counts across outer iterations.
 *
 * `for-of` loops are not guarded — they iterate finite collections.
 *
 * The transformation uses recast only for parsing (to get AST node
 * positions). The actual injection is done via string insertion at
 * computed offsets — no recast.print, so formatting is fully preserved.
 */

import * as recast from 'recast';
import { walk } from 'estree-walker';

import type { GuardResult, LoopType } from './types.js';

/**
 * Builds an array mapping 0-indexed line numbers to the character
 * offset where each line starts in the source string.
 *
 * @param source - The full source code string
 * @returns Array where index N is the character offset of line N's first char
 */
function computeLineStartOffsets(source: string): number[] {
	const offsets = [0];
	for (let i = 0; i < source.length; i++) {
		if (source[i] === '\n') {
			offsets.push(i + 1);
		}
	}
	return offsets;
}

/** Loc position from the AST — line is 1-indexed, column is 0-indexed. */
type AstPosition = { readonly line: number; readonly column: number };

/**
 * Converts an AST loc position to a character offset in the source string.
 *
 * Recast reports columns as visual positions where tabs expand to
 * `tabWidth` (default 4) columns. This function walks the actual
 * characters on the line, counting visual width, to find the true
 * character offset.
 *
 * @param pos - AST position (1-indexed line, visual column)
 * @param code - The original source string
 * @param lineStarts - Array from computeLineStartOffsets
 * @returns Character offset into the source string
 */
function toOffset(
	pos: AstPosition,
	code: string,
	lineStarts: number[],
): number {
	const TAB_WIDTH = 4;
	const lineStart = lineStarts[pos.line - 1];
	let visualCol = 0;
	let idx = lineStart;

	while (visualCol < pos.column) {
		if (code[idx] === '\t') {
			visualCol += TAB_WIDTH - (visualCol % TAB_WIDTH);
		} else {
			visualCol++;
		}
		idx++;
	}

	return idx;
}

/**
 * Injects body-injection guards into `while` loop bodies.
 *
 * @param code - JavaScript source code to transform
 * @param maxIterations - Maximum allowed iterations before throwing RangeError
 * @returns Object with transformed code and loop count. If no while
 *   loops are found, returns the original code unchanged with
 *   loopCount 0.
 *
 * @remarks Loops are numbered in reading order (pre-order DFS):
 * outer loops get lower numbers than inner loops. IDs start at 1.
 *
 * The transformation uses recast for AST parsing only (to get source
 * positions). String insertion at computed offsets preserves all
 * original formatting — no lines added, no columns shifted.
 */
/** Loop node shape we depend on — `body.loc` for guard insertion; full `loc`
 * for do-while reset insertion (statement end, past the trailing `while(cond);`). */
type LoopNode = {
	readonly body: {
		readonly loc: { readonly start: AstPosition; readonly end: AstPosition };
	};
	readonly loc: { readonly start: AstPosition; readonly end: AstPosition };
};

type CollectedLoop = {
	readonly loopType: LoopType;
	readonly node: LoopNode;
};

/** A single text insertion planned against the original source string. */
type Insertion = { readonly offset: number; readonly text: string };

/** Loop types this module guards. Single source of truth for the walker filter. */
const GUARDED_LOOP_TYPES: readonly LoopType[] = [
	'WhileStatement',
	'ForStatement',
];

function guardLoops(code: string, maxIterations: number): GuardResult {
	const ast = recast.parse(code);
	const loops: CollectedLoop[] = collectLoops(ast);

	if (loops.length === 0) {
		return { code, loopCount: 0 };
	}

	const lineStarts = computeLineStartOffsets(code);
	const insertions: Insertion[] = loops.flatMap((loop, index) =>
		planLoopInsertions(loop, index + 1, maxIterations, code, lineStarts),
	);

	// Descending offset is load-bearing — applying lower offsets first would
	// shift all higher offsets and invalidate the plan.
	insertions.sort((a, b) => b.offset - a.offset);

	let result = code;
	for (const { offset, text } of insertions) {
		result = result.slice(0, offset) + text + result.slice(offset);
	}

	return { code: result, loopCount: loops.length };
}

/**
 * Walks the AST in reading order and collects every node whose type is in
 * GUARDED_LOOP_TYPES. Classification happens here so later phases can dispatch
 * on loopType without re-reading AST node types.
 */
function collectLoops(ast: unknown): CollectedLoop[] {
	const loops: CollectedLoop[] = [];
	(walk as (node: unknown, walker: Record<string, unknown>) => void)(ast, {
		enter(node: Record<string, unknown>) {
			if (isGuardedLoopType(node.type)) {
				loops.push({ loopType: node.type, node: node as unknown as LoopNode });
			}
		},
	});
	return loops;
}

function isGuardedLoopType(nodeType: unknown): nodeType is LoopType {
	return (
		typeof nodeType === 'string' &&
		(GUARDED_LOOP_TYPES as readonly string[]).includes(nodeType)
	);
}

/**
 * Produces the two insertions for a single collected loop: the guard at the
 * top of the body (after `{`) and the counter reset at the loop's closing
 * position. For `while`, `for`, and `for-of` the reset sits after the body's
 * closing `}`; for `do-while` it sits at the full statement's parser-reported
 * end — after the trailing `;` if the learner wrote one, otherwise after the
 * closing `)` of `while (cond)` (ASI case). The reset text for `do-while`
 * begins with `;` so it can't fuse with a bare `while (cond)` as its body.
 */
function planLoopInsertions(
	loop: CollectedLoop,
	id: number,
	maxIterations: number,
	code: string,
	lineStarts: number[],
): Insertion[] {
	const { loopType, node } = loop;

	const guardOffset = toOffset(node.body.loc.start, code, lineStarts) + 1;
	const guardText = ` if (++loop${id} > ${maxIterations}) throw new RangeError("Loop ${id} exceeded ${maxIterations} iterations.");`;

	const resetAnchor =
		loopType === 'DoWhileStatement' ? node.loc.end : node.body.loc.end;
	const resetOffset = toOffset(resetAnchor, code, lineStarts);
	const resetText =
		loopType === 'DoWhileStatement' ? `; loop${id} = 0;` : ` loop${id} = 0;`;

	return [
		{ offset: guardOffset, text: guardText },
		{ offset: resetOffset, text: resetText },
	];
}

export default guardLoops;
