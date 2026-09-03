# On pseudocode

> Author-facing design memo. Part of the `computational-thinking/` set; start at
> [README.md](./README.md).

Pseudocode is routinely taught as a gentler on-ramp: get the thinking down
first, worry about syntax later. This document argues that the on-ramp runs the
wrong way — that pseudocode is a tool for people who already hold a notional
machine, and that putting it first presupposes the thing it is supposed to be
teaching.

The argument is a corollary of the chain in [thesis.md](./thesis.md) rather than
a new position, which is the main reason to believe it.

## It delegates the interpreter to the reader

Start with what pseudocode actually is, mechanically.

Code's semantics is supplied by the machine. You write it, something runs it,
and what comes back is not up to you. Pseudocode's semantics is supplied by
**the reader's notional machine** — there is nothing else that could supply it.

So pseudocode _is_ executable. It runs on wetware, against a twin the reader has
to already hold. That is the whole asymmetry in one sentence: with a strong twin
it runs, and with no twin it does not run at all — and nothing announces the
failure, because the thing that would have announced it is the interpreter you
just handed to the reader.

This is why pseudocode feels so natural to experts and does so little for
beginners. Experts are running it. Beginners are looking at it.

And it is the presupposition made mechanical. "Start with pseudocode, then learn
the language" asks a learner to write for an interpreter they do not have.

## Pseudocode is illegible computation

L2 says a modelling computation is **legible** when the correspondence between
the artifact and its target is observable and manipulable with the instruments
at hand. Computational thinking depends on legibility, not merely on modelling,
because its four verbs — understanding, predicting, discussing, designing — are
all observer-verbs.

Pseudocode has no implementation. Nothing runs it. So the correspondence between
what a learner wrote and what a machine would do cannot be observed, and it
cannot be intervened on. There is no predicting, because there is nothing to be
right or wrong about; no updating, because nothing diverges.

By the directory's own criterion, pseudocode is illegible computation. That is
the whole argument in one sentence, and everything below is consequence.

## Where it sits, and what that costs it

The chain in [thesis.md](./thesis.md) orders positions by causal contact with
matter, and the useful column is what can contradict you at each one.

| Position                   | What corrects you                                        |
| -------------------------- | -------------------------------------------------------- |
| the artifact               | physics                                                  |
| the notional machine       | the running machine, via study lenses                    |
| code                       | the interpreter                                          |
| the computational thoughts | nothing directly — hence the twin, hence the instruments |
| **pseudocode**             | **nothing**                                              |
| formal notation            | proof                                                    |
| CS / theory                | proof, at the meta-level                                 |

Correctives come from two places and the pivot separates them: **machines**
disagree with you on the left of the thoughts, **proofs** disagree with you on
the right. Pseudocode sits where neither reaches.

Its purpose is a third thing. It is not for applying a thought to a machine and
not for studying the thought formally — it is for **communicating**, between
people who hold the theory. So its only corrective is the reader, and a reader
is not an independent check: they may share the misconception, and a reader with
a strong twin will silently repair an ambiguity rather than surface it.

That is interpreter-delegation with a mechanism under it, and it is why the
position is the one place on the chain with no external corrective.

## It fails in the worst available way: it looks legible

Prose does not pretend. A paragraph describing an algorithm is obviously a
paragraph, and nobody mistakes reading it for checking it.

Pseudocode has the surface of code — keywords, indentation, control flow, the
visual rhythm of a program. So a learner writing it believes they are doing the
thing that code does, and they are not. The feedback that runnable code would
give them otherwise is precisely what has been removed.

This is the two-layer misconception mechanism the curriculum is already built
against: a wrong model that produces right-looking output long enough to become
load-bearing. A learner can write fluent, confident, entirely incorrect
pseudocode for months and receive nothing back that contradicts them. Their
notional machine is being built out of unopposed guesses.

## What it is, precisely

Not "bad." L3 gives it a place: a **computational language** is a symbolic
representation of modelling computation, and a **programming language** is one
with causal influence over an artifact. Pseudocode is the first without being
the second — the same species as an algorithm.

That is a description, not a demotion. But it identifies exactly what the
species lacks: the non-causal computational languages are the ones nothing can
check for you. An algorithm is checkable anyway, because it is written against a
formalism someone else has pinned down. Pseudocode is not.

### It has no fixed semantics, so it cannot shape thought

[computational-languages.md](./computational-languages.md) argues that the
_thoughts_ are notation-relative while the _practice_ is not: which
computational thoughts are available to you depends on the language you think
them in.

Pseudocode has no semantics to be relative to. Every writer's is different;
there is no agreed vocabulary, no fixed evaluation order, no stated rules about
what a name refers to or when. Two learners can write the same pseudocode and
mean incompatible things, and nothing in the notation will surface the
disagreement.

So pseudocode is not a _lighter_ notation. It is an **unspecified** one — and an
unspecified notation cannot do the thought-shaping work that makes notation
worth learning. It is a private language, and the thoughts it affords are
undefined because they are different for every writer.

This is a stronger claim than "it is unnatural until trained," and it explains
why the training never arrives: there is nothing stable to be trained on.

