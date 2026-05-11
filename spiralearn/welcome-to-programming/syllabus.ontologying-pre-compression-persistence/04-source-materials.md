# Source Materials

> Everything I read or referenced during this session, with paths and relevance
> notes. The prior session's materials list is at
> `../syllabus.ontology-handoff/04-source-materials.md` — read both.

## Primary curriculum artifacts

### `syllabus.ontology.md`

**Path**: `../syllabus.ontology.md`

The R5 framework document. This session's `syllabus.ontology.md` **supersedes**
it (concentric — carries everything from it without loss, weaves in much more).

### `syllabus.md`

**Path**: `../syllabus.md`

The current syllabus prose (2157 lines). **READ-ONLY** during this work-stream.
Will later (separate commit) be redrafted using the new artifacts as
source-of-truth.

### `narrative/README.md`

**Path**: `../narrative/README.md`

1957 lines. The full composer/virtuoso/mechanism metaphor system reference.
Pre-R5 (predates the V/F substrate-agnostic reframing) but substantive on:

- §4 expanded cast (Composer / Virtuoso / Mechanism / Audience / Co-composers /
  Historical cameos)
- §6 metaphor mapping
- §8 composition vs execution two-phase
- §10 composer's critical ear
- §11 arrangement vs greenfield composition
- §12 composer pedagogy mappings (musical-composer-training ↔ curriculum-skills
  correspondence)
- §15 PBSI through the metaphor (concentric scopes diagram)
- §16 8 AI-collaboration skills
- §22 verification limit + agile-visible discipline
- §23 PL-future
- §25 voice spec
- §26 characters
- §27 smaller connections

Uses `<details>` + relative-importance caveat convention (most load-bearing /
supporting / optional extra angle) — **this is the convention** for visuals in
`syllabus.ontology.md` too.

### `narrative/assets/`

**Path**: `../narrative/assets/`

15 visual assets:

- `the-big-picture.png` (most load-bearing — rhetorical model)
- `the-big-picture-plus-ai.png` (most load-bearing — model with AI)
- `a-program.png` (supporting — source code as mediator)
- `computers-and-developers.png` (supporting — dev/computer relationship)
- `0-1-rhetorical-triangles-translation.excalidraw.svg` (supporting — classical
  rhetoric translation)
- `0-2-nested-triangles.excalidraw.svg` (optional extra)
- `1-1-collaborative-writing.svg`, `1-2-collaborative-coding.svg` (optional
  extra)
- `eb-ds-1-rhet-sit.svg` (most load-bearing for PBIS — rhetorical situation
  breakdown)
- `curriculum-spider-web.svg` (most load-bearing — the spiderweb curriculum
  image)
- `decision-tree.svg` (supporting — decisions strand)
- `learning-progression.svg` (supporting — 5 layers)
- `solo-integration.svg` (supporting — SOLO taxonomy mapped)
- `spiral-curriculum.png` (most load-bearing — Bruner-style spiral)
- `4cid_graphic_v2022_*.png` (from First Principles trail — the 4C/ID diagram)

### `just-enough/javascript/`

**Path**: `../../../../src/lib/welcome-to-programming/just-enough/javascript/`

The infrastructure side of the curriculum. Load-bearing:

- `README.md` — the JEJ → NM → embody → lenses chain explained. Includes
  Explorotron framework grounding (Malaise & Signer 2023) and pedagogical first
  principles (skill transfer / expertise reversal / lifelong-learning autonomy).
  Frogrammer as "kit of magnifying glasses."
- `DOCS.md` — architecture decisions and DDD-scope-discipline rules
- `notional-machine.md` — the conceptual NM model (808 lines; read in prior
  sessions, not deeply here — caution: 11 NM event categories are tentative LLM
  drafts, only meta-claim is fact)
- `embody/README.md` — operational embodiment factory; pure data / frozen-data +
  event-stream substrate. Maps embody types to NM concepts.
- `lenses/README.md` — pedagogical perspectives on the embodied NM; three-tier
  classification (text-only / parsed / evaluable); LensModule contract.
- `orchestrate/README.md` — orchestrator (single-writer editor + recommender +
  analysis helpers). **Add to chain** per user direction:
  `JEJ → NM → embody → lenses → orchestrator`.

### `notional-machine.md`

**Path**:
`../../../../src/lib/welcome-to-programming/just-enough/javascript/notional-machine.md`

