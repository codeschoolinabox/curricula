# Welcome to Frogramming — Pedagogy

> The _design principles for the learning experience_ — how the concepts
> named in `syllabus.ontology.md` get taught. Introduction order,
> exercise patterns, scaffolding, when each concept lands in the
> curriculum.
>
> Companions (siblings, by co-location):
>
> - `syllabus.md` — the high-level orientation and reading map
> - `syllabus.ontology.md` — the _what_ (reference framework, the
>   concepts being taught)
> - `syllabus.manifesto.md` — the vision this pedagogy serves
> - `syllabus.chapters.md` — the chapters where this pedagogy operates
> - `syllabus.narrative.md` — the journey learners go on
> - `syllabus.guide.{learners,authors,community}.md` — practical
>   application of these principles per role
> - `syllabus.translational-framing.md` — process for improving these
>   methods over time
> - `syllabus.study-lenses.md` — technical-reader companion for the JEJ
>   → NM → embody → lenses → orchestrator infrastructure that embodies
>   the pedagogy operationally

---

## Why this file exists

`syllabus.ontology.md` owns naming and defining. This file owns
how-those-named-things-get-taught. The soft seam:

- **Ontology** = concepts (what things ARE, how they relate)
- **Pedagogy** = how those concepts get taught (methods, sequence,
  exercises, design principles)
- **Guide.authors** = practical application of these principles +
  tooling/workflows

## First Principles

This pedagogy is rooted in a set of First Principles (anchored in
`0---the-big-idea/00--evancole-be/0--notes/pages/First Principles.md`).
They are presented at **flat equal status** — each principle has a
role, and the principles fit together; no principle is named "primary"
or "central."

Initial principle set (to be developed in Wave 3 with full prose per
principle):

- How education, design, and computing exist with the world
  - Software is written by someone, for a purpose. Be that someone,
    choose your purpose.
  - All computing is embedded in rhetorical situations that it in turn
    helps to define. There is no escape.
  - The best designs come from participation, empathy, and humility.
  - Design around the lives of your learners, don't expect the inverse.
  - Everyone has something to teach and something to learn.
  - Wear hats, not titles.
- Requisites and aspirations for meaningful education
  - Learner Trust comes first.
  - Making Best Practice Common Practice.
  - Means of Instruction: Open Source ≠ Open Education → Learner-Accessible OER.
  - Agency, ownership, integration, preparation, intellectual honesty.
  - Open, Useful, Usable, Used.
- Guiding principles for instructional practice and design
  - Teaching Tech Together / The Rules.
  - Time is Importance.
  - Name Things.
  - Explicitly Teach the Implicit.
  - Process Over Product.
  - Full Complexity, Max Simplicity.
  - Context is Content.

---

## How Learning Happens (and What It Means for This Course)

**Not just a better explanation.** That five-word catchphrase has been part of
this author's teaching practice since at least 2019 — long before LLMs, long
before this curriculum reached its current form. It captures something specific:
that effective teaching isn't a competition over which explanation is clearest.
The new pressure LLMs put on this old principle is that LLMs are extraordinarily
good at producing explanations — confident, fluent, customized, on demand. _If
learning were the receipt of explanations, LLMs would have already solved it._
They haven't, because it isn't.

Cognitive scientists have studied this asymmetry for decades under the name
**pedagogical sampling**: humans, from infancy onward, draw fundamentally
different inferences from data chosen intentionally by a teacher than from data
encountered at random or sampled by the learner themselves. The corollary is
well-established in education research: **a curated curriculum is qualitatively
different from free self-directed learning.** This is the structural reason an
LLM responding to learner-directed prompts is closer to self-directed sampling
than to pedagogical sampling. Its outputs may look intentional, but they aren't
sampled for THIS learner's hypothesis space, this learner's sequence position,
this learner's impending threshold concept. A curated curriculum is. Even a
well-prompted LLM samples differently from a teacher who has modeled YOU. Some
of what this course teaches you to twin — the notional machine, users, your
fellow developers, the LLM itself as a collaborator — are not facts to be
acquired but **ways of doing things**, and ways of doing things are learned
through the doing.

