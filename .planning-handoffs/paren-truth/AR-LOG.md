<!-- cspell:ignore reddy unobjected greppable injective unlengthened quasis -->

# AR-LOG — paren-truth campaign (Shape C: fold the parse, entwine the parens)

Campaign ruling home per DEV.md § Ruling provenance. Phase-0 session opened
2026-08-03.

- Phase-0 baseline: `18223536a56b2f7eb6eb242c83d035447dc8ddb1` [measured: `git
  rev-parse HEAD` at pre-flight]
- Executes the settled 2026-07-30 rulings (Q1 Shape C, Q2 byPath stability, Q5
  locations OFF, Q6 token ranges, Q7 full ceremony) — trail:
  `~/.claude/plans/read-and-execute-claude-plans-cold-start-temporal-reddy.md` §
  FINAL RULINGS.
- Plan:
  `~/.claude/plans/read-and-execute-claude-plans-cold-start-hazy-mccarthy.md`
  (Plan-agent pass: CONSIDER, concerns folded in before approval).

## Rulings and resolutions (append-only; same-turn writes)

- **2026-08-03 ar-1 verdict: PAUSE** [relayed: ar-1]. Mechanism validated
  empirically (fold-equivalence over ~110 paren-bearing sources incl. `(a?.b).c`
  / `(a) = 5` / IIFE / comma-call: 0 divergences; wrapper spans always
  paren-delimited and strictly outside the inner node [relayed: ar-1, measured
  in its session]). PAUSE-tier concerns are contract wording/shape, pre-types:
  (1) bare-noun `grouping` homonym vs `lib/classifying`'s elimination-based Role
  (extensions provably differ at dynamic `import()`); (2) "purely to group it"
  excludes five measured families the record WILL carry — define by parser
  authority instead; (3) span tuple `[start, end]` vs the package's published
  `SourceRange { start, end }` shape (`lib/screening/types.ts:103-106`) — two
  incompatible range currencies for one concept; (4) sparse `Record` types every
  lookup present under a tsconfig without `noUncheckedIndexedAccess` [relayed:
  ar-1, measured] — value type needs explicit `| undefined`. CONSIDER-tier 5-9
  (`.range` optionality sentence; paren→node navigation note — `byOffset`
  returns the ENCLOSING node at a paren offset; published-only glossary
  vocabulary, retire "wrapper"/"fold" from README; residency argued via "ast's
  value is contractually a bare Program, never an envelope" + postMessage-safety
  leads L1; screening facts-vs-shape gap) and MINOR 10-14 to fold into 0.4/0.5.
  Human forks presented: CP-1 term (rename vs keep-with-disambiguation), CP-3
  span shape (fields vs tuple), CP-8 screening one-clause record (add vs skip).
  Resolutions append below when ruled.
- **2026-08-03 human ruling (ar-1 PAUSE resolution, three forks)** [relayed:
  maintainer via AskUserQuestion this session]:
  1. **Term = "grouping parentheses", kept, with disambiguation** — the two-word
     term stays (bare noun `grouping` never used by embody); the glossary entry
     carries one clause naming `lib/classifying`'s elimination-based `grouping`
     Role and the dynamic-`import()` divergence — the evaluator/generator
     disambiguation pattern.
  2. **Span shape = `{ start, end }` fields**, structurally matching screening's
     published `SourceRange` — not a `[start, end]` tuple. The two-currencies
     objection decided it.
  3. **Screening gets the one domain-blind clause** at its README paren sentence
     (shape reproduced, not the whole parse facts) — separate pathspec'd commit,
     literal diff at the 0.7 gate. L7's no-MECHANISM stance stands; this records
     the facts-vs-shape gap only.
