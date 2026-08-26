<!-- cspell:ignore spellme wireframes Rects Behavioural actioned worktrees -->

# spellme Phase 1, wave 3 — cold-start launch prompt

You are the **orchestrator** for wave 3 of the `spellme` lens, Phase 1, in
`/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula`.

**Wave 3 does NOT fan out.** It carries the campaign's first 🔍 sandbox
checkpoint, and 🔍-bearing increments run in the orchestrator. Do not launch a
`tdd-worker`.

> This prompt was rewritten after a context-free validation returned nine
> must-fixes against its first draft — including a wrong URL, a wrong fixture, a
> vacuous lint gate and a missing un-skip order. Everything below is measured
> unless tagged otherwise.

## First act — governance

Read the repo-root `CLAUDE.md`. It is a **router**: check your own model id
against its qualifying list and read whichever of `AGENTS.md` /
`AGENTS.principal.md` it selects, **END TO END**. Then `DEV.md` §§ Incremental
Development Workflow, Adversarial Review Protocol, Sandbox Checkpoints,
Shared-worktree git mechanics, Sourced claims, No Comments in Tests.

## Then the campaign record — `.planning-handoffs/spellme/PHASE-1.md`

Read **§ Where things stand**, **§ Rulings of record**, **§ The `spellme` LENS —
Phase 1, wave 2 (CLOSED 2026-08-25)**, **both `### The spellme LENS's rulings`
sections (2026-08-20 and 2026-08-25)**, **§ Traps, each of which has already
cost something**, and **§ Gates the human holds**.

⚠ **Do not skip § Where things stand as "`lib/scanning`'s".** It is mixed — it
carries spellme's own Phase-0 SHA (`80306ad9`) and the twin-naming commits, and
AR-5 takes that list as input. The `lib/scanning` material is the _bulk_ of the
file's upper half, not all of it.

Three rulings there bind you and are not paraphrased anywhere else: **an
increment is bounded by exactly one red event** (2026-08-15); **every
decomposition is validated context-free before its launch**; and **AR-5 is the
orchestrator's and fires at each wave boundary**.

⚠ **Four similarly-named briefs.** `WAVE-1-BRIEF.md` and `WAVE-2-BRIEF.md` (no
prefix) are **`lib/scanning`'s**, closed, not yours. `PHASE1-WAVE-1-BRIEF.md`
and `PHASE1-WAVE-2-BRIEF.md` are spellme's, both closed. The wave-2 one opens
with a `✅ CLOSED` banner and **every number in it is historical** — with one
exception you will need: its § Measured baselines (line 127) carries the **eight
foreign-failure paths** in a fenced block, and that block is still the usable
artifact.

Then the module canon end to end: `README.md`, `DOCS.md` (§ Execution phases
**5–7**, § Structural constraints, § Decisions, and the Mermaid
`### Data flow`), `types.ts`, `index.tsx`, `tests/component.test.tsx`, and
**both twin files** — `ux/user-journeys.md` **and** `ux/wireframes.md`.
`twin-doc: user` makes both canon; wave 1's recorded failure was editing one and
calling the twin done.

## State — re-measure, nothing is pinned

```sh
git rev-parse HEAD                                              # AR-5's baseline
git status --porcelain                                          # PEER WIP — see below
git status --porcelain -- src/lib/study-lenses/lenses/spellme/  # must be empty
npx vitest run --project unit src/lib/study-lenses/lenses/spellme
git grep -cF "it.skip(" -- src/lib/study-lenses/lenses/spellme/tests/
npx tsc --noEmit
date
```

At handoff [measured 2026-08-25]: suite `42 passed | 50 skipped (92)`; `tsc`
**0**; skips `core.test.ts` **22**, `component.test.tsx` **28**; module tree
clean. HEAD and `origin/main..HEAD` move within minutes — peer `quizzing`,
`lens-migration` and `evaluators` sessions commit constantly.

### The failing-test gate — eight paths PLUS peer WIP, re-derived at launch

The eight foreign paths are in `PHASE1-WAVE-2-BRIEF.md` § Measured baselines.
**Seven of the eight fail at COLLECTION** (`0 test`), not on an assertion.

⚠ **The count is NOT reliably eight, and treating it as eight will cost you a
round.** During this handoff's own validation the full suite reported **nine** —
the ninth being `src/lib/study-lenses/lib/engine/tests/default-seconds.test.ts`,
an **untracked peer file** (`??`) that failed at collection while half-written
and **passed on its own an hour later** [both measured 2026-08-25]. Peers add
files mid-session.