**The two-layer misconception mechanism.** Confident explanations install
misconceptions when they substitute for experience — especially analogies that
feel complete and that the learner can't run-and-verify in their head. LLMs
amplify the risk because their explanations are extra-confident and
analogy-rich. That's layer one. Layer two is sneakier: **log or UI-only
self-checking installs misconceptions because many wrong models of the notional
machine produce the right outputs, for a while.** A learner who self-checks only
by output can carry a misconception for weeks, accumulate work that depends on
it, and only discover the wrong model when something downstream breaks
expensively — at which point the misconception has to be uninstalled along with
everything that depended on it. This course's response to both layers:
predict-and-verify at the level of **internal events** (scope walks, coercion
cascades, binding lifecycle, prototype lookups). Internal-event predictions are
much harder for a wrong model to falsely confirm. Take `'5' + 3` and `'5' - 3`
as a small example: most learners can predict the outputs (`'53'` and `2`) long
before they can predict the internal events — what the engine actually does, in
what order. _As Evan put it in earlier teaching notes: "explaining a program in
plain English is helpful, but it's easy to be a little bit wrong and not know
it."_ Predicting the chain of internal events is what closes that gap.

**Building Structure → AI Integration Threshold → Leveraging Structure.** The
SOLO taxonomy from education research distinguishes Pre-, Uni-, Multi-,
Relational-, and Extended-Abstract levels of conceptual integration —
prestructural through to network-of-connected-concepts. A learner's relationship
to a concept progresses through these levels at its own pace. Chapters 1–3 of
this course are _weighted toward_ Building Structure (Pre/Uni/Multistructural —
concepts isolated, models forming, no AI in the work). Chapter 4 is _weighted
toward_ the threshold crossing (Relational — concepts connect; AI outputs become
evaluable). Chapter 5 is _weighted toward_ Leveraging Structure (Extended
Abstract): all quadrants of human-AI collaboration become viable, and snippetry
maintains the automated library (the _automaticity_ named in the opener) once
full-codebase work no longer provides daily reps. Within any chapter, a learner
is at varying SOLO levels for different concepts; the mapping is suggestive, not
strict. The threshold matters because **AI cannot help when learners don't yet
know what to verify.** Until you can recognize what to verify, an LLM's output
is unevaluable from your seat — even if it happens to be correct.

**Why Chapter 4 lands where it does.** Chapter ordering here isn't arbitrary —
it's a structural consequence of the principle. Until you have the twins (the
NM-twin, the user-twin, the developer-twin), you can't evaluate AI output,
direct it meaningfully, or recognize when it's confidently misleading you.
There's a sharper way to put this: until you have the twins, you don't know what
to ask the LLM well, and an LLM responding to ill-formed queries samples like
random encounter, not like a teacher. Once the twins are running, your queries
become well-posed enough that the LLM's responses approximate pedagogical
sampling — and you have the model to verify them against. The threshold isn't
sequential ("we covered Ch1–3 first, now Ch4"); it's structural (pre-twin
queries elicit non-pedagogical samples; post-twin queries elicit something
closer to pedagogical samples that you can also evaluate). Once across the
threshold, the LLM becomes a steerable participant. Chapter 4's structure —
every section evaluating LLM output rather than producing it — is the
operational mechanism that lets the chapter work safely. **Code is content, not
deliverable** is the framing this section names for Ch4: AI-generated code is
material to study, not work-product to ship — which is what keeps the chapter
pedagogical rather than productivity-oriented.

**The existing scaffolding, reread as instances of the principle.** Each piece
of this curriculum's apparatus is **pedagogical sampling at a particular
granularity**:

- **PRIMM** (predict-run-investigate-modify-make) is pedagogical sampling at the
  exercise level. The author's earlier (~2018) framing called this
  _Read–Diagram–Modify–Create_ — same cycle, prior name. Continuity, not
  reinvention.
- The **Block Model** is pedagogical sampling at the code-element level — atoms,
  blocks, relationships, macro structure × text-surface, execution, purpose.
- The **spiral curriculum** is pedagogical sampling across language-feature
  scales, accumulating into automaticity over time. _As Evan put it in 2018:
  "that lovely moment where you no longer need to think to complete a task. Your
  brain has built a network of Mental Models that it can fall back on to carry
  out these routine tasks without increasing your cognitive load."_
