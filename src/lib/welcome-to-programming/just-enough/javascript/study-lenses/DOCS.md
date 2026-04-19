# `study-lenses/` — architectural sketch

> Written Phase 0, before implementation. The Refactor step is held against this
> document — not what the code does, but what shape it takes.

## Bounded context

The study-lenses system sits between two upstream boundaries and one downstream
consumer:

- **Upstream: Docusaurus plugin** (`src/plugins/study-lenses/`) — a build-time
  MDAST transformer. Emits `<StudyLenses>` JSX nodes with a fixed prop shape
  (`code`, `lens`, `config`). Opaque to runtime internals. Validates pipeline
  syntax (max one lens per fence) at build time.
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

Receive props from the plugin (`code`, `lens`, `config`). Resolve the initial
lens name — if absent fall back to the configured default (`editor`). Resolve
the initial transform list from the pipeline prop. Register the original code as
the immutable reset target. Initialize orchestrator state: current snippet
(mutable copy of original code), active lens, active transforms.

### 2. Pipeline

Run the active transforms in declared order. Each transform receives the current
snippet string and returns a new snippet string. After all transforms complete,
pass the resulting snippet to the active lens. The lens returns a renderable
component. The orchestrator mounts that component in the lens area.

Structural constraint: transforms are pure string-to-string functions with no
side effects. A transform that fails throws — the orchestrator catches and falls
back to rendering the untransformed snippet with a warning. A lens is always
terminal — it receives the final transformed snippet and produces a component.
No lens-to-lens chaining.

### 3. Cache

Content-keyed caching of live component instances. The cache key combines the
snippet string (after transforms) and the lens config hash. On lens switch or
transform toggle, the orchestrator checks the cache before creating a new
component instance.

Cache hits: the existing component instance is reattached to the visible DOM.
Learner state (editor cursor, blanks answers, trace entries) survives because
the component was detached, not destroyed.

Cache misses: a new component instance is created via the lens function,
mounted, and added to the cache.

Structural constraint: cache entries are live DOM nodes or React elements held
in memory. No serialization or deserialization. The tradeoff is memory usage for
state preservation — eviction strategy is an open design question.

### 4. Switch

Learner selects a new lens via the toolbar (lens-switcher dropdown or
recommender panel selection). The orchestrator detaches the current lens from
the visible DOM (caching it alive). It then resolves the target lens: cache
lookup first, fresh creation on miss. The new lens is mounted in the lens area.

The orchestrator dispatches a `lens-switched` event. The previous lens remains
cached and can be reattached later.

Switching is inline — no popup, no modal. The recommender panel also replaces
the active lens area when opened.

### 5. Reset

Learner clicks the reset button on the toolbar. The orchestrator restores the
current snippet to the original code (the immutable `code` prop received at
initialization). It dispatches a `state-reset` event so the active lens can
respond (e.g., editor resets buffer, blanks re-blanks).

Reset does NOT restore the initial lens — the learner stays in whichever lens
they chose. Reset does NOT clear the cache — cached instances for the original
code may still exist and will be reused on next switch.

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

## Structural constraints

- **Per-instance isolation.** Each `<StudyLenses>` code block on a page gets its
  own orchestrator instance. Zero cross-instance state. No global context
  provider.
- **SSR boundary at the orchestrator root.** No `typeof window` guards in
  transforms, lenses, or orchestrator internals. The `<BrowserOnly>` boundary
  wraps the entire runtime; the server pass renders a `<pre>` fallback.
- **Transforms are pure.** No side effects, no DOM access, no async. String in,
  string out. A failing transform does not prevent lens rendering.
- **Lenses are terminal.** Exactly one per pipeline. No lens-to-lens chaining.
  Build-time validation by the plugin catches violations.
- **Event protocol for communication.** No prop-drilling for
  lens-to-orchestrator signals. Lenses dispatch events; the orchestrator
  listens.
- **Registry is static.** Transforms and lenses are registered at module load
  time, not dynamically at runtime. The registry is read-only after
  initialization.
- **Cache is content-keyed.** Same snippet + same config = same cache entry.
  Toggling a transform changes the piped content, producing a different cache
  key.

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
- **Current V2 lenses DOCS:** [`../lenses/DOCS.md`](../lenses/DOCS.md) —
  lifecycle phases for individual lens components (predecessor)
- **Notional machine:** [`../notional-machine.md`](../notional-machine.md)
