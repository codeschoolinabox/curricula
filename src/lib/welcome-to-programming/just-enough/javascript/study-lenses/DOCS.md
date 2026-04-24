# `study-lenses/` — architectural sketch

> Written Phase 0, before implementation. The Refactor step is held against this
> document — not what the code does, but what shape it takes.

## Bounded context

The study-lenses system sits between two upstream boundaries and one downstream
consumer:

- **Upstream: Docusaurus plugin** (`src/plugins/study-lenses/`) — a build-time
  MDAST transformer. Emits `<StudyLenses>` JSX nodes with a flat prop shape
  (`code`, `lens`, `lang`, `config`). Opaque to runtime internals. Future:
  parses comma-separated fence syntax and validates max-one-lens at build
  time; current: emits a single `lens` name, orchestrator parses to
  `Pipeline` internally.
- **Upstream: JEJ runtime** (`lib/`) — execution engines (run, trace,
  debug), validation, formatting, editor factory. Consumed by lenses and
  transforms. Not reimplemented here. (`api/` is being merged into `lib/`;
  all utilities consolidate under `lib/`.)
- **Downstream: theme swizzle** (`src/theme/MDXComponents.tsx`) — a single
  import binding that maps the `StudyLenses` tag name to the orchestrator
  component. The only integration point with Docusaurus rendering.

The study-lenses system owns: orchestration (state, caching, pipeline, toolbar),
transform and lens contracts, the registry, and the recommender integration
surface. It does not own: build-time fence parsing (plugin), code execution (JEJ
runtime), or snippet analysis (separate `lib/analysis/` module).

## Execution phases

### 1. Initialize

Two sub-steps at mount:

**1a. Validate (loud failure)**. Receive props from the plugin (code,
lens name, language, lens config). Language validation is a hard
invariant: JEJ-only. Any language value other than JavaScript produces
a console warning and a diagnostic banner in place of the active lens.
No silent pass-through, no best-effort rendering of non-JS fences.

**1b. Prepare (pure)**. Parse the single lens name into the internal
pipeline representation (zero transforms plus exactly one terminal
lens). Today's plugin emits a single lens name; future plugin versions
parse comma-separated fences at build time and emit the pipeline
directly — the orchestrator is shielded from that change because it
only sees the parsed representation. Consult the registry to resolve
the named lens: unknown names fall back to the default (editor) with
a console warning. Resolve the initial transform list from the parsed
pipeline. Register the original code as the immutable reset target.
Create a per-instance EventBus. Initialize orchestrator state: current
snippet (a mutable copy of original code), active lens, active
transforms, snippet name (empty; learner-editable; updates dispatch
a snippet-name-changed signal for future engagement hooks).

### 2. Pipeline

