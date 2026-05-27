# WS3: orchestrate/orchestrator — post-refactor increment plan

> **Status (2026-05-11)**: **F1 COMPLETE + B CLOSED**. F1 shipped 2026-05-06..07
> (commits `bd98648`–`abe70bb`); B (Docusaurus plugin alignment) shipped
> 2026-05-07..11 across **12 commits** (`8cec361`–`838ba35`), comprising Phase 0
> contract-lock, 8 atomic behavior commits, AR-5 followups, the mid-flight
> 3-prop reshape `df6a0e7`, and the opacity correction `838ba35`. Editor home
> base mounts; embody chain wires; debug-props lens dispatches from `lens=`
> prop; sandbox at `/sandbox/b-prop-shape/` verifies the end-to-end public API
> live.
>
> **Key API revision during B (overturn of locked four-prop API):** The locked
> four-prop API (`snippet, lens?, config?, configs?`) was reshaped mid-flight to
> a **three-prop API** (`snippet, lens?, configs?`); the per-fence/sibling
> override is deep-merged INTO `configs.lenses[lens]` at plugin emission time.
> Resolution chain collapsed from 3 tiers to 2:
> `module.config() ⊕ configs.lenses?.[lens]`. The F1 mount-time guard
> (`config supplied without lens → throw`) dissolved with the absorbed prop. See
> commit `df6a0e7` for the overturn (AR-1 D4/D5/D6 overturned; D1/D2/D3/D7
> retained). The orchestrate-side `configs?` is typed **maximally opaque**
> (`Readonly<Record<string, unknown>>`) per commit `838ba35`. The body's "Locked
> architectural decisions" block below describes the original four-prop intent —
> read it for planning history, but trust the current contract in
> `orchestrate/{README,DOCS,types.ts}` as ground truth.
>
> **Next**: F2 (editor-vs-lens 2-mode state machine) — natural next stone now
> that F1 + B are closed. The `./B-plugin-alignment.md` handoff is now archived;
> see its preamble for the work-stream summary. F3-F5 + L1-L8 follow per the
> pyramid build-order below.
>
> **F2 COMPLETE (2026-05-13) — F3 also satisfied by F2 implementation.**
> (The F3 section below notes this explicitly.)
>
> **Embody Phase B shipped (2026-05-21):** Commits `434ce9c`–`943c666`.
> `Snippet.parse`, `Snippet.static`, and `Snippet.streams` **no longer exist**.
> New shape: `source · raw · status · errors · realm/tokenize/parseAST/creation/
> evaluation (phase axis) · events.* (layer-first)`. Evaluation surface moved to
> `snippet.evaluation.events.*` (`trace.variables` added). Three orchestrator-lib
> files have stale `.parse.ast` references (TypeScript errors); see
> § Embody Phase B impact before starting any new work.
>
> This handoff was rewritten end-to-end after the package's top-level docs
> (`README.md`, `DOCS.md`) locked in the **embody / lenses / orchestrate
> three-peer architecture** and integrated the **Explorotron quadrant +
> pyramid** framework. The previous version targeted
> `<StudyLenses code lens lang transforms>` with a transforms-tier pipeline;
> that whole framing is superseded.
>
> **Operational instructions (prompt template, pre-session checks, red flags,
> coordination points)** live in the sibling file
> [`03-orchestrator-and-contracts-kickoff.md`](./03-orchestrator-and-contracts-kickoff.md).
> Read that BEFORE opening a session for any increment in this handoff.

## Locked architectural decisions you must honor

Per `javascript/README.md` § Pedagogical first principles and
`javascript/DOCS.md` § Locked decisions:

> ⚠ **OVERTURN-NOTE (2026-05-11):** **Only the four-prop public API bullet
> immediately below** was revised mid-flight to a **three-prop API**
> (`snippet, lens?, configs?`). All other locked decisions in this section —
> single-writer state model, Explorotron quadrant + pyramid, scope boundary,
> disposable practice, no transforms peer, lens shape, embodiment naming,
> pre-processing-is-formatting-only — **remain in force**.
>
> The per-fence override has been absorbed into `configs.lenses[lens]` at plugin
> emission time. The mount-time guard dissolved with the absorbed prop.
> Resolution chain is now two tiers: `module.config() ⊕ configs.lenses?.[lens]`.
> The `configs?` type on the orchestrate side is maximally opaque
> (`Readonly<Record<string, unknown>>`). See commits `df6a0e7` (reshape) +
> `838ba35` (opacity correction) for the full overturn rationale and AR cycle
> outcomes. The four-prop bullet below is preserved as planning-history context
> — it documents what was LOCKED at planning time + why; the overturn documents
> that the lock was revised. **For the current contract, trust the code-side
> ground truth**:
> `src/lib/just-enough/javascript/orchestrate/{README,DOCS,types.ts}`
> and `src/plugins/study-lenses/{README,DOCS,types.ts}`.

