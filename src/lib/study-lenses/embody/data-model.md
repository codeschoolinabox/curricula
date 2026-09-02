<!-- cspell:ignore entwined entwining Gateable paren interner -->
<!-- cspell:ignore recomputable subsetting failable -->

# embody — Data Model

This document is the embody region's **data twin** (human ruling 2026-09-01:
`embody` is the data twin's designated first instance; the module owes a machine
twin and a data twin, `twin-doc: machine + data`). Where the machine twin
([`notional-machine.md`](./notional-machine.md)) models what does the
processing, this document models what is processed: the shapes this region
produces, holds, and hands on — their identity, their owners, their lifetimes,
which of them are ground truth and which are restatements, the invariants that
bind two separately-held values at the same instant, and what is deliberately
never written down.

[`types.ts`](./types.ts) stays authoritative for each shape's structure and for
every illegal state a union forecloses; the `DOCS.md` data-flow diagram carries
the route. This document carries what neither can state. Its sections are named
for the six things a data twin owns — no house menu existed when it was written,
so the section set is this module's own, one per owned concern.

## Identity — what makes two values the same

- **A node's identity is its `NodePath`** (Q2) — the one identity that crosses
  the package boundary, survives `postMessage`, and may be persisted and
  compared. A path names exactly one node; the reverse is not one-to-one — the
  parse may reuse one node object at two paths (bare import/export specifier
  forms), so identity-keyed consumers meet a node twice where path-keyed
  consumers never do.
- **One path grammar, and at most one tree holds it per embodiment** (human
  ruling 2026-09-01). The recovered account keeps the same identity currency:
  when the machine's parse fails, the recovered binding's `byPath` is the only
  path index the embodiment has, so no path is ever ambiguous within it.
  Provenance does not travel with a persisted path string — which arm it was
  read from is what says whether it named the machine's tree or a recovered one,
  and re-resolving any persisted path against a later embodiment is the
  consumer's re-establishment, as it always was. An accepted cost, weighed with
  the same-key ruling.
- **Within one embodiment, object identity is real and load-bearing** (E6).
  Every fact holds the same node objects by reference; identity followed from
  one fact into another lands on the same node. Across two embodiments **no
  identity holds**, even for identical source — each derivation allocates its
  own graph.
- **A token's identity is its index** into the tokens stage's `tokens` array —
  the input-element sequence carries `tokenIndices`, never token objects.
- **A scope's identity is the path of the node that introduces it** — with one
  deliberate collapse: the global and module scopes share the Program node, so
  the `$` key resolves innermost-wins.
- **A place's identity is an offset** — UTF-16 code units into the one source
  string, the region's single position currency. Line/column appears only inside
  a failure's cause, restating the parser's report.

## Ownership — who holds each shape

The embodiment is the sole holder of everything it publishes; ownership is
**sole reference, not authorship**:

- **Owned and frozen** (E4 — ownership as sole reference): the stage envelopes,
  the wrappers and indices the region built (`byPath`, `byOffset`, `parenSpans`,
  the scope projection), and the tree, token, and comment objects the facts
  index — foreign libraries allocated some of them, but each derivation's
  allocation is fresh and nobody else holds it.
