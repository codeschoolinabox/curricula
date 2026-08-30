<!-- cspell:ignore spellme wireframes Rects -->

# spellme Phase 1, wave 3 — RESUME (mid-wave handoff)

You are the **orchestrator** continuing wave 3 of the `spellme` lens, in
`/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula`.

**Wave 3 is roughly three-quarters done and does NOT fan out.** It carries 🔍
sandbox checkpoints, and 🔍-bearing increments run in the orchestrator. Do not
launch a `tdd-worker`. **Do not trust that fraction** — derive it from § What is
left.

> **Handed off twice, both times at a clean committed boundary and both times by
> the agent's own call, for the SAME tell**: `AGENTS.principal.md` § Handoff
> agency, _"a learned lesson repeats as an error → hand off at the next clean
> boundary."_
>
> The first session reproduced one bookkeeping defect three times and left three
> held rulings unrecorded. **The second (2026-08-29/30) reproduced that same
> count-beside-the-measurement defect once more — inside the very commit that
> corrected a different error of its own — and coined three new words into
> linted files, one of which reached a commit.** It also nearly shipped two red
> events in one increment.
>
> **None of it reached the code.** The suite is green, every increment passed
> its audit, and every defect above was caught by a gate, a reviewer, or the
> human — **never by the author re-reading their own work.** That is the pattern
> worth carrying forward more than any single trap below.

⚠ **`PHASE1-WAVE-3-BRIEF.md` is the wave's ORIGINAL launch prompt and is still
largely accurate** — read it for scope, traps and the un-skip partition. **This
file supersedes it on state, on the checkpoint URL, and on everything decided
since.** Where they disagree, this file is right.

⚠ **Four claims in that brief are FLATLY STALE and read as live** — called out
here by name, since a blanket "supersedes" does not visibly reach them: its ⛔
"THE UN-SKIP ORDER IS NOT SETTLED — put it to the human before your first edit"
(settled 2026-08-26, ZOMBIES over blocks); "`index.tsx:26` currently throws"
(false since `1d1f45aa`); "`PHASE1-WAVE-3-BRIEF.md` does not exist" (it is
committed at `222cfd5a`); and "this prompt is untracked scratchpad and will be
pruned" (it is tracked and clean). **Do not act on any of the four.**

## First act — governance

Read the repo-root `CLAUDE.md`. It is a **router**: check your model id against
its qualifying list and read whichever of `AGENTS.md` / `AGENTS.principal.md` it
selects, **END TO END**. Then `DEV.md` §§ Incremental Development Workflow,
Adversarial Review Protocol, Sandbox Checkpoints, Shared-worktree git mechanics,
Sourced claims, Ruling provenance, No Comments in Tests.

**Then `./PHASE-1.md`** — and specifically its dated rulings subsections:
`(2026-08-20)`, `(2026-08-25, wave 2)`, `(2026-08-26, wave 3)`,
`(2026-08-27, wave 3 continued)` and `(2026-08-29, wave 3 continued)`. **The
count is deliberately not stated here** — derive it, both the subsections and
the rulings inside them:

```sh
grep -cE "^### The .spellme. LENS's rulings" .planning-handoffs/spellme/PHASE-1.md
grep -cE "^- \((human|orchestrator) ruling" .planning-handoffs/spellme/PHASE-1.md
```

⚠ **This sentence said "four subsections … 22 rulings — 4 · 5 · 8 · 5" until
2026-08-29**, when a fifth subsection landed and the totals moved. That is the
THIRD time a stated total in this campaign went stale within hours of being
written; the previous two were corrected with better totals, which is how each
one came back. **The number is deleted rather than corrected.** ⚠ And the
`^- \(` anchor is load-bearing: wrapping a bullet in a marker on 2026-08-29
silently dropped one subsection's count from 8 to 7 for one revision — a
superseding note must keep the bullet's citation at the very start of its line.
None is restated here — pointing beats copying, and a copy drifts. Also read
that file's wave-3 running record — find it with
`grep -n "LENS — Phase 1, wave 3"`, because the heading carries backticks around
the module name and a literal search without them returns **zero hits**. It
holds every checkpoint outcome in the human's own words.

