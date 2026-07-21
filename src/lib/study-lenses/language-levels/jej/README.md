# jej — Just Enough JavaScript

The package's first [language level](../README.md): just enough JavaScript to
write **imperative, text-and-number interactive programs** on a precise, bounded
notional machine — one a learner can twin, building a faithful working copy of
it in their own head.

JEJ is a **curated slice**, not a beginner's dialect. Every admitted program is
ordinary JavaScript that runs anywhere. What the slice buys is not simplicity
but **completeness of the model**: the machine underneath is small enough to
hold entirely, so a learner can predict what it will do and check themselves
against it.

## What JEJ curates

A JEJ program talks to three audiences at once, which is what makes it worth
studying:

- **the developer who reads it** — through comments, names, and structure
- **the machine that executes it** — every expression traceable, the whole
  program visible on screen at once
- **the learner-as-user who runs it** — through `prompt`, `confirm`, and `alert`

Inside that shape the toolkit is deliberately wide: all String methods, all Math
methods, regular expression literals, bitwise operators, and the number helpers
are open for exploring computational concepts _through_ code — text processing,
geometry, pattern matching, randomness, number crunching.

What the slice leaves out is what would put the machine beyond holding:
user-defined functions, arrays, object literals, classes, `var`, `try`/`catch`,
`async`/`await`, destructuring, and spread/rest. `new Date()` is the single
admitted `new` — a Date's methods return only primitives, mutate nothing, and
introduce reference types without demanding the rest of the object model.

JEJ programs are **modules**, so they are strict-mode JavaScript natively — no
prologue is injected and no line shifts. Strict semantics are exactly what this
level's models describe; the sloppy-mode behaviors they remove are ones the
models do not claim.

## The machine, twice over

JEJ describes its machine in two registers, and ships both:

- **as prose** — [`reference.md`](./reference.md), the learner-facing surface of
  what the level admits, in the learner's own vocabulary; and
  [`notional-machine.md`](./notional-machine.md), the semantic models written
  out, with their correspondence to the language specification.
- **as data** — the model builders, which a lens or evaluator calls to get the
  machine in a shape it can render or interrogate.

Prose is _about_ the machine; the models _are_ the machine. Both are the
level's, and they describe one thing.

One model builder:

- **the realm model** — the world this level teaches: which intrinsics and host
  bindings JEJ admits, and in what form. It needs no program at all. It is
  deliberately narrower than the world a program actually wakes into — a JEJ
  program runs in a full JavaScript realm — so it answers "what is mine to
  use?", never "what exists?".

Where names come to be — the program's scope structure — is not a second model
here: the embodiment's environment fact is the general account of JavaScript
scoping, and this level neither derives nor duplicates it. A lens rendering the
level's machine gates itself on this level's `validate`.

## What JEJ answers

Consulted with a program's parse facts, JEJ answers with the places that program
steps outside the level — each one naming what stepped out, where it sits in the
source, and the offending node's path. The answer is **pure and synchronous**:
the same facts always produce the same violations, and the level never parses.

Two rules make the answer honest:

- **A name JEJ has no opinion about is the runtime's.** An identifier that is
  neither declared by the program nor known to JavaScript is left alone — a typo
  becomes a `ReferenceError` where the learner can see it, never a level
  violation.
- **Widening the slice means extending a model first.** JEJ admits what its
  models can tell the truth about; the allowlist is not edited free-standing.
  Otherwise the level's own lenses would render a machine for code the machine
  does not describe.

Two limits are deliberate, and named so they are not mistaken for defects:

- **The member policy governs dot access only.** It is allow-all-except: any
  property name passes but the blocked ones. Computed access (`x['split']`) is
  not gated — the level admits guarded dynamic dispatch (`Math[method]()`), and
  a purely syntactic check cannot tell that from a breakout. The policy protects
  the taught surface; it is not a sandbox.
- **Easter eggs are admitted but untaught.** A few constructs the level admits
  appear nowhere in `reference.md`. They are for the learner who goes looking.

## What this level owns — and what it does not

**Owns** — the level's policy and its own machine: the **allowlist as data**
(the node-rule table, the admitted globals, the blocked member names) · the
JEJ-specific constraint checks · the realm model · its reference and
notional-machine prose · the admitted snippet types · editor-support data · its
registry identity and display name.

