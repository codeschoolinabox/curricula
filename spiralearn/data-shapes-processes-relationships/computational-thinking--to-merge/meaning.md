# Meaning — why the word sits at the top of the chain

> Author-facing design memo. Part of the `computational-thinking/` set; start at
> [README.md](./README.md).

"Meaning" names two different things, and the chain gives them two different
names so nobody has to keep them apart by discipline.

## The two things

**States tracking states.** A thermostat's internal state corresponds to the
temperature of a room. Warm the room and the state moves; move the state and the
room warms. That relationship holds whether or not anyone is watching — it is a
fact about two systems, not about anybody's understanding of them. Grice called
this _natural_ meaning, the sense in which spots mean measles: reliable
covariation, no intention anywhere in it.

In this set that relationship is called **modelling computation**, and it lives
at L1.

**Something being taken some way by someone.** What a piece of work is _for_,
offered by someone, and received. Grice's non-natural meaning: an intention that
the audience recognise the intention as such. This is the sense `ontology.md`'s
rhetorical situation runs on, and the sense its conceit names.

In this set that is called **meaningful computation**, and it lives at L6.

## Why the split, rather than one word doing both

An earlier draft used "meaningful computation" for the L1 relation and then had
to spend a document insisting the word never slide into its other sense. That
was a workaround, and the tell was how much upkeep it needed.

The slide it was guarding against is real. Arguing from state-correspondence to
rhetorical conclusions — _the states correspond, therefore the program
communicates_ — is invalid, and so is the reverse, _the audience understood it,
therefore the model is correct_. A single word makes both look like short steps.

Grice separated the two senses precisely because the surface word misleads. Two
names is the same fix, applied earlier.

It also puts the word where the course needs it. **Meaningful Computation** as a
title now names what the work is for rather than the machinery underneath it,
which is the better thing for a title to name.

> Owed: Grice, "Meaning" (1957). Not fetched.

## What was tempting and is wrong

A bridge sentence: _meaning is never in the artifact; it is in the relation
between artifact and interpreter._

It sounds unifying and it contradicts the thesis. L1's conditions (a) and (b)
are properties of the artifact–target pair; no interpreter appears in them. So
either the interpreter is constitutive — and then modelling is
observer-relative, which hands the argument to Searle — or the sentence is
false. There is no third reading.

"Both are relational, therefore one word" also proves too much. Causation is
relational. Being north of is relational. The genus carries no content down to
the species.

## Derived and original intentionality

Worth keeping, and it belongs at L6 (Haugeland; Dennett). The artifact's
semantics is **derived** — it is parasitic on someone who set it up. The
rhetorical conceit is **original**; it is the author's own. Collapsing those two
is the specific move that makes observer-relativity unavoidable, which is why
the distinction earns its place rather than decorating the page.

## Drafting hazards

- "Meaningful" used as a value word — _a meaningful exercise_ — anywhere the
  technical sense is live. Two sites in the curriculum already do this
  innocently and predate the term: `pedagogy.md:52` and
  `study-lenses.md:180-181`. Both are quotations when they appear here and stay
  as written.
- Using "meaningful" for the L1 relation. That is modelling.
- Any sentence where swapping one sense for the other leaves it looking fine.
  That is the test.

## Related

- [thesis.md](./thesis.md) — where modelling and meaningful computation are
  defined
- [observability.md](./observability.md) — the observer, and where it
  legitimately enters
