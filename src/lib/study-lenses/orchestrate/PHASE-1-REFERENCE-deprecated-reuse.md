<!-- markdownlint-disable -->
<!-- cspell:disable -->

# REFERENCE — deprecated-tree reuse survey (orchestrate campaign)

Transitional scaffolding beside PHASE-1-HANDOFF.md; the maintainer deletes it
when the campaign completes. Produced 2026-07-17 by a read-only survey agent
over `src/lib/study-lenses--deprecated-architecture/` (the quarry). Paths below
are relative to that directory unless prefixed NEW:.

## (a) Component / module map (orchestrator-ish surface)

Top component

- orchestrate/index.tsx (1197 lines) — `<StudyLenses>` (React.forwardRef; ref
  exposes the internal EventBus for tests). Owns EVERYTHING: static
  LENS_REGISTRY (annotate, blanks, debug-props, parsons, quiz, writeme —
  statically imported), `deriveInitialState` (single-pass atomic init of mode
  state + live-embodiment slot), `resolvePerLensConfig` +
  `readCascadeLensEntry` + `readOrchestratorConfig` (cast boundaries into an
  opaque `configs` prop), the shared `applyTransition` handler, the debounced
  live re-embody, the dock run lifecycle (intercept-only, async IoMocks,
  pending-interaction resolver ref),
  type/sandbox/run-limit/collapse/guide/dismissal state slots, and the full
  render tree (PhasesPanel → omnipresent region (Dock + EmbeddedGuide) → content
  row with Splitter(editor-or-lens | OutputPanels)).
- orchestrate/types.ts (586) — 3-prop `StudyLensesProps` (snippet, lens?,
  configs? maximally opaque), 2-mode `OrchestratorState` union, `LiveEmbodiment`
  (keyed by (snippet, type) full-string identity), station roster/status types,
  dock types (RunLimits, DockRunState, ChannelKind, PendingInteraction,
  InteractionAnswer, OrchestratorConfig), 4-event bus taxonomy.

Editor integration

- Editor library: **CodeMirror 6** (@codemirror/view, /state, /lint,
  /autocomplete, /commands, /language, theme-one-dark, basicSetup, dynamic
  `@codemirror/lang-*` imports).
- orchestrate/editor/index.tsx (209) — thin React wrapper; async `createEditor`
  mount with cancellation flag (StrictMode-safe), prop-change-during-mount race
  recovery, own-write echo guard on the snippet sync effect,
  `interpretedDiagnostics` push effect, fallback render with
  `data-orchestrator-error`. Hard-wires the four JEJ adapters: `lintJej`,
  `formatJej`, `completeJej`, `documentJej` (from the package-level lib/ peer).
- orchestrate/lib/editing/create-editor.ts (247) — async factory returning a
  callback-driven `EditorInstance` (content get/set, reset, format, check,
  setInterpretedDiagnostics, destroy; destroyed-sentinel). Pure callbacks never
  see CM types.
- orchestrate/lib/editing/build-extensions.ts (270) — the ONLY file importing CM
  extension builders: linter()+lintGutter() over merged structural+interpreted
  feeds, hoverTooltip doc lookup, autocompletion with a `apply:'noop'` dismiss
  sentinel (blocked-vocabulary pedagogy), format keybinding, dynamic language
  loaders.
- orchestrate/lib/editing/interpreted-diagnostics/{field,set-effect,merge-diagnostics}.ts
  — StateField + StateEffect + `needsRefresh` re-arm so a React-prop push with
  no doc change re-runs the pull-based linter; positional-identity supersede
  merge (interpreted replaces terse at same line/column).
- orchestrate/lib/editing/to-cm-diagnostic.ts (78) — plain-data → CM Diagnostic
  with range clamping; 'rejection' severity → CM 'warning'.
- Settle/debounce: per-keystroke `onSnippetChange` fires 1:1; the orchestrator
  debounces only its embody reaction (LIVE_REEMBODY_DEBOUNCE_MS = 200,
  trailing-edge, @utils/debounce, held in a ref). Slot never cleared on edit;
  editor→lens transition flushes inline (reuse if (snippet,type) matches, else
  sync embody) and cancels the pending debounce; coherence invariant enforced by
  three loud throws in the lens-mode render branch.