**So the gate is:** the spellme directory green, plus **zero new failures
outside {the eight listed paths} ∪ {anything `git status --porcelain` shows as
untracked or modified peer work}**, re-derived at launch. Never whole-repo
green.

⚠ **`orchestrate/tests/index.test.tsx` is a separate, genuine flake — and an
isolated re-run does NOT settle it.** Combined across two agents: **9 isolated
runs, 1 failure**, the failure being
`TypeError: textRange(...).getClientRects is not a function` [measured
2026-08-25]. It is a **jsdom/CodeMirror layout-API gap**, not the Worker-pool
parallelism the wave-2 brief attributes it to. **Wave 3 is jsdom component work
— you are the wave most likely to meet it.** Check the symptom, not the
isolation.

## Scope — the 23 static component tests

`component.test.tsx` has 28 skipped. **5 drive the claim loop and are wave 5's;
the other 23 are yours** [measured 2026-08-25: `perl -0777` split on `it(`
boundaries, partitioned on `fireEvent`].

⚠ **You cannot un-skip by describe block.** The 5 straddle two blocks, and two
tests _inside_ `Many` are yours:

| Block                               | Yours (static)                                                                           | Wave 5's (`fireEvent`)           |
| ----------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------- |
| `Interfaces — the DOM contract`     | `:63 :67 :71 :77 :83 :89 :95 :101 :107 :113 :119 :125 :131 :139 :145 :151 :157` — **17** | —                                |
| `Many — the stream advances`        | `:181 :187` — **2**                                                                      | `:167 :174`                      |
| `Zero — nothing claimable`          | `:197 :201` — **2**                                                                      | —                                |
| `Boundaries — the exhausted stream` | none                                                                                     | `:209 :216 :225` — **all three** |
| `Interfaces — the keyboard journey` | `:234 :242` — **2**                                                                      | —                                |

17 + 2 + 2 + 2 = **23** ✓. **Take them by name, not by line** — line numbers
shifted eleven times in wave 2 when two tests were inserted. Re-derive with
`grep -n "it.skip(" tests/component.test.tsx`.

`index.tsx:26` currently throws `new Error('spellme main: not implemented')` and
is the file you make real. The three already-passing component tests are
lens-object identity checks, not surface tests.

### ⛔ THE UN-SKIP ORDER IS NOT SETTLED — put it to the human before your first edit

**File order is I → M → Z → B → I. Canonical ZOMBIES (`DEV.md`) is Z → M → B →
I. They disagree, and this exact class went to the human once already**: "The
`Boundaries — tiling` block un-skips out of file order" (human ruling
2026-08-14), whose reasoning was that early un-skip _licenses structural fakes_,
and which closes with "**ZOMBIES order survives: the blocks it moves past are
unlettered**" [read: `PHASE-1.md` § Rulings of record].

**The orchestrator's proposal, for the human to confirm or overrule:** ZOMBIES
over the lettered blocks, file order within each —

1. **`Zero — nothing claimable`** — `:197` `:201`
2. **`Many — the stream advances`** (static only) — `:181` `:187`
3. **`Interfaces — the DOM contract`** — `:63` … `:157`, seventeen in file order
4. **`Interfaces — the keyboard journey`** — `:234` `:242`

Increments are **not** prescribed: one red event bounds each, and tests arriving
green ride into the open increment with a one-line record — the shape wave 2
used. **Do not invent the order yourself; wave 2's brief carried an explicit §
Un-skip order section and this wave's first draft dropped it, which a cold read
called a hard block.**

⚠ **`DOCS.md` § Decisions: "the ten claimable kinds are spelled out, never
filtered from the fourteen."** Test `:89` (`offers ten element-kind buttons`)
will tempt `Object.keys(FATE_BY_KIND).filter(...)`. That is the forbidden form.

## The sandbox injection (human ruling 2026-08-20)

**Two edits in one file**, `spiralearn/sandbox/orchestrate/index.mdx`:

1. Add a require beside the existing ones (~line 54), matching their form — ⚠
   **the mdx requires `.tsx`; `built-in-lenses.ts` imports `.jsx`. Follow the
   mdx.**

   ```js
   const spellmeLens =
   	require('@site/src/lib/study-lenses/lenses/spellme/index.tsx').default;
   ```

2. Add `spellmeLens` to `lenses={[notesLens]}` at **line 80**.

**Registration stays OUT of Phase 1** — spellme is absent from
`src/lib/study-lenses/orchestrate/lib/composing/built-in-lenses.ts` (parsons,
writeme, debug-props only) and must stay absent [measured].

