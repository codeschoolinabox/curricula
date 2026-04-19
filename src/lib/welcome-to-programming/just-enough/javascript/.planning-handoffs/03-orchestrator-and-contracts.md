# Work Stream 3: Orchestrator + Module Contracts

## Prerequisites

Before starting, read these files in full (do not skim):

- **AGENTS.md** (repo root):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/AGENTS.md`
- **DEV.md** (repo root):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/DEV.md`
- **Master plan**:
  `./00-master-plan.md` (in this directory)
- **Current study lens (to be refactored into orchestrator)**:
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lenses/study/study-lens.tsx`
- **Current study lens client (becomes editor lens wrapper)**:
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lenses/study/study-lens-client.tsx`
- **Current study lens types**:
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lenses/study/types.ts`
- **Current lenses DOCS.md** (existing lifecycle phases):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lenses/DOCS.md`
- **Current study lens DOCS.md**:
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lenses/study/DOCS.md`
- **Current study lens COMPONENT-CONTRACT.md**:
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lenses/study/COMPONENT-CONTRACT.md`
- **Current study lens tests**:
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lenses/study/tests/`
- **Editor factory**:
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/editing/`
- **Notional machine** (for understanding NM components):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/notional-machine.md`
- **Theme MDXComponents.js** (current import to update):
  Find via: `grep -r "StudyLens" src/theme/` in the repo

## Context

### What this work stream does

This work stream builds three things:

1. **Module contracts** -- `TransformModule` and `LensModule` TypeScript
   interfaces that all transforms and lenses must implement
2. **Lens registry** -- registration and discovery mechanism for transforms
   and lenses
3. **StudyLenses orchestrator** -- the central component that manages
   state, toolbar, pipeline execution, caching, events, and lens swapping.
   This is what the plugin injects into code blocks. It is NOT a lens --
   it renders lenses.

### Why it matters

The orchestrator is the architectural spine. Every other work stream
depends on the contracts and registry it defines. Without the orchestrator,
lenses are isolated components with no infrastructure. With it, they are
pluggable exercise renderers that get state management, toolbar, caching,
and pipeline execution for free.

### Module contracts (exact signatures)

**TransformModule** -- code in, code out. Never produces UI. Always
continues the pipeline.

```text
TransformModule = {
  name: string
  transform: (code: string, config?: TransformConfig) => string
  config: (overrides?: Partial<TransformConfig>) => TransformConfig
}
```

**LensModule** -- code in, component out. Always terminal. Exactly one
per pipeline.

```text
LensModule = {
  name: string
  lens: (code: string, config?: LensConfig) => Component
  config: (overrides?: Partial<LensConfig>) => LensConfig
  recommend: (analysis: AnalysisReport) => Recommendation[]
}
```

Key differences from WC kit pattern:

- No `register` (vestigial from web components)
- No `lang` (JEJ-only for now)
- Transforms accept/return strings (not ASTs)
- Only lenses have `recommend()` -- the recommender itself composes
  pipelines without transforms needing their own `recommend()`

### Pipeline model

A pipeline is structurally typed as `{ transforms: Transform[], lens: Lens }`.
The type system guarantees zero or more transforms followed by exactly one
lens. Two lenses in a pipeline is a **build-time error** (the plugin
validates this).

Execution flow:

```text
code --> transform1(code, config) --> transform2(result, config) --> ...
  --> lens(finalResult, config) --> Component rendered by orchestrator
```

Comma-separated fence syntax: `` ```js:loopGuard,format,blanks `` parses
to `{ transforms: ["loopGuard", "format"], lens: "blanks" }`.

### Orchestrator responsibilities

The `<StudyLenses>` orchestrator is the component injected by the plugin
via `MDXComponents.js`. It is the parent orchestrator, NOT a lens.

