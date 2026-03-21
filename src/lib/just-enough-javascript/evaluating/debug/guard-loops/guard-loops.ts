/**
 * Loop Guard Injection System
 *
 * Prevents infinite loops in learner-submitted JavaScript by injecting
 * iteration counters and safety checks into `while` and `for-of` loop
 * constructs during AST transformation.
 *
 * The system works by:
 * 1. Parsing code into an Abstract Syntax Tree (AST) using recast
 * 2. Walking the AST to find `while` and `for-of` loops
 * 3. Injecting counter variables and safety checks at the beginning of each
 *    loop body
 * 4. Throwing RangeError when loop iteration limits are exceeded
 */

import * as recast from 'recast';
import { walk } from 'estree-walker';

import deepFreeze from '../../../../utils/deep-freeze.js';

import type { Node } from 'estree';

import type {
	CodeInput,
	CodeOutput,
	ExtendedNode,
	LoopGuardComponents,
} from './types.js';

/**
 * Generates loop guard components for a specific loop iteration.
 *
 * Creates both the counter variable declaration and the safety check
 * statements that will be injected into the loop body.
 *
 * @param id - Unique identifier for this loop guard (e.g., 1, 2, 3)
 * @param max - Maximum allowed iterations before throwing RangeError
 * @returns Object containing variable declaration and check statements
 */
function generateLoopGuard(id: number, max: number): LoopGuardComponents {
	const variable = recast.parse(`let loopGuard_${id} = 0;`).program.body[0];
	(variable as ExtendedNode).generated = true;

	const checkCode = `
    loopGuard_${id}++;
    if (loopGuard_${id} > ${max}) {
      throw new RangeError("loopGuard_${id} is greater than ${max}");
    }
  `;

	const check = recast.parse(checkCode).program.body;
	for (const stmt of check) {
		(stmt as ExtendedNode).generated = true;
	}

	return { variable, check };
}

/**
 * Inserts loop guards into JavaScript code to prevent infinite loops.
 *
 * Accepts either raw JavaScript code as a string or a pre-parsed AST,
 * finds all `while` and `for-of` loops, and injects safety guards.
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

	// WHY: estree-walker's walk() uses callbacks with no state-threading
	// mechanism. A state object is the pragmatic alternative to bare `let`
	// closures (Convention #6 — no mutable closures).
	const walkState = { hasLoops: false, loopNumber: 1 };

	const guardedTree = (walk as any)(ast, {
		enter(node: any) {
			if (node.generated || node.visited) {
				// WHY: estree-walker binds `this` to a context with skip() — no
				// alternative API. Exception to Convention #5 (no `this`).
				(this as any).skip();
			}
		},

		leave(node: any, parent: any, _prop: string | number, _index: number) {
			if (node.type !== 'WhileStatement' && node.type !== 'ForOfStatement') {
				return;
			}

			walkState.hasLoops = true;

			const { variable, check } = generateLoopGuard(
				walkState.loopNumber,
				maxIterations,
			);

			// WHY: recast preserves source formatting via in-place AST mutation.
			// New nodes would lose whitespace/comments. Exception to pure-functional
			// convention.
			(node as any).body.body.unshift(...check);

			const indexOfNode = parent.body.indexOf(node);
			parent.body.splice(indexOfNode, 0, variable);

			node.visited = true;
			walkState.loopNumber++;
		},
	});

	const guarded: CodeOutput =
		typeof evalCode === 'object'
			? deepFreeze(guardedTree as Node)
			: recast.print(guardedTree as any).code;

	return walkState.hasLoops ? guarded : evalCode;
}

export default guardLoops;