- **2026-08-03 implementing-agent resolutions to ar-1 CONSIDER/MINOR tiers**
  (announced to the maintainer with the forks; unobjected): parser-authority
  definition replaces "purely to group it" (C2); sparse record's value type
  carries explicit `| undefined` under the measured
  no-`noUncheckedIndexedAccess` tsconfig (C4); glossary rewritten in
  published-only vocabulary — "fold"/"wrapper" retired from README, mechanism
  vocabulary lands in DOCS (C7); `.range`-optionality sentence dropped in favor
  of always-present `.start`/`.end` + UTF-16-code-unit + half-open wording (C5,
  C11); paren→node navigation caveat documented — `byOffset` resolves a paren
  offset to the ENCLOSING node (C6); residency argued from "ast's value is
  contractually a bare Program" + path-keyed data needs the tree,
  postMessage-safety leads L1 (C8, CP-7); "What lives here" enumerates files
  individually like peer regions (C12); DOCS phantom-lib bullet lands in the
  same commit as README's (C13); Entwined type-level doc-comment amendment added
  to step 0.4 (C10); fold implementation traps (metadata-key guard, array
  positions, range identity) recorded for the Phase-1 sketch (C14). Reverse
  paren-offset index: deferred as purely additive [relayed: ar-1 — "can be
  deferred without cost"], navigation sentence ships now.
- **2026-08-03 human ruling (Phase-0 types timing)** [relayed: maintainer via
  AskUserQuestion this session]: **ParenSpan now, member in Phase 1.** Phase 0
  lands the `ParenSpan { start, end }` type only (compiles, inert); the required
  `parenSpans` member on `Entwined` — declaration
  `readonly parenSpans: Readonly<Record<NodePath, ReadonlyArray<ParenSpan> | undefined>>`
  — lands in Phase-1 increment 3 WITH its implementation, alongside the C10
  `Entwined` doc-comment amendment. Rationale: tsc-0 shared-tree gate holds
  every commit; no transitional optionality; published data never lies (a
  stubbed `{}` would read as "no parens" on paren-bearing sources). Rejected
  alternatives: optional-member-now; required-member + `{}` stub.
- **2026-08-03 standing flag L6 (deferral rationale, git-greppable per plan)**:
  making `range` REQUIRED on published parse facts stays deferred — the paren
  record is embody's own `{ start, end }` data, independent of acorn's optional
  `node.range` typing; the narrowing ripples package-wide and belongs to its own
  campaign. Surfaced at the Phase-0→1 gate.
- **2026-08-03 ar-2 verdict: CONSIDER** [relayed: ar-2] — sketch shape,
  altitude, unchanged Data-flow diagram, mechanism-neutrality, residence
  sentence, phase boundary, and all three pins survive challenge; span semantics
  and the classifying-divergence claim verified first-party in its session.
  Implementing-agent resolutions, applied same turn: C1 bare-noun "each
  grouping" in the DOCS bullet → "each pair of grouping parentheses" (conforms
  to the term ruling's letter); C2 false README claim "`(a) = 5` is the only
  legal parenthesized assignment target" (also `(a.b) = 5` / `(a[0]) = 5` are
  legal [relayed: ar-2, measured against the repo's acorn]) → reworded to the
  reads-through-parens vs parenthesized-pattern contrast under "Some are
  load-bearing"; C4 "the published settings" → "the shared leaf's published
  settings" (in-document referent, still domain-blind); C5 "each deriver" →
  "each file" (five region files are not derivers); C7 ParenSpan doc gains the
  third contract decision (sparse-absent). C6 (position-vocabulary precision
  asymmetry vs committed "source character offset" phrasings) — documented,
  deliberately NOT edited this diff: committed-text alignment is its own later
  pass. C3 (gate integrity): scoped suite red from FOREIGN churn —
  `orchestrate/generator/tests/index.test.tsx` "stopping an ask closes the
  output slot again", a dirty concurrent-stream file outside the artifact set;
  embody's own suite 10 files / 408 passed / 0 failed [relayed: ar-2, measured]
  — 0.7 must re-measure with per-file attribution and the commit body must scope
  its green claim accordingly.

## Phase 1 (implementation) — opened 2026-08-04

- Phase-1 baseline: `e7f693a851567574c5ef926f74a58873b02bd946` [measured: `git
  rev-parse HEAD` at this session's start]. Scoped gate GREEN at that baseline —
  119 files / 3045 passed / 8 todo / 0 failed [measured: `npx vitest run
  --project unit src/lib/study-lenses/`]; ar-2's C3 foreign red
  (`orchestrate/generator`) has since gone green, so no foreign failure is
  attributable this session. Plan: `~/.claude/plans/joyful-sniffing-pike.md`
  (Plan-agent passes ×2: the transport fork and the TDD decomposition, both
  folded in before approval).
- **2026-08-04 implementing-agent decision (increment 1's testable seam — the
  launch brief assigned this call, no ruling covers it)**: the fold is
  behavior-preserving at `deriveAst`'s published boundary **by construction**,
  so no test on the published tree can go Red when it lands. Increment 1 is
  therefore a characterization guard net committed BEFORE the fold — green at
  this commit and green at the next is the evidence the fold preserved behavior,
  evidence that does not exist if the guards land inside the fold's own commit.
  The honest substitute for Red is **deliberate-defect verification**: the fold
  was modelled out-of-tree with six defects and every guard evaluated against
  each. All six are caught [measured this session]. Only the own-span guard
  catches a span-hoisting fold; only the array-hole guard catches an array
  rebuild; only the ChainExpression guards catch a chain-skipping fold; the
  equivalence sweep catches all six.
- **2026-08-04 ar-3 verdict: CONSIDER** [relayed: ar-3] — the net is
  ZOMBIES-sequenced and convention-clean; the equivalence oracle is sound and
  its cross-region `PARSE_SETTINGS` import is architecturally clean
  (`lib/screening` is not one of the six tracked `STUDY_LENSES_SUBSYSTEMS`, so
  the `import/no-restricted-paths` zones do not reach it [relayed: ar-3,
  measured]). Two escapes named, both closed in the same increment: (1) a
  **clone-and-rebuild fold** passed every guard including the equivalence
  oracle, because `toEqual` is value-only — closed by switching the oracle to
  `toStrictEqual`, which compares prototypes (a rebuilt tree lands on
  `Object.prototype` where acorn's is `Node`) [measured this session]; (2)
  **nesting depth capped at 2** across the whole corpus — closed by 3-deep
  fixtures in both the equivalence sweep and the tree-wide negative sweep.
  ar-3's own counter-proposal for (1) — an identity assertion through a
  parenthesized fixture — was NOT adopted: both of its sides resolve from the
  same `ast.value`, so it holds whether or not `deriveAst` cloned, exactly the
  flaw already recorded for `index.test.ts:192-199`. A test that appears to
  guard what it cannot is worse than none.
- **2026-08-04 ar-4 verdict: CONSIDER** [relayed: ar-4] — gates and the two
  load-bearing mechanical claims (the `toStrictEqual` prototype distinction;
  acorn preserving a wrapped node's own span) reproduced first-party in its
  session. Its one IMPORTANT finding is resolved by this entry: an AR verdict
  relayed into a commit body needs its `[relayed:]` tag, and AR verdicts belong
  in this file rather than only in a session transcript. Its MINOR tag
  observations were applied to the commit body.
- **2026-08-04 standing carry-forward into increment 2's ar-4** [relayed: ar-4,
  concern 2]: two properties are **not** black-box testable from `deriveAst`'s
  return and must be audited by READING the implementation, not by trusting the
  guard net — (a) a **prototype-preserving rebuild** (`Object.create` of the
  right prototype plus a field copy) passes `toStrictEqual`, the own-span guard
  and the array-hole guard, yet violates "its nodes are the very nodes the parse
  built, held by reference, never reproduced"; (b) a **second parse** (one plain
  for the tree, one `preserveParens` only to harvest spans) passes every test in
  increment 1 while violating "nothing parses the same source twice". Both
  constraints are contract text, not test-covered. Named in increment 2's ar-4
  prompt.

### Increment 2 — the fold and its record

- **2026-08-04 ar-3 verdict: CONSIDER** [relayed: ar-3] — the two Red tests
  (Zero, One) needed no change, the `((x))` fixture genuinely discriminates
  outermost-first from innermost-first ordering (both are defensible readings of
  "bottom-up", and `toEqual` on arrays is order-sensitive), and the planned
  `PINNED(Phase-0 2ad2407b: …)` marker is legitimately grounded — the ordering
  landed in that commit's own `types.ts` diff and in DOCS § Parse decisions
  [relayed: ar-3, `git show 2ad2407b`], and the citation form matches house
  precedent at `lib/screening/tests/parse-settings.test.ts`. Three IMPORTANT
  concerns, all applied BEFORE the remaining tests were authored, which is what
  this gate exists for: (1) cardinality-only assertions (`size === n`) do not
  check **attribution** — a cross-wired record still counts right, so each
  parser-authority test now asserts per-node (`if (x) (y);` records nothing on
  the test and `[{7,10}]` on the consequent's expression; `f((a))` records
  `[{2,5}]` on the argument); (2) sparseness was untested on a tree that mixes a
  wrapped and an unwrapped node — a mixed-tree test now asserts the unwrapped
  sibling has no entry; (3) `derive-facts.ts` is a production call site the
  churn inventory had not named. MINOR: the churn counts are 22 and 101, not 17
  and 100 [relayed: ar-3, measured] — corrected in the commit body. Its judgment
  that the One test alone could still be passed by dispatching on the input
  string, and that Many is what closes that, is accepted; both landed together.
- **2026-08-04 ar-4 verdict: CONSIDER** [relayed: ar-4] — every carry-forward
  above verified by reading the implementation, as required, not by trusting the
  net: the fold constructs no node-shaped value by literal, `new`,
  `Object.create`, `Object.assign` or spread, so every survivor is the parser's
  own object reassigned into an existing slot; `range` is routed through the
  array path where the node check rejects each number, so its identity survives;
  exactly one `parse(` and no `tokenizer(` is reachable from one call [all
  relayed: ar-4, measured in its session]. It also confirmed the transport `Map`
  reaches no `Facts` member and therefore never meets the freeze, and that the
  churn diff contains nothing but the two call shapes. Its one IMPORTANT finding
  is resolved by this entry — a commit body claimed an ar-3 verdict that had not
  yet been written here. **This is the second occurrence of the same defect in
  two increments** (increment 1's ar-4 found it first); the rule that failed is
  "record on confirmation, not eventually", and the correction is to write the
  AR-LOG entry when the verdict arrives rather than when the commit is drafted.
  Surfaced at the close as a process finding, not only a fixed instance.
- **2026-08-04 ar-4 MINOR, accepted without change** [relayed: ar-4]: the fold
  does not recurse into an array nested directly inside another array. No ESTree
  node shape has an array-of-arrays property, so the gap is unreachable against
  the current grammar; adding a defensive branch would be speculative. Recorded
  so a future grammar change has a place to look. Stack depth is proportional to
  the tree's structural depth — the paren-draining loop itself is iterative — so
  it is the same risk class acorn's own recursive descent already carries, not a
  regression.

### Increment 3 — the published, path-keyed record

- **2026-08-04 ar-3 verdict: CONSIDER** [relayed: ar-3] — confirmed that `in` is
  the right sparseness instrument rather than `toBeUndefined()` (under this
  tsconfig the value type carries an explicit `| undefined`, so
  `toBeUndefined()` would pass for both an absent key and a key holding
  `undefined`, collapsing exactly the distinction the contract draws — and `in`
  also rejects the other prohibited form, a key holding `[]`), and that a
  failure-arm test would be vacuous because `deriveEntwined` returns on the
  upstream-failure branch before any record could be built. Three IMPORTANT
  gaps, all applied BEFORE the implementation was written, each the exact analog
  of a gap the fold-level gate had already caught one increment earlier: (1) the
  cardinality test did not check **attribution** — split into per-key `toEqual`
  assertions for the left and right pairs plus a no-phantom-entries count; (2)
  no **sibling** sparseness test — the wrapped node's unwrapped sibling now
  asserts absence, beside the existing ancestor case; (3) no **key-space
  coherence** test — a `parenSpans` key now asserts it resolves through
  `byPath`, the gap being that a drifted re-keying would address nothing and the
  sparse type makes that silent. Test order also corrected to Zero → One → Many
  → Boundaries.
- **2026-08-04 ar-4 verdict: CONSIDER** [relayed: ar-4] — every focus area
  verified by reading and by running: the freeze reaches `parenSpans`, its
  arrays and each `{ start, end }` (all plain, all region-allocated), while the
  transient `Map` is unreachable from `Facts` and so never meets it; key-space
  coherence is **structural**, not merely tested, because the indexing pass
  iterates `Object.entries(byPath)` and writes under that same key; no `[]` can
  be published because the span list is only ever set inside a loop that has
  already run once; and the separate indexing pass is the file's own precedent
  (`byOffset` is built the same way). One breaking-change site outside embody,
  and only one [relayed: ar-4, which swept for hand-built `Entwined` literals
  independently of tsc].
- **2026-08-04 ar-4 finding, APPLIED** [relayed: ar-4]: no test covered
  `derive-facts.ts`'s wiring — a regression substituting an empty `Map` at that
  one call site would typecheck and pass every test, because `deriveEntwined`'s
  own tests always build the record from the real `deriveAst`. Closed with one
  assertion in `derive-facts.test.ts` on a paren-bearing snippet.
- **2026-08-04 STANDING FLAG for the human — a committed contract claim is
  false.** `types.ts`'s `NodePath` doc says paths are "injective over one syntax
  tree: every node has exactly one path". They are not: for a bare
  `import { x }` and a bare `export { x }`, acorn hands back **one** Identifier
  object for both `local` and `imported`/`exported`, so two distinct paths
  resolve to the same node [measured: `node --input-type=module -e` against the
  repo's acorn, this session — bare forms `true`, renamed forms `false`; first
  surfaced by ar-4]. The claim is **pre-existing** — unchanged since before this
  campaign [measured: `git show 6614142e:src/lib/study-lenses/embody/types.ts`]
  — but it is newly load-bearing, because `indexParenSpans` is the first code
  that looks up by node identity across `byPath`'s whole key space. **No bug
  today**: a pair of grouping parentheses can never wrap an import or export
  specifier's identifier, so the shared node never carries a span and nothing
  double-publishes. NOT edited here — a published contract sentence is the
  human's gate, and this is a pre-existing falsehood rather than something this
  campaign introduced. Proposed resolution for the human: narrow the sentence,
  and pin the collision with a regression test. Surfaced at the Phase-1 close.
- **2026-08-04 PROCESS FINDING, third occurrence of the sourced-claims defect**
  [relayed: ar-4]: the tag form `[measured this session]` and
  `[measured this session: <command>]` do **not** match DEV.md's own audit
  regex, which requires the colon immediately after the word —
  `git grep -nE '\[(measured|read|relayed):'` finds neither [measured: that grep
  against both literal strings, this session]. Increment 3's commit body was
  corrected before it landed. **The bodies of `8da55d2f` and `6614142e` carry
  the non-conforming form and are immutable** (amend is forbidden), so those two
  commits' gate claims are invisible to the repo-wide audit. Recorded here so
  the audit trail exists somewhere greppable; surfaced at the close. Standing
  correction for every later commit in this repo: the tag is
  `[measured: <the command>]`, one tag per claim, never a bare parenthetical.

### Phase-1 close — ar-5

- **2026-08-04 ar-5 verdict: CONSIDER** [relayed: ar-5], scoped to the
  campaign's three commits; the concurrent generator-occupant commit `6d4fa40a`
  rode into the baseline range and was excluded [measured: `git log --oneline
  e7f693a8..HEAD` — four commits, one foreign]. It re-verified the campaign's
  load-bearing claim far beyond the suite's reach: **byte-identity of the
  published tree across ~32,300 comparisons** — a 76-source corpus, every
  `.js`/`.mjs` in the repo, and a 1,280-source paren-injection fuzz — JSON- and
  prototype-identical, 0 divergences, plus an **unclaimed failure-arm
  equivalence check** (77 unparseable sources: message, offset, line and column
  identical with and without `preserveParens`) [all relayed: ar-5, measured in
  its session]. It also corrected the PINNED inventory this session had relayed:
  **49 markers / 17 files at the baseline → 54 / 18 at HEAD, zero removed, zero
  inverted** — the "52 / 18" figure does not reproduce at the baseline commit
  and must not be carried forward [relayed: ar-5, measured].
- **2026-08-04 ar-5 concern 1, FIXED** [relayed: ar-5]: the fold ran inside the
  parse `try`, so a defect in embody's own machinery was caught and republished
  as a **learner grammar error in the parser's voice** — breaching "a defect in
  embody's own machinery is loud to the developer, graceful to the learner". The
  trigger is real and reproduces first-party: acorn parses `a` + `.b`×5000 and
  `a` + `()`×5000 fine, while the fold's structural recursion overflows
  [measured: `node --input-type=module -e` running the shipped fold algorithm
  against the repo's acorn, this session]. Fixed by hoisting the fold OUT of the
  `try`: only the parse is guarded now, so the cause the stage carries is
  genuinely the parser's, and a fold defect stays loud. Deliberately NOT covered
  by a test — a stack-depth threshold is environment-dependent and a test
  pinning it would be flaky; the property is enforced by reading, like the
  reference-preservation constraint above. The wider recursion-depth exposure is
  pre-existing (the same inputs already threw uncaught out of `deriveEntwined`'s
  walk at baseline [relayed: ar-5, measured]) and belongs to its own campaign.
- **2026-08-04 ar-5 concern 2, FIXED where reachable** [relayed: ar-5]: the
  human's term ruling — "bare noun `grouping` never used by embody" — had
  drifted back in at seven sites, the same violation ar-2 caught once in
  Phase 0. Renamed `foldGroupings`/`unwrapGroupings`/`isGrouping` to
  `foldGroupingParens`/`unwrapGroupingParens`/`isGroupingParens`; reworded three
  test titles and one PINNED marker (a wording change, never an inversion — the
  expectation is untouched). **The commit subject of `8da55d2f` carries it and
  is immutable**; recorded here because amend is forbidden. The homonym is live,
  not theoretical: `lib/classifying` assigns a token role literally named
  `grouping` by elimination, and claims dynamic `import()`'s paren, which the
  parser records no wrapper around [relayed: ar-5, read from that region's
  README].
- **2026-08-04 ar-5 concern 3 — correction to this log's own flag** [relayed:
  ar-5]. Two errors in the entry above. First, **all three** commit bodies are
  non-conforming, not two: `59a5ef60` fixed the `[measured` family but still
  carries `[both relayed]`, which the audit regex also cannot match. Second,
  **`git grep` cannot audit commit bodies at all** — it searches the tree; the
  working instrument is `git log -E --grep=`. By that instrument every one of
  the three commits is discoverable (each carries at least one conforming tag),
  while two carry a non-conforming `[measured` [relayed: ar-5, measured both
  forms]. Materially: no claim in any of the three bodies is substantively
  **wrong** — ar-5 re-ran every checkable one, including the churn counts, the
  `git blame` for `unlengthened`, the single breaking site, the warning counts
  and the byte-identity claim itself. The defect is tag form only.
- **2026-08-04 ar-5 concern 4, FIXED** [relayed: ar-5] — four coverage gaps
  invisible to any single increment's review, all closed at the close: (a) every
  new paren test used the **script** goal, leaving the module goal — the only
  goal where one node object is reachable at two paths — untested; (b) nothing
  pinned that the count of pairs the fold **recorded** equals the count the
  entwining walk **published**, so a divergence between the two traversals would
  lose spans silently; (c) `parenSpans` had no freeze assertion, breaking that
  suite's own per-published-member convention; (d) the standing flag's safety
  argument ("a pair can never wrap an import or export specifier") lived only in
  this log. One test each.
- **2026-08-04 ar-5 concern 5, NOT done — the human's gate** [relayed: ar-5]:
  `isNode` is now defined in both `derive-ast.ts` and `derive-entwined.ts`,
  which meets DEV.md's 2-call-site extraction bar, and the two walks carry
  **different metadata-key policies** (the fold filters nothing and argues the
  node check is the whole guarantee; `directChildren` keeps an `isMetadataKey`
  list whose own comment concedes the same point). They agree today, and the new
  count test in (b) above would now catch a divergence. Extracting a shared
  domain-related file is an inter-file two-tier trigger, so it is proposed, not
  taken. Surfaced at the close together with the policy question: delete the
  list, or adopt it in both.
- **2026-08-04 ar-5 concerns 6-9, recorded** [relayed: ar-5]: (6) the README
  file inventory said `derive-ast.ts  the syntax tree` for a file that now
  derives two things — **fixed**; ar-5's sentence-by-sentence loss-lens read of
  README and DOCS otherwise found **no false sentence**, so Phase 0 did describe
  what shipped. (7) `WeakMap` is arguably the closer fit than `Map` — the
  transport is never iterated, only `.get()` — which would make "never frozen,
  never serialized" structural rather than documented; a judgment call, no
  defect, left as is. (8) the AR-LOG's cspell pragma silently paid down Phase-0
  lint debt (`reddy`, `unobjected` shipped at `2ad2407b` without one) — scope,
  disclosed. (9) the transport is spelled `spansByNode` inside the fold's
  helpers where the sibling deriver would use a named building type; cosmetic.
- **2026-08-04 CORRECTION to `d6d4c6d4`'s own commit body — a wrong number, by
  the implementing agent, self-caught.** That body claims "embody suite 10 files
  / 457 passed"; the true count is **455** [measured: `npx vitest run --project
  unit src/lib/study-lenses/embody/`, run immediately after the commit landed].
  455 is consistent with every other figure — 451 at `59a5ef60` plus the four
  tests that commit adds — and the full scoped-suite figure in the same body
  (3093) is correct. The number was carried forward from an arithmetic guess
  instead of re-measured after the last edit: precisely the confident-repetition
  failure invariant 13 exists to stop, committed in the same body that resolves
  ar-5's findings about other tag defects. Amend is forbidden, so this entry is
  the repair. **Process correction, third distinct instance of the
  sourced-claims family in this campaign** (increment 1: untagged relayed
  verdict; increment 3: non-conforming tag form; here: an unmeasured number):
  every numeric gate claim is re-run in the same turn the body is written, never
  computed from a previous run plus a delta.

### Post-AR-5 follow-ups (maintainer-directed, 2026-08-04)

- **2026-08-04 human ruling (the two open flags, presented as forks)** [relayed:
  maintainer via AskUserQuestion this session]: (1) **push — deferred**, the
  commits stay local and the decision is taken later; (2) **the false `NodePath`
  claim — fix now, small scope**: narrow the sentence to what is true and add a
  regression test; (3) **`isNode` — extract AND unify the policy**: one shared
  file, and the metadata-key disagreement between the two walks settled rather
  than preserved. Rulings (2) and (3) discharge the published-contract and
  inter-file gates for those two changes respectively.
- **2026-08-04 ar-4 verdict on the `NodePath` fix: CONSIDER** [relayed: ar-4] —
  it verified the new sentence's completeness the strongest available way, by
  reading acorn's parser source: `parseImportSpecifier` and
  `parseExportSpecifier` are **the only two sites in the whole parser** that
  alias an already-built node into a second slot, corroborated by a
  ~40-construct sweep and by walking every parseable `.js`/`.mjs` in the repo
  (681 files, 113 collisions, every one an `Identifier` at an `imported`/`local`
  or `local`/`exported` pair, no other node type anywhere) [all relayed: ar-4,
  measured in its session]. Shorthand properties build two distinct identifiers
  despite identical spans, and `import { x as x }` does not collide — the
  parser's branch is syntactic, not name-equality. Two findings applied: the
  first test compared two optional chains to each other, so a regression wiping
  BOTH keys would make `undefined === undefined` read as a pass — each test now
  also pins the node's `type`; and `injective` was left behind in the file's
  `cspell:ignore` list once the word left the prose.
- **2026-08-04 STANDING FLAG for the human, discovered by ar-4, NOT fixed
  here**: where two paths share one node, **only one of the two `EntwinedNode`
  wrappers receives the shared token** — the other's `tokens` array is empty, in
  violation of that field's own contract ("Every token within the node's span").
  Measured on `import { x } from "m";`: the `imported` wrapper ties 0 tokens,
  the `local` wrapper 1; symmetric for a bare `export` [relayed: ar-4, measured
  in its session]. The mechanism is `entwineNode` building one wrapper per path
  while `fillSpans`'s identical-span tie-break ("the later-enumerated wins", its
  own committed comment) gives `byOffset` — and so `tieTokens` — only the last
  wrapper. **Pre-existing and untouched by this campaign**, but unlike the
  `parenSpans` case it is unconditional rather than "no bug today", and it
  reaches the canonical `byPath` entry point rather than only a consumer's own
  identity-keyed map. No test exercises `.tokens` on either wrapper of a
  collision. Fixing the tie-break is a materially larger change than the doc
  narrowing the maintainer authorized, so it is logged rather than taken.
- **2026-08-04 ar-4 verdict on the `isNode` extraction: PROCEED** [relayed:
  ar-4] — the campaign's only PROCEED. The one real risk was whether deleting
  `isMetadataKey` changes any path segment, since `directChildren` derives the
  package's canonical node identity and `byOffset`'s tie-break depends on child
  enumeration order. Measured neutral twice over: the implementing agent
  compared the full ordered segment list under both policies across 1275 parses
  — every `.js`/`.mjs` in the repo × both goals — with 0 divergences [measured:
  `node --input-type=module -e` harness, this session]; ar-4 then re-derived it
  independently over a **synthetic corpus the repo cannot exercise** — regex and
  BigInt literals, template `quasis`, private class fields, static blocks,
  computed keys, generators, optional chaining, `import.meta`, destructuring
  with holes and rest — 20 combinations, 0 divergences, and separately confirmed
  the harness was not passing vacuously. It also settled the one case neither
  corpus reaches: with `locations: true` acorn's `loc` carries only `start` and
  `end`, no `type`, so it fails the node check even then [all relayed: ar-4,
  measured in its session]. Two MINOR findings applied: the doc-merge loss
  ledger belongs in the commit body (three comments folded into one, nothing
  lost); and the framing's "110 entwined tests" was wrong — the measured count
  is 120.
- **2026-08-04 ar-4 finding, logged not fixed** [relayed: ar-4]: the
  `import/no-restricted-paths` boundary rule only blocks a sibling subsystem's
  `<subsystem>/lib/**`, and `embody/` has no `lib/` — every file sits flat at
  the region root. So the mechanical rule would not catch a cross-subsystem
  import of `embody/is-node.ts`, even though the prose intent is that only
  `index.ts` and `types.ts` are public. **Pre-existing** — every other flat
  embody file was already equally unprotected — and this increment changes no
  boundary config. Also confirmed: the other three copies of this predicate
  elsewhere in the package were rightly left alone, and `debug-props`'s is
  deliberately independent ("an independent route to the same set as the
  entwined index — agreement is the sanity check"), so merging it would delete
  the very independence that gives it value.

## F5 follow-on — the JEJ level's consultation harness (2026-08-05)

Executes [FOLLOW-ONS.md](./FOLLOW-ONS.md) § F5. Ceremony `full`, declared by the
human in the launch brief. Baseline `d83d1c22cea865d201c8969b096e3788372d7e3f`
[measured: `git rev-parse HEAD` at plan approval]. The changeset is a **SHA
list**, per DEV.md § Shared-worktree git mechanics — the range is mostly
foreign:

- `2f6720e1cf589b9b4fe94e054d82077fdc916ded` — `fix:` the crash + 6 fixtures
- `d8fa1461bc9a0ca5bbe58eaffe9e55f08f097902` — `refactor:` adopt
  `PARSE_SETTINGS`
- `e708841c416e13af1f3c8484a37cfa1b8875cc14` — `add:` the default-parameter
  fixture (ar-5's)

### Two corrections to § F5's own framing, both measured first-party

- **The crash trigger is broader than § F5 states.** It is not "a default
  parameter shadowed in the body" — `__isValidResolution` is an override on
  `FunctionScope`, so it fires on **any** reference resolving to a variable
  declared in that same function scope. Plain function, arrow, object method and
  class method all throw; a function with no references, and one referring only
  outward, do not [measured: `node --input-type=module -e` over 7 sources, acorn
  8.16.0 + eslint-scope 8.4.0].
- **`ranges: true` alone fixes it.** § F5 couples the fix to the `'latest'` →
  `2024` narrowing; they are orthogonal [measured: same probe,
  `{ecmaVersion:'latest', ranges:true}` resolves cleanly].

§ F5's escalation condition — "if any fixture depends on post-2024 syntax, take
the fork to the human" — **did not fire**: all 13 of the file's fixture sources
parse byte-identically under both settings once `range` is stripped [measured:
`node` JSON compare with a range-stripping replacer].

### Human rulings (2026-08-05)

1. **Both increments** — fix the crash, then adopt the published contract.
   Presented with the measurement showing the narrowing is unexercised.
2. **Pin the regression assertion, dated today.** The human was shown the "no
   pin" option with DEV.md's bulk-sweep warning quoted, and chose to pin. This
   ruling is the one `validate.test.ts`'s `PINNED(human ruling 2026-08-05)`
   cites; this row is its promotion out of a plan file.
3. **Resolve ar-5's PAUSE in full** — the fixture and this record, not either
   alone.

### AR verdicts and resolutions

- **ar-3 (increment 1): CONSIDER** [relayed: ar-3]. Confirmed the swallow-the-
  analyzer wrong fix survives Block A and is forbidden only by Block B. Asked
  for a shadowed-global fixture to close a non-scope-aware escape list.
  **Applied.** Also argued the PINNED marker was unearned — **overridden by
  human ruling 2**.
- **ar-4 (increment 1): CONSIDER** [relayed: ar-4]. Three findings, all applied.
  (a) The draft commit body overstated a test-only gap as a live defect —
  production has carried `ranges: true` since `d5162bc4` under a comment naming
  this exact hazard [measured: `git log -S "ranges: true" --
  .../derive-ast.ts`]. Body rewritten. (b) The pin's plural wording promised
  cluster-wide coverage the guard's 3-line window cannot give; narrowed to
  singular. (c) **ar-3's own fixture does not discriminate** — its declaration
  and reference share a scope, so a scope-blind escape list reaches the same
  verdict. The cross-scope fixture
  `'function f() { let document = 1; } document;'` is the one that closes it
  [measured: real `through` is `['document']`; a "declared anywhere" check would
  suppress it]. Both kept — together they pin scope-awareness in each direction.
- **ar-4 (increment 2): CONSIDER** [relayed: ar-4]. Two factual errors caught
  before the body became immutable: a fixture count of 11 that is really 13, and
  "None builds ParseFacts" when `language-levels/scaffold/tests/index.test.ts`
  does. Both corrected. The honest discriminator for not sweeping the four
  siblings is that **none calls `analyze()`** [measured: `grep -l eslint-scope`
  over the four].
- **ar-5: PAUSE** [relayed: ar-5]. The code held under attack from four
  directions; what blocked was the record, plus one gap: no fixture pinned the
  rule the quoted `scope.js:730` actually implements [read:
  `node_modules/eslint-scope/lib/scope.js:717-722` — "References in default
  parameters isn't resolved to variables which are in their function body."].
  **Applied** as `e708841c`. Note ar-5 predicted two violations for that
  fixture; the measured count is **three** — `AssignmentPattern` has no
  allowlist entry either [measured: `grep -n AssignmentPattern
  .../just-enough-js.ts` — no match].

### Cross-campaign: aithor FLAG 1 is now half-closed

`.planning-handoffs/aithor-contract-proposals/AR-LOG.md:367` flags
"`jej/tests/validate.test.ts` parses at `ecmaVersion: 'latest'` and analyzes at
`2024`". `d8fa1461` closes the **parse** half; the hand-typed `2024` in the
`analyze` call survives, and the line has moved. That ledger is foreign-modified
in the working tree, so it is deliberately not edited here — an aithor Wave-2
agent should read this row alongside it.

### Deferred, named rather than papered over

- **The `analyze()` call's hand-typed `2024`** — a third copy of the numeral,
  and `lib/screening/tests/parse-settings.test.ts`'s alarm does not reach it.
  Both obvious routes are blocked: `PARSE_SETTINGS.ecmaVersion` is acorn's union
  type and will not typecheck into eslint-scope's `number`, and importing
  embody's `ECMA_VERSION` would create the first `language-levels → embody` code
  edge. **ar-5 counter-proposes a third route** [relayed: ar-5, measured in its
  session]: changing `parse-settings.ts` to the `satisfies` form narrows the
  literal to `2024` and dissolves the type wall in one line — a shared-leaf
  change deserving its own increment. Unverified here.
- **Four sibling harnesses still hand-roll `'latest'`** — the three other jej
  tests and `scaffold/tests/index.test.ts`. None calls `analyze()`, so none is
  exposed. A sweep is scope creep.
- **The two `ranges`-less production parsers** the brief asked about —
  `evaluators/intercept/wrap-call-expressions.ts:117` and
  `lib/loop-guard/splice-loop-guards.ts:110`. **Measured not exposed**: neither
  reaches eslint-scope, neither reads `.range`, and `locations: true` is
  load-bearing for both. No action owed.
- **`.claude/settings.json` has the `pinned-guard.py` PreToolUse hook deleted in
  the working tree** [measured: `git diff -- .claude/settings.json`]; the
  committed state still registers it. The pin planted here rests on the
  committed state. `.planning-handoffs/aithor-contract-proposals/AR-LOG.md` row
  H6 reached the opposite conclusion the same day on the same question — flagged
  for the maintainer, not resolved here.

### Commit-body defects ar-5 found, unrepairable because amend is forbidden

Recorded here so the bodies are read with them: `2f6720e1` relays an ar-3/ar-4
exchange without a `[relayed:]` tag (the discipline is correct in `d8fa1461`);
it truncates a quoted `PINNED` from `derive-ast.test.ts:48`, closing a paren the
source does not close there; and four true-but-untagged repo-state claims appear
across the two bodies, of which "Production was never exposed" is the
load-bearing one — ar-5 verified it independently, finding exactly two
eslint-scope `analyze` call sites in the subsystem.

### Gate

`npx vitest run --project unit src/lib/study-lenses/` →
`Test Files 126 passed (126)` / `Tests 3375 passed | 8 todo (3383)`;
`npx tsc --noEmit` → 0; `npm run check:governance` → 0 errors, 62 advisories,
none touching the changed file [all measured this session]. The scoped-gate
baseline at plan approval was `1 failed | 125 passed` /
`42 failed | 3325 passed | 8 todo` — the sole failing file was foreign and a
peer has since fixed it.
