<!-- cspell:ignore spellme lookaheads tokenizer ZWNBSP undercounts -->
<!-- cspell:ignore wireframes worktrees -->

# Phase 1 — `lib/scanning`, then `spellme`

**Phase 0 is closed. Phase 1 is UNDER WAY.** The canon is the in-repo READMEs
and DOCS.md sketches, and this file deliberately does not restate them.

⚠ **Three sections are maintained: § Where things stand, § Rulings of record,
and § Traps.** Everything else describing what Phase 1 _will_ do was written
before it began and has not been kept current — treat it as the campaign's
opening statement, not its status. **§ What Phase 1 is is stale** and says so
where it matters: it still claims "the fold does not exist yet", false since
`065afc16`. The two rulings it used to be cited for now live in § Rulings of
record, because a ruling readable only from a disclaimed section is one a
careful reader may ignore.

**`lib/scanning` Phase 1 is CLOSED**: 78 of 78 passing, 0 skipped [measured
2026-08-19]. `lib/classifying` was reconciled alongside it (153 of 153). § Where
things stand carries the SHA list; the status lives here, not elsewhere.

🚧 **`spellme` PHASE 1 IS UNDER WAY — wave 1 is CLOSED (2026-08-20).** See § The
`spellme` LENS — Phase 1, wave 1 for its SHA list — **re-run its loop rather
than counting rows; this sentence said "ten" and was outgrown within the hour**
— and § The `spellme` LENS's rulings for the five decisions it took. Wave 2 is
`readStream` + `positionCursor`; wave 3 is the static surface and the first
eyeball check. ⚠ This banner read "THE NEXT CAMPAIGN _IS_ `spellme` PHASE 1"
until 2026-08-20 — true for one day, and then the same stale-redirect defect the
paragraph below documents about itself, for the third time in this file. **A
banner announcing what is next expires the moment someone starts it.** The docs
mini-campaign that preceded it
([`./ACQUISITION-ALIGNMENT-BRIEF.md`](./ACQUISITION-ALIGNMENT-BRIEF.md),
`adf83dc5`) **CLOSED** the same day in **six** commits — `614ab524` `191f7da9`
`120880d7` `349d3f0a` `01a87b9f` `f7eefe61`, the last being post-close handoff
debt. Read that brief's § CLOSED and its `### Recorded, not fixed` subsection
before starting: it hands Phase 1 two obligations and settles `applicability`'s
contract. Then start here.

That earlier ruling also **declined** moving `scanning` into `embody/` — see §
Deferred, whose bullet on the fold used to read as a go-ahead. A cold read of
this file on 2026-08-19 could not reach the next action at all: neither campaign
document named the brief, and the one pointer toward that area framed declined
work as pending. ⚠ **And then this paragraph became the same defect it fixed** —
a context-free validation on 2026-08-19 found it still redirecting away from the
campaign that had by then become next, sitting above the three maintained
sections where it reads as authoritative. A redirect is exactly the kind of
prose that goes stale the moment it succeeds.

[`./WAVE-2-BRIEF.md`](./WAVE-2-BRIEF.md) is now a **closed record** and says so
in its own banner — this file used to route readers there for live status while
that file routed them back here, and each disclaimed itself.
[`./WAVE-1-BRIEF.md`](./WAVE-1-BRIEF.md) is a **historical record, not live
status**: it briefed a wave that planned 33 un-skips and stopped at 24 by
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

Suite after them: **78 passing, 0 skipped** [measured 2026-08-19]. **The
campaign's doc-only commits — SIXTEEN, and do not read this list, RE-RUN IT**
[measured 2026-08-19: `git log --format=%h --
.planning-handoffs/spellme/PHASE-1.md
.planning-handoffs/spellme/WAVE-2-BRIEF.md`]: `f7eefe61` `349d3f0a` `16a3d187`
`6d7d3f08` `9bfac80d` `65215551` `0281cfa6` `6ecb22e9` `eacae342` `38fee403`
`6e1926c3` `9163a1c4` `e6e3e16d` `d2688fd8` `a5fb4a08` `da7cb376`, plus the one
adding this line.

