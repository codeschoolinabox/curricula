<!-- cspell:ignore quizzing socratizing unshadowed mcq distractor -->
<!-- cspell:ignore unbuilt reassignability gradable pointered injectivity gradability cloneability -->

# Loss ledger — the Stage-3 quizzing transport

The enumerated deltas of the quizzing port: every omission, merge, and
reword between the read-only quarry
(`src/lib/study-lenses--deprecated-architecture/lib/quizzing/`) and this
module, each with its justification — per
`DEV.md § Documentation migration discipline`, and owed by the parent
ledger's scope sentence ("the Stage-3 quizzing-docs transport owes its
own ledger in its own directory"). This file is the port's durable
transport record: the Phase-0 and unit commit bodies point here rather
than restating rows. A row that later proves wrong is corrected in
place; the file retires only by a future ruling that re-homes its
content.

Quarry citations use test TITLES and heading names, never line numbers
(the quarry's line numbers moved under a sanctioned prettier sweep once
already). Baseline blobs at port time: `types.ts`
`95036259`, `resolving/types.ts` `669eaa86`, `context/types.ts`
`05651e72`, `generators/types.ts` `a605fcc2` (short SHAs; full values in
the Phase-0 commit body).

## A. The realm excision (locked decision 4 — dropped, not deferred)

The campaign ruled the port realm-free (maintainer, 2026-07-22): the
provenance and value-category forms read the removed embody realm phase.
Port-time completeness (Q12) was measured: `RealmBindingData` and
`read-realm-binding` importers are confined to the quarry quizzing realm
surface plus the live legacy `embody/types.ts`; no register lib beyond
them couples to the removed phase.

| Item | Disposition | Justification |
| --- | --- | --- |
| `generators/v3-provenance.ts` | not ported | realm form (decision 4) |
| `generators/v5-value-category.ts` | not ported | realm form (decision 4) |
| `keying/realm-group-key.ts` | not ported | the `realm:` axis retires with its forms |
| `realm/read-realm-binding.ts` (+ the `realm/` dir) | not ported | the curated realm table served only V3/V5 |
| `tests/v3-provenance.test.ts`, `tests/v5-value-category.test.ts`, `tests/read-realm-binding.test.ts`, `tests/realm-group-key.test.ts` | not ported | whole-file oracles of the dropped forms |
| `tests/generate-quiz.test.ts`: `'V3'` in three expected generator sets + the four realm end-to-end tests ("fires V3 realm provenance end-to-end for a bare intrinsic global", "keys V3 on the binding axis when a program decl shadows a realm name", "fires V5 value-category end-to-end…", "stays silent (no V5) when a program decl shadows a realm name") | surgically excised | realm-coupled assertions cannot re-green realm-free; every non-realm assertion in the file stays live |
| `generators/registry.ts` header: the mid-sentence realm clause ("the realm forms V3 (…) and V5 (…), both reading the realm shim, and") + the V3/V5 imports + two array entries | surgically excised | decision 4; the adjoining V4-fires-last rationale is KEPT verbatim |
| The seven-axis group-key grammar | becomes six | the `realm:` axis retires; the six survivors and their non-prefixing law are unchanged |
| V3's dual-axis rule (program-declared occurrence keys `binding:<decl>`, realm occurrence `realm:<name>`) | dropped with V3 | prose inside the carried groupKey decision; excised from the DOCS § Decisions transcription |
| **Anti-loss** — V4's two learner-copy "realm" mentions ("block → script → realm" feedback prose) | KEPT verbatim | campaign ruling Q7: leave |
| **Anti-loss** — the `element-type:`-inline-key convention, recorded in the dying realm-group-key header | RE-HOMED to DOCS § Decisions | live canon must not die with a dropped file |

## B. The Snippet→Facts rewires (behavior-preserving, per file)

The engine's input contract moves from the legacy `Snippet` to greenfield
`Facts`. Remap: `status.parsed` → `facts.tokens.ok && facts.ast.ok`;
`raw.ast → facts.ast.value`; `raw.tokens → facts.tokens.value.tokens`;
`source.code → facts.source.value`; the scope surface → the `resolving/`
projection over `facts.environment` (§ C).

