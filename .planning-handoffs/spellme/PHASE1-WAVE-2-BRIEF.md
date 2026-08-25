<!-- cspell:ignore spellme tdd worktrees wireframes -->

# `tdd-worker` launch brief — the `spellme` LENS, Phase 1, Wave 2

⚠ **Read this paragraph before anything else.** Two files sit beside this one
with confusingly similar names — `./WAVE-1-BRIEF.md` and `./WAVE-2-BRIEF.md`.
**They are `lib/scanning`'s waves, they are CLOSED, and they are not yours.**
This brief is for a **different module**: the `spellme` lens at
`src/lib/study-lenses/lenses/spellme/`. Your predecessor is
[`./PHASE1-WAVE-1-BRIEF.md`](./PHASE1-WAVE-1-BRIEF.md), which is closed and
whose clusters are green.

**Scope: `readStream` and `positionCursor` — the spine and the cursor. SEVENTEEN
un-skips in `tests/core.test.ts`**, plus the precondition-throw test in
`tests/core-defect.test.ts`, which is now **ruled and yours to write** (human
ruling 2026-08-25 — see § The precondition throw). It said FIFTEEN and "one
question you carry forward as a FLAG" until 2026-08-25; two tests were added and
the question was answered.

**39 of the 56 core tests route through `readStream`** via `core.test.ts`'s
`streamOf` helper [measured 2026-08-25], so nothing downstream can go green
until your work is committed. That is why you run alone. (It read "37 of the 54"
until `4d3e97a6` added two tests, both of which route through `streamOf`.)

## The wave map — spellme's `core.ts`, all five waves

⚠ **Re-ordered by human ruling 2026-08-20**, after measurement showed only **5**
of the 28 component tests drive the claim loop — the other 23 are static and
need only `config`, `readStream` and `positionCursor`. So `positionCursor` moves
forward into your wave, and **the surface arrives one wave later instead of
three**, which is what makes an eyeball check possible after 17 core tests
rather than 39.

| Wave          | Cluster                                                             | State                                            |
| ------------- | ------------------------------------------------------------------- | ------------------------------------------------ |
| 1             | `config` · `applicability` · `recommend`                            | **CLOSED** 2026-08-20                            |
| **2 — YOURS** | `readStream` · `positionCursor`                                     | this brief — **17** un-skips + 1 new test        |
| 3             | the **static surface** (23 component tests) + the sandbox injection | 🔍 the eyeball check; orchestrator, not a worker |
| 4             | `judgeClaim` · `handOver` · `settle`                                | the claim loop, 22 core tests                    |
| 5             | the 5 claim-loop component tests                                    | orchestrator                                     |

**Wave 3 depends on you for both functions.** The static surface renders the
tapes and the jar from your stream, and reads `data-cursor` off your
`positionCursor`. Ship them coherent.

## First act — governance, before anything else

Read the repo-root `CLAUDE.md` router. Check your own model id against its
qualifying list and read whichever governance file it selects, **END TO END**.
Then `DEV.md` § Incremental Development Workflow (**including Phase 1 step 7b,
patch-or-reroll, and step 14** — this brief's § Your cycle compresses them, and
compression is not permission to skip), § Adversarial Review Protocol, §
Shared-worktree git mechanics, § Sourced claims, § No Comments in Tests.

Router-text reach into a spawned worker has been measured both present
(2026-07-29) and absent (2026-07-28); the explicit read is the contract.

## Then read the module canon, end to end, never in split ranges

⚠ **Path anchors, because this list mixes three of them.** Paths starting
`lenses/spellme/` are relative to **`src/lib/study-lenses/`**. Paths starting
`../../` are relative to **the spellme module directory**
(`src/lib/study-lenses/lenses/spellme/`), so `../../lib/scanning/` is
`src/lib/study-lenses/lib/scanning/`. Everything else is repo-root relative.

- `lenses/spellme/README.md` — **§ The three fates, and the mark is yours.**
  Also § Glossary (_the fates_, _mark_, _the stream_, _the tapes_) and § Edge
  cases.
- `lenses/spellme/DOCS.md` — **your Refactor step is held against § Execution
  phases 3 AND 4** — phase 3 is `readStream`, phase 4 is `positionCursor` — plus
  the `Seq --> Stream` edge of the Mermaid `## Data flow`. (This said "phases 3"
  alone until 2026-08-25.)
- `lenses/spellme/types.ts` — `StreamElement`, `Fate`, and the `marked`
  contract.
