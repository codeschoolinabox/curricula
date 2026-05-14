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

## Using the 5 layers (§12 of ontology) in teaching

The 5 layers (§12 of `syllabus.ontology.md`) are named there as the
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

### Layer titles (working candidates; not locked)

Three styles brainstormed; defer until ontology stabilizes:

- **Verb-style (action)**: Embody / Apply / Switch / Explore / Wonder
- **Noun-style (state)**: Mastery / Rhetoric / Methodology / Snippetry /
  Philosophy
- **Hybrid (verb-as-name + noun-as-meta-objective)**: "Embody to gain Mastery";
  "Apply to develop Rhetoric"; "Switch to gain Methodology"; "Explore through
  Snippetry"; "Wonder at Philosophy"

---

## The pedagogical claim from Friston (ontology §16)

Ontology §16 establishes Friston's "A Duet for One" framing — active
inference applied to dyadic communication; understanding-as-alignment
of generative models. The pedagogical consequence:

> **AI generates; it doesn't twin. Your job is to twin the LLM AND what the LLM
> is twinning, to detect and correct divergences — and to relish productive
> divergences.**

**Same skill, two layers**:

- L2 = defensive (detect/correct misalignment; manage hallucinations)
- L3 = offensive (use misalignment for creative discovery)

---

## Lenses, embody, and substrate ↔ pedagogy mutual constitution (ontology §24)

The JEJ chain (`just-enough/javascript/` + `embody/` + Study Lenses +
orchestrator) is named and described in ontology §24 as infrastructure.
This file carries the principles by which that infrastructure is
pedagogy-shaped:

### Lenses are F-pedagogy infrastructure

> _"Lenses are to help LEARN F territory; they are not a tool for V's."_

The Mikhak data/interaction architectural pattern is V/F-neutral; the
curriculum's _application_ of the pattern (embody-as-data, lenses-as-experience)
is F-specific. Don't conflate the architectural pattern with the V/F mapping.

### Substrate ↔ pedagogy mutual constitution

The infrastructure _embodies_ the pedagogy:

- lenses literally **are** the Frogrammer's magnifying glasses (ontology §3)
- embody literally **is** the NM crystallized for exploration
- the JEJ language constraint **is** the cognitive-load discipline (ontology §B.1)
- the orchestrator **is** the Explorotron framework's snippet-scope realization

The opposite is also true: the pedagogy is shaped by what the infrastructure can
afford. V/F feedback loop in operational form.

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
- Exercise patterns per strand (§13) and per stratum (§17)
- Methods for introducing the three roles of agential AI (§19)
- The pedagogy ↔ ontology seam, ongoing — the audit pass scheduled at
  3d will move how-it's-taught content from `syllabus.ontology.md`
  into the appropriate sections of this file
