<!-- cspell:ignore Punctuator IdentifierName NumericLiteral munch -->
<!-- cspell:ignore wireframes colour spellme -->

# wireframes — spellme

The spatial half of the user twin. The README says what each region holds; this
says where it sits and why, because the arrangement is carrying pedagogy here
rather than merely presenting it.

**One claim the whole layout rests on:** the learner should be able to see, at a
glance and without reading anything, that the source is being _spent_. What
leaves the top must be accounted for below — or visibly not accounted for, which
is the lesson about whitespace.

## Fresh mount

```text
┌────────────────────────────────────────────────────────────┐
│  spellme                                          ⓘ fates  │
├────────────────────────────────────────────────────────────┤
│  INPUT                                                     │
│  ▏const x = 1; // hi                                       │
│  ▲                                                         │
│  the cursor sits before the first character                │
├─────────────────────────────┬──────────────────────────────┤
│  TOKENS                     │  SET ASIDE                   │
│  (empty)                    │  (empty)                     │
└─────────────────────────────┴──────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│  what is the next input element?                           │
│                                                            │
│  kind   [IdentifierName][PrivateIdentifier][Punctuator]    │
│         [DivPunctuator][RightBracePunctuator]              │
│         [NumericLiteral][StringLiteral]                    │
│         [Template][TemplateSubstitutionTail]               │
│         [RegularExpressionLiteral]                         │
│                                                            │
│  extent   [ − ]  5 characters  [ + ]                       │
│           (or drag across the source above)                │
│                                                            │
│                                             [ claim it ]   │
└────────────────────────────────────────────────────────────┘
```

**No snippet-type control lives here.** The reading does depend on the goal —
`a<!--b` is two elements as a script and five as a module — but the
orchestrator's own type toggle is always visible beside the lens and disposes
the lens when changed. A second copy inside a read-only surface would duplicate
orchestrator-owned state and be drawn as a control that destroys the surface
hosting it.

**The extent is a stepper, and dragging is the second way to reach it.** The
value is a small integer and the count is already on screen; a stepper is
keyboard-native and testable without a browser, where drag is neither.

> ⚠ **doubt.** Ten kind buttons is a lot of surface for the first thing a
> learner sees, and it front-loads vocabulary before any of it has been used.
> The alternative — reveal kinds as they first become correct — would teach the
> vocabulary in the order the program needs it, at the cost of hiding the shape
> of the answer space. It also costs a keyboard learner ten stops on every
> element, which the journeys raise and this arrangement does not solve.

## Mid-stream

```text
┌────────────────────────────────────────────────────────────┐
│  INPUT                                                     │
│  ░░░░░░░░░░ 1; // hi                                       │
│            ▲▁▁                                             │
│            the proposed extent                             │
├─────────────────────────────┬──────────────────────────────┤
│  TOKENS                     │  SET ASIDE                   │
│  [const] [x] [=]            │  (empty)                     │
│   ident    ident  op        │                              │
└─────────────────────────────┴──────────────────────────────┘
```

Consumed source stays in place, dimmed, rather than scrolling away. The tape
does not move; the boundary between spent and unspent does. A learner can always
see how far in they are without a progress bar, and the two spaces that
evaporated around `x` are still visible as dimmed characters that never arrived
anywhere below.

**That is the whole argument for dimming rather than deleting.** A deleted
character is gone and proves nothing; a dimmed one that appears in no container
below is the evidence.

> ⚠ **doubt.** It is also the argument for making the evaporation loud at the
> moment it happens — the standing evidence is passive, and a learner watching
> their success land on the token tape is not looking at it.

## After a wrong claim

```text
│  extent  ▁▁          1 character                           │
│                                                            │
│          kind    ✓ IdentifierName                          │
│          extent  ✗                                         │
│                                            [ claim it ]    │
```

Verdicts sit against the fields they judge, not in a banner. The learner reads
_which half was wrong_ without parsing a sentence, and reasons about one thing.

Nothing about the correct answer appears — not the right extent, not a hint, not
a nudge toward longer or shorter. The element simply did not move.

## After the second wrong claim — one more character

