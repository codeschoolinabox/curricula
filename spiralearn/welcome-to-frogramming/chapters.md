# Welcome to Frogramming — Chapters

> **Purpose**: chapter-by-chapter redraft with 5-layer learning-objective grids,
> drawing framing from `ontology.md` and the intellectual-agency meta-LO from
> `guide.learners.md`. Six chapters (Ch0–Ch5), each with a unified overview +
> five layer-headed LO lists (`### Layer 0` through `### Layer 4`).
>
> **Companions** (siblings, by co-location):
>
> - `ontology.md` — the _what_ (reference voice)
> - `guide.{learners,authors,community}.md` — the _why_ per audience
> - `study-lenses.md` — the technical-reader companion for the infrastructure
>   that delivers chapter content
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

The student is themselves an audience throughout the curriculum, at increasing
levels of recursion. This is the audience ladder read from the inside — the
YOU-becoming reading of the same arc. Each chapter adds a perspective future-you
must hold. The course teaches the student to BECOME a poly-perspective self.

| Chapter | Future-you is…                                                                  |
| ------- | ------------------------------------------------------------------------------- |
| Ch1     | future-you reads code (basic dev-reader)                                        |
| Ch2     | future-you traces NM (added perspective: NM)                                    |
| Ch3     | future-you considers users (added perspective: user)                            |
| Ch4     | future-you collaborates with LLMs as a duet (first conscious perspective-stack) |
| Ch5     | future-you snippets-as-merged-V/F (perspective-stacked-singularity)             |

### Spiral (skills) vs ladder (audiences)

Two dimensions organize the chapter sequence:

- The **ladder** (chapter sequence) adds an audience to the learner's awareness
  — one new audience per chapter (developers → computer → users → agents →
  self).
- The **spiral** (within each chapter) revisits skills at increasing depth: read
  → trace → describe → modify → write. Bruner's spiral curriculum
  operationalized at the skill scale.

Study Lenses generates exercises that drive the spiral at the exercise level.
Each LO marks where a skill is _first introduced_, not where it ends.

### Per-chapter metaphor anchors

Each chapter has a single metaphor anchor (named once in each chapter's overview
block, not repeated per layer):

| Chapter | Metaphor anchor                                                |
| ------- | -------------------------------------------------------------- |
| Ch0     | the recital as rhetorical situation                            |
| Ch1     | the score as inter-composer communication                      |
| Ch2     | studying the instrument's mechanism                            |
| Ch3     | writing for the audience; the composer's design thinking       |
| Ch4     | the composer-virtuoso asymmetric duet (with an alien virtuoso) |
| Ch5     | the composer's daily practice (Ligeti / Bach / sketches)       |

The metaphor system is **teaching apparatus, explicitly NOT structural guide** —
see `metaphor.md` for the canonical treatment.

---

## Ch0⟡ What is Programming?

Language features — demonstrated, not authored: comments, `console.log`,
`prompt` / `alert` / `confirm`, string literals, and `null` (as `prompt`'s
cancel answer). Just Enough JavaScript starts here. You read, predict, and run;
your first _writing_ comes in Ch1⟡.

### Metaphor anchor

_**The recital as rhetorical situation** — an entire performance event with its
audience, its performers, its instrument, and the score that ties them together.
The score is itself communication between composers: other composers read it for
intent and style, long before (or entirely instead of) ever hearing it
performed. Code has the same property._

### Overview

You meet the rhetorical model (source code as communication addressing multiple
audiences simultaneously), the Vibetoading/Frogramming distinction, and the
positioning of this course — **F&V** for short, from its title _Frogramming &
Vibetoading: Affordance-Discovery Cycle(s)_ — in the broader space of
programming and computer science.

The chapter also makes the course's positioning promise explicit: **what this
course teaches is the affordance-discovery cycle; Just Enough JavaScript is the
medium.** You meet every audience of source code at its boundary primitive —
demonstrated, not authored — and you live one tiny turn of the cycle on a
program you only read, predict, and run. Two named cliffhangers are set here
that later chapters cash.

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
agents is its own communication skill, developed in Chapter 3⟡.

The central skill this course teaches is writing code that **addresses all four
audiences simultaneously**. You meet all of them in this chapter, at their
boundary primitives (§0.4), before you write a line; the chapters that follow
deepen one twin at a time — the computer in Ch1⟡, users in Ch2⟡, agents in Ch3⟡,
and you in Ch4⟡ — with the developer-twin woven through them all as craft. They
all matter in real work.

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

### 0.2 Positioning F&V

Programming is a large space. Before spending time inside one part of it, it
helps to know roughly where that part is — and what it is not.

The following distinctions are not knowledge to memorize. They are landmarks.
You will encounter each one again as the course progresses, and what feels
abstract now will become concrete. For now, use them as orientation.

<strong>What F&V is and what it isn't:</strong>

| This course                                                                                                                                                                                    | Not this course (yet)                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Embodied computation** — learning to read, predict, and direct one specific notional machine through the notation it interprets. Embodied work makes theoretical work tractable and visible. | **Theory of computation** — the formal/mathematical framework defining what computation IS (Turing machines, lambda calculus, complexity classes). Beyond this course. |
| **Programming** — specific use cases, concrete inputs and outputs, particular implementations                                                                                                  | **Computer Science** — general classes of problems and algorithms, asymptotic analysis, formal proofs of correctness                                                   |
| **Local fluency** — expressions, bindings, scopes, control flow at the statement level                                                                                                         | **Global architecture** — system design, API boundaries, database schemas, how large codebases are organized                                                           |
| **Comprehension before production** — you'll read and trace code before you write it; programs are written to verify understanding, not to demonstrate output                                  | **Production-first** — most courses have you writing immediately; output becomes the measure of understanding                                                          |
| **Depth on a constrained surface** — Just Enough JavaScript offers few features deliberately                                                                                                   | **Breadth across many features** — JS has hundreds; covering all of them diffuses the focus needed to build a real mental model                                        |

<strong>How you will work:</strong>

| F&V's approach                                                                                                                                           | The common alternative                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Errors as information** — the machine is honest; an error tells you precisely where what you specified and what the machine can interpret do not match | Errors as failure — something is broken                                                          |
| **Read from code first** — you will spend real time as a code investigator before you write                                                              | Learn by writing — produce output to prove you understand                                        |
| **Predict and check** — proactive and mechanistic; you will see what happens and update your model                                                       | Watch and explain — retroactive and justifying; post-hoc description of what you've already seen |

<strong>Where F&V fits in the larger journey:</strong>

| F&V                                                                                                                                                                                     | What follows                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Learning to program** — build fluency in the embodied language of computation. Chapter 4⟡ is the first pivot: snippetry is where you begin using programming to explore and discover. | **Programming to learn** — use programming as a tool to explore algorithms, complexity, paradigms, and domains (beyond this course: the field is wide open) |

F&V is a prerequisite for any Spiralearn curriculum that requires computational
thinking. What follows it lies beyond this course: algorithm study (strategy
families, step-counting, Big O), **Trees** (tree data structures → the DOM →
browser event dispatch), **Separation of Concerns** (programs organized at scale
across files and modules), and onward into specific domains, languages, and
specializations. Trees and Separation of Concerns can be studied in either order
depending on your goals; Trees-first provides conceptual grounding for the DOM,
SoC-first reaches interactive pages sooner.

A note on comprehension before production: all professional programming work
takes place in existing codebases. All of what programmers do is arrangement and
variation — reading code, understanding it, modifying it, fitting new pieces
into existing structures. This course teaches you to read and understand code
first because that is what all programming work actually is. You will write
programs throughout, but to verify understanding, not to demonstrate output. The
deeper reason — unpacked in README.md § How Learning Happens — is that
<strong>understanding is the part of programming you cannot delegate.</strong>
Comprehension-first because comprehension is the experience-form of building the
twin of the machine; production-first skips the experiences and installs nothing
durable.