- **Cognitive Load Theory** (intrinsic / extraneous / germane) is pedagogical
  sampling at the **cognitive-budget level** — choosing what NOT to put in front
  of the learner is as much a sampling decision as choosing what to include.
  This is why JEJ is deliberately small.
- **Study Lenses** are pedagogical sampling at the internal-event level. They
  reclaim the visibility Bret Victor wanted (mechanism made observable) at
  exactly the granularity the misconception-mechanism requires.
- **Just Enough JavaScript** is pedagogical sampling at the language-feature
  surface — fewer features chosen deliberately, sequenced to prevent
  misconceptions from installing.
- **Errors-as-information** is pedagogical sampling at the moment of
  model-divergence: the machine is honest, and an error is a surprise that
  updates your model.
- **Snippetry** (Ch5) is pedagogical sampling _for self_ — the learner becomes
  their own pedagogical sampler for NM-maintenance once full-codebase work no
  longer provides daily reps. Each snippet is a self-curated experience.

The principle isn't introducing a new pedagogy; it's the why behind the
curriculum's existing shape — and the through-line from the author's decade-old
tagline to the cognitive-science taproot underneath.

**The mastery contract, returning to the catchphrase.** Earlier in the course
materials there's a sentence the author has kept canonical: _"You have only
mastered a skill when you can complete its exercises without AI."_ That's the
principle as a learning contract. AI is welcome at the work as soon as you have
the twins — NM-twin and user-twin alike — to bring to the collaboration. Until
then, AI is what you're using AS you build — not what you're using INSTEAD of
building. Not just a better explanation. The work is yours, has always been
yours, and will always be yours — that's what makes it worth doing.

---

## Using the 5 layers (§5 of ontology) in teaching

The 5 layers (§5 of `syllabus.ontology.md`) are named there as the
engagement depths a reader can stay at or descend through. This file
carries the design principles for teaching with the layers:

### SOLO applies within each layer (not across)

SOLO taxonomy (Pre-Structural / Uni-Structural / Multi-Structural /
Relational / Extended-Abstract) applies _within_ each layer, not across
them. A learner at L0 can be Pre-Structural through Extended-Abstract on
the NM; same span at L1, L2, L3, L4. The layers are _kinds_ of work;
SOLO is _depth_ within each kind. The cross-product is a 5×5 reading:
layer × SOLO-depth — useful for diagnosis and for designing exercises
that meet a learner where they are at a given layer.

### Architectural rules

- **Each layer runs through each chapter.** This is NOT a chapter-by-layer
  mapping; it's a 2D grid: chapters × layers.
- **Platform-agnostic constraint**: pure markdown + Study Lenses. No special
  platform features required.
- **Layer architecture in markdown**:
  - L0 / L1 = body prose (the chapter)
  - L2 = sidebars + V/F dialogues; necessary for L2 reading; skippable for L1
    reading
  - L3 = end-of-chapter snippetry prompts
  - L4 = footnotes / side notes / easter eggs / references; fully optional, for
    the attuned reader

### V and F brought to life through narrative

V and F are defined as personae in `syllabus.ontology.md` §3 — substrate-agnostic
stances with temperaments and tells. The pedagogical device is to **bring them
to life through story** at L2: dialogues, sidebars, exchanges where each speaks
for themselves. Personification carries perspective more vividly than label
alone; through dialogue, learners experience a stance rather than read about it.
(See ontology §3's Achilles/Tortoise footnote for the literary precursor and §13
for the MU tribute that honors the lineage.)

### L4 as questioning, not theory-mastery

L4 is the layer where the curriculum reaches the edge of confirmable
science and crosses into frontierland between philosophy and evidence.
The teaching contract changes accordingly:

- **LOs are questionings, not facts.** A well-formed L4 learning
  objective opens an inquiry the learner stays with — _"Notice X,"
  "Encounter the question Y," "What would Z mean for W?"_ — not a
  thesis to recite. The chapter L4 LO bullets across the curriculum
  follow this form.
- **The goal is not theory-currency.** L4 does not aim to bring
  learners up to date with the latest names in active inference,
  embodied cognition, or phenomenology. The named traditions (see
  ontology §5 _L4 by strand_) are entry-points into the strand's
  philosophical questioning, not destinations.