- **Four-prop public API**:
  `<StudyLenses snippet={…} lens={…}? config={…}? configs={…}? />`. `snippet` is
  a string of code (the orchestrator builds the embodiment internally — caller
  does NOT pre-build it). `lens` is an optional default-mounted lens name (Q-III
  seam). `config` is an optional override for the resolved-default lens.
  `configs` is the optional cascade bundle keyed by lens name — the picker reads
  `configs[lensName]` when opening any lens. Dropped from the old API: `code` →
  renamed to `snippet`; `lang` → no longer needed (embody auto-detects);
  `transforms` → no transforms tier.

  **Resolved-default-lens resolution order**: `lens` prop → cascade default
  declaration in `configs` → none.

  **Resolution chain for any lens-name**:

  ```text
  resolved(lensName) = module.config()                          // tier 0
                     ⊕ configs?.[lensName]                      // tier 1
                     ⊕ (lensName === resolvedDefault ? config : {})  // tier 2
  ```

  (`⊕` = deep-merge-right-wins.)

  **`config=` without `lens=` prop**: applies to the resolved-default lens
  (which may come from the cascade rather than the prop). Use case: cascade
  declares the default; per-fence supplies a fence-level config for that
  default. If NO default resolves, the orchestrator throws at mount with a clear
  message — F1 implements.

  **Per-fence info-string syntax (URL-style)**:

  ```text
  js:trace                   → lens="trace"
  js:trace?stepDelay=500     → lens="trace", config={ stepDelay: 500 }
  js:trace?cols=value,steps  → lens="trace", config={ cols: ["value","steps"] }
  ```

  The plugin parses fence args and emits `lens` + `config` on `<StudyLenses>`.
  The directory-wide `lenses.json` cascade emits `configs`.

  **API revision note**: the original three-prop API conflated two signals into
  a single `config` bundle (the cascade's per-lens bundle, and the per-fence
  override for the default-mount lens). The four-prop split surfaces what was
  already in the cascade pipeline; the names just got assigned. This amendment
  was made during the Round-2 AR realignment that surfaced canon/handoff drift
  between `lenses/types.ts` and the handoffs.

- **Single-writer state model**: only `orchestrate/editor/` mutates snippet
  source. Lenses are read-only views consuming `embodiment` via props.

- **Bedrock orienting principle: Explorotron's quadrant + pyramid model**
  (Malaise & Signer, Koli Calling 2023, Figure 2). The orchestrator must serve
  **all four quadrants** without privileging one stakeholder; the pyramid's
  vertical structure dictates the build-order dependency chain for every
  increment that follows.

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
  1. **All four quadrants stay live.** The picker (Q-I/Q-III) and the
     recommender panel (Q-II/Q-IV) are complementary surfaces feeding the same
     mounting machinery; one never replaces the other.
  2. **Each pyramid layer is a prerequisite for the layer above.** Layer II
     (path generation / recommender) cannot exist without Layer I (lenses &
     defaults). Layer IV cannot exist without I + II + III. Increments must
     respect this dependency chain.
  3. **The fractal claim** (per `DOCS.md` §Pedagogical grounding §Pyramid
     layers): the framework's pyramid applies at **two scopes** — _snippet_ (one
     `<StudyLenses>` instance) and _curricular_ (the embedding LMS arranging
     instances). We own the snippet scope; the LMS owns the curricular scope.
  4. **Scope boundary** (per `DOCS.md` §"What we explicitly do NOT own"):
     - System-wide learner state, knowledge graph, ZPD positioning — LMS.
     - Multi-snippet path arrangement — LMS.
     - Grade reports / LMS integration / cheating detection — LMS.
     - **A data-emit protocol from `<StudyLenses>` back to the LMS — DEFERRED
       until a concrete integration target exists.**

     The orchestrator's EventBus is therefore INTERNAL only: intra-component
     coordination (lens-to-orchestrator events such as `exercise-completed`
     consumed by future increments), not outbound telemetry. Per-snippet manual
     study tours (Q-IV) are deferred entirely (auto-recommended Q-II tours
     suffice). The future shape (5th prop / meta-key in `configs` /
     `lenses.json` directory-level) is intentionally undecided until Q-IV
     un-defers.

  5. **Disposable practice, not persisted progress.** Lens state is _per-mount
     only_. When the snippet changes (re-embody), all active lenses are disposed
     and remounted fresh against the new embodiment. There is no "stale-state
     affordance", no `onSnippetChanged` IoC hook, no preservation of parsons
     shuffle order or blanks-in-progress across an edit. This is a deliberate
     simplification: lenses are practice surfaces, not learner-state stores.
  6. **Stakeholder tension is structural, not a bug** (per paper §3.1, §3.2).
     Students want autonomy; teachers want LMS data; researchers want telemetry.
     The pyramid's vertical axis IS this tension — moving up the pyramid trades
     autonomy for support. Architectural decisions never collapse this axis. The
     **lifelong-learning autonomy** principle (per `README.md` §Why this
     architecture) is the answer: Q-I is not a fallback, it's the central
     pedagogical bet — the dropdown is ALWAYS available so learners take their
     lens kit with them post-graduation.

- **No `transforms/` peer**: transforms-as-lens-internal-concern. Parsons /
  blanks / bug-injection live inside the relevant lens.

- **Editor is not a lens**: it is the always-present home base at
  `orchestrate/editor/`, the orchestrator's snippet writer.

- **Lens shape**: each lens is a **two-layer module** — a pure-TS core (display
  derivation, validation, scoring — testable in vitest without `jsdom`) plus a
  light React wrapper that takes `embodiment` as a prop, mounts the core, and
  renders UI (needs `jsdom` for tests). NOT a single-file React component; NOT a
  framework-agnostic LensMount.

- **`embodiment` is the canonical parameter name** wherever a function takes a
  Snippet instance.

- **Pre-processing is formatting only**, not validation gating. Educators may
  intentionally include non-JEJ examples; embody computes
  `validation.violations` as metadata; lenses choose whether to surface them.

## Cross-handoff impact

This handoff does NOT touch the following, but flags them as needing realignment
in separate sessions:

- **`01-NM-components.md`, `02-analysis-and-recommender.md`,
  `04-lens-migration.md`** — affected by the new architecture. Analysis modules
  now consume `embodiment`; lens migration targets the TS-core + React-wrapper
  contract; recommender consumes `embodiment` and is the authoritative Layer-II
  engine.
