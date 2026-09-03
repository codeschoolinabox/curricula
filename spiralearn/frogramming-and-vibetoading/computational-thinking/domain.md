# The domain — text, and the reply to Weintrop

> Author-facing design memo. Part of the `computational-thinking/` set; start at
> [README.md](./README.md).

## The claim

The domain is **text** — represented in JavaScript as strings, plus the
supporting types that text manipulation needs: numbers, booleans, `null`.

The discipline is **user-facing, text-manipulating, rhetorically-situated
programs implementable with Just Enough JavaScript.**

Chapter 0 sets it.

## Why the domain is not optional

[thesis.md](./thesis.md) makes meaningful computation require a **second
system** — the target. A course with no target teaches computation without
meaning, by its own definition. So the domain is not a flavouring decision. It
is the L1 ingredient, and something has to supply it.

## Subject-matter-agnostic and discipline-situated at once

These are two different senses of "domain," and the curriculum's existing
vocabulary runs them together.

- **Subject matter** — medicine, finance, games. F&V genuinely is agnostic here,
  and that is the sense `ontology.md:1478` and `chapters.md:266` were reaching
  for.
- **Discipline** — a community of practice with characteristic problems and
  characteristic ways of computing about them. F&V is _not_ agnostic here, and
  never was.

Text is the choice that gets both: text is _about_ anything, so no subject
matter is privileged; and manipulating text for a reader is a real practice with
real problems.

## The reply to Weintrop, stated as a reply

Weintrop et al. argue that computational thinking should be situated in a
discipline, and name the alternative explicitly:

> "This differs markedly from teaching computational thinking as part of a
> standalone course in which the assignments that students are given tend to be
> divorced from real-world problems and applications." [read: Weintrop et al.,
> *J Sci Educ Technol* (2016) 25:127–147, **p.128**, > right column]

Two things to be honest about when using this. The sentence sits in a motivation
paragraph and the claim is attributed onward (Hambrusch; Jona; Lin; Wilensky) —
it is not the paper's central contribution, which p.128's left column states as
"an actionable, classroom-ready definition" delivered as a four-category
taxonomy. And the file is named `weintrop-2015.pdf` while the journal issue is
2016: it was published online 8 October 2015. Say that once and move on.

**Citing Weintrop is citing a critique of this course.** The sharpest form of
the objection is not the sentence above; it is:

> _You have redescribed your stack as a discipline._

Weintrop's categories are derived from watching mathematicians and scientists
work. Their assignments come from a community whose real problems supply them.
"User-facing, text-manipulating, rhetorically-situated programs implementable
with JEJ" names a technology surface and an audience posture. **The reply is
only coherent if there is a community whose real problems the learner is
solving**, and this document owes an answer to _which community_. That answer is
not yet written, and declaring the reply without it would be exactly the move
the objection predicts.

## What must not be argued

An earlier draft argued: _text is about anything, so transfer survives._ That is
a non sequitur, and it contradicts the curriculum's own citations.

The representational generality of a medium says nothing about the psychological
transfer of skill acquired in it. And the curriculum already cites Wiley's
**Reusability Paradox** (`ontology.md:1618`), which says the opposite: the more
context-general the material, the _less_ pedagogically effective it is. Arguing
for free transfer from generality while citing Wiley elsewhere is incoherent.

The defensible version is narrower, and lives in
[computational-languages.md](./computational-languages.md): what transfers is
the **practice** — predict, observe, notice divergence, update — not the
thoughts and not the skill.

Note also that `chapters.md:266` makes a stronger claim than "domain-agnostic":
_"the same NM skills transfer to any domain."_ That is an explicit transfer
claim and it needs the same narrowing.

## Domain-specificity cuts both ways

Programming expertise is domain-specific — experienced programmers working in an
unfamiliar domain perform closer to novices. This supports the discipline claim:
it is evidence that situating matters.

It is also the strongest argument _against_ easy transfer, and therefore against
any strong reading of one-practice-two-target-distances. Both readings should be
stated. Presenting only the supportive one would be the same selective citation
the Weintrop reply is trying to avoid.

> Owed: a source for this finding. It is currently an unsourced assertion.

## The design was already made

The strongest evidence for this domain is that the infrastructure was built for
it before the thesis named it. `study-lenses.md` describes JEJ as:

- programs "that interact with users through text and numbers" [read: `:176`]
- designed around a balance of **"meaningful computational exploration within a
  manageable notional machine"** [read: `:180-181`]
- with the shape of every JEJ program being "read input…" [read: `:186`]

That is the domain, the phrase, and the I/O-first structure, all present in the
infrastructure document. The thesis is in part a **retroactive articulation of a
design decision already made** — which is a stronger register than assertion,
and the one this whole document set should aim for wherever it can.

The same register applies to the two conditions on meaning:
`ontology.md:936-946` already describes Ch2's data-flow loop as data entering
the user through their eyes, being transformed, and returning through a resolve
event. That is a target system, mapped both ways, with intermediary states. The
thesis names what Ch2 already does.

## Weintrop's taxonomy, and one free connection

The four categories — data practices, modeling and simulation practices,
computational problem solving practices, systems thinking practices — are
enumerated in prose on p.128 [read]; Fig. 2 on p.135 is a raster diagram of the
same. One practice in the modeling category is worth lifting directly:

> **Assessing Computational Models** asks which aspects of a phenomenon have
> been faithfully modeled and which have been simplified or ignored [read:
> p.137].

That is condition (a) turned into a teachable practice, and it is close to the
half-beat's shape.

And the **Data Practices** category — collecting, creating, manipulating,
analyzing, visualizing — maps almost cell-for-cell onto `ontology.md` §8's data
thread. External validation for a structure the curriculum already has, plus a
practice vocabulary for it.

## Related

- [thesis.md](./thesis.md) — why a target system is required
- [computational-languages.md](./computational-languages.md) — what transfers
- [epicycles.md](./epicycles.md) — where the target enters, turn by turn
