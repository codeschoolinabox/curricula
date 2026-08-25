<!-- TRANSITIONAL — pre-Stage-3/5 contracts spec. This file is the
deliverable of the human's library-first enrichment license (human ruling
2026-08-05/06: beyond restoration, author the pre-Stage-3 library-contracts
spec pinning what only the quarry tests carry). Retire only when Stages 3
AND 5 have BOTH landed and each stage's contracts are promoted to its own
module docs (lib/questioning/quizzing for the Stage-3 clusters, lenses/quiz
for the
Stage-5 clusters — each cluster below carries its stage tag). Retiring at
Stage-3 close would orphan the lens contracts. -->
<!-- cspell:ignore socratizing socratize quizzing reenrichment unbuilt -->
<!-- cspell:ignore groupKey rekeys undercounts Disjointness reassignable -->
<!-- cspell:ignore distractors isomorphically -->

# Quizzing library contracts — the fine print the plan never restated

The forward plan ports quizzing "verbatim" with the quarry tests as the oracle —
but it restates almost none of the finer contracts those tests pin. This spec is
the Stage-3 executor's reading guide: the crafted semantics that exist ONLY in
the frozen quarry test files, distilled with their pinning locations, plus the
R-6 ruling mechanics the port must honor. It does not replace the oracle — the
tests re-green as-is modulo the `Snippet→Facts` entry/fixture rewire (30 of the
36 quiz-surface test files import the legacy embody — 22 of 27 in
`lib/quizzing`, 8 of 9 in `lenses/quiz`, all but `pending.test.ts` [measured:
`grep -l embody` over each tests dir]) and minus the realm excisions named in §
Reading guide; it tells the executor what each cluster protects so a red test is
understood, not "fixed". Each cluster carries its stage tag: **[S3]** =
`lib/questioning/quizzing` (Stage 3), **[S5]** = `lenses/quiz` (Stage 5).

Sources: the quarry quiz surfaces (READ-ONLY) —
`src/lib/study-lenses--deprecated-architecture/lenses/quiz/` (9 test files; one
is `component.test.tsx`, so a `*.test.ts` glob undercounts) and
`…/lib/quizzing/` (27 test files) [measured: `find
src/lib/study-lenses--deprecated-architecture/lenses/quiz -name '*.test.*' | wc
-l` → 9; same over `lib/quizzing` → 27]. Every contract below was verified
against those files by the 2026-08-05 adversarial re-verification (95 AGREE / 21
NUANCE / 0 DISAGREE over the audit's findings); cite tests by TITLE, not line
number — the quarry's line numbers moved once already (the maintainer's
sanctioned prettier sweep `59043f52`; see [SPEC.md](./SPEC.md) § The quarry is
READ-ONLY).

## Group-key grammar — the mastery-propagation identity system [S3]

PROMOTED (Stage 3 landed): the six-axis grammar, the pairwise
non-prefixing law (oracle-asserted against the live sibling
serializers), binding identity as `declarationRange` ONLY
(kind never folds into a key), and the keying-vs-inline placement
convention now live in `src/lib/study-lenses/lib/questioning/quizzing/`
README § Glossary "Group key" and DOCS § Structural constraints.

## The R-6 occurrence-class ruling (`usage:occ`) — READ BEFORE WIRING SCOPE [S3]

PROMOTED (Stage 3 landed): the five-fact account, the
occurrence-class table, the tracked-set boundary (ruling R-6), and
resolveBinding's five pinned constraints now live in
`src/lib/study-lenses/lib/questioning/quizzing/DOCS.md` § Where scope
comes from, with the glossary entries (tracked set, occ fallback,
scope forest) in that module's README. ERRATUM, corrected in place at
promotion (2026-08-25): this section's original body said
`resolve-binding.test.ts` holds 22 tests; the file holds **17** in
both the quarry blob and the ported oracle [measured at port: grep -c
"it(" → 17; the U4 worker re-confirmed at the blob].

