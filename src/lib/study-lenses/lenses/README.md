<!-- cspell:ignore Gateable -->

# lenses

The component kind of study utility. A lens renders one pedagogical view of the
embodiment — an exercise, an annotation surface, a visualization, a way to run
the program and interrogate what happened. This region owns the lens kind's
contract and the lenses themselves: every lens lives in its own directory here
and satisfies the same contract.

The package [README](../README.md) owns what lens, fit, and phase mean; this
document owns the kind contract's mechanics.

## What lives here

```text
lenses/
  README.md       this file — the kind's mechanics + navigation
  DOCS.md         the region's architectural sketch
  types.ts        the lens-kind contract
  <name>/         one directory per lens — annotate/, blanks/, quiz/, …
```

The editor is not a lens — it belongs to the orchestrator, the single writer of
the program's source.

## The kind contract

Every lens extends the structural contract embody gates on — a name, an
applicability over the Facts, optionally declared phase(s) — with the component
kind's fields:

- **main** — the React component. It receives exactly two things: the frozen
  embodiment and the lens's own resolved configuration. Everything the lens
  shows derives from those two inputs.
- **config** (optional) — a pure factory: given the merged overrides the
  composition root resolved from the cascade, it returns the lens's complete
  configuration, defaults included. A lens without a factory gets the shared
  merge applied to the cascade directly.
- **recommend** (optional) — given the embodiment, propose next study steps:
  which lens (usually a self-reference), with what configuration, how relevant,
  under what label. Proposing is the lens's; ranking and rendering the proposals
  is the orchestrator's, and rendering passes through the enforcement mask.

A lens's name is its identity within the kind — two lenses with the same name is
a loud composition error, never a silent override.

The shape, compactly (the full contract with its doc-comments is
[`types.ts`](./types.ts)):

```ts
type Lens = Gateable & {
	main: ComponentType<LensProperties>; // { embodiment, config }
	config?: (overrides?: Partial<LensConfig>) => LensConfig;
	recommend?: (embodiment: Embodiment) => ReadonlyArray<Recommendation>;
};
```

## Anatomy of a lens

Each lens directory exports a single `Lens` object — the object is the lens's
identity: the composition root imports it by reference and keys it by `name`.
Inside, every lens is a two-layer module:

1. **The pure core** — display derivation, validation, scoring: pure functions
   of the facts and the configuration, narrowing the tagged fact stages they
   read. Testable without a DOM.
2. **The thin component** — the `main` wrapper: it calls the core, renders what
   the core derived, and holds the lens's local working state. Tested with a
   DOM.

A lens directory's shape:

```text
lenses/<name>/
  README.md      what this lens is, for whom
  DOCS.md        why this lens — decisions + its own data flow
  index.tsx      the Lens object (default export)
  core.ts        the pure core
  types.ts       per-lens types — its config shape, its internal state
  tests/         core tests (no DOM) · component tests (DOM)
```

**Purity rule:** a lens never imports runtime values from embody or from the
orchestrator — the embodiment arrives via props, and embody is a type-only
import. Among the package's regions, language levels and evaluators are the only
sanctioned runtime imports, and both stay lens-internal; shared leaf libraries
and external dependencies are ordinary imports.

## Totality — the gate is the refusal

A lens's applicability is its whole refusal channel: a lens that cannot serve
the current facts is simply never offered. Once mounted, main may assume its
gate held — mounting a lens whose applicability did not hold is a consumer bug,
not a case main defends against. For the component kind, refusal-as-data is
realized at the gate, before any component exists.

## What a phase declaration means

A declared phase is the pedagogical target — which lifecycle phase the lens
teaches understanding of — not which facts the lens reads: a source-phase
exercise may well consume the syntax tree. Declaring a phase also subjects the
lens to that phase's accessibility: an evaluation-phase lens is simply absent
while its phase is barred. A multi-phase lens declares an array; the
error-interpreting lens declares both parse phases. Absent means panel-excluded:
the lens mounts only by explicit request.

Neither main nor applicability receives a phase discriminator: a multi-phase
lens attaches to every declared accessible phase uniformly and derives what to
show from the facts alone. Whether any lens needs a column-aware seam is a
question owned by the orchestrator's mounting contract and that lens's own
design — not by the kind contract here.

## Rules every lens obeys

- **Read-only views.** A lens never mutates the embodiment or its configuration
  — both arrive frozen. A lens's working state (an answer in progress) is local
  and disposable: nothing persists across mount cycles.
- **Gates are cheap and pure.** Applicability is synchronous and budgeted to the
  Facts it reads — no derived-model construction inside a gate. Heavy derivation
  belongs in the lens core, at render, from the facts and the configuration.
- **Consultation is private.** A lens may import a language level's validator,
  documentation, or model builders; evaluation-phase lenses import and drive
  evaluators behind refusal-as-data. Both stay internal — no contract field
  names a level or an evaluator.
- **The module surface is synchronous.** Async setup lives inside the component;
  teardown is unmounting — no dispose anywhere. An unmount cancels whatever the
  lens was driving.
- **Configuration stays flat.** Primitives and primitive arrays only —
  deterministic hashes, no schema drift, no functions smuggled through config.

## The roster

Lenses such as annotate, blanks, parsons, writeme, and quiz serve the `source`
phase; the error-interpreting lens speaks the parser's voice across both parse
phases; the run lens staffs the `evaluation` phase, driving the evaluators. Each
lens documents itself in its own directory.

## Glossary — region terms

The package glossary owns the shared meanings; these entries add the mechanics
this region owns.

- **lens core** — the pure functions behind a lens's component, taking the facts
  and the configuration and narrowing the tagged fact stages they read; the
  component is a thin wrapper around them.
- **LensConfig** — the flat, serializable configuration record a lens receives:
  primitives and primitive arrays only.
- **resolved config** — what a mounted lens actually gets: the cascade's merged
  overrides passed through the lens's own factory, or through the shared merge
  when it declares none. One word, two roles: the envelope's `config` is the
  factory; the props' `config` is that factory's resolved output.
- **Recommendation** — a lens's proposal of a next study step: the lens (usually
  a self-reference), configuration overrides the proposal opens with (they enter
  the target's cascade — the learner's tweaks stay the final layer), a relevance
  normalized to the 0–1 range (higher ranks first — the shared scale that makes
  cross-lens ranking meaningful), and a label (the proposal's own display copy).
  Proposed here, ranked and rendered by the orchestrator.

## Navigation

- Package root: [`../README.md`](../README.md) — the domain model and the
  package glossary.
- [`DOCS.md`](./DOCS.md) — this region's architectural sketch.
- [`types.ts`](./types.ts) — the lens-kind contract: `Lens`, `LensProperties`,
  `LensConfig`, `Recommendation`.
- Each lens's own directory documents that lens.
