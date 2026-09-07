# The teacher twin

> **What this document is.** A model of the person running this material — what
> they arrive believing, which of those beliefs will hold up long enough to be
> taught to someone else, where a session stalls, and how long any of it takes.
>
> It is a twin of the **teacher**, not of the learner seen from the front of the
> room. The stalls in § Where it stalls are derived from the teacher model
> below, not from [learner.md](./learner.md); read them against it.
>
> **Nothing here has been taught.** Rather than hedge the whole document, the
> places where the author does not believe his own design are marked **⚠ doubt**
> at the point they occur. The clock in § The shape of a session is written
> rather than withheld, because pacing is the thing most worth being wrong about
> on paper first.

## What they arrive with

Two populations will teach this, and they arrive holding opposite halves of it.

### From programming

**One notation, fluently.** This is the same prior the learner has, except
career-deep, and it is worse for being invisible. A teacher who has written one
language for years has no felt experience of the notation contributing anything,
because they have never been without it.

**"Syntax is the easy part; the logic is what's hard."** This is the belief that
notation is a skin over the thought, in professional dress, and it is nearly
universal among experienced programmers. **A teacher holding it will teach it**
— not as a statement, but by choosing exercises where both notations work, which
is exactly the choice that hides the course's subject. ⚠ doubt: I do not know
how to dislodge this in a teacher without running the same divergence exercise
on them first, and I do not know whether that is insulting or welcome.

**Checking means running.** A programming teacher has thousands of hours of
internal-validity checking and, typically, no explicit practice at the external
kind. They will model "it ran, it's right" without meaning to.

**Pseudocode as a received on-ramp.** Widely taught, rarely examined. A teacher
who reaches for it will be reaching for the one notation with neither
corrective.

### From mathematics

**Proof as _the_ corrective.** Not one of two. The idea that a mathematical
statement about an algorithm needs empirical validation of its representation
_before_ the proof is worth anything reads as a category error to someone whose
training says derivation is what makes things certain.

**The relational `=` as achieved.** Having taught it, they may not remember it
being hard, and will underestimate how much of the class does not have it —
which is the exact prior [learner.md](./learner.md) says is most consequential.

**"Programming is applied mathematics."** This collapses the distinction the
course exists to make. It is not wrong so much as it is the conclusion the
course wants a learner to earn, arriving before the work that earns it.

### Both

**The fluency trap, teacher-side.** A teacher can deliver an articulate,
correct-sounding account of how notations afford different thoughts, having
never once hit a case where a notation failed them. The account is easy; the
experience is not. **A teacher who has not been surprised by this material
cannot tell which exercises produce surprise**, and will select for clarity
instead — which selects against the lesson.

**"I already know what a data thought is."** Everyone teaching this does, and
the definitions here will read as pedantry until the first time two of them
disagree about a case.

| The model they hold                        | Where it holds                                           | Where it breaks                                                        |
| ------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| syntax is the easy part                    | every exercise both notations can express                | the first thought one notation cannot hold                             |
| checking means it ran without error        | all internal-validity work, which is most of programming | the first program that is right by its rules and wrong about its data  |
| proof settles it                           | all of mathematics that is about mathematics             | any statement about an algorithm, where the representation comes first |
| pseudocode is a gentle start               | as a note between people who share a model               | with anyone who does not have the model yet                            |
| I can explain the difference, so I have it | any conversation                                         | selecting an exercise that has to produce a divergence                 |

## The shape of a session

The order is not the intuitive one, and three of the four moves are
counter-intuitive enough that a teacher will drift off them under pressure.

**Do not start with the notation.** The instinct is to introduce a notation,
then the thoughts it expresses. That order teaches the notation and leaves the
thought invisible, because with one notation there is nothing the thought can be
distinguished from.

**Start with a prediction that can be wrong.** The learner needs something that
can contradict them before they need anything to say. This is not a warm-up; it
is the only part of the session that cannot be replaced by reading.