- **Held, never owned**: attached lens refs (their defining modules'), and
  acorn's process-global token-type singletons — the freeze stops at both.
- **Never held at all**: the scope analyzer's own objects. The environment stage
  is a projection into plain objects the region allocates; the analyzer's
  bookkeeping never crosses the boundary.
- **An account is owned like the value it stands in for**: each failure arm's
  `value` — the token prefix, the recovered tree, its entwined binding, the
  analyzer's reading over it — is allocated fresh in the derivation that
  publishes it (the recovering reader's allocations included), held by nobody
  else, and frozen with its arm. Reachable only through the arm that carries it.

## Lifetime — one settle, one embodiment

Every published shape is born in one `embody()` call and lives exactly as long
as the embodiment that holds it. Nothing has a teardown: replacement is
wholesale — the next settle derives a new embodiment and the old one is simply
released. No shape survives its embodiment except the `NodePath` strings
consumers chose to persist, and a persisted path's meaning is re-established
against the next embodiment, never assumed. There is no cross-instance channel
of any kind (E5): one embodiment knows nothing of another, and nothing in the
region outlives a call.

## Ground truth and restatement

Which shapes carry an authority's own reading, and which the region could
recompute:

- **Given**: the source text and the snippet type — restated as the two
  success-only stages.
- **The machine's ground truth**: the token stream and set-aside comments (one
  tokenizer pass), the syntax tree, the parse's grouping-paren record, and a
  failure's message/offset/position — the parser's voice, projected but never
  reworded. The scope reading is the analyzer's ground truth, projected
  faithfully; its two exceptions are marked at their fields (`usedBeforeBound`,
  `exportedNames` — embody's own derivations). The token prefix is the same
  ground truth cut short — what the one pass had produced when it stopped.
- **Recomputable restatements**: `byPath`, `byOffset`, and the scope index are
  indexes over graphs the facts already hold; the input-element sequence is
  re-derivable from source + tokens + comments by the scanning leaf — the
  bounded sequence identically, over the source cut at the prefix's extent. Each
  is published to spare every consumer the same traversal, and none adds
  authority.
- **A recovered tree is a different instrument's ground truth.** It is the
  recovering reader's own output — not derivable from any machine fact, and
  carrying no machine authority. Its entwined binding and the analyzer's reading
  over it are restatements of _that_ account, and every element resting on an
  invented node is marked in the structure — embody's own two derivations in the
  scope reading (`usedBeforeBound`, `exportedNames`) included — so the reader's
  authority never wears the analyzer's clothes unlabeled. The recovered
  binding's `parenSpans` is the reader's own record of what it recovered,
  possibly nothing, and a missing entry there is the reader's silence, never an
  assertion about the source (human ruling 2026-09-02). The label is the
  load-bearing part: machine account and recovered account never blend (human
  ruling 2026-09-01; the arm is the label).

## Invariants binding separately-held values at the same instant

The type system cannot state these; the derivers enforce them:

- **One reading of one source**: the tokens stage's `tokens`, `comments`, and
  the source are products of a single tokenizer pass — the scanning leaf's
  input-coherence precondition, satisfied by construction because only the
  derivation that produced all three ever calls the leaf.
- **The carry chain**: `entwined.ok` implies `ast.ok` implies `tokens.ok`, and a
  downstream failure carries the _earliest_ failing stage's cause object by
  reference. Phase accessibility leans on this chain — a hand-assembled Facts
  breaking it would under-bar silently.
- **Co-derivation**: the entwined graph's `byPath` holds paths for the very node
  objects the tree it entwined holds — the machine's tree, or the recovered
  tree, whichever arm carries it; the environment stage's node→path reversal
  reads that same pair and cannot miss on it.
- **Index totality**: `byOffset` has one slot per source offset and no holes — a
  property of every published binding, machine or recovered. Over the machine's
  tree a violation is an embody defect, runtime-guarded and never learner data;
  a recovered tree that cannot span its source never publishes a binding at all
  — the account degrades instead (absent, loud — a stated call, not an inherited
  one: a reader whose tree does not cover its own input is broken as an
  instrument, whatever the program was), so a holed index is unreachable from
  either arm.
- **Key subsetting**: every `parenSpans` key resolves in `byPath` — in whichever
  binding carries them, machine or recovered; every input element's
  `tokenIndices` entry indexes the sibling `tokens` array.
- **A stop and its prefix agree**: the prefix is what was read _before_ the turn
  that failed, and its extent — the end of its last token or set-aside comment,
  whichever is later — sits at or before the stopping point wherever the cause
  reports an `offset`. The extent is the account's own boundary, defined even
  when the cause carries no offset.
- **A bounded sequence tiles its own prefix**: the prefix's input-element
  sequence (human ruling 2026-09-01: input elements too, bounded by slicing)
  tiles `[0, extent)` — the leaf's unchanged total-tiling contract over the
  source cut at the extent — and its `tokenIndices` index the prefix's own
  `tokens` array.
- **The recovered account is one account**: the recovered tree, its entwined
  binding, and the analyzer's reading over it all derive from the one tree the
  ast failure arm carries — never a second recovery — and each environment
  element marked as resting on invention corresponds to a node the ast arm
  enumerates as invented. Present only when the program lexes and does not parse
  — never beside a tokens failure, whose barred ast phase could render nothing.

## What is never written down

Stated positively — these shapes exist only between two points and are part of
the contract precisely because no artifact shows them:

- **`ParenSpansByNode`** — the node-keyed paren record — exists only between the
  ast derivation that records it and the entwining walk that re-keys it by path.
  It is never frozen, never published, and reaches no member of the Facts.
- **The building shapes** (the entwining walk's and the scope projection's
  mutable graphs, the interner, the node→path reversal, the freeze-exception
  set) never leave the file that allocates them; only readonly views escape.
- **The live tokenizer** is drained where it stands; no iterator is ever held.
- **Nothing persists across settles** — no module-level cache, no memo, no
  history. What a consumer keeps across settles is a path string, on the
  consumer's side of the boundary.

## Illegal states — foreclosed, and left representable

`types.ts` forecloses what a union can: a phase is accessible or
barred-with-cause; the given stages have no failure arm to construct; and each
failable stage's failure arm is its own type, so an account can only ever be its
own stage's shape — a prefix cannot appear on an environment failure by
construction. One foreclosure was **deliberately given up** (human ruling
2026-09-01, the same-key ruling): a failure arm may carry `value` under the same
name and type as its success sibling, so "a stage is a value or a cause, never
both" is no longer structural — a read that skips the narrowing can reach an
account where it once reached nothing, and the `ok` discriminant a consumer must
respect is the guard, backed by the `undefined`-forcing optionality — permanent
by ruling, never scaffolding to tighten away (human ruling 2026-09-02) — and by
nothing stronger. The reachable-illegal states deliberately left representable,
and why:

- **A Facts breaking the carry chain** (`entwined.ok` over a failed `ast`).
  Expressing the implication as types would explode `Facts` into a union of
  valid stage combinations and force every consumer to narrow the whole product;
  the derivers are the single writer, so the invariant lives there.
- **An empty `parenSpans` list.** The type admits it; the contract bans it (a
  present key always means at least one pair) — banning it structurally would
  cost a non-empty-array type the codebase does not use.
- **A token wrapper's `null` innermost node.** The no-hole `byOffset` precludes
  it; the type keeps the arm because the wrapper is built before the index
  proves totality.
- **A prefix whose extent passes its cause's reported offset**, or **a recovered
  account beside a tokens failure**, or **an invention marker naming a node the
  ast arm does not enumerate.** Optional members cannot be conditioned on a
  sibling's fields; the derivers enforce all three (the invariants above).

## Navigation

- [`README.md`](./README.md) — the domain model, the failure grammar, and the
  glossary that names the shapes this document models.
- [`notional-machine.md`](./notional-machine.md) — the machine twin: what does
  the processing.
- [`types.ts`](./types.ts) — each shape's structure, and the illegal states the
  unions foreclose.
- [`DOCS.md`](./DOCS.md) — the architectural sketch and the data-flow route
  these shapes travel.
