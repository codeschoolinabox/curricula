# The theory behind the course

> **What this directory is.** An argument about what a data thought is, why it
> cannot be separated from the notation it is thought in, and what that commits
> a curriculum to.
>
> **Audience.** Author-facing. Nothing here is written to be read by a student.
> The learner-facing form of this argument belongs in the course's own opening
> chapter, drafted there and not here.
>
> **On the sibling courses.** They are named where this course's boundaries meet
> them, because a boundary you cannot name is not a boundary. What is not
> borrowed is their vocabulary for carving up their own domains — this course is
> their prerequisite, and a prerequisite that needs its dependants' distinctions
> to state its own subject is circular.

## The claim

> **Which data thoughts you can have depends on the notation you think them
> in.**

And a second claim, separate and defeasible rather than part of the first:

> **The loop that checks a thought — predict, observe or derive, find the
> divergence, revise — is the same loop whatever notation the thought is in.**

The second could be false. What would refute it: a notation whose checking step
is not any of those four, or one where the loop runs but the divergence it finds
is not about the thought. Both are live, and § What checks a thought is where
they are put at risk.

**Because the thoughts are notation-relative, a course has to teach at least two
notations against one machine.** With a single notation, a thought and its
expression cannot be told apart — every difference a learner meets is
attributable to the task, the machine and the notation at once. Holding the
machine fixed and varying the notation is the only arrangement in which the
notation's own contribution becomes visible. Where that is exactly available and
where it is only a metaphor is drawn in [machines.svg](./machines.svg) and
stated in § One machine, actually.

**Because the checking loop is claimed invariant, it is the thing that
transfers.** Not the thoughts, and not fluency in any notation.

## The subject: a data thought, and three kinds

**A data thought is a falsifiable thought about data** — falsifiable in a
specific sense: something can be run, or derived, or measured, to show it wrong.

The kinds are kinds of **question** you can ask about data, not kinds of thing:

| Kind           | Asks                                   | Examples                                                      |
| -------------- | -------------------------------------- | ------------------------------------------------------------- |
| **shape**      | what is this?                          | `Array<number>`, a grammar production, a foreign key          |
| **relational** | how do these stand to one another?     | `start <= end`, `f(n) = f(n-1) + f(n-2)`, `T(n) = O(n log n)` |
| **procedural** | what happens to it, and in what order? | `x = x + 1`, a for-loop                                       |

**Relational means the kind mathematics describes** — equations, inequalities,
recurrences, invariants, bounds. Not any structure that happens to relate two
things.

**The notation does not decide the kind, and a foreign key is the case that
proves it.** A foreign key is a data shape that encodes a relationship between
data; it is still a shape. A schema can equally carry a relational thought —
`start <= end` written into a record is an inequality, and inequalities are
relational wherever they are written. Sorting thoughts by the notation they
arrive in is the mistake this table exists to prevent, and it is a blurry
boundary rather than a sharp one: databases can be treated mathematically, and
that does not make a schema a mathematical notation.

**Data is the subject, not a fourth kind.** The directory's name reads as
`data — shapes, processes, relationships`.

**The distinction is about what a notation _is_, not what it is _about_.**
Mathematics describes processes constantly — differential equations, dynamical
systems, the lambda calculus — but represents them as relationships.

> The order-committing / order-free contrast is the operational–denotational
> distinction in programming-language semantics. Named as an orientation for a
> reader who knows the field; **this campaign has not read the primary
> literature** and nothing rests on it.

## What checks a thought

Drawn in [kinds.svg](./kinds.svg).

**Two names for each of the two checks, used interchangeably throughout.** The
inner one is **internal validity**, also called **well-formedness**; the outer
one is **external validity**, also called **correspondence**. The plain-language
pair is the one to reach for with learners; the technical pair is what makes the
distinction searchable in the literature. Neither is primary.

**The internal check — well-formedness — differs by kind.** A parser for a
shape, an interpreter for a procedure, a derivation for a relation. These are
the checks a notation can perform on itself, and they are the ones everybody
reaches for first.

**The reality check — correspondence — is one boundary, and every kind has to
cross it.** But none of them crosses it the same way:

| Kind           | At the reality check, it asks                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **shape**      | does it actually measure or describe something about the world — and is that correspondence framed correctly?           |
| **relational** | does the formula let you predict or understand something in the observable world?                                       |
| **procedural** | does the model behave like the world closely enough to predict with — and / or does the output have a use in the world? |

