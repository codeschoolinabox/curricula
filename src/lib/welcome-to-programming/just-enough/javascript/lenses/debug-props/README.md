# debug-props

A meta-lens that renders its received [`LensProps`](../types.ts) (`embodiment` +
optional `config`) as on-screen panels. Useful for sandbox harnesses,
integration tests, and verifying the orchestrator's resolution chain end-to-end
without mounting a pedagogical lens that would consume the props for its own
rendering.

## What this lens is

A [`LensModule`](../types.ts) like any other:

- `name`: `"debug-props"`
- `Component`: a React wrapper that derives a serializable display tree from the
  incoming `LensProps` and renders one panel per derived field (snippet source,
  embodiment status flags, embodiment validation summary, config entries).
- `config`: returns an empty object by default; merging external overrides lets
  the lens echo arbitrary keys back so the harness can confirm the resolution
  chain handed the right bundle through.
- `applicableTo`: always `true`. The lens is shape-agnostic; any `Snippet`
  (parsed or not, evaluable or not) is renderable as read-only fields. Tier-1
  per the lenses peer's three-tier classification.
- `recommend`: returns an empty array. The lens is for harness work, not
  pedagogical recommendation; the WS2 recommender does not surface it in the
  recommendations panel.

## Why this lens exists

The orchestrator's four-prop public API
(`<StudyLenses snippet lens? config? configs?>`) routes resolved props through a
per-lens resolution chain
(`module.config() ⊕ configs?.[lensName] ⊕ config`-when-resolved-default).
Verifying that chain visually requires a lens that **echoes its incoming props**
rather than consuming them for its own UI. `debug-props` is that echo.

It also bootstraps the lens-mount path in the orchestrator: `debug-props` is the
**first registered lens against the new `LensModule` contract**, exercising the
contract end-to-end while the WS4 pedagogical lenses are still pending. The
shape of the lens registry itself remains open-spec (per the lenses peer's
[`./DOCS.md` §Out of scope](../DOCS.md) — F4 Phase 0 nails it); debug-props
slots in whatever shape F4 picks.

`debug-props` is **NOT F4's pedagogical trial lens**. F4
([`../../.planning-handoffs/03-orchestrator-and-contracts.md`](../../.planning-handoffs/03-orchestrator-and-contracts.md))
specifies the trial lens as a real pedagogical surface (highlight, parsons,
blanks, etc.) that Layer-I/II surfaces can enumerate and rank — debug-props's
`applicableTo: () => true` and `recommend: () => []` deliberately skip the
ranking surface. The two are complementary: debug-props bootstraps the registry
shape; F4 bootstraps the pedagogical trial.

The lens is **not** a pedagogical surface — it has no learner-facing exercise,
no validation, no scoring. Treat it the same way you'd treat a debug HUD:
helpful in development; never the right answer for a real curriculum page.

## Glossary

- **Display tree** — the serializable record the pure-TS core produces from
  `LensProps`. Each top-level key becomes one rendered panel in the React
  wrapper.
- **Panel** — a labeled `<section>` element rendered for one display-tree field.
  Carries a `data-debug-panel="<key>"` attribute for sandbox-harness selectors.

