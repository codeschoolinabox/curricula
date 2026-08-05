# embedded-guide

The omnipresent region's **meta** tool: the orchestrator-resident learner guide
to the environment itself — what the stations are, why they appear and
disappear, what the toggles and limits do, what danger mode risks. It produces
nothing _about the program_ and explains no single subject; it explains the
**instrument**. The meta kind's one inhabitant today.

The canonical placement lives at
[`../README.md` § The omnipresent region](../README.md) — that section is the
contract; this README is the module-local orientation.

## What lives here

```text
embedded-guide/
  README.md   (this)
  DOCS.md     architectural sketch + Mermaid
  index.tsx   <EmbeddedGuide> — presentation only (authored content)
  tests/      vitest jsdom tests
```

## The component

`<EmbeddedGuide>` is **presentation only** and **program-independent**: it
renders authored documentation of the instrument and a reveal affordance. It
reads no embodiment, takes no program input, and holds no orchestrator state —
unlike the dock (run/debug) and the generative lenses (program-dependent), the
guide is the same regardless of the snippet. Its content is real authored prose
(drawn from the instrument's own design — stations, reveal rules, toggles,
limits, danger), not a mock.

Props (full contract in [`./index.tsx`](./index.tsx) JSDoc):

| Prop       | What it carries                                         |
| ---------- | ------------------------------------------------------- |
| `revealed` | whether the guide is expanded (disclosure state)        |
| `onToggle` | the reveal affordance click, routed to the orchestrator |

## Selectors

`data-orchestrator-guide` — the embedded-guide root (full list in
[`../README.md` § Data attributes](../README.md)). Whether the guide is
always-shown or click-to-reveal, and its visual treatment, are Phase-1
presentational choices.

## Durable rules

- **Meta, not generative or reactive.** The guide documents the environment; it
  produces nothing about the program and is not a reactive explainer (that is
  `error-interpret`, surfaced where errors appear — not a button).
- **Program-independent.** No embodiment access; the content does not change
  with the snippet. This is the structural distinction from the generative
  lenses (program-dependent).
- **Authored content, not a mock.** The guide ships real instrument
  documentation; it is "stub-bridged" on nothing.

## Navigation

- **Parent**: [`../README.md`](../README.md) — § The omnipresent region.
- **Sketch**: [`./DOCS.md`](./DOCS.md).
- **What it documents**: § The phases panel, § The dock, § The omnipresent
  region in [`../README.md`](../README.md) (the instrument the guide explains).
