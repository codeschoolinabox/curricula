# generator

Produces a fresh, **admitted** Just Enough JavaScript program for a learner to
study, from a small **generation config**, using a language model — with this
level's admission gate as the validity guarantee.

## Purpose

**A source of programs, not an authoring tool.** When a learner arrives with no
code of their own to study (for example, the empty-snippet default view of
`<StudyLenses>`), the generator hands them a JEJ program to read, trace, and
decipher. It chooses _what program_; it does not teach, embody, run, or format —
those belong to the surrounding study environment.

The generator owns one transformation: **a generation config in, an admitted JEJ
program out.** A language model proposes the program; the level's existing
admission gate ([`validate`](../../../lib/validating/)) decides whether it is
JEJ; a repair loop closes the gap when it isn't. The model supplies
_plausibility and meaning_; the gate supplies _validity_. Neither alone is the
generator — the loop between them is.

## Ubiquitous language

- **Generation config** — the request. The knobs a caller turns to shape the
  program: which **model** to use, plus optional **generation guidance**.
  Distinct from the model's own runtime options.
- **Generation guidance** — the soft shaping of a request: which language
  features to lean on, how complex, how long, and a theme/domain for the subject
  matter. Guidance is _expressed to the model_, not enforced by a second
  validator — this level's gate admits full JEJ, so guidance steers _which_ JEJ
  while the gate guarantees it is _valid_ JEJ.
- **Candidate** — one program the model proposes for a config, before admission.
- **Admission** — the level's existing gate verdict (`isJeJ`): a candidate is
  admitted exactly when it parses and the validator finds zero violations. The
  generator reuses admission unchanged; it defines no second notion of validity.
- **Repair** — a follow-up request that hands the model a refused candidate plus
  its located violations and asks for a corrected program. Repair turns a
  not-yet-admitted candidate into an admitted one without discarding the model's
  work.
- **Attempt** — one model call, initial or repair. The generator bounds the
  attempts it will make for a single request.
- **Structured refusal** — the outcome when no candidate is admitted within the
  attempt bound: a named explanation, never an un-admitted program.
- **Model handle** — the loaded language model. Selected by the config, brought
  into memory **on first use**, and reused thereafter. The model's identity is a
  parameter (a caller may pick a larger or smaller one); the model _runtime_ is
  outside this module.

## What it produces (the boundary)

- **In:** a generation config — a model identity plus optional generation
  guidance.
- **Out:** either an **admitted JEJ program** (the program text plus the meta a
  caller needs — which model produced it, how many attempts it took), or a
  **structured refusal**. The generator never returns an un-admitted program.

## Owns vs. excludes

**Owns**

- Turning a generation config into the request(s) that ask the model for a JEJ
  program, and for repairs.
- The admit-or-repair loop and its attempt bound.
- The result shape: admitted program + meta, or structured refusal.
- Naming the configured model handle and bringing it up lazily, on first use.

**Excludes**

- **Validity itself** — the admission gate lives in
  [`../../../lib/validating/`](../../../lib/validating/); the generator consumes
  its verdict and never re-implements it.
- **The model runtime** — loading and executing a language model is
  infrastructure; this module names _which_ model and _when_ to load it, not
  _how_ a model runs.
- **Embodiment, lenses, execution, formatting** — once a program exists it is an
  ordinary JEJ snippet; embody / orchestrate / engine / formatting handle it.
- **Authoring** — a learner or curriculum author writing their own program is
  the uncurated path; the generator is the _no-program-supplied_ path.

## Design commitments

These are present-tense decisions the module is built to honour.

- **Generation is not reproducible.** The same config yields _different_
  programs across calls — a language model is not a pure function.
  Reproducibility is not a property this module offers; a caller who wants a
  fixed program stores the program, not the config.
- **Offline after first load, not zero-footprint.** The model loads once (a
  one-time cost) and then serves locally — no remote service, no account, no
  per-call budget. Where no model can run, the generator is simply
  _unavailable_; there is no lower-fidelity fallback, by design — a program no
  model could shape is not worth producing here.
- **The gate is the only validity authority.** A feature subset is a teaching
  _preference_ expressed to the model, never a new admission rule; every
  returned program is admitted as full JEJ.

## Navigation

- Parent: [`../README.md`](../README.md) — the just-enough-javascript language
  level (what JEJ is; the admission gate it owns).
- [`../DOCS.md`](../DOCS.md) — the level's architecture (admission, the
  never-lies invariant).
- [`../reference.md`](../reference.md) — the learner-facing JEJ cheat sheet (the
  feature surface the generator targets).
- [`../../../lib/validating/`](../../../lib/validating/) — `validate(code)` /
  `isJej(code)`, the admission gate this module reuses as its validity
  authority.
- [`./DOCS.md`](./DOCS.md) — this module's architecture sketch.
- [`./types.ts`](./types.ts) — the contract in TypeScript.
