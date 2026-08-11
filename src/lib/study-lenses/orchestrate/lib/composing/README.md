<!-- cspell:ignore renderable Gateable -->

# composing

The composition library: the mount-time joins, the configuration cascade, and
renderable-lens recovery. Everything here is a pure function; the top component
calls them and holds the results.

The region [README](../../README.md) owns what composition means for the study
environment; this document owns the mechanics.

## The joins

At mount, the built-in lens roster joins the host's injected lenses, and the
built-in level roster joins the injected levels. Joining is **append-only** —
nothing replaces or shadows a built-in — and collisions are **loud**: a
duplicate lens name or level key throws, naming the offender, at the author's
desk. The empty level key `''` is reserved for the none-state and cannot be
injected; injecting it throws its own error, checked before the duplicate scan.
Joined rosters are session-fixed and frozen — structure frozen, lens refs
excepted, because the refs stay owned by their defining modules.

The **built-in rosters** live here as constant files — the append-base every
join extends. The scaffolding level is never among them: it reaches a session
through injection only, like any host-provided level.

## The cascade

Configuration resolves **per lens name**, over three ordered override layers:
the host's `configs` prop, then the opening overrides of a recommendation-opened
lens, then the learner's session tweaks — the learner layer is always final. The
opened layer exists because a recommendation's overrides enter the cascade below
the learner's own tweaks (canon: `Recommendation.config` in
[`../../../lenses/types.ts`](../../../lenses/types.ts)) — folding them into the
learner layer would let a proposal overwrite a tweak the learner already made.
Resolution runs through the lens's own `config` factory when the lens declares
one, else through the shared deep-merge; both paths are canon (`Lens.config`,
same file), not a design choice made here. An override key present with value
`undefined` is treated as absent; `null` is a value. The opened layer carries at
most the open lens's proposal overrides — its lifecycle (set at a
recommendation-opened mount, cleared with the open-lens choice) is the
session-choice owner's, like every layer's contents: this library resolves the
layers it is handed and holds nothing between calls.

## Renderable-lens recovery

The embodiment attaches lenses to phases as `Gateable` refs — embody's
structural view, which carries no component. Recovery exists because a
`Gateable` cannot be rendered: the renderable `Lens` must be found again in the
joined roster, by **reference identity** — no casts, ever. Every attached ref
resolves by construction: embody gates only the roster the composition root
passed it, so an unknown ref is a broken embody invariant, not an expected
input. A hit is reported loudly as a defect — never gated behind development
mode — and the ref is dropped from the render, because nothing in the study
surface throws at the learner. The joined roster is the one truth of what this
session can render.

## A gap in the reserved-key guard

The reserved-key guard covers INJECTED levels only. A built-in claiming the
empty key `''` would collide with the reserved default and become
default-selected — nothing stops it, and the absence is pinned only indirectly,
by an interface test that would also pass for other reasons (recorded
2026-07-30). Either extend the guard to cover built-ins, or pin the absence with
an assertion that names it; until then a built-in's key is trusted rather than
checked.

Related, from the same review: `index.test.tsx`'s "mounts the selector when
levels are registered" no longer discriminates — the selector mounts
unconditionally now, so the assertion would pass with zero injections. No
coverage is lost (the scaffold option is checked directly elsewhere); the name
claims more than it proves.

## Navigation

- Library index: [`../README.md`](../README.md); region root:
  [`../../README.md`](../../README.md).
- [`DOCS.md`](./DOCS.md) — this library's architectural sketch.
- [`types.ts`](./types.ts) — the joined-roster and cascade contracts.
- Siblings: [`../honoring/`](../honoring/README.md) resolves focus requests
  against the joined roster; [`../recommending/`](../recommending/README.md)
  ranks what fitting lenses propose.
