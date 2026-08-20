<!-- cspell:ignore colour spellme wireframes -->

# personas — orchestrate

The first third of the user twin. The region [README](../README.md) says what
the orchestrator renders; this says **who is in front of it and what each of
them needs it to make cheap** — because the demands do not agree, and the
arrangement has to choose.

This document holds no clock and no screen. A persona that acquires a timeline
has become a journey; one that acquires a position has become a wire-frame. Both
are sibling documents here.

**Why this region owes personas at all.** The `spellme` lens declined to write
them, and said why: _"personas were not written because the reader in front of
this lens is the package's, not this lens's"_
([`../../lenses/spellme/README.md`](../../lenses/spellme/README.md)). That hands
the debt upward. It is paid here rather than at the package root because the
package is a body of program analysis and this region is the only place any of
it becomes something a person touches.

## The claim this document exists to make

The package README names two hats and says the environment never forces one. It
does not say what that costs. **It costs a band of pixels, and there is only
one.**

Most of what the orchestrator renders that is not the program sits above the
surface pane: the controls, the lifecycle, the level surfaces. Not all of it —
the proposals and the guide render below the pane, and the pane's own nameplate
sits between the band and the pane it names. But the band is the part with a
fixed cost at the top of every screen, which is what makes it the contested one.
The Frogrammer needs that band to be an instrument panel — legible at rest,
ordered, all five phases present whether or not anything can be opened in them.
The Vibetoader needs it to be out of the way, because every element they must
read before reaching a result is friction between them and the result.

Those are not two preferences to be balanced by a sensible middle. They are
**opposite demands on the same surface**, and an arrangement satisfies one by
spending the other. Naming the trade is this document's whole load; the
wire-frames are where it gets spent, deliberately, in the open.

**One correction to that claim, because the package already answers half of
it.** The Vibetoader is not served only by a small band — they are served by the
**initial-focus request**, a mount-time prop that drops a learner straight into
a study surface with the pane already occupied. Under a run-first focus the band
is scenery a learner passes on their way back to the editor, and its size
matters far less. So the trade is real but **asymmetric**: an arrangement that
spends the band on the Frogrammer costs the Vibetoader something the host can
already refund, while an arrangement that spends it on the Vibetoader costs the
Frogrammer something nothing refunds. That asymmetry is a reason to weight the
band toward orientation, and it is the strongest argument this document makes
about the arrangement.

Two honest limits on it. The refund is the **host's** to issue, not the
learner's, so it does not reach a learner who pasted their own code — the
package's central case. And the focus request's natural target is the run lens,
which does not exist yet, so today the refund cannot be issued at all.

## 🔬 The Frogrammer

Studies the machine. Predicts what a phase will do, opens it, compares the
prediction against what the phase shows. The lifecycle is not navigation to them
— it is the subject.

**What they need made cheap:**

- **Seeing all five phases at rest**, in the machine's own order, without
  acting. Their orientation question is "where is the machine, and is it
  healthy?", and it is asked continuously, not once.
- **Distinguishing _nothing to study here_ from _the machine stopped here_.**
  These are different facts about their program and today they render almost
  identically.
- **Reading the barring edge once.** It bars a suffix, never a scatter — one
  barring edge, one cause, everything downstream waiting — and an arrangement
  that repeats the cause per barred phase is telling them a single truth two or
  three times.
- **Predicting before opening.** Anything that opens a study surface as a
  side-effect of navigating toward it destroys the prediction they came to make.

**What they can afford:** a click to reach a station's kit. Their attention is
on the band; a disclosure costs them little.

## 🎨 The Vibetoader

Studies outcomes. Runs first, observes, iterates. The machine underneath is a
black box on purpose, and the lifecycle is scenery.

**What they need made cheap:**

- **The shortest path from a change to a result.** Every control they must read
  and reject on the way is a cost, and it is paid on every iteration, not once.
- **Getting back to the code.** They spend most of their time in the editor and
  leave it only to see something happen.
- **Not being told the machine is broken in five places.** When the parse
  breaks, they want the one sentence that says what to fix.

**What they can afford:** not knowing the phases exist, for a long time — the
fade is pull, not push, and a learner who never opens an early phase has not
failed at anything.

> ⚠ **doubt, and it is the largest one in this document.** The instrument cannot
> serve this persona today. Their path is the run lens in the `evaluation`
> phase, and there is no run lens — the package README and WORKFLOWS both
> narrate one, and `lenses/` does not contain one. So this persona is written
> against an intended instrument, and every wire-frame that claims to serve them
> is claiming it about a surface nobody has built. The honest consequence: the
> Vibetoader's needs may only be **testable** later, and an arrangement chosen
> now on their behalf is chosen on an argument, not on an observation.

## The reader who does not see the screen

Not an accessibility appendix. A reader with the same two hats as everyone else,
using the same instrument through a screen reader.

**What they need made cheap:**

- **Knowing the pane changed.** The editor unmounts and a lens mounts elsewhere
  in the document; nothing currently says so. This is the single largest gap
  between what the instrument does and what it communicates.
- **Hearing the blocked state.** When strict covers the study surfaces, the
  sentence explaining why is the most important thing on screen — and it is
  announced by a mechanism that very likely never fires, because the region is
  mounted with its text already in it.
