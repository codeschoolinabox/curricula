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
handle more of the writing. Programming is also an intellectual and creative
practice worth doing for its own sake: for the satisfaction of understanding a
system deeply, for the new ways of thinking it opens up, and for the small
programs you write just to explore, experiment, or surprise yourself. This
course helps you build both at once.

- **Chapter 0. What is Programming?** Conceptual orientation before any code.
  You learn to see source code as communication that simultaneously addresses
  multiple audiences (developers, the computer, users, and agents) and
  understand why comprehension comes before production.
- **Chapter 1. Developers.** Your first code and your first audience. You learn
  to write comments and logs as intentional communication to other developers,
  and begin noticing that every small choice in your code (a word, a placement,
  a method) is a micro-decision that shapes how it reads.
- **Chapter 2. Developers and Computers.** The computer becomes a full audience.
  You build an accurate mental model of JavaScript's notional machine (how it
  evaluates expressions, stores values, walks scope chains) and develop the
  discipline of predicting execution before running code, then verifying with
  trace tables and the debugger.
- **Chapter 3. Developers, Computers, and Users.** Users enter the picture. You
  learn to write programs people interact with, where user-visible behavior
  becomes the anchor that all your reading, tracing, refactoring, and reviewing
  skills must preserve. Design thinking across the whole situation begins here.
