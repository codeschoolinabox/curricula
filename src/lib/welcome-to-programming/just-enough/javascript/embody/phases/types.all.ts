// ─────────────────────────────────────────────────────────────────────────────
// JEJ Notional Machine — Phase Event Types
// Phases 0, 1, and 2 only. Phase 3 (execution) types are in phase-03-execution.md.
//
// All types are serialisable: no methods, no class instances, no Symbols.
// JSONPath strings use the $ prefix convention (e.g. "$.body[0].declarations[0]").
// ─────────────────────────────────────────────────────────────────────────────

type JSONPath = string; // always rooted at "$" (the Program node)

// ═════════════════════════════════════════════════════════════════════════════
// PHASE 0: SOURCE
// The source phase produces no events — it is a precondition, not a process.
// The single output is the SourceFile record below.
// ═════════════════════════════════════════════════════════════════════════════

/**
 * The complete, immutable record of a source file.
 * All subsequent phases carry a reference to this; all offsets index into `text`.
 */
interface SourceFile {
	/** The raw source string, exactly as received. Never modified. */
	text: string;

	/** Byte encoding declared or detected. "utf-8" in all JEJ contexts. */
	encoding: 'utf-8';

	/**
	 * Precomputed line start offsets for O(1) line/column lookup.
	 * lineOffsets[0] = 0 (line 1 starts at offset 0).
	 * lineOffsets[n] = char offset of the first character of line n+1.
	 */
	lineOffsets: number[];
}

/**
 * Resolves a character offset to a line/column position using a SourceFile.
 * Not a method — this shape describes what such a lookup produces.
 */
interface SourcePosition {
	line: number; // 1-based
	column: number; // 0-based
}

interface SourceSpan {
	start: SourcePosition;
	end: SourcePosition;
}

// ═════════════════════════════════════════════════════════════════════════════
// PHASE 1: PARSE AND VALIDATE
// Three sequential subphases: tokenization → AST-building → validation.
// Each subphase either succeeds (no event) or fails (one error event, terminal).
// ═════════════════════════════════════════════════════════════════════════════

// ─── 1a: Tokenization output ─────────────────────────────────────────────────

/**
 * The `type` field on a Token — describes the grammatical role of the token,
 * not the token's content. Shared across all tokens of the same kind.
 */
interface TokenType {
	/** Human-readable name. e.g. "const", "name", "num", "+/-", "=", "eof" */
	label: string;

	/** Set if this token type is a keyword. e.g. "const", "let", "if" */
	keyword: string | undefined;

	/** True if this token type may legally precede an expression. Used to
	 *  disambiguate `/` as division vs. regex literal start. */
	beforeExpr: boolean;

	/** True if this token type may legally begin an expression. */
	startsExpr: boolean;

	/** True if this token type is an assignment operator. */
	isAssign: boolean;

	/** Operator precedence level if this is a binary operator; null otherwise.
	 *  Higher number = tighter binding. e.g. `*` = 10, `+` = 9, `>` = 7. */
	binop: number | null;

	/** True if this token type may appear as a unary prefix operator. */
	prefix: boolean;

	/** True if this token type may appear as a unary postfix operator. */
	postfix: boolean;
}

/**
 * A single token produced by the tokenizer.
 * `source.text.slice(token.start, token.end)` always yields the raw text.
 */
interface Token {
	type: TokenType;

	/**
	 * The parsed value of this token.
	 * - string tokens: the string content (escape sequences resolved)
	 * - number tokens: the numeric value as a JS number
	 * - bigint tokens: the value as a JS bigint
	 * - identifier tokens: the identifier name as a string
	 * - punctuation/operator tokens: undefined
	 */
	value: string | number | bigint | undefined;

	/** Character offset of first character, inclusive. */
	start: number;

	/** Character offset after last character, exclusive. */
	end: number;

	loc: SourceSpan;
}

/**
 * A comment stripped from the token stream.
 * `source.text.slice(comment.start, comment.end)` includes the delimiters.
 */
interface Comment {
	/** true = block comment (/* ... *\/), false = line comment (// ...) */
	isBlock: boolean;

	/** Comment content without delimiters. */
	text: string;

	start: number;
	end: number;
	loc: SourceSpan;
}

/**
 * The complete output of subphase 1a.
 * The `eof` token is always the last element of `tokens`.
 */
interface TokenizerOutput {
	tokens: Token[];
	comments: Comment[];
}

// ─── 1b: AST-building output ──────────────────────────────────────────────────

/**
 * Minimal base shared by every AST node.
 * Type-specific fields (operator, name, value, kind, etc.) live on the
 * concrete node types defined by the ESTree spec — not re-typed here.
 * Access them via `node.acornNode` on AugmentedASTNode.
 */
interface ASTNodeBase {
	type: string;
	start: number;
	end: number;
	loc: SourceSpan;
}

// ─── 1a/1b/1c: Error events ───────────────────────────────────────────────────

/**
 * A tokenization failure. Always terminal — no further events fire after this.
 * Corresponds to parse subphase 1a.
 */
interface TokenizationError {
	phase: '1a:tokenization';
	kind: 'SyntaxError';

	/** Human-readable message. e.g. "Unexpected character '@' (1:10)" */
	message: string;

	/** Character offset where the invalid sequence starts. */
	pos: number;