<strong>Three vocabulary distinctions worth having early:</strong>

| Term                     | What it means                                                                                                                                                                                                                                                          | In F&V                                                                                                                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Programming paradigm** | A design philosophy for organizing programs — how you decompose problems, structure solutions, manage state                                                                                                                                                            | Ch0⟡–Ch3⟡ is imperative: sequences of statements, explicit control flow, mutable state. Functional, OOP, and declarative are deferred to Ch4⟡.                                                                                                             |
| **Computational domain** | What you are computing _about_ — the thing in the world you are modeling. A programmer who understands medicine writes better medical software; one who understands finance builds better financial tools. Domain expertise is a separate axis from programming skill. | F&V is largely domain-agnostic by design — the same NM skills transfer to any domain.                                                                                                                                                                      |
| **Computational idioms** | Types of operators and operations available within a programming language — how you manipulate values. Different languages emphasize different idioms; mastering an idiom means fluency with a category of operations.                                                 | Ch1⟡'s cycle chain runs the core idioms in dependency order (strings, then logic on strings, then numbers); elective idiom sections (Regex, Dates, Bitwise, BigInt) follow the chain, off the spine. Distinct from computational domains (subject matter). |
| **Model of computation** | A formal mathematical framework defining what computation _is_ — Turing machines, lambda calculus, finite automata                                                                                                                                                     | Largely beyond this course                                                                                                                                                                                                                                 |

These are orthogonal axes. You can write functional medical software or
imperative medical software — the domain (medicine) is independent of the
paradigm (functional/imperative). The model of computation is a different
question again.

One useful test: when you encounter a new concept, ask — is this about how I
organize my program (paradigm)? About what I'm computing about (domain)? Or
about what computation fundamentally is (model)?

Two questions this taxonomy answers before you even ask them:

- _"Why aren't we doing functional programming?"_ — Paradigm. Deferred to Ch4⟡.
- _"Why aren't we working on a specific project like a web app or game?"_ —
  Domain. F&V is domain-agnostic by design.

A note on JavaScript specifically: JS is a multi-paradigm language — it can
_look_ like OOP, functional, or declarative code syntactically. But it runs one
notional machine: procedural + prototypes. When you write "OOP-style" JS, the
machine underneath is still producing the same events it always does — and the
notional machine does not change. Languages designed _for_ a paradigm (Haskell,
Smalltalk, Java) have genuinely different notional machines and different event
vocabularies. This course teaches JS's actual machine. Understanding it gives
you a stable base from which to see that paradigm choices are partly about which
machine's event vocabulary you want to think in.

<strong>What the course constrains — and why:</strong>

Just Enough JavaScript is deliberately small. It excludes classes, most array
methods, async/await, modules, destructuring, generators, and dozens of other
features JS has. This is not an oversight. Fewer features means more cognitive
bandwidth for the concepts that actually matter in Ch0⟡–Ch3⟡: how the machine
evaluates, how values and bindings behave, how control flow works.

The constraints are temporary and intentional:

- Ch4⟡ lifts most of them
- Beyond this course, algorithm study adds functions, arrays, and objects — and
  uses them to study algorithms
- Trees and Separation of Concerns add DOM manipulation, event handling, and
  module structure

If a feature you want is missing, the likely answer is: it is coming, and it
will make more sense when it arrives because you have the foundation.

**On architecture specifically:** F&V builds fluency at the level of
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

**Twinning is what makes the bridging practice _thinking_ rather than mere
process.** Design _thinking_ requires twinning the user; without the user-twin,
what's happening is _design process_ (wireframes, personas, A/B tests as steps
you follow) but not design _thinking_. Same on F's side: _computational
thinking_ requires twinning the NM; without the NM-twin, what's happening is
_computational process_ (unit tests, refactoring moves, patterns followed) but
not computational _thinking_. The full elaboration — the twin/process 2×2, the
failure-mode categories — lives in `ontology.md` §4.

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
practice grid in ontology §4, sometimes called _ceremony-without-twin_ (F-side)
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
| **🎨 Vibetoading** (user-grounded) | Real Vibetoading, humans-only: user-research-led prototyping, design-thinking-driven iteration with real people; the NM is delegated to a collaborator or familiar tools. (Note: pattern-matching without a user-twin is **not** Vibetoading; it's the no-twin corner of the 2×2 in ontology §4.) | Karpathy's _vibe coding_ — LLM writes notation, you focus on user-visible outcomes; works only when paired with deep user-twin and willingness to read what the LLM produced enough to verify it. |
| **🔬 Frogramming** (NM-grounded)   | Traditional engineering — humans write notation grounded in NM-awareness, applying craft practices intentionally.                                                                                                                                                                                 | Willison's _vibe engineering_ / _agentic engineering_ — LLM writes the notation; you direct and verify against the NM.                                                                            |

The per-task, continuous form of this grid's Humans-only ↔ LLM-collab axis is
the **human–AI slider** — Productive Struggle (🧑 Human) ↔ Cognitive Delegation
(🤖 AI), five bands, applied one task at a time. Canonical at `ontology.md` §11;
you'll use it diagnostically in Chapter 3⟡.

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

### 0.4 Meeting Every Audience at Its Boundary

You will not write code in this chapter. You will read one small program,
predict what it does, run it, and watch it address two audiences in a single
run. Everything below is **demonstrated, not authored** — the primitives are
yours to run and observe; making them your own begins in Ch1⟡.

The program is a greeter:

```js
/* the greeter

   a tiny welcome ritual: ask, notice, greet.

   expected run:
     the user is asked their name — they type "Ada" and click OK
     the user is asked if they are ready — OK answers true, Cancel answers false
     the user sees the greeting: "Welcome to the recital!"
     the console shows a note for developers: "greeter finished"
*/

console.log('greeter starting'); // developers see this — users never do

prompt('What is your name?'); // the user answers … and the answer vanishes

confirm('Ready to begin?'); // answers true or false … nothing to do with it yet

alert('Welcome to the recital!'); // the same greeting, whoever answered

console.log('greeter finished'); // the developer channel again
```

**Two channels, one run.** The devtools console is **developer space**: users
never open it, and nothing logged there reaches them. `prompt`, `alert`, and
`confirm` are **user space**: dialogs the user actually sees and answers. The
same program addresses both audiences in the same run, on different channels —
the rhetorical model of §0.1, running before your eyes. The data flows both
ways: the program's words enter the user through their eyes; the user's answer
enters the program through `prompt`. This chapter establishes the developer↔user
channels; Ch1⟡ reveals the machine sitting in the middle of them.

**Static vs. dynamic.** The source text above never changes. Every run is
different — type a different name, click Cancel instead of OK. That gap has a
name: source code is **static** (the text you read); a program run is
**dynamic** (the evaluation you observe). Comments live in the static text — the
machine skips them, users never see them; only readers of the code do. Logs and
dialogs happen during the run. This distinction is the frame for how you will
work from here on: **predict** (staring at the static text), **run** (watch the
dynamic evaluation), **compare**.

**Tests begin here.** The comment block at the top of the greeter carries an
**expected run** — a prose input/output pair. Before you run the program, that
pair is a prediction anyone can check; after you run it, it is either confirmed
or it isn't. Every program you meet in this course carries its expected pairs,
and the habit matures chapter by chapter until it is a real test suite. It
starts as six lines of prose in a comment.

**Writing for future-you.** That top-of-program comment addresses the
often-overlooked developer-reader: **future-you**. You-in-six-months is a
stranger; you-in-ten-minutes is already on the way there. Programs are written
so that stranger can pick up where you left off without phoning you.

> _"Programs must be written for people to read, and only incidentally for
> machines to execute."_ — Abelson & Sussman, _Structure and Interpretation of
> Computer Programs_
>
> _"Always code as if the guy who ends up maintaining your code will be a
> violent psychopath who knows where you live."_ — John Woods (and a thousand
> undergraduate code-style lectures since)

