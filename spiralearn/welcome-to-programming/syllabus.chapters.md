# Welcome to Frogramming — Chapters

> **Purpose**: chapter-by-chapter redraft with 5-layer learning-objective grids,
> drawing framing from `syllabus.ontology.md` and the intellectual-agency
> meta-LO from `syllabus.manifesto.learners.md`. Six chapters (Ch0–Ch5), each
> with a unified overview + five layer-headed LO lists (`### Layer 0` through
> `### Layer 4`).
>
> **Companions** (siblings, by co-location):
>
> - `syllabus.ontology.md` — the _what_ (reference voice)
> - `syllabus.manifesto.{learners,authors,community}.md` — the _why_ per
>   audience
> - `syllabus.md` — the existing prose course (read-only)
>
> **Status**: end-state document. The previous chapter prose in `syllabus.md` is
> read-only; this file is the chapter-level redraft that a future `syllabus.md`
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

(Cross-reference `syllabus.ontology.md` §12.)

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

---

## Ch0 What is Programming?

_Metaphor anchor: **the recital as rhetorical situation** — an entire
performance event with its audience, its performers, its instrument, and the
score that ties them together._

### Overview

Conceptual orientation before any code. The learner meets the rhetorical model
(source code as communication addressing multiple audiences simultaneously), the
Vibetoading/Frogramming distinction, and the positioning of WtF in the broader
space of programming and computer science.

The chapter's intellectual-agency move: _you arrive here with a why, and the
course is built to honor it._ No assumption that the learner walked in with
intellectual confidence — the course will build it.

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

_Metaphor anchor: **the score as inter-composer communication** — other
composers read your score for intent and style, long before (or entirely instead
of) ever hearing it performed._

### Overview

Your first code and your first audience. The 🧑‍💻 developer audience — including
future-you, who is a stranger by the time they come back to this code. Twinning
the developer audience is the central skill.

Language features introduced: comments (inline / block / doc-style) and the full
`console` API.

The chapter's intellectual-agency move: _you have authorial choices_ — every
word, every comment, every console method is a micro-decision that shapes how a
stranger reads your work.

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

_Metaphor anchor: **studying the instrument's mechanisms** — like an organ
builder examining bellows, tracker action, registration, and combination action,
you study how the JavaScript engine actually carries out your instructions._

### Overview

The 💻 computer is now a full audience. The primary learning objective:
**JavaScript's notional machine**. Two tracks:

- **NM core (2.0–2.8)**: the machine itself — expressions, values, bindings,
  scope chain, prototype chain, coercion, statements, reading/writing code. All
  required.
- **Computational idioms (2A–2F)**: what you _do_ with the machine — logic and
  truthiness, text processing, number crunching, pattern matching, bit
  manipulation, date computation. **2A (Logic) and 2B (Strings) are required.
  Choose at least one from 2C–2E. 2F is optional.**

Programs produce output via logs and assertions but do not yet interact with
users. `undefined` is encountered naturally; `null` is held until Ch3.

The chapter's intellectual-agency move: _you can predict what the machine will
do, then verify it._ You become the kind of person who asks "what does this
evaluate to?" instead of "what does this do?"

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

_Metaphor anchor: **writing for an audience, the composer's design thinking** —
the concert audience is real: they cheer, boo, throw tomatoes or flowers. The
composer rehearses with the mechanism, workshops with virtuosos, and
focus-groups with listeners._

### Overview

Users enter the picture. Programs now interact via `prompt`, `alert`, `confirm`.
User-visible behavior becomes the anchor that all prior reading, tracing,
refactoring, and reviewing skills must preserve. **Design thinking across the
whole situation begins here.**

The chapter's intellectual-agency move: _you make programs for people who will
never see your code, and the test of your work is whether it serves them._ The
user-twin is the V-side of the V/F symmetry.

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
  response; the response enters the program through prompt and a resolve
  event…"_ — this is the Ch1→Ch2 dev↔NM loop grown into the dev↔NM↔user loop