**State management:**
- Holds current snippet state (initialized from `code` prop)
- Active lens reads from this state
- `editor` lens writes to it when learner edits code
- Switching lenses preserves state (blanks sees the learner's edits)

**Toolbar (always visible):**
- Lens-switcher dropdown
- `[loop guard]` toggle (transform button)
- `[format]` button (transform button)
- Recommender panel button
- Free-explore dropdown (flat list of all available lenses)
- Reset button (resets snippet to original `code` prop)
- Snippet name field (blank input where learners name the snippet —
  naming forces comprehension; available to engagement event hooks)

No transforms dropdown for learners. Learners don't construct pipelines.
Transform composition happens only via author fences or recommender-built
pipelines.

**Pipeline execution:**
- Runs transforms in sequence on the snippet
- Passes the transformed result to the active lens
- Piping logic lives in the orchestrator, not in individual lenses

**Lens caching:**
- Caches **live component instances** (React elements or detached DOM
  nodes), NOT serialized state
- Keyed by content string + config hash
- Switching lenses = detach current, reattach cached
- Learner state (blanks answers, cursor position) survives because the
  component was never unmounted
- Toggling a transform changes piped content -> different cache key ->
  fresh lens instance. The old cache entry (untransformed code) still
  exists -- switching back restores progress
- Open question: cache eviction strategy (memory trade-off)

**Event-based communication protocol:**
- ALL lens-to-orchestrator communication uses events
- Lenses dispatch: `snippet-changed` (editor updates code),
  `exercise-completed`, `config-changed`
- Orchestrator dispatches: `lens-switched`, `state-reset`,
  `transforms-changed`
- Aligned with WC kit's CustomEvent pattern
- Ready for future data collection hooks

**`initialLens` and `initialTransforms`:**
- `initialLens` defaults to `editor`. Configurable via cascade `defaults`,
  fence suffix (`js:blanks`), or file directive (`@study-lens`)
- `activeLens` may differ from `initialLens` after learner switches
- Reset does NOT restore `initialLens` -- it resets code state only;
  learner stays in whichever lens they chose

**Graceful degradation:**
- Unknown lens name -> falls back to `editor` + console warning
- Parse errors -> handled (Tier 1 lenses still work)
- SSR safety -> `<BrowserOnly>` boundary

**Recommender integration:**
- Calls the recommender lazily when the panel opens
- Uses the **transformed** snippet (not raw) + registered lenses
- Re-runs when transforms change
- Can display pipeline recommendations

### Two sub-steps: pure TS core, then React wrapper

This is critical. The orchestrator is built in two layers:

**Step 5a: Pure TS orchestrator core** (testable without React, in
node/vitest):

- State management (snippet, initialLens/activeLens,
  initialTransforms/activeTransforms)
- Pipeline execution (run transforms -> pass to lens)
- Content-keyed lens caching
- Event protocol (dispatch/listen)
- Registry (register transforms + lenses by name)

Test this layer in a vanilla sandbox (node/vitest) -- verify pipeline,
caching, events work without React.

**Step 5b: React wrapper** (thin shell over the TS core):

- Toolbar UI rendering
- `<BrowserOnly>` SSR boundary
- Active lens area (mounts/unmounts lens components)
- Hook into TS core's state and events

Test this layer in the Docusaurus dev server.

### Migration map (current files -> proposed structure)

| Current file | Target | Notes |
|---|---|---|
| `lenses/study/study-lens.tsx` | `study-lenses/orchestrator/study-lens.tsx` | Becomes orchestrator (refactored) |
| `lenses/study/study-lens-client.tsx` | `study-lenses/lenses/editor/wrapper.tsx` | Becomes editor lens wrapper |
| `lenses/study/types.ts` | `study-lenses/lenses/editor/types.ts` + `study-lenses/types.ts` | Split: editor-specific vs shared |
| `lenses/study/tests/` | `study-lenses/orchestrator/tests/` + `study-lenses/lenses/editor/tests/` | Split by responsibility |
| `lenses/study/COMPONENT-CONTRACT.md` | `study-lenses/orchestrator/` | Updated for orchestrator contract |
| `lenses/study/DOCS.md` | `study-lenses/orchestrator/DOCS.md` | Updated for orchestrator architecture |
| `lenses/study/HANDOFF.md` | Archive or delete (superseded) |  |
| `lenses/README.md` | `study-lenses/README.md` | Updated for new architecture |
| `lenses/DOCS.md` | `study-lenses/DOCS.md` | Updated for new architecture |
| `src/theme/MDXComponents.js` | Update import to orchestrator |  |

### What's decided

- `study` is the philosophy/project name only, NOT a lens name
- `editor` is the default lens (what was previously the study lens)
- `<StudyLenses>` (plural) is the orchestrator component name
- Cascade: `defaults.js = "editor"`
- Caching: live component instances (detached DOM), content+config keyed
- Contract stays thin -- orchestrator black-boxes lenses
- Events are optional -- lenses can dispatch, orchestrator listens
- Author sets initial lens but learner can ALWAYS switch (learner autonomy)
- Per-instance isolation (multiple orchestrators on one page = independent)
- Transforms for learners: 3 only (loopGuard, format, translate)

### What's still open (deferred to DDD)

- Reset semantics (code-only vs. full reset vs. per-lens hook)
- Event mechanism (DOM CustomEvents vs React Context vs EventBus)
- Cache eviction strategy
- Progressive disclosure UX for toolbar
- `core.ts` decomposition (state, pipeline, cache, events)
- Event payload types and naming convention (kebab vs camelCase)

## Dependencies

### This stream depends on

- **Work Stream 1 (Sub-Language Levels)**: not directly, but the types are
  used by the recommender which the orchestrator calls. The orchestrator
  itself does not need level types -- it just renders what the recommender
  returns.
- **Work Stream 2 (Analysis + Recommender)**: the orchestrator calls the
  recommender lazily. Needs the `RecommendationGrid` type to render the
  recommendation panel. Can start without this -- the recommender call can
  be stubbed.

### Other streams that depend on this

- **Work Stream 4 (Lens Migration)**: every lens must implement the
  `LensModule` contract defined here. The orchestrator's registry is how
  lenses become discoverable. Cannot start lens migration until the
  contracts are proven with a trial lens.

## Non-negotiable constraints

From the master plan:

1. **Pure TS core + thin React wrapper.** The orchestrator's state, caching,
   pipeline execution, and event handling are pure TS, testable without
   React. The React wrapper is a thin shell for rendering.
2. **Transforms and lenses are separate types.** Different return types,
   enforced at the type level. A pipeline has zero+ transforms + exactly
   one lens.
3. **Two-lens pipeline = build-time error.** The plugin validates this.
   Loud failure, not silent.
4. **Lens caching uses live component instances.** Content+config keyed.
   No state serialization. Component stays alive in memory, just detached.
5. **Event-based communication.** ALL lens<->orchestrator communication uses
   events. No prop-drilling between orchestrator and lens internals.
6. **Learner autonomy.** Author sets initial lens; learner can always switch
   via toolbar. Authors cannot lock learners into a specific lens.
7. **Per-instance isolation.** Each code block gets its own orchestrator
   instance. Zero cross-instance state.
8. **`editor` is the default lens.** `study` is not a lens name. The
   orchestrator interprets `study` as "use default = editor."
9. **Deep freeze all return values** from pure TS functions.
10. **No barrel files.** Import directly from source files.

## Phase 0 checklist (from AGENTS.md)

Complete every step in order. Do not skip any step. Do not start Phase 1
until all 7 steps are done.

- [ ] **0.1 Establish ubiquitous language** -- Key terms to define:
  - Orchestrator (the parent container, NOT a lens)
  - TransformModule (code in -> code out, pipeline-continuing)
  - LensModule (code in -> component out, pipeline-terminal)
  - Pipeline (ordered transforms + exactly one lens)
  - Registry (registration and discovery for transforms/lenses)
  - Snippet state (the current code held by the orchestrator)
  - Active lens / initial lens (what's rendering vs. what was configured)
  - Active transforms / initial transforms (same distinction)
  - Lens cache (live instances keyed by content+config)
  - Event protocol (lens dispatches, orchestrator listens)
  - Toolbar (always-visible controls owned by orchestrator)
  - Inline lens swapping (detach current, reattach cached or mount new)
  Watch for: "study" (the philosophy, not a lens), "lens" (the exercise
  renderer, not the orchestrator), "transform" (code->code, never UI).

- [ ] **0.2 Update README.md** -- for the `study-lenses/` directory and its
  subdirectories (orchestrator, transforms, lenses). Using the ubiquitous
  language, describe what each module does, what it owns, what it does NOT
  own.

- [ ] **0.3 AR-1 design challenge** -- Focus areas:
  - Is the orchestrator doing too much? Should state, caching, pipeline,
    events be separate modules from the start?
  - Does the TransformModule/LensModule contract work for all known
    lens types (editor, blanks, parsons, trace-table)?
  - Is content+config keyed caching the right cache key strategy?
  - Is the event protocol sufficient for all known lens interactions?
  Provide: README updates, master plan architecture section, current
  study-lens.tsx and study-lens-client.tsx, lenses/DOCS.md.

- [ ] **0.4 Update types.ts** -- `study-lenses/types.ts` **already exists**
  with TransformModule, LensModule, Recommendation, Pipeline, BlockModelCell,
  OrchestratorState, and AnalysisReport (placeholder). EXTEND it — do not
  overwrite. Add:
  - Event NAME constants and PAYLOAD types (mechanism-agnostic — define
    the data shape, not the dispatch/listen mechanism)
  - Any refinements surfaced by AR-1 (if a flaw is found in the existing
    types, STOP and notify the user — other work streams depend on these)

  **Return type clarification**: `LensModule.lens` returns
  `React.JSX.Element`. Individual lens directories split logic:
  `lens.ts` = pure TS (config narrowing, code transformation),
  `wrapper.tsx` = calls `lens.ts` + returns JSX. The `LensModule.lens`
  property IS the wrapper export.

- [ ] **0.5 Write DOCS.md architectural sketch** -- for the orchestrator.
  This is the structural target the Refactor step is held against.
  Describe execution phases:
  - Initialize (receive props, set initial state, register default lenses)
  - Pipeline execution (run transforms, resolve lens, render)
  - Lens switching (detach current, check cache, mount new or cached)
  - State update (event from lens -> update snippet -> re-pipeline if needed)
  - Reset (restore original code, dispatch reset event)
  Structural constraints: pure TS core separate from React wrapper, event-
  based communication, content+config keyed cache, per-instance isolation.
  Out of scope: exercise-specific rendering, exercise-specific config
  panels, code transformation (that's the transform's job).

- [ ] **0.6 AR-2 sketch challenge** -- Is the sketch at the right
  abstraction? Are execution phases the right granularity? Does it use
  the ubiquitous language? Are structural constraints complete?
  Provide: DOCS.md sketch, README.md, types.ts.

- [ ] **0.7 Review & resolve** -- Can you predict the implementation shape?

  Commit: `docs: establish orchestrator domain model and architectural sketch`

## Phase 1 increment plan

### Sub-step 5a: Pure TS orchestrator core

- [ ] **Increment 1**: Registry -- register and retrieve transforms/lenses
  by name. ZOMBIES: empty registry, register one, retrieve by name,
  retrieve unknown name -> undefined.
- [ ] **Increment 2**: Pipeline validation -- receive a pre-parsed Pipeline
  prop (the Docusaurus plugin parses comma-separated fence syntax at
  build time) and validate it against the registry (all names registered,
  transforms are transforms, lens is a lens). ZOMBIES: valid pipeline,
  unknown transform name -> error, unknown lens name -> fallback to
  editor.
- [ ] **Increment 3**: Pipeline execution -- given a Pipeline and code
  string, run transforms in sequence, return the transformed code +
  resolved lens function. ZOMBIES: no transforms (just lens), one
  transform, multiple transforms.
- [ ] **Increment 4**: State management -- create state, update snippet,
  track initialLens/activeLens and initialTransforms/activeTransforms.
  ZOMBIES: initial state, update snippet, switch lens, switch transforms.
- [ ] **Increment 5**: Event protocol -- dispatch and listen for events.
  ZOMBIES: dispatch with no listeners, one listener, remove listener.
  Events: snippet-changed, lens-switched, state-reset, transforms-changed.
- [ ] **Increment 6**: Lens caching -- cache by content+config key,
  retrieve cached instance, invalidate on content change. ZOMBIES: no
  cache, cache one, cache hit on same key, cache miss on different key.
- [ ] **Increment 7**: Reset -- restore original code, dispatch state-reset
  event, handle cache implications.

**Sandbox checkpoint after increment 7**: Test the full pure TS core in
vitest -- create a registry, register transforms and lenses, build a
pipeline, execute it, verify caching and events work. All without React.

### Sub-step 5b: React wrapper

- [ ] **Increment 8**: Basic orchestrator React shell -- render toolbar
  (stub buttons) + lens area. Mount with `<BrowserOnly>`. Render the
  default lens (editor) given a `code` prop.
- [ ] **Increment 9**: Lens-switcher dropdown -- select from registered
  lenses, switching swaps the active lens in the lens area.
- [ ] **Increment 10**: Transform buttons -- `[loop guard]` toggle and
  `[format]` button. Toggling re-pipelines the code.
- [ ] **Increment 11**: Reset button -- resets snippet to original `code`
  prop.
- [ ] **Increment 12**: Recommender panel integration (stub) -- button
  opens the recommendation panel area (uses stub data until Work Stream 2
  is ready). Panel replaces the active lens area when open.
- [ ] **Increment 13**: Free-explore dropdown -- flat list of all registered
  lenses, no filtering, no relevance.

**Sandbox checkpoint after increment 13**: Start the Docusaurus dev server.
Navigate to a page with a code block. Verify: toolbar renders, lens
switcher works, transform buttons work, reset works. Exercise each
interaction manually.

### Trial contracts (prove the contracts work)

- [ ] **Increment 14**: Trial transform -- `toUpperCase`. Implements
  TransformModule. Register it. Verify it runs in the pipeline.
- [ ] **Increment 15**: Trial lens -- `editor`. Refactor from
  study-lens-client.tsx into the LensModule contract. Verify it renders
  in the orchestrator, reads/writes state, toolbar buttons work.
- [ ] **Increment 16**: Trial lens -- `highlight`. Read-only syntax view
  (Prism/CodeBlock). Verify it renders, switching between editor and
  highlight works, caching preserves editor state.

**Sandbox checkpoint after increment 16**: Dev server test. Create a code
block, switch between editor and highlight, toggle transforms, verify
caching (edit in editor, switch to highlight, switch back -- edits
preserved).

For each increment, follow the full TDD cycle from AGENTS.md:

1. JSDoc/TSDoc for the behavioral contract
2. Stub function with stub body
3. Placeholder types (tighten later)
4. Lint checkpoint: `npm run lint <new-file>`
5. Unit test (ZOMBIES order)
6. **AR-3**: Spawn reviewer to challenge test strategy
7. Lint checkpoint: `npm run lint <test-file>`
8. Implement (Fake It valid for first test)
9. Lint checkpoint: `npm run lint <impl-file>`
10. Refactor (check against DOCS.md sketch)
11. Lint checkpoint (final)
12. Update types
13. Self-review
14. **AR-4**: Spawn reviewer to audit implementation
15. Quality checks: `npm test && npm run lint && npm run type-check`
16. Verify docs match implementation
17. Atomic commit: `add: [behavior this increment implements]`

## Phase 2 checklist

- [ ] Run full quality checks: `npm test && npm run lint && npm run type-check`
- [ ] **AR-5 pre-merge review**: Spawn reviewer for the full changeset.
  Provide: full diff, modified files, this handoff document, DOCS.md files,
  the migration map above.
  Focus areas from AGENTS.md AR-5:
  - Cross-file consistency (types.ts shared vs. per-lens, naming alignment)
  - Does the React wrapper stay thin? (no business logic in .tsx)
  - Does the pure TS core work without React? (vitest tests prove this)
  - Migration map accuracy (did all current files migrate correctly?)
  - Event protocol completeness
  - Cache key correctness
  - Documentation sync
  - Convention compliance
  - Scope creep
- [ ] Address PAUSE/CONSIDER items from AR-5
- [ ] Update `src/theme/MDXComponents.js` import to point to orchestrator
- [ ] Commit prompt

## Verification

### How to test end-to-end

1. **Pure TS core tests**: `npm test` -- all registry, pipeline, state,
   event, cache tests green without React
2. **Type checking**: `npm run type-check` -- no errors
3. **Lint**: `npm run lint` -- clean
4. **Dev server smoke test** (Sandbox checkpoint):
   - Start `npm run start` (Docusaurus dev server)
   - Navigate to a page with a `` ```js `` code block
   - Verify: toolbar renders with all buttons
   - Click lens-switcher: switch between editor and highlight
   - Click format: code gets formatted in editor
   - Toggle loop guard: code gets loop guards added
   - Edit code in editor, switch to highlight, switch back: edits preserved
   - Click reset: code returns to original
   - Open free-explore: all registered lenses listed
5. **Contract verification**: the `toUpperCase` trial transform and the
   `editor`/`highlight` trial lenses prove the TransformModule and
   LensModule contracts work end-to-end

### What success looks like

A fresh agent working on Work Stream 4 (lens migration) can:

1. Import `LensModule` from `study-lenses/types.ts`
2. Implement a new lens following the contract
3. Register it via the registry
4. See it appear in the lens-switcher and free-explore dropdown
5. Switch to it and back, with caching preserving state
