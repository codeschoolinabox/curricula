<!-- cspell:ignore spellme -->

# spellme Phase 1, wave 4 — the claim loop's core

You are the **orchestrator** opening wave 4 of the `spellme` lens, in
`/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula`.

**Wave 4 is `judgeClaim`, `handOver` and `settle` — the 22 remaining skips in
`core.test.ts`.** Pure functions, no React, no surface. Wave 5 is the five
`component.test.tsx` skips that drive the loop through the surface, and is not
yours.

**This brief POINTS; it does not restate.** The campaign record is
[`./PHASE-1.md`](./PHASE-1.md) and it is current — wave 3 closed 2026-09-05 with
a § state-at-close and a forward list. Where this file and that one disagree,
**that one is right**, because it is maintained and this is not.

## First act — governance

Read the repo-root `CLAUDE.md`. It is a **router**: check your model id against
its qualifying list and read whichever of `AGENTS.md` / `AGENTS.principal.md` it
selects, **end to end**. Then `DEV.md` §§ Incremental Development Workflow,
Adversarial Review Protocol, Shared-worktree git mechanics, Sourced claims,
Ruling provenance, No Comments in Tests, Work routing and ceremony.

Then **`./PHASE-1.md`**, all of it. Do not skim the rulings subsections — derive
their count rather than trusting one:

```sh
grep -cE "^### The .spellme. LENS's rulings" .planning-handoffs/spellme/PHASE-1.md
grep -cE '^- \((human|orchestrator) ruling' .planning-handoffs/spellme/PHASE-1.md
```

⚠ **One ruling is invisible to that second grep** — its citation sits mid-line
inside a numbered item. Find it with an un-anchored
`git grep -n "human ruling 2026-08-30"`.

Then the module canon end to end: `README.md`, `DOCS.md`, `types.ts`,
**`core.ts`**, `tests/core.test.ts`, `tests/core-defect.test.ts`, and **both
twin files** — `ux/user-journeys.md` **and** `ux/wireframes.md`.
`twin-doc: user` makes both canon, and checking one and calling the twin done is
this module's twice-committed failure.

⚠ **`PHASE1-WAVE-3-BRIEF.md` and `PHASE1-WAVE-3-RESUME.md` are CLOSED RECORDS.**
Both read as live throughout and are not. Do not launch against either.

## Measured state — re-measure, nothing is pinned

| Fact                | Value                                      | Command                                                                                                                           |
| ------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| scoped suite        | `Tests 91 passed \| 27 skipped (118)`      | `npx vitest run --project unit src/lib/study-lenses/lenses/spellme`                                                               |
| your skips          | **22**, all in `core.test.ts`              | `grep -c "it.skip(" src/lib/study-lenses/lenses/spellme/tests/core.test.ts`                                                       |
| wave 5's skips      | **5**, in `component.test.tsx` — not yours | `grep -c "it.skip(" src/lib/study-lenses/lenses/spellme/tests/component.test.tsx`                                                 |
| your stubs          | three, all throwing                        | `grep -n "not implemented" src/lib/study-lenses/lenses/spellme/core.ts`                                                           |
| tsc under `lenses/` | **0**                                      | pipe `npx tsc --noEmit` into `grep "study-lenses/lenses/"` — ⚠ this cell escapes its pipe for markdown; do not copy the backslash |
| HEAD                | moves within minutes                       | `git rev-parse HEAD`                                                                                                              |

⚠ **`npx tsc --noEmit` is RED repo-wide and none of it is yours** — the errors
sit under `local-llm/` and `aithor/` and are **COMMITTED at HEAD**, not dirty. ⚠
An earlier revision of this brief called them a peer's uncommitted in-flight
work; they are neither, so **do not expect the red to clear on its own and do
not attribute it by checking `git status`**. Attribute it by path. **Use the
scoped grep above; the shorter `grep lenses/` matches `study-lenses/` and
returns the package's every error.**

⚠ **The foreign test baseline is EIGHT paths**, listed in
[`./PHASE1-WAVE-2-BRIEF.md`](./PHASE1-WAVE-2-BRIEF.md) § Measured baselines.
**Never inherit it; re-derive.** Two more may appear: `local-llm/feasibility`
(the same peer), and `orchestrate/tests/index.test.tsx`, which is **TWO
different documented phenomena that an earlier revision of this brief
conflated**:

- **The intermittent FAILURE.** Recognize it **by its assertion, not by the
  file**: `keys duplicate-target proposals safely`,
  `expected [ 2, 1 ] to deeply equal [ 2, +0 ]` at `index.test.tsx:1154`. That
  string is the discriminator.
