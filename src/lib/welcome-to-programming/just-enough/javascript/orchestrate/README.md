# orchestrate

The package's React-aware peer. Wires [`embody/`](../embody/) (the operational
NM data layer), [`lenses/`](../lenses/) (the read-only views), and the home-base
[`editor/`](./editor/) into one consumer-mountable surface, and ships the
package's public API: `<StudyLenses>`.

## What lives here

```text
orchestrate/
  README.md                  (this — orientation + navigation)
  DOCS.md                    architectural sketch + Mermaid (peer + StudyLenses)
  types.ts                   <StudyLenses> prop contract + state shape + INTERNAL EventBus events

  index.tsx                  the <StudyLenses> component
  toolbar.tsx                lens-picker dropdown (planned, L1)
  recommendations-panel.tsx  recommendations panel UI (planned, L5)
  tests/                     vitest jsdom tests (per-increment)

  editor/                    default home base — only writer of snippet state
    index.tsx, editor.ts, README.md, DOCS.md, tests/

  lib/                       analysis helpers — all (embodiment) → result
    README.md                (index — links to per-lib READMEs/DOCS)
    recommender/             WS2 (02-analysis-and-recommender.md) owns
    socratizing/             Socratic micro-decision analysis
    completing/              autocomplete (editor concern)
    editing/                 editor integration helpers (CodeMirror wrapper)
    error-interpreting/      learner-friendly error messages
    jej-documentation/       JEJ docs for editor tooltips
    analysis/                snippet analysis report (WS2)
```

The peer follows a **primary-export-at-top-level** convention: `<StudyLenses>`
and its co-bundled UI files (toolbar, panel) sit at the peer's top level
alongside the subdirs `editor/` and `lib/`. This mirrors
[`../embody/`](../embody/)'s convention — the peer's primary export sits at the
peer's top level (`embody()` at `embody/index.ts`; `<StudyLenses>` at
`orchestrate/index.tsx`). Subdirs are separable concerns the peer also owns; the
orchestrator's primary export sits above them at the peer root.

The two subdirs map to separable concerns:

- **`editor/`** — the always-present home base where learners type snippets. Per
  the locked single-writer state model, this is the ONLY surface that mutates
  snippet state.
- **`lib/`** — pure-TS analysis utilities every consumer can call with an
  `embodiment` as input. The recommender lives here (WS2 owns it); the editor
  consumes the others (completing, editing, error-interpreting,
  jej-documentation, socratizing).

Everything else (the `<StudyLenses>` component, mode state, lens dispatch,
picker UI, panel UI, internal EventBus) lives at the peer's top level — these
are inseparable from the orchestrator because they ARE the orchestrator.

## Public API: `<StudyLenses>`

```tsx
<StudyLenses snippet="let x = 5; console.log(x + 1);" />
<StudyLenses snippet={X} lens="trace" />
<StudyLenses
  snippet={X}
  lens="parsons"
  configs={{ lenses: { parsons: { difficulty: 'easy' } } }}
/>
```

Three props (per the locked decision in
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)
and the **3-prop reshape** that absorbs `config` into `configs.lenses[lens]`):

| Prop      | Type                                                                                       | Required | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `snippet` | `string`                                                                                   | yes      | The code string. The orchestrator builds the embodiment internally — caller does NOT pre-build.                                                                                                                                                                                                                                                                                                                                                                       |
| `lens`    | `string`                                                                                   | no       | Default-mounted lens name (Q-III seam). Learner can switch via picker. Populated upstream by the plugin from per-fence info-string `:suffix`, frontmatter `defaultLens`, or sibling `@study-lens` directive. Cascade `defaults[lang]` is gate-only (it controls whether the fence transforms but does NOT populate `lens` per AR-1 locked decision 1); the cascade-supplied default seam is L2-deferred.                                                              |
| `configs` | whole resolved cascade (opaque); structurally `{ lenses?: Record<string, LensConfig>, … }` | no       | The whole resolved cascade from the `lenses.json` directory walk, passed through opaquely. Per-fence URL-style queries and sibling `@study-lens` directive JSON overrides are deep-merged INTO `configs.lenses[lens]` at plugin emission time. The orchestrator reads `configs.lenses?.[lens]` as the authoritative per-lens config; other top-level keys (`defaults`, `embedSiblings`, `exerciseSetPrefixes`) are accepted but unused at F1+B (L2 may consume them). |

