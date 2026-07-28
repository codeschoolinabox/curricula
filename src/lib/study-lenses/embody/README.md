<!-- cspell:ignore Gateable entwine entwined entwining -->

# embody

The embodiment factory. This region owns one derivation: given a snippet and a
lens roster, build the frozen **embodiment** — facts + fit + accessibility —
that every other region renders or consults. The derivation is synchronous and
pure, and it is **level-blind**: nothing in this region knows what a language
level is.

The package [README](../README.md) owns what these words mean; this document
owns how the embodiment is built and where this region's boundary lies.

## What lives here

```text
embody/
  README.md      this file — the region's domain model + navigation
  DOCS.md        the architectural sketch
  types.ts       the keystone contracts — Snippet · Facts · Gateable · Embodiment
  lib/           the factory's internal machinery — documents itself
```

The contract, compactly (the full doc-commented version is
[`types.ts`](./types.ts)):

```ts
type Embodiment = {
	facts: Facts; // source · tokens · ast · entwined · environment · type — tagged stages
	study: Readonly<Record<LifecyclePhaseName, LifecyclePhase>>; // per phase: { accessible, cause?, lenses }
};
// the factory's boundary: embody(code, { type, lenses }) → frozen Embodiment
```

## The boundary

**In** — a snippet (the raw program: source text plus its snippet type) and the
lens roster the composition root passes in. Embody imports no roster of its own
— lenses always arrive as an argument, and an empty roster is valid: the
embodiment then carries facts and accessibility with nothing attached.

**Out** — the frozen `Embodiment`: the Facts, each lifecycle phase's
accessibility, and the fitting lenses attached per phase.

