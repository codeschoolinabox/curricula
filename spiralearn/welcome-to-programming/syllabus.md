---
sidebar_position: 1
---

# 🐸 Welcome to Frogramming - Syllabus

> The best authors and the best JavaScript developers are those who obsess about
> language, who explore and experiment with language every day and in doing so
> develop their own style, their own idioms, and their own expression.
>
> — [Angus Croll](https://anguscroll.com/),
> [If Hemingway Wrote JavaScript](https://anguscroll.com/hemingway/)

## TL;DR

**Welcome to Frogramming** is a self-paced course that will take you from
_learning to program_ (building your code literacy) to _programming to learn_
(applying your literacy to explore new concepts and skills). You will build
predictive mastery of JavaScript's notional machine: reading code before writing
it, correlating syntax to the runtime events it produces, and moving through the
PRIMM progression (predict, run, investigate, modify, make) until prediction is
reliable and authorship is confident. Each step of the way you will ground your
skills in the world around you, learning to consider who you're building for and
what you hope to achieve. Ultimately you will build the confidence to write your
own programs, and the awareness to write the _right_ programs.

---

**Welcome to Frogramming** is a self-paced course that treats programming as
collaborative communication. A single piece of source code addresses multiple
audiences at once (other developers, the computer, users, and AI agents). You
will develop the ability to recognize who your code is for, understand how each
audience experiences it, and tailor your decisions so your code does exactly
what you designed it to do for each of them.

You'll learn to understand and predict what the computer does with your code so
you can control it precisely. And you'll learn to understand users so you can
build software that actually serves them, which is ultimately what all the
technical skill is for. LLMs have made it possible for anyone to build working
software by describing the user-visible behavior they want without worrying
about how the computer works behind the scenes. That's **Vibetoading**, and it's
genuinely powerful for quick prototypes and new projects. But building larger
systems, extending existing codebases, evaluating whether generated code
actually does what you need, and making the design judgments that shape what
gets built in the first place: that's **Frogramming**, and it requires
understanding the machine behind the scenes well enough to predict and direct
it.

The skills you build here are fundamentally human: communication, empathy,
user-centered design thinking, the ability to hold a complex situation in view
and make it work for real people. Those same human skills are exactly what keep
you professionally relevant and personally capable in a world where machines
handle more of the writing. **An LLM can do many things FOR you. It cannot
UNDERSTAND for you. This curriculum is built around that fact.** Both
**Frogramming** and deliberate **Vibetoading** have value beyond productivity:
for the satisfaction of understanding a system deeply, for the new ways of
thinking it opens up, and for the small programs you write just to explore,
experiment, or surprise yourself. This course helps you build both at once.

- **Chapter 0. What is Programming?** Conceptual orientation before any code.
  You learn to see source code as communication that simultaneously addresses
  multiple audiences (developers, the computer, users, and agents) and
  understand why comprehension comes before production.
- **Chapter 1. Developers.** Your first code and your first audience. You learn
  to write comments and logs as intentional communication to other developers —
  including future-you, who is a stranger by the time they come back to this
  code. **Twinning the developer audience** is the central skill of this
  chapter, naming what the long programming-culture tradition of "writing for
  the next reader" has always been. Every small choice in your code (a word, a
  placement, a method) is a micro-decision that shapes how it reads.
- **Chapter 2. Developers and Computers.** The computer becomes a full audience.
  You build an accurate mental model of JavaScript's notional machine (how it
  evaluates expressions, stores values, walks scope chains) and develop the
  discipline of predicting evaluation before running code, then verifying with
  trace tables and the debugger.
- **Chapter 3. Developers, Computers, and Users.** Users enter the picture. You
  learn to write programs people interact with, where user-visible behavior
  becomes the anchor that all your reading, tracing, refactoring, and reviewing
  skills must preserve. Design thinking across the whole situation begins here.
