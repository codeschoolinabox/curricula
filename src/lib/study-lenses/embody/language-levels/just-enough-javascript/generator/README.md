# generator

Produces a valid, focused Just Enough JavaScript program for a learner to study.
Given an **input program** (possibly empty) and a **config**, it returns a
program matching the config — composed from scratch when the input is empty, or
a **variation** of the input when it isn't — via a **local** language model that
runs on the learner's own device. Every returned program is **admitted** by the
level (`isJej`: valid, formatted JEJ) _and_ **conformant** to the request (only
the chosen features, within the chosen size).

## Purpose

**A source of programs, not an authoring tool.** When a learner needs a JEJ
program to read, trace, and decipher, the generator supplies one. It is a
_single_ operation — **shape a program to a config, seeded by an input program**
— with two familiar ends: an **empty** input composes a program from scratch
(the empty-snippet default view of `<StudyLenses>`), and a **non-empty** input
yields a variation of it ("give me another like this"). It chooses _what
program_; it does not teach, embody, run, or own the language level — those
belong to the surrounding study environment.

Generation is not a second operation — it is the **base case** of variation. The
empty program is itself admitted (`isJej('')` passes), so "vary the empty
program" is well-defined: it means _compose one_. One operation, one repair
loop.

A candidate becomes a result only when it passes both gates: the level
**admits** it (valid, formatted JEJ) and the request's **conformance** check
accepts it (only the permitted constructs and operators, within the requested
complexity and length). A repair loop closes the gap when either fails. The
model supplies _plausibility and meaning_ (and, from a non-empty input, the
kinship to it); the gates supply the guarantees. Neither alone is the generator
— the loop between them is.

## Ubiquitous language

- **Request** — what the generator is given: an **input program** (`code`,
  possibly empty) paired with a **config**.
- **Input program** (`code`) — the program a request shapes from. Empty means
  _compose from scratch_; non-empty means _produce a variation_ of it. The input
  is a **seed, not a constraint**: read for intent and shape, and _not_ required
  to be admitted JEJ — only the output is gated.
- **Config** — the target spec for the output: which **model** to use (a named
  local model, chosen along a size/capability spectrum — see _Model handle_),
  the request's **constraints** (a feature subset and size bounds, both
  _enforced_), and a **theme** (soft). Distinct from the model's own runtime
  options.
- **Feature subset** — the constructs _and operators_ a request permits, a
  restriction of full JEJ. **Enforced**: the output uses only these.
- **Size bounds** — requested limits on complexity (e.g. nesting depth, branch
  count) and length (lines, statements). **Enforced**.
- **Theme** — a domain/subject for the program's surface (names, scenario).
  **Soft**: the model approximates it; there is nothing to gate.
- **Variation** — the output for a non-empty input: a program the model derives
  from the input, recognisably related to it yet different in its specifics. It
  passes the same two gates as a from-scratch program; how far it departs from
  the input is the model's call, not a guaranteed faithfulness.
- **Candidate** — one program the model proposes for a request, before the
  gates.
- **Admission** — the **level's** gate, `isJej(code)`: the program is valid and
  properly formatted full JEJ. Owned by
  [`../../../lib/validating/`](../../../lib/validating/), reused **unchanged** —
  it serves the whole language level, not this module's per-request focus.
- **Conformance** — the **generator's own** gate: a pure check that a candidate
  uses only the requested feature subset (constructs and operators) and fits the
  requested size bounds —
  `conform(code, subset, size) → verdict + located violations`. It only ever
  _narrows_ below JEJ; it never re-validates or widens what the level admits,
  and it does not touch the level's allowlist. (It may reuse the level's parse
  and `Metrics`; the feature, operator, and size checks are its own.)
- **Repair** — a follow-up request that hands the model a refused candidate plus
  the specific reason it failed (an out-of-subset construct or operator, an
  out-of-bounds metric, an invalidity, a format slip) and asks for a corrected
  program. Repair turns a refused candidate into a result without discarding the
  model's work.
- **Attempt** — one model call, initial or repair. The generator bounds the
  attempts for a single request.
- **Structured refusal** — the outcome when no result is reached: a named cause,
  never an out-of-spec program. Causes: the **attempt bound exhausted** and **no
  model available** — one failure vocabulary. _No model available_ means the
  device cannot bring a model up: no model it can run, or the requested model is
  neither cached nor reachable to fetch. Because every model is local, when the
  device cannot bring one up the generator refuses rather than reaching for a
  remote one. A request whose spec no program can satisfy refuses for the first
  cause, expectedly.
