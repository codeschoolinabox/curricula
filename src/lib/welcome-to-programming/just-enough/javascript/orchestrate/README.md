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

(The `configs` shape shown is what today's plugin emits and what hand-written
JSX usually looks like — see the prop table for the type-level contract, which
is intentionally **maximally opaque**. The orchestrator's `lenses[lens]` lookup
is an internal structural assumption, not a public type constraint.)

Three props (per the locked decision in
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)
and the **3-prop reshape** that absorbs `config` into `configs.lenses[lens]`):

| Prop      | Type                                                          | Required | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------- | ------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `snippet` | `string`                                                      | yes      | The code string, consumed as the **initial value** only. The orchestrator seeds an internal `useState(snippet)` on the first render and is the sole writer of snippet state thereafter; subsequent changes to the `snippet` prop are ignored. Callers who need to swap the snippet remotely should remount via React `key={…}`. The orchestrator builds the embodiment internally — caller does NOT pre-build.                                                                                                                                                                                                              |
| `lens`    | `string`                                                      | no       | Default-mounted lens name (Q-III seam). Learner can switch via picker. Populated upstream by the plugin from per-fence info-string `:suffix`, frontmatter `defaultLens`, or sibling `@study-lens` directive. Cascade `defaults[lang]` is gate-only (it controls whether the fence transforms but does NOT populate `lens` per AR-1 locked decision 1); the cascade-supplied default seam is L2-deferred.                                                                                                                                                                                                                      |
| `configs` | maximally opaque object (`Readonly<Record<string, unknown>>`) | no       | Opaque cascade passthrough — the public type makes no statement about internals. Today the plugin emits the whole resolved cascade from the `lenses.json` directory walk; per-fence URL-style queries and sibling `@study-lens` directive JSON overrides are deep-merged INTO `configs.lenses[lens]` at plugin emission time. The orchestrator's INTERNAL `resolvePerLensConfig` reads `configs.lenses?.[lens]` as a structural assumption at the cast boundary — that assumption is NOT a constraint on the public type, so future cascade-shape evolution (e.g. L2 default-lens seam) doesn't require widening the surface. |

The `lens` and `configs` props flow from per-fence info-string (`js:trace`),
per-directory `lenses.json` cascade, and the optional per-fence `@study-lens`
directive — the Docusaurus plugin at `src/plugins/study-lenses/` parses all
three input surfaces and emits the resolved values onto the JSX node. There is
no separate `config` prop; the per-fence/sibling override is folded into
`configs.lenses[lens]` before emission, so the cascade IS the merged truth.

> **Dispatch path**: when `lens` matches a registered key, the orchestrator
> initializes (or transitions to) **lens mode** with `embodiment` (built from
> the internal snippet state via `embody()`) plus the per-lens resolved config
> (per § Per-lens config resolution chain). When `lens` is unset OR not in the
> registry, the orchestrator initializes (or transitions to) **editor mode**.
> The mode discriminator and its transitions are described in § Editor-vs-lens
> state machine; the build-or-reuse decision for `embodiment` is described in
> the same section's § Cross-mode embodiment cache. The pre-3-prop F1
> mount-time guard (`config` supplied without resolved `lens` → throw at mount)
> is gone with the absorbed `config` prop. The registry is currently keyed by
> the single meta-lens `debug-props` (see
> [`../lenses/debug-props/`](../lenses/debug-props/)); F4 grows it with the
> first pedagogical trial lens, and L1 adds a picker UI that enumerates
> registry entries. L2 wires the cascade-supplied default-lens seam — a future
> hook inside `configs` (exact key shape L2-deferred; candidates include
> re-using `configs.defaults[lang]` as a per-language default-lens-name
> source, or adding a dedicated `configs.defaultLens` scalar slot) that may
> surface a default-lens-name from the cascade itself.
>
> **Silent-drop case (deferred to L2/F4).** When `lens` is supplied but not in
> the registry (e.g. `lens="parsons"` before F4 lands the trial lens), the
> orchestrator falls back to editor mode and any `configs.lenses[lens]` entry
> supplied alongside is silently unused. This is expected behavior pending the
> registry-shape decision (F4 Phase 0) and the cascade-supplied default seam
> (L2). Authors who hit this should consult React DevTools or the sandbox
> `debug-props` lens to confirm the prop shape.

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