**Not owned** — rendering (the orchestrator's job); language-level knowledge (a
level's validator consumes this region's parse facts, and that consumption
happens outside embody — one parse truth); evaluator knowledge (evaluation-phase
lenses import their own evaluators; the embodiment carries no execution
handles); roster composition and the configuration cascade (the composition
root's); learner-facing display labels (presentation, owned by the
orchestrator's UI).

## The build

Five steps, in order; each step's output is the next step's input.

1. **Derive the fact stages.** Each of the six Facts — source, tokens, ast,
   entwined, environment, type — is derived as a tagged stage: its value, or a
   structured cause of failure. The tokens stage carries the token stream
   together with the comments the tokenizer sets aside. A failed stage is data,
   not an exception; its failure renders inside the lifecycle phase that owns
   the stage.
2. **Derive phase accessibility.** From the tagged stages, each of the five
   lifecycle phases gets its accessibility: `source` and `tokens` are always
   accessible — a tokens-stage failure renders inside the `tokens` phase itself;
   `ast` is barred only when the tokens stage failed — an ast-stage grammar
   error leaves the `ast` phase accessible and renders there; `environment` and
   `evaluation` are barred when tokens, ast, or entwining failed. A barred phase
   carries the upstream cause with it.
3. **Gate the phase-declaring lenses.** Every roster lens that declares a
   lifecycle phase has its applicability run over the Facts — wrapped: a gate
   that throws is treated as not-applicable, with a loud development-mode
   report. Panel-excluded lenses (no declared phase) are not consulted here;
   they mount only by explicit request — the orchestrator's concern.
4. **Attach what fits.** Fitting lenses are attached to their declared phases as
   refs — the lens objects themselves, never pre-bound wrappers — so
   configuration can resolve at render time and each module stays owned by where
   it was defined.
5. **Freeze.** The embodiment freezes what it built and only what it built: the
   stages, the accessibility, the per-phase lists. Attached lens refs sit
   outside the freeze boundary — freeze-what-you-own.

## Level-blind, by structure

The embodiment's data and pipeline contain no level knowledge. A lens's gate may
consult a language level privately inside its own applicability; embody neither
knows nor cares — the wrapped predicate is the whole interface embody has onto a
lens's level reasoning. The tokens and ast stages are the parse facts a level's
validator consumes, so the one-parse-truth constraint is satisfied by
construction: whoever needs a parse reads this region's stages instead of
parsing again.

## Failure grammar

Every failure keeps the learner surface graceful — barred-with-cause,
not-applicable, or rendered in place, never a raw throw. What varies is whether
the failure also raises a loud development-mode report:

- **A learner's program that does not parse is not a defect.** The failed tokens
  or ast stage carries its structured cause, downstream phases render barred
  with it, and nothing is reported loudly — a broken program is a normal state
  worth studying.
- **A defect in embody's own machinery is loud to the developer, graceful to the
  learner.** An entwining or scope-analysis failure raises a loud
  development-mode report; a throwing applicability gate is degraded to
  not-applicable and reported the same way. What a failure bars follows
  dependency: the source⇄tree binding underpins every later surface, so an
  entwining failure bars the phases below it; the scope structure is terminal —
  no later phase reads it — so an environment failure renders inside the
  `environment` phase alone, leaving `evaluation` reachable.

## Reading the embodiment

Consumers meet two shapes — tagged stages and phase payloads — and one seam
rule:

- **A fact stage narrows on `ok`.** Read `facts.ast.ok` before
  `facts.ast.value`. The given stages — `source` and `type` — type as
  success-only, so their values read directly; only `tokens`, `ast`, `entwined`,
  and `environment` carry a failure arm.
- **A phase payload narrows on `accessible`.** A barred phase adds its `cause` —
  whose `stage` field names the true origin; both arms list the lenses that fit.
- **The parse facts are values, not envelopes.** What a language level's
  validator consumes is `facts.tokens.value` and `facts.ast.value` — never this
  region's stage envelope.

## Glossary — region terms

The package glossary owns the shared meanings; these entries add the mechanics
this region owns.

- **fact stage** — one tagged derivation result inside the Facts: either the
  stage's value, or a structured cause of failure. The unit applicability
  predicates test and accessibility reads from.
- **entwining / entwined** — the derived source⇄tree binding: the stage tying
  each syntax-tree node to its exact place in the source text. Built at
  embodiment time, in this region.
- **environment** — the derived static scope structure, pre-execution: the stage
  resolving how each name is bound across the program's nested scopes, toggled
  for scripts or modules. Built at embodiment time, in this region, from the
  syntax tree and the snippet type. It reports the analyzer's reading in full:
  each **use** of a name records how it touches the binding — read, written, or
  both — and, for a write, whether it is the binding's own initialization (the
  write-of-initialization flag, not the syntactic initializer node) and, when
  the write carries one, the expression written; each **definition** records the
  enclosing statement, the declarator's position, and — for a variable
  declaration — the `let`/`const`/`var` keyword. Every scope identifier carries
  its node path into the source⇄tree binding, so a consumer reaches the
  identifier's place, neighbors, and children through the entwined index. Two
  signals are embody's own rather than the analyzer's. The external names a
  **binding** is exported under — its contribution to the module's export
  interface, read exactly from the export declarations (eslint-scope models no
  export status), empty for a script or a purely local binding. And how a use
  relates to its `let`/`const`/`class` binding when it precedes initialization —
  evaluated `eager` (at a fixed point) or `deferred` (in a later-running
  function or an instance field initializer) — a static fact, offered as a
  convenience, from which a consumer draws any runtime inference, never embody.
- **phase accessibility** — the derived per-phase map: accessible, or barred
  with the carried upstream cause. (The package glossary owns its distinction
  from lens fit.)
- **fit / attachment** — a phase-declaring lens whose applicability holds over
  the Facts is attached, as a ref, to each phase it declares.
- **Gateable** — the minimal structural view embody has of any lens: a name, an
  applicability over the Facts, and optionally declared phase(s). No main
  operation — embody never types or loads a component. The lens kind extends
  this contract in its own region.
- **freeze boundary** — the embodiment freezes the structure it built; attached
  refs sit outside embody's immutability contract — whatever guarantees they
  carry are their defining module's business.
- **Snippet** — the raw program passed in: source text plus snippet type.
- **Embodiment** — the frozen output: the Facts plus the five phase payloads.

## Navigation

- Package root: [`../README.md`](../README.md) — the domain model and the
  package glossary.
- [`DOCS.md`](./DOCS.md) — this region's architectural sketch.
- [`types.ts`](./types.ts) — the keystone contracts: `Snippet`, `Facts`, the
  lifecycle vocabulary, `Gateable`, `Embodiment`.
