<!-- TRANSITIONAL — retire this file only after its rulings are promoted to
their durable homes (the Stage-3/4/5 module docs, once those modules exist);
see § Ruling promotion at campaign close. Deleting it at campaign close would
recreate the off-repo-canon failure this campaign exists to fix. -->
<!-- cspell:ignore socratizing socratize quizzing reenrichment stonebraker -->
<!-- cspell:ignore bannered Toutes undercounts gagne tient pourquoi -->
<!-- cspell:ignore enregistre l'enregistre préserver dispositioned -->
<!-- cspell:ignore complet disambiguations ledgered unbuilt dans repoints -->

# socratize-quiz re-enrichment — ruling log

Human rulings and AR resolutions for the campaign that restores the
socratizing/quizzing spec layer lost in the study-lenses migration: re-homes the
off-repo forward canon, carries the retired orchestrator's pedagogy forward,
pins the pre-Stage-3 library contracts, and closes the quarry-retirement
destruction path.

Plan of record: `~/.claude/plans/you-are-opening-the-melodic-meerkat.md`.
Recorded here because a ruling that lives only in a plan file does not exist —
`git grep` cannot see it (DEV.md § Ruling provenance).

**Evidence base.** The audit
(`~/.claude/plans/socratize-quiz-impoverishment-audit-report.md`, 106 classified
findings) was independently re-verified before any ruling was put to the human:
a 12-agent adversarial workflow re-derived every finding from primary sources —
95 AGREE, 21 NUANCE, 0 DISAGREE; no finding changed class [relayed: workflow
wf_203ab7bb-621, 2026-08-05]. The material corrections the re-verification added
are folded into the rulings and the FLAGGED section below.

## Human rulings — 2026-08-05/06 (AskUserQuestion, campaign opening)

- **R-1 — the forward canon is re-homed in-repo, in full.** ["Full re-home"] The
  still-live content of the two off-repo plan files
  (`~/.claude/plans/read-and-execute-the-indexed-pony.md` — the self-declared
  canonical plan — and `…-the-playful-stonebraker.md`) transports into this
  campaign directory's `SPEC.md`; the off-repo files become bannered history.
  Closes the provenance violation and gives the four in-repo forward-promises
  (classifying/scoping/lenses/socratizing docs) a referent that `git grep` can
  see.

