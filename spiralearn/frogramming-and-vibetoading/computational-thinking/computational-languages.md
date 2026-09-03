# Computational languages — the genus, and what it costs to have only one

> Author-facing design memo. Part of the `computational-thinking/` set; start at
> [README.md](./README.md).

## The genus and its species

A **computational language** is a symbolic representation of meaningful
computation. A **programming language** is one that also has causal influence
over a computational artifact.

The genus is the thing this set adds that the curriculum does not currently
have: "computational language" appears **zero times** across the F&V documents
[measured 2026-09-03: `grep -rniE 'computational language' --include='*.md'
--exclude-dir=computational-thinking .` run from
`spiralearn/frogramming-and-vibetoading/`]. The exclusion is not optional —
without it the same command returns 18, because this directory is full of the
phrase. See [tie-ins.md](./tie-ins.md) § "Two hazards".

## Algorithms are the second species, and they are why the genus is visible

An algorithm is an abstract symbolic representation of how the notional machine
transforms data. It represents modelling computation. It has no causal influence
over any artifact. So it is a computational language that is **not** a
programming language — the genus and the species, pulled apart, on one page.

This matters more than it sounds. **A genus with one visible species is not a
genus; it is a synonym.** Without algorithms on the page, a learner reads
"computational language" as a longer way of saying "programming language," which
is precisely the conflation the thesis exists to break.

It also places the second course. Welcome to Algorithms works the same
computational thinking with the target moved out to algorithms — which is F's
bridging range, artifact ↔ NM ↔ CS/theory, as `ontology.md:307-308` already
states it. F&V's window is user ↔ artifact ↔ NM (`ontology.md:320-325`). The two
overlap at artifact ↔ NM. The prerequisite relationship between the courses is
geometry, not a sequencing claim.

Other members of the genus worth naming so the category feels real: pseudocode,
a flowchart, a state diagram, a recipe, a knitting pattern, musical notation, a
regular expression written on a whiteboard. Some of these are contestable, and
arguing the edge cases is exactly the use the criteria in
[observability.md](./observability.md) are meant to be put to.

## Notation-relativity, and what survives it

`plann.txt:20` makes computational thinking **by way of** a computational
language. Taken strictly, the computational thinking a learner has is relative
to the notation they have. That sits badly with any promise of transfer, which
requires something to survive the notation.

The resolution is to say which part is which:

- **The thoughts are notation-relative.** Which computational thoughts are
  available to you depends on the language you think them in. This is the
  linguistic-relativity claim `plann.txt` already gestures at in its fourth
  footnote, and it is why learning a paradigm is not learning a syntax.
- **The practice is not.** Predict, observe, notice divergence, update. That
  loop is the same whether the notation is JEJ, Python, a flowchart, or a trace
  table on paper.

So transfer is **transfer of practice**, not transfer of skill or of thoughts.
That is a narrower claim than the curriculum has sometimes made, and it is one
the transfer literature would actually license.

This also answers, more honestly than an appeal to 4C/ID does, the fourth of the
questions in `from-a-job-application/1-why-interested.txt:5` — _separate
computational thoughts from code-linguistic thoughts, then reintegrate_. Under
notation-relativity they are not fully separable, because the thoughts are
partly constituted by the notation. What can be separated is the **practice**
from any particular notation, and that is what reintegration reintegrates.

## The two-part entwined endeavor

From `plann.txt:47-49`: learning computational thinking is two entwined jobs —
learn a symbolic computational language, _and_ learn to have the thoughts that
language represents.

The second job is the one no curriculum names, and the chain shows why it is
easy to miss. Study Lenses serves position 2, the notional machine. JEJ serves
position 3, code. **Position 4 — the computational thoughts a learner has to
build alongside the language — is served by nothing yet**, and the corrective
column says the same thing from the other side: nothing contradicts you there
directly, which is why the twin needs instruments built for it. See
[the-chain.svg](./the-chain.svg), [epicycles.md](./epicycles.md) and
[half-beat.md](./half-beat.md).

## Lineage, handled carefully

**diSessa is the position, and should lead.** _Computational literacy_ (diSessa,
_Changing Minds_, 2000), and Wilensky's restructurations, are the established
claim that the medium constitutes the thinking. That is this thesis's claim,
with a literature already behind it.

> Owed: diSessa (2000); Wilensky on restructurations. Not fetched.

**Papert is a resonance, not a lineage.** Weintrop p.130 reports: _"Papert
(1996) was the first to use the term computational thinking to refer to the
affordances of computational representations for expressing powerful ideas"_
[read: Weintrop 2016, p.130]. That reads as though the course's title and the
term's origin coincide. Four cautions before leaning on it:

1. It is Weintrop's _characterization_ of a five-page article, not Papert's
   definition, and nobody in this campaign has read the article.
2. Priority is contested — Weintrop's own paragraph cites Perlis (1962) two
   sentences earlier.
3. "Expressing powerful ideas" describes programming-_to_-learn, which is the
   distal pole. The Papert-shaped course is the second one.
4. Used as lineage it would be doing rhetorical work the evidence does not
   support.

> Owed: Papert, _An exploration in the space of mathematics educations_ (IJCML
> 1(1), 1996). Read the four pages before this document cites it as anything
> more than a resonance.

**Wing is the strongest objection, and stays.** Wing 2006 is explicitly
medium-independent: computational thinking is "a way that humans, not computers,
think," conceptualizing rather than programming. This thesis denies exactly
that.

The curriculum currently carries **three** citations of Wing —
`ontology.md:1615`, `guide.authors.md:385`, `guide.community.md:40` — with no
Wing-shaped definition anywhere behind them [read: all three]. The fix is not to
drop them. It is to state her position and argue against it. A thesis that
cannot name its strongest opponent is not an argument, and readers will supply
Wing whether or not this document does.

> Owed: Wing, "Computational Thinking" (CACM 49(3), 2006). Not fetched.

## A cost the course pays knowingly

`plann.txt:75` alludes to an experiment showing "common c-style languages are no
easier to learn for beginners than random languages with the same computational
model." That is Stefik & Siebert (2013), and the paraphrase needs three
corrections before it appears anywhere learner-facing:

1. The measure is novice token-accuracy on short tasks and rated intuitiveness —
   not "learnability" of a language. The paraphrase overreaches the construct.
2. The headline finding is not _syntax doesn't matter_. It is the reverse:
   **syntax choices measurably matter, and C-style syntax is a poor one.**
   Quorum, Ruby and Python outperformed both C-style syntax and a language with
   randomly chosen keywords.
3. This course teaches JavaScript, a C-style language. So the finding is an
   objection the course **inherits**, not a footnote it can rest on. Say so, and
   say why the trade is worth it — ubiquity, a browser runtime, and an NM that
   `embody` can instrument.

> Owed: Stefik & Siebert, "An Empirical Investigation into Programming Language
> Syntax" (TOCE 13(4), 2013). Not fetched; the numbers above are from review and
> must be checked against the paper.

## Open

**Type or token.** "A symbolic representation of modelling computation" is
ambiguous between the system (French) and the utterance (a French sentence). A
programming language is a type; an algorithm is closer to a token. The course
teaches a language through programs, so it lives on both sides. Decide before
Ch0 drafts anything that turns on it.

## Related

- [thesis.md](./thesis.md) — L3, where these definitions sit
- [epicycles.md](./epicycles.md) — the thoughts half, as curriculum
- [domain.md](./domain.md) — which notation, and why