The `lens` and `configs` props flow from per-fence info-string (`js:trace`),
per-directory `lenses.json` cascade, and the optional per-fence `@study-lens`
directive — the Docusaurus plugin at `src/plugins/study-lenses/` parses all
three input surfaces and emits the resolved values onto the JSX node. There is
no separate `config` prop; the per-fence/sibling override is folded into
`configs.lenses[lens]` before emission, so the cascade IS the merged truth.

> **F1 narrowing**: the three-prop signature is the public contract at the type
> level today; `snippet` is wired to runtime behavior in F1, and `lens` is
> partially wired against a single static-lens-registry entry (currently the
> meta-lens `debug-props` — see
> [`../lenses/debug-props/`](../lenses/debug-props/)) to support sandbox-harness
> verification of the three-prop shape end-to-end. When `lens` matches a
> registered key, the orchestrator mounts that lens with `embodiment` (built
> from `snippet` per F1) plus the per-lens resolved config (per § Per-lens
> config resolution chain). When `lens` is unset OR not in the registry, F1
> narrowing applies (no lens dispatch; mount the editor home base). `configs` is
> accepted on every render and consumed by the resolution chain when a
> registered lens dispatches. Wider behavior arrives in later increments: F4
> lands the first pedagogical trial lens (the registry grows beyond the
> `debug-props` bootstrap entry); L1 adds picker UI that enumerates registry
> entries; F2 wires editor → lens mode transitions; L2 wires full
> cascade-resolution coverage including the cascade-supplied default seam — a
> future hook inside `configs` (exact key shape L2-deferred; candidates include
> re-using `configs.defaults[lang]` as a per-language default-lens-name source,
> or adding a dedicated `configs.defaultLens` scalar slot) that may surface a
> default-lens-name from the cascade itself.
>
> The pre-3-prop **F1 mount-time guard** (`config` supplied without resolved
> `lens` → throw at mount) is gone: with no separate `config` prop, the guard
> has no trigger surface. The cascade-supplied default seam remains L2-deferred
> — at F1+B, an unresolved `lens` simply mounts the editor home base.
>
> **Silent-drop case (deferred to L2/F4).** When `lens` is supplied but not in
> the registry (e.g. `lens="parsons"` before F4 lands the trial lens), F1+B
> narrowing applies: the editor mounts and any `configs.lenses[lens]` entry
> supplied alongside is silently unused. This is expected behavior at F1+B —
> surfacing the unregistered-lens case as a build-time error or runtime warning
> is gated on the registry-shape decision (F4 Phase 0) and the cascade-supplied
> default seam (L2). Authors who hit this should consult React DevTools or the
> sandbox debug-props lens to confirm the prop shape.

### Per-lens config resolution chain

For any lens the learner mounts (default or picker-switched), the final config
is computed as:

```text
resolved(lensName) = module.config()                  // tier 0: lens defaults
                   ⊕ configs.lenses?.[lensName]       // tier 1: cascade (post-merge with per-fence/sibling override)
```

`⊕` is **deep-merge-right-wins**. Tier 0 is the lens's own default factory; tier
1 is the directory `lenses.json` cascade's `lenses[lensName]` entry, with any
per-fence URL-style query OR sibling `@study-lens` directive JSON override
already folded in at plugin emission time. There is no longer a separate per-
fence-override tier on the orchestrator side — the plugin pre-merges and ships
the result inside `configs`. The orchestrator threads this two-tier chain; lens
authors don't compute it themselves.

The full type declarations live in [`./types.ts`](./types.ts).

### Anti-patterns (durable rules)

- **No consumer-side sentinel branching.** During the Phase A embody mock,
  `embody(code)` accepts named-scenario sentinels (e.g. `"OK"`,
  `"FAIL_AT_PARSE"`). Orchestrator code MUST NOT branch on
  `snippet.source.code === "OK"` or any sentinel literal. Always branch on the
  resulting `Snippet`'s `status.{tokenized,parsed,created}`, `errors`,
  `validation`, and `endReport.outcome` fields. Sentinels are inputs to
  `embody()` only; in Phase B they vanish (real tokenization replaces the
  discriminator) and any consumer code that branched on them silently breaks.
  See [`../embody/index.ts`](../embody/index.ts) JSDoc and
  [`../EMBODY-IMPL-HANDOFF.md`](../EMBODY-IMPL-HANDOFF.md).