Run the active transforms in declared order. Each transform receives the current
snippet string AND its resolved config (the module's own defaults merged with
any override from `pipeline.configs[transformName]`, via
`module.config(overrides)`), and returns a new snippet string. After all
transforms complete, pass the resulting snippet to the active lens. The lens
receives its own resolved config (from `pipeline.configs[lensName]` merged
over the module's defaults) and returns a renderable component. The
orchestrator mounts that component in the lens area.

Structural constraint: transforms are pure string-to-string functions with no
side effects. A transform that fails throws — behavior at the pipeline layer
is controlled by the module's declared `onFailure` mode. With
`onFailure: 'abort'` (the default when the field is absent), the pipeline
halts at the failing transform and the error propagates to the orchestrator,
which renders the original snippet in a read-only diagnostic banner (no lens
mounted) and dispatches no state-change signal. With
`onFailure: 'fallthrough'`, the pipeline layer catches the throw, emits a
`console.warn`, leaves the accumulated snippet unchanged, and continues
with the next transform — useful for cosmetic transforms (format) where the
untransformed code is still safe and useful.

A lens is always terminal — it receives the final transformed snippet and
produces a component. No lens-to-lens chaining.

### 3. Cache

Per-instance cache of live `LensMount` handles. The cache key is
`(lens-name, config-hash)` — at most one cached instance per key. Content
is NOT part of the key: the cache is content-orthogonal. External snippet
changes are propagated into cached instances via each mount's
`onSnippetChanged` hook (inversion of control), not via cache-key churn.
This keeps the cache small, stable, and predictable: the editor lens never
cache-thrashes on keystrokes because its own edits are the source of truth
for snippet and don't trigger the IoC hook; read-only lenses keep their
in-progress state across switches because their cache entry is identified
by `(name, config)` alone.

On lens switch, the orchestrator computes the key from the target lens +
target config. Cache hit: the existing `LensMount.el` is reattached to the
visible DOM; if the lens implements `onSnippetChanged`, the orchestrator
does not re-invoke it here (the instance was already being kept in sync
while detached). Cache miss: the orchestrator calls the lens module's
`lens(code, config)` function (awaiting if it returns a `Promise`), stores
the resulting `LensMount` under the key, and mounts it.

On external snippet change (transform toggle, Reset, Reset All, recommender-
driven pipeline change), the orchestrator iterates every cached mount and
invokes `mount.onSnippetChanged(newSnippet)` if the hook is defined. Lenses
decide per-semantic: the editor appends an external edit to its undo stack;
parsons reshuffles the new snippet; blanks re-blanks; highlight re-renders.
Lenses without the hook keep their cache entry as-is; the orchestrator
tracks per-instance "last-seen snippet" metadata and, on next reattach,
renders a refresh-or-continue affordance above the lens if that last-seen
snippet differs from the current orchestrator snippet. Learner picks
"refresh" (evict + remount fresh) or "continue" (suppress the banner for
this instance).

Structural constraints:

- Cache entries are live `LensMount` handles — detachable DOM with a
  `dispose` contract. No serialization or deserialization.
- Cache key is `(lens-name, config-hash)`. Exactly one entry per key.
- External snippet mutations propagate via `onSnippetChanged`; lenses
  without the hook surface a stale-state affordance to the learner.
- Eviction strategy is deferred (unbounded per-instance cache; memory
  trade-off documented in the master plan backlog).

### 4. Switch

Learner selects a new lens via the toolbar (lens-switcher dropdown or
recommender panel selection). The orchestrator detaches the active lens from
the visible DOM (caching it alive). It then resolves the target lens: cache
lookup first; on miss, it consults the registry to fetch the lens module
and creates a fresh instance. The new lens is mounted in the lens area.

The orchestrator dispatches a `lens-switched` event. The previous lens remains
cached and can be reattached later.

Switching is inline — no popup, no modal. The recommender panel also replaces
the active lens area when opened.

### 5a. Reset (code-only)

Learner clicks the **Reset** button on the toolbar. The orchestrator restores
the current snippet to the original code (the immutable `code` prop received
at initialization). It dispatches a `state-reset` event with the restored
snippet payload, then pushes the restored snippet into every cached mount
via `onSnippetChanged(originalCode)` — including the active mount. Lenses
that implement the hook absorb the change per their own semantics (editor
appends an external edit preserving undo; blanks re-blanks; parsons
reshuffles; highlight re-renders). Lenses that omit the hook retain their
state; next reattach surfaces the stale-state affordance.

Reset does NOT restore the initial lens — the learner stays in whichever
lens they chose. Reset does NOT touch `activeTransforms`. Reset does NOT
clear the cache — stale-aware reattachment is the orchestrator's
responsibility, not a cache-invalidation side effect.

### 5b. Reset All

Learner clicks the **Reset All** button. The orchestrator restores snippet
to original code, active lens to initial lens, active transforms to initial
transforms, AND clears the lens cache. It dispatches a `state-reset-all`
event carrying the full restored state. This is the "start over from the
author's default" action — structurally heavier than Reset and visually
distinct in the toolbar.

Orchestrator snippet is the single source of truth for both Reset and
Reset All — lenses observe state via events, they do not own their own
reset semantics.

### 6. Recommend

Triggered lazily when the learner opens the recommender panel — not on every
edit or switch. The orchestrator passes the current snippet (after active
transforms) to the snippet analysis utility, which produces a structured feature
report (parse status, NM components present, complexity signals).

The orchestrator then calls each registered lens's recommend function with the
analysis report. Each lens returns zero or more recommendations, each tagged
with a Block Model cell (level, scope) and a relevance score.

The orchestrator collects all recommendations, organizes them into a 3D grid
(level by scope by NM components), and renders the recommendation panel. The
learner selects a recommendation, which triggers a lens switch (phase 4) with
the recommended config.

Structural constraint: analysis and recommendation are pure TS computations with
no UI concerns. The orchestrator handles rendering the grid. The recommender
re-runs when transforms change (different transforms produce different snippet
content, which changes the analysis).

Recommender re-analysis is **debounced** when triggered by rapid transform
toggles (specific interval is an implementation tuning parameter, not a
structural property). Racing analyses are superseded — only the latest
result is rendered. The panel shows a lightweight in-flight affordance
so the learner has feedback during compute-heavy snippet evaluation.

### 7. EventBus lifecycle

Each orchestrator instance creates its own EventBus at mount. The bus is a
pure TS per-instance pub/sub (no DOM, no React context, no global
registry) — isolation between orchestrators on the same page is
structural.

Dispatch semantics:

- Dispatch is **synchronous** — a dispatch call returns only after all
  listeners have run.
- Listeners execute in **registration order** — first subscribed, first
  invoked.
- A **thrown listener is caught**, logged with the event name and the
  listener's identifier, and does not abort remaining listeners. The bus
  is resilient to a single buggy listener.
- **Re-entrant dispatch is permitted** (depth-first). A listener that
  dispatches another event during its callback fires the nested dispatch
  synchronously before the outer dispatch's next listener runs. Agents
  must avoid infinite re-entrancy loops — the bus does not detect cycles.

At orchestrator unmount (React unmount, page navigation, hot reload), the
bus's listener table is cleared, every cached lens instance is disposed
(CodeMirror `EditorView.destroy()` for the editor; equivalent teardown
hooks for React-native lenses), and the cache is emptied. No listeners
or DOM survive React unmount.

## Structural constraints

- **Per-instance isolation.** Each `<StudyLenses>` code block on a page gets its
  own orchestrator instance. Zero cross-instance state. No global context
  provider.
- **SSR boundary at the orchestrator root.** No `typeof window` guards in
  transforms, lenses, or orchestrator internals. The `<BrowserOnly>` boundary
  wraps the entire runtime; the server pass renders a `<pre>` fallback.
- **Transforms are pure.** No side effects, no DOM access, no async. String in,
  string out. Transform failure handling is declared per-module (default
  `'abort'` — render diagnostic, no lens mounted; opt-in `'fallthrough'` —
  untransformed snippet passes through with a warning). See phase 2 above.
- **Lenses are terminal.** Exactly one per pipeline. No lens-to-lens chaining.
  Build-time validation by the plugin catches violations.
- **Two communication mechanisms, each with a distinct shape.** Pub/sub
  EventBus carries cross-cutting signals (lens-to-orchestrator:
  `snippet-changed`, `exercise-completed`, `config-changed`; orchestrator-
  to-lens: `lens-switched`, `transforms-changed`, `state-reset`,
  `state-reset-all`, `snippet-name-changed`). The `onSnippetChanged`
  IoC hook pushes snippet state directly into cached mounts.
  No prop-drilling; no global context.
- **Registry is static.** Transforms and lenses are registered at module load
  time, not dynamically at runtime. The registry is read-only after
  initialization.
- **Configs flow by module name.** Per-instance module configs travel on
  the `Pipeline` via an optional `configs` field keyed by module name —
  the transforms and the lens share a keyspace because registry names are
  unique across both. Entries are `Partial<TransformConfig>` (structurally
  identical to `Partial<LensConfig>`) and are merged over each module's
  own defaults at call time via `module.config(overrides)`. The plugin's
  `lenses.json` cascade + per-file `@study-lens` directive narrow into
  this shape. A `configs` key that does not correspond to any module in
  the pipeline warns at validation time (kept on the Pipeline, ignored at
  execution).
- **Cache is `(lens-name, config)` keyed.** Exactly one cached `LensMount`
  per key. Content is orthogonal — the cache does not churn on snippet
  changes. External snippet mutations propagate via each mount's
  `onSnippetChanged` hook; cached mounts without the hook surface a
  stale-state affordance to the learner on next reattach.
- **Language is JEJ-only.** The orchestrator validates `lang === 'js'` at
  initialization. Any other value produces a warning and a diagnostic
  banner; no lens is mounted. Non-JS fences are author error until the
  backlog item "multi-language support" lands.
- **Unmount cleans up.** Every cached lens instance is disposed;
  orchestrator-owned EventBus listeners are cleared; orchestrator-owned
  references (cache map, state record) are released. Leakage of
  externally-held references (e.g. a lens that handed a callback to a
  third-party subscription) is the lens's responsibility to clean up in
  its own dispose hook.
- **State updates are atomic per learner action.** A recommender-driven
  switch that changes both the transform list and the active lens
  dispatches the transforms-changed signal first, then the lens-switched
  signal, both synchronously within the same update. Listeners see a
  consistent state sequence, not intermediate flicker states.
- **Reset All dispatch order is deterministic.** The state-reset-all
  signal fires before the cache is cleared. The active lens's listeners
  run synchronously and observe the pre-disposal instance; disposal
  follows. The new initial lens mounts afterward from an empty cache.
- **Reset propagates via IoC, not cache invalidation.** Reset dispatches
  `state-reset` and invokes `onSnippetChanged(originalCode)` on every
  cached mount (active + detached). The cache is untouched. Lenses that
  omit the hook surface a stale-state affordance on next reattach. Reset
  All is the only action that clears the cache.

## Out of scope

- **Cross-block communication.** If comparison exercises need two snippets, a
  single lens creates the variations internally.
- **Persistence.** No `localStorage`, no URL state. Code resets to the original
  `code` prop on page reload.
- **Snippet analysis implementation.** The analysis utility lives in
  `lib/analysis/`, not in this directory. The orchestrator consumes it.
- **Recommender implementation.** The recommendation engine lives in
  `lib/recommender/`. The orchestrator consumes it.
- **Build-time fence parsing.** The plugin owns syntax parsing and pipeline
  validation. The orchestrator receives pre-parsed props.
- **Cache eviction.** Memory trade-off decisions are deferred. The cache grows
  per-instance for the lifetime of the page.
- **Analytics/engagement collection.** Event hooks exist from day one but
  nothing consumes them. Data collection is a separate initiative.

## Links

- **README (this directory):** [`./README.md`](./README.md)
- **Parent module:** [`../README.md`](../README.md)
- **Notional machine:** [`../notional-machine.md`](../notional-machine.md)
