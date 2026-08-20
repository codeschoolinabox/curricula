<!-- cspell:ignore spellme tdd worktrees wireframes -->

# `tdd-worker` launch brief — the `spellme` LENS, Phase 1, Wave 2

⚠ **Read this paragraph before anything else.** Two files sit beside this one
with confusingly similar names — `./WAVE-1-BRIEF.md` and `./WAVE-2-BRIEF.md`.
**They are `lib/scanning`'s waves, they are CLOSED, and they are not yours.**
This brief is for a **different module**: the `spellme` lens at
`src/lib/study-lenses/lenses/spellme/`. Your predecessor is
[`./PHASE1-WAVE-1-BRIEF.md`](./PHASE1-WAVE-1-BRIEF.md), which is closed and
whose clusters are green.

**Scope: `readStream` — the spine. Twelve un-skips in `tests/core.test.ts`**,
and one question you must put to the human before you write a thirteenth test.

**37 of the 54 core tests route through `readStream`** via `core.test.ts`'s
`streamOf` helper, so nothing in waves 3-5 can go green until your work is
committed. That is why you run alone.

## The wave map — spellme's `core.ts`, all five waves

| Wave          | Cluster                                      | State                                                     |
| ------------- | -------------------------------------------- | --------------------------------------------------------- |
| 1             | `config` · `applicability` · `recommend`     | **CLOSED** 2026-08-20                                     |
| **2 — YOURS** | `readStream`                                 | this brief                                                |
| 3             | `positionCursor` · `judgeClaim` · `handOver` | consumes your committed stream                            |
| 4             | `settle`                                     | consumes `judgeClaim`'s `ClaimVerdicts`                   |
| 5             | `index.tsx`, the React surface               | 28 `component.test.tsx` skips; orchestrator, not a worker |

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

- `lenses/spellme/README.md` — **§ The three fates, and the mark is yours.**
  Also § Glossary (_the fates_, _mark_, _the stream_, _the tapes_) and § Edge
  cases.
- `lenses/spellme/DOCS.md` — **your Refactor step is held against § Execution
  phases 3** and the `Seq --> Stream` edge of the Mermaid `## Data flow`.
- `lenses/spellme/types.ts` — `StreamElement`, `Fate`, and the `marked`
  contract.
- `lenses/spellme/core.ts` — the file you edit. `readStream` is yours; the three
  wave-1 functions above it are **done and green — do not touch them**.
- `lenses/spellme/tests/core.test.ts` — read the whole file, not only your
  blocks.
- `lenses/spellme/tests/core-defect.test.ts` — two passing tests, and the home
  of the thirteenth you may not yet write. See § The one question you must ask.
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

| Fact                 | Value                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| HEAD at brief time   | `666090188d5a54066cae9ef5b2c30a1db65460e8` [measured 2026-08-20]                                              |
| spellme working tree | **clean** [measured: `git status --porcelain -- src/lib/study-lenses/lenses/spellme/`]                        |
| spellme suite        | `22 passed \| 65 skipped (87)` across three files                                                             |
| remaining skips      | `core.test.ts` **37**, `component.test.tsx` **28** [measured: `git grep -cF "it.skip("`]                      |
| `npx tsc --noEmit`   | **0 errors**                                                                                                  |
| Node                 | **v20.11.0 against engines `>=22.11.0` — BELOW the minimum.** Both tools run anyway. Proceed; upgrade nothing |
| unpushed             | `origin/main..HEAD` = 343 and climbing. Not yours. Never push                                                 |

**Failing-test baseline — repo-wide, all foreign.** **EIGHT** test files fail at
HEAD; `41 failed | 9853 passed | 120 skipped | 17 todo (10031)` [measured
2026-08-20: `npx vitest run --project unit --reporter=basic`]:

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

**Your two allowed paths:**

```text
src/lib/study-lenses/lenses/spellme/core.ts
src/lib/study-lenses/lenses/spellme/tests/core.test.ts
```

`README.md`, `DOCS.md`, `types.ts` and `ux/**` are the Phase-0 contract and are
**never yours** — a need for one is a **FLAG**. `tests/core-defect.test.ts`
becomes yours only after the human answers § The one question you must ask.

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
  context. Provide it: `core.ts`, `core.test.ts`, `types.ts`, the peer `DOCS.md`
  including its Mermaid diagram, and `../../lib/scanning/types.ts`. **Paths,
  never pasted contents.**
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
  is a pure function with no user-observable surface. The component is wave 5's.
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
5. Refactor against `DOCS.md` § Execution phases 3.
6. Self-review against the governance file's two checklists.
7. Spawn `ar-4` (with the hardened read-only prompt).
8. Quality checks: scoped suite, `npx tsc --noEmit`, `npx prettier --check`.
9. Commit by pathspec. Announce the full SHA.

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

## ⚠ The one question you must ask before writing a thirteenth test

**`readStream`'s throw CLASS is not settled, and three places in the tree read
as though it were.** The single corrective record is the **blockquote at
[`./PHASE1-WAVE-1-BRIEF.md`](./PHASE1-WAVE-1-BRIEF.md) line ~396, opening
`✅ The instruction above was correct`** — cited by anchor because it carries no
searchable label.

What is true: `readStream` carries **no `@throws` tag at all**. An `ar-5` argued
`RangeError` may be **affirmatively wrong** here — by the ruling's own
distinction, `TypeError` is the wrong KIND of value and `RangeError` is the
right kind carrying a wrong one, so an **absent member** is a wrong-kind case
even though a negative threshold is a range case.

**Do not spell `.toThrow(RangeError)` on the strength of anything you have
read.**

**How to route it, because you have no channel to the human and DONE must not
depend on one.** You report to the orchestrator, not to the human — three
channels, no fourth. So:

1. **Raise it as a FLAG in your final report**, with the wrong-kind argument
   stated. The orchestrator holds the human gate; the ruling is theirs to fetch.
2. **The twelve un-skips ARE the wave.** Report **DONE** on them with the FLAG
   attached. **Do not report BLOCKED for want of this ruling** and do not hold
   twelve committed increments hostage to it.
3. **Write no thirteenth test.** If the ruling arrives while you are still live,
   add the `@throws` tag to `readStream`'s JSDoc and then write it in
   `tests/core-defect.test.ts` (which already mocks the leaf and constructs the
   state). ⚠ A bare `.toThrow()` **passes vacuously** against the stub — assert
   the class.

## Un-skip order — exactly this, and nothing else

**`:30` · `:40` · `:44` · `:50` · `:64` · `:68` · `:72` · `:76` · `:80` · `:84`
· `:88` · `:92`** — twelve.

- **`:30`** `streamOf('')` → `[]`. **Fake It (`return []`) is legitimate here,
  and it WILL be committed — that is correct, not a defect.** `:40` kills it in
  the very next un-skip, so exposure is exactly one increment, which is the
  tolerance wave 1 already took: `c01ad2bb` committed `return []` for
  `recommend` and `14652100` killed it. ⚠ An earlier draft of this brief said
  "do not let it survive into a commit", which contradicted both the
  one-commit-per-increment rule and that precedent. **What must not happen is a
  fake surviving to the END of the wave** — wave 3 inherits `readStream` as a
  committed dependency, so a fake that escapes wave 2 breaks three clusters
  instead of one. Exit gate 5 checks your final state, not your first commit.
- **`:40` `:44`** — `One`. `:40` forces the real read; `:44` forces the fate.
- **`:50`** — `Many`, `'const x = 1'` → **7** elements.
- **`:64`-`:92`** — the fates and the mark, eight tests.

⛔ **`:34`, `:54` and `:58` stay skipped.** They sit inside the `Zero` and
`Many` blocks you are opening, and they belong to **wave 3's `positionCursor`**.
A block you opened is not yours in full. Every other `it.skip` in the file, and
all 28 in `component.test.tsx`, likewise.

## Ground truth — MEASURE it, do not guess and do not trust this brief

The fixtures below are what your tests feed `embody()`. **Measure the leaf's
actual output for each before implementing**, and put the measurement in your
commit body. Only two are pre-measured here:

- `'#!/usr/bin/env node\nx'` → **three** elements: `HashbangComment` [0,19),
  `LineTerminator` [19,20), `IdentifierName` [20,21). **The hashbang excludes
  its terminator**, which is why `:92`'s `marked === false` holds naturally
  [relayed: wave-1 planning measurement, 2026-08-20 — re-measure it].
- `'const x = 1'` → **7** elements, per `:50`'s own assertion.

Unmeasured, and yours to establish: `''` · `'x'` · `'// hi'` · `'a b'` ·
`'a\nb'` · `'/* a\nb */'` · `'/* ab */'`.

## Traps, each of which has already cost something

1. **THE ONE THE SUITE CANNOT DEFEND: the mark predicate must gate on KIND, not
   on text alone.** `element.text` containing a terminator is **necessary and
   not sufficient** — a `StringLiteral` or a `Template` can contain a real
   newline and must stay **unmarked**. No fixture in this wave contains one, so
   a text-only predicate **passes all twelve tests** and ships a defect wave 3
   inherits. The contract is: `LineTerminator` → marked **by its kind**;
   `Comment` → marked **only if its own text carries a terminator**; everything
   else → unmarked, whatever its text says.
2. **And it must cover FOUR line terminators.** `:80` uses `\n` only; the leaf's
   kind table names **LF, CR, U+2028 and U+2029**. `text.includes('\n')` passes
   the whole suite and is **wrong**. Traps 1 and 2 are two halves of one
   predicate — getting either alone still leaves it broken.
3. **Only ONE of the ten CLAIMABLE kinds has its fate asserted** (`:44`,
   `IdentifierName`). Measured across every `core.test.ts` fixture, the
   token-channel kinds present are **`IdentifierName`, `NumericLiteral`,
   `Punctuator`, `RightBracePunctuator`** — so six claimable kinds appear in no
   fixture at all: `PrivateIdentifier`, `DivPunctuator`, `StringLiteral`,
   `Template`, `TemplateSubstitutionTail`, `RegularExpressionLiteral`. ⚠ An
   earlier draft listed seven and included `RightBracePunctuator`, which **is**
   present — `:141`'s `'if (a) {}'` produces one. A partial fate table passes.
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
13. **Today is 2026-08-20 local.** `repo-facts.mjs` stamps UTC.

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
   **34 passing** and **53 skipped** of 87 — 22 inherited + your 12. **Verify by
   running it, not by matching this arithmetic**; reconcile any difference
   before reporting.
2. `npx tsc --noEmit` → 0 errors.
3. No new failing file outside the **nine**-path baseline above.
4. `npx prettier --check`, `npx eslint`, `npx cspell` clean on both your paths.
5. **No Fake It survives into your final state.** Read `core.ts` at your last
   commit and confirm no hardcoded return remains. Your _first_ commit is
   expected to contain `return []`; that is the sanctioned one-increment
   exposure, not a gate failure.
6. `readStream` reflects `DOCS.md` § Execution phase 3 **as a phase**, and the
   fate table is total over all fourteen kinds.
7. Every increment has an `ar-4` verdict; every CONSIDER has a documented
   response in its body.
8. Your full SHA list, in order, with messages.
9. The human's ruling on the throw class, and whether you wrote that test.

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
