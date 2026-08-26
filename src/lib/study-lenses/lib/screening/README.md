# lib/screening

The generic machinery that reads a **curated slice** of JavaScript. Given a
parsed program and an allowlist's node-rule table, it walks every node and
produces one frozen `Violation` per place the grammar leaves the slice: the node
type, a machine-worded message, the node's character offsets, and its
dot-delimited path. The posture is **default-deny** — a node type the table does
not name is outside the slice, so new JavaScript is outside by default rather
than by oversight.

Screening decides **legality, never policy**. It holds no opinion about which
node types a curation admits; the caller supplies the table, and the leaf
supplies the walk, the default-deny posture, violation construction, the parse
settings, and — for a table **derived** rather than authored — the structural
floor that derivation is incomplete without. It is equally blind to what a
violation _means_ — nothing here knows about language levels, lifecycle phases,
enforcement postures, or lenses.

Screening also **never parses**. It publishes, as data, the parse settings its
walk's soundness is relative to, and the caller parses with them. One named
configuration, so a caller reaching for the package's published parse shape does
not re-type it and get it subtly wrong.

## Glossary

**Allowlist** — a curated slice of JavaScript as machine-readable data: the
node-rule table the walk dispatches on, and the global names a caller's own
vocabulary check resolves against. Not a synonym for any curation that ships one
— it is a curation's policy in one shape, read by machinery no curation owns.

**Node rule** — the allowlist's standing on one node type: admitted outright
(`true`), or admitted subject to a constraint check. There is no "explicitly
forbidden" arm; **absence is refusal**, so a third state would say the same
thing twice and invite the two to disagree.

**Constraint check** — the predicate a conditional node rule carries, deciding
whether one node is within the slice. It answers _what is wrong_, never _where_:
the walk holds the node's position and its path and constructs the violation, so
a check needs no position and there is one place a source range is read.
Deliberately called a check and never a validator — `validate` is a word the
language-levels contract owns, and a second meaning would be a homonym.

**Default-deny** — the posture: a node type the table does not name is outside
the slice. A caller selects it simply by shipping a table; there is no allow-all
encoding, and an empty table denies everything.

**Screening** — one node's own assessment: apply its rule, and turn a refusal
message into a violation. The walk is the screening of every node. (The word is
the assessment sense throughout — never the display surface, though `screen` is
separately a global name some curated slices admit.)

**Verdict** — one node's result under its rule: admitted, or a refusal message.
Always about a single node, never about a whole program — that scale is the
consumer's word (see _gate_, below).

**Violation** — one place a program steps outside the slice: the node type, the
machine-worded message, the source range, and the node's path. A violation
carries **no severity** — it never blocks execution, and what a refusal is worth
is the consumer's ruling, never this leaf's.

**Source range** — where something sits in the source, as the parser's own
character offsets: `start` is the first character, `end` is exclusive. Offsets,
never line/column — every parsed node carries offsets unconditionally, so a
violation's range is always constructible, while a line/column range would
depend on a parse option the caller may not have set.

**Node path** — the dot-delimited identity of a node within one tree, rooted at
the program (`'$.body.0.declarations.0'`). It is the package's canonical node
identity and a published, stable contract: consumers may persist and compare
paths within one tree.

**Parse settings** — the package's published parse contract as data: the shared
**numeric** language year, and the **source spans** every parse fact carries. A
caller parsing an unsettled source with them gets facts shaped exactly like the
settled pipeline's, so one tree shape and one position vocabulary reach every
consumer. The parse **goal** is deliberately not among them — see below.

**Structural floor** — the node types an inventory-derived slice must admit so
that a program holding an existing program's grammar is not refused for a
surface choice the original happened not to make. A caller deriving an allowlist
by inventorying a program takes the union with the floor; a caller authoring a
table by hand has no use for it.

