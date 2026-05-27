# B: Docusaurus plugin alignment — **ARCHIVED (work-stream closed)**

> **STATUS: CLOSED (2026-05-11).** Work-stream B shipped to `main` across **12
> commits** (Phase 0 contract-lock + 8 atomic behavior commits + AR-5
> followups + a mid-flight 3-prop reshape + an opacity correction), spanning
> **2026-05-07..11**. This document is **historical plan-of-record** describing
> what was intended at the time of planning (the original four-prop API,
> per-fence `config` prop, etc.). The body below is preserved as-is for context
> on the decisions and trade-offs the work navigated; it does NOT reflect the
> post-completion state.
>
> **Where the work landed** (newest-first; matches
> `git log --oneline 8cec361^..838ba35` output, inclusive of the Phase 0
> contract-lock at the start anchor):
>
> ```text
> 838ba35  refactor: maximally-opaque configs type on orchestrate side (Phase 1)
> df6a0e7  refactor: 3-prop emission contract — configs absorbs config (B re-shape)
> 88bf92c  refactor: AR-5 followups for plugin alignment — docs cross-peer drift cleanup
> 8364531  add: B sandbox checkpoint — fence-to-debug-props verification page
> 13eab82  add: minimal lens-mount path for debug-props in orchestrator
> b132e1d  add: debug-props lens module (TS core + React wrapper)
> 934fa7a  add: emit `configs` cascade bundle from lenses.json + close prop-shape gap
> dedc429  add: URL-style fence syntax parser (js:lens?key=value,…)
> b5a3bf6  add: rename `code` → `snippet` in plugin emission
> abd78c3  add: drop `lang` attribute from plugin emission
> b2cf1b4  add: drop `transforms` attribute from plugin emission
> 8cec361  docs: lock plugin alignment contract + debug-props DDD + orchestrate F1+B narrowing
> ```
>
> **What changed vs. this plan's intent:**
>
> - The locked four-prop API (`snippet, lens?, config?, configs?`) was reshaped
>   to a **three-prop API** (`snippet, lens?, configs?`) mid-flight. The
>   per-fence/sibling override is now deep-merged INTO `configs.lenses[lens]` at
>   plugin emission time; the orchestrator's per-lens config resolution chain
>   collapsed from 3 tiers to 2: `module.config() ⊕ configs.lenses?.[lens]`. The
>   F1 mount-time guard (`config supplied without lens → throw`) dissolved with
>   the absorbed prop. See commit `df6a0e7` message for the full overturn
>   rationale (AR-1 D4/D5/D6 overturned; D1/D2/D3/D7 retained).
> - The orchestrate-side `StudyLensesProps.configs?` is typed **maximally
>   opaque** (`Readonly<Record<string, unknown>>`) — the public type makes no
>   statement about cascade internals. The orchestrator's `lenses[lens]` lookup
>   is an internal structural assumption at the cast boundary inside
>   `resolvePerLensConfig`. See commit `838ba35`.
> - The plugin emits `configs` via `mdxJsxAttributeValueExpression`
>   (estree-carrying) so MDX evaluates the object expression directly; the
>   consumer React component receives a real object, no parser needed.
>
> **Ground truth for the current contract** lives at:
>
> - `src/plugins/study-lenses/{README.md,DOCS.md,types.ts}`
> - `src/lib/just-enough/javascript/orchestrate/{README.md,DOCS.md,types.ts}`
> - `spiralearn/sandbox/b-prop-shape/` (live verification page)
>
> The original starter-prompt narrative below ("Pick up cold…") was the prompt
> the implementing agent used to open the B session. It remains useful as a
> worked example of the AGENTS.md + Adversarial-Review-Protocol workflow.
>
> **Note on the preserved body's pointers**: the body's "Authoritative
> read-order" section cites specific line ranges in
> `03-orchestrator-and-contracts.md` (e.g. "lines 175-216 Cross-handoff impact",
> "lines 50-65 locked four-prop API"). Those line numbers were valid against the
> F1+C-era 03 file but have shifted with the 2026-05-11 status-header +
> OVERTURN-NOTE edits. Cite by section header (Cross-handoff impact, Locked
> architectural decisions, etc.) rather than by line number when consulting
> today's 03 file.

