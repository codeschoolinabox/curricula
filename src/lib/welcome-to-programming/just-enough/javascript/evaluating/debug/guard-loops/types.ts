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
 * Extended AST node with a `generated` flag for marking injected nodes.
 *
 * `generated` is mutable by design — set during AST transformation to mark
 * nodes that were injected by the guard system (see DOCS.md § AST Mutation
 * Pattern).
 */
type ExtendedNode = Omit<Node, 'type'> & {
	readonly type: string;
	generated?: boolean;
};

export type { CodeInput, CodeOutput, LoopGuardComponents, ExtendedNode };
