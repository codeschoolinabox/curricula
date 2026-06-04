# Welcome to Frogramming — Translational Framing

> _The curriculum-side companion to
> [`DGMD-E-1-artifacts/embodying-tcer/`](../../../DGMD-E-1-artifacts/embodying-tcer/).
> Where that document analyzes `embody` as a translational research artifact,
> this one does the same work for the curriculum._
>
> **Audience**: researchers, curriculum-author-collaborators, the TCER
> community. Not learners. (Learners' manifesto is `guide.learners.md`; it does
> not mention TCER.)
>
> **Companions** (siblings by co-location):
>
> - `ontology.md` — the curriculum's concept reference framework (concept-only
>   after the Wave-3d-ii migration; the research-orientation principles formerly
>   in ontology Part B are now canonical here)
> - `chapters.md` — chapter-by-chapter LO grids
> - `guide.{authors,community}.md` — practical role-targeted guidance for those
>   audiences, with TCER vocabulary integrated
> - `README.md` — learner-facing prose (no TCER vocabulary)
> - `study-lenses.md` — technical-reader companion describing the JEJ → NM →
>   embody → lenses → orchestrator infrastructure chain (V/F at the artifact
>   layer's F-side, in operational form)
> - `research-framing.md` (curriculum-level) and the repo-level
>   `research-framing.md` — research-committee-owned evidence claims

---

## 1. What this document is for

The curriculum (and its sibling files, and the infrastructure beneath it) is not
_informed by_ research. It **is** research, conducted by making, teaching, and
reflecting. This document positions the curriculum within the **Translational
Computing Education Research (TCER)** framework of Cole, Malaise, & Signer
(2023, SIGCSE) and names the operational claims that follow.

It exists because:

1. The curriculum's status as a translational research artifact is load-bearing
   — for how it gets made, how it gets adapted, how it relates to `embody`, and
   how partner communities participate.
2. The learners don't need to know any of this to learn (and they shouldn't be
   made to). It belongs in a meta-doc.
3. The author has already published the TCER framework. Applying it to the
   curriculum is not metaphor; it's the framework's own use case.

---

## 2. The curriculum as translational research artifact

> TCER paper: Cole, E., Malaise, Y., & Signer, B. (2023). _Computing Education
> Research as a Translational Transdiscipline._ In Proceedings of the 54th ACM
> Technical Symposium on Computer Science Education V. 1 (SIGCSE 2023).
> https://doi.org/10.1145/3545945.3569771

### 2.1 The two divides

TCER names two divides that limit progress in computing education:

1. **Research and practice don't talk enough.** Researchers produce findings
   about how people learn to program. Practitioners build curricula from
   experience and intuition. The findings rarely reach the curricula, and the
   curricula rarely inform the research.
2. **Theory and design don't talk enough.** Theoretical work (what _should_
   work) and design work (what _does_ work in practice) develop in parallel
   without enough feedback between them.

The curriculum sits in the **trading zones** where these divides meet — places
where people from different traditions can coordinate locally without needing to
agree globally on methodology or philosophy (Galison 1997, applied via TCER).

### 2.2 TCER phase positions

The curriculum operates primarily in:

| TCER Phase                               | What the curriculum does                                                                                   | Continuum            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------- |
| **3.B\*** Practitioner-facing guidelines | Synthesizes research into actionable teaching content. `README.md`, `chapters.md` deliver this register.   | PT (Practice Theory) |
| **4.A\*** Evidence-based prototype       | The curriculum IS the intervention. Running it generates the data.                                         | PD (Practice Design) |
| **4.B\*** User feedback & reports        | Teaching it generates research data (exercise artifacts, cohort feedback, partner-community observations). | RD (Research Design) |

All three are **trading zones** (marked \*) — transdisciplinary coordination is
the mechanism, not a side effect.

The curriculum does _not_ claim Phases 1 (foundational research) or 5 (policy /
scale-out). It cites and translates from Phase 1 (Friston, Van Merriënboer,
Bruner, Perkins, Wiley, Mikhak, etc.); it does not itself produce primary
theoretical contributions to those phases.

### 2.3 Two traps named by TCER, both honored

