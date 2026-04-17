---
sidebar_position: 1
---

# Welcome to Programming: Syllabus

> The best authors and the best JavaScript developers are those who obsess about
> language, who explore and experiment with language every day and in doing so
> develop their own style, their own idioms, and their own expression.
>
> — [Angus Croll](https://anguscroll.com/),
> [If Hemingway Wrote JavaScript](https://anguscroll.com/hemingway/)

**Programming is collaborative communication.** A single piece of source code
simultaneously addresses multiple audiences: other developers who read it, a
computer that executes it, users who experience it, and agents who collaborate
on it. This course guides you from your first comment to fluent collaboration
with AI agents, using the smallest possible set of language features. It is
self-study: no time estimates, no deadlines. Go at your own pace.

**What you're actually learning.** Every programming language has a _notional
machine_ — an imaginary model of how the computer carries out your instructions.
Programming is building and directing that machine through notation. The
difference between programming and vibecoding is prediction: a programmer can
predict what the machine will do when their code runs; a vibecoder can't. This
course builds predictive mastery of JavaScript's notional machine — the kind of
understanding that lets you direct the machine precisely, whether you write the
notation yourself or an LLM writes it for you.

**How do you build this predictive mastery? Four threads** run beneath the
curriculum, progressively layering as the chapters advance:

- **Twinning** (baseline): building an accurate mental model of a process
  outside your own mind. Each chapter asks you to twin a different process: the
  _developer_ who reads your code (Ch1), the _computer_ that executes it (Ch2),
  the _user_ who experiences it (Ch3), the _agent_ you collaborate with (Ch4).
  You can't communicate well with something you don't understand.

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

## Why Learn to Program

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
But great programming isn't only about productivity. Design judgment, context
awareness, aesthetic and ethical taste aren't where LLMs excel. And Chapter 5
develops the case for programming-for-its-own-sake — the practice of keeping
your own programming skills sharp when you're no longer building full codebases.

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

**This is the concrete difference between vibecoding and programming.** A
vibecoder produces code they can't predict — they iterate on visible behavior
("does the button work?") without a model of what the machine is doing
underneath. A programmer can predict what the machine will do, evaluate whether
the output matches intent, and diagnose divergence when it doesn't. With or
without an LLM, prediction is the skill that separates programming from vibing.
This course builds that skill.

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

### Snippetry

Chapter 5 introduces **snippetry** — writing small, runnable, self-contained
programs as an ongoing practice. The answer to "what do I do as a programmer
when I'm no longer building full codebases?" Programming for mastery,
exploration, aesthetic satisfaction, and the new thoughts programming lets you
think — alongside or instead of programming for productivity.

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

---

## Before You Begin

- [ ] Read the course expectations: understand the comprehension-first approach
      before starting
- [ ] Skim the exercise types guide: you don't need to understand everything
      yet, just orient yourself
- [ ] Skim the Just Enough JavaScript reference: same, just get a feel for the
      terrain
- [ ] _(coming soon)_ Download the curriculum for offline study

---

## Chapter 0: What is Programming?

No language features. Conceptual orientation only.

_Metaphor anchor: **the recital as rhetorical situation** — an entire
performance event with its audience, its performers, its instrument, and the
score that ties them together._

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

- 🥚 Name the components of the JEJ notional machine: values, bindings, scopes,
  expressions, statements, resolve, coercion, errors, scope chain lookup,
  prototype chain lookup
- 🥚 Distinguish the two viewing levels: _visual-syntax_ (expressions and
  statements: what you write) and _behind-the-scenes_ (values, bindings, scopes,
  coercion: what the VM does invisibly)
- 🥚 Explain what "twinning the computer" means: building an accurate internal
  model of what the VM does when it runs your code
- 🥚 Recognize that source code is static; execution produces a dynamic stream
  of **runtime events**: observable moments the VM produces as code runs

### 2.1 Running a Program

- 🥚 Static source code vs. dynamic execution: reading a file vs. running it\
  _builds on: comments as static text → logs as runtime observation →
  distinguishing the two clearly_
- 🥚 **Runtime events**: a running program produces an ordered stream of
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

---

## Computational Idioms

These branches apply the notional machine to specific computational domains.
**2A and 2B are required.** Choose at least one from 2C–2E. 2F is optional.

### 2A: Logic and Truthiness 🥚

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

### 2B: Strings 🥚

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

### 2C: Numbers and Math 🐣

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

### 2D: Pattern Matching 🐔

Choose at least one from 2C–2E.

- 🐔 **Regular expressions**: pattern-matching computation: instead of
  procedural string operations, declare the _shape_ of what you're looking for\
  _builds on: string methods (2B) → recognizing that some problems are better
  described as patterns than as sequences of operations_
- 🐔 `/pattern/flags` literals, `.test()`, `.match()`, `.replace()` with regex
- 🐔 **Computational micro-decisions**: regex vs. string methods: the choice is
  not just what works but what _expresses the problem clearly_

### 2E: Integers and Bits 🐔

Choose at least one from 2C–2E.

- 🐔 **Bitwise operators**: computation at the bit level: numbers as binary
  structures, not decimal values\
  _builds on: arithmetic and numeric types → seeing that numbers have an inner
  structure that can be directly manipulated_
- 🐔 `&`, `|`, `^`, `~`, `<<`, `>>`, `>>>`: what each does at the bit level
- 🐔 BigInt works with bitwise operators: see 2C for the BigInt introduction
- 🐔 **Computational micro-decisions**: bitwise vs. arithmetic: the choice
  expresses the problem's structure

### 2F: Dates 🐔

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

---

## Chapter 4: Developers, Computers, Users, and Agents

_Metaphor anchor: **the composer-virtuoso asymmetric duet** — with an alien
virtuoso this time. Dazzling, fast, pattern-rich, but cognitively distinct from
human virtuosos. Collaboration is specifically different, and this chapter digs
into why._

No new language features. This chapter applies all Chapter 1–3 skills in
collaboration with an LLM. Agents are a fourth audience: they read and
understand code differently from humans, and writing _for and with_ them
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

Up to this point the virtuoso has done the notation work — the writing of the
score — while you have done the composing. That's the authoring-partner frame,
and it's the right one for finding your bearings. But it's a simplification of a
moving target.

**Alien composers** are emerging: agentic systems that don't just write notation
but do design work too — planning, decomposing problems, making architectural
choices, calling tools, modifying state autonomously. That's a more complex
collaboration than the one this chapter covered. It doesn't replace the
composer's role so much as shift what the human composer attends to — from
writing the score to specifying observable outcomes that humans can still
evaluate, directing a system that does more than transcribe. Flag this as
territory for post-curriculum learning; _Welcome to Algorithms_ picks it up.
Chapter 5 will return briefly to it in its closing moments.

- 🐣 Given scenarios, identify which collaboration approach you'd use and why
- 🐣 Articulate programming concepts precisely enough for an LLM to act on them
- 🐥 Choose an appropriate collaboration approach based on your learning goals
  (SOLO framework)
- 🐥 Apply perspective-taking to evaluate LLM output in unfamiliar domains
- 🐔 Delegate effectively: identify which parts of a task benefit from LLM
  assistance vs. which undermine learning
- 🐔 Compare LLM "theory of mind" to human theory of mind: what transfers, what
  doesn't
- 🐔 Recognize the emergence of **alien composers** (agentic systems doing
  design work, not just notation) as a more complex development than the
  alien-virtuoso frame covers, and flag it as territory for post-curriculum
  learning

### 4.6 Vibecoding

- 🐣 Decompose a complex request into smaller, verifiable steps (by contrast
  with unguided vibe-coding)
- 🐥 Evaluate code you didn't write or review during generation (PBSI autopsy)
- 🐥 Identify where the jagged frontier manifested in a concrete collaboration
- 🐔 Reflect on the difference between "it runs" and "I understand it"

---

## Chapter 5: Developers, Computers, Users, Agents, and You

_Metaphor anchor: **the composer's daily practice** — small, complete pieces
written for the composer's own practice. Variations on a theme, études on a
single technique, sketchbook entries exploring an idea — Ligeti's Musica
Ricercata, Beethoven's sketchbooks, Bach's inventions. A serious genre in its
own right._

**In development.** Full chapter content is still being designed. The framing
below is the intended shape.

### Overview

Chapter 5 introduces **snippetry** as an ongoing practice — writing small,
runnable, self-contained programs for their own sake. It answers a central
question of the curriculum:

> How do I maintain and grow my skills when I no longer need to write code to
> build software?

Snippetry is the answer: keep your own skills sharp through small programs that
exercise whole-program design at small scale while drilling an isolated concern
— a language feature, a paradigm, an algorithm, the feel of a new notional
machine, a user-experience miniature, or just for fun.

The practice balances **broad exploration** and **productive constraint**.
Students develop their own sense of which balance serves their learning and
their voice. There's no rigid split between types of snippet; the practice is
about finding the balance that works for you right now, and letting it change
as you grow.

**"You" is the fifth audience.** Students have been programming for developers,
the computer, users, and agents. Now they program for themselves — to learn,
practice, think, stretch, explore, express, delight, and discover. "You" is
both singular (your own practice) and plural (sharing with and remixing from
peers through the collaborative gist system).

**JavaScript is multi-paradigmatic.** Chapters 1–4 taught imperative
programming. Chapter 5 is where students discover that the same language
supports fundamentally different ways of thinking about computation:
functional, object-oriented, declarative. Paradigm exploration is a core
activity, not a sidebar.

### The training-wheels-off commitment

Chapter 5 is where students **graduate from the scaffolded curriculum
environment** into real browser execution with real consequences.

**What comes off:**

- **JEJ language-feature constraint** — students can use any and all JS
  language features. Newly available: user-defined functions, closures, arrays,
  objects, the event loop, classes, `async`/`await`, generators, `fetch`,
  `Promise`, `Symbol`, `Proxy`, ES modules, DOM manipulation, Canvas, and
  everything else
- **The web worker sandbox** — code runs directly in the browser (iframe).
  If your program freezes, the page freezes. Real consequences, real
  environment. Optional configurable loop guards are available but not
  enforced
- **Enforced formatting** — format your code however you prefer
- **Study Lenses NM visualizations** — the curriculum's tracer-based NM
  visualizations are no longer the primary tool

**What replaces it:**

- **Full browser devtools debugging toolkit** — line breakpoints, conditional
  breakpoints, logpoints, `debugger` statements, step over/into/out, scope
  panel, watch expressions, call stack, pause on exceptions, DOM breakpoints,
  event listener breakpoints, console in paused context. Students learn all
  of it.
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

Students can save snippets as gists, browse gists saved by other learners,
and remix them. This makes Chapter 5 collaborative across all learners: your
practice is your own, but it's enriched by what others are exploring. The
remix workflow — take someone else's snippet, change its intent, make it
yours — is a core snippetry activity.

### Learning objectives

#### 5A. Training-Wheels-Off: Carrying Predictive Mastery

- 🥚 Trace code with the full browser devtools debugging toolkit: breakpoints,
  conditional breakpoints, logpoints, `debugger` statements, step
  over/into/out, scope panel, watch expressions, call stack, pause on
  exceptions, DOM breakpoints (HTML modes), event listener breakpoints.
  Predict each step before stepping
- 🥚 Predict a program's complete behavior (output, final binding states,
  error or no error) without stepping, then verify with a single run. The
  debugger is scaffold; prediction without it is the graduation
- 🐣 Use the devtools toolkit to isolate a bug: combine debugging features
  strategically (conditional breakpoints, watch expressions, pause on
  exceptions, logpoints) and describe divergence using NM vocabulary
- 🐣 Choose and use external NM visualization tools (loupe, promisees, etc.)
  for specific NM concepts; explain the tool choice and what it revealed

#### 5B. Extending the NM: New JS Territory

- 🥚 Extend your NM to a JS feature outside JEJ (your choice: functions,
  arrays, objects, classes, async/await, generators, etc.). Read
  documentation, form a prediction, write a snippet, verify, update your
  model
- 🐣 Explore "the weird parts": find edge cases and surprising JS behaviors,
  predict, verify, explain using NM concepts why the behavior occurs
- 🐥 Extend your NM to a second unfamiliar feature; reflect on whether the
  learning process was easier the second time and why
- 🐔 Explore "historic" vs. "modern" JS: write the same thing using a
  historic idiom and its modern equivalent, trace both, describe the NM
  differences

#### 5C. Programming Paradigms

- 🥚 Name the major programming paradigms JS supports (imperative, functional,
  object-oriented, declarative) and identify which paradigm a given snippet
  uses
- 🐣 Solve the same problem in two different paradigms; trace both and
  describe how the NM behaves differently
- 🐣 Implement the same paradigm with different features (e.g., functional
  style with loops+variables vs. array methods; OOP with prototypes vs.
  classes)
- 🐥 Translate a snippet between paradigms: preserve behavior, articulate
  what changed at Strategy/Implementation (PBSI) and what stayed at
  Purpose/Behavior

#### 5D. Snippetry as Practice

- 🥚 Write a snippet under a productive constraint (a single feature in 3
  ways, a specific error on purpose, one loop + zero conditionals, etc.)
- 🥚 Read and trace a snippet from the corpus or a peer's gist that uses
  unfamiliar JS; apply PBSI analysis
- 🐣 Write a variation on an existing snippet: same purpose, different
  strategy; articulate what changed and why
- 🐣 Remix a peer's snippet: change its intent, not just implementation; make
  it yours

#### 5E. You as Audience

- 🥚 Make yourself laugh: write a snippet whose output, structure, or concept
  genuinely amuses you — not funny variable names, the humor lives in what
  the program does
- 🐣 Surprise yourself: write a snippet where you don't fully know what will
  happen; describe what surprised you
- 🐣 Discover something unexpected: encounter a behavior you didn't predict,
  investigate it, explain it
- 🐥 Impress yourself: write a snippet that does something you didn't think
  you could do a month ago

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
- 🐥 Design your own snippet prompt targeting a specific NM concept;
  interesting enough that a peer would want to try it

#### 5H. The Whole Rhetorical Situation

- 🐣 Write a snippet for a specific audience beyond yourself; save as a gist
- 🐥 Conduct a full self-review of one of your own snippets: PBSI,
  micro-decisions, NM trace, voice reflection

#### 5I. Capstone Reflections

- 🐔 Articulate why programming-for-its-own-sake remains valuable in an
  LLM-assisted world — your answer, grounded in your experience
- 🐔 Recognize that **alien composers** (agentic systems doing design work,
  not just notation) are arriving; identify a concrete example and reflect on
  what it means for the composer/virtuoso distinction