- **Methodological rigour applies even at the frontier.** Questions
  on the science-philosophy edge can be asked well or badly. Part of
  L4's contract is teaching learners _how_ to ask big questions:
  distinguishing the empirically testable from the genuinely open,
  treating named traditions as positions to interrogate rather than
  authorities to defer to, holding multiple framings simultaneously
  without collapsing to one prematurely.
- **Easter-egg form serves the stance.** L4's marginal placement
  (footnotes / side notes / references; see _Architectural rules_
  above) is a pedagogical signal: this is optional, attuned-reader
  territory; engagement is invitation, not obligation. The form
  itself models that the questions belong to the reader, not to the
  curriculum.

### Layer titles (working candidates; not locked)

Three styles brainstormed; defer until ontology stabilizes:

- **Verb-style (action)**: Embody / Apply / Switch / Explore / Wonder
- **Noun-style (state)**: Mastery / Rhetoric / Methodology / Snippetry /
  Philosophy
- **Hybrid (verb-as-name + noun-as-meta-objective)**: "Embody to gain Mastery";
  "Apply to develop Rhetoric"; "Switch to gain Methodology"; "Explore through
  Snippetry"; "Wonder at Philosophy"

---

## The pedagogical claim from Friston

The cogsci grounding for the curriculum's twinning verb. **Karl Friston's
"A Duet for One"** applies active inference to dyadic communication: two
aligned generative models behave as a single coupled inference system.

> **"Understanding just IS the alignment of generative models into a single
> coherent predictive process."**

Applied to LLM-collaboration: the boundary between human reasoning and
machine inference becomes porous; thought emerges at the _interface_, not
within either alone.

### Language constraints

The curriculum body translates Friston's machinery into reader-friendly
vocabulary:

- ❌ **"free energy"** — too jargon for the course body
- ✓ **"alignment of generative models"** — clean replacement; survives
  across substrates
- ✓ **"predictive processing"** — broader cognitive-science framework
  (Andy Clark, Jakob Hohwy) cited in deeper sections as "how minds work
  as predictive engines"
- ✓ **"active inference"** — usable but requires explanation; introduce
  as the dyadic-Friston frame in Ch4

### The pedagogical consequence

> **AI generates; it doesn't twin. Your job is to twin the LLM AND what the LLM
> is twinning, to detect and correct divergences — and to relish productive
> divergences.**

**Same skill, two layers**:

- L2 = defensive (detect/correct misalignment; manage hallucinations)
- L3 = offensive (use misalignment for creative discovery)

---

## Lenses, embody, and substrate ↔ pedagogy mutual constitution

The JEJ chain (`just-enough/javascript/` + `embody/` + Study Lenses +
orchestrator) is named and described in `syllabus.study-lenses.md` as
infrastructure. This file carries the principles by which that
infrastructure is pedagogy-shaped:

### Lenses are F-pedagogy infrastructure

> _"Lenses are to help LEARN F territory; they are not a tool for V's."_

The Mikhak data/interaction architectural pattern is V/F-neutral; the
curriculum's _application_ of the pattern (embody-as-data, lenses-as-experience)
is F-specific. Don't conflate the architectural pattern with the V/F mapping.

### Substrate ↔ pedagogy mutual constitution

The infrastructure _embodies_ the pedagogy:

- lenses literally **are** the Frogrammer's magnifying glasses (ontology §3)
- embody literally **is** the NM crystallized for exploration — _a static
  4D rendering of a 3D flowing river_; the substrate is not inert, it makes
  every facet of the data lifecycle's motion explorable
- the JEJ language constraint **is** the cognitive-load discipline (see "B.1 Cogsci mechanisms" below)
- the orchestrator **is** the Explorotron framework's snippet-scope realization

The opposite is also true: the pedagogy is shaped by what the infrastructure can
afford. V/F feedback loop in operational form.

---

## Design principles (migrated from ontology Part B)

The principles the curriculum is built **on** — _about_ the course, not
_in_ the course for learners to learn. They are not an arbitrary list;
they are crystallizations of practice that come from named lineages.

**Integrative frames** — one per cluster:

