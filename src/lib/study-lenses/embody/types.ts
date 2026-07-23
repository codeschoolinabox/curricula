// cspell:ignore Gateable entwine entwined entwining injective Failable

/**
 * The embody region's keystone contracts: the snippet that comes in, the
 * Facts and per-phase study payloads the factory derives, the structural view
 * it has of a lens (`Gateable`), and the frozen `Embodiment` that comes out.
 *
 * Region docs: ./README.md (domain model) · ./DOCS.md (architecture).
 * The package glossary (../README.md) owns the shared vocabulary.
 */

import type {
	Comment,
	Node as AcornNode,
	Position,
	Program,
	Token,
} from 'acorn';

// ─────────────────────────────────────────────────────────────────────────────
// The snippet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Whether the program is treated as a script or a module. Selects the parse
 * goal (acorn `sourceType`) and, downstream, the execution semantics. The
 * host chooses the initial type; the learner can toggle it for the session.
 */
export type SnippetType = 'script' | 'module';

/** The raw program passed in for study: source text plus snippet type. */
export type Snippet = {
	readonly source: string;
	readonly type: SnippetType;
};

// ─────────────────────────────────────────────────────────────────────────────
// Fact stages
// ─────────────────────────────────────────────────────────────────────────────

/** The six derivations the Facts hold, one tagged stage each. */
export type FactStageName =
	| 'source'
	| 'tokens'
	| 'ast'
	| 'entwined'
	| 'environment'
	| 'type';

/**
 * The stages that can fail — derived, not given. `tokens` and `ast` fail on an
 * unparseable program; `entwined` and `environment` fail only as guarded embody
 * defects, reported loudly. Each may originate a `StageCause`.
 */
export type FailableStageName = 'tokens' | 'ast' | 'entwined' | 'environment';

/**
 * The structured cause a failed stage carries: which stage failed, in the
 * machine's own words, and where in the source when the machine says so.
 * The cause keeps the parser's voice — learner-worded explanation is lens
 * work.
 */
export type StageCause = {
	readonly stage: FailableStageName;
	readonly message: string;
	/** Source character offset the parser reports — directly sliceable. */
	readonly offset?: number;
	readonly position?: Position;
};

/** A stage that produced its value. */
export type StageSuccess<Value> = {
	readonly ok: true;
	readonly value: Value;
};

/** A stage that failed — as data, never a throw. */
export type StageFailure = {
	readonly ok: false;
	readonly cause: StageCause;
};

/**
 * One tagged derivation result. Derived stages share the full envelope; the
 * given stages (`source`, `type`) carry only its success arm.
 */
export type FactStage<Value> = StageSuccess<Value> | StageFailure;

/**
 * The tokens stage's value: the token stream plus the comments the
 * tokenizer sets aside. They emerge together, so they travel together —
 * comments never depend on any later stage.
 */
export type Tokens = {
	readonly tokens: ReadonlyArray<Token>;
	readonly comments: ReadonlyArray<Comment>;
};

/**
 * The synchronous fact slice of the embodiment.
 *
 * @remarks
 * `source` and `type` are the inputs restated as stages: they are given, not
 * derived, so their type carries no failure arm — consumers never narrow a
 * branch that cannot occur. `tokens` and `ast` fail when the program does
 * not parse (spelling, then grammar). `entwined` and `environment` fail only
 * as embody defects, reported loudly in development — a valid syntax tree
 * always binds and always scopes.
 */
export type Facts = {
	readonly source: StageSuccess<string>;
	readonly tokens: FactStage<Tokens>;
	readonly ast: FactStage<Program>;
	readonly entwined: FactStage<Entwined>;
	readonly environment: FactStage<Environment>;
	readonly type: StageSuccess<SnippetType>;
};

// ─────────────────────────────────────────────────────────────────────────────
// The entwined binding
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dot-delimited node-path rooted at the Program node; array indices are bare
 * segments, e.g. `"$.body.0.declarations.0.init"`. The canonical node
 * identity across the package — postMessage-safe, and injective over one
 * syntax tree: every node has exactly one path.
 */