---

## Original starter prompt (historical)

> Pick up cold. Read this file end-to-end before opening the session. Enter plan
> mode before any edits.

## What's done (state of `main`)

Phase A migration + F1 (Foundation tier of the orchestrator pyramid)

- C (post-F1 docs cleanup) all shipped to `main` 2026-05-04 → 2026-05-07:

```text
abe70bb  docs: post-F1 inbox cleanup — highlight reshape +
         EMBODY-IMPL-HANDOFF status + DEV.md test convention   (C)
dd5e55b  docs: AR-5 cleanup — drop stale archival refs in
         lenses/DOCS.md and editor/DOCS.md                     (F1 follow-up)
445086a  refactor: prettier-format F1 surface                  (F1 follow-up)
0d99212  add: <StudyLenses> mounts editor home-base via
         <EditorComponent> + sandbox harness                   (F1.C)
9ab3aba  add: <StudyLenses> embodiment build via
         embody(snippet)                                       (F1.B)
325c31e  add: <StudyLenses> four-prop component skeleton + F1
         mount-time guard; delete pre-refactor archival        (F1.A)
bd98648  docs: lock F1 orchestrator contract — drop format
         step + sentinel banners; reshape editor as React
         component                                             (F1 Phase 0)
4526dc3  chore: delete REFACTOR-HANDOFF.md — Phase A complete
```

### Architectural state

- **Three-peer architecture is live**: `embody/` (pure-TS substrate
  - Phase-A mock factory), `lenses/` (lens modules — currently docs-only
    `highlight/` placeholder), `orchestrate/` (React-aware peer + the public
    API).
- **`<StudyLenses>` four-prop API is LIVE on main** at
  `src/lib/just-enough/javascript/orchestrate/index.tsx`. Surface:
  `<StudyLenses snippet lens? config? configs?>`. F1 wires `snippet` to runtime;
  the other three are accepted but not yet wired except for the F1 mount-time
  guard (throw if `config` is supplied with no resolved default).
- **Editor home base is a single React component** at
  `orchestrate/editor/index.tsx` per AR-1 CP-1. Read-only textarea in F1; F2
  lifts `readOnly` and adds `onSnippetChange?`.
- **Pre-refactor `orchestrate/orchestrator/` archival is deleted** (24 files
  removed in F1.A). `lenses/highlight/` source is also deleted (mirror surgery
  in C); only docs remain.
- **F1 sandbox harness** at `src/pages/study-lenses-smoke.tsx` mounts
  `<StudyLenses>` directly with hardcoded sentinel snippets (`OK`,
  `FAIL_AT_TOKENIZE`, etc.) — bypasses the plugin entirely.

### What still doesn't work

- **Docusaurus fences with `<StudyLenses>` throw at runtime.** The plugin still
  emits the pre-refactor prop shape (`code`, `lens`, `lang`, `transforms`). The
  new `<StudyLenses>` ignores those and reads `snippet`, which arrives
  `undefined`, which makes the `embody(undefined)` call throw
  `Unknown embody mock scenario`. This is exactly the gap **B closes** — see the
  plugin-gap callout in `orchestrate/README.md` lines 100-109.

## What B is

B = **Docusaurus plugin alignment**. Bring the plugin at
`src/plugins/study-lenses/` into shape with the locked four-prop API. Per the
cross-handoff impact section of the orchestrator handoff
(`.planning-handoffs/03-orchestrator-and-contracts.md` lines 175-216):

### Required changes