**A first anomaly.** Predict: what does `prompt` hand back when the user clicks
**Cancel** instead of answering? Run it and watch. The answer is `null` — not an
answer, not empty text, but the machine's own way of saying _no answer was
given_. It is the first value you meet that exists to mark an absence. File the
feeling; `null`'s full story unfolds along Ch1⟡'s chain.

**Cliffhanger ① — the answer vanishes.** The greeter asks for a name, the user
gives one … and the program cannot use it. It greets everyone identically,
because the answer was gone the moment the dialog closed. You can feel the
program that _should_ exist — one that greets you by name — and today's
primitives cannot build it. The machine affords a way to **hold on to** an
answer. Discovering it is the first move of Ch1⟡.

**Cliffhanger ② — a question with an unusable answer.** `confirm` answers `true`
or `false` — a real answer, every run — and the greeter can do nothing with it.
A yes/no answer begs for a program that _behaves differently_ depending on which
it got. That affordance arrives mid-chain in Ch1⟡, and when it does, `confirm`
will be sitting there, a ready-made condition.

### 0.5 One Tiny Cycle, Lived

What just happened has a name, and it is the name on the cover of this course.

For a moment there — wanting the greeting to feel personal — you were wearing
the 🎨 hat: you proposed an experience worth having. And in running the program
and watching what the primitives actually do, you were wearing the 🔬 hat: you
discovered what the machine affords today — dialogs, a vanishing answer, a
boolean with nowhere to go. The gap between the proposal and the affordance is
not a failure. It is the engine: it tells you exactly what to discover next, and
each turn reshapes the one after it.

That is the **affordance-discovery cycle**. V proposes; F discovers and
verifies. This course teaches it by having you live it — F-hand through Ch1⟡,
V-hand through Ch2⟡, both hands named whole and accelerated in Ch3⟡, and as a
lifelong practice in Ch4⟡. There is no recipe to memorize. You have already run
one turn.

## Learning objectives by layer

### Layer 0 — Mastery

<em>(sparse — code is read and run here, never written)</em>

- 🥚 Recognize that programming is fundamentally about understanding a machine
  well enough to direct it precisely — _the notional machine is what gets
  programmed_
- 🥚 Recognize that source code is **static** (the text you read) and a program
  run is **dynamic** (the evaluation you observe) — same source, different runs
- 🥚 Identify the devtools console as **developer space** and
  `prompt`/`alert`/`confirm` dialogs as **user space** — two channels addressed
  in the same run
- 🥚 Predict the observable behavior of the greeter from its static text, run
  it, and compare the run against the prediction
- 🥚 Recognize `null` as what `prompt` hands back on Cancel — a value that marks
  an absence, distinct from an empty answer

### Layer 1 — Rhetoric

- 🥚 Articulate the four audiences of source code: 🧑‍💻 developers, 💻 the
  computer, users, 🤖 agents (LLMs)
- 🥚 Explain what it means for code to _address_ each audience simultaneously
- 🥚 Describe how the twins deepen across chapters: all four audiences meet you
  here at their boundary primitives; the computer-twin deepens in Ch1⟡, the
  user-twin in Ch2⟡, the agent-twin in Ch3⟡, the self-twin in Ch4⟡ — with the
  developer-twin woven through them all as craft
- 🥚 Identify agents (LLMs) as a fourth audience: they read and understand code
  differently from humans
- 🥚 Describe why this course prioritizes comprehension before production
- 🥚 Read the greeter's **expected run** (a prose input/output pair in its
  top-of-program comment) and recognize it as the program's first test
- 🥚 Explain why **future-you** is a stranger worth writing for — and identify
  the top-of-program comment as writing addressed to that stranger
- 🥚 Name the two cliffhangers this chapter sets: `prompt`'s answer vanishes
  (nothing can hold it yet), and `confirm`'s `true`/`false` has no work to do
  (nothing can branch on it yet)
- 🥚 Identify the five strands that run the curriculum: twinning, decisions
  (micro and macro), perspective stacking, the whole rhetorical situation, and
  affordances
- 🐣 Explain the spiral curriculum as traversal of the spiderweb: why revisiting
  concepts at increasing depth produces deeper understanding
- 🥚 Use the positioning tables to locate F&V's scope within the broader space
  of programming and computer science
- 🥚 Distinguish a programming paradigm, a computational domain, a computational
  idiom, and a model of computation — and recognize they are orthogonal axes
- 🥚 Understand why F&V constrains itself to Just Enough JavaScript and why
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
- 🥚 Name the affordance-discovery cycle you just lived once: a proposed
  experience met what the machine affords, and the gap between them seeded the
  next discovery
- 🐔 Articulate why this curriculum builds the F-hand first and at depth while
  building Vibetoading with the same rigor on its own chapter — breadth-scoped
  to this course's slice of design practice, with referrals out to the field for
  the deeper disciplines

### Layer 3 — Snippetry

<em>(sparse at L3 in Ch0⟡ — snippetry formalizes in Ch4⟡)</em>

- 🥚 Recognize that _informal_ snippetry can begin from Ch0⟡ — small,
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

## Ch1⟡ Frogramming

Language features enter where the chain needs them: comments and the `console`
API (distributed as craft along the whole chain); `let` / `const`; string
literals, template literals, and the string transform methods; `if` / `else` /
`switch` / ternary with the string search methods; `while` / `do-while` / `for`
/ `for-of` with `break` / `continue`, block scope, and numbers as counters; then
numbers in full, with conversion and validation, late and isolated.

### Metaphor anchor

_**Studying the instrument's mechanism** — like an organ builder examining
bellows, tracker action, registration, and combination action, you study how the
JavaScript engine actually carries out your instructions._

### Overview

Living the cycle on the F-hand. The 💻 computer becomes a full audience, and the
primary learning objective of the whole course lands here: **JavaScript's
notional machine** — the mental model of how the JS engine evaluates your code.
Other languages have their own notional machines; the discipline you develop
here transfers.

This chapter is **one continuous chain of affordance-discovery cycles**. Each
cycle has the same shape, lived rather than memorized: a behavior the previous
cycle made possible runs into a gap; the machine turns out to afford something;
you verify the discovery by predicting **internal events** before running; and
the cycle cashes out into new user-facing behavior — which is where you now
**write**. Ch0⟡'s predict-and-run becomes predict-verify-write. Every cash-out
seeds the next cycle's gap; the two cliffhangers Ch0⟡ set are cashed on this
chain, on schedule.

The chain's material is deliberately ordered: **strings before numbers**.
Arithmetic-free string programs first, then string-based control flow, then
numbers entering minimally as loop counters, with coercion and conversion held
late and isolated. This is not a purity rule — when a string property is the
thing being examined, a bare number literal alongside it is fine; the focus is
the strings. What the ordering separates is number _arithmetic and conversion_,
because that is where the machine's most confusing behavior lives, and it
deserves its own cycle.

**The test thread matures every cycle.** Ch0⟡ left you reading a prose
expected-run pair in a comment; on this chain the pairs become executable
(`console.assert`), then per-branch, then boundary-aware, then
validity-checking, and by the end of the chapter they are a systematized suite.