**Introduce the second notation before the first is comfortable.** If the first
becomes fluent first, the second reads as translation, and the thought stays
fused to the first. Two notations that are both slightly uncomfortable are two
notations a learner can compare. ⚠ doubt: this is the move I am least sure of.
It trades cognitive load for the lesson, and the load is real. It may simply be
too much at once for a first session, in which case the fork moves later and the
first session is one notation with a machine.

**Bring the divergence; do not wait for it.** The case where one notation cannot
hold a thought is the lesson, and it will not arise by accident in exercises
chosen for gentleness.

### The clock

For a first ninety-minute session. **These numbers are invented** — no session
has been run — and they are written down so that the first real one can correct
them rather than start from nothing.

| Time      | What happens                                                              |
| --------- | ------------------------------------------------------------------------- |
| 0:00–0:10 | one prediction, made in writing, about something that then runs           |
| 0:10–0:30 | first notation: predict, run, find where the prediction was off           |
| 0:30–0:40 | the same thought, stated in the second notation, against the same machine |
| 0:40–0:55 | predict and check in the second notation                                  |
| 0:55–1:15 | the divergence: a thought one of the two cannot hold                      |
| 1:15–1:30 | name what happened; the two columns of checking, briefly                  |

⚠ doubt, in order of how much I distrust them:

- **0:55–1:15 is the whole course and it gets twenty minutes.** If the
  divergence does not land, nothing else in the session mattered. It may need
  its own session, with the first ninety minutes as setup.
- **0:30–0:40 assumes the second notation can be introduced in ten minutes.**
  That is only plausible if it is genuinely small. If the second notation needs
  teaching in its own right, this shape collapses.
- **0:00–0:10 assumes a machine is already in front of them.** Any setup cost
  lands here and there is no slack for it.
- **1:15–1:30 is where the two-column checking distinction gets named.** It may
  be far too early — it is the most abstract thing in the session arriving when
  attention is lowest.

## Where it stalls

Derived from the teacher model above: each row is a stall a teacher's own prior
makes likely, not only one the learner brings.

| The stall                                      | What it looks like                                    | What is actually happening                                                                                         |
| ---------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| exercises where both notations work fine       | a smooth, well-received session with no lesson in it  | the teacher's "syntax is the easy part" prior selecting the examples                                               |
| "these are the same thing written differently" | confident, articulate, arriving early                 | nobody in the room has met a thought one notation cannot hold — including, often, the teacher                      |
| silence at the relational notation             | learners stop predicting                              | they are looking for the _when_ and there is not one; the corrective changed and nobody said so                    |
| the program runs, everyone moves on            | correct output, unexamined claim                      | internal validity was checked and external validity was not — the teacher's own default                            |
| "so which one is better"                       | a request to be told which to prefer                  | a real question with a real answer — _for which thought_ — that gets deflected because it sounds like a preference |
| fluent write-ups arriving fast                 | good prose about notation differences, no worked case | the cheapest output in the course; ask for the run, not the paragraph                                              |
| "programming is just applied maths"            | offered as a synthesis, usually by the teacher        | the conclusion arriving before the work that earns it                                                              |

## What you have to supply that the text does not

- **A machine, running, that a learner can be wrong about.** Infrastructure, not
  framing. No amount of good exposition substitutes.
- **The divergence case, chosen in advance, per exercise.** If you do not have
  one, that exercise is teaching notation, not computational thinking.
- **Permission for the relational notation to be harder.** Learners expect "no
  _when_" to mean "easier" and read their own difficulty as failure. It is not
  easier.
- **Your own account of a time a notation failed you.** If you do not have one,
  that is the thing to go and get before teaching this.

## Owed

- Every number in § The clock wants a real session. Mark each row confirmed,
  refuted or untested after the first one.
- The two-population split is asserted from experience of the field, not from
  any survey of who actually teaches foundational courses. It may be the wrong
  cut.
