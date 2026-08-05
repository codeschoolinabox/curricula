<!-- cspell:ignore curric subdirs explorotron worktree -->

# Handoff — study-lenses greenfield: Phase-0 #2 (keystone contracts)

> **WAVE COMPLETE (2026-07-15).** All five region Phase-0s ran the full
> seven-step ceremony and committed (async gates — the maintainer reviews the
> commits): `f0f145a` embody · `e253ade` embody README enrichment · `266e8ea`
> lenses · `9232741` evaluators · `0221ef6` language-levels · `2612fe9`
> orchestrate. Every region: Plan-agent pass + ar-1 + ar-2, all verdicts
> CONSIDER with every finding folded; the final ar-2 doubled as the cross-region
> seam audit — **wave coherence verdict: COHERENT** (12/12 seams aligned,
> banned-vocabulary sweep clean across all five triples + root). Maintainer
> decision items live in the session's final gate summary and the plan file's
> RESUMPTION POINT. Next: maintainer review + push; Phase-1 TDD and all later
> work runs on opus (ar-2/ar-5 inherit opus — the historical normal). This
> brief's mission is fulfilled; the sections below remain as the wave's record.

> Written 2026-07-14 at the Phase-0 #1 human gate, by the session that authored
> the package-root docs. Phase-0 #1 committed `aa9496a` (root README.md +
> DOCS.md). **Do not start until the maintainer has approved that gate AND
> ratified this brief's scope.**

## Read first, in this order (before ANY planning)

1. `CLAUDE.md` (repo root — governance router), then your governance file per
   that router (`AGENTS.fable.md` if your model id contains "fable") —
   END-TO-END, then `DEV.md` — END-TO-END (~2029 lines, paginate). Governance
   outranks this brief.
2. The ratified decision record — design authority:
   `/Users/master/.claude/plans/read-through-0-curricula-dev-md-0-curric-cosmic-mountain.md`
   **§§ 0–5 only** (lines 1–714). [DECIDED] items are settled. §§ 6–10 are
   spent/superseded — never execute from them.
3. The committed root docs — the prose contract your types must conform to:
   `src/lib/study-lenses/README.md` (glossary = the naming contract) and
   `src/lib/study-lenses/DOCS.md` (the sketch the Refactor step is held
   against).
4. The prior mission handoff for standing rulings that still bind:
   `.planning-handoffs/study-lenses-phase0-root-docs.md` (maintainer rulings
   1/3/4 and the DO-NOTs remain in force; its ruling 2's deferral is what YOU
   are now executing).
5. This file.

## Mission (one sentence)