- **The translational imperative** — TCER warns against pressuring every piece
  of CER work to justify broader impacts. The curriculum does not require that
  every contribution to it serve immediate translation; the design principles
  (B.2 of `pedagogy.md`) honor _Process Over Product_, which keeps the work
  pedagogically sound even when it's not immediately research-actionable.
- **The pipeline misconception** — TCER warns that translation is _cyclical_,
  not linear. Theory → translation → practice is the wrong shape. The right
  shape is _theory ↔ translation ↔ practice_, with each feeding the others. The
  curriculum's iterative development pattern (alumni co-development,
  cohort-shaped revisions, ongoing reflexive analysis) honors this.

---

## 3. The trading zones

Concretely, the curriculum's trading zones include:

| Trading zone                     | Who coordinates                                                        | What they coordinate on                                                                                |
| -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Curriculum ↔ research committees | Curriculum authors + research collaborators                            | Evidence tags (🔬 Established / 📐 Translated / 🧪 Extension); per-chapter `research-framing.md` files |
| Curriculum ↔ partner cohorts     | Authors + cohort hosts + learners                                      | Adaptation, feedback, observed misconceptions, what worked / what didn't                               |
| Curriculum ↔ discourse community | Authors + cited researchers + readers of the syllabus                  | Citation, response, extension, theoretical refinement                                                  |
| Curriculum ↔ `lenses/embody`     | Curriculum-side + infrastructure-side teams (often overlapping people) | What the curriculum needs to teach ↔ what the infrastructure can show / record                         |

The fourth row is the load-bearing one for this document — see §5.

**Partner cohorts are trading-zone work in TCER's technical sense, not
user-tests.** The cohort host's experience is itself a research contribution;
the curriculum's next iteration reflects what the cohort surfaced. See
`guide.community.md` for the register addressed to community partners.

**Related concept**: Susan Leigh Star's _boundary objects_ (1989) is a sibling
concept in the science-studies literature, often paired with Galison's trading
zones. Boundary objects are _plastic enough_ to adapt to local needs of
different communities AND _robust enough_ to maintain common identity across
them. `lenses/embody` is a boundary object in this sense — theory-neutral
infrastructure that multiple pedagogies can consume. The per-chapter
`research-framing.md` files and the Evidence Tag System (🔬 / 📐 / 🧪) they
deploy operate as boundary-object protocols: shared formats that let curriculum
and research committees coordinate without needing to agree globally.

---

## 4. Reflexive Analysis & Action

A _core TCER principle_, not a footnote. **Questioning and refining the analysis
is itself doing translational research.**

Two operational registers:

### 4.1 Author/committee-side reflexive analysis

The curriculum committee reflexively analyzes how research findings reshape the
curriculum's design — and when partner-cohort experience contradicts prior
assumptions, the next iteration shifts. This is ongoing, not a project phase.

Operational implications:

- Git history records what's been decided and what shifted across rounds, so the
  reflexive-revision history is recoverable
- Adaptation by forkers (per `guide.authors.md`) is itself reflexive analysis —
  every adaptation is a new datum about what the framework's commitments do or
  don't carry

### 4.2 Learner-artifact-side reflexive analysis

Learners' exercise artifacts (traces, programs, snippets, gist submissions) feed
back as research data that may reshape theoretical frameworks. This is per the
**Pedagogy Wins** design principle (§5 below) — the data emerges _as a byproduct
of good pedagogy_, not as a result of instrumentation burden on learners.

The data is research-quality because the artifacts are pedagogically-shaped:
real programs from real learners doing real work, not synthetic exercises
designed to be observable.

### 4.3 Temporal modes — reflection-in-action and reflection-on-action

Both temporal registers from Schön's _The Reflective Practitioner_ (1983) apply
across §4.1 and §4.2: **reflection-in-action** (mid-doing, during the work) and
**reflection-on-action** (after-doing, on the finished artifact). The
author/committee-side register encompasses both modes — design decisions are
revised live during cohort cycles AND analyzed afterward across iterations. The
learner-artifact-side register operates primarily as reflection-on-action over
time, with reflection-in-action available when the artifacts are produced live
in cohort settings.

---

## 5. Pedagogy Wins

When pedagogical effectiveness and research observability conflict, **pedagogy
wins. Always.**

