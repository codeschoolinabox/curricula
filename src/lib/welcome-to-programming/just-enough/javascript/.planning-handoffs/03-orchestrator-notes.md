# WS3 Orchestrator + Contracts — Session Notes

Per `development-guide.md`: each stream's agent WRITES only to its own notes
file and READS others' at session start. Notes include: questions
asked/answered, decisions, blockers, deviations from the handoff, things the
next agent should know.

---

## 2026-04-20 — Session 1 (Phase 0 start)

**Agent**: Claude Opus 4.7 (1M context).
**Plan file**: `/Users/master/.claude/plans/read-these-files-before-curious-nest.md`
(local plan; not committed to repo by design).

### Session scope (user-directed)

"Stop after DDD for us to review the documents together."

This session is Phase 0 only (steps 0.1 → 0.7). No Phase 1 code. Final
deliverables for user review: updated `study-lenses/README.md`, extended
`study-lenses/types.ts`, extended `study-lenses/DOCS.md`, AR-1 + AR-2 reports,
and this notes file.

### Decisions resolved this session

1. **Event mechanism = EventBus (per-instance pub/sub, pure TS).**
   Weighed against DOM CustomEvents and React Context. EventBus wins because
   (a) pure TS core is the non-negotiable "vitest without React" constraint —
   EventBus needs zero test setup; DOM CustomEvents need jsdom/happy-dom;
   (b) per-instance isolation is structural with a bus, fragile with DOM
   bubbling if orchestrators sit near each other; (c) typed dispatch is
   trivial with generics, awkward with `CustomEvent.detail`. Tradeoff: loses
   WC kit lineage in the dispatcher layer. The payload data shapes remain
   identical regardless of mechanism and go into `types.ts`.

2. **Reset semantics = two-level model.** Toolbar exposes two buttons:
   - **Reset** — restores `snippet = originalCode`; dispatches `state-reset`;
     does NOT touch `initialLens`, `initialTransforms`, or the cache.
   - **Reset All** — restores `snippet = originalCode` + `activeLens =
     initialLens` + `activeTransforms = initialTransforms`; clears the cache;
     dispatches `state-reset-all`.

3. **Increment 0 pass-through = delegate to `StudyLensMock`** from
   `src/plugins/study-lenses/components/StudyLensMock.tsx`. This is temporary
   runtime→plugin coupling; the backlog item "plugin = build-only, remove
   rendering components" is out of WS3 scope.

4. **Workspace = main repo, branch `ws3/orchestrator-contracts`, no
   worktree.** Commits additive only (per AGENTS.md git policy).

### Corrections to the handoff (`03-orchestrator-and-contracts.md`)

The handoff references V2 source files at `lenses/study/`:

- `lenses/study/study-lens.tsx` ("V2 source for refactor into orchestrator")
- `lenses/study/study-lens-client.tsx` ("V2 source for editor lens wrapper")
- `lenses/study/types.ts` ("split target")
- `lenses/study/DOCS.md`, `COMPONENT-CONTRACT.md`, `tests/`
- The whole "Migration map" table

**Reality**: `/lenses/` directory is deleted. Confirmed via `ls` — returned
"No such file or directory". `study-lenses/` has fully superseded it.

**Impact on WS3 work**:

- Increment 15 (trial lens `editor`) is a **fresh implementation** consuming
  `lib/editing/create-editor.ts`, not a refactor of a V2 file
- No `types.ts` "split" work — `study-lenses/types.ts` already exists
  standalone
- Migration map is obsolete

**Recommendation for user**: update the handoff file to strip the V2
references. Not done in this session (agents should not modify handoff
unilaterally per the coordination rules).

### Plugin↔orchestrator wiring reality check

- Plugin emits JSX tag `<StudyLens>` (singular) via `code-block-to-jsx.ts`.
  Master plan names the orchestrator `<StudyLenses>` (plural). Reconciled at
  the MDXComponents binding: `{ StudyLens: StudyLensesOrchestrator }`.
