<!-- cspell:ignore behaviour spellme unbuilt wireframes -->

# user journeys — orchestrate

The second third of the user twin: the readers in [`personas.md`](./personas.md)
moving through the instrument, written from where they sit. Not a specification
— the region [README](../README.md) is that. This document exists so the thing
most likely to be wrong about the arrangement can be wrong on paper first.

**What is most likely to be wrong here is what the instrument communicates while
nothing is happening.** Every behaviour this region has is covered by tests and
verified in a browser; the settle loop, the pane swap, the mask and the dispose
paths are all pinned. None of that says whether a learner looking at the band
knows where the machine is, whether four empty phases read as a lesson or as a
breakage, or whether leaving the editor feels like a decision or a loss. So the
journeys are written with a clock, and the places where the author does not
believe his own design are marked **⚠ doubt**.

**These journeys are deliberately arrangement-neutral.** They name a control
only where that control is already contract — the editor, the Edit code button,
the Generate code button, the level selector, the two toggles, the guide. Where
a learner reaches for a way to study a phase, the journey says so and does not
say what they touch. That began as a requirement of the comparison — a journey
that presumed a shape could not have judged between candidates — and the
comparison is now over. It is kept for the reason that outlives it: these
journeys describe what a learner is trying to do, so they stay usable against
whatever the region becomes, and they can judge the next arrangement too.

Seven journeys. Two of them — the keyboard and the screen reader — exist because
this region has three recorded defects that only those readers meet.

## Journey 1 — the program that never leaves the editor

A learner pasted a program they found. They have no intention of opening
anything; they want it to work.

**0:00 — the instrument arrives.** Their code is in the editor, which is where
they expected it. Above it sits a band they have not read. They start typing.

**0:20 — they break it.** A missing brace. Typing settles, and the instrument
changes above them: something in the band now says the machine stopped, and
where.

This is the moment the whole arrangement is judged for this learner, and it is
judged on one question: **can they find the sentence that tells them what to
fix, without having read anything else first?** They are not curious about the
lifecycle. They have an error and they want its location.

> ⚠ **doubt.** The cause the instrument shows them is the parser's own message —
> `Unexpected token (2:8)` — and the package's story says the parse phases
> "speak the parser's own voice" with "a learner-worded explanation" beside it.
> The learner-worded half does not exist; only the raw message does. So this
> journey's most important moment currently delivers machine text to someone who
> came for help, and no arrangement fixes that — it is copy that has to be
> written, by someone who knows what the parser means.

**0:35 — they fix it.** The band settles back. Whatever it said about the break
goes away.

**1:10 — they leave.** They never opened a phase, never selected a level, never
read the guide. **This is a complete and successful journey**, and any
arrangement that makes it feel incomplete — a progress affordance, an unopened
phase drawn as an omission, a nudge — has broken the package's own rule that the
fade is pull and not push.

**What this journey asks of an arrangement:** that the break is legible to
someone who never read the band, and that nothing in the band implies the
learner owes it attention.

## Journey 2 — the empty middle

A learner in the Frogrammer's posture. They came because someone told them this
thing shows you what the machine does with your code.

**0:00 — five phases.** They read them in order: source, tokens, ast,
environment, evaluation. This is the moment the package's central claim lands or
does not — that the lifecycle **is** the interaction model, five real steps a
program moves through.

**0:15 — four of them have nothing in them.** Only `source` offers a way to
study. The other four are real phases of a real machine with nothing yet to
open.

**This is the load-bearing moment of the entire revamp.** Two readings are
available and the arrangement decides which one the learner gets:

- _"Spelling, grammar, names, and running are four distinct things the machine
  does, and this tool can only help me with the first one so far."_ — true,
  honest, and itself a lesson.
- _"Four of these are broken."_ — false, and corrosive, because it teaches the
  learner to distrust the instrument on their first screen.

Nothing about the underlying data distinguishes them. **The whole difference is
arrangement and copy.**

> ⚠ **doubt.** The author does not know which reading a learner gets, and cannot
> know it from a document. This is the single question most worth putting in
> front of a real learner at a running dev server, and it is the one the
> wire-frames are least able to settle on their own — an empty container drawn
> in ASCII looks deliberate in a way an empty container on a screen may not.