> The `configs.lenses?.[lensName]` read is an **orchestrator-internal structural
> assumption**, not a constraint on the public `configs` type. The public type
> is maximally opaque; `resolvePerLensConfig` casts at the boundary to look up
> `lenses[lensName]`. If a caller hands the orchestrator a `configs` value that
> doesn't expose a `lenses` map, the read returns `undefined` and tier-1
> contributes nothing — the chain falls back to `module.config()` alone.

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

The UI is in exactly one of two modes at a time; mode is selected by an
internal **mode discriminator** stored in `useState<OrchestratorState>` and
mutated only via well-defined **mode transitions**. See [`./types.ts`](./types.ts)
for the discriminated-union state shape; see [`./DOCS.md` § Mode-gated state
machine](./DOCS.md) for the architectural sketch.

> F2 ships the mode discriminator and transitions but not the toolbar picker
> UI (the picker lands in L1). Until L1, mode transitions are driven
> exclusively by changes to the `lens` prop from the consumer — for the
> sandbox checkpoint this is exercised via the
> [`f2-mode-machine`](../../../../../../src/pages/f2-mode-machine.tsx) toggle
> page (Docusaurus auto-route `/spiralearn/f2-mode-machine` after `npm run
> start`); in curriculum pages the `lens` prop is statically supplied by
> the Docusaurus plugin.

### Glossary (ubiquitous language)

- **Editor mode** — the home base ([`./editor/`](./editor/)) is mounted. The
  learner types into the snippet; the textarea is the source of truth for
  `snippet`. No active lens, no embodiment displayed. (Picker will land in
  L1; until then, the consumer toggles via the `lens` prop.)
- **Lens mode** — a lens is active with a frozen `embodiment` + resolved
  per-lens config as React props. The snippet is read-only (the textarea is
  unmounted; the snippet behind the embodiment was snapshotted at the
  transition). (Picker will land in L1 and stay visible in lens mode as the
  Q-I autonomy guarantee.)
- **Mode discriminator** — the `mode: 'editor' | 'lens'` field on
  `OrchestratorState` that names which subtree the orchestrator renders.
  Initial value is derived **synchronously** by `deriveInitialState({ snippet,
  lens, configs })` — a top-level helper that returns `{ state:
  OrchestratorState; cache: CachedEmbodiment | null }` in a single pure pass.
  Both `useState` lazy initializers (one for `state`, one for
  `cachedEmbodiment`) project their respective field from the same call, so
  the lens-mode case calls `embody(snippet)` exactly once at first render
  and the lens-mode subtree paints on the first frame when the caller
  supplies a registered `lens`.
- **Mode transition** — a state-update that flips the discriminator. Two
  transitions exist today: **editor → lens** (the `lens` prop changes to a
  registered key — builds or reuses an embodiment; mounts the lens) and
  **lens → editor** (the `lens` prop unsets or moves to an unregistered key —
  disposes the lens; the cached embodiment survives the transition). In-mode
  lens-switching (lens → lens) lands in F4 when the registry grows beyond
  `debug-props`.

### Cross-mode embodiment cache

The orchestrator holds a single authoritative top-level state slot
`cachedEmbodiment: { snippet: string; embodiment: Snippet } | null` alongside
the mode-discriminator state. The cache is the orchestrator's
**lazy-embodiment memo**: there is one storage location for the live
embodiment; `LensModeState` carries only `activeLens` and `resolvedConfig`,
and lens-mode rendering reads `cachedEmbodiment.embodiment` directly.

**Coherence invariant** — whenever `state.mode === 'lens'`, the cache is
non-null AND `cachedEmbodiment.snippet === currentSnippet`. The transition
logic enforces this; types cannot.

**Trigger semantics:**

