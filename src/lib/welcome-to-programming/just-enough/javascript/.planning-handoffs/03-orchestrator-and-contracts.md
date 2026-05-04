# WS3: orchestrate/orchestrator — post-refactor increment plan

> **Status**: This handoff was rewritten end-to-end after the package's
> top-level docs (`README.md`, `DOCS.md`, `REFACTOR-HANDOFF.md`) locked
> in the **embody / lenses / orchestrate three-peer architecture** and
> integrated the **Explorotron quadrant + pyramid** framework. The
> previous version targeted `<StudyLenses code lens lang transforms>`
> with a transforms-tier pipeline; that whole framing is superseded.
>
> **Hard prerequisite**: `REFACTOR-HANDOFF.md` Steps 1-16 must be
> executed and merged before any increment in this handoff begins.
> The refactor is the only path to the embody / lenses / orchestrate
> layout this handoff targets.
>
> **Operational instructions (prompt template, pre-session checks,
> red flags, coordination points)** live in the sibling file
> [`03-orchestrator-and-contracts-kickoff.md`](./03-orchestrator-and-contracts-kickoff.md).
> Read that BEFORE opening a session for any increment in this
> handoff.

## Locked architectural decisions you must honor

Per `javascript/README.md` § Pedagogical first principles and
`javascript/DOCS.md` § Locked decisions:

- **Four-prop public API**: `<StudyLenses snippet={…} lens={…}?
  config={…}? configs={…}? />`. `snippet` is a string of code (the
  orchestrator builds the embodiment internally — caller does NOT
  pre-build it). `lens` is an optional default-mounted lens name
  (Q-III seam). `config` is an optional override for the
  resolved-default lens. `configs` is the optional cascade bundle
  keyed by lens name — the picker reads `configs[lensName]` when
  opening any lens. Dropped from the old API: `code` → renamed to
  `snippet`; `lang` → no longer needed (embody auto-detects);
  `transforms` → no transforms tier.

  **Resolved-default-lens resolution order**: `lens` prop → cascade
  default declaration in `configs` → none.

  **Resolution chain for any lens-name**:

  ```text
  resolved(lensName) = module.config()                          // tier 0
                     ⊕ configs?.[lensName]                      // tier 1
                     ⊕ (lensName === resolvedDefault ? config : {})  // tier 2
  ```

  (`⊕` = deep-merge-right-wins.)

  **`config=` without `lens=` prop**: applies to the resolved-default
  lens (which may come from the cascade rather than the prop). Use
  case: cascade declares the default; per-fence supplies a
  fence-level config for that default. If NO default resolves, the
  orchestrator throws at mount with a clear message — F1 implements.

  **Per-fence info-string syntax (URL-style)**:

  ```text
  js:trace                   → lens="trace"
  js:trace?stepDelay=500     → lens="trace", config={ stepDelay: 500 }
  js:trace?cols=value,steps  → lens="trace", config={ cols: ["value","steps"] }
  ```

  The plugin parses fence args and emits `lens` + `config` on
  `<StudyLenses>`. The directory-wide `lenses.json` cascade emits
  `configs`.

  **API revision note**: the original three-prop API conflated two
  signals into a single `config` bundle (the cascade's per-lens
  bundle, and the per-fence override for the default-mount lens).
  The four-prop split surfaces what was already in the cascade
  pipeline; the names just got assigned. This amendment was made
  during the Round-2 AR realignment that surfaced canon/handoff
  drift between `lenses/types.ts` and the handoffs.

- **Single-writer state model**: only `orchestrate/editor/` mutates
  snippet source. Lenses are read-only views consuming `embodiment`
  via props.

