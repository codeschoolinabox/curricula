<!-- cspell:ignore spellme lookaheads tokenizer ZWNBSP -->

# Phase 1 — `lib/scanning`, then `spellme`

**Phase 0 is closed. Phase 1 is UNDER WAY.** The canon is the in-repo READMEs
and DOCS.md sketches, and this file deliberately does not restate them.

⚠ **Only § Rulings of record and § Where things stand are maintained.**
Everything below describing what Phase 1 _will_ do was written before it began
and has not been kept current — treat it as the campaign's opening statement,
not its status.

**`lib/scanning` Phase 1 is CLOSED**: 78 of 78 passing, 0 skipped [measured
2026-08-19]. § Where things stand carries the SHA list; the status lives here,
not elsewhere. [`./WAVE-2-BRIEF.md`](./WAVE-2-BRIEF.md) is now a **closed
record** and says so in its own banner — this file used to route readers there
for live status while that file routed them back here, and each disclaimed
itself. [`./WAVE-1-BRIEF.md`](./WAVE-1-BRIEF.md) is a **historical record, not
live status**: it briefed a wave that planned 33 un-skips and stopped at 24 by
design, and its own numbers (33-of-67, six rulings) were true when written and
are not now.

## Where things stand

**This campaign's commits — a SHA LIST, never a range.**

| SHA                     | What                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| `a38cc03f`              | the user twin gets its name (DEV.md)                                             |
| `9eea31a3`              | the user twin is named for its concern — DEV.md, the `ux/` name                  |
| `349d2f99`              | `lib/scanning` Phase 0                                                           |
| `80306ad9`              | `spellme` Phase 0 — cites `bnd-009`                                              |
| `da7cb376`              | this document, `EMBODY-FLAGS.md`, and the deferred brief                         |
| `7e083de2`              | the Phase-0 top-up — four fixtures, suite 63 → 67                                |
| `a5fb4a08`              | § Rulings of record, and the wave-1 brief lands in-repo                          |
| `1c6736c9` … `803f4642` | **wave 1 — ten increment commits**, see [`./WAVE-1-BRIEF.md`](./WAVE-1-BRIEF.md) |
| `542d4771`              | DEV.md's first-user-twin ruling names `spellme`                                  |
| `d2688fd8`              | second Phase-0 top-up — four more fixtures, suite 67 → 71                        |
| `2989d9e1`              | the naming table stops carrying a contradicting second spec                      |
| `065afc16` … `10cec890` | **wave 2 — nine increment commits**, listed individually below                   |
| `0281cfa6` … `e7627ccf` | **post-AR-5 remediation — five commits**, listed individually below              |

**Wave 2's nine, as a list — never as a range** (`065afc16..10cec890` spans
dozens of foreign commits): `065afc16` `7046bc01` `26eba4a5` `9d719f17`
`25449442` `2200c512` `c9d8d40a` `f63b7b2a` `10cec890`. Phase 1's un-skips
closed at the last of them, 71 of 71 passing [measured 2026-08-18].

**The post-AR-5 remediation, also as a list** — 90 foreign commits landed behind
`10cec890` alone [measured 2026-08-19: `git rev-list --count 10cec890..HEAD`]:

| SHA        | What                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------- |
| `0281cfa6` | the closed brief stops claiming work remains; this table's `<wave 2>` placeholder filled |
| `237bdd10` | the boundary guard narrows to presence; DOCS follows (human ruling 2026-08-18)           |
| `42516f1c` | three kind-table locks — U+2029, ZWNBSP, NBSP                                            |
| `39e792e9` | `lib/classifying`'s mirror-image contract reconciliation                                 |
| `e7627ccf` | the error-class assertions `237bdd10` dropped are restored                               |

Suite after them: **78 passing, 0 skipped** [measured 2026-08-19]. The six
handoff-doc commits riding with the campaign: `6e1926c3` `38fee403` `eacae342`
`6ecb22e9` `0281cfa6`, and the one adding these rows.

⚠ **This table has now failed the same way twice.** It read
`` `<wave 2>` | the remaining 47 `` until 2026-08-18; then `0281cfa6` filled
that row and **omitted itself and the four commits after it** until 2026-08-19,
when an AR-5 addendum caught it. Both are exactly what the warning below
predicts about a SHA list written last — including that the author's own last
commit is the one that goes missing.

