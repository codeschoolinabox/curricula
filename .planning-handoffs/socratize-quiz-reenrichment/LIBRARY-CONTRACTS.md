<!-- TRANSITIONAL — pre-Stage-3/5 contracts spec. This file is the
deliverable of the human's library-first enrichment license (human ruling
2026-08-05/06: beyond restoration, author the pre-Stage-3 library-contracts
spec pinning what only the quarry tests carry). Retire only when Stages 3
AND 5 have BOTH landed and each stage's contracts are promoted to its own
module docs (lib/quizzing for the Stage-3 clusters, lenses/quiz for the
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
`lib/quizzing` (Stage 3), **[S5]** = `lenses/quiz` (Stage 5).

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

Pinned in
`lib/quizzing/tests/{binding,chain,classification,realm,usage,usage-kind}-group-key.test.ts`:

- **Seven namespaced axes**: `category:` (category or category:role) ·
  `binding:<decl-span>` · `usage:<decl>:<usageKind>` · `usage-kind:<kind>`
  (cross-variable) · `element-type:const-update` · `chain:<role>:<name>` ·
  `realm:<name>` (DROPPED with the realm forms — locked decision 4). The axes
  are **pairwise non-prefixing**, and the tests assert that against the LIVE
  sibling serializers so prefix drift surfaces immediately.
- **Per-axis identity semantics**: `usage` = binding × use-type; `usage-kind` =
  cross-variable by use-type; `chain` = role × name, deliberately
  binding-AGNOSTIC (shadowing bindings share one chain group — the designed
  contrast with `usage`'s binding-scoped axis).
- **Binding identity is `declarationRange` ONLY** (`binding-group-key` tests):
  two same-range bindings key identically regardless of name AND regardless of
  kind — "kind is non-identity convenience data — it must never fold into the
  key"; same-name shadowing bindings key apart by site.
- Which serializers live in `keying/` vs inline is a recorded convention (prose
  canon — a `keying/realm-group-key.ts` header comment, not test-pinned):
  `element-type:` is an inline key in V6b, not a `keying/` file. Keep the file
  placement on port.

## The R-6 occurrence-class ruling (`usage:occ`) — READ BEFORE WIRING SCOPE [S3]

The quarry's hand-rolled scope forest — built by the LIVE legacy
`src/lib/embody/lib/scope/build-scope.ts` ([SPEC.md](./SPEC.md) § Terms, embody
tree #1), which the quarry's 44-line `resolving/read-scope-forest.ts` accessor
reaches via `../../../../embody/…` — resolves an identifier occurrence to a
binding only for the **legacy tracked set** — `{var, let, const}` declarator ids
plus the `for-of` left. Everything else (free globals, function names,
parameters) is unresolvable and falls back to a **group-of-one** key
`usage:occ:<start>-<end>` — isolated mastery, no propagation. Pinned in
`lib/quizzing/tests/v7-usage-kind.test.ts` ("falls back to a per-occurrence
group-of-one for a free global", "…for a function name and parameters the scope
forest does not track"; resolved and unresolved occurrences coexist
per-occurrence in one snippet) — 33/33 green at ruling time [measured:
`./node_modules/.bin/vitest run` on that file, 2026-08-05].

**The trap R-6 closes**: greenfield `facts.environment` (eslint-scope) DOES
resolve function names and parameters, so a naive "pre-resolved refs collapse
`resolveBinding` to a lookup" swap breaks those pins and silently changes
pedagogy (params/function names would join V10b bulk-credit and V10c sameness).
**Ruling R-6, Option A (human ruling 2026-08-05)**: the Stage-3 shim answers
null for every occurrence OUTSIDE the legacy tracked set, preserving the occ
fallback verbatim. Free globals behave identically under both scope sources
(`resolved: null` either way).

**The second divergence R-6 also covers**: the landed shared adapter
`src/lib/study-lenses/lib/scoping/derive-scope-usage.ts` keeps only
`let`/`const` bindings — it EXCLUDES `var`, which the quarry quizzing forest
TRACKS (v7 pins var occurrences resolving to binding groups). So the quizzing
shim must include `var`; the shared adapter must NOT be reused as-is
([SPEC.md](./SPEC.md) Q13). Occurrence-class table:

| Occurrence class                                   | Quarry forest | eslint-scope     | R-6 shim       |
| -------------------------------------------------- | ------------- | ---------------- | -------------- |
| `var`/`let`/`const` declarator id + its references | resolves      | resolves         | resolves       |
| `for-of` left target                               | resolves      | resolves         | resolves       |
| function declaration name                          | occ fallback  | resolves         | **null → occ** |
| parameter                                          | occ fallback  | resolves         | **null → occ** |
| free global                                        | occ fallback  | `resolved: null` | null → occ     |

The table is illustrative, not exhaustive — the governing rule is the universal
sentence (null for EVERY occurrence outside the legacy tracked set). Catch
parameters, class names, import bindings, and function-expression names all
resolve under eslint-scope and none is exercised by a quarry quizzing test
[relayed: ar-2 probe + grep] — the shim answers null for all of them.

**Shim realization (recommended) and its structural pins.** The clean
realization is a forest **projection**: filter eslint-scope's defs to the
tracked set, register them **at their lexical scopes** into a quarry-shaped
`ScopeAnalysis`, and port `resolveBinding` verbatim over it. Under that
realization the null-outside-the-set rule is a corollary rather than a special
case, and two subtleties stay faithful automatically:

- `read-scope-forest.test.ts` pins the forest's STRUCTURAL surface, not just
  resolution: `.root.kind === 'program'`, `.root.declarations` is a `Map`, a
  nested block appears as `children[0]` with `kind: 'block'`, output frozen,
  throws on an unparsed snippet. Greenfield `facts.environment` carries a
  global/module DOUBLE scope on the Program node — the projection must collapse
  it to the quarry's single `'program'` root or those pins go red.
- Inside the tracked set the two scope models still differ on unpinned edges:
  the quarry registers `var` at its **lexical** scope while eslint-scope hoists
  it (`{ var x = 1; } x;` — quarry: occ; eslint-scope: resolves), and same-scope
  redeclaration identity is the LAST declarator under the quarry's `Map.set` vs
  naturally the first def under eslint-scope [relayed: ar-2 probe; no pin
  exercises either edge]. Lexical-scope registration keeps both quarry-faithful;
  if Stage 3 prefers otherwise, it declares those edges out-of-contract
  explicitly at its AR-1 rather than drifting silently.

`resolveBinding` feeds all 7 surviving scope-forest generators
(V6/V6b/V7/V8/V10a/b/c), and occ keys are also constructed in `v6b-const-update`
and pinned by `sameness-unlocks-contract.test.ts` (V10c unlocks must NEVER be
occ-fallback keys) — the ruling's blast radius is the whole scope-generator
family, not V7 alone.

**`resolveBinding`'s own oracle** is `resolve-binding.test.ts` (22 tests) — the
direct pin file for the function R-6 governs; a forest-projection rewrite must
keep five constraints it pins [relayed: ar-1, full read]:

- the binding carries its declaration `kind`, per-shadow ("carries the inner
  kind, not the outer, when the kinds differ across a shadow");
- the for-of arm is TWO behaviors: a body reference resolves to the iteration
  binding AND the iterable climbs out of the for-of scope to its outer binding;
- the returned range tuple is frozen;
- the input contract is a minimal `{ start, text }` occurrence, not only a full
  `ClassifiedToken`;
- a property-name occurrence never throws and resolves to null when no in-scope
  binding matches.

## Grading — total, binary, one-sided [S3; range grading also pinned lens-side, S5]

Pinned in `lib/quizzing/tests/grade.test.ts` +
`lenses/quiz/tests/grade-ranges.test.ts`:

- **`grade` is total and never throws.** A malformed response is a distinct
  verdict — never an exception, and never a penalty (the no-penalty half is
  pinned cross-cluster, in `mastery.test.ts`'s malformed-is-a-no-op — a UI bug
  must not cost the learner mastery).
- **Binary exhaustive set-equality, no partial credit**, across all three item
  VARIANTS (`mcq` / code-surface / `select-in-code`) — which is FOUR modes:
  `click-line` shares the code-surface item shape and grading arm with
  `click-token`, so "three variants" and "five-mode vocabulary" (§ Answer modes)
  are both true and porting `grade` to only three modes drops the pinned
  `click-line` arm. Partial selection incorrect; superset incorrect;
  order-independent; duplicates collapse to correct. Range comparison is exact
  tuple equality, pinned in BOTH directions (start-matches-end-differs AND
  end-matches-start-differs, in `grade` and again lens-side in `grade-ranges`).
  Empty-vs-empty is vacuously correct (a zero-target item is a generator bug,
  not grade's to police). A "subset counts" grading note was explicitly
  RETRACTED in the quarry docs — exhaustive set-equality IS the spec.
- **The malformed/incorrect boundary**: a known-but-wrong option id is
  `incorrect`; an id outside the item's own option pool is `malformed` with a
  developer `reason` string. Mode mismatches (item mode ≠ response mode) are
  malformed — 11 of the 12 ordered mode pairs are pinned, with a "does not
  match" reason asserted on 6 [relayed: verify:planned-unbuilt-supp-b — the
  audit's "all 9 pairs" was a miscount]. The unpinned twelfth pair is (`mcq`
  item → `click-line` response) — the existing mcq-vs-click pin uses the
  `click-token` default; one added assertion closes the grid.
- **One-sided seam**: `grade` never reads the Snippet; the Verdict never echoes
  the answer key; item `feedback` rides verbatim on BOTH correct and incorrect.
  Formative missed/extra feedback is deliberately computed lens-side.

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

Pinned in `lenses/quiz/tests/mastery.test.ts` (inc 7) +
`lib/quizzing/tests/sameness-unlocks-contract.test.ts` +
`v10a-binding-sameness.test.ts` + `v10c-cross-variable-use-type.test.ts`:

- A correct sameness (select-in-code) gesture credits the deduped
  `{own groupKey} ∪ item.unlocks` one step each, accruing on top of prior
  progress, capped at 1, PRESERVING a peer's prior `wrong` mark. An incorrect
  gesture flags only the own group and **never propagates**. Empty unlocks
  tolerated. Credit operates in the groupKey namespace — never item ids — which
  is what lets it survive re-keys.
- **Producer contract**: every `unlocks` entry is a namespaced groupKey
  (`^(binding|usage|usage-kind):`) carried by some emitted peer item, deduped,
  source-ordered. ONLY the sameness forms V10a/b/c carry the field. V10a/V10b
  are members of the group they unlock; **V10c is deliberately self-EXCLUDED**
  (it unlocks binding-scoped peers, not its own cross-variable group).
- **V10b↔V7 bulk-credit bijection**: every V10b unlock equals a re-keyed V7
  groupKey AND every re-keyed V7 usage key is unlocked by some V10b item — full
  coverage both directions. V10c unlocks are binding-scoped V7 usage keys, never
  occ-fallback keys, never globals.
- **Globals contribute targets, never unlocks**: recognition includes a free
  global as a target; credit cannot reach a nonexistent binding group. A global
  can even be the anchor when source-first.

## Generator registry — ordering is a contract [S3; panel admission S5]

Pinned in `lib/quizzing/tests/generate-quiz.test.ts` +
`lenses/quiz/tests/build-quiz.test.ts`; the taxonomy in the registry header
(`lib/quizzing/generators/registry.ts`):

- `generateQuiz` orders **token-anchored → node-anchored → program-anchored**
  (pinned in `generate-quiz.test.ts`); the finer "registry order, then stream
  order" tier — including its reverse-registry negative twin — is pinned in
  `run-generators.test.ts` ("concatenates generators in registry order, then
  stream order"). Deliberately NOT source-position order. Output is deep-frozen
  and deterministic; it throws on an unparsed snippet even with non-empty
  classified input.
- The panel admits by **MODE** (`mcq` | `click-token` | `select-in-code`), never
  by a form allowlist.
- The 12-generator taxonomy (10 after the realm drop): v1 category-id, v2
  keyword-vocab, v6 kind-semantics, v6b const-update, v7 usage-kind, v8
  declaration-site, v10a/b/c sameness, v3 provenance (dropped), v5
  value-category (dropped), v4 two-chains — **V4 deliberately last because it
  reads both anchor streams**.
- ⚠ **Surgical excision (Stage 3)**: the registry header's realm clause sits
  MID-SENTENCE, directly adjoining the V4-fires-last rationale. Deleting the
  V3/V5 imports and array entries is mechanical; the header edit must excise the
  realm clause while keeping the V4 rationale intact.

## Two-stream descent + the use-type taxonomy [S3]

Pinned in `lib/quizzing/tests/descend-identifiers.test.ts` +
`v7-usage-kind.test.ts` + `v4-two-chains.test.ts`:

- One AST descent produces two **deliberately disjoint** anchor streams:
  `identifierAnchors` vs `propertyAccessAnchors`. Non-computed member properties
  are excluded from identifierAnchors and emitted on the property stream
  (range + name, no usageKind). **Non-computed object-literal keys are excluded
  from BOTH streams** (pinned twice: "excludes a non-computed object-literal
  key" AND "emits nothing for a non-computed object-literal key", with the
  downstream V4 pin "emits no prototype-chain item for a non-computed
  object-literal key" — an object-literal key is not a prototype-chain lookup).
  Computed members and computed keys are scope reads on the identifier stream.
  Each stream is independently source-ordered. Disjointness is the inc-2 FLAG
  mitigation keeping property names out of `resolveBinding` **by construction**.
  The property stream is the sole feed for V4's prototype-chain anchors. The
  descent is self-contained pure-acorn (its private in-file `childNode` helper —
  no vendoring decision needed).
- **The 4-kind learner-facing use-type taxonomy** — `declared` / `read` /
  `assigned` / `read-and-assigned` — with pinned edge rulings: compound
  assignment (`x += …`), prefix and postfix update are ALL `read-and-assigned`;
  a `for-of` declares the iteration variable and reads the iterable; assignment
  targets range to the identifier, not the expression.
- **V4's two-chains pedagogy**: every identifier resolves via the scope chain,
  every non-computed property via the prototype chain (anchored to the PROPERTY
  span); a computed member is two scope-chain references and no prototype-chain
  item; chain grouping is binding-agnostic name-in-role.

## Defensive guards — the engine gates on parsed, not validated [S3]

- **var-laundering** (`v6-kind-semantics.test.ts`): `var` parses and REACHES the
  generators; build-scope launders var's kind into the `'let' | 'const'`-typed
  field. V6/V6b therefore guard **per-binding** — a snippet-level "contains var
  → bail" would drop the `let` too — rather than mis-grade var as
  non-reassignable.
- **V2 contextual keywords** (`v2-keyword-vocab.test.ts`): acorn's context-free
  tokenizer emits `obj.let` / `{ const: 1 }` as keyword tokens, so V2 fires only
  when the NEXT meaningful token is an identifier (a lookbehind guard would
  wrongly skip for-loop-init `let`); destructuring heads (`{` / `[` pattern
  openers) are deliberately declined — outside JeJ, matching the binding-aware
  forms.
- **V6b group separation** (`v6b-const-update.test.ts`):
  `element-type:const-update` is deliberately NOT `category:keyword` — V6b is an
  execution × atom runtime-error fact (answer: TypeError; with SyntaxError /
  ReferenceError / silently-ignored as misconception distractors) and must not
  share the text-surface recognition mastery group of V1/V2.
- **Representative rule** (`v10a-binding-sameness.test.ts` + `is-representative`
  gate): sameness forms emit exactly ONE item per propagation group, anchored at
  the group's **source-first** occurrence — even under TDZ ordering where a
  reference precedes its declaration; the anchor is itself a target (never
  special-cased); item ids key on binding identity independent of which
  occurrence is representative. The gate relies on members arriving
  source-ordered.

## QuizFilter — declared, NOT built; Stage 3 inherits a build decision [S3]

⚠ **Not test-pinned, and not implemented.** There are no filter tests in the
quarry; `generateQuiz` declares the parameter underscore-prefixed
(`_filter?: QuizFilter` — "part of the locked contract but is not yet
consumed"), the quarry lens README records "No config filtering (inc 8)", and
the only pin is `generate-quiz.test.ts`'s "accepts a filter argument as a no-op"
— which pins the NO-OP [relayed: ar-1, read of generate-quiz.ts + tests]. A
verbatim port ships a green no-op; do not mistake that for oracle-covered
filtering.

The intended semantics are design canon from the `QuizFilter` doc comment in
`lib/quizzing/types.ts` (mirrors `MicroDecisionConfig` SEMANTICS, not shape):
omitted group = no filter; all-false excludes; AND across groups, OR within;
`count` caps the source-ordered result LAST; `0` ≡ omitted; `range` = 1-based
inclusive LINES kept on any overlap. Stage 3 inherits a BUILD decision, not a
port decision — and the line-range arm has an unmet dependency the quarry docs
name: offsets→lines conversion via `Source.offsets`, which does not exist.
Line-ranges vs an offset flip (consistency with greenfield socratizing) is
Stage-3 AR-1 material. The quiz lens also declares a `categories` allow-list
knob that nothing consumes — same class: port the declaration, note the vacancy.

## Answer modes — five, with a build-state ledger [S5; the AnswerMode vocabulary rides S3's types port]

The `AnswerMode` end-state vocabulary is **five** modes — `mcq`, `click-token`,
`click-line`, `select-in-code`, `multi-mcq` — with a build-state ledger the plan
compresses to four: `multi-mcq` is enumerated but not built; `click-line` is
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

Quarry-doc prose (not test-pinned, still design canon): question forms are
organized by Block-Model cell; families build in order variables → operators →
literals → keywords → delimiters → calls → io; the curated-bank-vs-generated
provenance distinction is bounded by JEJ's finite concept set. Enumerated future
forms: V9 shadow, V12 binding-identity, V13 value-at-a-point, V14 lookup-depth —
all answerable by a static scope walk. The `Family` vocabulary (seven values,
quizzing's own coarse axis) corresponds to socratizing's `Feature` only
PARTIALLY and non-isomorphically — no total map is promised; the recommender
builds it where needed.

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
