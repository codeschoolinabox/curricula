# aithor

The canonical Explorotron quad studies code that _already exists_ — a learner
pastes or is handed a snippet, and the [study lenses][quad] open perspectives on
it. This module is the **generative arm** of that same quad: it _produces_ the
program. The lenses look at code; the **aithor** — _AI + author_ — makes the
code there is to look at — and it spans the same four quadrants, along the same
two axes, so that producing a study program and studying it are two halves of
one pedagogy rather than two vocabularies.

The call is `aithor(program, config)` — a `program` string (possibly empty) and
a `config` that names a **local** model, a learner- or environment-authored
**prompt**, the feature and size constraints, and a **validate** flag. From
those two arguments it returns a Just Enough JavaScript program for a learner to
read, trace, and decipher — composed from scratch when the `program` is empty,
or a **variation** of it when it isn't. Whether that program is _validated to
spec_ or returned _raw, drift and all_ is the `validate` flag's to decide — and
that single choice is what places the call in one quadrant rather than another.
The pedagogy is below; the contract follows it.

[quad]: ../../../../README.md

## Where this sits in the quad

![Figure 2 from Malaise & Signer (2023): (a) Quadrants of learning along curated/uncurated × guided/unguided axes; (b) Layered pyramid of learning tools, from progress modelling at the base to monitored learning at the top.](../../../../explorotron-quadrants-and-pyramid.png)

_Figure 2 from Malaise & Signer (2023): **(a)** Quadrants of learning along
curated/uncurated × guided/unguided axes; **(b)** Layered pyramid of learning
tools, from progress modelling at the base to monitored learning at the top._

The package's [study-lenses README][quad] is the canonical treatment of this
framework — the two axes, the layered pyramid, the load-bearing principles
(skill transfer, expertise reversal, lifelong-learning autonomy), and the Begel
& Ko both-yes — realized for _studying_ a snippet; the curriculum's pedagogy §7
is its curriculum-scope twin. This section does not re-teach Malaise & Signer;
it borrows their axes and shows where a _generated_ program lands on them. Read
the quad treatment there; read its generative mirror here.

## Config → quadrant

The canonical axes are **curated/uncurated × guided/unguided**. The aithor does
not fork that vocabulary — it reads each axis off the config.

- **The curated/uncurated axis is `validate`.** Canonically, _curated_ means
  author-controlled study material — the author hand-picks the snippet a learner
  sees. Here the control mechanism is not hand-picking but **validation**: a
  **curated** call (`validate: true`) runs the admit-and-conform loop, so every
  returned program is validated-to-spec JEJ within the requested subset and size
  — or a structured refusal. An **uncurated** call (`validate: false`) returns
  the model's program as-is — possible drift, possible hallucination, no gate.
  Same word, same axis; the control just moves from the author's hand to the
  validation loop. The rhyme is deliberate: curated still means _controlled_,
  uncurated still means _raw_.
- **The guided/unguided axis is who fills the config.** Canonically, _guided_
  means who structures the path. Here it means **who fills `config`** — its
  `prompt` and its constraints. **Guided**: the environment or lens fills them
  (educator-structured study). **Unguided**: the learner fills them
  (learner-structured-own). The `prompt` reaches the model either way — a
  learner-authored prompt is the surface on which learners _practise writing
  prompts_; an environment-authored prompt is a scaffolded objective.

Crossing the two axes gives the four quadrants, in the aithor's terms:

|                                              | **Uncurated** (`validate: false`, raw)                                                              | **Curated** (`validate: true`, validated-to-spec)                                                          |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Unguided** (learner fills `config`)        | **Q1** — learner passes a `prompt`; raw output; iterates solo.                                      | **Q3** — learner sets their own constraints; validated programs; free exploration.                         |
| **Guided** (environment/lens fills `config`) | **Q2** — environment sets a prompt-objective; raw output; generate-toward-objective, drift past it. | **Q4** — environment/lens sets tight constraints; scaffolded JEJ study programs toward a stated objective. |