- **Docusaurus plugin alignment (B) — CLOSED.** Shipped 2026-05-07..11 (commits
  `8cec361`–`838ba35`). Final emission shape: three-prop API
  (`snippet, lens?, configs?`) per the mid-flight reshape `df6a0e7`; per-fence
  override is deep-merged INTO `configs.lenses[lens]` at plugin time. Lens-side
  `LensProps` was NOT touched; the plugin keeps its `src/plugins/study-lenses/`
  directory name. L7/L8 (per-fence/per-directory ranking-override directives)
  now unblocked and can proceed against the stable contract. See archived
  `./B-plugin-alignment.md` for the work-stream summary.

## Historical: pre-refactor substrate (superseded)

The Phase A migration (commits `9f1db34`–`5d6fc54`, 2026-05-04..05) relocated
the pre-refactor `study-lenses/` source tree into the three-peer layout
(`embody/`, `lenses/`, `orchestrate/`); F1.A then deleted the relocated-but-
stale `orchestrate/orchestrator/` archival when the new `<StudyLenses>` came
online. Durable patterns that survived into the current architecture: name-
enumeration (lands in F4), EventBus (F5, internal-only), freeze discipline
(`@-utils/freeze.ts`), cleanup-split (`orchestrate/DOCS.md` § Effect topology).

Pre-existing red areas out of WS3 scope: `embody/lib/evaluating/`,
`lenses/highlight/` (deleted), `snippetry/debug/`.

## Lessons carried forward

These survive the architectural change and inform the new increments:

1. **Babel iterator-spread emit is unstable** under the Docusaurus pipeline.
   `[...lenses.keys()]` may transpile to `[lenses.keys()]` wrapping the
   iterator. Use `Array.from(iterable)` for any iterator spread in source.
   Vitest in Node never reproduces; only the dev server does. Reference: commit
   `9e1ed67`.
2. **React event-handler throws don't propagate synchronously**.
   `expect(() => fireEvent.change(...)).toThrow(...)` fails because React routes
   throws via `console.error` (dev) / error-boundary (prod). Test the contract
   (handler called once with new value), not the throw mechanism.
3. **React 18 Strict Mode double-invokes effects on initial mount**. Any effect
   whose cleanup is destructive (dispose, clear) needs to handle the
   fake-unmount cycle. The pre-refactor cleanup-split rationale lives in git
   history at commits prior to F1.A (`325c31e`); the discipline is captured in
   `orchestrate/DOCS.md` § Effect topology.
4. **vi.hoisted + vi.mock pattern** for spying on a factory's output:
   `const spy = vi.hoisted(() => vi.fn());` then
   `vi.mock(path, () => ({ default: () => ({ ...real(), method: spy }) }))`. The
   F1 spy pattern at `orchestrate/tests/study-lenses.test.tsx` § One uses
   `vi.spyOn` on the embody namespace import for a similar effect. The
   pre-refactor `vi.hoisted` example lives in git history at commits prior to
   F1.A.
5. **Cleanup-split rationale**: when an effect's cleanup runs on every re-run
   AND on unmount, separate "switch-cleanup" from "unmount-cleanup" into two
   effects. Even if `orchestrate/`'s specific effects differ, the discipline of
   "what runs on every re-render vs. only on unmount" applies.
6. **README/DOCS-per-directory invariant** (AGENTS.md): every source directory
   has both. Post-refactor each peer (`embody/`, `lenses/`, `orchestrate/`) and
   their sub-modules need the same.
7. **AR-1 + AR-2 on documentation commits**: pure-doc commits get the full AR
   cycle ("docs are ground truth"). New handoff increments that touch READMEs /
   DOCS run AR-1 and AR-2.
8. **The effect-topology architectural sketch pattern**: lifecycle phases +
   per-effect deps + per-effect cleanup work + registration order makes a
   reviewable contract that AR-2 can hold to. The new `orchestrate/` inherits
   this convention.

## Known pitfalls

| Pitfall                                                   | Still relevant post-refactor?                                     | Notes                                                                 |
| --------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| #1 deepClone-on-modules                                   | Yes, if any factory returns frozen records with function members. | freeze.ts is `@-utils`; pattern survives.                             |
| #2 no local `module`                                      | Yes; ESM/CJS shadow risk is language-level.                       |                                                                       |
| #3 no `.forEach` on custom methods                        | Yes; lint rule is project-wide.                                   |                                                                       |
| #4 no ES2023 array methods                                | Yes; tsconfig target unchanged.                                   |                                                                       |
| #5 `.js` extensions in imports                            | Yes.                                                              |                                                                       |
| #6 no named exports outside types.ts                      | Yes; convention survives.                                         |                                                                       |
| #7 functional/immutable-data warns approved               | Yes.                                                              |                                                                       |
| #8 `--no-verify` on every commit                          | Yes; markdownlint blocker pre-existing.                           |                                                                       |
| #9 `.tsx` test glob                                       | Yes.                                                              |                                                                       |
| #10 `Partial<LensConfig>` cast pattern                    | Lens-shape-specific. May not apply if `LensModule` reshapes.      | Flag for refactor agent.                                              |
| #11 named function expressions in multi-statement effects | Yes; lint rule is React-pattern level.                            |                                                                       |
| #12 `vi.hoisted` for variables in mock factories          | Yes; vitest behavior.                                             |                                                                       |
| #13 registry shallow-spread + freeze                      | Lens-registry-specific. May not apply.                            | Flag.                                                                 |
| #14 (NEW) Babel iterator-spread emit                      | Yes; affects the whole package.                                   | Use `Array.from`, not `[...iterable]`.                                |
| #15 (NEW) React event-handler throws                      | Yes.                                                              | Don't assert via `.toThrow` on `fireEvent` — React swallows.          |
| #16 (NEW) Strict-mode fake-unmount                        | Yes; relevant to any effect with destructive cleanup.             | Test under `<React.StrictMode>` if your effect has dispose semantics. |
| #17 (NEW) Stale `snippet.parse.ast` references            | Yes; 3 orchestrator-lib files have TypeScript errors.             | Use `embodiment.raw.ast` (interim). Fix in rename commit before F4.   |

