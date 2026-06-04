# Welcome to Frogramming — A Manifesto for Curriculum Authors, Forkers, and Contributors

> Addressed to **you** — the person teaching with this material, adapting it for
> your context, or extending it. The _why_ of the course's design commitments,
> from the author's chair.
>
> Companions (siblings, by co-location):
>
> - `ontology.md` — the _what_ (reference framework)
> - `chapters.md` — the _how_ at chapter grain
> - `guide.learners.md` — the _why_ addressed to learners
> - `guide.community.md` — the _why_ addressed to partner communities, mentors,
>   cohort hosts
> - `study-lenses.md` — the technical-reader companion for the JEJ → NM → embody
>   → lenses → orchestrator infrastructure
>
> **Status**: end-state document. Content is open to iteration.
>
> **Note**: the H1 heading still reads "A Manifesto for..." by design. Filename
> renamed (`manifesto.{role}.md` → `guide.{role}.md`) in Wave 2 of the syllabus
> corpus restructure; title and prose register migrate to "guide" form in Wave
> 3, when vision-flavored content moves into `manifesto.md` and this file gains
> its practical-guidance register.

---

## Why you're here

You're picking up a curriculum that someone else made — and someone else, before
them, and someone else before them. Maybe you're going to teach it. Maybe you're
going to adapt it for a class that needs a different language, a different
scope, a different population. Maybe you're going to fork it, change the parts
that don't fit your context, and run it as something of your own.

This manifesto tells you what the curriculum is committed to — and what you
should preserve when you adapt it. It tells you what the curriculum is **not**
committed to — the parts you can change without changing the thing.

The first commitment is that this distinction is _yours to draw_. We will tell
you what we think is load-bearing. You decide, in your context, with your
learners, what carries the weight.

---

## What the course is

A short version, for orientation:

> _Welcome to Frogramming_ is a self-paced JavaScript curriculum that treats
> programming as **collaborative communication**. Source code simultaneously
> addresses four audiences (developers, the computer, users, agents). The course
> teaches learners to recognize which audience they're addressing in any moment,
> to twin (build accurate mental models of) each one, and to direct their
> decisions so the code does what it's designed to do for each.

The course teaches a specific stance — **Frogramming** — in depth. The
Frogrammer is the developer who grounds their work in the notional machine of
their language: they predict what the machine will do, they trace its
evaluation, they verify divergence, and they direct it with precision. Alongside
Frogramming, the course honors **Vibetoading** — the practice of grounding work
in the user's experience and delegating the machine intentionally — as an
equally non-delegable companion practice (taught at gesture-level here; deeper
waters in _Welcome to Design_).

Both stances shoulder a non-delegable twin: the Frogrammer twins the notional
machine; the Vibetoader twins the user. **AI cannot have either twin for the
learner.** That is the operative consequence of the curriculum's first
foundational principle, and it propagates through every design decision below.

---

## What this curriculum is committed to (the load-bearing parts)

These are the commitments that, if removed, would change the thing into
something else. Preserve them.

### 1. The two foundational principles

> **AI can do many things FOR you. It cannot UNDERSTAND for you.**
>
> **Concepts are connections; connections are concepts. Learning is
> connection-making.**

These two principles ground everything. The first is what makes the mastery
contract operative (_"you have only mastered a skill when you can complete its
exercises without AI"_). The second is what makes the spiral / spiderweb
structure pedagogically meaningful (depth = density of connection-making, not
coverage of content).

If you're adapting this course and either principle no longer holds, something
else has happened — and the course's pedagogical claims will not transfer.

### 2. Intellectual agency as the meta learning objective

The course is **a manifesto for intellectual agency** in the era of generative
AI. Each layer (L0–L4) is intellectual agency at a different scale (over the NM
/ over communicative production / over methodology choice / over the medium
itself / over the philosophical questions).

This is the through-line. When you adapt the course, ask: does my adaptation
still build agency? Or does it accidentally substitute _comfort with
explanation_ for _experience of doing_? The first is a common failure mode of
LLM-era curriculum design. The second is what this curriculum is trying to
preserve.

### 3. Holistic-design ID (4C/ID + Whole Game)

The course's design principles are the practitioner-form of 4C/ID (Van
Merriënboer & Kirschner) integrated under Whole Game (Perkins). This is _not_ an
arbitrary commitment.

**Whole tasks of progressive complexity, with diminishing support, high
variability of practice.** Learners encounter the whole task — read input →
compute → produce output — from day one, at the simplest technical depth. Task
classes (chapters) sequence easy-to-difficult. Within a class, support
diminishes (the tracer is training wheels; prediction without it is the
graduation).