- **Q1 — unguided/uncurated.** The learner passes just a `prompt`,
  `validate: false`. The model answers; the learner reads the raw result and
  iterates on their own.
- **Q2 — guided/uncurated.** The environment sets a prompt-objective,
  `validate: false`. The program is generated _toward_ that target but returned
  raw — the point is to watch the model drift past what was asked.
- **Q3 — unguided/curated.** The learner sets their own constraints,
  `validate: true`. Every program comes back validated; exploration is free, but
  the floor is guaranteed JEJ.
- **Q4 — guided/curated.** The environment or lens sets tight constraints,
  `validate: true`. The result is a scaffolded JEJ study program aimed at a
  specific objective (a loop to trace, a branch to predict).

**The same both-yes as canonical.** The Begel & Ko (2019) question — should
technology _structure learning for learners_, or _teach learners to structure
their own_ — gets the [package README's][quad] **both-yes** answer here too:
Q1 + Q2 are the learner filling the config (structuring their own); Q3 + Q4 are
the environment or lens filling it (educators structuring it for them). The axis
that flips is _who fills `config`_; the component called is the same
`aithor(program, config)` either way.

## Mapped onto the chapters

The two axes are the same across the course; what moves chapter to chapter is
**which quadrant the surrounding study environment reaches for** — and that is
set entirely by who fills the config and whether `validate` is on. The mapping
is not a menu the module chooses from; it is how each chapter's pedagogy lands
on a single generative arm.

- **Chapters 1–3 — Q4, guided and curated.** The lens or environment fills the
  config: a tight feature subset, a small size, an objective baked into the
  `prompt` (a loop to trace, a branch to predict, a coercion to catch), and
  `validate: true`. The aithor returns a validated JEJ study program aimed at
  that objective — scaffolded study, a program built _to be read_. Here the
  learner structures nothing; the educator structures it for them. These
  scaffolded-study lenses always pass `validate: true` — the curated guarantee
  below is exactly what they rely on.
- **Chapter 4 — Q1 and Q2, uncurated.** Chapter 4 reframes source code as the
  control panel for the notional machine and the LLM as an alternative way to
  operate it — _you delegate the typing while still owning the NM_. Its
  load-bearing calibration skill is the verify/generate asymmetry: **models
  generate more readily than they verify, so _you_ verify**. The aithor's
  uncurated path is where learners practise exactly that. They pass a
  learner-authored `prompt`, get the model's **raw** program — drift,
  hallucination, and all — then run the Chapter 1–3 skill stack over it (trace
  tables, predictive stepping, code review). Because that program is raw it may
  not even be admitted JEJ — when it isn't, the NM-scaffolded lenses (which need
  admission) fall back to source-level study, exactly as they do for any code
  beyond the level; the source-level skill stack still applies in full. The gap
  between what the constraints _asked for_ (they shape only the prompt here) and
  what the model _gave_ is the §4.4 lesson, not a defect. Q1 is the learner
  iterating solo on their own prompt; Q2 is the environment setting a
  prompt-objective and the learner watching the model drift past the target —
  the jagged frontier and the same-prompt-different-output stochasticity become
  the ambient material to direct, not a failure to avoid. And because the model
  is **local**, this works **offline** — account-free, private, cost-free
  AI-co-authoring practice on the learner's own device. The Chapter-4 use is
  what the local-only invariant is _for_: not a privacy nicety bolted on the
  side, but the condition that makes drift-as-lesson practicable for every
  learner regardless of network, account, or budget.
- **Chapter 5 — Q1, learner-driven.** Training wheels off: the learner fills the
  config and generates for their own snippetry — a seed program to vary, a
  sketch to chase. Generative play in the same uncurated mode, now in service of
  the learner's own exploration and remix rather than a directed objective.

