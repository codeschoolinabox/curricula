# This codebase, read through the thesis

> Author-facing design memo. Part of the `computational-thinking/` set; start at
> [README.md](./README.md).

The rest of this directory argues that computational thinking needs modelling,
legibility and a machine to think through, and that none of it survives being
abstracted from a medium. This repository is a working instance of that claim —
built by a human and a rotating cast of LLM sessions, under conventions written
before the thesis existed. What follows is what the repository looks like when
the thesis is turned on it, including where it does not come out well.

## Naur diagnoses a condition this repo has, and prescribes remedies it cannot take

This is the central finding, and it is easy to miss because the diagnosis fits
so well that the prescriptions look like they should follow.

**The diagnosis transfers completely.** Every session is a new programmer team
with no contact with the previous one. Naur's account of program death — "the
death of a program happens when the programmer team possessing its theory is
dissolved" — describes what happens here between sessions, by design. His decay
mechanism describes the failure mode precisely: many correct modifications
exist, only some extend the theory, and nothing in the program text
distinguishes them.

**The prescriptions do not transfer, because each assumes a collaborator who can
come to hold the theory.**

- _Apprenticeship._ Naur: a new programmer needs "the opportunity to work in
  close contact with the programmers who already possess the theory." There is
  nobody for a session to apprentice to, and the session will not carry what it
  learned into the next one.
- _Discard and re-solve._ Naur prefers throwing the text away over rebuilding a
  theory from documentation. This inverts here. An LLM has no stake in careful
  prior planning and will discard it on a fluke — a variable name that reads
  oddly, a convention it half-recognises — and then drift everything downstream.
  Naur's programmers had the judgement to know when a text was worth discarding.
  That judgement is exactly what is missing, and its absence makes the remedy
  more dangerous than the disease. **This is why the design phase is first and
  immutable here: not because up-front design is superior in general, but
  because the collaborator cannot be trusted to revisit it well.**
- _Documentation as a memory aid._ Naur's Case 2 has fault-finding programmers
  relying on "their ready knowledge of the system **and** the annotated program
  text" — the text works because they already hold the theory. Here the reader
  is never a theory-holder. Every session arrives cold. Documentation written as
  a memory aid for someone who already knows would fail; it has to be written as
  an installer.

So this repository is not following Naur. It is answering the same problem with
different means, because his means require something the collaborator lacks:

| Naur's remedy               | What this repo substitutes                          |
| --------------------------- | --------------------------------------------------- |
| apprenticeship to a holder  | a human theory-holder at the gates                  |
| discard and re-solve        | design first, and immutable                         |
| documentation as memory aid | documentation as installer, written cold-read-first |

Stating that as a substitution rather than as agreement is the honest form, and
it is also the more useful one: it says what would break if any of the three
were removed.

## Theory-minimisation, not theory-transfer

`DEV.md`'s conventions look like an attempt to write a theory down, which Naur
says cannot work. They are better read as an attempt to need less of one.

A pure, bounded module with an explicit contract requires a similarity judgement
over a very small world. Naur's compiler case concerned a large program whose
power lived in cross-cutting structure — precisely where theory is irreducible.
The conventions push as much of the system as possible into regions where the
theory needed per change approaches zero, and concede the rest.

Naur supports this indirectly, through a line that is easy to read past:
qualities "such as simplicity and good structure can only be understood in terms
of the theory of the program, since they characterize the actual program text in
relation to such program texts that might have been written to achieve the same
execution behaviour, but which exist only as possibilities in the programmer's
understanding." Simplicity is theory-relative. So conventions cannot be defended
as objectively better. They can be defended as **narrowing the space of "many
different ways, all correct"** — which shrinks the gap a collaborator has to
guess across. That is a better justification than the one `DEV.md` currently
gives.

## The governance already names the theory-holder

`AGENTS.principal.md` reached Naur's conclusion without him:

