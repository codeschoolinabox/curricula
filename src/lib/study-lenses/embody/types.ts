// cspell:ignore Gateable entwine entwined entwining Failable

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

import type { InputElement } from '../lib/scanning/types.js';

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
	/** Source offset the parser reports, in UTF-16 code units — directly sliceable. */
	readonly offset?: number;
	readonly position?: Position;
};

/** A stage that produced its value. */
export type StageSuccess<Value> = {
	readonly ok: true;
	readonly value: Value;
};

/**
 * A stage that failed — as data, never a throw.
 *
 * The failure arm may also carry the stage's **account** — the partial or
 * recovered data README § Failure grammar defines — under the same `value`
 * name its success arm uses, distinguished from a trustworthy value only by
 * this arm's `ok: false` (human ruling 2026-09-01, the same-key design).
 * The member is optional **permanently** (human ruling 2026-09-02): the
 * `undefined` a skipped narrowing meets is the standing mechanical guard
 * behind that ruling's accepted cost, never scaffolding to tighten away.
 * Which failures publish an account, and when, is README § Failure
 * grammar's per-arm presence grammar — narrowing `ok` still proves exactly
 * what it always proved: a value to rely on.
 */
export type StageFailure<Value = never> = {
	readonly ok: false;
	readonly cause: StageCause;
	readonly value?: Value;
};

/**
 * One tagged derivation result. Derived stages share the full envelope; the
 * given stages (`source`, `type`) carry only its success arm. The failure
 * arm's optional `value` is the stage's account (see {@link StageFailure}).
 */
export type FactStage<Value> = StageSuccess<Value> | StageFailure<Value>;

/**
 * The ast stage's failure: beside its cause it may carry the recovered
 * account — the **recovered tree** the recovering reader builds when the
 * program lexes but does not parse — with the reader's **invented nodes**
 * enumerated beside it, by reference into that same tree (README § Failure
 * grammar; human ruling 2026-09-01: an invented tree is admissible only as
 * this labeled, separate account). `invented` is present exactly when
 * `value` is — an invariant the derivers enforce, since optional members
 * cannot be conditioned on a sibling (data-model.md § Illegal states).
 */
export type AstFailure = StageFailure<Program> & {
	readonly invented?: ReadonlyArray<AcornNode>;
};

/**
 * The tokens stage's value: the token stream plus the comments the
 * tokenizer sets aside — those two emerge from one pass, so they travel
 * together and never depend on any later stage — plus, unless its own
 * derivation defects, the input-element sequence derived over them.
 */