**The test for whether a check is the reality check: can it be run without
leaving the notation?** If it can, it is the internal one. Schema validation,
did-it-run, is-the-derivation-sound — all internal, all easy to mistake for the
other thing.

**And the two are not checked in the order people expect.** A mathematical
statement about an algorithm has to be right _about_ that algorithm before its
proof is worth anything, and that is established by analysing the algorithm, not
by deriving anything. Proving things about the wrong model is invisible from
inside the proof.

**Pseudocode has neither check**, and that is the case against teaching it
first. Its semantics is supplied by the reader, so a reader with a strong model
silently repairs ambiguities rather than surfacing them. It has the surface of
code and none of the answering-back.

## The three seams

The course's work stops in three places, and **the three are not the same kind
of boundary**.

| Seam                                        | What is beyond it                                                               | Hands off to                          |
| ------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------- |
| **the notional machine**                    | the physical computational artifact — matter, power, a user who wants something | _Frogramming & Vibetoading_           |
| **the formal study of computation**         | complexity, correctness, the classification of problems                         | _Welcome to Algorithms_               |
| **the shape crossing of the reality check** | whether the data was ever about anything                                        | _Collaborative Data Science Projects_ |

The first two are edges of a plane — they bound _where work happens_, drawn in
[work-plane.svg](./work-plane.svg). The third is a crossing of the reality-check
ring — it bounds _what a thought answers to_. **They do not live in the same
figure**, and trying to put them there is what made earlier drafts undercount
their own boundaries.

Naming the seams matters more than it looks. A window that denied what lies
outside it would be an account of notations that notate nothing. **The physical
artifact is used as substrate and not studied as object**, which is the whole
load the first seam carries.

## One machine, actually

Drawn in [machines.svg](./machines.svg).

**Every notation has its own notional machine, and the differences are the
point.** Machine code is read against an instruction pointer, memory cells and
registers; C against a call stack, a heap, pointers into both, and undefined
behaviour where the model runs out; JavaScript against scopes, closures, a
binding lifecycle and coercion; a regular expression against a position in a
string, alternatives and backtracking.

These are **not one machine seen at four levels of detail**. A notional machine
in teaching exists to let a learner describe, predict and design computations
_for that language_. Flattening them toward a von Neumann machine until they all
look alike removes exactly the thing each one is for.

**So "hold the machine fixed" has a scope.** It is exact for two grammatical
subsets of one language over one engine — expression-oriented and
statement-oriented JavaScript, same notional machine, same events, two
notations. Across the top of that figure you are comparing machines. Only in the
band are you comparing notations.

## The two spaces

The theory needs **two figures**, because a notation is a different kind of
object in each.

- **[thought-space.svg](./thought-space.svg)** — what can be said. Notations are
  **regions**; data thoughts are **points**. A thought inside two regions is one
  both notations can carry; a thought in a crescent is one only one can. **The
  exercise set comes from here**, and so does the central lesson: a learner who
  never leaves the overlap concludes that notation is a skin over the thought.
- **[work-plane.svg](./work-plane.svg)** — where this course works. Notations
  are **points**; the seams are **edges**. **The course's scope comes from
  here.**

Every earlier figure that undercounted its seams or over-claimed its correctives
was one picture trying to answer both questions.

## The anchor

```js
x = x + 1;
```

A contradiction as mathematics. Routine as code. One line, and it is already the
confusion every teacher of both subjects has watched happen.

**The obvious reading of it is wrong, and the correction is better.** The
obvious reading says learners arrive holding a relational `=` that programming
violates. Mathematics-education research reports otherwise: students
overwhelmingly read `=` operationally — _do something, write the answer_ — with
no programming anywhere in sight, and the relational reading is a taught
achievement rather than a starting condition.

So the lesson is not _code violates your mathematical intuition_. It is **code
matches your default, and mathematics is the one asking for something harder.**

> **Not read at the primary source.** The `=` finding is reported here from
> secondary description. It must be read before it reaches learner-facing copy.

## The vocabulary

Used in one sense throughout. Where a word means something else in a
neighbouring field or a sibling course, that is said.

**data** — what data thoughts are about.

**computational artifact** — a system, physical or conceptual, whose states
change over time.

**computation** — rule-governed transformation of medium-independent state.
_Medium-independent_ means the rule is indifferent to what the states are made
of — voltages, ink, beads, neurons — and cares only about their structure.
Deliberately non-semantic: nothing here represents anything yet.

> **Not read at the primary source.** This is the mechanistic account of
> physical computation and is transported from an earlier draft that carried an
> unfetched citation. Do not attribute it until it has been read.