- **Single-writer state.** Only `orchestrate/editor/` mutates snippet source.
  Lenses are read-only views; they never mutate `embodiment` or call back into
  the editor.

## Pyramid placement

`orchestrate/` ships **the orchestrator side of Layers I-III** of the
Explorotron pyramid (per
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)):

| Layer                              | What `orchestrate/` provides                                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layer I (Lenses & defaults)        | Toolbar lens-picker (`toolbar.tsx`) + the `lens` prop seam (Q-I/Q-III bridge)                                                                                     |
| Layer II (Path generation)         | Recommendations panel UI (`recommendations-panel.tsx`) consuming `lib/recommender/` rankings                                                                      |
| Layer III (Manual recommendations) | `lens` + `configs` prop seam pre-filled by per-fence info-string and `lenses.json` cascade (per-fence override pre-merged into `configs.lenses[lens]`)            |
| Layer IV (Manual study paths)      | **DEFERRED** at snippet scope (per [`../.planning-handoffs/03-orchestrator-and-contracts.md`](../.planning-handoffs/03-orchestrator-and-contracts.md) § Layer IV) |

The pyramid base (Progress modelling) and top (Monitored learning) are
explicitly NOT owned by `orchestrate/` — those belong to the embedding LMS per
`../DOCS.md` § "What we explicitly do NOT own".

## The two selection surfaces

`<StudyLenses>` exposes two complementary lens-selection surfaces; both feed the
same lens-mount machinery (per
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)
implication 1):

1. **Toolbar lens-picker dropdown** (Q-I learner-driven exploration
   - Q-III educator-supplied default). Always visible; learner can switch to ANY
     registered lens at any time. Default-selected option comes from the `lens`
     prop.
2. **Recommendations panel** (Q-II auto-generated paths; Q-III educator-curated
   ranking overrides extend it via WS3 increments L7/L8). Opens via toolbar
   button. Renders the WS2 recommender's filtered + ranked grid (3D Block
   Model). Q-IV (per-snippet manual study paths / sequences) is DEFERRED
   entirely per
   [`../.planning-handoffs/03-orchestrator-and-contracts.md`](../.planning-handoffs/03-orchestrator-and-contracts.md)
   § Layer IV.

The picker is the lifelong-learning autonomy guarantee: it's NEVER hidden. The
recommendations panel is additive — it offers the guided path; the picker offers
the independent escape hatch.

## Editor-vs-lens state machine

