// cspell:ignore unconstructible

/**
 * JEJ's own model types: the level's policy as data, and the two semantic
 * models that are its notional machine.
 *
 * The only import is acorn, type-only — the parser's own vocabulary, the same
 * posture the level spine takes. Nothing here restates the spine: `Violation`,
 * `SourceRange`, `ParseFacts`, `SnippetType`, and `LevelDocs` are the region's
 * (`../types.ts`), and a level that redefined them would be a second source.
 *
 * Level docs: ./README.md (what JEJ curates) · ./DOCS.md (architecture).
 */

import type { Node } from 'acorn';

// ─────────────────────────────────────────────────────────────────────────────
// Vendored — the generic validating machinery's vocabulary
//
// Not JEJ's, and not any level's: the shape a curated slice is *read through*.
// JEJ supplies the values; the machinery supplies the walk, the default-deny
// posture, and violation construction. It lives here only until the shared leaf
// the region reserves for it exists ("the generic validating machinery — a
// shared leaf a level's validate may parameterize internally", ../DOCS.md).
// Moving it there is a relocation, not a redesign: nothing below is JEJ-shaped,
// and everything below is read by the machinery — a datum only the level reads
// is the level's, and lives further down.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Decides whether one node of an admitted type is within the level.
 *
 * @remarks
 * Legality only: it answers *what is wrong*, never *where*. The walk holds the
 * node's position and its path and constructs the violation — so a check needs
 * no position, and there is one place a source range is read rather than one
 * per rule. Returning the message rather than a violation is what keeps that
 * true.
 */
export type ConstraintCheck = (node: Node) => true | string;

/**
 * The allowlist's standing on one node type: admitted outright, or admitted
 * subject to a check.
 *
 * @remarks
 * There is no "explicitly forbidden" arm. Absence *is* refusal, so a third
 * state would say the same thing twice and invite the two to disagree.
 */
export type NodeRule = true | ConstraintCheck;

/**
 * A curated slice of JavaScript, as the data the machinery reads — and only
 * that: the node rules the walk dispatches on, and the global names the
 * vocabulary check resolves against.
 *
 * @remarks
 * Default-deny: a node type absent from `nodes` is outside the level, so new
 * JavaScript is outside by default rather than by oversight. The totality this
 * implies is bounded by the caller's parse — the node types the package's one
 * parse emits, not the whole grammar; a node type reachable under the caller's
 * settings and absent here is a false rejection, not a true violation.
 *
 * `admittedGlobals` is **derived**, never authored: it is the realm table's
 * names. Authoring it separately would make the level's world and the level's
 * vocabulary two lists that drift.
 */
export type SyntaxAllowlist = {
	readonly nodes: Readonly<Record<string, NodeRule>>;
	readonly admittedGlobals: ReadonlySet<string>;
};

// ─────────────────────────────────────────────────────────────────────────────
// The realm model — the world this level teaches
//
// The realm table is the level's one authored account of its world. Everything
// else about that world is derived from it.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * How a realm binding presents itself, which is how a lens draws it.
 *
 * @remarks
 * `object-register` — a box with methods and a prototype (`Math`, `console`).
 * `function` — a callable value (`alert`, `parseInt`). `constant` — a bare
 * primitive (`Infinity`, `NaN`, `undefined`). This is the level's own
 * pedagogical framing, not a spec distinction.
 */
export type BindingForm = 'object-register' | 'function' | 'constant';

/**
 * Which of the realm's two populations installed a binding.
 *
 * @remarks
 * Spec-distinct, and kept distinct deliberately: intrinsics come from
 * `SetDefaultGlobalBindings` (ECMA-262 §9.3.4) and are always present; host
 * bindings come from the HTML host hook inside `InitializeHostDefinedRealm`
 * (§9.6) and are the browser's, not the language's. Collapsing them would
 * conflate "this is JavaScript" with "this is your browser" — a distinction
 * the level exists to teach.
 */
export type BindingPopulation = 'intrinsic' | 'host';

/**
 * One name the level's world provides before any code runs.
 *
 * @remarks
 * The authored datum. A name is admitted *because* it is here — the allowlist's
 * admitted globals are these names, derived rather than restated.
 */
export type RealmBinding = {
	readonly name: string;
	readonly form: BindingForm;
	readonly population: BindingPopulation;
};

/**
 * The world this level teaches, derived from no program at all.
 *
 * @remarks
 * Narrower than the world a program actually wakes into — a JEJ program runs
 * in a full JavaScript realm — so this answers "what is mine to use?", never
 * "what exists?". A lens rendering it as the latter would lie by omission.
 */
export type RealmModel = {
	readonly bindings: ReadonlyArray<RealmBinding>;
};

// ─────────────────────────────────────────────────────────────────────────────
// The hoisting model — where names come to be
//
// The level's own, because it is the level's shape: what can occur here is a
// consequence of what this level admits, and nothing below could describe a
// program beyond it. A general account of JavaScript scoping — one that models
// functions, classes, catch clauses, and `var` — is a different artifact for
// different consumers; when one exists, the two reconcile into something shared
// and narrowed. Until then this is not a narrowing of anything: it is the
// model, whole.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A scope boundary this level can produce.
 *
 * @remarks
 * The whole list, and it is short by construction: with no functions, classes,
 * or catch clauses admitted, nothing else opens a scope. A function scope is
 * not missing — it is unreachable. Each loop head — `for` and `for…of` — opens
 * the loop's own scope holding its head declarations; the body block nests
 * inside it as an ordinary `block` child, so a body-level shadow of a head
 * name is two scopes, honestly modeled.
 */
export type ScopeKind = 'program' | 'block' | 'for' | 'for-of';

/**
 * One name, and where it came to be.
 *
 * @remarks
 * `kind` has no `var` arm because `var` is admitted by no rule: a program
 * containing one is outside the level, and this model does not describe it.
 * The absent arm is what makes that precondition visible in the type instead
 * of asserted in prose.
 */
export type DeclarationInfo = {
	readonly name: string;
	readonly kind: 'let' | 'const';
	readonly node: Node;
	readonly initNode: Node | null;
	readonly scopeDepth: number;
};

/**
 * One scope, and the scopes inside it.
 *
 * @remarks
 * `parent` and `children` make this a cyclic graph, and `node` / `initNode`
 * are the caller's — borrowed, never built here. Both facts bound what may be
 * frozen: the level freezes the scopes it built, and recurses into neither the
 * cycle nor the tree it was handed.
 */
export type ScopeInfo = {
	readonly kind: ScopeKind;
	readonly node: Node;
	readonly parent: ScopeInfo | null;
	readonly declarations: Readonly<Record<string, DeclarationInfo>>;
	readonly children: ReadonlyArray<ScopeInfo>;
};

/**
 * The tree of scopes a program opens, and every name declared in it.
 *
 * @remarks
 * The flat roster is the same declarations the tree holds, reachable without
 * a walk — the two views share their entries rather than copying them.
 */
export type HoistingModel = {
	readonly root: ScopeInfo;
	readonly allDeclarations: ReadonlyArray<DeclarationInfo>;
};
