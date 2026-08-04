<!-- cspell:ignore reddy unobjected greppable injective -->

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
  today**: a grouping pair can never wrap an import or export specifier's
  identifier, so the shared node never carries a span and nothing
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