- Plugin-emitted prop shape: `{ code, lens, lang, config? }`. `config` is
  a JSON string when present. `lens` is currently a single lens name string —
  the plugin does NOT yet parse comma-separated fence syntax (that's a
  backlog item). WS3's orchestrator accepts the current shape and constructs
  a degenerate `Pipeline { transforms: [], lens }` internally until the
  plugin is updated.
- `lang` prop is a no-op for WS3 — JEJ-only by master-plan decree. The
  orchestrator can accept-and-ignore, or filter it at the MDXComponents
  boundary.

### Library dependencies confirmed intact

- `lib/editing/create-editor.ts` — async factory returning
  `{ content, el, reset, format, check, destroy }`. Aligns well with
  orchestrator mounting: `el` is the HTMLElement to cache/detach/reattach.
  `reset()` aligns with the Reset semantic. `format()` can back the toolbar
  `[format]` action OR stay editor-internal — resolve in AR-3 when writing
  Increment 15 tests.

### Open items flagged for AR-1 / AR-2

- Is the orchestrator doing too much? Should `core.ts` split into
  `state.ts` + `pipeline.ts` + `cache.ts` + `registry.ts` from day one, or
  is one cohesive file simpler?
- Does the `TransformModule` / `LensModule` contract cover all known lens
  types (editor, blanks, parsons, trace-table, highlight)?
- Is content+config-hash cache keying sufficient? What about learner-state
  that exists WITHIN a cached instance (e.g., blanks answers) — does the
  cache key's granularity matter for those?
- Is the two-level Reset model correct UX, or does it introduce
  decision-load on learners who just want "undo my edits"?
- Does `editor` lens keep its own Format/Run buttons, or do toolbar
  `[format]` + (future) toolbar `[run]` subsume them?

### Things the next agent (or next session) should know

- Read this file first, then the plan file, then the handoff, then
  `study-lenses/README.md` + `DOCS.md` + `types.ts`.
- The pre-commit hook runs markdownlint on all `.md` files and has ~300
  pre-existing errors. `--no-verify` is accepted per the dev-guide.
- If you spot a flaw in `types.ts`: STOP, append to this notes file,
  notify the user. Do NOT modify unilaterally.
- `progress.txt` lines 12-14 reference a `/evaluating/trace` refactor
  into `/syntax` + `/semantics` tracers — orthogonal to WS3, flagged by
  user but not part of this work stream.

---

## AR-1 report summary and response (Phase 0 step 0.3)

The AR-1 reviewer produced a structured report with 15 concerns. Verdict:
**CONSIDER**. Full report is in the spawned agent's output (not persisted
to file by default). Summary of findings and my response below.