Phase/dock/panel components (all "presentation only": props down, intent
callbacks up, no embody import, no bus dispatch, data-attribute selector
contract)

- orchestrate/stations.ts (26) — canonical order: source · realm · parse ·
  creation · evaluation.
- orchestrate/derive-station-roster.ts (92) — static: registry → per-station
  rosters (normalize `phase` union via `stationsOf`).
- orchestrate/derive-station-availability.ts (71) — per-edit: LL stations hidden
  iff `type==='script' || validation?.isJeJ===false` (null validation keeps them
  shown).
- orchestrate/derive-station-status.ts (120) — per-edit: (Status,
  EmbodyError|null) → constant|ok|errored|barred|pending per station; validation
  never bars.
- orchestrate/phases-panel/index.tsx (154) — one `<select>` per shown station
  with a non-selectable sentinel; disabled when roster empty OR status barred;
  edit-return button (lens mode only).
- orchestrate/dock/index.tsx (230) — collapse, type toggle + script-mode hint,
  worker/danger sandbox toggle, danger-only debugger checkbox, run-limit inputs,
  Run/Cancel, outcome span.
- orchestrate/output-panels/index.tsx (233) — the two NM I/O channels as
  dismissable panels (UI channel interactive: native-faithful
  alert/confirm/prompt dialog, uncontrolled prompt input, modal while pending);
  nested vertical Splitter.
- orchestrate/embedded-guide/index.tsx (99) — static authored topics behind a
  reveal toggle.

Config cascade

- Two tiers, deep-merge-right-wins:
  `resolved(lens) = module.config() ⊕ configs.lenses?.[lens]`; per-fence /
  sibling overrides pre-merged upstream by the Docusaurus plugin. Separate
  `configs.orchestrator` tier (initialType, dangerAvailable, runLimits) read at
  a cast boundary. `deepMerge` at ../utils/deep-merge.js; non-object cascade
  entries rejected by runtime sanity check.

Level enforcement

- No mask, no posture, no selector — one hard-coded level (JEJ). Enforcement was
  (1) station-availability HIDING of LL stations, (2) per-lens self-gating
  (`quiz` via lib/admitting/is-jej-compliant), (3) editor gutter JEJ markers via
  `lintJej` running its own `validate(code)` — a second acorn parse per settle,
  documented as an accepted cost with a never-reached "convergence target".

Splitter / layout

- orchestrate/splitter/index.tsx (308) + geometry.ts (152, pure px arithmetic:
  clampBasis, resolveMaxBasisPx, nextBasis, nextBasisFromKey, rescaleBasis) +
  types.ts. Mouse events + window listeners (NOT pointer capture — jsdom has no
  PointerEvent/setPointerCapture), feature-detected ResizeObserver, full ARIA
  separator (aria-valuenow/min/max honest to the fraction-capped ceiling), fixed
  vs proportional resize modes, single-pane degeneracy. Layout guarantees live
  in co-located orchestrate.css (side-effect import).

Event bus

- orchestrate/event-bus.ts (138) — `createEventBus()`: per-instance, typed
  (EventPayloadMap), synchronous, registration-order, snapshot-at-dispatch
  (Array.from — Babel Set-spread workaround), caught+warned listener throws,
  depth-first re-entrancy, idempotent Set-based (un)subscribe, `clear()` for
  tests. Four events: lens-switched, mode-changed, type-toggled,
  sandbox-toggled; dispatch ordering rule (mode-changed before lens-switched,
  same commit).

Analysis libs (pure TS)

- orchestrate/lib/error-interpreting/ —
  `interpretError(embodiment, ErrorInput, {phase}) → ErrorInterpretation`
  (whatWentWrong/howToFix/likelyMisunderstanding/howToAdjust; template matching
  over explanations.ts (598 lines of authored patterns), context extraction,
  never throws, generic fallback); derive-interpreted-diagnostics.ts adapts
  EmbodyError → one located LintDiagnostic tagged source:'interpreted'.