## Your task

Increments are organized in **pyramid build-order**. Each tier is a prerequisite
for the tier above; nothing in tier N starts until tier N-1 is complete.

### Foundation tier (must land before any quadrant)

The base of the pyramid. Without this, no quadrant has a substrate.

#### F1 — `<StudyLenses snippet>` end-to-end smoke ✅ DONE

Shipped 2026-05-06..07 (`bd98648`–`abe70bb`); see status banner + the
overturn-note at the top of this handoff for the current contract. Two AR-1
deviations from the original spec are intentional and load-bearing for F2+: no
format pre-processing (the learner formats their own code; `embody` checks
`Snippet.validation.formatted` internally); no `embodiment` prop on the editor
(AR-1 CP-1 — embodiment is a lens-mode concept). The F1 mount-time guard
dissolved during B's 3-prop reshape (`df6a0e7`); plugin-fence rendering shipped
with B (sandbox at `spiralearn/sandbox/b-prop-shape/`).

#### F2 — Editor-vs-lens 2-mode state machine ✅ DONE (2026-05-13)

The orchestrator's UI is in exactly one of two modes at a time:

- **Editor mode**: `orchestrate/editor/` is mounted; the learner is editing the
  snippet string. **No active lens, no embodiment** (yet). The picker is
  visible; selecting a lens exits editor mode.
- **Lens mode**: a lens is active with a frozen embodiment + lens config bundle
  as props. **The snippet is read-only while in lens mode**. Switching lenses
  reuses the current embodiment; switching back to the editor disposes the lens.

The mode switch from editor → lens is the moment the snippet is snapshotted.
Returning editor → lens later (after edits) builds a NEW embodiment. Lens-
internal UI state (parsons shuffle, blanks fills) is per-mount; never carried
across mode switches. There is no concurrent "editor + lens" state.

##### F2 prerequisite state (on `main`)

- F1 + B both shipped (see status banner). Lens-side `LensProps` is stable;
  plugin emission is the three-prop API.
- Editor today: 35-line single React component at `orchestrate/editor/index.tsx`
  rendering `<textarea readOnly value={snippet}>`. The file's JSDoc already
  declares "F2 adds the optional `onSnippetChange?(next: string)`" — F2's job is
  to wire it.
- Orchestrator's current dispatch (`orchestrate/index.tsx`) is registry-
  membership-based: if `lens` matches a `LENS_REGISTRY` key, mount the lens;
  otherwise mount the editor. No mode discriminator at runtime.
- `OrchestratorState` discriminated union (`EditorModeState | LensModeState`) is
  already typed in `orchestrate/types.ts` § Internal mode state (lines 141-173)
  but is not consumed by the runtime. F2 wires it in.
  `LensModeState.embodiment: Snippet` is the embodiment cache slot F2.4/F2.5
  wire — already declared, just unused today.

##### F2 deliverables (concrete contract changes)

- Lift `readOnly` from the editor's textarea. The editor becomes writable in
  editor mode.
- Add `onSnippetChange?(next: string)` prop to `EditorComponent`. Snippet state
  lives in `<StudyLenses>` (controlled component pattern).
- Wire `mode: 'editor' | 'lens'` runtime state in `<StudyLenses>` consuming the
  existing `OrchestratorState` discriminated union. The lens-prop remains the
  transition trigger (a learner-clicks-picker trigger lands in F5+L1), but
  dispatch flows through `setState({ mode, activeLens })` rather than a direct
  registry lookup in the render path. The current registry-membership branch in
  `orchestrate/index.tsx:118-128` is refactored, not removed.
- Mode-routing: editor mode mounts `<EditorComponent>`; lens mode mounts the
  registered lens module.
- **Bidirectional transitions**: editor → lens (lens-prop becomes a registered
  key) AND lens → editor (lens-prop unset or unregistered key) both update the
  mode discriminator. The lens → editor transition disposes lens-internal UI
  state per the disposability principle.
