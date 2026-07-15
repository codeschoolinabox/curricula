<!-- cspell:ignore consultable unconstructible reprojection -->

# language-levels

Language levels as passive, consultable libraries. A level is a curated slice of
JavaScript packaged as data and pure functions: a validator over the parse
facts, the snippet types it admits, reference and notional-machine
documentation, editor-support data, and semantic-model builders. A level
**answers when consulted — it is never a plugin and never an actor** — and
levels never ship lenses.

The package [README](../README.md) owns what a language level, the none-state,
and strict/warn mean; this document owns the level contract's mechanics.

## What lives here

```text
language-levels/
  README.md       this file — the level contract's mechanics + navigation
  DOCS.md         the region's architectural sketch
  types.ts        the level spine — the contract every level satisfies
  <key>/          one directory per level — jej/ is the first
```

## The level spine

Every level exports one object satisfying the spine:

- **key** — the level's registry identity. The empty key is reserved for the
  none-state: its selector entry is a label, not a level, and no level may claim
  it. Injection is append-only; a key collision is a loud composition error.
- **label** — the level's display name in the selector.
- **validate** — pure and synchronous: the parse facts in, violations out. It
  never parses — one parse truth — and it is never consulted about a program
  that does not parse (a failed tokens or ast stage leaves the parse facts
  unconstructible): the undetermined verdict is the caller's, produced without
  consulting any level.
- **snippetTypes** — the snippet types the level admits, spoken in a local
  `'script' | 'module'` vocabulary that structurally mirrors the package's —
  never imported from embody. Whether the current type is admitted is the
  orchestrator's check, made the same way as code conformance.
- **docs** — reference and notional-machine documentation; consumed by the
  selector's hover and by level-aware lenses.
- **editorSupport** — data, never editor code, in three channels: completion,
  hover documentation, format options. One generic editor adapter consumes the
  data when the level is selected, and the channels' inner shapes belong to that
  adapter's contract. Lint diagnostics are **not** here: they are a presentation
  adapter over the same validate result — never a second validation source.
- **models** — semantic-model builders, one exported builder per model: per-use
  construction, single algorithmic truth. Each builder's input and output belong
  to the level — the spine keys the record; the shapes are known to the lenses
  and evaluators that import the level directly. (A hoisting model derives from
  the parse facts; a realm model needs no program at all; a trace interpretation
  reads execution — one input type fits none of them.)

The shape, compactly (the full contract with its doc-comments is
[`types.ts`](./types.ts)):

```ts
type LanguageLevel = {
	key: string; // '' reserved for the none-state
	label: string;
	validate: (facts: ParseFacts) => ReadonlyArray<Violation>;
	snippetTypes: ReadonlyArray<SnippetType>;
	docs: LevelDocs;
	editorSupport: EditorSupport;
	models: ModelBuilders;
};
```

## Consulted, never in charge

A level is stateless and pure: the same parse facts produce the same violations,
and callers own all memoization (one memoized validate per settle and per level,
shared by the selector's fit marks, the gutter, and the enforcement mask — all
of which live outside this region). Three consumers project the one validate
result: the selector asks "any violations?", the gutter asks "where?", the mask
asks "empty or not?" — the level answers once.

## What a level ships — and never ships

A registered level powers the level selector, the editor's support, and
enforcement — identically whether it is built-in or injected. **Levels never
ship lenses**: a level's machine-facing lenses come from that level's own
author, importing the level directly. No level gets anything special from the
architecture; JEJ is simply the first one registered.

## One parse truth

validate consumes the **parsed values** — the token stream, the set-aside
comments, and the syntax tree the embodiment's parse stages carry — never any
stage envelope, and never a second parse. `ParseFacts` is not a slice of the
embodiment's Facts: it is this region's own reprojection of those values, so no
type edge runs from levels into embody. The parse-facts vocabulary a level types
against is the parser's own; its ownership can move to the shared parse leaf
without touching any level.

## Adding a level

A level is one directory exporting one spine object:

```text
language-levels/<key>/
  README.md      what this level curates, for whom, on what notional machine
  DOCS.md        why this slice — decisions + its own data flow
  index.ts       the LanguageLevel object (default export)
  types.ts       the level's own model types
  …              validators, docs content, model builders — the level's business
```

A level ships no lenses — its machine-facing lenses come from you, its author,
importing your level directly.

Embedding sites inject levels through the language-levels prop — append-only,
key collision loud, no replacement or shadowing of built-ins. The test-fixture
level exercising that injection path is the recipe's executable exemplar; it is
an injected, test-scoped artifact — never a built-in directory, so it can never
enter a production selector.

## Glossary — region terms

The package glossary owns the shared meanings; these entries add the mechanics
this region owns.

- **level key** — the registry identity; `''` is the reserved none-state key, a
  label and not a level.
- **ParseFacts** — the parsed values a validator consumes: the token stream, the
  set-aside comments, and the syntax tree. Values, never envelopes.
- **Violation** — one place the program steps outside the level: the node type,
  the machine-worded message, the source range, and the node's path. A violation
  carries no severity: it never blocks execution — enforcement posture is global
  and orchestrator-side, never per-violation.
- **editor-support data** — what a level ships for the editor: the completion,
  hover, and format channels. Data for the one generic adapter — never editor
  code; the channels' inner shapes are the adapter's contract.
- **model builder** — a pure function deriving one semantic model; one exported
  builder per model, built at use time by the consumer. A builder's input and
  output are the level's own — `docs.notionalMachine` is prose _about_ the
  machine; the models are the machine _as data_.

## Navigation

- Package root: [`../README.md`](../README.md) — the domain model and the
  package glossary.
- [`DOCS.md`](./DOCS.md) — this region's architectural sketch.
- [`types.ts`](./types.ts) — the level spine: `LanguageLevel`, `ParseFacts`
  (over acorn's own types, type-only), `Violation`, `SnippetType` (a local
  structural mirror, never imported from embody), `EditorSupport`,
  `ModelBuilders`.
- Each level's own directory documents that level.
