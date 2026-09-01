# rail

The lifecycle drawn as the machine's own conveyor: a line carrying one
**station** per phase in the machine's fixed order, with the **barring edge**
drawn between the last reachable station and the first waiting one, each
station's **tray** opening beneath the line, and **the caption** beneath that.
It supersedes the lifecycle strip — the row of per-phase selects this region
shipped first.

The region [README](../README.md) owns what the rail means in the study
environment and the vocabulary it draws; this document owns the rail's own
contract.

## The order arrives, it is never minted

The rail receives its stations as a prop and draws them in the given order. It
never sorts, never inserts, and never knows the canonical five — the lifecycle
order has exactly one truth, and it is not here.

## What a station shows

One station per phase, and it carries four things: the phase (the key, never
drawn), the label and the short label, the standing, and its tray where it has
one. The rail draws the **short label** where width demands it and the tray
draws the **full** one; it never switches vocabulary.

- **openable** — reachable, and something fits it. Drawn as its disclosure
  control with the **kit count**, and it has a tray. The count is the size of
  the kit that tray discloses, so the two cannot disagree.
- **bare** — reachable, nothing fits. Drawn as a single mid-line dot and no word
  at all. **No tray and no disclosure control** — not a disabled one; there is
  nothing there to be disabled. This is the ordinary case at four of five
  phases, not a degenerate one.
- **waiting** — barred, downstream of the barring edge. Drawn as `not reached`.
  The machine value and the learner's word are decoupled.

**The barring edge is drawn between two stations, never on one**, because a
phase's own error never bars it — the phase where the machine broke stays open,
since that is where the error is studied. A suffix waits and never a scatter, so
the edge's position follows from the standings rather than from a prop of its
own.

**The occupant dot** marks the station whose lens the pane is currently holding.
It is not a station property — it is read from the committed open lens at
render, so the rail answers "where am I" with the tray closed. It marks no
station at all when the pane holds the editor or the generator.

## The caption

One slot beneath the rail, and its precedence is **total**: the **cause line**
wherever a barring edge is drawn, else the **count line**, else nothing.

The two arms differ in shape. The count line is one line, singular at one and
absent at zero. The cause line is a **block** — a framed message, and beneath it
the unreached count. The framing is keyed by the **stage that failed**, never by
the phase that is barred, because an `ast` failure and an `entwined` failure bar
exactly the same phases and mean entirely different things.

**The two counts are different numbers over different predicates and never both
on screen**: the count line counts what is accessible and unserved, the cause
arm's second row counts what waits. Neither ever stands in for the other.

**An open tray never takes the caption.** A tray opens BETWEEN the rail and the
caption and pushes it down along with the pane, because a tray describes one
station while the caption describes the rail as a whole.

## One intent, and the owner resolves it

Pressing a tray entry raises one intent carrying the phase and the lens. Nothing
opens or closes here. The open lens's own tray entry is also its close
affordance, while a recommendation may target the open lens and re-open it — so
the same lens carries two affordances of opposite meaning, and only the top
component knows which lens is open. The rail raises the press; the owner
resolves it.

## Selectors are data attributes

Every station and affordance is anchored by attribute and value; drawn copy is
never a test anchor. `data-rail` on the line; `data-station="<phase>"` per
station; `data-station-standing="<standing>"`; `data-station-tray` on an open
tray; `data-station-occupant` on the marked station; `data-barring-edge`;
`data-caption`, with `data-caption-cause` or `data-caption-count` on whichever
arm it holds.

**No heading elements.** Every station name and tray label is inline text, and
the structure a screen reader traverses comes from named regions and groups
rather than from a heading outline — the region's only headings belong to the
guide, so a host may mount the instrument under any shallow context.

## What the rail does not own

Fit and accessibility (embody derives both, upstream); the phase order (embody's
runtime constant); the strings it draws (`../display-labels.ts` keys every one);
mounting a lens, closing it, and masking it (the top component commits; the rail
only asks); any knowledge of levels, verdicts, or postures — **the rail is class
3 and takes none of the four routes into class 2**, which is why it dims whole
under strict.

## Navigation

- Region root: [`../README.md`](../README.md) — the host surface, the region
  glossary, and the enforcement story.
- [`DOCS.md`](./DOCS.md) — this surface's architectural sketch.
- [`types.ts`](./types.ts) — what the rail receives and the one intent it
  raises. The station and caption vocabulary lives in
  [`../types.ts`](../types.ts).
- The twin: [`../ux/wireframes.md`](../ux/wireframes.md) draws the rail through
  every state.
