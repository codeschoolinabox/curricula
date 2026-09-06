# Observability — the second condition, and what it decides

> Author-facing design memo. Part of the `computational-thinking/` set; start at
> [README.md](./README.md).

The original formulation asked that a correspondence be "observed and
manipulated." Those are two different requirements, and separating them is what
lets each do its own job.

**Predictive usefulness** — L1's condition (c) — is what makes a computation
model something at all, and it is what answers the triviality objection.
**Legibility** — this document's subject, L2 — is whether the correspondence can
be observed and manipulated with the instruments at hand. That is what makes it
_teachable_, and it is what the course is built around.

## Why they had to be separated

Observability cannot carry the metaphysical job, and the reason is worth being
clear about because the mistake is natural.

Putnam's construction and Searle's wall argument establish that some mapping
exists between any open physical system and any automaton. Adding "…and it must
be observable" removes none of those mappings. It filters which ones we happen
to _notice_, and so indexes the answer to an observer and their instruments —
which is a concession to Searle's observer-relativity, not a reply to Putnam.

Predictive usefulness does remove them, because Putnam's mappings predict
nothing: they are fitted to one run that already happened. That argument is made
at L1 in [thesis.md](./thesis.md) and is not repeated here.

What is left for observability is the question this document is about, and it is
not a lesser one. It decides what a course can actually work at.

> Owed: Putnam (1988); Searle (1992). Neither fetched. Do not cite without
> reading.

## The instrument-relativity is the point, not a problem

Legibility is relative to available instruments. That consequence is owned, not
reluctantly accepted, and it is the reason this course has not been taught yet:

> Without observability and prediction-based quizzing, the level of twinning the
> course targets cannot be taught, so learners cannot reach the deeper questions
> of computation.

And the contrast that makes it concrete:

> Without Study Lenses, as most courses do, you focus on the code as text,
> program output, or visible behaviour — and imprecise, unverifiable analogies
> of what happens in the middle.

That is a claim about **what can be taught**, and it is why legibility is a
separate node. Stated as a claim about what _exists_, it would be a reductio: a
program would not model anything before a tool was built and would start to once
one afterward. Stated as a claim about access, it is just true, and it is the
infrastructure bet the whole curriculum rests on.

## The criterion

**A system is workable in a course exactly where the correspondence is
observable and manipulable with the instruments the learner has.**

Not "where it is simple enough." Not "where it is advanced." Applied to
`ontology.md` §9's seven analytical lenses, this turns an editorial scope
decision into a consequence:

| Lens                       | Status               | Why, under legibility                               |
| -------------------------- | -------------------- | --------------------------------------------------- |
| 1 Platonic                 | deferred             | no manipulable correspondence available to anyone   |
| 2 Physics / material       | deferred             | not reachable from a browser                        |
| 3 Computing infrastructure | deferred             | reachable in principle; no instrument built         |
| 4 Artifact-logic           | **anchor (F)**       | full observability — Study Lenses builds it         |
| 5 Artifact-surface         | **anchor (V)**       | directly observable, directly manipulable           |
| 6 Interaction dynamics     | practiced, partially | the user's internal states are inferred, not read   |
| 7 Systemic impacts         | reach, not practice  | neither observable nor manipulable at learner scale |

Two results worth naming.

**Lens 3 is deferred contingently, not permanently.** Nothing about the event
loop, the network, or garbage collection is intrinsically unteachable. It is
deferred because no instrument makes those correspondences manipulable in this
setting. Build one and the lens opens — which is what the roadmap's Trees → DOM
→ event-dispatch thread is already gesturing at.

**Lens 7 is not computational thinking**, by the thesis's own definition. The
work done there — accountability questions, the three senses of access, who
bears the consequences — is rhetorical and ethical reasoning _that computational
thinking informs_. That is not a demotion; it is a description, and it is
symmetric: lens 7 fails legibility for the same reason lenses 1–3 do, with no
special pleading in either direction.

## Instruments, and the same design move twice

An **observability prosthesis** is a built instrument that makes an otherwise
inaccessible correspondence observable and manipulable. The course has two, and
they are the same move at different lenses:

| Lens                   | Prosthesis              | What it makes observable                                    |
| ---------------------- | ----------------------- | ----------------------------------------------------------- |
| 4 artifact-logic       | Study Lenses · `embody` | evaluation events, binding lifecycle, scope walks, coercion |
| 6 interaction dynamics | the Ch2 simulated user  | a user's responses, on demand, repeatably                   |

`ontology.md:1428` currently classifies the Ch2 local-LLM as "Role-1-flavored
practice apparatus, with its fallibility ceiling." Read as a prosthesis, that
fallibility ceiling stops being an isolated caveat and becomes a measurable
property of the instrument: _which correspondences can this prosthesis falsify,
and which can it only appear to?_ That is a better question, and it is
teachable.

The criterion also holds one course further out. Welcome to Algorithms takes
algorithms as its target, and the **Counting lens** — select regions of code,
see how many times they execute and what values pass through — is what makes an
abstract target's states inferable from the artifact's intermediary states. Same
criterion, different lens, different prosthesis. That it holds across both
courses is the main reason to believe it is a criterion rather than a
rationalisation.

## The deliberate crack

The criterion is worded generally — _the instruments at hand_ — and not tuned to
Study Lenses, on purpose. It leaves room for cases where observation is itself
the difficulty rather than a matter of tooling. Quantum computation is the
obvious one: measurement disturbs the state, so the correspondence resists
observation for reasons that are not engineering.

Those cases are L4 asides, not curriculum. But a criterion that could not
accommodate them would be a criterion about Study Lenses wearing a general
disguise.

## The criteria are learner-facing instruments

Predictive usefulness and legibility are not definitional hygiene. The course
uses them as grounding for identifying and exploring more exotic forms of
computation — learners apply them to candidate systems and decide cases.

That sets a higher bar than surviving review. A criterion is good enough for a
paper if it is defensible; it is good enough here only if a learner can pick up
an unfamiliar system and reach a defensible verdict with it. Worked cases belong
in the curriculum, but the criteria have to be written to be _used_, not merely
to be right.

## Related

- [thesis.md](./thesis.md) — where the L1 conditions and L2 sit in the DAG
- [meaning.md](./meaning.md) — why the observer cannot be smuggled into L1
- [half-beat.md](./half-beat.md) — legibility turned into an assessable exercise