**Supportive information** (schema-building knowledge for the non-recurrent
parts) is the chapter prose, the design principles, the metaphor. **Procedural
information** (just-in-time instruction for the recurrent parts) is the inline
lens recommendations, the errors-as-information signals, the trace tables.
**Part-task practice** (targeted drill for recurrent skills) is the small
exercises with single-feature focus.

When you adapt: keep the whole-task commitment. Avoid the temptation to
decompose, isolate, and re-integrate. The Transfer Paradox says: methods
optimized for narrow objectives don't reach integrated objectives. The
Reusability Paradox says: smaller learning objects are more reusable but less
educational. Both apply here.

### 4. The spiderweb + spiral architecture

**Spiderweb** = the structure. Soft skills (collaboration, communication, code
review, planning, design thinking) at the center; technologies as concentric
rings outward.

**Spiral** = a traversal through the spiderweb with sequenced skill threads.
Bruner's spiral is the depth-densification mechanism; this course's spiral is
the path-choice through the web.

This structure is the answer to _"how do we make a learner feel they belong in
computing?"_ By placing the human skills at the center — and the technical
complexity as a journey outward through that human center — the course says,
from page one, _what you already are is already enough to enter here._

When you adapt: do not collapse the spiderweb. Resist the urge to put syntax at
the center. The course's stance on inclusion depends on this structural
commitment.

### 5. JEJ + the substrate chain

**Just Enough JavaScript** (JEJ) is the deliberately constrained language subset
for Chs 1–4: imperative programs that interact with users through text and
numbers, single-page-printable, traceable step-by-step. The constraint is
pedagogical. Ch5 lifts it.

The infrastructural chain that makes the pedagogy operational:

```text
JEJ → NM → embody → lenses → orchestrator
```

- **JEJ** — the language subset (what learners write)
- **NM** — the conceptual evaluation model (the learning objective — what
  learners twin)