- **R-1a — the supplement transports in full (2026-08-06).** ["Transport
  complet"] AR-1 on C2 surfaced a third off-repo canon file R-1's question had
  not named — `~/.claude/plans/supplement-indexed-pony-scope-gotchas.md` (the
  buildScope/embody homonym warnings and the quizzing scope-surface file
  addresses). The human extended the full-re-home ruling to it: its gotchas
  enter SPEC.md (§ Terms + the Stage-3 cell), the file becomes bannered history
  like the other two.

- **R-2 — the quarry-retirement criteria name the question surfaces, all of
  them.** ["Toutes surfaces question"]
  `MVP-ROADMAP.md § Then — retiring the quarry` is amended to name the quiz
  lens, the quizzing engine, AND the question-orchestrator: none deletes before
  its content is ported or re-homed. The set at ruling time: 42 frozen test
  files across the three quarry dirs [measured: `find
  src/lib/study-lenses--deprecated-architecture/{lenses/quiz,lib/quizzing,lib/question-orchestrator}
  -name '*.test.*' | wc -l` → 42; one is `component.test.tsx`, so a `*.test.ts`
  glob undercounts].

- **R-3 — all three orchestrator-collateral concepts carry forward.**
  [multi-select: "Difficulty ladder, Coverage instrument, One-grid goal"] The
  Block-Model difficulty ladder (concrete-to-abstract ordering), the
  coverage-reporting instrument (spans/gaps over Block-Model cells,
  report-only), and the "two registers on one grid" pedagogical goal are carried
  as spec'd future work in this campaign's `SPEC.md` — none is discarded.
  Landing sites are decided at the consuming stage's AR-1, not here.

- **R-4 — the un-colorized-editor pedagogy WINS for the socratize lens.**
  ["Un-colorized gagne", then clarified: "because we will colorize all lenses at
  once with centralized utilities later" → "L'exception tient — c'est pourquoi
  on l'enregistre"] Syntax highlighting stays OFF in socratize so the lens's own
  decorations carry the only meaning. The exception is recorded in-repo
  precisely BECAUSE a centralized colorize-all-lenses sweep is planned later —
  this record exists so that sweep skips socratize. The conflicting pull it
  resolves: MIGRATION-PLAYBOOK locked decision (1) ("coloring = a shared
  facts-driven read-only highlighter") vs the quarry spec's deliberate
  dependency omission — noting the playbook's own locked decision (2) excludes
  socratize from its porting scope.

- **R-4a — no lens-coloring ruling beyond socratize; library first
  (2026-08-10).** ["you are again conflating the core library with the consuming
  lens. right now we should focus on the pedagogically soundest and richest
  _library_, we can build consuming lenses later."] Raised when AR-1 on C4
  measured that the quarry quiz lens's un-colorized property is NOT test-pinned
  (its component test explicitly declines the jsdom assertion;
  sandbox-checkpoint verification only) and asked whether R-4 should widen to
  cover quiz. The human's answer: the question is lens-side and DEFERRED to
  lens-building time. The false "test-pinned" claim — which entered via a C3
  reviewer proposal relayed without re-measurement, the exact failure the
  campaign's own hypothesis rule names — is corrected in both carrying files.

- **R-5 — no fresh lens Phase-0 now; the library is the focus.** ["I'm more
  worried about the library, you can just copy-paste the lens DDDs for later
  implementation in another session. the socratize library is the brains and
  soul behind the lens anyway"] The quarry lens DDD trios are copy-pasted into
  this campaign dir (annotated, byte-identical below the header) for a future
  session; restoration effort concentrates on the library layer.

- **R-6 — QT-09 resolves to Option A: preserve the `usage:occ` fallback.** ["A —
  préserver occ-fallback", after a full-context explanation was requested and
  given] The Stage-3 scope shim resolves only the legacy tracked set —
  `{var, let, const}` declarator ids plus the `for-of` left — and answers null
  for everything else (function names, parameters), so the quarry oracle's occ
  pins re-green verbatim [measured: `./node_modules/.bin/vitest run` on the
  quarry `v7-usage-kind.test.ts` → 33/33 passed, 2026-08-05]. The ruling covers
  BOTH divergences the re-verification measured: (a) eslint-scope resolves
  function names and parameters the quarry forest does not track; (b) the
  existing shared adapter
  `src/lib/study-lenses/lib/scoping/derive-scope-usage.ts:67-73` filters to
  `{let, const}` EXCLUDING `var`, which the quarry quizzing forest tracks —
  quizzing's Stage-3 adapter must include `var`. Mechanics pinned in this
  campaign's `LIBRARY-CONTRACTS.md`.

- **R-7 — the evaluators-campaign PATTERN, not its path.** ["mark the old ones
  as deprecated and start in fresh directories …" → clarified: "Le PATTERN
  d'evaluators, pas le chemin"] Originals stay referable (the quarry is
  untouched), weak spec-layer migrations get corrected, fresh content lands at
  its natural home; the canon lives in this campaign dir. Nothing
  socratize/quiz-related is created under `evaluators/`.

- **R-8 — ceremony (human-set): AR-1 on README-class content + AR-2 on
  DOCS-class content per `docs:` commit, + AR-5 pre-merge.** ["AR-1+AR-2 par
  commit docs, + AR-5"] The jej-registration R-4 / socratizing-remediation R-17
  precedent set for docs-only work, where AR-3/AR-4 have no object. Ruling
  transcription (this file) and byte-identical copies are records, not authored
  spec — no AR-1/AR-2 fires on them; they ride AR-5.

- **R-9 — the enrichment license is library-first.** ["+ spec library
  pré-Stage-3"] Beyond restoration: the re-verification-exposed gaps are closed
  (test-harness posture note, non-overlap invariant sentence, falsehood
  rewording), AND a pre-Stage-3 `LIBRARY-CONTRACTS.md` is authored pinning the
  fine contracts that today exist only in the 36 quarry quiz-surface test files.

- **R-10 — the orchestrator collateral's durable home is a carried-unbuilt note
  in `lib/socratizing/DOCS.md` (2026-08-10).** ["Note dans socratizing/DOCS.md"]
  AR-1 on C4 found the carry self-retiring: SPEC.md's banner authorizes
  retirement after Stages 3/4/5, none of which consumes the three collateral
  concepts, and R-2's "or re-homed" deletion clause would then resolve against
  an empty referent. Ruled: SPEC's § Orchestrator collateral is promotion-only
  (banner-exempt); its durable home is a short carried-unbuilt note in
  `lib/socratizing/DOCS.md`, landing at C7 beside that file's coverage-prose
  honesty fix; the C6 roadmap amendment cites that durable home.

## Work routing and ceremony

`work:` derives from the path — `.planning-handoffs/` is unnamed, which DEV.md's
table routes to software work; `src/lib/study-lenses/` docs edits are software
work. `retrospective` is blocked by DEV.md, so all rows are `prospective`.
`ceremony:` is the human's; R-8 above is that ruling, and each row records what
fires.

| increment | line                                                                                          |
| --------- | --------------------------------------------------------------------------------------------- |
| C1        | `work: software · twin-doc: none · ceremony: none fired (ruling transcription) · prospective` |
| C2        | `work: software · twin-doc: none · ceremony: AR-1 · AR-2 fired · prospective`                 |
| C3        | `work: software · twin-doc: none · ceremony: AR-1 · AR-2 fired · prospective`                 |
| C4        | `work: software · twin-doc: none · ceremony: AR-1 · AR-2 fired · prospective`                 |
| C5        | `work: software · twin-doc: none · ceremony: none fired (byte-copies per R-8) · prospective`  |

(Rows C3–C8 append as their commits land; the campaign SHA ledger below is the
commit index. Planned landings: LIBRARY-CONTRACTS.md at C3, SPEC.md §
Orchestrator collateral at C4, lens-ddd/ at C5, the MVP-ROADMAP amendment at C6,
the module-doc fixes at C7.)

**Reviews fired on C2.** `ar-1` → **PAUSE** (11 concerns): the one human item
became R-1a (the supplement's disposition); the author-side items were all
applied — the two dangling § Orchestrator collateral references now carry their
C4 landing markers (as do all links to C3/C5 artifacts), the three source files
were bannered BEFORE the transport commit so SPEC's "bannered history" sentence
is true, the stale roster claim was replaced by the measured three-lens state, §
Scope adapter was rewritten from the landed code (the AST-recompute rule
recorded as superseded in Q3), the RESUMPTION POINT ledger entry was split and
the live cspell obligation became F-4, the loss ledger was rebuilt by
heading-walk (its own note records the rejection), citation fragments and tag
forms were corrected, and a § Terms section now carries the
register/buildScope/embody disambiguations. `ar-2` → **CONSIDER** (6 concerns),
all resolved in-text: the roster bullet rewritten to measured state with the R6
flag marked resolved (C-1); Q13 strike-annotated as superseded-in-part by R-6
with the shim's landing site named as Stage-3 AR-1 material (C-2); the
`getChildNodes` sentence past-tensed into socratizing precedent with quizzing's
in-file `childNode` noted (C-3); Q4 extended with the gate-budget and
path-less-reference ratification items (C-4); landing increments named
everywhere (C-5); the ordering parenthetical, the 361-vs-396 attribution (now
361 + 35 measured per dir), the `.ok` narrowing, and the NodePath format note
all corrected (C-6). AR-2 concurred prose-only dependency description is
defensible for the residual two-edge graph.

**Reviews fired on C3.** `ar-2` → **CONSIDER** (7 concerns), all applied: the
`generate-quiz.test.ts` realm-assertion excision added to the Reading guide as a
second surgical-excision warning (C-1); the shim-realization paragraph added —
forest projection at lexical scopes, the `read-scope-forest` structural pins,
the double-Program-scope collapse, and the var-hoisting/redeclaration unpinned
edges (C-2/C-3); the table-is-illustrative footnote (C-4); stage tags on all
clusters + the banner extended to Stages 3 AND 5 (C-5); "re-green as-is"
qualified by the embody-import rewire counts (C-6); the forest-builder's
legacy-tree address named (C-7). The first `ar-1` dispatch died on an API error
with no verdict (its partial run also lacked the safety-classifier reviewer); a
fresh `ar-1` was dispatched as the review of record → **PAUSE** (12 concerns —
per the reviewer, none requiring a human ruling; all author-side accuracy
corrections, applied in full before the commit): § QuizFilter rewritten from
"pinned" to declared-NOT-built with the no-op pin and the missing
`Source.offsets` dependency named (1); the object-literal-key stream placement
corrected to excluded-from-BOTH (2); the mastery-durability claim split into
pinned (verdict per-pick) vs no-pin (durability — new flag F-5) (3); the rewire
quantifier widened to 30 of 36 (4); `resolve-binding.test.ts`'s five shim
constraints and `run-generators.test.ts`'s ordering pin added, plus the
no-cluster oracle list (5); prose-canon markers on the
provenance/keying-convention bullets (6); the three-variants/four-modes
disambiguation (7); the unpinned twelfth mode pair named (8); the range-equality
bullet corrected to both-directions tuple equality (9); cross-references
converted to links (10); the two malformed measured tags fixed (11); the
quiz-lens pinned editor posture added with its colorize-sweep implication (12).
AR-1's counter-proposal B (a 36-row oracle-index table) was partially adopted
via the no-cluster list; the full table is deferred to the Stage-3 session that
will consume it.

**Reviews fired on C4.** The first AR-1/AR-2 pair died on the weekly usage limit
with no verdicts (2026-08-06); fresh dispatches after the 2026-08-10 resume are
the reviews of record. `ar-1` → **PAUSE** (2 BLOCKERs + 11 concerns): BLOCKER 1
— the "quiz lens is TEST-pinned un-colorized" claim is FALSE (the quarry test's
own header declines the jsdom assertion); it had entered via a C3 reviewer
proposal relayed without re-measurement, and was corrected in BOTH carrying
files; the widening question it raised became the human's R-4a redirect (library
first). BLOCKER 2 — the carry self-retired under SPEC's banner while R-2's "or
re-homed" clause would read as satisfied over the empty referent; resolved by
the human as R-10 (durable home in socratizing DOCS at C7; banner exemption).
The eleven author-side items were applied: coverage-bullet sources extended to
the compose pair with quotes re-attributed (3); the quarry's own "Ratify or
adjust" status + named alternatives added to both instrument bullets, and the
ladder opt-out to the ladder bullet (4); the cross-register scope-reduction
caution added to the preamble (5); the C6-future-tense protection corrected with
its zero-hit measurement (6); the malformed sweep tag fixed and the sweep
re-enumeration adopted, naming local-llm's third "ladder" homonym (7, 10); the
playbook's R-4 pointer + indexed-pony repoints routed to C7 (8);
decorate/sort/strip annotated inside the parenthetical as the implementation
technique, "documented but not itself pinned" (9); the one-grid cross-reference
re-anchored on the shared `BlockCell` vocabulary with the `cells`-vs-`block`
field trap named (11, 12); citation fragments, internal R-4 pointers, and the
two verbatim quotes upgraded to [read:] (13). `ar-2` (fresh dispatch, review of
record) → **CONSIDER** (5 concerns, all applied): the banner-side R-10 exemption
clause added so both retirement authorities agree (1); the two files aligned on
"not test-pinned (doc-plus-sandbox)" for quiz's un-colorized property, per
R-4a's own phrasing (2); the ladder opt-out's compose-pair attribution added
(3); the roadmap-absence tag given its reproducible command (4); this record's
own two imprecise clauses reworded (5). AR-2 verified every mechanism claim in
the two sections against the quarry and proposed no scope shrink under R-4a.

## FLAGGED — known gaps this campaign records but does not fix

- **F-1 — four engine behavior changes rest on commit records, not human
  rulings.** `mixed-condition-style` (same-subject narrowing), `empty-block`
  (control-flow-clause narrowing), `what-value-stored` (trivial-initializer
  widening), `voice-profile` (metric recalibration) are each covered by an
  agent-reasoned fix commit only — no AR-LOG R-number, and the port plan of
  record dispositioned analyzer bodies "verbatim" [relayed:
  verify:ruled-main-engine, 2026-08-05]. Human ratification = the still-open
  push gate over those unpushed commits.
- **F-2 — classifying's non-overlap invariant has no test pin.** The old quiz
  build test asserted `start >= previous.end`; no greenfield classifying test or
  doc pinned it at re-verification [relayed: verify:survives]. C7 adds the doc
  sentence; the test pin is code work outside this docs-only campaign.
- **F-3 — the quarry freeze has one sanctioned exception.** Commit `59043f52`
  reformatted quarry docs [measured: `git show --stat 59043f52` → 48 quarry
  files] — the maintainer's own prettier sweep executing remediation R-9's
  mandate ("The maintainer performs the sweep"), an authorized exception, not a
  breach. Line-number citations into quarry docs made before that sweep were
  re-validated after it.
- **F-4 — Stage 1's classifying docs owe a cspell pass before their push.**
  Carried from the bannered stonebraker RESUMPTION POINT (AR-1 on C2 caught it
  being ledgered away as "historical"): the two re-authored classifying docs
  were never cspell-checked because that environment's Node (20.11.0) predates
  cspell's ≥ 20.18 requirement. Both preconditions still hold [measured: `git
  merge-base --is-ancestor 21f871bd origin/main` → not an ancestor; `node
  --version` → v20.11.0]. Run `./node_modules/.bin/cspell` over
  `src/lib/study-lenses/lib/classifying/{README,DOCS}.md` in a Node ≥ 20.18
  environment before pushing those commits.
- **F-5 — mastery durability across picks has no test pin.** Surfaced by AR-1 on
  C3: the quarry quiz lens keeps `MasteryState` per-mount and nothing in the
  re-pick path clears it, but no component test asserts the durability (zero
  "mastery" hits in the three interaction test files [relayed: ar-1, grep]). The
  verdict-is-per-pick half IS pinned. Stage 5 owes the durability a test when
  the lens ports; `LIBRARY-CONTRACTS.md § Answer modes` carries the split
  sourcing.

## Campaign SHA ledger

| increment | SHA           | summary             |
| --------- | ------------- | ------------------- |
| C1        | (this commit) | open the ruling log |