For the canonical treatment of the quadrants — the axes, the layered pyramid,
and the Begel & Ko both-yes — see the package quad treatment in
[`../../../../README.md`](../../../../README.md) (search _two-axis grid_, _Q1_,
_both-yes_), which in turn situates against the curriculum's pedagogy §7. This
section _situates_ the aithor against that treatment; it does not restate it.

## Purpose

**A source of programs, not an authoring tool.** When a learner needs a JEJ
program to read, trace, and decipher, the aithor supplies one. It is a _single_
operation — **shape a program to a config, seeded by an input program** — with
two familiar ends: an **empty** input composes a program from scratch (the
empty-snippet default view of `<StudyLenses>`), and a **non-empty** input yields
a variation of it ("give me another like this"). It chooses _what program_; it
does not teach, embody, run, or own the language level — those belong to the
surrounding study environment.

Generation is not a second operation — it is the **base case** of variation. The
empty program is itself admitted (`isJej('')` passes), so "vary the empty
program" is well-defined: it means _compose one_. One operation, parameterised
by `validate`.

Under `validate: true` a candidate becomes a result only when it passes both
gates: the level **admits** it (valid, formatted JEJ) and the request's
**conformance** check accepts it (only the permitted constructs and operators,
within the requested complexity and length). A repair loop closes the gap when
either fails. The model supplies _plausibility and meaning_ (and, from a
non-empty input, the kinship to it); the gates supply the guarantees. Neither
alone is the curated aithor — the loop between them is. Under `validate: false`
there is no loop and no gates — the model's program is returned as-is, by
design, and the rawness is the lesson, not a defect.

## Ubiquitous language

- **Request** — what the aithor is given: an **input program** (`program`,
  possibly empty) paired with a **config**.
- **Input program** (`program`) — the program a request shapes from. Empty means
  _compose from scratch_; non-empty means _produce a variation_ of it. The input
  is a **seed, not a constraint**: read for intent and shape, and _not_ required
  to be admitted JEJ — only a curated output is gated.
- **Config** — everything the call carries besides the input program: which
  **model** to use, a **prompt**, the request's **constraints** (a feature
  subset and size bounds), and the **validate** flag. Distinct from the model's
  own runtime options.
- **Prompt** — the natural-language ask passed to the model, **regardless of
  `validate`**. Learner-authored under the unguided axis (the surface on which
  learners _practise writing prompts_), environment-authored under the guided
  axis (a scaffolded objective). The constraints are stringified and
  concatenated into it, so they always _shape_ the ask — whether or not they are
  enforced.
- **Feature subset** (`include` / `exclude`) — the constructs _and operators_ a
  request permits, a restriction of full JEJ, named in the level's
  learner-facing feature vocabulary (the [`reference.md`](../reference.md)
  surface — _loops_, _ternary_, _for-of_, and the like). This is _not_ the
  analytic **`Features`** enum ([`../../../types.ts`](../../../types.ts)), a
  closed set of presence-booleans that _detects what a program uses_ rather than
  gating what it _may_ use; nor is it the level's syntax **allowlist**, which
  `conform` deliberately does not reuse (see _Conformance_). `conform` maps the
  named features to its own checks. **Enforced under `validate: true`**: a
  curated output uses _only_ these. **Prompt-shaping under `validate: false`**:
  it is asked for but not gated.
- **Size bounds** — the requested limits: `lines` (length) and `complexity`
  (control-flow depth). Two orthogonal dimensions, kept separate as the level's
  `Metrics` keeps them. **Enforced under `validate: true`**; prompt-shaping
  under `validate: false`.