- orchestrate/lib/socratizing/ — large analyzer suite (Socratic questions);
  never wired to a shipped lens.
- orchestrate/lib/recommender/ — README only; never built.

Tests (verified by @vitest-environment pragma + counting `it(`)

- node (no DOM): the three station derivations (9/13/9), event-bus (32),
  splitter geometry (33), all of error-interpreting + socratizing + editing's
  pure files (detect-language 26, to-cm-diagnostic 9, interpreted-diagnostics
  6), orchestrate-css.test.ts (5 — asserts the CSS file's text).
- jsdom (@testing-library/react): tests/study-lenses.test.tsx (165 its — the big
  integration suite: mounts REAL CodeMirror in jsdom, finds the EditorView via
  `EditorView.findFromDOM`, simulates edits with a single CM dispatch inside
  `act`, reads diagnostics via `forEachDiagnostic` not gutter DOM, asserts
  embody-call counts for debounce/flush caching, drives bus assertions through
  the forwardRef handle); per-component suites (editor 24, phases-panel 28, dock
  40, output-panels 33, embedded-guide 6, splitter 23);
  lib/editing/create-editor 29.
- browser: NONE in orchestrate. Real-browser tests exist only in the deprecated
  lib/engine and lib/danger-runner (vitest browser mode + screenshots). The
  interactive worker-run path (SAB pause → dialog → resume) was explicitly
  documented as "unproven against a real worker" — exercised only by node fakes
  and canned embody scenarios.

## (b) Reusable vs deliberately abandoned

Genuinely reusable (read whole; near-verbatim candidates)

1. The whole CodeMirror integration layer — orchestrate/lib/editing/
   (create-editor.ts, build-extensions.ts,
   interpreted-diagnostics/{field,set-effect,merge-diagnostics}.ts,
   to-cm-diagnostic.ts, build-tooltip-dom/build-info-dom). Its callback boundary
   (linters/format/completions/docLookup as pure functions, CM types contained)
   is exactly the seam the NEW editor needs. Re-point the callbacks from
   hard-wired JEJ adapters to level-supplied data and this layer survives. The
   StateField+effect+needsRefresh push-diagnostics mechanic and the noop-apply
   completion sentinel are hard-won CM knowledge.
2. orchestrate/editor/index.tsx — the async-mount lifecycle (cancellation flag,
   mount-race recovery, own-write echo guard, push-effect seeding from refs,
   error fallback). Subtle, tested, StrictMode-proven; copy rather than
   re-derive.
3. orchestrate/event-bus.ts + tests/event-bus.test.ts — the runtime contract
   (per-instance, sync, caught throws, depth-first, snapshot dispatch,
   idempotent teardown) is domain-independent; only the event taxonomy changes.
4. orchestrate/splitter/ (component + pure geometry core + both test files) —
   presentation-only, orchestrator-agnostic; the pure-core/impure-glue split is
   a model for "pure derivation libraries, thin components". Note it depends on
   orchestrate.css for static layout. (NOT in campaign scope; listed for the
   follow-on.)
5. The settle machinery as a pattern: trailing-edge debounce held in a ref,
   per-keystroke callback 1:1 with debounced derivation reaction,
   cancel-pending-on-transition, (snippet,type) full-string identity as the
   staleness key, ref-shadow discipline for post-commit reads, StrictMode mount
   guards.
6. orchestrate/lib/error-interpreting/ — interpretError + explanations.ts (598
   lines of authored learner-worded error patterns) + the adapter pattern. The
   NEW package wants exactly this content for tokens/ast phase lenses (the
   LENSES region, not orchestrate — do not port it in this campaign).
7. The presentation-only module pattern + the data-attribute selector contract
   ("tests anchor on attribute + value, never label text") —
   dock/output-panels/phases-panel/embedded-guide all follow it; the NEW panel,
   level UI, mask, and guide should too. embedded-guide/index.tsx is trivially
   portable (content needs rewriting).
8. The interactive IO machinery (pending-interaction slot + resolver-in-ref,
   per-kind native-faithful answer mappers, cancel-resolves-pending-first to
   avoid worker deadlock) + output-panels' dialog rendering — in the NEW
   architecture this belongs INSIDE the run lens (evaluation phase), not the
   orchestrator.
9. Test-harness idioms from tests/study-lenses.test.tsx: findMountedEditorView,
   typeInto (single CM dispatch in act), forEachDiagnostic counting,
   afterEach(cleanup) because the unit project runs globals:false (a pending
   debounce setTimeout otherwise leaks across tests).
10. deepMerge (deep-merge-right-wins) + the runtime non-object sanity-check
    pattern for config entries — the tier algebra changes but the merge and the
    guard survive.

Deliberately abandoned by the NEW docs (do NOT carry forward)

- The 3-prop opaque-configs surface and both cast boundaries (`configs.lenses`,
  `configs.orchestrator`) → NEW: eight typed props; `configs` keyed by lens name
  DIRECTLY; no orchestrator tier; upstream folding is the host's build.
- The 2-mode editor-vs-lens state machine, the live-embodiment
  flush/coherence-throw dance, edit-return, mode-changed/lens-switched taxonomy
  → NEW: the editor is always alive (surface class 1); the five-phase panel
  renders per-phase fitting lenses; enforcement is a MASK (inert overlay), never
  a mode flip.
- The station model itself: 'realm' station, 'parse' folded (tokenize+ast merged
  — the NEW phases split them back into tokens · ast), 'creation' →
  'environment'; availability HIDING of LL stations → NEW: all five phases
  always present; a barred phase renders barred WITH its cause;
  fit/accessibility derived by embody, not by orchestrator derivations.
- Static LENS_REGISTRY importing lens modules → NEW: composition root joins
  default roster + host-injected lenses/levels, append-only, loud collisions;
  the joined roster is passed to embody as an argument.
- The dock, top-level Run, output panels beside the surface, worker/danger
  sandbox toggle, debugger option, run limits at orchestrator level → NEW:
  "There is no top-level Run button"; running is a lens inside the evaluation
  phase; "evaluators — never touched here".
- Silent-drop of an unknown `lens` prop → NEW honor rules (honored-not-obeyed;
  fall back to normal rendering; mask applies to a focus-mounted lens
  identically).
- lintJej's editor-side validate(code) second parse → NEW: parse facts assembled
  once from the embodiment's stage values; one memoized validate per settle and
  per level shared by selector, gutter, and mask.
- The old LensModule shape → NEW
  `Lens = Gateable & { main, config?, recommend? }`.

## (c) Big deltas vs NEW orchestrate/DOCS.md

1. Interaction model: editor XOR lens two-mode machine → always-alive editor +
   five-phase study panel; phases ARE the interaction model; run is a lens.
2. Enforcement: hide (availability derivation removes LL stations) → mask (three
   surface classes; inert overlay naming level + first violation;
   undetermined-while-unparsed carve-out wins; warn posture blocks nothing). The
   deprecated tree has NO strict/warn posture, NO level selector, NO fit marks —
   the entire level UI is new.
3. Levels: one hard-coded JEJ level wired through four editor adapters +
   lib/admitting → first-class LanguageLevel registry (append-only injection, ''
   reserved none-state), per-level validate, per-level editor-support data,
   selected-level-only gutter, FitMark four-valued verdicts.
4. Fit/accessibility ownership: orchestrator-owned derivations
   (roster/availability/status) → embody-owned (embodiment carries per-phase
   accessible/barred + attached Gateable refs; orchestrator only filters its
   roster against attached refs and renders).
5. Composition: static imports + module-load roster derivation → mount-time
   composition root with loud collision failure and roster-as-argument to
   embody.
6. Config cascade: plugin-pre-merged opaque two-tier with cast boundaries →
   typed cascade keyed by lens name, continuously re-resolved, learner's session
   tweaks always final, per-lens factory (`config?`) or shared merge.
7. Props: 3 → 8 (type, languageLevels, activeLanguageLevel, strictLanguageLevels
   are new; `lens` becomes a focus request; `configs` re-typed).
8. Phase vocabulary: source·realm·parse·creation·evaluation → spec-named
   source·tokens·ast·environment·evaluation; display labels are explicitly the
   orchestrate region's UI concern, data names live in embody.
9. Execution: orchestrator-owned run lifecycle → evaluation-phase lenses import
   their own evaluators; the orchestrator never touches one.

## (d) Landmines

1. embody was a stub. The deprecated embody dispatches 11 canned scenario
   keywords ("OK", "FAIL_AT_PARSE", …) off normalized source text, and real
   composition only reached tokenize/parse. Consequences metastasized: a
   permanent "no consumer-side branching on source.code" anti-pattern rule,
   "honest under stubs" status values, a dormant script-mode hint,
   null-validation semantics, and 165 integration tests keyed to magic snippet
   strings. The greenfield must never let fixtures ride the production dispatch
   path.
2. God component. index.tsx is 1197 lines with ~20 state/ref slots and the run
   lifecycle inline. TWO separate mount guards exist because sharing one let one
   effect flip it before the other read it (documented in-code). The NEW "pure
   derivation libraries, thin components" constraint is the direct answer —
   honor it structurally, not aspirationally.
3. StrictMode double-invoke dominates. Initial-dispatch fire-once guard,
   debounce-mount guard, editor cancellation flag, idempotent-embody claims,
   discarded-render ref-write reasoning — all StrictMode-driven. Plan for
   StrictMode in the first TDD increment, not as a retrofit.
4. The atomicity tax of the two-mode design mostly dissolves with the
   always-alive editor, but the same staleness reasoning reappears in "one
   memoized validate per settle and per level" — key the memo by settled
   (source,type) identity as the slot did.
5. jsdom gaps (all hit here): no PointerEvent/setPointerCapture (the splitter's
   pointer-capture design was abandoned mid-flight for mouse+window listeners);
   no ResizeObserver (feature-detect); CM gutter doesn't lay out (assert lint
   STATE via forEachDiagnostic, never gutter DOM); load-bearing CSS can't be
   asserted; Babel mistranspiles `[...set]` in the Docusaurus bundle
   (Array.from + lint disable, see event-bus.ts line 86).