**Does not own** — the mechanism the policy is read by, and the surfaces that
project the answer:

- **the generic validating machinery** — the node-rule shape, the default-deny
  walk over a syntax tree, and violation construction. A level supplies the data
  it reads; no level owns it, and the level contract sees only the resulting
  function.
- **a general account of JavaScript scoping** — one that models functions,
  classes, catch clauses, and `var`. That account is the embodiment's
  environment fact, upstream; the level reads only the slice its validator needs
  — the references no program scope resolves, carried in the parse facts — and
  derives no scopes of its own.
- **known-JavaScript globals** — the names JavaScript is known to provide. This
  is JavaScript-generic knowledge, not JEJ policy; JEJ's policy is the far
  smaller set of globals it admits.
- **the parse options that fix the node-type universe** — the caller's. The
  allowlist is total over the node types the package's one parse emits, not over
  the whole grammar.
- **the selector, the editor gutter, the enforcement mask**, and the memoization
  they share — orchestrator surfaces projecting the one answer.
- **whether the current snippet type is admitted** — the orchestrator's check
  over `snippetTypes`.
- **editor diagnostics** — a presentation adapter over the same violations,
  never a second source.
- **lenses** — a level ships none. JEJ's machine-facing lenses come from their
  own authors, importing this level directly.
- **executing anything**, and **assembling the parse facts** — the caller's job,
  done once where the answer is memoized.

## Glossary — the level's terms

The [package README](../../README.md) owns the shared vocabulary (embodiment,
Facts, fit, applicability, level, NM, violation, source range) and the
[region README](../README.md) owns the level contract's mechanics. These are the
terms this level adds. Where an entry describes machinery this level does not
own, it says so — the level speaks the word, it does not define the thing.

- **allowlist** — JEJ's curation as machine-readable data: the node-rule table,
  the admitted globals, and the blocked member names. Not a synonym for the
  level — it is the level's policy in one shape, read by machinery the level
  does not own.
- **node rule** _(the machinery's shape; JEJ supplies the values)_ — the
  allowlist's standing on one node type: admitted outright, or admitted subject
  to a constraint check. **Absence is refusal.**
- **constraint check** — the predicate a conditional node rule carries, deciding
  whether one node is within the level. JEJ's checks are JEJ's own. Called a
  check, never a validator: the level contract owns `validate`, and a second
  meaning for that word would be a homonym.
- **default-deny** _(the machinery's posture; JEJ selects it by shipping a
  table)_ — a node type the allowlist does not name is outside the level. New
  JavaScript is outside by default, never by oversight.
- **admitted global** — an identifier a JEJ program may use without declaring
  it: the level's slice of the realm, and the whole of what the realm model
  teaches.
- **blocked member name** — a property name refused in dot access.
- **easter egg** — a construct the level admits that `reference.md` does not
  teach.
- **escape list** _(the region's term — see the [region README](../README.md);
  JEJ adds only its reading)_ — the whole scope input this level's vocabulary
  resolution reads: each escaped name is ruled the realm's, outside the level,
  or the runtime's. The level derives no scopes of its own.
- **realm model** — the level's model of the world it teaches: the admitted
  intrinsics and host bindings, each by the form it takes. Needs no program —
  which is why it is a reference a learner consults, not a step their code
  passes through. Distinct from the realm itself, the full JavaScript world that
  exists before the first line runs: this model is the level's slice of it.

## Navigation

- Parent: [`../README.md`](../README.md) — the level contract's mechanics and §
  Adding a level.
- [`../types.ts`](../types.ts) — the level spine this level satisfies.
- [`./DOCS.md`](./DOCS.md) — this level's architecture and decisions.
- [`./types.ts`](./types.ts) — this level's own model types.
- [`./reference.md`](./reference.md) — the learner-facing reference: what the
  level admits, in the learner's vocabulary.
- [`./notional-machine.md`](./notional-machine.md) — the semantic models in
  prose, with their correspondence to the language specification.
- Package root: [`../../README.md`](../../README.md) — the domain model and the
  package glossary.