- **Instructional-design clusters** (_cogsci mechanisms_ +
  _course-construction_) → integrated by **4C/ID** (Van Merriënboer &
  Kirschner, _Ten Steps to Complex Learning_) together with **Whole
  Game** (Perkins, _Making Learning Whole_). Both are holistic-design
  responses to atomistic instructional design — same commitment, two
  registers: academic-operational (4C/ID's task classes, four
  components, ten steps) and accessible-philosophical (Whole Game's
  _junior version of the whole_, _making the game worth playing_,
  _working on the hard parts_). The principles in these clusters are
  this curriculum's practitioner-form of those commitments on a
  specific surface (JEJ + V/F + 5 layers + spiderweb).
- **Stance & values cluster** → integrated by **companion pedagogy**:
  the educator-as-companion lineage running through Open Education,
  community of practice, decolonised CS, and accessibility — the
  elewa.education / Greg Wilson / Mikhak-pedagogy line. The teacher
  walks alongside the learner rather than standing in front of them;
  authority is plural, distributed across classroom, collegial,
  partnered, and discourse communities. 4C/ID is silent on these.

**Transfer Paradox + Reusability Paradox — related but distinct
principles**:

- **Transfer Paradox** (Van Merriënboer) — _pedagogy_ register. In
  §B.1. _"Methods that work best for reaching isolated, specific
  objectives are not best for reaching integrated objectives and
  transfer of learning."_
- **Reusability Paradox** (Wiley) — _grouping and publishing_ register.
  In §B.2. Smaller learning objects are more reusable; larger ones more
  pedagogically coherent.

Both name a productive tension of the same general shape, but the
goal-being-optimized-against differs (transfer of learning vs
shareability of artifacts). Different aspects of the same whole.

> **Beware lazy conflations.** Concepts with surface similarity often
> aren't the same operationally. Transfer Paradox (pedagogy) and
> Reusability Paradox (publishing / grouping) are related but not the
> same. Check before collapsing.

---

### B.1 Cogsci mechanisms

How the curriculum is designed to work _for the human mind learning_.

#### §5 Pedagogical sampling

Bayesian frame: humans, from infancy onward, draw fundamentally
different inferences from data chosen intentionally by a teacher than
from data encountered at random or sampled by the learner themselves.

**A curated curriculum is qualitatively different from free
self-directed learning.** An LLM responding to learner-directed prompts
is closer to self-directed sampling than to pedagogical sampling. Some
of what this course teaches you to twin (the notional machine, users,
fellow developers, the LLM itself) are not facts to be acquired but
_ways of doing things_, learned through the doing.

Operates at multiple granularities:

| Instance                                                     | Granularity                                                                                                |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **PRIMM** (predict-run-investigate-modify-make)              | exercise level                                                                                             |
| **Block Model**                                              | code-element level (atoms / blocks / relationships / macro-structure × text-surface / execution / purpose) |
| **Spiral curriculum**                                        | language-feature scales, accumulating into automaticity                                                    |
| **Cognitive Load Theory** (intrinsic / extraneous / germane) | cognitive-budget level                                                                                     |
| **Study Lenses**                                             | internal-event level (what the NM is doing, made observable)                                               |
| **Just Enough JavaScript**                                   | language-feature surface — fewer features chosen deliberately                                              |
| **Errors-as-information**                                    | moment of model-divergence                                                                                 |
| **Snippetry** (Ch5)                                          | pedagogical sampling _for self_ — the learner becomes their own pedagogical sampler                        |

#### §6 The spiderweb curriculum + the spiral as traversal

A **paired entry**, not two separate principles.

- **Spiderweb** = the _structure_. Skills at the center (collaboration,
  communication, code review, planning); technologies as concentric
  rings outward (Markdown → HTML/CSS → JS → …); the skills thread
  through every ring. _"Places collaboration, communication and other
  'soft skills' unavoidably at the center. Places social and ethical
  questions center stage."_ (user)
- **Spiral** = a _traversal_ through the spiderweb. A particular path
  with sequenced skill threads. Bruner's spiral is the
  depth-densification mechanism; _this curriculum's spiral_ is the
  path-choice through the web.

**Spiderweb = topology; spiral = trajectory.** The 5 layers (ontology
§5) can be read as 5 different spirals through the same web at 5
engagement depths.

<details>
<summary><b>Visualization: spiderweb (topology) + spiral (trajectory)</b> <i>(most load-bearing — existing assets)</i></summary>