This is the operative tradeoff principle that prevents the curriculum from
degenerating into an instrumentation harness.

Operational rules:

- No assessment steps that interrupt learning flow just to generate research
  data
- No content-density increases for observability when they overload learners
- Exercises that naturally produce analyzable artifacts as a _side effect_ of
  good pedagogy

This creates a productive tension with `lenses/embody`'s _"Pure data, no
methods"_ commitment: embody is theory-neutral infrastructure; the curriculum is
opinionated content using that infrastructure. The two artifacts hold different
sides of the **Reusability Paradox** (Wiley) — embody optimizes for reusability
across many curricula; the curriculum optimizes for pedagogical coherence in its
specific setting.

This is not a contradiction. It is the trading-zone in operational form. See
`pedagogy.md` §9 for the related **Transfer Paradox** (Van Merriënboer) — about
how learning transfers, distinct from how artifacts are bundled.

---

## 6. Tool-Theory Co-evolution

> **"Building infrastructure IS research contribution."** — Bakhtiar Mikhak

The CERN-for-physics analogy applies here. CERN's particle accelerators are not
just tools that physicists use to do research. They are research contributions
themselves — their construction created theoretical insights, validated
theories, and revealed research priorities that wouldn't have surfaced without
the infrastructure.

`lenses/embody` is in the same position for computing education research.
Building the operational embodiment of the JEJ notional machine surfaces
theoretical questions about what the NM actually IS, what's recurrent vs
non-recurrent, what kinds of misconceptions are detectable by trace patterns,
what the granularity / observability tradeoffs look like in practice. These
questions were not asked first and answered by embody. They emerged _through_
embody's construction.

The curriculum is in the same position for pedagogical research. Writing the
curriculum has surfaced design principles, integrations, and tensions that
weren't visible before the writing. The 4C/ID + Whole Game integration of design
principles (now canonical in `pedagogy.md` § "Design principles") became visible
only when the principles were named alongside each other. The
intellectual-agency-as-meta-LO recognition emerged through chapter-drafting, not
as a prior conclusion.

**Tool-Theory Co-evolution names this: tool and theory mutually constitute each
other; neither is downstream of the other.**

The deeper pattern Bakhtiar Mikhak surfaced is the **engineering × physics
co-evolution** — Faraday/Maxwell-style mutual constitution where engineering
practice (building the generator) and theoretical practice (writing Maxwell's
equations) shape each other. Same teacher introduced both ideas to the user; the
curriculum's V/F symmetry is a small-scale instance of the same meta-pattern.

---

## 7. V/F at the artifact layer

> **We are doing the innovation process we're teaching.**

The V/F symmetry the curriculum teaches at the _student_ layer recurs at the
_artifact_ layer:

| Layer        | V (physics / experiential)                                                      | F (engineering / technical)                                                           |
| ------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Student**  | the Vibetoader — grounded in the user the program serves                        | the Frogrammer — grounded in the notional machine the program runs on                 |
| **Artifact** | **the curriculum** — design thinking about the learner's experience of learning | **`lenses/embody`** — engineered technical affordances that make NM-territory legible |

`lenses/embody` and the curriculum operate as **coordinated Translational
Sprints** (see §8) — two translational research artifacts in the same trading
zone, each shaping the other's next iteration. Their relationship is itself an
instance of the engineering × physics co-evolution at small scale (Bakhtiar
Mikhak; §6).

The student-layer V/F is what learners experience and practice. The
artifact-layer V/F is how the curriculum and its infrastructure are made and
refined. The same pattern operating at two scales; that recursion is the
curriculum's claim that _it is doing the innovation process it's teaching._

This claim has consequences:

- Adapting the curriculum (per `guide.authors.md`) is V/F practice at the
  artifact layer. Adapters are practitioners of the thing they're adapting.
- The relationship between curriculum and embody isn't _consumer ↔
  infrastructure_. It's _V-grounded artifact ↔ F-grounded artifact_, both
  translational, in the same trading zone.
- The "Embodying TCER" analysis (in `DGMD-E-1-artifacts/embodying-tcer/`) is the
  embody-side counterpart (F-grounded) to this document. This document is the
  curriculum-side counterpart (V-grounded). Together they document the
  V/F-at-the-artifact-layer pair.

---