- **Complexity** (`complexity`) — the trace-load dimension, distinct from
  length. The primary ordinal is **maximum control-flow nesting depth** (the
  level's `Metrics.maxNestingDepth`) — the measure most relevant to how hard a
  program is to hold in the head while tracing; **decision-point count** (loops
  plus branches) is secondary. `lines` is length, `complexity` is depth —
  orthogonal. (The exact metric and threshold are the contract's to finalise.)
- **Validate** (`validate`) — the boolean that decides curated vs. uncurated.
  `true` runs the admit-and-conform loop; `false` skips it and returns the
  model's raw program. The prompt is built and sent either way; only the gating
  differs. **Defaults to `true`** — curated, scaffolded study is the common
  case; a caller opts _into_ raw output explicitly.
- **Curated / uncurated** — the curated/uncurated axis read off `validate`.
  **Curated** (`validate: true`): controlled by the validation loop, validated
  to spec. **Uncurated** (`validate: false`): raw model output, drift and all.
  The rhyme with the canonical axis is deliberate — canonically the author
  controls by hand-picking; here the loop controls by validating. Same axis,
  same direction (control vs. rawness); only the control _mechanism_ differs.
  Curation is a matter of **degree**, not just on/off: within a curated call the
  feature subset and size bounds constrain _what the output may contain_, and a
  non-empty **seed** program (see _Variation_) constrains its very shape — the
  tightest constraint of all. A seeded curated request is **hyper-curated**:
  composing from an empty seed is curated, varying a seed is curated _harder_.
  Seeding is another dimension of curation, not a separate axis.
- **Guided / unguided** — the guided/unguided axis read off **who fills
  `config`**. **Guided**: the environment or lens fills the prompt and
  constraints (educator-structured). **Unguided**: the learner fills them
  (learner-structured-own). Orthogonal to `validate`.
- **Theme** — a domain/subject for the program's surface (names, scenario),
  carried in the prompt. **Soft**: the model approximates it; there is nothing
  to gate, under either `validate` value.
- **Variation** — the output for a non-empty input: a program the model derives
  from the input, recognisably related to it yet different in its specifics.
  Under `validate: true` it passes the same two gates as a from-scratch program;
  how far it departs from the input is the model's call, not a guaranteed
  faithfulness.
- **Candidate** — one program the model proposes for a request, taken from the
  decomposed `GenerationResult`: the extracted `code` on the curated path, the
  byte-exact `raw` on the uncurated one. Under `validate: true` the candidate
  (`code`) faces the gates before becoming a result; under `validate: false` the
  candidate (`raw`) _is_ the result, unmodified.
- **Admission** — the **level's** gate, `isJej(code)`: the program is valid and
  properly formatted full JEJ. Owned by
  [`../../../lib/validating/`](../../../lib/validating/), reused **unchanged** —
  it serves the whole language level, not this module's per-request focus. Runs
  only on the curated path.
- **Conformance** — the **aithor's own** gate: a pure check that a candidate
  uses only the requested feature subset (constructs and operators) and fits the
  requested size bounds —
  `conform(code, subset, size) → verdict + located violations`. It only ever
  _narrows_ below JEJ; it never re-validates or widens what the level admits,
  and it does not touch the level's allowlist. (It may reuse the level's parse
  and `Metrics`; the feature, operator, and size checks are its own.) Runs only
  on the curated path.
- **Repair** — a follow-up request that hands the model a refused candidate plus
  the specific reason it failed (an out-of-subset construct or operator, an
  out-of-bounds metric, an invalidity, a format slip) and asks for a corrected
  program. Repair turns a refused candidate into a result without discarding the
  model's work. A curated-only mechanism — there is nothing to repair when
  nothing is gated.
- **Attempt** — one model call, initial or repair. The aithor bounds the
  attempts for a single curated request; an uncurated request is a single
  ungated call.
- **Structured refusal** — the outcome when no result is reached: a named cause,
  never an out-of-spec program where one was promised. The causes are
  `validate`-aware in one direction only: **attempt bound exhausted** is
  curated-only (no loop, no bound), while **no model available** and **unknown
  model** are bring-up-time and so arise under either `validate` value (model
  bring-up precedes the curated/uncurated fork). Under `validate: true`: any of
  the three. Under `validate: false`: **no model available** or **unknown model**
  — with no loop there is no attempt-bound refusal. _No model available_ means the
  device cannot bring up a model it otherwise knows: no model it can run, or the
  requested model is neither cached nor reachable to fetch — both of local-llm's
  load-failure causes collapse here, and so does a rejected device-capability
  probe or any other infrastructure fault raised during bring-up (the runtime
  propagates those rather than returning a load failure; the aithor seam catches
  them into this same cause). _Unknown model_ is a different layer: a **non-empty**
  requested `model` name is absent from the runtime's catalog altogether (a typo,
  or a name from a newer catalog) — kept distinct so a misnamed model never
  masquerades as "your device can't run it." (An **empty** `model` is never an
  _unknown model_ refusal — it asks the runtime to pick its cost-aware default; if
  the device can run nothing it still refuses as _no model available_.) Because
  every model is local, when
  the device cannot bring one up the aithor refuses rather than reaching for a
  remote one. A curated request whose spec no program can satisfy refuses for the
  bound, expectedly.