⚠ **Phase-2 obligation — RECORD IT, in `PHASE-1.md` § Deferred, as part of this
wave.** When registration eventually lands, the sandbox injection must be
removed **in the same commit** or `joinLensRoster` throws on a name collision.
`47234d7c` did exactly this. It is not enough to know it; wave 3 must write it
down.

### The 🔍 checkpoint

**URL: `/sandbox/orchestrate`** — `docusaurus.config.ts:234` maps
`path: 'spiralearn/sandbox'` to `routeBasePath: 'sandbox'`, so the
`/spiralearn/` form is a **404** [measured].

`npm start`, open it. **Before** the injection the **Tokens · spelling**
station's select is disabled — `disabled={phase.lenses.length === 0}` at
`src/lib/study-lenses/orchestrate/phases-panel/index.tsx:64`; the label is at
`orchestrate/display-labels.ts`. **After**, the select is enabled and lists
`spellme`; choosing it replaces the editor with the spellme root. The human
exercises it; you report their words verbatim. **Behavioural defects block the
commit; cosmetic redirects roll into the next increment.**

⚠ **The real fixture is two lines and carries a `LineTerminator`:**
`snippet={'const greeting = "hello";\nconsole.log(greeting);\n'}` at
`index.mdx:81` [measured]. The first draft of this prompt said `'const x = 1'`,
single-line — that is the _component-test_ fixture, and the mistake made its
warning unsound. **What the sandbox fixture actually lacks is leading
indentation**, so it will not exercise the mixed whitespace-then-terminator
cursor path. A clean checkpoint is not evidence `positionCursor` handles
indented code.

⚠ `src/lib/study-lenses--deprecated-architecture/` mirrors several of these
paths. Check for that segment before reading or citing.

## Ceremony — the human's, never yours

```text
work: software · twin-doc: <see below> · ceremony: full (AR-3 opted out by human, 2026-08-14) · prospective
```

**`twin-doc` takes TWO values, by the increment's subject module** — 8 of wave
2's 16 commits used each [measured]:

- **`user`** — any commit touching `src/lib/study-lenses/lenses/spellme/`
- **`none`** — commits touching only `.planning-handoffs/`

⚠ DEV.md's example shows `(AR-3 n/a)`; ours deliberately differs. Do not
"correct" it.

⚠ **The AR-3 opt-out is "for un-skips" and (human ruling 2026-08-25) does NOT
extend to authored tests.** Author a test and `ar-3` fires for it. `ar-4` fires
per increment. `ar-5` at the wave boundary. **Never pass a `model` parameter.**

### Paste this into EVERY `ar-N` prompt, verbatim

> ⛔ You are strictly read-only. **Forbidden by name:** `git stash` (and stash
> pop/push/apply/drop), `git checkout`, `git restore`, `git reset`, `git clean`,
> `git add`, `git commit`, `git push`, `git rebase`, `git merge`,
> `git cherry-pick`, `rm`, `mv`, `sed -i`, `perl -i`, `npx prettier --write`,
> `npx eslint --fix`. Named explicitly because a general "read-only" instruction
> demonstrably does not reach `git stash`: in wave 1 an `ar-4` carrying exactly
> that instruction ran `git stash`/`stash pop` and **destroyed a peer session's
> staged index**. Peers hold files staged in this shared worktree right now.
> **Allow-list:** `Read`;
> `git log/show/diff/status/grep/rev-parse/ls-files/ls-tree`; `grep`, `sed -n`,
> `awk`, `perl -0777 -ne` (print only), `wc`, `ls`, `cat`, `head`, `tail`, `od`,
> `diff`; `npx vitest run`, `npx tsc --noEmit`, `npx eslint <file>` (no
> `--fix`), `npx cspell`, `npx prettier --check`,
> `npx markdownlint-cli2 --no-globs`.

It is prose in no other document, it is needed a dozen times in this wave, and
one omission is the whole loss.

## What wave 3 must produce, and where each lands

1. The 23 un-skips + the injection — **commits on `main`**, pathspec-scoped.
2. **A `### The spellme LENS — Phase 1, wave 3` section in `PHASE-1.md`** — the
   close-state measurements and the regenerating `git log` command. ⚠ **Do not
   pin a commit count**; a document cannot count the commit that writes it.
3. **The 🔍 checkpoint outcome**, in that section, in the human's words.
4. **The Phase-2 injection-removal obligation**, in `PHASE-1.md` § Deferred.
5. **`.planning-handoffs/spellme/PHASE1-WAVE-3-BRIEF.md` does not exist** — if
   you write one, it is a new file; wave 4's brief is a separate deliverable and
   is where the `positionCursor` trap below must be named.