- **Model handle** — the loaded language model, always a **local** one: it runs
  on the learner's own device, never a remote service. The config selects it by
  **name** from an **open set** of models spread along a **size/capability
  spectrum** — a smaller model downloads less and loads and runs faster but
  writes weaker programs; a larger one downloads more and runs slower but writes
  stronger ones — so a caller matches the choice to the machine's power and its
  network/storage budget, and the set **grows as small portable models
  improve**. A named model is **fetched once and cached on the device**, then
  **brought into memory on first use** and reused thereafter — a fetch-once,
  load-once-reuse lifecycle this module owns. The network is touched only for
  that one-time fetch; every later load is from the cache, offline. The model's
  identity is a parameter; the model _runtime_ (how a model executes) is outside
  this module.

## What it produces (the boundary)

- **In:** a request — an input program (`code`, possibly empty, not required to
  be JEJ) and a config (a model, a feature subset, size bounds, a theme).
- **Out:** either a **result** — an admitted, conformant program (composed if
  the input was empty, a variation otherwise) plus the meta a caller needs
  (which model, how many attempts), or a **structured refusal**. The generator
  never returns a program that fails either gate.

Generation is **asynchronous**: a caller `await`s the result (the model call and
the checks are async). The model's lazy load — and, the very first time, the
one-time fetch that fills the cache — hides behind that same `await`; from the
outside the operation is _pure-seeming_, a request in and a program out, never
revealing whether this call fetched, loaded, or reused the model.

## Owns vs. excludes

### Owns

- Turning a request into the prompt(s) that ask the model for a JEJ program —
  composing from an empty input, or varying a non-empty one — and for repairs.
- The **conformance check** (`conform(code, subset, size)`): a pure validator
  that enforces the request's feature subset and size bounds and locates
  violations for repair.
- The admit-or-conform-or-repair loop and its attempt bound.
- The result shape: a result + meta, or a structured refusal.
- The configured **local** model's fetch-once, load-once-reuse lifecycle:
  selecting the named model from the config, driving its one-time
  fetch-and-cache on first need, and bringing it into memory lazily, on first
  use — driving _which_ model and _when_, not the fetch, cache, or run
  mechanics, which are the runtime's (see _Excludes_).

### Excludes

- **The language level** — admission (`isJej` / `validate`) lives in
  [`../../../lib/validating/`](../../../lib/validating/); it is the gate for
  _full_ JEJ and is reused **unchanged**, never modified or extended to carry
  this module's per-request subset. Conformance is a separate, generator-owned
  check that runs _after_ admission and only narrows further.
- **The model runtime** — how a local model is **fetched, cached on the device,
  and executed** is infrastructure. This module names _which_ local model,
  constrains the selection to local models, and drives _when_ its lifecycle runs
  — not _how_ it is fetched, stored, or run. Excluding the mechanism does not
  weaken the commitment that every model is local: the generator relies on that
  property exactly as it relies on the level's admission gate, without
  implementing either.
- **Embodiment, lenses, execution** — once a program exists it is an ordinary
  JEJ source string; embody / orchestrate / engine handle it from there.
- **Authoring** — a learner or author writing a program for its own sake is the
  uncurated path. The generator produces programs _to study_; a non-empty input
  is a seed, not a program this module maintains.

## Design commitments

These are present-tense decisions the module honours.

- **Generation is the empty-input case of variation.** One operation, not two:
  empty `code` composes, non-empty `code` varies. The empty program is a real
  admitted JEJ program, so this is a principled base case, not a sentinel.
- **The config describes the output, not a diff.** The same config means the
  same target whether `code` is empty or full; the input is a seed, not a
  constraint the output must respect, and need not be JEJ.
- **Two gates, two owners.** Admission (`isJej`) is the level's, reused
  unchanged. Conformance (feature subset + size bounds) is the generator's own
  pure check, layered on top. The generator never touches, re-derives, or widens
  the level's gate — it only narrows below JEJ — so the level's never-lies
  invariant is untouched.
- **Feature subset and size bounds are enforced; theme is soft.** A returned
  program uses _only_ the requested constructs and operators and stays within
  the requested complexity and length — per-program guarantees. Theme is the
  only soft target (semantic, nothing to gate).