The chain C0–C6, with its four consolidation beats, is the **JEJ-core spine —
all of it required**. After the final beat, a set of elective sections (BigInt,
Regular Expressions, Bitwise Computation, Dates) sits off the chain: real
material, taken by interest, never blocking.

`undefined` is encountered naturally through bindings. `null` arrived in Ch0⟡ as
`prompt`'s cancel answer; its story continues mid-chain when truthiness gives it
work to do.

The chapter's intellectual-agency move: _you can predict what the machine will
do, then verify it_ — you become the kind of person who asks "what does this
evaluate to?" instead of "what does this do?" And you have authorial choices:
every word, every comment, every console method is a micro-decision that shapes
how a stranger reads your work.

### C0 — Framing: the machine and its events

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

This is a different cut than Ch0⟡'s static-vs-dynamic. That distinction
separated the _text_ from the _run_. This one lives entirely inside the run:
even while a program is evaluating, what the syntax shows you and what the
machine is doing are two different views, and much of the machine's real work is
invisible in the syntax. You will feel the difference the first time a trace
shows events no line of code names.

Behind the scenes, the machine maintains **state** — values, bindings, scopes —
that events read and mutate. The events are what happen; the state is what they
happen to.

The substrate that surfaces the NM in operational form (the `embody/` package)
is not inert: it is a _crystalline representation of the entire dynamic data
lifecycle of a program_ — a static 4D rendering of a 3D flowing river. Streams
represent the dynamics; embody exists to make every facet of that motion
explorable.

<strong>Running a program: two phases, two error kinds.</strong>

A program is source code that has been parsed and is now evaluating. Two phases:
the **creation phase** sets up the program's structure; the **evaluation phase**
runs it. Errors in the creation phase are _parse errors_; errors in the
evaluation phase are _runtime errors_. This is a third distinction with its own
moment: a program with a parse error dies before its first line runs — nothing
you logged will appear — while a runtime error interrupts an evaluation already
underway. Predicting _which kind_ a broken program will produce is an early form
of event prediction.

An error is not a personal failure and it is not the machine breaking. It is a
specific event that fires because the machine encountered a specification it
cannot interpret. The machine is being precisely honest: it found a mismatch
between what was specified and what it can do. Errors are the notional machine's
most useful output. Learning to read errors as information — rather than
experiencing them as indictments — is a skill this chapter develops alongside
everything else.

<strong>The further skill: decoupling syntax from events.</strong>

Once you can think in events, a new ability becomes possible: you can specify
_what you want the machine to do_ — describe a desired event sequence — before
choosing the syntax that produces it. You can communicate that specification to
another person, to the tracer, or to an LLM, and then evaluate whether what was
produced actually achieves what you wanted.

This is what "programming the machine directly" means. The syntax is notation
for the machine; the events are what the machine actually speaks.

<strong>The tracer.</strong>

Study Lenses' tracer captures the evaluation event stream: every
behind-the-scenes moment as your code runs, as a structured sequence you can
step through. It serves two roles:

- **Training wheels** — while you are building your internal NM model, the
  tracer makes visible what your mental model should eventually produce on its
  own
- **Power tool** — when code is too complex to trace mentally, the tracer
  extends your working memory, letting you attend to evaluation you could not
  hold in your head alone

<strong>Console and comments as craft, from here on.</strong>

The developer audience's tools are distributed along this chain, arriving where
the work needs them. Now: `console.log` (you know it from Ch0⟡) and
`console.assert(condition, message)` — silent when true, loud when false — the
tool the test thread grows on. Later on the chain: `console.count` when loops
give it something to count; `console.group` and `console.time` when programs
grow structure worth organizing. Woven throughout: **output by intent** —
`console.debug` / `log` / `info` / `warn` / `error` communicate different things
to the developer watching the console, and choosing between them is a
micro-decision.

Comments are the static half of the same craft. Four conventions to recognize
and apply: **inline** (`// like this`), **block** (`/* like this */`),
**doc-style** (`/** like this */`, picked up by tooling), and the `*`-aligned
block structure that holds the last two together. Their job is _why_, not
_what_: the code already shows what; the comment fills in the intent. Comments
are for reading the code; logs are for observing it run. Both serve the
developer audience — including future-you — and every word, placement, and
method choice shapes how they read. Real codebases are full of funny, desperate,
and poetic comments; reading them is part of learning the register.

**Verify:** re-trace a Ch0⟡ greeter — this time as an event stream. Call events,
resolve events, the `null` resolve on cancel. Same program you already know; new
eyes.

**Tests:** the greeter's prose expected-run pair rides along unchanged;
`console.assert` is now in your vocabulary, and the next cycle makes it
executable.

**Seeds the next cycle:** you can now see the events — and the first gap Ch0⟡
left you is still open: the answer still vanishes.

### C1 — Bindings: holding on

**The gap (cliffhanger ① cashed):** `prompt`'s answer vanished the moment the
dialog closed, so the greeter could not greet anyone by name. The machine
affords a way to hold on: **bindings**.

A **binding** is a named slot the program reads and writes. Its lifecycle:
declare → initialize → available → access / update. `let` allows reassignment;
`const` does not. Both communicate intent to the reader.

Variable names are micro-decisions on par with comment choices. Conventions
(`camelCase`, `snake_case`, `CONSTANT_CASE`, `PascalCase`) carry different
signals; the choice is part of how the code communicates with the developer
audience. Naming is the first craft skill that lives _inside_ the language
instead of beside it.

**Trace tables** are systematic notation of evaluation: declare / initialize /
access / update events for each binding, in steps-format and values-format.
**Predictive stepping with a debugger** is the same practice extended with a
tool: predict what happens next → step → check → investigate. Log binding
values; observe state change over time.

**Verify:** predict the lifecycle events of a small program — every declare,
initialize, access, and update, in order — then trace to confirm.

**Tests: the first executable assert.** `console.assert` turns a prediction
about what a binding holds into a line of the program itself. Write code to
satisfy assertions sprinkled through a script; sprinkle your own.

**Cash-out (you write):** programs that _remember_. The greeter holds the answer
and echoes it back; an ask-then-confirm-back dialog; a program that holds two
answers and replays them in order.

**Seeds the next cycle:** you can hold answers, but only replay them verbatim.
The greeting you actually want — the answer _woven into_ new text — needs a way
to make new strings from old ones.

### C2 — Pure strings: transforming what you hold

_Number-free, transform-only._

**The gap:** verbatim replay. You want new text made from held text.

An **expression** is syntax that produces a value. Compound expressions evaluate
step by step: sub-expressions resolve in order, precedence rules govern the
order, and parentheses can override. **Resolve**: every expression produces
exactly one value; the VM hands that value back to the surrounding expression or
statement. String concatenation with `+` is your first operator; **template
literals** are its readable sibling, weaving held values into new text with
interpolation.

**The lookup mechanism comes before the method list.** When a method is called
on a primitive, the VM temporarily wraps it in its constructor's object form
(`'hello'` → `String` wrapper) — **auto-boxing** — and finds the method by
**prototype chain lookup**: value → `String.prototype` → method found. Reading
`str.toUpperCase()` becomes: _look up `toUpperCase` on `String.prototype` → call
it with `str` as the receiver_. This is a behind-the-scenes event family of its
own, and it is the mechanism behind every method you will ever call on a string,
a number, or anything else.

With the mechanism owned, the **transform methods**: `toUpperCase` /
`toLowerCase`, `trim`, `replace` / `replaceAll`. Each takes a string and gives
back a string — immediately recombinable, self-cashing: every transform you
learn is a new behavior your programs can ship the same day.