export type NodePath = string;

/** A token tied into the binding: its neighbors and its innermost node. */
export type EntwinedToken = {
	readonly token: Token;
	readonly innermostNode: EntwinedNode | null;
	readonly previous: EntwinedToken | null;
	readonly next: EntwinedToken | null;
};

/** A comment tied into the binding, by the same geometry as a token. */
export type EntwinedComment = {
	readonly comment: Comment;
	readonly innermostNode: EntwinedNode | null;
	readonly previous: EntwinedToken | null;
	readonly next: EntwinedToken | null;
};

/** A syntax-tree node tied to its family and its exact span of the source. */
export type EntwinedNode = {
	readonly node: AcornNode;
	readonly path: NodePath;
	/** `null` only at the Program root. */
	readonly parent: EntwinedNode | null;
	readonly children: ReadonlyArray<EntwinedNode>;
	/** Every token within the node's span. */
	readonly tokens: ReadonlyArray<EntwinedToken>;
	/** Every comment contained within the node's span. */
	readonly comments: ReadonlyArray<EntwinedComment>;
};

/**
 * The source⇄tree binding: one shared graph of entwined nodes, tokens, and
 * comments, with two canonical entry points. Both hold the same references
 * as the tree — entry points into the graph, never copies.
 */
export type Entwined = {
	readonly root: EntwinedNode;
	/**
	 * Every node keyed by its `NodePath` — O(1) resolution from a carried
	 * path string back to its entwined node.
	 */
	readonly byPath: Readonly<Record<NodePath, EntwinedNode>>;
	/**
	 * Indexed by source character offset; each slot holds the deepest node
	 * whose span covers that offset. Every offset in `[0, source.length)`
	 * resolves at least to the root — never a hole. Zero-width nodes cover no
	 * offset; reach them via `byPath`.
	 */
	readonly byOffset: ReadonlyArray<EntwinedNode>;
};

// ─────────────────────────────────────────────────────────────────────────────
// The static scope structure
// ─────────────────────────────────────────────────────────────────────────────

// The scope vocabulary is embody's own projection of the analysis its scope
// leaf produces: plain objects embody allocates, named against acorn's node
// type and holding the same tree nodes the rest of the Facts carry (by
// reference), expressing only what consumers read. The analyzer's own objects
// never cross the boundary — its internal bookkeeping, and the `Map`s it keeps
// it in, stay off the contract — so the projection is plain data embody's
// freeze can actually reach (a frozen `Map` is not immutable; see DEV.md § 13).

/**
 * One definition of a name, projected faithfully from the scope analysis. Two
 * axes describe the declaration and they are distinct: `type` is the binding
 * *category* — `Variable`, `Parameter`, `ImportBinding`, `FunctionName`,
 * `ClassName`, `CatchClause`, … — while `kind` is the `let`/`const`/`var`
 * *keyword*, carried only when a variable declaration introduces the name.
 * `parent` and `index` place the declaration in its enclosing statement. Every
 * field here is the analyzer's own reading — nothing embody derives.
 */
export type ScopeDefinition = {
	/** The binding category (`Variable`, `Parameter`, `ImportBinding`, … — never a `let`/`const`/`var` keyword; that is `kind`). */
	readonly type: string;
	/** The declared identifier node. */
	readonly name: AcornNode;
	/** The syntax-tree node that declares the name. */
	readonly node: AcornNode;
	/** The declaration keyword — only for a variable declaration; omitted for parameters, imports, functions, classes, and catch clauses. */
	readonly kind?: 'let' | 'const' | 'var';
	/** The enclosing statement (`VariableDeclaration`/`ImportDeclaration`), or `null` when the analyzer records none (functions, classes, parameters, catch clauses). */
	readonly parent: AcornNode | null;
	/** The declarator's or parameter's 0-based position among its siblings; `null` for functions, classes, imports, and catch clauses. */
	readonly index: number | null;
	/** The `NodePath` of `name` in the source⇄tree binding — resolve via `entwined.byPath` for the identifier's neighbors and children. */
	readonly path?: NodePath;
};

