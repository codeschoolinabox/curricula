/**
 * @file The `readScopeForest` accessor — quizzing's scope-forest projection.
 * Given parsed facts, it returns the lexical scope forest (`ScopeForest`) the
 * occurrence→binding resolver reads through: scope shells walked from
 * `facts.ast`, tracked declarations harvested from `facts.environment` and
 * registered at their lexical position. The five-fact account of where scope
 * comes from — and the ruling R-6 boundary this projection realizes — lives
 * in `../DOCS.md` § Where scope comes from; see `./resolve-binding.ts` for
 * the resolution layer over the returned forest.
 */

import type { Node } from 'acorn';

import deepFreezeExcept from '@utils/deep-freeze-except.js';

import type {
	Environment,
	Facts,
	Scope,
	ScopeDefinition,
} from '../../../../embody/types.js';

import type {
	ForestScopeKind,
	ScopeForest,
	TrackedDeclaration,
} from './types.js';

/**
 * The lexical scope forest for parsed facts.
 *
 * Shape comes from the AST: the single `'program'` root (the environment's
 * global/module double root never enters), one `'block'` shell per block
 * statement, and one `'for-of'` shell per `for...of` statement — whose own
 * body block folds into the for-of scope. Declarations come from the
 * environment: every scope's definitions, filtered to the **tracked set** —
 * `var`/`let`/`const` declarator ids (the plain-identifier form, which
 * includes the `for-of` left) — and registered into the deepest shell
 * containing the declarator id, in source order, so same-scope redeclaration
 * is last-wins. Everything outside the tracked set — function names,
 * parameters, catch params, class names, imports, destructuring pattern
 * bindings — is deliberately never registered (ruling R-6, 2026-08-05): those
 * occurrences resolve to `null` and fall back to per-occurrence identity.
 *
 * @remarks
 * - **Precondition:** parsed facts. The caller sits behind the parse gate (a
 *   valid `classified` already implies a successful parse), so a failed `ast`
 *   or `environment` stage here is a caller bug to surface — this throws,
 *   mirroring `generateQuiz`'s gate.
 * - **Shape from the AST, never the environment graph:** eslint-scope
 *   materializes no block scope for a function body, so a graph-derived
 *   forest would either drop or hoist function-body `let` — both silently
 *   changing the R-6 pedagogy.
 * - **`var` launders through** (README § Glossary "Scope forest"): a kept
 *   `var` definition registers its runtime kind behind `TrackedDeclaration`'s
 *   `'let' | 'const'` type; binding-aware forms guard per-binding rather than
 *   trust the type.
 * - **Pure / frozen.** No mutation of the facts; the returned forest is
 *   frozen. The AST nodes the forest borrows stay embody's and are never
 *   frozen here (the `lib/scoping` precedent).
 *
 * @throws Error when the `ast` or `environment` stage is not ok (unparsed or
 *   environment-defected facts).
 */
export default function readScopeForest(facts: Facts): ScopeForest {
	// 1. Gate: both fact stages must be ok — a failed stage is a caller bug.
	if (!facts.ast.ok || !facts.environment.ok) {
		throw new Error(
			'readScopeForest requires parsed facts: the ast and environment stages must both be ok',
		);
	}

	// 2. Shape from the AST: program / block / for-of shells.
	const root = buildShells(facts.ast.value);

	// 3. Declarations from the environment, filtered to the tracked set.
	const tracked = harvestTrackedDeclarations(facts.environment.value);

	// 4. Register each declaration at its lexical position, in source order
	// (`Map.set` in sorted order makes same-scope redeclaration last-wins).
	registerDeclarations(root, tracked);

	// 5. Freeze what the projection owns — never the borrowed AST nodes.
	// Map entries are not own enumerable properties, so each registered
	// declaration is frozen explicitly before the structural walk. Known
	// limitation (DEV.md § 13): `Object.freeze` cannot make a `Map`
	// immutable, so each scope's `declarations` MEMBERSHIP stays
	// runtime-mutable behind its compile-time `ReadonlyMap` — the freeze
	// reaches the Map's values (the loop below), never its key set.
	const borrowedNodes = new Set<object>([
		...collectShells(root).map((shell) => shell.node),
		...tracked.map((declaration) => declaration.node),
	]);
	for (const declaration of tracked) {
		deepFreezeExcept(declaration, borrowedNodes);
	}
	return deepFreezeExcept({ root }, borrowedNodes);
}