**0:40 — they open the one that has something.** From here they are in
Journey 3.

**What this journey asks of an arrangement:** that an empty phase reads as a
named step of the machine with nothing yet to open, and never as a control that
failed.

## Journey 3 — the excursion

The same learner, opening a way to study the source.

**0:00 — the editor goes away.** This is by design and by ruling: in editor mode
the learner authors, in lens mode they exercise a disposable practice surface
over a program that cannot move underneath them. The cost is deliberate — they
cannot type while the surface reacts.

**The question this journey exists to ask is whether that cost is felt as a
commitment or as a loss.** Those are the same mechanic and opposite experiences.
A commitment is "I have put my code down to go and work on it". A loss is "where
did my code go".

**0:02 — the two seconds that decide it.** Nothing currently marks the
transition. The editor's subtree unmounts, a different subtree appears lower in
the document, the page's height changes, and the only evidence that this was
intentional is that a button labelled Edit code has appeared where Generate code
used to be.

> ⚠ **doubt.** The author believes a permanent line naming what the pane is
> holding would convert loss into commitment for almost nothing, and is aware
> that believing it is not knowing it. It is also possible the swap is fine and
> the real complaint is only the height change.

**2:30 — they come back.** Edit code. Their edits survived, which they had no
particular reason to doubt but also no evidence for.

**2:35 — they change the snippet type instead.** The excursion closes under
them, because a derivation-context change never happens beneath an open surface.
From the machine's side this is a correctness guarantee. From the learner's side
**a thing they were working on disappeared because they touched an unrelated
control**, and nothing explained the connection.

**What this journey asks of an arrangement:** that the pane is a named place a
learner moves between, not an anonymous box whose contents change; and that a
commit which closes an excursion says it did.

## Journey 4 — strict, and the code steps outside

A learner who selected a level and turned on strict, deliberately, because they
want to stay inside it.

**0:00 — fits.** The selector says so.

**0:10 — they look for it where they are working, and it is not there.** They
selected a level to be told when they leave it, so they look at the code they
are typing. Nothing is marked. The mark lives in one place — the selector's
closed face, up in the band, away from the text it is a verdict about — and the
learner has to keep glancing at a control to learn something about a line.

This is the region's documented design and it is not yet built: the level's
violations are supposed to reach the editor's gutter as markers, orchestrator-
supplied, beside the code they judge. The seam that would carry them exists in
the documentation and not in the editor's contract, which today accepts only a
source string and an edit callback.

> ⚠ **doubt, and it bears on the arrangement rather than on the gap.** If the
> gutter existed, the band's mark would be a summary of something the learner
> can already see, and the case for spending band space on it would weaken
> considerably. **The arrangement is being chosen in the absence of the surface
> that would most change what the band is for**, and no drawing can compensate
> for that. Recorded here rather than in the wire-frames because it is a
> statement about what the learner does not receive, which is a journey's
> business.

**0:30 — they write something the level does not admit.** The study surfaces
cover. The editor stays live, as does every control whose change could restore
conformance.

**The question is whether _covered_ reads as paused or as broken.** The design's
whole claim is guardrail-up rather than scaffolding-down: nothing was taken
away, the boundary is explained, and the learner can lift it at any time. If the
covered state reads as punishment, the claim is false in experience whatever the
architecture says.

**0:35 — they read the blocked sentence.** It names the level and the first
violation. This is the copy doing the entire job of keeping "guardrail" honest,
and it is one sentence.

> ⚠ **doubt.** Under this posture, three things are simultaneously true and hard
> to hold: the editor is alive, the study surfaces are covered, and the way back
> is one click. A learner who reads "covered" as "locked out" will reach for the
> strict toggle to escape rather than for the code to conform — which lifts the
> guardrail and teaches the opposite of the lesson. The author does not know
> which reach is more natural and suspects it depends almost entirely on where
> the two controls sit relative to the covered region.

**1:20 — they break the parse instead.** Now the level says it cannot judge.
Nothing is covered; the parse phases stay available. **A typo never reads as a
level violation** — and this carve-out is invisible unless the arrangement makes
"cannot judge yet" a visibly different state from "does not fit", rather than a
third shade of the same mark.

