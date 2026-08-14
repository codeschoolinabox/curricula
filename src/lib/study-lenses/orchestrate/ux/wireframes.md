<!-- cspell:ignore spellme undrawn wireframes -->

# wireframes — orchestrate

The spatial third of the user twin. [`personas.md`](./personas.md) says who is
in front of the instrument; [`user-journeys.md`](./user-journeys.md) says what
happens to them and in what order; this says **where things sit, and what each
arrangement is claiming by putting them there.**

**One claim every candidate below rests on:** the band above the pane is the
instrument's only sentence about the machine, and it is read by people who did
not come to read it. What it can say without being read is the whole design
problem.

**Three candidates, drawn and not ranked.** Choosing between them is
[the selection pass](#the-selection-pass)'s job, and it is done by walking the
journeys through each — not by preferring one here. They are deliberately not
three shades of one idea: they disagree about whether the kit is visible at
rest, and that disagreement is the decision.

## What every candidate must render

This is the projection contract, and it is the same for all three. The
instrument is handed exactly this, per settle, and may draw nothing that is not
here:

```text
per phase, in the machine's fixed order:
    name          source · tokens · ast · environment · evaluation
    label         learner-facing display copy, this region's to choose
    accessible    → true,  plus the lenses that fit it   (0 … N of them)
                  → false, plus one cause               (the parser's message)
the open surface  a lens name · the generator · or the editor
```

Two facts about that data shape every drawing below:

- **A break bars a suffix, never a scatter.** There are exactly three shapes:
  everything open; grammar broken (source, tokens and ast stay open, the last
  two wait); spelling broken (source and tokens stay open, the last three wait).
  `source` and `tokens` are always reachable, and **a phase's own error never
  bars it** — a grammar error leaves the grammar phase open, because that is
  where the grammar error is studied. So **one break, one cause, drawn once.**
- **`0` is the ordinary number of lenses on a phase**, not an edge case. Four of
  five phases have none today, and an arrangement that treats zero as a
  degenerate case of one will be wrong four fifths of the time.

## The contested surface

Per [`personas.md`](./personas.md): the Frogrammer needs the band to be an
instrument panel legible at rest; the Vibetoader needs it out of the way. Both
demands land on the same strip of pixels. **Each candidate below spends that
surface differently, and that is the only real difference between them.**

---

## Candidate A — the Rail

_The lifecycle drawn as the machine's own conveyor. Phases are stations on a
line; each station's kit is behind a tray that opens downward._

### Fresh mount

```text
┌──────────────────────────────────────────────────────────────┐
│ [Generate code]  [module]  [Just Enough JavaScript ✓ fits ▾] │
│                                                     ( ) strict│
├──────────────────────────────────────────────────────────────┤
│  source ──── tokens ──── ast ──── environment ──── evaluation│
│   ▾ 2          ·           ·           ·               ·     │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 1  const greeting = "hello";                           │  │
│  │ 2  console.log(greeting);                              │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  [Guide ▾]                                                   │
└──────────────────────────────────────────────────────────────┘
```

### A way to study, open

```text
│  source ──── tokens ──── ast ──── environment ──── evaluation│
│   ▾ 2 ●        ·           ·           ·               ·     │
│  ┌ ways to study the source ─────────────────────────────┐   │
│  │  [ rebuild the order ]   [ write it from memory ]     │   │
│  │                            ▲ open                     │   │
│  └───────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│  write it from memory — over your code as it stood           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  (the surface)                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                            [Edit code]       │
```

### The machine stopped

```text
│  source ──── tokens ──── ast ──╳╌╌ environment ╌╌╌╌ evaluation│
│    ·           ·          ▾ 1        waiting        waiting  │
│                                                              │
│  ⚠ the grammar broke here — Unexpected token (2:8)           │
│    the last two phases wait for it                           │
```

The break glyph sits **on the line between two stations**, not on a station,
because that is what the data says: the phase where it broke stays open, and
what waits is downstream of it. The dashed line downstream makes the same
statement in geometry that the sentence makes in words, so a learner who reads
neither still sees it.

### Strict, covering

```text
│ [Generate code]  [module]  [JEJ ✗ steps outside ▾] (•) strict│  ← Generate dim+inert
├──────────────────────────────────────────────────────────────┤
│  source ──── tokens ──── ast ──── environment ──── evaluation│  ← dim + inert
│   ▾ 2          ·           ·           ·               ·     │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │  ← never covered
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

### At 0, 1 and many

```text
0 ─  tokens          the station is a bare mark on the line; no tray, no
       ·             disclosure. The phase is named and present; nothing
                     claims to be openable.

1 ─  tokens          one tray entry.
       ▾ 1

6 ─  tokens          the tray wraps inside its own box; the line above
       ▾ 6           does not move a pixel.
```

**The rail's structural advantage is exactly this:** the size of the kit never
perturbs the lifecycle's geometry, because they are drawn in different places.

### The argument

The rail is the only candidate where **order is a mark on the page** rather than
a reading convention, and the only one where a break is a property of an
**edge** rather than of the stations either side of it — which is what the data
actually says. It is the most literal possible answer to "the phases are the
interaction model": it draws the machine.

The tray opening downward borrows the scanning lens's own argument — the surface
visibly grows a requirement rather than swapping one in. Choosing a phase is a
small act; choosing a way to study is a large one; the geometry makes the small
one small.

### Costs

- **Keyboard** — good if each station is a real disclosure: focusable even at
  zero lenses, nothing commits on traversal, and open/close is native.
- **Screen reader** — the connectors are decoration and must be silent; the
  break has to be carried by the sentence, not the glyph. A station's spoken
  name has to include its state, because its visual state is a mark.
- **Narrow viewport** — **this is the rail's weakness and it is real.** Five
  stations and four connectors do not fit a phone. Wrapping destroys the line's
  meaning; scrolling hides stops. The honest fallback is that under a breakpoint
  the rail becomes a vertical list — which is to say, it becomes a different
  candidate.
- **Embedding** — the connectors can be drawn characters, which survive any host
  theme, or borders, which look better and break more.

> ⚠ **doubt.** The rail's whole appeal is a line, and a line is the first thing
> to break under a host's font stack, a narrow column, and right-to-left text.
> Worse: at today's kit, four of five stations have no tray at all, so the
> disclosure mechanism — the thing that makes the rail an interaction and not a
> diagram — is paying rent on one station. And a tray that pushes the pane down
> moves the editor while the learner may be looking at it.

---

## Candidate B — the Bench

_Split the band's two jobs. A permanent readout answers "where is the machine",
carries no controls at all, and can therefore speak. One opener holds the whole
kit. A nameplate always says what the pane is holding._

### Fresh mount

```text
┌──────────────────────────────────────────────────────────────┐
│ [Study this program ▾] [Generate code] [module]              │
│                        [Just Enough JavaScript ✓ fits ▾] ( )s│
├──────────────────────────────────────────────────────────────┤
│  source ● tokens ● ast ● environment ● evaluation ●          │
│  all five phases are open                                    │
├──────────────────────────────────────────────────────────────┤
│  the pane holds: your code                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 1  const greeting = "hello";                           │  │
│  │ 2  console.log(greeting);                              │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  [Guide ▾]                                                   │
└──────────────────────────────────────────────────────────────┘
```

The opener, opened:

```text
│ [Study this program ▴]                                       │
│ ┌ ways to study this program ───────────────────────────────┐│
│ │ source — the text itself                                  ││
│ │     [ rebuild the order ]  [ write it from memory ]       ││
│ │ tokens · spelling — nothing studies this phase yet        ││
│ │ ast · grammar — nothing studies this phase yet            ││
│ │ environment · names — nothing studies this phase yet      ││
│ │ evaluation · run — nothing studies this phase yet         ││
│ └───────────────────────────────────────────────────────────┘│
```

### A way to study, open

```text
│ [Study this program ▾] [Edit code] [module] [JEJ ✓ fits ▾]   │
├──────────────────────────────────────────────────────────────┤
│  source ● tokens ● ast ● environment ● evaluation ●          │
├──────────────────────────────────────────────────────────────┤
│  the pane holds: write it from memory · a way to study source│
│  ┌────────────────────────────────────────────────────────┐  │
│  │  (the surface, over your code as it stood)             │  │
│  └────────────────────────────────────────────────────────┘  │
```

### The machine stopped

```text
│  source ● tokens ● ast ● environment ○ evaluation ○          │
│  ⚠ the grammar broke — Unexpected token (2:8). The last two  │
│    phases wait for it.                                       │
```

…and inside the opener, the same fact where the learner is choosing:

```text
│ │ ast · grammar                                             ││
│ │     [ read the grammar error ]                            ││
│ │ environment · names — waiting for the code to parse       ││
│ │ evaluation · run — waiting for the code to parse          ││
```

### Strict, covering

```text
│ [Study this program ▾] [Generate code] [module]              │ ← both dim + inert
│                        [JEJ ✗ steps outside ▾]  (•) strict   │   at their own elements
├──────────────────────────────────────────────────────────────┤
│  source ● tokens ● ast ● environment ● evaluation ●          │ ← see the doubt
├──────────────────────────────────────────────────────────────┤
│  the pane holds: your code                                   │
│  ┌────────────────────────────────────────────────────────┐  │ ← never covered
│  │ 1  debugger;                                           │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ ░ Just Enough JavaScript: debugger statements are outside  ░ │
│ ░ this level. Fix the code, pick another level, or turn    ░ │
│ ░ strict off.                                              ░ │
├──────────────────────────────────────────────────────────────┤
│  [Guide ▾]                                                   │
└──────────────────────────────────────────────────────────────┘
```

### At 0, 1 and many

```text
0 ─  the readout is unchanged — a phase's dot reports accessibility,
     never how much is in it. Inside the opener the phase keeps its
     line and says nothing studies it yet.

1 ─  one entry under that phase's heading in the opener.

6 ─  six entries under that heading. The opener grows; the band does
     not. This is the only candidate whose permanent chrome is the
     same size at 30 lenses as at zero.
```

### The argument

Today's band conflates **orientation** — where is the machine, is it healthy —
with **navigation** — take me somewhere. The bench separates them, and the
separation is what buys everything else:

- The readout has no controls, so it can be a live region that speaks on settle:
  _"the grammar broke — the last two phases are waiting."_ **No other candidate
  can be that**, because in the others the phases are also buttons.
- Navigation becomes one commit affordance, which matches the settled pedagogy
  exactly: leaving the editor is a real, exclusive decision, and there is one
  door to it.
- The nameplate names the pane's occupant permanently, which is the cheapest
  available answer to Journey 3's swap.

### Costs

- **Keyboard** — the cheapest by a wide margin: one stop to the whole kit.
- **Screen reader** — the strongest summary of the three, and the weakest
  navigation: "which lens is open" now lives in two places, the nameplate and
  the opener, and they can disagree.
- **Narrow viewport** — the best. One button and one line of text.
- **Embedding** — needs a real popover or a block that pushes content down.

> ⚠ **doubt, and it is serious.** The bench hides the kit, and the package's
> whole claim is that the phases are the interaction model. A learner who never
> opens the opener learns that there is a "study this" button — not that their
> program has five phases. That is the hand-curated-toolbar failure the revamp
> is trying to escape, reached from the opposite direction. The readout is meant
> to compensate; a row of dots with no affordance may read as decoration.
>
> **A second, unresolved doubt:** the readout's mask class is genuinely unclear.
> It is not an opening affordance, which argues class 2 and staying alive; it is
> a projection of the study layer, which argues class 3 and dimming. Drawn alive
> above. If it is class 3, orientation goes dark exactly when the learner is
> most confused — the opposite of why class 2 exists.

---

## Candidate C — the Kit Drawer

_Five columns, left to right in the machine's order. Each column is its phase's
kit as a vertical list. Nothing is hidden; the shape of the kit is the picture._

### Fresh mount

```text
┌──────────────────────────────────────────────────────────────┐
│ [Generate code]  [module]  [Just Enough JavaScript ✓ fits ▾] │
│                                                     ( ) strict│
├──────────────────────────────────────────────────────────────┤
│ source        tokens      ast         environment  evaluation│
│ ───────────   ─────────   ─────────   ───────────  ──────────│
│ rebuild the   nothing     nothing     nothing      nothing   │
│   order       studies     studies     studies      studies   │
│ write it      this yet    this yet    this yet     this yet  │
│   from memory                                                │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 1  const greeting = "hello";                           │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  [Guide ▾]                                                   │
└──────────────────────────────────────────────────────────────┘
```

### A way to study, open

```text
│ source        tokens      ast         environment  evaluation│
│ ───────────   ─────────   ─────────   ───────────  ──────────│
│ rebuild the   nothing     nothing     nothing      nothing   │
│   order       studies     studies     studies      studies   │
│ ▪write it▪    this yet    this yet    this yet     this yet  │
│ ▪from memory▪                                                │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  (the surface)                          [Edit code]    │  │
│  └────────────────────────────────────────────────────────┘  │
```

### The machine stopped

```text
│ source        tokens      ast         │ environment evaluation│
│ ───────────   ─────────   ─────────   │ ╌╌╌╌╌╌╌╌╌╌╌ ╌╌╌╌╌╌╌╌╌│
│ rebuild the   nothing     read the    │  waiting     waiting  │
│   order       studies     grammar     │                       │
│ write it      this yet      error     │                       │
│   from memory                         │                       │
│                                       │                       │
│ ⚠ the grammar broke — Unexpected token (2:8)                 │
```

The break is a **vertical rule across the columns**, which is the suffix drawn
exactly: everything to its right waits. One cause, once, beneath.

### Strict, covering

```text
│ [Generate code]  [module]  [JEJ ✗ steps outside ▾] (•) strict│ ← Generate dim+inert
├──────────────────────────────────────────────────────────────┤
│ source        tokens      ast         environment  evaluation│ ← whole drawer
│ ───────────   ─────────   ─────────   ───────────  ──────────│   dim + inert
│ rebuild the   nothing     nothing     nothing      nothing   │
│ …                                                            │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │ ← never covered
│  │ 1  debugger;                                           │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ ░ Just Enough JavaScript: debugger statements are outside  ░ │
│ ░ this level. Fix the code, pick another level, or turn    ░ │
│ ░ strict off.                                              ░ │
└──────────────────────────────────────────────────────────────┘
```

### At 0, 1 and many

```text
0 ─  the column says, in words, that nothing studies this phase yet.
     The column is still there, still named, still the same width.

1 ─  one entry.

6 ─  the column is six entries tall and the drawer is as tall as its
     tallest column. Uneven columns are the normal state, and the
     unevenness is information.
```

### The argument

The drawer is the only candidate that makes **the shape of the kit** visible —
and the shape of the kit is currently a true and uncomfortable fact about this
project: the source phase is rich and the middle of the machine is empty. A
learner sees at a glance where the tool can help them and where it cannot yet.

It is also the only candidate with **nothing hidden and nothing to discover**:
no disclosure state, no widget to learn, no affordance that has to announce
itself. Every one of the Frogrammer's needs is met at rest without an action.

### Costs

- **Keyboard** — every entry is a stop, in reading order, and the count grows
  with the kit. Reaching the guide gets more expensive as the project succeeds.
- **Screen reader** — strong: each column is a named group, each state is text.
- **Narrow viewport** — **the worst of the three, structurally.** Five columns
  is not a phone layout, and unlike the rail there is no obvious degradation
  that preserves the idea.
- **Embedding** — the most style-hungry option, in a region with no stylesheet
  at all. Uneven columns of aligned width is exactly the layout that goes wrong
  in an unfamiliar host.

> ⚠ **doubt.** The drawer ages best and reads worst today: at the current kit it
> is one populated column and four that say "nothing studies this yet", which is
> honest and may still look like a broken product on a first screen. It also
> repeats that sentence four times, and Journey 2 is precisely about whether
> that repetition teaches or alarms. The author suspects the answer depends on
> the wording far more than on the layout — which, if true, means this candidate
> is being judged on copy and not on arrangement.

---

## What no candidate changes

Drawn into all three above, and not open for rearrangement here:

- **Chrome above the pane; the guide last.** No orchestrator control renders
  below the surface pane.
- **The pane holds exactly one thing** — the editor, one way to study, or the
  generator — and the editor is structurally absent while either of the others
  is open.
- **One visual pane, two slots.** The editor is never covered while mounted and
  renders outside the maskable containers; a study surface and the generator
  render inside one. A single shared slot would break that split. Every drawing
  above shows one bordered pane, which is the learner-facing abstraction over
  both, and a shared frame is not a shared slot.
- **The controls that restore conformance are never covered** — the level
  selector, the strict toggle, the snippet-type toggle, the guide, and the way
  back to the editor. Under strict they stay at full strength while the study
  surfaces dim.
- **Generate code carries the covered treatment at its own element**, even
  though it sits in the live control row, because it opens a covered surface. It
  and Edit code are never both present: the editor is away exactly when an
  excursion is open.
- **No new headings.** The instrument's only headings belong to the guide, so a
  host may mount it under any shallow context. Every column head, station name
  and phase label above is inline text.

## What has no wireframe, deliberately

Three things are left undrawn because ASCII would settle them wrongly:

- **The transition into and out of an excursion.** Whether the pane swap reads
  as commitment or as loss is a question about motion, height and focus, and
  Journey 3 is explicit that the two seconds around it are what matters. It
  wants a running dev server, not a picture.
- **The covered state's weight.** How dim is dim enough to read as _paused_
  rather than _broken_ was settled once before by a human looking at a
  screenshot, and it will be settled that way again.
- **The tone flip.** Light and dark are not two drawings; they are one cascade
  with a bug already documented elsewhere in this package. Drawing them here
  would imply a choice that belongs in the stylesheet.

## The selection pass

The journeys were walked through each candidate, Journey 2 first. Three of the
seven turned out not to discriminate at all, and saying so is part of the
result.

|                                        | Rail                                                        | Bench                                                                      | Drawer                                                         |
| -------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **2 · the empty middle** (the decider) | the machine is drawn whole; only the trays are thin         | truthfully reports five open phases — and **hides** that four are unserved | says "nothing studies this yet" four times on the first screen |
| **1 · never leaves the editor**        | break on the edge, cause below                              | same, **and the readout can speak it**                                     | break as a rule, cause below                                   |
| **5 · by keyboard**                    | stations, plus a tray when open                             | **one stop to everything**                                                 | every entry is a stop, forever                                 |
| **6 · through a screen reader**        | stations give structure; an empty one needs a spoken reason | uniquely able to be a live region; navigation weakest                      | **strongest** — named groups, every state already text         |
| **3 · the excursion**                  | —                                                           | —                                                                          | —                                                              |
| **4 · strict**                         | —                                                           | —                                                                          | —                                                              |
| **7 · the generator's wait**           | —                                                           | —                                                                          | —                                                              |

### What the non-discriminating journeys revealed

- **Journey 3 does not choose, because its answer is stealable.** The nameplate
  that turns the pane from an anonymous box into a named place is one line of
  text above the pane; it is drawn into the Bench and belongs in whichever
  arrangement wins.
- **Journey 4 does not choose, and that is a finding.** All three put the strict
  toggle immediately beside the level selector, so in all three **the way out of
  the guardrail is nearer to hand than the way back into conformance.** The trap
  Journey 4 names lives in the control row's composition, not in the strip — it
  is a separate decision this pass cannot make and the review should be asked
  for directly.
- **Journey 7 does not choose**, because the generator is a pane occupant and no
  strip arrangement touches it.

### What Journey 2 actually decided

Not a candidate — **a property.** The empty middle stops reading as breakage
exactly when the arrangement puts **the machine's health and the kit's richness
in different visual channels**, so that "four phases have nothing in them" is
visibly a statement about the toolkit rather than about the program or the
instrument.

The Rail does that with a line and trays. The Bench does it more cleanly still,
because its readout carries no controls at all. **The Drawer cannot**: a column
is simultaneously the phase and its kit, which is precisely why its empty state
is loud enough to alarm.

### The selection

**The Bench's structure, carrying the Rail's line as its readout, and the
Drawer's sentence as the empty-phase copy inside the opener.**

Each borrowing is traceable to the journey that demanded it:

- **Orientation separated from navigation** — Journey 2's decision, and the only
  route to Journey 6's speakable readout, since a readout that is also a set of
  buttons cannot be a live region.
- **The readout draws the machine's order, with the break on an edge** — the
  Rail's contribution, because Journey 2's Frogrammer needs the lifecycle
  legible as a machine at rest, and a row of undifferentiated dots is the thing
  their own doubt block warns reads as decoration.
- **One opener, grouped by phase** — Journey 5's O(1) traversal, and Journey 2's
  requirement that the kit's size never perturb the band.
- **"Nothing studies this phase yet", inside the opener** — the Drawer's copy,
  kept and relocated. Journey 6 needs an empty phase to give a reason; the
  Drawer's own doubt block suspects it was being judged on that sentence rather
  than on its layout, and this is that suspicion taken seriously: **keep the
  sentence, drop the five columns.**
- **The nameplate** — Journey 3, stolen as noted above.

### This is a synthesis, not a pick, and that needs ratifying

The three candidates were drawn to be chosen between and the journeys did not
choose one. That is a legitimate outcome of the method — a journey selects a
property, and properties can be assembled — but it means **no drawing above is
the selected arrangement**, and the synthesis has never itself been drawn at 0,
1 and many. Until it is, it inherits its predecessors' doubts without having
earned their evidence.

Two of those doubts transfer directly and remain open:

- **The readout's mask class is still unresolved.** Adding the Rail's line to it
  does not settle whether orientation dims under strict.
- **The Bench's central objection survives the borrowing.** A learner who never
  opens the opener still learns there is a "study this" button. The Rail's line
  in the readout is the mitigation, and it is a mitigation, not an answer.

## What this document is asking of the design review

1. **The three candidates disagree about one thing — is the kit visible at
   rest** — and every other difference follows from it. If the reviewer has a
   view on that question directly, it settles more than the drawings do.
2. **The rail's narrow-viewport failure is not a detail.** Its honest
   degradation is "become a different candidate", which may mean the project
   ends up maintaining two arrangements.
3. **The bench's readout has an unresolved mask class**, and getting it wrong
   makes the instrument go quiet exactly when it is most needed.
4. **The drawer may be a copy question wearing a layout costume.** If "nothing
   studies this phase yet" is the right sentence, the drawer is honest; if it is
   the wrong sentence, no arrangement saves it.
5. **All three are drawn at a kit of two lenses on one phase, which is today.**
   None has been drawn against the instrument this project intends to have, and
   the candidate that wins today may not be the one that wins at thirty lenses.
6. **The selection pass produced a synthesis rather than a pick**, which is a
   legitimate outcome of the method and also means the thing it selected has
   never been drawn. It should be ratified — or rejected in favour of one of the
   three as drawn — before anything is specified against it.
7. **Journey 4's trap belongs to the control row, not to any candidate.** The
   strict toggle sits beside the level selector in all three, so the escape is
   always nearer than the repair. That is a live question this pass could not
   answer and did not.
8. **No drawing here has been seen by anyone who is not its author.**

## Navigation

- The region: [`../README.md`](../README.md) — what the orchestrator renders and
  the constraints these drawings respect.
- Sibling twin documents: [`personas.md`](./personas.md) — whose competing
  demands the band is spending; [`user-journeys.md`](./user-journeys.md) — the
  journeys these arrangements are chosen against.
