<!-- cspell:ignore scanme spellme IdentifierName Punctuator NumericLiteral -->
<!-- cspell:ignore wireframes generalises -->

# user journeys — scanme

The user twin for this lens: an account of the learner in front of it, written
from where they sit. Not a specification — [`../README.md`](../README.md) is
that. This document exists so the thing most likely to be wrong about this lens
can be wrong on paper first.

**What is most likely to be wrong is the pacing, and it is a sharper risk here
than next door.** `spellme` at least asks a question on every element; this lens
asks nothing at all. Sixty elements is sixty presses of one button, and by the
sixth the learner has seen all three fates. Whether press twenty is still worth
making is not something a unit test can ever answer. So the journeys below are
written with a clock, and the places where the author does not believe his own
design are marked **⚠ doubt**.

Five journeys. Four learners and one who does not use a mouse — that last one is
here because `spellme`'s twin discovered a package-wide keyboard defect by
having it, and dropping it now would be unlearning that.

## Journey 1 — first contact

A learner who has written some JavaScript and has never once thought about how
the machine reads it. They opened the `tokens` phase because it was there.

**0:00 — the surface arrives.** Their program, whole, exactly as they wrote it.
Nothing is coloured. Below it, two buttons — and only one of them is there:
**step forward**. There is no back button yet, because there is nowhere to go
back to. A legend names three fates they have not seen yet.

Nothing is asked of them. This is the first thing the lens communicates, and it
communicates it by having no form.

**0:05 — the first press.** `const` changes. It is now marked as something that
became a token, and it is still exactly where it was — same column, same line,
same five characters. Nothing flew anywhere.

> ⚠ **doubt, and it is the inverse of `spellme`'s.** Over there the reward is
> motion: characters lift off one tape and land on another, and the twin calls
> that falling animation "the reward the whole loop is built around". This lens
> has **deliberately taken that away** — the whole argument for drawing in place
> is that the character stays put and proves something by not moving. So the
> reward is a colour change, which is a much quieter event than a fall. It may
> simply not be enough to press a button sixty times for. This is the single
> largest risk in the design and it is not resolvable on paper.

**0:12 — the second press, and the lesson.** The space after `const` is now
marked as having evaporated. **It is still on screen.** It did not go to a jar
and it did not fly away; it is greyed where it sits, and nothing anywhere
accounts for it.

That is the thing this lens exists to teach, and the learner met it on press
two. `spellme` cannot show them this at all — over there the cursor advances
past whitespace on its own while they are looking at their own answer.

**0:20 — `x`, then a space, then `=`, then a space, then `1`, then `;`.** Six
more presses. They have now seen all three fates and the rhythm is: press, look,
press, look.

> ⚠ **doubt, and the biggest one.** By press eight there is nothing new. Every
> remaining press confirms a rule the learner already holds — a letter run
> becomes a token, a space evaporates, a comment is set aside — and confirmation
> is not learning. `spellme` has the same shape and answers it badly (its own
> twin says claims six through fifteen "ask a lookup, not a question"), but
> `spellme` at least has a wrong answer available. **Here there is no wrong
> answer at all, so there is not even the friction of being asked.** The two
> candidate answers are both unbuilt: choose programs for this lens rather than
> letting it run on any program, or give the walk somewhere to arrive — which is
> what the stop does on a broken program, and what a whole program does not
> have.

**1:00 — the comment.** They reach `// hi`. It is marked set aside, in place.
They did not have to do anything, and it stayed visible — which is the same
lesson as the space, told the other way round: this one was kept.

## Journey 2 — the learner who steps back

**0:40.** They have pressed forward eleven times and they were not watching on
press nine. Something changed and they missed it.

**They press back.** The eleventh element un-reads, then the tenth, then the
ninth — and now the ninth is the current one again and they can see what became
of it. They press forward and watch it happen a second time, this time looking.

**That is what the back button is for, and it is the entire justification.** Not
undo, not correction — there is nothing to correct. **Re-watching a transition
you were not looking at.**

> ⚠ **doubt.** That is a thin justification for half the controls on the
> surface, and it is the author's own reasoning rather than anything observed. A
> learner may simply never press it. The counter is that a forward-only walk
> over your own program is a slideshow you cannot rewind, which is a strange
> thing to hand someone and call a study tool — but "it would be strange without
> it" is not evidence that it earns its place.

And one that is about the control's cost rather than its justification:

> ⚠ **doubt, and this one has a cheap fix nobody has costed.** Stepping back one
> element at a time is fine at position eleven and tedious at position sixty. A
> way to return to the start is the obvious missing control, and it is
> deliberately not in the DOM contract, because a third button on a surface
> whose whole claim is simplicity needs a better reason than "it would be
> convenient".

## Journey 3 — three blank lines, one press

**0:55.** Their program has a blank line between two functions, and above it a
run of indentation.

They press forward expecting the indent to go. **The entire indent goes at
once** — five spaces, one press, one greyed run. They press again and **both
line endings of the blank line go together**, as a single unit.

This is correct and it is what the machine did: the scanner takes a maximal run
of whitespace as one turn, and a maximal run of line terminators as another. The
lens is showing the truth.

