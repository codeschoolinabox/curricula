<!-- cspell:ignore unconstructible -->

# jej — Architecture & Decisions

The level described in [README.md](./README.md), at its own abstraction. The
region sketch ([../DOCS.md](../DOCS.md)) owns the level contract's shape; this
document constrains only what is inside this level.

## Architectural sketch

> Written Phase 0, before implementation. The Refactor step is held against this
> document — not what the code does, but what shape it takes.

**Inbound contract.** A consultation arrives with a program already parsed and
scope-resolved. The level reads the syntax tree and the scope resolution's
escape list — the references no program scope resolves — and nothing else: not
the token stream, not the comments, not the source text, none of which it has an
opinion about. The one scope analysis lives upstream; the level derives no
scopes of its own. A consumer wanting a semantic model calls that model's
builder itself. The level initiates nothing and answers only when asked.

## Execution phases

1. **Screen the grammar** (sync, pure) — every node of the program's tree is met
   by the allowlist's node rules. A node type the allowlist does not name is
   outside the level; one it names conditionally is met by that node type's
   check, which answers legality only. Input: the syntax tree + the allowlist.
   Output: where the grammar leaves the level.

2. **Resolve the vocabulary** (sync, pure) — every reference the program's
   scopes leave unresolved — carried in the parse facts as the scope
   resolution's escape list — is met in turn: a name the level admits is the
   realm's; a name JavaScript is known to provide but the level does not admit
   is outside the level; anything else is left to the runtime. Input: the escape
   list + the allowlist's admitted globals + the known-JavaScript names (the
   machinery's generic datum, not the level's policy). Output: where the
   vocabulary leaves the level.

The answer is the two outputs together — their union, ordered by source position
and frozen, so a gutter renders every finding in reading order. That is not a
third phase: it is what the level returns.

One further computation is **not** a phase of the answer — it is the level's
model, built only when a consumer asks:

- **Build the realm model** (sync, pure, per use) — from the realm table, with
  no program involved.

## Data flow

```mermaid
flowchart TD
    PF["parse facts<br/>(tokens · comments · syntax tree ·<br/>the escape list)"]
    TREE["the program's syntax tree"]
    SLICE["the level's allowlist, as data<br/>(node rules · the realm table)"]
    GRAM["where the grammar<br/>leaves the level"]
    ESC["the escape list<br/>(the references no program<br/>scope resolves)"]
    VOCAB["where the vocabulary<br/>leaves the level"]
    VIO["violations<br/>(node type · message · range · path)"]
    REALM["the realm model<br/>(admitted bindings, each by form)"]
    PF -->|"read the tree"| TREE
    PF -->|"read the escape list — the one<br/>scope analysis lives upstream"| ESC
    TREE --> GRAM
    SLICE -->|"screen against the node rules, pure — absence is refusal"| GRAM
    ESC --> VOCAB
    SLICE -->|"the realm table's names are the admitted globals; resolve every escaped name against them and the known-JavaScript names, pure — unrecognized names are the runtime's"| VOCAB
    GRAM -->|"joined, frozen"| VIO
    VOCAB -->|"joined, frozen"| VIO
    SLICE -->|"read the realm table, pure, per use"| REALM
```

The level's static channels — its reference and notional-machine prose, its
editor-support data, the snippet types it admits, its identity — transform
nothing and appear on no path; consumers read them where they ship.

## Structural constraints

- **The level never parses.** It is handed parsed, scope-resolved values and
  consults them. It is never asked about a program that does not parse or whose
  scope analysis did not complete — either failure leaves the parse facts
  **unconstructible**, so the question cannot be posed.
- **Default-deny.** A node type the allowlist does not name is outside the
  level. New JavaScript is outside by default rather than by oversight.
- **The admitted-node universe is closed over the caller's parse settings, which
  the level does not control.** The allowlist is total over the node types the
  package's one parse emits — not over the whole grammar. A node type reachable
  under the caller's settings and absent from the allowlist is a **false
  rejection**, not a true violation. The level cannot detect this: default-deny
  makes "deliberately excluded" and "never considered" indistinguishable by
  construction. It fails neither loudly nor gracefully — it accuses the learner
  silently, which is why the caller's obligation is named in Out of scope.
- **The realm table is the level's one account of its world.** The admitted
  globals are its names, derived. A second list would be a second truth.
- **Unrecognized names are the runtime's.** A name neither declared nor known to
  JavaScript is left alone. A typo is never a level violation — it is a
  `ReferenceError` the learner meets where it happens.
- **The two findings are independent.** Neither the grammar screen nor the
  vocabulary resolution reads the other's result; the answer is their union.
- **Legality is the check's; position is the walk's.** A check answers what is
  wrong, never where. One place reads a node's range and its path, so a range
  cannot be read two ways.
- **The one scope analysis lives upstream.** The level derives no scopes: the
  parse facts carry the scope resolution's escape list, and the level's whole
  scope opinion is a vocabulary ruling over it. A level-side derivation would be
  a second truth beside the general account the embodiment already holds.
- **The model is sound over the level's world by construction.** The realm model
  needs no program at all, so no program beyond the level can reach it.
