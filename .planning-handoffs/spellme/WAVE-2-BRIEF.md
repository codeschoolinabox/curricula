<!-- cspell:ignore spellme lookaheads lookahead tokenizer tokTypes -->
<!-- cspell:ignore backQuote dollarBraceL braceR braceL privateId invalidTemplate -->
<!-- cspell:ignore questionDot Punctuator IdentifierName PrivateIdentifier -->
<!-- cspell:ignore NumericLiteral StringLiteral RegularExpressionLiteral -->
<!-- cspell:ignore TemplateSubstitutionTail HashbangComment LineTerminator -->
<!-- cspell:ignore DivPunctuator RightBracePunctuator pathspec worktree ZWNBSP -->

# `lib/scanning` Phase 1, Wave 2 — closed record (was a tdd-worker launch brief)

> # ⛔ CLOSED — this brief has no work left in it
>
> **`lib/scanning` Phase 1 is complete: 71 of 71 passing, 0 skipped, closed at
> `10cec890`** [measured 2026-08-18]. Wave 1 landed 24 tests across ten commits;
> wave 2 landed the remaining 47 across nine. **Nobody is to execute from this
> document.** Everything below is a record — kept for its measurements, its
> traps and its lessons, all of which still teach. The live campaign record is
> [`./PHASE-1.md`](./PHASE-1.md) § Rulings of record, § Traps and § Where things
> stand.
>
> This banner exists because a false live-status document is the defect this
> campaign has paid for three times — `38fee403`, `6ecb22e9` and now this
> commit, and a cold read of the stale version once returned twelve must-fix
> findings across two passes. AR-5 at the Phase-1 close ruled that shipping it
> stale a fourth time, knowingly, would escalate its verdict to PAUSE.

Process rulings governing this campaign are in
[`./PHASE-1.md` § Rulings of record](./PHASE-1.md) — nine bullets, eight of them
human rulings and the ninth an orchestrator assignment, findable via
`git grep -n "human ruling" -- .planning-handoffs/spellme/PHASE-1.md` — scoped
deliberately, because the unscoped form also matches the briefs that cite the
rulings, this one included, so its count is not a constant. Eight of the nine
bullets carry the phrase; the ninth, AR-5 ownership, is the orchestrator's own
assignment and says so rather than borrowing the human's authority. Read that
section. Do not re-litigate any of them; if one seems wrong, report FLAG.

⚠ **Read three sections of `PHASE-1.md`, not one: § Rulings of record, § Traps,
and § What Phase 1 is.** All three are live and this brief depends on all three.

- **§ Traps** carries items this brief does not duplicate — plant no new
  `PINNED(` markers, the per-file markdownlint form is `--no-globs "<file>"`,
  and `repo-facts.mjs` caches its markdownlint number for 24 hours.
- **§ What Phase 1 is** carries two rulings this brief cites but does not
  restate: **five phases, three named helpers** (the guard and the merge stay
  inline), and **Fake It expires at `One`** — under tests-committed-skipped,
  DEV.md's "when the next test is written" means "when the next test is
  un-skipped".
- **§ Where things stand** carries this campaign's SHA list, which AR-5 takes.

