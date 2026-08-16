<!-- cspell:ignore spellme lookaheads lookahead tokenizer tokTypes -->
<!-- cspell:ignore backQuote dollarBraceL braceR braceL privateId invalidTemplate -->
<!-- cspell:ignore questionDot Punctuator IdentifierName PrivateIdentifier -->
<!-- cspell:ignore NumericLiteral StringLiteral RegularExpressionLiteral -->
<!-- cspell:ignore TemplateSubstitutionTail HashbangComment LineTerminator -->
<!-- cspell:ignore DivPunctuator RightBracePunctuator pathspec worktree ZWNBSP -->

# tdd-worker launch brief — `lib/scanning` Phase 1, Wave 2

You finish `src/lib/study-lenses/lib/scanning/`. Wave 1 landed 24 of the suite's
71 tests across ten commits and stopped deliberately before the template fold.
**You own the remaining 47.**

Process rulings governing this campaign are in
[`./PHASE-1.md` § Rulings of record](./PHASE-1.md) — nine bullets, eight of them
human rulings and the ninth an orchestrator assignment, findable via
`git grep -n "human ruling" -- .planning-handoffs/spellme/PHASE-1.md` — scoped
deliberately, because the unscoped form also matches the briefs that cite the
rulings, this one included, so its count is not a constant. Eight of the nine
bullets carry the phrase; the ninth, AR-5 ownership, is the orchestrator's own
assignment and says so rather than borrowing the human's authority. Read that
section. Do not re-litigate any of them; if one seems wrong, report FLAG.

⚠ **Only `PHASE-1.md` § Rulings of record is live.** That file was written
before Phase 1 began and its other sections have not been updated: they still
say wave 1 owns Template folding, that the suite holds 67 tests, that
`derive-input-elements.ts` is "currently throwing", and that the first un-skip
is still ahead. All four are stale — Template folding is **yours**, the suite
holds 71, the module is implemented through the naming rule, and `1c6736c9`
landed the first un-skip. Where that file and this brief disagree outside §
Rulings of record, this brief is current.

## ⚠ Resume here — two increments are already done

This brief launched once. The worker landed two increments and then died three
times on harness faults, twice at the identical call. **Nothing was lost; the
discipline held.** Where you pick up, measured 2026-08-16:

| SHA        | Increment                                                        |
| ---------- | ---------------------------------------------------------------- |
| `065afc16` | a backtick opens a template run that folds into one element      |
| `7046bc01` | a right brace continuing a template opens the run that closes it |

Suite: **32 passing, 39 skipped (71)**; `npx tsc --noEmit` 0; eslint exit 0.
Sketch phase 2 (`foldTemplateRuns`) now exists. Phases 1 and 4 still do not.

⚠ **Everything measured at `2989d9e1` is stale by two increments — the table
below AND every forward prediction built on it.** Re-measured at HEAD
(`7046bc01`), the 39 still-skipped tests stand at **25 green / 14 red**:

| Block                      | Green | Red   |
| -------------------------- | ----- | ----- |
| Template folding           | 1     | 1     |
| Right-brace disambiguation | **3** | **0** |
| Trivia                     | 7     | 3     |
| Comments and the hashbang  | 0     | 6     |
| Boundaries — tiling        | 5     | 0     |
| Interfaces                 | 4     | 3     |
| Exceptions                 | 2     | 1     |
| Simple                     | 3     | 0     |

**Expect roughly 14 increments, not 25**, and **there are THREE all-green sets,
not one** — Right-brace, Boundaries and Simple. The brief below calls Boundaries
"the all-green set" in the singular; that is wrong, and the rule it attaches
there applies to all three. It also predicted Right-brace would arrive 2/1 with
the object-literal brace still red; measured, that one went green first at
`065afc16` and the block is now wholly green.

**Re-measure before planning. Trust no arrival-state prediction in this
document, including this one.**

Concretely, your next increment spans three describe blocks: driver
`folds a chunk carrying a tag-only escape` (red) →
`carries every token a folded run spans` (green) → all three Right-brace
assertions (green) → the first two Trivia (green) →
`collapses a carriage return and line feed into one line terminator` (**red —
this opens the next increment**).