- **embody** — operational embodiment of the NM (data + event streams; a
  _crystalline representation of the entire dynamic data lifecycle_ — "a static
  4D rendering of a 3D flowing river")
- **lenses** — pedagogical perspectives on the embodied NM (the Frogrammer's
  _kit of magnifying glasses_ 🔬)
- **orchestrator** — bridges the chain to the Explorotron framework's snippet
  scope

This chain is **infrastructure under the pedagogy, inspired by the pedagogy's
implications.** When you adapt: you can swap JEJ for a different language-level
constraint, but the chain's _shape_ — language subset / conceptual model /
operational embodiment / pedagogical perspectives / orchestration — is the
pattern that makes the course work. The LMS layer is _out_ of WtF's scope
(beyond the Quine-y / lens-y / web-standards-based philosophy).

### 6. Markdown + Study Lenses (no special platform features)

The course is designed to work in pure markdown + Study Lenses. **No special
platform features required.** This is a _Quine-y_ commitment — a learner who
finishes the course has everything they need to teach and extend it. The
forkability of the entire artifact is the strongest form of _Open Education_ in
Wiley's sense: not just open-source, but realistically adaptable by the people
who will use it.

When you adapt: keep markdown as the source of truth. Resist the urge to lock
content into platform-specific frameworks. If a learner can't fork the
curriculum without an engineering team, you've broken its Open Education
guarantee.

### 7. The five strands

| Strand                             | What it tracks                                                                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Twinning**                       | accurate mental models of processes outside one's own mind                                                                                            |
| **Decisions (micro and macro)**    | every keyword, name, operator, structure (micro) and every architectural choice, paradigm, program shape (macro) — where compositional voice develops |
| **Perspective stacking**           | holding multiple levels at once (syntax, what a line does, how parts connect, what the program is for, what the user experiences)                     |
| **The whole rhetorical situation** | the entire software context — users, developers, computer, product, environment, purpose                                                              |
| **Affordances**                    | relational properties between agent and environment — different NMs afford different computations; different UIs afford different UXs                 |

All five at equal status. These are the _kinds of connection_ the curriculum is
training learners to make. When you adapt: tracing which strand a given exercise
serves should still be possible.

### 8. The composer/virtuoso/mechanism metaphor — first-class teaching

apparatus, NOT structural guide

The course uses a consistent illustrative metaphor: a mechanical instrument (the
NM), a composer (the designer), a virtuoso (the implementer — possibly an LLM),
an audience (users), co-composers (other developers), and historical cameos
(Mozart, Bach, Ligeti, Lovelace, Babbage). The metaphor illuminates moments.

The metaphor is **load-bearing but not load-exclusive.** Use it where it
illuminates; set it aside where it strains. **Not a structural guide.**

If the metaphor's specifics don't transfer to your context (different musical
tradition, different audience expectations), you can vary the instrument (drum
machines / MIDI sequencers / gamelan-with-karakuri). What stays: composer /
virtuoso / mechanism / automated-execution.

### 9. Voice

The course's voice spec is consciously chosen. Inherit it as the default;
deviate intentionally.

- **Dry base** — state ideas directly, without performance
- **Middle-band playfulness** — characters can appear; warm asides are welcome
- **Cultured and quietly warm** — references (musical, historical, literary)
  when they serve
- **Honest about uncertainty** — evidence-informed but not dogmatic
- **Belgian/European-adjacent reserve** — dry realism, unwilling to oversell
- **Second person common** — "you" is the reader

And the harder constraints:

- **NO hyperbole** ("amazing", "incredible", "blazing")
- **NO false confidence** ("this will definitely work")
- **NO sycophancy** ("Great question!")
- **NO enthusiasm not backed by evidence**

The voice exists because the course is committed to **building intellectual
confidence rather than requiring it.** Marketing voice and expert-flatter voice
undermine that. So does the wannabe-GEB voice — the temptation to encode meaning
in puzzles that reward the already-confident. _GEB hides meaning in puzzles and
requires intellectual confidence to engage. This course is designed
pedagogically so that it builds intellectual confidence._ That is the
foundational divergence. Preserve it.

---

## What this curriculum is NOT committed to (the parts you can change)

These are working choices, not load-bearing principles. Adapt them as your
context requires.

### The specific notional machine

This course teaches JavaScript's NM. The discipline of building an accurate
mental model of a notional machine _transfers_; the specific NM does not. A
Python-track, a Pyret-track, a Racket-track are all welcome adaptations. The
skills the course names — predictive stepping, trace tables, behind-the-scenes
events, scope and prototype chain walks, the static/dynamic distinction — are
NM-shape-agnostic.

### The chapter sequence

The current Ch0 → Ch5 sequence (conceptual orientation → developers →

- computer → + users → + agents → + you) is one valid traversal of the
  spiderweb. Other traversals can work. What stays: the audience-ladder _adds_
  audiences chapter by chapter; the spiral within each chapter _revisits_ skills
  at increasing depth.

### The specific exercises

Every concrete exercise is an instance of a deeper pattern. The Parsons-style
line-shuffle, the trace-table predict-then-compare, the fill-in-the-blank, the
rewrite-this-loop-as-a-while — these are lens operations. The _lens system_ is
general; the _specific exercise instances_ are local. Adapt freely.

### The specific personas

The 🎨 Vibetoader and 🔬 Frogrammer are this curriculum's named hats. Other
framings can carry the same V/F symmetry — _Wear Hats not Titles_ is the
precursor. What stays: **the two stances are defined by twinning. Without
twinning, neither term applies.** Cargo-cult vibing and ceremony-without-twin
are both _outside_ both hats.

### The deeper-section content

L4 in this curriculum gestures at active inference (Friston), predictive
processing (Clark, Hohwy), bioelectric computation (Levin), strange loops
(Hofstadter), the mu image (GEB), and others. These are _easter eggs for the
attuned reader_. If your context calls for different deeper currents — different
texts, different traditions — swap them in. What stays: **L4 exists, it's
optional, and it builds intellectual confidence rather than gatekeeping it.**

### The visualizations

The course has working visuals (`assets/*.{png,svg}`) and new ones welcome. Pull
them in; create your own; render new ones inline. All wrapped in `<details>`
blocks with relative-importance caveats (most load-bearing / supporting /
optional extra angle). Visuals are increasingly load-bearing in the curriculum's
future state.

---

## Adapting this curriculum is trading-zone work

A particular framing worth knowing, because it shapes what adaptation means
here.

The curriculum is a **translational research artifact** in the technical sense
of Cole, Malaise, & Signer's _Translational Computing Education Research_ (TCER)
framework. That isn't decoration — it describes what the curriculum _is_. The
implications matter when you fork or adapt:

- **Adaptation is trading-zone work**, not consumption. When you change a
  chapter for your context, you're contributing a data point about what the
  curriculum's commitments do (and don't) carry across contexts. That data point
  may travel back to the upstream curriculum via the trading zones that connect
  us.
- **Evidence claims have grades.** The curriculum's per-chapter
  `research-framing.md` files (research-committee-owned) classify pedagogical
  claims as 🔬 Established (peer-reviewed, replicated), 📐 Translated
  (established theory applied to a new context — informed conjecture), or 🧪
  Extension (derived from experience or extrapolation — untested prediction).
  When you adapt a claim, the honest move is to mark whether your adaptation
  preserves the grade, raises it, or lowers it. Don't quietly upgrade a 🧪 to a
  🔬 by citing the curriculum.
