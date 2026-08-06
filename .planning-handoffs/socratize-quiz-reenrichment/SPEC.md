<!-- TRANSITIONAL — this spec is the in-repo forward canon for the
question-register lens campaign (rulings R-1/R-1a, AR-LOG.md). Retire a
section only when the stage that consumes it lands and its own module docs
carry the content; retire the file only when Stages 3, 4, and 5 have all
landed. Sibling artifacts land by increment: LIBRARY-CONTRACTS.md at C3,
§ Orchestrator collateral at C4, lens-ddd/ at C5 — links to them resolve
from those increments forward. -->
<!-- cspell:ignore socratizing socratize quizzing reenrichment stonebraker -->
<!-- cspell:ignore unbuilt subgraph relitigate PBSI bannered bannering -->
<!-- cspell:ignore repoint readwrite Behaviour -->

# Question-register lenses — forward canon (re-homed)

The forward plan for the two question-register lenses (`socratize`, `quiz`) and
their engines, transported in-repo from
`~/.claude/plans/read-and-execute-the-indexed-pony.md` (previously the canonical
plan), `…-the-playful-stonebraker.md`, and
`…/supplement-indexed-pony-scope-gotchas.md` per rulings R-1/R-1a
([AR-LOG.md](./AR-LOG.md#human-rulings--2026-08-0506-askuserquestion-campaign-opening)).
All three source files carry RE-HOMED banners as of 2026-08-06 [measured: head
-8 on each after bannering]; **this file is the canon.** Omissions from the
transport are enumerated in [LOSS-LEDGER.md](./LOSS-LEDGER.md). Governance
outranks this spec: `CLAUDE.md → AGENTS[.principal].md → DEV.md`.

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
read the quarry, write new code into `src/lib/study-lenses/`. (One sanctioned
exception on record:
[AR-LOG.md § FLAGGED](./AR-LOG.md#flagged--known-gaps-this-campaign-records-but-does-not-fix),
F-3.)

## Locked decisions (maintainer-ratified 2026-07-22; do not relitigate)

1. **Greenfield `facts.environment` is the scope source** (not a vendored
   `buildScope`). Engines read scope through a small adapter projecting
   `facts.environment` onto the shape each consumes. Behavior parity is proven
   by the ported tests (the oracle). See § Scope adapter — and for quizzing, the
   R-6 occurrence-class ruling in [LIBRARY-CONTRACTS.md](./LIBRARY-CONTRACTS.md)
   (lands at C3).
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
   is carried by § Orchestrator collateral (lands at C4), ruling R-3.
4. **Quiz ports full-fidelity but REALM-FREE** (dropped, not deferred): no
   generators V3 (provenance) + V5 (value-category), no
   `keying/realm-group-key.ts`, no `realm/read-realm-binding.ts`, no
   `RealmBindingData` type-import. Everything else ports faithfully (all answer
   modes; generators V1/V2/V4/V6/V6b/V7/V8/V10a–c; mastery + two-channel
   decorations + earned propagation; the config filter). V4 names "realm" only
   in learner copy (Q7: leave). Excision warning: the realm clause sits
   mid-sentence in the registry header adjoining the V4-fires-last rationale —
   excise surgically, keep the rationale
   ([LIBRARY-CONTRACTS.md](./LIBRARY-CONTRACTS.md), lands at C3).

## Resolved questions (Q1–Q14 — answers are rulings, cite before deviating)

Every still-open row below is per-stage material ratified at the named stage's
AR-1; no BLOCKING-tier question remains (the source plan's A-tier —
Q1/Q8/Q13/Q14 — all resolved 2026-07-22).

| Q   | Resolution                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Quizzing (Stage 3) belongs to THIS campaign line — the M2 quizzing stream is CLOSED and handed over (maintainer, 2026-07-22). The supplement's "live M2 owner — coordinate" note predates this and is superseded.                                                                                                                                                                                                                  |
| Q2  | `socratizing` lives at `lib/socratizing/` (peer engine, not `orchestrate/lib/`). Landed [measured: `ls src/lib/study-lenses/lib/` → socratizing present].                                                                                                                                                                                                                                                                          |
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

| Stage | Lib              | Greenfield home     | Status       | Remaining scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----- | ---------------- | ------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | `classifying`    | `lib/classifying/`  | **COMPLETE** | — (landed `21f871bd`/`83520c77`/`c935ef59` [measured: `git rev-parse` on each]; public shape frozen per Q8)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2     | `socratizing`    | `lib/socratizing/`  | **COMPLETE** | — (engine 361 tests + `lib/scoping` adapter 35 tests [measured: `./node_modules/.bin/vitest run --project unit` per dir, 2026-08-06]; offset flip landed)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 3     | `quizzing`       | `lib/quizzing/`     | unbuilt      | Realm-free port (decision 4) from quarry `lib/quizzing/`. Port the rest verbatim; quarry tests are the oracle. Scope surface lives in `resolving/read-scope-forest.ts` + `resolving/resolve-binding.ts` (7 scope-forest generators V6/V6b/V7/V8/V10a–c); **the shim is R-6-constrained** (legacy tracked set incl. `var`; see Q13 and [LIBRARY-CONTRACTS.md](./LIBRARY-CONTRACTS.md), lands at C3). The 3 free generators V1/V2/V4 anchor via the pure in-file AST walk `context/descend-identifiers.ts` — zero scope wiring; port first. Entry rewire `Snippet→Facts` in `generate-quiz`/`build-context`; inline `NodePath` type-only — and note the legacy alias is bare `type NodePath = string` while greenfield embody's `NodePath` is its own dot-delimited type: which format `anchorPath` carries is Stage-3 AR-1 material. Confirm Q12. |
| 4     | `socratize` lens | `lenses/socratize/` | unbuilt      | The one genuine build — quarry source is documentation-only (quarry `lenses/socratize/`). Build from the annotated DDD copies ([lens-ddd/socratize/](./lens-ddd/socratize/), lands at C5) applying § Socratize DDD rewrite below. Deliverables: `core.ts` + `index.tsx` + `tests/` + css, mirroring the two-layer `writeme` module shape. Full ZOMBIES TDD. Gate: `applicability = facts.ast.ok`. **Un-colorized per ruling R-4.**                                                                                                                                                                                                                                                                                                                                                                                                               |
| 5     | `quiz` lens      | `lenses/quiz/`      | unbuilt      | Verbatim port through inc 7 from quarry `lenses/quiz/` (annotated DDD copies: [lens-ddd/quiz/](./lens-ddd/quiz/), lands at C5). Envelope rewire isolated to `build-quiz.ts` + `index.tsx` + `core.ts` gate/recommend signatures — don't miss `core.ts`. Item-consumer graph untouched. Gate: JEJ `validate` (Q4), not `facts.ast.ok`. Anchors already offset.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

Bottom-up order: 3 → 4 → 5. The real dependencies: Stage 5 consumes Stage 1's
`classifying` (landed) and Stage 3's `quizzing`; Stage 4 needs only landed
Stage-2 outputs. Each stage runs full Phase-0 DDD → human gate → Phase-1, per
the governance files — Phase-0 is **light where the port is verbatim** (Stages
3/5, ≈ the classifying relocation) and heavier only for the Stage-4 build (≈ the
engine rebuild).

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
[LIBRARY-CONTRACTS.md](./LIBRARY-CONTRACTS.md) (lands at C3).

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
go. Source: [lens-ddd/socratize/](./lens-ddd/socratize/) (annotated byte-copies
of the quarry trio, land at C5).

**KEEP (pedagogy):** the overview **shelf** + the `nodeType==='Program'`
partition (a crisp generation-time discriminant, not a span heuristic); the
inner **open→pointed→comparative Feedback Ladder** (`Question.register`);
**hints as `<details>`**; the **`disclosure` knob** (`'ladder'` default, `'all'`
defined-only, deferred — Q6); **reveal-state keyed on the stable per-mount item
index** (not `CodeQuestion.id`, constant-per-analyzer); **no
grading/verdict/mastery**; the empty-source / zero-items / click-outside edge
states; **un-colorized editor (ruling R-4)** — no `@codemirror/lang-javascript`,
no theme import; the lens's decorations carry the only meaning.

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
orchestrator collateral, § Orchestrator collateral, lands at C4). `index.tsx`:
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
([lens-ddd/quiz/](./lens-ddd/quiz/), land at C5), and
[LIBRARY-CONTRACTS.md](./LIBRARY-CONTRACTS.md) (lands at C3).

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
- **Standing pre-push obligation (AR-LOG F-4):** Stage 1's two re-authored
  classifying docs still owe a cspell pass in a Node ≥ 20.18 environment before
  their commits push (this env is Node 20.11.0 [measured: `node --version`]).

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