⚠ **This count read "eleven" until 2026-08-19, when the loop it cites returned
sixteen** — a context-free reader ran the command the sentence carried and got a
different answer than the sentence. Three commits (`349d3f0a`, `16a3d187`,
`f7eefe61`) had edited this very file without recording themselves in it, and
`f7eefe61` did so in the round that was fixing a different instance of the same
defect. **That is failure four of the pattern the ⚠ below names.** AR-5 takes
this list, so a stale one under-scopes the review that would have caught it.

⚠ **This table has now failed the same way three times, and each fix failed
too.** It read `` `<wave 2>` | the remaining 47 `` until 2026-08-18. Then
`0281cfa6` filled that row and **omitted itself and the four commits after it**,
caught by an AR-5 addendum on 2026-08-19. Then the rewrite answering that
addendum **still omitted five doc commits** — including the two that had just
added § Deferred's findings — caught the same day by a context-free cold read,
with one loop over `git log`. Every occurrence is what the warning below
predicts: a SHA list is written last, and the author's own last commit is the
one that goes missing. **Run the loop before trusting this list rather than
reading it** — a list this often wrong is evidence, not authority.

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

### The `spellme` LENS — Phase 1, wave 1 (2026-08-20)

⚠ **Everything above this heading is `lib/scanning`'s, which is CLOSED.** The
lens is a different module and its Phase 1 opened 2026-08-20.

**Ten commits, as a LIST — and this list was RE-RUN, not remembered** [measured
2026-08-20: `git log --format="%h %s" --since="2026-08-19 23:00" --
src/lib/study-lenses/lenses/spellme/
.planning-handoffs/spellme/PHASE1-WAVE-1-BRIEF.md` → exactly these ten]:

| SHA        | What                                                             |
| ---------- | ---------------------------------------------------------------- |
| `c703b5c3` | the wave-1 brief lands in-repo, and why its workers run serially |
| `2cfbc364` | `config` answers the one-more threshold default                  |
| `6213f4a7` | `config` resolves both thresholds over the cascade's overrides   |
| `7b2b6d10` | `config` refuses a negative threshold                            |
| `528bf3bc` | `config` refuses a fractional or non-finite threshold            |
| `377b6be1` | the gate declines when the published member is absent            |
| `c01ad2bb` | the lens contributes no recommendations                          |
| `14652100` | the empty recommendation set is a stable frozen reference        |
| `3b4e9f80` | a line terminator carries the mark too                           |
| `ed76f43b` | an out-of-range threshold throws `RangeError`                    |
| `88daae6b` | this record learns the lens started, and what it ruled           |
| `8a144188` | the mark reaches the whole document set; both carriers drawn     |
| `6d3bef7f` | a fix round falsified a fact the next round certified as true    |

⚠ **Thirteen with the commit adding these three rows — which the loop above
cannot see, because it did not exist when the loop ran.** That is the fifth
instance in this file of the shape it documents about itself: the author's own
last commit is the one that goes missing. Named here rather than left to be
discovered. **Re-run the loop; do not read this table.**

**Suite after them: `22 passed | 65 skipped (87)` across three files** — the new
`tests/core-defect.test.ts` among them — with `core.test.ts` down from 54 skips
to **37** [measured 2026-08-20]. `npx tsc --noEmit` 0.

**The wave-1 `ar-5` returned PAUSE twice, then CONSIDER.** Both original
blockers (the `RangeError` ruling having no document home; the `marked` widening
reaching three documents and stopping) are **confirmed closed** by a reviewer
that wrote its own exhaustive sweep rather than reusing the author's. Round 2
found three more the first fix round had introduced or walked past — including a
self-contradiction _inside_ `DOCS.md` that two rounds of targeted edits missed —
and round 3 found one false supporting fact plus four minors. **The two round-3
CONSIDER items were fixed before handoff (`6d3bef7f`); the minors are routed to
close-out and are not blockers.** Wave 2 is gated on nothing but the two open
human items below.