/**
 * How a use touches its binding: read-only, write-only, or both. A single
 * string discriminant — `'readwrite'` is spelled to contain both `'read'` and
 * `'write'` so a consumer can test membership by substring; do not respell it.
 */
export type ScopeAccess = 'read' | 'write' | 'readwrite';

/**
 * One use of a name. Every field but the last is projected faithfully from the
 * scope analysis: the identifier node, the variable it resolves to — or `null`
 * when it resolves to nothing (an undeclared global) — the scope the use is
 * made from, how the use touches the binding (`access`), whether that touch is
 * the binding's own initialization (`init`), and the written expression
 * (`writeExpr`). The `null` `resolved` arm is the level-blind fact a level's
 * undeclared-globals check reads; it is not itself an error verdict — a level
 * cross-checks its realm to tell an intrinsic (`Math`) from an unbound name.
 *
 * `usedBeforeBound` is the exception: embody *derives* it from the scope graph
 * and source positions — a heuristic carrying embody's own judgment, not the
 * analyzer's authority. See its note.
 */
export type ScopeReference = {
	readonly identifier: AcornNode;
	readonly resolved: ScopeVariable | null;
	readonly from: Scope;
	/** How the use touches the binding. See {@link ScopeAccess}. */
	readonly access: ScopeAccess;
	/** Whether this write is the binding's own initialization — meaningful only for writes, `false` for reads. Not the AST `VariableDeclarator.init` (the initializer node) nor the `.init` path segment: the analyzer's write-of-initialization flag, coerced from its read-only `undefined` to a clean `false`. */
	readonly init: boolean;
	/** The written expression on a write: the RHS node, or `null` for an update (`x++`/`--x`, which writes with no RHS). Absent on reads — its presence is exactly the write predicate (`'writeExpr' in ref` ⟺ the use writes). */
	readonly writeExpr?: AcornNode | null;
	/** The `NodePath` of `identifier` in the source⇄tree binding — resolve via `entwined.byPath` for the identifier's neighbors and children. */
	readonly path?: NodePath;
	/**
	 * DERIVED, not the analyzer's reading: `true` when this use's identifier is
	 * positioned, in source order, before its resolved `let`/`const`/`class`
	 * binding is initialized — `identifier.start` precedes the binding node's end
	 * (the declarator for `let`/`const`, the class node for a `class`), computed
	 * from character offsets (`.start`/`.end`, never `.loc`). A static
	 * over-approximation of a temporal-dead-zone access: a use inside a function
	 * that runs *after* the declaration (a closure) is still flagged though it
	 * will not throw — a consumer needing soundness applies its own reachability
	 * analysis. `false` for `var`/parameter/function/import/catch bindings (no
	 * dead zone), unresolved uses, and the binding's own initializer write.
	 */
	readonly usedBeforeBound: boolean;
};

/**
 * One binding: the name, the identifier nodes that introduce it, the
 * references that resolve to it, and its definitions. How a name comes to be.
 */
export type ScopeVariable = {
	readonly name: string;
	readonly identifiers: ReadonlyArray<AcornNode>;
	readonly references: ReadonlyArray<ScopeReference>;
	readonly defs: ReadonlyArray<ScopeDefinition>;
};

/**
 * One lexical scope: its category (`global`, `module`, `function`, `block`,
 * `for`, `class`, `catch`, …), the syntax-tree node that introduces it, the names born
 * in it, the references made in it, its nested scopes, its enclosing scope, and
 * whether it is strict. `through` carries the references that resolve past this
 * scope to nothing — populated on the global scope, it is what shows `var`/`let`
 * born into different records.
 */
export type Scope = {
	readonly type: string;
	readonly block: AcornNode;
	readonly variables: ReadonlyArray<ScopeVariable>;
	readonly references: ReadonlyArray<ScopeReference>;
	readonly childScopes: ReadonlyArray<Scope>;
	readonly through: ReadonlyArray<ScopeReference>;
	readonly isStrict: boolean;
	/** `null` only at the root scope. */
	readonly upper: Scope | null;
};