6. Browser-fidelity hole: the SAB-paused interactive run path never met a real
   worker under the orchestrator. Whatever the new evaluation-phase run lens
   does, budget a real `*.browser.test.ts` per transport-distinct settlement
   (lens-region concern, not this campaign's).
7. Double parse per settle (lintJej validate + embody acorn + CM's own
   tokenizer) was an "accepted cost" whose convergence target never landed. The
   new memoized-validate design fixes it only if the editor renders
   orchestrator/level-supplied diagnostics EXCLUSIVELY — don't let an
   editor-side validator sneak back in.
8. Opacity casts breed prose. The maximally-opaque `configs` required two
   cast-boundary helpers, runtime sanity checks, and paragraphs of
   documentation. The new typed surface deletes this class of problem; resist
   re-introducing any `Record<string, unknown>` pass-through.
9. Homonym overhead was real: "phase" (3 senses), "panel" (2), "mode" (3),
   "backend", "state"/"surface". The new spec-named phases + region glossaries
   address this; keep display labels vs data names separated as DOCS.md
   mandates.
10. Repo lint catch-22s encountered here and documented inline: optional-chain
    vs type-narrowing (the gutter memo), functional/immutable-data disables for
    the stateful bus and roster construction, arrow/no-op traps, sonarjs
    consistent-returns forcing always-returned idle-safe effect cleanups
    (splitter).
11. Debounce timers leak across tests unless `afterEach(cleanup)` is explicit
    (unit project runs globals:false — no auto-cleanup). Cost a real debugging
    session per the test-file comment.
12. Dead weight to not drag along: orchestrate/lib/recommender (README only),
    orchestrate/lib/socratizing (never wired), the quiz lens's admission seam
    coupling (lib/admitting) — all superseded or deferred in the new design.
