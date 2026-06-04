# Handoff B — Orchestrator MVP (post-WS3 phase)

## Mission

Stand up the orchestrator MVP: a working learner-facing experience where the
editor is the home base, lens panel offers a working set of lenses, and a
persistent orchestrator panel sits above editor/lens-renders coordinating the
whole. Cross-cutting foundation: embodiment should rebuild on a debounced keyup
signal so token/AST-level data is fresh for inline syntax and static- semantic
error visualization — especially **token-level** visualizations for syntax
errors.

This handoff replaces and supersedes
[`../pull-together.txt`](../pull-together.txt) (the user's scratch list it was
distilled from). After this work begins, that file can move to `.legacy/` or be
deleted.

## Scope (this handoff is multi-sprint)

Four arcs, of which the foundation cuts across the other three:

- **Foundation** — Embodiment-on-keyup-debounce. Architectural, unblocks
  token-level visualizations everywhere else.
- **Arc A** — Editor home-base completeness (gutters, completions with JEJ
  warnings, full JS highlighting, auto-indent aligned with formatting, code
  folding).
- **Arc B** — Lens panel: migrate the remaining s-l.ec.be lenses to the V2 lens
  convention; build the new **variable-prediction** lens (PythonTutor-style,
  _with_ prediction), backed by a fresh variables-only tracer.
- **Arc C** — Persistent orchestrator panel above the editor/lens-render
  surface: lens picker, Run button, Format button + keybinding, Socratize, plus
  a toggle group for editor support features (autocomplete, docs, gutters,
  etc.).

**The agent picking up this handoff should choose ONE arc as the first sprint
and treat the rest as future inhabitants.** Surface the choice via
`AskUserQuestion` before any code change. The foundation is a tempting "start
here" but architecturally heaviest — see § Foundation for the trade-off.

## Read first (canonical, not restated here)

- `AGENTS.md` + `DEV.md` at the repo root — process rules, AR ceremony, Phase 0
  DDD, TDD/ZOMBIES, function-style conventions.
- The memory index at
  `~/.claude/projects/-Users-master-Documents-0-teach-code-0-spiralearn-0--home/memory/MEMORY.md`
  — user's standing rules.
- `src/lib/just-enough/javascript/DOCS.md` — orchestrator architectural sketch;
  § Locked decisions; § Public API.
- `src/lib/just-enough/javascript/orchestrate/editor/DOCS.md` — editor home
  base; F2 "no embody in editor mode" invariant; callback wiring (all 4
  callbacks now wired post-WS3).
- `src/lib/just-enough/javascript/embody/README.md` and `embody/DOCS.md` —
  embodiment factory, streams, F-invariants.
- `src/lib/just-enough/javascript/.planning-handoffs/00-master-plan.md` and
  `03-orchestrator-and-contracts.md` — overall plan; how this arc fits.
- `.planning-handoffs/04-lens-migration.md` and `04a-annotate-...md` — prior
  lens-migration plan + the annotate registration template for adding new
  lenses.
- `.planning-handoffs/03a-L1-picker-handoff.md` — the L1 lens picker work that
  intersects Arc C's lens-picker requirement.
- `notional-machine.md` and `reference.md` — pedagogical anchors (especially for
  the variable-prediction tracer's mental-machine alignment).

## State (where things stand at the start of this handoff)

- WS3 closes with `docLookup` wired (Handoff A:
  `~/.claude/plans/handoff-a-wiggly-tome.md`). All four editor callbacks
  (`linters`, `format`, `completions`, `docLookup`) are live in
  `orchestrate/editor/index.tsx`.
- Seven sprints sit committed-but-unpushed on `main` (the prior five from before
  Handoff A, plus Handoff A's four commits, plus the BLOCKED_STUMBLES +
  lib-structure-table follow-on commit). The human controls push.
- Concurrent agent session continues to edit the same tree (currently working on
  event-bus and orchestrator state; verify via `git log --oneline -10` at start;
  expect HEAD to move).
- `.planning-handoffs/04-lens-migration.md` and `04a-...md` already describe a
  lens-migration plan; Arc B will extend it rather than redo it.

## Foundation — Embodiment-on-keyup-debounce

Today: embodiment is built on demand by whoever calls `embody()`. In editor mode
the F2 invariant says the editor builds **no** embodiment — it consumes shaped
data from `validate(code)` and the adapter callbacks (see `lib/linting/`,
`lib/completing/`, etc.). The token/AST signal therefore lives inside
`validate()`'s `BaseResult.ast` and is re-derived per callback invocation.

The proposed change: a debounced-on-keyup embodiment cache that lives at the
orchestrator level (NOT inside `editor/`, to preserve F2), populated whenever
the editor's `onChange` fires. Lenses and editor support features then consume
the cached embodiment instead of rebuilding.

### Open design questions for Foundation (surface early)

1. **Cache location**: orchestrator-level cache (top of `orchestrate/`) vs a new
   peer (`embody-cache/`?) vs co-located with `embody()` itself.
2. **Invalidation rule**: clear-on-every-keyup vs version-token per snippet vs
   LRU.
3. **F2 boundary**: does the cache live "above" the F2 line (the orchestrator
   builds embodiments; the editor still receives only shaped data via
   callbacks)? Or does the editor get a read-only handle? The locked F2
   invariant currently forbids the latter.
4. **Debounce interval**: align with CM's existing autocomplete delay (100ms
   default) vs a separate orchestrator-owned tick.