## Grading — total, binary, one-sided [S3; range grading also pinned lens-side, S5]

The [S3] half is PROMOTED (Stage 3 landed): totality/never-throws,
binary exhaustive set-equality across three variants = FOUR modes,
the malformed/incorrect boundary, the one-sided seam, and the
retracted "subset counts" note now live in the quizzing README
(§ Public API "Grading is one-sided") and DOCS (§ Grading, incl. the
promoted 11-of-12 mode-pair coverage note). REMAINING lens-side
[S5]: range comparison is pinned in BOTH directions AGAIN lens-side
in `grade-ranges.test.ts`, and the no-penalty half of malformed is
pinned cross-cluster in `mastery.test.ts`'s malformed-is-a-no-op —
a UI bug must not cost the learner mastery.

## Mastery — two channels, monotonic, color-free [S5]

Pinned in `lenses/quiz/tests/mastery.test.ts` + `decorations.test.ts`:

- Per-groupKey `{ progress, wrong }` on independent non-hue axes (color-vision
  safety). `MASTERY_STEP` 0.25, saturating at 1.
- **Progress is MONOTONIC**: a wrong answer sets the `wrong` flag at current
  progress, never decrements; a correct answer clears `wrong` and accrues
  (re-mastery); a malformed verdict is a **referential no-op**; state is
  deep-frozen.
- Provenance (prose canon, not test-pinned — recorded in the quarry lens
  `core.ts` doc comment + README/DOCS): the 0..1 accrual model was a Phase-0
  human-gate ruling (2026-06-28), chosen over a consecutive-correct counter and
  over threshold-to-unlock.
- **Decoration projection**: two color-free channels; the four `ProgressBucket`
  underline densities map exactly the reachable 0.25 steps; a progressed group
  decorates EVERY same-group token (the propagation the channels exist for);
  co-anchored tokens dedup to ONE entry at the HIGHEST bucket across their
  groups; matching is exact-key (a role-refined key matches no role-less item).

## Earned propagation — credit as data, asymmetric by design [S3 producer / S5 fold]

The PRODUCER half is PROMOTED (Stage 3 landed): unlocks as namespaced
groupKeys carried by emitted peers (deduped, source-ordered), only
the sameness forms carrying the field, V10a/V10b group membership,
V10c's deliberate self-exclusion, the V10b↔V7 bulk-credit bijection
both directions, and globals-contribute-targets-never-unlocks now
live in the quizzing README § Glossary "Sameness unlock" and the
catalog's V10 rows. REMAINING consumer-fold [S5] (pinned in
`lenses/quiz/tests/mastery.test.ts` inc 7): a correct sameness
gesture credits the deduped {own groupKey} ∪ item.unlocks one step
each, accruing on prior progress, capped at 1, PRESERVING a peer's
prior wrong mark; an incorrect gesture flags only the own group and
never propagates; empty unlocks tolerated; credit operates in the
groupKey namespace — never item ids — which is what lets it survive
re-keys.

## Generator registry — ordering is a contract [S3; panel admission S5]

The [S3] half is PROMOTED (Stage 3 landed): the
token→node→program tier pin, registry-then-stream order with its
reverse-registry negative twin, deliberately-not-source-order, the
10-generator post-realm taxonomy with V4-fires-last, and the
surgical-excision record now live in the quizzing README (§ Public
API "Ordered"), DOCS § Decisions (registry-order row), and
LOSS-LEDGER § A (the excision inventory, landed at U9). REMAINING
[S5]: the panel admits by MODE (`mcq` | `click-token` |
`select-in-code`), never by a form allowlist — pinned in
`lenses/quiz/tests/build-quiz.test.ts`.

## Two-stream descent + the use-type taxonomy [S3]