⚠ **The transferable finding, now demonstrated three rounds running: the fix
round is where new defects enter.** Round 1's fix falsified a fact that round
2's fix then certified as "still true today". Always re-verify with the reviewer
that raised the finding, and sweep over `git ls-files` rather than over the list
of files you remember touching.

**Wave 1 covered the three clusters with no dependency on the element stream:**
`config` (+ `Exceptions`), `applicability` (+ the new defect file), `recommend`.

**Waves 2-5, RE-ORDERED (human ruling 2026-08-20):** wave 2 is `readStream` **+
`positionCursor`** (15 un-skips); wave 3 is the **static surface** — 23 of the
28 component tests — plus the sandbox injection, which is the campaign's **first
🔍 eyeball check**; wave 4 is `judgeClaim`/`handOver`/`settle`; wave 5 is the 5
component tests that drive the claim loop. **The canonical map lives in
[`./PHASE1-WAVE-2-BRIEF.md`](./PHASE1-WAVE-2-BRIEF.md) § The wave map**; wave
1's brief carries the superseded one and says so.

The re-order is grounded, not preference: only **5** of the 28 component tests
call `fireEvent` and therefore need the claim loop [measured 2026-08-20: `grep
-c fireEvent` over `tests/component.test.tsx` → 11 calls across 5 tests]. The
other 23 are static rendering needing only `config`, `readStream` and
`positionCursor`. Under the old order nothing was visible until 37 more core
tests had landed; under this one it is 15. It also lets wave 2 take plain **file
order** — the earlier plan had to carve `:34`/`:54`/`:58` out mid-block — and it
makes declining Fake It at `:30` correct rather than contested, because `:34`
cannot be satisfied honestly under a `return []`.

⚠ **The fan-out did not happen, and the reason is reusable.** A wave-0 probe
measured that `isolation: "worktree"` cuts worktrees from **`origin/main`**,
which is 2026-08-11 and **316 commits behind local `main`** at the time — so the
`spellme` lens does not exist inside such a worktree at all [measured
2026-08-20: `git ls-tree -d --name-only origin/main
src/lib/study-lenses/lenses/` → `debug-props lib parsons writeme`]. Everything
else about the mechanism passed: isolation genuine, vitest ran, tsc ran, `ar-4`
spawned and returned.

⚠ **It does NOT close the governance question, and `88daae6b`'s body says it
does** (human correction 2026-08-20). That body reads "which closes one of the
five items AGENTS.principal.md lists as unmeasured"; it is immutable, so the
correction lives here. **The finding is conditional, not general.** Two halves,
and only one of them is durable:

- **Durable, and a property of the harness:** a worktree is cut from
  `origin/main`, not from local `HEAD`. That holds in any repository.
- **Time-bound project state:** `origin/main` here is 300+ commits behind
  **because nothing has been pushed since 2026-08-11**. That is the only reason
  the lens is missing from the worktree. **Push, and worktree isolation may work
  perfectly** — the mechanism was never actually tested, only starved of a tree
  containing the module.

So this belongs in a campaign record, which is where it now is. Promoting it to
`AGENTS.principal.md` would put an expiring measurement into global governance
and would state as settled a question this session did not settle. Two secondary
findings, both genuinely durable: `node_modules` resolves **only** because the
worktree is nested inside the main checkout — move it elsewhere and every tool
breaks — and the isolation guardrail refuses compound shell commands.