### Why mathematics gets away with being unrunnable

Formal notation sits on the same side of the pivot as pseudocode: it drives no
machine either. It survives because **proof is a corrective**. You can be wrong
in mathematics and be shown wrong, by derivation rather than by execution.
Pseudocode has neither execution nor derivation.

There is a second difference, and it is a difference in kind rather than degree.
The right end of the chain is not intrinsically unrunnable — it is unrunnable
until someone builds the implementation, and for mathematics people have. Lean,
Coq and Agda are implementations of mathematical notation; a proof assistant is
a machine that disagrees with you about proofs.

**Pseudocode cannot be given one**, because there is no fixed semantics to
implement. That is not an accident of nobody having bothered. It is what
pseudocode is.

## Why "start with pseudocode" presupposes what it teaches

Naur's Theory Building View holds that what programming produces is a theory in
the practitioner's head, and that "program revival, that is reestablishing the
theory of a program merely from the documentation, is strictly impossible."
Documentation is auxiliary to a theory someone already holds.

Pseudocode is documentation of a notional machine. It is notes about a machine —
which is why it is genuinely useful to someone who has one, and why it does
nothing for someone who does not. Notes about a theory do not install the
theory.

So the sequence inverts:

| The usual claim                       | What the chain says                                          |
| ------------------------------------- | ------------------------------------------------------------ |
| pseudocode first, then the language   | the machine first, then notes about it                       |
| it is the thinking without the syntax | it is the notes without the thing being noted                |
| syntax is the hard part, so remove it | checkability is the useful part, and removing it is the cost |

Starting with pseudocode asks a learner to take notes on a machine they have not
met.

## The objection that has to be answered

The load argument is the real reason pseudocode is taught, and "it is
uncheckable" does not refute it.

A novice working in a real language spends attention on syntax errors, on
tooling, on the gap between what they meant and what parsed. That attention is
not then available for the algorithmic thought. Pseudocode removes the tax. This
is a genuine finding about cognitive load, not a superstition, and any argument
that ignores it is arguing with a straw version of the practice.

The reply is not that load does not matter. It is that **the trade is bad,
because checkability is the mechanism that corrects the thought.** Removing
syntax removes the error messages, and the error messages were the feedback. You
have bought attention by disconnecting the thing that would have told the
learner they were wrong.

And the reply has a constructive form, which is the one worth making:

**The trade is unnecessary. A deliberately tiny language with a runnable
notional machine gets low load _and_ validation.** That is what Just Enough
JavaScript is for — few features, so little to hold; real evaluation, so every
prediction is answerable. Pseudocode's benefit is available without pseudocode's
cost, and F&V is the existence proof.

`study-lenses.md:180-181` names the same balance in the infrastructure's own
words: JEJ is designed around "meaningful computational exploration within a
manageable notional machine." Manageable is the load half. Exploration is the
half pseudocode cannot offer.

## What to use instead when you want a lighter notation

The want behind pseudocode is real. The answer is a **constrained runnable
notation**, not an unrunnable one.

Parsons problems already do this, and Study Lenses already has them: the learner
arranges given lines rather than producing them, so the syntax tax drops toward
zero while the result still runs and still tells them whether they were right.
Blocks-based environments occupy the same niche with the same property. What
these share, and what pseudocode lacks, is that **something on the other end
disagrees with you.**

If a course wants the on-ramp, this is the on-ramp.

## Where pseudocode does belong

The narrow claim is about sequence, not worth, and conceding this makes the
thesis truer rather than weaker.

Pseudocode between practitioners who hold the theory is a real and valuable
practice. On a whiteboard, in a design discussion, in the margin of a review, it
does exactly what Naur's Case 2 has documentation doing: it works as a **memory
aid and a coordination device for people who already have the machine.** Two
people who share a notional machine can write ambiguous pseudocode at each other
all afternoon and disambiguate it from the shared model, which is why it feels
so natural to experts and so useless to beginners.

Sketching intent in NM terms before writing notation is also, precisely, the
NM-grounded conversation mode `ontology.md:1240-1243` describes for working with
an LLM. That is pseudocode doing its proper job — and note when it happens:
_after_ the machine is held, as a way of operating it.

Pseudocode is a post-notional-machine tool. The error is filing it as a
pre-notional-machine one.

## Owed

> **The empirical question is open and is not answered here.** Whether
> pseudocode-first sequencing has been compared against code-first sequencing in
> computing-education research, and with what result, has not been checked for
> this document. The argument above is derived from the chain, not measured. If
> the comparison exists it is the thing that would confirm or kill this, and it
> should be found before any of this reaches learner-facing material.
>
> Owed: Naur is in this directory at
> [programming-as-theory-building.md](./programming-as-theory-building.md) and
> the quotation above is from it. The cognitive-load literature behind the
> objection — Sweller, and 4C/ID via van Merriënboer — is not fetched.

## Related

- [thesis.md](./thesis.md) — L2 legibility, and L3's genus
- [computational-languages.md](./computational-languages.md) —
  notation-relativity
- [observability.md](./observability.md) — the criterion this document applies
