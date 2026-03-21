import type { Node } from 'estree';

/**
 * Input type for loop guard insertion — accepts either raw code string or
 * parsed AST.
 */
type CodeInput = string | Node;

/**
 * Output type for loop guard insertion — returns either processed code string
 * or modified AST.
 */
type CodeOutput = string | Node;

/**
 * Generated loop guard components containing variable declaration and check
 * statements.
 */
type LoopGuardComponents = {
	readonly variable: Node;
	readonly check: readonly Node[];
};

/**
 * Extended AST node with additional properties for tracking processing state.
 *
 * `generated` and `visited` are mutable by design — the AST walker sets them
 * during in-place transformation (see DOCS.md § AST Mutation Pattern).
 */
type ExtendedNode = Omit<Node, 'type'> & {
	readonly type: string;
	generated?: boolean;
	visited?: boolean;
};

export type { CodeInput, CodeOutput, LoopGuardComponents, ExtendedNode };