Conceptual NM. ECMA-262 spec-aligned. Defines two viewing levels (visual-syntax
/ behind-the-scenes), resolve as bridge, emit events for I/O. Caution: tentative
event-category lists are LLM drafts.

## User's prior writing (precursors and design lineage)

Read this session. All in
`/Users/master/Documents/0-teach-code/0---the-big-idea/00--evancole-be/0--notes/pages/`:

### Foundational stance

- `First Principles.md` — _home_ note. Adapted into
  denepo.js.org/design-principles. Lists the user's stance & values commitments
  (Learner Trust comes first; Open Source !== Open Education →
  Learner-Accessible OER; Open, Useful, Usable, Used; Teaching Tech Together
  rules; Time is Importance; Name Things; Explicitly Teach the Implicit; Process
  Over Product; Full Complexity, Max Simplicity; Context is Content; Wear Hats
  not Titles; etc.)
- `Wear Hats, not Titles.md` — situational, plural, context-dependent roles. V/F
  precursor.
- `Connections are Concepts.md` — the canonical principle's source. Methodology
  for deciding what to teach.
- `Module___Welcome to JS___1. What Is Programming.md` — the OTHER _home_ note.
  The 2018-era precursor to:
  - Three audiences (devs / computer / users) — already there
  - _"Computer Empathy"_ — direct precursor to F's NM-twin via prediction
  - _"Know your computer / Know your user"_ — the V/F symmetry seed
  - _"Explaining a program in plain english is helpful but it's easy to be a
    little bit wrong and not know it"_ — already in syllabus.md

### Design principles (course-construction)

- `Process Over Product.md` — focus on steps; processes accommodate learners of
  different levels in one room
- `Full Complexity, Max Simplicity.md` — start with all moving parts at simplest
  technical depth. 4CID-inspired.