- **Chapter 4. Developers, Computers, Users, and Agents.** Source code is the
  **UI** — the control panel through which a programmer operates the notional
  machine. LLMs are an alternative way to operate that UI: you delegate the
  typing while still owning the NM. Two conversational modes fall out of this
  naturally — **NM-grounded** (Frogramming-with- delegation: "make the NM
  declare a `const`, then enter a loop…") and **user-grounded**
  (Vibetoading-with-delegation: "when the user clicks, greet them by name…").
  Same Frogrammer/Vibetoader spectrum, different interface. Visual debuggers /
  embody / lenses are the _direct_ NM view that complements the code text —
  letting you observe and predict the machine even when you didn't write the
  code yourself. You learn what makes LLM collaboration specifically different
  from human collaboration, develop skills for evaluating and directing LLM
  output using everything from Chapters 1–3, and build calibration for when to
  delegate and when to do the work yourself.
- **Chapter 5. Developers, Computers, Users, Agents, and You.** Training wheels
  come off. You Frogram for yourself through snippetry: small, complete,
  self-contained programs as an ongoing practice. You explore JavaScript's full
  multi-paradigmatic range, develop your compositional voice, and discover that
  Frogramming has value beyond productivity: for mastery, exploration, delight,
  the steady upkeep of one's craft, and the new thoughts it lets you think.

---

## Contents

- [What to Expect](#what-to-expect)
- [Why Learn to Frogram](#why-learn-to-frogram)
  - [What programming languages are](#what-programming-languages-are)
  - [Notional machines](#notional-machines)
  - [The LLM shift: a new participant in an old dance](#the-llm-shift-a-new-participant-in-an-old-dance)
  - [Your instrument: JavaScript, and your practice instrument: Just Enough JavaScript](#your-instrument-javascript-and-your-practice-instrument-just-enough-javascript)
  - [Snippetry](#snippetry)
- [The Metaphor: Composer, Virtuoso, Instrument and Audience](#the-metaphor-composer-virtuoso-instrument-and-audience)
- [References](#references)
- [Symbology](#symbology)
- [Before You Begin](#before-you-begin)
- [Chapter 0: What is Programming?](#chapter-0-what-is-programming)
- [Chapter 1: Developers](#chapter-1-developers)
- [Chapter 2: Developers and Computers](#chapter-2-developers-and-computers)
- [Chapter 3: Developers, Computers, and Users](#chapter-3-developers-computers-and-users)
- [Chapter 4: Developers, Computers, Users, and Agents](#chapter-4-developers-computers-users-and-agents)
- [Chapter 5: Developers, Computers, Users, Agents, and You](#chapter-5-developers-computers-users-agents-and-you)

> **Chapter bodies and learning objectives live in
> [`syllabus.chapters.md`](./syllabus.chapters.md).** The chapter sections below
> give the framing; the full sub-sections (0.1, 0.2, …, 5.5) and the per-layer
> LO contracts are in the companion file.

---

## What to Expect

**An LLM can do many things FOR you. It cannot UNDERSTAND for you.**
Understanding lives in your head, not the model's. An LLM can write code,
explain a concept, simulate a teacher. It can produce excellent surface-level
descriptions of how a machine works, what a user wants, what your collaborators
expect, what your software does in the world. What it cannot do is build any of
those understandings in your head. The understandings this course develops — of
the JavaScript machine, of users, of your fellow developers, of the LLM itself
as a collaborator, of your code's place in larger systems — are non-delegable.
They live in your head, or they don't live. You can outsource production. You
cannot outsource comprehension.

Human learning doesn't come from understanding explanations, even excellent
ones. It happens through pedagogically-designed _experiences_: prediction that
commits you to a model, surprise when the model breaks, careful sequencing so
wrong models don't install in the first place, repetition that automates what
was once deliberate, narrative that holds attention across difficult passages,
metaphors used carefully and kept honest about where they break. Metaphors
specifically deserve caution. A metaphor at the right level of abstraction —
within your zone of proximal development, neither too far below your current
understanding nor too far above — is a scaffold. A slightly wrong metaphor
_installs_ a misconception, often invisibly, often expensive to remove later.
Multiple metaphors used in the same course have to be aligned and
non-contradictory or they undermine each other. An explanation — including a
metaphorical one — is someone else's (or your own past self's) **crystallization
of an experience already undergone**. The change happens IN you, through
experiences only you can have.

Here's the empowering version of this picture. What we call _expertise_ is, in
large part, a library of past experiences automated through repetition.
Cognitive scientists call this _automaticity_. An expert reaches good solutions
instinctually because behind the scenes they're drawing on hundreds of
predict-fail-correct cycles that have been compiled into reflex. A capable
novice can find the same solutions, but slowly — through deliberate exploration
— because they haven't accumulated those automations yet. Expertise isn't a
different kind of mind; it's the same mind with more experience, automated. This
is learnable, which is the whole point. It's also why expertise matters more,
not less, when collaborating with LLMs: working productively with an alien mind
requires an automated library of your own experiences to compare against, to
calibrate from, and to check the LLM's output against. A learner without that
library can't tell when the LLM is right, when it's wrong, or when it's
confidently misleading them. The library is what lets you direct the alien
instead of being directed by it.

Two methodologies in this curriculum illustrate the principle in operation.
**Fine-grained NM prediction-and-verification** — predict the chain of internal
events the machine will produce, observe what it actually produces, correct your
model when they diverge — is how the 🔬 Frogrammer builds the twin of the
machine. (At professional scale this same methodology can manifest as code
tests: predictions about behavior, automated against actual behavior, with the
divergence as the signal.) **The design thinking process** — form hypotheses
about what users need, do, and feel; prototype; observe real people encountering
the prototype; correct your model when they diverge — is how the 🎨 Vibetoader
builds the twin of users. The cycles run at different timescales — microseconds
of internal-events for the machine twin, weeks of user contact for the user twin
— but the structure is the same: predict, encounter, update. Two domains, two
hats, two non-delegable practices. An LLM could narrate every step of either
methodology. It cannot have the cycle _for_ you, in either domain. The cycle is
the experience, and the experience is what builds the twin, and the twin _is_
understanding.

### Programming is collaborative communication

**Programming is collaborative communication.** A single piece of source code
simultaneously addresses multiple audiences: other developers who read it, a
computer that evaluates it, users who experience it, and agents who collaborate
on it. This course guides you from your first comment to fluent collaboration
with AI agents, using the smallest possible set of language features. It is
self-study: no time estimates, no deadlines. Go at your own pace.

**Vibetoading vs. Frogramming.** Every programming language describes a
_notional machine_ — an imaginary model of how the computer carries out your
instructions. Whether you're writing the code yourself or directing an LLM (or a
human!) to write it for you, you can work two ways:

- **🎨 The Vibetoader** works grounded in the user. They build a deep user-twin
  through research, prototyping, and testing with real people, and intentionally
  delegate the notional machine to an LLM, a collaborator, or familiar tools.
- **🔬 The Frogrammer** works grounded in the notional machine. They build a
  deep NM-twin through prediction, tracing, and verification, and may delegate
  or do-at-lighter-touch user-research.

Neither hat is better, and they're not a binary — Vibetoading and Frogramming
are a spectrum, and most developers wear different hats on different tasks,
different files, different moments. Vibetoading shines for user-facing
prototyping, ideation grounded in real people's needs, low-stakes work where the
NM can be safely delegated, and giving domain experts the power to solve their
own problems. Frogramming is what holds up under stakes that the NM-twin makes
visible: production code, security-sensitive systems, anything multi-person or
long-lived. This course teaches you to wear both hats deliberately — and
especially to recognize which the moment is asking for.

Both hats shoulder a deep, non-delegable twin — a Frogrammer the notional
machine, a Vibetoader the user. Neither's depth can be outsourced. This course
teaches Frogramming in depth because the notional machine is what makes this a
programming curriculum; design thinking and user research are taught at
gesture-level (Chapter 3) with referrals out for the deeper practice. Once you
understand what it means to _Frogram_, you can design your own NMs at the right
abstraction for any system — a flowchart of cloud services, a state machine of
UI components, or the JEJ NM at the bottom. The layer adapts; the skill is the
same.

**How do you build this predictive mastery? Five strands** run beneath the
curriculum, progressively layering as the chapters advance:

- **Twinning** (baseline): building an accurate mental model of a process
  outside your own mind. Each chapter asks you to twin a different process: the
  🧑‍💻 _developer_ who reads your code (Ch1), the 💻 _computer_ that evaluates it
  (Ch2), the _user_ who experiences it (Ch3), the 🤖 _agent_ you collaborate
  with (Ch4). You can't communicate well with something you don't understand.
  **Vibetoading prioritizes _twinning_ the user; Frogramming prioritizes
  _twinning_ the NM.**

- **Decisions (micro and macro)**: every keyword, name, operator, and structure
  in your code is a **micro**-decision. Every architectural choice, paradigm,
  and program shape is a **macro**-decision. Both levels reach the twinned
  audiences. Micro-decisions operate at multiple levels: _text voice_ (what does
  this name communicate?), _logical voice_ (how do you structure your
  programs?), _computational voice_ (string operations, pattern matching, bit
  manipulation — each a different model of computation), _experience voice_ (the
  user's interactions). Macro-decisions operate above: what kind of program,
  what overall shape, what paradigm. **This is where your compositional voice
  develops** — distinctive programmer voices emerge from cumulative
  macro-decisions over time. Cultivating voice is a real curriculum aim, not a
  side effect.

- **Perspective stacking** (mastery): any piece of code can be read at multiple
  levels simultaneously: individual syntax, what a line _does_, how parts
  _connect_, what the program is _for_, what the _user experiences_. Every
  chapter deepens your ability to hold more of these perspectives active at
  once. Study Lenses, trace, and socratizing automate different perspectives;
  PBIS names them explicitly.

- **The whole rhetorical situation** (enabled by the prior three): the entire
  software context — users, developers, computer, product, environment, and the
  purpose the code serves. Twinning each part isn't enough; the fullest work
  holds the _whole_ situation in view at once. This is where design thinking
  enters — rehearsing, workshopping, focus-testing, iterating across the full
  system, not just refining individual pieces. This strand surfaces most
  strongly in Chapter 3 (users, PBIS) and deepens through Chapter 5.

- **Affordances**: any system — a language, an NM, a UI — is an
  _affordance-space_, a set of relational possibilities between agent and
  environment. A chair affords sitting, but only for organisms with the right
  body; Lisp affords macros, Haskell affords laziness, JS affords
  prototype-mutation. Learning JS isn't memorizing syntax — it's learning what
  this affordance-space lets you do. The Mikhak loop is an _affordance-discovery
  dialogue_: Frogramming probes substrate-affordances (what does the NM also
  permit?); Vibetoading probes user-affordances (what does the UI also invite?);
  the dialogue surfaces affordances neither hat saw alone. This strand runs
  through every chapter and sharpens in Chapter 4 (agent collaboration) and
  Chapter 5 (snippetry as affordance-play).

**The data thread (the red thread).** Threading through and beneath all five
strands is the word _data_ itself, accruing richer semantics at each layer —
from theory (data as concept), to computation (data as bits exerting control on
hardware), to interaction (data as the user's experience), to domain (data as
the world the program changes). The strands are how the curriculum _teaches_;
the data thread is what stitches it together — the same word deepening with
every spiral pass.

**The spiral (skills) and the ladder (audiences).** Each chapter adds an
audience to the learner's awareness (the ladder: devs → +computer → +users →
+agents → +you). Within each chapter, skills are revisited at increasing depth
(the spiral: read → trace → describe → modify → write, practiced again with each
new audience and language feature). Study Lenses generates exercises that drive
this spiral at the exercise level. Each objective below marks where a skill is
_first introduced_, not where it ends. The "builds on" progressions are rough
through-lines: the strongest path from prior skills to the new one, not an
exhaustive dependency list.

**Study Lenses** is embedded directly in every page. Every code snippet has a
full suite of lenses available: trace tables, variable highlighters, Parsons
problems, flow charts, fill-in-the-blanks, and more. Exercises suggest lenses,
but you're always free to use whichever helps you most. The
just-enough/javascript tooling that powers Study Lenses implements the
Explorotron pedagogical framework (Malaise & Signer, 2023).

**JavaScript only**. JS is the primary track because it is a popular language
that makes the developer/user split _architecturally visible_: `console.log`
lives in devtools (developer space), `prompt`/`alert`/`confirm` live in browser
UI (user space). That separation is the curriculum's rhetorical model made
concrete.

[TOP](#welcome-to-frogramming---syllabus)

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

[TOP](#welcome-to-frogramming---syllabus)

---

## Why Learn to Frogram

_Why learn to code when LLMs write code?_ Because designing computation is not
the same work as writing the notation for it. Both matter. The design work —
twinning the audiences your code addresses, whether the notional machine (a
Frogrammer's depth) or the user (a Vibetoader's depth) — is non-delegable in
either hat. LLMs handle notation; the design work is yours. And there are also
reasons to program that aren't about productivity at all.

### What programming languages are

A programming language is a notation system for describing computation to a
machine. It's a compromise between how humans think and how machines work —
easier to learn than directly telling a computer what to do in 1's and 0's, but
much stricter than human language. The machine evaluates what you write exactly,
blindly, without interpretation or judgment. This is true regardless of which
language you use.

**Although we call it a "language," the computer doesn't read your code the way
you read a sentence.** To the machine, your source code is a _data structure_ —
a parsed tree of tokens and nodes — and compilers or interpreters traverse that
structure without interpreting meaning or intent. That's why syntax and
semantics have to be exact: there's no forgiving reader on the other end, only a
structure-walker. What feels like writing a language to us is, for the machine,
building a precise data structure.

### Notional machines

Every programming language describes computation through an imaginary machine —
its **notional machine**. Each language has its own, with its own rules,
capabilities, constraints, and failure modes. A given language can even be
understood through more than one notional-machine framework: different
pedagogical accounts can emphasize different aspects of the same underlying
machine. "The notional machine" is a category, not a universal referent — there
isn't one NM to learn and be done.

You don't need to understand below the notional machine you're working with; the
interpreter handles compilation, optimization, and hardware for you. You DO need
to understand how that particular notional machine operates — including which of
its parts are themselves black-boxed (built-in APIs like `Math.random` — known
by interface, not internals).

**The notional machine isn't just something you understand — it's what you
program.** Code is how you direct the NM to do what you want. Programming is,
fundamentally, instructing a notional machine through notation it will interpret
exactly.

**This course focuses on JavaScript's notional machine.** In mastering key
portions of it deeply (through Just Enough JavaScript), you're doing more than
learning JavaScript. You're learning **what it means to master a programming
language** — how to build an accurate mental model of a notional machine from
the outside, how to read code against that model, how to predict evaluation, how
to debug divergence from expectation, how to direct the machine precisely. That
discipline transfers. Once you've mastered key portions of one notional machine
deeply, you're equipped to learn others when you need them. (No one masters 100%
of any real language's NM; "key portions" is the realistic target.)

**The concrete skill: prediction.** The course builds this mastery through
prediction — you learn to predict what the notional machine will do before your
code runs, then verify those predictions using Study Lenses and the browser's
debugger. By the end of Chapter 4, you can trace every category of event the JS
notional machine produces: scope creation, binding lifecycle, expression
resolution, coercion, scope chain walks, prototype lookups. That's what
"understanding the NM" means in practice — not abstract knowledge, but
demonstrable predictive accuracy.

We focus on the machine, not on any specific domain the machine might be used
in. Web apps, games, data pipelines, ML systems come and go. The capacity to
read and direct a programming language's notional machine — whichever language
you're in — is the invariant skill.

This is a subtle distinction from
[**_Learnable Programming_**](http://worrydream.com/LearnableProgramming/) by
Bret Victor, which influenced this curriculum. Victor focused on visualizing the
_output_ of computation — what programs produce. Our tooling visualizes the
_machine's internals_ — how the mechanism does it. Different pedagogical
targets; both valuable.

### The architect/implementer division has always existed

Software has always had a design-work / notation-work split: architect /
implementer (cf. Fred Brooks), staff engineer / junior, consultant / in-house,
design-phase / build-phase within solo work, greenfield developer /
contributor-to-an-existing-codebase. Even when these roles aren't explicitly
divided, both types of work are necessary and the best programming happens when
the two sides coordinate effectively. The division of labor is old territory,
not an LLM invention.

To program, you needed notional-machine understanding _and_ full notation
fluency — both in one head, or split across a small team. This simultaneous
demand is a large part of what makes programming hard to learn and master.

### The LLM shift: a new participant in an old dance

The principle that organizes everything below is named in § How Learning
Happens: **understanding is the part of programming that cannot be delegated.**
The four sub-points that follow — honest framing, verification limit, NM
understanding matters more, the concrete Vibetoading/Frogramming difference —
are consequences of that principle, applied to the LLM-shift specifically.

Experienced collaborators who handle much of the notation — senior engineers,
pair partners — have always been part of software. LLMs are a new kind of such
collaborator: same role, different cognition. Chapter 4 develops the
differences.

**Honest framing**: LLMs are often better at notation than many humans — faster,
with a broader repertoire, fewer typos. Pretending otherwise would be dishonest.
But great Frogramming isn't only about productivity. Design judgment, context
awareness, aesthetic and ethical taste aren't where LLMs excel. And Chapter 5
develops the case for Frogramming-for-its-own-sake — the practice of keeping
your NM-fluency sharp when you're no longer writing most of the notation
yourself.

**The verification limit**: we don't always understand what we direct. Even our
tests may be out of our depth — it's possible to verify that a program does the
_wrong thing correctly_. This makes certain practices _more_ important in an
LLM-assisted workflow, not less: short iterations of user-visible behavior we
can actually evaluate, human-evaluable acceptance criteria, testing discipline
oriented toward visible behavior; Agile development vs Waterfall all over again!
Chapter 3 (users, PBIS, visible behavior) carries particular weight for this
reason.

**NM understanding matters more now, not less.** LLMs can write the notation —
pull the levers, work the controls — but the notional machine they're directing
is still yours to understand. When you converse with an LLM about what your
program should do, you're describing what you want the NM to do, and you're
judging its output against what the NM actually produces. With an LLM in the
loop, you can (weirdly) abstract away much of the notation layer and program the
NM more directly — through prose and NM understanding, mediated by the LLM that
translates your intent into notation. But that route only works if your NM
understanding is strong enough to specify outcomes the NM can actually produce
and to evaluate whether the LLM delivered them. Without NM understanding, you
can't direct the LLM meaningfully and you can't judge its output. The NM is
what's being programmed — just via a new route.

**This is the concrete difference between Vibetoading and Frogramming, applied
to the LLM shift.** A Vibetoader directing an LLM iterates on user-visible
behavior; their twin is the user, and the NM is operated by the LLM virtuoso. A
Frogrammer directing an LLM still operates the NM through their twin, with the
LLM doing the notation work. Both are engaged in genuine work; both shoulder a
non-delegable twin; they delegate different audiences to the LLM. Same
comparison, both-non-delegable framing. With or without an LLM, **predicting
against the twin you shoulder** is the skill the course builds — NM-prediction
for Frogramming, user-behavior prediction (through prototyping and testing with
real people) for Vibetoading.

This frame treats LLMs as authoring partners. Agentic systems where LLMs plan,
execute, and modify state autonomously are a more complex picture deferred to
later learning.

### What Bret Victor wanted, decomposed

[**_Learnable Programming_**](http://worrydream.com/LearnableProgramming/) said
it best:

> - **Programming is a way of thinking, not a rote skill**. Learning about "for"
>   loops is not learning to program, any more than learning about pencils is
>   learning to draw.
> - **People understand what they can see**. If a programmer cannot see what a
>   program is doing, she can't understand it.
>
> Thus, the goals of a programming system should be:
>
> - to support and encourage powerful ways of thinking
> - to enable programmers to see and understand the execution of their programs
>
> ...
>
> _How do we get people to understand programming?_
>
> We change programming. We turn it into something that's understandable by
> people.

Victor wanted _less implementation toil_ AND _more powerful thinking tools_,
both at once. LLMs decompose his wish in an unexpected way:

- ✅ **Less toil** — notation burden partially lifted by LLMs
- ❌ **Less visibility** — LLM-generated code arrives as a fait accompli; the
  mechanism is more hidden, not less
- ✅ **Study Lenses reclaims visibility** — of the machine's internals, which is
  this curriculum's specific focus

Study Lenses gives a slightly different solution to the visibility half of
Victor's wish than he expressed in Learnable Programming: We will focus on
visualizing the _internal mechanisms_ of your program's evaluation, not the
final output.

### Your instrument: JavaScript, and your practice instrument: Just Enough JavaScript

JavaScript has its own notional machine with specific characteristics and
capabilities — scopes, bindings, values, coercion, scope chain lookup, prototype
chain lookup. Chapter 2 studies this machine in depth.

**Just Enough JavaScript (JEJ)** is the deliberately constrained subset we use
for most of the curriculum. "Few options, many possibilities" — depth on a small
surface rather than skimming across a large one. This is a pedagogical
constraint, not a permanent one.

### What this course builds in you — the five strands

Five strands run beneath every chapter, each enabled by the ones before:

1. **Twinning** — accurate mental models of processes outside your mind
2. **Decisions (micro and macro)** — every keyword, name, operator, structure
   (micro) AND every architectural choice, paradigm, program shape (macro). This
   is where your **compositional voice** develops.
3. **Perspective stacking** — holding twinning and decisions across multiple
   simultaneous levels
4. **The whole rhetorical situation** — the entire software context: users,
   developers, computer, product, environment, purpose. Design thinking across
   the whole system.
5. **Affordances** — every language, NM, and UI is an affordance-space; learning
   to read what a system _also_ permits, not just what it asks for.

Plus the data thread — the word _data_ deepening at each layer — stitching all
five together, and Study Lenses making the machine's work visible throughout.

### 💭 Snippetry

Chapter 5 introduces **snippetry** — writing small, runnable, self-contained
programs as an ongoing practice. The answer to "why write code when I'm no
longer building full codebases? how do I build and maintain my NM for a
programming language?" Snippetry is how the Frogrammer keeps the NM alive
between full-codebase projects: **complete enough to run** (each snippet
evaluates top-to-bottom), **small enough to understand** (you can hold the whole
NM in your head at once and predict-trace-verify in full), **connected enough to
inspire** (snippets allude to, vary on, and remix each other — nothing stands
alone). It's also a natural home for deliberate Vibetoading — quick exploratory
sketches where you choose to chase the outcome and delegate the machine.
Frogramming for mastery, exploration, aesthetic satisfaction, delight, surprise,
discovery, and the new thoughts code lets you think — alongside or instead of
programming for productivity. "You" is the fifth audience: students program for
themselves, share with peers through a collaborative gist system that extends a
living snippetry corpus, and explore JavaScript's full multi-paradigmatic range
with training wheels off and real browser evaluation.

### The future beyond human-designed languages

Currently, LLMs work with programming languages designed for humans — machines
using controls built for human minds. A future where LLMs design their own
formally-provable languages is possible; those languages would likely defy our
notions of "high-level" and "low-level," since those adjectives measure distance
from _human_ cognitive convenience. If we can't read the code and can't evaluate
the tests, user-visible behavior is what's left to check against — the
agile-visible-discipline story intensifies further.

Even then, the programming languages we have now remain worth cherishing: for
their humanity, for how they shape thinking, for the new thoughts they give us,
and for our connection to a computational history that runs from Jacquard looms
to JavaScript.

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## The Metaphor: Composer, Virtuoso, Instrument and Audience

Throughout this course we illustrate the ideas above using a consistent
metaphor: **a mechanical instrument, a composer, a virtuoso, a score, and an
audience**. The instrument varies across chapters; the roles stay the same. If
the metaphor doesn't click for you, the underlying ideas stand on their own.

| Idea                    | Illustration                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| The notional machine    | A **mechanical instrument** — plays the score blindly, deterministically                      |
| Source code             | **The score** — notation the mechanism reads                                                  |
| The designer            | **The composer** — holds computational intent, understands the instrument, knows the audience |
| The implementer         | **The virtuoso** — masters notation and the controls; produces the score from direction       |
| Users                   | **The audience** — concert-goers who react to the performance                                 |
| Other developers        | **Co-composers** — fellow score-readers                                                       |
| The computer evaluating | **The mechanism playing the score blindly at performance time**                               |

Chapter 2 studies the instrument's mechanism. Chapter 3 brings in the audience
and design thinking. Chapter 4 teaches collaboration with the alien virtuoso
(the LLM). Chapter 5 turns to the composer's daily practice — snippetry — and
hints at alien composers emerging on the horizon.

**The full treatment** of the cast (Composer, Virtuoso, Mechanism, Audience,
Co-composers, Historical cameos), the human-vs-alien virtuoso split, the
composition-vs-performance two-phase structure, the
comprehension-before-production mapping, and the per-chapter instantiations
lives in [`syllabus.ontology.md`](./syllabus.ontology.md) §24.

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## References

Three resources are always available alongside the curriculum. None is a
prerequisite; refer to them when you need them.

- **Just Enough JavaScript** — a curated subset of JavaScript: enough to write
  imperative programs that interact with users through text and numbers. Fewer
  features → more cognitive bandwidth for the concepts that matter. See it as a
  companion reference, not a prerequisite.
- **Studying with LLMs** — guidance and starter prompts for using LLM assistants
  as _study partners_, not code generators, while working through earlier
  chapters. Distinct from Chapter 4, which is about agents as named
  collaborators in the development process. The principle: an LLM can _support_
  your experience of building the twin but cannot _produce_ it for you.
- **Learning Expectations** — a reference document for when you're in the middle
  of something hard and want context for what you are experiencing. Covers
  spiral curriculum design, threshold concepts, liminal zone thinking, and the
  learning sequence.

**The full source-materials catalog** — academic lineages, design- principle
sources, infrastructure documentation, prior-session handoffs — lives in
[`syllabus.ontology.md`](./syllabus.ontology.md) under _Source materials_.

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## Symbology

A small set of glyphs runs through this syllabus, each tied to a recurring
concept. They appear inline at structural anchors — section headings, bold
labels, table cells, audience lists — wherever the marked concept is the active
subject. This is a **reading aid**, not a memorization task; ignore any symbol
whose meaning isn't yet clear and come back to this key when needed.

| Symbol | Concept                         | What it marks                                                                                                                                                                    |
| ------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🐸     | The course / both hats together | The umbrella. Frog/toad ambiguity is a feature: it carries both hats at once. Appears in the title and stays out of body text.                                                   |
| 🔬     | Frogrammer                      | Development grounded in the notional machine — predict, trace, verify, apply craft practices intentionally; shoulders the NM-twin, may delegate user-research.                   |
| 🎨     | Vibetoader                      | Development grounded in the user — research, prototype, test with real people; shoulders the user-twin, may delegate the notional machine.                                       |
| 🧑     | Human                           | Used at active Human / AI distinctions.                                                                                                                                          |
| 🤖     | AI / Agent                      | Used both for "AI" (in the Human/AI distinction) and for "Agent" (the fourth audience). Same thing, two framings.                                                                |
| 🧑‍💻     | Developer (audience)            | The human who reads and writes code — Chapter 1's audience.                                                                                                                      |
| 💻     | Computer (audience)             | The machine that evaluates code — Chapter 2's audience. "Understanding the computer" = twinning the notional machine; the NM is the computer at our chosen level of abstraction. |
| 💭     | Snippetry                       | Small, runnable, self-contained programs as ongoing practice. The thought-bubble glyph is borrowed from the snippetry source repo.                                               |

**Flagged for later:** the User audience (Chapter 3) and the Notional Machine
itself don't yet have locked symbols. Both will be picked once the rest of the
symbology has been seen in rendered context — context will reveal what reads
cleanly.

**Out of scope for the symbology:** the egg / chick / chicken progression
markers (🥚🐣🐥🐔) used on learning objectives are a separate, established
convention for difficulty progression — not part of this set.

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## Before You Begin

- [ ] Read the course expectations: understand the comprehension-first approach
      before starting
- [ ] Skim the exercise types guide: you don't need to understand everything
      yet, just orient yourself
- [ ] Skim the Just Enough JavaScript reference: same, just get a feel for the
      terrain
- [ ] _(coming soon)_ Download the curriculum for offline study

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## Chapter 0: What is Programming?

No language features. Conceptual orientation only.

_Metaphor anchor: **the recital as rhetorical situation** — an entire
performance event with its audience, its performers, its instrument, and the
score that ties them together._

The chapter introduces the rhetorical model of source code (writing for multiple
audiences simultaneously: 🧑‍💻 developers, 💻 the computer, users, 🤖 agents), the
**Vibetoading / Frogramming** distinction, and the positioning of WtF within the
broader space of programming and computer science. _Vibing_ is named as a
legitimate stance — building by feel, pre- and post-LLM. What distinguishes the
V hat from no-twin vibing is the user-twin; what distinguishes the F hat from
no-twin ceremony is the NM-twin. The full twin/process 2×2 lives in the
ontology; here you meet the two hats and the four-quadrant grid (V/F ×
humans-only / LLM-collab).

The chapter's intellectual-agency move: _you arrive here with a why, and the
course is built to honor it._

**Full chapter content** — sub-sections 0.1 (Rhetorics), 0.2 (Positioning), 0.3
(Two Hats), plus per-layer learning objectives — in
[`syllabus.chapters.md`](./syllabus.chapters.md) Ch0.

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## Chapter 1: Developers

Language features: comments, `console.log` and the full `console` API with
string literals.

_Metaphor anchor: **the score as inter-composer communication** — other
composers read your score for intent and style, long before (or entirely instead
of) ever hearing it performed._

Your first code and your first audience. The 🧑‍💻 developer audience — including
future-you, who is a stranger by the time they come back to this code. Twinning
the developer audience is the central skill. You meet the **static vs dynamic**
distinction (source code vs program evaluation), apply it to comments and logs,
and start the discipline of **micro-decisions**: every word, every comment,
every console method is a choice that shapes how a stranger reads your work.

The chapter's intellectual-agency move: _you have authorial choices._

**Note** — the practice of writing for future-you is the opening of an arc the
course closes in Ch5. Future-you is a stranger here; by Ch5,
you-the-practitioner have become the audience you-the-learner started twinning.
Same self, two angles of approach.

**Full chapter content** — sub-sections 1.1 (Twinning the developer audience),
1.2 (Static vs dynamic), 1.3 (Comments), 1.4 (Logs), plus per-layer learning
objectives — in [`syllabus.chapters.md`](./syllabus.chapters.md) Ch1.

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## Chapter 2: Developers and Computers

_Metaphor anchor: **studying the instrument's mechanisms** — like an organ
builder examining bellows, tracker action, registration, and combination action,
you study how the JavaScript engine actually carries out your instructions._

The 💻 computer is now a full audience. The primary learning objective:
**JavaScript's notional machine** — the mental model of how the JS engine
evaluates your code, understood through a vocabulary of **evaluation events**.
The chapter has two tracks:

- **NM core (2.0–2.8)**: the machine itself — expressions, values, bindings,
  scope chain, prototype chain, coercion, statements, and reading/writing code.
  All required.
- **Computational idioms (2A–2F)**: what you _do_ with the machine — logic,
  strings, numbers, pattern matching, bits, dates. **2A and 2B required.**
  Choose at least one from 2C–2E. 2F is optional.

This is where **PBIS** lands (Purpose, Behavior, Implementation, Strategy — four
perspectives for reading any program), **trace tables** and **predictive
stepping** become routine, and the discipline of _predict-before-run_ becomes a
habit. The substrate of the NM is not inert: `embody/` is a crystalline
representation of the entire dynamic data lifecycle — a static 4D rendering of a
3D flowing river.

The chapter's intellectual-agency move: _you can predict what the machine will
do, then verify it._

**Full chapter content** — sub-sections 2.0 (The Notional Machine), 2.1 (Running
a Program), 2.2 (Expressions and Resolve), 2.3 (Values and Bindings), 2.4
(Statements and Control Flow), 2.6 (Prototype Chain), 2.8 (Reading, Writing,
Reviewing Code), 2A–2F (Computational Idioms), plus per-layer learning
objectives — in [`syllabus.chapters.md`](./syllabus.chapters.md) Ch2.

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## Chapter 3: Developers, Computers, and Users

Language features: `prompt`, `alert`, `confirm`. All control flow features
(`if`, `while`, `break`/`continue`) were introduced in Chapter 2 and are now
applied in programs where user interactions are the fixed behavioral anchors.

_Metaphor anchor: **writing for an audience, the composer's design thinking** —
the concert audience is real: they cheer, boo, throw tomatoes or flowers. Design
thinking across the whole situation._

Users enter the picture. Programs interact via `prompt`, `alert`, `confirm`.
User-visible behavior becomes the anchor that all prior reading, tracing,
refactoring, and reviewing skills must preserve. **Design thinking across the
whole situation begins here.** All Chapter 2 skills — PBIS, naming variables,
logging strategies, backtracing, refactoring, code review — are practiced under
a new constraint: user-visible behavior must be preserved. The data-flow loop
now grows past the Ch1→Ch2 dev↔NM loop into the full dev↔NM↔user loop.

The chapter's intellectual-agency move: _you make programs for people who will
never see your code, and the test of your work is whether it serves them._

**Full chapter content** — sub-sections 3.1 (User Input and Output), 3.2
(Variable Program Behaviors), 3.3 (Validating User Input), 3.4 (PBIS in User
Programs), 3.5 (Developing Programs), 3.6 (Plaintext Programs), plus per-layer
learning objectives — in [`syllabus.chapters.md`](./syllabus.chapters.md) Ch3.

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## Chapter 4: Developers, Computers, Users, and Agents

No new language features. This chapter applies all Chapter 1–3 skills in
collaboration with an LLM. 🤖 Agents are a fourth audience.

_Metaphor anchor: **the composer-virtuoso asymmetric duet** — with an alien
virtuoso this time. Dazzling, fast, pattern-rich, but cognitively distinct from
human virtuosos._

The wrapping premise: **code is the UI for the NM**. Source code is the control
panel through which a programmer operates the notional machine. Authoring code
is _one_ way to operate that panel; describing intent to an LLM is another.
Either way, the NM is the thing the panel controls. LLMs let you **delegate
operation of the control panel** while still owning the machine. Two
LLM-conversation modes: 🔬 NM-grounded conversation
(Frogramming-with-delegation) and 🎨 user-grounded conversation
(Vibetoading-with-delegation). The visual NM view (`embody/` + study lenses)
becomes load-bearing here: when you delegate the control panel, you can no
longer rely on the act of typing to keep your NM understanding sharp.

This chapter develops the **both-twins state** in its LLM-collaborative form: V
and F operating alongside an alien third intelligence (the 2×2 in
[`syllabus.ontology.md`](./syllabus.ontology.md) §3).

The chapter's intellectual-agency move: _you direct an alien intelligence — and
you stay in charge of what gets built._

**Full chapter content** — sub-sections 4.0 (Wrapping premise), 4.1 (What is an
LLM?), 4.2 (Collaborating in Prose), 4.3 (Developer Communication), 4.4
(Computer Communication), 4.5 (User Communication), 4.6 (Looking Forward), 4.7
(Vibetoading with the LLM), plus per-layer learning objectives — in
[`syllabus.chapters.md`](./syllabus.chapters.md) Ch4.

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## Chapter 5: Developers, Computers, Users, Agents, and You

_Metaphor anchor: **the composer's daily practice** — small, complete pieces
written for the composer's own practice. Variations on a theme, études on a
single technique, sketchbook entries exploring an idea — Ligeti's Musica
Ricercata, Beethoven's sketchbooks, Bach's inventions._

Training wheels come off. You Frogram for yourself through 💭 **snippetry**:
small, complete, self-contained programs as an ongoing practice. JavaScript's
full multi-paradigmatic range opens up; compositional voice develops;
Frogramming reveals value beyond productivity — for mastery, exploration,
delight, the steady upkeep of one's craft, and the new thoughts it lets you
think. Snippetry is the answer to _why write code when LLMs can write the
notation_: it is the experience-form of NM-maintenance, the daily reps that keep
your generative model alive once full-codebase work no longer provides them.

This chapter develops the **both-twins state** in its merged form — V and F
operating as a single integrated practice. Snippetry is where the two stances
stop being separate hats and start being the same gesture: each small program is
at once a user-twin sketch and an NM-twin probe. The Bakhtiarian-loop
unification names this.

**"You" is the fifth audience** — both singular (your own practice) and plural
(sharing with and remixing from peers through the collaborative gist system).
The arc that opened in Ch1 with _write for future-you, a stranger_ closes here
as _write for yourself, the audience you are becoming_. Same self, end-to-end.

The chapter's intellectual-agency move: _you can use programming as a tool for
thought, on whatever problems and ideas interest you, for the rest of your
life._

**Full chapter content** — paradigm exploration (imperative, functional, OOP,
declarative), training-wheels-off devtools mastery, the collaborative gist
system, the practice's balance of broad exploration and productive constraint,
the closing look-forward to agentic AI, plus per-layer learning objectives — in
[`syllabus.chapters.md`](./syllabus.chapters.md) Ch5.

[TOP](#welcome-to-programming-coded-for-humans--syllabus)