- 🐣 Operate the V/F coordination bridge (Idea #2 LO): users' needs drive data
  shape; data shape supports flexible user experiences
- 🐔 Apply the Bakhtiarian loop 4-beat for a small interaction: V proposes → F
  responds → F discovers → V interprets

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

_Metaphor anchor: **the composer-virtuoso asymmetric duet** — with an alien
virtuoso this time. Dazzling, fast, pattern-rich, but cognitively distinct from
human virtuosos. Collaboration is specifically different, and this chapter digs
into why._

### Overview

No new language features. This chapter applies all Ch1–3 skills in collaboration
with an LLM. 🤖 Agents are a fourth audience.

**Wrapping premise: code is the UI for the NM.** Source code is the _control
panel_ through which a programmer operates the NM. Authoring code is _one_ way
to operate that panel; describing intent to an LLM is another. Either way, the
NM is the thing the panel controls.

LLMs let you **delegate operation of the control panel** while still owning the
machine. Two LLM-conversation modes:

- 🔬 **NM-grounded conversation** (Frogramming-with-delegation)
- 🎨 **User-grounded conversation** (Vibetoading-with-delegation)

**Visual NM view becomes load-bearing here.** When you delegate the control
panel, you can no longer rely on the act of typing to keep your NM understanding
sharp.

The chapter's intellectual-agency move: _you direct an alien intelligence — and
you stay in charge of what gets built._ Twinning the LLM means twinning a
process that twins what you twin (the user, or the NM). Your job is to align —
and to relish productive divergence.

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
- 🐥 Use the 4 Levels of Abstraction framework (AI-adoption model) to discuss AI
  at the appropriate level
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
- 🐥 Apply the AI-adoption model: twin Level 2 (cognitive) to operate at Level 3
  (behavioral)
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
- 🐔 Recognize the emergence of **agentic AI systems** (LLMs doing design work,
  not just notation) as a more complex development than the authoring-partner
  frame covers; flag as territory for post-curriculum learning
- 🐥 _(deeper section)_ Friston's "A Duet for One" — _"understanding just IS the
  alignment of generative models into a single coherent predictive process"_ —
  applied to your conversations with the alien virtuoso
- 🐔 Reflect on the difference between "it runs" and "I understand it" — the
  boundary the LLM tests every day

---

## Ch5 Developers, Computers, Users, Agents, and You

_Metaphor anchor: **the composer's daily practice** — small, complete pieces
written for the composer's own practice. Variations on a theme, études on a
single technique, sketchbook entries exploring an idea. Ligeti's Musica
Ricercata, Beethoven's sketchbooks, Bach's inventions. A serious genre in its
own right._

### Overview

Training wheels come off. You Frogram for yourself through 💭 **snippetry**:
small, complete, self-contained programs as an ongoing practice. You explore
JavaScript's full multi-paradigmatic range, develop your compositional voice,
and discover that Frogramming has value beyond productivity: for mastery,
exploration, delight, the steady upkeep of one's craft, and the new thoughts it
lets you think.

**"You" is the fifth audience.** Students program for themselves — to learn,
practice, think, stretch, explore, express, delight, and discover. _"You"_ is
both singular (your own practice) and plural (sharing with and remixing from
peers through the collaborative gist system).

**Training wheels off, power tools available.** JEJ constraint lifts; web worker
sandbox lifts; enforced formatting lifts; Study Lenses NM visualizations are no
longer primary. Replaced by full browser devtools, external NM visualization
tools (loupe for the event loop, promisees for Promises), four sandbox modes
(script / module / HTML+script / HTML+module).

The chapter's intellectual-agency move: _you can use programming as a tool for
thought, on whatever problems and ideas interest you, for the rest of your
life._ Snippetry is how the Frogrammer keeps the NM alive between full-codebase
projects — and how the Vibetoader sketches quick experiences without the weight
of production.

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
  unification)

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

- **Body prose of `syllabus.md`** carries **L0 and L1** — the chapter's primary
  content
- **Sidebars + V/F dialogues** carry **L2** — necessary for L2 reading;
  skippable for L1 reading
- **End-of-chapter snippetry prompts** carry **L3**
- **Footnotes, side notes, easter eggs, references** carry **L4** — fully
  optional, for the attuned reader

When this file is later folded back into the prose `syllabus.md`, the LOs above
guide what each region of each chapter delivers.

---

## Cross-references

- `syllabus.ontology.md` — the reference framework these chapters instantiate
- `syllabus.manifesto.learners.md` — the _why_ addressed to learners
- `syllabus.manifesto.authors.md` — the _why_ addressed to curriculum authors /
  forkers / contributors
- `syllabus.manifesto.community.md` — the _why_ addressed to partner
  communities, mentors, cohort hosts
- `syllabus.md` — the existing prose course (read-only for the current redraft)
- `narrative/README.md` — the composer/virtuoso metaphor system
- `narrative/assets/spiral-curriculum.png` and
  `narrative/assets/curriculum-spider-web.svg` — the topology + trajectory views
- `just-enough/javascript/` — the JEJ → NM → embody → lenses → orchestrator
  infrastructure
