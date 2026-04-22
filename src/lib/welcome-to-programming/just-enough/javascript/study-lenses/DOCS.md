# `study-lenses/` — architectural sketch

> Written Phase 0, before implementation. The Refactor step is held against this
> document — not what the code does, but what shape it takes.

## Bounded context

The study-lenses system sits between two upstream boundaries and one downstream
consumer:

- **Upstream: Docusaurus plugin** (`src/plugins/study-lenses/`) — a build-time
  MDAST transformer. Emits JSX nodes named `<StudyLens>` (singular at the tag
  level — reconciled to the `<StudyLenses>` orchestrator component via the
  swizzled `MDXComponents` registry) with a flat prop shape
  (`code`, `lens`, `lang`, `config`). Opaque to runtime internals. Future:
  parses comma-separated fence syntax and validates max-one-lens at build
  time; current: emits a single `lens` name, orchestrator parses to
  `Pipeline` internally.
- **Upstream: JEJ runtime** (`api/`, `lib/`) — execution engines (run, trace,
  debug), validation, formatting, editor factory. Consumed by lenses and
  transforms. Not reimplemented here.
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
snippet string and returns a new snippet string. After all transforms complete,
pass the resulting snippet to the active lens. The lens returns a renderable
component. The orchestrator mounts that component in the lens area.

Structural constraint: transforms are pure string-to-string functions with no
side effects. A transform that fails throws — the orchestrator catches,
aborts the pipeline, renders the original snippet in a read-only
diagnostic banner (no lens mounted), and dispatches no state-change
signal. This is the safe default for all transforms. A future
declarative opt-in for per-transform "fallthrough on failure" semantics
is pending user approval (see notes); until then, all transform failures
abort.

A lens is always terminal — it receives the final transformed snippet and
produces a component. No lens-to-lens chaining.

### 3. Cache

Content-keyed caching of live component instances. The cache key is
`(lens-name, content-at-mount, config-hash)`. **Content-at-mount is immutable
for the lifetime of a cached instance** — it is the snippet the lens was
first mounted with, not the current orchestrator snippet. This carveout is
essential: the `editor` lens is a write-through lens (it IS the source of
truth for snippet while mounted) and would cache-thrash on every keystroke
if the cache key tracked the mutable snippet instead of mount-time content.
Read-only lenses (blanks, parsons, highlight) also benefit: learner progress
within a blanks exercise survives switching away and back.

On lens switch or transform toggle, the orchestrator recomputes the key from
the transform-produced snippet + the target lens + target config. Cache
hits: the existing component instance is reattached to the visible DOM.
Learner state (editor cursor, blanks answers, trace entries) survives
because the component was detached, not destroyed. Cache misses: a new
component instance is created via the lens function, mounted, and added
to the cache.

Structural constraints:

- Cache entries are live DOM nodes or React elements held in memory. No
  serialization or deserialization.
- The `editor` lens is cached with content-at-mount = the initial snippet
  at editor mount time. It is never re-keyed while active because it
  publishes snippet changes outward (via `snippet-changed`), not inward.
- Read-only lenses cache content-at-mount = the transform-produced snippet
  at their mount time.
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
snippet payload. The active lens listens and responds — the `editor` lens
overwrites its CodeMirror content with the new snippet (it does NOT call
its own internal `reset()`, which would restore its construction-time
initial content and could disagree with the orchestrator's `originalCode`
if the editor was mounted after snippet had diverged); other lenses
re-derive whatever they derive from the snippet (blanks re-blanks,
parsons re-shuffles).

Reset does NOT restore the initial lens — the learner stays in whichever
lens they chose. Reset does NOT touch `activeTransforms`. Reset does NOT
clear the cache — cached instances keyed by content-at-mount for the
original code may still exist and will be reused on next switch.

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
- **Event protocol for communication.** No prop-drilling for
  lens-to-orchestrator signals. Lenses dispatch events; the orchestrator
  listens.
- **Registry is static.** Transforms and lenses are registered at module load
  time, not dynamically at runtime. The registry is read-only after
  initialization.
- **Cache is content-at-mount keyed.** Same lens + same content-at-mount +
  same config = same cache entry. Content-at-mount is captured when the lens
  first mounts; it does NOT change when the write-through `editor` lens
  publishes snippet edits. Toggling a transform produces different
  content-at-mount for the next mount, producing a different cache entry.
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
- **Active lens remounts after Reset.** On Reset (code-only), the
  orchestrator invalidates the cache entry for the currently active lens
  — its content-at-mount no longer describes the instance after the
  reset handler rebinds the lens to the new snippet. Non-active cached
  entries (other lenses, other content-at-mount values) remain. The
  active lens reattaches fresh on next switch. (PENDING USER APPROVAL:
  see orchestrator notes AR-2 concern #1 for alternatives.)

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