⚠ **Foreign commits interleave all of those**, one of them landing _between_
`9eea31a3` and `349d2f99`. **Do not trust a count here — recompute it**, because
it moves within minutes: `git rev-list --count 6d1a811f..HEAD` minus this
campaign's own commits. It read 13 total / 9 foreign when this document was
written, 17 / 13 about two hours later, and 18 total / 13 foreign on 2026-08-14
— with HEAD moving three times during a single cold read of this file and eight
times during one planning session. `baseline..HEAD` has never been this
changeset. AR-5 takes the SHA list above plus whatever Phase 1 adds.

⚠ **This table did not list `da7cb376` until 2026-08-15** — the commit that
wrote this document was missing from the document's own record, so an AR-5
dispatched from it verbatim would have reviewed four commits instead of five. A
handoff's SHA list is written last and is exactly where the author's own last
commit goes missing.

**Gates at the close of Phase 0** [all measured 2026-08-14]: `npx tsc --noEmit`
0 errors · 148 tests, 145 skipped and 3 passing · cspell 0 · prettier clean ·
markdownlint 0 · `npm run check:governance` 0 errors and 62 advisories.

**The shared worktree is real.** A peer session held nine `.planning-handoffs`
files staged while these commits landed. Commit by explicit pathspec in one
shell invocation, with `--no-verify`; never unstage a peer's files.

## What Phase 1 is

Un-skip one test at a time, in ZOMBIES order, implementing until it passes.
`lib/scanning` first and completely — its `types.ts` is a type edge into
spellme's, so the two serialize.

**The suites are already written and committed skipped.** Nothing needs
designing. `it.skip` is the marker; delete five characters, go red, implement,
refactor against the DOCS.md sketch, move on. `git grep -c "it.skip"` per file
is an honest burn-down.

**The stubs to replace:**

- `src/lib/study-lenses/lib/scanning/derive-input-elements.ts` — one exported
  function. **Implemented through the naming rule and the gap fill as of
  `2989d9e1`**; the fold does not exist yet. In-file hoisted helpers, no new
  files: the fold, the naming and the gap split each have one call site.
- `src/lib/study-lenses/lenses/spellme/core.ts` — eight functions, all throwing.
- `src/lib/study-lenses/lenses/spellme/index.tsx` — the component throws; the
  frozen lens object is real and its three tests already pass.

**`lib/scanning` un-skip order** — file order **except** that Boundaries–tiling
moves to just before Interfaces (human ruling 2026-08-14, § Rulings of record):
Zero · One · Many · The vocabulary · Template folding · Right-brace
disambiguation · Trivia · Comments and the hashbang · **Boundaries–tiling** ·
Interfaces–frozen, pure and deterministic · Exceptions · Simple–the recorded
departures. **71 tests** since the second Phase-0 top-up (`d2688fd8`) [measured
2026-08-15], not the 63 this document first recorded. **Wave 1 stopped after 24,
before Template folding**, which is wave 2's.

The first un-skip was `Zero/returns nothing for an empty source`; it landed in
`1c6736c9`. The file to edit is `derive-input-elements.ts`.

Fake It is legitimate there and **expires at `One`**. DEV.md § Phase 1 says Fake
It expires when the next test is _written_, and here every test is already
written — the reconciliation is DEV.md § Phase 0's own argument that
tests-committed-skipped was chosen **over** a live red suite precisely because a
live suite "would expire Fake It immediately". Under committed-skipped,
"written" means "un-skipped". Cited here so the apparent contradiction does not
cost the next reader a hunt.

**Five phases, three named helpers, and that is deliberate.** § What lives here
names the fold, the naming and the gap split. The sketch's phase 1 (_Confirm the
reading_) is a guard clause and phase 4 (_Interleave the set-aside_) is a merge
— both stay inline in the export rather than becoming named helpers. The
Refactor step is held against the **phases**, not against a helper list.

## Rulings of record

The two questions this document used to hold were put to the human and answered.
These are this campaign's process rulings, recorded here because their end-state
home does not exist — a ceremony decision governs no module document — and
because a ruling that cannot be found by `git grep` does not exist (DEV.md §
Ruling provenance).

- **AR-3 is opted out for un-skips** (human ruling 2026-08-14). `ceremony: full`
  still stands and remains recorded on all three Phase-0 commits; this is the
  per-review opt-out, which is a separate mechanism from the level. AR-4 and
  AR-5 are untouched, and the opt-out does not extend to them. The literal
  reading it replaces was 145 AR-3 invocations across the two modules.