Two deliberate deferrals. The _search_ methods (`includes`, `startsWith`,
`endsWith`) answer `true` / `false` — and `true` / `false` still has no work to
do in your programs; they debut next cycle, where their answers have
consequences. And the methods that traffic in numbers (`length` as a quantity,
`indexOf`, `charAt`, `slice`) wait until numbers have entered the chain.

**Verify:** predict lookup and resolve events — the miss on the value, the hit
on `String.prototype`, the step-by-step resolution of a template with two
interpolations — then trace.

**Tests: assert on transformed strings.** The expected pair for a normalizer is
executable now: `console.assert(cleaned === 'ada')`.

**Cash-out (you write):** normalizers (trim-and-lowercase every answer),
mad-libs (templates weaving held answers into stories), a shouting greeter.

**Seeds the next cycle:** your programs transform every answer the same way, for
everyone. Behavior that _depends_ on the answer needs branching — and
`confirm`'s boolean is still sitting there, unused.

### Consolidation Beat A — string state, resolve, lookup

One re-trace across everything so far: lifecycle events (C1), resolve events
(C2), lookup events (C2) — three event families, one small program, predicted
end to end before running. The machine so far: values held in bindings,
expressions resolving step by step, methods found by lookup.

### C3 — String-based conditionals: answers with consequences

**The gap (cliffhanger ② cashed):** `confirm` answers `true` or `false` every
run, and Ch0⟡'s greeter could do nothing with it. Branching gives boolean
answers their work — and text answers too.

`if` / `else if` / `else` make the evaluation path depend on values. Tracing a
conditional means tracing the predicate expression, then following the branch
the predicate resolves into. `switch` handles the many-exact-cases shape;
**ternary expressions** are the compact equivalent form for a two-way value
choice; learners refactor between all three.

`===` on strings is the workhorse predicate. **The search methods debut here**:
`includes`, `startsWith`, `endsWith` — born as conditions, immediately consumed:
`if (answer.startsWith('y'))`. Their prototype lookup is the same C2 mechanism,
extended to methods whose answers drive branches.
**`confirm`-as-ready-made-condition** closes Ch0⟡'s loose end:
`if (confirm('Ready?'))` — the dialog _is_ a predicate.

**Truthiness, the non-numeric half.** Values need not be booleans to drive a
branch: the empty string `''`, `null`, and `undefined` are falsy; other strings
are truthy. **Negation** (`!`) flips it: `!answer` is `true` exactly when the
answer is falsy, and `if (!answer.startsWith('y'))` reads as naturally as its
positive twin. `null` from a cancelled `prompt` finally gets its guard:
`if (answer === null)`. **Short-circuit evaluation** (`&&` stops at the first
falsy, `||` at the first truthy, `??` at the first nullish) resolves to the
_stopping value_ — the practical payoff is defaults and guards:
`name || 'stranger'`, `answer ?? ''`. **Logical compound assignment** (`&&=`,
`||=`, `??=`) extends the pattern to assignment, and **optional chaining**
(`answer?.trim()`) guards method calls on values that might be `null`. The
_numeric_ falsy values wait for the numbers cycle, where truthiness completes.

When a string property is the thing being checked, a bare number literal on the
other side of the comparison is fine — `answer.length === 0` is a condition
about a string. The focus stays on the strings.

**Verify:** predict branch-selection events — which predicate resolves to what,
which branch the machine enters, which it never touches — including the lookup
events of a search-method predicate.

**Tests: one expected pair per branch — branch-pairs are born here.** A program
with three branches carries three input/expected-output pairs in its doc
comment, and an assert per branch. A branch without a pair is untested by
construction.

**Cash-out (you write):** gates (confirm-guarded actions, cancel-safe prompts),
graders (right/wrong/empty answers, each with its own reply),
choose-your-adventure dialogs.

**Seeds the next cycle:** one question, one branch, once — and a wrong answer
just falls through. Asking _again until the answer is usable_, offering a menu
_until they quit_, examining an answer _piece by piece_ — repetition needs
loops, and walking through text position by position traffics in numbers.

### C4 — Loops and numbers-as-counters: doing it again

**The gap:** once-only programs.

`while`, `do-while`, `for`, `for-of` repeat evaluation. Each form has the same
NM events; the syntax differs in how the loop variable and termination condition
are arranged. `break` and `continue` modify loop flow. Refactoring between
equivalent loop forms is the same discipline as refactoring between conditional
forms.

**Block scope arrives with the blocks.** `{}` is a container; scopes nest; a
`let` declared inside a block is not accessible outside it. The **scope chain
walk** makes this concrete: when an identifier is read, the VM checks the
current (innermost) scope first, then its parent, up to the global environment —
each check a miss (keep looking) or a hit (binding found). Loop bodies and `if`
bodies make the walk visible statement by statement.

**Numbers enter — minimally, as counters.** A loop counter is a number the
_program_ made: `let count = 0; count = count + 1` (and the increment /
decrement shorthand). With counters in hand, the deferred string tools arrive:
`length` as a quantity, `indexOf`, `charAt`, `str[i]`, and `at` (which accepts
negative indexes: `str.at(-1)` is the last character), `slice` — and `for-of`
walks a string character by character. The transforms that take counts —
`repeat`, `padStart`, `padEnd` — join the toolkit. `String.fromCharCode` /
`String.fromCodePoint` open the encoding door: strings as sequences of encoded
characters. `str.split(separator)` produces a list of pieces you can walk with
`for-of` — the first list-shaped value in the course, used only for walking.
`console.count(label)` / `console.countReset(label)` give the developer channel
its iteration tool.

**Verify:** predict iteration events (how many passes, what ends them), the
scope-chain walk for a binding read inside a nested block, and the counter's
state at each pass.

**Tests: loop-boundary pairs — zero, one, many.** The empty answer, the
single-character answer, the long answer: each loop gets pairs at its
boundaries, because that is where loops break.

**Cash-out (you write):** retry-until-valid (re-prompt on empty or cancelled
answers), menus (repeat until `'quit'`), occurrence-counters (how many times
does a letter appear), scanners (walk a string and react character by
character).

**Seeds the next cycle:** counters are numbers the program made — trustworthy by
construction. Numbers from _users_ arrive as text: `'5'` is not `5`, and
`'five'` is not anything. Arithmetic on user input needs conversion, and
conversion needs defense.

### Consolidation Beat B — the control panel

Unify the two chain-walks: the scope chain walk (innermost scope outward) and
the prototype chain lookup (value to prototype) are the same pattern in two
domains — ordered lookup, miss after miss until the hit. Add branch events and
iteration events, and the machine's control panel is complete: **hold,
transform, branch, repeat.** One full trace of a retry-menu program touches
every family so far.

### C5 — Numbers, coercion and validation

_Late, isolated, on purpose._

**The gap:** users type text. Math needs numbers. The boundary between those two
is the most treacherous terrain in the language, which is why it gets its own
cycle instead of leaking into every earlier one.

**Explicit conversion** is learner-visible syntax: `Number()`, `parseInt`,
`parseFloat` (and `String()`, `Boolean()` — the same door in other directions).
**Implicit coercion** is the VM's silent type-transformation between operands
and operators: `'5' + 3` concatenates to `'53'` while `'5' - 3` subtracts to
`2`. It is a behind-the-scenes event, invisible in the syntax but predictable
once you learn its rules — and predicting it is this cycle's verify.