- **A reason for an empty phase** — the station's own visually-hidden text,
  **not the caption**, which describes the rail as a whole and names no station.
  A phase with nothing to open should say that, not present as an unexplained
  dead control. Today the _barred_ phase is better served than the _empty_ one,
  which is backwards: the empty one is the common case.
- **Structure they can traverse.** The instrument's only headings are the
  guide's, and one of its regions carries no accessible name at all, so neither
  heading nor landmark navigation reaches the study surfaces.

**What they can afford:** length. A spoken label may be longer than a printed
one; the two do not have to be the same string.

## The reader who does not point

Keyboard-only, sighted. Overlaps the reader above and diverges from them exactly
where sight does the work.

**What they need made cheap:**

- **Never committing by accident.** Opening a study surface is an explicit
  pedagogical commitment in this region — the editor goes away. A control that
  commits while being _traversed_ rather than chosen turns that commitment into
  an accident, and today's picker does exactly that.
- **Landing somewhere after the pane swaps.** Focus currently falls to the
  document body, so the way back is a full traversal from the top.
- **A visible focus ring, in both tones.** One already exists and is the
  precedent to extend, not to replace: the editor draws a focus outline keyed to
  the host's own primary colour, with a written rationale beside it. Every other
  control in the region survives on browser defaults — and a stylesheet is
  precisely the moment those get removed by a blanket reset.
- **A traversal cost that does not grow with the kit.** Reaching the guide
  should not cost more keystrokes because someone added lenses.

## The author at the other end of the props

An educator or embedding site. They never see this instrument as a learner does;
their interface is the prop set, and their instrument is the mount.

**What they need made cheap:**

- **Failing at their own desk.** A name or key collision is loud at mount, on
  purpose — the failure they must never get is a silent shadowing discovered by
  a learner.
- **Trusting that a default is a default.** Every choice they seed — level,
  posture, type, focused lens, configuration — is overridable by the learner,
  and they need that to stay true, because it is the thing they might otherwise
  try to work around.

**What they must never be given:** a lock. There is no author-side lock anywhere
in this surface and the revamp must not invent one — a "start here" that cannot
be left, a phase hidden because the author thought it too advanced, a control
disabled by configuration.

## Who this instrument is not for

Named because a well-meant revamp reaches for these, and each would be a
category error rather than a feature:

- **The grader.** No progress, no completion state, no score, no report. Nothing
  in the band should read as an assessment of the learner — a phase they have
  not opened is not a gap, and a level their code does not fit is not a failure.
- **The sequencer.** Nothing here says what to study next _after_ this program.
  A recommendation inside the instrument proposes a next **lens**, never a next
  **snippet**.
- **The observer.** Nothing leaves this region, and no session choice outlives
  the session — so no arrangement may depend on remembering what this learner
  did last time, and none may render an affordance whose only purpose is to be
  reported. Stated as a constraint on the arrangement rather than on the
  package: a sibling region exists whose stated job is to gather and report use
  patterns, and reconciling that with the package's own "no telemetry channel
  leaves the study surface" is not this twin's to do. What binds here is
  narrower and unaffected by how that resolves — **the band answers to the
  learner in front of it, never to a reader elsewhere.**

## The four audiences — readers of the output, not users of the instrument

Distinct from everything above, and kept here so the two are not merged: when a
program runs, its output speaks to the **learner-as-user** (dialogs), the
**developer** (the console), the **machine**, and the **reader**. These are
audiences of the _program_, not personas of the _instrument_.

They appear in this document for one reason: they are the shape of the hole. The
`evaluation` phase is where they would be served and it is empty, so the
arrangement's obligation to them today is to **leave the hole the right shape**
— a phase that reads as a real step of the machine with nothing yet to open, not
as a control that failed to load.

## What this document is asking of the design review

1. **The band is a zero-sum surface and this document does not resolve it.** It
   names the trade and hands it to the wire-frames. If the reviewer believes one
   persona should simply win, that is a ruling worth making explicitly rather
   than discovering in a layout.
2. **One persona cannot be observed yet.** The Vibetoader's path does not exist.
   Choosing an arrangement partly on their behalf is defensible, but it is a
   bet, and it should be recorded as one.
3. **The non-visual reader's needs are the only ones here that are currently
   unmet by construction rather than by taste** — and three of them are defects
   the revamp has already absorbed. If the arrangement is chosen before those
   are fixed, it will be chosen against a surface that cannot demonstrate them.
4. **"What they can afford" is the weakest claim in every section.** Each one is
   an assertion about a reader's patience, made by an author who is not that
   reader, and none of them has been observed.
5. **The author persona has no journey.** Their whole experience is a mount that
   either works or throws, which is why no journey is written for them — but
   that also means nothing in this twin tests whether the failure is legible.

## Navigation

- The region: [`../README.md`](../README.md) — what the orchestrator renders and
  the region glossary.
- Sibling twin documents: [`user-journeys.md`](./user-journeys.md) — these
  readers moving through the instrument, with a clock;
  [`wireframes.md`](./wireframes.md) — where it all sits, and what each
  arrangement claims.
- The package's own statement of the two hats and four audiences:
  [`../../README.md`](../../README.md) — this document extends it and does not
  restate it.