⚠ **This prompt is untracked scratchpad and will be pruned.** `PHASE-1.md:569`
is explicit that rulings living only in a handoff evaporate. Anything wave 3
decides goes in-repo.

## Commit form — one shell invocation, explicit pathspec

```text
git add <explicit paths>
git diff --staged --name-only
git commit --no-verify -m "..." -- <the same paths>
```

**The pathspec is the protection, not a clean index** — peers hold files staged
continuously, and a pathspec-less commit is denied by
`.claude/hooks/governance-guard.py` (registered at `.claude/settings.json`).
Never push, branch, amend, `git checkout -- <file>`, `git restore`, or
`git stash`. Announce every commit: full SHA + message.

## Carried forward — do not rediscover these

1. ⚠ **Wave 2's AR-5 re-verification RAN and returned CONSIDER**; all four items
   were answered and committed (`3e9048cc`). Wave 2 is fully reviewed. Its open
   MINORs, none actioned: `FATE_BY_KIND` arguably wants to be
   `FATE_BY_ELEMENT_KIND` per DOCS § Decisions' never-bare-`kind` rule;
   `LINE_TERMINATORS` is duplicated in `core.ts` and the scanning leaf with no
   tie; and the Mermaid freeze annotation on `Overrides --> Props` is the
   anomaly — **do not** add one to `Seq --> Stream`.
2. **A `types.ts` FLAG is open and is the human's:** the two kind unions are not
   asserted to _partition_ `InputElementKind`, so dropping a kind from
   `AdvancingKind` without adding it to `ClaimableKind` silently unpins its
   rows. `AdvancingKind = Exclude<InputElementKind, ClaimableKind>` would close
   it. Raised by AR-5, **never compiled**. Recorded in `core.ts`'s
   `ADVANCES_ON_ITS_OWN` JSDoc.
3. **`positionCursor` is the only writer of the cursor, and NOTHING forces
   `settle`/`handOver` to call it** — their assertions are `toBeGreaterThan(0)`
   over the trivia-free `'a+++b'`, so a bare `cursor + 1` passes everything and
   rests the cursor on whitespace. **Wave 4's trap; name it in wave 4's brief.**
4. **The technique that found wave 2's two real defects: MUTATE THE SOURCE AND
   WATCH THE SUITE STAY GREEN.** A reviewer is read-only and can only deduce;
   you can flip a line and know. Both the single-step `positionCursor` mutant
   and the unpinned `LineTerminator` mark were invisible to every test and to
   reading.

## Traps

- **`(human ruling …)` wraps under prettier and returns ZERO to a single-line
  grep.** Citation at the **very start of its line**, verified **after**
  `prettier --write`, with three agreeing instruments: `grep -c`, the collapsed
  `tr '\n' ' ' | tr -s ' ' | grep -o … | wc -l`, and `git grep -c`.
- ⚠ **An absence claim that QUOTES the token it counts falsifies itself** — it
  fired three times on 2026-08-25. And an alternation grep must **state that it
  used `-E`**. Always pair with a positive control. Full record: `PHASE-1.md`,
  the third and fourth failure modes in § The `spellme` LENS — Phase 1, wave 2.
- **A number living in two documents will disagree.** Make one document its only
  home and have the other point at it.
- **Sweep over `git ls-files`, never a remembered list** — and, since
  2026-08-25, never a remembered _directory_ either.
- **`git grep -c "it.skip"` is a regex.** Use `git grep -cF "it.skip("`.
- **Never `eslint --fix`**; never eslint a `.md`.
- Plus every trap in `PHASE-1.md` § Traps.

## Per-file checkpoints

| File type    | Command                                     |
| ------------ | ------------------------------------------- |
| `.ts` `.tsx` | `npx eslint <file>`                         |
| `.md`        | `npx markdownlint-cli2 --no-globs "<file>"` |
| any          | `npx cspell <file>`                         |

⚠ **`.mdx` is NOT in that table on purpose.** `npx eslint` on
`spiralearn/sandbox/orchestrate/index.mdx` reports _"File ignored because of a
matching ignore pattern"_ and exits 0 — **a gate that always reads green**
[measured 2026-08-25]. What actually gates the mdx is `npx tsc --noEmit`,
`npx cspell`, and the 🔍 checkpoint itself.

Plus `npx prettier --write` **before** you grep your own citations, and
`npx tsc --noEmit` at 0.
