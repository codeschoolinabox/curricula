<!-- TRANSITIONAL — this spec is the in-repo forward canon for the
question-register lens campaign (human rulings 2026-08-05/06, inline
below). Retire a section only when the stage that consumes it lands and its
own module docs carry the content; retire the file only when Stages 3, 4,
and 5 have all landed — EXCEPT § Orchestrator collateral, which is
promotion-only (human ruling 2026-08-10) and retires only into its durable
home, the carried-unbuilt note in lib/socratizing/DOCS.md; see that
section's preamble. -->
<!-- cspell:ignore socratizing socratize quizzing reenrichment stonebraker -->
<!-- cspell:ignore unbuilt subgraph relitigate PBSI bannered bannering -->
<!-- cspell:ignore repoint readwrite Behaviour unleveled rebuilder distractor -->
<!-- cspell:ignore dispositioned blankable narrowings -->

# Question-register lenses — forward canon (re-homed)

The forward plan for the two question-register lenses (`socratize`, `quiz`) and
their engines, transported in-repo from
`~/.claude/plans/read-and-execute-the-indexed-pony.md` (previously the canonical
plan), `…-the-playful-stonebraker.md`, and
`…/supplement-indexed-pony-scope-gotchas.md`. **The transport is the human's
re-home ruling** (human ruling 2026-08-05/06, extended 2026-08-06 to the
supplement when review surfaced it): the still-live content of all three
off-repo files moves in-repo in full, and the off-repo files become bannered
history. All three carry RE-HOMED banners as of 2026-08-06 [measured: head -8 on
each after bannering]; **this file is the canon.** Omissions from the transport
are enumerated in [LOSS-LEDGER.md](./LOSS-LEDGER.md). Governance outranks this
spec: `CLAUDE.md → AGENTS[.principal].md → DEV.md`.

## Terms (disambiguation a Stage-3/4/5 executor needs on day one)

- **register** is used three ways: (1) the pedagogical **open/closed register**
  distinction between the two lenses; (2) the inner **`Question.register`** rung
  `open | pointed | comparative` (the Feedback Ladder); (3) **roster
  registration** of a lens in `built-in-lenses.ts`. The old outer
  `register: 'open'` item filter is DELETED with the orchestrator — with no
  orchestrator, every `analyzeMicroDecisions` item is already the open register;
  only sense (2) survives in socratize code.
- **`buildScope` is a three-way homonym**: the legacy
  `src/lib/embody/lib/scope/build-scope.ts` (`ScopeAnalysis`, ~401 lines — what
  the adapters replace); the unrelated JEJ `language-levels/jej/build-scope.ts`
  (`HoistingModel` — ignore it); and the quarry quizzing migration note naming a
  `CreationEntwined.scopeTree` placeholder (pre-greenfield; `facts.environment`
  supersedes it — ignore the `scopeTree` term when reading quarry `resolving/`
  files).
- **`lib/questioning/` is NOT the question-orchestrator revived** (locked
  decision 5): the parent region is a shared DOCUMENTATION + TYPES home
  (Block-Model grid, taxonomies, leveling) — it composes nothing, runs nothing.
  No `composeQuestions`, no cross-register co-anchoring; the two engines inside
  it stay independent (locked decision 3 stands untouched).
- **Three embody-named trees**: `src/lib/embody/` is the LIVE legacy
  `embody(code) → Snippet` the quarry libs import from (`../../../../embody/…`);
  `src/lib/study-lenses/embody/` is the greenfield Facts embody (the target);
  `src/lib/study-lenses--deprecated-architecture/` is the read-only quarry (the
  port sources). A grep finding `buildScope` / `get-child-nodes` /
  `RealmBindingData` "alive" is seeing legacy tree #1 — the migration is a
  re-point (stop importing `src/lib/embody/`, derive from greenfield `facts.*`),
  not a resurrection.

## What is being built

Two independent greenfield **lenses**, each consuming its engine directly — **no
shared orchestrator**:

- **`socratize`** — the **open / Socratic** register: reflective, program-level
  "why is it written this way?" questions a human judges. Consumes
  `lib/socratizing`.
- **`quiz`** — the **closed / gradable** register: analytically verifiable "what
  kind of element is this?" questions a machine grades, with mastery. Consumes
  `lib/quizzing` (+ `lib/classifying`).

The engines are pure and decoupled from embody (analyzers/generators walk raw
acorn nodes), so engine work is a **port**, not a rewrite — the source plans
sized it at ~15k LOC copying near-verbatim; the real work is a thin per-engine
adapter to the greenfield **Facts** model. This mirrors how `engine` and
`local-llm` migrated (copy → conform to the new contracts → repoint).

## The quarry is READ-ONLY

