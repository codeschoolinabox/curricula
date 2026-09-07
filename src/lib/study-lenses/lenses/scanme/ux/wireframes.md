<!-- cspell:ignore scanme spellme wireframes IdentifierName Punctuator -->

# wireframes — scanme

The spatial half of the user twin. [`../README.md`](../README.md) says what each
region holds; this says where it sits and why, because the arrangement is
carrying the pedagogy here rather than merely presenting it.

**One claim the whole layout rests on:** the program is drawn **once** and never
redrawn. Every character stays in the column it started in, for the whole
session. What changes is how each one looks — and because nothing moves, a
learner can trust that a character which now looks spent is the same character
they were reading a moment ago.

⚠ **This is the arrangement risk, stated up front.** `spellme` spreads three
fates across three regions — a tape, a token tape, a jar — so a character's fate
is legible from **where it is**. This lens has one region and no destinations,
so a fate has to be legible from **how it looks**, and it has to be legible
_simultaneously_ with a standing. Three fates times three standings is up to
nine states in one strip of text. Whether that is readable is the question this
document exists to worry at, and it is not settled below.

## Fresh mount — position 0

```text
+------------------------------------------------------------+
|  scanme                                                    |
+------------------------------------------------------------+
|                                                            |
|  const x = 1; // hi                                        |
|                                                            |
|  nothing has been read yet                                 |
|                                                            |
+------------------------------------------------------------+
|                                        [ step forward > ]  |
+------------------------------------------------------------+
|  the three fates                                           |
|    solid    became a token                                 |
|    dotted   set aside, and kept                            |
|    hatched  evaporated                                     |
+------------------------------------------------------------+
```

**The program is plain.** Not greyed, not dimmed, not "pending" — plain, exactly
as the learner wrote it. Position 0 is the only state in which this surface
shows no reading at all, and it is the baseline every later state is read
against.

**There is no back control**, because there is nowhere to step back to. It is
absent rather than disabled: presence is the state, as everywhere else in this
family.

**The legend is open**, not collapsed. `spellme` draws this contrast
deliberately — its own legend is open because it "explains the answer
vocabulary, which they cannot [ignore]", while its fates panel is a collapsed
`<details>` because "a learner can play without the destinations". Here the
destinations **are** the content: a learner who cannot tell hatched from dotted
is looking at a coloured-in program and learning nothing. So the fates get the
open treatment `spellme` gives its vocabulary.

> ⚠ **doubt.** A legend the learner must consult on every element is a legend
> that has failed. The three fates want to be self-evident from the drawing —
> evaporated should _look_ gone, set aside should _look_ kept — and if they
> were, the legend would be a courtesy rather than a dependency. Whether that is
> achievable in text styling alone is a running-surface question.

## Mid-walk — position 6

```text
+------------------------------------------------------------+
|                                                            |
|  const x = 1; // hi                                        |
|  #####^^^###^                                              |
|       |     |                                              |
|       |     +-- read, evaporated                           |
|       +-------- read, became a token                       |
|                                                            |
+------------------------------------------------------------+
|  [ < step back ]                       [ step forward > ]  |
+------------------------------------------------------------+
```

The row of markers under the source is **notation for this document only** — it
is not a second row on the surface. The real surface carries the state on the
characters themselves.

**Both controls are present**, because there is somewhere to go in both
directions. The forward control disappears at the end of the walk and the back
control at position 0; neither is ever greyed out.

**The current element is the one most recently read**, not the one about to be.
That is what makes a press feel like an answer rather than a prompt: you press,
and the thing you pressed for is what lights up.

> ⚠ **doubt.** The current element needs to be distinguishable from the other
> already-read elements **as well as** carrying its own fate, which is a fourth
> visual dimension on a strip that already has two. An outline or an underline
> is the obvious answer and it collides with whatever hatching the evaporated
> fate uses.

## The moment the whitespace goes

```text
       before                          after
  const x = 1;                    const x = 1;
       ^                               ^
  the space is plain              the space is hatched,
  and unread                      and still occupies its column
```

**This is the lens working, and it is one press.** The space did not move, did
not vanish, and did not go anywhere that could account for it. It is marked as
having evaporated while remaining exactly where it was written.

**That is the whole argument for drawing in place**, and it is inherited from
`spellme`'s own twin, which reaches the same conclusion and then records that it
cannot deliver on it: "a deleted character is gone and proves nothing; a dimmed
one that appears in no container below is the evidence" — followed by the doubt
that its learner "is not looking at it". Here they are.