- `assets/curriculum-spider-web.svg` — the spiderweb topology
- `assets/spiral-curriculum.png` — Bruner-style spiral

These are the same conceptual object viewed differently.

</details>

#### §7 The Explorotron framework

Malaise & Signer (2023). The academic framework that `<StudyLenses>`
realizes at snippet scope.

**Two axes** (curated/uncurated × guided/unguided) → four quadrants:

|              | **Uncurated**                                                     | **Curated**                                                 |
| ------------ | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| **Unguided** | Q1 — learner pastes any snippet; default-fit lens recommendations | Q3 — curriculum author renders `<StudyLenses lens="..." />` |
| **Guided**   | Q2 — auto-generated path through recommended lenses               | Q4 — full curated sequence (LMS-owned at curricular scope)  |

**Pyramid** (Layer base → top):

1. Progress modelling (system-wide learner state) — LMS-owned
2. Lenses & defaults — `<StudyLenses>` Layer I
3. Path generation (auto-recommender) — future work
4. Manual recommendations (`lens` prop, per-fence cascade)
5. Manually crafted paths — deferred at snippet scope
6. Monitored learning (LMS-owned)

**Three load-bearing principles** from the paper:

- **Skill transfer** (Chiaburu & Marinova 2005) — learn skills in
  environments close to where they'll be used. Lenses live in the same
  editor learners use for real work.
- **Expertise reversal** (Sweller et al. 2003) — scaffolding helps
  beginners but hurts experts. Lenses peel away support by context.
- **Lifelong-learning autonomy** — Quadrant I (uncurated/unguided)
  isn't a fallback; it's the central pedagogical bet. The Frogrammer's
  magnifying-glass kit is the embodied form.

**Begel & Ko (2019) both-yes answer** — should technology "structure
learning for learners" OR "teach learners to structure their own"?
Both. Quadrants I + II support learners structuring their own;
Quadrants III + IV support educators structuring it for them.

#### §8 Threshold concepts + liminality

From `effective-learning/05-being-in-between.md` and Meyer/Land. Five
characteristics of threshold concepts:

- **Transformative** — after mastery, you perceive the world in a new
  way
- **Integrative** — the pattern used to weave thread into fabric
- **Irreversible** — changes in how the mind processes information
- **Bounded** — different approaches define different vocations
- **Troublesome** — ways of doing things, not the thing you do

**Liminal zone** = legitimate position, not failure. _"Be prepared to
spend a lot of time floating between the certainty of old knowledge
and the promise of new understanding."_

Programming threshold concepts cited by the user (incomplete list):
Source Code vs Runtime; Tracing Code; Variables and Pointers; Functions
(definition vs execution; are objects AND executable procedures; scope
vs context); OOP; Asynchronous Execution.

#### §9 Transfer Paradox (separate from §10 — different operational meaning)

> _"Methods that work best for reaching isolated, specific objectives
> are not best for reaching integrated objectives and transfer of
> learning."_ — Van Merriënboer & de Croock (1997)

About _how learning transfers across contexts_. Holistic design (4C/ID)
takes this into account by ensuring students confronted with new
problems have BOTH specific knowledge for familiar aspects AND general
abstract knowledge for unfamiliar aspects.

---

### B.2 Course-construction

How the curriculum's artifact is constructed and shaped.

#### §10 Reusability Paradox (separate from §9 — different operational meaning)

Wiley. _"Can you imagine wanting to teach some portion of this topic
without teaching the other parts?"_ If no, all the subtopics belong to
one learning object.

About _how learning artifacts are bundled and shared_. The more
reusable a learning object, the less educational in any specific
setting; the more contextual, the less reusable. Points outward toward
§B.3 stance & values (via Open Education + Forkability).

**The Reusability Paradox is not a problem to solve — it's the
productive tension the course lives inside.** `just-enough/javascript/`
(the JEJ chain; see `syllabus.study-lenses.md`) is the reusable
infrastructure side; the manifesto / ontology / chapters are the
opinionated content side. The
course is what happens when the opinionated content uses the reusable
infrastructure.

#### §11 Course-as-Quine

The curriculum's tooling simplicity (lenses.json, JS, markdown,
Docusaurus + simple lens plugin) IS a pedagogical commitment.

