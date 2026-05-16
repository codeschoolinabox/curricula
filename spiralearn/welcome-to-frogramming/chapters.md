# Welcome to Frogramming — Chapters

> **Purpose**: chapter-by-chapter redraft with 5-layer learning-objective grids,
> drawing framing from `ontology.md` and the intellectual-agency
> meta-LO from `guide.learners.md`. Six chapters (Ch0–Ch5), each
> with a unified overview + five layer-headed LO lists (`### Layer 0` through
> `### Layer 4`).
>
> **Companions** (siblings, by co-location):
>
> - `ontology.md` — the _what_ (reference voice)
> - `guide.{learners,authors,community}.md` — the _why_ per
>   audience
> - `study-lenses.md` — the technical-reader companion for the
>   infrastructure that delivers chapter content
> - `README.md` — the existing prose course (read-only)
>
> **Status**: end-state document. The previous chapter prose in `README.md` is
> read-only; this file is the chapter-level redraft that a future `README.md`
> rewrite will draw from.

---

## Preamble

### Meta learning objective unifying all 5 layers

**Intellectual agency.** Each layer is intellectual agency at a different scale:

| Layer | Frame       | Intellectual agency over…   |
| ----- | ----------- | --------------------------- |
| L0    | Mastery     | the notional machine        |
| L1    | Rhetoric    | communicative production    |
| L2    | Methodology | methodology choice          |
| L3    | Snippetry   | the medium itself           |
| L4    | Philosophy  | the philosophical questions |

(Cross-reference `ontology.md` §5.)

### What to expect from this file

- Six chapters (Ch0–Ch5). Each chapter has a unified overview block with framing
  prose, followed by five layer-headed LO lists.
- Each LO is marked with a difficulty progression: 🥚 (entry) / 🐣 (developing)
  / 🐥 (competent) / 🐔 (mastery).
- LO sparseness is **information**. Some chapter × layer cells will have few
  LOs; that itself communicates which layers each chapter foregrounds.
- The composer/virtuoso metaphor anchor for each chapter is named once in the
  overview, not repeated per layer.

### Density map (rough drafting density, not LO targets)

|     | L0 mastery          | L1 rhetoric | L2 methodology | L3 snippetry | L4 philosophy |
| --- | ------------------- | ----------- | -------------- | ------------ | ------------- |
| Ch0 | sparse              | dense       | medium         | sparse       | medium        |
| Ch1 | medium              | dense       | medium         | sparse       | sparse        |
| Ch2 | dense               | dense       | medium         | medium       | sparse        |
| Ch3 | medium              | dense       | dense          | medium       | sparse        |
| Ch4 | medium              | dense       | dense          | medium       | medium        |
| Ch5 | dense (maintenance) | dense       | dense          | dense        | dense         |

### Audience ladder

| Chapter | Adds audience                     | Language features introduced                          |
| ------- | --------------------------------- | ----------------------------------------------------- |
| Ch0     | (conceptual orientation; no code) | —                                                     |
| Ch1     | 🧑‍💻 Developers                     | comments + full `console` API                         |
| Ch2     | 💻 + Computer                     | NM core (2.0–2.8) + computational idioms (2A–2F)      |
| Ch3     | + Users                           | `prompt`, `alert`, `confirm`; `null` first encounter  |
| Ch4     | 🤖 + Agents                       | no new features (Ch1–3 applied with LLM collaborator) |
| Ch5     | + You                             | training wheels off — full JS                         |

### The audience YOU are becoming

The student is themselves an audience throughout the curriculum, at
increasing levels of recursion. This is the audience ladder read from
the inside — the YOU-becoming reading of the same arc. Each chapter
adds a perspective future-you must hold. The course teaches the student
to BECOME a poly-perspective self.

| Chapter | Future-you is…                                                                  |
| ------- | ------------------------------------------------------------------------------- |
| Ch1     | future-you reads code (basic dev-reader)                                        |
| Ch2     | future-you traces NM (added perspective: NM)                                    |
| Ch3     | future-you considers users (added perspective: user)                            |
| Ch4     | future-you collaborates with LLMs as a duet (first conscious perspective-stack) |
| Ch5     | future-you snippets-as-merged-V/F (perspective-stacked-singularity)             |

### Spiral (skills) vs ladder (audiences)

Two dimensions organize the chapter sequence:

- The **ladder** (chapter sequence) adds an audience to the learner's
  awareness — one new audience per chapter (developers → computer →
  users → agents → self).
- The **spiral** (within each chapter) revisits skills at increasing
  depth: read → trace → describe → modify → write. Bruner's spiral
  curriculum operationalized at the skill scale.

Study Lenses generates exercises that drive the spiral at the
exercise level. Each LO marks where a skill is _first introduced_, not
where it ends.

### Per-chapter metaphor anchors

Each chapter has a single metaphor anchor (named once in each chapter's
overview block, not repeated per layer):

| Chapter | Metaphor anchor                                                |
| ------- | -------------------------------------------------------------- |
| Ch0     | the recital as rhetorical situation                            |
| Ch1     | the score as inter-composer communication                      |
| Ch2     | studying the instrument's mechanism                            |
| Ch3     | writing for the audience; the composer's design thinking       |
| Ch4     | the composer-virtuoso asymmetric duet (with an alien virtuoso) |
| Ch5     | the composer's daily practice (Ligeti / Bach / sketches)       |

The metaphor system is **teaching apparatus, explicitly NOT structural
guide** — see `metaphor.md` for the canonical treatment.

---

## Ch0 What is Programming?

No language features. Conceptual orientation only.

### Metaphor anchor

_**The recital as rhetorical situation** — an entire performance event with
its audience, its performers, its instrument, and the score that ties them
together._

### Overview

You meet the rhetorical model (source code as communication addressing multiple
audiences simultaneously), the Vibetoading/Frogramming distinction, and the
positioning of WtF in the broader space of programming and computer science.

The chapter's intellectual-agency move: _you arrive here with a why, and the
course is built to honor it._ No assumption that you walked in with intellectual
confidence — the course will build it.

### 0.1 The Rhetorics of Programming

When you write source code, you are not writing for a single reader. Like a
recital — a performance event with its audience, its performers, its instrument,
and the score — source code addresses multiple readers simultaneously, each with
different needs and different ways of understanding.

Three human audiences read your code:

1. **🧑‍💻 Other developers** — they read your code to understand your intent,
   learn your style, collaborate on changes, and maintain the work long after
   you wrote it.
2. **💻 The computer** — it parses, interprets, or compiles your code; it does
   not understand intent, only syntax and semantics. Throughout this course,
   "understanding the computer" means **twinning its notional machine** —
   building an accurate mental model of how the engine evaluates your code at
   our chosen level of abstraction. The NM _is_ the computer for our purposes.
3. **Users of the program** — they never see the code, but they experience its
   effects; their correctness is behavioral (does it do what I need?), not
   syntactic.

A fourth audience has recently arrived: **🤖 Agents (LLMs)** — they read and
understand code differently from humans; they can infer intent from examples,
find patterns, suggest changes, and help you write it. Writing _for and with_
agents is its own communication skill, developed in Chapter 4.

The central skill this course teaches is writing code that **addresses all four
audiences simultaneously**. Different chapters focus on different audiences
(hence the twinning progression: developer → computer → user → agent → self),
but they all matter in real work.

The curriculum tracks five **strands** — five _kinds of connection_ a learner is
trained to recognize and produce:

- **Twinning** — building a generative model of a target audience that aligns
  with that audience's actual behavior
- **Decisions** — micro and macro authorial choices that accumulate into voice
- **Perspective stacking** — holding multiple perspectives of a single situation
  in mind simultaneously
- **The whole rhetorical situation** — keeping users, developers, machine, and
  purpose in view at once
- **Affordances** — what the language and tooling make easy, hard, or
  impossible; learning JS = learning an affordance-space

The five strands have equal status. The **data thread** — a single red thread
that stitches all five together — runs through every chapter and ramifies as the
layers deepen.

### 0.2 Positioning Welcome to Frogramming

Programming is a large space. Before spending time inside one part of it, it
helps to know roughly where that part is — and what it is not.

The following distinctions are not knowledge to memorize. They are landmarks.
You will encounter each one again as the course progresses, and what feels
abstract now will become concrete. For now, use them as orientation.

**What WtF is and what it isn't:**

| This course                                                                                                                                                                                    | Not this course (yet)                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Embodied computation** — learning to read, predict, and direct one specific notional machine through the notation it interprets. Embodied work makes theoretical work tractable and visible. | **Theory of computation** — the formal/mathematical framework defining what computation IS (Turing machines, lambda calculus, complexity classes). Begins in WtA. |
| **Programming** — specific use cases, concrete inputs and outputs, particular implementations                                                                                                  | **Computer Science** — general classes of problems and algorithms, asymptotic analysis, formal proofs of correctness                                              |
| **Local fluency** — expressions, bindings, scopes, control flow at the statement level                                                                                                         | **Global architecture** — system design, API boundaries, database schemas, how large codebases are organized                                                      |
| **Comprehension before production** — you'll read and trace code before you write it; programs are written to verify understanding, not to demonstrate output                                  | **Production-first** — most courses have you writing immediately; output becomes the measure of understanding                                                     |
| **Depth on a constrained surface** — Just Enough JavaScript offers few features deliberately                                                                                                   | **Breadth across many features** — JS has hundreds; covering all of them diffuses the focus needed to build a real mental model                                   |

**How you will work:**

| WtF's approach                                                                                                                                           | The common alternative                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Errors as information** — the machine is honest; an error tells you precisely where what you specified and what the machine can interpret do not match | Errors as failure — something is broken                                                          |
| **Read from code first** — you will spend real time as a code investigator before you write                                                              | Learn by writing — produce output to prove you understand                                        |
| **Predict and check** — proactive and mechanistic; you will see what happens and update your model                                                       | Watch and explain — retroactive and justifying; post-hoc description of what you've already seen |

**Where WtF fits in the larger journey:**

| WtF                                                                                                                                                                                    | What follows                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Learning to program** — build fluency in the embodied language of computation. Chapter 5 is the first pivot: snippetry is where you begin using programming to explore and discover. | **Programming to learn** — use programming as a tool to explore algorithms, complexity, paradigms, and domains (WtA, Trees, SoC, and beyond) |

WtF is a prerequisite for any Spiralearn curriculum that requires computational
thinking. What follows it: **Welcome to Algorithms** (algorithm strategies,
step-counting, Big O), **Trees** (tree data structures → the DOM → browser event
dispatch), **Separation of Concerns** (programs organized at scale across files
and modules), and onward into specific domains, languages, and specializations.
Trees and Separation of Concerns can be studied in either order depending on
your goals; Trees-first provides conceptual grounding for the DOM, SoC-first
reaches interactive pages sooner.

A note on comprehension before production: all professional programming work
takes place in existing codebases. All of what programmers do is arrangement and
variation — reading code, understanding it, modifying it, fitting new pieces
into existing structures. This course teaches you to read and understand code
first because that is what all programming work actually is. You will write
programs throughout, but to verify understanding, not to demonstrate output. The
deeper reason — unpacked in README.md § How Learning Happens — is that
**understanding is the part of programming you cannot delegate.**
Comprehension-first because comprehension is the experience-form of building the
twin of the machine; production-first skips the experiences and installs nothing
durable.

**Three vocabulary distinctions worth having early:**