(No new domain terms in the embody-contract-conformance task — the "5 shape
leaves" / "staircase" terminology stays in `embody/`'s vocabulary; debug-props
just consumes it. See
[`../../embody/README.md` § Named scenarios](../../embody/README.md) for the
5-leaf catalog and [§ Panel contract](#panel-contract) below for how
debug-props guards on it.)

## Panel contract

Panel content follows the `Snippet` staircase from
[`../../embody/types.ts`](../../embody/types.ts). Each panel guards on the
appropriate `embodiment.status.*` boolean (or equivalent presence check on
an optional field) before reading optional fields:

- **Snippet panel** — always renders (`source.code` is always present).
- **Status panel** — always renders. Shows the four status booleans
  (`tokenized, parsed, validated, created`) **plus the first-fail kind**
  (`embodiment.errors.kind`, or `null` when all gates passed). The errors-kind
  echo is a deliberate tag-along: `Snippet.errors` is a peer of `Snippet.status`
  at the embody-contract level, and the harness wants both visible together
  to verify the first-fail-wins gate semantics.
- **Validation panel** — renders the validation flags
  (`formatted, isJeJ, isDeterministic, doesPause`) + violations count **when
  `embodiment.validation` is present** (validate-fail, create-fail, and apex
  leaves). On tokenize-fail and parse-fail leaves, `validation` is absent per
  the embody contract; the panel renders the placeholder
  `(validation absent — gated on parse success)`. (See
  [`./DOCS.md` § Display derivation](./DOCS.md) for the gate-phrasing
  rationale.)
- **Config panel** — always renders. When `config` is `undefined` OR an empty
  object `{}`, content is the placeholder `(empty)` (see
  [`./DOCS.md` § Display derivation](./DOCS.md) for the rationale on
  collapsing both cases). Otherwise renders the resolved bundle.

**Intentionally not surfaced**: `embodiment.static`, `embodiment.parse.*`, and
`embodiment.streams.*`. Those fields are embody-graph concerns; debug-props's
focus is the resolution-chain echo (snippet round-trip + status gates +
validation summary + per-lens config), not a full embody-output inspector. A
future `embody-graph` lens would own that surface.

The panel keys (`snippet`, `status`, `validation`, `config`) are stable
sandbox-harness selectors. Renaming or removing a panel is a contract change;
adding a NEW panel (with a fresh key) is non-breaking.

## Public API

The default export is a `LensModule` whose `Component` accepts the standard
[`LensProps`](../types.ts):

```tsx
<DebugPropsLens.Component embodiment={frozenSnippet} config={resolvedConfig} />
```

The wrapper renders a root element carrying `data-lens="debug-props"` (per the
lenses peer's [§Structural constraints](../DOCS.md) contract) and one
`<section data-debug-panel="<key>">` per display-tree field.

## How to navigate the code

- `index.tsx` — default export: the `LensModule` with the React `Component`
  field. Wraps `core.ts`'s display-derivation in a React tree and renders
  panels.
- `core.ts` — pure-TS display-derivation. Maps `LensProps` → `DisplayTree`. No
  React imports; testable in vitest without `jsdom`.
- `types.ts` — `DisplayTree` + the panel-record types this module uses
  internally.
- `tests/core.test.ts` — vitest, no jsdom. ZOMBIES coverage of the
  display-derivation core.
- `tests/component.test.tsx` — vitest + jsdom + `@testing-library/react`.
  Confirms the wrapper renders one panel per derived field with the correct
  `data-debug-panel` attribute.

## Conventions inherited

Follows all conventions in [`../README.md`](../README.md) and
[`../DOCS.md`](../DOCS.md). Notable inheritance:

- **Two-layer module shape** — core (pure TS) + wrapper (React).
- **`data-lens="debug-props"` on the wrapper's root element** — load-bearing for
  sandbox harnesses.
- **`embodiment` parameter name** in core signatures.
- **Disposable practice** — no cross-mount state; React owns the lifecycle.
- **Read-only views** — the lens never mutates `embodiment` or `config`.

## Navigation

- **Parent**: [`../README.md`](../README.md) — the lenses peer.
- **Architectural sketch**: [`./DOCS.md`](./DOCS.md).
- **Type contract**: [`./types.ts`](./types.ts).
- **Lens contract**: [`../types.ts`](../types.ts) — `LensModule` + `LensProps` +
  `LensConfig`.
- **Embodiment contract**: [`../../embody/types.ts`](../../embody/types.ts) —
  the `Snippet` type the lens displays.
- **Orchestrator that mounts this lens**:
  [`../../orchestrate/`](../../orchestrate/) — see § Public API for the
  `lens="debug-props"` dispatch path.