- **Model handle** — a **`LoadedModel`** from the injected local-llm runtime
  ([`lib/local-llm/`](../../../../lib/local-llm/README.md)), always a **local**
  one: it runs on the learner's own device, never a remote service. The config
  selects it by **name** from local-llm's **open set** of models along a
  **size/capability spectrum** — smaller downloads less and runs faster but writes
  weaker programs, larger the reverse — and the set **grows as small portable
  models improve**. aithor passes that name straight through to the runtime
  (`load({ model })`); it does **not** choose a size class or device-tier
  preference. The **empty string is the "pick for me" request** — it lets the
  runtime choose its **cost-aware default**; a **non-empty** name absent from the
  runtime's catalog refuses as **unknown model**, pre-checked before bring-up
  against the **same catalog instance** aithor injects into the runtime at
  construction (local-llm exposes no membership predicate, so the pre-check and
  the runtime agree by construction). The check is gated on a non-empty name —
  mirroring the runtime's own — so an empty name passes straight through as a
  model-less default-pick request. On a successful bring-up the loader also yields
  **which model was
  resolved**, so a curated result's meta names the model that actually ran, even
  when the request let the runtime choose. The named model is **fetched once and
  cached on the device**, then **brought into memory on first use** and reused
  thereafter — a fetch-once, load-once-reuse lifecycle the **runtime** owns;
  aithor names _which_ model and drives _when_, not _how_. The network is touched
  only for that one-time fetch; every later load is from the cache, offline. Its
  `generate` resolves to a decomposed `GenerationResult` (`raw` byte-exact,
  `code` the extracted program); aithor conforms `.code` and returns `.raw` per
  quadrant. The runtime also offers a one-time-fetch progress callback, which
  aithor does not surface — by the pure-seeming commitment below. The model
  _runtime_ — how a model executes, and **which on-device backend** runs it (the
  host registers that with the runtime; aithor ships no backend and takes no
  backend dependency) — is outside this module.

## What it produces (the boundary)

The boundary splits on `validate`.

- **In:** a request — an input program (`program`, possibly empty, not required
  to be JEJ) and a config (a model, a prompt, a feature subset, size bounds, and
  the `validate` flag).
- **Out, curated (`validate: true`):** either a **result** — an admitted,
  conformant program (composed if the input was empty, a variation otherwise)
  plus the meta a caller needs (which model actually ran, how many attempts), or a
  **structured refusal**. The aithor never returns a program that fails either
  gate. The boundary holds.
- **Out, uncurated (`validate: false`):** the model's program **as-is** —
  possibly invalid, possibly drifting past the requested subset or size — **by
  design**. The constraints shaped the prompt; nothing enforced them, so the gap
  between asked-for and got is real and intentional. The only refusals here are
  **no model available** and **unknown model** (both bring-up-time); with no
  loop, there is no attempt-bound refusal.