Per
[F2](../.planning-handoffs/03-orchestrator-and-contracts.md#f2--editor-vs-lens-state-machine):
the UI is in exactly one of two modes at a time.

- **Editor mode** — the home base ([`./editor/`](./editor/)) is mounted. Learner
  types into the snippet. No active lens, no embodiment. Picker is visible;
  selecting a lens exits editor mode.
- **Lens mode** — a lens is active with a frozen embodiment + lens config bundle
  as props. Snippet is read-only; the learner cannot type. Switching lenses
  reuses the current embodiment. Switching back to the editor disposes the lens.

Returning editor → lens later builds a NEW embodiment (per the lazy embodiment
principle). Lens-internal UI state never carries across mode switches — the
disposability principle.

## Data attributes the DOM exposes

The set below is the orchestrator's stable selector surface. F1 ships the
**root** + **host** pair; the toolbar / picker / panel attributes land alongside
their owning increments (L1 picker, L5 panel) and are kept here so test authors
and sandbox harnesses know what to expect across the pyramid.

| Attribute                                 | Where                                                                                                                                                                    | Lands in | Used by                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------ |
| `data-orchestrator-root`                  | The wrapper `<div>` (toolbar + lens area)                                                                                                                                | F1       | Tests + sandbox locate the orchestrator instance.            |
| `data-orchestrator-host`                  | The host element where the active surface mounts (F1: a `<textarea>` for the editor home base; later increments may use a wrapping container when the surface needs one) | F1       | Tests + sandbox locate where the active surface mounts.      |
| `data-orchestrator-toolbar`               | The toolbar `<nav>`                                                                                                                                                      | L1       | Tests + sandbox locate the toolbar without depending on tag. |
| `data-orchestrator-lens-picker`           | The toolbar `<select>`                                                                                                                                                   | L1       | Tests + sandbox locate the dropdown.                         |
| `data-orchestrator-recommendations-panel` | The recommendations panel container                                                                                                                                      | L5       | Tests + sandbox locate the panel.                            |

**Directory → type/attribute asymmetry.** The directory is named `orchestrate/`
(verb) to mirror `embody/`'s convention of verb-named peers exporting their
primary surface at the peer's top level. The internal type names
(`OrchestratorState`) and DOM attributes (`data-orchestrator-*`) use the noun
form because that's how prose talks about it ("the orchestrator", "the
orchestrator state"). `embody/` doesn't expose a corresponding noun-form because
its primary surface is itself a verb (`embody()`); `orchestrate/`'s primary
surface is a noun-form component (`<StudyLenses>`), so the noun form creeps in
for internals. The asymmetry is honest, not a mistake.

## Conventions

Inherits all conventions from [`../README.md`](../README.md) and the top-level
`AGENTS.md`. Peer-specific rules:

- **Single-writer state**. Only [`./editor/`](./editor/) mutates snippet source.
  The orchestrator routes the edit-callback through; lenses are read-only views.
- **Internal-only EventBus**. Per
  [`../.planning-handoffs/03-orchestrator-and-contracts.md`](../.planning-handoffs/03-orchestrator-and-contracts.md)
  F5: the orchestrator's bus is for intra-component coordination. No outbound
  `subscribe` prop on `<StudyLenses>` until a concrete LMS integration target
  exists. Internal events (e.g. `lens-switched` from picker → orchestrator) are
  in scope.
- **Lazy embodiment**. Per F3: build embodiment only when needed (lens-open,
  evaluation trigger), never on every keystroke.
- **Disposable practice**. Per F2 + F4: lens-internal state is per-mount;
  snippet change unmounts the active lens; nothing carries across the edit.
- **Dependency rules** (per [`../DOCS.md` § Dependency rules](../DOCS.md)):
  - `orchestrate/` may import from `orchestrate/lib/*`, `embody/`, `lenses/`,
    `@-utils`.
  - `orchestrate/lib/*` may import from sibling `orchestrate/lib/*`, `embody/`,
    `@-utils`. Never from `lenses/`.
  - Lenses receive `embodiment` via props from the orchestrator; they never
    import from `orchestrate/` (top) or `embody/` (top).
- **React conventions** (component code):
  - React hooks live inside normal function components. No class components, no
    `this`. Multi-statement `useEffect` callbacks use named function expressions
    (lint pitfall #11 in
    [`../.planning-handoffs/03-orchestrator-and-contracts.md`](../.planning-handoffs/03-orchestrator-and-contracts.md)).
  - React component tests use `.test.tsx` and the `jsdom` environment
    (configured at the file level via `@vitest-environment jsdom`).
  - `vi.mock` factories that reference outer-scope variables wrap them in
    `vi.hoisted(() => ({ ... }))` (lint pitfall #12).

## Navigation

- **Parent**: [`../README.md`](../README.md) — package overview + Pedagogical
  first principles.
- **Architectural sketch**: [`./DOCS.md`](./DOCS.md).
- **Type contract**: [`./types.ts`](./types.ts).
- **Subdirs**:
  - [`./editor/README.md`](./editor/README.md) — the home base.
  - [`./lib/README.md`](./lib/README.md) — analysis libs index.
- **Embodiment contract**: [`../embody/types.ts`](../embody/types.ts).
- **Lens contract**: [`../lenses/types.ts`](../lenses/types.ts).
- **Increment plan**:
  [`../.planning-handoffs/03-orchestrator-and-contracts.md`](../.planning-handoffs/03-orchestrator-and-contracts.md)
  (kickoff at sibling
  [`-kickoff.md`](../.planning-handoffs/03-orchestrator-and-contracts-kickoff.md)).
