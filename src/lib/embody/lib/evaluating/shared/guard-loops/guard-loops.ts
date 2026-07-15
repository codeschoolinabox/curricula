/**
 * @file Body-injection loop guard for the intercept engine.
 *
 * Prevents infinite loops by injecting iteration checks directly after
 * the opening `{` of each loop body, and counter resets after the
 * closing `}` (or after the trailing `while(cond);` for do-while).
 * Zero line shift, zero column shift on all source characters.
 *
 * @remarks
 * **Before:** `while (x < 10) {\n\tx++;\n}\n`
 * **After:**  `while (x < 10) { if (++loop1 > 100) throw new RangeError(...);\n\tx++;\n} loop1 = 0;\n`
 *
 * Covered loop types: `WhileStatement`, `ForStatement`,
 * `DoWhileStatement`, `ForOfStatement`. `ForInStatement` is
 * deliberately excluded — not in the JeJ curriculum surface.
 *
 * Counter variables (`loop1`, `loop2`, ...) are NOT declared in the
 * source code. The Worker script (create-worker-script.ts) emits
 * `var loop1 = 0, ..., loopN = 0;` as a Worker-setup global on the
 * same line as `"use strict"`.
 *
 * Each counter is reset to 0 after its loop's closing `}` so that
 * nested inner loops do not accumulate counts across outer iterations.
 *
 * The transformation uses recast only for parsing (to get AST node
 * positions). The actual injection is done via string insertion at
 * computed offsets — no recast.print, so formatting is fully preserved.
 */

import { walk } from 'estree-walker';
import * as recast from 'recast';

import type { GuardResult, LoopType } from './types.js';

export default function guardLoops(
	code: string,
	maxIterations: number,
): GuardResult {
	const ast = recast.parse(code);
	const loops: readonly CollectedLoop[] = collectLoops(ast);

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
function collectLoops(ast: unknown): readonly CollectedLoop[] {
	const loops: CollectedLoop[] = [];
	(walk as (node: unknown, walker: Record<string, unknown>) => void)(ast, {
		enter(node: Record<string, unknown>) {
			// Only guard loops whose body is a BlockStatement. Brace-less
			// bodies (e.g. `while (cond) x++;`) are skipped because the
			// injection anchors are `{` and `}` positions — without braces,
			// inserting at body.loc.start lands mid-token and produces a
			// SyntaxError. JeJ in practice always uses braced bodies
			// (prettier-formatted), but this keeps guardLoops total over all
			// AST inputs.
			if (
				isGuardedLoopType(node.type) &&
				isBlockStatement(node.body as Record<string, unknown> | undefined)
			) {
				loops.push({ loopType: node.type, node: node as unknown as LoopNode });
			}
		},
	});
	return loops;
}

function isBlockStatement(node: Record<string, unknown> | undefined): boolean {
	return node?.type === 'BlockStatement';
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
	lineStarts: readonly number[],
): readonly Insertion[] {
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

/**
 * Builds an array mapping 0-indexed line numbers to the character
 * offset where each line starts in the source string.
 *
 * @param source - The full source code string
 * @returns Array where index N is the character offset of line N's first char
 */
function computeLineStartOffsets(source: string): readonly number[] {
	const offsets = [0];
	for (let index = 0; index < source.length; index++) {
		if (source[index] === '\n') {
			offsets.push(index + 1);
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
	lineStarts: readonly number[],
): number {
	const TAB_WIDTH = 4;
	const lineStart = lineStarts[pos.line - 1];
	let visualCol = 0;
	let index = lineStart;

	while (visualCol < pos.column) {
		if (code[index] === '\t') {
			visualCol += TAB_WIDTH - (visualCol % TAB_WIDTH);
		} else {
			visualCol++;
		}
		index++;
	}

	return index;
}

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
	'DoWhileStatement',
	'ForOfStatement',
];