- **Phase 1 fans out, and every decomposition is validated context-free before
  its launch** (human ruling 2026-08-14). `lib/scanning` is one public export
  and does not decompose — one worker's cluster, split into sequential waves at
  committed boundaries. `spellme`'s `core.ts` carries eight largely independent
  functions and is the real fan-out; it must not start until `lib/scanning` is
  green, because its `types.ts` is a type edge.
- **Four fixtures were added to the committed Phase-0 suite** (human ruling
  2026-08-14). Two pin the token-index join key — which no fixture pinned, so an
  implementation indexing into its own output rather than the caller's token
  array passed every test. Two close accidental generalizations in the naming
  rule. Suite 63 → 67; landed in `7e083de2`.
- **The `Boundaries — tiling` block un-skips out of file order** (human ruling
  2026-08-14), immediately before `Interfaces` rather than at its file position.
  Its five tests sweep the whole pipeline over a 29-item corpus (22 when this
  ruling was taken; `d2688fd8` added five); un-skipped early they license two
  structural fakes — a zero-width filter standing in for the template fold, and
  "a non-whitespace gap is a Comment" standing in for the comment merge — that
  leave no hardcoded value for the Refactor step to find. ZOMBIES order
  survives: the blocks it moves past are unlettered.
- **An increment is bounded by exactly one red event** (human ruling
  2026-08-15). An earlier decomposition carried increments with no red test at
  all, justified by an appeal to the human's approval of the decomposition's
  shape — an authority that was never given and could not be cited. Those
  increments are merged into the driver that precedes them, so DEV.md § Phase 1
  step 5 holds unamended and no departure needs defending. Un-skips still happen
  one at a time; a test that arrives green rides into the open increment with a
  one-line record of what it would have caught.
- **AR-5 is the orchestrator's, not the worker's.** Its inputs — the
  plan-approval baseline SHA and the campaign's whole SHA list — are things no
  worker holds, and its cross-increment-coherence focus spans waves. It fires at
  each wave boundary as well as at the end of Phase 1, because DEV.md's trigger
  includes "the last commit before a handoff" and a worker handing back to a
  fresh worker is one. This adds a firing rather than removing one. No
  governance text assigned it; this line is the assignment.
- **DEV.md's first-`user`-twin citation names `spellme`** (human ruling
  2026-08-15, given as explicit instruction to edit governance surface). It had
  said "the scanning lens", a module that does not exist: at HEAD `scanning` is
  a domain-blind leaf recording `twin-doc: none`, while the twin lives in
  `spellme/ux/`. Landed in `542d4771`, one phrase, with `cspell.json` gaining
  `spellme` beside its sibling lens names because naming the module correctly
  introduced a new unknown word.
- **Four more suite gaps close with fixtures** (human ruling 2026-08-15), the
  same class of decision as the four-fixture ruling the day before. AR-5 found
  the `StringLiteral`-keeps-its-quotes FLAG confirmed and three more of the same
  shape: numeric-separator text, the extent of `WhiteSpace` and `LineTerminator`
  — README promises tab, NBSP, ZWNBSP, U+2028 and U+2029 and the suite had
  **zero** fixtures for any of them — and trivia carrying no token index, which
  no assertion touched, so an implementation stamping a gap with its neighbour's
  index passed all 67 tests.
- **The test helpers' `sourceType` parameter is kept and justified rather than
  deleted** (human ruling 2026-08-15). It was dead scaffolding — no fixture ever
  passed it. The fixture that earns it is a legacy octal: `0755` tokenizes as a
  `NumericLiteral` under `script` and **throws** under `module` [measured
  2026-08-15], so the test can only be written in script mode. It is also
  precisely this module's stated reason to exist — a program that lexes but does
  not parse under strict.