⚠ **An earlier draft of this brief told you the rest of that file was stale, and
named four claims it does not make. That was false, and it cost this document
its own credibility.** [measured 2026-08-16: `PHASE-1.md` line 12 — "Template
folding, which wave 1 did **not** reach"; line 86 — "**71 tests** since the
second Phase-0 top-up"; line 74 — "**Implemented through the naming rule and the
gap fill as of `2989d9e1`**"; line 90 — "The first un-skip was … it landed in
`1c6736c9`".] All four are current in that file. Its only "throwing" line is
about `spellme/core.ts`, and that one is **true**. Treat `PHASE-1.md` as
accurate. Where it and this brief disagree about **arrival state** — which tests
are green today — this brief is the later measurement; that is a freshness
difference, not an error in that file.

## Wave 2 — COMPLETE, nine increments

This brief launched several times. **Seven agent sessions died** — three harness
stalls at the `ar-4` call, one weekly-quota wall at the same call, one `529`
during the reading phase before touching anything, one `500` two increments
deep, and one session limit that took an AR-5 before it read a line. **No death
ever cost committed work**, because the rule held: leave the change unstaged,
commit nothing, discard nothing, never commit an increment whose AR-4 has not
returned. Two deaths cost a drafted commit body and its green-arrival records,
which had to be reconstructed from the assertions; one hid a landed commit from
the orchestrator, whose own "next driver" was a full increment stale until the
un-skip arithmetic failed to reconcile.

The nine, in order, each with its own AR-4 before landing:

| SHA        | Increment                                                                   |
| ---------- | --------------------------------------------------------------------------- |
| `065afc16` | a backtick opens a template run that folds into one element                 |
| `7046bc01` | a right brace continuing a template opens the run that closes it            |
| `26eba4a5` | both template-chunk token types open and close a folded run                 |
| `9d719f17` | a carriage return and line feed pair collapses into one terminator          |
| `25449442` | a gap holding both trivia kinds splits into one element per run             |
| `2200c512` | a line separator names a LineTerminator rather than whitespace              |
| `c9d8d40a` | the set-aside comment channel merges into source order                      |
| `f63b7b2a` | a hashbang is corrected off the comment channel by position and opening     |
| `10cec890` | the published sequence freezes, and the boundary guard confirms the reading |

**Final state** [all measured 2026-08-18]: **71 passing, 0 skipped (71)**;
`npx tsc --noEmit` 0; eslint, prettier and cspell exit 0 on both paths;
repo-wide `8 failed | 416 passed | 1 skipped (425)`, exactly the known-foreign
baseline, nothing from `scanning`. **All five sketch phases exist** — the
boundary guard and the comment merge inline in the export, the fold, the naming
and the gap split as the three named helpers, per the standing ruling.

⚠ **Three FLAGs are open and none is an agent's to close.** They are the human's
at the push gate: the boundary guard type-checks `code` but presence-checks the
two arrays, so a present-but-wrong-typed array still fails _inside_ — and
`DOCS.md` contradicts itself about whether that is allowed; the guard has no
regression lock, because all three `Exceptions` fixtures assert
`.toThrow(TypeError)` and stay green if the guard is deleted; and U+2029 and
ZWNBSP sit in the kind table with no fixture. The last two are suite changes,
which this campaign twice put to the human rather than let an agent take.

⚠ **Everything below predicts an arrival state against a tree that no longer
exists.** Its _rules_ still teach; its _numbers_ are history.

## History — landed increments, kept for their findings

⚠ **Everything from here to § AR dispatch describes work that is DONE.** It is
kept because its measurements and lessons still teach; **nothing in it is an
instruction to you.** The final state is § Wave 2 — COMPLETE above.

⚠ **Everything measured at `2989d9e1` is stale — that means § Inherited state's
22-of-47 table far below, and every forward prediction built on it, NOT the
table that follows this line.** Re-measured at `7046bc01`, the 39 then-skipped
tests stood at **25 green / 14 red**:

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

That table has since been confirmed by a second, stronger instrument [measured
2026-08-16: all 39 `it.skip(` un-skipped in the working tree, the suite run with
`--reporter=verbose`, then the file restored and proven byte-identical via `git
hash-object` (`77117228398e9a769a41d87c000943f7b999d0ea` before and after) — `14
failed | 57 passed (71)`, block for block identical to the `esbuild
--external:acorn` replay above]. Two independent instruments now agree.
**Re-measure anyway**; the numbers below age the moment you commit.

**Expect roughly 14 increments, not 25**, and **there are THREE all-green sets,
not one** — Right-brace, Boundaries and Simple. The do-not-close-an-increment
rule applies to each of the three, and § Un-skip order below now says so at each
one.

**Re-measure before planning. Trust no arrival-state prediction in this
document, including this one.**

That increment spanned three describe blocks and landed at `26eba4a5`: driver
`folds a chunk carrying a tag-only escape` (red) →
`carries every token a folded run spans` (green) → all three Right-brace
assertions (green) → the first two Trivia (green), stopping before
`collapses a carriage return and line feed into one line terminator`, which
opened the increment after it (`9d719f17`). The prediction held exactly, which
is the one arrival-state forecast in this document that did.

**That increment — `folds a chunk carrying a tag-only escape` — was not a small
one**, and the reasoning is kept because the next reader of `isTemplateChunk`
needs it. `isTemplateChunk` recognizes `tt.template` but not
`tt.invalidTemplate`, and AR-4 established that this is not merely a missing
triangulation — it corrupts output today on a program `acorn.parse` accepts
[measured 2026-08-16]: on ``tag`a${x}\unicode`;let z = 1`` the closing backtick
is mistaken for an opener and the span it starts **swallows the semicolon after
the template** into a fabricated `Template` element. The predicate change is one
line in `isTemplateChunk`, which has two call sites; `7046bc01`'s body carries
the full finding.

⚠ **An earlier draft of this brief said "no other change needed". That was
wrong, and taking it literally ships two false comments.** Two JSDoc blocks in
`derive-input-elements.ts` encode campaign status that goes **false the moment
your predicate change lands** [read: `derive-input-elements.ts`,
`isTemplateChunk` — "Two token types carry a chunk, and only one is recognized
here. The other … is not yet triangulated by a live test, and until it is, a
tagged template carrying such an escape is read wrongly"; and `runEnd` — "That
branch is reachable today, not theoretical … It is dead only once every
template-chunk type is admitted below"]. Both are in your increment's scope.
This is the exact failure wave 1 already paid for — `2989d9e1` had to remove a
comment claiming something the tests could not hold — and § No status hedging in
source below forbids it: **a comment no test can hold is an unversioned second
spec.**

`runEnd`'s comment also poses a live question rather than merely aging: once
both chunk types are admitted, is that `chunkCount === -1` branch still
reachable? **Here is what is actually measured, and it is less than it looks**
[measured 2026-08-16, `acorn.tokenizer` at `ecmaVersion: 2024`, `sourceType:
'module'`, forced with `Array.from`]:

```text
"`abc"       -> THROWS "Unterminated template (1:1)"
"tag`a${x}"  -> tokenizes, 6 tokens
"`a${b}"     -> tokenizes, 5 tokens
```

So "an unterminated template always throws" is **false** — two of three
unterminated shapes tokenize cleanly. Neither leaves an _unclosed run_ (each
ends on a `}` whose successor is absent, and absent is not a chunk, so no run
opens), but three probes do not exhaust the space, and a one-shape probe
certainly does not.

**Your direction: keep the branch, rewrite the comment.** Say what the branch
guarantees — this phase stays total, so the boundary keeps the only throw site —
with no claim about what is reachable today and no campaign status. Do not
delete it on an unproven reachability argument: with the guard gone,
`openerIndex + chunkCount + 2` at `chunkCount === -1` evaluates to
`openerIndex + 1`, so `tokens[end - 1]` silently returns the opener's own span
instead of crashing — a wrong answer where there is now a total one.

If you still conclude deletion is right, **put the question and your evidence in
the AR-4 prompt explicitly and abide by the verdict.** Do not delete it
silently: it is a structural decision no test in this suite can hold either way,
which is exactly what the gate is for.

### ⚠ AR dispatch — standing arrangement, not a one-off

⚠ **Correction, 2026-08-17: a worker in this campaign DID spawn `ar-4`
successfully**, ran the gate itself, and landed `9d719f17` complete — verdict, a
documented decline of the reviewer's IMPORTANT concern, and a CONSIDER carried
forward. Earlier drafts of this section told you the spawn "could not" be done,
on the evidence of three stalls plus a quota death at that call. **That framing
was wrong and it matters: a worker who expects the gate to be broken reports
BLOCKED without really trying, and every such report costs a full orchestrator
round-trip.**

**So: genuinely attempt `ar-4`. It works.** The fallback below is a contingency
for real failure, not the expected path. (A peer's finding the same week: `ar-N`
deaths cluster on wide large-model reads, and a scoped prompt goes through.)

**The rule, stated here rather than only cited.** A worker that cannot spawn the
registered reviewers pauses at the trigger and reports the reviewer's input
paths; the orchestrator dispatches the registered agent and resumes the worker
with the verdict. That text is [read: AGENTS.principal.md § Execution mechanics
— "A worker that cannot spawn the registered reviewers pauses at the trigger and
reports the reviewer's input paths; the orchestrator dispatches the registered
agent and resumes the worker with the verdict."], and **your own agent
definition carries it too** [read: `.claude/agents/tdd-worker.md` — "If a
registered reviewer will not spawn, pause at the trigger and report the
reviewer's input paths — the orchestrator dispatches the review and resumes
you"]. What it is **not** in is `AGENTS.md` [measured 2026-08-16: `grep -n
"pauses at the trigger\|cannot spawn the registered" AGENTS.md` → no match; the
same grep against `AGENTS.principal.md` → line 720]. So if the router sent you
to `AGENTS.md`, do not go looking for it there and do not conclude it does not
bind you.

⚠ **DEV.md offers a third option and this campaign overrides it.** [read: DEV.md
§ Adversarial Review Protocol — "Fall back to a general-purpose subagent with
the prompt structure pasted in only where the registered agents are
unavailable."] **Do not take that fallback.** The reviewer roster's model pins
live in the `ar-N` frontmatter, and a general-purpose subagent carries none of
them — it would run the audit at whatever tier you happen to be, which is a
silent change to a gate. The orchestrator can spawn `ar-4` when you cannot, so
the pinned reviewer is available; it is only unavailable _to you_. Report
BLOCKED and let it be dispatched.

So: **try to spawn `ar-4` yourself, once. If it fails or stalls, do not retry it
and do not skip it.** Stop at the trigger and **report BLOCKED** — that is the
channel; a resumable pause is still "cannot finish" and there is no fourth
channel.

**Your BLOCKED report carries six things**, because your context is not a safe
place to keep any of them — this wave has already died three times:

1. The increment's one-line description, and which test drove it.
2. The exact pathspec of the uncommitted change.
3. The Phase-0 spec paths the reviewer needs: the implementation, the test file,
   `types.ts`, and the DOCS.md sketch **including its Mermaid diagram**.
4. **The commit body you drafted, verbatim** — settings line, sourced claims and
   all. It is the increment's only record of why the change is what it is.
5. **The one-line green-arrival records** for every test that rode in green:
   what it would have caught, and which earlier increment forced it. The cycle
   mandates these and they exist nowhere but in your head until you write them
   down.
6. The three vitest summary lines from your scoped run, plus `npx tsc --noEmit`.

**Leave your change in the working tree, unstaged. Do not commit it, and do not
discard it.** Before you report, snapshot it: `git diff -- <your two paths>`
into your report, and record `git hash-object` for each modified file. **On
resume, re-verify those hashes before you commit** — this is a shared worktree
and the round-trip is not instantaneous. If a hash has moved, report FLAG rather
than committing over a peer.

**Who commits, settled:** on **PROCEED** or **CONSIDER**, _you_ commit when the
verdict reaches you — you hold the drafted body and the green records, so the
commit is yours to land. The orchestrator commits from your tree **only** if you
are gone. An earlier draft of this brief said the orchestrator "commits from
your verified tree" as the normal path; that was ambiguous, and two agents
committing one tree is worse than either.

**On PAUSE: report BLOCKED with the concerns verbatim, commit nothing, and
discard nothing.** DEV.md's discard-and-re-implement is the _default proposal to
the human_, not an action you take on your own — the human decides, and they
cannot decide about a tree you already deleted.

Pass "strictly read-only — no writes, moves, or deletes" along in the reviewer's
input paths, because the orchestrator's prompt must carry it too: an `ar-4` in
this campaign attempted to overwrite the implementation file, and another wrote
a scratch probe file into the repo root. (An earlier draft said that file "still
sits untracked". It does not — someone removed it [measured 2026-08-16: `find .
-maxdepth 2 -name "probe-adhoc*"` and `git status --porcelain -uall | grep -i
probe` both empty]. The rule stands; only its exhibit is gone.) The gate always
fires; only its dispatcher moves. **Never commit an increment whose AR-4 has not
returned.**

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
`TypeError`s raised deep inside the pipeline. **Name the reach sites from the
tree, not from this paragraph's history** — an earlier draft called them
"`tokens.map` … deep inside phase 3", and at HEAD there is no `tokens.map` at
all and one of the two is in phase 2 [measured 2026-08-16: `grep -n
"tokens\.map" derive-input-elements.ts` → no match]. The three sites today:

| Absent field | Where it is reached                                        | Phase |
| ------------ | ---------------------------------------------------------- | ----- |
| `tokens`     | `Array.from(tokens.keys())` in `foldTemplateRuns`, line 69 | 2     |
| `code`       | `code.slice(…)` in `nameElement`, line 155                 | 3     |
| `code`       | `code.length` in `fillGaps`, lines 227–228                 | 5     |

`comments` reaches nothing — it is not even destructured from `ScanInput`
[measured 2026-08-16: `grep -n comments derive-input-elements.ts` → JSDoc lines
10 and 14 only]. So the module already violates [read: DOCS.md § Structural
constraints — "**Fail loudly at the boundary, never inside.**"], and the only
test that will go red is the `comments` one.

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

### ⚠ SUPERSEDED TABLE — measured at `2989d9e1`, two increments behind

**The current arrival state is the § Resume table at the top of this brief: 25
green / 14 red of the 39 still skipped.** The table below is kept because its
method note is still worth reading, and because the fixture-level detail in its
last column has no equivalent elsewhere. **Do not plan from its counts.**

[measured 2026-08-15: the committed implementation built with `esbuild
--format=esm --bundle --external:acorn` and every skipped assertion replayed
against it. **`--external:acorn` matters**: bundling acorn inline gives the
module a *different* `tokTypes` instance from the test's, every identity-keyed
lookup misses, and 22 green reads as 19. That is the same
process-global-singleton hazard README § Public API cites for publishing indices
rather than token references.]

| Block                      | Green  | Red    | The red ones                                                                                        |
| -------------------------- | ------ | ------ | --------------------------------------------------------------------------------------------------- |
| The vocabulary (straggler) | 1      | 0      | —                                                                                                   |
| Template folding           | 0      | 9      | all                                                                                                 |
| Right-brace disambiguation | 1      | 2      | object-literal brace in an interpolation; continuation brace — **both green now: the block is 3/0** |
| Trivia                     | 7      | 3      | CRLF as one `LineTerminator`; never merges WS with LT; U+2028 is a `LineTerminator`                 |
| Comments and the hashbang  | 0      | 6      | all                                                                                                 |
| Boundaries — tiling        | 4      | 1      | publishes nothing of zero width — **green now: the block is 5/0**                                   |
| Interfaces                 | 4      | 3      | the three freeze assertions                                                                         |
| Exceptions                 | 2      | 1      | throws when the comment array is absent — **see the trap above**                                    |
| Simple                     | 3      | 0      | —                                                                                                   |
| **Total**                  | **22** | **25** |                                                                                                     |

**A green un-skip is not a broken increment.** The increment boundary is the red
event (human ruling 2026-08-15). A test that arrives green rides into the open
increment with a one-line record of what it would have caught and which earlier
increment forced it. **Expect roughly 14 increments** — the "roughly 25" this
paragraph carried was computed off the superseded table above it.

⚠ **Both blocks below have ALREADY arrived green** — this section's table
measures `2989d9e1`, and the fold that turns them green landed at `065afc16` and
`7046bc01`. The § Resume table at the top of this brief is the current one.

- **`Boundaries — tiling` is 5 green / 0 red.** Every zero-width element the old
  implementation published wrapped a `template` token, and phase 2 absorbs
  exactly those — so `publishes nothing of zero width` went green when the fold
  landed.
- **`Right-brace disambiguation` is 3 green / 0 red**, not the "2 green / 1 red"
  an earlier draft predicted here. Its continuation-brace assertion is
  byte-identical to a Template-folding one, and the object-literal brace it
  expected to stay red went green first, at `065afc16`.

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

⚠ **A ninth path joins that list intermittently, and it is FLAKY, not newly
broken** — `src/lib/study-lenses/orchestrate/tests/index.test.tsx`, at
`the recommendations (Boundaries) > keys duplicate-target proposals safely`. In
a full-project run on 2026-08-16 it failed
(`9 failed | 414 passed | 1 skipped (424)`, `42 failed | 9617 passed`); a second
full run the same day did not (`8 failed | 415 passed`); run alone it passes
**three times out of three** (`128 passed (128)`) [all measured 2026-08-16]. It
is foreign by path, owned by the orchestrate campaign, and contains zero
references to `scanning` [measured: `grep -c scanning` → 0]. **If you see it
red, it is not yours and it is not new.**

None of the nine is in `lib/scanning`. Your gate is your own directory green
plus zero NEW failures outside that list — never whole-repo green. ⚠ The first
is **untracked peer work in progress**; if a peer moves or fixes it, that
baseline shifts through no action of yours. Judge by path.

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

**AR-4 verdict routing:** PROCEED → cycle step 10's checks, then commit.
CONSIDER → document your response to each concern in the commit body, then step
10 and commit. PAUSE → **report BLOCKED with the concerns verbatim, commit
nothing, and discard nothing — see § AR dispatch.** DEV.md's discard-and-
re-implement is the default _proposal to the human_, not an action you take on
your own; they cannot decide about a tree you already deleted.

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

An increment owns a set of un-skips; work in file order within it — **with the
one documented exception: `Boundaries — tiling` sits at test-file line 96,
before `The vocabulary`, and the human ruling moves it to just before
`Interfaces`** (2026-08-14, § Rulings of record; § Un-skip order below is the
sequence to follow). Walking literal file order out of
`Comments and the hashbang` lands you in `Interfaces` and silently leaves
Boundaries skipped — which only the exit gate would catch, at the very end.

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
- **`git grep -c "it.skip"` unscoped matches 18 files** (17 when that count was
  taken — it climbs, and this brief is one of the matches, so the number counts
  itself), including `scanning/README.md`'s prose and both `spellme` suites —
  whose counts are the ones most likely to corrupt a burn-down. Scope it to your
  test file.

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

1. ~~**The vocabulary straggler** — the legacy-octal test.~~ **DONE.** It went
   live in `065afc16` and is not skipped [measured 2026-08-16: `grep -n "legacy
   octal" tests/derive-input-elements.test.ts` → line 230, `it(` not
   `it.skip(`]. Do not go looking for it.