⚠ **An `ar-4` destroyed a peer session's index.** Mid-review it ran `git stash`
then `git stash pop`; `pop` without `--index` restores everything unstaged, so
three peer-held `.planning-handoffs/` files went from staged-and-modified to
modified-only. **No content was lost**, but the staged blobs differed from the
working-tree blobs, so it was partially-staged work not reconstructible from the
tree. **Recoverable at `526b7ac4` (the popped stash's index commit) until the
next `git gc`**, via `git restore --source=526b7ac4 --staged -- <paths>`, which
rewrites the index only. Recorded here because a commit body is not where a
human looks for this. The lesson: a general "no writes" prohibition does not
reach `git stash` — **name it explicitly in every AR prompt.** A hardened prompt
doing so was used for the next two ARs and neither touched repository state.

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

- **Five phases, three named helpers; and Fake It expires at `One`** — both
  settled at Phase 0, restated here 2026-08-19. The sketch's phase 1 is a guard
  clause and phase 4 a merge, and **both stay inline in the export** rather than
  becoming named helpers, so the Refactor step is held against the **phases**,
  not a helper count. And under a suite committed skipped, DEV.md's "Fake It
  expires when the next test is written" means **when the next test is
  un-skipped**. Both were written in § What Phase 1 is — which this file's own
  header disclaims as unmaintained, and which is genuinely stale (it still says
  "the fold does not exist yet", false since `065afc16`). Restated here because
  a ruling living only in a disclaimed section is one a careful reader is
  entitled to ignore, and `WAVE-2-BRIEF.md` was citing them from there.

### The `spellme` LENS's rulings (2026-08-20)

Four, taken across the lens's wave-1 session. The first three have end-state
homes and **migrated there**; they are listed here for findability, not as their
home. The fourth governs process and has none.

- (human ruling 2026-08-20) **The mark widens: a `LineTerminator` carries it
  too.** `README.md` and `types.ts` had disagreed — the fate table gave the
  _consumed_ row a marking variant while `types.ts` and the Glossary described
  only the block-comment case — and **no test read `.marked` on a terminator, so
  both readings shipped green.** The mark now names one property: _the syntactic
  grammar reads a line break here_, which a terminator is directly and a block
  comment becomes by §12.4. **→ migrated to** `lenses/spellme/types.ts`,
  `README.md` §§ The three fates and Glossary, `DOCS.md` § Execution phases 3
  and its Mermaid edge (`3b4e9f80`). Same pass corrected a real pre-existing
  error: DOCS phase 3 had claimed "both the fate and the mark are functions of
  the element kind alone", which the mark never was.
- (human ruling 2026-08-20) **Both marked fates are DRAWN, and the two carriers
  differ** — taken at the AR-5 that caught the widening stopping short. A
  set-aside comment carries `data-marked` on its jar entry; a consumed line
  break leaves `data-spellme-break` on the token tape, where **presence is the
  mark** — no false-valued twin, because an unmarked consumed element leaves
  nothing, which is what _evaporates_ means. The reviewer had proposed the
  opposite (mark as a model-only property, rendered by the set-aside fate alone)
  and was overruled. **→ migrated to** `README.md` § UI structure, `DOCS.md` §
  Structural constraints, and the twin `ux/wireframes.md` — whose entry under
  "What has no wireframe, deliberately" records that the consumed mark's visual
  is **owed and undesigned**, deferred to a sandbox checkpoint.
- (human ruling 2026-08-20) **An out-of-range threshold throws `RangeError`, not
  `TypeError`** — explicitly including revisiting the three already-green
  `Exceptions` assertions that pinned the old class. All three refusals —
  negative, fractional, non-finite — are properties only a number can have, so
  what is refused is always the right kind of value carrying a wrong one. **→
  migrated to** `README.md` § Configuration ("Legal values"), with the class
  named in `core.ts`'s `@throws` tag per the convention that JSDoc is the API
  reference. ⚠ The wave-1 brief had asserted "no sibling `config()` throws …
  genuinely new code with no precedent"; that was true only of sibling **lens**
  config factories — `lib/engine/worker/write-call-response.ts` already carried
  `@throws RangeError` for a numeric-limit violation. The brief now carries a
  dated SUPERSEDED correction rather than a silent rewrite.
- (human ruling 2026-08-20) **The parallel fan-out was re-affirmed and then
  defeated by measurement, not by argument.** Told that `core.ts`'s eight
  functions share one file and therefore one committable pathspec, the human
  kept the 2026-08-14 "real fan-out" ruling and elected to **attempt parallel**
  behind worktree isolation. The wave-0 probe then found worktrees are cut from
  `origin/main`, where the lens does not exist. The pre-declared fallback —
  serial single-worker waves — took effect. **The ruling is not overturned**: it
  was never tested, because the mechanism that would have tested it is unusable
  here. If `origin/main` ever advances, the question reopens.

  **REOPENED 2026-08-25 by the ruling's own trigger — and it hits a second
  obstacle nobody had reached.** The human pushed, so the condition fired:
  `origin/main` now carries the lens [measured 2026-08-25: `git ls-tree -d
  --name-only origin/main src/lib/study-lenses/lenses/` → `debug-props lib
  parsons spellme writeme`]. The **content** obstacle the wave-0 probe found is
  therefore gone. Two things stand between that and a usable fan-out, and only
  the first is configuration:
  1. The harness cuts worktrees from `origin/<default-branch>` by default, and
     the `worktree.baseRef` setting that would change it to local `HEAD` is
     **not set** here [measured 2026-08-25: no `worktree` or `baseRef` key in
     `.claude/settings.json` or `.claude/settings.local.json`; the former's only
     top-level keys are `$schema`, `permissions`, `hooks`]. That file is
     **governance surface**, so flipping it needs explicit human instruction.
  2. ⛔ **The durable one: a worktree is created ON A NEW BRANCH, and there is
     no agent-executable path back to `main`.** Branch creation requires
     explicit instruction, and `git merge` and `git cherry-pick` are both
     forbidden to agents under § Git Policy. So even a perfectly populated
     worktree leaves a worker unable to land its commits. **This is independent
     of `origin/main`'s freshness and of the settings flip**, and nothing in
     this campaign's record had named it.

  **Nothing changes for waves 2 or 4.** Wave 2 is serial for reasons the
  worktree question never touched — 39 of the 56 core tests route through
  `readStream` via `streamOf` [measured 2026-08-25], and both its functions
  share one file and therefore one pathspec. Wave 4's three functions likewise
  all live in `core.ts`; its only real edge is `judgeClaim → settle` (settle's
  six tests each build verdicts via `judgeClaim`), leaving `handOver`
  independent — **one parallel pair, worth about one worker of wall clock.** Not
  worth a governance round-trip. The decision is parked for the human at the
  wave-3/4 boundary, and it needs BOTH items above, not just the first.

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
- **A settings line and a `(human ruling …)` parenthetical both wrap**, and the
  obvious workaround is wrong twice over. Prettier breaks them mid-line, so a
  single-line `git grep` counts too few — but `tr '\n' ' '` alone still misses a
  wrapped bullet, because the indented continuation leaves **two** spaces
  mid-phrase, and `grep -c` after `tr` counts **lines**, of which there is now
  exactly one. The form that works:
  `… | tr '\n' ' ' | tr -s ' ' | grep -o 'human ruling' | wc -l`. All three
  wrong forms have been shipped in this campaign's own documents.
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
  upstream configured** [measured 2026-08-19: `git rev-parse --abbrev-ref
  main@{upstream}` → "fatal: no upstream configured"], and `origin/main..HEAD`
  is **284 commits** [measured 2026-08-19: `git rev-list --count
  origin/main..HEAD`; `origin/main` last moved 2026-08-11]. Roughly **38** are
  this campaign's — 30 named SHAs plus wave 1's unnamed interior. Whoever holds
  that gate is deciding about two hundred and eighty-four, most of them other
  sessions' work. **This number climbs fast**: 81 on 2026-08-14, 91 on
  2026-08-15, **284** on 2026-08-19 — 197 commits in four days. Re-measure it at
  the gate; never quote this line. ⚠ This bullet said "**91** … **six** of them
  are this campaign's" until 2026-08-19. The 91 was correctly caveated and a
  cold reader re-measured it as instructed. The **six was not caveated and was
  wrong when written** — it under-counted the campaign's own share by a factor
  of six, in the one sentence written to stop someone under-presenting this
  gate.

## Deferred, and recorded elsewhere

- ⛔ **Folding `scanning` and `classifying` into embody — DECLINED, do not start
  it.** This bullet used to read "happens after `lib/scanning` is green, not
  before"; `lib/scanning` is now green, so it read as a go-ahead for work the
  human has since refused. **`scanning` STAYS in `lib/`** — the leaf remains and
  embody publishes by calling it (human ruling 2026-08-19, recorded in
  [`../embody-derivation-facts/BRIEF.md` § Settled](../embody-derivation-facts/BRIEF.md)
  and echoed in
  [`./ACQUISITION-ALIGNMENT-BRIEF.md`](./ACQUISITION-ALIGNMENT-BRIEF.md)). A
  cold reader following the old wording would have opened the wrong campaign.
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
  2. **Five freeze assertions can pass vacuously.** `Object.isFrozen(undefined)`
     returns `true`, so an assertion reaching through an index survives an empty
     or short return [measured 2026-08-19: `scanning` lines 402 and 406,
     `classifying` lines 778, 783 and 788 — note the last is `result[1]`, not a
     third `result[0]`]. The array-level assertions (`scanning` 398,
     `classifying` 773) are **not** in this class: the export always returns an
     array, so there is nothing to vanish. This bullet said "six … three and
     three" until 2026-08-19; it was miscounted in both modules. They are
     covered in practice — the `One`/`Many` blocks fail loudly on an empty
     sequence — so this is triangulation carrying an assertion that does not
     carry itself. The minimal close is a `toBeDefined()` beside each, or
     asserting frozen-ness on a value the same test already pins.
  3. ✅ **CLOSED by `191f7da9`** (2026-08-19) — do not go looking for this. It
     read: "`scanning`'s DOCS and README disagree about the caller's projection…
     **Not this campaign's to fix**; it belongs to whoever closes
     embody-derivation-facts." Both clauses expired. The named owner closed at
     `60349d76`, and the spellme acquisition-alignment mini-campaign fixed both
     halves under a human ruling of 2026-08-19. **The text this item quoted no
     longer exists** [measured 2026-08-19: `git grep -c "named in the README
     rather than done here" -- src/lib/study-lenses` → no matches]. A reader
     following the old wording would hunt a disagreement that is gone — the same
     failure this file's own header paragraph was written to stop.
  4. **`lib/loop-guard`'s documented error discriminant is asserted by no
     test.** Its README promises a `reason` of `'parse-failed'` or
     `'multiline-injection'`; `LoopGuardError` is a type alias rather than a
     class, so `.toThrow(Class)` is unavailable, and no test mentions the field
     at all [measured 2026-08-19: `grep -rn "reason"
     src/lib/study-lenses/lib/loop-guard/tests/` exits 1 with no output, against
     a README naming the discriminant at lines 203, 204, 212, 222, 262 and 264].
     A different module and a different campaign's work — recorded so the
     finding outlives the report. ⚠ The commit that first recorded this finding
     put "lines 202 and 262" in its body under a `[measured:]` tag; those were
     the reviewer's numbers, relayed, and they are wrong. The substance held
     under re-measurement — the line numbers did not. That body is immutable,
     which is why the corrected evidence lives here, and it is finding 1's
     defect committed inside the commit recording finding 1.
- **Registering `spellme` in the composition root is NOT Phase 1's job.**
  `orchestrate/lib/composing/built-in-lenses.ts` imports parsons and writeme and
  knows nothing of spellme [measured 2026-08-19: spellme is now named in
  **eight** files outside its own directory — `git grep -l spellme -- src/ |
  grep -v lenses/spellme/` — including `embody/notional-machine.md` and four
  `orchestrate/` docs. The 2026-08-14 form of this tag said "no file except
  `lib/scanning/README.md`", which the tree outgrew; the bullet's substance is
  unchanged and still measured: `built-in-lenses.ts` imports only parsons and
  writeme]. A lens nobody can reach is not a defect at this stage — the lens
  object exists and is frozen, and wiring it up is a Phase-2 concern once there
  is something to mount. Do not add the import on the way past; it would put an
  unimplemented component in front of a learner.