The prior architecture at `src/lib/study-lenses--deprecated-architecture/` is a
byte-identical reference. Never modify, move, or delete under it. Migration =
read the quarry, write new code into `src/lib/study-lenses/`. One sanctioned
exception on record: the maintainer's own prettier drift sweep (`59043f52`)
reformatted quarry docs [measured: `git show --stat 59043f52` → 48 quarry files]
— an authorized maintainer action, not a breach; line-number citations into
quarry docs from before that sweep were re-validated after it, and quarry
citations here use test TITLES, not line numbers, for exactly this reason.

## Locked decisions (maintainer-ratified 2026-07-22; do not relitigate)

1. **Greenfield `facts.environment` is the scope source** (not a vendored
   `buildScope`). Engines read scope through a small adapter projecting
   `facts.environment` onto the shape each consumes. Behavior parity is proven
   by the ported tests (the oracle). See § Scope adapter — and for quizzing, the
   R-6 occurrence-class ruling in
   [LIBRARY-CONTRACTS.md](./LIBRARY-CONTRACTS.md).
2. **Offset-native locations.** The quarry's `extract-location` read `node.loc`
   (line/col); greenfield `derive-ast` parses `ranges: true` without
   `locations`, so the port flips to `node.start`/`node.end` and
   `CodeQuestion.location` is an offset range. **Landed with Stage 2**
   [measured: `grep -rn '\.loc\b' src/lib/study-lenses/lib/socratizing/` → 1
   hit, a test comment proving the no-`.loc` read]. Quiz anchors were already
   offsets — non-issue there.
3. **Two lenses, no orchestrator.** No `question-orchestrator`, no
   `composeQuestions`, no cross-register co-anchoring. Each lens is a standalone
   greenfield `Lens` consuming its engine directly. What the retirement did NOT
   discard — the difficulty ladder, the coverage instrument, the one-grid goal —
   is carried by § Orchestrator collateral, ruling R-3.
4. **Quiz ports full-fidelity but REALM-FREE** (dropped, not deferred): no
   generators V3 (provenance) + V5 (value-category), no
   `keying/realm-group-key.ts`, no `realm/read-realm-binding.ts`, no
   `RealmBindingData` type-import. Everything else ports faithfully (all answer
   modes; generators V1/V2/V4/V6/V6b/V7/V8/V10a–c; mastery + two-channel
   decorations + earned propagation; the config filter). V4 names "realm" only
   in learner copy (Q7: leave). Excision warning: the realm clause sits
   mid-sentence in the registry header adjoining the V4-fires-last rationale —
   excise surgically, keep the rationale
   ([LIBRARY-CONTRACTS.md](./LIBRARY-CONTRACTS.md)).
5. **The two question engines share a parent region: `lib/questioning/`** (human
   ruling 2026-08-11: "they should both be subdirectories in a shared directory
   under lib/ … one source of truth documentation in their shared parent for the
   3D block model, taxonomies, and leveling (which should be deeply rich, copied
   from the deprecated architecture), but have their own logic for open vs.
   closed questions"; the name was delegated and resolved to `questioning` —
   gerund-convention, zero greenfield collisions [measured: `git grep -in
   questioning` over `src/lib/study-lenses` excluding the quarry → 0 hits]). The
   parent carries the shared documentation + the shared `types.ts` (Block-Model
   cells, taxonomies, leveling); `lib/questioning/socratizing/` and
   `lib/questioning/quizzing/` keep their own open/closed logic. A dedicated
   upstream session (the questioning-parent stage,
   `~/.claude/plans/questioning-parent-region-handoff.md`) drafts the shared
   documentation and executes the socratizing move BEFORE the two engine streams
   proceed. This supersedes Q2's landed placement; the collateral's durable home
   (the socratizing DOCS note, human ruling 2026-08-10) moves with the file —
   the questioning-parent stage owns the re-point pass, including the
   MVP-ROADMAP citation.

## Resolved questions (Q1–Q14 — answers are rulings, cite before deviating)

Every still-open row below is per-stage material ratified at the named stage's
AR-1; no BLOCKING-tier question remains (the source plan's A-tier —
Q1/Q8/Q13/Q14 — all resolved 2026-07-22).