**Homonyms, resolved.** Several of these names are live elsewhere in the package
on incompatible contracts, and none is unified into this leaf. The
pre-greenfield validating module (`git grep -l "type NodeValidator" -- src/lib`)
declares its own `SyntaxAllowlist`, a **three-state** `NodeRule`, a `Violation`
carrying a **severity**, and a `NodeValidator` that returns a whole violation
rather than a message — where this leaf's `ConstraintCheck` returns `true` or a
string. Sharpest of all, **`SourceRange` is declared three times package-wide**
(`git grep -n "type SourceRange" -- src`) with the same two field names and
different shapes: this leaf's holds character offsets as numbers; the
pre-greenfield one holds line/column position **objects**. They are not
interchangeable despite reading identically at a call site. Likewise **gate** —
a caller's final ruling over a whole candidate — is a consumer's word, not this
leaf's: screening produces per-node verdicts and never rules on what they gate.

## Default-deny, and what it is relative to

The walk is **total over the node types the caller's parse emits** — not over
the whole grammar. That is what makes the posture safe: a node type nobody
anticipated is refused rather than silently admitted. It is also what makes the
posture **parse-relative**, and the reason this leaf publishes the settings:

- A node type **reachable under the caller's parse settings and absent from the
  table** is a false rejection — the table was authored against a narrower
  universe than the tree it is screening.
- A node type **the parse never emits** needs no entry. A rule for one is inert:
  the walk would never reach it. (`ParenthesizedExpression` is the live example
  — the published tree is ESTree-shaped and folds grouping parentheses away, so
  the table carries no entry for it and must not. The settled pipeline
  additionally records where those parentheses sat; a screening caller needs
  only the shape, which the published settings reproduce.)

The published settings pin most of that universe. The **numeric** language year
is load-bearing, not cosmetic — a scope analyzer's version gate is a numeric
comparison that silently degrades on a string, so one shared numeral keeps a
tokenizer, a parser, and a scope analysis reading the source at the same
language version.

**The parse goal is the second universe-fixing option, and it is the caller's.**
Grammar is goal-sensitive: an import declaration parses in a module and is a
grammar error in a script, and a module goal makes four further node types
reachable. So a table is sound for the goal it was authored against and not
automatically for the other. The goal is the one setting that legitimately
varies per source, which is why it is supplied at the call rather than published
here — and why a caller pairing a table with a goal owns that pairing.

**The leaf publishes settings; it does not parse.** The package holds one parse
truth — nothing parses the same _settled_ source twice, and a settled source's
facts are derived once, upstream, and carried. A caller screening a settled
source passes those facts straight in. A caller screening an _unsettled_ source
— a program a model just produced, or an existing program it is inventorying to
derive a table from — has no facts to carry and must parse; the settings say
what to parse it with. Either way this leaf adds no parse call site of its own.
A published constant is a convention, not an enforcement: nothing compels a
caller to use it, and no type can express the precondition.

The walk is **complete, never first-hit**: a refused parent's children are still
screened, so a consumer sees the whole picture rather than the first thing that
went wrong. Each node's path is carried inline as the walk descends — never
built into a separate map.

## What lives here

```text
lib/screening/
  README.md                     (this — orientation + glossary + the default-deny rule)
  DOCS.md                       architectural sketch + Mermaid data flow
  types.ts                      SyntaxAllowlist, NodeRule, ConstraintCheck,
                                ChildWithPath, Violation, SourceRange
  parse-settings.ts             the published parse contract, as data
  collect-violations.ts         the default-deny walk — the leaf's principal export
  get-child-nodes-with-path.ts  path-tagged child traversal
  create-violation.ts           the frozen-violation factory
  structural-floor.ts           the node types an inventory-derived slice must admit
  tests/
    parse-settings.test.ts
    collect-violations.test.ts
    get-child-nodes-with-path.test.ts
    create-violation.test.ts
    structural-floor.test.ts
```

## Public API

```ts
import collectViolations from './collect-violations.js';

const violations: ReadonlyArray<Violation> = collectViolations(
	program,
	allowlist.nodes,
);
```

`program` is an acorn `Program` **as the caller parsed it** — the walk takes a
parsed tree and never produces one. A caller holding derived parse facts passes
the syntax-tree fact; a caller screening an unsettled source parses it first
with the published settings, supplying its own goal:

```ts
import PARSE_SETTINGS from './parse-settings.js';

const program = parse(source, { ...PARSE_SETTINGS, sourceType: 'module' });
```