```text
│  extent   [ − ]  2 characters  [ + ]                       │
│                                                            │
│  on the stepper  ++                                        │
│  one more        +++                                       │
│    ( ) still a Punctuator                                  │
│    ( ) a different kind                                    │
│    ( ) not an element here                                 │
│                                            [ claim it ]    │
```

The field opens **below** the extent, pushing the button down, so the surface
visibly grows a new requirement rather than swapping one in. The learner should
feel the exercise get harder, not feel that it changed.

The text at the **current stepper value** and the one-character-longer text are
shown **stacked and aligned**, so the extra character is the only thing that
moves between the two lines. The question is about that character and the layout
says so before the words do.

**It tracks the stepper, not the last submission**, so stepping the extent
re-asks the question and clears whichever radio was selected. The learner is
reasoning about the boundary they are proposing now; a question frozen at their
last wrong answer would be about somewhere they have already left.

## After the fourth wrong claim — the way past

```text
│                        [ claim it ]   [ let the machine ]  │
```

The skip appears **beside** the claim button, not in place of it, and never
before `skipAfter` attempts. It is an equal-weight sibling rather than a
demotion: taking it is a legitimate move, and a control that looked like giving
up would teach that being stuck is a failure rather than a place.

A skipped element lands on the token tape drawn like any other but carrying
`data-claimed="false"` — the learner can see, at the end, which ones were
theirs.

## The jar, once it has something in it

```text
├─────────────────────────────┬──────────────────────────────┤
│  TOKENS                     │  SET ASIDE                   │
│  [let] [x] [=] [1] [;]      │  [// hi]                     │
│                             │  [/* … */] ⚑ carries a       │
│                             │            line break        │
└─────────────────────────────┴──────────────────────────────┘
```

The jar sits **beside** the token tape and at the same visual weight, not below
it and not smaller. Comments are not lesser output; they are output with a
different destination, and a jar drawn as a footnote would teach the opposite of
what the README argues.

The mark is a flag on the entry plus its own line of text, never colour alone.
It states the property — this comment carries a line break, and the grammar
reads it as one — and stops there.

(human ruling 2026-08-20) **Two elements carry the mark, and only one of them is
drawn here.** The jar entry above is the set-aside case. The other is a
**consumed line break**, which never reaches the jar — its fate is to evaporate
— and which the token tape marks instead, at the position the grammar read it.
Both say the same thing: a line break is read here. Neither says anything about
whether automatic semicolon insertion actually fired, which depends on the
production and which this lens does not know.

> ⚠ **doubt.** Two containers of equal weight, one of which is empty for most
> programs, is a lot of dead space. The honest counter is that an empty jar is
> itself information: this program set nothing aside.

## What has no wireframe, deliberately

**The falling animation.** It is the reward the whole loop is built around and
it cannot be drawn in ASCII. It wants to be designed at a running dev server,
against the sandbox checkpoint, not agreed in advance from a picture — and it is
the one element of this surface where the author would rather be surprised than
right.

**The consumed line break's mark**, and this one is owed rather than refused.
The ruling of 2026-08-20 says the token tape marks it; what that mark looks like
beside a row of tokens is not drawn, and drawing it in ASCII would fix a
decision this document has no grounds for. It is the same case as the falling
animation — settle it at the sandbox checkpoint, against a running surface. Two
constraints it must meet, both from the jar's mark above: never colour alone,
and it says a line break is read here and nothing about automatic semicolon
insertion.

> ⚠ **doubt.** A mark for something that evaporated may read as clutter on a
> tape whose whole job is showing what survived. The honest counter is that ASI
> is precisely the thing a learner cannot see and most needs to, and that a mark
> which appears only where the grammar reads a break is rare enough not to
> crowd.

**The declined state**, and for a sharper reason: there is no surface to draw.
When the embodiment's input-element derivation defects, applicability declines
and this lens is never mounted, so nothing on this page appears. What the
learner meets instead is the orchestrator's empty-phase caption, which says this
phase has nothing to study — and that is wrong, because what failed was the
instrument. See [user-journeys.md](./user-journeys.md) § What this document is
asking of the design review, item 7; the caption is the orchestrator's to fix.

## Navigation

- The lens: [`../README.md`](../README.md) — what each region holds.
- Its sibling twin document: [`user-journeys.md`](./user-journeys.md) — the
  learner moving through this arrangement, with a clock.