| Q   | Resolution                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Quizzing (Stage 3) belongs to THIS campaign line — the M2 quizzing stream is CLOSED and handed over (maintainer, 2026-07-22). The supplement's "live M2 owner — coordinate" note predates this and is superseded.                                                                                                                                                                                                                  |
| Q2  | ~~`socratizing` lives at `lib/socratizing/` (peer engine)~~ — landed there at Stage 2, then SUPERSEDED by the shared-parent ruling (human ruling 2026-08-11, locked decision 5): both question engines become subdirectories of `lib/questioning/`; socratizing MOVES to `lib/questioning/socratizing/` in the questioning-parent stage.                                                                                           |
| Q3  | Scope read/write derivation. The source plan's default was "recompute from the AST inside the adapter"; **what landed is its named cleaner alternative** — embody classifies each reference's access, and the adapter only tallies (§ Scope adapter). The AST-recompute rule is dead.                                                                                                                                              |
| Q4  | Quiz gate = JEJ `validate` over projected `facts.environment → unresolvedReferences` (candidate `environment.root.through`, refs with `resolved: null`). Ratify at Stage-5 AR-1: the type match, the path-less-reference arm (`ScopeReference.path` is optional; `UnresolvedReference.nodePath` required), AND the gate budget — `validate` walks the whole AST while the lens kind bans derived-model construction inside a gate. |
| Q5  | socratize `phase: 'source'` — teaches the text surface, reads the AST.                                                                                                                                                                                                                                                                                                                                                             |
| Q6  | `disclosure: 'all'` = define the field only; defer the render mode (with a WHY-comment).                                                                                                                                                                                                                                                                                                                                           |
| Q7  | V4's "realm" in learner copy: leave.                                                                                                                                                                                                                                                                                                                                                                                               |
| Q8  | `classifying` public shape frozen byte-identical (`ClassifiedToken = {text,start,end,categories,role,partner}` + `Category`) — it also feeds the future `blanks` lens. Landed.                                                                                                                                                                                                                                                     |
| Q9  | ~~indexed-pony is the canonical plan~~ — superseded by R-1: THIS file is the canon.                                                                                                                                                                                                                                                                                                                                                |
| Q10 | First move was Stage 1 bottom-up. Executed.                                                                                                                                                                                                                                                                                                                                                                                        |
| Q11 | Intake housekeeping. Executed 2026-07-22.                                                                                                                                                                                                                                                                                                                                                                                          |
| Q12 | Realm-removal completeness: confirm at Stage 3 that no register lib beyond quizzing's V3/V5/realm couples to the removed embody realm phase.                                                                                                                                                                                                                                                                                       |
| Q13 | ~~One shared adapter imported by both engines~~ — superseded in part by R-6: the Stage-2 `lib/scoping` leaf serves socratizing, but its `{let, const}` filter makes it unusable as-is for quizzing (which needs `var`). Quizzing gets its own R-6-constrained shim; its landing site (inside `lib/quizzing/` vs a second `lib/scoping` export) is a Stage-3 AR-1 decision.                                                         |
| Q14 | Stage-4/5 lenses are sandbox-verified by reusing the existing lens dev surface (writeme/parsons); the span-pick surface is the open Stage-4 build question.                                                                                                                                                                                                                                                                        |

## Campaign stages — measured status and remaining scope

Status measured 2026-08-06 [measured: `ls src/lib/study-lenses/lib/` → DOCS.md,
README.md, classifying, engine, local-llm, loop-guard, scoping, screening,
socratizing; `ls src/lib/study-lenses/lenses/` → DOCS.md, MIGRATION-PLAYBOOK.md,
README.md, agent-lenses.concept.md, debug-props, lib, parsons, types.ts,
writeme].

| Stage | Lib              | Greenfield home     | Status       | Remaining scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----- | ---------------- | ------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `classifying`    | `lib/classifying/`  | **COMPLETE** | — (landed `21f871bd`/`83520c77`/`c935ef59` [measured: `git rev-parse` on each]; public shape frozen per Q8)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2     | `socratizing`    | `lib/socratizing/`  | **COMPLETE** | — (engine 361 tests + `lib/scoping` adapter 35 tests [measured: `./node_modules/.bin/vitest run --project unit` per dir, 2026-08-06]; offset flip landed)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 3     | `quizzing`       | `lib/quizzing/`     | unbuilt      | Realm-free port (decision 4) from quarry `lib/quizzing/`. Port the rest verbatim; quarry tests are the oracle. Scope surface lives in `resolving/read-scope-forest.ts` + `resolving/resolve-binding.ts` (7 scope-forest generators V6/V6b/V7/V8/V10a–c); **the shim is R-6-constrained** (legacy tracked set incl. `var`; see Q13 and [LIBRARY-CONTRACTS.md](./LIBRARY-CONTRACTS.md)). The 3 free generators V1/V2/V4 anchor via the pure in-file AST walk `context/descend-identifiers.ts` — zero scope wiring; port first. Entry rewire `Snippet→Facts` in `generate-quiz`/`build-context`; inline `NodePath` type-only — and note the legacy alias is bare `type NodePath = string` while greenfield embody's `NodePath` is its own dot-delimited type: which format `anchorPath` carries is Stage-3 AR-1 material. Confirm Q12. |
| 4     | `socratize` lens | `lenses/socratize/` | unbuilt      | The one genuine build — quarry source is documentation-only (quarry `lenses/socratize/`). Build from the annotated DDD copies ([lens-ddd/socratize/](./lens-ddd/socratize/)) applying § Socratize DDD rewrite below. Deliverables: `core.ts` + `index.tsx` + `tests/` + css, mirroring the two-layer `writeme` module shape. Full ZOMBIES TDD. Gate: `applicability = facts.ast.ok`. **Un-colorized per ruling R-4 (§ The un-colorized ruling record).**                                                                                                                                                                                                                                                                                                                                                                            |
| 5     | `quiz` lens      | `lenses/quiz/`      | unbuilt      | Verbatim port through inc 7 from quarry `lenses/quiz/` (annotated DDD copies: [lens-ddd/quiz/](./lens-ddd/quiz/)). Envelope rewire isolated to `build-quiz.ts` + `index.tsx` + `core.ts` gate/recommend signatures — don't miss `core.ts`. Item-consumer graph untouched. Gate: JEJ `validate` (Q4), not `facts.ast.ok`. Anchors already offset.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

