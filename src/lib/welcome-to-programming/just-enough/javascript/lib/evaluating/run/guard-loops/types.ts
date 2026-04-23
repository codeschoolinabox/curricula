/**
 * Types for the run engine's loop-guard module.
 *
 * @see ./README.md § Glossary for the ubiquitous language.
 * @see ./DOCS.md for the architectural sketch.
 */

/**
 * AST node types that the module guards. Narrower than all JS loop types:
 * `ForInStatement` is deliberately excluded (not part of the JeJ surface).
 */
export type LoopType =
	| 'WhileStatement'
	| 'ForStatement'
	| 'DoWhileStatement'
	| 'ForOfStatement';

/**
 * Return shape of `guardLoops`. Contains the transformed source and the
 * number of loops guarded (IDs run `1..loopCount`). The caller uses
 * `loopCount` to decide how many `loopN` Worker-setup globals to declare.
 */
export type GuardResult = {
	readonly code: string;
	readonly loopCount: number;
};
