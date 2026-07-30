// cspell:ignore consultable reprojection unconstructible renderable

/**
 * The level spine: the contract every language level under
 * `language-levels/<key>/` exports. A level is a passive, consultable
 * library — data and pure functions; never a plugin, never an actor.
 *
 * Two type-only edges, no runtime edge: acorn's, the parser's own
 * vocabulary; and the screening leaf's `Violation` and `SourceRange`, which
 * this file **re-exports rather than re-declares** — the violation shape is
 * one contract shared by the machinery that produces violations and the
 * levels that hand them on, and a second declaration would be a second
 * source. The snippet-type vocabulary is a local structural mirror: no type
 * edge runs from levels into embody, and ownership of the shared parse
 * vocabulary can move to the shared parse leaf without touching any level.
 *
 * Region docs: ./README.md (mechanics) · ./DOCS.md (architecture). The
 * package glossary (../README.md) owns the shared vocabulary.
 */

import type { Comment, Identifier, Program, Token } from 'acorn';

import type { Violation } from '../lib/screening/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// The violation vocabulary, published here for every level-side consumer
//
// Declared by the screening leaf, which produces violations. `Violation` is
// re-exported because levels hand violations on and the shape must be one
// contract; `SourceRange` alongside it because it is `Violation.location`'s
// type — a level naming that field would otherwise reach past the region
// boundary for it. What the leaf cannot say, knowing nothing of levels:
//
// No level controls the parse. A range is offsets rather than line/column
// precisely because offsets are unconditional — a line/column range would
// depend on a parser option the parse facts cannot express, and no level sets
// it. Editor surfaces take offsets directly; a level never converts, having no
// source text to count lines in.
//
// And enforcement posture is global. Whether violations block anything is the
// orchestrator's ruling over the whole program, never a property of one
// violation — which is why a violation carries no severity.
// ─────────────────────────────────────────────────────────────────────────────

export type { SourceRange, Violation } from '../lib/screening/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Foreign vocabulary, mirrored
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Whether a program is treated as a script or a module. A local structural
 * mirror of the package's snippet-type vocabulary — never imported from
 * embody.
 */
export type SnippetType = 'script' | 'module';

// ─────────────────────────────────────────────────────────────────────────────
// The parse facts a validator consumes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One name the program uses that no program scope declares — one entry of
 * the scope resolution's escape list: the name, the referencing identifier
 * node, and that node's canonical dot-delimited path.
 *
 * @remarks
 * A level-blind fact with level-owned meaning: whether an unresolved name
 * is the realm's, the runtime's, or a violation is each level's own
 * vocabulary ruling — the projection says only "no program scope resolves
 * this". The three fields carry one job each: `name` is the ruling's datum,
 * `node` the violation's anchor (offsets and node type, borrowed — never
 * frozen by a level), `nodePath` the canonical identity a violation
 * carries.
 */
export type UnresolvedReference = {
	readonly name: string;
	readonly node: Identifier;
	readonly nodePath: string;
};

/**
 * The parsed values a level's validator consumes: the token stream, the
 * set-aside comments, the syntax tree, and the scope resolution's escape
 * list — the references no program scope resolves.
 *
 * @remarks
 * Values, never envelopes — this is not a slice of the embodiment's Facts
 * but this region's own reprojection of what the parse and scope-analysis
 * stages carry. All fields are present: a validator is never consulted
 * about a program that does not parse or whose scope analysis did not
 * complete (a failed parse or scope-analysis stage leaves this shape
 * unconstructible), so the undetermined verdict is the caller's, produced
 * without consulting any level. The one scope analysis lives upstream; a
 * level never derives scopes of its own.
 */
export type ParseFacts = {
	readonly tokens: ReadonlyArray<Token>;
	readonly comments: ReadonlyArray<Comment>;
	readonly ast: Program;
	readonly unresolvedReferences: ReadonlyArray<UnresolvedReference>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Level data channels
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reference and notional-machine documentation, as renderable markdown.
 * Prose about the machine — the models are the machine as data.
 */
export type LevelDocs = {
	readonly reference: string;
	readonly notionalMachine: string;
};

/**
 * Editor-support data in three channels — completion, hover, format —
 * consumed by the one generic editor adapter when the level is selected.
 * The channels' inner shapes belong to that adapter's contract; a level
 * ships data, never editor code. Lint diagnostics are NOT here: they are a
 * presentation adapter over the same validate result, never a second
 * validation source.
 */
export type EditorSupport = Readonly<
	Record<'completion' | 'hover' | 'format', unknown>
>;

/**
 * A pure function deriving one semantic model. Input and output are the
 * level's own — a realm model needs no program at all, a trace
 * interpretation reads execution — so the spine pins neither; consumers know
 * the concrete shapes by importing the level directly. A spine-holder never
 * invokes a builder: a zero-argument call type-checks to `unknown` but is
 * meaningless — invocation is sound only through a concrete level import.
 */
export type ModelBuilder = (...inputs: never[]) => unknown;

/**
 * The level's semantic-model builders: one exported builder per model —
 * per-use construction, single algorithmic truth.
 */
export type ModelBuilders = Readonly<Record<string, ModelBuilder>>;

// ─────────────────────────────────────────────────────────────────────────────
// The level spine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What every language level exports. Stateless and pure throughout: the
 * same parse facts produce the same violations, and callers own all
 * memoization.
 *
 * @remarks
 * `key` is the registry identity; the empty key is reserved for the
 * none-state, whose selector entry is a label and not a level — the
 * none-state needs no type, it is `key === ''` claimed by nobody. Injection
 * is append-only; a key collision is a loud composition error. Levels never
 * ship lenses.
 */
export type LanguageLevel = {
	readonly key: string;
	readonly label: string;
	readonly validate: (facts: ParseFacts) => ReadonlyArray<Violation>;
	readonly snippetTypes: ReadonlyArray<SnippetType>;
	readonly docs: LevelDocs;
	readonly editorSupport: EditorSupport;
	readonly models: ModelBuilders;
};