- `lenses/spellme/core.ts` — the file you edit. `readStream` is yours; the three
  wave-1 functions above it are **done and green — do not touch them**.
- `lenses/spellme/tests/core.test.ts` — read the whole file, not only your
  blocks.
- `lenses/spellme/tests/core-defect.test.ts` — two passing tests, and the home
  of the precondition-throw test that **is now yours to write**. See § The
  precondition throw. (This said "the extra test you may not yet write" and
  pointed at a FLAG section until 2026-08-25, when the ruling was taken.)
- `lenses/spellme/ux/user-journeys.md` and `ux/wireframes.md` — **the twin is
  TWO files** and `twin-doc: user` makes both canon. Wave 1 edited one and
  called the twin done; that shipped a definition contradicting a ruling.
- `../../lib/scanning/README.md` — the **kind table**. You consume its
  vocabulary; you never call it.
- [`./PHASE-1.md`](./PHASE-1.md) — §§ **The `spellme` LENS — Phase 1, wave 1**,
  **The `spellme` LENS's rulings**, **Traps**, and **Deferred, and recorded
  elsewhere**. ⚠ Everything above the first of those belongs to `lib/scanning`.
  The `Object.isFrozen(undefined)` trap is in **§ Deferred**, not § Traps — the
  wave-1 brief mis-cited it and the mis-citation is not repeated here.

## Measured baselines — the debt that is NOT yours

⚠ **Every row below was re-measured 2026-08-25**, at the launch that follows it
— not "at brief time", which is the label that licensed the previous staleness.
**HEAD and `unpushed` move within minutes and are deliberately NOT pinned**:
during the 2026-08-25 launch preparation HEAD moved five times and `unpushed`
went 6 → 30 within the hour, all of it peer `quizzing` work. Run the commands.

| Fact                 | Value                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| HEAD at LAUNCH time  | **Deliberately not pinned — run `git rev-parse HEAD`.** It moved five times during this launch preparation    |
| spellme working tree | **clean** [measured: `git status --porcelain -- src/lib/study-lenses/lenses/spellme/` → empty]                |
| spellme suite        | `22 passed \| 67 skipped (89)` across three files [measured: `npx vitest run --project unit …/spellme`]       |
| remaining skips      | `core.test.ts` **39**, `component.test.tsx` **28** [measured: `git grep -cF "it.skip("`]                      |
| `npx tsc --noEmit`   | **0 errors** [measured 2026-08-25]                                                                            |
| Node                 | **v20.11.0 against engines `>=22.11.0` — BELOW the minimum.** Both tools run anyway. Proceed; upgrade nothing |
| unpushed             | **Not pinned — run `git rev-list --count origin/main..HEAD`.** It was 30 and climbing. Not yours. Never push  |

⚠ **The `unpushed` row said `343 and climbing` until 2026-08-25, and the human
has since pushed.** A worker who reads a number three hundred off from what it
measures will correctly distrust every other row in this table, so the
correction is dated rather than silent.

**Failing-test baseline — repo-wide, all foreign.** **EIGHT** test files fail at
HEAD — `Test Files 8 failed | 453 passed (461)`,
`Tests 41 failed | 10296 passed | 135 skipped | 17 todo (10489)` [measured
2026-08-25: `npx vitest run --project unit`]. The **eight paths are unchanged**
from 2026-08-20; only the pass total moved, and it moved because peer `quizzing`
work landed. **Seven of the eight fail at COLLECTION** (`0 test`,
`loadAndTransform`) rather than on an assertion — all 41 failing tests live in
`remark-study-lenses.test.ts` alone [measured 2026-08-25: the eight paths run
directly]. That matters to you: a collection failure looks different from an
assertion failure, and **seven** of these will never print a test name. (This
said "six" for a few hours on 2026-08-25, contradicting the "seven" two
sentences above it — the exact count-disagrees-with-itself defect that exit-gate
item 3 was rewritten to prevent, reintroduced by the round that rewrote it.)

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

Identical to wave 1's list. ⚠
**`src/lib/study-lenses/orchestrate/tests/index.test.tsx` is a KNOWN FLAKE, not
a ninth entry.** It failed once under full-suite parallelism and passes **128 of
128 in isolation, three runs out of three** [measured 2026-08-20]. An earlier
draft of this brief listed it as a ninth path and called it "a peer's
regression"; that was one full-suite run mistaken for a finding. **If you see it
fail, it is not yours and it is not new** — re-run it alone before reporting
anything. **Re-measure this whole list before you start; it moves.**

**Your gate is your own directory green plus zero NEW failures outside that
list** — never whole-repo green:

```text
npx vitest run --project unit src/lib/study-lenses/lenses/spellme
```

## Commit form — verbatim, non-negotiable

```text
git add <your explicit paths>
git diff --staged --name-only
git commit --no-verify -m "..." -- <the same paths>
```

- One shell invocation, so a peer's `git add` cannot interleave. **The pathspec
  is the protection, not a clean index** — peers hold files staged continuously,
  and a pathspec-less `git commit` is **denied by a hook**.
- `--no-verify` because lint-staged spans the whole staged set. **What it costs
  you is prettier** — run it yourself, § Your cycle step 4.
- On `index.lock` contention, wait and retry.
- **Never push, never branch, never amend, never `git checkout -- <file>`, never
  `git stash`.**
- **Announce each commit as it lands: full SHA + message.**

**Your three allowed paths:**

```text
src/lib/study-lenses/lenses/spellme/core.ts
src/lib/study-lenses/lenses/spellme/tests/core.test.ts
src/lib/study-lenses/lenses/spellme/tests/core-defect.test.ts
```

`README.md`, `DOCS.md`, `types.ts` and `ux/**` are the Phase-0 contract and are
**never yours** — a need for one is a **FLAG**. `tests/core-defect.test.ts` was
conditional on a ruling until 2026-08-25; **that ruling has been taken** and the
path is yours — see § The precondition throw. (This line pointed at "§ The one
question you must ask", a heading that never existed.)

**Commit granularity: one commit per increment, i.e. per red event.** Tests
arriving green fold into the open increment with a one-line record each.

**Settings line in every commit body, verbatim:**

```text
work: software · twin-doc: user · ceremony: full (AR-3 opted out by human, 2026-08-14) · prospective
```

⚠ DEV.md's example shows `ceremony: full (AR-3 n/a)`. **Ours deliberately
differs** — an opt-out is not an n/a. Do not "correct" it toward DEV.md.

Every repo-state claim carries `[measured: <command>]`,
`[read: <file> § <heading> — "<quoted>"]` or `[relayed: <who>]`. **A bare
`[measured: <date>]` with no command is not admissible** — that defect has now
shipped three times in this campaign. Measure in the same turn you write the
body; it is immutable.

## Ceremony — the human's, not yours

`ceremony: full` (human, 2026-08-14, re-confirmed 2026-08-20).

- **AR-3 is opted out for un-skips.** Do not spawn `ar-3`. **You may not extend
  the opt-out to AR-4.**
- **`ar-4` fires per increment**, after self-review, before commit. Spawn the
  registered `ar-4` **by name**; it has been measured working from a worker
  context. Provide it: `core.ts`, `core.test.ts`,
  **`tests/core-defect.test.ts`** (added 2026-08-25 — it is now an allowed path
  and carries increment 0's driver, so a reviewer without it is blind to the
  test driving the throw), `types.ts`, the peer `DOCS.md` including its Mermaid
  diagram, and `../../lib/scanning/types.ts`. **Paths, never pasted contents.**
- ⛔ **Every review prompt must forbid `git stash` BY NAME**, alongside a
  general read-only mandate and an allow-list. In wave 1 an `ar-4` carrying a
  general "strictly read-only" instruction ran `git stash` / `git stash pop` and
  **destroyed a peer session's staged index**. A general prohibition
  demonstrably does not reach it; a hardened prompt naming it was then used for
  three consecutive reviews and none touched repository state.
- If `ar-4` will not spawn, take `tdd-worker.md`'s fallback: pause and report
  the reviewer's input paths. **Never commit an increment whose `ar-4` has not
  returned.**
- **`ar-5` is the orchestrator's. Do not spawn it.**
- **Never pass a `model` parameter** to a reviewer.
- **No 🔍 sandbox checkpoint in this wave**, declared explicitly: `readStream`
  **both of your functions are pure** with no user-observable surface. The
  component tests begin at **wave 3**, not wave 5 — see the wave map. (This said
  "`readStream` is a pure function" and "the component is wave 5's" until
  2026-08-25; the re-order had walked past both.)
- PROCEED → commit. CONSIDER → answer each concern in the commit body. PAUSE →
  **report BLOCKED with the reviewer's concerns verbatim.**

## Your cycle

**An increment contains exactly one red test** (human ruling 2026-08-15).

1. Un-skip **one** test — delete the five characters `.skip`.
2. Run the scoped suite. Red → implement. **Green on arrival** → it rides into
   the open increment with a one-line record; do not open a new increment.
3. Implement. **Fake It only where its killer is the very next un-skip.**
4. **Format then lint, in this order:** `npx prettier --write <file>`, then
   `npx eslint <file>`, then `npx cspell <file>`.
5. Refactor against `DOCS.md` § Execution phases **3 and 4** — phase 3 is
   `readStream`, phase 4 is `positionCursor`. ⚠ This line named phase 3 only
   until 2026-08-25: `23f4555b` moved `positionCursor` into this wave and
   updated five sites, walking past this one and exit gate item 6, so the
   function arrived with no Refactor target and no structural exit criterion.
6. Self-review against the governance file's two checklists.
7. Spawn `ar-4` (with the hardened read-only prompt).
8. Quality checks: scoped suite, `npx tsc --noEmit`, `npx prettier --check`.
9. Commit by pathspec. Announce the full SHA.

⚠ **DEV.md Phase 1 step 14 (reconcile the docs) has no worker-executable form
here, and this compressed cycle drops it deliberately.** `README.md`, `DOCS.md`
and `types.ts` are FLAG-only for you, so **step 14 is a READ and a FLAG on
divergence — never an edit.** Named explicitly because the alternative is a
worker that either silently skips a governance-named step or attempts a
forbidden write.

## The contract you are implementing

`readStream(facts: Facts): ReadonlyArray<StreamElement>` — read the sequence
published at `facts.tokens.value.inputElements` and give each element **its
fate** and **its mark**. **Derive no element. Call nothing.** The leaf owns the
derivation, embody publishes it, you read the member.

**The fate** is a function of the element kind alone. Three fates over fourteen
kinds — the ten claimable kinds go to `token-tape`; `Comment` and
`HashbangComment` go to `set-aside`; `WhiteSpace` and `LineTerminator` are
`consumed`.

**The mark** is **not** a function of kind alone (human ruling 2026-08-20). It
says **the syntactic grammar reads a line break here**. A `LineTerminator`
carries it **by its kind**; a `Comment` carries it **only if its own text
contains a terminator**. Everything else is unmarked.

**The precondition throw.** Applicability has already guaranteed the member is
present, but that narrowing does not cross the function boundary and `!` is
barred, so **both narrowing checks are re-made and a failure throws**. **Never
an absent-member arm** — a branch that _handles_ absence is a dead branch no
test can reach. `core.ts`'s `readStream` JSDoc and `DOCS.md` § Structural
constraints both state this.

### And `positionCursor`

`positionCursor(stream, from): number` — advance past every element that
advances on its own, so the cursor comes to rest **on a claimable element or
past the end of the stream**. `DOCS.md` § Execution phases 4: it runs at mount
and again after every fall, and **it is the only writer of the cursor**.

⚠ **Key it on the element KIND, not on the fate.** The two predicates are
extensionally equal — the ten claimable kinds are exactly the `token-tape` ones
— but your un-skip order reaches `:34` **before** `:44` forces any fate to be
real, so a fate-keyed implementation would be reading a value nothing has pinned
yet. Kind is the honest key at that moment and stays correct afterwards.

⚠ **Waves 4 and 5 must call this rather than doing arithmetic, and no test
forces them to.** `settle`'s and `handOver`'s assertions are
`toBeGreaterThan(0)` and their fixture `'a+++b'` has **no trivia at all**, so a
bare `cursor + 1` would pass everything and leave the cursor resting on
whitespace. You cannot fix that from here — make this function obviously the one
writer, and say so in your handover.

## The precondition throw — RULED, and yours to write

(human ruling 2026-08-25) **`readStream` throws `TypeError`.** This section
previously told you the class was unsettled and to carry it forward as a FLAG;
the orchestrator put it to the human before this launch, so it is settled and
the FLAG is discharged. **`tests/core-defect.test.ts` is now your third allowed
path.**

**The grounds, recorded so a later session need not re-derive them.** The
scanning leaf's own precondition throw for an **absence** is a `TypeError`
[read: `../../src/lib/study-lenses/lib/scanning/derive-input-elements.ts`, the
guard above `foldTemplateRuns` — "Presence is the whole check", and "the caller
gates on a successful tokens stage first, so an absence here is its bug to
surface rather than a state to absorb"]. `readStream`'s own JSDoc already
asserts its throw is "exactly the precondition the scanning leaf states for its
own inputs", so two classes for one precondition in adjacent modules would be an
incoherence. An `ar-5` had separately argued `RangeError` is **affirmatively
wrong** here: by the 2026-08-20 ruling's own distinction, an absent member is a
wrong-**kind** case, not a right-kind-wrong-**value** one.

⚠ **This does NOT disturb `config`.** `config` keeps `RangeError` — a threshold
out of range is exactly the wrong-value case — and the three committed
`Exceptions` tests stay as they are. The 2026-08-20 ruling was put as a question
about `readStream` but `ed76f43b`'s body recorded only the `config` half; this
reverses the `readStream` half only.

### Where it sits in the order — it is INCREMENT 0, before row 1

**Write it first, before un-skipping row 1.** A cold read on 2026-08-25 found
this genuinely ambiguous — the test is an eighteenth item that is _authored_
rather than _un-skipped_, and § Un-skip order's "plain file order" says nothing
about it. Two workers would have produced two different commit structures, and
exit-gate item 5 (`git show` your first commit) would be checking a commit whose
contents were undefined. So it is settled here:

- **It is a real red.** The stub throws
  `new Error('spellme readStream: not implemented')`, and `Error` is **not** an
  instance of `TypeError`, so `.toThrow(TypeError)` fails against it. You get a
  genuine red-then-green cycle, not a vacuous pass.
- **Increment 0 lands the guard and the throw.** The two narrowing re-checks and
  the `TypeError` are its implementation.
- **Row 1 (`:30`) then adds only the `.map()`** — which is why its sanctioned
  placeholder callback is safe: an empty source never runs it.

That splits what § Un-skip order's row-1 bullet describes as one step ("the
guard, the throw, and a `.map()`") across two commits, deliberately. **Follow
this section where the two differ.**

**What you owe, in this wave:**

1. **Add `@throws TypeError` to `readStream`'s JSDoc** — it currently carries no
   `@throws` tag at all. Do this **before** writing the assertion, so the
   contract exists before the test that pins it.
2. **Write the test in `tests/core-defect.test.ts`**, which already mocks the
   leaf and constructs the member-absent state. ⚠ **A bare `.toThrow()` passes
   vacuously** against the stub's own "not implemented" throw — assert the
   class: `.toThrow(TypeError)`.
3. ⚠ **And do not reach for a message regex instead.** `.toThrow(/regex/)` does
   **not** check the error class at all — it matches the message only, so it
   would pass against the stub's own `Error`. The class form is the one that
   discriminates. `core-defect.test.ts` is strict **one assertion per `it`** and
   carries **no comments in tests** — match it; do not add a second assertion to
   the same `it` to cover both.

## Un-skip order — exactly this, and nothing else

**Plain FILE ORDER, and there are SEVENTEEN.** That is every `it.skip` in
`Zero`, `One`, `Many` and `The three fates, and the mark`, with **no exceptions
and nothing left behind**.

⚠ **Take them by NAME. The line numbers below are secondary and were already
wrong once.** `4d3e97a6` inserted two tests on 2026-08-25 and **ELEVEN of the
original fifteen line numbers shifted** — only the first four held. This list
said `:50` for what is now `:54`, and `:64` for what is now `:72`. Names are
stable; line numbers are not. Re-derive them yourself before you start:
`grep -n "it.skip(" tests/core.test.ts | head -20`.

⚠ **That count said "eight" until a cold read re-derived it as eleven [measured
2026-08-25: the fifteen original names looked up by name in the amended file — 4
held their line, 11 moved].** The wrong number also went into `132bdad3`'s
commit body, where it is **immutable and cannot be corrected**; this line is its
correction. It changes nothing operationally — "take them by name" is right
under either count — but a measured-sounding number that does not reproduce is
exactly what this campaign has bled on.

| #   | Line   | Test name                                                                    |
| --- | ------ | ---------------------------------------------------------------------------- |
| 1   | `:30`  | reads an empty stream from an empty program                                  |
| 2   | `:34`  | positions the cursor past the end of a program with nothing claimable        |
| 3   | `:40`  | reads one element from a one-element program                                 |
| 4   | `:44`  | gives a claimable element the token-tape fate                                |
| 5   | `:48`  | **leaves the cursor where it rests when the element is already claimable**   |
| 6   | `:54`  | reads every element of a short declaration                                   |
| 7   | `:58`  | rests the cursor on the first claimable element                              |
| 8   | `:62`  | advances the cursor past a run of trivia between claimable elements          |
| 9   | `:66`  | **advances the cursor past a mixed run of whitespace and a line terminator** |
| 10  | `:72`  | sends a comment to the jar                                                   |
| 11  | `:76`  | sends a hashbang to the jar                                                  |
| 12  | `:80`  | evaporates whitespace                                                        |
| 13  | `:84`  | evaporates a line terminator                                                 |
| 14  | `:88`  | marks a block comment carrying a line terminator                             |
| 15  | `:92`  | leaves a block comment without a line terminator unmarked                    |
| 16  | `:96`  | leaves a line comment unmarked                                               |
| 17  | `:100` | leaves a hashbang unmarked                                                   |

**Rows 5 and 9 are the two added on 2026-08-25** (human ruling 2026-08-25,
landed in `4d3e97a6`) and they are the whole reason `positionCursor` is honestly
testable. Before them, **two wrong implementations passed the entire module**:
`return from + 1`, and the subtler `isClaimable(stream[from]) ? from : from + 1`
— advance exactly one element — which also passed wave 3's `data-cursor` test
and wave 4's `toBeGreaterThan(0)` assertions. Row 9 is the only test in the
campaign that kills the second one; no other fixture anywhere in the module
contains a **mixed** trivia run.

- ⛔ **`:30` — Fake It is DECLINED here, and this is the one place the brief
  overrides the usual permission.** `streamOf('')` → `[]` would pass under
  `return []`, but the very next un-skip is `:34`
  (`positionCursor(streamOf('  '), 0)` → `1`) and under that fake
  `streamOf('  ')` is `[]`, so an honest `positionCursor([], 0)` returns `0`,
  not `1`. The fake forces you either to hardcode `return 1` or to build
  `readStream` outside its own increment. **Implement the real read-and-map at
  `:30`** — the guard, the throw, and a `.map()` whose callback may still return
  a placeholder fate and mark, since an empty source never runs it.
- **Row 2** (_positions the cursor past the end…_) — the cursor's first test.
  Key on **kind** (see above); no fate is real yet.
- **Rows 3–4** — `One`. Row 3 forces the mapper to actually run; row 4 forces
  the first real fate.
- **Row 5** (_leaves the cursor where it rests…_) — the identity case:
  `positionCursor(streamOf('x'), 0)` → **`0`**, not `1`. The cursor already
  rests on a claimable element, so it does not move. This is the first test that
  forbids an unconditional advance.
- **Rows 6–9** — `Many`. `'const x = 1'` → **7** elements; the cursor resting on
  the first claimable element; advancing past a run of trivia; and then row 9,
  `positionCursor(streamOf('a \n b'), 1)` → **`4`**. Row 9 is the one that
  forces a **loop**: `'a \n b'` is five elements —
  `[IdentifierName, WhiteSpace, LineTerminator, WhiteSpace, IdentifierName]` —
  because the leaf never merges whitespace with a line terminator, so the cursor
  must cross **three** advancing elements in one call. A single step lands on
  `2` and is wrong.
- **Rows 10–17** — the fates and the mark, eight tests. This is where traps 1
  and 2 bite.

⚠ **Exit gate item 5's "no Fake It" governs `readStream`'s RETURN VALUE** — a
surviving `return []`. It does **not** bar the `.map()` callback placeholder
that row 1 explicitly sanctions above; that placeholder is expected to live
across rows 1–3 and dies at row 4. Stating the scope because the two lines read
as contradictory otherwise, and a previous draft of this brief shipped exactly
that contradiction.

⛔ **Everything else stays skipped** — the `Verdicts`, one-more, gate and
way-past blocks are wave 4's, and all 28 in `component.test.tsx` are waves 3 and
5's.

## Ground truth — ALL TEN FIXTURES, MEASURED

⚠ **This section previously said "measure the leaf's actual output for each
before implementing" and left seven fixtures to you. That instruction was not
executable** and a cold read caught it on 2026-08-25: `streamOf` calls
`readStream`, which is the unimplemented thing, so the measurement is circular;
`core-defect.test.ts` is `vi.mock`-poisoned throughout; and a scratch harness
would need a fourth path in a shared worktree that the environment cannot then
delete. **So the orchestrator measured all ten and pasted them here.**

Every row below is `[kind, start, end, text]` in sequence order [measured
2026-08-25: a temporary probe reading
`embody(src).facts.tokens.value.inputElements` directly, run inside the spellme
suite and reverted byte-identically — `git status --porcelain` on the module was
empty afterwards]:

```text
""                       => []
"x"                      => [IdentifierName 0-1 "x"]
"// hi"                  => [Comment 0-5 "// hi"]
"a b"                    => [IdentifierName 0-1, WhiteSpace 1-2, IdentifierName 2-3]
"a\nb"                   => [IdentifierName 0-1, LineTerminator 1-2 "\n", IdentifierName 2-3]
"/* a\nb */"             => [Comment 0-9 "/* a\nb */"]
"/* ab */"               => [Comment 0-8 "/* ab */"]
"a \n b"                 => [IdentifierName 0-1, WhiteSpace 1-2, LineTerminator 2-3, WhiteSpace 3-4, IdentifierName 4-5]
"#!/usr/bin/env node\nx" => [HashbangComment 0-19, LineTerminator 19-20, IdentifierName 20-21]
"const x = 1"            => [IdentifierName 0-5 "const", WhiteSpace 5-6, IdentifierName 6-7 "x",
                             WhiteSpace 7-8, Punctuator 8-9 "=", WhiteSpace 9-10, NumericLiteral 10-11 "1"]
```

**What these settle, so you do not have to re-derive them:**

- **The hashbang EXCLUDES its terminator** — `[0,19)`, with the `LineTerminator`
  a separate element. That is why row 17's `marked === false` holds naturally.
  This was `[relayed:]` until 2026-08-25 and is now measured.
- **`'a \n b'` is FIVE elements**, so row 9's cursor must cross **three**
  advancing elements in one call and land on `4`. A single step lands on `2`.
- **`'const x = 1'` is SEVEN elements**, matching row 6's assertion.
- **Both block-comment fixtures are a single `Comment`.** `'/* a\nb */'`'s text
  contains `\n` (marked), `'/* ab */'`'s does not (unmarked) — the mark turns on
  the **text** for a `Comment`, and on the **kind** for a `LineTerminator`.

**Still re-measure before you rely on any of it.** The leaf is a peer's module
and this table is a snapshot, not a contract.

## Traps, each of which has already cost something

1. **THE ONE THE SUITE CANNOT DEFEND: the mark predicate must gate on KIND, not
   on text alone.** `element.text` containing a terminator is **necessary and
   not sufficient** — a `StringLiteral` or a `Template` can contain a real
   newline and must stay **unmarked**. No fixture in this wave contains one, so
   a text-only predicate **passes all seventeen tests** and ships a defect wave
   4 inherits. The contract is: `LineTerminator` → marked **by its kind**;
   `Comment` → marked **only if its own text carries a terminator**; everything
   else → unmarked, whatever its text says.
2. **And it must cover FOUR line terminators.** Row 14 / `:88` (_marks a block
   comment carrying a line terminator_) uses `\n` only; the leaf's kind table
   names **LF, CR, U+2028 and U+2029**. `text.includes('\n')` passes the whole
   suite and is **wrong**. Traps 1 and 2 are two halves of one predicate —
   getting either alone still leaves it broken.
3. **Only ONE of the ten CLAIMABLE kinds has its fate asserted** (`:44`,
   `IdentifierName`). Measured across every `core.test.ts` fixture, the
   token-channel kinds present are **`IdentifierName`, `NumericLiteral`,
   `Punctuator`, `RightBracePunctuator`** — so six claimable kinds appear in no
   fixture at all: `PrivateIdentifier`, `DivPunctuator`, `StringLiteral`,
   `Template`, `TemplateSubstitutionTail`, `RegularExpressionLiteral`. ⚠ An
   earlier draft listed seven and included `RightBracePunctuator`, which **is**
   present — `:149`'s `'if (a) {}'` produces one. A partial fate table passes.
   **Mitigate with a type, not a test:** a total
   `Record<InputElementKind, Fate>` makes the compiler enforce all fourteen.
   That needs
   `import type { InputElementKind } from '../../lib/scanning/types.js'` in
   `core.ts` — **a normal import, NOT a FLAG**; the FLAG rule is about editing
   `types.ts`, not importing from the leaf. ⚠ `ClaimableKind` and
   `AdvancingKind` in `types.ts` are **type-only** — there is no runtime value
   to iterate — and the fate split is **three-way**, so a claimable/advancing
   binary is wrong: two advancing kinds are `consumed` and two are `set-aside`.
4. **`switch` is banned** — `no-restricted-syntax`, selector `SwitchStatement`
   [eslint.config.mjs:407-409]. Lookup objects or if-chains.
5. **Never read `token.value`** and **never deep-freeze anything holding a
   parser token** — an acorn token's `type` is a process-global singleton.
   `PHASE-1.md` § Traps.
6. **`Object.isFrozen(undefined)` returns `true`**, so a freeze assertion
   reaching through an index passes vacuously on an empty return. `PHASE-1.md` §
   **Deferred**, finding 2.
7. **`git grep -c "it.skip"` is a regex** — the `.` matches any character. Use
   `git grep -cF "it.skip("`.
8. **`grep` without `-E` on an `a|b` pattern is VACUOUS.** Control-test every
   absence claim against a file you know contains the thing.
9. **A JSDoc line-wrap defeats `grep "the phrase"`** — the `*` continuation
   breaks it. Use `perl -0777 -ne '/the[\s*]+phrase/'`.
10. **`prettier --write` reflows `.ts` and re-wraps long JSDoc.** Run it
    **before** you grep your own citations.
11. **Never run `eslint --fix`**; never run eslint on a `.md` file.
12. **Sweep over `git ls-files`, never over the files you remember touching.**
    In wave 1 two consecutive rounds walked past a contradiction inside one file
    because each fixed a remembered list.
13. ⚠ **Today is NOT 2026-08-20 — this line said so until 2026-08-25 and would
    have put a wrong date into an immutable commit body.** Run `date` and use
    what it says. **Local time wins for commit bodies**; `repo-facts.mjs` stamps
    UTC, and this machine is UTC-4, so after 20:00 local the two name
    **different dates**. Take the local one and do not mix them within a body.

## Lint constraints

- `@typescript-eslint/no-non-null-assertion` — **`error`** over
  `src/lib/study-lenses/**` [eslint.config.mjs:490, 512]. `!` is barred, which
  is exactly why the precondition re-checks.
- `local/newspaper-order` — `error`: imports → main → consts → helpers.
- `no-explicit-any`, `no-unsafe-*`, `restrict-template-expressions` — all
  `error`.
- Every `eslint-disable` needs a `-- reason`; unused disables are an error.
- `noUncheckedIndexedAccess` is **NOT** enabled (only `strict` +
  `exactOptionalPropertyTypes`). An index access types as non-`undefined`. Do
  not invent guards the sketch does not have.

## Your exit gate

Report DONE only when all hold, each shown with its command output:

1. `npx vitest run --project unit src/lib/study-lenses/lenses/spellme` shows
   **39 passing** and **50 skipped** of 89 — 22 inherited + your 17 — **plus the
   precondition-throw test** in `core-defect.test.ts`, so expect **40 passing of
   90** once that lands. **Verify by running it, not by matching this
   arithmetic**; reconcile any difference before reporting. (It read
   `37 / 50 of 87` until 2026-08-25.)
2. `npx tsc --noEmit` → 0 errors.
3. No new failing file outside the baseline list in § Measured baselines. **Do
   not carry a count in this line** — it carried "nine" while that section said
   EIGHT, and a count restated in two places is a count that will disagree with
   itself again.
4. `npx prettier --check`, `npx eslint`, `npx cspell` clean on **all three** of
   your paths.
5. **No Fake It anywhere, in any commit.** This wave declines the usual
   first-test permission (see § Un-skip order), so `return []` should never
   appear. Read `core.ts` at your final commit AND `git show` your first one.
6. `readStream` reflects `DOCS.md` § Execution phase 3 **as a phase**, and the
   fate table is total over all fourteen kinds. **And `positionCursor` reflects
   phase 4: it advances past _every_ consecutive advancing element — a loop or
   scan, never a single step — and returns `from` unchanged when the element
   there is already claimable.** A single-step implementation
   (`isClaimable(stream[from]) ? from : from + 1`) passed every test in the
   module before 2026-08-25; the two locks added in `4d3e97a6` are what kill it,
   and this line is the structural half of the same check.
7. Every increment has an `ar-4` verdict; every CONSIDER has a documented
   response in its body.
8. Your full SHA list, in order, with messages.
9. `readStream` carries `@throws TypeError` and the class-asserting test is
   green in `tests/core-defect.test.ts`. The ruling is already taken
   (2026-08-25) — this line previously asked you to report it as still open.

## Report DONE | BLOCKED | FLAG — no fourth channel

- **DONE** = verified AND committed. Green-but-unverified is BLOCKED.
- **BLOCKED** = cannot finish, `ar-4` returned PAUSE, or `ar-4` will not spawn.
  Running long on context? Report BLOCKED **at a committed increment boundary**,
  never mid-triangulation. Include: the increment and its driver, your exact
  pathspec, the reviewer's input paths, the commit body you drafted
  **verbatim**, the green-arrival records, and the three vitest summary lines
  plus tsc. **Your context is not a safe place to keep any of them.**
- **FLAG** = an inter-file contract boundary or a suspected coupling. Any change
  to `types.ts`, `README.md`, `DOCS.md` or `ux/**` is a FLAG, never yours.
