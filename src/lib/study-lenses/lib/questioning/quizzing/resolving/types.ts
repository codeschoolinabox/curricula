// cspell:ignore quizzing reassignable

/**
 * @file The scope forest's own types — the minted three-kind projection view
 * (`ScopeForest` / `ForestScope` / `TrackedDeclaration`) plus the resolver's
 * `Binding` / `Occurrence` pair, carried from the prior architecture. Internal
 * to the `resolving/` cluster (NOT the locked public contract in
 * `../types.ts`); free to widen additively as binding-aware forms need more.
 *
 * The forest types are named for the README glossary, deliberately NOT the
 * prior architecture's `ScopeAnalysis` / `ScopeInfo` / `DeclarationInfo`:
 * those names carry two live embody homonyms plus a third in the tracer, and
 * the sibling `lib/scoping` recorded a ruling against `DeclarationInfo` for
 * exactly this reason (human ruling 2026-08-18, Stage-3 AR-1). The projection
 * that builds the forest lives in `./read-scope-forest.ts`; its shape comes
 * from `facts.ast`, its declarations from `facts.environment` (README
 * § Glossary "Scope forest"; DOCS § Where scope comes from).
 */

import type { Node } from 'acorn';

/**
 * The kind of scope the forest models. Deliberately three: the top-level
 * program, block statements, and `for...of` statements (which scope the
 * iteration variable; the loop body's braces fold into the same scope). The
 * forest is smaller than the language on purpose — see the tracked set.
 */
export type ForestScopeKind = 'program' | 'block' | 'for-of';

/**
 * One tracked declaration as the forest registers it: the declared `name`,
 * the declaration keyword, and the declarator's id `node` (the Identifier —
 * its `[start, end)` span is the binding identity every binding-aware group
 * key uses). `kind` is typed `let`/`const` but carries the RUNTIME value the
 * projection copies verbatim off the environment's definition — for a non-JeJ
 * `var` snippet that value is `'var'` behind a blind cast (the deliberate
 * laundering the prior architecture's forest carried; README § Glossary
 * "Scope forest"). Binding-aware forms guard per-binding rather than trust
 * this type.
 */
export type TrackedDeclaration = Readonly<{
	name: string;
	kind: 'let' | 'const';
	node: Node;
}>;

/**
 * One lexical scope in the forest: its kind, the syntax-tree node that
 * introduces it (scope extent = the node's `[start, end)` range), its parent
 * (`null` only at the program root), the tracked declarations born in it
 * (keyed by name; same-scope redeclaration is last-wins), and its child
 * scopes in source order.
 */
export type ForestScope = Readonly<{
	kind: ForestScopeKind;
	node: Node;
	parent: ForestScope | null;
	declarations: ReadonlyMap<string, TrackedDeclaration>;
	children: readonly ForestScope[];
}>;

/**
 * The complete scope forest of a program: the `'program'` root scope. The
 * structure is frozen; the AST nodes it borrows stay embody's. The prior
 * architecture's flat `allDeclarations` convenience view and its per-
 * declaration counting fields (`initNode`, `readCount`, `writeCount`,
 * `scopeDepth`) are deliberately absent — nothing in this engine consumed
 * them (measured at port time; LOSS-LEDGER § The shim).
 */
export type ScopeForest = Readonly<{
	root: ForestScope;
}>;

/**
 * A variable binding that an identifier occurrence resolves to under lexical
 * scoping.
 *
 * `declarationRange` is the declaration-site span `[start, end)` (the
 * declarator's id node — zero-indexed, half-open, matching the source-range
 * convention) and is the **stable binding identity**: two occurrences resolve
 * to the same binding iff their `declarationRange`s are equal (each
 * declarator id has a unique span). `name` is the declared name, kept for
 * prompt/label use and to avoid re-slicing the source. `kind` is the
 * declaration keyword (`let` / `const`), read straight off the resolved
 * `TrackedDeclaration.kind` — the static answer key for "is this binding
 * reassignable?" forms. The union is `let`/`const` because that is
 * `TrackedDeclaration.kind`'s type. The engine runs behind a parse gate, NOT
 * a validation gate (see `../DOCS.md`), so a non-JeJ `var` snippet still
 * reaches resolution and the projection blind-casts its kind — at runtime
 * `kind` can be `'var'` despite this type. Binding-aware forms therefore
 * guard defensively (V6 skips any kind that is not `let`/`const`) rather
 * than trust the type. The `groupKey` serializer that keys binding-aware
 * forms on the identity lives at `../keying/binding-group-key.ts` and keys
 * on `declarationRange` ONLY — so this view carries the binding identity
 * (`declarationRange`) plus non-identity convenience data (`name`, `kind`),
 * and `kind` must never fold into a group key.
 */
export type Binding = Readonly<{
	name: string;
	declarationRange: readonly [number, number];
	kind: 'let' | 'const';
}>;

/**
 * The minimal occurrence shape `resolveBinding` reads: a `start` offset (to
 * find the enclosing scope) and the identifier `text` (to look up the binding
 * by name). `ClassifiedToken` satisfies it structurally, and a node-anchored
 * generator satisfies it from an AST identifier's `{ start, name }` — so the
 * resolver is callable from both the token stream and the AST-descent anchor
 * stream without forcing a full `ClassifiedToken`.
 */
export type Occurrence = Readonly<{
	start: number;
	text: string;
}>;
