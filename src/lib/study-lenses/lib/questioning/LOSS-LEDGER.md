<!-- cspell:ignore socratizing quizzing socratize Schulte unbuilt -->
<!-- cspell:ignore reenrichment linearization PBSI PBIS deixis -->
<!-- cspell:ignore Explorotron liminality foundationally denepo Cutts -->

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

| Source content                             | Disposition               | Destination                                            | Justification                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------ | ------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The section's grid-and-extension content   | TRANSPORTED near-verbatim | PEDAGOGY.md § The 3D Block Model space (via this DOCS) | Human ruling 2026-08-11 widened this stage's transport to include it. The `StepCategory` enum path citation is replaced by a prose reference; the `exercise-types.md` cross-reference and the `blanks`-lens worked example are transported. Landed first in this DOCS; relocated to the package pedagogy home by the PEDAGOGY.md transport (locked decision 8) — deviations in § Source: this directory's `DOCS.md` below. |
| The `RecommendationGrid` folding paragraph | OMITTED                   | —                                                      | Retired recommender mechanism (the grid structure, cell population rules) — the parent carries the space as documentation truth, not its data structure.                                                                                                                                                                                                                                                                   |
| The WS1/ROADMAP process paragraph          | OMITTED                   | —                                                      | Migration-era process narrative; end-state docs carry no status.                                                                                                                                                                                                                                                                                                                                                           |
| (newly authored)                           | ADDED                     | PEDAGOGY.md § The 3D Block Model space (via this DOCS) | The vocabulary bridge (space "Level" ↔ grid dimension; space "Scope" ↔ grid level) — the axis collision was previously implicit across documents.                                                                                                                                                                                                                                                                          |

## Source: this directory's `DOCS.md` § The 3D Block Model space (relocation to PEDAGOGY.md)

The section relocates to `src/lib/study-lenses/PEDAGOGY.md` (locked decision 8:
the space is kind-agnostic recommender truth, homed with the theory). The DOCS
heading stays, over a one-line pointer, so existing section citations keep
resolving. Deviations, under the relocation's explicit reword license:

| Source content                                        | Disposition | Destination                                                    | Justification                                                                                                                        |
| ----------------------------------------------------- | ----------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| The whole section body                                | MOVED       | PEDAGOGY.md § The 3D Block Model space (recommender extension) | Near-verbatim; deviations below.                                                                                                     |
| Opening transport/ruling-status sentence              | DROPPED     | —                                                              | End-state docs carry no status; the ruling record lives in SPEC decision 8 and the transport commit body (licensed drop).            |
| "(newly stated here, because the axis words collide)" | REWORDED    | same section                                                   | "newly stated here" is transport-status voice; the parenthetical keeps only the collision fact.                                      |
| "this region's `BlockCell`"                           | REWORDED    | same section                                                   | Region deixis false at package root — the questioning region is named explicitly (licensed fix).                                     |
| "No type for the 3D space is minted here"             | REWORDED    | same section                                                   | "here" shifted referent at package root — restated as "no type … exists in the package".                                             |
| "the deprecated recommender extended it"              | REWORDED    | same section                                                   | "the deprecated architecture's recommender" — the bare adjective dangled at package root.                                            |
| "(Schulte 2008)" in the opening sentence              | DROPPED     | —                                                              | The model and its citation are introduced two sections above in the same document; repeating the cite inside one page duplicates it. |

## Source: `spiralearn/frogramming-and-vibetoading/pedagogy.md` (PEDAGOGY.md transport)

The curriculum file stays live; rows cover deviations within transported
sections only. Sections transported: § SOLO applies within each layer, § L4 as
questioning, §7 The Explorotron framework, §8 Threshold concepts + liminality, §
PBIS, § PBIS through the metaphor, § Static vs Dynamic. Criterion: pedagogical
theory and its rationale transport; curriculum-delivery mechanics (chapter
structure, markdown rendering rules, authoring-process narration) do not — a
delivery fact transports only where it argues a stance (the L4 easter-egg
bullet).