- **Narrow the contract, not the guard; and three more fixtures land.** (human
  ruling 2026-08-18) Two decisions on one day, both at the AR-5 that closed
  `lib/scanning` Phase 1. **First**: the boundary guard type-checked `code`
  while presence-checking the two arrays, and `DOCS.md` said "fail loudly at the
  boundary, never inside" unqualified. Asked whether the code should widen or
  the sentence narrow, the human ruled **narrow** — recorded inline in both
  leaves' `DOCS.md`, where § Ruling provenance puts it. **Second**: fixtures for
  U+2029 and ZWNBSP were approved by name; **NBSP was not** — a review sweep
  found it in the same hole and it landed under the batch-fix rule, disclosed in
  `42516f1c`'s body. ⚠ That body also asserted this campaign "has required
  [human approval] of every suite change since 2026-08-14". **No such standing
  rule exists in the tree** [measured 2026-08-19], and the two commits after it
  added seven more tests without invoking it. What is true is narrower and is
  what this bullet records: three specific suite changes were put to the human
  and approved (2026-08-14, 2026-08-15, 2026-08-18). Whether a general rule
  should exist — and where the line falls between a new fixture and a regression
  lock on an already-documented contract — is **an open question for the
  human**, not a rule an agent may declare. It is recorded here because a claim
  made in an immutable commit body cannot be corrected there.

## Traps, each of which has already cost something

- **The test helper must mirror `embody/derive-tokens.ts`** — `acorn.tokenizer`
  with `ecmaVersion: 2024`, `onComment`, `ranges: true`. **Not** classifying's
  `acorn.parse` + `onToken` helper: that runs at 2022 and refuses every program
  that lexes but does not parse, which is the case both modules exist to serve.
  The committed suites already do this correctly — do not "fix" them toward the
  sibling.
- **The generator form of `tokenizer` emits no `eof` token.** Classifying has an
  `eof` guard; copying it here is dead code.
- **`loc` is always `undefined`** — embody passes `ranges: true`, not
  `locations: true`. Anything reading `.loc` is dead code.
- **Never read `token.value`.** It is absent from acorn's `.d.ts` and is an
  _object_ for a regular-expression token. Source-slice authority is not
  stylistic here.
- **Do not deep-freeze anything holding a parser token.** The published contract
  is token _indices_ precisely so the freeze stays inside this module.
- **Copy `lenses/parsons/core.ts`'s `config()`, never `writeme`'s.** writeme
  spreads overrides bare with no `undefined` filter and violates the kind
  contract's absent-key rule.
- **Plant no new `PINNED(` markers.** `pinned-guard.py` exists in
  `.claude/hooks/` but is **not registered** in `.claude/settings.json`
  [measured 2026-08-14: `grep -c pinned-guard .claude/settings.json` → 0]. Ship
  the assertion; plant the marker when the guard is re-armed.
- **`eslint` always errors on a `.md` file in this repo** —
  `classifying/README.md` reproduces it identically. `.md` routes to
  markdownlint. Do not chase it.
- **`markdownlint-cli2` with a bare file argument treats it as a glob** and
  lints nothing. The per-file form is `--no-globs "<file>"`.
- **Never run `eslint --fix`.** Read a peer's import block and match it by hand.
- **A settings line and a `(human ruling …)` parenthetical both wrap.** Prettier
  breaks them mid-line, so any single-line grep of either counts too few; run
  `tr '\n' ' '` over the file first.
- **cspell set-diffs go vacuous out of tree** — a baseline copy in a scratchpad
  reports zero words checked. Test each flagged word against
  `git show HEAD:<file>` instead.
- **`node scripts/repo-facts.mjs` caches its markdownlint number for 24 hours.**
  Every other line is fresh; that one may be stamped yesterday. Re-run
  `npm run lint:md` if the number matters.
- **Node is BELOW the engines minimum** — v20.11.0 against `>=22.11.0`, which
  repo-facts reports on its second line. `tsc` and `vitest` both run anyway and
  the whole of Phase 0 was built under it. Proceed; do not treat it as a blocker
  and do not silently upgrade anything.
- **`git grep -c "it.skip"` unscoped also matches `scanning/README.md`.** Scope
  it to the test file.

## Model and ceremony

`ceremony: full` for this campaign (human, 2026-08-14). Phase 1 is mechanical
Red→Green→Refactor over pre-written tests, so a cheaper session tier is
defensible — **and naming the cost is required**: `ar-3` and `ar-4` are pinned
to sonnet in their frontmatter either way, but `ar-5` inherits the session
model, so a downgrade means the pre-merge review runs at the downgraded tier.
Never pass a `model` parameter when spawning an `ar-N`.

## Gates the human holds