1. **Drop `transforms` attribute entirely** — no transforms tier.
2. **Drop `lang` attribute** — embody auto-detects.
3. **Rename `code` → `snippet`** to match the new orchestrator prop.
4. **Adopt URL-style fence syntax**:
   - `js:trace` → `lens="trace"` only.
   - `js:trace?stepDelay=500` → `lens="trace"` + `config={ stepDelay: 500 }`.
   - `js:trace?cols=value,steps` → `lens="trace"` +
     `config={ cols: ["value","steps"] }`.
   - Bare `js` → default editor home base (no lens, no config).
   - Comma-separated transforms parsing dies.
5. **`lens` attribute survives** as the Q-III educator default.
6. **`config` attribute survives** as the override for the resolved-default
   lens.
7. **NEW `configs` attribute** — the cascade bundle keyed by lens name. The
   plugin populates this from the `lenses.json` directory cascade (existing
   `resolve-cascade.ts`).
8. **Per-fence `@study-lens` directive** survives — Q-III educator-override
   surface (existing `parse-study-lens-directive.ts`).
9. **`lenses.json` cascade** survives (existing `resolve-cascade.ts`); its
   output flows into the new `configs` prop.

### Important: B closes the prop-shape gap, not the rendering gap

After B lands, the plugin will emit the correct four-prop shape. But docs-page
fences will then call `embody(realJEJSource)` — which the **Phase A mock doesn't
accept** (the mock only knows the 11 sentinel inputs: `OK`, `FAIL_AT_TOKENIZE`,
etc.). So fences will continue to throw `Unknown embody mock scenario` for any
realistic snippet. **Real fence rendering needs Phase B embody** (real
tokenization replacing the sentinel discriminator), which is its own separate
handoff (`EMBODY-IMPL-HANDOFF.md`).

B's "done" criterion is therefore **not** "fences render in the browser." It's
**"the plugin emits the correct four-prop API shape, and unit-tested
transformations of fence info-strings → emitted JSX props match the new
contract."**

The user is aware of this gap (see the plugin-gap callout the F1 work landed in
`orchestrate/README.md`).

## Pre-session human checks

Before opening the session:

1. **Confirm the F1 + C commits are on `main`** (the 8 commits listed above
   through `abe70bb`). If a rebase or revert happened, surface it before the
   agent starts.
2. **Confirm `npm run typecheck` baseline** for `src/plugins/study-lenses/` is
   what you expect. The pre-existing baseline is the inherited plugin code; B
   will modify it but should not regress it.
3. **Review the existing plugin tests.** `src/plugins/study-lenses/` likely has
   tests that pin the OLD prop emission shape. B will need to update them; if
   there are tests, the agent should plan to migrate them in the same increment.
4. **Commit shape: Option B (locked, user-confirmed 2026-05-07).** Decomposed
   atomic commits, one per behavior:
   1. Drop `transforms` attribute.
   2. Drop `lang` attribute.
   3. Rename `code` → `snippet`.
   4. Adopt URL-style fence syntax (`js:lens?key=value,…`).
   5. Emit `configs` cascade bundle from `lenses.json`. Plus a Phase 0 docs
      commit at the front (lock the plugin contract in
      `src/plugins/study-lenses/{README,DOCS}.md`) and any AR-5 followup commits
      at the end. Each behavior gets its own AR-3 + AR-4 cycle per AGENTS.md.

## Authoritative read-order (priority)

The agent should read these in order before any code changes:

1. **This file** — the handoff itself.
2. **`src/lib/just-enough/javascript/.planning-handoffs/03-orchestrator-and-contracts.md`**
   — especially lines 175-216 (Cross-handoff impact / plugin alignment), lines
   309-319 (F1 spec the plugin emits against), lines 50-65 (locked four-prop
   API + URL-style fence syntax spec).
3. **`src/lib/just-enough/javascript/orchestrate/README.md`** — especially the
   "F1 narrowing" block and the "F1 ↔ plugin alignment gap" callout (lines
   ~84-109). This explains exactly what gap B closes.
4. **`src/lib/just-enough/javascript/orchestrate/types.ts`** —
   `StudyLensesProps` (lines 96-101) is the contract the plugin emits against.
