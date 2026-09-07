# The learner twin

> **What this document is.** A model of the learner who meets this material:
> which models they arrive holding, which ones they will form, and which of the
> wrong ones will produce right-looking answers long enough to become
> load-bearing.
>
> **No cohort has met this material.** Rather than hedge the whole document, the
> places where the author does not believe his own model are marked **⚠ doubt**
> at the point they occur. The tables carry a where-it-holds and a
> where-it-breaks column so that contact with a real learner can settle each row
> rather than the document as a whole.

## What they arrive with

**An operational `=`.** This is the single most consequential prior and it is
not a programming misconception — mathematics-education research reports it in
students who have never programmed. `=` means _do something, write the answer_.
The relational reading — _these two things are the same thing_ — is a taught
achievement, and many learners have not had it taught.

The consequence runs opposite to the intuitive one. `x = x + 1` will not read as
a violation. It will read as **normal**, and the mathematical `=` is what feels
strange when the two are put side by side. A course that opens by promising to
resolve the learner's discomfort at `x = x + 1` is addressing a discomfort most
of them do not have.

⚠ doubt: this is reported from secondary description of the literature, not read
at the primary source, and the whole opening of the course is designed around
it. If the finding does not hold for this population, the anchor still works but
its framing inverts back.

**A single notation, if any.** A learner who has programmed has almost certainly
programmed in one language and has no reason to believe the notation contributed
anything. Everything they know about computation and everything they know about
that language arrived fused.

**No reason to think "notation" is a category.** They have met programming
languages. Flowcharts, schemas and mathematical notation are, to them, different
subjects — not siblings of one thing.

**Checking means running.** If they have programmed at all, every check they
have ever made was an internal-validity check. The idea that a program can be
impeccable by its own rules and wrong about everything it was written for is
available to them as a sentence and not as an experience.

## What they will form, and where it will hold

The pattern is the same in every row: a model that is wrong, produces correct
answers across the whole range the learner is currently working in, and fails
only later — by which time it is holding other things up.

| The model they form                                 | Where it holds                                      | Where it breaks                                                              |
| --------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| a name is a box holding a value                     | every single-value, non-aliased program for weeks   | two names for one thing; wherever identity and value come apart              |
| `=` means _becomes_                                 | all of the procedural notation                      | the first relational notation, where it silently means something else        |
| a notation is a skin over the thought               | any thought both notations can hold                 | the first thought one of them cannot express                                 |
| the notional machine is _the_ way the machine works | the whole of one machine                            | the moment a second machine is offered for the same notation                 |
| checking means it ran without an error              | every program wrong in a way the machine cannot see | the first external-validity failure — right output, wrong claim              |
| "no _when_" means simpler                           | small examples                                      | any relational notation that is harder, not easier, than its procedural twin |
| the notation decides the kind                       | every example met so far                            | a schema carrying `start <= end`, which is relational wherever it is written |

**The one that will do the most damage is the third.** _A notation is a skin
over the thought_ is the exact belief this course exists to break. It is
comfortable, it is what anyone concludes from two notations that happen to be
similar, and it survives every example where both notations work. It can only be
broken by a case where one notation cannot hold the thought at all — which is
why the two-notation exercise has to be chosen for a thought that **breaks**,
not for one that transfers cleanly.

⚠ doubt: the last row is new and I am least confident in it. It follows from the
three-kinds table rather than from anything observed. An earlier draft had a
different row here — that a learner would fuse shape and relational — built on
an example that turned out to be miscategorised. The hazard that survives is the
one above: sorting thoughts by the notation they arrive in.

## The failure mode this subject invites

**Fluency without a found divergence.** This material is unusually easy to write
convincingly about. A learner — or a language model helping one — can produce a
correct, well-organised, entirely unearned account of how two notations afford
different thoughts, without ever having hit a case where one of them failed
them.

That output is indistinguishable from understanding at the surface, and it is
the cheapest thing to produce in the whole course.

**What follows for assessment is a design ruling, not a property of the
learner**, and it belongs in `checking.md` rather than here. Stated once so it
is not lost: an account is the wrong artifact to collect; an exhibited
divergence is the right one.

## What is genuinely hard here, as opposed to merely new

- **Holding two notations against one machine without collapsing them.** The
  strong pull is to decide one is "really" the other with extra steps. Both
  directions of that collapse are wrong and both feel like insight.
- **Believing a thought can fail to be expressible.** Nothing in ordinary
  language use prepares anyone for this. Natural language paraphrases anything,
  badly, and never announces that it could not.
- **Separating "the machine did what I said" from "I said what I meant."** These
  arrive fused, and the machine only ever reports on the first.
- **Accepting that proof is not the end of the story.** For a learner who
  reaches the relational notation, the idea that a proof can be impeccable and
  about the wrong model is a second, harder version of the same separation.

## Owed

- Every row above wants a real learner. Mark each confirmed, refuted or untested
  after the first cohort.
- The `=` finding needs reading at the primary source before it reaches
  learner-facing copy — see the doubt marker above.
- This model assumes a learner with some programming exposure and little
  mathematical notation. The reverse population — comfortable with relational
  notations, new to process ones — is not modelled here and would invert several
  rows.
