<!-- cspell:ignore socratizing quizzing socratize Schulte unbuilt -->
<!-- cspell:ignore reenrichment linearization PBSI -->

# Loss ledger — the questioning-parent transport

Per DEV.md § Documentation migration discipline: content transported into this
directory's README.md, DOCS.md, and types.ts is verbatim by default; every
omission, merge, split, or reword is enumerated here with its justification.
Built by a heading-by-heading walk of each source at the transport baseline, not
from recollection. In-directory placement (rather than the commit-body/plan
default) follows the stage handoff's explicit mandate (human-validated
2026-08-11): the ledger rides the campaign's transport commits, homed in the
region the campaign establishes. **This file is a burn-down** (human ruling
2026-08-11): rows retire as their points are resolved in discussion or restored
in content; whoever empties it deletes it — and in the same commit removes the
two references to it in this directory's README (the tree figure and §
Navigation). Scope: this campaign's transport program — the questioning parent
AND the `PEDAGOGY.md` transport add rows here; the Stage-3 quizzing-docs
transport owes its own ledger in its own directory. Source paths cite the
read-only quarry (`src/lib/study-lenses--deprecated-architecture/`) and the
greenfield open engine at its pre-move path
(`src/lib/study-lenses/lib/socratizing/`).

## Source: quarry `lib/quizzing/README.md`

| Source content                                 | Disposition                    | Destination                                       | Justification                                                                                                                                                                                                    |
| ---------------------------------------------- | ------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| § Why this module exists, two-registers ¶      | TRANSPORTED, 1 clause reworded | README § The two registers                        | Final clause "it deliberately shares socratizing's `BlockCell` vocabulary" → "share one `BlockCell` vocabulary — this region's": ownership of the shared type moved from one engine to the parent (the mandate). |
| § The question catalog (the catalog frame)     | SPLIT + 2 rewords              | README § Taxonomies                               | Organized-by-cell claim scoped to the closed register (the open catalog is organized by category and kind — design-review catch); "a module-level catalog index is the eventual home" → per-engine ownership.    |
| Catalog frame's dead-appendix sentence         | OMITTED                        | —                                                 | Points at off-repo planning history; its own text says "not an end-state dependency". The catalog TABLE never existed in-tree; nothing is lost that existed.                                                     |
| Glossary **Family** entry                      | TRANSPORTED                    | README § Taxonomies                               | Includes the "syntax-element domain" gloss and the partial non-isomorphic Feature correspondence. Quarry-relative links dropped.                                                                                 |
| Glossary **Curated bank vs generated** entry   | TRANSPORTED, trimmed           | README § Taxonomies                               | Example generator names (V1, V7) and card examples (let/const/TDZ) trimmed — engine-catalog specifics; Stage 3's docs carry the closed register's own elaboration.                                               |
| Glossary **Block-Model cell** + homonym ruling | REWORDED                       | README § Glossary (two entries)                   | Recast to forward reality: `BlockModelCell` no longer exists; the ruling survives as a forward guard, enriched with the `text-surface` ↔ `surface` rename and the `nmComponents` third axis it had omitted.      |
| § Bounded context                              | TRANSPORTED substance          | README § The two registers + § Ownership boundary | Purpose-row exclusivity, static decidability, AND the no-runtime-evaluation exclusion (initially dropped in transport; restored per design review). Engine-API specifics stay for Stage 3.                       |
| Everything else (API, mastery, group keys, …)  | NOT TRANSPORTED                | —                                                 | Closed-engine internals — Stage 3's port and docs, not shared truth.                                                                                                                                             |

## Source: quarry `lib/question-orchestrator/README.md` + `DOCS.md`