> ⚠ **doubt, and it is a real one.** It does not _look_ like the truth. It looks
> like the lens skipped something, and a learner who has just been taught "one
> press, one thing the scanner read" now sees one press eat five characters and
> another eat two lines. The design's own claim — that a step is one turn of the
> machine — is exactly what makes this surprising, because a learner counts
> characters and the machine counts turns.
>
> The reversal exists: the scanning leaf notes that splitting a run's text per
> character recovers the specification's own reading.
> [`../README.md`](../README.md) refuses it, because drawing a partition no
> other consumer agrees with is worse. **So the fix, if there is one, is a label
> rather than a partition** — the surface saying "five characters, one turn" at
> the moment it happens. Nothing in the DOM contract carries that today, and
> inventing it here would be drawing a decision this document has no grounds
> for.

## Journey 4 — the learner whose program does not lex

They are mid-way through writing something and they left a string open. They
open the `tokens` phase to see what the machine makes of it.

**0:00.** The lens is offered — which is already the difference from `spellme`,
which would not be. The source is drawn whole, nothing coloured.

**0:10 — they walk.** `const`, space, `x`, space, `=`, space. Six presses, six
ordinary elements, exactly as on a working program. Nothing warns them.

**0:25 — the forward button is gone.** They pressed it and now it is not there.
Where the walk ended, the surface says the scan stopped here, and reports what
the machine said: _unterminated string constant_. The rest of their program sits
below, uncoloured, marked as never reached.

**They were not told at the start and they were not interrupted.** They walked
into it. The last thing they did before finding out was watch a perfectly
ordinary `=` become a token, which is the honest account of what the machine
did: it was fine, and then it was not.

> ⚠ **doubt.** A learner who opens a broken program and presses forward six
> times before learning it is broken may reasonably feel the lens wasted their
> time. The counter is that those six presses **are the answer to "how far did
> it get"**, and a banner at the top would replace an experience with a fact.
> The author believes the counter and records that he may be wrong about it,
> because the person best placed to say is a learner in a hurry.

And one that is about the arrangement rather than the pacing:

> ⚠ **doubt, sharper.** The walk ends at the account's extent and the machine's
> complaint points at an offset which may sit **later**. The characters in
> between belong to the turn that failed — they are neither walked nor plainly
> "never reached". Nothing in the arrangement distinguishes them today, and a
> learner asking "so what happened to _those_ characters?" is asking a good
> question the surface cannot answer.

## Journey 5 — the learner who does not use a mouse

They arrive by keyboard. They tab to the forward button and press it. They keep
pressing it. That is the entire interaction.

**It works, and this journey is the cheapest one in the family to satisfy** —
two buttons, no picker, no stepper, no drag, nothing positional. Where
`spellme`'s twin records that ten kind buttons cost a keyboard learner ten tab
stops on every single element, this surface costs them one key, repeated.

⚠ **Two things carried over from `spellme`'s findings rather than
rediscovered.** In a default macOS Safari **no** button is reachable at all —
its tab order excludes buttons until a preference is changed — which is
package-wide and not this lens's defect, and which `spellme`'s Journey 5 found
first. And the current element carries `aria-current`, so a screen reader can be
told which element is current — but **an attribute is not an announcement**:
`spellme`'s verdicts region is contracted as `aria-live` and carries no text
content, so it announces nothing, and this lens must not repeat that mistake by
assuming an attribute speaks.

> ⚠ **doubt.** What a screen-reader user actually hears when the position moves
> is undesigned. `aria-current` marks the element; nothing says the fate out
> loud. A surface whose entire content is a colour change is a surface with no
> non-visual content at all unless something is written for it, and nothing has
> been.

## What this document is asking of the design review

1. **The reward is a colour change**, where the sibling's is motion, and this
   lens gave up the motion on purpose. Journey 1's doubt is the largest risk in
   the design.
2. **Confirmation sets in around press eight** and nothing in the lens answers
   it. Both candidate answers — curating programs, or giving the walk somewhere
   to arrive — are outside what is being built.
3. **The back button's justification is thin** and is the author's reasoning
   rather than an observation.
4. **Run collapsing looks like a skip.** The fix is a label, not a partition,
   and no label is contracted.
5. **The element kind is in the DOM and not on the surface.** Every span carries
   `data-element-kind`, so the sequence's best content — that `const` and
   `myVar` are the same kind of thing, and so are `null`, `true` and `false` —
   is present in the markup and invisible to the learner. Naming the current
   element's kind would cost one line of the arrangement. It is deliberately not
   in the DOM contract, because whether this lens teaches the vocabulary or only
   the destinations is a scope question rather than a layout one.
6. **The characters between the extent and the reported offset** are drawn as
   though they were never reached, and they were not exactly never reached.
7. **Nothing is designed for a screen reader** beyond `aria-current`.

None of the first four is a bug; they are the shape of an exercise that asks
nothing, which is what a design review is for. **Items 5 and 7 are different** —
each names something the surface could carry and does not, and each is cheap.

## Navigation

- The lens: [`../README.md`](../README.md) — what it is and what it teaches.
- Its sibling twin document: [`wireframes.md`](./wireframes.md) — the
  arrangement these journeys move through.
