import type { Node as AcornNode } from 'acorn';

// ── JSONPath ────────────────────────────────────────────────────────────────
// A JSONPath string rooted at the Program node.
// e.g. "$.body[0].declarations[0].init.left"
type JSONPath = string;

// ── Source span ─────────────────────────────────────────────────────────────
interface SourcePosition {
	line: number; // 1-based
	column: number; // 0-based
}

interface SourceLocation {
	start: SourcePosition;
	end: SourcePosition;
}

// ── Token ───────────────────────────────────────────────────────────────────
interface TokenType {
	label: string;
	keyword: string | undefined;
	beforeExpr: boolean;
	startsExpr: boolean;
	isLoop: boolean;
	isAssign: boolean;
	prefix: boolean;
	postfix: boolean;
	binop: number | null;
}

interface AugmentedToken {
	// --- acorn native fields ---
	type: TokenType;
	value: string | number | undefined; // undefined for punctuation
	start: number; // char offset, inclusive
	end: number; // char offset, exclusive

	loc: SourceLocation;

	// --- augmented fields ---

	// the raw source text: src.slice(start, end)
	text: string;

	// index into AugmentedTokenArray (stable integer id)
	index: number;

	// the innermost AST node whose span contains this token
	// null only for 'eof'
	innermostNode: AugmentedASTNode | null;

	// JSONPath to innermostNode — same information, serialization-safe
	innermostPath: JSONPath | null;

	// tokens immediately adjacent in the flat stream
	prevToken: AugmentedToken | null;
	nextToken: AugmentedToken | null;

	// whitespace/gap in the source between prevToken.end and this token's start
	// null for index === 0
	leadingGap: string | null;
}

interface AugmentedComment {
	isBlock: boolean; // true = /* */, false = //
	text: string; // content without delimiters
	start: number;
	end: number;
	loc: SourceLocation;

	// raw source text including delimiters: src.slice(start, end)
	raw: string;

	// the innermost AST node whose span contains this comment
	innermostNode: AugmentedASTNode | null;
	innermostPath: JSONPath | null;
}

// ── AST nodes ───────────────────────────────────────────────────────────────
// AugmentedASTNode wraps every node in the acorn AST tree uniformly.
// The 'node' field holds the original acorn node (with its type-specific
// fields like .name, .operator, .value, etc.) so we don't need to re-type
// the full ESTree spec here.

interface AugmentedASTNode {
	// --- acorn native fields (mirrored for convenience) ---
	type: string; // "Identifier", "BinaryExpression", etc.
	start: number;
	end: number;
	loc: SourceLocation;

	// --- path ---
	// JSONPath to this node from Program root
	path: JSONPath;

	// --- source text ---
	// src.slice(start, end) — the full source span including all children
	text: string;

	// --- tree links ---
	parent: AugmentedASTNode | null; // null only for Program
	children: AugmentedASTNode[]; // direct child nodes in source order

	// --- token links ---
	// all tokens whose span falls within [this.start, this.end]
	tokens: AugmentedToken[];

	// comments whose span falls within [this.start, this.end]
	comments: AugmentedComment[];

	// first and last token in this node's span (leaf nodes: these are equal)
	firstToken: AugmentedToken | null;
	lastToken: AugmentedToken | null;

	// --- original acorn node ---
	// the raw acorn node with all type-specific fields intact
	// (e.g. Identifier.name, BinaryExpression.operator, Literal.value, etc.)
	acornNode: AcornNode;
}

// ── Top-level augmented structure ───────────────────────────────────────────
interface AugmentedTokenArray extends Array<AugmentedToken> {
	// convenience: look up by char offset → the token that contains it
	// (not a method — this is metadata to be resolved externally)
	// included here as a reminder this lookup is O(log n) via binary search on start/end
}

interface AugmentedAST {
	// the source string, preserved verbatim
	source: string;

	// flat token stream in source order, including 'eof'
	tokens: AugmentedTokenArray;

	// all comments in source order
	comments: AugmentedComment[];

	// root of the augmented AST tree
	program: AugmentedASTNode;

	// ── index: JSONPath → AugmentedASTNode ──────────────────────────────────
	// primary path-based lookup: O(1) access to any node by its JSONPath
	// e.g. nodesByPath["$.body[0].declarations[0].init.left"]
	nodesByPath: Record<JSONPath, AugmentedASTNode>;

	// ── index: char offset → token ──────────────────────────────────────────
	// maps every char offset that is a token start to its AugmentedToken
	// (a sparse index — not every offset is a token start)
	tokensByOffset: Record<number, AugmentedToken>;

	// ── index: char offset → node ───────────────────────────────────────────
	// maps every char offset that is a node start to its innermost AugmentedASTNode
	nodesByOffset: Record<number, AugmentedASTNode>;
}