- **A separate jsdom gap** that prints
  `TypeError: textRange(...).getClientRects is not a function`. ⚠ **It decides
  nothing** — measured, it printed 8 times in one green run and 0 in another,
  both `128 passed`. Do not use it either way.

⚠ **And do NOT clear it with a single green re-run.** The record: "at that rate,
three runs in four look clean" — confirmed at this boundary, where two
whole-repo runs four minutes apart gave 10 failing files and then 9. An earlier
revision of this brief said the re-run discriminates and the symptom does not;
**that is backwards for the assertion**, which is the symptom that does.

**Live gates:** `npx eslint <file>` for `.ts` — **run it BARE**, because after a
pipe `$?` is the tail's — `npx markdownlint-cli2 --no-globs "<file>"` for `.md`,
`npx tsc --noEmit`, `npx prettier --check`. **There is no spell-check gate**;
`cspell` was uninstalled at `9baca1e7`.

## What is left — 22 skips in four blocks

Derive the TESTS by name, never by line, and the BLOCKS separately — one grep
cannot give you both, and an earlier revision published one that gives neither
because it lacked the path:

```sh
grep -n "it.skip(" src/lib/study-lenses/lenses/spellme/tests/core.test.ts
grep -n "describe("  src/lib/study-lenses/lenses/spellme/tests/core.test.ts
```

| Block                             | Skips | Function     |
| --------------------------------- | ----- | ------------ |
| `Verdicts — judged independently` | 7     | `judgeClaim` |
| `The one-more-character question` | 6     | `judgeClaim` |
| `Fall or wait — the gate`         | 6     | `settle`     |
| `The way past`                    | 3     | `handOver`   |

**One red event bounds one increment** (human ruling 2026-08-15). A test that
arrives green **rides** into the open increment with a one-line record of what
it would have caught. **AR-3 is opted out for un-skips** (human ruling
2026-08-14) and **does not extend to authored tests** (human ruling 2026-08-25).
`ar-4` fires per increment; `ar-5` at the wave boundary.

⚠ **The un-skip order ruling of 2026-08-26 is about `component.test.tsx`'s
blocks, not these.** Whether `core.test.ts` takes file order or something else
is **not ruled** — put it to the human before your first edit, exactly as wave 3
did.

## ⛔ THREE questions the human owes you — ask them AS ONE BUNDLE before your first edit

The third is the un-skip order, above. ⚠ An earlier revision headed this section
"two decisions" and left that one stranded a page away, so an agent could ask
two, start, and stall on the third. **Batch all three**, plus `ceremony`, into a
single ask.

1. **Whether wave 4 fans out.** `PHASE-1.md` § the 2026-08-20 ruling's
   reopening: wave 4's "only real edge is `judgeClaim → settle` (settle's six
   tests each build verdicts via `judgeClaim`), leaving `handOver` independent —
   **one parallel pair, worth about one worker of wall clock.** Not worth a
   governance round-trip. **The decision is parked for the human at the wave-3/4
   boundary, and it needs BOTH items above, not just the first.**" Read that
   bullet whole: the two obstacles are a `worktree.baseRef` setting that is
   governance surface, and — the durable one — that a worktree is cut on a new
   branch with **no agent-executable path back to `main`**. ⚠ **Re-measure both
   rather than quoting that bullet**: its settings-file enumeration has already
   drifted (a key was added since), though the substantive claim survives —
   neither `worktree` nor `baseRef` appears in either settings file today. ⚠ It
   also opens "Nothing changes for waves 2 or 4", which reads as settling the
   question the same paragraph then parks; the parking sentence is later and is
   the operative one.
2. **A writable lock this wave OWES**, and it is easy to believe already done. ⚠
   **It lives in a file this brief scopes OUT, and that tension is real**: the
   instrument is the `verdicts()` helper in `tests/component.test.tsx`, and
   `data-attempts` is rendered by `index.tsx`. "Wave 5 is not yours" is about
   the five claim-loop SKIPS, not about those two files — **you may author tests
   there and you may need to.** Confirm the scope in the same bundle. ⛔ **The
   verdicts region can never announce as contracted**: it carries three `data-*`
   attributes and no text content, ever, while `ux/user-journeys.md` Journey 5
   says verdicts "are announced rather than only coloured". In wave 3
   `lastVerdicts` was permanently null and an empty region was CORRECT, so the
   lock could not be written. **This is the wave that produces a verdict to
   announce** — and the wave most likely to fill those three attributes, see
   them populated, and conclude the job is done. Whether the region gains text
   at all is a **Phase-0 contract question** and the human's. `PHASE-1.md`
   carries the reviewer's counter-proposal and the measurement showing
   `textContent` catches it in one line.

