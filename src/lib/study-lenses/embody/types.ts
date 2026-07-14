// cspell:ignore Gateable entwine entwined entwining injective Failable

/**
 * The embody region's keystone contracts: the snippet that comes in, the
 * Facts and lifecycle the factory derives, the structural view it has of a
 * lens (`Gateable`), and the frozen `Embodiment` that comes out.
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

/** The five derivations the Facts hold, one tagged stage each. */
export type FactStageName = 'source' | 'tokens' | 'ast' | 'entwined' | 'type';

/** The stages that can fail — derived, not given. */
export type FailableStageName = 'tokens' | 'ast' | 'entwined';

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
 * not parse (spelling, then grammar). `entwined` failing is an embody
 * defect, reported loudly in development.
 */
export type Facts = {
	readonly source: StageSuccess<string>;
	readonly tokens: FactStage<Tokens>;
	readonly ast: FactStage<Program>;
	readonly entwined: FactStage<Entwined>;
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
// The lifecycle
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The six flat phases, in the specification's own order. The single
 * compile-time truth of that order: the implementation's runtime order
 * constant `satisfies` this tuple.
 */
export type LifecyclePhaseOrder = readonly [
	'source',
	'realm',
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
 * The frozen study object: the Facts plus the six phase payloads.
 *
 * @remarks
 * Freeze-what-you-own: the structure embody built is frozen; attached lens
 * refs sit outside this immutability contract, owned by their defining
 * modules. The embodiment is level-blind — no field of it knows what a
 * language level is.
 */
export type Embodiment = {
	readonly facts: Facts;
	readonly lifecycle: Readonly<Record<LifecyclePhaseName, LifecyclePhase>>;
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