Bottom-up order: **questioning-parent → 3 → 4 → 5** (locked decision 5, human
ruling 2026-08-11: the shared `lib/questioning/` parent — its rich
Block-Model/taxonomy/leveling documentation, its shared `types.ts`, and the
socratizing move — is an UPSTREAM stage both engine streams consume; it runs
first). The real dependencies after it: Stage 5 consumes Stage 1's `classifying`
(landed) and Stage 3's `quizzing`; Stage 4 needs only landed Stage-2 outputs
(wherever socratizing then lives). Each stage runs full Phase-0 DDD → human gate
→ Phase-1, per the governance files — Phase-0 is **light where the port is
verbatim** (Stages 3/5, ≈ the classifying relocation) and heavier for the
questioning-parent doc transport and the Stage-4 build (≈ the engine rebuild).

## Scope adapter (landed reality, and what Stage 3 still owes)

**Landed (Stage 2, socratizing side):** `lib/scoping/derive-scope-usage.ts` (101
lines [measured: line count via the code map]) — it reads embody's per-reference
**access classification** and never re-walks the AST [read: its `@file` remarks
— "it never re-walks the AST or recomputes scope"]: reads = references whose
access includes `read`/`readwrite`; writes = `write`/`readwrite` **excluding the
declaration's own initializer** (a never-reassigned `let` reports 0 writes — the
prefer-`const` signal consumers hang on); keeps only `let`/`const` bindings
(`var` carries `kind: 'var'` and is filtered;
function/parameter/class/import/catch bindings carry no `kind` at all). It
replaces the legacy ~401-line `buildScope`. Most of socratizing's 16 analyzer
files carry an ignored `_scope` param; ~5 actually read scope — the uniform
signature threads the adapter output to all, read by few.

**Owed (Stage 3, quizzing side):** quizzing's `resolving/` is a larger scope
surface (`Binding`/`ScopeInfo`/`resolveBinding`). eslint-scope pre-resolves
references — but **ruling R-6 constrains the collapse**: the Stage-3 shim
resolves only the legacy tracked set (`{var, let, const}` declarator ids + the
`for-of` left) and answers null for everything else, so the quarry oracle's
`usage:occ` pins re-green verbatim. The shared `derive-scope-usage` must NOT be
reused as-is (Q13). Occurrence-class table and mechanics:
[LIBRARY-CONTRACTS.md](./LIBRARY-CONTRACTS.md).

**Traversal precedent (executed):** socratizing's `getChildNodes` (3 call sites)
was ported as the sanctioned pure-acorn micro-vendor — landed as
`lib/socratizing/get-child-nodes.ts` [measured: `ls`] — rather than rewritten
onto `EntwinedNode`s; the no-vendor rule scopes to `buildScope`/scope only.
Quizzing needs no such decision: its traversal is the private in-file
`childNode` helper inside `context/descend-identifiers.ts` [relayed: ar-2, grep
— zero `getChildNodes` hits in quarry quizzing].

## Greenfield contracts (the shapes Stages 3–5 target)

