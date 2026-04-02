/**
 * @file Types for the shared scope analysis module.
 *
 * @remarks Describes the scope structure of a JeJ program:
 * every declaration, every read, every write, organized by
 * lexical scope. Consumed by both `validating/` (undeclared
 * globals) and `micro-decisions/` (variable usage analysis).
 *
 * JeJ has a simplified scope model: no functions, classes,
 * or catch clauses. Scope boundaries are `Program`,
 * `BlockStatement`, and `ForOfStatement` only.
 */

import type { Node } from 'acorn';

// ─── Scope kinds ────────────────────────────────────────────

/**
 * The kind of scope boundary.
 *
 * @remarks JeJ only has three scope-creating constructs:
 * the top-level program, block statements (from `if`/`else`/
 * `while` bodies), and `for...of` statements (which create
 * a scope for the iterator variable).
 */
type ScopeKind = 'program' | 'block' | 'for-of';

// ─── Declaration info ───────────────────────────────────────

/**
 * Everything known about a single variable declaration.
 *
 * @remarks Tracks the declaration itself plus all references
 * to it (reads and writes). The `readCount` and `writeCount`
 * are post-declaration only — the initial value in the
 * `VariableDeclarator` is tracked separately as `initNode`,
 * not counted as a write.
 */
type DeclarationInfo = {
	readonly name: string;
	readonly kind: 'let' | 'const';
	readonly node: Node;
	readonly initNode: Node | null;
	readonly readCount: number;
	readonly writeCount: number;
	readonly scopeDepth: number;
};

// ─── Scope info ─────────────────────────────────────────────

/**
 * A single lexical scope in the program.
 *
 * @remarks Forms a tree: the root is the `program` scope,
 * children are nested block/for-of scopes. Each scope knows
 * its own declarations and has a parent pointer for upward
 * name resolution.
 */
type ScopeInfo = {
	readonly kind: ScopeKind;
	readonly node: Node;
	readonly parent: ScopeInfo | null;
	readonly declarations: ReadonlyMap<string, DeclarationInfo>;
	readonly children: readonly ScopeInfo[];
};

// ─── Top-level result ───────────────────────────────────────

/**
 * The complete scope analysis of a program.
 *
 * @remarks `root` is the program-level scope (the tree root).
 * `allDeclarations` is a flat convenience view of every
 * declaration in the program, regardless of scope depth —
 * useful for consumers that need to iterate all variables
 * without walking the tree.
 *
 * The entire structure is deeply frozen.
 */
type ScopeAnalysis = {
	readonly root: ScopeInfo;
	readonly allDeclarations: readonly DeclarationInfo[];
};

// ─── Exports ────────────────────────────────────────────────

export type { DeclarationInfo, ScopeAnalysis, ScopeInfo, ScopeKind };