- **Chapter 4. Developers, Computers, Users, and Agents.** LLMs join as a fourth
  audience and collaborator. You learn what makes LLM collaboration specifically
  different from human collaboration, develop skills for evaluating and
  directing LLM output using everything from Chapters 1–3, and build calibration
  for when to delegate and when to do the work yourself.
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
  - [0.1 The Rhetorics of Programming](#01-the-rhetorics-of-programming)
  - [0.2 Positioning _Welcome to Frogramming_](#02-positioning-welcome-to-frogramming)
  - [0.3 Two Hats: Vibetoading and Frogramming](#03-two-hats-vibetoading-and-frogramming)
- [Chapter 1: Developers](#chapter-1-developers)
  - [Comments](#comments)
  - [Logs](#logs)
- [Chapter 2: Developers and Computers](#chapter-2-developers-and-computers)
  - [2.0 The Notional Machine](#20-the-notional-machine)
  - [2.1 Running a Program](#21-running-a-program)
  - [2.2 Expressions and Resolve](#22-expressions-and-resolve)
  - [2.3 Values and Bindings](#23-values-and-bindings)
  - [2.4 Statements and Control Flow](#24-statements-and-control-flow)
  - [2.6 Prototype Chain](#26-prototype-chain)
  - [2.8 Reading, Writing, Reviewing Code](#28-reading-writing-reviewing-code)
  - [Computational Idioms (2A–2F)](#computational-idioms)
- [Chapter 3: Developers, Computers, and Users](#chapter-3-developers-computers-and-users)
  - [3.1 User Input and Output](#31-user-input-and-output)
  - [3.2 Variable Program Behaviors](#32-variable-program-behaviors)
  - [3.3 Validating User Input](#33-validating-user-input)
  - [3.4 PBSI in User Programs](#34-pbsi-in-user-programs)
  - [3.5 Developing Programs](#35-developing-programs)
  - [3.6 Plaintext Programs](#36-plaintext-programs)
- [Chapter 4: Developers, Computers, Users, and Agents](#chapter-4-developers-computers-users-and-agents)
  - [4.0 What is an LLM?](#40-what-is-an-llm)
  - [4.1 Collaborating in Prose](#41-collaborating-in-prose)
  - [4.2 Agents and Developer Communication](#42-agents-and-developer-communication)
  - [4.3 Agents and Computer Communication](#43-agents-and-computer-communication)
  - [4.4 Agents and User Communication](#44-agents-and-user-communication)
  - [4.5 Looking Back, Looking Forward](#45-looking-back-looking-forward)
  - [4.6 Vibetoading](#46-vibetoading)
- [Chapter 5: Developers, Computers, Users, Agents, and You](#chapter-5-developers-computers-users-agents-and-you)
  - [5A. Training-Wheels-Off: Carrying Predictive Mastery](#5a-training-wheels-off-carrying-predictive-mastery)
  - [5B. Extending the NM: New JS Territory](#5b-extending-the-nm-new-js-territory)
  - [5C. Programming Paradigms](#5c-programming-paradigms)
  - [5D. Snippetry as Practice](#5d-snippetry-as-practice)
  - [5E. You as Audience](#5e-you-as-audience)
  - [5F. Compositional Voice and Micro-Decisions](#5f-compositional-voice-and-micro-decisions)
  - [5G. Self-Directed Learning](#5g-self-directed-learning)
  - [5H. The Whole Rhetorical Situation](#5h-the-whole-rhetorical-situation)
  - [5I. Capstone Reflections](#5i-capstone-reflections)

---

## What to Expect

**Programming is collaborative communication.** A single piece of source code
simultaneously addresses multiple audiences: other developers who read it, a
computer that executes it, users who experience it, and agents who collaborate
on it. This course guides you from your first comment to fluent collaboration
with AI agents, using the smallest possible set of language features. It is
self-study: no time estimates, no deadlines. Go at your own pace.

**Vibetoading vs. Frogramming.** Every programming language describes a
_notional machine_ — an imaginary model of how the computer carries out your
instructions. Whether you're writing the code yourself or directing an LLM (or a
human!) to write it for you, you can work two ways:

- **🎨 The Vibetoader** works from user-visible behavior. _Does the button work?
  Does the test pass? Does the page render?_ Iteration is on outcomes. The
  machine underneath is a black box.
- **🔬 The Frogrammer** works grounded in the notional machine itself. They
  predict what the machine will do, evaluate output against that prediction,
  and apply craft practices (testing, documentation, review, security)
  intentionally — to mitigate risks their NM-awareness makes visible.

Neither hat is better, and they're not a binary — Vibetoading and Frogramming
are a spectrum, and most developers wear different hats on different tasks,
different files, different moments. Vibetoading shines for prototyping,
ideation, low-stakes work, and giving domain experts the power to solve their
own problems. Frogramming is what holds up under stakes: production code,
security-sensitive systems, anything multi-person or long-lived. This course
teaches you to wear both hats deliberately — and especially to recognize which
the moment is asking for.

The Frogramming skill is harder to acquire and harder to delegate, so this
course centers it. Once you understand what it means to _Frogram_, you can
design your own NMs at the right abstraction for any system — a flowchart of
cloud services, a state machine of UI components, or the JEJ NM at the bottom.
The layer adapts; the skill is the same.

**How do you build this predictive mastery? Four threads** run beneath the
curriculum, progressively layering as the chapters advance:

- **Twinning** (baseline): building an accurate mental model of a process
  outside your own mind. Each chapter asks you to twin a different process: the
  🧑‍💻 _developer_ who reads your code (Ch1), the 💻 _computer_ that executes
  it (Ch2), the _user_ who experiences it (Ch3), the 🤖 _agent_ you collaborate
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
  PBSI names them explicitly.

- **The whole rhetorical situation** (enabled by the prior three): the entire
  software context — users, developers, computer, product, environment, and the
  purpose the code serves. Twinning each part isn't enough; the fullest work
  holds the _whole_ situation in view at once. This is where design thinking
  enters — rehearsing, workshopping, focus-testing, iterating across the full
  system, not just refining individual pieces. This thread emerges most strongly
  in Chapter 3 (users, PBSI) and deepens through Chapter 5.

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
but you're always free to use whichever helps you most.

**JavaScript only** for now; Python track in development. Skill-level objectives
are identical for both languages. JS is the primary track because it makes the
developer/user split _architecturally visible_: `console.log` lives in devtools
(developer space), `prompt`/`alert`/`confirm` live in browser UI (user space).
That separation is the curriculum's rhetorical model made concrete.

---

## Why Learn to Frogram

_Why learn to code when LLMs write code?_ Because designing computation is not
the same work as writing the notation for it. Both matter. The design work is
harder to delegate. And there are also reasons to program that aren't about
productivity at all.

### What programming languages are

A programming language is a notation system for describing computation to a
machine. It's a compromise between how humans think and how machines work —
easier to learn than directly telling a computer what to do in 1's and 0's, but
much stricter than human language. The machine executes what you write exactly,
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
the outside, how to read code against that model, how to predict execution, how
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
Chapter 3 (users, PBSI, visible behavior) carries particular weight for this
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

**This is the concrete difference between Vibetoading and Frogramming.** A
Vibetoader produces code they can't predict — they iterate on visible behavior
("does the button work?") without a model of what the machine is doing
underneath. A Frogrammer can predict what the machine will do, evaluate whether
the output matches intent, and diagnose divergence when it doesn't. With or
without an LLM, prediction is the skill that separates Frogramming from
Vibetoading. This course builds that skill.

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
visualizing the _internal mechanisms_ of your program's execution, not the final
output.

### Your instrument: JavaScript, and your practice instrument: Just Enough JavaScript

JavaScript has its own notional machine with specific characteristics and
capabilities — scopes, bindings, values, coercion, scope chain lookup, prototype
chain lookup. Chapter 2 studies this machine in depth.

**Just Enough JavaScript (JEJ)** is the deliberately constrained subset we use
for most of the curriculum. "Few options, many possibilities" — depth on a small
surface rather than skimming across a large one. This is a pedagogical
constraint, not a permanent one.

### What this course builds in you — the four threads

Four threads run beneath every chapter, each enabled by the ones before:

1. **Twinning** — accurate mental models of processes outside your mind
2. **Decisions (micro and macro)** — every keyword, name, operator, structure
   (micro) AND every architectural choice, paradigm, program shape (macro). This
   is where your **compositional voice** develops.
3. **Perspective stacking** — holding twinning and decisions across multiple
   simultaneous levels
4. **The whole rhetorical situation** — the entire software context: users,
   developers, computer, product, environment, purpose. Design thinking across
   the whole system.

Plus Study Lenses making the machine's work visible throughout.

### 💭 Snippetry

Chapter 5 introduces **snippetry** — writing small, runnable, self-contained
programs as an ongoing practice. The answer to "why write code when I'm no
longer building full codebases? how do I build and maintain my NM for a
programming language?" Snippetry is how the Frogrammer keeps the NM alive
between full-codebase projects: **complete enough to run** (each snippet
executes top-to-bottom), **small enough to understand** (you can hold the whole
NM in your head at once and predict-trace-verify in full), **connected enough to
inspire** (snippets allude to, vary on, and remix each other — nothing stands
alone). It's also a natural home for deliberate Vibetoading — quick exploratory
sketches where you choose to chase the outcome and skip the machine. Frogramming
for mastery, exploration, aesthetic satisfaction, delight, surprise, discovery,
and the new thoughts code lets you think — alongside or instead of programming
for productivity. "You" is the fifth audience: students program for themselves,
share with peers through a collaborative gist system that extends a living
snippetry corpus, and explore JavaScript's full multi-paradigmatic range with
training wheels off and real browser execution.

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

Throughout this course we'll illustrate these ideas using a consistent metaphor:
**a mechanical instrument, a composer, a virtuoso, a score, and an audience**.
The specific instrument varies across chapters — sometimes a pipe organ,
sometimes a music box, sometimes a beat machine or a player piano — but the
roles stay the same. If the metaphor doesn't click for you, the underlying ideas
above stand on their own.

### The mapping

| Idea                   | Illustration                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| The notional machine   | A **mechanical instrument** — plays the score blindly, deterministically                      |
| Source code            | **The score** — notation the mechanism reads                                                  |
| The designer           | **The composer** — holds computational intent, understands the instrument, knows the audience |
| The implementer        | **The virtuoso** — masters notation and the controls; produces the score from direction       |
| Users                  | **The audience** — concert-goers who react to the performance                                 |
| Other developers       | **Co-composers** — fellow score-readers                                                       |
| The computer executing | **The mechanism playing the score blindly at performance time**                               |

### Why a _mechanical_ instrument specifically

A mechanical instrument plays the score exactly as written — no human in the
execution loop. This cleanly separates two phases: **composition**, where the
composer and virtuoso collaborate iteratively on the score, and **performance**,
where the mechanism plays blindly and deterministically. Matches how JavaScript
execution works: at runtime, there is no performer-with-judgment to rescue a
badly-notated passage.

### Why _varying_ instruments

Different instruments serve different moments, just like different programming
languages. Organs for incrementally-layered visible mechanics; music boxes for
single-note depth (cf. Ligeti's _Musica Ricercata_, which builds entire
movements from one note, then two, then three); beat machines for contemporary
accessibility; gamelan-with-karakuri for non-European automated traditions. The
metaphor is the role structure, not any one instrument.

### Why "virtuoso" specifically

A virtuoso has technical mastery without owning the compositional vision. They
mastered a different skillset from the composer — notation fluency, feel for the
controls, idiom depth. Neither role is a failed version of the other. Composers
can play; they just haven't mastered virtuoso-level motor patterns because
they've mastered different things (theory, audience awareness, stylistic
judgment). This maps cleanly onto the comprehension-before-production stance of
this curriculum: you learn to read, trace, and evaluate code deeply; you write
small programs to verify your understanding; but you don't need to automate
fluent production because the virtuoso handles that.

### Human virtuosos and alien virtuosos

Both are real. Through Chapters 1–3, the virtuoso can often be usefully imagined
as a **human** senior engineer — someone with fluent hands, deep idiom, and
patience for collaborative work. Chapter 4 pivots to the **alien** virtuoso (an
LLM) and develops what makes that collaboration specifically different: the
jagged frontier, the asymmetric duet, the downstream-of-human cognition.

### The cast

- **The Composer** — your avatar when designing. Curious, earnest. Learns to
  hear the music in their head before it plays.
- **The Virtuoso** — human or alien. Dazzling technique, intimate with the
  controls. The alien form sometimes plays what you said rather than what you
  meant. More on that in Chapter 4.
- **The Mechanism** — the mechanical instrument itself. Literal, indifferent,
  stubborn. Plays exactly what's notated and nothing else. When the notation is
  unplayable, it stops — honestly.
- **The Audience** — reactive, emotional, unfiltered. They cheer, boo, throw
  tomatoes or flowers.

You'll meet them again as the curriculum unfolds. Historical cameos — Mozart
writing reluctantly for mechanical organ, Bach studying Buxtehude, Ada Lovelace
on the Analytical Engine — drop in as sidebars.

### The metaphor across chapters

Chapter 2 studies the instrument's mechanism. Chapter 3 brings in the audience
and design thinking. Chapter 4 teaches collaboration with the alien virtuoso.
Chapter 5 turns to the composer's daily practice — snippetry — and hints at
alien composers emerging on the horizon.

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## References

These two resources are always available alongside the curriculum. Neither is a
prerequisite: refer to them when you need them.

### Just Enough JavaScript

A curated subset of JavaScript: just enough to write imperative programs that
interact with users through text and numbers. Within this small surface, entire
domains open up: text processing, geometry, pattern matching, randomness, number
crunching: all within single-page programs where every line is visible at once.
The constraint is pedagogical: fewer features means more cognitive bandwidth for
the concepts that matter. See it as a companion reference, not a prerequisite.

### Studying with LLMs

Guidance and starter prompts for using LLM assistants as _study partners_: not
code generators: while working through earlier chapters. This is distinct from
Chapter 4, which is about agents as named collaborators in the development
process. The distinction matters: using an LLM to quiz yourself on trace tables
is study support; asking an LLM to trace code for you is bypassing the skill
you're trying to build. Available from Chapter 1 onward; revisited with new
depth in Chapter 4.

### Learning Expectations

A reference document for when you're in the middle of something hard and want
context for what you are experiencing. Covers the big picture of spiral
curriculum design, threshold concepts, liminal zone thinking, and the learning
sequence. Not required reading before starting, but available whenever you need
context about your own learning journey.

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## Symbology

A small set of glyphs runs through this syllabus, each tied to a recurring
concept. They appear inline at structural anchors — section headings, bold
labels, table cells, audience lists — wherever the marked concept is the
active subject. This is a **reading aid**, not a memorization task; ignore
any symbol whose meaning isn't yet clear and come back to this key when
needed.

| Symbol | Concept | What it marks |
| --- | --- | --- |
| 🐸 | The course / both hats together | The umbrella. Frog/toad ambiguity is a feature: it carries both hats at once. Appears in the title and stays out of body text. |
| 🔬 | Frogrammer | Development grounded in the notional machine — predict, trace, verify, apply craft practices intentionally. |
| 🎨 | Vibetoader | Development grounded in user-visible behavior — iterate on outcomes, treat the machine underneath as a black box. |
| 🧑 | Human | Used at active Human / AI distinctions. |
| 🤖 | AI / Agent | Used both for "AI" (in the Human/AI distinction) and for "Agent" (the fourth audience). Same thing, two framings. |
| 🧑‍💻 | Developer (audience) | The human who reads and writes code — Chapter 1's audience. |
| 💻 | Computer (audience) | The machine that executes code — Chapter 2's audience. |
| 💭 | Snippetry | Small, runnable, self-contained programs as ongoing practice. The thought-bubble glyph is borrowed from the snippetry source repo. |

**Flagged for later:** the User audience (Chapter 3) and the Notional Machine
itself don't yet have locked symbols. Both will be picked once the rest of
the symbology has been seen in rendered context — context will reveal what
reads cleanly.

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

### 0.1 The Rhetorics of Programming

When you write source code, you are not writing for a single reader. Like a
recital — a performance event with its audience, its performers, its instrument,
and the score — source code addresses multiple readers simultaneously, each with
different needs and different ways of understanding.

Three human audiences read your code:

1. **🧑‍💻 Other developers** — they read your code to understand your intent,
   learn your style, collaborate on changes, and maintain the work long after
   you wrote it
2. **💻 The computer** — it parses, interprets, or compiles your code; it does
   not understand intent, only syntax and semantics
3. **Users of the program** — they never see the code, but they experience its
   effects; their correctness is behavioral (does it do what I need?), not
   syntactic

A fourth audience has recently arrived:

4. **🤖 Agents (LLMs)** — they read and understand code differently from
   humans; they can infer intent from examples, find patterns, suggest changes,
   and help you write it. Writing _for and with_ agents is its own
   communication skill, developed in Chapter 4.

The central skill this course teaches is writing code that **addresses all four
audiences simultaneously**. Different chapters focus on different audiences
(hence the twinning: developer → computer → user → agent), but they all matter
in real work.

---

- 🥚 Articulate the three human audiences of source code: developers, the
  computer, users
- 🥚 Explain what it means for code to _address_ each audience simultaneously
- 🥚 Describe the twinning progression across chapters: developer twin (Ch1) →
  computer twin (Ch2) → user twin (Ch3) → agent twin (Ch4)
- 🥚 Identify agents (LLMs) as a fourth audience: they read and understand code
  differently from humans, and writing _for and with_ agents requires its own
  communication skills (explored in Ch4)
- 🥚 Describe why this course prioritizes comprehension before production
- 🥚 Identify the four threads that run the whole curriculum: twinning,
  decisions (micro and macro), perspective stacking, and the whole rhetorical
  situation
- 🐣 Explain the spiral curriculum: why revisiting concepts at increasing depth
  produces deeper understanding than covering them once

### 0.2 Positioning _Welcome to Frogramming_

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
programs throughout, but to verify understanding, not to demonstrate output.

**Three vocabulary distinctions worth having early:**

| Term                     | What it means                                                                                                                                                                                                                                                          | In WtF                                                                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Programming paradigm** | A design philosophy for organizing programs — how you decompose problems, structure solutions, manage state                                                                                                                                                            | Ch1–4 is imperative: sequences of statements, explicit control flow, mutable state. Functional, OOP, and declarative are deferred to Ch5.                    |
| **Computational domain** | What you are computing _about_ — the thing in the world you are modeling. A programmer who understands medicine writes better medical software; one who understands finance builds better financial tools. Domain expertise is a separate axis from programming skill. | WtF is largely domain-agnostic by design — the same NM skills transfer to any domain.                                                                        |
| **Computational idioms** | Types of operators and operations available within a programming language — how you manipulate values. Different languages emphasize different idioms; mastering an idiom means fluency with a category of operations.                                                 | Ch2's sections (2A–2F) are organized by idiom: logic, strings, numbers, pattern matching, bits, dates. Distinct from computational domains (subject matter). |
| **Model of computation** | A formal mathematical framework defining what computation _is_ — Turing machines, lambda calculus, finite automata                                                                                                                                                     | Largely deferred to WtA and beyond                                                                                                                           |

These three are orthogonal. You can write functional medical software or
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
executes, how values and bindings behave, how control flow works.

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

**Learning objectives for §0.2:**

- 🥚 Use the positioning tables to locate WtF's scope within the broader space
  of programming and computer science
- 🥚 Explain what distinguishes a programming paradigm, a computational domain,
  and a computational idiom, and give examples of each
- 🥚 Understand why WtF constrains itself to Just Enough JavaScript and why
  those constraints are temporary
- 🥚 Recognize that architecture (organizing programs at scale) is a separate
  skill, developed later in Trees and Separation of Concerns
- 🐣 Articulate the differences between the vocabulary triangle terms and
  explain their orthogonality (you can combine any paradigm with any domain)

### 0.3 Two Hats: Vibetoading and Frogramming

A foundational distinction this course returns to throughout: every developer,
in every moment of work, wears one of two hats. Both are real practices, both
have their time, and most people wear both — sometimes within the same hour on
the same project.

**🎨 The Vibetoader** works from user-visible behavior. They iterate on
outcomes: does the button work, does the test pass, does the page render? The
notional machine underneath is a black box. They may use LLMs heavily or not
at all; what defines the hat is that the code itself is incantation — a means
to produce the behavior — rather than a model the developer is reasoning
about.

**🔬 The Frogrammer** works grounded in the notional machine. They predict
what the machine will do before they run anything, evaluate output against
that prediction, and apply craft practices (testing, documentation, code
review, security audits) intentionally — to mitigate specific risks their
NM-awareness makes visible. They may use LLMs heavily or not at all; what
defines the hat is the grounding.

**Spectrum, not binary.** A given developer doesn't _be_ a Vibetoader or a
Frogrammer — they wear different hats on different tasks, files, moments. A
seasoned Frogrammer prototyping a UI tweak Vibetoads on purpose. A junior who
genuinely understands the part of the NM they're touching is Frogramming on that
part. The question is never "which kind of person are you?" — it's "which hat
fits this moment?"

**Why the twinning anchor cuts where it does.** Recall the four audiences from
the threads: developer, computer, user, agent. Vibetoading prioritizes twinning
the _user_ — the experiencer of behavior. Frogramming prioritizes twinning the
_NM_ — the producer of behavior. Notice that the Vibetoader doesn't really twin
the developer-reader either: code is a textual representation of the NM and its
levers, and without NM-awareness there isn't much to read _for_ in the code
itself. The Frogrammer, by contrast, cares deeply about code quality — both
because the code represents the NM they understand, and because well-shaped code
is what lets humans _and_ agents read, review, and extend the work over time (a
point well-developed in agent-collaboration practice — see this org's
`AGENTS.md`, Simon Willison's writing, and the broader engineering literature).

**The cargo-cult test.** Process discipline (TDD, DDD, QA, security review,
docs) doesn't determine which hat you're wearing — _intentionality_ does. When a
Vibetoader does TDD, the tests are ceremonial: written because Process Says So,
not because they target NM-visible risks. When a Frogrammer does TDD, the tests
are intentional: they cover the specific edge cases the NM predicts will be
surprising. Same activity, different ground. A Frogrammer can also skip tests on
a throwaway script and still be Frogramming, because they know what they're
skipping and why.

**Vibetoading predates LLMs.** It's tempting to read the dichotomy as
"vibing-with-LLMs vs. engineering-without". It isn't. Pattern-matching syntax
without understanding the underlying mechanism is older than LLMs by decades —
copy-paste-tweak from Stack Overflow, React hooks rules without understanding
reconciliation, CSS flexbox by trial-and-error, jQuery selectors without a DOM
model, Rails magic accepted as opaque. LLMs amplified the practice; they didn't
invent it.

The four-quadrant grid makes this concrete. Vibetoading vs. Frogramming is a
stance about your relationship to the NM, _orthogonal_ to whether an LLM is in
the loop:

|                                    | **Humans-only**                                                                                                     | **LLM-collab**                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **🎨 Vibetoading** (outcome-grounded) | Cargo-cult coding — copy-paste-tweak, hooks-rules-without-reconciliation, CSS by trial-and-error. _Pre-LLM vibing._ | Karpathy's _vibe coding_ — LLM writes, you don't read; outcomes are the only ground truth.                             |
| **🔬 Frogramming** (NM-grounded)      | Traditional engineering — humans write notation grounded in NM-awareness, applying craft practices intentionally.   | Willison's _vibe engineering_ / _agentic engineering_ — LLM writes the notation; you direct and verify against the NM. |

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
Frogramming; cargo-cult coding is humans-only Vibetoading. The house terms name
the underlying stance; the wider vocabulary names specific working modes within
it.

**Learning objectives for §0.3:**

- 🥚 Distinguish Vibetoading from Frogramming by their grounding (visible
  behavior vs. notional machine)
- 🥚 Place a given workflow on the four-quadrant grid
- 🥚 Recognize that vibing predates LLMs and give one pre-LLM example
- 🐣 Identify when each hat is appropriate for a concrete scenario
- 🐣 Distinguish cargo-cult process (process by ceremony) from intentional craft
  practice (process targeting NM-visible risks)
- 🐣 🎨 Wear the Vibetoader hat intentionally — choose it for the scope where
  it's right
- 🐥 Articulate why this curriculum centers Frogramming while honoring
  Vibetoading

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## Chapter 1: Developers

Language features: comments, `console.log` and the full `console` API with
string literals.

_Metaphor anchor: **the score as inter-composer communication** — other
composers read your score for intent and style, long before (or entirely instead
of) ever hearing it performed. Code has the same property._

A foundational conceptual distinction is introduced here: not as a technical
exercise but as orientation: **source code (static) vs. program execution
(dynamic)**. Comments exist in the static text; logs are observed during
execution. This sets up the developer twin: the developer who reads your code
sees the static text, not the runtime. Understanding this distinction is
prerequisite to understanding why comments and logs serve different purposes.

The computer is not yet a full audience. Devtools console is developer space.

### Comments

- 🥚 Write comments that describe what a program should do and why\
  _builds on: writing prose → writing intentional, purposeful notes inside code_
- 🥚 Identify and apply comment conventions: inline (`//`), block (`/* */`),
  doc-style (`/** */`), `*`-aligned block structure\
  _builds on: reading formatted text → recognizing conventions → applying them_
- 🥚 Understand "why not what": a comment explains the intent behind a line, not
  what the line literally does
- 🥚 **Micro-decisions in comments**: every choice (word selection, length,
  placement, convention) shapes how a comment reads; notice the choices,
  consider their effect on the developer-reader\
  _builds on: writing prose → noticing that every word is a choice with a
  consequence for the reader_
- 🐥 Read and appreciate real comments from real codebases: funny, desperate,
  poetic examples of developer-to-developer communication

### Logs

- 🥚 Source code (static) vs. program execution (dynamic): comments live in the
  static text; logs are observed at runtime\
  _builds on: reading comments as text → understanding that running code
  produces a different, separate experience_
- 🥚 The full `console` API: what each method communicates and when to reach for
  it:
  - **Output by intent**: `console.debug` (trace-level), `console.log`
    (general), `console.info` (informational), `console.warn` (unexpected but
    not broken), `console.error` (broken)
  - **Asserting**: `console.assert(condition, message)` — silent when true, logs
    an error when false
  - **Counting**: `console.count(label)` / `console.countReset(label)` — named
    counter tracking, useful in loops
  - **Grouping**: `console.group(label)` / `console.groupCollapsed(label)` /
    `console.groupEnd()` — collapsible indented output sections
  - **Timing**: `console.time(label)` / `console.timeLog(label)` /
    `console.timeEnd(label)` — named timer trio for rough measurement
  - **Utility**: `console.clear()` — clears all console output
- 🥚 When to use comments vs. logs: comments for reading the code; logs for
  observing it run
- 🥚 **Micro-decisions in logs**: which console method? what message? what data
  included? Why `.info` and not `.log`? Is `.warn` ever appropriate here? Each
  choice communicates different things to the developer watching the console\
  _builds on: micro-decisions in comments → now applied to the runtime channel_
- 🐣 Share code with others _(future feature: save-to-gist, pop-up sandbox)_

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## Chapter 2: Developers and Computers

_Metaphor anchor: **studying the instrument's mechanisms** — like an organ
builder examining bellows, tracker action, registration, and combination action,
you study how the JavaScript engine actually carries out your instructions._

The computer is now a full audience. The primary learning objective is
**JavaScript's notional machine**: the mental model of how the JS engine
executes your code. Other languages have their own notional machines; the
discipline you develop here transfers. Programs produce output via logs and
assertions but do not yet interact with users. `undefined` is encountered
naturally through variables; `null` is held until Chapter 3 where `prompt()` can
return it.

The chapter has two tracks:

- **NM core (2.0–2.8)**: the machine itself: expressions, values, bindings,
  scope chain, prototype chain, coercion, statements, and reading/writing code.
  All required.
- **Computational idioms (2A–2F)**: what you _do_ with the machine: logic and
  truthiness, text processing, number crunching, pattern matching, bit
  manipulation, date computation. **2A (Logic) and 2B (Strings) are required.**
  Choose at least one from 2C–2E. 2F is optional.

### 2.0 The Notional Machine

Every programming language describes a machine. The machine JavaScript describes
has a name: the **notional machine** (NM). You do not program JavaScript — you
program the notional machine _using_ JavaScript.

The NM is best understood as a machine that works through a fixed vocabulary of
**execution events**: observable moments that occur in a specific order as your
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

**The further skill: decoupling syntax from events**

Once you can think in events, a new ability becomes possible: you can specify
_what you want the machine to do_ — describe a desired event sequence — before
choosing the syntax that produces it. You can communicate that specification to
another person, to the tracer, or to an LLM, and then evaluate whether what was
produced actually achieves what you wanted.

This is what "programming the machine directly" means. The syntax is notation
for the machine; the events are what the machine actually speaks.

**Errors**

An error is not a personal failure and it is not the machine breaking. It is a
specific event that fires because the machine encountered a specification it
cannot interpret. The machine is being precisely honest: it found a mismatch
between what was specified and what it can do. Errors are the notional machine's
most useful output.

Learning to read errors as information — rather than experiencing them as
indictments — is a skill this chapter develops alongside everything else.

**The tracer**

Study Lenses' tracer captures the execution event stream: every
behind-the-scenes moment as your code runs, as a structured sequence you can
step through.

Study Lenses' tracer serves two roles:

1. **Training wheels** — while you are building your internal NM model, the
   tracer makes visible what your mental model should eventually produce on its
   own
2. **Power tool** — when code is too complex to trace mentally, the tracer
   extends your working memory, letting you attend to execution you could not
   hold in your head alone

---

### 2.1 Running a Program

- 🥚 Static source code vs. dynamic execution: reading a file vs. running it\
  _builds on: comments as static text → logs as runtime observation →
  distinguishing the two clearly_
- 🥚 **Execution events**: a running program produces an ordered stream of
  observable moments; the tracer captures these automatically; trace tables
  record them by hand\
  _builds on: static/dynamic distinction → now naming the individual moments of
  execution_
- 🥚 Logging string literals to the console from programs that execute
- 🥚 Fix errors: parse errors (creation phase) vs. runtime errors (execution
  phase)\
  _builds on: reading error messages → locating the source line → categorizing
  the failure type_

### 2.2 Expressions and Resolve

- 🥚 Identify an expression as syntax that produces a value: operators,
  literals, identifiers, calls, templates, property access, assignment
- 🥚 Trace how a compound expression evaluates step by step: sub-expressions
  resolve in order, precedence, parentheses
- 🥚 **Resolve**: every expression produces exactly one value; the VM hands this
  value back to the surrounding expression or statement
- 🥚 All operators: arithmetic, comparison, equality, logical, negation,
  `typeof`, grouping, compound assignment (`+=`, `-=`, etc.),
  increment/decrement (`++`, `--`)
- 🥚 **Implicit coercion**: the VM silently transforms types between operands
  and operators (`'5' - 1`, `if ('hello')`); a _behind-the-scenes_ event,
  invisible in the syntax\
  _builds on: knowing individual types → predicting what happens when types mix
  without being explicitly converted_
- 🥚 **Asserting on expressions**: `console.assert(1 + 1 === 2)` as a claim
  about what an expression resolves to; the program verifies the claim\
  _builds on: logging to observe values → now making a predictive claim_
- 🥚 Block scope as a container: empty `{}` blocks; code runs inside a scope;
  scopes can nest
- 🐣 Explicit type conversion vs. implicit coercion: `Number()`, `String()`,
  `Boolean()`, `parseInt`/`parseFloat`: learner-visible syntax vs. VM-invisible
  transformation

### 2.3 Values and Bindings

- 🥚 The binding lifecycle: declare → initialize → available → access / update\
  _builds on: expressions that produce values → now storing and retrieving those
  values in named memory slots_
- 🥚 `let` vs `const`: what each allows and what it communicates to the reader
- 🥚 Variable names as communication choices: naming conventions (camelCase,
  snake*case, CONSTANT_CASE, PascalCase)\
  \_builds on: micro-decisions in comments (Ch1) → the same intentionality now
  applied to names*
- 🥚 Log variable values to the console; observe state change over time\
  _builds on: logging string literals (Ch1) → logging computed values →
  observing state change_
- 🥚 **Trace tables**: systematic notation of execution: declare/initialize/
  access/update events for each binding, in steps-format and values-format\
  _builds on: reading code → logging to observe state → writing down every read
  and write in a table_
- 🥚 **Predictive stepping with a debugger**: predict what happens next → step →
  check → investigate\
  _builds on: trace tables → now stepping one instruction at a time with a tool_
- 🥚 **Scope chain walk**: when an identifier is read, the VM checks the current
  (innermost) scope first, then its parent, up to the global environment; each
  check is a miss (keep looking) or a hit (binding found)\
  _builds on: block scope as container (2.2) → now seeing how the VM navigates
  nested containers to find a name_
- 🥚 Block scope with variables: `let` declared inside `{}` is not accessible
  outside; scope chain walk makes this concrete
- 🥚 **Asserting on bindings**: predict what a binding holds at a specific
  point; write `console.assert` statements that must pass\
  _builds on: asserting on expressions (2.2) → now asserting about stored state_
- 🐣 Write code to satisfy assertions sprinkled through a script\
  _builds on: reading assertions → predicting what code produces → now writing
  the code to make the assertion true_

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

### 2.4 Statements and Control Flow

- 🥚 Conditionals: `if`/`else if`/`else`: reading and tracing branches\
  _builds on: tracing linear programs → now tracing programs where execution
  path depends on values_
- 🥚 Ternary expressions: recognizing as a compact conditional form\
  _builds on: reading if/else → recognizing ternary as equivalent → refactoring
  between them_
- 🥚 While loops, do-while loops, for loops, for-of loops: reading and tracing\
  _builds on: tracing sequential execution → now tracing repeated execution_
- 🥚 `break` and `continue`: recognizing and tracing their effect
- 🐣 Refactoring between equivalent loop forms (while ↔ for, do-while ↔ while)\
  _builds on: tracing loops → seeing structural equivalence → translating one
  form to another_
- 🐣 Block scope inside control flow: variables declared inside `if`/`while`
  bodies; scope chain walk makes the boundary concrete

### 2.6 Prototype Chain

- 🐣 **Auto-boxing**: when a method is called on a primitive, the VM temporarily
  wraps it in its constructor's object form (`'hello'` → `String` wrapper)\
  _builds on: primitive types → now seeing that primitives gain methods through
  a wrapping mechanism_
- 🐣 **Prototype chain lookup**: one-hop lookup for primitives: value →
  `Constructor.prototype` → method found; a _behind-the-scenes_ event parallel
  to scope chain lookup\
  _builds on: scope chain walk (2.3) → now a parallel lookup mechanism for
  methods instead of names_
- 🐣 Reading `str.toUpperCase()` as: look up `toUpperCase` on `String.prototype`
  → call it with `str` as the receiver
- 🐣 String methods are now available: all programs up to this point used only
  operators and literals; methods become available once the lookup mechanism is
  understood
- 🐥 The same mechanism applies to Number methods (`(3.14).toFixed(2)`) and
  RegExp methods (`/pattern/.test(str)`)

### 2.8 Reading, Writing, Reviewing Code

- 🥚 **PBSI Framework**: Purpose, Behavior, Strategy, Implementation: four
  perspectives for reading any program simultaneously\
  _builds on: reading comments → describing what code does → now naming four
  distinct levels of description_
- 🥚 "Why not what" comments applied to programs with logic: explaining strategy
  and behavioral correlations\
  _builds on: "why not what" in Ch1 → now grounded in PBSI vocabulary and
  applied to more complex programs_
- 🥚 **Logging strategies**: structured `console.log` placement: program
  structure, variables, control flow\
  _builds on: logging values (2.3) → now using logs as a deliberate, structured
  debugging strategy_
- 🐣 **Backtracing**: reasoning backwards from output to input\
  _builds on: trace tables (2.3) → predictive stepping (2.3) → now reversing the
  direction of analysis_
- 🐣 **Describing programs**: close reading across all PBSI levels: zooming out
  (purpose/behavior), zooming in (line-by-line), finding connections, labeling
  goals\
  _builds on: trace tables → PBSI framework → now a structured methodology
  combining both_
- 🐣 **Naming variables**: variable analysis → generic role-based names →
  specific domain names → variable roles (fixed value, stepper, flag, gatherer,
  holder, temporary)\
  _builds on: variable names as communication (2.3) → now a structured analysis
  methodology_
- 🥚 **Linting**: recognizing and fixing style issues automatically\
  _builds on: code conventions (Ch1) → now enforced by a tool_
- 🐣 **Refactoring**: changing implementation or strategy without changing
  program output (`console.log` output as the fixed point)\
  _builds on: BSI variations → now a formal discipline: same behavior, different
  code_
- 🐣 **Code review**: structured template: behavior, goals, comments, linting,
  variables\
  _builds on: describing programs → naming variables → now applied as a review
  of someone else's code_
- 🐣 **Comparing programs**: same behavior, different approaches; developing an
  eye for voice and readability tradeoffs\
  _builds on: refactoring → code review → now noticing aesthetic and stylistic
  choices within the language_

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

### Computational Idioms

These branches apply the notional machine through specific computational idioms.
**2A and 2B are required.** Choose at least one from 2C–2E. 2F is optional.

#### 2A: Logic and Truthiness 🥚

Required. Foundation for reading conditional programs and understanding how
values flow through boolean contexts.

- 🥚 Truthiness and falsiness: every value is truthy or falsy; the six falsy
  values (`false`, `0`, `''`, `null`, `undefined`, `NaN`)
- 🥚 Short-circuit evaluation: `&&` stops at first falsy, `||` stops at first
  truthy, `??` stops at first non-nullish; the expression resolves to the
  stopping value, not necessarily a boolean
- 🥚 Logical compound assignment: `&&=`, `||=`, `??=`
- 🐣 Using short-circuit for default values and guard clauses\
  _builds on: if/else (2.4) → recognizing short-circuit as a compact alternative
  for simple conditional assignments_
- 🐣 Refactoring between if/else, ternary, and short-circuit forms\
  _builds on: PBSI refactoring → now applied to conditional expression forms_

#### 2B: Strings 🥚

Required. Needed for Chapter 3 user programs (`prompt`/`alert`/`confirm` work
with strings). Builds directly on the prototype chain understanding from 2.6.

- 🥚 String methods: measuring (`length`), accessing characters (`charAt`, `at`,
  bracket notation), searching (`indexOf`, `includes`, `startsWith`,
  `endsWith`), transforming (`toUpperCase`, `toLowerCase`, `trim`, `padStart`,
  `padEnd`, `repeat`), extracting and replacing (`slice`, `replace`,
  `replaceAll`, `split`)
- 🥚 Template literals: readable alternative to concatenation; expression
  interpolation\
  _builds on: string concatenation → recognizing template literals as a more
  readable alternative → refactoring between them_
- 🥚 `String.fromCharCode` / `String.fromCodePoint`: character encoding; code
  point ↔ character\
  _builds on: string methods → seeing strings as sequences of encoded
  characters_
- 🐣 Optional chaining: `str?.method()` for values that might be null or
  undefined
- 🐣 Text processing programs: searching, transforming, extracting substrings\
  _builds on: string methods → now composing them into full programs_

#### 2C: Numbers and Math 🐣

Choose at least one from 2C–2E.

- 🥚 Math methods and constants: `Math.max`, `Math.min`, `Math.abs`,
  `Math.floor`, `Math.ceil`, `Math.round`, `Math.random`, `Math.pow`,
  `Math.sqrt`, `Math.PI`, `Math.E`
- 🥚 Number helpers: `Number.isNaN`, `Number.isFinite`, `Number.isInteger`,
  `parseInt`, `parseFloat`
- 🥚 Number prototype methods: `toFixed(n)`, `toString(radix)`, `toPrecision`,
  `toExponential`, `toLocaleString`
- 🥚 **Floating point representation**: why `0.1 + 0.2 !== 0.3`; precision
  limits of IEEE 754; when this matters and how to work around it\
  _builds on: arithmetic operators → understanding what the VM actually stores
  for a number literal_
- 🥚 **BigInt**: integers without precision limits: `42n` literal syntax,
  `BigInt()` constructor; `typeof` is `'bigint'`; can't mix with `number` in
  arithmetic; integer division truncates\
  _builds on: floating point limits → BigInt as the solution for exact large
  integer arithmetic_
- 🐣 Geometry and randomness programs
- 🐣 Number crunching programs: accumulation, running totals, summarization

#### 2D: Pattern Matching 🐔

Choose at least one from 2C–2E.

- 🐔 **Regular expressions**: pattern-matching computation: instead of
  procedural string operations, declare the _shape_ of what you're looking for\
  _builds on: string methods (2B) → recognizing that some problems are better
  described as patterns than as sequences of operations_
- 🐔 `/pattern/flags` literals, `.test()`, `.match()`, `.replace()` with regex
- 🐔 **Computational micro-decisions**: regex vs. string methods: the choice is
  not just what works but what _expresses the problem clearly_

#### 2E: Integers and Bits 🐔

Choose at least one from 2C–2E.

- 🐔 **Bitwise operators**: computation at the bit level: numbers as binary
  structures, not decimal values\
  _builds on: arithmetic and numeric types → seeing that numbers have an inner
  structure that can be directly manipulated_
- 🐔 `&`, `|`, `^`, `~`, `<<`, `>>`, `>>>`: what each does at the bit level
- 🐔 BigInt works with bitwise operators: see 2C for the BigInt introduction
- 🐔 **Computational micro-decisions**: bitwise vs. arithmetic: the choice
  expresses the problem's structure

#### 2F: Dates 🐔

Optional extra.

- 🐔 `Date.now()`: current timestamp as a number (milliseconds since epoch)
- 🐔 `new Date()`: the sole `new` exception in JEJ; creates a date object whose
  methods all return primitives
- 🐔 `Date.parse(str)`: parsing a date string to a timestamp
- 🐔 Date instance methods: `getFullYear()`, `getMonth()` (0-indexed),
  `getDate()`, `getHours()`, `getMinutes()`, `getSeconds()`,
  `toLocaleDateString()`, `toLocaleTimeString()`, `toISOString()`
- 🐔 Date computation programs: elapsed time, formatting, internationalization\
  _builds on: numbers and arithmetic → now applied to time as a domain_

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## Chapter 3: Developers, Computers, and Users

_Metaphor anchor: **writing for an audience, the composer's design thinking** —
the concert audience is real: they cheer, boo, throw tomatoes or flowers. The
composer rehearses with the mechanism, workshops with virtuosos, and
focus-groups with listeners. Design thinking across the whole situation._

Language features: `prompt`, `alert`, `confirm`. All control flow features
(`if`, `while`, `break`/`continue`) were introduced in Chapter 2 and are now
applied in programs where user interactions are the fixed behavioral anchors.

All Chapter 2 skills: PBSI, naming variables, logging strategies, backtracing,
refactoring, code review: are practiced here under a new constraint:
user-visible behavior must be preserved.

### 3.1 User Input and Output

- 🥚 `prompt`, `alert`, `confirm`: user-facing I/O; devtools console is
  developer space, these are user space\
  _builds on: console.log for developers → now alert/prompt for users; the
  rhetorical split becomes architecturally visible_
- 🥚 Top-level doc comments: program name, purpose, and behavior\
  _builds on: writing "why" comments → now structuring them as a full program
  description for a reader_
- 🥚 Writing simple programs that process user input or perform string/number
  operations on it
- 🥚 `null`: what `prompt()` returns when the user cancels; the first encounter
  with null in a meaningful context

### 3.2 Variable Program Behaviors

- 🥚 Input/output pairs as test cases in the top-level doc comment\
  _builds on: asserting about state (2.3) → now specifying expected outputs for
  given inputs → documenting them_
- 🥚 Test coverage: are all conditional paths covered by your test cases?
- 🐣 **Fixing bugs**: code runs without error but produces wrong user-facing
  behavior\
  _builds on: fixing parse/runtime errors (2.1) → now the program runs but fails
  user expectations_
- 🐣 **Modifying programs**: one change at a time, predict, run, note the
  result; user interactions as fixed points\
  _builds on: refactoring in Ch2 (console.log as fixed point) → now user-visible
  behavior is the anchor_

### 3.3 Validating User Input

- 🥚 **Program structure pattern**: input + validation (while loop) → logic
  (conditional) → output\
  _builds on: reading programs as flat sequences → recognizing distinct
  structural phases_
- 🥚 Getting numbers from users: cast to number, validate the cast, validate the
  range
- 🥚 Full user-story-based top-level comments\
  _builds on: top-level doc comments (3.1) → now structured as a user story with
  personas and scenarios_

### 3.4 PBSI in User Programs

- 🥚 BSI variations in user programs: same user-facing behavior, different
  strategies and implementations\
  _builds on: PBSI introduced in Ch2 → now applied to programs with a user
  dimension_
- 🥚 Input validation strategies and their tradeoffs: all-in-while-head, boolean
  flag, do-while
- 🐣 **Describing user programs**: PBSI close reading where Purpose is now "why
  this exists for a user"\
  _builds on: describing programs in Ch2 (developer-facing output) → now the
  user's experience is part of the analysis_

### 3.5 Developing Programs

- 🐣 **Refactoring user programs**: changing code without changing user-visible
  behavior\
  _builds on: refactoring in Ch2 (console.log fixed point) → user interactions
  now the fixed point_
- 🐥 **Writing programs from spec**: graduated scaffolding: stepped examples →
  starter code → spec + goals → spec only\
  _builds on: modifying programs → refactoring → code review → now producing
  programs independently_
- 🐔 **Reverse engineering**: describe behavior → plan goals/strategy → write
  code from an obfuscated program
- 🐔 Writing programs from unstructured guidance (plain English, word problems,
  your own ideas)

### 3.6 Plaintext Programs

_The IDE disappears. A plain text editor and a run button: nothing else. No
lenses, no syntax highlighting, no autocomplete, no error highlighting._

- 🐣 Reading and understanding programs without IDE assistance\
  _builds on: all prior reading skills → now stripped of tooling that has been
  scaffolding comprehension_
- 🐣 Writing syntactically correct code without autocomplete or error
  highlighting\
  _builds on: all prior writing skills → now relying on internalized knowledge
  rather than tool feedback_
- 🐥 Appreciating concretely what IDE tools do: by experiencing their absence,
  you understand what each tool was compensating for\
  _builds on: using IDE tools throughout Ch1–3 → now understanding them as
  scaffolding, not crutches_

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## Chapter 4: Developers, Computers, Users, and Agents

_Metaphor anchor: **the composer-virtuoso asymmetric duet** — with an alien
virtuoso this time. Dazzling, fast, pattern-rich, but cognitively distinct from
human virtuosos. Collaboration is specifically different, and this chapter digs
into why._

No new language features. This chapter applies all Chapter 1–3 skills in
collaboration with an LLM. 🤖 Agents are a fourth audience: they read and
understand code differently from 🧑 humans, and writing _for and with_ them
requires its own communication skills.

### 4.0 What is an LLM?

- 🥚 Explain why an LLM is not a database or keyword-lookup system
- 🥚 Describe what "predicting the next token" means in practical terms
- 🥚 Explain why the same prompt can produce different outputs (stochasticity)
- 🐣 Describe at least 2 key differences between LLM "cognition" and human
  reasoning
- 🐣 Identify when an LLM is likely to be unreliable (the jagged frontier)
- 🐥 Use the 4 Levels of Abstraction framework to discuss AI at the appropriate
  level
- 🐥 Explain the Gell-Mann Amnesia effect in the context of LLM output

### 4.1 Collaborating in Prose

- 🥚 Given an LLM response, hypothesize what patterns it might be matching
- 🥚 Write clear, specific prompts that provide necessary context
- 🐣 Ask the same question multiple ways and observe how outputs vary
- 🐣 When a response isn't useful, identify what to change and observe the
  effect
- 🐣 Predict how changes to a prompt will affect LLM output, and test the
  prediction\
  _builds on: predictive stepping (2.2) → now applied to prompts instead of
  programs_
- 🐥 Explain why an LLM produced incorrect or unexpected output
- 🐥 Reflect on when it helped to let the LLM lead vs. when you needed to drive

### 4.2 Agents and Developer Communication

_Revisits Chapter 1: comments, variable names: with an LLM collaborator._

- 🥚 Read LLM-generated comments and evaluate whether they are helpful for
  developers
- 🥚 Read LLM-suggested variable names and evaluate whether they follow naming
  conventions
- 🐣 **Perspective-Take**: hypothesize what training patterns produced a
  specific comment or name
- 🐣 **Articulate**: write prompts that give the LLM enough context to generate
  useful developer-facing output
- 🐣 Draft structured comments for programs that don't exist yet, using the LLM
  as a thinking partner
- 🐥 **Calibrate**: where is the LLM reliable at developer-facing output? Where
  does it fail?
- 🐥 **Delegate**: is this a task where the LLM adds value, or does using it
  undermine your learning?
- 🐔 SOLO check-in: are you building structure (learning conventions) or
  substituting the LLM for understanding?

### 4.3 Agents and Computer Communication

_Revisits Chapter 2: tracing, asserting: with an LLM collaborator._

- 🥚 Trace LLM-generated code using predictive stepping and trace tables (Ch2
  skills applied to unfamiliar code)
- 🐣 Have the LLM trace code, then evaluate whether its traces correctly track
  state
- 🐣 Have the LLM explain code, then describe whether the explanation matches a
  PBSI analysis
- 🐣 **Perspective-Take**: LLMs often produce plausible-looking but wrong traces
  : identify why
- 🐥 **Calibrate**: LLMs are better at generating code than tracing it: use this
  asymmetry deliberately
- 🐥 Evaluate LLM-generated traces for correctness
- 🐥 **Delegate**: when should you trace yourself vs. ask the LLM to trace?
- 🐔 SOLO check-in: tracing is a foundation-building skill: skipping it removes
  your ability to evaluate LLM output

### 4.4 Agents and User Communication

_Revisits Chapter 3: user programs: with an LLM collaborator._

- 🥚 Read LLM-generated programs and identify what they do (using Ch1–3 skills)
- 🐣 Apply full PBSI evaluation to LLM-generated programs
- 🐣 Code review LLM-generated code using the established code review framework
- 🐣 Design test cases for LLM-generated programs
- 🐣 Describe gaps between your intent and LLM output using PBSI vocabulary
- 🐥 Debug LLM-generated code: detect bugs, identify root causes, fix them
- 🐥 Full documentation generation and review: interact with LLMs around the
  full doc comment structure
- 🐥 **Iterate**: full collaboration loop: prompt → evaluate → refine → repeat
- 🐔 SOLO check-in (threshold moment): all collaboration approaches are now
  available: choose based on your learning position

### 4.5 Looking Back, Looking Forward

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

- 🐣 Given scenarios, identify which collaboration approach you'd use and why
- 🐣 Articulate programming concepts precisely enough for an LLM to act on them
- 🐥 Choose an appropriate collaboration approach based on your learning goals
  (SOLO framework)
- 🐥 Apply perspective-taking to evaluate LLM output in unfamiliar domains
- 🐔 Delegate effectively: identify which parts of a task benefit from LLM
  assistance vs. which undermine learning
- 🐔 Compare LLM "theory of mind" to human theory of mind: what transfers, what
  doesn't
- 🐔 Recognize the emergence of **agentic AI systems** (LLMs doing design work,
  not just notation) as a more complex development than the authoring-partner
  frame covers, and flag it as territory for post-curriculum learning

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

### 🎨 4.6 Vibetoading

- 🐣 Decompose a complex request into smaller, verifiable steps (by contrast
  with unguided Vibetoading)
- 🐣 🎨 Wear the Vibetoader hat intentionally — choose it for the scope where
  it's right
- 🐥 Evaluate code you didn't write or review during generation (PBSI autopsy)
- 🐥 Identify where the jagged frontier manifested in a concrete collaboration
- 🐔 Reflect on the difference between "it runs" and "I understand it"

[TOP](#welcome-to-programming-coded-for-humans--syllabus)

---

## Chapter 5: Developers, Computers, Users, Agents, and You

_Metaphor anchor: **the composer's daily practice** — small, complete pieces
written for the composer's own practice. Variations on a theme, études on a
single technique, sketchbook entries exploring an idea — Ligeti's Musica
Ricercata, Beethoven's sketchbooks, Bach's inventions. A serious genre in its
own right._

**In development.** Full chapter content is still being designed. The framing
below is the intended shape.

### 💭 Overview

Chapter 5 introduces **snippetry** as an ongoing practice — writing small,
runnable, self-contained programs for their own sake. It answers a central
question of the curriculum:

> Why write code when LLMs can write the notation? And how do I keep my
> Frogramming sharp — particularly my NM-fluency in a language — when
> full-codebase work no longer provides the daily reps?

Snippetry is the answer: small programs that exercise whole-program design at
small scale while drilling an isolated concern — a language feature, a paradigm,
an algorithm, the feel of a new notional machine, a user-experience miniature,
or just for fun. Snippetry is also where deliberate Vibetoading lives in this
course: low-stakes, outcome-only sketches you write because that hat fits the
moment.

The practice balances **broad exploration** and **productive constraint**.
Students develop their own sense of which balance serves their learning and
their voice. There's no rigid split between types of snippet; the practice is
about finding the balance that works for you right now, and letting it change as
you grow.

**"You" is the fifth audience.** Students have been programming for developers,
the computer, users, and agents. Now they program for themselves — to learn,
practice, think, stretch, explore, express, delight, and discover. "You" is both
singular (your own practice) and plural (sharing with and remixing from peers
through the collaborative gist system).

> The best authors and the best JavaScript developers are those who obsess about
> language, who explore and experiment with language every day and in doing so
> develop their own style, their own idioms, and their own expression.
>
> — [Angus Croll](https://anguscroll.com/),
> [If Hemingway Wrote JavaScript](https://anguscroll.com/hemingway/)

### The Notional Machine and Programming Paradigms

**JavaScript is multi-paradigmatic.** Chapters 1–4 taught imperative
programming. Chapter 5 is where students discover that the same language
supports fundamentally different ways of thinking about computation: functional,
object-oriented, declarative. Paradigm exploration is a core activity, not a
sidebar.

Once you understand programs as event streams, the paradigm distinctions become
grounded in the same vocabulary. All paradigms run on a machine that produces
execution events. What differs is the _relationship_ the programmer has to that
event stream — how explicitly and in what terms the event sequence is specified:

| Paradigm                                             | Relationship to the execution event stream                                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Imperative** (JS Ch1–4)                            | Explicit event sequence — every step specified. JS's actual NM vocabulary.                                                                        |
| **OOP in JS** (Ch5)                                  | Syntactic organization on top of the same machine — method calls = prototype chain walk + function call events. A style, not a different machine. |
| **OOP in purpose-built languages** (Java, Smalltalk) | Genuinely different NMs — message-send events, virtual dispatch. Different event vocabulary.                                                      |
| **Functional in JS** (Ch5)                           | Compose transformations; the same machine generates events from function application. Same machine, different organization.                       |
| **Declarative** (regex, SQL)                         | Specify the goal; delegate event generation. Maximum decoupling from the event sequence.                                                          |
| **Event-driven** (JS Ch5 event loop)                 | External events — clicks, timers — enter the stream as first-class participants.                                                                  |

Imperative programming — what you will learn in Chapters 1–4 — is explicit about
the event sequence: every step is specified, every event directed. Other
paradigms have different relationships to that stream. You will explore them in
Chapter 5.

**Looking further: Welcome to Algorithms**

The execution event vocabulary you build in Ch2 is one conceptual bridge from
embodied computing to CS. Welcome to Algorithms' step-counting and Big O
analysis require the same cognitive habit — counting discrete operations —
though the abstraction differs: execution events are implementation-level;
algorithmic steps are defined relative to input size and are intentionally
implementation-agnostic. The machine you learn here makes that work tractable
and visible.

### The training-wheels-off commitment

Chapter 5 is where students **graduate from the scaffolded curriculum
environment** into real browser execution with real consequences.

**What comes off:**

- **JEJ language-feature constraint** — students can use any and all JS language
  features. Newly available: user-defined functions, closures, arrays, objects,
  the event loop, classes, `async`/`await`, generators, `fetch`, `Promise`,
  `Symbol`, `Proxy`, ES modules, DOM manipulation, Canvas, and everything else
- **The web worker sandbox** — code runs directly in the browser (iframe). If
  your program freezes, the page freezes. Real consequences, real environment.
  Optional configurable loop guards are available but not enforced
- **Enforced formatting** — format your code however you prefer
- **Study Lenses NM visualizations** — the curriculum's tracer-based NM
  visualizations are no longer the primary tool

**What replaces it:**

- **Full browser devtools debugging toolkit** — line breakpoints, conditional
  breakpoints, logpoints, `debugger` statements, step over/into/out, scope
  panel, watch expressions, call stack, pause on exceptions, DOM breakpoints,
  event listener breakpoints, console in paused context. Students learn all of
  it.
- **External NM visualization tools** — open-in buttons for specialized tools
  (loupe for event loop, promisees for Promises, etc.) with different notional
  machine perspectives. Training wheels come off, but power tools are available
- **Four sandbox modes** offering different constraints and affordances:
  - **Script without HTML** — pure computation, closest to Chs 1–4
  - **Module without HTML** — introduces ES module semantics
  - **HTML file with a script tag** — DOM available, split view of code and
    rendered page
  - **HTML file with a module tag** — DOM + ES modules

  Students learn to distinguish "pure" scripts (computation only) from scripts
  embedded in a full page, and choose the mode that fits their snippet's needs.

### The collaborative gist system

Students can save snippets as gists, browse gists saved by other learners, and
remix them. This makes Chapter 5 collaborative across all learners: your
practice is your own, but it's enriched by what others are exploring. The remix
workflow — take someone else's snippet, change its intent, make it yours — is a
core snippetry activity.

### Learning objectives

#### 5A. Training-Wheels-Off: Carrying Predictive Mastery

- 🥚 Trace code with the full browser devtools debugging toolkit: breakpoints,
  conditional breakpoints, logpoints, `debugger` statements, step over/into/out,
  scope panel, watch expressions, call stack, pause on exceptions, DOM
  breakpoints (HTML modes), event listener breakpoints. Predict each step before
  stepping
- 🥚 Predict a program's complete behavior (output, final binding states, error
  or no error) without stepping, then verify with a single run. The debugger is
  scaffold; prediction without it is the graduation
- 🐣 Use the devtools toolkit to isolate a bug: combine debugging features
  strategically (conditional breakpoints, watch expressions, pause on
  exceptions, logpoints) and describe divergence using NM vocabulary
- 🐣 Choose and use external NM visualization tools (loupe, promisees, etc.) for
  specific NM concepts; explain the tool choice and what it revealed

#### 5B. Extending the NM: New JS Territory

- 🥚 Extend your NM to a JS feature outside JEJ (your choice: functions, arrays,
  objects, classes, async/await, generators, etc.). Read documentation, form a
  prediction, write a snippet, verify, update your model
- 🐣 Explore "the weird parts": find edge cases and surprising JS behaviors,
  predict, verify, explain using NM concepts why the behavior occurs
- 🐥 Extend your NM to a second unfamiliar feature; reflect on whether the
  learning process was easier the second time and why
- 🐔 Explore "historic" vs. "modern" JS: write the same thing using a historic
  idiom and its modern equivalent, trace both, describe the NM differences

#### 5C. Programming Paradigms

- 🥚 Name the major programming paradigms JS supports (imperative, functional,
  object-oriented, declarative) and identify which paradigm a given snippet uses
- 🐣 Solve the same problem in two different paradigms; trace both and describe
  how the NM behaves differently
- 🐣 Implement the same paradigm with different features (e.g., functional style
  with loops+variables vs. array methods; OOP with prototypes vs. classes)
- 🐥 Translate a snippet between paradigms: preserve behavior, articulate what
  changed at Strategy/Implementation (PBSI) and what stayed at Purpose/Behavior

#### 💭 5D. Snippetry as Practice

- 🥚 Write a snippet under a productive constraint (a single feature in 3 ways,
  a specific error on purpose, one loop + zero conditionals, etc.)
- 🥚 Read and trace a snippet from the corpus or a peer's gist that uses
  unfamiliar JS; apply PBSI analysis
- 🐣 Write a variation on an existing snippet: same purpose, different strategy;
  articulate what changed and why
- 🐣 Remix a peer's snippet: change its intent, not just implementation; make it
  yours

#### 5E. You as Audience

- 🥚 Make yourself laugh: write a snippet whose output, structure, or concept
  genuinely amuses you — not funny variable names, the humor lives in what the
  program does
- 🐣 Surprise yourself: write a snippet where you don't fully know what will
  happen; describe what surprised you
- 🐣 Discover something unexpected: encounter a behavior you didn't predict,
  investigate it, explain it
- 🐥 Impress yourself: write a snippet that does something you didn't think you
  could do a month ago

#### 5F. Compositional Voice and Micro-Decisions

- 🥚 Identify at least 5 micro-decisions in a snippet and describe what each
  communicates; name alternatives and how they'd change the voice
- 🐣 Write the same program two ways that reveal different voices: same
  behavior, different micro-decisions (the cat-detector corpus is a model)
- 🐥 After writing 5+ snippets, identify your own recurring patterns with
  specific examples

#### 5G. Self-Directed Learning

- 🥚 Choose your sandbox mode deliberately: explain the constraints and
  affordances of each mode for a given snippet idea
- 🐥 Design your own snippet prompt targeting a specific NM concept; interesting
  enough that a peer would want to try it

#### 5H. The Whole Rhetorical Situation

- 🐣 Write a snippet for a specific audience beyond yourself; save as a gist
- 🐥 Conduct a full self-review of one of your own snippets: PBSI,
  micro-decisions, NM trace, voice reflection

#### 5I. Capstone Reflections

- 🐔 Articulate why Frogramming-for-its-own-sake remains valuable in an
  LLM-assisted world — your answer, grounded in your experience
- 🐔 Recognize that **agentic AI systems** (LLMs doing design work, not just
  notation) are arriving; identify a concrete example and reflect on what it
  means for the design-vs-notation split

[TOP](#welcome-to-programming-coded-for-humans--syllabus)