export type Tokens = {
	readonly tokens: ReadonlyArray<Token>;
	readonly comments: ReadonlyArray<Comment>;
	/**
	 * DERIVED, by calling the shared scanning leaf (`../lib/scanning/`):
	 * the same source re-read in the specification's own vocabulary — one
	 * named element per span, covering `[0, source.length)` with no gaps,
	 * no overlaps, and nothing of zero width. Present on every successful
	 * tokenization except when the enrichment derivation itself defected —
	 * absent exactly then: a loud embody-machinery report in development,
	 * never a property of the program (human rulings 2026-08-17 and 2026-08-18:
	 * the leaf stays byte-untouched, embody publishes by calling it, and
	 * the member is optional with this one absence condition).
	 *
	 * This is the normative statement of the coherence guarantee: the
	 * leaf's one precondition — source, tokens and comments from one
	 * reading of one source — is satisfied by construction, because the
	 * derivation that calls the leaf holds the snippet's source and
	 * produced both arrays in the same tokenizer pass. That closes,
	 * embody-side, the hole the leaf's DOCS records as input coherence.
	 *
	 * Read it with the leaf's recorded limits, repeated here per the
	 * fact-admission constraint's condition (c): whitespace and
	 * line-terminator runs are collapsed to maximal runs — the leaf's one
	 * deliberate departure from the specification, reversible by
	 * splitting a run's text per character; a slash after `await` can be
	 * mis-read upstream by the tokenizer, and the published sequence is
	 * then wrong and still tiles — tiling is a property of the sequence,
	 * never evidence it is the specification's; the hashbang is corrected
	 * toward the specification off the comment channel. Each element's
	 * `tokenIndices` are indices into the sibling `tokens` array —
	 * indices, never token objects, which is what lets the sequence live
	 * inside the embodiment's deep freeze (an acorn token's `type` is a
	 * process-global singleton the freeze must not reach) and what joins
	 * this sequence to any other derivation over the same stream.
	 *
	 * Within a tokens failure's account (README § Failure grammar) this
	 * same member carries the **bounded** sequence: the source cut at the
	 * account's extent — the end of the last token or set-aside comment,
	 * whichever is later — handed to the same leaf under its unchanged
	 * tiling contract (human ruling 2026-09-01: bounded by slicing), and
	 * optional under this same single absence condition.
	 */
	readonly inputElements?: ReadonlyArray<InputElement>;
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
 * always binds and always scopes. A failed stage may still carry its account
 * as `value` — partial for a stopped tokenization, recovered downstream of a
 * grammar failure — under README § Failure grammar's presence rules; the ast
 * arm's account additionally enumerates its invented nodes
 * ({@link AstFailure}).
 */
export type Facts = {
	readonly source: StageSuccess<string>;
	readonly tokens: FactStage<Tokens>;
	readonly ast: StageSuccess<Program> | AstFailure;
	readonly entwined: FactStage<Entwined>;
	readonly environment: FactStage<Environment>;
	readonly type: StageSuccess<SnippetType>;
};

// ─────────────────────────────────────────────────────────────────────────────
// The entwined binding
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dot-delimited node-path rooted at the Program node; array indices are bare
 * segments, e.g. `"$.body.0.declarations.0.init"`. The canonical node identity
 * across the package — postMessage-safe, and unambiguous in the direction
 * consumers read it: a path names exactly one node.
 *
 * The reverse direction is one-to-one for every node the grammar gives its own
 * slot, but not quite for all: where the parse reuses a single node object in
 * two slots, both paths lead to it. The bare named specifier forms are where
 * the parse does this — `import { x }` builds one identifier and hangs it at
 * both `local` and `imported`; `export { x }` and the re-export `export { config } from
 * "./m.js"` do likewise at `local` and `exported`; a string export name
 * (`export { "x" } from "m"`) shares one string literal, so the shared node
 * need not be an identifier. The renamed forms build two nodes. So a consumer
 * keyed by node identity rather than by path may meet the same node twice,
 * and should tolerate it.
 */
export type NodePath = string;

/** A token tied into the binding: its neighbors and its innermost node. */
export type EntwinedToken = {
	readonly token: Token;
	/**
	 * The wrapper `byOffset` holds at the token's start. Where several
	 * wrappers share the innermost span, which of them this is, is not a
	 * contract — and it may sit outside the subtree of a wrapper tying
	 * this token. `null` would mean a token outside every span, which the
	 * no-hole `byOffset` precludes.
	 */
	readonly innermostNode: EntwinedNode | null;
	readonly previous: EntwinedToken | null;
	readonly next: EntwinedToken | null;
};

/** A comment tied into the binding, by the same geometry as a token. */
export type EntwinedComment = {
	readonly comment: Comment;
	/**
	 * The wrapper `byOffset` holds at the comment's start. Where several
	 * wrappers share the innermost span, which of them this is, is not a
	 * contract — and it may sit outside the subtree of a wrapper tying
	 * this comment.
	 */
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
	/**
	 * Every token whose start lies in the node's half-open span
	 * `[start, end)`, in stream order — containment is the whole rule
	 * (human ruling 2026-08-11): a wrapper's ties follow from its span
	 * alone, and `innermostNode` plays no part in them. A zero-width span
	 * ties none. Usually the wrappers holding one token are a single
	 * ancestor chain; two cases break that, and both tie the same shared
	 * token wrapper — one graph, never copies: a node the parse reuses at
	 * two paths (see {@link NodePath}), and a shorthand property's key
	 * sharing, or sitting inside, its value's span. So the token sets of
	 * two sibling wrappers are not always disjoint.
	 */
	readonly tokens: ReadonlyArray<EntwinedToken>;
	/**
	 * Every comment whose start lies in the node's half-open span, in
	 * source order — the same containment rule as `tokens`.
	 */
	readonly comments: ReadonlyArray<EntwinedComment>;
};

/**
 * Where one pair of grouping parentheses sat: `start` at the `(`, `end` one
 * past the `)` — half-open offsets in UTF-16 code units, the same
 * `start`/`end` vocabulary every node and token carries. The recording
 * instrument's own positions, never re-derived from the text: the parser's
 * within the machine's binding — where a node with no entry IS the parser's
 * reading that none wrapped it — and the recovering reader's within a
 * recovered account, where a missing entry is the reader's silence, never
 * an assertion about the source (human ruling 2026-09-02). Entwined data,
 * keyed by the path of the node the parentheses wrapped; a node wrapped
 * more than once carries one span per pair, outermost first — ascending
 * `start`, the order the source reads (README § Glossary — paren span).
 */
export type ParenSpan = {
	readonly start: number;
	readonly end: number;
};

/**
 * The source⇄tree binding: one shared graph of entwined nodes, tokens, and
 * comments, with two canonical entry points — `root` and `byPath`. Both hold
 * the same references as the tree — entry points into the graph, never copies.
 * `byOffset` addresses that same graph from the source side, and `parenSpans`
 * sits beside all three: not an entry point but a record about the source, keyed
 * into the graph's own identity space.
 */
export type Entwined = {
	readonly root: EntwinedNode;
	/**
	 * Every node keyed by its `NodePath` — O(1) resolution from a carried
	 * path string back to its entwined node. A node the parse reuses at
	 * two paths has one wrapper per path (see {@link NodePath}), so a key
	 * count counts paths, not node objects.
	 */
	readonly byPath: Readonly<Record<NodePath, EntwinedNode>>;
	/**
	 * Indexed by source offset, in UTF-16 code units; each slot holds the
	 * deepest node whose span covers that offset. Every offset in
	 * `[0, source.length)` resolves at least to the root — never a hole.
	 * Zero-width nodes cover no offset; reach them via `byPath`.
	 */
	readonly byOffset: ReadonlyArray<EntwinedNode>;
	/**
	 * Where the reading that produced this binding recorded grouping
	 * parentheses — the machine's parse in a trustworthy value, the recovering
	 * reader in a recovered account ({@link ParenSpan} carries the attribution
	 * rule) — keyed by the path of the node each pair wrapped: the same key
	 * space as `byPath`, so a key here always resolves there. Sparse: a node
	 * with no entry carries none, an empty list is never published, and a
	 * present key always means at least one pair. A node wrapped more than
	 * once carries one span per pair, outermost first.
	 */
	readonly parenSpans: Readonly<
		Record<NodePath, ReadonlyArray<ParenSpan> | undefined>
	>;
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
 * field here is the analyzer's own reading but `path`, which embody derives from
 * the entwined index.
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
	/** Present only within a recovered account: this definition rests on an invented node of the recovered tree (human ruling 2026-09-01: invention marked in the structure). Never present in the machine's reading. */
	readonly invented?: true;
};

/**
 * How a use touches its binding: read-only, write-only, or both. A single
 * string discriminant — `'readwrite'` is spelled to contain both `'read'` and
 * `'write'` so a consumer can test membership by substring; do not respell it.
 */
export type ScopeAccess = 'read' | 'write' | 'readwrite';

/**
 * How a use of a name relates to its `let`/`const`/`class` binding when the use
 * precedes the binding's initialization — the fact, never a throw verdict:
 *
 * - `'eager'` — read before initialization in a context evaluated unconditionally
 *   when reached: an initializer or `for-of`/`for-in` iterable, a class `extends`
 *   expression or computed member key, a static field or static block, a
 *   preceding statement, or a synchronous immediately-invoked function (its body
 *   runs in place). A guaranteed evaluation in the dead zone.
 * - `'deferred'` — read before initialization in a context the consumer must
 *   reason about: a function not invoked in place (it may never run), an instance
 *   field initializer (runs at construction), or an invoked function that is a
 *   generator (its body runs on demand) or async (its body runs, but a dead-zone
 *   error surfaces as a rejection, not a synchronous throw).
 * - `false` — the use is at or after initialization, or the binding has no dead
 *   zone at all.
 *
 * Both `'eager'` and `'deferred'` are truthy and `false` is falsy: `if
 * (usedBeforeBound)` tests "is there any pre-initialization relationship." A
 * consumer draws any "this throws" inference; embody only states the fact. See
 * {@link ScopeReference.usedBeforeBound}.
 */
export type UsedBeforeBound = 'eager' | 'deferred' | false;

/**
 * One use of a name. Every field is projected faithfully from the scope analysis
 * but `path` and `usedBeforeBound`, which embody derives: the identifier node,
 * the variable it resolves to — or `null`
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
	/** How the use touches the binding. See {@link ScopeAccess}. One analyzer artifact rides here: an export specifier (`export { x }`) is recorded as a `'read'` of the local binding, though exporting evaluates no read — it links a binding. A consumer counting reads sees that link as one. */
	readonly access: ScopeAccess;
	/** Whether this write is the binding's own initialization — meaningful only for writes, `false` for reads. Not the AST `VariableDeclarator.init` (the initializer node) nor the `.init` path segment: the analyzer's write-of-initialization flag, coerced from its read-only `undefined` to a clean `false`. */
	readonly init: boolean;
	/** The written expression on a write: the RHS node, or `null` for an update (`x++`/`--x`, which writes with no RHS). Absent on reads — its presence is exactly the write predicate (`'writeExpr' in ref` ⟺ the use writes). */
	readonly writeExpr?: AcornNode | null;
	/** The `NodePath` of `identifier` in the source⇄tree binding — resolve via `entwined.byPath` for the identifier's neighbors and children. */
	readonly path?: NodePath;
	/**
	 * DERIVED, not the analyzer's reading: how this use relates to its resolved
	 * `let`/`const`/`class` binding when the use precedes that binding's
	 * initialization — a fact embody derives from the scope graph and source
	 * positions, from which a consumer draws any "this throws" inference. See
	 * {@link UsedBeforeBound}.
	 *
	 * A use precedes initialization when, for `let`/`const`, `identifier.start`
	 * precedes the declarator's end, or the use sits in a `for-of`/`for-in`
	 * iterable (evaluated before the per-iteration binding); and, for a `class`,
	 * when the use precedes the `class` keyword or sits anywhere within the class's
	 * own `extends` expression or a computed member key — the class binding
	 * initializes after those, before any method, field, or static block runs, so
	 * class-name uses in those bodies are not before initialization. The tier is
	 * `'eager'` when that use is evaluated unconditionally at a fixed point and
	 * `'deferred'` when it runs later — inside a function or an instance field
	 * initializer (a static field or static block runs eagerly at class
	 * definition; a synchronous function invoked in place also runs eagerly, so
	 * its body is not a deferral boundary — an async or generator one is). The
	 * split is a structural fact — whether the path from the use to its binding
	 * crosses a deferred-execution scope — never a reachability judgment: a
	 * `'deferred'` read lands in the dead zone only if its context runs there,
	 * which a consumer needing soundness decides, whereas `'eager'` is a guaranteed
	 * dead-zone evaluation. Positions are offsets in UTF-16 code units
	 * (`.start`/`.end`, never `.loc`).
	 *
	 * `false` for uses at or after initialization, unresolved uses, the binding's
	 * own initializer write, and `var`/function/import/catch bindings (no dead
	 * zone) — and parameters, whose inter-default-parameter TDZ embody does not
	 * model.
	 */
	readonly usedBeforeBound: UsedBeforeBound;
	/** Present only within a recovered account: this use's identifier is an invented node of the recovered tree (human ruling 2026-09-01: invention marked in the structure). Never present in the machine's reading. */
	readonly invented?: true;
};

