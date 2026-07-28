<!-- cspell:ignore aithor Explorotron Malaise Signer Begel unparseable ungated unrenderable unioned -->

# aithor — PROPOSED README (design dossier, pre-ratification)

> **Dossier artifact — not the live contract.** This is the full proposed
> `README.md` for the aithor module after all seven maintainer-ratified contract
> proposals land (charter: memory `project_aithor_contract_proposals.md`; wave
> map: `./SEQUENCING.md`; AR trail: `./AR-LOG.md`). The committed
> `src/lib/embody/language-levels/just-enough-javascript/aithor/README.md` is
> untouched until the maintainer ratifies this dossier. Relative links below are
> written for the CURRENT seat; Wave 3 (the move to
> `src/lib/study-lenses/lib/aithor/`) re-homes them mechanically.

---

# aithor

The canonical Explorotron quad studies code that _already exists_ — a learner
pastes or is handed a snippet, and the study lenses open perspectives on it.
This module is the **generative arm** of that same quad: it _produces_ the
program. The lenses look at code; the **aithor** — _AI + author_ — makes the
code there is to look at, along the same two axes, so that producing a study
program and studying it are two halves of one pedagogy.

The call is `aithor(program, config, runtime?, options?)` — a `program` string
(possibly empty, the **seed**), a `config` that names a **local** model, a
learner- or environment-authored **prompt**, and the request's constraints and
gates, plus a per-call `options` bag carrying the cancellation signal and the
progress callback. From those arguments it returns a program for a learner to
read, trace, and decipher — composed from scratch when the seed is empty, or a
**variation** of it when it isn't.

The aithor is **level-agnostic**: it knows JavaScript — it parses, walks, and
renders JavaScript syntax — but it knows no language level, no lifecycle phase,
and no lens. What it enforces is decided by what the call **carries**: an
**allowlist** it can steer and walk, and an optional **injected gate** the
consumer composes from whatever it owns (a level's validator, a posture union, a
lifecycle profile judged by embodiment). The same honest scoping the local-llm
runtime claims — "code-oriented, JeJ-agnostic" — holds one layer up: aithor is
JavaScript-oriented, level-agnostic.

## Where this sits in the quad

The package's [study-lenses README](../../src/lib/study-lenses/README.md) is the
canonical treatment of the Malaise & Signer (2023) framework — the
**curated/uncurated × guided/unguided** axes, the layered pyramid (see the
figure beside that README), the Begel & Ko (2019) both-yes. This section does
not re-teach it; it shows where a _generated_ program lands on the axes.

- **The curated/uncurated axis is the `raw` opt-in.** Canonically, _curated_
  means author-controlled study material. Here the control mechanism is the
  **validation loop**: a **curated** call (the default) runs the
  generate-gate-repair loop, so every returned program passed the strongest gate
  the call carried — or the call ends in a structured refusal. An **uncurated**
  call (`raw: true`) returns the model's output **byte-exact**, drift and
  hallucination included, in a single ungated call. Same axis, same direction
  (control vs. rawness); the control mechanism is the loop.
- **The guided/unguided axis is who fills the config.** **Guided**: the
  environment or lens fills the prompt and constraints (educator-structured).
  **Unguided**: the learner fills them (learner-structured-own). Orthogonal to
  `raw`. The Begel & Ko both-yes lands here exactly as it does canonically:
  Q1+Q2 are the learner structuring their own; Q3+Q4 are the environment
  structuring for them; the component called is the same either way.

|                                              | **Uncurated** (`raw: true`)                              | **Curated** (default)                                  |
| -------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------ |
| **Unguided** (learner fills `config`)        | **Q1** — learner prompts; raw output; iterates solo.     | **Q3** — learner sets constraints; validated programs. |
| **Guided** (environment/lens fills `config`) | **Q2** — environment objective; raw output; drift shown. | **Q4** — tight constraints; scaffolded study programs. |