| Term                     | What it means                                                                                                                                                                                                                                                          | In WtF                                                                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Programming paradigm** | A design philosophy for organizing programs — how you decompose problems, structure solutions, manage state                                                                                                                                                            | Ch1–4 is imperative: sequences of statements, explicit control flow, mutable state. Functional, OOP, and declarative are deferred to Ch5.                    |
| **Computational domain** | What you are computing _about_ — the thing in the world you are modeling. A programmer who understands medicine writes better medical software; one who understands finance builds better financial tools. Domain expertise is a separate axis from programming skill. | WtF is largely domain-agnostic by design — the same NM skills transfer to any domain.                                                                        |
| **Computational idioms** | Types of operators and operations available within a programming language — how you manipulate values. Different languages emphasize different idioms; mastering an idiom means fluency with a category of operations.                                                 | Ch2's sections (2A–2F) are organized by idiom: logic, strings, numbers, pattern matching, bits, dates. Distinct from computational domains (subject matter). |
| **Model of computation** | A formal mathematical framework defining what computation _is_ — Turing machines, lambda calculus, finite automata                                                                                                                                                     | Largely deferred to WtA and beyond                                                                                                                           |

These are orthogonal axes. You can write functional medical software or
imperative medical software — the domain (medicine) is independent of the
paradigm (functional/imperative). The model of computation is a different
question again.

One useful test: when you encounter a new concept, ask — is this about how I
organize my program (paradigm)? About what I'm computing about (domain)? Or
about what computation fundamentally is (model)?

Two questions this taxonomy answers before you even ask them:

- _"Why aren't we doing functional programming?"_ — Paradigm. Deferred to Ch5.
- _"Why aren't we working on a specific project like a web app or game?"_ —
  Domain. WtF is domain-agnostic by design.

A note on JavaScript specifically: JS is a multi-paradigm language — it can
_look_ like OOP, functional, or declarative code syntactically. But it runs one
notional machine: procedural + prototypes. When you write "OOP-style" JS, the
machine underneath is still producing the same events it always does — and the
notional machine does not change. Languages designed _for_ a paradigm (Haskell,
Smalltalk, Java) have genuinely different notional machines and different event
vocabularies. This course teaches JS's actual machine. Understanding it gives
you a stable base from which to see that paradigm choices are partly about which
machine's event vocabulary you want to think in.

**What the course constrains — and why:**

Just Enough JavaScript is deliberately small. It excludes classes, most array
methods, async/await, modules, destructuring, generators, and dozens of other
features JS has. This is not an oversight. Fewer features means more cognitive
bandwidth for the concepts that actually matter in Ch1–4: how the machine
evaluates, how values and bindings behave, how control flow works.

The constraints are temporary and intentional:

- Ch5 lifts most of them
- Welcome to Algorithms adds functions, arrays, and objects — and uses them to
  study algorithms
- Trees and Separation of Concerns add DOM manipulation, event handling, and
  module structure

If a feature you want is missing, the likely answer is: it is coming, and it
will make more sense when it arrives because you have the foundation.

**On architecture specifically:** WtF builds fluency at the level of
expressions, statements, and small programs. It does not teach how programs are
organized at scale — API boundaries, module systems, separation of concerns
across files and services. That is a later skill, developed across Trees and
Separation of Concerns and beyond.

### 0.3 Two Hats: Vibetoading and Frogramming

A foundational distinction this course returns to throughout: in every moment of
programming work, you wear one of two hats. Both are real practices, both have
their time, and most people wear both — sometimes within the same hour on the
same project.

**🎨 The Vibetoader** works grounded in the user. They build a deep model of
what users need, do, and experience — through research, prototyping, and testing
with real people — and iterate that model when prototypes meet actual humans.
The notional machine underneath is intentionally delegated: to an LLM virtuoso,
to a colleague, or to whatever notation tooling is at hand. Code is the
instrument that produces user-visible behavior, not the audience the Vibetoader
is addressing in depth. They may use LLMs heavily or not at all; what defines
the hat is the depth of the user-twin and the intentionality of the
NM-delegation.

**🔬 The Frogrammer** works grounded in the notional machine. They build a deep
model of what the machine will do — through prediction, tracing, and
verification against actual evaluation — and iterate that model when traces
diverge from predictions. They apply craft practices (testing, documentation,
code review, security audits) intentionally, to mitigate specific risks their
NM-awareness makes visible. User-research and design thinking they may delegate,
do at lighter touch, or rely on a Vibetoader collaborator for. They may use LLMs
heavily or not at all; what defines the hat is the depth of the NM-twin and the
intentionality of any user-side delegation.

**Twinning is what makes the bridging activity _thinking_ rather than mere
process.** Design _thinking_ requires twinning the user; without the user-twin,
what's happening is _design process_ (wireframes, personas, A/B tests as steps
you follow) but not design _thinking_. Same on F's side: _computational
thinking_ requires twinning the NM; without the NM-twin, what's happening is
_computational process_ (unit tests, refactoring moves, patterns followed) but
not computational _thinking_. The full elaboration — the twin/process 2×2, the
failure-mode categories — lives in `ontology.md` §3.

**Spectrum, not binary.** A given developer doesn't _be_ a Vibetoader or a
Frogrammer — they wear different hats on different tasks, files, moments. A
seasoned Frogrammer prototyping a UI tweak Vibetoads on purpose. A junior who
genuinely understands the part of the NM they're touching is Frogramming on that
part. The question is never "which kind of person are you?" — it's "which hat
fits this moment?"

**Why the twinning anchor cuts where it does.** Both hats twin deeply, just
different audiences. Vibetoading shoulders the _user-twin_ — the experiencer of
behavior; their depth lives in research, prototyping, and design thinking with
real people. Frogramming shoulders the _NM-twin_ — the producer of behavior;
their depth lives in prediction, tracing, and verification. Each hat delegates
the audience the other shoulders. Code itself sits between them: for the
Frogrammer, code is the textual representation of the NM and its levers, and the
developer-reader audience is a natural extension of NM-awareness — well-shaped
code is what lets humans _and_ agents read, review, and extend the work over
time. For the Vibetoader, code is the instrument that produces user-visible
behavior, and the developer-reader audience is delegated to whoever is operating
the NM — a Frogrammer collaborator, an LLM virtuoso, or a future-self in
different mode. Neither hat skips work; each invests it where it serves their
twin best.

**Intentional process is not cargo-cult.** Process discipline (TDD, code review,
docs, user research, A/B tests, usability studies) doesn't determine which hat
you're wearing — _intentionality_ and _grounding_ do. When a Frogrammer does
TDD, the tests target the specific edge cases their NM-awareness predicts will
be surprising. When a Vibetoader runs an A/B test or a usability study, the test
targets specific user-behavior hypotheses their user-twin predicts will be
tested. Both are intentional; both serve the twin they shoulder. The failure
mode is process performed because Process Says So, with no model of what the
test or research is actually telling you — this is the no-twin corner of the
practice grid in ontology §3, sometimes called _ceremony-without-twin_ (F-side)
or _design-process-without-user-twin_ (V-side). The fix is upstream, in the
twin.

**Vibing predates LLMs.** It's tempting to read the dichotomy as
"vibing-with-LLMs vs. engineering-without". It isn't. Building by feel — without
holding a deep twin of either audience — is older than LLMs by decades:
copy-paste-tweak from Stack Overflow, React hooks rules without understanding
reconciliation, CSS flexbox by trial-and-error, jQuery selectors without a DOM
model, Rails magic accepted as opaque. LLMs amplified the practice; they didn't
invent it. _Vibing_ as a stance is legitimate; sometimes it's the fastest way to
ship something small or to explore. What distinguishes V (the Vibetoader) from
no-twin vibing is the user-twin: V vibes _on top of_ a real model of who they're
building for.

The four-quadrant grid makes this concrete. Vibetoading vs. Frogramming is a
stance about your relationship to the NM, _orthogonal_ to whether an LLM is in
the loop:

|                                    | **Humans-only**                                                                                                                                                                                                                                                                                   | **LLM-collab**                                                                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **🎨 Vibetoading** (user-grounded) | Real Vibetoading, humans-only: user-research-led prototyping, design-thinking-driven iteration with real people; the NM is delegated to a collaborator or familiar tools. (Note: pattern-matching without a user-twin is **not** Vibetoading; it's the no-twin corner of the 2×2 in ontology §3.) | Karpathy's _vibe coding_ — LLM writes notation, you focus on user-visible outcomes; works only when paired with deep user-twin and willingness to read what the LLM produced enough to verify it. |
| **🔬 Frogramming** (NM-grounded)   | Traditional engineering — humans write notation grounded in NM-awareness, applying craft practices intentionally.                                                                                                                                                                                 | Willison's _vibe engineering_ / _agentic engineering_ — LLM writes the notation; you direct and verify against the NM.                                                                            |

#### Related vocabulary

This course's house terms are **Vibetoading** and **Frogramming**. The wider
discourse has its own vocabulary, and learners will encounter it; the most
useful landmarks:

- **Vibe coding** — coined by Andrej Karpathy. Originally narrow: building with
  an LLM without reading or reviewing the code it writes.
- **Vibe engineering** — Simon Willison's term for the disciplined counterpart:
  seasoned engineers using LLMs while staying accountable for the code, with
  testing, docs, planning, and review.
- **Agentic engineering** — Willison, Addy Osmani, others. Specifically about
  building with coding agents (Claude Code, Codex) that can execute and iterate
  on their own output.

Frogramming is broader than any of these — it's tool-agnostic and
abstraction-level-agnostic. Vibe engineering and agentic engineering are flavors
of LLM-collaborative Frogramming; traditional engineering is humans-only
Frogramming. The house terms name the underlying stance; the wider vocabulary
names specific working modes within it.

## Learning objectives by layer

### Layer 0 — Mastery

_(sparse — no code yet)_

- 🥚 Recognize that programming is fundamentally about understanding a machine
  well enough to direct it precisely — _the notional machine is what gets
  programmed_

### Layer 1 — Rhetoric

- 🥚 Articulate the four audiences of source code: 🧑‍💻 developers, 💻 the
  computer, users, 🤖 agents (LLMs)
- 🥚 Explain what it means for code to _address_ each audience simultaneously
- 🥚 Describe the twinning progression across chapters: developer-twin (Ch1) →
  computer-twin (Ch2) → user-twin (Ch3) → agent-twin (Ch4) → self-twin (Ch5)
- 🥚 Identify agents (LLMs) as a fourth audience: they read and understand code
  differently from humans
- 🥚 Describe why this course prioritizes comprehension before production
- 🥚 Identify the five strands that run the curriculum: twinning, decisions
  (micro and macro), perspective stacking, the whole rhetorical situation, and
  affordances
- 🐣 Explain the spiral curriculum as traversal of the spiderweb: why revisiting
  concepts at increasing depth produces deeper understanding
- 🥚 Use the positioning tables to locate WtF's scope within the broader space
  of programming and computer science
- 🥚 Distinguish a programming paradigm, a computational domain, a computational
  idiom, and a model of computation — and recognize they are orthogonal axes
- 🥚 Understand why WtF constrains itself to Just Enough JavaScript and why
  those constraints are temporary

### Layer 2 — Methodology

- 🥚 Distinguish Vibetoading from Frogramming by which audience they twin in
  depth (the user vs the notional machine) and by what they intentionally
  delegate
- 🥚 Place a given workflow on the four-quadrant grid (V/F ×
  humans-only/LLM-collab)
- 🥚 Recognize that vibing predates LLMs; give one pre-LLM example
- 🐣 Identify when each hat is appropriate for a concrete scenario
- 🐣 Distinguish _vibing_ (legitimate stance — building by feel) from _failures
  of the twin_ (twin ignored, twin wrong, twin not-yet-known); recognize
  ceremony-without-twin as a symptom, not a failure mode
- 🐣 Distinguish design _thinking_ (with user-twin) from design _process_ (steps
  followed without the twin) — and the same on F's side, computational
  _thinking_ vs computational _process_
- 🐔 Articulate why this curriculum teaches Frogramming in depth while honoring
  Vibetoading as an equally non-delegable practice (taught at gesture-level
  here, with referrals out to follow-on courses)

### Layer 3 — Snippetry

_(sparse at L3 in Ch0 — snippetry formalizes in Ch5)_

- 🥚 Recognize that _informal_ snippetry can begin from Ch0 — small,
  curiosity-driven exploratory programs are welcome from day one
- 🐣 Identify what you'd want to play with first, given the curriculum's
  trajectory

### Layer 4 — Philosophy

- 🥚 _(footnote/easter-egg)_ Notice the recursion in this preamble: the course
  is designed to do for you what it will ask you to do
- 🐣 _(easter egg)_ Encounter the question: what does it mean to _master a
  programming language_ vs _learn its surface_?
- 🐥 _(deeper-section pointer)_ Recognize the agile-visible-discipline story
  emerging from the LLM shift — and that it intensifies further in the PL-future

---

## Ch1 Developers

Language features: comments, `console.log` and the full `console` API with
string literals.

### Metaphor anchor

_**The score as inter-composer communication** — other composers read your
score for intent and style, long before (or entirely instead of) ever
hearing it performed. Code has the same property._

### Overview

Your first code and your first audience. The 🧑‍💻 developer audience — including
future-you, who is a stranger by the time they come back to this code. Twinning
the developer audience is the central skill.

The chapter's intellectual-agency move: _you have authorial choices_ — every
word, every comment, every console method is a micro-decision that shapes how a
stranger reads your work.

### 1.1 Twinning the developer audience

The central skill of this chapter is **twinning the 🧑‍💻 developer audience** —
imagining who will read your code and writing for them, not for
yourself-right-now. This is not a new practice; it is the explicit naming of
something the programming community has always done:

> _"Programs must be written for people to read, and only incidentally for
> machines to execute."_ — Abelson & Sussman, _Structure and Interpretation of
> Computer Programs_

And in its blunter sibling:

> _"Always code as if the guy who ends up maintaining your code will be a
> violent psychopath who knows where you live."_ — John Woods (and a thousand
> undergraduate code-style lectures since)