Three further exports serve callers composing their own screening:

- `createViolation` — the one place a node's range and path become a violation,
  so a range is never read two ways.
- `getChildNodesWithPath` — a node's direct children, each tagged with the path
  segment that reaches it.
- `STRUCTURAL_FLOOR` — a node-rule table of the types an inventory-derived slice
  must admit, for a caller deriving a table from an existing program. It sits
  **under** the caller's own entries in the union: a caller that has authored a
  rule for a floor type keeps its rule.

Behavior:

- **Total over the parsed tree.** Every node is screened, at every depth.
- **Pure.** No mutation of the tree or any node — safe on deep-frozen facts.
- **Frozen.** The returned array and every violation in it are deeply frozen.
  `createViolation` deep-copies before freezing, so a caller's `location` object
  is neither retained nor frozen.
- **Deterministic.** Same tree and same table, same violations, same order.
- **Depth-first, deterministic in order.** A node before its children;
  array-valued children in source-array order; sibling _properties_ in the
  parser's own property order — which is source order for most node shapes but
  not all (a template literal's interpolated expressions enumerate before its
  text chunks). A consumer needing strict source order sorts by
  `location.start`.

## Edge cases

- **An empty table denies everything.** There is no allow-all encoding, so an
  empty `nodes` table refuses every node including the program envelope. This is
  a legitimate request, never a throw — a caller wanting "everything admitted"
  wants no screening at all.
- **A refused parent does not suppress its children.** `for (var i …)` refused
  at the `ForStatement` still screens the declaration inside it. Violation
  counts are therefore not a count of distinct mistakes.
- **The parse goal widens the node-type universe.** A table authored against a
  script-goal parse meets node types it has no rules for when the same source is
  parsed as a module — false rejections, not true violations. The pairing of
  table and goal is the caller's.
- **A node type the parse never emits needs no entry**, and a rule for one is
  inert — the walk cannot reach it. Adding such an entry does not widen the
  slice; removing it does not narrow it.
- **Array holes keep their index.** A `null` element in a node array (a sparse
  array literal, an omitted `for` clause) contributes no child, and later
  siblings keep their source-array positions — so a path never shifts because of
  a hole.
- **Non-node object properties are not children.** A `Literal`'s `regex` record,
  a node's own metadata keys, and the numeric span array the published settings
  add are never traversed and never contribute a path segment.
- **An empty program** yields no violations under a table admitting the program
  envelope, and exactly one under a table that does not.

## Consumers

- **`language-levels/jej`** — its `validate` hands the level's allowlist table
  and the embodiment's syntax-tree fact to the walk, then folds the walk's
  violations into its own answer beside a vocabulary ruling the level owns,
  sorted by offset since the walk's order is property order. The level owns none
  of the _screening_ mechanism; grammar is this leaf's phase of its answer, not
  the whole of it.
- **Callers screening an unsettled program** — one a model just produced, or one
  being inventoried to derive a table from — parse with the published settings
  and screen against a table they compose, taking its union with
  `STRUCTURAL_FLOOR` when the table is derived rather than authored.

Consumers decide what a violation is worth; screening never does.

`Violation` and `SourceRange` are re-exported by the language-levels region, so
every level-side consumer keeps its import. The clauses of their documentation
that are statements about **levels** — that no level controls the parse, that a
level never converts offsets to line/column, that enforcement posture is global
and orchestrator-side rather than per-violation — live at that re-export site,
where the levels domain is speakable. This leaf's copies carry only what is true
of a curated slice.

## Why this module exists

Two independent consumers ask the same question of a program — "where does this
leave the curated slice?" — and both need the same default-deny walk, the same
path vocabulary, and the same violation shape. Left in one of them, the
machinery would be reached into by the other across a boundary that was never
meant to carry it, or copied and allowed to drift. The package already carries
one such drift: an independently-evolved copy of this walk lives in the
pre-greenfield tree, carrying a third node-rule state and violations that carry
a severity, and it cannot be substituted for this one.