PROMOTED (Stage 3 landed): the one-descent/two-disjoint-streams
contract, object-literal keys excluded from BOTH streams, the 4-kind
use-type taxonomy with its pinned edge rulings, and V4's two-chains
pedagogy now live in the quizzing README (§ Glossary "Anchor
stream" / "Use-type taxonomy", § Edge cases, the catalog's V4 row)
and DOCS § Structural constraints.

## Defensive guards — the engine gates on parsed, not validated [S3]

PROMOTED (Stage 3 landed): var-laundering with per-binding guards,
V2's contextual-keyword next-token guard, V6b's group separation
(`element-type:const-update`, deliberately not `category:keyword`),
and the representative rule (source-first anchor, TDZ-safe, the
anchor is itself a target) now live in the quizzing README (§ Edge
cases, § The question catalog) and DOCS § Decisions.

## QuizFilter — declared, NOT built; Stage 3 inherits a build decision [S3]

PROMOTED (Stage 3 landed): declared-not-consumed (the no-op is
oracle-pinned), the filter-semantics contract, and the build-
decision inheritance now live in the quizzing README
§ Configuration and DOCS § Decisions. NOTE: this section's original
"1-based inclusive LINES" sentence was SUPERSEDED by the 2026-08-18
ruling — `QuizFilter.range` is a zero-indexed half-open OFFSET span
(the family's anchor law; recorded in the module docs). The quiz
lens's own unconsumed `categories` knob remains Stage-5 material.

## Answer modes — five, with a build-state ledger [S5; the AnswerMode vocabulary rides S3's types port]

The `AnswerMode` vocabulary is **five** modes today — `mcq`, `click-token`,
`click-line`, `select-in-code`, `multi-mcq` — additive-open going forward (the
"end-state" framing was retired by the 2026-08-18 gate-round ruling, landed at
a9e4d522: a new mode is an additive cross-consumer contract event), with a
build-state ledger the plan compresses to four: `multi-mcq` is enumerated but not built; `click-line` is
graded but not generated (pending `Source.offsets`). One variant per assessment
gesture; capture mechanics fold within a variant. Interaction invariants pinned
in `lenses/quiz/tests/anchors.test.ts` + `component.test.tsx` +
`pending.test.ts`:

- **Never-auto-arm**: `defaultActiveTab` = first `mcq` by full scan; null when
  no mcq exists → the panel stays unarmed (a code-answer default would silently
  arm the editor). A verdict DISARMS (post-grade clicks re-pick, not stage);
  tab-switch / cancel / re-pick clear pending state.
- Click-token staging is **single-slot** (replace); select-in-code is a
  **toggle-set**. `toggleRange` uses exact `[start, end]` tuple membership
  precisely BECAUSE grade compares select-in-code by exhaustive set-equality on
  a `${start}-${end}` rangeKey — a toggle-set set-equals `targetRanges` iff
  exactly the targets were toggled; adjacent-but- unequal ranges are distinct
  members; double toggle is identity.
- The reset matrix, split by sourcing: **verdict is per-pick** is pinned
  (verdict persists per-item; re-picking a different anchor clears the prior
  pick's verdicts). **Mastery durable across picks** has NO pin — the behavior
  is read from the quarry `index.tsx`'s per-mount `MasteryState` (nothing in the
  re-pick path clears it), and no component test asserts it [relayed: ar-1, grep
  — zero "mastery" hits in the three interaction test files]. Stage 5 owes it a
  test (standing gap, flagged 2026-08-06).
- The quiz editor posture, split by sourcing: the READ-ONLY half is pinned
  (`component.test.tsx`: `EditorState.readOnly` true, `contenteditable="false"`,
  mount inside the `data-quiz-editor` contract selector, NO CodeMirror mount in
  the unparseable / non-JEJ fallbacks, `role="alert"` on both fallback notices).
  The UN-COLORIZED half is deliberately NOT test-pinned — the file's own header:
  jsdom never runs CM's highlight paint pass, so "absence-of-highlight-classes
  is a false-confidence assertion"; it is verified at the 🔍 sandbox checkpoint
  [read: quarry `component.test.tsx` header]. The read-only pins SURVIVE
  colorization, so the future colorize-all sweep meets no red test here — quiz's
  un-colorized property is doc-plus-sandbox only, same exposure class as
  socratize (ruling R-4; quiz's own coloring ruling deferred to lens-building
  time, R-4a).

## Co-anchoring isolation [S5]

Pinned in `lenses/quiz/tests/mastery.test.ts` + `anchors.test.ts`: one token
carries items in DISTINCT groups across all three built modes; `itemsAt` is
mode-agnostic and returns the whole heterogeneous bundle; the mastery fold keys
on groupKey, so co-anchoring neither collapses nor cross-credits groups — a
wrong answer on one co-anchored group leaves its peers' mastery untouched.

## The JEJ admission gate [S5]

Pinned in `lenses/quiz/tests/core.test.ts` + `build-quiz.test.ts`: quiz
applicability = parsed AND JEJ-compliant; the generators NEVER build questions
from a non-JEJ AST — ground truth (scope, TDZ, creation-phase) is statically
decidable ONLY because JEJ excludes functions/var/class ("the dissolution of the
function-scope problem"). Proven by a delegation fixture (`VALIDATION_FAIL`) no
string-match fake could satisfy; `buildQuiz` returns null as defense-in-depth
even before the render guard. Greenfield replacement: `applicability(facts)` via
the JEJ level's `validate` ([SPEC.md](./SPEC.md) Q4, with its three Stage-5 AR-1
ratification items).

## Catalog frame and future forms [S3]

PROMOTED (Stage 3 landed): the Block-Model catalog frame, the
families build order, the curated-vs-generated provenance
distinction, the enumerated future forms V9/V12/V13/V14, and the
partial non-isomorphic Family↔Feature correspondence now live in
the quizzing README (§ The question catalog, § Glossary). NOTE: this
section's original "bounded by JEJ's finite concept set" clause was
SUPERSEDED by locked decision 9 (2026-08-11) — the bank is
UN-bounded; `serves` is the serve-this-code test.

## Reading guide

Enumerate the oracle before porting:
`find src/lib/study-lenses--deprecated-architecture/{lenses/quiz,lib/quizzing} -name '*.test.*'`
→ 36 files at ruling time [measured: 2026-08-06]. The realm partition is NOT
file-clean — it has two levels (locked decision 4):

- **Whole files that die with the dropped forms**: `v3-provenance`,
  `v5-value-category`, `read-realm-binding`, `realm-group-key` — do not
  re-green.
- ⚠ **A second surgical excision, parallel to the registry header**:
  `generate-quiz.test.ts` IS oracle but carries realm-coupled assertions —
  `'V3'` inside expected generator sets plus four dedicated V3/V5 end-to-end
  tests (including a `groupKey === 'realm:Math'` pin) [relayed: ar-2, grep → 15
  realm-coupled lines]. Those assertions cannot re-green; excise them
  surgically, keep every non-realm assertion in the file live. Sweep the
  remaining oracle files for the same coupling before declaring any realm-clean
  — the two named locations are the measured ones, not a closed list.

Everything else is the oracle. The question-orchestrator's own 6 test files are
NOT Stage-3 oracle — they pin retired-orchestrator contracts and are covered by
[SPEC.md](./SPEC.md) § Orchestrator collateral and the R-2 retirement criteria.

**Oracle files with no dedicated cluster above — read each before porting its
unit** (the clusters distill the crafted semantics, not the whole oracle):
`build-context.test.ts`, `run-generators.test.ts` (cited in § Generator
registry), `resolve-binding.test.ts` (cited in § R-6), `v1-category-id.test.ts`,
`v8-declaration-site.test.ts`, `v10b-binding-use-type.test.ts` [S3];
`grade-option.test.ts` [S5].
