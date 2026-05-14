# Welcome to Frogramming — The Manifesto

> The _vision_ of computing and computing education that this curriculum
> stands on. Computing as embodied, rhetorical, and humanly authored;
> programming education as cultivation of intellectual agency over the
> machine and the world it shapes.
>
> Companions (siblings, by co-location):
>
> - `syllabus.md` — the high-level orientation and reading map
> - `syllabus.ontology.md` — the _what_ (reference framework, the concepts)
> - `syllabus.pedagogy.md` — the _how it's taught_ (design principles)
> - `syllabus.chapters.md` — the chapters in detail
> - `syllabus.narrative.md` — the journey learners go on
> - `syllabus.metaphor.md` — composer/virtuoso/mechanism teaching apparatus
> - `syllabus.guide.{learners,authors,community}.md` — practical guidance
>   per role (tooling, workflows, application of design principles)
> - `syllabus.translational-framing.md` — process for improving methods

---

## Why this file exists

`syllabus.md` is a _path_ to the future this manifesto names.
`syllabus.md` is light and pragmatic; this file is where the
philosophical commitments live. Vision-of-the-future content goes here;
design principles and teaching methods live in `syllabus.pedagogy.md`;
concept-definitions live in `syllabus.ontology.md`.

The seams to peer files:

- `syllabus.manifesto.md` ↔ `syllabus.md` = vision of the future ↔ a
  path to that future
- `syllabus.manifesto.md` ↔ `syllabus.narrative.md` = vision /
  commitments ↔ the learner's experiential arc
- `syllabus.manifesto.md` ↔ `syllabus.pedagogy.md` = the vision ↔ the
  design principles that serve it
- `syllabus.manifesto.md` ↔ `syllabus.ontology.md` = the vision ↔ the
  named concepts that operationalize it

---

## The vision

**A translational research agenda to invest equal resources in the
acceleration of human learning.**

That line is the spine. The sections below are elaborations: how
software's architect/implementer division shaped the territory the
curriculum operates in, how the LLM shift is a new chapter in an old
dance, how Bret Victor's wish for _Learnable Programming_ decomposes
unexpectedly in light of LLMs, and how the future beyond human-designed
languages might look.

---

## The architect/implementer division has always existed

Software has always had a design-work / notation-work split: architect /
implementer (cf. Fred Brooks), staff engineer / junior, consultant /
in-house, design-phase / build-phase within solo work, greenfield
developer / contributor-to-an-existing-codebase. Even when these roles
aren't explicitly divided, both types of work are necessary and the
best programming happens when the two sides coordinate effectively. The
division of labor is old territory, not an LLM invention.

To program, you needed notional-machine understanding _and_ full
notation fluency — both in one head, or split across a small team. This
simultaneous demand is a large part of what makes programming hard to
learn and master.

---

## The LLM shift: a new participant in an old dance

The principle that organizes everything below is named in
`syllabus.pedagogy.md` § How Learning Happens: **understanding is the
part of programming that cannot be delegated.** The four sub-points
that follow — honest framing, verification limit, NM understanding
matters more, the concrete Vibetoading/Frogramming difference — are
consequences of that principle, applied to the LLM-shift specifically.

Experienced collaborators who handle much of the notation — senior
engineers, pair partners — have always been part of software. LLMs are
a new kind of such collaborator: same role, different cognition.
Chapter 4 develops the differences.

**Honest framing**: LLMs are often better at notation than many humans
— faster, with a broader repertoire, fewer typos. Pretending otherwise
would be dishonest. But great Frogramming isn't only about
productivity. Design judgment, context awareness, aesthetic and ethical
taste aren't where LLMs excel. And Chapter 5 develops the case for
Frogramming-for-its-own-sake — the practice of keeping your NM-fluency
sharp when you're no longer writing most of the notation yourself.

**The verification limit**: we don't always understand what we direct.
Even our tests may be out of our depth — it's possible to verify that
a program does the _wrong thing correctly_. This makes certain
practices _more_ important in an LLM-assisted workflow, not less:
short iterations of user-visible behavior we can actually evaluate,
human-evaluable acceptance criteria, testing discipline oriented toward
visible behavior; Agile development vs Waterfall all over again!
Chapter 3 (users, PBIS, visible behavior) carries particular weight
for this reason.

**NM understanding matters more now, not less.** LLMs can write the
notation — pull the levers, work the controls — but the notional
machine they're directing is still yours to understand. When you
converse with an LLM about what your program should do, you're
describing what you want the NM to do, and you're judging its output
against what the NM actually produces. With an LLM in the loop, you
can (weirdly) abstract away much of the notation layer and program the
NM more directly — through prose and NM understanding, mediated by
the LLM that translates your intent into notation. But that route only
works if your NM understanding is strong enough to specify outcomes
the NM can actually produce and to evaluate whether the LLM delivered
them. Without NM understanding, you can't direct the LLM meaningfully
and you can't judge its output. The NM is what's being programmed —
just via a new route.

**This is the concrete difference between Vibetoading and Frogramming,
applied to the LLM shift.** A Vibetoader directing an LLM iterates on
user-visible behavior; their twin is the user, and the NM is operated
by the LLM virtuoso. A Frogrammer directing an LLM still operates the
NM through their twin, with the LLM doing the notation work. Both are
engaged in genuine work; both shoulder a non-delegable twin; they
delegate different audiences to the LLM. Same comparison,
both-non-delegable framing. With or without an LLM, **predicting
against the twin you shoulder** is the skill the course builds —
NM-prediction for Frogramming, user-behavior prediction (through
prototyping and testing with real people) for Vibetoading.

This frame treats LLMs as authoring partners. Agentic systems where
LLMs plan, execute, and modify state autonomously are a more complex
picture deferred to later learning.

---

## What Bret Victor wanted, decomposed

[**_Learnable Programming_**](http://worrydream.com/LearnableProgramming/)
said it best:

> - **Programming is a way of thinking, not a rote skill**. Learning
>   about "for" loops is not learning to program, any more than
>   learning about pencils is learning to draw.
> - **People understand what they can see**. If a programmer cannot
>   see what a program is doing, she can't understand it.
>
> Thus, the goals of a programming system should be:
>
> - to support and encourage powerful ways of thinking
> - to enable programmers to see and understand the execution of their
>   programs
>
> ...
>
> _How do we get people to understand programming?_
>
> We change programming. We turn it into something that's
> understandable by people.

Victor wanted _less implementation toil_ AND _more powerful thinking
tools_, both at once. LLMs decompose his wish in an unexpected way:

- ✅ **Less toil** — notation burden partially lifted by LLMs
- ❌ **Less visibility** — LLM-generated code arrives as a fait
  accompli; the mechanism is more hidden, not less
- ✅ **Study Lenses reclaims visibility** — of the machine's internals,
  which is this curriculum's specific focus

Study Lenses gives a slightly different solution to the visibility half
of Victor's wish than he expressed in Learnable Programming: We will
focus on visualizing the _internal mechanisms_ of your program's
evaluation, not the final output.

---

## The future beyond human-designed languages

Currently, LLMs work with programming languages designed for humans —
machines using controls built for human minds. A future where LLMs
design their own formally-provable languages is possible; those
languages would likely defy our notions of "high-level" and
"low-level," since those adjectives measure distance from _human_
cognitive convenience. If we can't read the code and can't evaluate the
tests, user-visible behavior is what's left to check against — the
agile-visible-discipline story intensifies further.

Even then, the programming languages we have now remain worth
cherishing: for their humanity, for how they shape thinking, for the
new thoughts they give us, and for our connection to a computational
history that runs from Jacquard looms to JavaScript.