	/** Character offset where the error was detected (may differ from pos
	 *  for unterminated constructs — pos is the opening delimiter,
	 *  raisedAt is the end of input). */
	raisedAt: number;

	loc: SourcePosition;
}

/**
 * An AST-building failure. Always terminal. Corresponds to subphase 1b.
 * Token stream was valid; grammar rule could not be satisfied.
 */
interface ASTBuildingError {
	phase: '1b:ast-building';
	kind: 'SyntaxError';
	message: string;
	pos: number;
	raisedAt: number;
	loc: SourcePosition;
}

/**
 * A JEJ validation rejection. Always terminal. Corresponds to subphase 1c.
 * The AST is syntactically valid JavaScript; the JEJ learning environment
 * rejected it for using a feature outside the JEJ language level.
 * This is NOT a JavaScript SyntaxError — it is a learning environment constraint.
 */
interface ValidationRejection {
	phase: '1c:validation';
	kind: 'ValidationRejection';

	/** Human-readable description of which feature was found and why it is rejected. */
	message: string;

	/** The AST node type that caused the rejection. e.g. "FunctionDeclaration" */
	nodeType: string;

	/** JSONPath to the offending node in the AST. */
	astPath: JSONPath;

	start: number;
	end: number;
	loc: SourceSpan;
}

type Phase1Error = TokenizationError | ASTBuildingError | ValidationRejection;

/**
 * The complete output of phase 1. Exactly one of `result` or `error` is set.
 */
interface Phase1Output {
	source: SourceFile;
	result: {
		tokens: Token[];
		comments: Comment[];
		ast: ASTNodeBase; // root Program node; cast to acorn.Program for full access
	} | null;
	error: Phase1Error | null;
}

// ═════════════════════════════════════════════════════════════════════════════
// PHASE 2: CREATION
// Walks the AST once. Fires a linear sequence of events.
// Only script-scope bindings are declared here.
// Block-scope bindings are declared in phase 3 at scope:open time.
// ═════════════════════════════════════════════════════════════════════════════

// ─── Shared vocabulary ────────────────────────────────────────────────────────

/** Every JEJ binding is one of these two kinds. */
type DeclarationKind = 'let' | 'const';

/**
 * A binding in the global environment. Opaque to the learner:
 * the interface is known (e.g. Math.floor), the internals are not.
 */
interface BuiltinBinding {
	name: string;

	/**
	 * The category of the builtin — determines how it is visualised.
	 * - 'object-register': an object with methods (Math, String, Number, Date, console)
	 * - 'function': a callable (alert, confirm, prompt, parseInt, parseFloat, Boolean)
	 * - 'constant': a bare primitive value (Infinity, NaN, undefined)
	 */
	category: 'object-register' | 'function' | 'constant';
}

// ─── Phase 2 events ───────────────────────────────────────────────────────────

/**
 * The global environment is opened once, before any script-scope events.
 * It has no corresponding AST node and no close event.
 * Its bindings are pre-populated — not declared as TDZ — because they exist
 * before the source file is even read.
 */
interface GlobalEnvironmentOpenEvent {
	kind: 'scope:open';
	scopeType: 'global';
	bindings: BuiltinBinding[];
	astPath: null;
}

/**
 * The script scope is opened immediately after the global environment.
 * All top-level let/const declarations will appear between this event
 * and scope:close script.
 */
interface ScriptScopeOpenEvent {
	kind: 'scope:open';
	scopeType: 'script';
	astPath: JSONPath; // always "$"
}

/**
 * A script-scope binding is declared as TDZ.
 * Fires once per top-level VariableDeclarator, in source order.
 * The expression to the right of `=` is NOT evaluated here.
 */
interface BindingDeclareEvent {
	kind: 'binding:declare';
	name: string;
	declarationKind: DeclarationKind;
	initialState: '<TDZ>';

	/** Path to the VariableDeclarator node (not the VariableDeclaration). */
	astPath: JSONPath;
}

/**
 * The script scope is closed. Always the last phase 2 event.
 */
interface ScriptScopeCloseEvent {
	kind: 'scope:close';
	scopeType: 'script';
	astPath: JSONPath; // always "$"
}

/**
 * The complete ordered event stream for phase 2.
 *
 * Structure is always:
 *   GlobalEnvironmentOpenEvent
 *   ScriptScopeOpenEvent
 *   BindingDeclareEvent[]   (zero or more, in source order)
 *   ScriptScopeCloseEvent
 */
type Phase2Event =
	| GlobalEnvironmentOpenEvent
	| ScriptScopeOpenEvent
	| BindingDeclareEvent
	| ScriptScopeCloseEvent;

/**
 * The scope tree produced by phase 2 and handed to phase 3.
 * Block scopes do not exist yet — they are created lazily by phase 3.
 */
interface Phase2ScopeTree {
	global: {
		bindings: BuiltinBinding[];
	};
	script: {
		/**
		 * All script-scope bindings, keyed by name, in declaration order.
		 * Every binding starts as TDZ.
		 */
		bindings: Record<
			string,
			{
				declarationKind: DeclarationKind;
				state: '<TDZ>';
				astPath: JSONPath;
			}
		>;
	};
}

/**
 * The complete output of phase 2.
 * Phase 2 cannot fail (validation already ran in phase 1).
 */
interface Phase2Output {
	events: Phase2Event[];
	scopeTree: Phase2ScopeTree;
}