- **Bedrock orienting principle: Explorotron's quadrant + pyramid
  model** (Malaise & Signer, Koli Calling 2023, Figure 2). The
  orchestrator must serve **all four quadrants** without privileging
  one stakeholder; the pyramid's vertical structure dictates the
  build-order dependency chain for every increment that follows.

  ```text
  Quadrants (axes)              Pyramid (build order, bottom→top)
  ─────────────────────────     ─────────────────────────────────
            Uncurated                  Monitored learning
              ▲                       (Grade / LMS / Cheating)
        I  ──┼──  II                            ▲
   Unguided ◄─┼─► Guided          Curated  IV (Manual study paths)
       III ──┼──  IV              learning ◄──────────────────────
              ▼                            III (Manual recommendations)
            Curated                                ▲
                                  Uncurated   II (Path generation)
   Q-I  Default recommendations    learning  ◄────────────────────
   Q-II Generated study paths                I  (Lenses & defaults)
   Q-III Manual recommendations                    ▲
   Q-IV  Manual study paths        Base Features (Progress modelling)
  ```

  Implications:

  1. **All four quadrants stay live.** The picker (Q-I/Q-III) and
     the recommender panel (Q-II/Q-IV) are complementary surfaces
     feeding the same mounting machinery; one never replaces the
     other.
  2. **Each pyramid layer is a prerequisite for the layer above.**
     Layer II (path generation / recommender) cannot exist without
     Layer I (lenses & defaults). Layer IV cannot exist without I +
     II + III. Increments must respect this dependency chain.
  3. **The fractal claim** (per `DOCS.md` §Pedagogical grounding
     §Pyramid layers): the framework's pyramid applies at **two
     scopes** — *snippet* (one `<StudyLenses>` instance) and
     *curricular* (the embedding LMS arranging instances). We own
     the snippet scope; the LMS owns the curricular scope.
  4. **Scope boundary** (per `DOCS.md` §"What we explicitly do NOT
     own"):
     - System-wide learner state, knowledge graph, ZPD positioning
       — LMS.
     - Multi-snippet path arrangement — LMS.
     - Grade reports / LMS integration / cheating detection — LMS.
     - **A data-emit protocol from `<StudyLenses>` back to the LMS
       — DEFERRED until a concrete integration target exists.**

     The orchestrator's EventBus is therefore INTERNAL only:
     intra-component coordination (lens-to-orchestrator events such
     as `exercise-completed` consumed by future increments), not
     outbound telemetry. Per-snippet manual study tours (Q-IV) are
     deferred entirely (auto-recommended Q-II tours suffice). The
     future shape (5th prop / meta-key in `configs` / `lenses.json`
     directory-level) is intentionally undecided until Q-IV un-defers.
  5. **Disposable practice, not persisted progress.** Lens state is
     *per-mount only*. When the snippet changes (re-embody), all
     active lenses are disposed and remounted fresh against the
     new embodiment. There is no "stale-state affordance", no
     `onSnippetChanged` IoC hook, no preservation of parsons
     shuffle order or blanks-in-progress across an edit. This is a
     deliberate simplification: lenses are practice surfaces, not
     learner-state stores.
  6. **Stakeholder tension is structural, not a bug** (per paper
     §3.1, §3.2). Students want autonomy; teachers want LMS data;
     researchers want telemetry. The pyramid's vertical axis IS this
     tension — moving up the pyramid trades autonomy for support.
     Architectural decisions never collapse this axis. The
     **lifelong-learning autonomy** principle (per `README.md` §Why
     this architecture) is the answer: Q-I is not a fallback, it's
     the central pedagogical bet — the dropdown is ALWAYS available
     so learners take their lens kit with them post-graduation.

- **No `transforms/` peer**: transforms-as-lens-internal-concern.
  Parsons / blanks / bug-injection live inside the relevant lens.

- **Editor is not a lens**: it is the always-present home base at
  `orchestrate/editor/`, the orchestrator's snippet writer.

- **Lens shape**: each lens is a **two-layer module** — a pure-TS
  core (display derivation, validation, scoring — testable in
  vitest without `jsdom`) plus a light React wrapper that takes
  `embodiment` as a prop, mounts the core, and renders UI (needs
  `jsdom` for tests). NOT a single-file React component; NOT a
  framework-agnostic LensMount.

- **`embodiment` is the canonical parameter name** wherever a
  function takes a Snippet instance.

- **Pre-processing is formatting only**, not validation gating.
  Educators may intentionally include non-JEJ examples; embody
  computes `validation.violations` as metadata; lenses choose
  whether to surface them.

## Cross-handoff impact

This handoff does NOT touch the following, but flags them as
needing realignment in separate sessions:

- **`01-NM-components.md`, `02-analysis-and-recommender.md`,
  `04-lens-migration.md`** — affected by the new architecture.
  Analysis modules now consume `embodiment`; lens migration
  targets the TS-core + React-wrapper contract; recommender
  consumes `embodiment` and is the authoritative Layer-II engine.
- **REFACTOR-HANDOFF.md does NOT cover the Docusaurus plugin** at
  `src/plugins/study-lenses/`. The plugin's prop emission contract
  (`code-block-to-jsx.ts:76-94`) currently produces
  `<StudyLenses code lens lang config transforms>`; the new
  orchestrator API is `<StudyLenses snippet lens? config? configs?>`.
  Required plugin alignment:
  - **Drop `transforms` attribute** entirely (no transforms tier).
  - **Rename `code` → `snippet`** to match the new orchestrator
    prop.
  - **Drop `lang` attribute** (embody auto-detects).
  - **Adopt URL-style fence syntax**: `js:trace?stepDelay=500`
    parses to `lens="trace"` + `config={ stepDelay: 500 }`. Bare
    `js:trace` is `lens="trace"` only. Plain `js` is the default
    editor home base. Comma-separated transforms parsing dies.
  - **`lens` attribute survives** (Q-III seam — picker default).
    The learner can still pick freely (Q-I).
  - **`config` attribute survives** as the override for the
    resolved-default lens. Q-IV per-snippet tours are deferred
    (see Layer IV below); no `sequence` field needed.
  - **NEW `configs` attribute**: the cascade bundle keyed by lens
    name. The plugin populates this from the `lenses.json`
    directory cascade (`resolve-cascade.ts`).
  - **Per-fence `@study-lens` directive** at
    `parse-study-lens-directive.ts` survives — Q-III educator-
    override surface.
  - **`lenses.json` cascade** (`resolve-cascade.ts`) survives;
    its output now flows into the new `configs` prop.
  - **Recommendation**: REFACTOR-HANDOFF.md should gain new steps
    (e.g. Step 11.5 or new Step 18) covering plugin alignment,
    landing AFTER the orchestrator's prop contract stabilizes
    (Step 10) and AFTER the `study-lenses/` → `lenses/` rename
    (Step 11). The plugin keeps its directory name
    `src/plugins/study-lenses/` because "study-lenses" is the
    public user-facing concept.

## What's landed (pre-refactor; pending migration)

| Era                  | Concern                                | Files / commits                                          | Refactor disposition                                                                                  |
| -------------------- | -------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Phase 1 (Inc 0–7b)   | Pure-TS substrate (registry, pipeline, state, EventBus, cache, reset, reset-all) | `lenses/*.ts` (10 modules, pre-refactor location)        | Modules reshape: registry simplifies (no transforms peer); pipeline-execute becomes `format → embody`; cache disappears (disposability); EventBus migrates to internal-only. Recovered durables: name-enumeration, EventBus pattern, freeze discipline, cleanup-split lessons. REFACTOR-HANDOFF Step 11 decides specifics. |
| Inc 8                | React wrapper scaffolding              | `lenses/orchestrator/study-lenses.tsx` + default-registry + editor stub (pre-refactor location) | Wrapper migrates to `orchestrate/` (Step 10); editor stub becomes `orchestrate/editor/` home base (Step 8); registry concept may dissolve.                                                                                                                                       |
| Inc 9                | Toolbar with lens-picker, dispatch-effect, cache-hit reattach | 11 commits `fc3257c..228c04c`                            | Toolbar lens-picker SURVIVES as the Q-I/Q-III learner-driven exploration surface. `lens-switched` dispatch-effect SURVIVES (still fires on learner-driven switch — internal-only per F5). Cache-hit reattach DISSOLVES (disposability — lens state is per-mount, snippet change unmounts lenses).               |

Test count pre-refactor: ~228 tests across 17 files. Expect
substantial shifting during REFACTOR-HANDOFF Steps 3-11 (moves)
and Step 5 (embody factory new tests). "Do NOT redo Phase 0,
Inc-8, or Inc-9 work" reinterpreted: don't re-implement what the
refactor migrates. New increments target `orchestrate/`
and assume the post-refactor shape.

## Lessons carried forward

These survive the architectural change and inform the new
increments:

1. **Babel iterator-spread emit is unstable** under the Docusaurus
   pipeline. `[...lenses.keys()]` may transpile to `[lenses.keys()]`
   wrapping the iterator. Use `Array.from(iterable)` for any
   iterator spread in source. Vitest in Node never reproduces;
   only the dev server does. Reference: commit `9e1ed67`.
2. **React event-handler throws don't propagate synchronously**.
   `expect(() => fireEvent.change(...)).toThrow(...)` fails because
   React routes throws via `console.error` (dev) / error-boundary
   (prod). Test the contract (handler called once with new value),
   not the throw mechanism.
3. **React 18 Strict Mode double-invokes effects on initial mount**.
   Any effect whose cleanup is destructive (dispose, clear) needs
   to handle the fake-unmount cycle. Reference: the cleanup-split
   discussion in pre-refactor `study-lenses/orchestrator/DOCS.md`
   §Why split.
4. **vi.hoisted + vi.mock pattern** for spying on a factory's
   output: `const spy = vi.hoisted(() => vi.fn());` then
   `vi.mock(path, () => ({ default: () => ({ ...real(), method: spy }) }))`.
   Reference: pre-refactor
   `study-lenses/orchestrator/tests/study-lenses.async-cancel.test.tsx`
   and `…/study-lenses.toolbar.test.tsx`.
5. **Cleanup-split rationale**: when an effect's cleanup runs on
   every re-run AND on unmount, separate "switch-cleanup" from
   "unmount-cleanup" into two effects. Even if
   `orchestrate/`'s specific effects differ, the
   discipline of "what runs on every re-render vs. only on unmount"
   applies.
6. **README/DOCS-per-directory invariant** (AGENTS.md): every
   source directory has both. Post-refactor each peer (`embody/`,
   `lenses/`, `orchestrate/`) and their sub-modules need the same.
7. **AR-1 + AR-2 on documentation commits**: pure-doc commits get
   the full AR cycle ("docs are ground truth"). New handoff
   increments that touch READMEs / DOCS run AR-1 and AR-2.
8. **The effect-topology architectural sketch pattern**: lifecycle
   phases + per-effect deps + per-effect cleanup work +
   registration order makes a reviewable contract that AR-2 can
   hold to. The new `orchestrate/` inherits this
   convention.

## Known pitfalls

| Pitfall | Still relevant post-refactor? | Notes                                                                  |
| ------- | ----------------------------- | ---------------------------------------------------------------------- |
| #1 deepClone-on-modules                                  | Yes, if any factory returns frozen records with function members. | freeze.ts is `@-utils`; pattern survives.                              |
| #2 no local `module`                                     | Yes; ESM/CJS shadow risk is language-level.                       |                                                                        |
| #3 no `.forEach` on custom methods                       | Yes; lint rule is project-wide.                                   |                                                                        |
| #4 no ES2023 array methods                               | Yes; tsconfig target unchanged.                                   |                                                                        |
| #5 `.js` extensions in imports                           | Yes.                                                              |                                                                        |
| #6 no named exports outside types.ts                     | Yes; convention survives.                                         |                                                                        |
| #7 functional/immutable-data warns approved              | Yes.                                                              |                                                                        |
| #8 `--no-verify` on every commit                         | Yes; markdownlint blocker pre-existing.                           |                                                                        |
| #9 `.tsx` test glob                                      | Yes.                                                              |                                                                        |
| #10 `Partial<LensConfig>` cast pattern                   | Lens-shape-specific. May not apply if `LensModule` reshapes.      | Flag for refactor agent.                                               |
| #11 named function expressions in multi-statement effects | Yes; lint rule is React-pattern level.                           |                                                                        |
| #12 `vi.hoisted` for variables in mock factories         | Yes; vitest behavior.                                             |                                                                        |
| #13 registry shallow-spread + freeze                     | Lens-registry-specific. May not apply.                            | Flag.                                                                  |
| #14 (NEW) Babel iterator-spread emit                     | Yes; affects the whole package.                                   | Use `Array.from`, not `[...iterable]`.                                 |
| #15 (NEW) React event-handler throws                     | Yes.                                                              | Don't assert via `.toThrow` on `fireEvent` — React swallows.           |
| #16 (NEW) Strict-mode fake-unmount                       | Yes; relevant to any effect with destructive cleanup.             | Test under `<React.StrictMode>` if your effect has dispose semantics.  |

## Your task

Increments are organized in **pyramid build-order**. Each tier is
a prerequisite for the tier above; nothing in tier N starts until
tier N-1 is complete.

### Foundation tier (must land before any quadrant)

The base of the pyramid. Without this, no quadrant has a substrate.

#### F1 — `<StudyLenses snippet>` end-to-end smoke

Wire `orchestrate/`: take a `snippet` string prop → format
pre-processing → `embody(snippet)` → frozen `Snippet` → mount
`orchestrate/editor/` as home base with the embodiment as a prop. No
recommender, no other lenses, no picker yet. Just the conceptual
chain JEJ → NM → embody → editor flowing end-to-end.

Sandbox: a fence renders the editor; embodiment observable in
React DevTools as a frozen `Snippet`.

#### F2 — Editor-vs-lens state machine

The orchestrator's UI is in exactly one of two modes at a time:

- **Editor mode**: `orchestrate/editor/` is mounted; the learner is
  editing the snippet string. **No active lens, no embodiment**
  (yet). The toolbar's lens-picker is visible; selecting a lens
  exits editor mode.
- **Lens mode**: a lens is active with a frozen embodiment + lens
  config bundle as props. **The snippet is read-only while in
  lens mode** — the learner cannot type. Switching to a different
  lens reuses the current embodiment if the snippet hasn't
  changed (which it can't); switching to the editor disposes the
  lens and drops back to editor mode.

The mode switch from editor→lens is the moment the snippet is
snapshotted. Returning editor→lens later (after edits) builds a
NEW embodiment from the new snippet. Lens-internal UI state
(parsons shuffle, blanks fills) is per-mount; never carried
across mode switches. There is no concurrent "editor + lens"
state.

Sandbox: open editor; type; switch to a lens (snippet snapshot
taken; embodiment built; lens mounts read-only); switch back to
editor (lens disposes); type more; switch to a lens again (FRESH
embodiment, fresh lens-internal state).

#### F3 — Lazy embodiment on need

The orchestrator builds a new `embodiment` only when something
downstream needs it:

- Learner exits editor mode by opening a lens (lens needs
  embodiment as a prop).
- Learner triggers an evaluation phase (run / predict / step)
  inside an already-mounted lens (the evaluation streams need the
  live embodiment; cached embodiment from mount may be reused if
  the lens hasn't requested re-embodiment).

No re-embody on every keystroke; no debounced background
re-embody; no speculative pre-build. Embodiment construction is a
known-cost operation gated by an explicit user action.

Errors surface at the trigger:

- **format / validate / parse errors** appear when the learner
  takes an action that triggers re-embodiment (typically lens-open
  from editor). They do NOT appear while typing.
- **creation / evaluation phase errors** appear only when the
  snippet is actually evaluated (run / predict button), even if
  the error could be detected statically.

This is a deliberate UX decision aligned with the lifelong-learning
autonomy principle: don't intrude on the learner's typing with
real-time syntax-error spam.

Sandbox: type a syntactically incomplete snippet; no error UI
appears in editor mode; switch to a lens; the format/parse error
surfaces at the trigger moment; the lens displays whatever it
displays for an unparseable embodiment (per its own
error-surface contract).

#### F4 — First trial lens against the new contract

Implement one lens (parsons or blanks) at `lenses/<name>/`
against the `embodiment`-prop contract: TS core + light React
wrapper. Bootstraps a non-trivial registered set so Layer-I /
Layer-II surfaces have something to enumerate / rank.
Dependency-rule audit: lens never imports from `embody/` (top)
or `orchestrate/` (top).

Coordinate with `04-lens-migration.md` so one lens is finished
end-to-end (TS core + React wrapper) before F4's sandbox
checkpoint.

Sandbox: lens mounts, displays its exercise, validates learner
input against the embodiment.

#### F5 — INTERNAL EventBus only (host-emit protocol DEFERRED)

Migrate the Inc-9 EventBus to the new `orchestrate/`
for **intra-component coordination only**. Per `DOCS.md`
§Pedagogical grounding §"What we explicitly do NOT own": *"A
data-emit protocol from `<StudyLenses>` back to the LMS.
Deferred until a concrete integration target exists; out of
scope for now."* No outbound subscribe-seam on `<StudyLenses>`,
no host-facing event contract. Internal events (e.g. a lens
dispatching `lens-switched` so the orchestrator's picker UI can
update; future increments may add others) are in scope; an
LMS-facing `subscribe` prop or `onEvent` callback is NOT.

When a concrete LMS integration target exists, a follow-up
increment adds the outbound protocol. Until then, the EventBus
is private to `<StudyLenses>`'s internal wiring.

Sandbox: a `lens-switched` dispatch fires on the internal bus
when the picker selection changes; no public callback is
invoked.

### Layer I — Q-I (Uncurated, Unguided): "Default recommendations"

The lens-picker dropdown over the full registered lens set.
Inc-9's toolbar work informs this layer directly.

#### L1 — Toolbar lens-picker

`<select data-orchestrator-lens-picker>` over the registered
lens roster. The picker is visible in BOTH editor mode and lens
mode (per F2's state machine); always-available is the Q-I
autonomy guarantee. Selecting an option dispatches `lens-switched`
on the INTERNAL EventBus (event payload reused from Inc-9 — see
types.ts) and transitions the orchestrator into lens mode for
the chosen lens. The picker's default-selected option comes
from the `lens` prop (per F1's prop contract); if `lens` is
absent, the default is the first lens in the roster (or a
orchestrate-level baseline default — to settle in L1's Phase 0).

Sandbox: dropdown shows every registered lens; selecting swaps
the mount; `lens-switched` event fires on the internal bus;
switching in editor mode transitions to lens mode.

#### L2 — Educator default via `lens` + `config` props (Q-III seam)

The per-fence info-string suffix (`js:trace`) and the
per-directory `lenses.json` cascade (plugin's
`resolve-cascade.ts`) populate the `lens` and `config` props on
`<StudyLenses>`. The orchestrator treats these as the
**default-selected lens + its initial config** when the picker
first opens. Learner can still freely pick any other lens via
the dropdown — the educator's hint shifts the default, never
the available set. **This is the bridge between Q-I and Q-III**:
same picker surface, educator-supplied default.

Sandbox: a fence with `js:parsons` opens with parsons in lens
mode when the learner first triggers the picker; learner can
switch to any other registered lens; `lenses.json` at a parent
directory applies the same default to every fence inside it
(most-specific wins under the existing cascade rules).

### Layer II — Q-II (Uncurated, Guided): "Generated study paths"

The recommender. Per Explorotron Figure 3:
**Code → Applicability Filter → Ranking Engine → Recommended grid**.

> **WS2 owns the engine.** The Applicability Filter and Ranking
> Engine themselves (`orchestrate/lib/recommender/`) are planned in
> [`02-analysis-and-recommender.md`](./02-analysis-and-recommender.md)
> — that handoff specifies the analysis types, recommendation
> shapes, ranking signals, and grid dimensions. WS3 (this
> handoff) only covers the orchestrator's *consumption* of the
> recommender's output. Cross-handoff dependency: Layer II in
> this handoff blocks until WS2 ships a working
> `orchestrate/lib/recommender/` public surface.

#### L5 — Recommendations panel UI

Render the filtered + ranked grid the WS2 recommender produces,
as a panel that opens via toolbar button. The panel layout (3D
Block Model: level × scope × NM-components) and the per-cell
affordances follow the WS2 plan; the orchestrator's job here is
the UI shell + click-handler that mounts the chosen lens via
L1's machinery.

Sandbox: panel opens; cells populate per the rankings WS2
produces; clicking a cell transitions from editor mode to lens
mode for the chosen lens.

#### L6 — "Open in Suggested Lens" shortcut

Toolbar button or keyboard shortcut that bypasses the panel and
mounts the highest-ranked recommendation directly. Q-II's
"guided" behaviour: the system makes the choice for the learner.

Sandbox: shortcut mounts the highest-ranked lens for the current
snippet.

### Layer III — Q-III (Curated, Unguided): "Manual recommendations"

Educator overrides the recommender's ranking without removing
freedom of choice. Most of this layer is plugin work + thin
orchestrator wiring.

> Most of Layer III is already absorbed by L2 above (the
> picker's default-selected option comes from the `lens` +
> `config` props, sourced from per-fence info-string and
> per-directory cascade). What's listed here is the additional
> Q-III-specific seams that reorder the Q-II recommendations
> panel rather than just shifting the picker default.

#### L7 — Per-fence ranking override directive

New optional attribute on the `@study-lens` directive (parser
at `parse-study-lens-directive.ts`) that adjusts the recommender
panel's ranking for THIS fence — boost lens X to top, demote
lens Y below threshold. Plugin parses and emits a config field
that the orchestrator forwards to the WS2 recommender as a
per-snippet ranking-override input.

Sandbox: a fence whose directive boosts `parsons` produces a
panel with parsons ranked first regardless of the recommender's
natural score. The dropdown is unaffected (Q-I autonomy
preserved).

#### L8 — Per-directory ranking cascade

Confirm the existing `lenses.json` cascade (`resolve-cascade.ts`)
carries the same ranking-override field at directory scope, with
most-specific-wins precedence. Most of the cascade plumbing
already exists for `lens` and `config`; extension is just the
optional ranking-override field.

Sandbox: a directory's `lenses.json` shifts panel rankings for
every fence inside that directory unless a per-fence directive
contradicts.

### Layer IV — Q-IV (Curated, Guided): "Manual study paths"

**DEFERRED at snippet scope** (user decision). Per-snippet
educator-defined lens tours (Explorotron paper §2.2's
Flowcharts → Trace → … on one snippet) are NOT in scope for
this orchestrator handoff. Two reasons:

- **Auto-recommended tours (Q-II) are sufficient.** Layer II's
  recommendations panel + "Open in Suggested Lens" already give
  the learner a guided path through applicable lenses, ranked
  by snippet-fit. Custom hand-crafted tours don't add enough
  learner value to justify the schema + parsing + sequential UI
  cost.
- **Curricular-scope sequencing covers most of the use case.**
  The Explorotron tour example reproduces in Q-IV at curricular
  scope — the LMS author renders five sibling `<StudyLenses>`
  fences in markdown, each with its own `lens` prop. No
  per-snippet sequence primitive is needed inside our component.

Re-introducing per-snippet sequences later (if a future
curriculum need surfaces) is a contained change. The future
shape is intentionally undecided — plausible options are a 5th
prop (`sequence={[…]}`), a reserved meta-key inside `configs`,
or a `lenses.json` directory-level setting. The plugin's
`parse-lens-config.ts` would extend to recognize whichever
shape lands; a sequential-walk-through React component lives
inside `orchestrate/`. **Treat L9-L11 as deferred follow-up
tickets, not out-of-the-question.**

### Top — Monitored learning (out of scope)

Grade reports / LMS integration / cheating detection. Not
started until L1-L8 are stable AND a concrete LMS integration
target exists. Until then, per `DOCS.md` §"What we explicitly
do NOT own", the data-emit protocol is deferred — F5's
EventBus stays INTERNAL. Adding the outbound subscribe-seam is
a follow-up increment when the host integration target appears.
Per paper §3 the ethical tensions here are real — defer until
pedagogical priorities clarify.

### Cross-tier increments (orthogonal, can land at any tier boundary)

- **Plugin alignment** (per Cross-handoff impact above): drop
  `transforms`, drop `lang`, rename `code` → `snippet`,
  simplify fence syntax. Lands AFTER F1's prop contract
  stabilizes; gates L7 / L8 which extend the plugin further.
- **Dependency-rule CI lint** (per REFACTOR-HANDOFF Step 16):
  catch violations going forward. Lands any time after F4.
- **`study-lenses/` → `lenses/` rename audit**
  (REFACTOR-HANDOFF Step 11): the plugin keeps its directory
  name `src/plugins/study-lenses/` because "study-lenses" is
  the public user-facing concept. Audit needed at the
  boundary to confirm.

### First step: detailed Phase 0 for Foundation tier (F1)

The post-refactor `orchestrate/` is a fresh module.
Every Phase 0 question from the OLD handoff (where the toolbar
sits, how to enumerate lens names, how to wrap state
transitions, etc.) is moot — those concerns are at Layer I
(L1), not Foundation. New Phase 0 questions for F1 (the
smoke-test of the JEJ → NM → embody → editor chain):

- The `<StudyLenses snippet lens? config? configs?>` prop
  contract: what's the TypeScript shape? `Readonly<{ snippet:
  string; lens?: string; config?: LensConfig; configs?:
  Record<string, LensConfig>; }>` is the obvious starting point
  but `embody/types.ts` may want the snippet pre-typed (a
  branded type? a `Source` opaque?). `configs` may carry a
  reserved `default` key for the cascade-declared default lens
  (the resolution order is `lens` prop → `configs.default` →
  none).
- Pre-processing pipeline: format ONLY (per locked decision)
  or format + a passthrough hook for downstream pipelines?
  Where does the formatter live? `embody/lib/formatting/`
  (per Step 3) or `orchestrate/lib/`?
- Effect topology: with React handling component reconciliation
  (lenses are React components, not framework-agnostic mounts),
  is the wrapper effectively a single `useEffect` running
  embody on prop / edit change? Or are multiple effects needed
  (one for embody-on-trigger, one for picker-mode-switch, one
  for event dispatch)?
- Error / status surfacing: `Snippet.status.{tokenized, parsed,
  created}` per `embody/types.ts` gate field availability. Does
  the orchestrator surface a status banner for partial-
  embodiment cases, or do lenses each handle their own gating?
- State shape: editor-as-only-writer means snippet text is in
  the orchestrator's state; embodiment is derived. Lazy
  embodiment per F3 says we build it on need rather than on
  edit; how is the cached-embodiment-since-last-edit stored?
  Memo? Ref? Discrete state field?
- Test environment: vitest + jsdom for `orchestrate/`
  tests; `embody()` integration tests likely need real
  evaluation engines (Worker + SharedArrayBuffer) which jsdom
  doesn't support — those go in `.browser.test.ts` files under
  playwright-chromium per AGENTS.md "environment boundary"
  exception.
- **Selection-surface unification** (specific to L1 + L5
  arriving): picker and recommender both feed the same
  lens-mount machinery. What is the unified internal contract?
  Likely both produce `(lensName: string, config?: LensConfig)`
  tuples that feed a single `mountLens()` path. Confirm before
  either surface is built.
- **Educator override layering**: the per-fence `lens`
  attribute, the per-directory `lenses.json` cascade, and the
  per-snippet `@study-lens` directive all need a precedence
  order (most-specific wins is the obvious default). Confirm
  before the picker default ordering and the recommender
  ranking are wired.
- **Locked four-prop API**: `<StudyLenses snippet: string lens?:
  string config?: LensConfig configs?: Record<string,
  LensConfig>>`. The README and DOCS were updated in Round-2 to
  match (replacing earlier sketches of `recommendedLens` /
  `lensSequence`). F1's Phase 0 confirms no stale references
  survive in `README.md` / `DOCS.md` and types the contract in
  `orchestrate/types.ts`.
- **Q-IV per-snippet sequences are deferred entirely** (user
  decision; see Layer IV above). F1's Phase 0 doesn't need to
  resolve sequence routing — auto-recommended Q-II tours cover
  the use case.
- **Recommender contract is snippet-fit only** (per `DOCS.md`
  §Pedagogical grounding §Recommender). The *engine itself* is
  owned by `02-analysis-and-recommender.md`; this handoff only
  consumes its output. Confirm during L5/L6 that no
  learner-state input sneaks in via the consumption path.

### Substrate hooks already wired (post-refactor)

After REFACTOR-HANDOFF executes, the orchestrator has access to:

- `embody(code) → Snippet` from `embody/index.ts` — the factory.
- `embody/types.ts` — `Snippet`, `Status`, `Streams`, etc. types
  (canonical contract).
- `orchestrate/lib/recommender/` — analysis of an embodiment to
  lens recommendations (WS2 deliverable).
- `orchestrate/lib/socratizing/`, `completing/`, `editing/`,
  `error-interpreting/`, `jej-documentation/` — analysis libs
  taking `embodiment`.
- `orchestrate/editor/` — the editor home-base component.
- `lenses/<name>/` — each lens self-contained: TS core + React
  wrapper, takes `embodiment` via props.

### Conventions to enforce

Carry-forward (still apply):

- `export default` named-first function declaration.
- `.js` extensions in imports.
- `freezeInPlace` for fresh objects.
- No mutable closures over `let`; no classes; no `this`.
- Multi-statement `useEffect` callbacks → named function
  expressions (Pitfall #11).
- ZOMBIES test order with AR-3 before, AR-4 after each TDD
  increment.
- AR-1 + AR-2 on documentation commits (docs are ground truth).
- Sandbox checkpoint required for each user-observable
  increment.
- Atomic commit per increment with `--no-verify`.

New, specific to the post-refactor layout:

- **Lens purity**: lens plugins receive `embodiment` via props.
  They do NOT import from `embody/` (top) or `orchestrate/` (top).
  May import from `orchestrate/lib/*` and `@-utils`.
- **Lens shape**: TS core + React wrapper. NOT a single React
  component; NOT a framework-agnostic LensMount.
- **Single-writer**: only `orchestrate/editor/` mutates snippet
  source. Lenses are read-only views.
- **`embodiment` parameter name** wherever a function takes a
  Snippet instance.
- **Dependency rules** per `DOCS.md` § Dependency rules; CI lint
  check recommended (REFACTOR-HANDOFF Step 16).

## After this increment list

Forward-looking, beyond F1-F5 + L1-L8:

- Trial lens migration (highlight, parsons, blanks, trace-table,
  variables, ask, etc.) — each lens is its own session, planned
  in `04-lens-migration.md`.
- Sandbox.html smoke-test harness (REFACTOR-HANDOFF Step 15 —
  flagged as separate ticket).
- Per-snippet study-tour reactivation (Q-IV Layer IV) if a
  future curriculum need surfaces.
- Outbound LMS event protocol when a concrete integration
  target exists.
- Cross-cutting: a CI dependency-rule check (per REFACTOR-HANDOFF
  Step 16) catches violations going forward.

## What this handoff does NOT cover

- Executing REFACTOR-HANDOFF.md Steps 1-16 (separate effort).
- Any source code under `study-lenses/` (pre-refactor); the
  11 Inc-9 commits stay as shipped.
- Updates to `00-master-plan.md`, `01-NM-components.md`,
  `02-analysis-and-recommender.md`, `04-lens-migration.md`, or
  `development-guide.md` — flagged for separate sessions.
- F1's contract design in detail. That's a Phase 0 done in the
  session that picks up this handoff post-refactor.
- Speculation about lens shapes that the refactor will
  determine (parsons / blanks contracts, etc.).