- `Explicitly Teach the Implicit.md` — name skills experts take for granted
- `Name Things.md` — naming legitimizes concepts as learning objects
- `Context is Content.md` — environment shapes the experience
- `Whole Game.md` — Perkins. User flagged as integrative across many of the
  design principles ("Spiderweb, Rhetorics, Connections are Concepts, Process
  Over Product, Full Complexity Max Simplicity, 4CID, Spiral Curriculum")
- `Spiderweb Curriculum.md` — skills at the center, technologies as rings
  outward. _"Places collaboration, communication and other 'soft skills'
  unavoidably at the center."_ Helps learners "feel that they belong in
  computing."
- `Reusability Paradox.md` — Wiley. The grouping/publishing tension. _"Can you
  imagine wanting to teach some portion of this topic without teaching the other
  parts?"_
- `Four Component Instructional Design.md` — Van Merriënboer. Sparse note +
  link + reference. The user said "absolutely fundamental to all my work." See
  PDF reading below.
- `Time is Importance.md` — making time signals importance

### Stance & values

- `Learner Trust.md` — _comes first_. Meeting learners where they are. Trust as
  currency for hard things.
- `Open Source !== Open Education.md` — Open Education = OER + OEP that the
  directly-involved can adapt. Stricter standard than open source. Includes case
  studies (JS Parsons / Parsonizer / FreeCodeCamp / Repl.it / Python Tutor).
- `Open Education.md` — "Open education is what happens when open educational
  resources are useful, usable and used."
- `Open, Useful, Usable, Used.md` — the OER four-test
- `Learner-Accessible OER.md` — the strongest open-education standard (learners
  can modify the materials)
- `Forkability.md` — the operational measure: barriers between "fork" button and
  adapting to your context
- `Teaching Tech Together___The Rules.md` — Greg Wilson's 10 rules ("Be kind:
  all else is details"; "Never teach alone"; etc.)
- `Teaching Tech Together.md` — pointer to teachtogether.tech
- `Making Best Practice Common Practice.md` — the user's never-finished thesis
  proposal from 2020. Long. Introduces fluid roles framing (learner / companion
  / teacher / accounta-buddy).
- `Accessible Programming.md` — pointers (Spoons; tabs-not-spaces for screen
  readers; Guzdial on blocks-based languages; Programming and learning CS when
  legally blind)
- `Breaking the Code of Inclusion.md` — FOSDEM 2023 (Yoshi Malaise — the same
  author as the Explorotron paper). PRIMM-based micromaterials for
  accessibility.
- `Social Dreaming Together – Envisioning Decolonised Computer Science Education.md`
  — SIGCSE 2023 paper.

### Rhetoric (the curriculum's communicative anchor)

- `Rhetorical Situation.md` — sparse stub (YouTube link)
- `Rhetorics of Programming.md` — wonders about rhetorical situations for
  different programming types; "what if rhetorical situations, not learning
  objectives, were the first step of curriculum and certification design?"
- (Plus visuals referenced in `narrative/assets/`)

## The Janke / elewa effective-learning archive

**Path**:
`/Users/master/Documents/0-teach-code/janke-learning-org/curriculum-jl/0---janke-chunks/good-learning/effective-learning/`

10-chapter learner-side curriculum:

- `00-find-your-why.md` — "Programming is the WHAT, studying/practice is the
  HOW, your why brought you here in the first place"
- `01-manage-your-mindset.md` — growth mindset / learning zone / embracing
  confusion
- `02-stay-motivated.md` — _"lean on your community"_
- `03-manage-your-expectations.md` — programming is messy; embrace it
- `04-be-wrong.md` — _"seek out being wrong"_
- `05-being-in-between.md` — threshold concepts; liminal zones
- `06-help-your-brain.md` — meta-cognition; deliberate effort; cognitive load
  (intrinsic / extraneous / germane); mental models with automatization
- `07-structure-your-inquiry.md` — be curious / playful / cautious / deliberate
  / strategic
- `08-study-effectively.md` — "Studying: managing your limited resources to
  maximize learning"
- `09-make-connections.md` — "Transferring knowledge to practice is a matter of
  making connections between seemingly unrelated things"

This is the **learner-side manifesto already written** at some level. The
course-side manifestos mirror this (what the COURSE does in support of what the
LEARNER does).

## TCER framework + DGMD-E-1-artifacts (R4 additions)

### `DGMD-E-1-artifacts/` (the user's translational-research workshop)

**Path**:
`/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/DGMD-E-1-artifacts/`

Three sub-directories, all directly relevant:

- **`embodying-tcer/`** — A comprehensive analysis of how `embody` operates
  within the TCER framework. Documents multi-phase translational work, trading
  zones, Tool-Theory Co-evolution, the Translational Sprints methodology,
  infrastructure as Phase 4.A contribution, reflexive analysis. The
  **curriculum-side counterpart** is `syllabus.translational-framing.md`.
- **`theory-to-requirements/`** — A snowballing literature-review pipeline that
  translates CER literature into technical requirements for `embody`. 5-step
  translational process. Already deploys the 🔬/📐/🧪 Evidence Tag System
  inline. Maps directly to TCER phases.
- **`embody-use-cases/`** — Use-case brainstorming for `embody`; the StoryLines
  write-up. (Less load-bearing for the curriculum side.)

Key concepts surfaced (from the three READMEs):

- **7-layer TCER model** (more granular than the 3-phase summary in
  `research-framing.md`)
- **Translational Sprints** as operational methodology — _"TCER tells you WHAT;
  Translational Sprints tell you HOW"_
- **Tool-Theory Co-evolution** — building infrastructure IS research
  contribution (Bakhtiar Mikhak); the CERN-for-physics analogy
- **Bidirectional translation** — translation is cyclical, not linear
- **Translational Research Programmes (TRP)** — multi-institution coordination
  via Sprints
- **Embody as multi-phase artifact** — operates simultaneously in Phases 1.B,
  3.A, 3.B*, 4.A*. The curriculum is the same kind of object on the V-side of
  the V/F-at-artifact-layer pair (R5 correction: lenses/embody is F at the
  artifact layer — engineering / technical affordances; the curriculum is V —
  experiential / physics affordances).

### `research-framing.md` files (TCER vocabulary already deployed)

**Paths**:

- `0-curricula/research-framing.md` (repo root) — primary TCER vocabulary
  source-of-truth at the repo level
- `0-curricula/spiralearn/welcome-to-programming/research-framing.md` —
  curriculum-level (mostly pointers + research-collaborator recruitment)
- `0-curricula/spiralearn/welcome-to-programming/4-devs-computers-users-agents/research-framing.md`
  — the most-detailed per-chapter framing (Ch 4 on Human-AI collaboration).
  Owned by the research committee.

These files contain operationally-deployed Evidence Tag System (🔬 Established /
📐 Translated / 🧪 Extension), TCER positioning (phases 3.B*, 4.A*, 4.B*), and
the *Pedagogy Wins\* design principle.

### TCER paper (the user's own work)

> **Cole, E., Malaise, Y., & Signer, B. (2023). Computing Education Research as
> a Translational Transdiscipline. In Proceedings of the 54th ACM Technical
> Symposium on Computer Science Education V. 1 (SIGCSE 2023), March 15-18, 2023,
> Toronto, ON, Canada.** https://doi.org/10.1145/3545945.3569771

Yoshi Malaise and Beat Signer are the same Malaise & Signer who authored the
**Explorotron** paper (already in the curriculum's discourse community for
`<StudyLenses>`). They're co-authors of _two_ load-bearing frameworks the
curriculum uses.

### Bakhtiar Mikhak — lineage promoted (R4)

From "Mikhak's data/interaction architectural pattern" to **deeper V/F pattern
lineage**. Two ideas from Bakhtiar Mikhak that ground the curriculum:

1. _Infrastructure IS research contribution_ — the claim that grounds §11-sex
   Tool-Theory Co-evolution
2. _Engineering × physics co-evolution_ — Faraday/Maxwell-style mutual
   constitution; the deeper pattern V/F instantiates (at both student and
   artifact layers)

Same teacher introduced both ideas to the user; both are load-bearing for the
curriculum.

---

## External references

### Kirschner & Van Merriënboer — _Ten Steps to Complex Learning_

**URL** (and locally saved during session):
`https://web.mit.edu/xtalks/TenStepsToComplexLearning-Kirschner-VanMerrienboer.pdf`

Chapter from _Building Learning Environments_ (saw pages 1–10 of the chapter).
Operational depth on:

- The four components: Learning Tasks / Supportive Information / Procedural
  Information / Part-Task Practice
- The ten steps (1. Design Learning Tasks → 10. Design Part-Task Practice)
- Holistic design vs atomistic design — compartmentalization, fragmentation,
  transfer paradox
- Task classes with high variability + diminishing support
- Recurrent vs nonrecurrent constituent skills
- Pebble-in-the-Pond (Merrill) — content-centered start with whole task

### Karl Friston — "A Duet for One"

Cited from `../syllabus.ontology-handoff/`. Active inference for dyadic
communication. "Understanding just IS the alignment of generative models."
Course-language constraint: don't use "free energy" in body; use "alignment of
generative models."

### Bakhtiar Mikhak — DGMD E-1 (Harvard Extension)

External. Direct connection with user. Course description in
`../syllabus.ontology-handoff/04-source-materials.md`. Inspired the
embody/lenses architectural pattern.

### Malaise & Signer (2023) — Explorotron framework

_Explorotron: An IDE Extension for Guided and Independent Code Exploration and
Learning._ Koli Calling '23. The two-axis (curated/ uncurated ×
guided/unguided) + pyramid framework that `<StudyLenses>` implements at snippet
scope.