- The Phase-1 → Phase-2 boundary.
- `ar-5`, scoped by the SHA list above plus Phase 1's own commits.
- **The push, and it is far larger than this campaign.** `main` has **no
  upstream configured** [measured 2026-08-15: `git rev-parse --abbrev-ref
  main@{upstream}` → "fatal: no upstream configured"], and `origin/main..HEAD`
  is **91 commits** [measured 2026-08-15: `git rev-list --count
  origin/main..HEAD`]. Six of them are this campaign's. Do not present the push
  as "six commits" — whoever holds that gate is deciding about ninety-one, most
  of them other sessions' work. **This number climbs on its own**: it read 81 on
  2026-08-14, and a peer's own commit body that day said "'unpushed' turns out
  to mean 83 commits, not 8". Re-measure it at the gate; never quote this line.

## Deferred, and recorded elsewhere

- **Folding `scanning` and `classifying` into embody** —
  [`../embody-derivation-facts/BRIEF.md`](../embody-derivation-facts/BRIEF.md).
  Happens after `lib/scanning` is green, not before.
- **Five measured embody defects** — [`EMBODY-FLAGS.md`](./EMBODY-FLAGS.md).
  None blocks this campaign and none is this campaign's to fix.
- **The fall's motion design and its reduced-motion equivalent** — a sandbox
  checkpoint against a running surface, per `spellme/DOCS.md` § Out of scope.
- **Four findings from the Phase-1 close that have no other home** — recorded
  here because the reports that found them are gone and the bodies that would
  hold them are immutable. None blocks anything.
  1. **A relay shipped under a `measured` tag.** `39e792e9`'s body reads
     "[measured by the reviewer]" for the no-live-consumer claim. That is a
     relay wearing the wrong label — `[measured:]` carries a command run this
     session, and a subagent's finding is `[relayed:]`. **The substance is
     true**: an AR-5 re-ran it independently [relayed: ar-5, 2026-08-19] and the
     live quizzing imports take `ClassifiedToken`, the output contract, not
     `ClassifyInput`. Only the tag is wrong, and the body cannot be amended.
  2. **Six freeze assertions can pass vacuously.** `Object.isFrozen(undefined)`
     returns `true`, so each of the three `Object.isFrozen(elements(…)[0]…)`
     assertions in `scanning` and the three `result[0]` ones in `classifying`
     survive an empty or short return. They are covered in practice — the
     `One`/`Many` blocks fail loudly on an empty sequence — so this is
     triangulation carrying an assertion that does not carry itself. The minimal
     close is a `toBeDefined()` beside each, or asserting frozen-ness on a value
     the same test already pins.
  3. **`scanning`'s DOCS and README disagree about the caller's projection**,
     and the cause is foreign: § Out of scope still says projecting the three
     values is "the caller's one-line boundary… named in the README rather than
     done here", while the README after `60349d76` says a consumer holding an
     `Embodiment` does not call this module at all — the factory calls it once
     per settle. The README is also split against itself. **Not this campaign's
     to fix**; it belongs to whoever closes embody-derivation-facts, and
     `60349d76` edited README.md and types.ts without DOCS.md.
  4. **`lib/loop-guard`'s documented error discriminant is asserted by no
     test.** Its README promises a `reason` of `'parse-failed'` or
     `'multiline-injection'`; `LoopGuardError` is a type alias rather than a
     class, so `.toThrow(Class)` is unavailable, and no test mentions the field
     at all [measured 2026-08-19: `grep -rn "reason"
     src/lib/study-lenses/lib/loop-guard/tests/` exits 1 with no output, against
     a README naming the discriminant at lines 203, 204, 212 and 222]. A
     different module and a different campaign's work — recorded so the finding
     outlives the report. ⚠ The commit that first recorded this finding put
     "lines 202 and 262" in its body under a `[measured:]` tag; those were the
     reviewer's numbers, relayed, and they are wrong. The substance held under
     re-measurement — the line numbers did not. That body is immutable, which is
     why the corrected evidence lives here, and it is finding 1's defect
     committed inside the commit recording finding 1.
- **Registering `spellme` in the composition root is NOT Phase 1's job.**
  `orchestrate/lib/composing/built-in-lenses.ts` imports parsons and writeme and
  knows nothing of spellme [measured 2026-08-14: spellme appears in no file
  outside its own directory except `lib/scanning/README.md`]. A lens nobody can
  reach is not a defect at this stage — the lens object exists and is frozen,
  and wiring it up is a Phase-2 concern once there is something to mount. Do not
  add the import on the way past; it would put an unimplemented component in
  front of a learner.