They need the same walk and **hold different notional machines**, and that is
why the leaf is domain-blind rather than merely generic. A language level's
curriculum position and a generator's screening of a candidate are different
models of what a node type _means_, which constructs are worth refusing, and
what a refusal should cost a reader — so it is not that a language model was too
costly to build here, but that there is no single one to build: a leaf holding
either would be wrong for the other. Those judgments belong to the caller's
curation, which owns the node-rule table and the ruling on what a violation is
worth; what node types exist and what shape they take belong to the parser.

Factoring the walk into one domain-blind leaf keeps a single screening truth,
and — because the walk's soundness is parse-relative — puts the settings it is
sound against in the same place, so the pairing cannot drift apart.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the repo's `DEV.md`. Module-specific
rules:

- **Pure-sync only.** No async, no I/O, no side effects, no randomness.
- **Domain-blind.** No language levels, no lifecycle phases, no enforcement
  postures, no lenses — in the code, or in prose that states this module's
  contract. It imports no package region — not embody, not levels, not lenses —
  not even for types; its only foreign vocabulary is acorn's, type-only.
  (Repo-wide freezing utilities are not a package region.) **Two bounds on the
  rule's own reading** (human ruling 2026-08-25). First, it does not forbid
  **naming the category in order to declare blindness to it** — this bullet, the
  orientation above, and § Why this module exists all do that, and each is
  describing the leaf. Second, **[§ Consumers](#consumers) is a carve-out**: a
  module is required to name who uses it [read: `DEV.md` § Directory
  Documentation Convention — "siblings link to each other"], so naming a
  consumer there is navigation, not domain knowledge. The earlier wording, _"in
  the code or in the prose"_, forbade both on a literal reading and so
  self-applied. It was the cited authority for five deletions, every one of them
  in a source file's JSDoc rather than in a README, so all five stay justified
  under the narrower rule.
- **Absence is the baseline; recommendation is a later layer** (human ruling
  2026-08-06). The leaf reports what it did not admit and never tells a reader
  what to write instead. A recommendation surface — "did you mean", a suggested
  replacement, a fix-it — is a different concern with different authority, and
  it composes on top of an absence report rather than replacing it. A leaf that
  recommends has silently taken a domain position about what the writer wanted.
- **Never acquires a severity, an ordering by importance, a default table, or a
  message a consumer is expected to show a reader unedited.** Each is a claim
  about the language or its reader, and each belongs to the caller's curation —
  a leaf holding one has taken the domain position the domain-blind rule above
  forbids. The last clause is the one that distinguishes this leaf's
  **machine-worded** message, which is the shipped contract, from a
  reader-facing one, which is not. (Stated as a standing rule 2026-08-13, when
  the `## Epistemology` convention that used to carry it as a falsification
  condition was stripped repo-wide; the constraint is older than this wording
  and is why the pre-greenfield copy of this walk, which carries a severity,
  cannot be substituted for it.)
- **Never parses — the shipped graph's acorn import is type-only.** The leaf
  publishes the settings and takes a parsed tree. A parser call inside this leaf
  would make it the second parse configuration it exists to prevent, and the
  type-only import is what leaves one no way in: every module the leaf ships
  names acorn's vocabulary, never its `parse`. The test tree imports it as a
  value, because a test needs a tree before it can screen one.
- **The settings are screening's precondition, not the package's parse home.**
  The leaf publishes the configuration its own walk's soundness depends on; it
  owns no parse verb, no parser wrapper, and no other module's parse needs. A
  caller whose parse has requirements of its own — line/column arithmetic, a
  different goal — configures those itself.
- **The language year is duplicated on purpose, and pinned by a test.** The
  charter permits a leaf to consume a package region's structural types
  type-only, never its runtime values, so the numeral is declared here rather
  than imported. A test asserts it equals the embody region's: the leaf's
  shipped module graph imports no region value, and the pin lives in the test
  tree, which is where the duplication is allowed to be visible.
- **Legality carries no position.** A constraint check returns `true` or a
  message; only the walk reads a node's range and path. A check that located its
  own refusal would be a second place ranges are read, and the two would drift.
- **The violation shape is a cross-consumer contract.** Its four fields are what
  every consumer reads; widening it is an inter-module contract change, not a
  local edit.

## Navigation

- **Parent peer:** [`../README.md`](../README.md).
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md).