/**
 * One binding: the name, the identifier nodes that introduce it, the
 * references that resolve to it, its definitions, and the external names it is
 * exported under. How a name comes to be, and how it leaves the module. Every
 * field is the analyzer's own reading but `exportedNames`, which embody derives.
 */
export type ScopeVariable = {
	readonly name: string;
	readonly identifiers: ReadonlyArray<AcornNode>;
	readonly references: ReadonlyArray<ScopeReference>;
	readonly defs: ReadonlyArray<ScopeDefinition>;
	/**
	 * DERIVED, not the analyzer's reading (eslint-scope models no export status) —
	 * read from the module's export declarations themselves, not inferred. The
	 * external names this binding contributes to the module's export interface (the
	 * ECMAScript ExportEntries whose local name is this binding). A declaration
	 * export (`export const x`, `export function f`, `export class C`) or a bare
	 * named specifier (`export { x }`) exports under the binding's own name;
	 * `export { x as y }` records `y`, and `export { x as "s" }` the string `s`
	 * (ES2022 string export names); `export default function f`, `export default
	 * class C`, and `export { x as default }` record `'default'`; one binding may
	 * carry several (`export { x, x as y }` → `['x', 'y']`, source order). Empty
	 * when the binding is not exported — and always empty outside a `module` scope
	 * (a script has no exports).
	 *
	 * The boundary, then the one departure. An export entry whose local name is not
	 * a binding the program names is not recorded: a re-export (`export … from …`,
	 * `export * …`), and a default export of an expression or an anonymous
	 * declaration (`export default 42`, `export default function () {}`), whose
	 * local name the specification writes `*default*`. So iterating bindings does
	 * not reconstruct a module's whole export interface — this is a per-binding
	 * fact, and a complete interface reading would be a separate module-scoped one.
	 * The departure: `export default x` IS recorded on `x` though the specification names that
	 * entry's local binding `*default*`: the export is a value snapshot, not a live
	 * binding to `x` (reassigning `x` afterwards does not change what importers
	 * see). Embody attributes it to `x` anyway, because a consumer asking whether
	 * this name leaves the module wants a yes — the one place this reading extends
	 * past the specification's letter.
	 *
	 * An exported name is a name, not a place: unlike a reference or a definition,
	 * it carries no `path` back into the source⇄tree binding, so a consumer that
	 * wants the export site itself reaches it through the `ast` fact. The array is
	 * always present, so test its length — an empty array is truthy. A name that
	 * leaves the module is read from outside it, whatever a consumer makes of that.
	 */
	readonly exportedNames: ReadonlyArray<string>;
	/** Present only within a recovered account: this binding is introduced by, or resolves through, an invented node of the recovered tree (human ruling 2026-09-01: invention marked in the structure). Never present in the machine's reading. */
	readonly invented?: true;
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
	/** Present only within a recovered account: the node introducing this scope is an invented node of the recovered tree (human ruling 2026-09-01: invention marked in the structure). Never present in the machine's reading. */
	readonly invented?: true;
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
 * Freeze-what-you-own: everything the embodiment holds the sole reference to
 * is deep-frozen; attached lens refs and acorn's process-global token-type
 * singletons sit outside this immutability contract — owned by their defining
 * modules and shared by every parse in the process, respectively (DOCS.md
 * § Embodiment decisions, E4). The embodiment is level-blind — no field of it
 * knows what a language level is.
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

// ─────────────────────────────────────────────────────────────────────────────
// Internal transport (internal) — carried between derivations, never published
// ─────────────────────────────────────────────────────────────────────────────

/**
 * (internal) The parse's record of where grouping parentheses sat, keyed by the
 * node object each pair wrapped. Born in the ast derivation, read by the
 * entwining walk, discarded there — it reaches no member of the Facts, so the
 * embodiment's freeze never meets it.
 *
 * Object identity is the only key available where the record is made: a node's
 * path is born in the entwining walk, which runs afterwards, and re-deriving
 * the path grammar here would be a second copy of it to keep in step. A `Map`
 * is the shape DEV.md § 13 names for exactly this case — transient internal
 * computation with object-identity keys, never frozen and never serialized.
 *
 * Spans are ordered as the published record orders them: outermost first.
 */
export type ParenSpansByNode = ReadonlyMap<AcornNode, ReadonlyArray<ParenSpan>>;

/**
 * (internal) What deriving the syntax tree produces: the ast fact stage, and
 * the parse's record of where grouping parentheses sat. One parse yields both,
 * so they travel together — the same reason the tokens value carries the
 * comments the tokenizer set aside.
 *
 * The record carries whatever the reading that produced the tree recorded:
 * the machine's on a success, the recovering reader's — possibly nothing —
 * beside a recovered tree, and empty when no tree of either kind exists
 * ({@link ParenSpan} carries the attribution rule). Only `ast` is published —
 * the record's own published form is the entwined binding's, keyed by path
 * rather than by node.
 */
export type AstDerivation = {
	readonly ast: StageSuccess<Program> | AstFailure;
	readonly parenSpansByNode: ParenSpansByNode;
};