The developer audience includes the obvious reader — a teammate maintaining your
code — and the often-overlooked one: **future-you**. You-in-six-months is a
stranger. You-in-ten-minutes is already on the way there. Twinning the developer
audience means writing so that stranger can pick up where you left off without
phoning you.

This anticipates Chapter 5's _"you"_ audience: by the time we promote
yourself-as-a-distinct-audience, you've been twinning future-you all along.

**Same self, two angles of approach.** Here you write for **you as an
audience**; in Ch5 you'll write for **you as a human**.

### 1.2 Static vs. dynamic

A foundational conceptual distinction is introduced here: not as a technical
exercise but as orientation: **source code (static) vs. program evaluation
(dynamic)**. Comments exist in the static text; logs are observed during
evaluation. This sets up the 🧑‍💻 developer twin: the developer who reads your
code sees the static text, not the runtime. Understanding this distinction is
prerequisite to understanding why comments and logs serve different purposes.

The computer is not yet a full audience. Devtools console is developer space.

### 1.3 Comments

Comments are static notes written for the developer-reader. They live in the
source text and never run. Their job is _why_, not _what_: the code already
shows what; the comment fills in the intent.

Four conventions to recognize and apply:

- **Inline** (`// like this`) — end-of-line clarifying notes
- **Block** (`/* like this */`) — multi-line explanations
- **Doc-style** (`/** like this */`) — special block convention picked up by
  tooling; first-line summary; `*`-aligned subsequent lines
- **`*`-aligned block structure** — the visual convention that holds block and
  doc-style comments together

Every comment is a small communication act. Word selection, length, placement,
and convention all shape how the developer-reader experiences the code. Notice
the choices; consider their effect on the reader.

### 1.4 Logs

Logs are observations of the program _running_. They live in a different
register from comments — the runtime — and address the developer-watching-
the-console audience.

The full `console` API:

- **Output by intent**: `console.debug` (trace-level), `console.log` (general),
  `console.info` (informational), `console.warn` (unexpected but not broken),
  `console.error` (broken)
- **Asserting**: `console.assert(condition, message)` — silent when true, logs
  an error when false
- **Counting**: `console.count(label)` / `console.countReset(label)` — named
  counter tracking, useful in loops
- **Grouping**: `console.group(label)` / `console.groupCollapsed(label)` /
  `console.groupEnd()` — collapsible indented output sections
- **Timing**: `console.time(label)` / `console.timeLog(label)` /
  `console.timeEnd(label)` — named timer trio for rough measurement
- **Utility**: `console.clear()` — clears all console output

When to use comments vs. logs: comments for reading the code; logs for observing
it run. Both serve the developer audience; they serve it differently.

**Micro-decisions in logs**: which console method? What message? What data
included? Why `.info` and not `.log`? Is `.warn` ever appropriate here? Each
choice communicates different things to the developer watching the console. The
discipline of comments — _every word is a choice_ — extends here.

## Learning objectives by layer

### Layer 0 — Mastery

- 🥚 Recognize that source code is **static** (the text) — comments live here
- 🥚 Recognize that program evaluation is **dynamic** (the runtime) — logs are
  observed here
- 🐣 Identify the `console` API as the developer-facing dynamic channel
  (devtools console = developer space, separate from user space)

### Layer 1 — Rhetoric

- 🥚 Write comments that describe what a program should do and why
- 🥚 Identify and apply comment conventions: inline (`//`), block (`/* */`),
  doc-style (`/** */`), `*`-aligned block structure
- 🥚 Understand "why not what": a comment explains the intent behind a line, not
  what the line literally does
- 🥚 **Micro-decisions in comments** — every choice (word selection, length,
  placement, convention) shapes how a comment reads
- 🥚 The full `console` API: what each method communicates (`debug` / `log` /
  `info` / `warn` / `error`; `assert`; `count` / `countReset`; `group` /
  `groupCollapsed` / `groupEnd`; `time` / `timeLog` / `timeEnd`; `clear`)
- 🥚 When to use comments vs logs — comments for reading the code; logs for
  observing it run
- 🥚 **Micro-decisions in logs** — which method? what message? what data?
- 🐥 Read and appreciate real comments from real codebases (funny, desperate,
  poetic examples of developer-to-developer communication)
- 🥚 Top-level program comments — name and purpose at the top of every program

### Layer 2 — Methodology

- 🥚 Recognize that "twinning the developer audience" is what programming
  culture has always done: _"Programs must be written for people to read, and
  only incidentally for machines to execute."_ (Abelson & Sussman)
- 🐣 Reflect on future-you as a stranger — six months from now you'll read this
  code without your current context
- 🐣 Wear a V or F hat _consciously_ when writing a comment: a V-hat comment
  grounds in the future reader's experience; an F-hat comment grounds in the
  mechanism the reader needs to understand

### Layer 3 — Snippetry

_(sparse)_

- 🥚 _(future feature)_ Share code with others via save-to-gist / pop-up sandbox
  — early gesture toward Ch5's collaborative gist system

### Layer 4 — Philosophy

_(sparse — Ch1 is dense at L1, light elsewhere)_

- 🥚 _(footnote)_ Notice that the developer audience is the only audience that
  reads STATIC code — every other audience experiences the DYNAMIC evaluation.
  What does that asymmetry mean for code rhetoric?

---

## Ch2 Developers and Computers

### Metaphor anchor

_**Studying the instrument's mechanisms** — like an organ builder examining
bellows, tracker action, registration, and combination action, you study
how the JavaScript engine actually carries out your instructions._

### Overview

The 💻 computer is now a full audience. The primary learning objective:
**JavaScript's notional machine** — the mental model of how the JS engine
evaluates your code. Other languages have their own notional machines; the
discipline you develop here transfers. Programs produce output via logs and
assertions but do not yet interact with users. `undefined` is encountered
naturally through variables; `null` is held until Ch3 where `prompt()` can
return it.

The chapter has two tracks:

- **NM core (2.0–2.8)**: the machine itself — expressions, values, bindings,
  scope chain, prototype chain, coercion, statements, and reading/writing code.
  All required.
- **Computational idioms (2A–2F)**: what you _do_ with the machine — logic and
  truthiness, text processing, number crunching, pattern matching, bit
  manipulation, date computation. **2A (Logic) and 2B (Strings) are required.**
  Choose at least one from 2C–2E. 2F is optional.

The chapter's intellectual-agency move: _you can predict what the machine will
do, then verify it._ You become the kind of person who asks "what does this
evaluate to?" instead of "what does this do?"

### 2.0 The Notional Machine

Every programming language describes a machine. The machine JavaScript describes
has a name: the **notional machine** (NM). You do not program JavaScript — you
program the notional machine _using_ JavaScript.

The NM is best understood as a machine that works through a fixed vocabulary of
**evaluation events**: observable moments that occur in a specific order as your
code runs. Each event has a type. Types have relationships. A given piece of
syntax produces a predictable sequence of typed events. Learning the NM is
learning this vocabulary — what categories of events exist, which events
necessarily follow which, and which syntactic forms produce which sequences.

The machine has two viewing levels:

- **Visual-syntax level** — what you can see in the source code: expressions,
  statements, the control panel you write to direct the machine
- **Behind-the-scenes level** — what the machine is actually doing: binding
  lifecycle, scope creation and chain-walking, value resolution, coercion,
  errors

Behind the scenes, the machine maintains **state** — values, bindings, scopes —
that events read and mutate. The events are what happen; the state is what they
happen to.

The substrate that surfaces the NM in operational form (the `embody/` package)
is not inert: it is a _crystalline representation of the entire dynamic data
lifecycle of a program_ — a static 4D rendering of a 3D flowing river. Streams
represent the dynamics; embody exists to make every facet of that motion
explorable.

**The further skill: decoupling syntax from events.**

Once you can think in events, a new ability becomes possible: you can specify
_what you want the machine to do_ — describe a desired event sequence — before
choosing the syntax that produces it. You can communicate that specification to
another person, to the tracer, or to an LLM, and then evaluate whether what was
produced actually achieves what you wanted.

This is what "programming the machine directly" means. The syntax is notation
for the machine; the events are what the machine actually speaks.

**Errors.**

An error is not a personal failure and it is not the machine breaking. It is a
specific event that fires because the machine encountered a specification it
cannot interpret. The machine is being precisely honest: it found a mismatch
between what was specified and what it can do. Errors are the notional machine's
most useful output.

Learning to read errors as information — rather than experiencing them as
indictments — is a skill this chapter develops alongside everything else.

**The tracer.**

Study Lenses' tracer captures the evaluation event stream: every
behind-the-scenes moment as your code runs, as a structured sequence you can
step through. It serves two roles:

- **Training wheels** — while you are building your internal NM model, the
  tracer makes visible what your mental model should eventually produce on its
  own
- **Power tool** — when code is too complex to trace mentally, the tracer
  extends your working memory, letting you attend to evaluation you could not
  hold in your head alone

### 2.1 Running a Program

A program is source code that has been parsed and is now evaluating. Two phases:
the **creation phase** sets up the program's structure; the **evaluation phase**
runs it. Errors in the creation phase are _parse errors_; errors in the
evaluation phase are _runtime errors_.

A running program produces an ordered stream of observable moments —
**evaluation events**. The tracer captures these automatically; trace tables
record them by hand. Logging string literals from a program is your first
practice of observing evaluation as it happens, distinct from reading the static
text.

### 2.2 Expressions and Resolve