Authoritative shapes live in the tree — `src/lib/study-lenses/lenses/types.ts`
(`Lens`, `Gateable`, `LensProperties`), `src/lib/study-lenses/embody/types.ts`
(`Embodiment`, `Facts`), and
[lenses/README.md § Totality](../../src/lib/study-lenses/lenses/README.md#totality--the-gate-is-the-refusal).
Point, don't restate — what belongs HERE is the campaign-specific delta:

- **The envelope idiom** (mirror `writeme`):
  `freezeInPlace({ name, main, applicability, config?, recommend?, phase } satisfies Lens)`.
- **Gate = the refusal channel**: a lens whose `applicability` is false is never
  offered, so `main` carries no refusal arm. A throwing gate = not-applicable,
  loudly. `applicability` is pure and synchronous over `Facts`; for the quiz
  lens's gate-budget tension see Q4.
- **`phase` is required for panel visibility**; both lenses declare
  `phase: 'source'` (Q5). No phase discriminator crosses into the component.
- **The `Snippet → Facts` remap** (verified at transport):
  `status.parsed → facts.tokens.ok && facts.ast.ok`;
  `raw.ast → facts.ast.value`; `raw.tokens → facts.tokens.value.tokens`
  (`.value` is a `{ tokens, comments }` wrapper — pass `.tokens`);
  `source.code → facts.source.value`; snippet type → `facts.type.value`; scope →
  `facts.environment` via the adapters. `classifyTokens` and the JEJ `validate`
  are default exports. `analyzeMicroDecisions` returns the `MicroDecisionResult`
  union — narrow `.ok` before reaching `.questions`.
- **Roster registration**: `orchestrate/lib/composing/built-in-lenses.ts` is a
  static three-lens array `[parsonsLens, writemeLens, debugPropsLens]` [read:
  the file, 21 lines; landed `47234d7c`, 2026-07-31 [relayed: ar-2 `git show`]]
  — Stages 4/5 append to it; host injection joins at mount. The source plans'
  "roster looks host-injected — confirm first" flag (stonebraker R6) is RESOLVED
  by that measurement. Naming guard: this kept `orchestrate/` is the composition
  root — NOT the dropped `question-orchestrator`/`composeQuestions`.
- **Purity rule**: a lens imports embody type-only; engines live under
  `study-lenses/lib/` as ordinary imports.

## Execution mode — copy-paste + modify, not greenfield

For every stage with quarry code (3, 5): copy the quarry files + their tests
into the greenfield home, then modify only the thin adapter/entry/envelope layer
until the ported tests re-green. The quarry tests are the behavioral **oracle**
— do not write ZOMBIES tests from scratch for already-tested code (minus the
dropped realm forms for quizzing; the R-6 ruling preserves the occ pins rather
than re-pinning them). Stage 4 is the one genuine build — full ZOMBIES TDD
applies only there.

## Socratize DDD rewrite (Stage 4 — from the annotated quarry copies)

The pedagogy is the constant; the orchestrator layer and the old lens contract
go. Source: [lens-ddd/socratize/](./lens-ddd/socratize/) — annotated byte-copies
of the quarry trio, designated instead of fresh Phase-0 authoring (human ruling
2026-08-05: "copy-paste the lens DDDs for later implementation in another
session"; the library is the focus).

**KEEP (pedagogy):** the overview **shelf** + the `nodeType==='Program'`
partition (a crisp generation-time discriminant, not a span heuristic); the
inner **open→pointed→comparative Feedback Ladder** (`Question.register`);
**hints as `<details>`**; the **`disclosure` knob** (`'ladder'` default, `'all'`
defined-only, deferred — Q6); **reveal-state keyed on the stable per-mount item
index** (not `CodeQuestion.id`, constant-per-analyzer); **no
grading/verdict/mastery**; the empty-source / zero-items / click-outside edge
states; **un-colorized editor (ruling R-4, § The un-colorized ruling record)** —
no `@codemirror/lang-javascript`, no theme import; the lens's decorations carry
the only meaning.

**DELETE (orchestrator layer):** `OpenOrchestratedItem` +
`SocraticModel`/`SocraticPartition` keyed on it; the outer `register:'open'`
filter + `selectOpen`; the outer-register homonym (§ Terms — collapse to the one
inner `Question.register`); `composeQuestions`/clean-once/ anchor-normalization;
the `anchorOffsets` indirection (native offset `CodeQuestion.location` instead);
the `data-socratize-fallback` unparseable arm (moves to the gate —
refusal-as-data).

**CHANGE (contract):** `LensModule→Lens`, `Component→main`,
`LensProps→LensProperties`, `Snippet→Embodiment`;
`applicableTo → applicability(facts) = facts.ast.ok`; the frozen envelope
`freezeInPlace({ name:'socratize', main, applicability, config, recommend, phase:'source' } satisfies Lens)`;
item source: `analyzeMicroDecisions(embodiment)` → narrow `.ok` → `.questions`
(`CodeQuestion[]`) consumed directly; `context` renders plain text, each
`Question` may carry its own PBSI rendering (per-question seam, not blanket
context-markdown). PBSI = the engine's
`PBSILevel = 'purpose' | 'behavior' | 'strategy' | 'implementation'` —
**American spelling**; source of truth `lib/socratizing/types.ts` (a "Behaviour"
spelling from older prose is a type error).

**RE-TYPE, do not delete:** `SocraticModel = readonly CodeQuestion[]`;
`SocraticPartition = { programLevel; elementScoped }` split on
`question.nodeType === 'Program'`.

**core.ts pure surface (TDD at Stage 4):** `config(overrides?)`;
`applicability(facts) = facts.ast.ok`; `recommend` → frozen `[]`;
`partitionByScope(questions)`; `itemsAt(elementScoped, offset)` (half-open
containment `location.start ≤ offset < location.end`; innermost-vs-source
ordering pinned at AR-1); `presentRungs(question)` (distinct present registers
in **Feedback-Ladder** order — NOT difficulty; the difficulty ladder is
orchestrator collateral, § Orchestrator collateral). `index.tsx`:
`SocratizeComponent({ embodiment, config })` with
`useMemo(analyzeMicroDecisions, [embodiment])` (index-keyed reveal needs a
stable model), rendering shelf + element cards + ladder, then the freeze
envelope.

**Named open build question:** the span-pick interaction surface — click a
source span → offset → `itemsAt`. The quarry lens (doc-only) never built it;
candidate: feed it from `classifying` token spans. The quarry spec's worked
CodeMirror recipe (posAtCoords capture, `StateField<DecorationSet>`, the
17-attribute `data-socratize-*` selector contract, the tabbed-panel contract,
reveal-persistence-across-re-picks) survives in the annotated copies — the
Stage-4 designer reads it there before re-deriving from scratch.

## Quiz port (Stage 5 — verbatim, minimal design)

The quarry quiz lens is complete through inc 7 and already direct-to-quizzing
(`lib/build-quiz.ts → classifyTokens + generateQuiz`, no orchestrator). The
formerly designated distillation (`read-and-execute-the-linked-origami.md`) was
DELETED before transport [measured: `ls ~/.claude/plans | grep -i origami` →
empty, 2026-08-05]; the sources are the quarry itself, the annotated copies
([lens-ddd/quiz/](./lens-ddd/quiz/)), and
[LIBRARY-CONTRACTS.md](./LIBRARY-CONTRACTS.md).

- **Port verbatim (pure, contract-independent):** `core.ts` `masteryFold`,
  `lib/decorations` (two color-free channels), earned propagation,
  `lib/{grade-option, grade-ranges, pending, anchors}`.
- **The envelope rewire spans `build-quiz.ts` + `index.tsx` + the `core.ts`
  gate/recommend signatures.** The item-consumer graph is untouched (every
  consumer keys only on native `QuizItem` fields).
- **(a)** Source `classified` from `facts` (drop the private re-parse).
- **(b)** Gate = `applicability(facts)` via the JEJ level `validate` — with Q4's
  three Stage-5 AR-1 ratification items (type match, path-less references, gate
  budget).
- **(c)** Anchors already offset.

## Orchestrator collateral — carried forward, not built

The 2026-07-22 pivot retired the `question-orchestrator` MECHANISM (locked
decision 3); it never ruled on three pedagogical concepts that lived inside it.
**All three carry forward as spec'd future work — none is discarded** (human
ruling 2026-08-05/06, multi-select: difficulty ladder, coverage instrument,
one-grid goal). Status of each: **carried, not built — the landing site is
decided at its consuming stage's AR-1**, not here. NOTE: none of Stages 3/4/5
consumes these three concepts, so this section is **promotion-only — it is
exempt from this file's retirement banner** and retires only into its durable
home, the carried-unbuilt note in `lib/socratizing/DOCS.md` (human ruling
2026-08-10). The quarry's pinned truth for all three is its
`lib/question-orchestrator/` — six frozen test files [measured: `find … -name
'*.test.*' | wc -l` → 6], protected from deletion by the quarry-retirement
criteria (**the criteria name ALL question surfaces — quiz lens, quizzing
engine, AND question-orchestrator; none deletes before its content is ported or
re-homed** — human ruling 2026-08-05/06; landed 2026-08-11 in
`MVP-ROADMAP.md § Then — retiring the quarry` [measured: `grep -in
'question-orchestrator' src/lib/study-lenses/MVP-ROADMAP.md` → the
question-register bullet]); read the concept's source there before rebuilding. A
scope caution common to the two instruments: the quarry justified BOTH as
irreducibly CROSS-register ("coverage across the Block Model grid is meaningful
only over both registers' delivered items together"; laddering "a mixed
open+closed stream is a whole-set concern" [relayed: ar-1, quarry orchestrator
README § Why this lib]) — with two standalone lenses, a per-lens landing is a
SCOPE REDUCTION the consuming AR-1 must consciously accept; the full-fidelity
carrier is the recommender/curriculum layer the one-grid bullet names.