/**
 * A scope shell under construction: `ForestScope`'s shape with the collection
 * fields still mutable. File-local — every shell is frozen before it leaves
 * `readScopeForest`, so the mutability never escapes.
 */
type MutableScope = {
	kind: ForestScopeKind;
	node: Node;
	parent: MutableScope | null;
	declarations: Map<string, TrackedDeclaration>;
	children: MutableScope[];
};

// ─── 2. Shape from the AST ─────────────────────────────────────────────────

/**
 * Walk the parsed program once, opening one shell per scope-introducing node:
 * the `'program'` root, every `BlockStatement` as a `'block'`, and every
 * `ForOfStatement` as a `'for-of'`. A structural micro-traversal in the
 * sanctioned pure-acorn class (the `descend-identifiers` precedent) — no
 * scope semantics ride it; all binding facts come from the environment.
 */
function buildShells(program: Node): MutableScope {
	const root: MutableScope = {
		kind: 'program',
		node: program,
		parent: null,
		declarations: new Map(),
		children: [],
	};
	for (const child of astChildren(program)) {
		collectShellsUnder(child, root);
	}
	return root;
}

/**
 * Open shells for `node` and its subtree into `enclosing`: a `'for-of'` shell
 * per `ForOfStatement` (with its body fold — see `collectForOfShell`), a
 * `'block'` shell per `BlockStatement`, and no shell for anything else — the
 * walk just descends.
 */
function collectShellsUnder(node: Node, enclosing: MutableScope): void {
	if (node.type === 'ForOfStatement') {
		collectForOfShell(node, enclosing);
		return;
	}
	if (node.type === 'BlockStatement') {
		const scope = openShell('block', node, enclosing);
		for (const child of astChildren(node)) {
			collectShellsUnder(child, scope);
		}
		return;
	}
	for (const child of astChildren(node)) {
		collectShellsUnder(child, enclosing);
	}
}

/**
 * Open the `'for-of'` shell for `node`. One deliberate fold, carried from the
 * prior architecture's forest: the `ForOfStatement`'s own `.body` block opens
 * no `'block'` shell — its statements live directly in the `'for-of'` scope.
 * Nested blocks inside that body still open shells.
 */
function collectForOfShell(node: Node, enclosing: MutableScope): void {
	const scope = openShell('for-of', node, enclosing);
	const body = childNode(node, 'body');
	for (const child of astChildren(node)) {
		if (child === body && child.type === 'BlockStatement') {
			for (const bodyChild of astChildren(child)) {
				collectShellsUnder(bodyChild, scope);
			}
		} else {
			collectShellsUnder(child, scope);
		}
	}
}

/** Create a shell of `kind` for `node` and attach it under `parent`. */
function openShell(
	kind: ForestScopeKind,
	node: Node,
	parent: MutableScope,
): MutableScope {
	const scope: MutableScope = {
		kind,
		node,
		parent,
		declarations: new Map(),
		children: [],
	};
	// A build-time attach into a shell this file just created (the child ↔
	// parent back-links make a purely immutable construction impossible); the
	// forest is frozen before it escapes.
	parent.children.push(scope);
	return scope;
}

// ─── 3. Declarations from the environment ──────────────────────────────────

/**
 * Harvest the tracked set from every environment scope: recurse the scope
 * graph, keep each definition the tracked-set predicate admits, and project
 * it onto a `TrackedDeclaration` — the declared name, the runtime declaration
 * keyword (the deliberate `var` laundering behind the `'let' | 'const'`
 * type), and the declarator-id Identifier whose span is the binding identity.
 */
function harvestTrackedDeclarations(
	environment: Environment,
): readonly TrackedDeclaration[] {
	return enumerateScopes(environment.root)
		.flatMap((scope) => scope.variables)
		.flatMap((variable) =>
			variable.defs
				.filter((definition) => isTrackedDefinition(definition))
				.map(
					(definition): TrackedDeclaration => ({
						name: variable.name,
						kind: definition.kind as 'let' | 'const',
						node: definition.name,
					}),
				),
		);
}