Generation is **asynchronous**: a caller `await`s the result (the model call
and, on the curated path, the checks are async). The model's lazy load — and,
the very first time, the one-time fetch that fills the cache — hides behind that
same `await`; from the outside the operation is _pure-seeming_, a request in and
a program out, never revealing whether this call fetched, loaded, or reused the
model.

## Owns vs. excludes

### Owns

- Building the prompt and asking the model: concatenating the `prompt`, the
  input `program`, and the stringified constraints into the model call —
  **regardless of `validate`** — composing from an empty input or varying a
  non-empty one, and driving repairs on the curated path.
- The **conformance check** (`conform(code, subset, size)`): a pure validator
  that enforces the request's feature subset and size bounds and locates
  violations for repair.
- Gating the admit-or-conform-or-repair loop **on `validate`**: running it under
  `validate: true`, skipping it under `validate: false` and returning the
  candidate unmodified. The attempt bound lives on the curated path.
- The result shape: a result + meta, or a structured refusal (with
  `validate`-aware causes).
- The configured **local** model's fetch-once, load-once-reuse lifecycle:
  selecting the named model from the config, driving its one-time
  fetch-and-cache on first need, and bringing it into memory lazily, on first
  use — driving _which_ model and _when_, not the fetch, cache, or run
  mechanics, which are the runtime's (see _Excludes_).
- The **catalog-membership pre-check**: turning a **non-empty** `model` name
  absent from the injected catalog into an **unknown model** refusal _before_ the
  runtime's `load` is called, so the runtime's unknown-name throw is never reached
  — the aithor seam stays uniformly value-not-throw. (An empty `model` is not
  pre-checked; it passes through to the runtime's default pick.)

### Excludes

- **The language level** — admission (`isJej` / `validate`) lives in
  [`../../../lib/validating/`](../../../lib/validating/); it is the gate for
  _full_ JEJ and is reused **unchanged**, never modified or extended to carry
  this module's per-request subset. Conformance is a separate, aithor-owned
  check that runs _after_ admission and only narrows further.
- **The model runtime** — how a local model is **fetched, cached on the device,
  and executed** is infrastructure. This module names _which_ local model,
  constrains the selection to local models, and drives _when_ its lifecycle runs
  — not _how_ it is fetched, stored, or run. It also does not **choose or ship**
  the on-device inference backend: local-llm takes the backends it runs as a
  host-supplied adapter map (the host registers only what it ships), and aithor
  consumes whatever local backend the host wired rather than bundling one of its
  own. Excluding the mechanism does not weaken the commitment that every model is
  local: the aithor relies on that property exactly as it relies on the level's
  admission gate, without implementing either.
- **Embodiment, lenses, execution** — once a program exists it is an ordinary
  JEJ source string; embody / orchestrate / engine handle it from there.
- **Authoring _for its own sake_** — a learner or author writing a finished
  program to keep is not this module's job; it produces programs _to study_, and
  a non-empty input is a seed, not a program this module maintains. This is
  _not_ the same as the uncurated path: `validate: false` is squarely owned here
  — it is the Q1/Q2 generative surface where learners practise prompting and
  directing raw model output. The aithor owns _generating_ the uncurated
  program; it does not own _maintaining_ an authored one.

## Design commitments

These are present-tense decisions the module honours.

- **Generation is the empty-input case of variation.** One operation, not two:
  empty `program` composes, non-empty `program` varies. The empty program is a
  real admitted JEJ program, so this is a principled base case, not a sentinel.
- **The config describes the output, not a diff.** The same config means the
  same target whether `program` is empty or full; the input is a seed, not a
  constraint the output must respect, and need not be JEJ.
- **`validate` is the curated/uncurated axis — and rawness is the lesson, by
  design.** A curated call (`validate: true`) runs the loop and returns
  validated-to-spec JEJ or a structured refusal. An uncurated call
  (`validate: false`) returns the model's raw program, drift and hallucination
  included, and that gap between what the constraints _asked for_ (they shape
  the prompt) and what the model _gave_ (unenforced) is the intended pedagogical
  surface — the Chapter-4 §4.4 calibration skill made operable. Uncurated is not
  a degraded mode; it is a deliberate quadrant.
- **Scaffolded study always runs curated.** The earlier-chapter lenses (Chapters
  1–3, Q4) always pass `validate: true`, so the admit-and-conform guarantee
  holds exactly where they rely on it. `validate: false` is an _additive_
  Chapter-4/5 surface, not a relaxation of the scaffolded path — the invariant
  did not weaken; it gained a sibling.
- **Two gates, two owners — on the curated path.** Admission (`isJej`) is the
  level's, reused unchanged. Conformance (feature subset + size bounds) is the
  aithor's own pure check, layered on top. The aithor never touches, re-derives,
  or widens the level's gate — it only narrows below JEJ — so the level's
  never-lies invariant is untouched. Under `validate: false` neither gate runs;
  the constraints shape the prompt only.
- **Feature subset and size bounds are enforced under `validate: true`,
  prompt-shaping under `validate: false`; theme is always soft.** A curated
  program uses _only_ the requested constructs and operators and stays within
  the requested complexity and length — per-program guarantees. An uncurated
  program is asked for the same constraints but not held to them. Theme is the
  one target that is soft either way (semantic, nothing to gate).
- **Complexity is depth, length is `lines` — orthogonal.** The `complexity`
  bound's primary ordinal is maximum control-flow nesting depth (the most
  trace-load-relevant measure), with decision-point count secondary; `lines` is
  length. They are independent dimensions, kept separate as the level's
  `Metrics` keeps them.
