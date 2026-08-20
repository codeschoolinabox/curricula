<!-- cspell:ignore munch Punctuator IdentifierName NumericLiteral spellme -->
<!-- cspell:ignore colours practised practises generalises wireframes -->
<!-- cspell:ignore unbuilt spellme -->

# user journeys — spellme

The user twin for this lens: an account of the learner in front of it, written
from where they sit. Not a specification — the README is that. This document
exists so the thing most likely to be wrong about this lens can be wrong on
paper first.

**What is most likely to be wrong is the pacing.** Every other risk this design
carries has a test that can catch it. Whether the fifteenth claim is still worth
making does not, and no unit test ever will. So the journeys below are written
with a clock, and the places where the author does not believe his own design
are marked **⚠ doubt**.

Five journeys. Four learners and one who cannot use the mouse — that last one is
here because the first draft of this document had a single reader in front of
the surface, sighted and pointing, and a design review caught it.

## Journey 1 — first contact

A learner who has written some JavaScript and has never once thought about how
the machine reads it. They opened the `tokens` phase because it was there.

**0:00 — the surface arrives.** Three regions. A tape across the top holding
their program, whole and untouched. Below it two empty containers, one for
tokens and one for what gets set aside. A cursor sits before the first
character. The legend of ten kinds is **open**, not collapsed — they have to
read it, and the design says so rather than hoping.

**0:10 — the first claim.** The program starts `const x = 1;`. They pick
`IdentifierName` because the other nine names do not look like they mean a word,
and step the extent to 5.

It is right, and that is the first surprise: `const` is a keyword, and the
legend they just read says a keyword is an identifier name. **The program opens
on a reserved word on purpose.** `let` would have been gentler and would have
taught nothing — it is not a reserved word, so the parser types it as a plain
identifier already, and the claim would have been correct for the wrong reason.

It falls. The five characters lift off the top tape and land below. The cursor
moves — and it moves **past the space**, which they did not ask it to do. The
space did not go anywhere. Nothing arrived to mark it.

This is the first thing the lens teaches, and it teaches it by doing rather than
saying.

> ⚠ **doubt.** A space evaporating is a very quiet event, and at the moment it
> happens the learner is looking at the token tape, where their success just
> landed. The evaporation may need to be the loudest animation on the surface
> rather than the softest. This is a sandbox-checkpoint question, not a design
> question — ten minutes at a running dev server settles it, and the wireframes
> deliberately decline to draw it.

**0:25 — `x`, then `=`, then `1`.** Four claims, all correct, all easy. They
have found the rhythm: look at the character, pick the obvious kind, step to the
obvious edge.

**0:40 — boredom, or not.** This is the hinge of the whole design, and it is
where the honest doubt sits.

> ⚠ **doubt, and the biggest one.** Six of the ten kinds are decided by the
> first character alone — a digit, a quote, a backtick, a letter, a `#`,
> punctuation. So claims six through fifteen ask a lookup, not a question. The
> only genuine ambiguities in the whole vocabulary are `/` and `}`, and both are
> decided by the goal symbol, which is a **different lens**. The
> one-more-character field is what carries real thinking, and a learner who is
> doing well never sees it. **The design does not have an answer yet**, and
> naming one it does not have would be worse than saying so. An earlier draft
> named `recommend` here, and `recommend` structurally cannot be it: it proposes
> next study steps, so it changes nothing about the program already in front of
> this learner. The two real candidates are the **strict scan** — claiming the
> trivia too, the one question here whose answer is not a first-character lookup
> — and `oneMoreAfter: 0`, which asks everyone every time at the cost of the
> rhythm. Until one of them lands, this lens works best on programs chosen for
> it.

**1:00 — the comment.** They reach `// hi`. They are not asked about it. It
lifts out of the top tape and lands in the jar — and stays there, visible, while
they carry on. They did not have to do anything, and something happened that
they can still see.

## Journey 2 — the wrong claim, and one more character

**1:20.** They reach `a+++b` and claim `Punctuator`, extent 1. Two verdicts come
back: the kind was right, the extent was not. The element does not move.

They step to 3. Wrong again. On the third attempt a field opens beneath the
extent, and it does not ask them to recall a rule. It shows them **whatever the
stepper currently reads** plus one more character, and asks what **that** would
be:

```text
on the stepper  +++
one more        ++++
  ( ) still a Punctuator
  ( ) a different kind
  ( ) not an element here
```

They answer _not an element here_ — right, and it tells them four is too far
without telling them three is.

**Then they step down to 2, and the question follows them.** The field re-asks
itself against the new value: `++` on the stepper, `+++` as the one more, and
the radio they had selected clears. They think again. `+++` is not a punctuator
— there is no such operator — so the scanner could not have taken it, which
means `++` is the longest thing that was still legal. They answer _not an
element here_ a second time, submit, and it falls.

**That is the design working**, and the stepper is why. A question frozen at
their last wrong submission would have kept asking about a boundary they had
already abandoned; because it moves with them, exploring the stepper _is_ the
reasoning. The rule they now hold — the scanner takes the longest thing that is
still legal — is one sentence and it generalises, which the old table of six
named reasons did not.