**Q3 is reached through a consumer.** aithor's own constraint surface is
machine-facing (an allowlist keyed by syntax-tree node types); the
learner-facing constraint vocabulary a Q3 learner actually fills is a consumer's
to own and compile down to a dataset — the level-side descriptor (P7) is that
layer's natural home. The quadrant is real; its learner surface is composed
above this module.

**The learner instrument is always curated.** The maintainer's standing ruling —
"warn-related freedom is for human authors, not AI" — is **consumer policy**:
the study instrument's generator surface never passes `raw: true`, and when a
level is active its gate rides every call regardless of the learner's
warn/strict posture. The uncurated quadrants remain in the _contract_ because a
different, ratified consumer is built on them: the Chapter-4 verify/generate
calibration pedagogy (§4.4 — models generate more readily than they verify, so
_you_ verify) needs the model's raw drift as its study material, and the eval
harness needs the same surface as drift telemetry. Rawness is an explicit opt-in
a consumer must reach for, never a default a learner falls into.

## Mapped onto the chapters

- **Chapters 1–3 — Q4, guided and curated.** The lens fills the config: a tight
  allowlist, small size bounds, an objective in the prompt, and — when a level
  is active — the level's gate. The aithor returns a validated study program
  aimed at that objective.
- **Chapter 4 — Q1 and Q2, uncurated.** Source code as the control panel for the
  notional machine; the LLM as an alternative way to operate it. Learners pass a
  prompt, opt into `raw: true`, get the model's program — drift and all — then
  run the Chapter 1–3 skill stack over it. The gap between what the constraints
  _asked for_ (they steer the prompt even under `raw`) and what the model _gave_
  is the §4.4 lesson, not a defect. Because the model is **local**, this works
  offline, account-free, private, and cost-free.
- **Chapter 5 — Q1, learner-driven.** The learner fills the config and generates
  for their own snippetry — generative play in service of their own exploration
  and remix.

## Purpose

**A source of programs, not an authoring tool.** One operation — **shape a
program to a config, seeded by an input program** — with two familiar ends: an
empty seed composes from scratch; a non-empty seed yields a variation.
Generation is the **base case** of variation.

Under the curated default a candidate becomes a result only when it passes the
call's **derived gate** and its **size bounds**. A repair loop closes the gap
when either refuses. The model supplies plausibility and meaning; the gates
supply the guarantees. Under `raw: true` there is no loop and no gate — the
model's output is returned as-is beside meta naming the model that ran, and the
rawness is the lesson.

## Ubiquitous language

- **Request** — what the aithor is given: a **seed** (`program`, possibly empty)
  paired with a **config**, plus the per-call **options**.
- **Seed** (`program`) — the program a request shapes from. Empty means _compose
  from scratch_; non-empty means _produce a variation_. A seed is read for
  intent and shape and is not required to satisfy any gate — only outputs are
  gated.
- **Config** — everything the call carries besides the seed and options: which
  **model**, a **prompt**, the **allowlist**, the optional **steering text**,
  the optional **injected gate**, the **size bounds**, the **raw** opt-in, and
  **vary**. `prompt` and `model` are the ONLY required fields — a standing
  stability guarantee: the consumer's socket request type is built as a strict
  subset of this config, and widening the required set would break that
  silently.