- **Tight curated requests cost more, and some are unsatisfiable.** A model is
  weak at "use _only_ these features, no bigger than this," so tight curated
  requests need more repair rounds and refuse more often — that load lands on
  the attempt bound. Some (subset × size × intent) requests no program can
  satisfy ("sum a list with no loops"); for those a structured refusal is the
  correct, expected outcome. Tightening trades coverage for focus. (Uncurated
  requests pay none of this — they never loop.)
- **Generation is not reproducible.** The same request yields _different_
  programs — a language model is not a pure function. A caller who wants a fixed
  program stores the program, not the request. (Evals sample fresh; there are no
  golden pairs.)
- **A variation is related, not faithful.** From a non-empty input the model
  decides how far the result departs; the hard guarantees (under
  `validate: true`) are only admission and conformance. A caller needing an
  exact, rule-based transformation will not find it here.
- **Local models only — and four properties follow.** The aithor drives _only_
  local models, run on the learner's own device; it never calls a remote model
  service. This is the invariant the module's value rests on, not a default to
  relax, because four guarantees flow straight from it: generation is
  **offline-capable** (after a model is acquired, no network at generation
  time), **account-free** (nothing to sign into or authenticate against),
  **private** (the learner's code and the generated programs never leave the
  device — ever), and **cost-free** (no per-call or per-token billing, only the
  machine's own compute). A remote escape hatch would forfeit all four; there is
  none, by design. aithor's own default-runtime factory is a thin construction
  over the local-llm runtime, which has no remote path — so once a host wires a
  backend adapter, the local-only guarantee is anchored in code on that default
  path, not merely asserted in prose (a host that injects its own runtime owns the
  invariant for that runtime). This is what the **Chapter-4 uncurated use is built
  on**:
  AI-co-authoring practice that is offline, account-free, private, and cost-free
  is only practicable for every learner because the model is local — the
  local-only invariant is what that use is _for_.
- **Offline after acquisition, not zero-footprint.** "Offline" is scoped to
  _generation_: a model is fetched once and cached, and from then on runs with
  no network at all. That one-time fetch is the same kind of one-time online
  step the surrounding application itself takes to come online — acquire once,
  cache, then run offline — so the model is one more cached asset under that
  same envelope, not a separate live dependency. The fetch carries no learner
  code (privacy holds even there), though it spends bandwidth and reveals
  _which_ model is requested to whatever host serves the weights — "cost-free"
  means no per-call billing and no account, not zero bytes. Where no model the
  device can run is available, the aithor returns a structured refusal (_no
  model available_; a name absent from the catalog refuses separately as _unknown
  model_) under either `validate` value; there is no remote or lower-fidelity
  fallback.

## Testing posture

Generation is async and, from the outside, _pure-seeming_ — the model
interaction, including the one-time lazy load, is hidden behind the `await`.
Internally the only impure dependencies are the **non-deterministic model call**
and the **stateful model loader** (the load-once bring-up of the handle — the
runtime's fetch and cache sit below this seam); everything else — including the
whole **conformance check** — is pure. Tests pass a fake model (canned
results) and a counted loader (to assert load-once, with no real fetch).

- **Conformance is a pure unit.** `conform(code, subset, size)` takes only data
  and returns a verdict + violations — the richest unit-test surface here,
  exercised directly (in/out of subset, over/under size, located violations)
  with no model at all.
- **The curated invariant, by construction.** Of a _curated_ (`validate: true`)
  result a test asserts _properties_, never the program text. The load-bearing
  one: every returned program is admitted (`isJej`) **and** conformant — a mock
  returning a non-conforming candidate must yield a repair or a structured
  refusal, never a non-conforming result. (The gate seam is async.)
- **The uncurated rawness, as a tested property.** Of an _uncurated_
  (`validate: false`) result a test asserts the opposite shape: the aithor
  returns the model's candidate **unmodified** — no admission, no conformance,
  no repair. The rawness is itself a property, gated _out_ on purpose; a test
  that saw the output cleaned up would be catching a bug.
- **Deterministic around the seams.** Prompt construction (config → prompt,
  empty vs. non-empty routing, the constraints stringified into the prompt under
  either `validate`, repair carrying the specific failure), the `validate`
  branch (loop vs. pass-through), the attempt bound, result shaping, refusal
  causes (`validate`-aware), and load-once behaviour are pure given the two
  mocks — ordinary ZOMBIES units. The loader boundary is itself a unit: a fake
  whose underlying runtime throws an unknown-name error, returns a load failure,
  or rejects its probe must surface as a value — `unknown-model` for the first,
  `no-model-available` for the other two — never a thrown exception, since aithor
  is uniformly value-not-throw.
- **Measured, not asserted.** Only the program's content, quality, and _theme_
  fidelity are statistical rates over a real model (an eval). Feature and size
  conformance are _asserted_ on the curated path — they are gated by `conform`,
  not measured.

The structural seam isolating the two impure points behind the pure core
(prompt, conform, the `validate`-gated loop) is the [`./DOCS.md`](./DOCS.md)
sketch's concern.

## Navigation

- Parent: [`../README.md`](../README.md) — the just-enough-javascript language
  level (what JEJ is; the admission gate it owns).
- [`../DOCS.md`](../DOCS.md) — the level's architecture (admission, the
  never-lies invariant).
- [`../reference.md`](../reference.md) — the learner-facing JEJ cheat sheet (the
  feature surface the aithor targets).
- [`../../../lib/validating/`](../../../lib/validating/) — `validate` / `isJej`,
  the level's admission gate this module reuses unchanged.
- [`../../../types.ts`](../../../types.ts) — `Features` / `Metrics`, the level's
  measured analyses (which `conform` may reuse for the size check, and whose
  `Metrics.maxNestingDepth` is the recommended primary `complexity` ordinal).
- [`../../../../README.md`](../../../../README.md) — the package's canonical
  Explorotron quad treatment (search _two-axis grid_, _Q1_, _both-yes_); the
  aithor is its generative arm. Read the quad there; do not restate it here.
- [`./DOCS.md`](./DOCS.md) — this module's architecture sketch.
- [`./types.ts`](./types.ts) — the contract in TypeScript (the `validate` flag,
  the `complexity` metric and threshold, the config shape).