5. **Token-level visualization API**: what shape does the lens / editor
   extension consume? A list of `{ token, kind, range }` or a richer AST handle?

### Why Foundation is tempting AND heavy

Tempting: every Arc A gutter, Arc B lens, and Arc C panel button benefits if the
embodiment is already cached. Heavy: it touches F2 (the load-bearing editor-mode
invariant), introduces a new shared- state surface, and requires a fresh DDD
cycle. The agent may reasonably choose to start with an Arc and revisit
Foundation once a concrete consumer's needs are clear.

## Arc A — Editor home-base completeness

### In scope

- **Gutters**:
  - Syntax errors (parse failures) — already partially surfaced by
    `lib/linting/`'s parse-error branch (one diagnostic per snippet).
    Token-level visualization of which token failed is harder; Foundation may be
    required.
  - JEJ validation — already surfaced by `lib/linting/`'s rejection branch (one
    diagnostic per violation).
  - Linting **warnings** (distinct from rejections — softer advisories like
    "this construct is allowed but discouraged"). The advisory-stumble path in
    `lib/documenting/` and `lib/completing/stumbling-list.ts` provides the
    content seed.
- **Completion suggestions with JEJ warnings** — already done via
  `lib/completing/` (blocked items show with `apply: 'noop'`). Check if any gap
  remains (specifically: warning advisories for `null` / `new`, surfaced today
  via hover but not completion).
- **Full JS highlighting** — `@codemirror/lang-javascript` is installed and
  wired. Verify the surface is complete (template literals, JSX-like patterns,
  decorators).
- **Auto-indent aligned with formatting** — verify CM6 indent rules match
  Prettier's JEJ-canonical config (tabs, 2-space, etc. — confirm by checking
  `embody/lib/formatting/`).
- **Code folding** — `@codemirror/language` includes a folding extension; needs
  to be wired into `build-extensions.ts`.

### Open design questions for Arc A

1. Should the syntax-error gutter be a separate slot from JEJ validation
   (different visual treatment), or unified?
2. Are linting "warnings" (advisories) a new severity in `LintDiagnostic`, or a
   new diagnostic stream entirely?
3. Auto-indent: should we exploit Prettier's existing format output, or rewrite
   the indent rule against the JEJ-canonical config? The handoff prompt says
   **read git history** — the user suspects stub utilities exist that were
   dropped from the tree.

### Pointers

- `orchestrate/lib/editing/build-extensions.ts` — where new CM extensions wire
  in.
- `embody/lib/formatting/` — the JEJ-canonical formatter config.
- `lib/linting/lint-jej.ts` — current diagnostic pipeline.

## Arc B — Lens panel

### In scope

- **Migrate remaining lenses** from `s-l.ec.be` (the legacy site) to the V2 lens
  convention used by `annotate` (the one already migrated per
  `04a-annotate-registration-handoff.md`).
- **Variable-prediction lens** — new lens, PythonTutor-style but WITH
  prediction: the learner predicts the next variable state before stepping.
  Backed by a new tracer (see below).
- **Variables-only tracer** — naive instrumentation (NOT full Aran), emits
  variable-binding events at each step. Lives under `embody/lib/evaluating/` as
  a new tracer alongside the existing trace/run/intercept engines.

### Open design questions for Arc B

1. **Lens migration order** — which legacy lens next, after annotate?
   `04-lens-migration.md` may list a recommended order.
2. **Variable-prediction lens UI** — input + reveal flow, correctness scoring
   rubric, multi-step traversal UX.
3. **Tracer scope** — variable bindings only (let/const), or include parameter
   bindings (out of JEJ scope) and loop counters?