> "The orchestrator holds the spine — `types.ts`, the DOCS `## Data flow`
> diagram, the plan/gate ledger — and reads committed contracts at DAG joins to
> catch seam-slop (**Always Works™ at the seam can't be delegated**)."

That last clause is the Theory Building View in five words. The fan-out's shape
follows from it: workers are handed units chosen not to require the theory, the
orchestrator holds it within a session, and the human holds it across sessions.
The gates are where the only continuous theory-holder in the system inspects the
work.

Read that way, the human gates are not process overhead. They are the only place
the theory exists continuously, and removing them would not slow the system down
— it would kill the program in Naur's sense while leaving it executing.

## The twin docs

The machine twin is the closest thing to a written theory the conventions
produce. Naur's first capability is world-to-code mapping in both directions,
and a notional-machine document with a `## Predictions worth making` section is
a direct attempt to write that mapping down.

But the heading is also the limit. A theory-holder answers any prediction
question, including ones nobody anticipated — "a person having a theory will be
able to produce presentations of various sorts on the basis of it, in response
to questions or demands." A document holds the presentations someone thought to
write. **It is a sample of the theory's outputs, not the generator.**

The data twin runs at something Naur says is impossible. Its identity criterion
— what makes two values the same value — is the similarity judgement he says
"cannot be expressed in terms of criteria, no more than the similarities of many
other kinds of objects, such as human faces, tunes, or tastes of wine." Writing
it down is plausible only because the module is bounded. It is theory
minimisation again, and it degrades exactly as scope grows.

The most Naur-compatible line in the whole convention is the one that refuses
the equivalence: **"Declaring a `twin-doc` names which model is owed a document.
It never asserts who holds the twin."** That is his primary/secondary ordering
stated as a governance rule, and `DEV.md`'s naming of _ceremony-without-twin_ as
a failure symptom is his decay mechanism named as a thing to watch for.

### Why writing them is worth more than reading them

The strongest defence of the twin docs is not about the artifact at all.

They are written in Phase 0, before implementation. Naur: "while building the
theory the person is trying to get it." Writing a twin doc is theory-building
activity, not documentation — and the value accrues to the writer, in the act.

That has a sharp consequence, and it is testable against how this repo actually
works: **a twin doc generated by one agent for a different agent to read carries
almost none of that value, while one written by whoever will do the work carries
most of it.** The fan-out hands workers contracts they did not write. Whether
that is a real loss or an acceptable one is an open question this file does not
settle, but it is the question to ask of the practice.

## What review can and cannot reach

Naur's decay mechanism implies a review question the protocol did not previously
ask, and now does. AR-4 checked conformance to the DOCS.md sketch; `DEV.md`
gained a **twin-doc conformance** focus area in `6c34c970`, on explicit human
instruction — does a change conform to the identities, ownership, lifetimes and
predictions the twin records, and where it does not, does the reviewer **flag
the divergence rather than deciding it**?

Phrasing it as conformance is deliberate. It converts an irreducible judgement
into a checkable one, which is the only form a reviewer without the theory can
execute. It is also strictly more than the sketch covers, since the twin docs
carry identity, ownership, lifetime and predictions.

And it must be stated with its limit: **the check reaches inconsistency with the
written theory, not with the unwritten one.** Naur says the second is what
matters most. Nothing automatable reaches it. The human gate is the only
instrument that does, and pretending otherwise would be the
ceremony-without-twin failure in a new costume.

## A prediction this repo can be checked against

The decay mechanism predicts that failure will not be uniform.

Leaves stay clean, because theory-per-change is near zero where a module is
small and its contract explicit. Drift accumulates at the **seams** —
cross-module contracts, shared types, the places where "many different ways, all
correct" bites hardest, and where a session with no stake is most inclined
toward a locally-correct patch.

So the falsifiable claim is: **this repository's modules should be in better
shape than its cross-module contracts, and the rot should show at joins rather
than in leaves.** That is checkable against the repo's own history, and it has
not been checked. Stating it is more useful than asserting that the strategy
works.

## The session that produced this directory

The documents in this directory were written in one long conversation between a
human and an LLM. That conversation is evidence about the thing it was
describing, and omitting the failures would make it useless as evidence.

What went wrong, and what caught it:

- **A condition written in the author's voice that the author had not held.**
  The third condition on modelling computation was drafted as Woodward-style
  interventionism, taken from a review, and shipped. The author read it and said
  "that's not what I meant at all."
- **Three substitutions of formal vocabulary for grounded wording.** A pedagogy
  ruling hardened into an ontological one; "algorithm" put where the author had
  said "idea"; the interventionist reading of condition (c). Each was caught by
  the author. After the second, the pattern was named in writing — and then it
  happened again.
- **A lineage that did not survive checking.** Papert was presented as making
  the course's title look inevitable, on the strength of a secondary gloss of an
  article nobody had read, whose priority claim is contested two sentences
  earlier on the same page.
- **A published command that did not produce its published number.** A grep
  offered as evidence returned 16, not 9. The same document contained the
  instruction "run the string you publish."
- **Two table rows quoting strings that exist nowhere in the repo**, under a
  stamp asserting every row had been verified.
- **A citation written from a summariser's extract.** Naur was cited across a
  commit on the basis of a fetch with five targeted questions. Asked "did you
  read the whole essay?", the answer was no. Reading it surfaced his opening
  definition — the closest thing in the paper to the claim being made — and an
  attribution hazard that would have put another author's words under his name.

Every one was caught by the human. None was caught by the LLM, by the tests, or
by the conventions. That is not a complaint about the tooling; it is the Theory
Building View arriving on schedule. The theory was in the person who had been
thinking about this for a decade, and the failures were exactly the ones Naur
predicts for a collaborator working from text.

The four-hat adversarial review is worth counting on the other side: it found
three fatal problems in the argument and twenty-two citation defects that the
authoring session had not seen. Fresh readers without the theory catch different
things than the theory-holder does — which is also Naur's Case 1, run in the
direction that works.

## Related

- [thesis.md](./thesis.md) — the chain, and Naur read in full
- [programming-as-theory-building.md](./programming-as-theory-building.md) — the
  essay. Naur's text is lines 14–598; everything after line 599 is by another,
  unattributed author and must not be quoted under his name
- `DEV.md`, `AGENTS.principal.md` — the conventions this file reads