An **expression** is syntax that produces a value. Operators, literals,
identifiers, calls, templates, property access, and assignment are all
expressions. Compound expressions evaluate step by step: sub-expressions resolve
in order, precedence rules govern the order, and parentheses can override.

**Resolve**: every expression produces exactly one value. The VM hands that
value back to the surrounding expression or statement.

**Implicit coercion** is the VM's silent type-transformation between operands
and operators (`'5' - 1`, `if ('hello')`). It is a behind-the-scenes event,
invisible in the syntax but predictable once you learn its rules. Distinct from
**explicit type conversion** (`Number()`, `String()`, `Boolean()`, `parseInt`,
`parseFloat`), which is learner-visible syntax.

**Asserting on expressions**: `console.assert(1 + 1 === 2)` is a claim about
what an expression resolves to. The program verifies the claim. This is your
first move from logging to _predictive_ programming.

**Block scope** is introduced as a container. Empty `{}` blocks are runnable.
Scopes nest.

### 2.3 Values and Bindings

A **binding** is a named slot the program reads and writes. Its lifecycle:
declare → initialize → available → access / update. `let` allows reassignment;
`const` does not. Both communicate intent to the reader.

Variable names are micro-decisions on par with comment choices. Conventions
(`camelCase`, `snake_case`, `CONSTANT_CASE`, `PascalCase`) carry different
signals; the choice is part of how the code communicates with the developer
audience.

**Trace tables** are systematic notation of evaluation: declare / initialize /
access / update events for each binding, in steps-format and values-format.
**Predictive stepping with a debugger** is the same practice extended with a
tool: predict what happens next → step → check → investigate.

**Scope chain walk**: when an identifier is read, the VM checks the current
(innermost) scope first, then its parent, up to the global environment. Each
check is a miss (keep looking) or a hit (binding found). Block-scoped `let`
declarations are not accessible outside their block; the scope chain walk makes
this concrete.

**Asserting on bindings**: predict what a binding holds at a specific point;
write `console.assert` statements that must pass. The mirror move to expression
assertions, but now about state rather than value.

### 2.4 Statements and Control Flow

**Conditionals**: `if` / `else if` / `else` make the evaluation path depend on
values. Tracing a conditional means tracing the predicate expression, then
following the branch the predicate resolves into. **Ternary expressions** are a
compact equivalent form; learners refactor between them.

**Loops**: `while`, `do-while`, `for`, `for-of` repeat evaluation. Each form has
the same NM events; the syntax differs in how the loop variable and termination
condition are arranged. `break` and `continue` modify loop flow.

Block-scoped bindings inside `if` / `while` bodies make the scope chain walk
concrete at the level of statement-by-statement structure.

### 2.6 Prototype Chain

The prototype chain extends the scope chain pattern into a different domain:
method lookup.

**Auto-boxing**: when a method is called on a primitive, the VM temporarily
wraps it in its constructor's object form (`'hello'` → `String` wrapper). The
wrapper provides access to the constructor's prototype methods, then is
discarded.

**Prototype chain lookup**: one-hop lookup for primitives: value →
`Constructor.prototype` → method found. This is a behind-the-scenes event
parallel to scope chain lookup. Reading `str.toUpperCase()` becomes: _look up
`toUpperCase` on `String.prototype` → call it with `str` as the receiver_.

The same mechanism applies to Number methods (`(3.14).toFixed(2)`) and RegExp
methods (`/pattern/.test(str)`). String methods become available once the lookup
mechanism is understood — all prior programs in this chapter used only operators
and literals.

### 2.8 Reading, Writing, Reviewing Code

**PBIS Framework**: Purpose, Behavior, Implementation, Strategy — four
perspectives for reading any program simultaneously. Purpose names what the
program is _for_; Behavior names what it _does_ as observable inputs/outputs;
Implementation names the code-level mechanism; Strategy names the choices that
connect Implementation to Behavior. The letter order is flexible in use; the
four perspectives are the discipline.

"Why not what" comments (Ch1) extend here: comments now explain strategy and
behavioral correlations, grounded in PBIS vocabulary.

**Logging strategies**: structured `console.log` placement — at program
structure boundaries, at variable mutation points, at control-flow forks —
builds on logging-as-observation (2.3) into deliberate, structured debugging.

**Backtracing** reverses the predictive direction: reason from output back to
input. Useful when something went wrong and you don't yet know where.

**Describing programs**: close reading across all PBIS levels — zooming out
(purpose/behavior), zooming in (line-by-line), finding connections, labeling
goals. A structured methodology combining trace tables and PBIS.

**Naming variables**: variable analysis → generic role-based names → specific
domain names → variable roles (fixed value, stepper, flag, gatherer, holder,
temporary). The micro-decisions on names (2.3) now operate as a structured
analysis methodology.

**Linting** recognizes and fixes style issues automatically; the code
conventions of Ch1 enforced by a tool.

**Refactoring** changes implementation or strategy without changing program
output (the `console.log` output as the fixed point). Different from rewriting;
same Behavior preserved.

**Code review** is a structured template: behavior, goals, comments, linting,
variables. **Comparing programs** with the same behavior but different
approaches develops the eye for voice and readability tradeoffs.

### Computational Idioms

These branches apply the notional machine through specific computational idioms.
**2A and 2B are required.** Choose at least one from 2C–2E. 2F is optional.

#### 2A: Logic and Truthiness 🥚

Required. Foundation for reading conditional programs and understanding how
values flow through boolean contexts.

Truthiness and falsiness: every value is truthy or falsy; the six falsy values
(`false`, `0`, `''`, `null`, `undefined`, `NaN`). **Short-circuit evaluation**:
`&&` stops at first falsy, `||` stops at first truthy, `??` stops at first
non-nullish; the expression resolves to the _stopping_ value, not necessarily a
boolean. **Logical compound assignment** (`&&=`, `||=`, `??=`) extends the
short-circuit pattern to assignment.

Short-circuit for default values and guard clauses is the practical payoff.
Refactoring between `if`/`else`, ternary, and short-circuit forms develops
PBIS-grounded judgment about when each form expresses intent clearly.

#### 2B: Strings 🥚

Required. Needed for Chapter 3 user programs (`prompt`/`alert`/`confirm` work
with strings). Builds directly on the prototype chain understanding from 2.6.

String methods cover measuring (`length`), accessing characters (`charAt`, `at`,
bracket notation), searching (`indexOf`, `includes`, `startsWith`, `endsWith`),
transforming (`toUpperCase`, `toLowerCase`, `trim`, `padStart`, `padEnd`,
`repeat`), and extracting / replacing (`slice`, `replace`, `replaceAll`,
`split`).

**Template literals** are a readable alternative to concatenation with
expression interpolation. **`String.fromCharCode`** / **`String.fromCodePoint`**
introduce character encoding — strings as sequences of encoded characters.
**Optional chaining** (`str?.method()`) handles values that might be `null` or
`undefined`. Text-processing programs compose these methods into full programs.

#### 2C: Numbers and Math 🐣

Choose at least one from 2C–2E.

Math methods and constants: `Math.max`, `Math.min`, `Math.abs`, `Math.floor`,
`Math.ceil`, `Math.round`, `Math.random`, `Math.pow`, `Math.sqrt`, `Math.PI`,
`Math.E`. Number helpers: `Number.isNaN`, `Number.isFinite`, `Number.isInteger`,
`parseInt`, `parseFloat`. Number prototype methods: `toFixed(n)`,
`toString(radix)`, `toPrecision`, `toExponential`, `toLocaleString`.

**Floating point representation**: why `0.1 + 0.2 !== 0.3`; precision limits of
IEEE 754; when this matters and how to work around it. Understanding what the VM
actually stores for a number literal.

**BigInt**: integers without precision limits. `42n` literal syntax, `BigInt()`
constructor; `typeof` is `'bigint'`; can't mix with `number` in arithmetic;
integer division truncates. The solution for exact large integer arithmetic.

Programs: geometry and randomness; number crunching, accumulation, running
totals, summarization.

#### 2D: Pattern Matching 🐔

Choose at least one from 2C–2E.

**Regular expressions** are pattern-matching computation: instead of procedural
string operations, declare the _shape_ of what you're looking for.
`/pattern/flags` literals; `.test()`, `.match()`, `.replace()` with regex. The
computational micro-decision between regex and string methods is not just _what
works_ but _what expresses the problem clearly_.

#### 2E: Integers and Bits 🐔

Choose at least one from 2C–2E.

**Bitwise operators** compute at the bit level: numbers as binary structures,
not decimal values. `&`, `|`, `^`, `~`, `<<`, `>>`, `>>>` — each does something
specific at the bit level. BigInt works with bitwise operators (see 2C for
BigInt introduction). The computational micro-decision between bitwise and
arithmetic expresses the problem's structure.

#### 2F: Dates 🐔

Optional extra.

`Date.now()` returns the current timestamp as a number (milliseconds since
epoch). `new Date()` is the sole `new` exception in JEJ; it creates a date
object whose methods all return primitives. `Date.parse(str)` parses a date
string to a timestamp.

Date instance methods: `getFullYear()`, `getMonth()` (0-indexed), `getDate()`,
`getHours()`, `getMinutes()`, `getSeconds()`, `toLocaleDateString()`,
`toLocaleTimeString()`, `toISOString()`. Date computation programs cover elapsed
time, formatting, and internationalization — numbers and arithmetic applied to
time as a domain.

## Learning objectives by layer

### Layer 0 — Mastery

#### NM core

- 🥚 **Evaluation events**: a running program produces an ordered stream of
  observable moments; the tracer captures these automatically; trace tables
  record them by hand
- 🥚 Static source code vs dynamic evaluation: reading a file vs running it
- 🥚 Fix errors: parse errors (creation phase) vs runtime errors (evaluation
  phase)
- 🥚 Identify expressions as syntax that produces a value: operators, literals,
  identifiers, calls, templates, property access, assignment
- 🥚 Trace how a compound expression evaluates step by step: sub-expressions
  resolve in order; precedence; parentheses
- 🥚 **Resolve**: every expression produces exactly one value
- 🥚 All operators (arithmetic, comparison, equality, logical, negation,
  `typeof`, grouping, compound assignment, increment/decrement)
- 🥚 **Implicit coercion**: the VM silently transforms types — a
  _behind-the-scenes_ event, invisible in syntax
- 🥚 **Asserting on expressions**: `console.assert(1 + 1 === 2)` as a claim
  about what an expression resolves to
- 🥚 Block scope as container; nested blocks
- 🐣 Explicit type conversion vs implicit coercion: `Number()`, `String()`,
  `Boolean()`, `parseInt`/`parseFloat`
- 🥚 Binding lifecycle: declare → initialize → available → access / update
- 🥚 `let` vs `const`: what each allows and what it communicates to the reader
- 🥚 Variable names as communication choices: naming conventions (camelCase,
  snake_case, CONSTANT_CASE, PascalCase)
- 🥚 Log variable values; observe state change over time
- 🥚 **Trace tables**: systematic notation of evaluation in steps-format and
  values-format
- 🥚 **Predictive stepping with a debugger**: predict → step → check →
  investigate
- 🥚 **Scope chain walk**: innermost → parent → global; miss/hit
- 🥚 Block scope with variables: `let` declared inside `{}` is not accessible
  outside
- 🥚 **Asserting on bindings**: predict what a binding holds at a specific point
- 🐣 Write code to satisfy assertions sprinkled through a script
- 🥚 Conditionals: `if`/`else if`/`else`
- 🥚 Ternary expressions
- 🥚 While loops, do-while loops, for loops, for-of loops: reading and tracing
- 🥚 `break` and `continue`
- 🐣 Refactoring between equivalent loop forms
- 🐣 Block scope inside control flow
- 🐣 **Auto-boxing**: when a method is called on a primitive, the VM temporarily
  wraps it