> ⚠ **doubt.** A hatched space is a very small drawing. Hatching reads on a run
> of five spaces and may read as nothing at all on one. If the single-space case
> is illegible, the lens's central moment is illegible, and the fallback —
> making the space visibly a symbol — changes the characters on screen, which
> this arrangement's whole claim forbids.

## A comment, set aside in place

```text
  const x = 1; // hi
               ......
               set aside, and kept
```

Dotted rather than hatched, and **not moved to a jar**, because there is no jar
here. `spellme` earns its jar by having somewhere for claimed elements to fall;
this lens has nowhere for anything to fall, so "kept" has to be drawn rather
than located.

> ⚠ **doubt, and it is the one place this lens is plainly weaker than its
> sibling.** `spellme`'s jar "stays visible and is never emptied", so at the end
> of a session a learner can see everything the scanner set aside, collected.
> Here the set-aside elements stay scattered through the source in their
> original positions, and there is no view that gathers them. The counter is
> that gathering them is exactly the move this lens refused — but "we refused it
> on principle" is not the same as "the learner loses nothing".

## The stop — a program that does not lex

```text
+------------------------------------------------------------+
|                                                            |
|  const x = 1; "                                            |
|  #####^^^###^ ^                                            |
|                                                            |
+------------------------------------------------------------+
|  [ < step back ]                                           |
+------------------------------------------------------------+
|  the scan stopped here                                     |
|  the machine said: unterminated string constant            |
+------------------------------------------------------------+
|  the three fates ...                                       |
+------------------------------------------------------------+
```

**The forward control is gone**, which is how the learner finds out. There is no
banner, no warning at mount and no interruption mid-walk: the walk simply runs
out, and the explanation is waiting at the position they arrive at.

**The stop sits below the source, where the forward control used to be reachable
from** — so the place the learner was pressing is the place the answer appears.

**The remainder is drawn as reached by nothing.** Not as a fourth fate — it has
no fate, because no element covers it. Whatever the styling is, it must not be
one of the three, or the surface will have taught that the machine decided
something about those characters when it did not.

> ⚠ **doubt, and it is the sharpest open question in this document.** There are
> **two** boundaries in that source and this frame draws one. The walk ends at
> the account's own extent; the machine's complaint points at an offset which
> may sit **later**; and the characters between them belong to the turn that
> failed. Drawing them as "never reached" is not quite true and drawing them as
> walked is plainly false. A third treatment would be a fourth thing on a strip
> that already carries too many. **No frame here draws it, because the author
> does not know what it should look like.**

## The empty prefix — a program that fails on its first character

```text
+------------------------------------------------------------+
|                                                            |
|  "hello                                                    |
|                                                            |
+------------------------------------------------------------+
|                                                            |
+------------------------------------------------------------+
|  the scan stopped before it read anything                  |
|  the machine said: unterminated string constant            |
+------------------------------------------------------------+
```

**No spans, no controls, and the surface is the stop.** This is a real state —
the account is published on every tokens failure, and a stop before any complete
turn yields empty channels — and it is the one arrangement in which this lens
draws no walk at all.

**It is not an error state and it is not empty.** "The scanner read nothing
before it gave up" is a complete and useful answer to the question the learner
opened this lens to ask, and the arrangement should read as that answer rather
than as a lens that failed to load.

## What has no wireframe, deliberately

**The hues.** The three fates carry a non-hue signal each — solid, dotted,
hatched — so the surface reads without colour at all, and that is what these
frames draw. Which hues sit on top resolves through CSS custom properties, and
the package-wide palette question is not this lens's to settle. `spellme` defers
the same decision for the same reason.

**Whether standing and fate can share a strip.** The nine-state problem named at
the top of this document is the arrangement's central risk, and ASCII cannot
answer it: drawing nine plausible cell treatments here would fix a decision on
the strength of a picture that cannot show line weight, opacity or texture. It
wants a running dev server and a sandbox checkpoint.

**Any transition.** Whether a colour change needs an animation to be noticed —
Journey 1's largest doubt — is the same class of question. `spellme` deferred
its falling animation to a checkpoint for exactly this reason, and its own
record shows the checkpoint earning it: three of that campaign's findings were
only visible to a human looking at the running surface.

**Naming the current element's kind.** [`user-journeys.md`](./user-journeys.md)
item 5 raises it: every span carries `data-element-kind` and no frame here shows
it, because whether this lens teaches the vocabulary or only the destinations is
a scope question rather than a layout one. If it is ever answered yes, the space
for it is beside the stop region and these frames do not reserve it.

## Navigation

- The lens: [`../README.md`](../README.md) — what each region holds.
- Its sibling twin document: [`user-journeys.md`](./user-journeys.md) — the
  learner moving through this arrangement, with a clock.