- **The Block-Model difficulty ladder** (quarry
  `lib/question-orchestrator/ladder.ts` + `ladder.test.ts`): order a question
  stream concrete-to-abstract by each item's MOST-CONCRETE Block level —
  `LEVEL_RANK` maps atom 0 < block 1 < relation 2 < macro 3 as a
  `Readonly<Record<BlockLevel, number>>` so a new `BlockLevel` is a compile
  error; a multi-cell item ranks by `Math.min` over its cells (min-not-max is
  test-pinned); zero-cell (unleveled) items sort STRICTLY last (not tied with
  macro); ties keep emission order as a load-bearing contract (immune to anchor
  position, idempotent — pinned; decorate/sort/strip is the implementation
  technique, documented but not itself pinned). The ladder was OPT-OUT:
  `config.ladder === false` → pool order — a config contract a rebuilder needs
  (the opt-out is compose-pair: `compose-questions.ts` + its test pin
  ladder-false → pool order, not `ladder.ts`). ⚠ These defaults (min-not-max,
  zero-cell-last, ladder-on) sat at "Ratify or adjust" in the quarry's own DOCS
  § Open questions, with named alternatives (coarsest level; a designated
  primary cell) — the consuming AR-1 ratifies or adjusts, it does not merely
  reproduce. Nothing forward orders questions by difficulty under any name
  [relayed: ar-1 re-ran the sweep 2026-08-10:
  `LEVEL_RANK`/`concrete-to-abstract` → 0; "difficulty" → writeme's explicit
  negatives + a playbook distractor-difficulty knob; "ladder" → the Feedback
  Ladder + local-llm's unrelated browser-model "ladder" — no hit orders
  questions]; greenfield socratizing sorts by source offset. The "ladder
  ordering" in the socratize lens plan is the Feedback-Ladder rung order
  (`presentRungs`) — a DIFFERENT axis; and local-llm's "browser ladder" is a
  THIRD unrelated homonym; let neither close this carry.