**What this journey asks of an arrangement:** that the four level states are
four legible states and not one control with four strings, and that the way back
to conformance is nearer to hand than the way out of the guardrail.

## Journey 5 — by keyboard only

Sighted, no mouse. Everything below is reachable today; the question is what it
costs and what it does by accident.

**0:00 — they tab into the instrument.** They traverse the band left to right,
which is also the order the machine works in, which is a small piece of luck the
arrangement should not squander.

**0:12 — the accident.** Moving through the controls that offer ways to study a
phase, **a study surface opens.** Not on a choice — on the traversal itself. The
editor goes away. They were not going there.

This is a defect of the scaffolding standing today, not a property any
arrangement has to inherit: the current pickers are native selects, whose value
changes as they are traversed, and each change commits. **Every candidate
abolishes that control**, so none of them can be scored against this moment —
which is exactly why it is written as a requirement below rather than as a
comparison. It is recorded because it is real, because it is live right now, and
because it is a defect only this reader meets: with a mouse the same control
commits only on a choice.

The requirement it produces outlives the defect. Opening a study surface is
called an explicit pedagogical commitment throughout this region's
documentation, and any control that commits while being passed over turns that
sentence into a fiction.

**0:20 — they get back.** Edit code, which is where it should be — never
covered, always present while the editor is away.

**0:25 — and now they are nowhere.** After the pane swaps, focus is on the
document body. The next Tab starts them at the top of the page, outside the
instrument entirely. Every excursion costs a full traversal home.

> ⚠ **doubt.** The fix — move focus into the pane on open, and back to whatever
> opened it on close — is standard and cheap. What is not obvious is where focus
> should land when a control the learner did **not** aim at the pane closes an
> excursion under them, as the type toggle does in Journey 3. Returning focus to
> the toggle they just used is defensible; so is putting it in the returned
> editor. The author has no principled answer and suspects only a real learner
> produces one.

**1:00 — they reach the guide.** The cost of getting there grew with the size of
the kit, because everything the kit offers sits between them and it.

**What this journey asks of an arrangement:** that no traversal commits
anything; that focus lands somewhere meaningful after every swap; and that the
distance to the far end of the band does not scale with how many lenses exist.

## Journey 6 — through a screen reader

The same instrument, heard rather than seen. This journey is separate from
Journey 5 because sight was doing more work than it looked like.

**0:00 — orientation.** They look for structure to jump between and find almost
none: the instrument's only headings belong to the guide at the very bottom, and
at least one of its regions has no accessible name, so neither heading nor
landmark navigation reaches the study surfaces. They arrive by linear traversal
or not at all.

**0:30 — they reach a phase with nothing in it.** They hear a dead control and
no reason for it. The _barred_ phase, by contrast, carries its cause. **The
common case is served worse than the exceptional one**, which is the wrong way
round.

**0:45 — they open a way to study the source.** The editor unmounts; a surface
mounts elsewhere in the document. **Nothing is announced.** No live region fires
— this region's internal event bus has no subscribers at all, so the swap is a
fact known only to the code. Focus has not moved either. They cannot tell the
editor is gone, and they will discover it by traversing to where it used to be.

**1:30 — they trip the mask.** The study surfaces go inert beneath them. The
sentence explaining why is marked as a status message, but the whole region
carrying it is mounted with its text already in place — the pattern screen
readers reliably do not announce. **So the most important sentence in the
instrument arrives in silence, at the exact moment surfaces stopped
responding.**

> ⚠ **doubt.** Every gap above is fixable and three of them are already absorbed
> into this campaign. What this journey cannot tell anyone is whether an
> announced instrument is a _pleasant_ one — announcements that fire on every
> settle would be worse than none, and the settle fires whenever typing pauses.
> The line between "narrate the swap" and "narrate everything" is not drawn in
> this document and needs to be.

**What this journey asks of an arrangement:** that the swap and the blocked
state are both spoken; that an empty phase gives a reason; and that the
instrument offers some structure to traverse other than its own beginning.

## Journey 7 — asking the machine for a program

A learner who opens the generator. Today it answers from a placeholder that
never pretends a model ran; this journey is written for when a real local model
sits behind it, because that is what the pacing will actually be.

