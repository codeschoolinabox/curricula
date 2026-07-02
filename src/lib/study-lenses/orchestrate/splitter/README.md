# splitter

An orchestrate-local presentation module: `<Splitter>` renders **two panes with
a draggable divider** and owns only its own **disposable** split size (React
re-inits `defaultBasisPx` on remount — the LMS owns persistence, not this
module). It relies on the orchestrator's co-located `../orchestrate.css` for
static layout, so it is **not** standalone-portable.

It backs two dividers in `<StudyLenses>`: the **horizontal** one between the
active surface and the output-panels column, and the **vertical** one between
the User Interface and Developer Console panels.

## What lives here

```text
splitter/
  README.md    (this)
  DOCS.md      architectural sketch + Mermaid data-state flow
  types.ts     SplitOrientation | SizedPane (the shared named exports)
  geometry.ts  the pure core (default-exported bag of 4 functions)
  index.tsx    <Splitter> — the component (the only impure glue)
  tests/       geometry.test.ts (pure) + index.test.tsx (jsdom wiring)
```

## The component

```text
<Splitter
  orientation="row" | "column"   // row = side-by-side (vertical handle,
                                  //   horizontal drag); column = stacked
  sizedPane="first" | "second"    // which pane carries the explicit px basis;
                                  //   the other flexes (flex: 1 1 0; min-*: 0)
  defaultBasisPx={number}         // px — NOT a CSS-length string
  minPx={number}
  maxPx={number}
  maxFraction={number}            // OPTIONAL 0–1: also cap at fraction*container
  stepPx={number}                 // keyboard nudge
  label={string}                  // separator aria-label
  resizeMode="fixed" | "proportional"  // OPTIONAL (default "fixed"): on a
                                  //   CONTAINER resize, keep the px basis
                                  //   ("fixed") or preserve the ratio
                                  //   ("proportional")
  first={React.ReactNode | null}
  second={React.ReactNode | null}
/>
```

**px-numbers end-to-end** (props, state, inline style, ARIA `aria-valuenow`) —
this dissolves the CSS-string ↔ pure-px mismatch and makes everything
jsdom-assertable. Want a rem default? Resolve `rem → px` at the CALL SITE
(`24 * 16`), not in the contract.

## The pure core (`geometry.ts`)

The jsdom-independent correctness surface — a default-exported bag of five pure
functions of numbers (no DOM, no React):

| Function            | What it computes                                                               |
| ------------------- | ------------------------------------------------------------------------------ |
| `clampBasis`        | clamp a basis into `[minPx, maxPx]` (inverted interval → the floor wins)       |
| `resolveMaxBasisPx` | the effective max from `maxPx` + optional `maxFraction` + measured container   |
| `nextBasis`         | drag → clamped basis (`sizedPane: 'second'` inverts the sign)                  |
| `nextBasisFromKey`  | keyboard → clamped basis (value-centric: `ArrowUp`/`Right` grow, `Home`/`End`) |
| `rescaleBasis`      | proportional resize → basis scaled by the container-extent ratio (clamped)     |

The component delegates every size decision here, so the arithmetic is
exhaustively unit-tested without a renderer.

## Drag transport (mouse + window listeners)

**Not** the pointer/`setPointerCapture` pipeline the original sketch named: this
repo's jsdom has no `PointerEvent` (pointer events carry no `clientX`) and no
`setPointerCapture`. `<Splitter>` uses **mouse events** (which carry `clientX`
in jsdom — the `annotate` precedent) and, while dragging, listens on
**`window`** so the divider keeps tracking after the pointer leaves the thin
handle. The drag **anchor** (start basis + start coord + resolved max) is a
**ref** (stale-closure-safe); only the committed basis is React state. The
`getBoundingClientRect` container **Measure** happens only when `maxFraction` is
set. Drag FEEL / limits / grabbability are verified at the human Sandbox
checkpoint (jsdom computes no layout). See [DOCS.md](./DOCS.md) § Drag
lifecycle.