| Source content                                                                                                                                                          | Disposition           | Destination                                   | Justification                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One-grid goal (README lead; DOCS § Why a composition layer)                                                                                                             | REWORDED              | README § One grid; DOCS § Why a shared parent | Recast from pro-composition-lib framing ("this lib makes it real") to the retirement reality: the commitment survives, the mechanism does not.                                                                       |
| Glossary **register** entry                                                                                                                                             | TRANSPORTED substance | README § Glossary                             | Minus the retired `OrchestratedRegister` type and a `types.ts` line-number citation (this repo bans file:line section cites). The open-token nesting hazard is kept.                                                 |
| Glossary **coverage** entry + DOCS § Coverage semantics                                                                                                                 | CONCEPT ONLY          | DOCS § Carried collateral                     | The spans/gaps definition and report-only posture ride the carried coverage reporter; the compose-pipeline mechanics stay retired with the quarry tests as pinned truth.                                             |
| § Design constraints, reuse-never-fork bullet                                                                                                                           | TRANSPORTED substance | README § Ownership boundary                   | The two charter laws, with type names generalized to register language. The mechanism bullets of that section are omitted as retired.                                                                                |
| § Why this lib cross-register table                                                                                                                                     | PARTIAL               | README § One grid; DOCS § Carried collateral  | Coverage-meaningfulness rationale kept and attributed as recorded rationale. The anchor-normalization row is obsolete: both greenfield engines are offset-native — recorded as the second mechanized anchor instead. |
| MECHANISM sections (source registry, composition model, API, § Structure, execution phases, anchor normalization, two registry levels, async evolution, open questions) | OMITTED as a class    | —                                             | The orchestrator mechanism is retired (locked decision 3); the parent composes nothing. The quarry remains the byte-identical reference.                                                                             |

## Source: deprecated-architecture root `DOCS.md` § 3D Block Model space

| Source content                             | Disposition               | Destination                     | Justification                                                                                                                                                                                                                               |
| ------------------------------------------ | ------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The section's grid-and-extension content   | TRANSPORTED near-verbatim | DOCS § The 3D Block Model space | Human ruling 2026-08-11 widened this stage's transport to include it. The `StepCategory` enum path citation is replaced by a prose reference; the `exercise-types.md` cross-reference and the `blanks`-lens worked example are transported. |
| The `RecommendationGrid` folding paragraph | OMITTED                   | —                               | Retired recommender mechanism (the grid structure, cell population rules) — the parent carries the space as documentation truth, not its data structure.                                                                                    |
| The WS1/ROADMAP process paragraph          | OMITTED                   | —                               | Migration-era process narrative; end-state docs carry no status.                                                                                                                                                                            |
| (newly authored)                           | ADDED                     | same section                    | The vocabulary bridge (space "Level" ↔ grid dimension; space "Scope" ↔ grid level) — the axis collision was previously implicit across documents.                                                                                           |

## Source: greenfield `lib/socratizing/` (pre-move path)

| Source content                                         | Disposition                           | Destination                                          | Justification                                                                                                                                                                              |
| ------------------------------------------------------ | ------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| README § BLOCK model (Schulte 2008)                    | SPLIT                                 | README § The BLOCK model + § Leveling                | Matrix definition and linearization separated so the level homonym is resolved where the two vocabularies meet. The engine keeps a use-stub pointing up (landed with the re-point commit). |
| DOCS § BLOCK model, purpose 2 (audit)                  | REWORDED                              | README § The BLOCK model                             | Cross-register form: the audit claim is grid truth, not one engine's.                                                                                                                      |
| DOCS § BLOCK model, purpose 1 (filter) + consumer rule | STAYS ENGINE-LOCAL                    | — (restated register-neutrally in README § Leveling) | Per-cell filtering and the `levels`-vs-`block` consumer rule are the open engine's API contract.                                                                                           |
| DOCS § Orchestrator collateral (carried, unbuilt)      | PROMOTED                              | DOCS § Carried collateral                            | Human ruling 2026-08-11: durable home moves to the parent, superseding the 2026-08-10 socratizing-DOCS placement. The engine's DOCS keeps a pointer up (landed with the re-point commit).  |
| types.ts: `BlockDimension`, `BlockLevel`, `BlockCell`  | TRANSPORTED verbatim (JSDoc included) | types.ts                                             | The shared grid types. Removed from the engine's types.ts at the unification commit (imports the parent's, no re-export).                                                                  |
| types.ts: `Level`                                      | TRANSPORTED, 1 gloss reworded         | types.ts                                             | Human ruling 2026-08-11 (four-type hoist): the `userExperience` gloss "behavior audience" leaned on the engine-local PBSI/Audience frameworks; re-glossed framework-free.                  |

## Systematic rewords (listed once, applying throughout)

- Quarry-relative links (`../../orchestrate/…`, `../quizzing/…`) dropped or
  re-pointed to greenfield paths.
- `file:line` citations stripped (banned citation form in this repo).
- Casing normalized to "BLOCK model" (the engines' casing; the primary source
  writes "Block Model" — noted in the README glossary). No acronym claim is
  made.
- "question" as cross-register umbrella replaced by "item" (the open engine has
  an inner `Question` type two levels down; the umbrella collides).
- The engines' "M3 recommender" era-naming generalized to "a future recommender
  layer".