**0:00 — Generate code.** The editor is replaced, exactly as a lens replaces it.
Their buffer is there as a read-only seed — the ask is a remix of what they
already wrote, not a blank page.

**0:05 — they write a prompt and ask.** A warning already told them this takes a
while and that leaving ends it.

**0:08 — the wait begins, and it is a different kind of wait.** With a real
model the first ask may spend a long time not generating anything: probing what
the device can run, then downloading a model measured in hundreds of megabytes.
The current staged reports — _getting the generator ready_, then _writing a
program_ — were written against a placeholder that takes under a second.

> ⚠ **doubt, and it is the reason this journey is here.** A stage label that is
> honest at 800ms may be a lie at four minutes. "Getting the generator ready"
> with no indication that it is fetching something large, no sense of how far
> along it is, and a cancel whose consequence — losing the download — is
> invisible, is a worse experience than no generator. The twin cannot settle
> this: nobody has watched a learner wait for this model. What the twin can do
> is refuse to let the arrangement assume the wait is short.

**0:12 — it refuses.** The device cannot run a model in a browser. The refusal
says so and says what would work instead.

**This is the honest failure and the arrangement must keep it honest.** A
refusal that reads as a bug invites the learner to retry forever; one that reads
as a fact about their device lets them move on.

**4:30 — on another device, it answers.** A candidate, previewed, with a line
saying what produced it. They accept, and it lands in the editor through the
same intake their own typing uses — so everything re-derives from it exactly as
if they had written it.

**What this journey asks, and of whom:** that a wait of unknown length is drawn
as one, that cancelling names what it costs, and that a refusal is a fact rather
than an error. **None of the three is the band's** — they belong to the
generator's own surface, which documents itself. They are stated here because
this twin is where the learner's experience of waiting is written down, and
handed across explicitly so they are not left ownerless by a document that
cannot act on them.

## One thing every journey above assumes, which is not currently true

Each journey treats what the band shows as a faithful report of what the machine
did. There is a recorded case where it is not: when the spelling stage fails,
the contract and a passing unit test both say the grammar phase is barred too,
and the rendered panel leaves it open
(`.planning-handoffs/generator-occupant/FLAG-ast-not-barred-by-tokens-failure.md`).

It is recorded here rather than fixed here — it is a derivation defect in
another region and this campaign does not own it. But it bears directly on the
arrangement, and in an uncomfortable direction: **the better the arrangement
gets at rendering the machine faithfully, the more clearly it will render this
falsehood.** A design goal of this revamp is that the UI shows what the
embodiment says; where the embodiment is wrong, that goal is a magnifier.

## What this document is asking of the design review

1. **Journey 2 is the one that decides the revamp**, and it is the one a
   document cannot answer. Four empty phases either teach the shape of the
   machine or read as breakage, and only a learner at a running dev server
   settles it. Every arrangement should be judged against this journey first.
2. **Journey 1's most important moment delivers parser text to someone who came
   for help.** The learner-worded explanation the package promises does not
   exist. That is copy, not layout — but no arrangement can succeed at Journey 1
   without it, so someone owes it.
3. **Journey 3 asks whether a deliberate cost is felt as one.** If the pane swap
   reads as loss rather than commitment, the ruling that created it is still
   right and its presentation is still wrong, and those need to be judged
   separately.
4. **Journey 4 contains a trap the author cannot see around**: if the way out of
   the guardrail is easier to reach than the way back into conformance, strict
   teaches escape. That is a geometry question, and the wire-frames should be
   asked it explicitly.
5. **Journeys 5 and 6 are the only ones describing defects rather than
   uncertainties.** They should be read as requirements, not as observations.
6. **Journey 7 is written about an instrument that does not exist yet** — no
   model runs behind the socket today. Designing its pacing now is a bet that
   the wait will be long. The author thinks that bet is safe and notes that it
   is still a bet.
7. **No journey here is the author's.** Every one is written by someone holding
   the whole design in their head, which is the one reader who can never have
   these experiences.

## Navigation

- The region: [`../README.md`](../README.md) — what the orchestrator renders.
- Sibling twin documents: [`personas.md`](./personas.md) — who these readers are
  and what each needs made cheap; [`wireframes.md`](./wireframes.md) — the
  arrangements these journeys are used to choose between.