- **The coverage-reporting instrument** (quarry
  `lib/question-orchestrator/report-coverage.ts` + `report-coverage.test.ts` —
  AND `compose-questions.ts` + `compose-questions.test.ts` +
  `DOCS.md § Coverage semantics`, where several of the following actually live):
  report which Block-Model cells the delivered question set SPANS and which
  configured target cells remain GAPS. Report-only philosophy — it never
  synthesizes an item to fill a gap (`report-coverage.ts` header); cell equality
  is value-keyed `${dimension}:${level}`, never reference identity, with
  cross-item and target dedup and borrowed-by-reference cells pinned
  (`report-coverage` + its test). Pinned in the COMPOSE pair, not the report
  pair: computed LAST over the post-cap delivered items so it "truthfully
  describes the delivered set" (the quote is DOCS/types prose; a cap that drops
  a cell's only item shows that cell as a gap — "cap loosely" is the README's
  phrasing); the freeze boundary (compose does NOT freeze the caller's coverage
  cells); the degenerate UNPARSED path reporting every target as a gap
  (report-coverage's own test pins only the no-items case). ⚠ Post-cap coverage
  also sat at "Ratify or adjust" in the quarry DOCS § Open questions. The
  greenfield socratizing docs state honestly that the cells enable the audit and
  no instrument reports it; the durable carried-unbuilt note in
  `lib/socratizing/DOCS.md` (human ruling 2026-08-10, landed) is the carrier of
  the plan to build it.
- **The "two registers on one grid" pedagogical goal** (quarry
  `lib/question-orchestrator/README.md`, attributing the goal to quizzing's own
  README): a learning environment should place open/Socratic and closed/gradable
  questions on ONE shared Block-Model grid — complementary views of the same
  comprehension model. This is a curriculum-level commitment, distinct from the
  retired co-anchoring mechanism; with no orchestrator, its future carrier is
  the recommender/curriculum layer. The quizzing-side anchor of the idea is the
  SHARED `BlockCell` VOCABULARY — quarry quizzing deliberately imports
  socratizing's `BlockCell` type for `QuizItem.cells` "so a learning environment
  can place both registers on one grid" [relayed: ar-1, quarry quizzing README +
  types] — a mechanized correspondence, distinct from the weaker, explicitly
  partial Family↔Feature note in
  [LIBRARY-CONTRACTS.md](./LIBRARY-CONTRACTS.md#catalog-frame-and-future-forms-s3).
  ⚠ Field-name trap for any rebuilder: forward socratizing names the field
  `block`; a verbatim quizzing port names it `cells` — the unification to one
  `cells` view lived in the RETIRED source adapters and is itself unbuilt
  collateral.

## The un-colorized ruling record (R-4)

Two locked decisions pull opposite ways on one axis — "does a read-only code
view get syntax coloring?":

- The quarry socratize spec, deliberately: the lens "deliberately does **not**
  depend on `@codemirror/lang-javascript` / `@codemirror/theme-one-dark` — it
  omits them to stay un-colorized" [read: quarry `lenses/socratize/README.md`,
  verbatim] — highlighting OFF so the lens's own decorations carry the ONLY
  meaning.
- The lens playbook, universally: "coloring = a shared facts-driven read-only
  highlighter" [read: MIGRATION-PLAYBOOK.md locked decision (1)] — while its own
  locked decision (2) excludes socratize from the playbook's porting scope.