> **A learner who finishes the course has all the technical and
> conceptual background to teach and extend the course.**

Light mention in syllabus body as ethos. Remix instructions in course
appendix. Forks mechanism deferred — first get one version out,
reassess later.

The platform-agnostic constraint (markdown + lenses) is consonant:
anyone can fork from plain markdown.

#### §12-bis Code is content / Code is the UI

(Listed here for the design-principle-level claim; mechanism in
ontology §9.)

Source code is _the control panel through which the programmer
operates the NM_. LLM prompting is an alternative way to operate the
same panel.

Ch4 framing: **"code is content, not deliverable."** AI-generated code
is material to study, not work-product to ship.

The principle is shared between this curriculum and
`just-enough/javascript/`'s README — it's an org-wide commitment, not a
Ch4-only flourish.

#### §12-ter Full Complexity, Max Simplicity

Start with all the large moving parts (rhetorics of programming,
collaboration, the full system context) at simplest technical depth.
4CID-inspired. _Pebble-in-the-pond_ (Merrill) — content-centered start
with a whole task at simplest depth.

#### §12-quater Explicitly Teach the Implicit

Name the skills experts take for granted. Don't leave implicit skills
to chance trial-and-error. Both _supportive information_ (the
variable, strategic parts) and _procedural information_ (the routine,
rule-based parts) made explicit.

#### §12-quinque Process Over Product

Focus on the steps the learner takes, not the deliverable. Explicit
processes accommodate learners of different levels in one room — same
process applied to projects of different complexity.

#### §12-sex Name Things

Naming things — especially tiny things experienced programmers take
for granted — legitimizes them as worth learning. Different levels of
abstraction (ATT levels, PBIS, Block Model, SOLO Taxonomy) all benefit
from being named.

---

### B.3 Stance & values

How the curriculum approaches learners and community. Integrated by
**companion pedagogy** — the educator-as-companion lineage that runs
through Open Education, community of practice, decolonised CS, and
accessibility. The teacher walks alongside the learner; authority is
plural and the plural is wide.

| Principle                                    | Source                                            | Brief                                                                                                                                                                      |
| -------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Learner Trust comes first**                | `Learner Trust.md`                                | Meet learners where they are. Trust as currency for asking learners to do hard, non-immediately-tangible work (reading, tracing, summarizing).                             |
| **Open Education** (≠ Open Source)           | `Open Source !== Open Education.md`               | Open Education = OER + OEP that the _directly-involved_ (teachers, students, parents, employers) can realistically adapt and contextualize within their constraints.       |
| **Open, Useful, Usable, Used**               | `Open, Useful, Usable, Used.md`                   | The four-test for open educational resources.                                                                                                                              |
| **Learner-Accessible OER**                   | `Learner-Accessible OER.md`                       | The strongest form — materials a learner could realistically understand and modify for their context.                                                                      |
| **Forkability**                              | `Forkability.md`                                  | The operational measure of the Open Source → Open Education transition. Barriers between "fork" button and adapting to your context.                                       |
| **Context is Content**                       | `Context is Content.md`                           | Where and how a learner studies is itself a learning objective. Align study workflows with realistic workflows.                                                            |
| **Wear Hats, not Titles**                    | `Wear Hats, not Titles.md`                        | Roles are situational, plural, context-dependent — not identity. V/F precursor.                                                                                            |
| **Fluid roles**                              | `Making Best Practice Common Practice.md`         | learner / companion / teacher / accounta-buddy — every individual takes on most or all roles in the course of a single day. The course supports all four on equal footing. |
| **Greg Wilson's Rules**                      | `Teaching Tech Together___The Rules.md`           | "Be kind: all else is details." / "Remember you are not your learners." / "Never teach alone." / "Make every mistake a lesson." / etc.                                     |
| **Connections are Concepts (as method)**     | `Connections are Concepts.md`                     | The foundational principle as a methodology for deciding what to teach — when defining LOs, this framing helps you avoid hand-waving away tricky connecting concepts.      |
| **Time is Importance**                       | `Time is Importance.md`                           | Making time for something sends the implicit message that it's important. Less can be more.                                                                                |
| **Accessibility commitments**                | `Accessible Programming.md`                       | Spoons / disability accommodation; tabs-not-spaces for screen readers; blocks-based languages; programming and learning CS when legally blind.                             |
| **Decolonised CS framing**                   | `Social Dreaming Together…` (SIGCSE 2023)         | Re-envisioning whose computing experiences shape the discipline.                                                                                                           |
| **PRIMM-based micromaterials for inclusion** | `Breaking the Code of Inclusion.md` (FOSDEM 2023) | Open-source micromaterials supporting groups underrepresented in programming education.                                                                                    |

