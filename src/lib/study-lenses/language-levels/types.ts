// cspell:ignore consultable reprojection unconstructible renderable

/**
 * The level spine: the contract every language level under
 * `language-levels/<key>/` exports. A level is a passive, consultable
 * library — data and pure functions; never a plugin, never an actor.
 *
 * The only import is acorn, type-only — the parser's own vocabulary. The
 * snippet-type vocabulary is a local structural mirror: no type edge runs
 * from levels into embody, and ownership of the shared parse vocabulary can
 * move to the shared parse leaf without touching any level.
 *
 * Region docs: ./README.md (mechanics) · ./DOCS.md (architecture). The
 * package glossary (../README.md) owns the shared vocabulary.
 */

import type { Comment, Position, Program, Token } from 'acorn';

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
 * The parsed values a level's validator consumes: the token stream, the
 * set-aside comments, and the syntax tree.
 *
 * @remarks
 * Values, never envelopes — this is not a slice of the embodiment's Facts
 * but this region's own reprojection of what the parse stages carry. All
 * three fields are present: a validator is never consulted about a program
 * that does not parse (a failed tokens or ast stage leaves this shape
 * unconstructible), so the undetermined verdict is the caller's, produced
 * without consulting any level.
 */
export type ParseFacts = {
	readonly tokens: ReadonlyArray<Token>;
	readonly comments: ReadonlyArray<Comment>;
	readonly ast: Program;
};

// ─────────────────────────────────────────────────────────────────────────────
// Violations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Start and end positions of a source range, per acorn's `loc` convention:
 * `start` is the first character; `end` is exclusive — one past the last.
 */
export type SourceRange = {
	readonly start: Position;
	readonly end: Position;
};

/**
 * One place the program steps outside the level.
 *
 * @remarks
 * Enough to display a message with source context AND to locate the
 * offending node (the dot-delimited node path is the package's canonical
 * node identity). A violation carries no severity: it never blocks
 * execution — enforcement posture is global and orchestrator-side, never
 * per-violation.
 */
export type Violation = {
	readonly nodeType: string;
	readonly message: string;
	readonly location: SourceRange;
	readonly nodePath: string;
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
 * level's own — a hoisting model derives from the parse facts, a realm
 * model needs no program at all — so the spine pins neither; consumers know
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