- 🐣 **Prototype chain lookup**: one-hop lookup for primitives — a
  _behind-the-scenes_ event parallel to scope chain lookup
- 🐣 Reading `str.toUpperCase()` as: look up on `String.prototype` → call with
  `str` as receiver
- 🐔 The same mechanism for Number methods and RegExp methods

#### Errors as information

- 🥚 An error is not a personal failure and not the machine breaking; it is the
  machine being precisely honest about a spec it can't interpret
- 🥚 Read errors as information — locate the source line; categorize the failure
  type

#### Computational idioms (2A required; 2B required; ≥1 of 2C-2E; 2F optional)

- 🥚 **2A Logic and Truthiness**: truthiness/falsiness; the six falsy values;
  short-circuit evaluation (`&&` / `||` / `??`); logical compound assignment
  (`&&=` / `||=` / `??=`)
- 🥚 **2B Strings**: methods (measuring, accessing, searching, transforming,
  extracting/replacing); template literals;
  `String.fromCharCode`/`fromCodePoint`
- 🐣 Optional chaining: `str?.method()`
- 🥚 **2C Numbers and Math**: Math methods/constants; Number helpers; Number
  prototype methods; floating-point representation; BigInt
- 🐔 **2D Pattern Matching**: regex; `/pattern/flags`; `.test()`, `.match()`,
  `.replace()` with regex
- 🐔 **2E Integers and Bits**: bitwise operators; bit-level computation
- 🐔 **2F Dates** _(optional)_: `Date.now()`, `new Date()` (sole `new` exception
  in JEJ), date methods

### Layer 1 — Rhetoric

- 🥚 **PBIS Framework**: Purpose, Behavior, Implementation, Strategy — four
  perspectives for reading any program simultaneously
- 🥚 "Why not what" comments applied to programs with logic
- 🥚 **Logging strategies**: structured `console.log` placement
- 🐣 **Backtracing**: reasoning backwards from output to input
- 🐣 **Describing programs**: close reading across all PBIS levels
- 🐣 **Naming variables**: variable analysis → generic role-based names →
  specific domain names → variable roles (fixed value, stepper, flag, gatherer,
  holder, temporary)
- 🥚 **Linting**: recognizing and fixing style issues automatically
- 🐣 **Refactoring**: changing implementation or strategy without changing
  program output
- 🐣 **Code review**: structured template (behavior, goals, comments, linting,
  variables)
- 🐣 **Comparing programs**: same behavior, different approaches

### Layer 2 — Methodology

- 🥚 Wear the F hat consciously: predict-trace-verify is _F's bridging activity_
  operationalized
- 🐣 Recognize that the tracer is **both training wheels AND power tool** —
  extends working memory beyond what can be held in head
- 🐔 Discuss when verification by output is sufficient and when internal-event
  prediction is required (the two-layer misconception mechanism)

### Layer 3 — Snippetry

- 🐣 Write a small snippet that uses one computational idiom in three different
  ways
- 🐣 Trace a snippet using one of the idioms you haven't yet chosen (e.g.,
  regex); predict before running

### Layer 4 — Philosophy

_(sparse)_

- 🥚 _(footnote)_ Notice that an "error" is the machine telling you _exactly_
  where it can't interpret your specification. The machine's honesty is
  information you can trust — unlike most channels in life

### Layer 0 — Mastery

#### NM core

- 🥚 **Evaluation events**: a running program produces an ordered stream of
  observable moments; the tracer captures these automatically; trace tables
  record them by hand
- 🥚 Static source code vs dynamic evaluation: reading a file vs running it
- 🥚 Fix errors: parse errors (creation phase) vs runtime errors (evaluation
  phase)
- 🥚 Identify expressions as syntax that produces a value: operators, literals,
  identifiers, calls, templates, property access, assignment
- 🥚 Trace how a compound expression evaluates step by step: sub-expressions
  resolve in order; precedence; parentheses
- 🥚 **Resolve**: every expression produces exactly one value
- 🥚 All operators (arithmetic, comparison, equality, logical, negation,
  `typeof`, grouping, compound assignment, increment/decrement)
- 🥚 **Implicit coercion**: the VM silently transforms types — a
  _behind-the-scenes_ event, invisible in syntax
- 🥚 **Asserting on expressions**: `console.assert(1 + 1 === 2)` as a claim
  about what an expression resolves to
- 🥚 Block scope as container; nested blocks
- 🐣 Explicit type conversion vs implicit coercion: `Number()`, `String()`,
  `Boolean()`, `parseInt`/`parseFloat`
- 🥚 Binding lifecycle: declare → initialize → available → access / update
- 🥚 `let` vs `const`: what each allows and what it communicates to the reader
- 🥚 Variable names as communication choices: naming conventions (camelCase,
  snake_case, CONSTANT_CASE, PascalCase)
- 🥚 Log variable values; observe state change over time
- 🥚 **Trace tables**: systematic notation of evaluation in steps-format and
  values-format
- 🥚 **Predictive stepping with a debugger**: predict → step → check →
  investigate
- 🥚 **Scope chain walk**: innermost → parent → global; miss/hit
- 🥚 Block scope with variables: `let` declared inside `{}` is not accessible
  outside
- 🥚 **Asserting on bindings**: predict what a binding holds at a specific point
- 🐣 Write code to satisfy assertions sprinkled through a script
- 🥚 Conditionals: `if`/`else if`/`else`
- 🥚 Ternary expressions
- 🥚 While loops, do-while loops, for loops, for-of loops: reading and tracing
- 🥚 `break` and `continue`
- 🐣 Refactoring between equivalent loop forms
- 🐣 Block scope inside control flow
- 🐣 **Auto-boxing**: when a method is called on a primitive, the VM temporarily
  wraps it
- 🐣 **Prototype chain lookup**: one-hop lookup for primitives — a
  _behind-the-scenes_ event parallel to scope chain lookup
- 🐣 Reading `str.toUpperCase()` as: look up on `String.prototype` → call with
  `str` as receiver
- 🐔 The same mechanism for Number methods and RegExp methods

#### Errors as information

- 🥚 An error is not a personal failure and not the machine breaking; it is the
  machine being precisely honest about a spec it can't interpret
- 🥚 Read errors as information — locate the source line; categorize the failure
  type

#### Computational idioms (2A required; 2B required; ≥1 of 2C-2E; 2F optional)

- 🥚 **2A Logic and Truthiness**: truthiness/falsiness; the six falsy values;
  short-circuit evaluation (`&&` / `||` / `??`); logical compound assignment
  (`&&=` / `||=` / `??=`)
- 🥚 **2B Strings**: methods (measuring, accessing, searching, transforming,
  extracting/replacing); template literals;
  `String.fromCharCode`/`fromCodePoint`
- 🐣 Optional chaining: `str?.method()`
- 🥚 **2C Numbers and Math**: Math methods/constants; Number helpers; Number
  prototype methods; floating-point representation; BigInt
- 🐔 **2D Pattern Matching**: regex; `/pattern/flags`; `.test()`, `.match()`,
  `.replace()` with regex
- 🐔 **2E Integers and Bits**: bitwise operators; bit-level computation
- 🐔 **2F Dates** _(optional)_: `Date.now()`, `new Date()` (sole `new` exception
  in JEJ), date methods

### Layer 1 — Rhetoric

- 🥚 **PBIS Framework**: Purpose, Behavior, Implementation, Strategy — four
  perspectives for reading any program simultaneously
- 🥚 "Why not what" comments applied to programs with logic
- 🥚 **Logging strategies**: structured `console.log` placement
- 🐣 **Backtracing**: reasoning backwards from output to input
- 🐣 **Describing programs**: close reading across all PBIS levels
- 🐣 **Naming variables**: variable analysis → generic role-based names →
  specific domain names → variable roles (fixed value, stepper, flag, gatherer,
  holder, temporary)
- 🥚 **Linting**: recognizing and fixing style issues automatically
- 🐣 **Refactoring**: changing implementation or strategy without changing
  program output
- 🐣 **Code review**: structured template (behavior, goals, comments, linting,
  variables)
- 🐣 **Comparing programs**: same behavior, different approaches

### Layer 2 — Methodology

- 🥚 Wear the F hat consciously: predict-trace-verify is _F's bridging activity_
  operationalized
- 🐣 Recognize that the tracer is **both training wheels AND power tool** —
  extends working memory beyond what can be held in head
- 🐔 Discuss when verification by output is sufficient and when internal-event
  prediction is required (the two-layer misconception mechanism)

### Layer 3 — Snippetry

- 🐣 Write a small snippet that uses one computational idiom in three different
  ways
- 🐣 Trace a snippet using one of the idioms you haven't yet chosen (e.g.,
  regex); predict before running

### Layer 4 — Philosophy

_(sparse)_

- 🥚 _(footnote)_ Notice that an "error" is the machine telling you _exactly_
  where it can't interpret your specification. The machine's honesty is
  information you can trust — unlike most channels in life

---

## Ch3 Developers, Computers, and Users

Language features: `prompt`, `alert`, `confirm`. All control flow features
(`if`, `while`, `break`/`continue`) were introduced in Chapter 2 and are now
applied in programs where user interactions are the fixed behavioral anchors.

### Metaphor anchor

_**Writing for an audience, the composer's design thinking** — the concert
audience is real: they cheer, boo, throw tomatoes or flowers. The composer
rehearses with the mechanism, workshops with virtuosos, and focus-groups
with listeners. Design thinking across the whole situation._

### Overview

Users enter the picture. Programs now interact via `prompt`, `alert`, `confirm`.
User-visible behavior becomes the anchor that all prior reading, tracing,
refactoring, and reviewing skills must preserve. **Design thinking across the
whole situation begins here.**

All Chapter 2 skills — PBIS, naming variables, logging strategies, backtracing,
refactoring, code review — are practiced here under a new constraint:
user-visible behavior must be preserved.

The chapter's intellectual-agency move: _you make programs for people who will
never see your code, and the test of your work is whether it serves them._ The
user-twin is the V-side of the V/F symmetry.