- **Mode-transition embody trigger**: build `embodiment` only on editor → lens
  transition (per F3's lazy embodiment principle — F2 implements the trigger
  seam; F3 narrows it further). The existing snippet-change `useEmbodiment`
  effect in `<StudyLenses>` (F1's unconditional embody) is REMOVED in F2.4 and
  replaced with the transition-trigger version.
- Snippet-edit invalidation: editing in editor mode invalidates any cached
  embodiment; the next editor → lens transition rebuilds.
- `ModeChangedPayload` type declaration in `types.ts` (the bus dispatch itself
  lands in F5; F2's Phase 0 just locks the payload shape).

##### F2 Phase 0 (DDD)

1. **Glossary**: define "editor mode", "lens mode", "mode discriminator", "mode
   transition" as ubiquitous terms in `orchestrate/README.md` glossary.
2. **README spec**: rewrite `orchestrate/README.md` § Editor-vs-lens state
   machine + `orchestrate/editor/README.md` to describe the new contract.
3. **AR-1 (Opus, Design Challenge)**.
4. **Types lock**: verify `OrchestratorState` reflects F2 requirements; may need
   `EditorModeState` to carry the edit-callback wiring. Also lock the
   `ModeChangedPayload` shape here (F5 will dispatch it; F2 declares it).
5. **DOCS sketch**: update `orchestrate/DOCS.md` § Mode-gated state machine
   (mermaid + prose) — remove the "F2+ end-state" hedge since F2 IS implementing
   it.
6. **AR-2 (Opus, Architectural Sketch Challenge)**.

##### F2 Phase 1 (atomic TDD increments, in dependency order)

1. **F2.1 — Lift readOnly + add onSnippetChange.** Editor accepts edits; emits
   `onSnippetChange(value)` callback. Snippet state hoisted to `<StudyLenses>`;
   editor is controlled.
2. **F2.2 — Mode-discriminator state + editor → lens transition + payload
   type.** Replace direct registry-dispatch with `mode` state; default
   `'editor'`; transition to `'lens'` when `lens` prop matches a registered key.
   The lens-prop is still the transition trigger; dispatch flows through
   `setState({ mode: 'lens', activeLens: lens })`. Lock the `ModeChangedPayload`
   type in `types.ts`.

   **In-mode lens-switch deferred to F4** (the registry has one lens today —
   `debug-props`; lens-mode → lens-mode switching cannot be exercised until F4
   grows the registry. F2.2 keeps `activeLens` as a separate field on
   `LensModeState` so the F4 extension is one-line).

3. **F2.3 — Lens → editor return transition + lens-state disposal.** When `lens`
   prop becomes unset or matches no registered key, transition to `'editor'`
   mode and dispose lens-internal UI state per the disposability principle. Pair
   with F2.2 to give the round-trip a complete TDD chain.
4. **F2.4 — Mode-transition embody trigger.** Build embodiment on editor → lens
   transition only. **Removes the existing snippet-change `useEmbodiment`
   effect** in `<StudyLenses>` (F1's unconditional embody that runs on every
   snippet change). Cache result in `LensModeState.embodiment`.
5. **F2.5 — Snippet-edit invalidation.** Snippet change in editor mode
   invalidates the cached `LensModeState.embodiment` slot; the next editor →
   lens transition rebuilds.

Each increment: RED → AR-3 → GREEN → AR-4 → atomic commit per locked decision
D7.

##### F2 sandbox checkpoint

The picker UI lands in L1; until then, F2's sandbox uses **prop-driven
toggling** — either extend `b-prop-shape/index.md` with multiple fences
exercising different `lens=` prop values, or build a small dedicated toggle page
that flips the `lens` prop between unset and `'debug-props'` on a button click.

Verifier flow: open the sandbox; type into the editor (observe write enabled —
F2.1); toggle to `lens="debug-props"` (mode switches to lens; embodiment built
once — F2.2, F2.4); toggle back to unset (mode reverts; lens-internal UI state
disposed — F2.3); type more (cache invalidated — F2.5); toggle to lens again
(FRESH embodiment, fresh lens-internal state).

##### F2 cross-handoff impact

- Lens-side `LensProps` unchanged (`{ embodiment, config? }`).
- Plugin emission unchanged (three-prop API stable).
- Files touched:
  - Code: `orchestrate/index.tsx`, `orchestrate/types.ts`,
    `orchestrate/editor/index.tsx`.
  - Docs: `orchestrate/README.md`, `orchestrate/DOCS.md`,
    `orchestrate/editor/README.md`, `orchestrate/editor/DOCS.md`.
  - Tests: editor-internal behavior tests in a NEW
    `orchestrate/editor/tests/index.test.tsx` (the editor doesn't have a
    `tests/` dir yet — F2 establishes it per the README/DOCS- per-directory
    invariant). Orchestrator-level mode-transition tests extend the existing
    `orchestrate/tests/study-lenses.test.tsx`.

#### F3 — Lazy embodiment on need

The orchestrator builds a new `embodiment` only when something downstream needs
it:

- Learner exits editor mode by opening a lens (lens needs embodiment as a prop).
- Learner triggers an evaluation phase (run / predict / step) inside an
  already-mounted lens (the evaluation streams need the live embodiment; cached
  embodiment from mount may be reused if the lens hasn't requested
  re-embodiment).

No re-embody on every keystroke; no debounced background re-embody; no
speculative pre-build. Embodiment construction is a known-cost operation gated
by an explicit user action.

Errors surface at the trigger:

- **format / validate / parse errors** appear when the learner takes an action
  that triggers re-embodiment (typically lens-open from editor). They do NOT
  appear while typing.
- **creation / evaluation phase errors** appear only when the snippet is
  actually evaluated (run / predict button), even if the error could be detected
  statically.

This is a deliberate UX decision aligned with the lifelong-learning autonomy
principle: don't intrude on the learner's typing with real-time syntax-error
spam.

Sandbox: type a syntactically incomplete snippet; no error UI appears in editor
mode; switch to a lens; the format/parse error surfaces at the trigger moment;
the lens displays whatever it displays for an unparseable embodiment (per its
own error-surface contract).

**Phase B shipped (2026-05-21):** Real composition is live. The F3 sandbox can
now drive the parse-error UX path with real source — `embody()` routes non-
scenario input to acorn (tokenize → parse), returning `tokenize-fail` or
`parse-fail` Snippets with `snippet.errors` populated. Scenario sentinels
(`embody("FAIL_AT_PARSE")`, `embody("FAIL_AT_TOKENIZE")`) still work unchanged.
The sentinel-blindness invariant remains load-bearing: orchestrator code MUST
branch on `Snippet.status` / `Snippet.errors`, never on snippet string identity.

**Status (2026-05-13): F3 satisfied by F2 implementation; no separate F3
increment ships.** F2.4 (transition-only embody trigger, deletion of the
unconditional `useEmbodiment` useMemo, atomic `cachedEmbodiment` slot with
cache-hit semantics on round-trip) plus F2.5 (eager edit invalidation via
`handleSnippetChange` wrapper) jointly realize F3's "build embodiment only
when downstream needs it" requirement. Evaluation-phase re-embodiment inside a
mounted lens is **lens-internal** via `snippet.evaluation.events.*` (no
orchestrator round-trip needed; the cached embodiment from mount is always
fresh inside a lens-mode session because snippet state is frozen there). The
sentinel-blindness invariant — orchestrator branches only on `Snippet.status`
/ `Snippet.errors`, never on snippet content — was audited at zero violations.
See [`../orchestrate/DOCS.md` § F3 — lazy embodiment realized] and
[`../orchestrate/README.md` § Conventions] for the load-bearing claims and
their commit-level evidence (`9bd7377`..`da3b6c3`). Sandbox empirical check:
F2 sandbox at `src/pages/f2-mode-machine.tsx` exercises the F3 UX path — with
Phase B live, the real-code sandbox flow (type-then-toggle surfacing real parse
errors in debug-props panels) is now unblocked.

#### F4 — First trial lens against the new contract

Implement one lens at `lenses/<name>/` against the `embodiment`-prop contract:
TS core + light React wrapper. Bootstraps a non-trivial registered set so
Layer-I / Layer-II surfaces have something to enumerate / rank. Dependency-rule
audit: lens never imports from `embody/` (top) or `orchestrate/` (top).

**F4 ↔ WS4 reconciliation.** F4 is the orchestrator-side trial-lens increment
(proves the `LensModule`-prop contract end-to-end inside `<StudyLenses>` so
subsequent layers have something to enumerate). The lens chosen for F4 MAY OR
MAY NOT be the same as WS4's first concrete migration. If WS4's highlight
reshape ships before F4, F4 inherits highlight as its trial. If F4 ships first
against parsons or blanks, WS4 lands additional lenses against the now-proven
contract. The pyramid build-order requires only that _one lens exists_ before
L1; which one is operational, not architectural.

Coordinate with `04-lens-migration.md` so one lens is finished end-to-end (TS
core + React wrapper) before F4's sandbox checkpoint.

Sandbox: lens mounts, displays its exercise, validates learner input against the
embodiment.

#### F5 — INTERNAL EventBus only (host-emit protocol DEFERRED)

Migrate the Inc-9 EventBus to the new `orchestrate/` for **intra-component
coordination only**. Per `DOCS.md` §Pedagogical grounding §"What we explicitly
do NOT own": _"A data-emit protocol from `<StudyLenses>` back to the LMS.
Deferred until a concrete integration target exists; out of scope for now."_ No
outbound subscribe-seam on `<StudyLenses>`, no host-facing event contract.
Internal events (e.g. a lens dispatching `lens-switched` so the orchestrator's
picker UI can update; future increments may add others) are in scope; an
LMS-facing `subscribe` prop or `onEvent` callback is NOT.

When a concrete LMS integration target exists, a follow-up increment adds the
outbound protocol. Until then, the EventBus is private to `<StudyLenses>`'s
internal wiring.

Sandbox: a `lens-switched` dispatch fires on the internal bus when the picker
selection changes; no public callback is invoked.

### Layer I — Q-I (Uncurated, Unguided): "Default recommendations"

The lens-picker dropdown over the full registered lens set. Inc-9's toolbar work
informs this layer directly.

#### L1 — Toolbar lens-picker

`<select data-orchestrator-lens-picker>` over the registered lens roster. The
picker is visible in BOTH editor mode and lens mode (per F2's state machine);
always-available is the Q-I autonomy guarantee. Selecting an option dispatches
`lens-switched` on the INTERNAL EventBus (event payload reused from Inc-9 — see
types.ts) and transitions the orchestrator into lens mode for the chosen lens.
The picker's default-selected option comes from the `lens` prop (per F1's prop
contract); if `lens` is absent, the default is the first lens in the roster (or
a orchestrate-level baseline default — to settle in L1's Phase 0).

Sandbox: dropdown shows every registered lens; selecting swaps the mount;
`lens-switched` event fires on the internal bus; switching in editor mode
transitions to lens mode.

#### L2 — Educator default via `lens` + `config` props (Q-III seam)

The per-fence info-string suffix (`js:trace`) and the per-directory
`lenses.json` cascade (plugin's `resolve-cascade.ts`) populate the `lens` and
`config` props on `<StudyLenses>`. The orchestrator treats these as the
**default-selected lens + its initial config** when the picker first opens.
Learner can still freely pick any other lens via the dropdown — the educator's
hint shifts the default, never the available set. **This is the bridge between
Q-I and Q-III**: same picker surface, educator-supplied default.

Sandbox: a fence with `js:parsons` opens with parsons in lens mode when the
learner first triggers the picker; learner can switch to any other registered
lens; `lenses.json` at a parent directory applies the same default to every
fence inside it (most-specific wins under the existing cascade rules).

### Layer II — Q-II (Uncurated, Guided): "Generated study paths"

The recommender. Per Explorotron Figure 3: **Code → Applicability Filter →
Ranking Engine → Recommended grid**.

> **WS2 owns the engine.** The Applicability Filter and Ranking Engine
> themselves (`orchestrate/lib/recommender/`) are planned in
> [`02-analysis-and-recommender.md`](./02-analysis-and-recommender.md) — that
> handoff specifies the analysis types, recommendation shapes, ranking signals,
> and grid dimensions. WS3 (this handoff) only covers the orchestrator's
> _consumption_ of the recommender's output. Cross-handoff dependency: Layer II
> in this handoff blocks until WS2 ships a working
> `orchestrate/lib/recommender/` public surface.

#### L5 — Recommendations panel UI

Render the filtered + ranked grid the WS2 recommender produces, as a panel that
opens via toolbar button. The panel layout (3D Block Model: level × scope ×
NM-components) and the per-cell affordances follow the WS2 plan; the
orchestrator's job here is the UI shell + click-handler that mounts the chosen
lens via L1's machinery.

Sandbox: panel opens; cells populate per the rankings WS2 produces; clicking a
cell transitions from editor mode to lens mode for the chosen lens.

#### L6 — "Open in Suggested Lens" shortcut

Toolbar button or keyboard shortcut that bypasses the panel and mounts the
highest-ranked recommendation directly. Q-II's "guided" behaviour: the system
makes the choice for the learner.

Sandbox: shortcut mounts the highest-ranked lens for the current snippet.

### Layer III — Q-III (Curated, Unguided): "Manual recommendations"

Educator overrides the recommender's ranking without removing freedom of choice.
Most of this layer is plugin work + thin orchestrator wiring.

> Most of Layer III is already absorbed by L2 above (the picker's
> default-selected option comes from the `lens` + `config` props, sourced from
> per-fence info-string and per-directory cascade). What's listed here is the
> additional Q-III-specific seams that reorder the Q-II recommendations panel
> rather than just shifting the picker default.

#### L7 — Per-fence ranking override directive

New optional attribute on the `@study-lens` directive (parser at
`parse-study-lens-directive.ts`) that adjusts the recommender panel's ranking
for THIS fence — boost lens X to top, demote lens Y below threshold. Plugin
parses and emits a config field that the orchestrator forwards to the WS2
recommender as a per-snippet ranking-override input.

Sandbox: a fence whose directive boosts `parsons` produces a panel with parsons
ranked first regardless of the recommender's natural score. The dropdown is
unaffected (Q-I autonomy preserved).

#### L8 — Per-directory ranking cascade

Confirm the existing `lenses.json` cascade (`resolve-cascade.ts`) carries the
same ranking-override field at directory scope, with most-specific-wins
precedence. Most of the cascade plumbing already exists for `lens` and `config`;
extension is just the optional ranking-override field.

Sandbox: a directory's `lenses.json` shifts panel rankings for every fence
inside that directory unless a per-fence directive contradicts.

### Layer IV — Q-IV (Curated, Guided): "Manual study paths"

**DEFERRED at snippet scope** (user decision). Per-snippet educator-defined lens
tours (Explorotron paper §2.2's Flowcharts → Trace → … on one snippet) are NOT
in scope for this orchestrator handoff. Two reasons:

- **Auto-recommended tours (Q-II) are sufficient.** Layer II's recommendations
  panel + "Open in Suggested Lens" already give the learner a guided path
  through applicable lenses, ranked by snippet-fit. Custom hand-crafted tours
  don't add enough learner value to justify the schema + parsing + sequential UI
  cost.
- **Curricular-scope sequencing covers most of the use case.** The Explorotron
  tour example reproduces in Q-IV at curricular scope — the LMS author renders
  five sibling `<StudyLenses>` fences in markdown, each with its own `lens`
  prop. No per-snippet sequence primitive is needed inside our component.

Re-introducing per-snippet sequences later (if a future curriculum need
surfaces) is a contained change. The future shape is intentionally undecided —
plausible options are a 5th prop (`sequence={[…]}`), a reserved meta-key inside
`configs`, or a `lenses.json` directory-level setting. The plugin's
`parse-lens-config.ts` would extend to recognize whichever shape lands; a
sequential-walk-through React component lives inside `orchestrate/`. **Treat
L9-L11 as deferred follow-up tickets, not out-of-the-question.**

### Top — Monitored learning (out of scope)

Grade reports / LMS integration / cheating detection. Not started until L1-L8
are stable AND a concrete LMS integration target exists. Until then, per
`DOCS.md` §"What we explicitly do NOT own", the data-emit protocol is deferred —
F5's EventBus stays INTERNAL. Adding the outbound subscribe-seam is a follow-up
increment when the host integration target appears. Per paper §3 the ethical
tensions here are real — defer until pedagogical priorities clarify.

### Cross-tier increments (orthogonal, can land at any tier boundary)

- **Plugin alignment (B) — CLOSED** 2026-05-07..11 (`8cec361`–`838ba35`).
  Unblocks L7/L8. See archived `./B-plugin-alignment.md`.
- **Dependency-rule CI lint**: catch violations going forward. Lands any time
  after F4. (Pre-refactor REFACTOR-HANDOFF Step 16 outlined this; the file
  self-deleted in `4526dc3`.)
- **`study-lenses/` → `lenses/` rename audit** (closed during Phase A migration;
  the plugin keeps `src/plugins/study-lenses/` because "study-lenses" is the
  public user-facing concept).

### Substrate hooks already wired (post-refactor)

The orchestrator has access to:

- `embody(code) → Snippet` from `embody/index.ts` — the factory.
- `embody/types.ts` — `Snippet · Status (4 booleans: tokenized/parsed/validated/created) · Source · RawAcorn · EmbodyError · EvaluationEvents (run/intercept/trace.*)` types (canonical contract).
- `orchestrate/lib/recommender/` — analysis of an embodiment to lens
  recommendations (WS2 deliverable).
- `orchestrate/lib/socratizing/`, `completing/`, `editing/`,
  `error-interpreting/`, `jej-documentation/` — analysis libs taking
  `embodiment`.
- `orchestrate/editor/` — the editor home-base component.
- `lenses/<name>/` — each lens self-contained: TS core + React wrapper, takes
  `embodiment` via props.

### Embody Phase B impact

Shipped 2026-05-21 (commits `434ce9c`–`943c666`). `Snippet.parse`, `Snippet.static`,
and `Snippet.streams` **no longer exist**. New Snippet shape:

```ts
// Flat fields (always present)
snippet.source          // Source { code: string; offsets: ReadonlyArray<number> }
snippet.raw             // RawAcorn { tokens, ast, comments } — null until gate passes
snippet.status          // Status { tokenized, parsed, validated, created }
snippet.errors          // EmbodyError | null

// Phase axis (nullable until the corresponding gate passes)
snippet.realm · snippet.tokenize · snippet.parseAST · snippet.creation · snippet.evaluation

// Derived (null on real-comp until lib/parse/ + lib/validating/ land)
snippet.analysis · snippet.validation

// Layer-first axis (event streams — always callable)
snippet.events.{realm, tokenize, parseAST, creation, evaluation}
```

**New evaluation surface** (lens-callable, always present even on non-apex leaves):

- `snippet.evaluation.events.run(opts?)` — was: `snippet.streams.evaluate.run()`
- `snippet.evaluation.events.intercept(opts?)` — was: `snippet.streams.evaluate.intercept()`
- `snippet.evaluation.events.trace.variables(opts?)` — **new**, wasn't in old API
- `snippet.evaluation.events.trace.syntax(opts?)` — was: `snippet.streams.evaluate.trace.syntax()`
- `snippet.evaluation.events.trace.semantics(opts?)` — was: `snippet.streams.evaluate.trace.semantics()`

Non-apex leaves return a no-op RunInstance: `endReport.outcome: 'not-runnable'`;
`endReport.error: null`. Gate failure reason is on `snippet.errors`, not the RunInstance.

**Null guards required:**

- `snippet.analysis` — `null` on real-comp until `lib/parse/` DDD ships; always null-guard in orchestrator code
- `snippet.validation` — same

**`embody()` no longer throws** on non-scenario input. Phase B routes all input to real
composition (acorn tokenize → parse → apex or tokenize-fail or parse-fail leaf). The
old error boundary for the non-scenario throw path is now unreachable.

**Pre-existing TypeScript errors** (not in WS3 scope — fix as a prerequisite mechanical-rename commit before F4+):

| File | Stale reference | Fix direction |
| ---- | --------------- | ------------- |
| `orchestrate/lib/socratizing/analyze-micro-decisions.ts:139` | `embodiment.parse.ast` | `embodiment.raw.ast` (interim) |
| `orchestrate/lib/error-interpreting/interpret-error.ts:135` | `embodiment.parse.ast` | Same |
| `lenses/debug-props/core.ts:90–94` | `embodiment.validation` (non-null assumed) | Add null guard |

### Conventions to enforce

Carry-forward (still apply):

- `export default` named-first function declaration.
- `.js` extensions in imports.
- `freezeInPlace` for fresh objects.
- No mutable closures over `let`; no classes; no `this`.
- Multi-statement `useEffect` callbacks → named function expressions (Pitfall
  #11).
- ZOMBIES test order with AR-3 before, AR-4 after each TDD increment.
- AR-1 + AR-2 on documentation commits (docs are ground truth).
- Sandbox checkpoint required for each user-observable increment.
- Atomic commit per increment with `--no-verify`.

New, specific to the post-refactor layout:

- **Lens purity**: lens plugins receive `embodiment` via props. They do NOT
  import from `embody/` (top) or `orchestrate/` (top). May import from
  `orchestrate/lib/*` and `@-utils`.
- **Lens shape**: TS core + React wrapper. NOT a single React component; NOT a
  framework-agnostic LensMount.
- **Single-writer**: only `orchestrate/editor/` mutates snippet source. Lenses
  are read-only views.
- **`embodiment` parameter name** wherever a function takes a Snippet instance.
- **Dependency rules** per `DOCS.md` § Dependency rules; CI lint check
  recommended (carry-forward from pre-refactor work).

## After this increment list

Forward-looking, beyond F1-F5 + L1-L8:

- Trial lens migration (highlight, parsons, blanks, trace-table, variables, ask,
  etc.) — each lens is its own session, planned in `04-lens-migration.md`.
- Sandbox.html smoke-test harness (separate ticket; F1's per-page sandbox at
  `src/pages/study-lenses-smoke.tsx` covers the smoke goal in the meantime).
- Per-snippet study-tour reactivation (Q-IV Layer IV) if a future curriculum
  need surfaces.
- Outbound LMS event protocol when a concrete integration target exists.
- Cross-cutting: a CI dependency-rule check catches violations going forward
  (carry-forward from pre-refactor work).

## What this handoff does NOT cover

- Phase A migration mechanics (closed; `REFACTOR-HANDOFF.md` self-deleted in
  `4526dc3`).
- Any source code under `study-lenses/` (pre-refactor; deleted in Phase A
  migration).
- Cross-handoff updates to `00-master-plan.md`, `04-lens-migration.md`,
  `development-guide.md` are kept current via batched docs sweeps (most recent:
  `95f51e7`, 2026-05-11, post-B-closure). `01-NM-components.md` and
  `02-analysis-and-recommender.md` remain to be touched at next-relevant-
  session boundaries.
- F1's contract design (closed in commit `bd98648` Phase 0; details in git
  history at `bd98648^`). Future increments (F2+, L1+) run their own Phase 0
  cycles per AGENTS.md.
- Speculation about specific lens shapes (parsons / blanks internals, etc.) —
  those are WS4 concerns per `04-lens-migration.md`.