## Selectors (the stable test/sandbox surface)

All under `[data-orchestrator-root]` (leak-guarded by
`../tests/orchestrate-css.test.ts`).

- `data-orchestrator-splitter="row|column"` — the flex container.
- `data-orchestrator-splitter-pane="sized|flex"` — the two panes. The `sized`
  one carries an inline `flex-basis` (px) + an `id` (for `aria-controls`); the
  `flex` one fills (`flex: 1 1 0; min-*: 0`).
- `data-orchestrator-splitter-handle` — the divider: `role="separator"`,
  `aria-orientation` (**row → `vertical`**, column → `horizontal` — reads
  backwards, pinned by a test), `tabindex="0"`,
  `aria-controls="<sized pane id>"`, `aria-valuenow={basisPx}`
  `aria-valuemin={minPx}` `aria-valuemax={effectiveMaxPx}` (the fraction-capped
  REACHABLE ceiling, not the raw `maxPx` — see § The maxFraction guard),
  `aria-label={label}`.

## Degenerate states (first-class, NOT edge cases)

- **One pane `null`/absent** (the default resting state — e.g. idle → no output
  panels, or one channel dismissed): render the present pane as a lone `flex`
  pane, **no handle**, no split.
- **Both `null`:** render nothing (the component returns `null`); the owner
  keeps its own root (e.g. the output-panels `<section>` persists around us).
- Only when **both** panes are present does the handle render.

## Durable rules

- **Disposable size.** `useState(defaultBasisPx)` — React re-inits on remount;
  no persistence, no orchestrator coupling. A later `configs`-tier persistence
  can add optional `basisPx?` + `onResize?` (controlled mode) as a SUPERSET.
- **The sign depends on `sizedPane`, not `orientation`.** A positive drag delta
  grows a `first` sized pane and shrinks a `second` one; the component passes
  axis-correct coords (`clientX` for row, `clientY` for column), so
  `orientation` is orientation-invariant in `nextBasis` (pinned by the unit
  matrix).
- **The `maxFraction` guard.** An unmeasured / zero container
  (`containerPx <= 0`) SKIPS the fraction cap and falls back to `maxPx` —
  correct in jsdom and pre-layout in a real browser (never cap by an extent not
  yet laid out).
- **Honest `aria-valuemax`.** When `maxFraction` is set, the effective ceiling
  (`min(maxPx, container × maxFraction)`) is tracked in state — measured on
  mount and on container resize (feature-detected `ResizeObserver`), refreshed
  at drag/key time — and reported as `aria-valuemax`, so a screen reader hears
  the REACHABLE maximum rather than the raw `maxPx`. Drag/keyboard clamp to the
  same value.
- **The fill-chain.** Each pane is a flex host whose single child — text, an
  editor, or a NESTED splitter — fills it in both axes (`orchestrate.css`,
  `[data-orchestrator-splitter-pane] > *`). Without it a nested splitter sizes
  to its content, so a vertical splitter can't divide the height a horizontal
  splitter's pane provides (the flex child collapses to 0).
- **`resizeMode` (default `fixed`).** On a CONTAINER resize (NOT a divider
  drag), `fixed` keeps the sized pane's px basis (the flex pane absorbs the
  change); `proportional` rescales the basis by the container-extent ratio so
  the split RATIO is preserved (e.g. the UI/console divider keeps its share as
  the editor-driven height changes). The rescale rides the same
  `ResizeObserver`; jsdom fires none, so it is pure-tested (`rescaleBasis`) +
  Sandbox-verified.

## Navigation

- **Parent**: [`../README.md`](../README.md) (the `<StudyLenses>` orchestrator),
  [`../orchestrate.css`](../orchestrate.css) (the Splitter's static layout).
- **Sketch**: [`./DOCS.md`](./DOCS.md).
- **Drag precedent**:
  [`../../lenses/annotate/index.tsx`](../../lenses/annotate/index.tsx).