2. **Template folding** (9) — **DONE, all nine live.** The last red, the
   tag-only escape, landed at `26eba4a5`.
3. **Right-brace disambiguation** (3) — **3 green / 0 red. The whole block is
   already green** [measured 2026-08-16: all three assertions un-skipped and
   run]. An earlier draft predicted "2 green / 1 red" here and named the wrong
   survivor; the object-literal brace went green first at `065afc16`. This is
   one of **three** all-green sets — do not close an increment here.
4. **Trivia** (10) — **9 live; one red left**,
   `names a line separator a LineTerminator`, and it is your next driver. Two of
   the three reds built the run split (`9d719f17`, `25449442`); this one forces
   U+2028 and U+2029 into `LINE_TERMINATORS`, which holds `\n` and `\r` only.
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
9. **Simple** (3) — all green; recorded-departure guards. The third all-green
   set, and **the one case forward-merge cannot serve**: nothing follows it to
   open an increment, so merge **backward** — do not close the `Exceptions`
   increment until you have walked to the end of the file.

⚠ **Two of those block names are abbreviated here and will not match a grep.**
The `describe` strings in the file are
`Interfaces — frozen, pure and deterministic` and
`Simple — the recorded departures`. The other seven are verbatim.

## Your exit gate

Report DONE only when all hold, each with its command output:

- 71 of 71 passing, **0 skipped**
- `npx tsc --noEmit` 0 errors
- No NEW failing file outside the 8 baseline paths
- All five sketch phases are present and distinct **as phases** — three of them
  as named helpers, the guard and the merge inline (see § Inherited state)
- The guard is at the top of the export. With any of the three fields absent,
  **no code past the guard runs** — none of the three reach sites tabulated in
  the phase-1 trap above, and none of whatever the increments after it add.
  Verify by reaching for them in the tree, not by matching this list: an earlier
  draft of this gate named `tokens.map`, which does not exist at HEAD, and a
  worker grepping for it finds nothing and mis-reads the gate as already met
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