5. **`src/plugins/study-lenses/`** (entire directory) — the plugin to be
   modified. Read all of `code-block-to-jsx.ts`,
   `parse-study-lens-directive.ts`, `resolve-cascade.ts`, and any tests / index
   files.
6. **`src/lib/just-enough/javascript/AGENTS.md`** +
   **`src/lib/just-enough/javascript/DEV.md`** — workflow + conventions (DDD, AR
   ceremony, `feedback_no_branches`, `feedback_docs_get_full_AR`,
   `feedback_ar_ceremony_mandatory`).
7. **`src/theme/MDXComponents.js`** — F1 fixed this consumer's import path; B
   should not regress it.

## Session prompt (copy-paste verbatim)

```text
Read /Users/master/.claude/plans/next-session-post-phase-a-handoff.md
in full before doing anything else. That file is your post-F1+C
handoff for B (Docusaurus plugin alignment). Pay special attention
to:

- The "What still doesn't work" section — fences in docs pages
  throw `embody(undefined)` at runtime because the plugin still
  emits the pre-refactor prop shape. B closes that gap at the
  prop-emission level (not at the embody-mock-rendering level —
  that's Phase B embody, separate handoff).

- The required changes list (4 hard changes + the new `configs`
  cascade emission).

- The "B closes the prop-shape gap, not the rendering gap" caveat
  — your "done" criterion is "plugin emits the correct four-prop
  API shape, unit-tested" not "fences render in the browser."

- The pre-session checks. **Commit shape is locked: Option B
  (decomposed atomic, one commit per behavior).** No need to
  re-decide.

Your task is B (Docusaurus plugin alignment). After reading the
handoff:

1. Read the authoritative read-order in priority (handoff itself,
   orchestrator handoff cross-handoff impact section, orchestrate
   README + types.ts, src/plugins/study-lenses/ in full).

2. Enter plan mode. Propose your Phase 0 (DDD: any docs / type
   updates needed for the plugin module first), then Phase 1 TDD
   increments per the locked Option B sequence (drop transforms →
   drop lang → rename code→snippet → URL-style fence syntax →
   emit configs cascade). Get my ExitPlanMode approval before any
   execution.

3. Follow DEV.md and AGENTS.md discipline: Phase 0 → AR-1 → types
   check → DOCS sketch (the plugin module's DOCS, if it has one)
   → AR-2 → commit Phase 0 → per-increment TDD cycle (JSDoc →
   stub → failing test → AR-3 → implement → lint → refactor →
   AR-4 → quality checks → commit).

4. **AR ceremony is mandatory.** Don't rationalize "this is too
   small for AR" — that's exactly the failure mode AR exists to
   catch. Per `feedback_ar_ceremony_mandatory` and
   `feedback_docs_get_full_AR`. Skip-resistance applies.

5. **Atomic per-behavior commits with `--no-verify`.** Pre-existing
   markdownlint baseline is broken; commit hooks will fail on it
   and that's not your concern. Use `--no-verify`.

6. **No new git branches.** Per `feedback_no_branches`, commits go
   directly to `main`. I push to remote myself; you do not push.

7. **Sandbox checkpoint** — B is plugin code, not user-facing UI.
   The "user-observable" output is the emitted JSX prop shape on a
   compiled fence. Sandbox checkpoint shape: render a known fence
   in the dev server, inspect the resulting JSX in React DevTools,
   confirm the four-prop shape comes through. Note this will still
   throw `embody(undefined)` for non-sentinel snippets (Phase A
   mock limitation) — that's expected per the handoff. Surface
   during sandbox planning if there's a cleaner verification path.

Start with plan mode.
```

## Red flags to watch for during the session

Stop the agent and redirect if you see:

- **Agent skipping Phase 0 / AR cycle.** Documentation commits get full AR-1 +
  AR-2 per `feedback_docs_get_full_AR`; plugin code changes get AR-3 + AR-4 per
  increment. Don't let the agent rationalize skipping any of these.
- **Agent treating "fences don't render real JEJ" as B's problem.** That's Phase
  B embody, not B (plugin alignment). B's surface is the prop-emission contract.