Then the module canon end to end: `README.md`, `DOCS.md`, `types.ts`,
**`core.ts`**, `index.tsx`, `tests/component.test.tsx`, `tests/core.test.ts`,
`tests/core-defect.test.ts`, and **both twin files** — `ux/user-journeys.md`
**and** `ux/wireframes.md`. `twin-doc: user` makes both canon; wave 1's recorded
failure was editing one and calling the twin done.

⚠ **`core.ts` is on that list to be READ, not edited** — no Block-A work should
need to change it, and nothing rules that it cannot; the DOM-contract work needs
its ten claimable kinds, and `DOCS.md` § Decisions rules that they are
**"spelled out rather than filtered from the fourteen"**. So
`Object.keys(FATE_BY_KIND).filter(…)` is the **forbidden form** for the
ten-buttons test, and the runtime list belongs in `index.tsx`, in-file.

## Measured state — re-measure, nothing is pinned

[all measured 2026-08-30, at the handoff commit]

| Fact               | Value                                                                     |
| ------------------ | ------------------------------------------------------------------------- |
| HEAD               | **not stated — run `git rev-parse HEAD`**; it moves within minutes        |
| scoped tree        | see the ⚠ below — this row **cannot honestly assert itself**              |
| scoped suite       | `Test Files 3 passed (3)` · `Tests 58 passed \| 34 skipped (92)`          |
| skips              | `component.test.tsx` **12** · `core.test.ts` **22** (wave 4's, untouched) |
| `npx tsc --noEmit` | **exits 0**                                                               |
| un-skips left      | **7** of wave 3's · **5** wave-5 tests stay skipped                       |
| peer WIP           | derive it; **three entries are DELETIONS** you must know about, below     |

```sh
git rev-parse HEAD
git status --porcelain -- src/lib/study-lenses/lenses/spellme/ \
  spiralearn/sandbox/orchestrate/index.mdx .planning-handoffs/spellme/ \
  .planning-handoffs/embody-partial-facts/
npx vitest run --project unit src/lib/study-lenses/lenses/spellme
git grep -cF "it.skip(" -- src/lib/study-lenses/lenses/spellme/tests/
npx tsc --noEmit
npx vitest run --project unit      # the WHOLE repo — for the foreign baseline
```

⚠ **The scoped-tree row is the ONE row this file cannot honestly assert about
itself.** While it is being written, and until the commit that lands it, that
command returns THIS FILE as modified. A previous revision carried exactly this
caveat; the 2026-08-30 rewrite deleted it and kept the flat claim, and a
context-free reader hit the contradiction on the very first gate it ran.
**Re-run it rather than believe it** — and count this file OUT of "peer WIP",
because it is yours, and an agent who stashes peer WIP would lose it.

⚠ **There is no spell-check gate in this project.** `cspell` was uninstalled at
`9baca1e7` and unwired from every automated check (human confirmation
2026-08-30: _"cspell has been removed, no more worrying about it"_). **Do not
run it and do not reconstruct it.** You will see `cspell.json` deleted in
`git status`; that is the sanctioned completion of the same decommission, and
the remaining deletion is the human's, not yours.

**The live per-file gates:** `npx eslint <file>` for `.ts`/`.tsx`,
`npx markdownlint-cli2 --no-globs "<file>"` for `.md`, plus `npx tsc --noEmit`
and `npx prettier --check`. ⚠ An earlier revision of this file made
reconstructing the spell gate the first act of every session. The account of how
that error was reached lives in `PHASE-1.md` and is deliberately not repeated
here: it is history, not an instruction.

⚠ **The foreign-failure baseline is EIGHT paths, listed in
[`./PHASE1-WAVE-2-BRIEF.md`](./PHASE1-WAVE-2-BRIEF.md) § Measured baselines** —
re-derived 2026-08-30 as still exactly those eight
(`Test Files 8 failed | 464 passed (472)`). **Never inherit it; re-derive.** The
gate is your directory green plus zero NEW failures outside those eight ∪ peer
WIP.

⚠ **A NINTH appears intermittently and is NOT a new standing failure.**
`orchestrate/tests/index.test.tsx` — **seen in 1 of 4 whole-repo runs**, and
passing 128/128 in isolation twice, which points at cross-file pollution rather
than the `getClientRects` flake. Recognize it by the assertion, not the file:
`keys duplicate-target proposals safely`,
`expected [ 2, 1 ] to deeply equal [ 2, +0 ]`, at `index.test.tsx:1154` — a
leaked React key warning caught by a spy. **If you see nine, check whether the
ninth is this one before treating the gate as violated.** ⚠ Do NOT clear it with
a single green re-run: at that rate, three runs in four look clean.

⚠ **The jsdom flake is real** —
`TypeError: textRange(...).getClientRects is not a function` printed during an
`orchestrate/tests/index.test.tsx` run while the file still passed. Check the
**symptom**, never an isolated green re-run.

## What is done

**The count is deliberately NOT stated — RUN THE LOOP**, over four paths. An
earlier revision stated a total its own loop already contradicted — and the true
figure moved three times more while this paragraph was being written and
rewritten. **That is why no number appears here.** Correcting a stale count with
a fresher one is how every previous one came back:

```sh
git log --format='%h %s' --since='2026-08-26 00:00' -- \
  src/lib/study-lenses/lenses/spellme/ \
  spiralearn/sandbox/orchestrate/index.mdx \
  .planning-handoffs/spellme/ \
  .planning-handoffs/embody-partial-facts/
```

Block A is **six of its eight increments done** — A1 input tape, A2 token tape,
A3 claim form and picker, A4 extent stepper, A5 verdicts region, A6 legend. The
surface now renders every region the DOM contract names except the fates panel,
the one-more field and the way past — measured by grep, not counted from memory.

**🔍 #2 and #3 are SPENT and both passed**, outcomes recorded verbatim in
`PHASE-1.md`. #3 passed _with redirects_, and its redirects are live obligations
— see § What is left.

**Four rulings of 2026-08-29** are in `PHASE-1.md`'s
`(2026-08-29, wave 3 continued)` subsection. ⚠ **A fifth, of 2026-08-30, is NOT
there** — it sits mid-line inside a numbered item elsewhere in that file, so the
canonical `^- \((human|orchestrator) ruling` grep **cannot see it**. Find it
with an un-anchored `git grep -n "human ruling 2026-08-30"`. That is the
load-bearing-anchor failure this file warns about above, committed by its own
author. \*\*The stale-seed ruling of 2026-08-29 WITHDRAWS the stale-seed fix the
earlier handoff called mandatory; read that subsection before § WITHDRAWN below,
which is kept only as a record of the reasoning.

## What is left

**Take tests BY NAME, never by line.** Re-derive with
`grep -n "it.skip(" tests/component.test.tsx`. **One red event bounds one
increment** — a test that arrives green rides into the OPEN increment. ⚠ This
session nearly shipped two red events in one commit by un-skipping the next
driver before committing the previous increment; it was caught before the
commit. Do not batch.

### Block A — FIVE un-skips left, file order

| Un-skip (by name)                                          | Predicted | Notes                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `collapses the fates panel on first mount`                 | **RED**   | A7's driver. A bare `<details data-spellme-fates>` gives `open === false` in jsdom, and `parsons/index.tsx` is the house precedent for the element — every one of its `<details>` carries a `<summary>`. ⛔ **WHERE IT GOES IS NOT SETTLED — see the twin disagreement below. This is not a two-line insert.**             |
| `renders no snippet-type control of its own`               | green     | rides — **vacuously**; record that                                                                                                                                                                                                                                                                                         |
| `hides the one-more field before the threshold is reached` | green     | rides — **vacuously** until A8                                                                                                                                                                                                                                                                                             |
| `hides the way past before the threshold is reached`       | green     | rides — vacuous until Block C's `{ skipAfter: 0 }` lock                                                                                                                                                                                                                                                                    |
| `shows the one-more field immediately at a zero threshold` | **RED**   | A8's driver. **Adds the `config` prop** — `SpellmeMain` does not destructure it today. Both siblings re-resolve through their own core factory in a `useMemo` and then narrow FIELD BY FIELD, because `LensConfig` is `Record<string, SerializableValue>` and `attempts >= config.oneMoreAfter` is a type error otherwise. |

⛔ **THE FATES PANEL'S PLACEMENT IS A TWIN DISAGREEMENT, NOT A DECIDED FACT.**
`README.md` § UI structure puts `<details data-spellme-fates>` between the
verdicts region and the legend. `ux/wireframes.md` draws it **in the title bar**
— `│  spellme                                          ⓘ fates  │` — and that is
the twin's ONLY drawing of it, not disclaimed by its "What has no wireframe,
deliberately" section. **`twin-doc: user` makes both canon.** An earlier
revision of this file quoted README's order alone and called it "a clean
two-line insert", which is **this document's own trap #3 — checking one twin and
generalizing — reproduced inside the instruction warning against it.** Put the
disagreement to the human before implementing; do not pick one.

⚠ **Do not stall the wave on it.** A7 is blocked only on PLACEMENT — the
element, its `<summary>`, and its content from README § The three fates are all
settled. **Ask the question and take A8 meanwhile**; A8 is independent and is
the other red event left in Block A.

⚠ Also under-scoped by that earlier revision: README calls the panel's contents
"the three fates", the preceding legend increment shipped real content plus a
JSDoc reconciling both twins, and the house `<details>` style always carries a
`<summary>`. Budget it as a content increment, not an element insert.

### Block B — two un-skips, BOTH GREEN TODAY

**Measured 2026-08-30 by un-skipping both and running:
`60 passed | 32 skipped (92)`, no failures.** Block B produces **zero red
events**, so under the 2026-08-15 ruling both ride into the open increment that
precedes them — A8's — each with a one-line record of what it would have caught.

⛔ **An earlier revision described both rows wrongly, and one error would have
written a FALSE CLAIM into a commit body.** It called
`gives every element-kind button a reachable control` "green now and always, its
`for…of` runs over an empty NodeList — record that rather than crediting it".
**The buttons have existed since `304160c5`**; the test iterates ten of them and
asserts on each. Recording it as vacuous is this campaign's own
assertions-that-pass-without-asserting trap, inverted. It also called
`gives the extent a native stepper` "red today" while its own next clause said
A4 had landed. **Both rows came from a pre-A3/A4 model and were never
re-measured. Re-measure before writing anything about a test's colour.**

### Block C — TWELVE authored locks, under ONE `ar-3`

Ten are the human's (3 + 2 + 5); **two are the agent's and are disclosed there
as the human's to strike** in `PHASE-1.md`. `ar-3` fires for authored tests —
the opt-out covers un-skips only. Every one is enumerated with its grounds in
`PHASE-1.md`'s 2026-08-29 subsection; **do not re-derive them from here.**

**Four of them are already proven necessary by mutation this session** — each
mutant left the suite FULLY GREEN: deleting the break marks; `aria-pressed`
hardcoded false; `data-extent` hardcoded; the extent hook moved from the wrapper
onto the input. Two more properties proved genuinely pinned and need no lock:
the cursor's resting place (`cursor: stream.length` kills its test) and the
claim gate (`isClaimable = true` kills the Zero test).

### Then

`spellme.css` + a `DOCS.md` § Modules row + **🔍 #4** · `ar-5` at the wave
boundary · **🔍 #5** · the wave-3 close section · **wave 4's brief, context-free
validated**.

⚠ **🔍 #3's redirects are named obligations on the stylesheet increment**, not
vague ones: a visible pressed state for `[aria-pressed='true']`, a visible
proposed run distinct from consumed and rest, and **a visible focus indicator**.
The human confirmed every mechanism works **in the inspector and nowhere else**.

⛔ **ONE UNRESOLVED FINDING, and it may be behavioral rather than cosmetic.**
The human reported that tab does not reach the element-kind buttons. Two causes
fit: genuinely out of the tab order, which contradicts `ux/user-journeys.md`
Journey 5 outright; or reached but invisible, which is the missing stylesheet
again. Ruled out by measurement: nothing in this module sets `tabindex`, and the
orchestrator's `inert` wrapper cannot be active because `inert` blocks pointer
events and the clicks worked. **The deciding observation is one line the human
still owes: `document.activeElement` after tabbing.** Ask for it; do not guess.

## ⛔ Open holes — BOTH CLOSED BY MEASUREMENT, and what replaced them

The two holes this file used to carry are settled. Recorded so nobody re-opens
them, and so the technique that settled them is the one you use next.

1. **The cursor's resting place — CLOSED.** `cursor: stream.length` kills
   `carries the cursor position on the root` and survives both jar tests
   [measured 2026-08-29]. The cursor is genuinely pinned.
2. **The jar's `data-marked` — still open, and still Block C's lock 2.**
   Re-verify by mutation when you write it; do not trust the recorded number.

**The technique is: MUTATE THE SOURCE AND WATCH THE SUITE STAY GREEN.** A
reviewer is read-only and can only deduce; you can flip a line and know. It
found six results this session — four surviving mutants that justify locks, two
properties proven pinned.

⚠ **A mutation whose string match FAILS reads exactly like a surviving mutant.**
This happened once, silently, and the green suite was nearly recorded as a
finding. Prettier reflows code between your reading it and your patching it.
**Assert the substitution took** — `assert s.count(old) == 1` — every time. That
assert has since fired four times for real, including once where the anchor also
matched a comment.

## ⛔ WITHDRAWN — SKIP THIS SECTION; kept only as a record

⚠ **Everything below this heading is superseded and must not be acted on.** It
retains the heaviest warning markers in this file and several live-voice
imperatives, so a reader skimming for the loudest text lands here first. It is
kept because the reasoning is the record, and because deleting a superseded
finding is how the same wrong conclusion gets rediscovered. **The ruling that
withdrew it is in `PHASE-1.md`'s `(2026-08-29, wave 3 continued)` subsection —
read that, not this.**

### The withdrawn text, for the record only

⛔ **SUPERSEDED 2026-08-29. Do not implement anything in this section.** The
premise below was measured false, and was already false five weeks before the
ruling that rested on it. A mounted lens cannot receive a new embodiment at
HEAD: the session is mount-frozen, the derivation memoizes on it, and
`assertPaneCoherence` throws on any source mismatch at every excursion-arm
render. **The full measurement, the orchestrator's own canon and the ruling that
withdraws this one are in `./PHASE-1.md`'s `(2026-08-29, wave 3 continued)`
subsection** — read that before this. ⚠ Kept rather than deleted because the
reasoning is the record: it is what a careful reader concluded from this
module's code without opening `orchestrate/`, which is the lesson. ⚠ This
section stood unqualified for one increment after the supersession was recorded
elsewhere, and an `ar-4` following the trail is what caught it — a stale "MUST
carry" in a resumption prompt outranks a correction filed in another file.

**The session seed goes stale on a source change** — human ruling **2026-08-26**
(given before `1d1f45aa`, which is dated 2026-08-26 21:31 [measured]), **now
recorded** in `./PHASE-1.md`'s `(2026-08-26, wave 3)` subsection as its eighth
bullet. ⚠ It was findable **nowhere in the tree** until a context-free
validation of this file went looking — the sixth back-filled ruling this wave.

`MountedLens` renders `<Main config={config} embodiment={embodiment} />` with
**no `key`** tied to the embodiment [read: `orchestrate/index.tsx`], and
`derive-study.ts` builds a **fresh embodiment per derivation**. So typing in the
sandbox **re-renders** an open lens rather than remounting it: the `useMemo` on
`[embodiment]` picks up the new stream, the `useState` seed **does not**, and
the cursor goes stale.

⚠⚠ **This is LIVE and user-visible AT HEAD — not, as `1d1f45aa`'s body says,
"invisible … increment 1 renders only the attribute".** That was true when
written and stopped being true one commit later. The jar renders
`stream.slice(0, session.cursor)`, so a frozen seed means **the jar can never
fill**: type a comment into the sandbox and nothing reaches it. 🔍 #1 ran at
`e872d18b`, **before** the jar landed at `8b85da71`, so no human has yet looked
at this. **Expect to see it the moment you TYPE A COMMENT into the sandbox** —
NOT on opening the page. The default snippet has no comments, so an empty jar at
mount is CORRECT, and reading that as "no defect here" would be the wrong
conclusion.

Fix it **in-module**, keyed on the stream's identity. ⚠ Do **not** add a `key`
in `orchestrate/` — that was considered and rejected as a cross-module change
outside this wave. ⚠ `parsons/index.tsx` carries the identical lazy-seed shape
under a comment asserting the orchestrator remounts on a source change; the
evidence above contradicts it. **Not yours to fix**, recorded so it outlives
this handoff.

## 🔍 Checkpoints — the cadence is RULED, and #1–#3 are spent

**URL: `http://localhost:3000/spiralearn/sandbox/orchestrate/`** ⚠ **NOT
`/sandbox/orchestrate`.** ⚠ **`curl` cannot check these pages**: every path,
valid or not, returns the same client-rendered shell with **HTTP 200**. Only a
browser can tell.

Five named checkpoints, every other increment **declared no-checkpoint by the
human in advance** (human ruling 2026-08-26). **The agent declares no skips.**

| #   | When                        | Status                                        |
| --- | --------------------------- | --------------------------------------------- |
| 1   | the sandbox injection       | ✅ PASSED — outcome in `PHASE-1.md`           |
| 2   | the three regions rendering | ✅ PASSED — the human pasted the rendered DOM |
| 3   | the picker and stepper live | ✅ PASSED WITH REDIRECTS — see § What is left |
| 4   | the CSS arrangement whole   | due at the CSS increment                      |
| 5   | wave close                  | due before the record commits                 |

⚠ **🔍 fires AFTER `ar-4`, not before.** The order slipped once at #2 and was
corrected at #3, where it paid immediately: `ar-4` found `data-extent`
disagreeing with the text beside it, so the human exercised a fixed surface
rather than one that then moved.

⚠ **TWO CONSECUTIVE `ar-4`s CONCLUDED THIS LENS IS UNREACHABLE IN A BROWSER.**
Both reached for `built-in-lenses.ts`, found `spellme` correctly absent, checked
`src/pages/*-preview.tsx`, found them pointing at the deprecated tree, and
inferred there is no page. **The sandbox injection at
`spiralearn/sandbox/orchestrate/index.mdx` is what makes it reachable**, and
nothing near the roster mentions it. Expect the next reviewer to make the same
mistake, and refute it with measurement rather than argument.

**🔍 #4 must exercise three paths the default fixture cannot reach** — have the
human **type**: a leading newline (a `data-spellme-break` with nothing fallen —
the one visual `ux/wireframes.md` records as **owed and undesigned**, so this
checkpoint may settle it, and if it does the twin is updated in the same
commit); leading indentation; and a block comment carrying a line break.

⚠ **A dev server may already be running on port 3000** from another session —
reuse it, and **do not kill a peer's server.** If none is, `npm start`.

⚠ **The `[study source]` button on that page is NOT legacy** and stays (human
ruling 2026-08-30). It is the sandbox harness's own recommendation fixture.

## The traps that actually bit this wave

Every one of these cost something. The first four are new as of 2026-08-30.

- ⛔ **DO NOT COIN WORDS.** Several inventions slipped into prose in one
  session, one reaching a commit, and one was coined a SECOND time after already
  being reworded out of another file. ⚠ **The gate that caught most of them is
  GONE** (see § Measured state), so this is a habit with no automated backstop —
  which makes it matter more, not less. It is a preference about prose, not a
  lint rule: prefer an existing word to an invented one, and rewrite rather than
  reach for a dictionary.
- ⛔ **A FALSE CLAIM OF TEST COVERAGE IN SOURCE IS WORSE THAN A NAMED GAP.** A
  JSDoc here asserted a regression lock "lands with the others" when no such
  test existed; it survived two increments and one `ar-4` before a later `ar-4`
  found it. It tells the next reader to skip the check that is missing.
- ⛔ **CHECKING ONE TWIN AND GENERALIZING.** `twin-doc: user` makes BOTH `ux/`
  files canon. A comment justified thin legend content with "the twin draws no
  legend region" — true of `wireframes.md`, FALSE of `user-journeys.md`, which
  twice states what a learner takes from the legend. **This is wave 1's recorded
  failure, reproduced.**
- ⛔ **A VERIFICATION INSTRUMENT THAT MEASURES NOTHING RETURNS A PLAUSIBLE
  NUMBER.** Four instances this session: a mutation whose match silently failed;
  a cspell word-set diff against a `/tmp` baseline (`Files checked: 0`), TWICE;
  `npx eslint … | tail` reporting exit 0 while printing errors, because `$?`
  after a pipe is the tail's; and a `grep -c` over a diff whose only match was
  the diff's own `+++ b/…` header line. **Every one was caught by a positive
  control, never by re-reading the output.** Build the control into the same
  command.
- **A count stated beside the measurement that contradicts it** — reproduced
  again, inside the very commit correcting a different error. **Fix**: capture
  gate output into shell variables and interpolate them into the commit body, so
  the number and the measurement cannot disagree.
- **A ruling given, used, and never recorded** — record in the same turn.
- **An absence claim that QUOTES the token it counts falsifies itself.** Pair
  every absence grep with a positive control, and state when you used `-E`.
- **`eslint` is VACUOUS on `.css` and `.mdx`** — exits 0 while reporting the
  file ignored — so **`spellme.css` gets nothing from eslint.** Its gates are
  `npx prettier --check`, which DOES check `.css` (verified), and the 🔍
  checkpoint. ⚠ An earlier revision claimed it had "no per-file automated gate
  at all" and then named one in the very next clause.
- **`git grep -c "it.skip"` is a regex.** Use `git grep -cF "it.skip("`.
- **Node is v20.11.0 against engines `>=22.11.0`.** Both tools run. Proceed.
- ⛔ **A TOOL THAT VANISHES MID-SESSION IS A `git log` QUESTION FIRST.**
  `git log -S <tool name>` answers in one command whether the project retired it
  on purpose. Diagnosing it from `git status` and `node_modules` timestamps
  instead left a run of commits asserting a gate for a tool no longer in this
  pipeline. ⚠ The boundary is a TIMESTAMP, not a commit count: `9baca1e7` landed
  2026-08-29 23:11:33, and a commit eight minutes earlier ran that gate
  legitimately. An earlier revision named a count that straddled the line and
  was wrong about its first member. ⚠ A wave-scoped `git log` loop cannot
  surface it — a tool's removal is outside the wave's paths by construction.
- **An `ar-N` verdict is itself a claim.** Two were substantially wrong this
  session — the lens-is-unreachable finding, and "no unit test can catch" the
  live region. Re-measure a reviewer's finding before acting on it.
- Plus every trap in [`./PHASE-1.md`](./PHASE-1.md) § Traps.

## Ceremony, ARs, commit form

```text
work: software · twin-doc: <user | none> · ceremony: full (AR-3 opted out by human, 2026-08-14) · prospective
```

`user` for anything under `lenses/spellme/`; `none` for `.planning-handoffs/`-
or `spiralearn/`-only commits. ⚠ `DEV.md`'s example shows `(AR-3 n/a)`; ours
deliberately differs — do not "correct" it.

**`ar-4` fires per increment. `ar-3` fires for Block C's authored tests. `ar-5`
at the wave boundary**, scoped by `PHASE-1.md`'s campaign SHA list plus wave 3's
own. **Never pass a `model` parameter.** Paste the read-only block from
[`./PHASE1-WAVE-3-BRIEF.md`](./PHASE1-WAVE-3-BRIEF.md) § Ceremony into **every**
`ar-N` prompt, verbatim — it is prose in no other document and one omission is
the whole loss.

```text
git add <explicit paths>
git diff --staged --name-only
git commit --no-verify -m "..." -- <the same paths>
```

**The pathspec is the protection, not a clean index.** Never push, branch,
amend, `git checkout -- <file>`, `git restore`, or `git stash`. **Announce every
commit: full SHA + message.**

## Model

**Run this on the strongest tier available.** Block A is the wave's largest unit
and carries the stale-seed fix plus two checkpoints; the CSS increment is design
work against a twin. `ar-2` and `ar-5` **inherit the session model**, so a
downgrade downgrades the pre-merge review — and per
[DEV.md § Sub-model dispatch](../../DEV.md#sub-model-dispatch) a downgrade must
be **named together with that cost**, never taken silently.