4. **Tracer instrumentation strategy** — AST rewrite with write-after-assignment
   probes (naive), vs Aran-like interpreted (heavy), vs source-map + step
   debugging (browser- dependent). The handoff prompt says "naive" — confirm
   scope.

### Pointers

- `lenses/` — peer for new lens code.
- `lenses/annotate/` — the reference V2 lens implementation.
- `.planning-handoffs/04-lens-migration.md` — migration plan.
- `.planning-handoffs/04a-annotate-registration-handoff.md` — registration
  template.
- `embody/lib/evaluating/trace/` — existing trace engine; the new variables-only
  tracer either lives alongside or extends.
- `notional-machine.md` § Scope chain — pedagogical anchor for what "variable"
  means at the JEJ level.

## Arc C — Persistent orchestrator panel

### In scope

- **Lens picker** — likely overlaps significantly with
  `.planning-handoffs/03a-L1-picker-handoff.md`; review for prior art before
  re-scoping.
- **Run button** — invokes `embodiment.streams.intercept(code)` with separate
  rendered surfaces for the learner's output (clean console / DOM render) and
  the dev's instrumentation (raw events, step timeline).
- **Format button + keybinding** — already wired in `lib/formatting-editor/` and
  `build-extensions.ts` (Ctrl-Shift-F / Cmd-Shift-F). Arc C exposes it as a
  button too.
- **Socratize button** — calls `orchestrate/lib/socratizing/` on the current
  snippet and renders the questions.
- **Editor support feature toggles** — on/off controls for autocomplete,
  docLookup, lint gutters, code folding. State lives in the orchestrator; the
  toggles dispatch via the just-shipped event bus (see concurrent session's
  recent commits to `orchestrate/event-bus.ts`).

### Open design questions for Arc C

1. **Panel layout** — horizontal toolbar above editor vs vertical sidebar vs
   collapsible drawer. The handoff says "remains visible above
   editor/lens-renders" — confirm "above" is literal (positionally) or
   hierarchical (always-present).
2. **Run output surface** — single tab with toggle between learner / dev views
   vs side-by-side vs separate window.
3. **Toggle persistence** — session-only vs localStorage vs per-snippet
   metadata.
4. **Lens picker UX** — list / grid / dropdown / radial; aligns with L1 picker
   work.

### Pointers

- `orchestrate/index.tsx` — `<StudyLenses>` component, the natural panel host.
- `orchestrate/event-bus.ts` — concurrent-session work in progress; toggles
  dispatch through here.
- `orchestrate/lib/recommender/` — if/when smart picker arrives (not this MVP;
  pull-together explicitly says "no smart recommendations yet").

## Cross-arc references

- The **embodiment-on-keyup foundation** unlocks token-level gutter
  visualizations (Arc A), the variable-prediction tracer feed (Arc B), and the
  Run button's pre-warmed embodiment (Arc C). If the agent picks an Arc first,
  the work probably surfaces Foundation pressure inside the Arc.
- The **event bus** (concurrent-session work) is the dispatch surface for Arc C
  toggles. Coordinate via `git log` before picking up; do not duplicate.

## What NOT to do

- Do NOT push. The push backlog is now eight sprints.
- Do NOT modify `reference.md` or `notional-machine.md` (canonical curricular
  sources).
- Do NOT break F2 ("no embody in editor mode") without an explicit user-approved
  widening — surface via `AskUserQuestion` first.
- Do NOT tackle all four arcs in one sprint. Scope to ONE arc; surface choice
  before code.
- Do NOT create branches.

## How to start

1. Read `AGENTS.md`, `DEV.md`, the memory index, and this file.
2. Run `git log --oneline -20` to see what the concurrent session shipped
   recently (event bus, study-lenses, etc.) so your scope doesn't collide.
3. Skim each canonical doc listed under `Read first`. For Arcs B and C in
   particular, scan the existing `.planning-handoffs/` entries for overlap.
4. Enter plan mode. Surface the **arc-choice question** via `AskUserQuestion`
   (which arc to tackle first; Foundation as a prerequisite vs deferred). Draft
   the plan for the chosen arc.
5. Within the chosen arc, surface arc-specific design questions from § Open
   design questions before `ExitPlanMode`.
6. Proceed with the standard Phase 0 → AR-1 → DOCS → AR-2 → Phase 1 (TDD) →
   AR-3/AR-4 per increment → AR-5 → commit cycle. Per
   [[project_ar_model_dispatch]]: AR-1/2/5 on Opus, AR-3/4 on Sonnet.