**a data thought** — a falsifiable thought about data, where falsifiable means
something can be run, derived or measured to show it wrong. Comes in three
kinds: shape, relational, procedural.

**notation** — a symbolic representation of a data thought. The category
includes programming languages, but also flowcharts, state diagrams,
mathematical notation, schemas, a regular expression on a whiteboard, and a
knitting pattern.

**notional machine** — a model of a machine, pitched at a chosen level of
abstraction and detail, that a notation is read against. **The choosing is part
of the definition**, and so is the specificity: a notional machine earns its
keep by letting you predict what _that_ language will do.

**engine** — the thing that actually runs. A notional machine is a model and
cannot be run; an engine or interpreter can, and that is what makes a procedural
thought checkable.

**the checking loop** — predict, observe or derive, find the divergence, revise.
Named as a procedure; the claim that it does not vary with notation is stated
separately, in § The claim, so that it can be false.

**internal validity**, also **well-formedness** — whether a thought is right by
its notation's own rules. **external validity**, also **correspondence** —
whether it is right about the world. The two names in each pair are
interchangeable here and both are used; the reality check is the boundary
between them.

### What these words mean downstream

| Term                                                                  | Here                                                      | Elsewhere                                                                                                                                                                                                   |
| --------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **notional machine**                                                  | an authored model, read against                           | in the sibling courses, the learner's own mental model of how a machine behaves                                                                                                                             |
| **the checking loop**                                                 | a named four-step procedure                               | close to what _twinning_ names in the sibling courses                                                                                                                                                       |
| **procedural**                                                        | one of three kinds of question about data                 | near, but not identical to, _imperative_ in a paradigm taxonomy                                                                                                                                             |
| **medium-independent**                                                | a property of computational rules                         | also used of computational _thinking_ — a claim this course denies                                                                                                                                          |
| **internal / external validity** (= well-formedness / correspondence) | correctness by a notation's rules, versus about the world | **in education and social-science research, something else entirely** — soundness of a causal inference within a study, versus whether it generalises; the second name in each pair carries no such freight |

The last two are the ones to watch. The position that computational thinking is
itself medium-independent — a way humans think, separable from any notation — is
the strongest standing objection to this course's central claim, and this
directory owes it an argument rather than a silence. And the validity collision
lands in the very field the `=` finding comes from.

> **Not read at the primary source.** Neither the medium-independence literature
> nor the transfer literature has been read for this campaign.

## The figures

|                                          | Answers                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| [kinds.svg](./kinds.svg)                 | the three kinds, their internal checks, and the one reality check they all cross |
| [thought-space.svg](./thought-space.svg) | what can be said, and where the lessons are                                      |
| [work-plane.svg](./work-plane.svg)       | where this course works, and where it stops                                      |
| [machines.svg](./machines.svg)           | why each notation needs its own machine, and where holding one fixed is exact    |

## Reading order

Written in dependency order. The four below are not yet written.

|     | Document        | What it argues                                                              |
| --- | --------------- | --------------------------------------------------------------------------- |
| 1   | `thesis.md`     | the three kinds, and what makes them three rather than one                  |
| 2   | `the-window.md` | why the three seams are three different kinds of boundary                   |
| 3   | `notations.md`  | two notations, one machine — the experiment, run rather than described      |
| 4   | `checking.md`   | internal and external validity, and what happens when they are run together |

The twins, which model the people this material meets:

- [learner.md](./learner.md) — what a learner arrives holding, and which wrong
  models will hold up for a while
- [teacher.md](./teacher.md) — what a teacher arrives holding, where a session
  stalls, and what to distrust

## How to check this directory

- **Cold-read the argument with no curriculum context.** Does it carry?
- **The two-notation exercise, run by someone who has not read this.** If
  holding the machine fixed does not make the notation's contribution visible,
  the central claim is not demonstrable.
- **Every citation traced to a source actually read.** Audit by finding every
  claim that names a literature and checking it carries the marker.
- **The falsifiability test on the vocabulary.** For each term, produce a
  sentence using it that is wrong. A term that cannot be used wrongly is not
  doing work — and a claim that cannot be stated wrongly is not a claim.
- **Swap the senses.** Anywhere two senses of a word are live, swap them. Any
  sentence that still reads fine was not anchored.
- **Check every figure against the prose that cites it, in the same pass.** The
  set this one replaces drifted because a figure was rebuilt and the prose was
  left behind, until one row disagreed across four documents.