- **Tight requests cost more, and some are unsatisfiable.** A model is weak at
  "use _only_ these features, no bigger than this," so tight requests need more
  repair rounds and refuse more often — that load lands on the attempt bound.
  Some (subset × size × intent) requests no program can satisfy ("sum a list
  with no loops"); for those a structured refusal is the correct, expected
  outcome. Tightening trades coverage for focus.
- **Generation is not reproducible.** The same request yields _different_
  programs — a language model is not a pure function. A caller who wants a fixed
  program stores the program, not the request. (Evals sample fresh; there are no
  golden pairs.)
- **A variation is related, not faithful.** From a non-empty input the model
  decides how far the result departs; the hard guarantees are only admission and
  conformance. A caller needing an exact, rule-based transformation will not
  find it here.
- **Local models only — and four properties follow.** The generator drives
  _only_ local models, run on the learner's own device; it never calls a remote
  model service. This is the invariant the module's value rests on, not a
  default to relax, because four guarantees flow straight from it: generation is
  **offline-capable** (after a model is acquired, no network at generation
  time), **account-free** (nothing to sign into or authenticate against),
  **private** (the learner's code and the generated programs never leave the
  device — ever), and **cost-free** (no per-call or per-token billing, only the
  machine's own compute). A remote escape hatch would forfeit all four; there is
  none, by design.
- **Offline after acquisition, not zero-footprint.** "Offline" is scoped to
  _generation_: a model is fetched once and cached, and from then on runs with
  no network at all. That one-time fetch is the same kind of one-time online
  step the surrounding application itself takes to come online — acquire once,
  cache, then run offline — so the model is one more cached asset under that
  same envelope, not a separate live dependency. The fetch carries no learner
  code (privacy holds even there), though it spends bandwidth and reveals
  _which_ model is requested to whatever host serves the weights — "cost-free"
  means no per-call billing and no account, not zero bytes. Where no model the
  device can run is available, the generator returns a structured refusal (_no
  model available_); there is no remote or lower-fidelity fallback.

## Testing posture

Generation is async and, from the outside, _pure-seeming_ — the model
interaction, including the one-time lazy load, is hidden behind the `await`.
Internally the only impure dependencies are the **non-deterministic model call**
and the **stateful model loader** (the load-once bring-up of the handle — the
runtime's fetch and cache sit below this seam); everything else — including the
whole **conformance check** — is pure. Tests pass a fake model (canned
candidates) and a counted loader (to assert load-once, with no real fetch).

- **Conformance is a pure unit.** `conform(code, subset, size)` takes only data
  and returns a verdict + violations — the richest unit-test surface here,
  exercised directly (in/out of subset, over/under size, located violations)
  with no model at all.
- **Invariants, not output.** Of a _generated_ result a test asserts
  _properties_, never the program text. The load-bearing one: every returned
  program is admitted (`isJej`) **and** conformant, by construction — a mock
  returning a non-conforming candidate must yield a repair or a structured
  refusal, never a non-conforming result. (The gate seam is async.)
- **Deterministic around the seams.** Prompt construction (config → prompt,
  empty vs. non-empty routing, repair carrying the specific failure), the
  attempt bound, result shaping, refusal causes, and load-once behaviour are
  pure given the two mocks — ordinary ZOMBIES units.
- **Measured, not asserted.** Only the program's content, quality, and _theme_
  fidelity are statistical rates over a real model (an eval). Feature and size
  conformance are _asserted_ — they are gated by `conform`, not measured.

The structural seam isolating the two impure points behind the pure core
(prompt, conform, loop) is the [`./DOCS.md`](./DOCS.md) sketch's concern.

## Navigation

- Parent: [`../README.md`](../README.md) — the just-enough-javascript language
  level (what JEJ is; the admission gate it owns).
- [`../DOCS.md`](../DOCS.md) — the level's architecture (admission, the
  never-lies invariant).
- [`../reference.md`](../reference.md) — the learner-facing JEJ cheat sheet (the
  feature surface the generator targets).
- [`../../../lib/validating/`](../../../lib/validating/) — `validate` / `isJej`,
  the level's admission gate this module reuses unchanged.
- [`../../../types.ts`](../../../types.ts) — `Features` / `Metrics`, the level's
  measured analyses (which `conform` may reuse for the size check, and the
  theme-fidelity eval).
- [`./DOCS.md`](./DOCS.md) — this module's architecture sketch.
- [`./types.ts`](./types.ts) — the contract in TypeScript.