The compact bulleted version of these principles also appears in
"First Principles" above; the table here is the detailed source-and-brief
catalog. Both are valid views of the same set of commitments.

---

## Reading frameworks — PBIS, static/dynamic (migrated from ontology §12)

### PBIS — flexible vocabulary, not a sequence

**PBIS** (canonical letter-order; **NOT PBSI**): Purpose / Behavior /
Implementation / Strategy. Four meaningful vocabulary words applied at
different zones, levels, and moments.

- **Purpose** — context-encompassing. Why this exists, for whom, in
  what world. Not "first in a sequence" but "the field everything else
  operates within."
- **Behavior** — what's observable; user-side effect AND
  mechanism-side effect; same observable, two readings.
- **Implementation** — the literal made-thing. Code, structure,
  configuration, hardware choices.
- **Strategy** — patterns and abstractions the implementation
  instances. Can manifest at different levels (UI strategy,
  algorithmic strategy, architectural strategy, user-research
  strategy).

**No canonical ordering.** P doesn't precede B doesn't precede I
doesn't precede S. Different kinds of analysis foreground different
vocabulary subsets. PBIS is a _vocabulary strand_, not a _sequence_.

**No canonical "trading zone."** Any of P/B/S/I can be a meeting point
depending on the moment.

### PBIS through the metaphor (concentric scopes)

From `narrative/README.md` §15: reading code well means holding all
four layers simultaneously. Perspective stacking (ontology §6)
operationalized.

```text
┌─── PURPOSE ─────────────────────────────────────┐
│ (why the piece exists; who it's for)            │
│  ┌── BEHAVIOR ──────────────────────────────┐   │
│  │ (what the audience hears and feels)       │   │
│  │  ┌── STRATEGY ────────────────────────┐   │   │
│  │  │ (the compositional approach)        │   │   │
│  │  │  ┌── IMPLEMENTATION ──────────┐    │   │   │
│  │  │  │ (specific notes / score)    │    │   │   │
│  │  │  └──────────────────────────────┘    │   │   │
│  │  └────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

### Static vs Dynamic

Foundational conceptual distinction (Ch1 introduces it):

- **Static**: source code (text). Comments live here. Developer reads
  this without running the program.
- **Dynamic**: program evaluation (runtime). Logs are observed here.
  The NM does its work here.

Setting up the dev-twin: the developer who reads code sees the static
text, not the runtime. Understanding this distinction is prerequisite
to understanding why comments and logs serve different purposes.

### Code is content, not deliverable (Ch4 framing)

Cross-link to ontology §9. In Ch4, LLM-generated code is _material to
study_, not work-product to ship. This is what keeps the chapter
pedagogical rather than productivity-oriented.

---

## Further sections (TBD — Wave 3 continuation)

The following sections are scaffolded but await full prose development.
The skeleton commits in Wave 2 listed them as Wave-3 targets; this
commit (3a) lands the first one (How Learning Happens). The remaining
items below will be developed in subsequent Wave-3 commits and in the
ontology↔pedagogy audit pass (3d):

- Scaffolding patterns: PRIMM, Block Model, PBIS (Purpose / Behavior /
  Implementation / Strategy — the four-level reading framework
  introduced in Ch3), Study Lenses, Cognitive Load, JEJ,
  errors-as-information, Snippetry (the names are introduced in the
  scaffolding bullets above; full per-pattern treatment lives here
  when developed)
- Sequence: when each concept first lands (the ladder), how it deepens
  (the spiral)
- Exercise patterns per strand (§6) and per stratum (§8)
- Methods for introducing the three roles of agential AI (§10)
- The pedagogy ↔ ontology seam, ongoing — the audit pass scheduled at
  3d will move how-it's-taught content from `syllabus.ontology.md`
  into the appropriate sections of this file