Produce the keystone type contracts — the record § 4.3 P1 set: Facts (whose
tagged stage shape is part of the Facts definition, § 0), the six-phase
lifecycle vocabulary, Gateable, the utility envelope's canonical home, and the
language-level spine ("kernel spine" in the record's words) — through the full
seven-step DEV.md Phase-0 ceremony (ar-1 and ar-2 by name, no `model` param),
ending in one commit and a hard stop at the human gate.

## Decisions this Phase-0 MUST make (name them in your ar-1/ar-2 prompts)

**Timing rule:** decisions 1 and 3 are resolved below (type name; no root
types.ts). What remains for the maintainer at PLAN APPROVAL — before any step
0.4 — is decision 3's residue: WHICH region's Phase-0 comes first and which
keystone types it carries. Confirm in your first exchange that the Phase-0 #1
gate was approved and this brief's scope ratified. **Deliverable set:** the
committed root README/DOCS were deliberately written type-name-neutral and are
NOT edited this Phase-0 by default; the ceremony's doc steps (0.1/0.2/0.5) apply
to the docs of wherever the maintainer decides the types live. Any root-doc
amendment a keystone decision genuinely forces needs explicit maintainer
approval (DOCS.md is an architectural contract).

1. **RESOLVED — the frozen study object's type name is `Embodiment`**
   (maintainer ruling, 2026-07-14): "Embodiment; Snippet is the raw code passed
   in." So: `Embodiment` = the frozen study object's type; "Snippet", if a type
   is ever needed for the raw input, names the raw program (source text +
   snippet type) — it is NOT the frozen object (this supersedes the record § 0
   "Snippet / embodiment" type-level aliasing). The root glossary already
   matches. Your types.ts encodes this; no re-litigating.
2. **Envelope realization** — per-kind interfaces over the shape convention
   (record § 2.1 [PROPOSED], ratify or amend): a minimal structural `Gateable`
   (name + applicability + optional phase(s), NO main — the embodiment side
   never types React) extended by the lens kind; evaluator kind separate (§
   2.3). Optional fields are lens-kind-only (§ 2.1).
3. **RESOLVED IN PART — "no types necessary for top-level DDD"** (maintainer
   ruling, 2026-07-14): the package ROOT never gets a types.ts. Keystone type
   contracts land with their owning REGIONS' Phase-0s — which is also when each
   region's home gets pinned (resolving the § 3.3 tension naturally: homes are
   decided exactly when a region's DDD starts, not before). FURTHER RULING
   (2026-07-14): all FIVE entity-region Phase-0s — embody, lenses, evaluators,
   language-levels, orchestrate — run on Fable-generation sessions (the
   ar-2/ar-5 inherit-the-session-model mechanism upgrades the judgment reviews
   exactly there), under a HARD BUDGET: the maintainer's Fable quota is finite
   and access ENDS ~2026-07-20 — after that, Phase-1 TDD and everything else
   runs Opus (ar-2/ar-5 then inherit Opus, the historical normal). Recommended
   order: embody → lenses → evaluators → language-levels → orchestrate
   (dependency order; the kind-contract triangle first). Record § 2.4's
   geography — Facts/lifecycle/Gateable embody-side, component-kind extension
   lens-side — remains the [PROPOSED] starting point to ratify or amend at plan
   approval.
4. **The § 3.2 drafting pins that types force**: exact field names for the
   six-phase lifecycle payload (`{ accessible, cause?, lenses }` per record §
   2.5) — data names only; learner-facing display labels and the none-state
   display string STAY unpinned (they are UI, not data).
5. **Carried opens (record § 3.1)** — do not resolve unilaterally; carry or
   surface: selector/strict state home under the single-writer model + the event
   bus; the level-registry read API shape; the educator-docs posture line
   (ratify or drop).

## Execution shape for the keystone wave (maintainer-ruled 2026-07-14)

- **One thread, five regions, dependency order**: embody → lenses → evaluators →
  language-levels → orchestrate. Each region runs the FULL seven-step ceremony
  and ends in its own commit + human gate. The kind- contract triangle
  (embody/lenses/evaluators — Gateable and its extension, the evaluator contract
  lenses consume) comes first while context is freshest; orchestrate, the
  consumer of everything, closes the wave and its ar-2 carries an EXPLICIT
  cross-region seam mandate (it is the wave's de-facto coherence audit).
- **Sessions are physical segments of that thread.** Start fresh from this
  brief; run as many regions as fit CLEANLY. At any gate where context tightens:
  update THIS brief (it is the living handoff), cold-validate it (invariant 12),
  cold-start the next segment. Never carry a new region on a summarized context.
- **Budget reality**: the maintainer's Fable quota is more than half spent and
  access ends ~2026-07-20. ar-1 is pinned opus (does not draw Fable). ar-2
  inherits Fable — the wave's main quota consumer. Economies: CONTINUE one ar-2
  agent across regions (SendMessage continuation — it retains the record between
  passes; proven in Phase-0 #1); if quota nears exhaustion, the maintainer may
  explicitly authorize ar-2-on-opus for evaluators (the most bounded contract) —
  human-only call, never self-granted. After Fable access ends, Phase-1 TDD and
  all remaining work runs opus; ar-2/ar-5 then inherit opus (this repo's
  historical normal — nothing to reconfigure).
- **Quarry mining order**: read record § 4.2 (the embody/types.ts field-by-field
  disposition) BEFORE opening the old types files, so you mine only surviving
  fields. Main reads — note the embody one is NOT in the deprecated tree:
  embody's old types (1328 lines) live at the stray `src/lib/embody/types.ts`
  (byte-identical to `git show HEAD:src/lib/study-lenses/embody/types.ts`); the
  other two are `src/lib/study-lenses--deprecated-architecture/lenses/types.ts`
  and `src/lib/study-lenses--deprecated-architecture/orchestrate/types.ts`.

## Vocabulary rules established by Phase-0 #1 (binding on your drafts)

- "kernel" NEVER appears — the ratified name is **language level**.
- **"the orchestrator"** is the app-actor noun; bare "environment" is reserved
  for the lifecycle phase; "study environment" only as product descriptor.
- The validate/verdict word pair (not "judge"); "fit" = lens fit, always
  disambiguated from the selector's level "fit marks".
- Banned-term grep before any commit (full output, never truncated):
  `kernel · station · applicableTo · isJeJ · admission gate · plugin · picker · dial · run button · creation-as-phase`.
  Sanctioned negations exist in the committed docs ("never a plugin", "no
  top-level Run button") — matches are reviewed, not auto-rejected.
- One parse truth, mask-not-filter, freeze-what-you-own, refusal-as-data,
  level-blind embodiment: the committed DOCS constraints bind your types.

## Ground truth at writing (VERIFY BEFORE USE — the tree churns)

- HEAD `89288e6` — the last of the four root-doc commits (ledger below). On-disk
  new-tree content:
  `src/lib/study-lenses/{README.md, DOCS.md, WORKFLOWS.md, explorotron-quadrants-and-pyramid.png}`
  (the PNG was never un-tracked; it was physically restored in the worktree,
  byte-identical, so it carries no diff). Record your OWN baseline SHA at plan
  approval — do not reuse any SHA from this brief.
- ⚠️ Git still TRACKS the old tree's hundreds of files under
  `src/lib/study-lenses/` — they appear as uncommitted worktree DELETIONS
  (porcelain status `D`, unstaged) inside your own package dir. That is the
  accepted mid-move state (prior handoff ruling 1), not something you broke.
  NEVER stage them: a bare `git add src/lib/study-lenses/` would stage hundreds
  of deletions — exact paths only, index-purity gate before and after.
- The old tree remains the read-only quarry at
  `src/lib/study-lenses--deprecated-architecture/` (record § 4.5 lists its false
  front-door passages; grep trap: the old path is a string-prefix superset of
  the new `src/lib/study-lenses/`).
- Root docs at the gate = FOUR commits: `aa9496a` (README+DOCS ceremony),
  `cbd2ebe` (story + visuals amendment), `5ed7b54` (`WORKFLOWS.md` — author +
  learner walkthroughs, maintainer-authorized), `89288e6` (story reframed
  package-scope — maintainer ruling: root docs mention NO specific curriculum
  — + layer table + mermaid edge-label hardening: no `<br/>` in EDGE labels,
  node labels only; keep that rule in future diagrams). Gate notes RESOLVED by
  the maintainer (2026-07-14): the "Two hats" personas (🔬 Frogrammer / 🎨
  Vibetoader) STAY in the README (the no-specific-curriculum ruling was scoped
  to the story's framing, not the persona vocabulary); the token/ast viewer
  lenses remain UNPROMISED in the root docs ([GFI] candidates — the phase table
  names only the decided error-explanation affordance).
- `src/lib/README.md` (parent) is 0 bytes in the worktree; the parent→child
  down-link is deferred repo-wide — do not edit that file without maintainer
  instruction.
- Shared churning tree: ~940 dirty paths belong to other sessions. Stage by
  exact path only; run the index-purity gate (`git diff --cached --name-only`
  must equal exactly your paths) before AND after `git add`; on contamination
  STOP — never reset.

## Environment gotchas (cost an hour if rediscovered)

- Default node is 20.11; repo needs `.nvmrc` 22.11:
  `export PATH="$HOME/.nvm/versions/node/v22.11.0/bin:$PATH"` per Bash call
  (shell state does not persist; cwd can reset between calls — `cd` into the
  repo in each compound command).
- Repo-wide gates are known-red for external reasons (site build mounts an empty
  sandbox; tsc fails inside the deprecated/stray embody trees). Verify per-file
  only: `npx eslint` (ts), `npx markdownlint-cli2` (md), `npx cspell`,
  `npx prettier --check`. cspell policy: inline `<!-- cspell:ignore … -->`
  directives in your files, never a cspell.json edit inside a ceremony commit.
- Pre-commit hook is prettier-only (lint-staged); it reflows prose — run
  `npx prettier --write` on your files BEFORE final review so the hook is a
  no-op, and re-read any line prettier rewraps (it once produced "Evaluation-
  phase" from a hyphen linebreak).