| Item | Disposition | Justification |
| --- | --- | --- |
| `types.ts` | conformed in seven enumerated classes at Phase 0; the gate round (2026-08-18) added (8) the envelope grading surface (`QuizzingGrader`; `QuizzingAnswer.grade`) and (9) the `AnswerMode` JSDoc openness reword — both design-reviewed rule amendments in their own commits | (1) header reword — Snippet residue + borrowed-vocabulary paragraph re-pointed; (2) `import type { Facts, NodePath }` from greenfield embody; (3) `BlockCell` from the parent `../types.js` — NEVER from socratizing (the leaf-import ban is unqualified; the quarry's cross-engine import does not reproduce); (4) `Category`/`ClassifiedToken` from `../../classifying/types.js`; (5) `GenerateQuiz` first param `Snippet → Facts`; (6) JSDoc corrections — the false "applies `filter`" and "source-ordered" clauses struck (Stage-3 AR-1 blocker: the quarry doc promised both; the code does neither — `run-generators` is a flatMap and the filter is a no-op), `QuizFilter.range` doc flipped to zero-indexed half-open offsets (human ruling 2026-08-18), the `(snippet, …)` determinism tuple re-lettered; (7) the appended envelope-types section (`QuizzingAnswer`, `QuizzingConfig`) — new, beside the ported contract |
| `context/types.ts` | conformed | `ScopeAnalysis` import → local `ScopeForest` (`../resolving/types.js`); classifying depth `../../` → `../../../`; two phase-number cross-references generalized to "§ Execution phases" |
| `context/descend-identifiers.ts` | conformed (U1) | one class: the `@file` header's stale "Phase 2 of the quizzing generation context" generalized to "the anchor-stream half of the quizzing generation context" — the quarry's phase 2 split into the greenfield forest + context phases, so the bare number went wrong; the "§ Execution phases" pointer unchanged. Otherwise byte-identical to quarry blob `800e5540` (no import re-points needed: `acorn` + `./types.js` resolve identically) |
| `grade.ts` | conformed (U2) | one class: a cspell in-file ignore prepended (`// cspell:ignore unbuilt` + blank line) — the sole delta vs quarry blob `8d07663c` [measured at the wave seam: diff vs the quarry blob → `0a1,2`]. No import re-points: the `@utils` alias and `./types.js` resolve unchanged |
| `keying/classification-group-key.ts` | conformed (U3) | one class: import re-point `'../../classifying/types.js'` → `'../../../classifying/types.js'` (greenfield depth from `keying/`) — the sole delta vs quarry blob `7ef73ebd` [measured at the wave seam: diff = exactly that line]. The other four keying sources are byte-identical (no rows owed) |
| `generators/types.ts` | conformed | classifying depth; "Phase 3" cross-reference → "the run phase" |
| `resolving/types.ts` | re-authored around the carried pair | `Binding` + `Occurrence` port verbatim; their JSDoc's `DeclarationInfo`/`buildScope`/B→C-swap/`status.parsed` references reworded to `TrackedDeclaration`/the projection/parse-gate phrasing; the minted forest types are new (§ C) |
| The 22 oracle fixture files importing legacy embody | rewired at staging | the `'../../../../embody/index.js'` import string is byte-identical by depth (it now resolves to greenfield embody); `import type { Snippet }` → `Facts`; fixtures destructure `.facts`; the per-file classify helper reads `facts.source.value` / `facts.tokens.value.tokens` / `facts.ast.value`; classifying import depth `../../` → `../../../` |
| `FAIL_AT_PARSE` (three files: `build-context`, `generate-quiz`, `read-scope-forest` tests) | replaced with the genuinely unparseable `'let = ;'` | the magic scenario is a legacy-embody affordance greenfield deliberately lacks; the socratizing suite set the precedent |
| Engine throw-message wording | reworded within the pinned regex | the oracle pins `/parsed\|unparsed\|ast/i`; the message now speaks facts vocabulary |
| The engine gate | widened to conjoin the environment stage (AR-2 resolution, 2026-08-18) | the prior architecture's scope walk could not fail on parsed input; the greenfield environment stage can (loudly-reported embody-defect class); no oracle pin exercises the arm, and gating it keeps the public entry total over its widened input surface |

## C. The shim (ruling R-6 realized)

| Item | Disposition | Justification |
| --- | --- | --- |
| `resolving/read-scope-forest.ts` body: `buildScope(ast)` over the live legacy walker | replaced by the `facts.environment` projection | locked decision 1 (facts.environment is the scope source); this discharges the quarry's own documented Class-B body-swap seam — the accessor name and every caller survive |
| Forest shape source | the AST (Program / every BlockStatement except a for-of body / every ForOfStatement) | eslint-scope materializes no block scope for a function body, so a graph-derived forest either drops or hoists function-body `let` — either silently changes the R-6 pedagogy; measured at design review |
| Tracked-set filter | declarator-id identity (`def.node.type === 'VariableDeclarator' && def.node.id === def.name && def.kind ∈ {var,let,const}`) | a kind-only filter admits destructuring pattern bindings the quarry never registered (R-6's universal null-outside-the-set rule) |
| `ScopeAnalysis` / `ScopeInfo` / `DeclarationInfo` names | NOT carried — minted as `ScopeForest` / `ForestScope` / `TrackedDeclaration` (+ `ForestScopeKind`) | human ruling 2026-08-18 (Stage-3 AR-1): two live embody homonyms + a tracer third; `lib/scoping` recorded a ruling against `DeclarationInfo`; the rename is oracle-free (no shim test imports a type name) |
| `DeclarationInfo.initNode` / `.readCount` / `.writeCount` / `.scopeDepth`; `ScopeAnalysis.allDeclarations` | dropped | zero consumers in quarry quizzing source or tests (measured at design review); reproducing legacy counting semantics from eslint-scope references would be new unverifiable behavior |
| `resolving/resolve-binding.ts` | ports verbatim + two mechanical conforms | the type-import re-point to `./types.js` and the type-name substitution; the walk (deepest-scope descent → climb → project) is byte-faithful |
| Three unpinned edges | declared, kept quarry-faithful | `var` registers lexically; same-scope redeclaration is last-wins; the for-of body block folds — DOCS § Where scope comes from; changing any is a ruling, not a drift |

## D. Docs re-authoring (quarry README + DOCS → this module's)

End-state docs are re-authored, never byte-copied (the quarry docs carry
`Snippet.raw`/`status.parsed` residue and pre-family framing). Walk of
every quarry heading:

### Quarry README.md

| Quarry heading / content | Disposition | Justification |
| --- | --- | --- |
| Lead ("statically decidable … the closed, gradable complement") | re-authored | the closed charter is now the parent's **machine-gradability**; "static decidability" survives as THIS engine's mode word (family reword, 2026-08-18); register framing points up |
| § Glossary: QuizItem, Generator, generateQuiz, grade, Verdict, LearnerResponse, Answer mode, Group key, Sameness unlock, Occurrence→binding, Anchor/anchorRange, Category/Role | carried, conformed | Snippet→facts rewording; the Group-key entry drops the realm axis (§ A) and gains the axis-list layout; generateQuiz's "source-ordered" corrected (AR-1); anchorPath honesty reword (greenfield paths withdraw injectivity) |
| § Glossary "Form", "Family" definitions | Family carried with the ×2 homonym clause added; Form pointered up | the parent glossary owns the family-level terms (form, item, cell, register…); duplicating them is the drift the family forbids |
| § Glossary "Curated bank vs generated": "The bank is bounded because JEJ's concept set is finite" | REWORDED — the bank is UN-bounded; `serves` is the serve-this-code test | locked decision 9 (human ruling 2026-08-11); the provenance distinction and the compile-time-table mechanism survive |
| § The Block-Model homonym (BlockCell vs BlockModelCell) | pointered up | the parent glossary carries the forward guard; `BlockModelCell` does not exist in the greenfield tree |
| § The question catalog | re-authored by BLOCK cell with measured cells/modes per form | parent § Taxonomies owns the catalog frame; the "finite because JEJ is finite" clause drops (decision 9); the off-repo campaign-plan appendix pointer drops (planning history, not end-state) |
| § Bounded context | split | the register boundary points up (parent § The two registers); the static-decidability criterion becomes the lead's Ground-truth mode; the V13/V14 static-walk sentence survives under future forms |
| § What lives here | re-authored to the actual port tree | the quarry tree was aspirational (its `filter-quiz-items.ts` was never built); the port tree is actual and includes the envelope, twins, and this ledger |
| § Public API | carried, conformed | input asymmetry reworded to facts + the envelope's composition; the lead's false "applies the filter … source-ordered" corrected (AR-1); grading one-sided carried; behavior bullets carried with the Ordered bullet stated mechanism-first |
| § What this module explicitly does NOT do | carried + extended | realm row added (decision 4); JEJ-gate row added (Q4 is Stage-5's); "No blanking … the blanks lens" dropped — no greenfield blanks consumer exists; "No recommender mapping (BlockCell → BlockModelCell)" dropped — the type is gone, the parent guard covers a return |
| § Consumers | re-authored | the quarry named the M3 quiz lens as the live consumer; greenfield names the unbuilt Stage-5 lens + the family roster via the envelope |
| § Why this module exists | carried | registers paragraph pointered up |
| § Conventions | carried + extended | read-bound (family law) and the `lib/scoping` non-reuse rows added (AR-1); "no embody(), no Snippet construction" folded into the Public API behavior bullets |
| § Navigation | re-authored | greenfield targets; the socratizing deep-import row (BlockCell source) retires — the parent owns the type; the lenses/types `BlockModelCell` row retires with the type |

### Quarry DOCS.md

| Quarry heading / content | Disposition | Justification |
| --- | --- | --- |
| § Why this module exists | carried | register clause pointered up |
| § Architectural sketch preamble + one-sided-seam paragraph | carried | + the envelope sentence (the wrap in front of the content entry) |
| § Execution phases | carried, re-phased | the quarry's phase 2 splits into the named forest phase + the context phase (the projection is architecture now); the quarry's phase 4 "Filter by config" DROPS as a live phase — it described machinery that was never built; its post-generation placement rationale survives as the future landing note in phase 5 |
| § Grading — grade.ts | carried | Snippet→facts rewording |
| § The accessor-helper seam (the Class A/B/C table) | SUPERSEDED | the discipline sentence survives (§ Structural constraints, "Reads through the accessor seam"); the Class-B scope row is discharged by the projection (§ Where scope comes from); the realm-shim row drops (§ A); the Class-C rows dissolve — `facts.environment` exists, and the legacy `CreationEntwined.scopeTree` / `byOffset` surfaces are gone with the Snippet (SPEC § Terms: `scopeTree` was a pre-greenfield placeholder) |
| "`byOffset` is never consulted" constraint + its rationale | dropped | no such surface exists on Facts; click→token resolution is a consumer concern |
| § Data flow (Mermaid) | re-drawn | the consumer/orchestrator M3 frame becomes the envelope frame; the family's dotted-refusal convention joins; the engine's throw is drawn as its own edge (the seam split) |
| § Structural constraints | carried, minus the byOffset row | + envelope-composes, accessor-seam, non-prefixing, and registry-authority rows |
| § Out of scope | carried, conformed | realm row rewritten dropped-not-shimmed; recommender row dropped with the type; "configuration beyond filter" folded into the filtering row |
| § Decisions | carried entry-by-entry into DOCS § Decisions, each labeled "(carried)" | realm-coupled clauses inside carried decisions excised (the groupKey decision's `realm:` axis sentences, V3 dual-axis prose — § A); the false ordering claim corrected with its own dated decision row; new dated rulings appended (offsets, forest names, TConfig, Q13, both-public, anchorPath, seam split, trim) |

## E. Carried, not lost (vacancies with named dependencies)

| Item | Status | The dependency |
| --- | --- | --- |
| The `QuizFilter` build | declared, not consumed (oracle-pinned no-op) | a recorded future design event; the `range` arm is offset-native by ruling, so no offsets→lines utility is needed for it |
| `multi-mcq` | enumerated, not built | its generator; grading's set-equality already handles it |
| `click-line` generation | graded, not generated | an offset→line read no greenfield fact supplies |
| `anchorPath` construction | declared on the base type, constructed by no form | the future node-anchored form; the constructor rule is a DOCS § Decisions row |
| Future forms V9 shadow, V12 binding-identity, V13 value-at-a-point, V14 lookup-depth | design canon, unbuilt | all inside the static mode (a static scope walk) |

## The gate round (2026-08-18): envelope amendments

Post-Phase-0-commit rulings at the held gate (design-reviewed; the plan
carries the review):

| Content | Disposition | Justification |
| --- | --- | --- |
| `QuizzingAnswer` | gains `grade: QuizzingGrader` (class 8) | human ruling: the answer carries the grading surface; value = the sync engine grade, type = async-capable (deferred-but-deterministic admitted); non-cloneability and same-tick guidance recorded in DOCS § Decisions |
| `AnswerMode` JSDoc "The full end-state vocabulary" | REWORDED (class 9) | overstated closure; today's vocabulary, additive-open — DOCS § Decisions row amended on the row |
| An extension item variant | CONSIDERED AND DECLINED | openness = additive built modes + new questioners (family TAnswer + async ask); a typed doorway admitted keyless items and collided with the parent charter's "open mode" word — measured at review |
| README § Conventions "Pure-sync only" | AMENDED | the engine stays pure-sync; the envelope's carried-grader TYPE admits deferral |
| ux Q1 "The verdict is immediate" | REWORDED | immediacy is the engine path's property; the carried-grader path awaits |

## Owed forward

| Owed | Where it lands |
| --- | --- |
| The LIBRARY-CONTRACTS **[S3]** cluster promotion (cluster bodies → this module's README/DOCS; one-line pointers left behind; the 17-vs-22 `resolve-binding` test-count erratum noted) | U11, campaign close |
| Parent `DOCS.md § The closed register's conformance` retitle + the inverted "exposes only the envelope" connective fix | U10 (parent-file edit, human-authorized via the approved plan) |
| A parent-glossary "family" homonym entry (questioner family vs `Family`) | U10, same parent pass |
| A `lib/scoping` README back-pointer to this module's forest (the deliberate-duplication cross-reference) | a future session; out of this changeset |
| The parent ledger's Owed-forward row recording the human's socratizing-twins intent ("socratizing will be the same when we get there", 2026-08-18) | U11, parent-ledger edit |
