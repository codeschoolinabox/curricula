<!-- cspell:ignore curric quiescent -->

# Handoff — study-lenses greenfield: Phase-1 entry (post-keystone-wave)

> Written 2026-07-15, at keystone-wave completion, by the session that ran
> all five region Phase-0s. **Do not start until the maintainer has approved
> the wave's commits and answered this brief's plan-approval questions.**

## Read first, in this order (before ANY planning)

1. `CLAUDE.md` (repo root — governance router), then your governance file per
   that router (`AGENTS.md`, or `AGENTS.fable.md` only if your model id
   contains "fable") — END-TO-END, then `DEV.md` — END-TO-END (~2029 lines,
   paginate). Governance outranks this brief.
2. The ratified decision record — design authority, §§ 0–5 ONLY (lines
   1–758; `## 6` starts at 759); [DECIDED] items are settled, §§ 6–10 are
   spent:
   `/Users/master/.claude/plans/read-through-0-curricula-dev-md-0-curric-cosmic-mountain.md`
3. The committed package docs — the contracts you implement against:
   - root: `src/lib/study-lenses/{README.md, DOCS.md, WORKFLOWS.md}`
   - the five region triples, each `{README.md, DOCS.md, types.ts}`:
     `src/lib/study-lenses/{embody, lenses, evaluators, language-levels, orchestrate}/`
4. The wave's record (decisions + maintainer items, not a work order):
   `.planning-handoffs/study-lenses-phase0-2-keystone-contracts.md`
5. This file.

## Mission

Begin Phase-1 TDD against the committed keystone contracts, per DEV.md's
incremental workflow (JSDoc → stub → failing test → ar-3 → implement → ar-4,
one behavioral increment at a time; ar-5 before any merge prompt).

**The FIRST plan-approval question belongs to the maintainer — do not pick
unilaterally.** Candidate opening deliverables, in the record's § 4.3
dependency order (P1, the keystone contracts, was fulfilled by the wave):

- (a) **Disposition of the superseded top-level docs** (see TRAP 1): rewrite
  `ROADMAP.md` as the § 4.3-shaped roadmap — the natural landing place for
  the § 3.1 carried opens as named questions — or delete both; either way it
  is one small `docs:` commit that removes the biggest cold-reader trap.
- (b) **P2 — extract JEJ into `language-levels/jej/`** against the committed
  level spine (quarry: the JEJ content under the old embody tree; the
  generic `lib/validating` engine survives as machinery a level's validate
  parameterizes internally).
- (c) **P3a — the shared parse leaf** (also the future owner of the AST
  vocabulary embody and the levels currently type via acorn directly —
  their docs already promise a touch-free re-point).
- (d) **The embody factory implementation** (facts → accessibility → gate →
  attach → freeze, per embody's committed triple).

## Traps (each has cost a session an hour or worse)

1. **Superseded docs sit AT HEAD beside the real ones.**
   `src/lib/study-lenses/ROADMAP.md` and `src/lib/study-lenses/ARCHITECTURE.md`
   predate the ratified record and carry a DEAD model (levels-array-inside-
   embody, blocking⇄detected modes). They are NOT authority; the record
   §§ 0–5 and the committed triples are. Their disposition is maintainer
   item (a) above — and a concurrent session may already have their
   deletion STAGED (see TRAP 3), so check the LIVE state (`git status`,
   `git log`) before acting: item (a) may be resolved, in flight, or still
   open by the time you read this.
2. **Two quarries, different trust levels.** The old implementation under
   `src/lib/study-lenses/` at HEAD (`index.ts`, `lib/`, region internals,
   `sandbox-programs/`) and the deprecated tree
   `src/lib/study-lenses--deprecated-architecture/` are read-only quarry.
   The stray `src/lib/embody/` is the OLD-IMPLEMENTATION machinery quarry —
   it mirrors the pre-wave tree, NOT today's HEAD (the wave replaced HEAD's
   embody docs and types; the stray still carries the old ones, plus
   `.legacy/` extras). Reuse is gated by record § 4.1 (decisions that die)
   and § 4.2 (embody field dispositions); § 4.5 lists the old DOCS/README
   passages that are false under the ratified model. Copy only what fully
   satisfies the current increment; never bulk-restore.