- **Allowlist** (`allowlist`) — a `SyntaxAllowlist`: the node-rule table and
  admitted-globals set the JEJ level already ships as its policy data
  (`{ nodes: Record<string, NodeRule>; admittedGlobals: ReadonlySet<string> }`,
  `NodeRule = true | ConstraintCheck`), graduated to a shared leaf no level owns
  (Wave 1). It is **a level's curation in one shape** — or any caller's
  hand-built slice. aithor reads it two ways, and the two are not the same:
  - **Steered** — rendered into the prompt: the permitted node types as
    learner-meaningful phrases and the admitted globals as a "you may use" list,
    with the optional **steering text** taking precedence when supplied. An
    **empty** `admittedGlobals` renders **no** vocabulary clause — silence,
    never a prohibition (a vary-derived allowlist carries an empty set because
    globals cannot be inventoried without scope analysis; rendering "you may use
    nothing" would be actively wrong).
  - **Gated** — enforced by the **walk tier** of the gate hierarchy: the generic
    default-deny walk over `nodes` (the same machinery the level's own validator
    reads its allowlist through, shared from the Wave-1 leaf).
    **`admittedGlobals` are steered, never gated by aithor**: ruling an
    identifier undeclared takes the package's scope analysis, which aithor does
    not own — vocabulary gating arrives only through an injected gate.
  - **`ConstraintCheck` rules are unrenderable** — a function cannot be
    stringified into learner phrasing. A checked rule steers as its bare node
    type; its refinement surfaces only as repair fuel when the check refuses a
    candidate.
  - An allowlist whose `nodes` table is **empty** denies every node type — a
    legitimate, honestly-unsatisfiable request that ends in the attempt bound's
    refusal, not a config-shape throw.
- **The paired parse.** A `SyntaxAllowlist`'s totality is **parse-relative**
  (its own contract: a node type reachable under other parse settings and absent
  from the table is a _false rejection_). The Wave-1 shared leaf therefore owns
  **both** the walk **and** the parse the walk requires — module goal, the
  package's ECMA version, `preserveParens` as the datasets are authored against
  — so the pairing has one home and cannot drift. aithor gates through the
  leaf's paired parse; its only other parsing (the `complexity` metric, vary's
  seed inventory, repair diagnostics) rides the same primitive.
- **Steering text** (`steering`) — an optional consumer-supplied prose summary
  of the constraints, rendered into the prompt in place of the mechanical
  node-type phrasing. The natural hook for a level-side descriptor to carry its
  own learner-facing summary; absent, aithor renders the allowlist mechanically.
  Legitimate with or without an `allowlist` — it is prose steering either way.
