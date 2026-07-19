<!-- cspell:ignore Gateable unparsed -->
<!-- markdownlint-disable MD013 -->

# orchestrate campaign — RESUMPTION (for the next orchestrating session)

Transitional scaffolding beside PHASE-1-HANDOFF.md; the maintainer deletes it
when the campaign completes. Written 2026-07-19 at a session boundary. The
incoming session — expected FABLE (router → AGENTS.fable.md, whose §
Orchestrated delegation → § Execution mechanics binds directly); any other
generation follows the router to its own file — continues as CAMPAIGN
ORCHESTRATOR.

## Read first, in order

1. CLAUDE.md → YOUR governance file → DEV.md sections on demand.
2. PHASE-1-HANDOFF.md END-TO-END — **the campaign log at its tail BINDS and
   supersedes stale § WAVE 3 increment text** (deriveAssessments 3-input;
   deriveMask takes the assessment; no admission check in masking; W3-V1/V2
   FLAG-HELD on F4).
3. PHASE-1-CHECKPOINT-LEDGER.md (deferred 🔍 rows the maintainer replays).
4. AGENTS.fable.md § Orchestrated delegation → § Execution mechanics — those
   practices (pathspec commits, honest gates, PAUSE bubbling, context-free
   fan-out validation, usage-window awareness) are campaign process for ANY
   orchestrating generation.

## State at handoff (verify live: git log --oneline -20, git status --short)

- HEAD `459252c`. Waves 0–2 CLOSED (see the campaign log). Wave-3 entry Phase-0
  COMMITTED `12f5e23` (validating/marking/masking/level-ui contracts, scaffold
  level docs, canon amendment) + gate rulings `459252c`.
- **In-flight subagents from the previous session are DEAD with it** — the three
  Wave-3 workers (D1, M1, K1) must be RELAUNCHED fresh (prompts below). They had
  produced ONE file: `orchestrate/lib/masking/derive-mask.ts` (untracked stub,
  possibly partial — verify or rewrite).
- W3-V1/V2 (validating implementations) FLAG-HELD: ParseFacts is still
  `{tokens, comments, ast}`; the maintainer routes F4 to the jej stream. Never
  touch another stream's files.
- Foreign baselines for step-15 gates: typecheck EXACTLY 2 errors
  (src/lib/embody/index.ts + the deprecated tree); whole-repo test:unit has ~42
  foreign failures outside campaign paths — path-scoped green is the bar.
- Node: prefix npm/npx with
  `export PATH="$HOME/.nvm/versions/node/v22.11.0/bin:$PATH" &&`
- NEVER stage: AGENTS.md, DEV.md, src/lib/study-lenses/embody/_,
  language-levels/jej/types.ts, .planning-handoffs/_. Commit with pathspec
  (`git commit -m "…" -- <paths>`); lint-staged leaves MM index residue —
  reconcile only byte-identical rows via `git add`, never `git reset`.

## Next steps, in order

1. **Relaunch the three Wave-3 workers** (opus subagents, parallel; each
   self-dispatches registered ar-3/ar-4, no model param, STRICTLY READ-ONLY
   clause; full 18-step ceremony; AR PAUSE → stop, report to the maintainer;
   never push). Cluster specs — the committed README/DOCS/types (12f5e23) are
   the contracts; the log rulings bind:
   - **D1** `language-levels/scaffold/`: index.ts default-exports the
     LanguageLevel spine (key 'scaffold', debugger-flagging deterministic
     validate with honest Violations — real offsets + node paths, source order;
     snippetTypes ['module']; short real docs strings; stub editorSupport; empty
     models). Constant-file export form. node tests (real inline acorn parses
     build ParseFacts; never a mock): Z/O/M per the brief. Skip 🔍 declared: no
     UI consumer yet. Commit: "add: scaffold level — trivially conforming,
     injected-only".
   - **M1** `orchestrate/lib/marking/`: deriveAssessments(verdict, admitted,
     currentType) → LevelAssessment, frozen; carve-out reads off verdict.kind.
     Tests incl. the type-level pin that LevelAssessment['mark'] is exactly
     FitMark. Skip 🔍: pure derivation. Commit: "add: deriveAssessments —
     four-valued marks with causes, undetermined carve-out wins".
   - **K1** `orchestrate/lib/masking/`: deriveMask(assessment | null, strict,
     levelLabel) → MaskState, frozen, structural MaskCause; warn/none/fits/
     undetermined → unmasked; strict×does-not-fit → first violation; strict×
     not-applicable → admitted types. Skip 🔍: pure derivation. Commit: "add:
     deriveMask — assessment crossed with posture over the three surface
     classes".
2. **W3-L1 LevelSelector** — ORCHESTRATOR-run (🔍-bearing, never fans out): per
   the brief's W3-L1 + committed level-ui contracts; jsdom StrictMode tests,
   data-attribute selectors, no geometry assertions; sandbox page
   `spiralearn/sandbox/level-ui/index.mdx` (BrowserOnly + require, copy the
   editor/phases-panel page pattern) injecting the scaffold level + wiring the
   REAL deriveAssessments over prepared parse states → all four marks reachable;
   append the ledger row; checkpoint DEFERRED per mandate (note in commit body).
   Commit per the brief's W3-L1 message.
3. **Wave-3 close**: campaign log line + continuity refresh.
4. **Wave-4 HARD GATE** (never waive — another stream's landing): embody()
   exported+committed+covered in src/lib/study-lenses/embody/ AND the runtime
   phase-order constant exists there AND Waves 1–3 committed. Satisfied → Wave-4
   Phase-0 → AR-1/AR-2 → serialized increments per the brief. Not → PARK: log
   it, check in with the maintainer leading with the checkpoint ledger, the FLAG
   list (F1 embody order constant, F3 gutter follow-on, F4 ParseFacts + its
   sweep list in the log, F5 governance edits), and the commit ledger.
5. **Phase 2** (only after Wave 4): npm run validate (report foreign debt, don't
   fix) → AR-5 with baseline `aaa4d0d93d6cdc786c1ace1c68bd4e33917a7d62`
   - path scope orchestrate/** + language-levels/scaffold/** +
     spiralearn/sandbox/\*\* → final commit → "ready to push" (the push is the
     maintainer's).

## Standing maintainer rules (unchanged)

AR PAUSE verdicts stop for the maintainer; the push is theirs; cross-stream
FLAGs are routed by them; 🔍 checkpoints deferred to the ledger with commit-body
notes; all other gates waived with resolutions reported. Continuity: update this
file, the campaign memory
(`~/.claude/projects/-Users-master-Documents-0-teach-code-0-spiralearn-0--home/memory/project_orchestrate_campaign.md`

- MEMORY.md line), and the plan RESUMPTION POINT
  (`~/.claude/plans/read-0-curricula-agents-md-and-0-curricu-tingly-flask.md`)
  at every wave boundary and before heavy launches late in a usage window.