- **Reflexive Analysis & Action is a discipline you're inheriting, not just a
  tagline.** Question the framework as you adapt it. Your questioning is itself
  doing translational research. The handoff history of the curriculum's own
  development is recoverable; we'd ask you to leave a similar trail for your
  adaptation, so future authors can see what shifted and why.
- **The curriculum and its infrastructure are coordinated, not hierarchical.**
  `lenses/embody` (the operational substrate) and the curriculum (this artifact)
  are two translational research artifacts in the same trading zone, each
  shaping the other's next iteration. When you adapt the curriculum but leave
  the infrastructure alone, the coordination still applies — the infrastructure
  constrains what the adapted curriculum can show; the adapted curriculum can
  surface infrastructure gaps.
- **Two traps to watch.** TCER names them: the _translational imperative_
  (pressuring all work to justify broader impact) and the _pipeline
  misconception_ (translation is cyclical, not linear). Adaptations sometimes
  fall into the first by over-justifying every change; sometimes fall into the
  second by treating curriculum → partner-cohort → revised-curriculum as a
  one-way flow. Neither is honest. The shape is _theory ↔ translation ↔
  practice_, cyclically.

For the deeper analysis — including the _engineering × physics co-evolution_
lineage that grounds the V/F symmetry, the Tool-Theory Co-evolution claim, and
the relationship between the curriculum and `lenses/embody` — see
`translational-framing.md`.

If TCER is new vocabulary for you, that document and the repo-level
`research-framing.md` are where to start.

---

## What community of authorship you're joining

You are not the first person to adapt this material. You will not be the last.
The course is — operationally and philosophically — a node in a long
conversation:

- **Classroom community** — students and alumni who shaped the principles by
  being learners of them
- **Collegial community** — friends, mentors, co-developers who pushed back on
  the framings
- **Partnered community** — organizations and cohort hosts (the
  Palestinian-community prototype cohort upcoming)
- **Discourse community** — the work this curriculum draws on: Bruner (spiral),
  Perkins (Whole Game), Wiley (Reusability Paradox / Open Education), Van
  Merriënboer & Kirschner (4C/ID), Friston (active inference), Malaise & Signer
  (Explorotron), Cunningham et al (ATT), Wing (computational thinking), Mikhak
  (data/interaction architectural pattern), Wilson (Teaching Tech Together),
  Sorva (notional machines), Karpathy and Willison (vibe coding / vibe
  engineering / agentic engineering), Hofstadter (acknowledged influence, NOT
  structural guide), and many more.

**Evan-as-scribe** is one role. _Author-as-scribe_ is what we'd like to inherit
from you as well. The course is what one careful person can do with what a
community has shown them. When you adapt, you become a careful person doing what
the community has shown you — including this particular community. _Authority is
plural. Add your voice._

---

## What we'd ask in return

When you fork, adapt, teach, or extend:

1. **Honor learner intellectual agency.** The course is built around the
   assumption that the learner is the active practitioner. If your adaptation
   makes the learner more passive — more recipient of explanation, less
   practitioner of experience — the course no longer does what it was for.

2. **Honor the mastery contract.** _"You have only mastered a skill when you can
   complete its exercises without AI"_ is the operative form of the first
   foundational principle. Adaptations that quietly substitute AI completion for
   the experience the contract names undermine the contract.

3. **Honor the inclusion stance.** The spiderweb places communication,
   collaboration, soft skills at the center — _unavoidably_ (the user's word).
   This is the operational form of the inclusion commitment. Adaptations that
   put syntax at the center break it.

4. **Honor the open-education stance.** If your adaptation is forkable,
   accessible, learner-modifiable — even by people without engineering teams —
   it preserves the _Open Education_ commitment (in Wiley's stricter sense, not
   just open-source-license sense).

5. **Pass it on.** _"Never teach alone"_ (Greg Wilson, Rule 5). The course
   expects you to teach in community — with co-instructors, with mentors, with
   your learners as co-makers, with the broader teaching community that the
   curriculum is itself a piece of.

That's the contract. The rest is yours to shape.

---

## A small closing

There is a phrase that recurred across the design of this curriculum, and I'd
like you to inherit it:

> _Authority is plural and wide._

The course was made in conversation — with the people in the room, with the
people whose papers shaped the framing, with the people whose classrooms used
the precursors. When you teach it, adapt it, extend it, you join that
conversation. There is no original. There is only the practice, carefully
scribed.

What you do next is your part of the scribing.

Welcome.

---

_Voilà quoi. Bon courage._