**Ruling R-4 (human, 2026-08-05/06): the un-colorized pedagogy WINS for
socratize.** The Stage-4 build keeps highlighting OFF; and BECAUSE a centralized
colorize-all-lenses sweep is planned later, this record exists so that sweep
skips socratize — the exception is otherwise invisible (doc-only). The quarry
QUIZ lens is factually also un-colorized, and that is ALSO not test-pinned
(doc-plus-sandbox): its component test explicitly declines to assert the
property in jsdom ("absence-of-highlight-classes is a false-confidence assertion
… verified at the 🔍 sandbox checkpoint" [read: quarry
`lenses/quiz/tests/component.test.tsx` header]) — its read-only pins survive
colorization, so no test meets the sweep. Whether quiz's coloring gets its own
ruling is DEFERRED to lens-building time (R-4a, human ruling 2026-08-10: the
human redirected lens-side questions — library first; consuming lenses later).

## Standing flags (gaps this campaign records but does not fix)

- **Four socratizing behavior changes rest on commit records, not human
  rulings** (flagged 2026-08-05): `mixed-condition-style` (same-subject
  narrowing), `empty-block` (control-flow-clause narrowing), `what-value-stored`
  (trivial-initializer widening), `voice-profile` (metric recalibration) — each
  covered by an agent-reasoned fix commit only, while the port plan of record
  dispositioned analyzer bodies "verbatim". The push gate that carried their
  ratification has since CLOSED — those commits are on `origin/main` [measured
  2026-08-11: `git log origin/main..HEAD -- lib/socratizing` → empty]. The
  record class stands (reasoned commits, no explicit human ruling); anyone
  re-opening one of the four narrowings starts from the commit bodies, not from
  a ruling.
- **`lib/classifying`'s non-overlap invariant has no test pin** (flagged
  2026-08-05): the quarry quiz build test asserted `start >= previous.end`; no
  greenfield classifying test or doc pinned it at re-verification. The doc
  sentence lands with this campaign's module-doc fixes; the test pin is code
  work a future classifying session owes.
- **The quarry-retirement criterion has no in-place guard** (flagged 2026-08-11,
  review on the roadmap amendment): MVP-ROADMAP.md has zero inbound references
  outside this campaign dir, the quarry README carries no deprecation banner,
  and the 42 question-register test files carry no `PINNED(` markers — an agent
  standing in the quarry with a delete instruction meets no signal. Cheap
  closers for a future session: a one-line pointer banner on the quarry README,
  or `PINNED(quarry oracle — MVP-ROADMAP § Then — retiring the quarry)` markers
  in the three dirs (the quarry is READ-ONLY, so either needs its own human
  sanction).

## Verification (per remaining stage)

- The migrated lib's own tests green against greenfield embody
  (`./node_modules/.bin/vitest run --project unit <paths>`); `tsc`/`eslint`/
  `markdownlint`/`prettier` no-new under the new files (baseline-delta gate only
  — repo-wide green is not the gate in this shared tree).
- Engine parity: the migrated engine reproduces the quarry oracle's tested
  behavior (minus dropped realm forms; occ pins preserved per R-6).
- Lenses: component tests (jsdom) + a 🔍 sandbox smoke-run on the reused lens
  dev surface (socratize: pick → reveal → shelf; quiz: pick → answer → verdict +
  mastery decoration).
- **Discharged 2026-08-11 — the Stage-1 classifying-docs cspell obligation.**
  The obligation's blocking premise ("cspell needs Node ≥ 20.18") was refuted by
  measurement: the repo's pinned cspell 8.19.4 declares `engines >= 18` and runs
  on this env's Node 20.11.0. The owed pass has now run [measured:
  `./node_modules/.bin/cspell` over `lib/classifying/{README,DOCS}.md` → 2
  issues, both the house word `blankable`, now covered by in-file ignores].
  Nothing blocks the Stage-1 push on spelling.

## Stage-1 learnings (recur in Stages 3/5 — also verbatim ports)

- **The verbatim port trips greenfield lint rules the quarry predated**
  (`local/newspaper-order`, `eslint-comments/require-description`). Conform
  in-file (behavior-preserving); the review scrutinizes that exact diff.
- **Docs are re-authored, not byte-copied** — quarry docs carry
  `Snippet.raw.*`/`status.parsed` residue the end-state-docs invariant forbids.
  Budget real doc work per port; guard against over-stripping load-bearing
  rationale (maintainer docs-philosophy ruling).
- **Byte-copy mechanics:** copy from HEAD blobs (`git show <SHA>:<path>`),
  `diff` + `sha256` to prove identity, then conform. tsc first-exposure is the
  one likely surprise (MED-HIGH in the source risk register) — strict flags may
  force edits inside otherwise-verbatim files; the implementation review
  scrutinizes that exact diff.
- **Entry narrowing:** the entry narrows each `FactStage`'s `.ok` before calling
  an adapter — adapters take unwrapped values (`Environment`), never
  `FactStage`s.
- **Concurrent tree:** stage explicit paths; scope reviews with
  `-- <your-paths>`.