## 8. Translational Sprints

> _"TCER tells you WHAT (framework). Translational Sprints tell you HOW
> (methodology)."_

A complementary methodology that operationalizes TCER. The 6-stage cyclical
process is documented in
`DGMD-E-1-artifacts/embodying-tcer/8-agile-cer-connection/` and is out of scope
to detail here. What matters at this layer:

- The curriculum's iterative development pattern (alumni co-development,
  cohort-shaped revisions, ongoing reflexive analysis) fits this methodology
- The relationship between the curriculum and `lenses/embody` is a Translational
  Sprint pair
- Adaptation by curriculum authors / forkers / contributors is a Translational
  Sprint contribution, not a passive consumption
- Multi-institution coordination (Translational Research Programmes via Sprints)
  is enabled by the shared infrastructure of `embody` + the shared opinionated
  content of the curriculum

Acknowledged here; detailed elsewhere.

---

## 9. The Evidence Tag System

Throughout the curriculum's per-chapter `research-framing.md` files, small
linked emoji classify the evidence behind pedagogical claims:

- 🔬 **Established** — Direct research backing. Peer-reviewed, replicated or
  highly cited. Solid ground.
- 📐 **Translated** — Established theory applied to a new context. The original
  finding is solid; the application to _this_ context is informed conjecture.
  **Disciplined bridge-building.**
- 🧪 **Extension** — Derived from experience, extrapolation, or untested
  prediction. We think this is right, but it hasn't been tested yet.

These tags are deployed inline in the per-chapter `research-framing.md` files
(research committee-owned) and in `DGMD-E-1-artifacts/theory-to-requirements/`.
**They are not yet deployed in the new syllabus artifacts** (`ontology.md`,
`chapters.md`, `guide.*.md`). Deployment is deferred to a future pass; the
evidence claims live in their existing homes.

---

## 10. What this means for each audience

| Audience                                        | What changes                                                                                                                                                                                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Learners**                                    | Nothing in the learner-facing prose. The translational nature is invisible at the learning level. (See `guide.learners.md`.)                                                                                                             |
| **Curriculum authors / forkers / contributors** | Adaptation is trading-zone work in TCER's technical sense. The Evidence Tag System and reflexive-analysis discipline travel with the curriculum. See `guide.authors.md`.                                                                 |
| **Partner communities, mentors, cohort hosts**  | Co-development IS translational research. Partner cohorts are not user-tests; they are trading zones. The community-of-makers and community-of-users are the same kind of relationship at different moments. See `guide.community.md`.   |
| **Researchers**                                 | The curriculum is observable; learner artifacts are data; the framework is open for application and challenge. Reflexive analysis is welcome.                                                                                            |
| **TCER community**                              | This is an applied case study of the TCER framework, alongside `DGMD-E-1-artifacts/embodying-tcer/`. The curriculum + embody pair is one operational instance of _what a Translational Sprint at the educational-tool layer looks like_. |

---

## 11. Pointers

- **TCER paper**: Cole, E., Malaise, Y., & Signer, B. (2023). _Computing
  Education Research as a Translational Transdiscipline._ SIGCSE 2023.
  https://doi.org/10.1145/3545945.3569771
- **Embody-side TCER analysis**: `DGMD-E-1-artifacts/embodying-tcer/`
- **Theory-to-requirements pipeline (the 5-step translational process)**:
  `DGMD-E-1-artifacts/theory-to-requirements/`
- **Curriculum-level research framing**:
  `0-curricula/spiralearn/welcome-to-programming/research-framing.md`
- **Repo-level research framing**: `0-curricula/research-framing.md`
- **Per-chapter research framings**: each chapter directory has its own
  `research-framing.md` (most-detailed: Ch4's, on Human-AI collaboration)

---

## 12. Status

End-state document. Updates land here when:

- TCER framework evolves (the user is an author; future revisions are possible)
- The embody ↔ curriculum coordinated-sprint pattern reveals new operational
  implications
- Partner cohorts surface trading-zone insights worth recording at this layer
- Reflexive analysis produces a meaningful revision

Per AGENTS.md: status / phase / hedging belongs in git history (commit log), not
here. This document describes the _what_ — the curriculum's translational
nature; not the _where we are right now_ on the work-stream.