| Event | Cache effect | Mode effect |
| --- | --- | --- |
| Initial mount, `deriveInitialState` returns lens mode | populate atomically with fresh `embody(snippet)` | `{ mode: 'lens', activeLens, resolvedConfig }` |
| Initial mount, `deriveInitialState` returns editor mode | `null` | `{ mode: 'editor' }` |
| Editor → lens transition, `cache.snippet === currentSnippet` | reuse cached `embodiment`; no `embody()` call | `{ mode: 'lens', activeLens, resolvedConfig }` |
| Editor → lens transition, cache stale or null | call `embody(currentSnippet)` once; populate cache | `{ mode: 'lens', activeLens, resolvedConfig }` |
| Lens → editor transition | retain cache | `{ mode: 'editor' }` |
| Snippet edit in editor mode | clear cache (`null`) | (no transition; stays in editor mode) |

This makes a lens → editor → lens round-trip with no intervening edit a
zero-`embody`-call operation, while a round-trip across an edit forces a
fresh build.

**Error policy:** `embody()` is sync and may throw on unknown sentinels (per
[`../embody/index.ts`](../embody/index.ts) JSDoc — the Phase A mock's
contract). If `embody()` throws during an editor → lens transition, the throw
propagates out of the state-update — the mode transition does not commit, the
cache is not written, and the orchestrator's render path is in whatever
state React was in before the user-triggered re-render that fired the
transition. Today's surfacing path is the React error boundary at the
consumer site. The throw is a **Phase A mock artifact** — under the locked
`embody(code): Snippet` contract, embody must return a valid `Snippet` (with
`status.parsed = false` and populated `Snippet.errors` for unparseable input,
per the `Snippet` type at [`../embody/types.ts`](../embody/types.ts)). Phase B
(real `embody/lib/*` composition, per
[`../EMBODY-IMPL-HANDOFF.md`](../EMBODY-IMPL-HANDOFF.md)) brings embody into
compliance with that contract. F3 (orchestrator-side lazy embodiment) is
independent of how `embody()` reports errors — it only governs **when**
embody fires; error-reporting compliance is Phase B's domain.

Lens-internal UI state never carries across mode switches — the
disposability principle (per [`../README.md` § Pedagogical first
principles](../README.md#pedagogical-first-principles) implication 5).

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
- **Lazy embodiment** (F3 — satisfied by F2.4 + F2.5). Embodiment is built only
  when downstream needs it: on editor → lens transition (F2.4 transition-only
  trigger) and on evaluation phases inside a mounted lens. **Evaluation phases**
  (run / predict / step) are lens-internal — the lens invokes
  `embodiment.streams.evaluate.{run, intercept, trace.{syntax, semantics}}`
  directly on the embodiment it already holds (see
  [`../embody/types.ts § Streams`](../embody/types.ts) for the surface). No
  orchestrator round-trip; the orchestrator does not mediate evaluation.
  Edits in editor mode eagerly invalidate the cache (F2.5) so the next
  lens-open always re-embodies after an edit. Never on every keystroke. See
  [`./DOCS.md` § F3 — lazy embodiment realized](./DOCS.md). F3 introduced
  no new domain terms; the glossary is unchanged.
- **Sentinel-blind orchestrator** (F3 invariant). The orchestrator's transition
  handler + cache layer never inspects `Snippet.source.code` content
  semantically. (Sibling `orchestrate/lib/*` modules may operate on derived
  strings — error messages, identifier autocomplete, AST-derived voices — but
  never on raw snippet content for dispatch.) The handler may compare snippet
  strings as **cache keys** via **full-string identity only**
  (`prevCache.snippet === snippet`, answering "is this the same snippet I
  already embodied?") — that's cache-validity, not semantic dispatch.
  Substring / prefix / regex / pattern tests against snippet content are
  forbidden **even when used to gate cache behavior** (e.g.
  `if (snippet.startsWith("//"))` as a cache-bypass optimization is also a
  violation). Branches that need to know what the code does consume only the
  resulting `Snippet`'s `status` / `errors` fields (today, the orchestrator
  does no such branching — it forwards the embodiment to lenses without
  inspection). This invariant protects the orchestrator from drift when
  Phase B replaces the sentinel discriminator (per
  [`../EMBODY-IMPL-HANDOFF.md`](../EMBODY-IMPL-HANDOFF.md) § Constraints:
  "No consumer-side sentinel string branching").
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