**The second level of code audience.** Code has two audiences in any
chapter, not one. The first is _deterministic_ — the NM, which evaluates
code literally and predictably (F's territory). The second is
_non-deterministic and emergent_ — the user's lived experience of what
the NM produces. Both V and F write for the second audience; neither
controls it directly. The NM is the instrument; the experience is the
concert. The work of both hats is to set up conditions that make the
experience the program serves possible. (Two-scale instrument reading —
see ontology §6 strand-4 and `metaphor.md` two-scale extension.)

### 3.1 User Input and Output

`prompt`, `alert`, `confirm` are user-facing I/O. They cross a different
boundary than `console.log`: devtools console is **developer space**; these
three are **user space**. The same program can address both audiences in the
same run, in different channels.

The data-flow loop now grows past the Ch1→Ch2 dev↔NM loop. _"The program's data
enters the user through their eyes via a prompt; the user processes it and
transforms it into a response; the response enters the program through `prompt`
and a resolve event."_ Two-way I/O is the foundational pattern of programs that
interact with people.

**Top-level doc comments** name the program's purpose and behavior for the
developer reading it _and_ the user it serves. Their structure is now
program-scale, not line-scale.

`null` makes its first meaningful appearance: it is what `prompt()` returns when
the user cancels. Distinct from `undefined`, distinct from empty string. The
first encounter teaches when each falsy value carries which signal.

**The two-scale reading.** Up to now, the work has been about one instrument:
the machine playing the score (the NM evaluating code). Chapter 3 reveals a
second instrument: the user's experience of the played piece. The user's
experience is _not_ under your direct control — it takes place in the body of
the user, but it _arises from the interaction_ between the parties (the user,
the program, the context). The work the program serves is the _concert_ — the
experience that emerges when machine, audience, and context meet. Both V and F
orient toward that concert; the design discipline of Ch3 is to set up conditions
that make the experience the program serves possible.

### 3.2 Variable Program Behaviors

**Input/output pairs as test cases** in the top-level doc comment extend
predictive assertion from values and bindings (Ch2) to program-level behavior.
_"For input X, the program should output Y."_

**Test coverage** asks: are all conditional paths covered by your test cases?
Branches without test inputs are silent corners where bugs hide.

**Fixing bugs** here means something different from fixing parse or runtime
errors: the code runs without error, but produces wrong user-facing behavior.
The fix is upstream — in the predictive model.

**Modifying programs**: one change at a time; predict; run; note the result.
User interactions become the fixed points in the same way `console.log` output
was the fixed point of refactoring in Ch2.

### 3.3 Validating User Input

A **program structure pattern** emerges: input + validation (while loop) → logic
(conditional) → output. The phases become visible once the program has a user
dimension; they were latent in pure-logic Ch2 programs.

Getting numbers from users: cast to number, validate the cast (`isNaN`,
`Number.isFinite`), validate the range. The user might type anything; the
program must defend the NM-side state-space.

**Full user-story-based top-level comments** structure the doc comment as a user
story with personas and scenarios — the developer audience and the user audience
addressed in one piece of structured prose.

### 3.4 PBIS in User Programs

PBIS (Purpose, Behavior, Implementation, Strategy) from Ch2 now applies to
programs with a user dimension. _Purpose_ is now "why this exists for a user."
_Behavior_ is now what the user experiences, not just what the console shows.

BSI variations in user programs: same user-facing behavior, different strategies
and implementations. **Input validation strategies** and their tradeoffs —
all-in-while-head, boolean flag, do-while — are an early exercise in seeing the
same Behavior expressed three ways.

**Describing user programs** uses PBIS close reading where the user's experience
is now part of the analysis. The developer-facing output of Ch2 is one signal
among several; user-visible behavior is the primary one.

### 3.5 Developing Programs

**Refactoring user programs**: changing code without changing user-visible
behavior. The console output of Ch2 was the fixed point; now user interactions
are the fixed point.

**Writing programs from spec** introduces graduated scaffolding: stepped
examples → starter code → spec + goals → spec only. Each step reduces the
support; by the last step you produce the program independently.

**Reverse engineering**: describe behavior → plan goals/strategy → write code
from an obfuscated program. The discipline of inferring Purpose from
Implementation.

Writing programs from unstructured guidance (plain English, word problems, your
own ideas) is where Vibetoading meets Frogramming most directly: the user-twin
proposes; the NM-twin must produce notation that realizes the proposal.

### 3.6 Plaintext Programs

_The IDE disappears. A plain text editor and a run button: nothing else. No
lenses, no syntax highlighting, no autocomplete, no error highlighting._

Reading and understanding programs without IDE assistance strips away the
tooling that has been scaffolding comprehension. Writing syntactically correct
code without autocomplete or error highlighting relies on internalized knowledge
instead of tool feedback.

The exercise teaches concretely what IDE tools do: by experiencing their
absence, you understand what each tool was compensating for. The crutch is
identified as a tool, not as essential infrastructure.

## Learning objectives by layer

### Layer 0 — Mastery

- 🥚 `prompt`, `alert`, `confirm`: user-facing I/O; devtools console is
  developer space, these are user space
- 🥚 `null`: what `prompt()` returns when the user cancels
- 🥚 **emit events**: data crossing the computation/interaction boundary (the NM
  doc's I/O channel events)

### Layer 1 — Rhetoric

- 🥚 Top-level doc comments: program name, purpose, and behavior
- 🥚 Writing simple programs that process user input or perform string/number
  operations on it
- 🥚 Input/output pairs as test cases in the top-level doc comment
- 🥚 Test coverage: are all conditional paths covered by your test cases?
- 🐣 **Fixing bugs**: code runs without error but produces wrong user-facing
  behavior
- 🐣 **Modifying programs**: one change at a time, predict, run, note the
  result; user interactions as fixed points
- 🥚 **Program structure pattern**: input + validation (while loop) → logic
  (conditional) → output
- 🥚 Getting numbers from users: cast to number, validate the cast, validate the
  range
- 🥚 Full user-story-based top-level comments
- 🥚 **BSI variations in user programs**: same user-facing behavior, different
  strategies and implementations
- 🥚 Input validation strategies and their tradeoffs: all-in-while-head, boolean
  flag, do-while
- 🐣 **Describing user programs**: PBIS close reading where Purpose is now "why
  this exists for a user"
- 🐣 **Refactoring user programs**: changing code without changing user-visible
  behavior
- 🐥 **Writing programs from spec**: graduated scaffolding (stepped examples →
  starter code → spec + goals → spec only)
- 🐔 **Reverse engineering**: describe behavior → plan goals/strategy → write
  code from an obfuscated program
- 🐔 Writing programs from unstructured guidance (plain English, word problems,
  your own ideas)
- 🐣 Reading and understanding programs without IDE assistance (plaintext mode)
- 🐣 Writing syntactically correct code without autocomplete or error
  highlighting
- 🐥 Appreciating concretely what IDE tools do (by experiencing their absence)

### Layer 2 — Methodology

- 🥚 Wear the V hat consciously: prototype-test-iterate is V's bridging activity
  operationalized — even on tiny user programs
- 🥚 The **data-flow loop** anchor: _"The program's data enters the user through
  their eyes via a prompt; the user processes it and transforms it into a
  response; the response enters the program through `prompt` and a resolve
  event…"_ — this is the Ch1→Ch2 dev↔NM loop grown into the dev↔NM↔user loop
- 🐣 Operate the V/F coordination bridge: users' needs drive data shape; data
  shape supports flexible user experiences
- 🐔 Engage in V↔F coordination on a small interaction: propose a use-case
  experience, discover what the NM affords, iterate. Notice how each step
  changes what you can propose next — and how you start picking up the other's
  craft along the way (the Bakhtiarian dynamic, open-ended)
- 🐔 Hold the two-scale reading: the machine plays the score (NM evaluation);
  the user's experience arises from interaction; the _concert_ is what your work
  serves

### Layer 3 — Snippetry

- 🐣 Write a snippet whose user-visible behavior is the same as another
  snippet's, but whose implementation/strategy differs
- 🐣 Sketch a user interaction in plain English; predict what NM events would
  need to happen; implement and verify

### Layer 4 — Philosophy

_(sparse)_

- 🥚 _(footnote)_ The user experiences the dynamic side of your program but
  never the static side. What does that asymmetry mean for design?
- 🐣 _(easter egg)_ Recognize the cybernetic loop in the data-flow anchor —
  circular causality is implicit. Wiener referenced in deeper section.

---

## Ch4 Developers, Computers, Users, and Agents

No new language features. This chapter applies all Chapter 1–3 skills in
collaboration with an LLM. 🤖 Agents are a fourth audience: they read and
understand code differently from 🧑 humans, and writing _for and with_ them
requires its own communication skills.

### Metaphor anchor

_**The composer-virtuoso asymmetric duet** — with an alien virtuoso this
time. Dazzling, fast, pattern-rich, but cognitively distinct from human
virtuosos. Collaboration is specifically different, and this chapter digs
into why._

### Overview

You're now ready for the alien virtuoso because Chapters 1–3 gave you the
experiences that built the twins. The principle from README.md § How Learning
Happens — that understanding is non-delegable — is what made the chapter
ordering necessary. This chapter is where the LLM joins the work, with the twins
already running.

The chapter's intellectual-agency move: _you direct an alien intelligence — and
you stay in charge of what gets built._ Twinning the LLM means twinning a
process that twins what _you_ twin (the user, or the NM). Your job is to align —
and to relish productive divergence.

**Chapter 4's shape draws on a 4-level AI-adoption model** originally developed
by Evan Cole with collaborators Janet Tilstra and Josenne Peña (the curriculum
author's prior work). That model has since been refined into the framework now
canonical in `ontology.md`: the **§8 strata stack** (a general-systems
view of where any system lives, with AI as one instance), **§9 substrate
substitution** (deterministic → non-deterministic at artifact-logic), and **§10
three roles of agential AI** (Role 1 study partner / Role 2 dev collaborator /
Role 3 active component). **Chapter 4 = Role 2 (dev collaborator)** — Role 1
already worked quietly across Ch0–3; Role 3 is deferred to later learning. The
organizing line for the chapter: _you twin the AI as collaborator — F's lens
reads it as cognitive substrate (NM-grounded mode); V's lens reads its
behavioral surface (user-grounded mode); two modes of collaboration, one JEJ
artifact under construction_. See ontology §10 for the canonical framework.

**The both-twins corner of the twin/process 2×2** (see `ontology.md`
§3): Ch4 develops the both-twins state in its LLM-collaborative form — V and F
operating together alongside an alien third intelligence. The user-twin and the
NM-twin both stay yours; what gets delegated is the production of the code that
satisfies both.

### 4.0 Wrapping premise — code is the UI for the NM

Up to now this course has framed code text as **what you write to talk to the
four audiences**. There's a deeper way to see the same fact: source code is the
**UI / control panel** through which a programmer operates the notional machine.
Authoring code is _one_ way to operate that panel. Describing intent to an LLM
is another. Either way, the NM is the thing the panel controls.

LLMs let you **delegate operation of the control panel** while still owning the
machine. The same Frogrammer/Vibetoader spectrum from Ch0.3 applies — but now to
your conversation with the alien virtuoso, not just to your typing:

- 🔬 **NM-grounded conversation** (Frogramming-with-delegation) — _"Make the NM
  declare a `const balance = 0`, then enter a `while` loop that decrements it
  until it hits zero."_ You specify behavior in NM terms. You
  predict-trace-verify the LLM's output against the NM. The LLM operates the
  panel for you; you stay grounded in the machine.
- 🎨 **User-grounded conversation** (Vibetoading-with-delegation) — _"When the
  user types their amount and clicks OK, count down to zero and tell them when
  it's done."_ You specify behavior in user-experience terms. You evaluate
  against user outcomes; the machine is intentionally delegated to the LLM
  virtuoso.

Both produce text in the same control panel; the difference is **which audience
you twin during the conversation**. This is why every section below revisits a
Ch1–Ch3 audience: agent communication is what you've already been doing, just
refracted through the alien.

**The visual NM view (`embody/` + study lenses) becomes load-bearing here.**
When you delegate the control panel, you can no longer rely on the act of typing
to keep your NM understanding sharp. Visual debuggers let you observe, predict,
and debug the machine _directly_ — the NM view that exists regardless of who (or
what) wrote the code text. Frogramming with delegation is only sustainable if
you keep the direct NM view alive.

### 4.1 What is an LLM?

An LLM is not a database, not a keyword-lookup system, and not a search engine
over a corpus. It is a model that predicts the next token from context.
"Predicting the next token" in practical terms means: given everything in the
conversation so far, the model produces the most plausible continuation
according to patterns it learned during training.

Same prompt, different outputs is **stochasticity**: the model samples from a
probability distribution; the temperature setting controls how much it strays
from the most probable continuation. Different runs of the same prompt visit
different points on that distribution.

LLM "cognition" differs from human reasoning in several ways: no episodic memory
across conversations by default; no persistent goals; no embodiment; no
metacognitive feedback during generation. The model has patterns; you have
understanding. Conflating the two produces the **jagged frontier**: domains
where the model is fluent right next to domains where it's confidently wrong.

The **Gell-Mann Amnesia effect** is what happens when you read an LLM's output
on a topic you understand, notice it's wrong, then trust it on the next topic
where you can't check. The effect is older than LLMs; LLMs just made it ambient.

### 4.2 Collaborating in Prose

Prose to the LLM is your control panel for it. The quality of the prose shapes
what the LLM produces. The same predictive discipline that drives Ch2's
expression assertions applies here: form a prediction about what your prompt
will produce, observe the actual output, update your model.

Practical moves:

- Hypothesize what patterns an LLM response might be matching
- Write clear, specific prompts that provide necessary context
- Ask the same question multiple ways; observe how outputs vary
- When a response isn't useful, identify what to change and observe the effect
- **Predictive stepping at the prompt level**: predict how changes to a prompt
  will affect output, then test

Reflecting on when it helped to let the LLM lead versus when you needed to drive
is the metacognitive complement: the discipline of noticing your own role in the
collaboration.

### 4.3 Agents and Developer Communication

_Revisits Chapter 1: comments, variable names — with an LLM collaborator._

The developer audience is where LLMs are most reliably useful: comments and
variable names are pattern-rich, conventionally bounded, and don't require
strong NM-twinning. Read LLM-generated comments and evaluate whether they are
helpful for developers. Read LLM-suggested variable names and evaluate whether
they follow naming conventions.

**Perspective-Take**: hypothesize what training patterns produced a specific
comment or name. **Articulate**: write prompts that give the LLM enough context
to generate useful developer-facing output. **Calibrate**: where is the LLM
reliable at developer-facing output? Where does it fail? **Delegate**: is this a
task where the LLM adds value, or does using it undermine your learning?

### 4.4 Agents and Computer Communication

_Revisits Chapter 2: tracing, asserting — with an LLM collaborator._

This is where the asymmetry shows. LLMs are better at _generating_ code than at
_tracing_ it. They produce plausible-looking but often wrong traces. The skill:
evaluate LLM-generated traces for correctness, not trust them.

Trace LLM-generated code using predictive stepping and trace tables (Ch2 skills
applied to unfamiliar code). Have the LLM trace code, then evaluate whether its
traces correctly track state. Have the LLM explain code, then describe whether
the explanation matches a PBIS analysis.

**Calibrate** this asymmetry deliberately: use the LLM where it's strong, do the
work yourself where it's weak. **Delegate** the question: when should you trace
yourself vs ask the LLM to trace? The answer is context-dependent — sometimes
the tracing _is_ the learning.

### 4.5 Agents and User Communication

_Revisits Chapter 3: user programs — with an LLM collaborator._

The full user-program skill stack from Ch3 now operates over LLM-generated code:
reading, PBIS evaluation, code review, test design, debugging, documentation
review. Each Ch3 skill — _Refactor_, _Describe_, _Test_, _Review_ — applies, but
now your collaborator is the alien.

Specific moves: apply full PBIS evaluation to LLM-generated programs;
code-review LLM-generated code using the established framework; design test
cases; describe gaps between your intent and LLM output using PBIS vocabulary;
debug LLM-generated code (detect bugs, identify root causes, fix them); generate
and review full documentation.

**Iterate**: the full collaboration loop is prompt → evaluate → refine → repeat.
The discipline is to keep your twins running through the loop, not to delegate
the twins to the LLM.

### 4.6 Looking Back, Looking Forward

Up to this point the LLM has done the notation work — writing the code — while
you have done the design work. That's the authoring-partner frame, and it's the
right one for finding your bearings. But it's a simplification of a moving
target.

**Agentic AI systems** are emerging — LLMs that don't just write notation but do
design work too: planning, decomposing problems, making architectural choices,
calling tools, modifying state autonomously. That's a more complex collaboration
than the one this chapter covered. It doesn't replace your role so much as shift
what you attend to — from writing the code to specifying observable outcomes
that humans can still evaluate, directing a system that does more than
transcribe. Flag this as territory for post-curriculum learning; _Welcome to
Algorithms_ picks it up. Chapter 5 will return briefly to it in its closing
moments.

### 🎨 4.7 Vibetoading with the LLM

Vibetoading-with-delegation is its own discipline. Decompose a complex request
into smaller, verifiable steps; wear the Vibetoader hat intentionally when the
moment calls for it. Evaluate code you didn't write or review during generation
(PBIS autopsy). Identify where the jagged frontier manifested in a concrete
collaboration. Reflect on the difference between _"it runs"_ and _"I understand
it"_ — the boundary the LLM tests every day.

The failure mode here is twin-ignored (no user-twin, no NM-twin) — what the §3
2×2 calls the no-twin corner. Vibetoading-with-LLMs done with a user-twin is
V-corner work; done without any twin is the no-twin corner, not Vibetoading. The
distinction matters because the practice that works and the practice that decays
look similar from outside.

## Learning objectives by layer

### Layer 0 — Mastery

- 🥚 Recognize the visual NM view (`embody/` + study lenses) as the _direct_ NM
  view that complements the code text
- 🐣 Trace LLM-generated code using predictive stepping and trace tables
- 🐣 Have the LLM trace code, then evaluate whether its traces correctly track
  state
- 🐥 Evaluate LLM-generated traces for correctness — they often produce
  plausible-looking but wrong traces; identify why

### Layer 1 — Rhetoric

- 🥚 Explain why an LLM is not a database or keyword-lookup system
- 🥚 Describe what "predicting the next token" means in practical terms
- 🥚 Explain why the same prompt can produce different outputs (stochasticity)
- 🐣 Describe at least 2 key differences between LLM "cognition" and human
  reasoning
- 🐣 Identify when an LLM is likely to be unreliable (the jagged frontier)
- 🐥 Use the strata-and-roles framework (ontology §8 + §10) to discuss AI at
  the appropriate position relative to your work
- 🐥 Explain the Gell-Mann Amnesia effect in the context of LLM output
- 🥚 Given an LLM response, hypothesize what patterns it might be matching
- 🥚 Write clear, specific prompts that provide necessary context
- 🐣 Ask the same question multiple ways and observe how outputs vary
- 🐣 When a response isn't useful, identify what to change and observe the
  effect
- 🐣 **Predictive stepping at the prompt level**: predict how changes to a
  prompt will affect LLM output, then test
- 🐥 Explain why an LLM produced incorrect or unexpected output
- 🐥 Reflect on when it helped to let the LLM lead vs when you needed to drive
- 🥚 Read LLM-generated comments and evaluate whether they are helpful
- 🥚 Read LLM-suggested variable names and evaluate whether they follow
  conventions
- 🐣 **Perspective-Take**: hypothesize what training patterns produced a
  specific comment or name
- 🐣 **Articulate**: write prompts that give the LLM enough context to generate
  useful developer-facing output
- 🥚 Read LLM-generated programs and identify what they do
- 🐣 Apply full PBIS evaluation to LLM-generated programs
- 🐣 Code review LLM-generated code using the established framework
- 🐣 Design test cases for LLM-generated programs
- 🐣 Describe gaps between your intent and LLM output using PBIS vocabulary
- 🐥 Debug LLM-generated code: detect bugs, identify root causes, fix them
- 🐥 Full documentation generation and review

### Layer 2 — Methodology

- 🥚 Use NM-grounded conversation explicitly: specify behavior in NM terms;
  predict-trace-verify the LLM's output against the NM
- 🥚 Use user-grounded conversation explicitly: specify behavior in
  user-experience terms; evaluate against user outcomes
- 🐣 **Calibrate**: where is the LLM reliable at developer-facing output? Where
  does it fail?
- 🐣 **Calibrate** at the trace level: LLMs are better at generating code than
  tracing it; use this asymmetry deliberately
- 🐣 **Delegate**: is this a task where the LLM adds value, or does using it
  undermine your learning?
- 🐣 **Iterate**: full collaboration loop — prompt → evaluate → refine → repeat
- 🐣 Decompose a complex request into smaller, verifiable steps (the
  twin-grounded alternative to twin-ignored or twin-wrong LLM use)
- 🐣 🎨 Wear the Vibetoader hat intentionally — choose it for the scope where
  it's right
- 🐥 Apply §10 Role 2 (dev collaborator) to Ch4 work: twin the AI as
  collaborator through F's lens (NM-grounded mode) or V's lens (user-grounded
  mode)
- 🐔 **Code is content, not deliverable** — AI-generated code is material to
  study, not work-product to ship

### Layer 3 — Snippetry

- 🐣 Have an LLM produce a snippet you can predict-trace-verify; evaluate where
  its NM-model diverges from yours
- 🐣 Use the LLM to surface affordances neither of you saw alone (the L2 → L3
  transition: defensive divergence-detection → offensive divergence-discovery)

### Layer 4 — Philosophy

- 🐣 Compare LLM "theory of mind" to human theory of mind: what transfers, what
  doesn't
- 🐥 Locate LLM-collaborative work on the twin/process 2×2 (see ontology §3):
  what determines whether a given collaboration session lands in the both-twins
  corner or slides toward pure process
- 🐔 Recognize the emergence of **agentic AI systems** (LLMs doing design work,
  not just notation) as a more complex development than the authoring-partner
  frame covers; flag as territory for post-curriculum learning
- 🐥 _(deeper section)_ Encounter Friston's "A Duet for One" — _"understanding
  just IS the alignment of generative models into a single coherent predictive
  process"_ — and consider: does this framing illuminate your conversations
  with the alien virtuoso, or strain when applied to a non-biological partner?
- 🐔 Reflect on the difference between "it runs" and "I understand it" — the
  boundary the LLM tests every day

---

## Ch5 Developers, Computers, Users, Agents, and You

### Metaphor anchor

_**The composer's daily practice** — small, complete pieces written for
the composer's own practice. Variations on a theme, études on a single
technique, sketchbook entries exploring an idea — Ligeti's Musica
Ricercata, Beethoven's sketchbooks, Bach's inventions. A serious genre
in its own right._

### Overview

Training wheels come off. You Frogram for yourself through 💭 **snippetry**:
small, complete, self-contained programs as an ongoing practice. You explore
JavaScript's full multi-paradigmatic range, develop your compositional voice,
and discover that Frogramming has value beyond productivity: for mastery,
exploration, delight, the steady upkeep of one's craft, and the new thoughts it
lets you think.

Snippetry is the answer to a central question of the curriculum: _why write code
when LLMs can write the notation? How do I keep my Frogramming sharp —
particularly my NM-fluency in a language — when full-codebase work no longer
provides the daily reps?_ Snippetry is the experience-form of NM-maintenance —
the daily reps that keep the automated library of past experiences alive once
full-codebase work no longer provides them.

**Arc closure.** The arc that opened in Ch1 with _write for future-you as
an audience_ closes here as _write for yourself as a human_. Same self,
end-to-end.

The chapter's intellectual-agency move: _you can use programming as a tool for
thought, on whatever problems and ideas interest you, for the rest of your
life._ Snippetry is how the Frogrammer keeps the NM alive between full-codebase
projects — and how the Vibetoader sketches quick experiences without the weight
of production.

**The both-twins corner of the twin/process 2×2** (see `ontology.md`
§3): Ch5 develops the both-twins state in its merged form — V and F operating as
a single integrated practice. Snippetry is where the two stances stop being
separate hats and start being the same gesture: each small program is at once a
user-twin sketch and an NM-twin probe. The Bakhtiarian-loop unification names
this in operational terms.

> The best authors and the best JavaScript developers are those who obsess about
> language, who explore and experiment with language every day and in doing so
> develop their own style, their own idioms, and their own expression.
>
> — [Angus Croll](https://anguscroll.com/),
> [If Hemingway Wrote JavaScript](https://anguscroll.com/hemingway/)

### 5.1 The Notional Machine and Programming Paradigms

**JavaScript is multi-paradigmatic.** Chapters 1–4 taught imperative
programming. Chapter 5 is where you discover that the same language supports
fundamentally different ways of thinking about computation: functional,
object-oriented, declarative. Paradigm exploration is a core activity, not a
sidebar.

Once you understand programs as event streams, the paradigm distinctions become
grounded in the same vocabulary. All paradigms run on a machine that produces
evaluation events. What differs is the _relationship_ the programmer has to that
event stream — how explicitly and in what terms the event sequence is specified:

| Paradigm                                             | Relationship to the evaluation event stream                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Imperative** (JS Ch1–4)                            | Explicit event sequence — every step specified. JS's actual NM vocabulary.                                                                        |
| **OOP in JS** (Ch5)                                  | Syntactic organization on top of the same machine — method calls = prototype chain walk + function call events. A style, not a different machine. |
| **OOP in purpose-built languages** (Java, Smalltalk) | Genuinely different NMs — message-send events, virtual dispatch. Different event vocabulary.                                                      |
| **Functional in JS** (Ch5)                           | Compose transformations; the same machine generates events from function application. Same machine, different organization.                       |
| **Declarative** (regex, SQL)                         | Specify the goal; delegate event generation. Maximum decoupling from the event sequence.                                                          |
| **Event-driven** (JS Ch5 event loop)                 | External events — clicks, timers — enter the stream as first-class participants.                                                                  |

Imperative programming — what you learned in Chapters 1–4 — is explicit about
the event sequence: every step is specified, every event directed. Other
paradigms have different relationships to that stream. You explore them here.

**Looking further: Welcome to Algorithms.** The evaluation event vocabulary you
built in Ch2 is one conceptual bridge from embodied computing to CS. WtA's
step-counting and Big O analysis require the same cognitive habit — counting
discrete operations — though the abstraction differs: evaluation events are
implementation-level; algorithmic steps are defined relative to input size and
are intentionally implementation-agnostic. The machine you learned makes that
work tractable and visible.

### 5.2 The training-wheels-off commitment

Chapter 5 is where you **graduate from the scaffolded curriculum environment**
into real browser evaluation with real consequences.

**What comes off:**

- **JEJ language-feature constraint** — you can use any and all JS language
  features. Newly available: user-defined functions, closures, arrays, objects,
  the event loop, classes, `async`/`await`, generators, `fetch`, `Promise`,
  `Symbol`, `Proxy`, ES modules, DOM manipulation, Canvas, and everything else.
- **The web worker sandbox** — code runs directly in the browser (iframe). If
  your program freezes, the page freezes. Real consequences, real environment.
  Optional configurable loop guards are available but not enforced.
- **Enforced formatting** — format your code however you prefer.
- **Study Lenses NM visualizations** — the curriculum's tracer-based NM
  visualizations are no longer the primary tool.

**What replaces it:**

- **Full browser devtools debugging toolkit** — line breakpoints, conditional
  breakpoints, logpoints, `debugger` statements, step over/into/out, scope
  panel, watch expressions, call stack, pause on exceptions, DOM breakpoints,
  event listener breakpoints, console in paused context. You learn all of it.
- **External NM visualization tools** — open-in buttons for specialized tools
  (loupe for event loop, promisees for Promises, etc.) with different notional
  machine perspectives. Training wheels come off, but power tools are available.
- **Four sandbox modes** offering different constraints and affordances:
  - **Script without HTML** — pure computation, closest to Chs 1–4
  - **Module without HTML** — introduces ES module semantics
  - **HTML file with a script tag** — DOM available, split view of code and
    rendered page
  - **HTML file with a module tag** — DOM + ES modules

  You learn to distinguish "pure" scripts (computation only) from scripts
  embedded in a full page, and to choose the mode that fits your snippet's
  needs.

### 5.3 The collaborative gist system

You can save snippets as gists, browse gists saved by other learners, and remix
them. This makes Chapter 5 collaborative across all learners: your practice is
your own, but it's enriched by what others are exploring. The remix workflow —
take someone else's snippet, change its intent, make it yours — is a core
snippetry activity.

_"You" is the fifth audience_ — both singular (your own practice) and plural
(sharing with and remixing from peers through the collaborative gist system).

### 5.4 Balance: broad exploration and productive constraint

The practice balances **broad exploration** and **productive constraint**. You
develop your own sense of which balance serves your learning and your voice.
There's no rigid split between types of snippet; the practice is about finding
the balance that works for you right now, and letting it change as you grow.

The seven sub-areas of the LOs below give shape to the practice — but they are
facets, not a sequence. Most weeks you wear several of these hats in a single
session.

### 5.5 Looking forward — agentic AI

Chapter 4 framed LLMs as authoring partners. The world is moving past that
frame. **Agentic AI systems** — LLMs that plan, decompose problems, make
architectural choices, call tools, and modify state autonomously — are arriving.
The collaboration shape changes; the specification work shifts; the verification
work shifts. Welcome to Algorithms picks this up.

Snippetry is one of the things that survives the shift, because the point of
writing a snippet has never been to ship the code. It's to keep the NM alive,
develop your voice, and think with the medium. Whatever LLMs become next, _doing
it yourself sometimes_ remains the practice that builds the model AI can't have
for you.

## Learning objectives by layer

### Layer 0 — Mastery (maintenance mode)

- 🥚 Trace code with the full browser devtools debugging toolkit: breakpoints,
  conditional breakpoints, logpoints, `debugger` statements, step over/into/out,
  scope panel, watch expressions, call stack, pause on exceptions, DOM
  breakpoints (HTML modes), event listener breakpoints. Predict each step before
  stepping
- 🥚 Predict a program's complete behavior (output, final binding states, error
  or no error) without stepping, then verify with a single run — the debugger is
  scaffold; prediction without it is the graduation
- 🐣 Use the devtools toolkit to isolate a bug: combine debugging features
  strategically; describe divergence using NM vocabulary
- 🐣 Choose and use external NM visualization tools (loupe, promisees) for
  specific NM concepts; explain the tool choice and what it revealed
- 🥚 Extend your NM to a JS feature outside JEJ (your choice: functions, arrays,
  objects, classes, async/await, generators). Read documentation, form a
  prediction, write a snippet, verify, update
- 🐣 Explore "the weird parts": find edge cases and surprising JS behaviors;
  predict, verify, explain using NM concepts
- 🐥 Extend your NM to a second unfamiliar feature; reflect on whether the
  learning process was easier the second time and why
- 🐔 Explore "historic" vs "modern" JS: write the same thing using a historic
  idiom and its modern equivalent; trace both

### Layer 1 — Rhetoric

- 🥚 Write a snippet for a specific audience beyond yourself; save as a gist
- 🐥 Conduct a full self-review of one of your own snippets: PBIS,
  micro-decisions, NM trace, voice reflection

### Layer 2 — Methodology

- 🥚 Name the major programming paradigms JS supports (imperative, functional,
  object-oriented, declarative); identify which paradigm a snippet uses
- 🐣 Solve the same problem in two different paradigms; trace both; describe how
  the NM behaves differently
- 🐣 Implement the same paradigm with different features (functional with
  loops+variables vs array methods; OOP with prototypes vs classes)
- 🐥 Translate a snippet between paradigms: preserve behavior; articulate what
  changed at Strategy/Implementation (PBIS) and what stayed at Purpose/Behavior
- 🐣 Snippetry as **perspective-stacked V and F simultaneously** — writing
  snippets as both at once, toward a purpose of your choosing
- 🐥 Recognize when V and F merge in your own practice (the Bakhtiarian-loop
  unification — the merged form of the both-twins corner from the twin/process
  2×2 in ontology §3)

### Layer 3 — Snippetry

- 🥚 Write a snippet under a productive constraint (a single feature in 3 ways;
  a specific error on purpose; one loop + zero conditionals)
- 🥚 Read and trace a snippet from the corpus or a peer's gist that uses
  unfamiliar JS; apply PBIS analysis
- 🐣 Write a variation on an existing snippet: same purpose, different strategy;
  articulate what changed and why
- 🐣 Remix a peer's snippet: change its intent, not just implementation; make it
  yours
- 🥚 Make yourself laugh: write a snippet whose output, structure, or concept
  genuinely amuses you (humor lives in what the program does, not in funny
  variable names)
- 🐣 Surprise yourself: write a snippet where you don't fully know what will
  happen; describe what surprised you
- 🐣 Discover something unexpected: encounter a behavior you didn't predict;
  investigate it; explain it
- 🐥 Impress yourself: write a snippet that does something you didn't think you
  could do a month ago
- 🥚 Identify at least 5 micro-decisions in a snippet; describe what each
  communicates; name alternatives and how they'd change the voice
- 🐣 Write the same program two ways that reveal different voices: same
  behavior, different micro-decisions
- 🐥 After writing 5+ snippets, identify your own recurring patterns with
  specific examples
- 🥚 Choose your sandbox mode deliberately: explain the constraints and
  affordances of each mode for a given snippet idea
- 🐥 Design your own snippet prompt targeting a specific NM concept; interesting
  enough that a peer would want to try it
- 🐣 _(cross-medium translation)_ Write something like _insomnicat.js_:
  translate a non-code concept into a small JS program

### Layer 4 — Philosophy

- 🐔 Articulate why Frogramming-for-its-own-sake remains valuable in an
  LLM-assisted world — your answer, grounded in your experience
- 🐔 Recognize that **agentic AI systems** (LLMs doing design work, not just
  notation) are arriving; identify a concrete example and reflect on what it
  means for the design-vs-notation split
- 🐥 _(deeper section)_ Encounter the _Vibetoading/Frogramming mu tribute_ — the
  GEB-flavored image of V and F as mutual access points to a single merged
  practice. Recognize the parallel without the curriculum laboring it
- 🐥 _(deeper section)_ Self-twinning as a theory of consciousness: the
  predictive model of self is the seat of self. The arc you've traveled — Ch1's
  write-for-future-you to Ch5's write-for-yourself-
  the-audience-you-are-becoming — is the curriculum's operational encounter with
  that idea (see ontology §5 L4 matrix, Twinning row, and the Preamble's
  "audience YOU are becoming" table)
- 🐔 _(deeper section)_ The data-thread reading at full depth: the entire
  embodied phenomenon from theory to domain is data flowing through and changing
  the physical world — in theory changing the thinker, in computation exerting
  control on hardware, in interaction modifying the user, and the user
  transforming the domain
- 🐔 Reflect: what did you become through this course that AI cannot become for
  you?

---

## Reading note

How to use this file's 5-layer structure:

- **Body prose of `README.md`** carries **L0 and L1** — the chapter's primary
  content
- **Sidebars + V/F dialogues** carry **L2** — necessary for L2 reading;
  skippable for L1 reading
- **End-of-chapter snippetry prompts** carry **L3**
- **Footnotes, side notes, easter eggs, references** carry **L4** — fully
  optional, for the attuned reader

When this file is later folded back into the prose `README.md`, the LOs above
guide what each region of each chapter delivers.

---

## Cross-references

- `ontology.md` — the reference framework these chapters instantiate
- `guide.learners.md` — the _why_ addressed to learners
- `guide.authors.md` — the _why_ addressed to curriculum authors /
  forkers / contributors
- `guide.community.md` — the _why_ addressed to partner
  communities, mentors, cohort hosts
- `README.md` — the existing prose course (read-only for the current redraft)
- `narrative/README.md` — the composer/virtuoso metaphor system
- `assets/spiral-curriculum.png` and `assets/curriculum-spider-web.svg` — the
  topology + trajectory views
- `just-enough/javascript/` — the JEJ → NM → embody → lenses → orchestrator
  infrastructure