Arithmetic and numeric comparison operators arrive in full, with compound
assignment and `typeof` for asking what a value is. `NaN` propagates; `isNaN`,
`Number.isNaN`, `Number.isFinite`, and `Number.isInteger` interrogate it. `Math`
methods and constants (`max`, `min`, `abs`, `floor`, `ceil`, `round`, `random`,
`pow`, `sqrt`, `PI`, `E`) do the actual math. Number prototype methods
(`toFixed(n)`, `toString(radix)`, `toPrecision`, `toExponential`,
`toLocaleString`) — the C2 lookup mechanism, third domain. **Floating point
representation** explains why `0.1 + 0.2 !== 0.3`: precision limits of IEEE 754,
when this matters, and how to work around it.

**Truthiness completes.** The numeric falsy values `0` and `NaN` join `false`,
`''`, `null`, and `undefined` — all six now in hand, and the C3 guards extend to
numeric input.

**The validation discipline (the machine-side mechanics):** cast to number →
validate the cast (`isNaN`, `Number.isFinite`) → validate the range. The user
might type anything; the program must defend the NM-side state-space.

**Verify:** predict coercion-cascade events and conversion chains — every silent
transformation, every `NaN` propagation — before running.

**Tests: valid/invalid-input pairs.** Every numeric program carries pairs for
the number, the junk, the empty answer, and the cancel.

**Cash-out (you write):** validated numeric programs — age gates, tip
calculators, unit converters — that survive hostile input.

**Seeds the next cycle:** your programs now have real moving parts — input,
validation, logic, output — and the pairs in your comments have grown into a
scattered pile. Time to make the structure visible and the suite systematic.

### Consolidation Beat C — the coercion-vs-conversion weld