- **Injected gate** (`gate`) — the consumer-curried final verdict:
  `(candidate: string) => Promise<readonly Finding[] | 'undetermined'>`. Empty
  findings = pass; findings = refuse, with the findings as repair fuel;
  **`'undetermined'` = the gate cannot judge this candidate** (the ratified
  carve-out: a level never gates what it can't parse, and a level's validator is
  never consulted about an unparseable program). aithor's ruling on
  `'undetermined'`: the attempt is **refused, never a result** — repair fuel
  comes from aithor's own parse diagnosis (a located syntax finding when the
  candidate does not parse, a generic could-not-judge finding otherwise), and
  the bound spends normally. **Complete and final**: when a gate is injected it
  is the whole correctness gate — aithor's walk tier does not pre-run. This one
  seam carries everything the consumer composes: a level's `validate` (curried
  over the consumer's own parse and scope analysis — a level's validator
  consumes parse facts a lib leaf cannot construct), a posture union, a
  lifecycle profile with embodiment as the judge ("this program must fail at the
  `ast` stage and reach nothing further"; "this program must run without
  throwing"). aithor relays findings and never interprets them. A **throwing**
  gate is a consumer defect and **propagates** — folding it into a refusal would
  lie about the model.
- **Gate hierarchy** — the correctness gate derived per curated call, exactly
  one tier of which runs per attempt:
  1. the **injected gate**, when supplied;
  2. else the **walk tier** — the default-deny walk over `allowlist.nodes`
     through the leaf's paired parse;
  3. else the **parse tier** — the candidate must parse (module goal, the paired
     parse's settings). No allowlist = the **trivial level** = plain JS.
     (Default-deny has no allow-all encoding — an empty `nodes` table denies
     everything — so the trivial level is allowlist _absence_, not a degenerate
     allowlist.)
- **Size bounds** (`lines`, `complexity`) — the requested limits, aithor's own
  vocabulary, level-free and learner-meaningful: maximum length and maximum
  control-flow nesting depth, two orthogonal dimensions. **Gated by aithor on
  every curated attempt, independent of the gate hierarchy's tier** — a
  brokenness profile can still ask for at-most-ten lines. `lines` is measured on
  any text; `complexity` is measured only when the candidate parses (an
  unparseable candidate has no depth to violate). Steered-only under `raw`. A
  size violation keeps its structured shape — dimension, limit, actual — beside
  the gate's findings as repair fuel. (One named interaction edge: a size repair
  under a brokenness profile can "fix" the requested breakage, ping-ponging to
  the bound — an accepted cost, covered by the bound.)
- **Finding** — one located reason a gate refused a candidate:
  `{ message, location?, nodePath? }`, with `location` the region's offset-based
  `SourceRange` (`{ start, end }` character offsets — the new tree's
  located-diagnostic convention, nested under `location` exactly as the levels'
  `Violation` carries it, so a consumer's gate returns its level's violations
  **unchanged and losslessly** — the shape is a true structural supertype, not
  one that merely compiles). The message is the repair fuel; the location and
  node path point at it when the gate knows them.
- **Raw** (`raw: true`) — the explicit uncurated opt-in: one model call, no
  loop, no gates, and the result's `program` carries the model's **byte-exact
  raw output** (the runtime's un-extracted reply) rather than the extracted code
  block the curated path returns. `AithorResult`'s shape is unchanged —
  `program` carries either — so the flag changes _which part of the model's
  reply becomes the program_, never the result envelope. `raw` must be a flag
  rather than a gate-absence encoding for a sharper reason too: an allowlist can
  be steered when unenforced, but a **gate cannot be steered** — there is
  nothing to render — so `raw: true` beside `gate` is a contradiction that
  **throws**, never a silent downgrade. The allowlist, sizes, and vary still
  **steer** the prompt under `raw` (the asked-for/got gap is the Chapter-4
  lesson). A known homonym, named: local-llm's `GenerationResult.raw` is the
  byte-exact reply string; aithor's `raw` is the flag that selects it.
- **Prompt** — the natural-language ask passed to the model, on either path.
  Learner-authored under the unguided axis, environment-authored under the
  guided axis. The steered constraints are concatenated into it, so they always
  _shape_ the ask — whether or not anything enforces them.
- **Theme** — a domain/subject for the program's surface (names, scenario),
  carried in the prompt. Soft: the model approximates it; there is nothing to
  gate, on either path.
- **Variation / Vary** (`vary`) — unchanged in spirit: the per-**aspect**
  declaration of what stays like the seed (**held**) and what may drift
  (**freed**), compiling down to the primitives above with no new gate. The
  **hard** aspects re-express in allowlist terms:
  - **`syntax`** held (the aspect formerly named `languageLevel` — renamed
    because under node-type semantics it holds the seed's _grammar_, and naming
    it after the level spine's `LanguageLevel` type would collide) → the seed's
    **node-type inventory**, read through the leaf's paired parse, **unioned
    with a structural floor** — the scaffolding node types no curation
    meaningfully gates (the program envelope, statement/expression wrappers,
    identifiers, literals, declarations) — becomes the request's
    `allowlist.nodes`. Without the floor, a seed of `let n = 3;` would forbid
    the very node types any variation must use; the floor is a named design
    decision, pinned as data in the leaf. Globals are **not** inventoried (that
    would take scope analysis); the seed itself rides the prompt, which carries
    its vocabulary by example, and the derived empty `admittedGlobals` renders
    no clause. A seed of plain statements inventories to its structural types —
    under default-deny that IS "simple statements only" with no special idiom.
  - `size` held → the seed's line count and nesting depth as `≤` maxima.
  - The **soft** aspects (`behavior`, `strategy`, `implementation`) are prompt
    instructions, unchanged. A `vary` declaring any aspect is mutually exclusive
    with a hand-set `allowlist` / `lines` / `complexity` (it _is_ the
    higher-level way to set them — both set is a **throw**); a hard hold with an
    empty or unparseable seed **throws**; `vary: {}` is inert. A held hard
    aspect is **gated only when the walk tier runs**: under an injected gate the
    allowlist (hand-set or vary-derived) steers while the injected gate alone
    gates — a consumer wanting both composes the shared walk into its gate.
- **Attempt** — one model call, initial or repair. The curated attempt bound is
  **3, fixed and non-configurable**: a repair turn against a small local model
  is the request's dominant cost — and under an injected gate that may embody
  and even execute the candidate, each attempt costs more still — so the bound
  is a deliberate ceiling on learner-facing latency, not a tunable. (The eval
  harness pins the reported range as a contract property — downstream evidence
  of the commitment, not its reason.)
- **Repair** — a follow-up ask carrying the refused candidate plus its repair
  fuel (gate findings and/or structured size violations, or aithor's parse
  diagnosis on an `'undetermined'` verdict), asking for a corrected program.
  Curated-only.
- **Structured refusal** — the outcome when no result is reached: a named cause,
  never an out-of-spec program where one was promised. `attempt-bound-exhausted`
  is curated-only; `no-model-available` and `unknown-model` are bring-up-time
  and arise on either path. A `no-model-available` refusal born of a structured
  load failure carries an optional **next step** category (`retry` /
  `free-space` / `reconnect` / `use-native-app`) — the product-neutral,
  delivery-agnostic category the consumer renders into guidance; aithor names no
  product, vendor, or URL. **Tight curated requests cost more, and some are
  unsatisfiable** — "use only these constructs, no bigger than this" is exactly
  what a weak model is worst at, so tight requests spend more repair turns and
  refuse more often; for a request no program can satisfy, the bound's refusal
  is the correct, expected outcome. Tightening trades coverage for focus.
- **Model handle / local-only** — unchanged: the config's `model` names a
  **local** model from local-llm's open catalog (empty string = the runtime's
  cost-aware default pick; a non-empty unknown name refuses as `unknown-model`
  via the catalog-membership pre-check); the runtime owns the fetch-once,
  load-once-reuse lifecycle; there is no remote path, so generation is
  offline-capable, account-free, private, and cost-free after the one-time
  weight fetch. **Offline after acquisition, not zero-footprint**: the one-time
  fetch spends bandwidth and reveals _which_ model is requested to whatever host
  serves the weights — it carries no learner code, and "cost-free" means no
  per-call billing and no account, not zero bytes. `Meta.model` is always the
  **resolved** id.
- **Progress event** — one emission of the per-call `onProgress` callback:
  `resolve` (request resolution) · `bring-up` (model load, carrying the
  runtime's one-time-fetch ratio when reported) · `attempt` (a model call, with
  its number) · `gating` (the derived gate running — under an injected gate this
  may embody and even execute the candidate, a genuinely slow span) · `repair`
  (a repair turn being built). Observation only — no event carries a value the
  result doesn't. A throwing `onProgress` is **wrapped and swallowed** —
  observation must never change the outcome. (Named "event", not "phase": the
  package's lifecycle phases and the consumer's `GeneratorPhase` are different
  vocabularies this module deliberately does not speak.)
- **Signal** (`signal`) — the per-call `AbortSignal`. **Tiered honestly**:
  aithor checks the signal at every seam boundary (before bring-up, before each
  model call, around the gate) and abandons the request by **rejecting with the
  signal's reason** (the platform's own abort convention); **in-flight**
  interruption of a running fetch, load, or generation belongs to the local-llm
  runtime, whose contract does not yet accept a signal — until it does, cancel
  frees the learner's UI immediately and the device's work at the next boundary.
  The consumer socket's refusal-as-data seam deliberately never rejects — after
  an abort it swallows the rejection and never settles, which its own contract
  declares conformant; that swallow obligation is the socket's, named here so
  neither side is surprised.

## What it produces (the boundary)

- **In:** a request — a seed (possibly empty) and a config (`prompt` + `model`
  required; `allowlist`, `steering`, `gate`, `raw`, `lines`, `complexity`,
  `vary` optional) — plus per-call options (`signal`, `onProgress`).
- **Out, curated (default):** either a **result** — a program that passed the
  derived gate and the size bounds, plus meta (which model actually ran, how
  many attempts) — or a **structured refusal**. The aithor never returns a
  program that failed its gate — and an `'undetermined'` gate verdict is a
  failed attempt, never a pass. The boundary holds.
- **Out, raw (`raw: true`):** the model's byte-exact output beside meta — a
  single ungated call. The only refusals here are the two bring-up causes.
- **Throws (config-shape, before the model runs):** `raw: true` beside `gate`; a
  `vary` declaring an aspect beside a hand-set `allowlist`/`lines`/`complexity`;
  a hard hold with an empty or unparseable seed. Outcomes are values; malformed
  requests are exceptions — two different layers. And a third layer, propagated:
  **seam faults** — a rejected model call mid-generation, a throwing injected
  gate — are infrastructure failures, not outcomes, and they propagate rather
  than masquerade as a refusal cause (value-not-throw is scoped to bring-up
  outcomes and gate verdicts).

**The transition, stated plainly.** On the day this contract lands, a bare
`{ prompt, model }` call — today's consumer socket request, verbatim — carries
no allowlist and no gate, so _curated_ means the **parse tier**: the program
parses, nothing more. The committed contract's "admitted JEJ" guarantee moves
into the injection slots, and restoring it at the learner surface is the
consumer's integration step: the socket swap from mock to real aithor is exactly
the moment the orchestrator threads the active level's allowlist and gate (P7).
Until then the consumer is mock-bound, so no learner-facing guarantee weakens in
practice — but the contract no longer underwrites it, and the dossier names that
honestly rather than implying otherwise. (`Meta` may optionally report which
tier gated — a tier-honesty field proposed in the types draft — so a surface can
never mislabel "validated to a level" as merely "it parsed".)

Generation is asynchronous and, from the outside, pure-seeming: the model's lazy
load hides behind the `await`; the progress channel and the signal are the two
deliberate windows through that surface, and they observe or abandon the request
without changing what it returns.

## Owns vs. excludes

### Owns

- Building the prompt and asking the model: the ask, the seed, the steered
  constraints (mechanical node-type rendering, or the consumer's steering text),
  the held soft aspects, and repair turns.
- The **gate hierarchy derivation**, the walk and parse tiers (through the
  leaf's paired parse), and the size-bounds check; relaying an injected gate's
  findings — and diagnosing its `'undetermined'` — into repair.
- The curated loop, its fixed attempt bound, and the result/refusal shapes.
- The model lifecycle drive (which model, when) and the catalog-membership
  pre-check; the value-not-throw loader boundary.
- The progress emissions and the seam-boundary cancellation checks.

### Excludes

- **Levels, postures, lifecycle profiles, embodiment.** aithor names none of
  them. They arrive, if at all, already composed inside the injected gate — the
  consumer's territory. (The level's validator is never imported, re-derived, or
  widened here.)
- **The scope analysis.** Vocabulary rulings (undeclared globals) take the
  package's one scope analysis; aithor steers `admittedGlobals` and gates
  nothing about them.
- **The allowlist machinery.** The `SyntaxAllowlist` shape, the default-deny
  walk, and the paired parse are the Wave-1 shared leaf's; aithor and the levels
  both read them from there.
- **The model runtime** — fetch, cache, backends: local-llm's, injected. The
  default-runtime factory constructs local-llm (which has no remote path), so
  the local-only invariant stays anchored in code.
- **Embodiment, lenses, execution** of the returned program.
- **Authoring for its own sake** — programs to study, not documents to keep.

## Design commitments

- **Generation is the empty-seed case of variation.** One operation.
- **The config describes the output, not a diff.** The seed is a source of
  inference (vary's holds), never a diff target.
- **Enforcement is derived from which slots are filled — and filling `gate`
  demotes the allowlist to steering.** There is no mode flag deciding
  enforcement; the price of "complete and final" is that an injected gate
  displaces the walk (a lifecycle profile asking for intentionally broken code
  would otherwise be "repaired" into correctness by the very machinery meant to
  serve it). A consumer wanting walk-and-more composes the shared walk into its
  gate — the Wave-1 leaf exists so that composition is three lines. `raw: true`
  is the one explicit opt-out, and it is an opt-out _of gating_, not a mode of
  it.
- **Steering and gating are named separately, everywhere.** Steered-only
  surfaces (`admittedGlobals`, everything under `raw`, an allowlist beside an
  injected gate) are documented as such; the gap between asked-for and enforced
  is stated, never implied.
- **Sizes gate on every curated attempt.** They are aithor's own, level-free
  vocabulary, orthogonal to the correctness tier — and they steer, unenforced,
  under `raw`.
- **Rawness is preserved byte-exact, by design.** Any cleanup would be a defect;
  a test that saw the raw path modified would be catching a bug. The result
  still names its model.
- **Config-shape errors throw; outcomes are values.** Unchanged, with the new
  throw (`raw` beside `gate`) at the same layer.
- **The attempt bound is contract-stable.** `MAX_ATTEMPTS` is 3, not a config
  knob: repair turns are the dominant learner-facing latency, and 5c forbids
  growing the required config surface.
- **Local models only — and four properties follow.** Unchanged, in full:
  offline-capable, account-free, private, cost-free; no remote escape hatch;
  offline-after-acquisition, not zero-footprint; a refusal is actionable through
  the product-neutral `nextStep` category and aithor names no product.
- **Generation is not reproducible; a variation is related, not faithful.**
  Unchanged.

## Testing posture

The impure seams are three: the stateful load-once **loader**, the
non-deterministic **model call**, and — new — the **injected gate** (async,
consumer-owned, may run code). Everything else — request resolution, prompt
construction, the walk and parse tiers, the size check, the loop, result shaping
— is pure given those injected.

- **The walk tier is a pure unit** over (candidate, allowlist): in/out of the
  node table, checked rules refusing, located findings, the paired parse's
  false-rejection invariant.
- **The curated invariant, by construction**: a fake gate returning findings
  must yield a repair or a refusal; a fake gate returning `'undetermined'` must
  yield a repair (with aithor's parse diagnosis as fuel) or a refusal — never a
  result; a fake gate returning empty must yield the candidate.
- **The raw invariant**: byte-exact pass-through, meta present, no gate
  consulted (a counted fake gate asserts zero calls — and `raw` beside a gate
  throws before any seam).
- **Tier derivation is deterministic**: injected beats walk beats parse; sizes
  gate on every tier; an unparseable candidate under the walk tier is a located
  finding.
- **Gate throws propagate** — asserted as a rejection, never a refusal value. A
  throwing `onProgress` is swallowed — asserted as observation-only.
- **Cancellation at every boundary**: an aborted signal before bring-up, before
  an attempt, and around the gate each abandon by rejecting with the signal's
  reason; a counted loader asserts no work past the boundary.
- **Progress order is pinned** per path: resolve → bring-up → attempt → (gating
  → repair →)\* on the curated path; resolve → bring-up → attempt on raw.
- **Measured, not asserted**: content, quality, and theme fidelity are the eval
  harness's statistical rates over a real model; enforcement properties are
  asserted here.

## Navigation

- Parent:
  [`../README.md`](../../src/lib/embody/language-levels/just-enough-javascript/README.md)
  — the JEJ level (until Wave 3; the shared-leaf shelf README after).
- The Wave-1 shared allowlist leaf — `SyntaxAllowlist` / `NodeRule` /
  `ConstraintCheck`, the default-deny walk, and the paired parse; the machinery
  the levels' validators and this module both read. (Path fixed at Wave 1; the
  levels' `Violation` moves there and is re-exported by the region, so existing
  consumers keep their import.)
- [`local-llm`](../../src/lib/study-lenses/lib/local-llm/README.md) — the
  injected model runtime.
- `./DOCS.md` (dossier: `DOCS.PROPOSED.md`) — the architecture sketch: the gate
  hierarchy, the three seams, the cancel/progress paths.
- `./types.ts` (dossier: `types.PROPOSED.ts`) — the contract in TypeScript.
