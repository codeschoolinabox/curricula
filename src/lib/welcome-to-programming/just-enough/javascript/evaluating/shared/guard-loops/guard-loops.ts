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

/**
 * Result of guard injection — includes the transformed code and the
 * number of loops found (needed by the worker to know how many
 * `loopN` parameters to create for `new Function`).
 */
type GuardResult = {
	/** Transformed code with body-injection guards */
	readonly code: string;
	/** Number of while loops found and guarded */
	readonly loopCount: number;
};

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
function guardLoopsCondition(code: string, maxIterations: number): GuardResult {
	const ast = recast.parse(code);

	// Collect while loops in reading order (pre-order DFS)
	const loops: Array<{
		node: {
			body: {
				loc: { start: AstPosition; end: AstPosition };
			};
		};
	}> = [];

	(walk as (node: unknown, walker: Record<string, unknown>) => void)(ast, {
		enter(node: Record<string, unknown>) {
			if (node.type === 'WhileStatement') {
				loops.push({
					node: node as (typeof loops)[number]['node'],
				});
			}
		},
	});

	if (loops.length === 0) {
		return { code, loopCount: 0 };
	}

	const lineStarts = computeLineStartOffsets(code);

	// Collect all insertions with their offsets in the original string.
	// Applying them from highest offset to lowest guarantees each
	// insertion doesn't shift any remaining (lower) offsets.
	type Insertion = { readonly offset: number; readonly text: string };
	const insertions: Insertion[] = [];

	for (let i = 0; i < loops.length; i++) {
		const id = i + 1;
		const body = loops[i].node.body;

		// Guard check: insert AFTER opening {
		const openOffset = toOffset(body.loc.start, code, lineStarts);
		insertions.push({
			offset: openOffset + 1,
			text: ` if (++loop${id} > ${maxIterations}) throw new RangeError("Loop ${id} exceeded ${maxIterations} iterations.");`,
		});

		// Counter reset: insert AFTER closing }
		const closeOffset = toOffset(body.loc.end, code, lineStarts);
		insertions.push({
			offset: closeOffset,
			text: ` loop${id} = 0;`,
		});
	}

	insertions.sort((a, b) => b.offset - a.offset);

	let result = code;
	for (const { offset, text } of insertions) {
		result = result.slice(0, offset) + text + result.slice(offset);
	}

	return {
		code: result,
		loopCount: loops.length,
	};
}

export default guardLoopsCondition;
export type { GuardResult };