/**
 * The static scope structure: one shared graph of lexical scopes, with a
 * canonical entry point and a path index. Both hold the same embody scope
 * objects — one graph embody projects from the analysis, holding the source's
 * own AST nodes by reference; root and byPath are two entry points into that
 * one graph, never separate copies. The graph toggles on snippet type: a
 * script's top-level names live on the global scope, a module's on its own
 * module scope.
 */
export type Environment = {
	readonly root: Scope;
	/**
	 * Every scope keyed by the `NodePath` of the node that introduces it —
	 * O(1) resolution from a carried path string back to its scope.
	 */
	readonly byPath: Readonly<Record<NodePath, Scope>>;
};

// ─────────────────────────────────────────────────────────────────────────────
// The lifecycle
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The five flat phases, in the specification's own order. The single
 * compile-time truth of that order: the implementation's runtime order
 * constant `satisfies` this tuple.
 */
export type LifecyclePhaseOrder = readonly [
	'source',
	'tokens',
	'ast',
	'environment',
	'evaluation',
];

/**
 * A lifecycle phase's data name. Learner-facing display labels are
 * presentation, owned by the orchestrator's UI — never carried here.
 */
export type LifecyclePhaseName = LifecyclePhaseOrder[number];

/**
 * One phase's payload on the embodiment: whether the phase is reachable, and
 * the lenses that fit it.
 *
 * @remarks
 * A barred phase carries the upstream cause that barred it. A phase's
 * own-stage error never bars it — that error renders inside the phase
 * (a grammar error leaves the `ast` phase accessible, rendered there).
 */
export type LifecyclePhase =
	| {
			readonly accessible: true;
			readonly lenses: ReadonlyArray<Gateable>;
	  }
	| {
			readonly accessible: false;
			readonly cause: StageCause;
			readonly lenses: ReadonlyArray<Gateable>;
	  };

// ─────────────────────────────────────────────────────────────────────────────
// Gateable
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The minimal structural view embody has of any lens: enough to gate and
 * attach, nothing more. No main operation — embody never types or loads a
 * component; the lens kind extends this contract in its own region.
 *
 * @remarks
 * `applicability` must be pure and synchronous, over the Facts alone. Embody
 * calls it wrapped: a gate that throws is treated as not applicable, with a
 * loud development-mode report.
 */
export type Gateable = {
	readonly name: string;
	readonly applicability: (facts: Facts) => boolean;
	/**
	 * Declared lifecycle phase(s) — one name, or an array for a multi-phase
	 * lens. Absent = panel-excluded: embody neither gates nor attaches it.
	 */
	readonly phase?: LifecyclePhaseName | ReadonlyArray<LifecyclePhaseName>;
};

// ─────────────────────────────────────────────────────────────────────────────
// The embodiment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The frozen study object: the Facts plus the study layer.
 *
 * @remarks
 * `facts` is what is TRUE about the program (the six derivations); `study` is
 * how it is studied — each lifecycle phase's payload, keyed by phase name:
 * whether the phase is accessible (or barred, with cause) and the lenses that
 * fit it. The field is named `study`, not `lifecycle`, because `facts` already
 * carries the phase-named stages — the study layer is what a phase adds beyond
 * its fact value.
 *
 * Freeze-what-you-own: the structure embody built is frozen; attached lens
 * refs sit outside this immutability contract, owned by their defining
 * modules. The embodiment is level-blind — no field of it knows what a
 * language level is.
 */
export type Embodiment = {
	readonly facts: Facts;
	readonly study: Readonly<Record<LifecyclePhaseName, LifecyclePhase>>;
};

/**
 * The factory's boundary options. `type` defaults to `'module'`; `lenses` —
 * the roster the composition root passes in — defaults to empty: embody
 * imports no roster of its own.
 */
export type EmbodyOptions = {
	readonly type?: SnippetType;
	readonly lenses?: ReadonlyArray<Gateable>;
};