| Source content                                                                                       | Disposition | Destination                                                  | Justification                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The listed sections' body prose and tables                                                           | TRANSPORTED | PEDAGOGY.md (respective sections)                            | Verbatim by default; deviations enumerated below.                                                                                                                                                                                                                                                                                                                                                     |
| PBIS letter-order (incl. bullet order and both "no canonical" paragraphs)                            | REWORDED    | PEDAGOGY.md § PBSI                                           | **The letter-order override**: PBSI is canon (typed source of truth `PBSILevel`), knowingly overriding the source's bolded "PBIS (canonical letter-order; NOT PBSI)" — human ruling 2026-08-12, recorded once in the transported treatment; every in-file spelling follows it.                                                                                                                        |
| § L4: "The chapter L4 LO bullets across the curriculum follow this form."                            | DROPPED     | —                                                            | A claim about the current state of the shifting curriculum files; the package copy cannot keep it true.                                                                                                                                                                                                                                                                                               |
| § L4: "(see ontology §6 _L4 by strand_)" and "(see _Architectural rules_ above)"                     | REWORDED    | PEDAGOGY.md § L4 as questioning, not theory-mastery          | Cross-file/section pointers resolved: the strand pairing is glossed in § The 5 layers; the parenthetical keeps the placement facts without the dead pointer.                                                                                                                                                                                                                                          |
| §7: pyramid labels "`<StudyLenses>` Layer I", "future work", "deferred at snippet scope"             | REWORDED    | PEDAGOGY.md § The pyramid                                    | Roadmap/era voice made timeless: territory statements instead of schedule statements.                                                                                                                                                                                                                                                                                                                 |
| §7: "The academic framework that `<StudyLenses>` realizes at snippet scope."                         | REWORDED    | PEDAGOGY.md § Meeting the learner: the Explorotron framework | Full Malaise & Signer citation + PDF link substituted (the package README's citation form); the applied two-scopes treatment stays in the package README, not restated.                                                                                                                                                                                                                               |
| (newly authored)                                                                                     | ADDED       | PEDAGOGY.md § Two axes, four quadrants                       | The guided quadrants' questioner/recommender affordance — human ruling 2026-08-11 ("can inspire a good questioner"), written as timeless prose and scoped per the package boundary (snippet-scope shape vs curricular-scope sequencing).                                                                                                                                                              |
| §8: "From `effective-learning/05-being-in-between.md` and Meyer/Land"                                | REWORDED    | PEDAGOGY.md § Threshold concepts and liminality              | The cited path is stale, but the material lives in-repo at `spiralearn/welcome-to-programming/-1-getting-started/to-use/study-tips-inspiration/denepo-05-being-in-between.md` (AR-1 catch — the first justification here over-generalized a too-narrow `find`); attribution restored dual: Meyer & Land for the framework, the curriculum's study-tips material for the list and the liminal framing. |
| §8: "cited by the user"                                                                              | REWORDED    | PEDAGOGY.md § Threshold concepts and liminality              | Authoring voice; the list survives as "an incomplete list".                                                                                                                                                                                                                                                                                                                                           |
| § PBIS through the metaphor: "From `narrative/README.md` §15" + "Perspective stacking (ontology §7)" | REWORDED    | PEDAGOGY.md § PBSI — flexible vocabulary, not a sequence     | Curriculum cross-file pointers resolved to prose ("the curriculum's perspective-stacking practice … performance metaphor"); "through the metaphor" heading reworded — "the metaphor" dangled at package root; "all four layers" → "all four scopes" (disambiguation against the L0–L4 layers).                                                                                                        |
| § Static vs Dynamic: "(Ch0 introduces it, on the greeter)"                                           | DROPPED     | —                                                            | Chapter deixis; the distinction is stated foundationally.                                                                                                                                                                                                                                                                                                                                             |

## Source: `spiralearn/frogramming-and-vibetoading/ontology.md` (PEDAGOGY.md transport)

Sections transported: §5 The 5-tier ATT, §6 The 5 layers (summarized around the
L4 anchor), §13 Computational vocabulary axes (inclusion judged — it grounds the
3D space's third axis; the judgment is recorded in the transport commit body).

| Source content                                               | Disposition | Destination                                 | Justification                                                                                                                                             |
| ------------------------------------------------------------ | ----------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §5 tier table, bridging practices, artifact-speak faces      | TRANSPORTED | PEDAGOGY.md § The 5-tier ATT                | Verbatim by default; "§3" pointers into the ontology resolved to inline glosses (chain-points, trading zone); "this course" → "the curriculum" (×2).      |
| (newly authored)                                             | ADDED       | PEDAGOGY.md § The 5-tier ATT                | One sentence mapping V/F to the package's Vibetoader/Frogrammer hats — bare "V"/"F" are undefined at package root.                                        |
| §6 L0–L4 table, exit-point framing, intellectual-agency note | TRANSPORTED | PEDAGOGY.md § The 5 layers                  | The table is load-bearing for the 5×5 SOLO reading, `Level.userExperience`, and L4-as-questioning — transported verbatim.                                 |
| §6 agency blockquote's guides sentence                       | DROPPED     | —                                           | "connects the layers to the guides (`guide.{…}.md`)" — curriculum-file pointer with no package referent.                                                  |
| §6 L4-by-strand table                                        | SUMMARIZED  | PEDAGOGY.md § The 5 layers                  | One sentence naming the five strand-to-tradition pairings; the full open-ended table lives with the curriculum (summarized-around-the-L4-anchor mandate). |
| §6 per-layer data-thread table                               | OMITTED     | —                                           | The red thread is curriculum narrative apparatus, not theory a study utility consumes.                                                                    |
| §6 substrate-is-not-inert note                               | OMITTED     | —                                           | An embody design claim, not layer theory; embody's own docs carry the substrate stance.                                                                   |
| §6 layer-architecture rendering-rules blockquote             | OMITTED     | —                                           | Markdown-rendering rules for the curriculum's chapter files; not package theory.                                                                          |
| §13 axes table, orthogonality test, JS-one-NM subsection     | TRANSPORTED | PEDAGOGY.md § Computational vocabulary axes | Verbatim by default.                                                                                                                                      |
| §13 table's "In F&V" column                                  | DROPPED     | —                                           | Chapter-sequencing cells (Ch0–Ch4) — curriculum deixis with no package referent.                                                                          |
| (newly authored)                                             | ADDED       | PEDAGOGY.md § Computational vocabulary axes | One sentence linking one-NM to the 3D space's unordered third axis — the structural reason §13 earns its place in the foundation.                         |

## PEDAGOGY.md transport — systematic rewords and authored apparatus

- Section headings de-`§`-ed and reworded for a package-root register;
  enumerated: "SOLO applies within each layer (not across)" → "(not across)"
  dropped; "§8 Threshold concepts + liminality" → "Threshold concepts and
  liminality"; "Static vs Dynamic" → "Static and dynamic"; "§7 The Explorotron
  framework" → "Meeting the learner: the Explorotron framework"; "§5 The 5-tier
  ATT" and "§6 The 5 layers" → `§` numbers stripped; "JS as multi-paradigmatic
  over one NM" demoted from heading to bold lead-in.
- Curriculum deixis normalized throughout: "this course" → "the curriculum";
  chapter references (Ch0–Ch4) dropped or glossed.
- Navigation and bridging apparatus authored at the destination (ADDED): the
  linked contents list; the dimension-sense bridge sentence in § The model; the
  language-level note in § Three vocabularies, two axes; the ATT primary-source
  citation with the three-vs-five tier distinction (Cutts et al. 2012 names
  three levels; the five-tier extension is the curriculum's); the SOLO
  conceptual-integration gloss.
- § The BLOCK model of program comprehension is authored at the destination,
  drawing on `references/README.md`'s Schulte entry and this directory's README
  § The BLOCK model + § Leveling; the dimension/level gloss tables are copied
  verbatim from this directory's README; the 12-cell gloss table and the
  three-vocabularies lineage table are newly authored. No source content was
  removed.

## Owed forward (burn-down)

| Debt                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Owed to                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| This directory's README (§ the glossary's "3D Block Model space" entry, and the lead's "documented in DOCS.md") still describes DOCS.md as the space's home; the home is now PEDAGOGY.md, reachable through the kept DOCS heading's pointer.                                                                                                                                                                                                                   | The questioning-DDD session (session 2) trims the README against PEDAGOGY.md.        |
| The dimension/level gloss tables now exist in both PEDAGOGY.md and this README.                                                                                                                                                                                                                                                                                                                                                                                | Same session — the README trim.                                                      |
| The package README § Pedagogical grounding and PEDAGOGY.md § Meeting the learner both carry the Malaise & Signer citation and figure; the README's principle bullets are the package's applied renderings (its intro line now says so — human-licensed edit, 2026-08-13) while PEDAGOGY.md carries the paper's own triple. Full reconciliation (which copy keeps the figure; an explicit applied-to-paper principle mapping; any pointer) is tier-wiring work. | The questioning-DDD session (session 2), which owns discovery wiring to PEDAGOGY.md. |

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