- **Agent re-introducing the `transforms` attribute** in any form. The
  transforms tier is dropped per the locked architecture.
- **Agent breaking the per-fence `@study-lens` directive parser** or the
  `lenses.json` cascade resolver — both survive B (they're load-bearing for
  Q-III educator-override surfaces).
- **Agent emitting old prop names alongside new ones** (e.g. emitting both
  `code` and `snippet` for "compatibility"). The four-prop API is locked; legacy
  alongside is technical debt with no consumer.
- **Agent updating the package's README/types/DOCS while doing plugin work** —
  those landed in F1 / C, locked for B's purposes. If something looks wrong in
  the package's docs, surface it rather than fix in-line.

## Coordination points

- **F1 / C are sealed.** B does not modify orchestrator code, orchestrator docs
  (except possibly removing the F1 plugin-gap callout once B closes the gap —
  defer that decision to AR-5), or any `embody/`, `lenses/` peer files.
- **WS2 (recommender)** at `.planning-handoffs/02-analysis-and-recommender.md`
  is independent; B does not need to coordinate.
- **WS4 (lens migration)** at `.planning-handoffs/04-lens-migration.md` is
  independent; the annotate-lens source coming back later (formerly `highlight`;
  renamed during WS4 Phase 0) is WS4's concern, not B's.

## Out of scope for B (deferred)

- **Phase B embody** (real tokenization replacing sentinel discriminator) —
  separate handoff at `EMBODY-IMPL-HANDOFF.md`. Without this,
  fences-with-real-JEJ still throw post-B.
- **F2** (editor-vs-lens 2-mode state machine) — separate session.
- **L1+** (toolbar / picker / panel) — separate sessions; gated on F2.
- **Lens implementations** (annotate source — formerly highlight — parsons,
  blanks, etc.) — separate WS4 sessions.
- **The handoff file itself** at
  `.planning-handoffs/03-orchestrator-and-contracts.md` § Cross- handoff impact
  recommends "REFACTOR-HANDOFF.md should gain new steps for plugin alignment" —
  but REFACTOR-HANDOFF.md was deleted in `4526dc3`. The recommendation is moot;
  B is its own handoff (this file). Don't add steps to a deleted file.

## What B's commit history will look like (locked: Option B)

Decomposed atomic, one commit per behavior. Expect 5-7 commits:

```text
docs: lock plugin alignment contract — flag B scope in
       src/plugins/study-lenses/{README,DOCS}.md (Phase 0)
add: drop `transforms` attribute from plugin emission
add: drop `lang` attribute from plugin emission
add: rename `code` → `snippet` in plugin emission
add: URL-style fence syntax parser (js:lens?key=value,…)
add: emit `configs` cascade bundle from lenses.json
refactor: AR-5 followups for plugin alignment (if any)
```

Each `add:` commit gets its own AR-3 (test strategy) → AR-4 (implementation
audit) cycle. AR-5 runs once at the end across the whole B diff.

## After B completes

The user pushes B's commits to `main`. The agent does not push.

Next sessions to consider, in pyramid order per the orchestrator handoff:

- **F2** — editor-vs-lens 2-mode state machine.
- **F3** — lazy embody trigger.
- **F4** — first trial lens against the new contract.
- **F5** — internal EventBus dispatch.
- **L1** — toolbar lens-picker.
- **L2** — educator default + cascade resolution (closes the `config` /
  `configs` runtime wiring).

Or, in parallel-track:

- **WS2 recommender Phase 0** —
  `.planning-handoffs/02-analysis-and-recommender.md`. Unblocks L5/L6 once it
  ships.
- **WS4 lens migration Phase 0** — `.planning-handoffs/04-lens-migration.md`.
  Lands real lenses one at a time (annotate — formerly highlight — parsons,
  blanks, …).
- **Phase B embody** — `EMBODY-IMPL-HANDOFF.md`. Unblocks real JEJ source
  rendering in fences.