**Your next increment is `folds a chunk carrying a tag-only escape`**, and it is
not a small one. `isTemplateChunk` recognizes `tt.template` but not
`tt.invalidTemplate`, and AR-4 established that this is not merely a missing
triangulation — it corrupts output today on a program `acorn.parse` accepts
[measured 2026-08-16]: on ``tag`a${x}\unicode`;let z = 1`` the closing backtick
is mistaken for an opener and the span it starts **swallows the semicolon after
the template** into a fabricated `Template` element. The fix is one line in
`isTemplateChunk`, with two call sites and no other change needed; `7046bc01`'s
body carries the full finding.

### ⚠ AR dispatch — standing arrangement, not a one-off

**A worker in this campaign could not spawn `ar-4`: three stalls, two of them at
exactly that call.** [read: AGENTS.principal.md § Execution mechanics — "A
worker that cannot spawn the registered reviewers pauses at the trigger and
reports the reviewer's input paths; the orchestrator dispatches the registered
agent and resumes the worker with the verdict."]

So: **try to spawn `ar-4` yourself. If it fails or stalls, do not retry it and
do not skip it.** Stop at the trigger and **report BLOCKED** — that is the
channel; a resumable pause is still "cannot finish" and there is no fourth
channel. The report carries the increment's description, the exact pathspec of
the uncommitted change, and the Phase-0 spec paths. **Leave your change in the
working tree, unstaged, and do not commit it** — the orchestrator dispatches the
review and commits from your verified tree, or resumes you with the verdict.
Pass "strictly read-only — no writes, moves, or deletes" along in the reviewer's
input paths, because the orchestrator's prompt must carry it too: an `ar-4` in
this campaign attempted to overwrite the implementation file, and another left
`probe-adhoc.mjs.tmp` at the repo root, where it still sits untracked. The gate
always fires; only its dispatcher moves. **Never commit an increment whose AR-4
has not returned.**

## First act — governance, before anything else

Read the repo-root `CLAUDE.md` router. Check your own model id against its
qualifying list and read whichever governance file it selects, END TO END. Then
`DEV.md` § Incremental Development Workflow (Phase 1), § Adversarial Review
Protocol, § Shared-worktree git mechanics, § Ruling provenance.

Router-text reach into a spawned worker has been measured both present
(2026-07-29) and absent (2026-07-28); the explicit read is the contract.

## Then read the module canon, end to end, never in split ranges

- `src/lib/study-lenses/lib/scanning/README.md` — vocabulary, the two
  lookaheads, the kind table, § Edge cases
- `src/lib/study-lenses/lib/scanning/DOCS.md` — the five-phase architectural
  sketch and its Mermaid data flow. **Your Refactor step is held against this.**
- `src/lib/study-lenses/lib/scanning/types.ts`
- `src/lib/study-lenses/lib/scanning/derive-input-elements.ts` — wave 1's
  implementation, which you extend
- `src/lib/study-lenses/lib/scanning/tests/derive-input-elements.test.ts`

## § Inherited state — read this before planning anything

### What exists, and what does not

Sketch phases **3** (`nameElement` / `elementKind`) and **5** (`fillGaps` /
`gapElement`) exist as named helpers and are correct. **Phase 2 now exists too**
(`foldTemplateRuns`, as of `065afc16`); phases **1** and **4** do not. The
export is `foldTemplateRuns` → `map(nameElement)` → `fillGaps`.

⚠ **Five phases does NOT mean five helpers, and this is a recorded decision.**
[read: PHASE-1.md § What Phase 1 is — "**Five phases, three named helpers, and
that is deliberate.** … The sketch's phase 1 (_Confirm the reading_) is a guard
clause and phase 4 (_Interleave the set-aside_) is a merge — **both stay inline
in the export rather than becoming named helpers.**"] So the target shape is
**three** named helpers — the fold, the naming, the gap split — with the guard
and the merge inline in the export. README § What lives here says the same, and
gives the reason: each has exactly one call site and this package extracts to a
new file only at two or more. Do not extract five.

### Three structural carry-forwards, each with its citation

1. **~~`nameElement` must widen from a token to a group.~~ DONE in `065afc16`**
   — it is now `nameElement(span, code)` over a `TokenSpan`. Kept for the
   record; carry-forwards 2 and 3 remain open. A folded run spans many tokens
   and is named by its **opener** [read: DOCS.md § Execution phases, phase 3 —
   "A folded run takes its name from its opener"]. Phase 2 replaces the `map`
   with a stateful one-token-lookahead walk emitting **fewer** elements than
   tokens — the mirror of `fillGaps`, which already emits more.
2. **`fillGaps` must return an array per gap, not one element.** Splitting and
   naming are one act [read: DOCS.md § Execution phases, phase 5 — "Splitting
   and naming are **one act** here, because which kind a run is decides where it
   ends"]. `'x \n y'` needs three elements out of one gap. `gapElement`
   currently hardcodes `'WhiteSpace'`; do not fix that by swapping the kind —
   the gap must split.
3. **Phase 1's guard must name `comments` explicitly.** See the trap below.

### ⚠ The phase-1 trap — the sketch's only throw site has no red test to force it

Two of the three `Exceptions` tests **already pass**, through incidental
`TypeError`s raised deep inside phase 3: `tokens.map` on `undefined`, and
`code.slice` inside `nameElement`. So the module already violates [read: DOCS.md
§ Structural constraints — "**Fail loudly at the boundary, never inside.**"],
and the only test that will go red is the `comments` one.

The minimum-work-to-green answer to a single red `comments` test is a single
`comments` check. That leaves phase 1 permanently half-built, leaves the throw
sites inside phase 3 forever, and **no test in the suite can detect it** — both
tests that would have are already green.

**Your deliverable for that increment is the phase-1 guard at the top of the
export, covering all three fields.** Green is not the acceptance signal there;
the acceptance signal is that neither `tokens.map` nor `code.slice` is reachable
with an absent input.

Related: the public JSDoc already promises `@throws TypeError` for all three
fields and that the result is "deeply frozen". Neither is true at HEAD. The
freeze half is self-correcting — the three `Interfaces` freeze tests are red and
will force it. The throws half is not.

### 22 of your 47 are already green — measured, not relayed

[measured 2026-08-15: the committed implementation built with `esbuild
--format=esm --bundle --external:acorn` and every skipped assertion replayed
against it. **`--external:acorn` matters**: bundling acorn inline gives the
module a *different* `tokTypes` instance from the test's, every identity-keyed
lookup misses, and 22 green reads as 19. That is the same
process-global-singleton hazard README § Public API cites for publishing indices
rather than token references.]

| Block                      | Green  | Red    | The red ones                                                                                                 |
| -------------------------- | ------ | ------ | ------------------------------------------------------------------------------------------------------------ |
| The vocabulary (straggler) | 1      | 0      | —                                                                                                            |
| Template folding           | 0      | 9      | all                                                                                                          |
| Right-brace disambiguation | 1      | 2      | object-literal brace in an interpolation; continuation brace — **but see below: 2/1 by the time you arrive** |
| Trivia                     | 7      | 3      | CRLF as one `LineTerminator`; never merges WS with LT; U+2028 is a `LineTerminator`                          |
| Comments and the hashbang  | 0      | 6      | all                                                                                                          |
| Boundaries — tiling        | 4      | 1      | publishes nothing of zero width — **but see below: 5/0 by the time you arrive**                              |
| Interfaces                 | 4      | 3      | the three freeze assertions                                                                                  |
| Exceptions                 | 2      | 1      | throws when the comment array is absent — **see the trap above**                                             |
| Simple                     | 3      | 0      | —                                                                                                            |
| **Total**                  | **22** | **25** |                                                                                                              |

**A green un-skip is not a broken increment.** The increment boundary is the red
event (human ruling 2026-08-15). A test that arrives green rides into the open
increment with a one-line record of what it would have caught and which earlier
increment forced it. Expect roughly **25 increments**.

⚠ **Two blocks will arrive with FEWER reds than this table shows, because your
own earlier work turns them green** — the table measures HEAD, not the tree you
will have built by the time you reach them. Both are consequences of the fold:

- **`Boundaries — tiling` will be 5 green / 0 red.** Every zero-width element
  the current implementation publishes wraps a `template` token, and phase 2
  absorbs exactly those — so `publishes nothing of zero width` passes the moment
  the fold lands.
- **`Right-brace disambiguation` will be 2 green / 1 red**, because its
  continuation-brace assertion is byte-identical to a Template-folding one.

**When a whole set arrives green there is no driver, and therefore no increment
— so do not close one.** The standing ruling already decides this: [read:
PHASE-1.md § Rulings of record — "An increment is bounded by exactly one red
event … Those increments are **merged into the driver that precedes them**"].
Cycle step 1's Green branch already implements it — "record … then repeat step
1" walks straight out of an all-green set into the next set's first test. So:

> **A set that arrives all-green does not close an increment. Keep un-skipping
> into the next set until a red opens one.** The greens ride that increment's
> commit and its AR-4, each with its one-line record.

**The tail is the one case forward-merge cannot serve.** `Simple` is last, is
3-green now, and stays green — its three fixtures contain no template, no
comment and no mixed-kind gap, so nothing in phases 2, 4 or 5 moves its element
indices. There is nothing after it to open an increment. For that one the
ruling's literal words apply: merge **backward** — do not close the `Exceptions`
increment until you have walked to the end of the file.

Do not invent a commit category for either case, and do not manufacture a red by
weakening the implementation.

Re-measure this table yourself before trusting it; the tree moves.

## Measured baselines — the debt that is NOT yours

| Fact                             | Value                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Last commit touching your module | `7046bc01` (was `2989d9e1` when this table was written)                                                                                                                                                                                                                                                                                           |
| `npx tsc --noEmit`               | **0 errors.** Any error you see is yours                                                                                                                                                                                                                                                                                                          |
| Your module's tests              | 71 total, **32 passing, 39 skipped** (24/47 when written)                                                                                                                                                                                                                                                                                         |
| markdownlint, repo-wide          | **8113 errors** across 861 files [measured 2026-08-15: `npm run lint:md`] — **not your gate**, and you touch no `.md`. An earlier draft said 82, from `repo-facts.mjs`'s 24-hour cache. A peer added a local notes directory to `.gitignore` uncommitted, and markdownlint's glob does not honor `.gitignore`, so its 132 `.md` files are counted |
| Node                             | v20.11.0 against engines `>=22.11.0` — below minimum, everything runs anyway. Proceed; do not upgrade anything                                                                                                                                                                                                                                    |
| HEAD                             | **moves under you**, many times an hour. Re-measure; never cache                                                                                                                                                                                                                                                                                  |

**Failing-test baseline — repo-wide, all foreign** [measured 2026-08-15: `vitest
run --project unit` → `8 failed | 415 passed | 1 skipped (424)`, `41 failed |
9610 passed`]:

```text
scripts/lib/check-tables/tests/find-table-defects.test.ts
src/lib/embody/lib/evaluating/shared/guard-loops/sandbox.test.ts
src/lib/study-lenses--deprecated-architecture/embody/language-levels/just-enough-javascript/aithor/tests/aithor.test.ts
src/lib/study-lenses--deprecated-architecture/embody/language-levels/just-enough-javascript/aithor/tests/make-aithor-runtime.test.ts
src/lib/study-lenses--deprecated-architecture/embody/lib/evaluating/trace/variables/tests/trace-variables.test.ts
src/lib/study-lenses--deprecated-architecture/embody/lib/evaluating/trace/variables/tests/variables-worker-setup.test.ts
src/lib/study-lenses--deprecated-architecture/embody/tests/embody-trace-variable-lifecycle.test.ts
src/plugins/study-lenses/tests/remark-study-lenses.test.ts
```

None is in `lib/scanning`. Your gate is your own directory green plus zero NEW
failures outside that list — never whole-repo green. ⚠ The first is **untracked
peer work in progress**; if a peer moves or fixes it, that baseline shifts
through no action of yours. Judge by path against the other seven.

## Commit form — verbatim, non-negotiable

```text
git add <your explicit paths>
git diff --staged --name-only
git commit --no-verify -m "..." -- <the same paths>
```

One shell invocation, so a peer's `git add` cannot land between them. **The
pathspec is the protection, not a clean index.** Peer files ARE currently
staged; that is normal, is not yours to unstage, and is no reason to stop. If a
peer has touched a file you need, you cannot commit it without taking their work
— leave it and report FLAG. `--no-verify` because lint-staged runs over the
whole staged set. On an `index.lock` collision, wait briefly and retry. Never
push, never branch, never amend. **Announce each commit: full SHA + message.**

Your paths are exactly two:
`src/lib/study-lenses/lib/scanning/derive-input-elements.ts` and
`.../tests/derive-input-elements.test.ts`. Anything else is a FLAG.

## Ceremony — the human's, not yours

`ceremony: full`. **AR-3 is opted out** for un-skips (human ruling 2026-08-14) —
do not spawn it, and do not extend the opt-out to AR-4. **AR-4 fires per
increment.** **AR-5 is the orchestrator's** — do not spawn it; it fires at your
exit. Never pass a `model` parameter to a reviewer.

**Carry "strictly read-only — no writes, moves, or deletes" in every review
prompt.** In wave 1 an `ar-4` accidentally attempted to overwrite the
implementation file and was stopped only by the sandbox. Verify the tree with
`git diff` before staging, every time.

**AR-4 verdict routing:** PROCEED → commit. CONSIDER → document your response to
each concern in the commit body, then continue. PAUSE → **report BLOCKED with
the concerns verbatim, do not commit**; DEV.md's default there is discard and
re-implement, not patch-in-place.

Every commit body carries this settings line verbatim:

```text
work: software · twin-doc: none · ceremony: full (AR-3 opted out by human, 2026-08-14) · prospective
```

DEV.md's example shows `(AR-3 n/a)`; ours deliberately differs, because AR-3 is
applicable here and was opted out. Do not "correct" it.

Commit bodies carry **sourced claims** — `[measured:]` / `[read:]` /
`[relayed:]` with evidence. A body is immutable; amend is forbidden. **A claim
of absence needs its instrument shown to fire on a positive control before you
cite it** — wave 1 froze a `grep '\n|\r'` into a body, and that pattern matches
the literal string `n|r`, so it could never have fired.

## Your cycle

An increment owns a set of un-skips; work strictly in file order within it.

1. **Un-skip the next single test and run it.** Never a whole set at once.
   - **Green** → record in one sentence what it would have caught and which
     earlier increment forced it, then repeat step 1. Never assume; run it.
   - **Red, none red yet in this increment** → this is the driver.
   - **Red, one already went red** → **stop, close the current increment at
     steps 6-11, then open a new one starting here.**
2. `npx eslint <test-file>`
3. Implement the minimum that makes the driver green.
4. **Patch-or-reroll check** — if green came from guessing or touching more
   surface than the stub implied, discard and re-implement fresh.
5. Continue step 1 through the rest of the set.
6. `npx eslint <impl-file>`
7. **Refactor against the DOCS.md sketch** — all five phases present and
   distinct _as phases_, three of them as named helpers with the guard and the
   merge inline? Concerns separated? Any Fake It past its triangulation point?
   Ephemeral Mermaid for your own reasoning.
8. Self-review — both checklists in your governance file.
9. **AR-4**, with the implementation, the test file, `types.ts` and the DOCS.md
   sketch including its Mermaid diagram.
10. Final lint on every modified file; `npx tsc --noEmit`; the scoped vitest run
    — **show all three summary lines**, since an Unhandled Error fails a file
    without failing any test.
11. Commit. Announce the SHA.

**No 🔍 sandbox checkpoint** — declared: `lib/scanning` is a pure leaf with no
user-observable surface.

**No status hedging in source.** Wave 1 shipped a comment claiming "exactly one
[type] will never be a row at all" that was false by at least four, was
rewritten three times without converging, and had to be removed in `2989d9e1`.
Campaign state goes in commit bodies. A comment no test can hold is an
unversioned second spec.

## Ground truth — measured, do not re-derive

acorn 8.16.0, `ecmaVersion: 2024`, `sourceType: 'module'`, `ranges: true`,
`onComment` array. Reproduced exactly by two independent readers.

```text
"`a`"        -> "`"[0,1) template[1,2) "`"[2,3)
"`a${b}c`"   -> "`"[0,1) template[1,2) "${"[2,4) name[4,5) "}"[5,6) template[6,7) "`"[7,8)
"`${a}${b}`" -> "`"[0,1) template[1,1)ZW "${"[1,3) name[3,4) "}"[4,5) template[5,5)ZW "${"[5,7) name[7,8) "}"[8,9) template[9,9)ZW "`"[9,10)
"`a${`n${q}`}c`" -> 13 tokens; template[10,10) is ZW; inner run closes before the outer resumes
"tag`a${x}\unicode`" -> name[0,3) "`"[3,4) template[4,5) "${"[5,7) name[7,8) "}"[8,9) invalidTemplate[9,17) "`"[17,18)
"`${ {a:1} }`" -> "`"[0,1) template[1,1)ZW "${"[1,3) "{"[4,5) name[5,6) ":"[6,7) num[7,8) "}"[8,9) "}"[10,11) template[11,11)ZW "`"[11,12)
"#!/usr/bin/env node\nlet x = 1" -> tokens from 20; comments=[{Line,0,19}]
"// x\nlet a = 1" -> tokens from 5; comments=[{Line,0,4}]
"x // hi" -> name[0,1); comments=[{Line,2,7}]
"// hi" / "/* hi */" / "/* a\nb */" -> ZERO tokens, one comment spanning the whole source
"x\ty" / "x\u00A0y" / "x\u2028y" -> name[0,1) name[2,3); gap [1,2)
"x\r\ny"                            -> name[0,1) name[3,4); gap [1,3)  <- TWO chars
```

**Labels are not identities — compare against `acorn.tokTypes.*`:**

| label   | `tokTypes.*`   |     | label             | `tokTypes.*`      |
| ------- | -------------- | --- | ----------------- | ----------------- |
| `` ` `` | `backQuote`    |     | `_=`              | `assign`          |
| `${`    | `dollarBraceL` |     | `/`               | `slash`           |
| `}`     | `braceR`       |     | `?.`              | `questionDot`     |
| `{`     | `braceL`       |     | `template`        | `template`        |
| `=`     | `eq`           |     | `invalidTemplate` | `invalidTemplate` |

- **`tokTypes.template !== tokTypes.invalidTemplate`.** Both lookaheads must
  admit both, or the `}` before a tag-only-escape chunk is mis-named and the
  closer search runs off the end of the array.
- **The generator form emits no `eof` token.** An `eof` guard is dead code here.
- **The gap is `[1,2)` for tab, NBSP, U+2028 and U+2029** — acorn skips them all
  identically, so classifying them is entirely this module's job and was
  entirely untested before `d2688fd8`. **CRLF is the exception: its gap is
  `[1,3)`**, two characters, and it must publish as ONE `LineTerminator`
  element. An earlier draft of this brief said "and CRLF alike"; that was a
  generalization past what had been measured, and it fed one of your three
  Trivia drivers.

## Traps

- **Never read `token.value`** — absent from acorn's `.d.ts`, an _object_ for a
  regexp token, and `priv` (no `#`) for `#priv`.
- **`loc` is always `undefined`** — the options pass `ranges`, not `locations`.
- **Never deep-freeze anything holding a parser token.** A token's `type` is a
  process-global singleton; a test pins
  `Object.isFrozen(acorn.tokTypes.name) === false`.
- **`Array.from(...)`, never `[...iterable]`** — `local/no-iterable-spread`.
- **Never run `eslint --fix`** — severity-blind, a known landmine. Wave 1 hit
  `unicorn/escape-case` and fixed it by hand.
- **`git grep -c "it.skip"` unscoped matches 17 files**, including
  `scanning/README.md`'s prose and both `spellme` suites — whose counts are the
  ones most likely to corrupt a burn-down. Scope it to your test file.

## Lint constraints

No `switch` (`no-restricted-syntax`) — `Map`/`Set` keyed by TokenType identity
plus an ordered if-chain. **`local/newspaper-order`**: imports → main → consts →
helpers, hard error, not auto-fixable — your new tables go in the consts block
between the export and the helpers. `func-names: always`.
`unicorn/prevent-abbreviations` (no `idx`, `str`, `tok`, `el`; `parameters` not
`params`). `functional/immutable-data` warn — a local accumulator needs paired
`/* eslint-disable ... -- <reason> */` … `/* eslint-enable ... -- <reason> */`,
and an unused directive is itself an error. `max-len` 100.
`sonarjs/cognitive-complexity` warns at 15. `import/no-named-export`.

## Un-skip order

File order, **except** `Boundaries — tiling` which un-skips just before
`Interfaces` (human ruling 2026-08-14, § Rulings of record — not a mistake to
correct):

1. **The vocabulary straggler** — the legacy-octal test. Green; ride it.
2. **Template folding** (9) — **7 landed, 1 green, 1 red.** Phase 2 exists; the
   one red is the tag-only escape, and it is your next driver.
3. **Right-brace disambiguation** (3) — **2 green / 1 red by the time you
   arrive** (the table's 1/2 is measured at HEAD, before your fold). Two of this
   block's three assertions are verbatim duplicates of vocabulary and folding
   assertions, and the continuation-brace one goes green with the fold.
4. **Trivia** (10) — 7 green. The three red ones build the run split.
5. **Comments and the hashbang** (6, all red) — creates phase 4. The hashbang is
   position **and** opening characters; `// x` at offset 0 must stay a
   `Comment`.
6. **Boundaries — tiling** (5) — **5 green / 0 red by the time you arrive.**
   `publishes nothing of zero width` goes green the moment the fold lands, since
   every zero-width element wraps a `template` token and phase 2 absorbs exactly
   those. One of **three** all-green sets (with Right-brace and Simple): do not
   close an increment here — keep un-skipping until a red opens one.
7. **Interfaces** (7) — 4 green; the three freeze assertions are red.
8. **Exceptions** (3) — 2 green, **and see the phase-1 trap above.**
9. **Simple** (3) — all green; recorded-departure guards.

## Your exit gate

Report DONE only when all hold, each with its command output:

- 71 of 71 passing, **0 skipped**
- `npx tsc --noEmit` 0 errors
- No NEW failing file outside the 8 baseline paths
- All five sketch phases are present and distinct **as phases** — three of them
  as named helpers, the guard and the merge inline (see § Inherited state)
- The guard is at the top of the export. With any of the three fields absent,
  **no code past the guard runs** — not `tokens.map`, not `code.slice` inside
  `nameElement`, and not `code.length` inside `fillGaps`, which is a third reach
  site an earlier draft of this gate missed
- Every commit announced with its full SHA

The orchestrator then fires AR-5 and presents to the human. **`spellme` is NOT
yours** — Phase 1 ends here.

## Report DONE | BLOCKED | FLAG — no fourth channel

- **DONE** = verified AND committed. Green-but-unverified is BLOCKED.
- **BLOCKED** = cannot finish, or AR-4 returned PAUSE. If running long on
  context, report BLOCKED **at a committed increment boundary** — never
  mid-triangulation — naming the increment you stopped after.
- **FLAG** = an inter-file contract boundary or a suspected coupling. Any change
  to `types.ts`, `README.md` or `DOCS.md` is a FLAG, never yours to make.
