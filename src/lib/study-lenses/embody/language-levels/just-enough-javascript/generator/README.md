# generator

Produces an **admitted** Just Enough JavaScript program for a learner to study.
Given an **input program** (possibly empty) and a **config**, it returns a
program matching the config — composed from scratch when the input is empty, or
a **variation** of the input when it isn't — via a language model, with the
level's `isJej` admission gate as the guarantee.

## Purpose

**A source of programs, not an authoring tool.** When a learner needs a JEJ
program to read, trace, and decipher, the generator supplies one. It is a
_single_ operation — **shape a program to a config, seeded by an input program**
— with two familiar ends: an **empty** input composes a program from scratch
(the empty-snippet default view of `<StudyLenses>`), and a **non-empty** input
yields a variation of it ("give me another like this"). It chooses _what
program_; it does not teach, embody, run, or own validity and formatting — those
belong to the surrounding study environment.

Generation is not a second operation — it is the **base case** of variation. The
empty program is itself admitted (`isJej('')` passes — an empty `Program` has
nothing to reject and nothing to misformat), so "vary the empty program" is
well-defined: it means _compose one_. One operation, one gate, one repair loop.

The level's existing admission gate ([`isJej`](../../../lib/validating/))
decides whether each candidate is admitted JEJ; a repair loop closes the gap
when it isn't. The model supplies _plausibility and meaning_ (and, from a
non-empty input, the kinship to it); the gate supplies _admission_. Neither
alone is the generator — the loop between them is.

## Ubiquitous language

- **Request** — what the generator is given: an **input program** (`code`,
  possibly empty) paired with a **config**.
- **Input program** (`code`) — the program a request shapes from. Empty means
  _compose from scratch_; non-empty means _produce a variation_ of it. The input
  is a **seed, not a constraint**: it is read for intent and shape and is _not_
  required to be admitted JEJ itself — only the output is gated.
- **Config** — the target spec for the output: which **model** to use, plus
  optional **generation guidance**. It describes the program you want _out_, not
  a diff against the input, so it applies identically whether the input is empty
  or a full program. Distinct from the model's own runtime options.
- **Generation guidance** — the soft shaping inside a config: which language
  features to lean on, how complex, how long, and a theme/domain for the subject
  matter. Guidance is a _requested_ shape — distinct from the level's _measured_
  [`Features`/`Metrics`](../../../types.ts), which analyse a finished program —
  and it is _expressed to the model_, not enforced by a second validator. This
  level's gate admits full JEJ, so guidance steers _which_ JEJ while the gate
  guarantees it is _admitted_ JEJ.
- **Variation** — the output for a non-empty input: an admitted JEJ program the
  model derives from the input, recognisably related to it (similar intent or
  shape) yet different in its specifics. A variation passes the same admission
  gate as a from-scratch program; how far it departs from the input is the
  model's call (steered by the config), not a guaranteed faithfulness.
- **Candidate** — one program the model proposes for a request, before
  admission.
- **Admission** — the level's existing gate, the `isJej` function: a candidate
  is admitted exactly when it parses, has zero violations, **and is properly
  formatted**. The generator reuses admission whole (validity _and_ format, both
  the level's); it defines no notion of validity or formatting of its own.
- **Repair** — a follow-up request that hands the model a refused candidate plus
  its located violations and asks for a corrected program. Repair turns a
  not-yet-admitted candidate into an admitted one without discarding the model's
  work.
- **Attempt** — one model call, initial or repair. The generator bounds the
  attempts it will make for a single request.
- **Structured refusal** — the outcome when no admitted program is reached: a
  named cause, never an un-admitted program. Its causes are the **attempt bound
  exhausted** and **no model available** (none could be loaded or run) — one
  failure vocabulary, not two.
- **Model handle** — the loaded language model. Selected by the config, brought
  into memory **on first use**, and reused thereafter — a load-once-reuse
  lifecycle this module owns. The model's identity is a parameter (a caller may
  pick a larger or smaller one); the model _runtime_ (how a model executes) is
  outside this module.

## What it produces (the boundary)

- **In:** a request — an input program (`code`, possibly empty, not required to
  be JEJ) and a config (a model identity plus optional generation guidance).
- **Out:** either an **admitted JEJ program** — composed from scratch when the
  input was empty, or a variation of the input otherwise — plus the meta a
  caller needs (which model produced it, how many attempts it took), or a
  **structured refusal**. The generator never returns an un-admitted program.

Generation is **asynchronous**: a caller `await`s the result (the model call and
the format check are both async). The model's one-time lazy load hides behind
that same `await` — from the outside the operation is _pure-seeming_, a request
in and a program out, never revealing whether this call loaded the model or
reused it.

## Owns vs. excludes

### Owns

- Turning a request into the prompt(s) that ask the model for a JEJ program —
  composing from an empty input, or varying a non-empty one — and for repairs.
