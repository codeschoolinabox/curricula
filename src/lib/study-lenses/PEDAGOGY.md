<!-- cspell:ignore Schulte Explorotron Chiaburu Marinova Begel -->
<!-- cspell:ignore liminality PBSI frontierland wuzzles socratizing -->
<!-- cspell:ignore Malaise Signer Sweller Vibetoader Frogrammer -->
<!-- cspell:ignore Carsten granularities linearization automaticity -->
<!-- cspell:ignore affordances Yoshi wireframes PBIS operationalized -->
<!-- cspell:ignore prestructural Cutts Esper Fecho denepo -->

# The pedagogical foundation

The pedagogy this package's study utilities build on — one statement of the
theory, package-wide. Lenses, question engines, evaluators, and any future
recommender ground their designs here; each kind's own docs carry only that
kind's interpretation and application of it.

- [The BLOCK model of program comprehension](#the-block-model-of-program-comprehension)
  — [the model](#the-model-schulte-2008) ·
  [three vocabularies, two axes](#three-vocabularies-two-axes) ·
  [the linearization](#the-five-level-linearization) ·
  [the 3D space](#the-3d-block-model-space-recommender-extension)
- [Progression: layers, depth, thresholds](#progression-layers-depth-thresholds)
  — [the 5 layers](#the-5-layers) ·
  [SOLO within each layer](#solo-applies-within-each-layer) ·
  [L4 as questioning](#l4-as-questioning-not-theory-mastery) ·
  [threshold concepts](#threshold-concepts-and-liminality)
- [Meeting the learner: the Explorotron framework](#meeting-the-learner-the-explorotron-framework)
  — [quadrants](#two-axes-four-quadrants) · [pyramid](#the-pyramid) ·
  [principles](#three-load-bearing-principles) ·
  [both ways](#structuring-learning-both-ways)
- [Vocabularies: registers and reading frames](#vocabularies-registers-and-reading-frames)
  — [the 5-tier ATT](#the-5-tier-att) ·
  [static and dynamic](#static-and-dynamic) ·
  [PBSI](#pbsi--flexible-vocabulary-not-a-sequence) ·
  [computational axes](#computational-vocabulary-axes)

## The BLOCK model of program comprehension

### The model (Schulte 2008)

Carsten Schulte's Block Model of Program Comprehension
([DOI: 10.1145/1404520.1404535](https://doi.org/10.1145/1404520.1404535))
proposes an educational model of program comprehension structured along two
dimensions: **levels of abstraction** (text surface → program execution →
understanding function/purpose) and **scope** (atoms → blocks → relations →
macro-structure). It was evaluated in a qualitative study with prospective CS
teachers designing lessons, and it is intentionally simple, so that even
teaching novices can use it for lesson planning. What it provides is a shared
vocabulary for what "understanding code" actually means at different
granularities.

This package's grid vocabulary names the paper's two axes differently — the word
"dimension" changes referent between the two sentences that follow, and
[§ Three vocabularies, two axes](#three-vocabularies-two-axes) resolves the
collision. The grid crosses three **dimensions** with four **levels** — twelve
cells:

| Dimension      | Gloss                                          |
| -------------- | ---------------------------------------------- |
| `text-surface` | the written code — syntax, layout, naming      |
| `execution`    | what happens at runtime — data flow, state     |
| `purpose`      | why the code exists — intent, design rationale |

| Level      | Gloss                                                                      |
| ---------- | -------------------------------------------------------------------------- |
| `atom`     | individual language elements (a single statement, operator, or identifier) |
| `block`    | a coherent group of statements achieving a sub-task                        |
| `relation` | connections between blocks (data / control flow)                           |
| `macro`    | the overall program                                                        |

The twelve cells, with a compositional gloss apiece — each is one kind of
comprehension work a study utility can aim at:

| Cell       | `text-surface`              | `execution`                           | `purpose`                           |
| ---------- | --------------------------- | ------------------------------------- | ----------------------------------- |
| `atom`     | read one element as written | what one element does at runtime      | why this element is here            |
| `block`    | read a group as one unit    | trace a sub-task's runtime effect     | what the group achieves             |
| `relation` | see the links on the page   | follow data and control across blocks | why the parts are arranged this way |
| `macro`    | the whole text's shape      | the program's runtime story           | the program's point                 |

### Three vocabularies, two axes

Three vocabularies name the same two axes, and they collide:

| Schulte 2008 (the paper)                                                        | The package grid                                                | The 3D space (below) |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------- |
| **levels of abstraction** — text surface → program execution → function/purpose | the **dimension** axis (`text-surface`, `execution`, `purpose`) | **Level**            |
| **scope** — atoms → blocks → relations → macro-structure                        | the **level** axis (`atom`, `block`, `relation`, `macro`)       | **Scope**            |

The treacherous swap: the paper's _levels_ are the grid's **dimension** axis,
and the paper's _scope_ is the grid's **level** axis. The 3D space follows the
paper's words; the grid follows the engines'. Any bridge between coordinate
vocabularies is a mapping, never a rename.

One more sense of "level" lives outside this table: unqualified "level"
elsewhere in the package usually means a **language level** — a curated slice of
JavaScript owned by the language-levels region. The questioning region's README
§ Leveling resolves the full homonym where the vocabularies meet.

### The five-level linearization

The 12-cell matrix is a coordinate system, not a progression — nothing in it
says what comes first. Where a consumer needs one ordered vocabulary (filtering
items, matching the curriculum's skill progression), the matrix flattens into
the five-value `Level` linearization: `syntax`, `semantics`, `connections`,
`goals`, `userExperience`. A single item can span multiple levels. The fifth
value projects an item's _audience_ rather than any grid cell — one reason the
linearization is a consumer surface, not a grid axis. The grid stays the ground
truth; the linearization is a view of it.

### The 3D Block Model space (recommender extension)

The Block Model — referenced in the curriculum's `exercise-types.md` — describes
comprehension across two dimensions; the deprecated architecture's recommender
extended it to **three** as its organizing space:

1. **Level** — text surface → program execution → function/purpose
2. **Scope** — atoms → blocks → relations → macro
3. **NM components** — the 10 step categories from the syntax tracer's step
   vocabulary (`expression`, `resolve`, `statement`, `scope`, `control-flow`,
   `initialization`, `for-init`, `write`, `emit`, `error`). **Unordered set** —
   no ordinal "level" is derived from this dimension.

The third dimension is unordered for a deliberate reason: NM components don't
compose into a single learning progression. A snippet with `expression` +
`resolve` isn't "earlier" than one with `scope` + `control-flow`; they're
different teaching opportunities. The spiral comes from **(a)** lens-config
variation across snippets (a `blanks` lens configured for keywords vs. operators
vs. control-flow reads differently at each configuration) and **(b)**
curriculum-author-imposed ordering of category-filtered recommendations, chosen
pedagogically rather than enforced by the NM model.

**Vocabulary bridge** (the axis words collide): the space's "Level" runs over
the same ground as the grid's **dimension** axis, and the space's "Scope" over
the grid's **level** axis. That axis-name swap is one reason the space's cell
type (`BlockModelCell`, dropped with the deprecated recommender) relates to the
questioning region's `BlockCell` by mapping, never by rename. No type for the 3D
space exists in the package; the space is carried documentation truth for the
future recommender layer.

## Progression: layers, depth, thresholds

### The 5 layers

The curriculum's layers are _engagement depths_ a reader can stay at or descend
through; every chapter of the curriculum runs all five. **A learner who stays at
L1 graduates well; a learner who revisits at L3 finds more; a learner who
re-encounters at L4 finds more again.** Each layer is a complete exit point.

> **Meta learning objective unifying all 5 layers**: _intellectual agency_. Each
> layer is intellectual agency at a different scale.

| Layer  | Frame                | Meta-objective (intellectual agency over…) | Primary objective                                                                                                                                            | Learned through                                                                                               |
| ------ | -------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **L0** | Embody / Mastery     | …the notional machine                      | Predictive mastery of the event-based JS NM                                                                                                                  | embody + predictive lenses                                                                                    |
| **L1** | Apply / Rhetoric     | …communicative production                  | Context-aware comprehension, discussion, production across three audiences                                                                                   | embody + static and analytical lenses, reflection questions, program comparison, case studies, process guides |
| **L2** | Switch / Methodology | …methodology choice                        | Switch comfortably between V and F hats; comfort with design + computational thinking                                                                        | process guides, case studies, open-ended exercises, discussion questions, external resources                  |
| **L3** | Explore / Snippetry  | …the medium itself                         | Programming automaticity; exploring concepts/domains _through_ programming; self-directed exploration                                                        | snippetry, remixing, esoteric prompts (quines, wuzzles, cross-medium translations)                            |
| **L4** | Wonder / Philosophy  | …the questions themselves                  | Inhabit the frontier where confirmable science gives way to philosophical questioning; ask the big questions with methodological rigour — not theory-mastery | easter eggs in main text; side/footnotes; references; open questions and methods for asking them              |

Each of the curriculum's five strands pairs its operational work with a
philosophy reading that opens at L4 — active inference for twinning, authorship
and free will for decisions, phenomenology for perspective stacking, systems
thinking for the whole rhetorical situation, ecological psychology for
affordances. The named traditions are entry-points into questioning, not a
syllabus to master; the pairing table lives with the curriculum.

### SOLO applies within each layer

SOLO taxonomy (Pre-Structural / Uni-Structural / Multi-Structural / Relational /
Extended-Abstract — levels of conceptual integration, prestructural through to
network-of-connected-concepts) applies _within_ each layer, not across them. A
learner at L0 can be Pre-Structural through Extended-Abstract on the NM; same
span at L1, L2, L3, L4. The layers are _kinds_ of work; SOLO is _depth_ within
each kind. The cross-product is a 5×5 reading: layer × SOLO-depth — useful for
diagnosis and for designing exercises that meet a learner where they are at a
given layer.

### L4 as questioning, not theory-mastery

L4 is the layer where the curriculum reaches the edge of confirmable science and
crosses into frontierland between philosophy and evidence. The teaching contract
changes accordingly:

- **LOs are questionings, not facts.** A well-formed L4 learning objective opens
  an inquiry the learner stays with — _"Notice X," "Encounter the question Y,"
  "What would Z mean for W?"_ — not a thesis to recite.
- **The goal is not theory-currency.** L4 does not aim to bring learners up to
  date with the latest names in active inference, embodied cognition, or
  phenomenology. The named traditions (see [§ The 5 layers](#the-5-layers)) are
  entry-points into the strand's philosophical questioning, not destinations.
- **Methodological rigour applies even at the frontier.** Questions on the
  science-philosophy edge can be asked well or badly. Part of L4's contract is
  teaching learners _how_ to ask big questions: distinguishing the empirically
  testable from the genuinely open, treating named traditions as positions to
  interrogate rather than authorities to defer to, holding multiple framings
  simultaneously without collapsing to one prematurely.
- **Easter-egg form serves the stance.** L4's marginal placement (footnotes,
  side notes, references) is a pedagogical signal: this is optional,
  attuned-reader territory; engagement is invitation, not obligation. The form
  itself models that the questions belong to the reader, not to the curriculum.

### Threshold concepts and liminality

After Meyer & Land, five characteristics of threshold concepts:

- **Transformative** — after mastery, you perceive the world in a new way
- **Integrative** — the pattern used to weave thread into fabric
- **Irreversible** — changes in how the mind processes information
- **Bounded** — different approaches define different vocations
- **Troublesome** — ways of doing things, not the thing you do

**Liminal zone** = legitimate position, not failure. As the curriculum's
study-tips material puts it: _"Be prepared to spend a lot of time floating
between the certainty of old knowledge and the promise of new understanding."_

Programming threshold concepts (an incomplete list, from the same study-tips
material): Source Code vs Runtime; Tracing Code; Variables and Pointers;
Functions (definition vs execution; are objects AND executable procedures; scope
vs context); OOP; Asynchronous Execution.

## Meeting the learner: the Explorotron framework

Yoshi Malaise and Beat Signer (2023), _Explorotron: An IDE Extension for Guided
and Independent Code Exploration and Learning_
([PDF](https://wise.vub.ac.be/sites/default/files/publications/Malaise_KoliCalling2023.pdf))
— the academic framework this package realizes at snippet scope. The deployed
Study Lenses ([denepo.js.org/study-lenses](https://denepo.js.org/study-lenses))
is the framework's working realization.

### Two axes, four quadrants

Two axes (curated/uncurated × guided/unguided) give four quadrants:

|              | **Uncurated**                                                     | **Curated**                                                 |
| ------------ | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| **Unguided** | Q1 — learner pastes any snippet; default-fit lens recommendations | Q3 — curriculum author renders `<StudyLenses lens="..." />` |
| **Guided**   | Q2 — auto-generated path through recommended lenses               | Q4 — full curated sequence (LMS-owned at curricular scope)  |

The guided quadrants name a durable affordance: machinery that chooses and
sequences what to put in front of a learner. At snippet scope that is the shape
a questioner or recommender draws on when it composes items into a path; at
curricular scope the sequencing belongs to the embedding environment.

### The pyramid

![Figure 2 from Malaise & Signer (2023): (a) Quadrants of learning along curated/uncurated × guided/unguided axes; (b) Layered pyramid of learning tools, from progress modelling at the base to monitored learning at the top.](./explorotron-quadrants-and-pyramid.png)

From base to top:

1. Progress modelling (system-wide learner state) — LMS-owned
2. Lenses & defaults — this package's lens kit
3. Path generation — an automatic recommender's territory
4. Manual recommendations (`lens` prop, per-fence cascade)
5. Manually crafted paths — curricular scope, not snippet scope
6. Monitored learning — LMS-owned

### Three load-bearing principles

Three of the paper's principles are load-bearing:

- **Skill transfer** (Chiaburu & Marinova 2005) — learn skills in environments
  close to where they'll be used. Lenses live in the same editor learners use
  for real work.
- **Expertise reversal** (Sweller et al. 2003) — scaffolding helps beginners but
  hurts experts. Lenses peel away support by context.
- **Lifelong-learning autonomy** — Quadrant I (uncurated/unguided) isn't a
  fallback; it's the central pedagogical bet. The Frogrammer's magnifying-glass
  kit is the embodied form.

### Structuring learning, both ways

**Begel & Ko (2019) both-yes answer** — should technology "structure learning
for learners" OR "teach learners to structure their own"? Both. Quadrants I + II
support learners structuring their own; Quadrants III + IV support educators
structuring it for them.

## Vocabularies: registers and reading frames

### The 5-tier ATT

The curriculum's five-tier Abstraction Transition Taxonomy — after Cutts, Esper,
Fecho, Foster & Simon (2012;
[DOI: 10.1145/2361276.2361290](https://doi.org/10.1145/2361276.2361290)), whose
original taxonomy names three levels — names the linguistic registers: the
vocabularies, phrasings, and notations practitioners use. The five tiers
correspond 1:1 to the curriculum's five chain-points, the stations running from
real-world context down to CS theory. Each tier is a _-speak_: a register
practitioners emit when their attention is at a given chain-point and they're
describing, predicting, or designing what lives there.

V and F are the curriculum's two personae, the package's two hats: V the
Vibetoader (🎨), grounded in the user; F the Frogrammer (🔬), grounded in the
notional machine.

| Tier                       | Speak (linguistic register)                                                                                                              | Who works it                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Real-world context**     | **Context-speak** — English about world, situations, communities, sociocultural conditions; user-research and ethnographic vocabulary    | V's reach-point; deepens beyond the curriculum |
| **User**                   | **User-speak** — personas, user stories, journey and interaction vocabulary, accessibility registers; what V emits when twinning a user  | 🎨 V (V's twin-position)                       |
| **Computational artifact** | **Artifact-speak** — code-as-text + machine internals; static (code text) and dynamic (NM events) faces of the made-thing                | both V and F engage                            |
| **Notional machine**       | **NM-speak** — operational vocabulary: events, scopes, evaluation steps, predict-trace-verify language; what F emits when twinning an NM | 🔬 F (F's twin-position)                       |
| **CS / theory**            | **CS-speak** — formal proofs, complexity classes, type theory, lambda calculus, formal verification                                      | F's reach-point; deepens beyond the curriculum |

**Bridging practices traverse tier-subsets.** The curriculum's two bridging
practices are not tiers themselves — they are cross-cutting movements that
**traverse** subsets of tiers, emitting vocabulary at multiple tiers as they
range across them. They overlap at artifact-speak, the trading zone where V and
F structurally meet.

- **Design thinking** traverses _context-speak ↔ user-speak ↔ artifact-speak_.
  Its working vocabularies include sketches, personas, user stories, wireframes,
  storyboards, design-system specs, user-research notation — emitted at
  different tiers along its range (wireframes and storyboards near
  artifact-speak; personas and user-research notation near user-speak and
  context-speak).
- **Computational thinking** traverses _artifact-speak ↔ NM-speak ↔ CS-speak_.
  Its working vocabularies include algorithmic reasoning, operational tracing,
  big-O arguments, correctness vocabulary — emitted at different tiers along its
  range (operational tracing near NM-speak; big-O and formal correctness near
  CS-speak).

**Artifact-speak's static and dynamic faces.** Artifact-speak contains two
register-modes within a single tier: a **static face** (code-as-text — what's
read on the page) and a **dynamic face** (machine internals / NM events — what's
read at runtime). Both faces belong to artifact-speak; the split sits inside the
central tier rather than between tiers.

### Static and dynamic

A foundational conceptual distinction:

- **Static**: source code (text). Comments live here. Developer reads this
  without running the program.
- **Dynamic**: program evaluation (runtime). Logs are observed here. The NM does
  its work here.

Setting up the dev-twin: the developer who reads code sees the static text, not
the runtime. Understanding this distinction is prerequisite to understanding why
comments and logs serve different purposes.

### PBSI — flexible vocabulary, not a sequence

**PBSI**: Purpose / Behavior / Strategy / Implementation. Four meaningful
vocabulary words applied at different zones, levels, and moments.

The package's canonical letter-order is **PBSI**, matching its typed source of
truth (the open question engine's `PBSILevel`:
`purpose | behavior | strategy | implementation`). The curriculum's pedagogy
file declares the other ordering (PBIS) canonical in bold; the package order
knowingly overrides that declaration (maintainer ruling, 2026-08-12).

- **Purpose** — context-encompassing. Why this exists, for whom, in what world.
  Not "first in a sequence" but "the field everything else operates within."
- **Behavior** — what's observable; user-side effect AND mechanism-side effect;
  same observable, two readings.
- **Strategy** — patterns and abstractions the implementation instances. Can
  manifest at different levels (UI strategy, algorithmic strategy, architectural
  strategy, user-research strategy).
- **Implementation** — the literal made-thing. Code, structure, configuration,
  hardware choices.

**No canonical ordering.** P doesn't precede B doesn't precede S doesn't precede
I. Different kinds of analysis foreground different vocabulary subsets. PBSI is
a _vocabulary strand_, not a _sequence_.

**No canonical "trading zone."** Any of P/B/S/I can be a meeting point depending
on the moment.

**PBSI as concentric scopes.** Reading code well means holding all four scopes
simultaneously — the curriculum's perspective-stacking practice operationalized,
here through its performance metaphor:

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

### Computational vocabulary axes

Four orthogonal axes — distinct ways of carving the programming space:

| Term                     | What it means                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Programming paradigm** | A design philosophy for organizing programs (imperative / functional / OOP / declarative)                                   |
| **Computational domain** | What you are computing _about_ — medicine, finance, games, etc. Domain expertise is a separate axis from programming skill. |
| **Computational idiom**  | Types of operators/operations available within a language (logic, strings, numbers, regex, bits, dates)                     |
| **Model of computation** | A formal mathematical framework defining what computation _is_ (Turing machines, lambda calculus)                           |

**Orthogonality test**: when you encounter a new concept, ask — is this about
how I organize my program (paradigm)? about what I'm computing about (domain)?
about what computation fundamentally is (model)? about what kinds of operations
I'm using (idiom)?

**JS as multi-paradigmatic over one NM.** JS is multi-paradigm syntactically.
But it runs ONE notional machine: procedural + prototypes. When you write
"OOP-style" JS, the machine underneath is still producing the same events.
Languages designed _for_ a paradigm (Haskell, Smalltalk, Java) have genuinely
different NMs and different event vocabularies.

**Paradigm choices are partly about which event vocabulary you want to think
in.** And one NM is the ground under the 3D space's third axis: JavaScript
running a single notional machine is what makes one unordered NM-components
dimension coherent
([§ The 3D Block Model space](#the-3d-block-model-space-recommender-extension)).
