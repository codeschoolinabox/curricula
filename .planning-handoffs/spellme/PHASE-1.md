<!-- cspell:ignore spellme lookaheads tokenizer ZWNBSP undercounts -->
<!-- cspell:ignore wireframes worktrees Rects -->

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

🚧 **`spellme` PHASE 1 IS UNDER WAY — waves 1 AND 2 are CLOSED (2026-08-20 and
2026-08-25).**

▶ **NEXT IS WAVE 3, and its launch prompt is committed at
[`./PHASE1-WAVE-3-BRIEF.md`](./PHASE1-WAVE-3-BRIEF.md)** — the static surface
(23 of `component.test.tsx`'s 28 skipped tests), the sandbox injection, and the
campaign's **first 🔍 eyeball checkpoint**. It runs in the **orchestrator**, not
a worker, and it opens with **one question that must go to the human before the
first edit** — the un-skip order, where file order and ZOMBIES order disagree.
That brief was context-free validated; the validation returned nine must-fixes
against its first draft and all nine are applied.

See § The `spellme` LENS — Phase 1, wave 1 and § … wave 2 for their SHA lists —
**re-run their loops rather than counting rows; the wave-1 sentence said "ten"
and was outgrown within the hour** — and both `### The spellme LENS's rulings`
sections for the nine decisions they took. ⚠ This banner read "THE NEXT CAMPAIGN
_IS_ `spellme` PHASE 1" until 2026-08-20 — true for one day, and then the same
stale-redirect defect the paragraph below documents about itself, for the third
time in this file. **A banner announcing what is next expires the moment someone
starts it.** The docs mini-campaign that preceded it
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

### The `spellme` LENS — Phase 1, wave 2 (CLOSED 2026-08-25)

**`readStream` + `positionCursor`.** ⚠ **Do not count the rows below. RUN THIS**
— the only form that cannot go stale:

```sh
git log --format='%h %s' --since='2026-08-25 07:00' -- \
  src/lib/study-lenses/lenses/spellme/ .planning-handoffs/spellme/
```

**A table cannot contain the commit that writes it.** That is arithmetic, not
carelessness — a SHA does not exist until its commit does — and it is why this
file has recorded the same failure five times while each fix reproduced it. The
rows below were re-run from that command and were complete **when written**;
every doc commit touching this section since is absent **by construction**.

⚠ **The two most recent instances, both this session.** Until `2d585565`, only
four of the wave's commits appeared anywhere in this file, all incidentally
inside ruling prose — there was no wave-2 list at all: **failure six**.
`2d585565` then wrote a hard count and omitted itself — **failure seven, inside
the commit whose own subject was the missing list.** The regress stops here by
refusing to pin a count at all.

⚠ **A THIRD failure mode, distinct from those two and worth more than either: an
absence claim that QUOTES the token it is counting falsifies itself.** It fired
three times on 2026-08-25, all mine, all identically: a note saying "only four
carry the citation" that itself carried the citation (4 → 5); a commit body
claiming a count-word grep returned 0 when the note beside it quoted that word
(0 → 1); and the wrap-safe `nine-path` grep that returned zero because the
literal text carried markdown bold. **The rule: a "this string does not appear"
claim must be run against a file that does not contain your description of the
string — or the description must not quote it.** Always pair it with a positive
control. This is the sharpest instance of § Traps' vacuous-grep entry, and it
survives because the instrument reads clean every time.

**Its companion rule, from the same family:** an absence claim over an
alternation must **state that it used `grep -E`**. `0b0485c3`'s body tagged one
`[measured: … grep for A|B over the file -> 0]` without naming the flag — the
claim was true (re-run with `-E` and a positive control), but the tag does not
establish the instrument on the one pattern shape this campaign has a named trap
for. Say the flag, or the tag proves nothing.

⚠ **And a fourth, found by the AR-5 re-verification: a claim corrected in ONE of
the places it lives.** `2d585565` wrote a hard commit count into **two** files;
`0b0485c3` fixed it structurally in `PHASE-1.md` **only**, and `2a7d691b` edited
the same section again and still did not sweep the sibling. Two consecutive
correction rounds walked past the copy one directory over — § Traps item 12 at
directory scope. **The generalization is not "sweep `git ls-files`": it is that
a number living in two documents will disagree, so make one document its only
home and have the other point at it.** That is what this section now does and
what `PHASE1-WAVE-2-BRIEF.md` was corrected to do.

| SHA        | What                                                           |
| ---------- | -------------------------------------------------------------- |
| `4d3e97a6` | prep — two `positionCursor` regression locks, added skipped    |
| `132bdad3` | prep — the wave-2 brief re-measured and corrected (E1–E10)     |
| `22a622f0` | prep — the worktree ruling's trigger fired                     |
| `f30e5f60` | prep — the context-free validation's five must-fixes           |
| `d5f965e8` | increment 0 — `readStream` refuses with a `TypeError`          |
| `75994c99` | `readStream` reads the published sequence into a frozen stream |
| `893ca8c9` | the cursor advances past every self-advancing element          |
| `40a677b3` | every element kind carries the fate its kind implies           |
| `65a6c1a4` | the mark says the grammar reads a line break here              |
| `d7079a3f` | AR-5 blocker 1 + concerns 3/4 — the mark lock, the type ties   |
| `24d5b953` | AR-5 concerns 6/9 — rulings recorded, the brief marked CLOSED  |
| `2c911356` | `readStream`'s guard-1 test — AR-3 CONSIDER + AR-5 concern 5   |
| `27b1876a` | the retrospective AR-3's verdict joins the ruling              |

**State at close** [all measured 2026-08-25 by the orchestrator, not relayed]:
scoped suite `42 passed | 50 skipped (92)` across three files;
`npx tsc --noEmit` **0**; skips `core.test.ts` **22**, `component.test.tsx`
**28**; module and handoff trees clean. Repo-wide: the **eight** foreign
failures, unchanged in identity, plus the documented
`orchestrate/index.test.tsx` flake. It is **provably not this wave's**:
orchestrate references `spellme` only in `.md` files, never a `.ts`/`.tsx`
[measured 2026-08-25, with a positive control on `parsons`, which does appear in
composition code], so no code path reaches it.

⚠ **But "passes 128/128 alone" is NOT a reliable discriminator, and this record
said it was.** The claim was a true measurement of an intermittent thing, stated
as though it settled the question. Combined evidence across two agents: **9
isolated runs, 1 failure** — 7 passes here, and an AR-5 saw it **fail alone** on
its second run with `TypeError: textRange(...).getClientRects is not a function`
[measured 2026-08-25 by both]. So it is **intermittent in isolation too**,
merely rare on this machine, and the symptom is a **jsdom/CodeMirror layout-API
gap**, not the Worker-pool parallelism the wave-2 brief attributes it to. ⚠
**Wave 3 is jsdom component work** — the wave most likely to meet it. Do not let
a green isolated re-run convince a future session that a failure there is
foreign; check the symptom.

**What the wave cost, and what it bought.** Seventeen un-skips plus two authored
tests, five `ar-4` verdicts, an AR-5 **PAUSE** over two blockers, and a
retrospective AR-3. **Two of the four post-hoc findings were defects the suite
could not see** — the single-step `positionCursor` mutant and the unpinned
`LineTerminator` mark — and both were confirmed by **mutating the source and
watching the suite stay green**, which is the technique a read-only reviewer
cannot run and the orchestrator can.

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
  `readStream` via `streamOf` [measured 2026-08-25: `perl -0777` split of
  `tests/core.test.ts` on `it(` boundaries → 56 blocks, 39 containing
  `streamOf(`], and both its functions share one file and therefore one
  pathspec. Wave 4's three functions likewise all live in `core.ts`; its only
  real edge is `judgeClaim → settle` (settle's six tests each build verdicts via
  `judgeClaim`), leaving `handOver` independent — **one parallel pair, worth
  about one worker of wall clock.** Not worth a governance round-trip. The
  decision is parked for the human at the wave-3/4 boundary, and it needs BOTH
  items above, not just the first.

### The `spellme` LENS's rulings (2026-08-25, wave 2)

⚠ **Five bullets below, but only FOUR are the human's** — the fifth is an
orchestrator ruling and is labelled as one. `27b1876a`'s body says "all five …
citations", which its own cited measurement (4/4/4) contradicts: the measurement
was right and the word beside it was not. The body is immutable, so the
correction lives here. **Counting bullets is not counting citations** — and note
that a note like this one, if it quoted the citation string, would raise the
count it is correcting. It deliberately does not.

Five, taken across wave 2's launch preparation and its closing AR-5. Recorded
here because a ruling that lives only in a wave-scoped brief evaporates when the
brief is pruned, and `.planning-handoffs/` briefs are transitional by this
repo's own convention.

- (human ruling 2026-08-25) **`readStream` throws a `TypeError`.** This
  **reverses the `readStream` half** of the 2026-08-20 `RangeError` ruling and
  leaves `config` alone. Grounds: the scanning leaf's own precondition throw for
  an absence is a `TypeError` [read:
  `src/lib/study-lenses/lib/scanning/derive-input-elements.ts` — "Presence is
  the whole check"], and `readStream`'s JSDoc already asserts its throw is
  "exactly the precondition the scanning leaf states for its own inputs", so two
  classes for one precondition in adjacent modules would be an incoherence. An
  `ar-5` had argued `RangeError` is affirmatively wrong here: an absent member
  is a wrong-**kind** case, not the right-kind-wrong-**value** one. **→ migrated
  to** `core.ts`'s `@throws` tag and `DOCS.md` § Structural constraints. ⚠ The
  2026-08-20 ruling was put as a question about `readStream`, but `ed76f43b`'s
  body recorded only the `config` half — which is how it stayed unsettled for
  five days.
- (human ruling 2026-08-25) **Two `positionCursor` regression locks were added
  to the committed suite**, skipped, in `4d3e97a6`, and **a third, the
  `LineTerminator` mark lock, at the AR-5.** All three pin already-documented
  contracts that no test reached. What made them necessary: `positionCursor` had
  three call sites, all starting the cursor on trivia, so both `from + 1`
  **and** the subtler `isClaimable(stream[from]) ? from : from + 1` passed the
  entire module; and `isMarked`'s `LineTerminator → true` arm was pinned by
  nothing at any wave [measured 2026-08-25: mutating it to `return false` left
  the suite fully green at `40 passed | 50 skipped (90)`].
- (human ruling 2026-08-25) **The 2026-08-14 AR-3 opt-out does NOT extend to
  authored tests.** Wave 2's increment 0 was driven by an authored test rather
  than an un-skip; the opt-out is recorded "for un-skips", and the human ruled
  that `ar-3` **runs retrospectively** rather than the exemption being widened.
  ⚠ This settles the scope question that `d5f965e8`'s immutable body left open.
  The general rule — whether an authored test in this campaign ever rides the
  opt-out — is answered **no**.

  **It ran, and returned CONSIDER** (after one attempt died on an API stall — a
  death is not a skip). Its two substantive findings: increment 0 genuinely did
  **not** triangulate at landing — zero active tests called `readStream`, so an
  unconditional `throw new TypeError(…)` would have passed — but the killer
  landed in the very next commit `75994c99` and the `ar-4` of the time had
  already raised it, so the exposure was one commit inside one wave. And the
  live gap it named, which AR-5 had independently raised as its concern 5:
  **`readStream`'s `!facts.tokens.ok` guard was asserted by no test anywhere.**
  Closed in `2c911356` with a measured fixture — `embody('const x = "')` gives
  `tokens.ok=false` [measured 2026-08-25], and the lock is verified live: under
  mutation of that guard's class it is the only failure.

- (human ruling 2026-08-25) **`DOCS.md` and `core.ts` may state the throw class
  and tie the kind tables to `types.ts`.** Both are contract-adjacent and were
  approved rather than taken. The tie is
  `Record<InputElementKind, …> & Record<AdvancingKind, true> & Record<ClaimableKind, false>`,
  which closes the gap where `AdvancingKind` was referenced by nothing and
  `ADVANCES_ON_ITS_OWN` silently restated the same partition [measured
  2026-08-25: with the tie, mutating `Comment: true` → `false` and
  `StringLiteral: 'token-tape'` → `'set-aside'` each produce `TS2322`; without
  it, neither did].
- (orchestrator ruling, mechanical, 2026-08-25) **The precondition-throw test is
  increment 0**, before the first un-skip. The stub threw `Error`, which is not
  a `TypeError`, so it is a genuine red. Recorded because a cold read found the
  order genuinely ambiguous and two workers would have produced two different
  commit structures.

### The `spellme` LENS's rulings (2026-08-26, wave 3)

**Eight**, all the human's, taken across wave 3's plan-approval gate and the
AR-4 that followed its first commit. **Four have end-state homes and migrated
there**; they are listed here for findability, not as their home. The rest
govern process and have none.

⚠ **The eighth was added on 2026-08-27, a day late**, when a context-free
validation of the wave's resumption prompt found it recorded **nowhere in the
tree** — it had been given, implemented, and cited in `1d1f45aa`'s body as
settled while `git grep` could see nothing. It is the **sixth** ruling this wave
that had to be back-filled after a review went looking, and the fourth caught by
a reader rather than by its author. `DEV.md` § Ruling provenance: _"the body is
the timestamp, the document is the home."_

⚠ **Three of the eight exist because a review asked for them, not because the
gate did.** The live-picker ruling below left the selected-state mechanism
unspecified and the data-flow diagram without a node for the state it made
load-bearing; an `ar-4` caught both against the commit that recorded it. The
**eighth is a third instance** — the same `ar-4` raised the remount finding, and
the human ruled on all three. A ruling can therefore arrive _after_ the commit
that motivated it, which is why this section is keyed to a date rather than to a
commit. ⚠ This sentence read "Two of the seven" for an hour after the eighth
bullet landed — the count was updated in the header and not here, which is this
wave's own named defect committed inside the fix for it.

- (human ruling 2026-08-26) **The un-skip order is ZOMBIES over the lettered
  blocks, file order within each.** `component.test.tsx`'s blocks run
  `Interfaces` → `Many` → `Zero` → `Boundaries` → `Interfaces` in file order,
  which disagrees with canonical ZOMBIES, and wave 3 takes ZOMBIES: `Zero` →
  `Many` (static only) → `Interfaces — the DOM contract` →
  `Interfaces — the keyboard journey`. Same reasoning as the 2026-08-14 tiling
  ruling — un-skipping a sweeping block early licenses structural fakes — and
  the same closing line: the blocks it moves past are unlettered.
- (human ruling 2026-08-26) **The 🔍 cadence is five named checkpoints, and
  every other increment is declared no-checkpoint by the human in advance.** The
  five: the sandbox injection · the three regions rendering · the picker and
  stepper live · the CSS arrangement whole · the wave's close. Needed because
  once the injection lands **every** later increment is user-observable, and
  `DEV.md` makes checkpoints gate points only the human may skip — so a cadence
  the agent chose would be the agent skipping. This bullet is that declaration.
- (human ruling 2026-08-26) **A `{ skipAfter: 0 }` component test is authored**,
  mirroring the `{ oneMoreAfter: 0 }` fixture the suite already carries. Without
  it the way past is un-triangulated in wave 3: the only test naming
  `[data-spellme-skip]` asserts it **absent** at the default `skipAfter` with
  zero attempts, and nothing in wave 3 raises the attempt count — so omitting
  the control entirely would close the wave green. ⚠ It is an **authored** test,
  so `ar-3` fires for it (human ruling 2026-08-25); the un-skip opt-out does not
  reach it.
- (human ruling 2026-08-26) **Presentation is part of this lens's value, not
  decoration, and is decided interdependently with functionality** — in the
  human's words, _"we are user-twinning this so CSS isn't decoration, it's part
  of the core value. functionality will be decided interdependently with
  presentation."_ So the module carries its own stylesheet and wave 3 writes it.
  **→ migrated to** `DOCS.md` § Decisions. The § Modules row for that file is
  deliberately deferred to the commit that creates it, because these documents
  describe the tree as it is.
- (human ruling 2026-08-26) **The stepper and the kind picker are live in wave
  3; submit and judging are not.** Forced by the ruling above rather than by any
  test — no wave-3 test fires an event, so nothing in the suite discriminates a
  live stepper from a dead one. What forces it is that `README.md` § UI
  structure mandates `data-extent` on the proposed span and the twin draws that
  run as tracking the stepper, so an uncontrolled input is a control that
  visibly does nothing at a checkpoint. **→ migrated to** `DOCS.md` § Structural
  constraints.
- (human ruling 2026-08-26) **Which element kind is selected rides
  `aria-pressed` on the picker's buttons; no `data-*` hook carries it.** Raised
  by `ar-4`: § UI structure enumerates every harness selector this surface has
  and none of them said which kind was selected, so the first test to touch the
  picker would have invented the mechanism. A `data-*` twin would duplicate what
  `aria-pressed` already names and then have to be kept in step with it; styling
  binds to `[aria-pressed='true']`, an attribute, so the
  selectors-never-label-text rule holds. Precedent is in the tree —
  `writeme.css` already styles `[data-view-toggle][aria-pressed='true']`. **→
  migrated to** `README.md` § UI structure. It is deliberately the one piece of
  this surface's state outside the `data-spellme-*` family.
- (human ruling 2026-08-26) **The data-flow diagram draws the claim in
  progress.** Also raised by `ar-4`: the live-picker ruling made component-local
  form state responsible for the surface's own `data-extent` and proposed run,
  and the Mermaid had no node for it — an edge the Refactor step is held against
  but cannot see. **→ migrated to** `DOCS.md` § Data flow, as one node and two
  edges. ⚠ It also falsified a label: the diagram called submission "the one
  external event in the module", which stepping and picking are now too. That
  label was corrected in the same commit and the rewrite is enumerated in its
  body.
- (human ruling 2026-08-26, **recorded 2026-08-27**) ⛔ **SUPERSEDED 2026-08-29
  — the premise below was measured FALSE, and was already false when this ruling
  was taken.** Read it with the 2026-08-29 subsection, which carries the three
  reads and the orchestrator's own canon. Kept verbatim rather than rewritten,
  because the reasoning is the record. ⚠ The bullet deliberately still opens
  with its `- (human ruling` citation: this subsection's header count is derived
  by `grep -cE "^- \((human|orchestrator) ruling"`, and wrapping the bullet in a
  marker silently dropped it from **8** to **7** for one revision of this file.
  **The stale session seed is fixed IN-MODULE, at the DOM-contract increment.**
  `MountedLens` renders `<Main config={config} embodiment={embodiment} />` with
  **no `key`** tied to the embodiment [read: `orchestrate/index.tsx`], and
  `derive-study.ts` builds a fresh embodiment per derivation — so typing
  **re-renders** an open lens rather than remounting it. The component's
  `useMemo` picks up the new stream; the `useState` seed does not, and the
  cursor goes stale. ⚠ **Adding a `key` in `orchestrate/` was considered and
  REJECTED** as a cross-module change outside this wave that would silently
  alter remount behavior for `parsons` and `writeme` too. ⚠
  **`parsons/index.tsx` carries the identical lazy-seed shape** under a comment
  asserting the orchestrator remounts on a source change, which the evidence
  above contradicts — not this campaign's to fix, recorded so the finding
  outlives the commit that found it.

  ⛔ **The paragraph below is WRONG — superseded 2026-08-29.** The jar fills
  correctly: typing happens in editor mode, and opening the lens is a fresh
  mount. It is kept because it is what a careful reader concluded from the code
  without reading `orchestrate/`, which is the lesson.

  ⚠ **This defect is LIVE at HEAD and user-visible**, which the ruling's own
  commit body understates as "invisible … increment 1 renders only the
  attribute". That was true when written and stopped being true one commit
  later: the jar renders `stream.slice(0, session.cursor)`, so with a frozen
  seed it can never fill — type a comment into the sandbox and nothing reaches
  the jar. 🔍 #1 ran **before** the jar landed and has never seen it.

### The `spellme` LENS's rulings (2026-08-27, wave 3 continued)

Five more, all the human's, taken while wave 3 ran. ⚠ **Three of the five were
caught by an `ar-4` as UNRECORDED** — the ruling had been given, acted on, and
cited in a commit body as settled, while `git grep` could find it nowhere. That
is precisely the failure `DEV.md` § Ruling provenance names: _"Record on
confirmation, not eventually … in the same turn."_ The reviewer found it; the
author, who had the ruling in hand, did not.

- (human ruling 2026-08-27) **The `data-marked="false"` lock is authored in
  increment 5**, beside the `{ skipAfter: 0 }` lock, under a single `ar-3`.
  Grounds: mutating the jar entry's `data-marked` to a hardcoded `true` leaves
  the entire suite green [measured 2026-08-27: `46 passed | 46 skipped (92)`,
  identical to the same run over the unchanged source]. Exactly one component
  test reads the attribute and it asserts the `true` case. The **core** layer is
  not at risk — `core.test.ts` pins `marked === false` three times over three
  element kinds — so what is unpinned is narrowly the **component's rendering**
  of a value the core already gets right.
- (human ruling 2026-08-27) **The jar entry's text is asserted too**, in that
  same increment-5 pass. Nothing reads `textContent` on a jar entry anywhere,
  yet the entry renders the element's source slice because the twin requires it
  — `ux/wireframes.md` § The jar draws `[// hi]` and `[/* … */]` with visible
  text. Lower risk than the mark, since there is no plausible wrong field to
  render; recorded because canon with no test behind it is how this campaign has
  repeatedly shipped green defects.
- (human ruling 2026-08-27) **The data flow draws the surface reading the stream
  directly.** Raised by `ar-4` against increment 2: the sketch routed everything
  to `Surface` through `Session`, but the jar reads the stream directly and
  must, since `SessionState` carries no element kind, text or mark. A second
  edge was added rather than relabelling the existing one, which would have
  conflated two different sources into one arrow. Phase 7 also gained the
  `Input:`/`Output:` lines its six siblings carry. **→ migrated to** `DOCS.md` §
  Execution phases 7 and § Data flow.
- (human ruling 2026-08-27) **The empty-station caption is observed, not
  fixed.** Wave 3 walks into the state this lens's README already flags — tokens
  accessible, spellme declined, the station reading as though nothing studies
  the phase. It belongs to `orchestrate/`, not here. ⚠ And it is worse than
  recorded: **that caption is implemented nowhere in live source** (see the
  wave-3 section below).
- (human ruling 2026-08-27) **`acorn-loose` is approved as a new dependency**,
  for the partial-facts Phase-0 unit — which is **not** wave 3's and goes to a
  fresh session. See § Deferred, and the launch prompt at
  [`../embody-partial-facts/BRIEF.md`](../embody-partial-facts/BRIEF.md).

### The `spellme` LENS's rulings (2026-08-29, wave 3 continued)

Four, all the human's, taken at wave 3's resumption gate. ⚠ **The first
supersedes the grounds of a ruling in the subsection above** — an entry here can
overturn an entry there, which is why each subsection is keyed to a date rather
than presented as a settled whole.

- (human ruling 2026-08-29) **The stale session seed is NOT fixed, because the
  premise was measured false.** The 2026-08-26 ruling directly above holds that
  typing re-renders an open lens and stales the cursor. A mounted lens cannot
  receive a new embodiment at HEAD, on three independent reads: `session` is
  mount-frozen — `React.useState(() => freezeInPlace({ … }))` [read:
  `orchestrate/index.tsx` — `const [session] = React.useState(`]; `derivation`
  memoizes on `[session, settled]` [read: same file], so with `session` pinned
  only a `settled` change can mint a new embodiment; and `assertPaneCoherence`
  **throws** on `settled.source !== occupant.openedAt.source` at every
  excursion-arm render [read: same file — "The pane's coherence invariants —
  loud in dev AND prod, at EVERY excursion-arm render"]. The editor renders only
  in editor mode, so there is nothing to type into while a lens is mounted.
  Every open routes through `openLensSurface`, which flushes and anchors
  `openedAt` — a **fresh mount**, therefore a fresh seed.

  **It is the orchestrator's own end-state canon**, which this campaign had
  never cited: the editor is _"structurally absent while a lens or the generator
  is open, so nothing can edit beneath either"_, and the open lens is _"mounted
  as the pane's occupant with the frozen embodiment, **fixed for the whole
  mount** … the embodiment never moves"_ [read: `orchestrate/README.md`, the
  editor and open-lens bullets].

  **The premise was already false five weeks before the ruling was taken.** The
  editor/lens swap landed `68f82699` and `assertPaneCoherence` landed
  `157d2af9`, both **2026-07-21** [measured 2026-08-29: `git log --reverse -S`
  over `orchestrate/index.tsx` for each]; that file's most recent commit is
  `0173b1c2`, 2026-08-15 [measured]. Nothing regressed — the finding was wrong
  when made. Grounds for skipping rather than coding it anyway: the fix would be
  an unreachable branch, which this module bans by name for the sibling case
  [read: `spellme/DOCS.md` § Structural constraints — "A branch that _handles_
  absence as a state would be a dead branch no test can reach"], and it would
  contradict `DOCS.md` § Execution phases 3's **mount-stable** annotation, which
  is a phase-annotation change and therefore an inter-file trigger.

  ⚠ **The exposure is real and stays recorded**: if `orchestrate/` ever loosens
  that invariant, `spellme` **and** `parsons` both go stale silently. Neither
  carries its own guard, and neither should acquire one on this evidence.

  ⚠ **The `parsons` half of the 2026-08-26 bullet splits.** That comment reads
  "a source **or config** change remounts the lens". The **source** half is
  right, by the mechanism above. The **config** half is genuinely wrong —
  re-opening the SAME lens _"re-resolves the configuration in place and
  announces as a fresh open — the embodiment never moves"_ [read:
  `orchestrate/README.md`], so parsons's `viewMode` state would not take a
  re-opened override. The real finding survives; only its subject changes.

- (human ruling 2026-08-29) **Two more authored regression locks**, beside the
  three already ruled: the token tape's `data-spellme-break` for a consumed line
  terminator behind the cursor, and the claim form's **presence** when something
  is claimable. Both are canon no test reaches. `data-spellme-break` appears in
  `README.md` and `DOCS.md` and in **zero** test files [measured 2026-08-29:
  `git grep -n "spellme-break" -- src/`], while `README.md` § Glossary requires
  the tape to hold "the marks for the line breaks read as the tape fills —
  including one read before anything has fallen at all". ⚠ **The break lock must
  pin the MARK-GATING, not the section** (sharpened by `ar-4` at increment A2,
  which found two further silent mutants beyond the one already measured):
  dropping `&& marked` from the predicate makes plain `WhiteSpace` runs render a
  break glyph too, and replacing the list with `[]` also leaves the suite green
  — because the one enabled test touching `[data-spellme-tokens]` uses
  `'const x = 1'`, whose elements behind the cursor are empty before any filter
  runs. And `[data-spellme-claim-form]` appears in exactly two tests, **both
  asserting `toBeNull()`** [measured 2026-08-29: `grep -n "claim-form"
  lenses/spellme/tests/component.test.tsx`] — so omitting the whole form would
  close wave 3 green.

- (human ruling 2026-08-29) **Five more locks, and three named as deliberately
  unlocked.** Locked: the input tape's `data-spellme-consumed` /
  `data-spellme-proposed` / `data-spellme-rest` spans; `data-extent` on the
  proposed span, which `DOCS.md` § Structural constraints makes the stated
  forcing reason the stepper is live; `aria-pressed` on the kind buttons, which
  the 2026-08-26 ruling makes the **only** carrier of the selected kind;
  `data-attempts` on the form; and the `data-spellme-element-kinds` wrapper. All
  five have **zero** references in this module's tests [measured 2026-08-29]. ⚠
  **The span lock must assert per-span TEXT, not per-span presence** (raised by
  `ar-4` at increment A1): swap which slice lands in `data-spellme-consumed` and
  which in `data-spellme-rest` and every currently-green test still passes,
  because the only test touching a program with nothing claimable asserts the
  claim form's **absence** and nothing reads the tape's content. Presence alone
  is passed by an empty span. **Not locked, by the same ruling:**
  `data-spellme-submit`, which wave 5 pins because its `pick()` helper throws;
  the legend's open-ness, which is vacuous because the legend is a `<div>` and
  not a `<details>`; and `data-spellme-element` / `data-claimed`, which are wave
  5's and whose tape holds nothing in wave 3. Ten authored locks in total — 3 +
  2 + 5 — under one `ar-3`, per the 2026-08-25 authored-test ruling.

  ⚠ **An eleventh was added by the AGENT, not by this ruling** (raised by `ar-4`
  at increment A3, 2026-08-29): the ten kind buttons carry ten **distinct**
  values. Neither the `ReadonlyArray<ClaimableKind>` annotation nor the
  count-of-ten test catches a duplicate standing in for an omission, and ten
  distinct values each type-pinned to a ten-member union is the whole union
  exactly once by pigeonhole. It rides the same single `ar-3`. **Disclosed as an
  agent addition to a human-ruled set so it can be struck** — the ruling above
  named five, and this is not one of them.

  ⚠ **A TWELFTH, also the agent's, raised by `ar-4` at increment A6**: the
  legend is rendered UNCONDITIONALLY while the claim form is gated, so the
  vocabulary stays readable on a program with nothing left to claim. Nothing
  tests it — the `Zero — nothing claimable` block asserts only the form's
  ABSENCE — so a later edit wrapping the legend in the same gate "for
  consistency" would pass every green test. One assertion over the fixture that
  block already builds. Same disclosure as the eleventh: agent-added, and the
  human may strike it.

  ⚠ **And the eleventh's own status was MISREPORTED IN SOURCE until
  2026-08-30.** `index.tsx`'s constant carried "That assertion is an authored
  regression lock and lands with the others", which was false — no test in this
  module asserts distinctness [measured 2026-08-30: zero hits for `new Set`,
  `distinct` or `unique` across all three test files, with a positive control].
  Found by `ar-4` at A6, two increments after it was written. **A false safety
  net is worse than a named gap**: it tells the next reader to skip the check
  that is missing. The comment now states the gap as owed.

- (human ruling 2026-08-29) **The extent stepper starts at 1.** The twin
  answered this two ways and neither document ruled: `ux/wireframes.md` § Fresh
  mount draws `[ − ] 5 characters [ + ]` for a program whose first element is
  exactly five characters — the stepper already holding the answer — while
  `ux/user-journeys.md` Journey 1 has the learner "step the extent to 5" and
  `ux/wireframes.md`'s after-wrong-claim frame draws `1 character`. The
  fresh-mount frame is a drawing of a moment mid-interaction, not an initial
  value; pre-filling the true extent would hand the learner half the claim. **→
  migrates to** `ux/wireframes.md`'s fresh-mount frame, corrected in the commit
  that lands the stepper.

### The `spellme` LENS — Phase 1, wave 3 (IN PROGRESS)

⚠ **Do not count the rows of anything here. RUN THIS** — and note it takes
**three** paths, not two: wave 2's loop covered the module and the handoffs
only, and would have missed the sandbox injection entirely.

```sh
git log --format='%h %s' --since='2026-08-26 00:00' -- \
  src/lib/study-lenses/lenses/spellme/ \
  spiralearn/sandbox/orchestrate/index.mdx \
  .planning-handoffs/spellme/
```

**🔍 checkpoint #1 — the injection. The human's words, verbatim:**

> "tokens are greyed out when I write the incomplete string"
>
> "dash."

**The dash is the finding, and it confirms the design.** The phases panel draws
two greyed states that look alike: an accessible phase with no attached lens is
a disabled select whose only option is `—`, while a **barred** phase shows
`⚠ <parser cause>` and its label carries `data-phase-barred` [read:
`orchestrate/phases-panel/index.tsx`, the two select branches]. The dash proves
the **tokens phase stayed accessible** while the source did not lex — spellme
merely stepped aside — which is what `embody/derive-accessibility.ts` declares
in its own words: _"`source` and `tokens` are always accessible … A phase's
own-stage error never bars it — it renders inside the phase."_

**🔍 checkpoint #2 — the three regions rendering. The human's words, verbatim:**

> "I _think_ it's doing what you said it should do."

— followed by the rendered DOM, pasted from the inspector. ⚠ The quote is
trimmed to the load-bearing sentence rather than run on: the rest carried a
typo, and quoting it verbatim would have forced a misspelling into a cspell
header, which is the anti-pattern this campaign already names. Quote less; never
widen a dictionary to make a quote pass. **The paste is the finding**: a hedged
verbal confirmation would have settled nothing, and the markup is
machine-checkable. Over the source `// hi` + newline + `const x = 1;` it carried
`data-cursor="2"` — past the comment AND the terminator — a `data-spellme-input`
split three ways: the comment and its line break already consumed, a proposed
run holding the single character `c` at `data-extent="1"`, and the remainder of
the line as the rest; a `data-spellme-tokens` holding exactly one
`<span data-spellme-break>↵</span>`; and a `data-spellme-jar` holding
`<span data-spellme-set-aside data-marked="false">// hi</span>`. Every field is
what the DOM contract specifies. **PASSED, no redirect.**

⚠ **Two things the paste settled that no test could.** The break mark renders
`↵` — a PROPOSAL, since `ux/wireframes.md` records that visual as owed and
undesigned — and the human did not object to it, which is the checkpoint's whole
purpose and is recorded rather than treated as approval of a final design. And
`data-marked="false"` renders as a real attribute rather than being dropped:
React stringifies `data-*` booleans, so the false-valued case the Block-C lock
asserts is genuinely observable in the DOM.

⚠ **The checkpoint ran BEFORE this increment's `ar-4`, not after it.** `DEV.md`
§ Sandbox Checkpoints puts 🔍 between quality checks and the commit, with `ar-4`
ahead of both. The order was the agent's slip, not a ruling. It cost nothing
here — `ar-4` returned no behavioral change — but had it done so, the human
would have been shown a surface that then moved, and the checkpoint would have
needed re-running. Recorded so the next wave orders it correctly.

**🔍 checkpoint #3 — the picker and stepper live. The human's words:**

> - "there's no visible pressed state. when inspecting I can see `aria-pressed`
>   updates correctly but there's no UI"
> - "once again, DOM updates visible in" [the inspector] "but not in UI"
> - "I don't see \"claim it\" anywhere"
> - "tabbing can't" [reach] "the" [element-kind] "buttons"

The stepper's own three checks — the run tracking the stepper, the clamp past
the end of the tape, and the floor on an emptied field — were each answered
"yes", with the qualifier "only when inspecting". ⚠ Quotes are trimmed at three
typos rather than reproduced with them, and two editorial substitutions are
bracketed. Widening a dictionary to admit a misspelling is the anti-pattern this
campaign already names; the trimming is disclosed rather than silent.

**PASSED with redirects, and one finding that is not cosmetic.** Four outcomes:

1. **No visible pressed state, no visible anything — COSMETIC, and it is the
   strongest vindication the presentation ruling has had.** Every mechanism the
   checkpoint tested is correct: `aria-pressed` moves, `data-extent` tracks, the
   clamp holds, the floor holds — all confirmed by the human **in the inspector
   and nowhere else**. A learner sees none of it. `DOCS.md` § Decisions rules
   that "a correct DOM with no arrangement is not this lens working"; this is
   that sentence measured. **Named obligations on the stylesheet increment**,
   not vague ones: a pressed state for `[aria-pressed='true']`, a visible
   proposed run distinct from consumed and rest, and a visible focus indicator.
2. **The submit control was MISSING — a contract gap, fixed in the increment
   that surfaced it.** `README.md` § UI structure specifies
   `<button data-spellme-submit>` and the twin's fresh-mount frame draws
   `[ claim it ]`; neither the A3 increment that built the form nor its `ar-4`
   caught its absence, and no wave-3 test reaches it. It now renders, INERT by
   the 2026-08-26 ruling. ⚠ **A form the twin draws with a button, drawn without
   one, is not that form** — and the only instrument that found this was a human
   looking at the surface.
3. **Tab does not reach the element-kind buttons — UNRESOLVED, and the one
   finding that could be behavioral.** Two causes are consistent with the report
   and they are not equally serious: either the buttons are genuinely out of the
   tab order, which contradicts `ux/user-journeys.md` Journey 5 outright and is
   a defect; or tab reaches them and **nothing renders differently**, which is
   cause 1 again. Ruled out by measurement: nothing in this module sets
   `tabindex`, and the orchestrator's `inert` wrapper cannot be active, because
   `inert` blocks pointer events too and the human's clicks worked. Not ruled
   out: a missing focus indicator. **Carried as a gate on the stylesheet
   increment and re-checked at 🔍 #4**, with a visible focus indicator among its
   named obligations either way.
4. **The `[study source]` button is not the orchestrator's and is not legacy.**
   The human asked for it to be commented out or deleted as "legacy". It is the
   sandbox page's own fixture: `spiralearn/sandbox/orchestrate/index.mdx` gives
   its demonstration `notesLens` a `recommend` returning one proposal labelled
   `study the source`, which the orchestrator renders through
   `data-recommendations`. Removing it would delete the sandbox's only exercise
   of the recommendation surface — someone else's checkpoint target — rather
   than retiring dead code. **Reported rather than done**, and it is
   cross-module, which the two-tier rule puts behind an explicit check-in
   regardless. **(human ruling 2026-08-30) LEAVE IT — it is a live fixture.**
   This paragraph is the record, so the next reader who takes it for legacy
   finds the answer here instead of deleting it.

⚠ **This checkpoint ran AFTER its `ar-4`, correcting the order that slipped one
increment earlier** — and the correction paid immediately: `ar-4` found
`data-extent` disagreeing with the text beside it, and the human then exercised
the fixed surface rather than one that moved underneath them.

⚠ **TWO CONSECUTIVE REVIEWERS CONCLUDED THIS LENS IS UNREACHABLE IN A BROWSER,
and both were wrong the same way.** Each reached for
`orchestrate/lib/composing/built-in-lenses.ts`, found `spellme` correctly
absent, checked `src/pages/*-preview.tsx`, found them still pointing at the
deprecated tree, and inferred there is no page. The A2 reviewer caught itself;
**the A3 reviewer did not**, and raised it as an IMPORTANT concern that the
mandatory checkpoint had no target — while checkpoint #2 had already run at that
very URL with the human pasting the rendered DOM. Refuted [measured 2026-08-29:
`git grep -l spellme`, excluding the lens and the handoffs, returns **11**
files, among them `spiralearn/sandbox/orchestrate/index.mdx`, which mounts
`spellmeLens` at line 90; the prefixed route is in `.docusaurus/routes.js`; the
dev server was listening on it at the time].

**The wrong conclusion sits on a right observation, and that is the finding.**
Registration IS deliberately absent and the preview pages ARE stale, so the only
thing making this lens reachable is the sandbox injection — which nothing near
`built-in-lenses.ts` mentions. A reader starting from the roster, as both
reviewers did, has no thread leading to the mdx. It is under-signposted, and the
cost is now measured at two reviews. ⚠ **An `ar-N` verdict is itself a claim**:
this concern was specific, cited real files, and was still false.

- (human ruling 2026-08-30) **cspell is gone; stop treating it as an issue** —
  _"cspell has been removed, no more worring bout that"_. The forensic account
  below stays as the error record, but no live document instructs anyone to run
  or reconstruct the tool, and the wave-3 handoff is trimmed to one paragraph
  naming the live gates instead.

⛔ **CORRECTION, 2026-08-30 — THE WHOLE cspell DIAGNOSIS BELOW IS WRONGLY
FRAMED, TWICE OVER, AND SIX COMMIT BODIES INHERIT THE ERROR.** The paragraphs
that follow blame dependency churn, then a peer's deletion. Neither is what
happened. **`cspell` was DELIBERATELY UNINSTALLED** at `9baca1e7` (2026-08-29
23:11:33) — _"chore: uninstall cspell and unwire spell-checking from every
automated check"_ — which dropped the devDependency and its 96 packages, removed
`lint:spelling`, stripped the tool from `README.md`, `DEV.md`, `AGENTS.md`,
`AGENTS.principal.md` and the measured-facts oracle, and deleted the
`Bash(npx cspell:*)` permission [measured 2026-08-30: `npm ls cspell` → empty;
no `node_modules/.bin/cspell`; `grep -ci cspell` on the three governance files →
0/0/0; `lint:spelling` absent from `package.json`]. The `cspell.json` deletion
in the working tree is that commit's **sanctioned completion**, which its own
body says is owed by the human because a hook blocks the agent from deleting
files.

**So the observed sequence has a single ordinary cause.** 0 → 8 was the
uninstall's `npm install` dropping the bundled dictionaries; 8 → 30 was the
config file going away; and every `npx cspell` run after 23:11 fetched a binary
that is no longer part of this project. **Six commits — `304160c5`, `8c7708d4`,
`fec32a75`, `944125b2`, `88ab30b4`, `6c510e5f` — state a cspell gate in their
bodies. Those gates are not this repo's.** The numbers are real about what was
run and irrelevant to what gates this codebase.

⚠ **The method failure is the durable part.** The tool's disappearance was
diagnosed twice, both times from `git status` and `node_modules` timestamps, and
**never once by asking whether the project had removed it on purpose**.
`git log -S cspell` answers it in one command. ⚠ And `9baca1e7` touches none of
this campaign's four paths, so the wave's own `git log` loop could never surface
it — a scoped loop is a scoped view, and a tool's removal is out of scope by
construction. **The paragraphs below are kept unrewritten, because the wrong
reasoning is the record.**

⚠ **A PEER'S `npm install` MOVED A QUALITY GATE MID-SESSION.** `PHASE-1.md`
measured **0** cspell issues twice, was committed on those readings, and then
measured **8** on byte-identical content with no edit in between [measured
2026-08-29: file clean against HEAD, `cspell.json` unchanged since `542d4771`,
no cache file, and the eight words absent from its 150-word list]. The cause is
peer WIP: `package.json` and `package-lock.json` are both dirty and
`node_modules` was rewritten at 22:49, twelve minutes before the second reading
— an install swapped cspell's bundled dictionaries underneath a running session.
**All eight words pre-date this campaign's wave-3 commits** [measured: each
appears in the file at `a0155678`], so none was introduced here and none is
whitelisted in response — widening a dictionary to accommodate a peer's
transient dependency state would outlive the state that caused it. Recorded
because the earlier readings were TRUE WHEN TAKEN and are no longer
reproducible, which a later reader would otherwise read as a false claim.

⚠ **The empty-station caption does not exist in code.** `orchestrate/README.md`
specifies `Tokens, spelling: nothing studies this phase yet`, including a
spoken-form rule turning the label's `·` into a comma, and **no live source
implements it** [measured 2026-08-27: `git grep -nE "nothing studies|studies
this phase"` over `src/**/*.ts` and `*.tsx` → only the deprecated architecture
and unrelated prose; positive control `Tokens · spelling` **is** implemented, at
`orchestrate/display-labels.ts`]. So the follow-on recorded in this lens's
README § Edge cases — that the caption cannot tell "nothing studies this phase"
from "everything that studies it declined" — is about a caption **nobody has
written yet**. It is `orchestrate/`'s, not this lens's, and not wave 3's — see
the ruling recorded above, dated 2026-08-27: observe it, do not fix it.

⚠ **The documented jsdom flake was met first-hand**, for the first time in this
campaign rather than relayed:
`TypeError: textRange(...).getClientRects is not a function` printed during an
`orchestrate/tests/index.test.tsx` run while the file still passed [measured
2026-08-27]. The record's standing instruction is to check the **symptom**
rather than trust an isolated re-run, and this is that symptom verbatim.

⛔ **THE LIVE REGION CANNOT ANNOUNCE ANYTHING, AND THE TWIN PROMISES IT WILL.**
Raised by `ar-4` at increment A5, which proved it two ways rather than asserting
it: a runtime probe against this repo's own React 19.2.4 and jsdom showing
`data-*` set to `null` and to `undefined` produce identical DOM, and a
TypeScript probe under this repo's real flags showing the `data-*` JSX slot is
unconstrained. The finding is the shape, not the values:
`<div data-spellme-verdicts aria-live="polite">` carries **three `data-*`
attributes and no text content, ever**. Assistive technology observes a live
region through changes to accessible CONTENT; `data-*` mutations carry no
accessible semantics at all. So the region as contracted can never speak.

`ux/user-journeys.md` Journey 5 — the journey written for the learner who does
not use a mouse — states the opposite as canon: _"The verdicts land in an
`aria-live` region, so they are announced rather than only coloured."_

⚠ **This is a Phase-0 contract gap, not drift introduced by A5.** `README.md` §
UI structure and `DOCS.md` § Execution phases 7 both describe the region in
attributes only, and A5 implements exactly what they specify. A5 is merely the
first increment to mount it.

⛔ **CORRECTION, 2026-08-30, prompted by the human: "no unit test can ever catch
this" was WRONG, and wrong in the direction that lets a defect stand.** `ar-4`
asserted it, the orchestrator repeated it, and neither measured it. A unit test
catches it in one line, with an instrument already in the file: the `verdicts()`
helper in `tests/component.test.tsx` returns the element, and the suite already
calls `.getAttribute('aria-live')` on it, so `.textContent` was one property
away [measured 2026-08-30, jsdom over both markups: the region as A5 renders it
gives `textContent` `""`, with nothing to announce; the same region carrying a
built sentence has content to announce]. **Only the last step is untestable** —
whether a screen reader vocalizes it, which varies by product and browser and
has no jsdom equivalent. The defect lives in the first half, not that one.

⚠ **The obvious alternative instrument does NOT work, which is why it was
measured before being written down.** `aria-live="polite"` alone does not
compute to the `status` role — `queryAllByRole(body, 'status')` finds **zero**
for both the empty region and the one carrying text [measured 2026-08-30]. Role
queries are the wrong tool here; `textContent` is the right one.

**So the disposition changes.** This is not an untestable gap awaiting a human's
eye — it is a **writable lock**, owed by the wave that wires
`judgeClaim`/`settle`, because only that wave produces a verdict to announce. In
wave 3 `lastVerdicts` is permanently null and an empty region is CORRECT, so the
lock cannot be written yet and must not be forgotten when it can be. What
remains the human's is narrower: whether the region gets text at all, which is a
Phase-0 contract question.

⚠ **`DOCS.md`'s sketch never mentions the legend or the fates panel.** Phase 7
and the Mermaid `Surface` node enumerate the tapes, the jar, the claim form and
the verdicts, where `README.md` § UI structure names two more regions [measured
2026-08-30: `grep -c legend DOCS.md` → 0]. `DOCS.md` is an architectural
contract and changing it needs the human, so nothing was edited — but the
document each `ar-4` is instructed to hold the implementation against is itself
incomplete relative to the README, and every audit from A6 onward is measuring
against the smaller of two contracts. Owed as a documentation pass once the
fates panel lands.

⚠ No checkpoint so far has exercised a screen reader either: #1 and #2 were
sighted DOM checks and #3 covered tab order, not announcement.

**Left for the human, because it changes a Phase-0 contract.** The reviewer's
counter-proposal is a visually-hidden text node inside the region, built from
the same `lastVerdicts` once judging lands, leaving the `data-*` attributes as
harness and CSS hooks — which reconciles the announcement channel with
`ux/wireframes.md`'s requirement that verdicts sit against the fields they judge
rather than in a banner. **Recorded now rather than at the wave that wires
`judgeClaim`**, because that wave will fill the three attributes with real
verdicts and have every reason to believe the job is done.

#### Corrections to immutable commit bodies

A body cannot be amended, so each correction lives here.

- **`12f1d9da`** asserts this module's `DOCS.md` carried no `§` citation before
  it, "against **3** in the working copy". The 3 is wrong — the count at that
  commit is **4** [measured: `git show 12f1d9da:<the file>` piped to `grep -c`
  for the sigil → 4; at its parent → 0]. A fix applied later in the same commit
  added a fourth citation and the counting sentence was not re-measured after
  it. The "carried none before" half is true and re-verified.
- **`e872d18b`** states the scoped suite as "44 passed | **50** skipped". It is
  **48** — the number its own gate block printed in the same turn [measured]. 50
  was the pre-increment-1 figure, carried forward by hand instead of read off
  the output beside it.
- **`8c7708d4`** (increment A4) attributes the cspell instability to dependency
  churn alone — "`package-lock.json` was rewritten at 22:49 and AGAIN at 23:04,
  each time swapping cspell's bundled dictionaries". **That is at most half the
  cause, and the larger half is wrong.** A peer has **DELETED `cspell.json`**
  from the working tree [measured 2026-08-30: `git status --porcelain --
  cspell.json` reports a deletion, alongside a deleted
  `.claude/skills/btw/SKILL.md`]. With the committed config supplied explicitly,
  the same file measures **8**; without it, **30** [measured: `npx cspell
  --config <HEAD's copy>` → 8, bare run → 30]. So the 0 → 8 step is dictionary
  churn and the 8 → 30 step is the missing 150-word project list. The body's
  numbers were right and its explanation was not.

  ⚠ **And the deletion makes the gate fail SILENTLY in the worst shape.**
  `npx cspell --config cspell.json <file>` now prints a configuration error and
  then `Files checked: 0, Issues found: 0 in 0 files` — which, read through the
  `| tail -1` this campaign uses everywhere, is indistinguishable from a clean
  pass. **`Files checked: 0` is the tell; the issue count is not.** Nothing was
  restored: `git checkout`/`git restore` are forbidden, and the deletion is a
  peer's uncommitted work, not this campaign's to judge.

- **`fec32a75`** (increment A5) carries "No unit test can catch it" for the
  live-region gap. **Wrong**, and corrected in the section above under the
  2026-08-30 heading: `textContent` catches it in one line, using a helper the
  suite already has. The claim came from `ar-4` and was repeated without
  measurement — precisely the failure the sourced-claims rule exists to stop,
  committed in a body that disclaims a different relayed claim two paragraphs
  earlier. Only screen-reader vocalization is untestable, and the defect is not
  there.

- **`944125b2`** — the commit that corrected the live-region claim — states its
  own cspell gate as "Issues found: 8". **It is 10** [measured 2026-08-30], and
  the run printing 10 was in the SAME TURN as the body saying 8. That is this
  campaign's signature defect, committed inside a commit whose subject is a
  different correction by the same author. The two extra hits were one coined
  word used twice, in the prose of that very correction — reworded rather than
  whitelisted, per the standing trap against widening a dictionary to admit your
  own invention.

  ⚠ **And the instrument that found it went vacuous, for the second time this
  session.** Diffing the unknown-word SET against a `git show` copy written to
  `/tmp` reports `Files checked: 0` — cspell does not scan outside the tree — so
  the "words added" list was simply the whole current list and proved nothing.
  The positive control built into the same command is what caught it. **Never
  diff a word set against an out-of-tree baseline; test each flagged word
  against the tree instead.**

- **`6d72f76e`** reads "all agreeing → 1 … positive control **19**". The → 1 is
  true of all three instruments; the 19 is true of the **collapsed pipeline
  alone** — `grep -c` and `git grep -c` both return 18, because `README.md`
  wraps one parenthetical mid-phrase so no single line carries the whole string
  [measured]. 19 is the right occurrence count, 18 the right line count.

⚠ **Three of these are the same defect: a count stated beside the measurement
that contradicts it.** The campaign already names the class — the fix round is
where new defects enter — and wave 3 has now reproduced it three times in one
session. What caught each was re-verifying with the reviewer that raised the
finding, never the author re-reading their own body.

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
- ⛔ **PHASE-2 OBLIGATION — the sandbox injection must be REMOVED in the same
  commit that registers `spellme`.** `spellme` is injected into
  `spiralearn/sandbox/orchestrate/index.mdx` while it is being built, and is
  deliberately **absent** from
  `src/lib/study-lenses/orchestrate/lib/composing/built-in-lenses.ts` [measured
  2026-08-29: `grep -c spellme` on that file → 0]. Registration without removal
  puts the same name on the roster twice and `joinLensRoster` **throws** [read:
  `orchestrate/lib/composing/join-lens-roster.ts` — "duplicate lens name
  \"${collision}\" — joining is append-only; rename the lens"]. `47234d7c` is
  the precedent, and it is a real one: that commit touched `index.mdx` **and**
  `built-in-lenses.ts` together [measured 2026-08-29: `git show --stat 47234d7c`
  — four files, both among them]. Recorded per the wave-3 launch prompt's
  standing instruction, which required wave 3 to write it down rather than
  merely know it.

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
- ⭐ **Partial data on a failed stage — a Phase-0 unit for a FRESH session**
  (human ruling 2026-08-27, taken mid-wave-3 and deliberately not designed
  there; `acorn-loose` approved as a new dependency). Today a failed stage
  publishes **only a cause** — `StageFailure` is `{ ok: false; cause }` with no
  partial value [read: `embody/types.ts` — "A stage that failed — as data, never
  a throw"]. That, not policy, is why this lens declines a program that does not
  lex: there is no sequence to build a stream from. The three stages differ
  sharply, and this scoping is recorded so the next session need not re-derive
  it:
  1. **`tokens` — genuinely incremental.** `tokenizer()` yields one token at a
     time, so the prefix exists at throw time; `Array.from` is what discards it
     [read: `embody/derive-tokens.ts`]. `StageCause` already carries the
     stopping point — an `offset` its own doc calls "directly sliceable". ⚠ That
     exact line carries a **compile footgun no test in this repo can see**: the
     spread form compiles under Docusaurus/Babel loose mode to `[].concat(x)`,
     which wraps the iterator instead of draining it, so the stage would report
     `ok` for source that does not lex. The file's own comment is the warning.
  2. **`ast` — not incremental at all.** `parse()` is one call and yields no
     partial tree. `acorn-loose` is the purpose-built answer and is approved but
     **not installed** [measured 2026-08-27: `package.json` declares `acorn` and
     `eslint-scope` only]. It carries a **curriculum** question, not merely a
     technical one — loose parsing invents nodes to bridge broken syntax, and
     publishing a tree the language never produced is a contract decision for an
     instrument built on the machine's own account.
  3. **`environment` — no independent failure mode.** It short-circuits on
     `!ast.ok` and `!entwined.ok`, and `eslint-scope`'s `analyze()` needs a
     complete `Program` [read: `embody/derive-environment.ts`]. Its partialness
     is **entirely downstream of `ast`'s** — deciding `ast` decides it, at no
     extra cost.
  4. **Also in scope, and easily missed:** `deriveAccessibility` bars `ast` on
     `!facts.tokens.ok`. A partially-successful stage needs that rule
     **re-examined**, not merely extended.

  The instinct behind it is already named as its own lens by ruling — this
  lens's `README.md` § Future direction lists "**the scanner's stopping point**"
  among the further games, each of which is its own lens (human ruling
  2026-08-13). ⚠ One claim was **not** verified: that the evaluators already
  publish partial data by default. `git grep -lnE "partial"` over
  `evaluators/**/*.ts` returned nothing [measured 2026-08-27], so either it is
  structural rather than named that way, or the premise needs checking before
  the handoff leans on it.

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