- The admit-or-repair loop and its attempt bound.
- The result shape: admitted program + meta, or structured refusal.
- The configured model's load-once-reuse lifecycle: selecting it from the config
  and bringing it up lazily, on first use.

### Excludes

- **Validity and formatting authority** — admission (`isJej` = `validate` + the
  format check) lives in [`../../../lib/validating/`](../../../lib/validating/);
  the generator consumes its verdict and re-implements neither.
- **The model runtime** — how a language model executes is infrastructure; this
  module names _which_ model and drives its load lifecycle, but not _how_ a
  model runs.
- **Embodiment, lenses, execution** — once a program exists it is an ordinary
  JEJ source string; embody / orchestrate / engine handle it from there.
- **Authoring** — a learner or curriculum author writing a program for its own
  sake is the uncurated path. The generator produces programs _to study_; a
  non-empty input is a seed to shape from, not a program this module maintains.

## Design commitments

These are present-tense decisions the module honours.

- **Generation is the empty-input case of variation.** One operation, not two:
  an empty `code` composes from scratch, a non-empty `code` varies. The empty
  program is a real, admitted JEJ program, so this is a principled base case,
  not a sentinel.
- **The config describes the output, not a diff.** The same config means the
  same target whether `code` is empty or a full program; a non-empty input is a
  seed, not a constraint the output must respect — and the input need not be
  JEJ.
- **Generation is not reproducible.** The same request yields _different_
  programs across calls — a language model is not a pure function.
  Reproducibility is not a property this module offers; a caller who wants a
  fixed program stores the program, not the request. (Evals therefore sample
  fresh each run — there are no golden input/output pairs; conformance is a rate
  over samples.)
- **A variation is related, not faithful.** From a non-empty input, the model
  decides how far the result departs from it; the only hard guarantee is that
  the result is admitted JEJ. A caller needing an exact, rule-based
  transformation will not find it here.
- **Offline after first load, not zero-footprint.** The model loads once (a
  one-time cost) and then serves locally — no remote service, no account, no
  per-call budget. Where no model can run, the generator returns a structured
  refusal (the _no model available_ cause); there is no lower-fidelity fallback,
  by design — a program no model could shape is not worth producing here.
- **The gate is the only authority — guidance has no per-program guarantee.** A
  feature subset is a teaching _preference_ expressed to the model, never a new
  admission rule; every returned program is admitted as full JEJ, but an
  occasional one will use features outside the requested set. A caller needing
  hard subset adherence post-filters (via the level's `Features` analysis) or
  rejects and re-requests.

## Testing posture

Generation is async and, from the outside, _pure-seeming_ (above) — the model
interaction, including the one-time lazy load, is hidden behind the `await`.
Internally it has two mocked dependencies — the **non-deterministic model call**
and the **stateful model loader** — and everything else is pure: tests pass a
fake model (canned candidates) and a counted loader (to assert load-once).
Neither leaks into the contract; load-once is an internal unit, not an
observable property.

- **Invariants, not output.** A test asserts _properties_ of a result, never its
  program text. The load-bearing one: every returned program is admitted
  (`isJej(result)` — valid and formatted), by construction — a mock returning
  un-admitted candidates must yield a repaired program or a structured refusal,
  never an un-admitted one. (`isJej` is async, so the gate seam is too.)
- **Deterministic around the seams.** Prompt construction (config → prompt,
  empty vs. non-empty routing, repair carrying the prior violations), the
  attempt bound, result shaping, refusal causes, and load-once behaviour are
  pure given the two mocks — ordinary ZOMBIES units.
- **Measured, not asserted.** The program's content and quality — and, because
  guidance is not gate-enforced, whether the output actually obeys the requested
  features / complexity / length — are statistical rates over a real model (an
  eval), computed by running the level's
  [`Features`/`Metrics`](../../../types.ts) analysis on returned candidates, not
  unit assertions. Hard subset enforcement would move feature-conformance into
  the asserted column; guidance-only keeps it a rate.

The structural seam that isolates those two impure points behind a pure core is
the [`./DOCS.md`](./DOCS.md) sketch's concern.

## Navigation

- Parent: [`../README.md`](../README.md) — the just-enough-javascript language
  level (what JEJ is; the admission gate it owns).
- [`../DOCS.md`](../DOCS.md) — the level's architecture (admission, the
  never-lies invariant).
- [`../reference.md`](../reference.md) — the learner-facing JEJ cheat sheet (the
  feature surface the generator targets).
- [`../../../lib/validating/`](../../../lib/validating/) — `validate(code)` /
  `isJej(code)`, the admission gate this module reuses as its authority.
- [`../../../types.ts`](../../../types.ts) — `Features` / `Metrics`, the level's
  measured analyses (the eval + post-filter instrument).
- [`./DOCS.md`](./DOCS.md) — this module's architecture sketch.
- [`./types.ts`](./types.ts) — the contract in TypeScript.
