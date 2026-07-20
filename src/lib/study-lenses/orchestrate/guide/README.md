# guide

The embedded guide — help never withheld. A small, permanent surface offering
static authored topics about the study environment itself: what the five phases
are, what a language level is, what warn and strict mean, what the snippet-type
toggle changes. Collapsed behind a reveal by default; alive under every posture.

The region sketch ([../DOCS.md](../DOCS.md)) owns the class-2 criterion the
guide exists under — a control whose availability restores what the learner
needs, here orientation, is never masked; this document owns the rendered
contract.

One disambiguation this surface owes the package: the package prose calls
language levels "guides" (opt-in guides, never gatekeepers) — a metaphor about
levels. The **guide** is this concrete surface; a level is never "the guide".

## What renders

- **The reveal** — a single control, collapsed by default. Opening it shows the
  topic list; closing it hides the list. Whether the guide is open is
  component-local ephemeral UI state — not a session choice; it neither reaches
  the top component nor survives the component.
- **The topics** — the guide's own authored constant: a fixed, ordered set of
  short orientation topics, each with a stable key (the data-attribute
  identity), a title, and a plain-text body, rendered in array order. They
  describe the instrument, never the learner's program — program explanation is
  lens work, and level documentation is each level's own. The v1 topics, by key:
  `phases` · `levels` · `posture` · `snippet-type`.

The guide renders no heading element of its own: the reveal is a button-labeled
disclosure (`aria-expanded` on the control), and topic titles render at `h4`
inside the revealed region — the instrument's only headings, keeping the region
README's embedding constraint true. The guide renders last in DOM order.

The guide takes no props and derives nothing. Its topics are its own content,
like a level's docs are the level's own — the top component mounts it, and
nothing configures it. Curating or injecting guide topics is not part of the
host surface.

## Selectors are data attributes

`data-guide` on the root; `data-guide-reveal` on the reveal control;
`data-guide-topic="<key>"` per topic entry. Tests and consumers anchor on
attributes and values, never on title or body text — the authored copy can
change freely.

## What this surface does not own

Program explanation (lens work); level documentation (each level's own, on the
selector's hover); the mask (this surface is never under it); session choices
(the top component's — the guide holds none); the canonical phase labels, level
definitions, and posture semantics — each is single-sourced elsewhere, and the
guide orients toward them without restating them as truth: a topic body never
enumerates the display-label strings or duplicates a glossary definition.

## Navigation

- Region root: [`../README.md`](../README.md) — the host surface and the
  region's mechanics.
- [`DOCS.md`](./DOCS.md) — this surface's architectural sketch.
- [`types.ts`](./types.ts) — the topic contract.
- Siblings: [`../level-ui/`](../level-ui/README.md) and
  [`../phases-panel/`](../phases-panel/README.md) are the other rendered
  surfaces beside it.