/**
 * The root scope and every nested scope, at every depth. Recurses
 * `childScopes` — never the flat `byPath` index, which collapses path
 * collisions (a module's global and module scopes both key on the Program
 * node) and would drop the outer scope's definitions.
 */
function enumerateScopes(scope: Scope): readonly Scope[] {
	const fromChildren = scope.childScopes.flatMap((child) =>
		enumerateScopes(child),
	);
	return [scope, ...fromChildren];
}

/**
 * The tracked-set predicate, by declarator-id identity: keep a definition iff
 * its declaring node is a `VariableDeclarator` whose `id` IS the defined name
 * node (reference equality) and its keyword is `var`/`let`/`const`. One
 * predicate covers plain declarators and the `for-of` left while excluding
 * every destructuring pattern binding (whose declarator `id` is a pattern,
 * not the name node) — a kind-only filter would wrongly admit those, and the
 * membership test absorbs the `kind`-less definitions (parameters, functions,
 * classes, imports, catch clauses) naturally.
 */
function isTrackedDefinition(definition: ScopeDefinition): boolean {
	if (definition.node.type !== 'VariableDeclarator') {
		return false;
	}
	if (childNode(definition.node, 'id') !== definition.name) {
		return false;
	}
	return (
		definition.kind === 'var' ||
		definition.kind === 'let' ||
		definition.kind === 'const'
	);
}

// ─── 4. Register at lexical position ───────────────────────────────────────

/**
 * Place each tracked declaration into the deepest shell whose node range
 * contains the declarator id's offset — lexical placement, which keeps the
 * prior forest's `var`-in-block behavior (`{ var x = 1; } x;` → the outer
 * read resolves to nothing and falls back to per-occurrence identity).
 * Registration runs in source order so same-scope redeclaration is last-wins.
 */
function registerDeclarations(
	root: MutableScope,
	declarations: readonly TrackedDeclaration[],
): void {
	const bySourcePosition = declarations.toSorted(
		(a, b) => a.node.start - b.node.start,
	);
	for (const declaration of bySourcePosition) {
		const shell = deepestShellAt(declaration.node.start, root);
		// A build-time write into a shell this file just created — the forest
		// is frozen before it escapes, so the mutation never leaves this file.
		shell.declarations.set(declaration.name, declaration);
	}
}

/**
 * Descend to the deepest shell whose node range contains `offset`. Shell node
 * ranges nest by AST containment and siblings are disjoint, so the first
 * child containing the offset is the one to recurse into. The build-time twin
 * of `resolve-binding.ts`'s resolution-time descent, kept in-file on each
 * side deliberately: the resolver ports verbatim over the frozen forest while
 * this one walks the mutable shells.
 */
function deepestShellAt(offset: number, scope: MutableScope): MutableScope {
	for (const child of scope.children) {
		if (child.node.start <= offset && offset < child.node.end) {
			return deepestShellAt(offset, child);
		}
	}
	return scope;
}

// ─── 5. Freeze support ─────────────────────────────────────────────────────

/** Every shell in the forest, root first — the freeze walk's ownership list. */
function collectShells(scope: MutableScope): readonly MutableScope[] {
	return [scope, ...scope.children.flatMap((child) => collectShells(child))];
}

// ─── Pure-acorn child access (the `descend-identifiers` precedent) ─────────

/** The child node under `key`, or `null` when the field holds no node. */
function childNode(node: Node, key: string): Node | null {
	const value = (node as unknown as Record<string, unknown>)[key];
	return isAstNode(value) ? value : null;
}

/** Every direct child node of `node`, in field order. */
function astChildren(node: Node): readonly Node[] {
	const record = node as unknown as Record<string, unknown>;
	return Object.entries(record).flatMap(function childrenOf([key, value]) {
		if (key === 'parent') {
			return [];
		}
		if (Array.isArray(value)) {
			return value.filter((item) => isAstNode(item));
		}
		return isAstNode(value) ? [value] : [];
	});
}

/** Structural AST-node test: an object carrying a string `type`. */
function isAstNode(value: unknown): value is Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as { readonly type?: unknown }).type === 'string'
	);
}
