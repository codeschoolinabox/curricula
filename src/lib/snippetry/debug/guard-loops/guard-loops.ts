/**
 * Loop Guard Injection System
 *
 * Prevents infinite loops in learner-submitted JavaScript by injecting
 * iteration counters and safety checks into `while` loop constructs via
 * AST transformation.
 *
 * The system works by:
 * 1. Parsing code into an Abstract Syntax Tree (AST) using recast
 * 2. Walking the AST to find `while` loops (pre-order, reading order)
 * 3. Injecting counter variables and safety checks at the beginning of each
 *    loop body
 * 4. Throwing RangeError when loop iteration limits are exceeded
 *
 * `for-of` loops are not guarded — they iterate finite collections and
 * cannot produce infinite loops.
 */

import * as recast from 'recast';
import { walk } from 'estree-walker';

import deepFreeze from '@utils/deep-freeze.js';

import type { Node } from 'estree';

import type {
	CodeInput,
	CodeOutput,
	ExtendedNode,
	LoopGuardComponents,
} from './types.js';

/**
 * Generates loop guard components for a specific loop.
 *
 * Creates both the counter variable declaration and the safety check
 * statement that will be injected into the loop body.
 *
 * @param id - Unique identifier for this loop guard (e.g., 1, 2, 3)
 * @param max - Maximum allowed iterations before throwing RangeError
 * @returns Object containing variable declaration and check statements
 */
function generateLoopGuard(id: number, max: number): LoopGuardComponents {
	const variable = recast.parse(`let loop${id} = 0;`).program.body[0];
	(variable as ExtendedNode).generated = true;

	const checkCode = `if (++loop${id} > ${max}) throw new RangeError("Loop ${id} exceeded ${max} iterations.");`;

	const check = recast.parse(checkCode).program.body;
	for (const stmt of check) {
		(stmt as ExtendedNode).generated = true;
	}

	return { variable, check };
}

/**
 * Adds a blank line after each loop guard check in the output string.
 *
 * The guard check (e.g. `if (++loop1 > 10) throw new RangeError(...)`) should
 * be visually separated from the learner's original code for readability.
 */
function insertBlankLinesAfterGuards(code: string): string {
	return code.replace(
		/(throw new RangeError\("Loop \d+ exceeded \d+ iterations\."\);)/g,
		'$1\n',
	);
}

/**
 * Inserts loop guards into JavaScript code to prevent infinite loops.
 *
 * Accepts either raw JavaScript code as a string or a pre-parsed AST,
 * finds all `while` loops, and injects safety guards. Loops are numbered
 * in reading order (outer before inner) for learner clarity.
 *
 * @param evalCode - Input JavaScript code as string or parsed AST
 * @param maxIterations - Maximum allowed loop iterations before throwing error
 * @returns Modified code/AST with loop guards inserted, or original if no
 *          loops found
 *
 * @remarks When passed an AST node, the input is mutated in place by recast.
 *          The returned frozen copy is a clone of the mutated tree — the
 *          caller's original reference is also modified but not frozen.
 *
 * @throws {RangeError} At runtime when loop iteration limit exceeded
 *
 * @example
 * ```typescript
 * const unsafeCode = `
 *   while (true) {
 *     console.log('infinite loop!');
 *   }
 * `;
 *
 * const safeCode = guardLoops(unsafeCode, 100);
 * ```
 */
function guardLoops(evalCode: CodeInput, maxIterations: number): CodeOutput {
	const ast = typeof evalCode === 'object' ? evalCode : recast.parse(evalCode);

	// Pass 1: collect while loops in reading order (pre-order DFS).
	// This gives outer loops lower numbers than inner loops.
	const loops: Array<{ node: any; parent: any }> = [];

	(walk as any)(ast, {
		enter(node: any, parent: any) {
			if (node.type === 'WhileStatement') {
				loops.push({ node, parent });
			}
		},
	});

	if (loops.length === 0) return evalCode;

	// Pass 2: apply guards in reverse source order so splice indices stay stable.
	// Each loop gets its reading-order number (i + 1).
	for (let i = loops.length - 1; i >= 0; i--) {
		const { variable, check } = generateLoopGuard(i + 1, maxIterations);

		// WHY: recast preserves source formatting via in-place AST mutation.
		// New nodes would lose whitespace/comments. Exception to pure-functional
		// convention.
		loops[i].node.body.body.unshift(...check);

		const indexOfNode = loops[i].parent.body.indexOf(loops[i].node);
		loops[i].parent.body.splice(indexOfNode, 0, variable);
	}

	return typeof evalCode === 'object'
		? deepFreeze(ast as Node)
		: insertBlankLinesAfterGuards(recast.print(ast as any).code);
}

export default guardLoops;