Per the coordination rule ("If agent finds a flaw in types.ts, STOP, write
to this file, notify user, do NOT modify unilaterally"), the two PAUSE-
severity concerns are flagged below as **user decisions required** before
types.ts can be finalized.

### PAUSE concerns (user decision required)

#### AR-1 Concern #1 — `LensModule.lens` return type is synchronous; `editor` is async

**Finding**: `types.ts:39` declares
`lens: (code: string, config?: LensConfig) => React.JSX.Element`. The
underlying `createEditor` factory at `lib/editing/create-editor.ts:41` is
`async function createEditor(...): Promise<EditorInstance>`. A synchronous
signature cannot construct a post-init CodeMirror instance. Also: the
caching model (detach/reattach live DOM) suggests a DOM handle, not a
React element.

**Counter-proposal options** (reviewer's, reformulated):

- **A**: Widen return to `React.JSX.Element | Promise<React.JSX.Element>`.
  Simpler change; React wrapper handles suspense/loading UI.
- **B**: Return `React.ComponentType<LensProps>` — a component reference;
  React handles mounting/effects. Decouples construction from render.
- **C**: Return `LensMount = { el: HTMLElement; dispose: () => void }` —
  framework-agnostic DOM handle. Aligns with editor factory shape and
  cache's detach/reattach model. Pure TS (no React dep in `lens.ts`).

**My recommendation**: **C**. The pure TS core constraint + the editor
factory's existing `{ el, destroy }` shape + the cache's "detach live DOM"
model all point to DOM handles. The React wrapper mounts the returned
`el` into a container div; switching = swap DOM nodes. Con: lenses that
are React-native (blanks, parsons) must wrap themselves in a root React
mount (small ceremony). Pro: pure TS `lens.ts` works, cache is unambiguous,
per-instance isolation is physical (distinct DOM subtrees).

**Status**: WAITING ON USER before modifying `LensModule.lens` return type.

#### AR-1 Concern #2 — `LensConfig` is `Record<string, unknown>`; `configHash` has no stable derivation

**Finding**: README says cache keys are `content + configHash`. `types.ts:29`
types `LensConfig` as `Readonly<Record<string, unknown>>`. Functions,
callbacks, React elements, class instances do not hash stably via
`JSON.stringify`. Result: cache will silently behave as "always miss" or
"always hit" in surprising ways.

**Counter-proposal options**:

- **A**: Tighten `LensConfig` to
  `Readonly<Record<string, string | number | boolean | null |
  readonly (string|number|boolean)[]>>` (serializable primitives).
  Callbacks go through the EventBus, not config. Hashable by construction.
- **B**: Add `LensModule.configHash: (config) => string` contract method.
  Each lens owns its hashing. More flexible; more ceremony.

**My recommendation**: **A**. Matches "pure TS core testable in vitest"
invariant. Callbacks-via-config is rarely what you want anyway (events are
a better channel). If a lens genuinely needs a function config in the
future, we escalate to B then; premature flexibility now is future-
proofing we haven't earned.

**Status**: WAITING ON USER before tightening `LensConfig`.

#### AR-1 Concern #3 — `StudyLens` (singular) vs `StudyLenses` (plural) naming

**Finding**: Plugin emits `<StudyLens>` at
`code-block-to-jsx.ts:42,85`. Master plan names orchestrator
`<StudyLenses>`. Reconciled at MDXComponents: key `StudyLens` → value
`StudyLenses`. `StudyLensMock` adds `data-study-lens={lens}` attribute
where "lens" means the lens name. A WS4 agent grepping `StudyLens` hits
four contexts with three meanings.

**Counter-proposal options**:

- **A**: Fix the plugin now — rename emitted tag to `StudyLenses` + rename
  `StudyLensJsxNode` → `StudyLensesJsxNode`. Plugin change is out of WS3
  scope per session notes, but it's additive (one new commit, no history
  rewrite). Master-plan backlog already calls for plugin updates anyway.
- **B**: Stay with current naming. Add an explicit glossary entry
  clarifying the three shades (plugin tag, orchestrator component, `lens`
  prop value). Document the MDXComponents indirection.

**My recommendation**: **B for WS3**. Renaming the plugin here scope-creeps.
Document the split clearly, add a note to the plugin's README flagging
the rename as a backlog item, and move on. WS4 agents read docs, not just
grep.

**Status**: WAITING ON USER — confirm B is acceptable, or escalate to A.

### CONSIDER concerns (addressed in DOCS.md / types.ts)

#### #4 — `lang` prop accept-and-ignore unsafe

**Response**: Will add structural constraint to DOCS.md: "orchestrator
validates `lang`; non-JEJ values produce a `console.warn` and render a
diagnostic banner. No silent pass-through to the active lens."

#### #5 — `Pipeline` type vs plugin-emitted flat props

**Response**: Will add a new type `PluginEmittedProps` to types.ts
documenting what the plugin actually emits today. `Pipeline` becomes the
orchestrator-internal type constructed by parsing `PluginEmittedProps`.
Will add the parse step as explicit Phase 1 work (currently implicit in
Increment 0/8). NO BREAKING CHANGE to existing `Pipeline` type.

#### #6 — Editor cache thrash / write-through lens carveout

**Response**: Will add structural constraint to DOCS.md: "Cache key for a
lens instance = `(lens-name, content-at-mount, config)`. Content-at-mount
is captured when the lens mounts and is immutable for the lens's lifetime.
This means the editor lens is never re-keyed while active (it IS the
source of truth for snippet state). Read-only lenses (blanks, parsons)
capture the pipeline-transformed content at mount and hold it."

#### #7 — EventBus semantics

**Response**: Will add structural constraint to DOCS.md: "EventBus
dispatch is synchronous; listeners execute in registration order; a
thrown listener is caught + warned + does not abort remaining listeners;
re-entrant dispatch permitted (depth-first)."

#### #8 — Reset interaction with editor self-reset

**Response**: Will add to DOCS.md §Reset: "Reset sets
`snippet = originalCode` and dispatches `state-reset`. The `editor`
lens listens to `state-reset` and updates its CodeMirror content from the
new snippet; it does NOT call its own internal `reset()`. Orchestrator
snippet is the single source of truth."

#### #9 — Orchestrator unmount teardown unspecified

**Response**: Will add to DOCS.md §Structural constraints: "Orchestrator
unmount: call `dispose()` on every cached lens instance (destroys
CodeMirror `EditorView` for the editor lens; removes event listeners for
React-native lenses); clear the EventBus listener table; clear the lens
cache. No listeners or DOM survive React unmount."

#### #10 — Transform-throws fall-through unsafe

**Response**: The clean fix is to add
`TransformModule.onFailure: 'fallthrough' | 'abort'` (default `'abort'`)
to the contract — each transform declares its failure semantics.
However, this modifies an existing type (`TransformModule`), so per
the "STOP on types.ts changes" rule I will NOT make this change
unilaterally. Instead: I will define a new exported type
`TransformFailureMode = 'fallthrough' | 'abort'` in types.ts (purely
additive), and document the proposed `TransformModule.onFailure` in
DOCS.md as a constraint awaiting user approval. Default behavior remains
"abort with diagnostic banner" per the DOCS.md constraint I will add.

**Status**: WAITING ON USER — confirm adding `onFailure?:
TransformFailureMode` to `TransformModule` is acceptable, or propose
alternative.

#### #11 — Recommender flicker on transform toggle

**Response**: Will add to DOCS.md §Recommend: "Recommender analysis is
debounced by 150ms when triggered by transform toggles. Rapid toggles
supersede each other — only the latest analysis result is rendered.
Panel shows a lightweight 'analyzing…' indicator during compute."

### NIT concerns (addressed in DOCS.md)

- **#12 `snippet-name-changed` event**: Will add to the event protocol
  (types.ts + DOCS.md). Additive.
- **#13 "Lens" overload glossary**: Will add a "Lens function" row to the
  README glossary to disambiguate `LensModule.lens` from the module.
- **#14 `core.ts` decomposition**: Will commit to the split in README
  directory layout: `state.ts`, `pipeline.ts`, `cache.ts`, `event-bus.ts`,
  `registry.ts`, plus `core.ts` as the integrator. Each file small + own
  tests.
- **#15 Per-instance isolation test**: Will add explicit Phase 1 test to
  the plan (multiple-orchestrators-on-one-page invariant test). This
  lives in the plan file, not Phase 0 artifacts.

### Summary of types.ts changes I will make in step 0.4 (additive only)

- Add `EVENT_NAMES` frozen const record
- Add payload types for each event: `SnippetChangedPayload`,
  `LensSwitchedPayload`, `TransformsChangedPayload`, `StateResetPayload`,
  `StateResetAllPayload`, `ConfigChangedPayload`,
  `ExerciseCompletedPayload`, `SnippetNameChangedPayload`
- Add `EventName` union, `EventPayload<N>` mapping, `EventListener<N>`
- Add `EventBus` interface type (dispatch / subscribe / unsubscribe /
  clear)
- Add `PluginEmittedProps` documenting the current plugin prop shape
- Add `TransformFailureMode = 'fallthrough' | 'abort'` type (not wired
  into `TransformModule` yet — pending user decision)

### Summary of types.ts changes I WILL NOT make (pending user review)

- `LensModule.lens` return type (Concern #1)
- `LensConfig` shape tightening (Concern #2)
- Anything touching `<StudyLens>` vs `<StudyLenses>` naming (Concern #3)
- Adding `onFailure?: TransformFailureMode` to `TransformModule`
  (Concern #10 — the type exists but is not yet used in the module
  contract)

---

## AR-2 report summary and response (Phase 0 step 0.6)

AR-2 reviewer audited the updated `DOCS.md` sketch. Verdict: **CONSIDER**.
13 concerns raised. Summary below.

### PAUSE concerns — require user resolution

#### AR-2 Concern #1 — Content-at-mount cache key + Reset produces stale entries

**Finding**: Phase 3 says content-at-mount is immutable for a cached
instance. Phase 5a (Reset) dispatches `state-reset` to the active lens
which rebinds its UI to the new snippet. But the cache entry's key still
reflects the pre-reset content-at-mount. If the learner later returns to
that cache key (e.g., via transform toggle), they hit a stale entry whose
internal state has been overwritten by the Reset handler.

**Options**:

- **A**: Reset clears the entire cache. Simple; erodes the distinction
  between Reset and Reset All to only "initial lens / transforms
  restoration."
- **B**: Reset clears the **active lens's cache entry only**. Other
  lenses retain their instances (with their original content-at-mount
  keys). Learner switches to another lens → cache hit on a valid
  historical state. Active lens re-mounts fresh on next activation.
- **C**: Keep cache untouched (current sketch behavior). Accept that
  stale entries may reattach with incorrect content. Learner must use
  Reset All for a clean slate.

**My recommendation**: **B**. It honors the two-button distinction
(Reset ≠ Reset All) while avoiding the stale-entry bug. Active-lens
invalidation is structurally simple (the orchestrator knows which lens
is active) and means the active lens always remounts on next switch,
which matches the learner's mental model ("I reset my snippet; the
current view starts fresh; other views I visited may still show their
historical context").

**Status**: WAITING ON USER.

#### AR-2 Concern #2 — Editor divergence via external snippet mutation while detached

**Finding**: Editor mount 1 caches with content-at-mount = originalCode.
Learner types X; orchestrator snippet = X. Learner switches to highlight.
External transform toggle changes snippet to transformedX. Learner
switches back to editor. Cache lookup is `(editor, transformedX,
configHash)`; cached entry's key is `(editor, originalCode, configHash)`;
miss → fresh editor mount with content-at-mount = transformedX. OK so
far, but the old editor instance (with buffer = X and typing/undo
history) is orphaned in the cache. It'll rehydrate only if the learner
coincidentally arrives back at snippet = originalCode with the same
config — an edge case that silently loses undo history in the common
case.

AR-2 reviewer framed this as a cache-key-vs-buffer divergence; my
analysis is that the sketch's **lookup semantics are correct** (lookup
by current snippet, not by "the cache entry I once used") but the sketch
was ambiguous enough that the reviewer read it the other way. The real
risk is undo-history loss on external snippet mutation.

**Options**:

- **A**: Clarify the sketch's lookup semantics; accept undo-history loss
  on external snippet mutation as a known cost. Document the tradeoff.
- **B**: When orchestrator snippet changes via a non-editor source AND
  an editor cache entry exists with a now-stale content-at-mount,
  eagerly re-write that entry's buffer to the new snippet (preserves
  undo history for a single snippet line). Complex; per-cache-entry
  book-keeping.
- **C**: Editor lens never caches. Always fresh mount on switch. Lose
  ALL switch-back undo preservation; simplest.

**My recommendation**: **A**. Sketch clarification + documented tradeoff.
The undo-history loss on external snippet mutation is the same loss the
learner would get if they manually edited and then ran `format` — they
already expect external transforms to rewrite the buffer. (B) is
over-engineered for the scope; (C) is a bigger regression than AR-2's
concern.

**Status**: WAITING ON USER — confirm the clarification approach.

### CONSIDER + NIT concerns — addressed or flagged

- **#3 Phase 7 conflates three concerns**: Agreed. Will leave phase 7 as
  is in this session (handoff-complete cost is high) but note it. A
  future refactor of DOCS.md could promote "Unmount" to its own phase
  and move dispatch-semantics to structural constraints.
- **#4 150ms debounce in sketch**: Agreed — that's an implementation
  tuning. Will soften in a narrow edit.
- **#5 TransformFailureMode dangling**: Agreed — the sketch references
  `TransformModule.onFailure` which isn't in the type. Will soften phase
  2 to not branch on a not-yet-approved contract field.
- **#6 Reset All race condition**: The dispatch-order is implementation
  detail that belongs in DOCS.md as a constraint. Will add one-line
  constraint: "Reset All dispatches `state-reset-all` before cache
  clearing; active-lens listeners run synchronously before disposal."
- **#7 snippet-name-changed without phase**: Will add a brief mention to
  phase 1 (snippet-name field is part of initial state) and note that
  updating it dispatches the event.
- **#8 Phase 1 collapses validate+prepare**: Agreed. Splitting phase 1
  is narrow enough to do in this session.
- **#9 Registry lookup not in any phase**: Add explicit registry
  consultation mention in phase 1 and phase 4.
- **#10 Unmount teardown scope**: The sketch claims "no stateful
  leakage" — that's GC-dependent for JS references. Will narrow the
  claim.
- **#11 lens-switched vs transforms-changed dispatch order**: Add
  constraint: "state updates are atomic within a single learner action;
  transforms-changed dispatches before lens-switched on
  recommender-driven switches."
- **#12 "current lens" / "active lens" drift**: Will unify to "active
  lens."
- **#13 content-at-mount not in glossary**: Will add to README.

### Format compliance

AR-2 flagged format violations (variable names, type names, method
names, tuple literals bleeding into the sketch). Fixes applied in the
narrow revision below. Some variable/identifier leakage will remain
(e.g. referencing `code`, `lens`, `config` props — these ARE the
plugin contract, which IS the domain at the boundary). The sketch is
not fully compliant with DEV.md's "prose only" rule but is within
reasonable interpretation for a boundary-describing sketch.

Changes applied in this session after AR-2:

- Split phase 1 into Validate + Prepare
- Soften 150ms debounce claim
- Revise phase 2 transform-failure paragraph to not branch on unapproved
  type field
- Add Reset All dispatch-order constraint
- Add snippet-name mention to phase 1
- Add registry lookup to phase 1 and phase 4 (brief)
- Unify "current lens" → "active lens"
- Narrow unmount cleanup claim to "orchestrator-owned references"
- Add lens-switched / transforms-changed ordering constraint
- Add content-at-mount to README glossary

---

## Decisions finalized after AR-2 + user review (Session 1, 2026-04-22)

The user reviewed all AR-1 + AR-2 concerns and resolved them. Applied in
this session to `types.ts`, `README.md`, `DOCS.md`, and the plan file.

### Resolved PAUSE concerns from AR-1

- **AR-1 #1** (LensModule.lens return type) — **RESOLVED**: option C
  (framework-agnostic `LensMount` DOM handle) adopted. Lenses may be
  synchronous OR asynchronous — `LensMount | Promise<LensMount>`. The
  `LensMount` record has `el: HTMLElement`, `dispose: () => void`, and
  optional `onSnippetChanged?: (snippet) => void` hook. `types.ts`
  updated; `React.JSX.Element` import removed.
- **AR-1 #2** (LensConfig shape) — **RESOLVED**: option A (tighten to
  `Record<string, SerializableValue>`). New helper types
  `SerializablePrimitive` and `SerializableValue` added to `types.ts`.
  `TransformConfig` and `LensConfig` both tightened. Callbacks and
  instance state now belong on the EventBus or `LensMount`.
- **AR-1 #3** (naming) — **RESOLVED**: rename `<StudyLens>` →
  `<StudyLenses>` everywhere. Pre-Increment-0 commit will touch plugin
  (`code-block-to-jsx.ts`, `remark-study-lenses.ts`, README),
  `StudyLensMock.tsx` → `StudyLensesMock.tsx`, and `MDXComponents.js`.
  Fixes broken build simultaneously.
- **AR-1 #10** (transform failure) — **RESOLVED**: option A
  (`TransformModule.onFailure?: TransformFailureMode`). Default
  behavior when absent is `'abort'`, enforced at the orchestrator
  (`mode = transform.onFailure ?? 'abort'`). `TransformFailureMode`
  exported.

### Resolved AR-2 concerns via inversion of control

- **AR-2 #1** (stale cache entries on Reset) — **SUBSUMED** by the IoC
  adoption. The "content-at-mount" carveout has been REMOVED from
  `DOCS.md` §3 and README glossary. Cache key is now
  `(lens-name, config-hash)`; exactly one entry per key. Stale
  reattachment surfaces a "Content has changed. [Refresh] [Continue]"
  affordance (Safe-2) for cached mounts whose last-seen snippet differs
  from the current orchestrator snippet.
- **AR-2 #2** (editor divergence + undo continuity) — **RESOLVED**: IoC
  hook `LensMount.onSnippetChanged?` adopted. Orchestrator pushes
  external snippet changes into every cached mount. Lenses decide
  per-semantic: editor appends an external edit preserving undo;
  parsons reshuffles; blanks re-blanks; highlight re-renders. Lenses
  without the hook keep stale state and surface the affordance.

### Files edited in this session

1. `study-lenses/types.ts` — added `SerializablePrimitive`,
   `SerializableValue`, `LensMount`; tightened configs; added
   `onFailure?: TransformFailureMode` to `TransformModule`; flipped
   `LensModule.lens` return type; removed React import; updated
   exports.
2. `study-lenses/README.md` — glossary (dropped "Content-at-mount",
   added "Lens mount" and "Snippet-change hook", updated "Lens cache"
   and "Event protocol"); module contracts code block (added
   `LensMount`, `onFailure`, IoC signature); "Lens ↔ orchestrator
   communication" paragraph (two mechanisms: EventBus + IoC hook).
3. `study-lenses/DOCS.md` — rewrote phase 3 (Cache) for
   `(lens-name, config-hash)` keying + IoC propagation + stale banner;
   simplified phase 5a (Reset) to use IoC push instead of cache
   invalidation; replaced "content-at-mount keyed" structural
   constraint with `(lens-name, config)`; replaced "active lens
   remounts after Reset" constraint with "Reset propagates via IoC,
   not cache invalidation"; updated "event protocol" constraint to
   document both mechanisms (EventBus + IoC hook).
4. `/Users/master/.claude/plans/read-these-files-before-curious-nest.md` —
   plan file updated to reflect IoC, stale affordance, LensMount
   contract, rename work sequenced before Increment 0. (Local plan
   file, not in repo.)

### Next steps (per approved plan)

1. Commit this DDD finalization as `docs: finalize orchestrator domain
   model post-AR review` (single commit covering types.ts, README.md,
   DOCS.md, and this notes file).
2. Pre-Increment-0: naming consolidation + orchestrator stub + fix
   broken build. See plan file §Pre-Increment-0 for the full step list.
3. Phase 1: TDD increments (Increment 1 Registry onwards). Not in this
   session per user directive "stop after DDD for us to review."

### User-visible sandbox checks needed

- After Pre-Increment-0: navigate to a curriculum page with a `` ```js ``
  fence and confirm `StudyLensesMock` renders (no broken build, no
  missing-component errors).
- After each Phase 1 increment that ships a user-visible behavior (per
  plan's inline 🔍 markers). Dedicated todos added to the todo list
  per user instruction "add steps in your todos for me to do browser
  sandbox checks of user-visible behavior whenever there is a new
  user-visible behavior."
