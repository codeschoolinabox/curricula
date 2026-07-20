<!-- cspell:ignore entwined renderable -->

# debug-props

The developer's meta-lens: it renders a readable dump of what a lens receives.
Every lens is mounted with exactly two things — the frozen embodiment and its
resolved configuration ([`../types.ts`](../types.ts) `LensProperties`) — and
this lens shows both, summarized, on screen. Mount it against any program to see
the seam itself: which fact stages derived and which failed, which lifecycle
phases are accessible and what is attached to them, and which configuration
record actually arrived.

It is a development harness, not a pedagogical surface — no exercise, no
scoring, no recommendation. Think debug HUD: helpful while building lenses and
verifying the composition root's wiring; never the right answer for a curriculum
page.

## What this lens is

A [`Lens`](../types.ts) like any other:

- `name`: `"debug-props"`.
- `main`: a thin component that calls the pure core's summary derivation and
  renders one panel per summary section.
- `applicability`: always `true`. The dump is total by construction — every arm
  of the summary handles both the ok and the failed shape of its stage, so any
  embodiment whatsoever is renderable.
- `phase`: deliberately absent — panel-excluded. The lens teaches no lifecycle
  phase, so embody neither gates nor attaches it; it never appears in the study
  strip and mounts only by explicit request (the focus request is how a harness
  reaches it).
- no `config` factory — the lens declares no defaults of its own; the shared
  merge applies the cascade directly, and whatever record results is echoed back
  verbatim. The echo is the point: arbitrary keys passed through the cascade
  come back out where the harness can read them.
- no `recommend` — a debug HUD proposes no next study step.

## The props summary

The pure core derives the view-model the component renders — here called the
**props summary**, one serializable record of the two props:

- **facts** — one entry per fact stage, in the stage order of
  [`../../embody/types.ts`](../../embody/types.ts) `Facts` (`source`, `tokens`,
  `ast`, `entwined`, `environment`, `type`). An ok entry carries the stage name,
  `ok: true`, and a compact `description` string: character count for `source`,
  token count for `tokens`, syntax-node count for `ast`, entwined-node count for
  `entwined`, scope count for `environment`, and the snippet type for `type`. A
  failed entry carries `ok: false` and a `causeMessage` — the stage's cause
  message in the machine's own words; the summary reports, it never rephrases.
- **study** — one entry per lifecycle phase, in specification order (`source`,
  `tokens`, `ast`, `environment`, `evaluation`). Each entry carries the phase
  name, its `accessible` flag, and the names of the lenses attached to it; a
  barred entry additionally carries the barring cause's `causeMessage`.
- **config** — the resolved configuration record, echoed as frozen data.

Counts, not contents: the summary answers "did the stage derive, and roughly
what is in it" at a glance. Deep inspection of a particular node or scope is
DevTools work on the mounted props, not this lens's surface.

## Selector contract

The rendered output is addressed by data attributes, never by label text:

- `data-lens="debug-props"` (the region-wide lens-root convention) and
  `data-debug-props` (this lens's own selector) — both on the root element.
- `data-debug-panel="facts" | "study" | "config"` on the three panels.
- `data-fact-stage="<stage>"` on each fact entry inside the facts panel.
- `data-study-phase="<phase>"` on each phase entry inside the study panel.

Fact and study entries render as `<dt>`/`<dd>` groups inside a `<dl>`; the
config panel renders its record as JSON inside `<pre>` (or an `(empty)`
placeholder when the record has no keys). Content is always rendered as text —
never interpreted as markup.

## How to navigate the code

- [`index.tsx`](./index.tsx) — the `Lens` object (default export) and its thin
  component.
- [`core.ts`](./core.ts) — the pure core: embodiment + config → props summary.
- [`types.ts`](./types.ts) — the props-summary types.
- `tests/` — core tests over real `embody()` output (no DOM) and component tests
  (jsdom).

## Navigation

- Region contract: [`../README.md`](../README.md) (kind mechanics) ·
  [`../types.ts`](../types.ts) (`Lens`, `LensProperties`, `LensConfig`).
- Embodiment contract: [`../../embody/types.ts`](../../embody/types.ts)
  (`Embodiment`, `Facts`, the stage envelopes).
- This lens's architecture: [`./DOCS.md`](./DOCS.md).