> ⚠ **doubt.** The field that carries the lesson is still reachable only by
> failing. A learner who never guesses wrong twice practises recognition and is
> never once asked to justify. Asking everyone every time would triple the cost
> of the easy claims that give the lens its rhythm — so the fix is not obvious,
> and `oneMoreAfter: 0` exists for an educator who wants the trade. That setting
> is only a real option because the thresholds are **reached** rather than
> exceeded; under an exceeds reading no value would open the field on the first
> attempt and this escape hatch would be a fiction.

## Journey 3 — the learner who is stuck, and the way past

They are at a template: `` `hi ${name}!` ``. They claim the backtick alone.
Wrong on both fields. They try the backtick plus the two words after it. Wrong.
The one-more-character field opens and does not help them, because they do not
yet know where a template head **ends**.

**On the fifth attempt a second control appears: hand it to the machine.**

They press it. `` `hi ${ `` falls into place, named `Template`, and marked as
not theirs. The cursor advances. They keep going.

They did not get the answer by asking for it; they got it by watching it happen,
which is the same way they learned that whitespace evaporates. And the next
template head in the same program, they get right.

> ⚠ **doubt.** The skip may be too easy. A learner who discovers that four wrong
> answers costs nothing has found a way through the whole program without
> thinking, and the lens has no way to tell that from genuine difficulty. The
> counter-argument is that a learner who wants to skip everything has already
> chosen not to learn, and the gate was never a grade. `skipAfter` is a number
> chosen without evidence.

## Journey 4 — the learner who already knows

They know maximal munch. They know keywords are identifiers at this phase. They
claim correctly, every time, quickly. The one-more-character field never opens.
In ninety seconds they have seen everything the lens does.

**And then they hit `true`.** They claim `StringLiteral` — no. `NumericLiteral`
— no. There is no boolean button. They read the legend again and find
`IdentifierName`, and do not believe it.

This is the lens's best claim and it is available to everyone, unlike the marked
comment, which sits at the end of a whole stream. `null`, `true` and `false` are
`ReservedWord`s, `ReservedWord`s are `IdentifierName`s, and the thing that makes
them values happens one phase later.

> ⚠ **doubt.** They will go and read `lib/classifying`, or a lens built on it,
> and be told those three are `literal`. Both are true of different phases. The
> README says so; nothing in the **surface** does, and a learner who meets the
> contradiction without the reconciliation loses trust in the instrument — which
> is the exact failure the embodiment exists to prevent.

## Journey 5 — the learner who does not use a mouse

They arrive by keyboard. They tab to the kind picker, arrow through ten options,
tab to the extent stepper, arrow it up to 3, tab to the submit button, and
press.

**It works, and that is the whole point of this journey being here.** The extent
is a small integer, so the primary control is a stepper and dragging on the
source is the enhancement — not the other way round. Nothing about this lens
requires pointing.

The verdicts land in an `aria-live` region, so they are announced rather than
only coloured — verdicts, never "marks", which in this lens names one property
of a comment and nothing else. The three fates carry a border style as well as a
hue.

> ⚠ **doubt.** The one place this may still break is the falling animation:
> motion is the reward the whole loop is built around, and a learner who has
> reduced motion turned off gets a reward that never arrives. A non-motion
> confirmation is owed and is not yet designed.

And one that only shows up over a whole program rather than at any single claim:

> ⚠ **doubt.** Ten kind buttons is ten tab stops or ten arrow presses, on every
> single element. The sighted pointing learner pays one click. That asymmetry
> compounds over sixty elements and nothing in the design addresses it.

## What this document is asking of the design review

1. **The middle of the stream asks a first-character lookup.** Six of ten kinds
   are decided by one character; the two that are not belong to another lens.
   Nothing answers this yet — `recommend` was named in an earlier draft and
   structurally cannot, since it proposes next steps rather than shaping the
   current one. The strict scan is the strongest candidate.
2. **The thinking field is reachable only by failing**, so a learner doing well
   is a learner being taught less.
3. **The skip has no way to tell difficulty from indifference**, and its
   threshold is a guess.
4. **The `null` / `true` / `false` contradiction with `lib/classifying` is
   reconciled in prose and nowhere in the surface**, where the learner meets it.
5. **Keyboard cost scales with the picker**, and ten options per element is a
   different exercise by keyboard than by mouse.
6. **The reward is motion**, and reduced-motion learners have none.
7. **When the machinery breaks, the learner is told the curriculum is empty.**
   If the embodiment's input-element derivation defects, this lens declines —
   and because it is currently the only lens of its phase, the phase is drawn as
   having nothing to study: _nothing studies this phase yet_. The learner is
   told something false about the curriculum when what actually failed was the
   instrument. This is Journey 4's doubt arriving from the other direction — not
   a contradiction between two true readings, but a plain untruth — and the
   caption belongs to the orchestrator rather than to this lens, so this
   document records the cost rather than proposing the fix.

None of the first six is a bug, and all six are the shape of the exercise —
which is what a design review is for. **The seventh is the exception twice
over**: it is a defect rather than a shape, and the fix belongs to the
orchestrator rather than to this lens; and it is a cost this lens's design
**accepts** (human ruling 2026-08-19) rather than a tension it leaves open. It
also has no journey above, because in that state the learner never reaches this
lens — there is no one to write from where they sit.

## Navigation

- The lens: [`../README.md`](../README.md) — what it is and what it teaches.
- Its sibling twin document: [`wireframes.md`](./wireframes.md) — the
  arrangement these journeys move through.