### Hofstadter — _Gödel, Escher, Bach_

Influence acknowledged; **NOT** structural guide. WtF diverges fundamentally:
_"GEB hides much of its meaning in itself as a puzzle, requires intellectual
confidence to engage. WtF is designed pedagogically so it is eminently learnable
and BUILDS intellectual confidence."_ (user, R3)

### Wiley — Reusability Paradox

_"Can you imagine wanting to teach some portion of this topic without teaching
the other parts?"_ Cited in `Reusability Paradox.md`.

### Perkins — _Making Learning Whole_ (Whole Game)

Cited in user's `Whole Game.md`. Integrative for many design principles (per
user's annotation).

### Bruner — spiral curriculum

The user's definition is **richer** than Bruner's: spiral = traversal through
spiderweb with sequenced skill threads. Spiderweb = topology; spiral =
trajectory.

### Wing 2006 — computational thinking

Established lineage for F's bridging activity.

### Cunningham et al. 2012 — ATT

_Abstraction Transition Taxonomy_. The 5-tier ATT in WtF's ontology expands the
original 3-tier (English / Code / CS Speak) by adding bridging-activity speaks.

## Internal artifacts

### Plan file

**Path**: `/Users/master/.claude/plans/hi-i-have-a-dazzling-kahan.md`

This session's full plan (~700+ lines). Every fork, every variant, every
candidate considered. Consult when this handoff doesn't answer a specific
question.

### Prior session plan file

**Path**:
`/Users/master/.claude/plans/we-re-starting-an-enriching-snappy-bird.md`

The R5 session plan (1576 lines). Already largely subsumed by
`../syllabus.ontology.md` and `../syllabus.ontology-handoff/`.

### User response files

`../syllabus.clauding-1.txt` (archived) through `../syllabus.clauding-7.txt` —
user's mid-conversation responses across rounds. clauding-5, -6, -7 were the
load-bearing ones for this session.