- **The level freezes only what it built.** Its violations and its model are its
  own; the syntax nodes the parse facts carry are the caller's, and freezing
  never recurses into them.
- **Violations never block execution**, and carry no severity: the parser is the
  run ceiling and enforcement posture is global, orchestrator-side.

## Decisions

- **Why default-deny rather than a denylist.** The level's promise is that it
  can tell the truth about every program it admits. A denylist admits everything
  not yet thought of, so the promise would decay with every language release; an
  allowlist that must name what it admits cannot.
- **Why a check answers with a message, not a violation.** A violation needs a
  range and a node path; only the walk holds both. Letting checks construct
  violations would put a source range in as many places as there are checks, and
  they would drift — which is exactly what happened before, in three copies with
  two different answers for a missing position.
- **Why a source range is offsets.** Every parsed node carries offsets
  unconditionally; line and column depend on a parse option the parse facts
  cannot express, and the level holds no source text to convert from. Offsets
  are the only range always constructible from what the level is given — and the
  editor surfaces that consume them speak offsets natively.
- **Why the realm table is authored and the admitted globals derived.** They are
  the same names. The level's world and the level's vocabulary drifting apart
  would mean either a name the realm teaches gets rejected, or a name the level
  admits appears in no lens — both invisible until a learner finds them.
- **Why member access is allow-all-except.** The level admits every method its
  reference sanctions, and enumerating that surface would mean re-syncing a list
  against prose on every change. Naming the few excluded names tracks the
  reference's own framing and cannot drift the same way. The residual hole is
  accepted and named: the policy governs dot access, and computed access is not
  gated because the level admits guarded dynamic dispatch and a purely syntactic
  check cannot tell that from a breakout. The policy protects the taught
  surface; it is not a sandbox. The blocked names are the level's own datum — no
  machinery reads them, so they live with the check that does. A second residual
  hole is accepted and named alongside it: an update expression (`obj.prop++`)
  is not constrained on its target the way an assignment is — a member target
  updates without a violation. A third is accepted and named too: the escape
  list is read/write-blind, so a write to an admitted global (`alert = 5;`)
  passes both phases silently — the assignment check admits an identifier
  target, and the vocabulary ruling sees only an admitted name. Widening the
  projection with a read/write flag was weighed and declined: it would ripple
  through the upstream projection for a hole this posture accepts. The same
  taught-surface-not-sandbox posture applies to all three.
- **Why an unknown identifier is not a violation.** The alternative is accusing
  a learner's typo of being a level violation — the one lie the level must never
  tell. Deferring to the runtime costs a name the level could have caught and
  buys a boundary the learner can trust.
- **Why the level derives no scopes.** The general account of JavaScript scoping
  exists upstream — the embodiment's environment fact — and the parse facts hand
  the level the one slice of it a validator needs: the references no program
  scope resolves. A level-side scope walk would duplicate that account and drift
  from it; a level-vocabulary scope model, if a machine-facing lens ever wants
  one, is a narrowing projection over the upstream fact — never a second
  analysis.
- **Why the realm model teaches rather than describes.** A program wakes into a
  full JavaScript realm; the level's world is a slice of it. The model answers
  "what is mine to use?", and says so, because a lens rendering it as "what
  exists" would lie by omission — under the level's own rule against lying.
- **Why the realm's two populations stay distinct.** Intrinsics are the
  language's and always present; host bindings are the browser's. Collapsing
  them would conflate "this is JavaScript" with "this is your browser" — a
  distinction the level exists to teach.
- **Why widening means extending a model first.** The allowlist is not
  free-standing policy: it is the shape of what the models can explain.
  Admitting syntax the models cannot describe would make the level's own lenses
  render a machine for code that machine does not cover.

## Out of scope

- **The generic validating machinery** — the node-rule shape, the default-deny
  walk, violation construction. The level supplies the data it reads; the
  contract sees only the resulting function.
- **Known-JavaScript globals** — which names JavaScript provides is generic
  knowledge, not this level's policy.
- **A general account of JavaScript scoping** — one that models functions,
  classes, catch clauses, and `var`. That account is the embodiment's
  environment fact, upstream; a consumer needing it reads it there. This level
  models none of it.
- **The parse, and the options that fix the node-type universe** — the caller's,
  done once where the answer is memoized. The caller **owes** a parse
  configuration fixed to the node-type universe the allowlist was authored
  against: the level cannot detect a change, and will accuse the learner if one
  lands.
- **The selector, the gutter, the enforcement mask, and their shared
  memoization** — surfaces projecting the one answer.
- **Type admission** — the orchestrator's check over the snippet types the level
  admits.
- **Editor diagnostics** — a presentation adapter over the same violations,
  never a second source.
- **Lenses, and executing anything** — a level ships no lenses and runs no code.

## Navigation

- [`./README.md`](./README.md) — what JEJ curates, and its glossary.
- [`./types.ts`](./types.ts) — the level's own model types.
- [`../DOCS.md`](../DOCS.md) — the region's architecture.
- [`../types.ts`](../types.ts) — the level spine.
