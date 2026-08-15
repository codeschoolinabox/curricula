<!-- cspell:ignore affordances spellme undrawn wireframes -->

# wireframes — orchestrate

The spatial third of the user twin. [`personas.md`](./personas.md) says who is
in front of this region; [`user-journeys.md`](./user-journeys.md) says what
happens to them and in what order; this says **where things sit, and what the
arrangement is claiming by putting them there.**

**One claim the whole arrangement rests on:** the band above the pane is the
region's only sentence about the machine, and it is read by people who did not
come to read it. What it can say without being read is the whole design problem.

**One arrangement — the Rail — drawn through its states in the order a learner
meets them.** Three candidates were drawn and compared first; that comparison,
the pass that resolved it, and the human's override of that pass are kept in
[the appendix](#appendix--the-candidates-the-pass-and-the-override). An earlier
revision made the three candidates the spine of this document and then selected
a fourth thing drawn through none of its states; a review caught it, and this
structure is the repair.

## What the region must render

The projection contract. The region is handed exactly this, per settle, and may
draw nothing that is not here:

```text
per phase, in the machine's fixed order:
    name          source · tokens · ast · environment · evaluation
    label         learner-facing display copy, this region's to choose
    accessible    → true,  plus the lenses that fit it   (0 … N of them)
                  → false, plus one cause               (the parser's message)
levels            0 … N registered; one selected, or the none-state
the selected      fits · does not fit · not applicable for this type ·
  level's mark      undetermined while unparsed
the posture       warn (default) or strict
the pane          the editor · one open lens · or the generator
proposals         0 … N ranked recommendations of a next lens
```

Three facts about that data shape every drawing below:

- **A break bars a suffix, never a scatter.** Exactly three shapes: everything
  open; grammar broken (source, tokens and ast stay open, the last two wait);
  spelling broken (source and tokens stay open, the last three wait). `source`
  and `tokens` are always reachable, and **a phase's own error never bars it** —
  a grammar error leaves the grammar phase open, because that is where the
  grammar error is studied. So **one break, one cause, drawn once.**
- **`0` is the ordinary number of lenses on a phase**, not an edge case. Four of
  five phases have none today, and an arrangement that treats zero as a
  degenerate case of one will be wrong four fifths of the time.
- **The none-state is the default.** No level is selected unless the embedding
  site names one, so the first screen most learners meet shows no level mark at
  all. Every drawing that shows a mark is showing a state the learner opted
  into.

## The parts

- **the rail** — the lifecycle drawn as the machine's own conveyor: a line, one
  **station** per phase in the machine's order, and the **barring edge** drawn
  between two stations rather than on either of them.
- **station** — the rail's per-phase control: its name, its mark, and its tray
  if it has one. **Never the phase itself** — the phase is the data, the station
  is what renders it. The word is reclaimed rather than minted: a retired
  architecture used `station` as a synonym for `phase`, and that sense is
  formally retired here (human ruling 2026-08-14) rather than left to collide
  silently, because the two are one-to-one and a reader carrying the old meaning
  would be right by accident forever.
- **the barring edge** — where the machine stopped, drawn on the line between
  the last reachable station and the first waiting one. Deliberately not "the
  break": this package teaches `break` as a language construct and uses it again
  as a scope-pop reason, the region already says **barred** for exactly this
  mechanism, and `break` cannot be a binding name in JavaScript at all — so a
  contract term spelled that way would be renamed at every call site and the
  name in the document would drift from the name in the code.
- **the tray** — one station's kit, opening downward beneath the rail and
  pushing the pane down rather than covering it. Absent entirely where a phase
  has nothing to open.
- **the nameplate** — a line above the pane that always names what the pane is
  holding, so the pane is a named place rather than a box whose contents change.
- **the announcer** — a permanently-mounted, visually-hidden live region that
  speaks the transitions a sighted learner reads off the rail. The rail's
  stations are controls, so the rail cannot itself be a live region; the
  announcer is what pays that debt. Three things fix it, and they are stated as
  rules rather than as a surface class, because the region's class-2 list
  enumerates **controls** and the announcer is not one:
  - **Placement.** It renders outside both maskable containers — not because it
    is a control that must stay reachable, but because `inert` removes a subtree
    from the accessibility tree entirely, and a silenced announcer is worse than
    none.
  - **Utterances, exhaustively.** It speaks exactly three things: the pane's
    occupant changing, a transition into or out of the blocked state, and the
    barring edge moving. **It never speaks a settle.** The settle fires whenever
    typing pauses, and a region that narrates every pause is noise a learner
    will route around.
  - **One voice for one sentence.** The blocked state's cause is spoken here,
    which means the existing enforcement-cause node stops claiming to announce
    it and becomes plain text. Two live regions for one sentence is either a
    double utterance or a silent contradiction; this is the seam where that gets
    decided rather than discovered.

Their names are proposed here and become contract at 0.3, alongside the types.

---

## Fresh mount — the default state

No level selected, two lenses on `source`, nothing open.

```text
┌──────────────────────────────────────────────────────────────┐
│ [Generate code]  [module]  [plain JavaScript ▾]     ( ) strict│
├──────────────────────────────────────────────────────────────┤
│  Source ─── Tokens ─── AST ─── Environment ─── Evaluation    │
│   ▾ 2         ·          ·          ·             ·          │
│  four phases have nothing to open yet                        │
├──────────────────────────────────────────────────────────────┤
│  your code                                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 1  const greeting = "hello";                           │  │
│  │ 2  console.log(greeting);                              │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  [Guide ▾]                                                   │
└──────────────────────────────────────────────────────────────┘
```

**An empty station says why, and says it once.** The line beneath the rail is
the Kit Drawer's contribution, kept and relocated: that candidate wrote "nothing
studies this phase yet" under each empty column, and the Rail cannot fit four
copies on one line — but the requirement behind the copy is Journey 6's, that an
empty phase give a reason, and dropping the words to fit the geometry would have
failed it. Saying it once is also the Rail's own discipline, the same one that
draws one break and one cause.

**Each empty station carries the same reason in its accessible name** — "Tokens,
spelling: nothing studies this phase yet" — because the line beneath the rail is
positional and a reader traversing station by station never reaches it. This is
the one place the spoken surface says more than the drawn one, deliberately.

**No mark is shown, because no level is selected.** The selector's closed face
reads `plain JavaScript` — the none-state's display string — and generic
JavaScript editing applies. This is the screen Journeys 1 and 2 both occupy, and
an arrangement that only looks right with a level selected is one tested in a
state most learners never enter.

**Where levels are registered at all** is the host's choice: with none
registered, the selector and the strict toggle are both absent and the control
row is two items shorter. The rail does not move.

**The line is unbroken and complete, and four of its stations offer nothing.**
That is the arrangement's central claim about Journey 2: the machine is whole —
five phases, all reachable — and the toolkit is thin. Health and richness are
drawn in different channels, so "nothing to open here" cannot be misread as
"this is broken".

**One label vocabulary, everywhere.** The rail and the trays both use the
region's display labels, never the phases' data names. Where width demands it
the rail shows the label's first word — `Tokens`, not `Tokens · spelling` — and
the tray shows the full label; it never switches vocabulary. An arrangement that
shows `tokens` in one place and `Tokens · spelling` in another has given the
learner two names for one thing.

## A station's tray, open

```text
│  Source ─── Tokens ─── AST ─── Environment ─── Evaluation    │
│   ▾ 2 ●       ·          ·          ·             ·          │
│  ┌ ways to study the Source ─────────────────────────────┐   │
│  │  [ rebuild the order ]   [ write it from memory ]     │   │
│  └───────────────────────────────────────────────────────┘   │
```

The tray **pushes the pane down** rather than covering it: the surface visibly
grows a requirement rather than swapping one in. Choosing a phase is a small
act; choosing a way to study is a large one — the geometry makes the small one
small.

A station with nothing to open has **no tray and no disclosure control at all**.
It is not a disabled tray; there is nothing there to be disabled. What the
station carries instead is its name and a mark saying the phase is reachable.

## A level selected, and the code fits

```text
│ [Generate code]  [module]  [Just Enough JavaScript · fits ▾] ( ) strict│
```

The mark rides its own visible channel and never hue alone. Its four values are
four legible states, drawn below, not one control with four strings.

## The parse breaks — the machine stopped

```text
│  Source ─── Tokens ─── AST ──╳╌╌ Environment ╌╌╌╌ Evaluation │
│   ▾ 2         ·          ·         waiting         waiting   │
│                                                              │
│  the grammar broke here — Unexpected token (2:8).            │
│  the last two phases wait for it.                            │
├──────────────────────────────────────────────────────────────┤
│              [Just Enough JavaScript · can't tell yet ▾]     │
```

**The barring edge is drawn between stations, not on one**, because that is what
the data says: the phase where it broke stays open — it is where the grammar
error is studied — and what waits is downstream of it. The dashed line makes the
same statement in geometry that the sentence makes in words, so a learner who
reads neither still sees it. **One cause, drawn once**, rather than the same
parser sentence repeated per waiting phase.

**And the AST station is empty, which is the honest and uncomfortable drawing.**
The argument for leaving that phase open is that it is where the grammar error
is studied — and nothing studies it: no lens on the built-in roster declares the
`ast` phase. So Journey 1's decisive moment lands the learner on an open station
with no tray, and Journey 2's empty middle arrives at the worst possible moment.
An earlier revision drew a lens here that does not exist, which made the drawing
read better and concealed exactly the finding the twin exists to surface. **This
is the strongest argument the document can make for someone owing the parse
phases their error lenses**, and it belongs in a drawing rather than in a
complaint.

Two separate truths, drawn separately: **the machine stopped somewhere**, and
**the level declines to judge.** The mark is not "does not fit" — a typo is
never a level violation, and the mark says so in the learner's words rather than
reporting `undetermined`.

> ⚠ **doubt.** The rail carries the parser's own message verbatim, which Journey
> 1 flags as its worst moment: a learner who came for help meets machine text.
> The learner-worded explanation the package promises does not exist, and no
> arrangement supplies it. The drawing is honest about that rather than
> pretending a better sentence exists.

## The level does not admit this snippet type

```text
│ [Generate code]  [script]  [Scaffold · modules only ▾]  ( ) strict│
```

The fourth mark, and the one most easily collapsed into "does not fit". It is a
statement about the **type toggle**, not about the code — so the copy names the
control that resolves it, and the toggle sits beside it.

## The code steps outside, under warn — the default posture

```text
│         [Just Enough JavaScript · steps outside ▾]  ( ) strict│
├──────────────────────────────────────────────────────────────┤
│  Source ─── Tokens ─── AST ─── Environment ─── Evaluation    │
│   ▾ 2         ·          ·          ·             ·          │
```

**Nothing is covered and nothing is taken away.** This is the default posture
and the one most learners will only ever see: the mark changes, the rail does
not, the trays still open. Drawn because an arrangement whose only level-aware
state is the covered one has designed for the exception.

## Strict, covering — editor mode

```text
┌──────────────────────────────────────────────────────────────┐
│ [Generate code]  [module]                                    │ ← Generate: dim + inert
│         [Just Enough JavaScript · steps outside ▾]  (•) strict│   at its own element
├──────────────────────────────────────────────────────────────┤
│  Source ─── Tokens ─── AST ─── Environment ─── Evaluation    │ ← the rail: dim + inert
│   ▾ 2         ·          ·          ·             ·          │
├──────────────────────────────────────────────────────────────┤
│  your code                                                   │
│  ┌────────────────────────────────────────────────────────┐  │ ← never covered
│  │ 1  debugger;                                           │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░ Just Enough JavaScript: debugger statements are outside  ░ │
│ ░ this level. Fix the code, pick another level, or turn    ░ │
│ ░ strict off.                                              ░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├──────────────────────────────────────────────────────────────┤
│  [Guide ▾]                                                   │
└──────────────────────────────────────────────────────────────┘
```

The blocked sentence orders the three ways out deliberately: **fix the code
first, lift the guardrail last.** Journey 4's trap is that the escape is easier
to reach than the repair, and the sentence is the one place the arrangement can
push back on its own geometry.

**The rail dims whole, and this is the Rail's own answer to a question the other
candidates left open.** Because its stations are controls, the rail is
unambiguously class 3 — there is no control-free part of it to argue should stay
lit. It also drops into the maskable container the phases panel already
occupies, so the dimming needs no new mechanism.

**The cost is that orientation goes dark under strict, and it is not fully
paid.** The announcer keeps speaking, because it renders outside both maskable
containers — but a visually-hidden region is by construction unavailable to the
sighted learner whose orientation just went dark. **So the mitigation reaches a
different reader than the one who lost something**, and saying otherwise would
be the kind of accounting that makes a cost look settled when it is not. What a
sighted learner keeps under strict is the blocked sentence and the live control
row; whether that is enough orientation is a checkpoint question and nothing in
this document can answer it.

## Strict, covering — with a lens already open

Two paths reach this state: an honored focus request at mount, and a
flush-at-open whose absorbed keystrokes settle out-of-level code. It is the
state where "the way home is never covered" carries the most weight.

```text
│ [Edit code]  [module]                                        │ ← class 2, never covered,
│         [Just Enough JavaScript · steps outside ▾]  (•) strict│   leading in the row
├──────────────────────────────────────────────────────────────┤
│  Source ─── Tokens ─── AST ─── Environment ─── Evaluation    │ ← dim + inert
├──────────────────────────────────────────────────────────────┤
│  the pane holds: write it from memory · a way to study Source│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░ Just Enough JavaScript: debugger statements are outside  ░ │ ← the lens is covered
│ ░ this level. Fix the code, pick another level, or turn    ░ │   where it renders
│ ░ strict off.                                              ░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├──────────────────────────────────────────────────────────────┤
│  [Guide ▾]                                                   │
└──────────────────────────────────────────────────────────────┘
```

**The editor is absent, not covered** — it is structurally away during any
excursion, which is why the class-2 way home has to be a control in the live row
rather than the returning editor itself. **Edit code takes Generate code's place
in the row**; the two are never both present.

## An excursion open — the nameplate and the proposals

```text
│ [Edit code]  [module]  [plain JavaScript ▾]                  │
├──────────────────────────────────────────────────────────────┤
│  Source ─── Tokens ─── AST ─── Environment ─── Evaluation    │
│   ▾ 2 ●       ·          ·          ·             ·          │
├──────────────────────────────────────────────────────────────┤
│  the pane holds: write it from memory · a way to study Source│
│  ┌────────────────────────────────────────────────────────┐  │
│  │  (the surface, over your code as it stood)             │  │
│  └────────────────────────────────────────────────────────┘  │
│  next, you could:  [ study the source ]                      │ ← proposals: below the
├──────────────────────────────────────────────────────────────┤   pane, in every mode
│  [Guide ▾]                                                   │
└──────────────────────────────────────────────────────────────┘
```

**The open lens's station keeps its mark while the tray is closed**, so the rail
answers "where am I" without the tray being open — which is the whole reason the
rail can afford to hide the kit.

**Proposals render below the pane in every mode, including editor mode.** They
are a second lens-opening affordance and the arrangement owns that rather than
claiming a single door: a tray is the door a learner goes looking for; a
proposal is one the region offers unasked. Drawn below the pane and phrased as
an invitation, they read as the fade-is-pull the package argues for — a
suggestion that costs nothing to ignore. Drawn on the rail, they would compete
with the stations and read as instruction.

They render through the mask like any other study surface, and a proposal whose
target lens does not resolve never reaches the drawing at all — it is dropped
before ranking.

**Closing the open lens.** Today a lens is closed either by the Edit code button
or by the strip's none entry. This arrangement has no strip, so **the tray entry
for the open lens is its own close affordance** — pressed while open, released
to close. That replaces a contract-named dispose raiser and changes the region's
dispose enumeration; it is named here so 0.3 amends the contract deliberately
rather than discovering it.

**And it collides with a contract edge pointing the other way**, which 0.3 must
settle rather than inherit. The region deliberately allows the OPEN lens to be
re-opened: a proposal may target it, and doing so re-resolves its configuration
in place and announces a fresh open without moving the embodiment. So under this
arrangement the same lens has two affordances with opposite meanings — its tray
entry closes it, a proposal re-opens it. A learner who wants to restart the
surface they are on reaches for the nearer one and gets a dispose. This is a
state-machine question, not a layout one, and it is the kind that is cheap now
and expensive once the types are written.

## The generator in the pane

```text
│ [Edit code]  [module]                                        │
├──────────────────────────────────────────────────────────────┤
│  Source ─── Tokens ─── AST ─── Environment ─── Evaluation    │
│   ▾ 2         ·          ·          ·             ·          │
├──────────────────────────────────────────────────────────────┤
│  the pane holds: writing a program with you                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  (the generator — seed, prompt, preview, accept)       │  │
│  └────────────────────────────────────────────────────────┘  │
```

The generator is a pane occupant like any lens, and the nameplate names it like
any other. No station is marked, because the generator belongs to no phase.
**Its interior is not this document's** — the wait, the cancel's cost and the
refusal's wording are the generator's own surface, and Journey 7's three asks
are handed to it explicitly rather than left ownerless here.

## The kit at 0, 1 and many

```text
0 ─  Tokens        a bare mark on the line. No tray, no disclosure
        ·          control, nothing disabled. The phase is named and
                   reachable; nothing claims to be openable.

1 ─  Tokens        one tray entry.
      ▾ 1

6 ─  Tokens        the tray wraps to two rows inside its own box.
      ▾ 6          The line above does not move a pixel.
```

**This is the Rail's structural advantage**: the size of the kit never perturbs
the lifecycle's geometry, because the machine and the kit are drawn in different
places.

## What the arrangement never changes

Settled elsewhere, respected in every drawing above, and not open for
rearrangement here:

- **Controls above the pane; proposals below it; the guide last.** The controls
  and the rail sit above the surface pane, the ranked proposals render below it
  in every mode, and the guide is the region's final child.
- **The pane holds exactly one thing** — the editor, one open lens, or the
  generator — and the editor is structurally absent while either other is open.
- **One visual pane, two slots.** The editor renders outside both maskable
  containers and is never covered while mounted; an open lens and the generator
  render inside one. A single shared slot would break that split; a shared
  visual frame is not a shared slot.
- **The controls that restore conformance are never covered** — the level
  selector, the strict toggle, the snippet-type toggle, the guide, and the Edit
  code button. Under strict they stay at full strength while the rail and the
  study surfaces dim.
- **Edit code is in the control row, leading, whenever an excursion is open**,
  and it is the guaranteed way home. It is never drawn inside the pane and never
  below it: a class-2 control inside the maskable container would be covered by
  the very state it exists to escape.
- **Generate code carries the covered treatment at its own element**, though it
  sits in the live control row, because it opens a covered surface. It and Edit
  code are never both present.
- **No new headings.** The region's only headings belong to the guide, so a host
  may mount it under any shallow context. Every station name and tray label is
  inline text, and the structure a screen reader traverses comes from named
  regions and groups rather than from a heading outline — which is the only
  route left once the outline is spent, and it is owed at 0.3.

## What has no wireframe, deliberately

- **The transition into and out of an excursion.** Whether the pane swap reads
  as commitment or as loss is a question about motion, height and focus, and
  Journey 3 is explicit that the two seconds around it are what matters. It
  wants a running dev server, not a picture.
- **The covered state's weight.** How dim reads as _paused_ rather than _broken_
  was settled once by a human looking at a screenshot, and will be again.
- **The tone flip.** Light and dark are one cascade, not two drawings.
- **The narrow-viewport rail.** See the doubt below: nobody has drawn the
  degradation, and drawing it in ASCII would imply it is settled.

> ⚠ **doubt, and it is the Rail's largest.** Five stations plus four connectors
> is not a phone layout. Wrapping the line destroys the meaning the line
> carries; scrolling it horizontally hides stops. The honest degradation is a
> vertical list — a second **geometry**, and deliberately not a second contract:
> it has the same parts in the same order, one station per phase, an optional
> tray per station, and the barring edge between two of them. Only the direction
> of the line changes, so this is a stylesheet debt rather than a second type
> set, and 0.3 should not read it as two arrangements to model. A second,
> quieter version of the same worry: a drawn line is the first thing to break
> under an unfamiliar host's font stack and under right-to-left text.
>
> **A second doubt, smaller and self-resolving.** At today's kit, four of five
> stations have no tray, so the disclosure mechanism — the thing that makes the
> rail an interaction rather than a diagram — is paying rent on one station.
> That resolves itself as lenses arrive, and it is the state the region ships in
> until they do.

---

## Appendix — the candidates, the pass, and the override

Kept because the reasoning is auditable and because the doubts recorded against
each candidate transfer to whatever borrows from it.

**The Rail** — drawn above. Order becomes a mark on the page rather than a
reading convention; a break becomes a property of an edge, which is what the
data says; the kit's size never perturbs the lifecycle's geometry.

**The Bench** split orientation from navigation: a control-free readout, one
grouped opener, a nameplate. Its argument: a readout that is also a set of
buttons cannot be a live region, and one door matches a commitment that removes
the editor. Its recorded doubt: it hides the kit, so a learner who never opens
the opener learns there is a "study this" button rather than that their program
has five phases.

**The Kit Drawer** drew five columns, each a phase's kit as a vertical list,
with the barred suffix as a shaded region to the right. Its argument: the shape
of the kit becomes visible as a landscape, which is a true and uncomfortable
fact about this project. Its recorded doubts: at today's kit it is one populated
column and four saying "nothing studies this yet"; and it may be a copy question
wearing a layout costume.

### The pass

Seven journeys through three candidates, Journey 2 first.

|                                        | Rail                                                        | Bench                                                           | Drawer                                                         |
| -------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------- |
| **2 · the empty middle** (the decider) | machine drawn whole; only the trays are thin                | reports five open phases — and **hides** that four are unserved | says "nothing studies this yet" four times on the first screen |
| **1 · never leaves the editor**        | break on the edge, cause below                              | same, **and the readout can speak it**                          | break as a rule, cause below                                   |
| **5 · by keyboard**                    | stations, plus a tray when open                             | **one stop to everything**                                      | every entry is a stop, forever                                 |
| **6 · through a screen reader**        | stations give structure; an empty one needs a spoken reason | uniquely able to be a live region; navigation weakest           | **strongest** — named groups, every state already text         |
| **3 · the excursion**                  | —                                                           | —                                                               | —                                                              |
| **4 · strict**                         | —                                                           | —                                                               | —                                                              |
| **7 · the generator's wait**           | —                                                           | —                                                               | —                                                              |

**Journey 2 decided a property, not a candidate.** The empty middle stops
reading as breakage exactly when the arrangement puts the machine's **health**
and the kit's **richness** in different visual channels. The Rail does that with
a line and trays; the Bench does it more cleanly, because its readout carries no
controls at all; the Drawer structurally cannot, because a column is
simultaneously the phase and its kit.

**Three journeys did not discriminate, and one of those is a finding.** Journey
3's answer is stealable — the nameplate is one line of text and belongs in
whichever arrangement wins. Journey 7 cannot discriminate, because the generator
is a pane occupant no arrangement of the band touches. And **Journey 4's trap
belongs to neither the band nor the control row**: the strict toggle and the
level selector are rendered by one component, so their adjacency is a component
boundary and no arrangement could have changed it. Separating them means
decomposing that component into two exported controls with new props and new
tests — a different phase of work, correctly identified before it became types.

**The pass selected** the Bench's structure carrying the Rail's line and the
Drawer's empty-phase copy: a synthesis, traceable to the journeys that demanded
each part, and drawn through none of its own states.

### The override — the Rail, by the human

**The maintainer selected the Rail directly, superseding the pass's synthesis.**
Recorded rather than re-argued, with what the choice costs and what it does not:

- **It does not overturn the pass's main finding.** The Rail satisfies Journey
  2's decisive property — health and richness in separate channels — which is
  why it was a candidate at all. The pass preferred the Bench on its
  **secondary** criteria, Journeys 5 and 6.
- **Journey 6's cost is real and cheaply paid.** The Bench's unique advantage
  was that its readout could itself be a live region; the Rail's stations are
  controls, so it cannot. **The announcer** — a permanently-mounted,
  visually-hidden class-2 live region — pays that debt, and is arguably the
  better mechanism regardless, since it also carries the pane swap and the
  blocked state, neither of which the Bench's readout would have announced.
- **Journey 5's cost is a real regression against the Bench** and is not paid:
  reaching the far end of the band costs more stops under the Rail than under a
  single opener, and the cost grows with the kit when a tray is open.
- **The narrow-viewport failure is inherited undischarged**, and it is the
  largest open question in this document.

## What this document is asking of the design review

1. **The narrow-viewport degradation is undrawn and unowned.** The Rail's honest
   small-screen form is a vertical list, which is a second arrangement. Either
   it is drawn and accepted as such, or the Rail needs a fallback that preserves
   the line's meaning, and nobody has proposed one.
2. **The arrangement replaces a contract-named dispose raiser.** With no strip,
   the strip's none entry has no analogue; the open lens's tray entry takes its
   place. The dispose enumeration changes, and 0.3 should amend it deliberately.
3. **The announcer is a new permanent element** with no precedent in this region
   and no home in the current DOM. It is class 2 by argument, not by ruling.
4. **Journey 4's trap is a component-decomposition question**, not a layout one.
   It is named here so it is not mistaken for something the band's order can
   fix.
5. **Proposals are a second door and the arrangement admits it.** If the review
   thinks one door is worth preserving as a principle, the proposals surface has
   to go somewhere else or stop opening lenses.
6. **Every drawing is at a kit of two lenses on one phase, which is today.**
   None is drawn against the region this project intends to have.
7. **No drawing here has been seen by anyone who is not its author**, and the
   one question that decides the revamp — whether four empty phases teach or
   alarm — cannot be answered by any of them.

## Navigation

- The region: [`../README.md`](../README.md) — what the orchestrator renders and
  the constraints these drawings respect.
- Sibling twin documents: [`personas.md`](./personas.md) — whose competing
  demands the band is spending; [`user-journeys.md`](./user-journeys.md) — the
  journeys this arrangement was chosen against.