3. **Shared churning tree — and the shared INDEX churns too.** Hundreds of
   dirty paths belong to OTHER sessions, and a concurrent session may have
   STAGED its own mass migration (at this brief's writing: ~960 staged
   paths, including renames of the old tree and staged deletions of
   ROADMAP.md/ARCHITECTURE.md). So: your first `git status` may look
   alarming — distinguish foreign churn from your own by path, and NEVER
   run a bare `git commit` or a bare `git add <dir>`. The robust recipe on
   a foreign-dirty index: work on your exact paths, then commit
   path-scoped — `git commit -m "…" -- <your exact paths>` — and verify
   with `git show --stat HEAD` that ONLY your paths landed. Check purity
   with `git status --porcelain -- <your paths>` using exact FILE paths,
   never directories (a directory query picks up the old tree's foreign
   staged deletions living inside it), not with global index emptiness. On anything unexpected STOP and present to the maintainer —
   never reset, never push, never amend.
4. **Vocabulary and docs discipline bind all new writing.** Banned-term
   grep before any commit (full output, never truncated): kernel · station
   · applicableTo · isJeJ · admission gate · plugin · picker · dial · run
   button · creation-as-phase (sanctioned negations exist — review matches,
   don't auto-reject). Mermaid: `<br/>` in NODE labels only, never edge
   labels. Docs describe the end state — no status/migration narration.
5. **Possibly-unresolved maintainer items touch contracts.** The wave's
   item list and rulings-so-far live in the wave session's plan file —
   `/Users/master/.claude/plans/read-end-to-end-and-before-moonlit-swing.md`,
   RESUMPTION POINT block — and in its final gate summary; they are NOT in
   the repo files. Status at writing: the committed docs already EMBODY two
   deliberately-argued deviations awaiting the maintainer's confirmation —
   `Violation` carries no `severity` (language-levels DOCS records why) and
   the error-interpreting lens declares both parse phases (a reviewer's
   two-single-phase-lenses alternative is on the maintainer's desk) — and
   two OPTIONS are purely pending: the `snippet`-prop → `source` rename
   (orchestrate's public surface) and a root-glossary refusal-as-data
   scoping clause. If the maintainer has not ruled, build against the
   committed docs as they stand and treat those four surfaces as
   amendment-risk.
6. **Engine coordination.** The execution engine (the evaluate-spec
   contract and danger backends) belongs to the parallel evaluating-engine
   campaign — quiescent-tree coordination per record § 3.3. There is no
   live `src/lib/engine` yet; its prior-architecture copy sits inside the
   deprecated quarry (`src/lib/study-lenses--deprecated-architecture/lib/engine/`).
   The evaluators region references it prose-only; never edit or relocate
   it from this campaign.
7. **Model discipline.** Everything now runs opus. AR agents are invoked by
   REGISTERED NAME with NO model parameter — the wave-era explicit opus
   override for ar-2 was a maintainer exception tied to Fable, and it is
   over.

## Ground truth at writing (VERIFY before use — the tree churns)

- HEAD `2612fe98831882ed50f655dac0cea25ac0c91e15` (orchestrate Phase-0).
  Record your OWN baseline SHA at plan approval — do not reuse any SHA from
  this brief.
- TEN unpushed commits: `aa9496a`·`cbd2ebe`·`5ed7b54`·`89288e6` (root docs)
  · `f0f145a`·`e253ade` (embody) · `266e8ea` (lenses) · `9232741`
  (evaluators) · `0221ef6` (language-levels) · `2612fe9` (orchestrate).
- The five region triples all exist on disk and pass their per-file checks
  (eslint / markdownlint-cli2 / cspell / prettier); the final ar-2 audited
  all twelve cross-region seams: coherent.

## Environment gotchas

- Default node is 20.11; the repo needs 22.11:
  `export PATH="$HOME/.nvm/versions/node/v22.11.0/bin:$PATH"` per Bash call,
  and `cd` into the repo inside EVERY compound command (cwd resets between
  calls — this bit the wave session twice).
- Repo-wide gates are known-red for external reasons (site build mounts an
  empty sandbox; tsc fails inside the deprecated/stray trees). Verify
  per-file only. cspell: inline ignore directives in your own files, never
  a cspell.json edit inside a ceremony commit. Run `npx prettier --write`
  on your files BEFORE final review (the pre-commit hook is prettier-only)
  and re-read any rewrapped line.
- The repo lint bars `interface` (use `type`), bars `*Props` identifiers
  (use `*Properties`), and `eslint --fix` is forbidden repo-wide.
