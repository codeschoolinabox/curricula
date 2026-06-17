# generator

Produces an **admitted** Just Enough JavaScript program for a learner to study.
Given an **input program** (possibly empty) and a **config**, it returns a
program matching the config — composed from scratch when the input is empty, or
a **variation** of the input when it isn't — via a language model, with this
level's admission gate as the validity guarantee.

## Purpose

**A source of programs, not an authoring tool.** When a learner needs a JEJ
program to read, trace, and decipher, the generator supplies one. It is a
_single_ operation — **shape a program to a config, seeded by an input program**
— with two familiar ends: an **empty** input composes a program from scratch
(the empty-snippet default view of `<StudyLenses>`), and a **non-empty** input
yields a variation of it ("give me another like this"). It chooses _what
program_; it does not teach, embody, run, or format — those belong to the
surrounding study environment.

Generation is not a second operation — it is the **base case** of variation. The
empty program is itself admitted JEJ (`validate('')` passes — an empty `Program`
has nothing to reject), so "vary the empty program" is well-defined: it means
_compose one_. One operation, one gate, one repair loop.

The level's existing admission gate ([`validate`](../../../lib/validating/))
decides whether each candidate is JEJ; a repair loop closes the gap when it
isn't. The model supplies _plausibility and meaning_ (and, from a non-empty
input, the kinship to it); the gate supplies _validity_. Neither alone is the
generator — the loop between them is.

## Ubiquitous language

- **Request** — what the generator is given: an **input program** (`code`,
  possibly empty) paired with a **config**.
- **Input program** (`code`) — the program a request shapes from. Empty means
  _compose from scratch_; non-empty means _produce a variation_ of it. The empty
  program is the base case, not a special flag — it is itself admitted JEJ.
- **Config** — the target spec for the output: which **model** to use, plus
  optional **generation guidance**. It describes the program you want _out_, not
  a diff against the input, so it applies identically whether the input is empty
  or a full program. Distinct from the model's own runtime options.
- **Generation guidance** — the soft shaping inside a config: which language
  features to lean on, how complex, how long, and a theme/domain for the subject
  matter. Guidance is _expressed to the model_, not enforced by a second
  validator — this level's gate admits full JEJ, so guidance steers _which_ JEJ
  while the gate guarantees it is _valid_ JEJ.
- **Variation** — the output for a non-empty input: an admitted JEJ program the
  model derives from the input, recognisably related to it (similar intent or
  shape) yet different in its specifics. A variation passes the same admission
  gate as a from-scratch program; how far it departs from the input is the
  model's call (steered by the config), not a guaranteed faithfulness.
- **Candidate** — one program the model proposes for a request, before
  admission.
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

- **In:** a request — an input program (`code`, possibly empty) and a config (a
  model identity plus optional generation guidance).
- **Out:** either an **admitted JEJ program** — composed from scratch when the
  input was empty, or a variation of the input otherwise — plus the meta a
  caller needs (which model produced it, how many attempts it took), or a
  **structured refusal**. The generator never returns an un-admitted program.

## Owns vs. excludes

### Owns

- Turning a request into the prompt(s) that ask the model for a JEJ program —
  composing from an empty input, or varying a non-empty one — and for repairs.
- The admit-or-repair loop and its attempt bound.
- The result shape: admitted program + meta, or structured refusal.
- Naming the configured model handle and bringing it up lazily, on first use.

### Excludes

- **Validity itself** — the admission gate lives in
  [`../../../lib/validating/`](../../../lib/validating/); the generator consumes
  its verdict and never re-implements it.
- **The model runtime** — loading and executing a language model is
  infrastructure; this module names _which_ model and _when_ to load it, not
  _how_ a model runs.
- **Embodiment, lenses, execution, formatting** — once a program exists it is an
  ordinary JEJ snippet; embody / orchestrate / engine / formatting handle it.
- **Authoring** — a learner or curriculum author writing a program for its own
  sake is the uncurated path. The generator produces programs _to study_; a
  non-empty input is a seed to shape from, not a program this module maintains.

## Design commitments

These are present-tense decisions the module is built to honour.

- **Generation is the empty-input case of variation.** One operation, not two:
  an empty `code` composes from scratch, a non-empty `code` varies. The empty
  program is a real, admitted JEJ program, so this is a principled base case,
  not a sentinel.
- **The config describes the output, not a diff.** The same config means the
  same target whether `code` is empty or a full program; a non-empty input is a
  seed, not a constraint the config must respect.
- **Generation is not reproducible.** The same request yields _different_
  programs across calls — a language model is not a pure function.
  Reproducibility is not a property this module offers; a caller who wants a
  fixed program stores the program, not the request.
- **A variation is related, not faithful.** From a non-empty input, the model
  decides how far the result departs from it; the only hard guarantee is that
  the result is admitted JEJ. A caller needing an exact, rule-based
  transformation will not find it here.
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