## Also handed forward — none blocking, all recorded in § the wave-3 close

`data-attempts` cannot be locked until `attempts` can move, and **this wave
makes it move**, so the lock it is owed becomes writable here. ⚠ `core.ts`
already carries a standing `sonarjs/no-duplicate-string` warning at `261:18`,
which the file documents as deliberate — **eslint is warning-but-green before
you touch anything**, so do not read it as yours. The per-element consumed run —
README's "an evaporating one hatched" has no carrier — is a DOM-contract
question and the human's. The break mark's density, the package-wide button
tab-order exposure, `parsons.css`'s dead `prefers-color-scheme` block, and
partial tokenization (embody has landed it; spellme's gate under-serves it) are
all the human's or another campaign's.

## Ceremony, commits, and the traps

```text
work: software · twin-doc: user · ceremony: <the human's> · prospective
```

`user` for anything under `lenses/spellme/`; `none` for `.planning-handoffs/`-
only commits. **You never state `ceremony`** — ask, and record `unset` on
silence, never a level nobody chose. ⚠ `DEV.md`'s example shows `(AR-3 n/a)`;
this campaign's line deliberately differs. **Never pass a `model` parameter** to
an `ar-N`. **Paste the read-only block from
[`./PHASE1-WAVE-3-BRIEF.md`](./PHASE1-WAVE-3-BRIEF.md) § Ceremony into every
`ar-N` prompt, verbatim** — it is prose in no other document, and it names
`git stash` explicitly because a general "read-only" instruction demonstrably
did not reach it. ⚠ **Two things around that block are STALE and neither is
yours to obey**: its allow-list still names `npx cspell`, a tool this repo
removed — inert, so paste it anyway rather than editing per-dispatch — and the
settings line printed twenty lines above it carries wave 3's `ceremony: full`,
which is **not** your level. Yours is unset until the human answers.

```sh
git add <explicit paths>
git diff --staged --name-only
git commit --no-verify -m "..." -- <the same paths>
```

The pathspec is the protection, not a clean index; peers are live in this tree.
Never push, branch, amend, `git checkout -- <file>`, `git restore`, or
`git stash`. **Announce every commit: full SHA + message.**

**Read [`./PHASE-1.md`](./PHASE-1.md) § Traps in full — every one applies to you
and none is restated here.** The four that cost wave 3 the most:

- **Capture gate output into shell variables and interpolate it into the commit
  body.** A count stated beside its own measurement has been wrong repeatedly,
  including inside the commit correcting a different instance.
- **Prose WRAPS, so single-line greps undercount.** Over source: strip comment
  markers, then `tr '\n' ' ' | tr -s ' '`. This fired four times in wave 3, once
  while auditing a reviewer.
- **Status prose in source goes false** (human ruling 2026-09-03). Comments
  state contracts and reasons; anything naming a wave, a block or a not-yet
  lives in `PHASE-1.md`. Measured there: every rotted comment was a status
  sentence, and no non-status comment rotted.
- ⛔ **Quote the heredoc delimiter** — `<<'EOF'`, never `<<EOF`. An unquoted one
  executes the backticks in a commit body and silently deletes the evidence out
  of `[read:]` tags, leaving the prose intact. Bodies are immutable. **Read the
  body back with `git show -s --format=%B <sha>` before moving on.**

## Model

**Run this on the strongest tier available.** `ar-2` and `ar-5` **inherit the
session model**, so a downgrade downgrades the pre-merge review — and per
`DEV.md` § Sub-model dispatch a downgrade is **named together with that cost**,
never taken silently.

## The finding wave 3 hands you, above any single trap

**Every AR round in wave 3 found at least one false claim, and every one was in
the author's PROSE rather than in the code.** The suite never went red for a
defect a review found. Several were claims TRUE WHEN WRITTEN and falsified by a
later commit of the same wave; one site had been wrong in both directions.
**Expect that, and expect the fix round to be where the next one enters** — wave
3's `ar-5` fix round shipped fresh defects of the same class as the blocker it
was closing, and only a re-verification with the same reviewer caught them. ⚠
Counts are deliberately absent here: an earlier revision stated two of them and
both were wrong, in the section whose whole subject is wrong numbers. Derive
them from § the wave-3 close if you need them.