One table, one weld: **explicit conversion** (your visible syntax: `Number()`,
`String()`, `Boolean()`, `parseInt`, `parseFloat`) versus **implicit coercion**
(the VM's silent move behind the scenes). What converts to what; where `NaN`
comes from; truthiness as the boolean face of the same coin, now complete.

### C6 — Structure: systematizing the chain

**The gap:** working programs, ad-hoc structure, scattered tests.

**The program structure pattern gets named:** input + validation (a while loop)
→ logic (a conditional) → output. The phases were latent in every program since
the retry-until-valid cash-out; naming them makes them designable. **Input
validation strategies** — all-in-while-head, boolean flag, do-while — express
the same Behavior three ways, an early exercise in seeing strategy as a choice.

**PBIS**: Purpose, Behavior, Implementation, Strategy — four perspectives for
reading any program simultaneously. Purpose names what the program is _for_;
Behavior names what it _does_ as observable inputs/outputs; Implementation names
the code-level mechanism; Strategy names the choices that connect Implementation
to Behavior. The letter order is flexible in use; the four perspectives are the
discipline. "Why not what" comments extend here: comments now explain strategy
and behavioral correlations, grounded in PBIS vocabulary. **Top-level doc
comments** grow to program scale: name, purpose, behavior, and the expected
pairs, structured for the developer reading it.

**The suite, systematized.** The test thread's antecedents line up: executable
asserts (C1), pairs on transforms (C2), a pair per branch (C3), pairs at loop
boundaries (C4), valid/invalid pairs (C5). **Branch coverage** asks the closing
question: is every conditional path covered by a pair? Branches without test
inputs are silent corners where bugs hide. **Fixing bugs** now means something
new: the code runs without error but produces wrong behavior — the fix is
upstream, in the predictive model. **Modifying programs**: one change at a time;
predict; run; note the result — with the program's user-visible behavior as the
fixed point.

The remaining craft tools complete the console API and the review discipline:
**logging strategies** (structured placement at structure boundaries, mutation
points, control-flow forks), `console.group` / `groupCollapsed` / `groupEnd` and
`console.time` / `timeLog` / `timeEnd` (and `console.clear`), **backtracing**
(reason from output back to input when something went wrong), **describing
programs** (close reading across all PBIS levels), **naming variables** as
structured analysis (generic role-based names → specific domain names → variable
roles: fixed value, stepper, flag, gatherer, holder, temporary), **linting**
(the code conventions enforced by a tool), **refactoring** (changing
implementation or strategy without changing behavior), **code review** (a
structured template: behavior, goals, comments, linting, variables), and
**comparing programs** (same behavior, different approaches — the eye for voice
and readability tradeoffs).

**Tests:** the suite itself is the artifact — systematic coverage, organized
output, documented pairs.

**Cash-out (you write):** robust, tested, documented programs — and the
chapter's closing beat, the F-side of the course's symmetry: **this chapter was
one cycle chain, run on the machine side.** The proposals stayed modest (greet,
gate, retry, validate) so the discoveries could go deep. Ch2⟡ swings the other
hand: the proposals get the depth, with the machine you now own underneath.

### Consolidation Beat D — the whole machine

One full-program trace touching every event family: lifecycle, resolve, lookup,
branch, iteration, coercion. The NM-twin is operational — you can predict,
verify, and direct the machine through every construct in JEJ-core.

**This is the gate Ch2⟡ assumes:** full mastery of the chain — C0 through C6
plus the four beats. The electives below are not part of the gate.

### Electives — off the chain, by interest

Real material, never blocking. Each elective applies the machine you already own
to a further idiom; take any, in any order, whenever curiosity strikes.

#### Elective: BigInt

Integers without precision limits. `42n` literal syntax, `BigInt()` constructor;
`typeof` is `'bigint'`; can't mix with `number` in arithmetic; integer division
truncates. The solution for exact large integer arithmetic.

#### Elective: Regular Expressions

Pattern-matching computation: instead of procedural string operations, declare
the _shape_ of what you're looking for. `/pattern/flags` literals; `.test()`,
`.match()`, `.replace()` with regex. The computational micro-decision between
regex and string methods is not just _what works_ but _what expresses the
problem clearly_.

#### Elective: Bitwise Computation

**Bitwise operators** compute at the bit level: numbers as binary structures,
not decimal values. `&`, `|`, `^`, `~`, `<<`, `>>`, `>>>` — each does something
specific at the bit level. BigInt works with bitwise operators (see the BigInt
elective). The computational micro-decision between bitwise and arithmetic
expresses the problem's structure.

#### Elective: Dates

`Date.now()` returns the current timestamp as a number (milliseconds since
epoch). `new Date()` is the sole `new` exception in JEJ; it creates a date
object whose methods all return primitives. `Date.parse(str)` parses a date
string to a timestamp. Instance methods: `getFullYear()`, `getMonth()`
(0-indexed), `getDate()`, `getHours()`, `getMinutes()`, `getSeconds()`,
`toLocaleDateString()`, `toLocaleTimeString()`, `toISOString()`. Date
computation programs cover elapsed time, formatting, and internationalization —
numbers and arithmetic applied to time as a domain.

## Learning objectives by layer

### Layer 0 — Mastery

#### C0 — the machine and its events

- 🥚 **Evaluation events**: a running program produces an ordered stream of
  observable moments; the tracer captures these automatically; trace tables
  record them by hand
- 🥚 The two viewing levels inside a run: visual-syntax vs behind-the-scenes —
  distinct from Ch0⟡'s static-vs-dynamic (text vs run)
- 🥚 Fix errors: parse errors (creation phase) vs runtime errors (evaluation
  phase); locate the source line; categorize the failure type
- 🥚 An error is not a personal failure and not the machine breaking; it is the
  machine being precisely honest about a spec it can't interpret

#### C1 — bindings

- 🥚 Binding lifecycle: declare → initialize → available → access / update
- 🥚 `let` vs `const`: what each allows and what it communicates to the reader
- 🥚 Log variable values; observe state change over time
- 🥚 **Trace tables**: systematic notation of evaluation in steps-format and
  values-format
- 🥚 **Predictive stepping with a debugger**: predict → step → check →
  investigate
- 🥚 **Asserting on bindings**: predict what a binding holds at a specific point
- 🐣 Write code to satisfy assertions sprinkled through a script

#### C2 — strings, expressions, lookup

- 🥚 Identify expressions as syntax that produces a value; trace how a compound
  expression evaluates step by step: sub-expressions resolve in order;
  precedence; parentheses
- 🥚 **Resolve**: every expression produces exactly one value
- 🥚 String concatenation and template literals as recombination
- 🐣 **Auto-boxing**: when a method is called on a primitive, the VM temporarily
  wraps it
- 🐣 **Prototype chain lookup**: one-hop lookup for primitives — a
  _behind-the-scenes_ event; reading `str.toUpperCase()` as: look up on
  `String.prototype` → call with `str` as receiver
- 🥚 The transform methods (`toUpperCase` / `toLowerCase`, `trim`, `replace` /
  `replaceAll`): string in, string out, immediately recombinable

#### C3 — conditionals on strings

- 🥚 Conditionals: `if` / `else if` / `else`; `switch` on strings; ternary
  expressions as the compact two-way form
- 🥚 `===` on strings as the workhorse predicate
- 🥚 The search methods (`includes`, `startsWith`, `endsWith`) as conditions —
  the C2 lookup mechanism extended
- 🥚 `confirm` as a ready-made condition
- 🥚 Truthiness, non-numeric half: `''`, `null`, `undefined` falsy; negation
  (`!`) flips truthiness; guards for the cancelled `prompt`
- 🥚 Short-circuit evaluation (`&&` / `||` / `??`) resolves to the stopping
  value; defaults and guard clauses; logical compound assignment (`&&=` / `||=`
  / `??=`); optional chaining (`answer?.method()`)

#### C4 — loops and counters

- 🥚 While loops, do-while loops, for loops, for-of loops: reading and tracing
- 🥚 `break` and `continue`
- 🐣 Refactoring between equivalent loop forms
- 🥚 Block scope as container; nested blocks; `let` declared inside `{}` is not
  accessible outside
- 🥚 **Scope chain walk**: innermost → parent → global; miss/hit
- 🥚 Numbers as counters: increment/decrement; counter state across iterations
- 🥚 The numeric string tools: `length`, `indexOf`, `charAt` / `str[i]` / `at`
  (negative indexes), `slice`; count-taking transforms (`repeat`, `padStart`,
  `padEnd`)
- 🐣 `String.fromCharCode` / `fromCodePoint`: strings as sequences of encoded
  characters; `split` as a list of pieces to walk with `for-of`

#### C5 — numbers, coercion, validation

- 🥚 Explicit type conversion vs implicit coercion: `Number()`, `String()`,
  `Boolean()`, `parseInt` / `parseFloat` vs the VM's silent transformations
- 🥚 **Implicit coercion** as a _behind-the-scenes_ event: `'5' + 3` vs
  `'5' - 3`
- 🥚 Arithmetic, comparison, and compound-assignment operators; `typeof`
- 🥚 `NaN` and its interrogators: `isNaN`, `Number.isNaN`, `Number.isFinite`,
  `Number.isInteger`
- 🥚 Math methods and constants; Number prototype methods (`toFixed`,
  `toString(radix)`, `toPrecision`, `toExponential`, `toLocaleString`)
- 🐣 Floating-point representation: why `0.1 + 0.2 !== 0.3`
- 🥚 Truthiness completed: the six falsy values
- 🥚 The validation discipline: cast → validate the cast → validate the range

#### C6 — structure

- 🥚 **Program structure pattern**: input + validation (while loop) → logic
  (conditional) → output
- 🥚 **Branch coverage**: every conditional path covered by a pair; branches
  without test inputs are silent corners
- 🥚 **PBIS Framework**: Purpose, Behavior, Implementation, Strategy — four
  perspectives for reading any program simultaneously
- 🐣 **Fixing bugs**: code runs without error but produces wrong behavior; the
  fix is upstream in the predictive model
- 🐣 **Modifying programs**: one change at a time, predict, run, note the result

#### Electives

- 🥚 **BigInt**: `42n`, `BigInt()`; `typeof 'bigint'`; no mixing with `number`
- 🐔 **Regular Expressions**: `/pattern/flags`; `.test()`, `.match()`,
  `.replace()` with regex
- 🐔 **Bitwise Computation**: bitwise operators; bit-level computation
- 🐔 **Dates**: `Date.now()`, `new Date()` (sole `new` exception in JEJ), date
  methods

### Layer 1 — Rhetoric

- 🥚 Write comments that explain _why_, not _what_; identify and apply comment
  conventions: inline (`//`), block (`/* */`), doc-style (`/** */`), `*`-aligned
  block structure
- 🥚 **Micro-decisions in comments, logs, and names** — every choice (word,
  placement, method, convention) shapes how a stranger reads the work
- 🥚 The `console` API by intent: what each method communicates (`debug` / `log`
  / `info` / `warn` / `error`; `assert`; `count` / `countReset`; `group` /
  `groupCollapsed` / `groupEnd`; `time` / `timeLog` / `timeEnd`; `clear`) — and
  when to use comments vs logs
- 🥚 Top-level program comments at program scale: name, purpose, behavior, and
  the expected pairs
- 🥚 The test thread as rhetoric: expected pairs communicate behavior to the
  developer-reader before they communicate correctness to the machine
- 🥚 "Why not what" comments grounded in PBIS vocabulary
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
- 🐥 Read and appreciate real comments from real codebases (funny, desperate,
  poetic examples of developer-to-developer communication)

### Layer 2 — Methodology

- 🥚 Wear the F hat consciously: predict-trace-verify is _F's bridging practice_
  operationalized
- 🥚 Live the cycle shape on the chain: entry behavior → gap → affordance →
  verify by internal events → cash out → seed the next — recognized in
  retrospect at each beat, not followed as a checklist
- 🐣 Recognize that the tracer is **both training wheels AND power tool** —
  extends working memory beyond what can be held in head
- 🐣 Use the consolidation beats: re-trace across event families and name what
  unified (the two chain-walks; the coercion weld; the whole machine)
- 🐣 Choose among validation strategies (all-in-while-head, boolean flag,
  do-while) as a Strategy decision, not a habit
- 🐣 Wear a V or F hat _consciously_ when writing a comment: a V-hat comment
  grounds in the future reader's experience; an F-hat comment grounds in the
  mechanism the reader needs to understand
- 🐔 Discuss when verification by output is sufficient and when internal-event
  prediction is required (the two-layer misconception mechanism)

### Layer 3 — Snippetry

- 🐣 Write a small snippet that uses one chain skill (a transform, a branch
  shape, a loop form) in three different ways
- 🐣 Trace a snippet from an elective you haven't taken (e.g., regex); predict
  before running

### Layer 4 — Philosophy

<em>(sparse)</em>

- 🥚 _(footnote)_ Notice that an "error" is the machine telling you _exactly_
  where it can't interpret your specification. The machine's honesty is
  information you can trust — unlike most channels in life
- 🥚 _(footnote)_ The developer audience is the only audience that reads STATIC
  code — every other audience experiences the DYNAMIC evaluation. What does that
  asymmetry mean for code rhetoric?

---

## Ch3 Developers, Computers, and Users

Language features: `prompt`, `alert`, `confirm`. All control flow features
(`if`, `while`, `break`/`continue`) were introduced in Chapter 2 and are now
applied in programs where user interactions are the fixed behavioral anchors.

### Metaphor anchor

_**Writing for an audience, the composer's design thinking** — the concert
audience is real: they cheer, boo, throw tomatoes or flowers. The composer
rehearses with the mechanism, workshops with virtuosos, and focus-groups with
listeners. Design thinking across the whole situation._

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

**The second level of code audience.** Code has two audiences in any chapter,
not one. The first is _deterministic_ — the NM, which evaluates code literally
and predictably (F's territory). The second is _non-deterministic and emergent_
— the user's lived experience of what the NM produces. Both V and F write for
the second audience; neither controls it directly. The NM is the instrument; the
experience is the concert. The work of both hats is to set up conditions that
make the experience the program serves possible. (Two-scale instrument reading —
see ontology §7 strand-4 and `metaphor.md` two-scale extension.)

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
<em>"For input X, the program should output Y."</em>

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

- 🥚 Wear the V hat consciously: prototype-test-iterate is V's bridging practice
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

<em>(sparse)</em>

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

_**The composer-virtuoso asymmetric duet** — with an alien virtuoso this time.
Dazzling, fast, pattern-rich, but cognitively distinct from human virtuosos.
Collaboration is specifically different, and this chapter digs into why._

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
by Evan Cole with collaborators Janet Tilstra and Joslenne Peña (the curriculum
author's prior work). That model has since been refined into the framework now
canonical in `ontology.md`: the **§9 lenses** (a general-systems view of
analytical levels at which any system can be read, with AI as one instance),
**§10 substrate substitution** (deterministic → non-deterministic at
artifact-logic), and **§11 three roles of agential AI** (Role 1 study partner /
Role 2 dev collaborator / Role 3 active component). **Chapter 4 = Role 2 (dev
collaborator)** — Role 1 already worked quietly across Ch0–3; Role 3 is deferred
to later learning. The organizing line for the chapter: _you twin the AI as
collaborator — F's lens reads it as cognitive substrate (NM-grounded mode); V's
lens reads its behavioral surface (user-grounded mode); two modes of
collaboration, one JEJ artifact under construction_. See ontology §11 for the
canonical framework.

**The both-twins corner of the twin/process 2×2** (see `ontology.md` §4): Ch4
develops the both-twins state in its LLM-collaborative form — V and F operating
together alongside an alien third intelligence. The user-twin and the NM-twin
both stay yours; what gets delegated is the production of the code that
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

Within either mode, _how much_ of each task you hand the virtuoso is a per-task
choice — the **human–AI slider** (`ontology.md` §11): Productive Struggle ↔
Cognitive Delegation. _Diagnostically_, after each task you read where you
actually sat and ask whether it matched your goal. _Prescriptively_, the same
instrument is a static **recipe** of the per-task positions that lead to the
best _learning_ — here, for debugging an LLM-generated countdown:

| #   | Task                             | Recommended    | Why (learning rationale)                               |
| --- | -------------------------------- | -------------- | ------------------------------------------------------ |
| 1   | Predict what the code does       | 🧑 Fully human | the prediction is the rep that keeps the NM-twin sharp |
| 2   | Generate a candidate fix         | 🤖 Mostly AI   | notation is where the LLM is strong                    |
| 3   | Trace the fix to verify it       | 🧑 Fully human | the verification is the learning; LLMs mis-trace       |
| 4   | Write an assertion that locks it | Balanced       | you decide what to assert; the LLM drafts the syntax   |

The recipe encodes the mastery contract: the reps that build the twin (predict,
trace) stay left while you're still learning the skill.

<strong>The visual NM view (`embody/` + study lenses) becomes load-bearing
here.</strong> When you delegate the control panel, you can no longer rely on
the act of typing to keep your NM understanding sharp. Visual debuggers let you
observe, predict, and debug the machine _directly_ — the NM view that exists
regardless of who (or what) wrote the code text. Frogramming with delegation is
only sustainable if you keep the direct NM view alive.

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

<em>Revisits Chapter 1: comments, variable names — with an LLM
collaborator.</em>

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

<em>Revisits Chapter 2: tracing, asserting — with an LLM collaborator.</em>

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

<em>Revisits Chapter 3: user programs — with an LLM collaborator.</em>

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

The failure mode here is twin-ignored (no user-twin, no NM-twin) — what the §4
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
- 🐥 Use the lenses-and-roles framework (ontology §9 + §11) to discuss AI at the
  appropriate position relative to your work
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
- 🐣 Use the human–AI slider **diagnostically**: after a task, place where AI
  use actually sat and judge it against your goal (mastery, speed, exploration)
- 🐥 Use the human–AI slider **prescriptively**: given a goal and the mastery
  contract, scope where AI use _should_ sit before starting — left while you're
  still building the skill, freer once it's mastered
- 🐣 Distinguish the slider's question (_how much_ you delegate the task) from
  V/F's question (_which twin_ you shoulder) — they are orthogonal
- 🐥 Apply §11 Role 2 (dev collaborator) to Ch4 work: twin the AI as
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
- 🐥 Locate LLM-collaborative work on the twin/process 2×2 (see ontology §4):
  what determines whether a given collaboration session lands in the both-twins
  corner or slides toward pure process
- 🐣 _(easter egg)_ "One axis, honestly": the human–AI slider reads how much AI
  did the task, not whether you were learning or applying. Sit with what a
  single position does and doesn't capture
- 🐔 Recognize the emergence of **agentic AI systems** (LLMs doing design work,
  not just notation) as a more complex development than the authoring-partner
  frame covers; flag as territory for post-curriculum learning
- 🐥 _(deeper section)_ Encounter Friston's "A Duet for One" — _"understanding
  just IS the alignment of generative models into a single coherent predictive
  process"_ — and consider: does this framing illuminate your conversations with
  the alien virtuoso, or strain when applied to a non-biological partner?
- 🐔 Reflect on the difference between "it runs" and "I understand it" — the
  boundary the LLM tests every day

---

## Ch5 Developers, Computers, Users, Agents, and You

### Metaphor anchor

_**The composer's daily practice** — small, complete pieces written for the
composer's own practice. Variations on a theme, études on a single technique,
sketchbook entries exploring an idea — Ligeti's Musica Ricercata, Beethoven's
sketchbooks, Bach's inventions. A serious genre in its own right._

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

**Arc closure.** The arc that opened in Ch1 with _write for future-you as an
audience_ closes here as _write for yourself as a human_. Same self, end-to-end.

The chapter's intellectual-agency move: _you can use programming as a tool for
thought, on whatever problems and ideas interest you, for the rest of your
life._ Snippetry is how the Frogrammer keeps the NM alive between full-codebase
projects — and how the Vibetoader sketches quick experiences without the weight
of production.

**The both-twins corner of the twin/process 2×2** (see `ontology.md` §4): Ch5
develops the both-twins state in its merged form — V and F operating as a single
integrated practice. Snippetry is where the two stances stop being separate hats
and start being the same gesture: each small program is at once a user-twin
sketch and an NM-twin probe. The Bakhtiarian-loop unification names this in
operational terms.

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

<strong>What comes off:</strong>

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

<strong>What replaces it:</strong>

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
  2×2 in ontology §4)

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
  that idea (see ontology §6 L4 matrix, Twinning row, and the Preamble's
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
- `guide.authors.md` — the _why_ addressed to curriculum authors / forkers /
  contributors
- `guide.community.md` — the _why_ addressed to partner communities, mentors,
  cohort hosts
- `README.md` — the existing prose course (read-only for the current redraft)
- `narrative/README.md` — the composer/virtuoso metaphor system
- `assets/spiral-curriculum.png` and `assets/curriculum-spider-web.svg` — the
  topology + trajectory views
- `study-lenses/` — the JEJ → NM → embody → lenses → orchestrator infrastructure
