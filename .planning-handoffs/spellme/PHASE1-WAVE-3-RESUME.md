<!-- cspell:ignore spellme wireframes Rects -->

# spellme Phase 1, wave 3 — RESUME (mid-wave handoff)

You are the **orchestrator** continuing wave 3 of the `spellme` lens, in
`/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula`.

**Wave 3 is ~40% done and does NOT fan out.** It carries 🔍 sandbox checkpoints,
and 🔍-bearing increments run in the orchestrator. Do not launch a `tdd-worker`.

> Handed off mid-wave at a clean committed boundary, by the agent's own call.
> The reason is recorded rather than hidden: that session reproduced the same
> bookkeeping defect **three times** — a count stated beside the measurement
> that contradicted it — and let **three rulings it held go unrecorded** until a
> reviewer went looking. Every instance was caught by a review, never by the
> author re-reading. `AGENTS.principal.md` § Handoff agency: _"A learned lesson
> repeats as an error → hand off at the next clean boundary."_ **None of it
> reached the code**; the suite is green and every increment passed its audit.

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

**Then `./PHASE-1.md`** — and specifically its **four** dated rulings
subsections: `(2026-08-20)`, `(2026-08-25, wave 2)`, `(2026-08-26, wave 3)` and
`(2026-08-27, wave 3 continued)` [measured: `grep -cE "^### The .spellme. LENS's
rulings"` → 4]. They hold **22 rulings** between them — 4 · 5 · 8 · 5 in date
order — and **the thirteen that bind wave 3 are in the last two**. ⚠ **Count
them rather than trusting that total**, which was written as "21" and was wrong
within the hour, because a ruling was added to one subsection and the sum was
not re-derived: `grep -cE "^- \((human|orchestrator) ruling"` between the
headings. None is restated here — pointing beats copying, and a copy drifts.
Also read its `### The spellme LENS — Phase 1, wave 3 (IN PROGRESS)` section:
this wave's running record, including 🔍 #1's outcome in the human's own words.

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

[all measured 2026-08-27 22:32 EDT]

| Fact                  | Value                                                                     |
| --------------------- | ------------------------------------------------------------------------- |
| HEAD                  | `4ebf91f8` — **moves within minutes**, peers commit constantly            |
| module + handoff tree | **clean as of the commit that landed this file** — re-run it, see below   |
| scoped suite          | `Test Files 3 passed (3)` · `Tests 46 passed \| 46 skipped (92)`          |
| skips                 | `component.test.tsx` **24** · `core.test.ts` **22** (wave 4's, untouched) |
| `npx tsc --noEmit`    | **exits 0, no errors** — the strict gate is in force                      |
| un-skips left         | **19** of wave 3's 23 · **5** wave-5 tests stay skipped                   |

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

⚠ **The clean-tree row is measured over the FOUR paths in that second command**,
not the one-path form — they differ. It is also **the one row this file could
not honestly assert about itself**: while it was being written, that command
returned this file as untracked and `PHASE-1.md` as modified. It reads empty
only from the commit that landed them onward, which is why it is worded as of
that commit and why **you should re-run it rather than believe it**.

⚠ **`tsc` moved 0 → 3 → 4 → 5 → 0 during the previous session** as a peer added
and then deleted `script-axis-spike` files. **Never inherit a foreign baseline —
re-derive it.** The gate is **your directory green plus zero NEW failures
outside the foreign set**, never whole-repo green.

**The foreign-failure list has an address**, and the resume deliberately does
not copy it: [`./PHASE1-WAVE-2-BRIEF.md`](./PHASE1-WAVE-2-BRIEF.md) **§ Measured
baselines**, which carries the eight paths in a fenced block. ⚠ The wave-3 brief
cites that section as "line 127"; it is at **line 147** [measured 2026-08-27] —
a line number that had already rotted, which is why this file cites the heading
instead. ⚠ **The count is not reliably eight** — peers add and delete files
mid-session, and one run this wave saw nine, another ten [both measured
2026-08-26/27 by the previous session; the nine is also recorded in the wave-3
brief, the ten only here]. Peer WIP was **19 entries** at handoff [measured].

⚠ **The jsdom flake was met first-hand** —
`TypeError: textRange(...).getClientRects is not a function` printed during an
`orchestrate/tests/index.test.tsx` run while the file still passed. Check the
**symptom**, never an isolated green re-run.

## What is done

Eleven commits. **Do not read this list — RUN THE LOOP**, and note it takes four
paths:

```sh
git log --format='%h %s' --since='2026-08-26 00:00' -- \
  src/lib/study-lenses/lenses/spellme/ \
  spiralearn/sandbox/orchestrate/index.mdx \
  .planning-handoffs/spellme/ \
  .planning-handoffs/embody-partial-facts/
```

- **Increment 1** — the root renders, the session is seeded through
  `positionCursor`. `Zero` block's two tests.
- **The sandbox injection** — `spellme` is live at the checkpoint page, and **🔍
  #1 passed**. Its outcome is recorded verbatim in `PHASE-1.md`.
- **Increment 2** — the jar keeps set-aside elements, carrying `data-marked`.
  `Many` block's two static tests.
- Four contract amendments to `DOCS.md`/`README.md`, and the rulings record.
- **A Fable Phase-0 brief** at
  [`../embody-partial-facts/BRIEF.md`](../embody-partial-facts/BRIEF.md) — a
  separate campaign, **not yours**, context-free validated and committed.

## What is left — in ZOMBIES-over-blocks order (human ruling 2026-08-26)

**Take tests BY NAME, never by line.** Re-derive with
`grep -n "it.skip(" tests/component.test.tsx`.

⛔ **The headings below are BLOCKS, not increments — do not read them as one
commit each.** **An increment is bounded by exactly one red event** (human
ruling 2026-08-15), `DEV.md` says "one unit test = one increment of work", and
`ar-4` fires **per increment**. So a block of seventeen is **many** increments,
however many red events it produces; a test that arrives green rides into the
open increment with a one-line record of what it would have caught. Increments
are **not** prescribed here — that is deliberate, and the original brief says so
too. **Collapsing a block into one commit with one `ar-4` would be agent-side
ceremony lightening, which `AGENTS.principal.md` bans outright.**

⚠ **🔍 #2 and #3 both fall inside the DOM-contract block.** #2 is due once the
three regions render, #3 once the picker and stepper are live — whichever
increments those turn out to be. The human ruled the cadence, not the mapping.

### Block A — `Interfaces — the DOM contract`, seventeen tests

`renders the lens root` · `carries the cursor position on the root` ·
`renders the input tape` · `renders the token tape` · `renders the jar` ·
`offers ten element-kind buttons` · `renders the extent stepper` ·
`announces verdicts in a live region` ·
`leaves the element-kind verdict absent before the first claim` ·
`leaves the extent verdict absent before the first claim` ·
`leaves the one-more verdict absent before the first claim` ·
`opens the legend on first mount` · `collapses the fates panel on first mount` ·
`renders no snippet-type control of its own` ·
`hides the one-more field before the threshold is reached` ·
`hides the way past before the threshold is reached` ·
`shows the one-more field immediately at a zero threshold`

### Block B — `Interfaces — the keyboard journey`, two tests

`gives every element-kind button a reachable control` ·
`gives the extent a native stepper rather than a drag-only control`

### Block C — THREE authored regression locks, under ONE `ar-3`

All three are human-ruled (2026-08-26 and -27, recorded in `PHASE-1.md`):

1. a `{ skipAfter: 0 }` test — the way past is otherwise un-triangulated, since
   the only test naming it asserts **absence** and nothing raises the attempt
   count, so **omitting the control entirely would close the wave green**;
2. a `data-marked="false"` assertion — see § Open holes;
3. a jar-entry **text-content** assertion — the twin requires the text and
   nothing reads it.

⚠ **`ar-3` FIRES for authored tests** (human ruling 2026-08-25). The AR-3
opt-out covers un-skips only.

### Then

`spellme.css` complete + a `DOCS.md` § Modules row for it + 🔍 #4 · `ar-5` at
the wave boundary · 🔍 #5 · the wave-3 close section · the § Deferred
injection-removal obligation · **wave 4's brief, context-free validated**.

## ⛔ Open holes — each measured, each with a ruled close

1. **The `positionCursor` wiring — NARROWED, no longer wide open.** ⚠ **An
   earlier draft of this very file claimed the `cursor: 0` mutation "leaves the
   entire suite green [measured]". That was true at increment 1 and already
   FALSE when written** — it carried a number taken before increment 2 landed
   the jar. Re-measured at HEAD, the mutation **fails two tests**:
   `keeps a set-aside element in the jar` and
   `marks a comment carrying a line terminator`, because the jar renders
   `stream.slice(0, session.cursor)` and `slice(0, 0)` is empty [measured
   2026-08-27: `2 failed | 44 passed | 46 skipped (92)`]. Increment 2 closed
   that hole incidentally, without anyone noticing.

   What remains unpinned is narrower: nothing fixes where the cursor **rests**
   for a program whose first element is claimable —
   `carries the cursor position on the root` asserts `'0'` and is still skipped.
   **Verify by mutation inside Block A; do not assume.** The honest mutant is
   one that survives the jar tests, such as `cursor: stream.length` —
   `cursor: 0` no longer proves anything. `positionCursor` itself is fine; wave
   2 regression-locked it in `core.test.ts`.

2. **The jar's `data-marked` may be hardcoded.** `data-marked={true}` leaves the
   suite green [measured 2026-08-27 at `8b85da71`: `46 passed | 46 skipped
   (92)`, identical to the unchanged source]. ⚠ Given the same treatment as hole
   1 deliberately — an untagged, undated `[measured]` is exactly the shape that
   rotted there. Still true at handoff: the only commits since are doc-only. The
   **core** is covered; the component's rendering is not. Ruled: closes in Block
   C, lock 2 above.

## ⛔ A ruled fix Block A MUST carry

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

## 🔍 Checkpoints — the cadence is RULED, and #1 is spent

**URL: `http://localhost:3000/spiralearn/sandbox/orchestrate/`** ⚠ **NOT
`/sandbox/orchestrate`** — `baseUrl` is `/spiralearn/` and `routeBasePath` is
relative to it. The original brief had this inverted with a `[measured]` tag and
a human hit Page Not Found. ⚠ **`curl` cannot check these pages**: every path,
valid or not, returns the same client-rendered shell with **HTTP 200**
[measured]. Only a browser can tell.

Five named checkpoints, every other increment **declared no-checkpoint by the
human in advance** (human ruling 2026-08-26). **The agent declares no skips.**

| #   | When                        | Status                                  |
| --- | --------------------------- | --------------------------------------- |
| 1   | the sandbox injection       | ✅ **PASSED** — outcome in `PHASE-1.md` |
| 2   | the three regions rendering | **due inside Block A**                  |
| 3   | the picker and stepper live | **due inside Block A**                  |
| 4   | the CSS arrangement whole   | due at the CSS increment                |
| 5   | wave close                  | due before the record commits           |

⚠ **A dev server was already running on port 3000 from another session**,
serving this same tree. `npm start` will fail with "Something is already running
on port 3000" — that is not your problem to fix, and **do not kill a peer's
server**.

**🔍 #4 must exercise three paths the default fixture cannot reach** — the
sandbox snippet lacks leading indentation and rests the cursor on `const`, so it
shows no jar entry and no break mark at mount. Have the human **type**: a
leading newline (a `data-spellme-break` with nothing fallen — the one visual
`ux/wireframes.md` records as **owed and undesigned**, so this checkpoint may
settle it, and if it does the twin is updated in the same commit); leading
indentation; and a block comment carrying a line break.

## The traps that actually bit this wave

- **A count stated beside the measurement that contradicts it** — three times in
  one session, each inside the commit whose own gate block printed the right
  number. **Measure in the turn you write the body.** Re-reading your own body
  never caught it once.
- **A ruling given, used, and never recorded** — three times, caught by a
  reviewer following a citation. `DEV.md` § Ruling provenance: record **in the
  same turn**.
- **The three citation instruments DISAGREEING is the finding**, not a bug —
  `grep -c` and `git grep -c` count lines, the collapsed pipeline counts
  occurrences, and a parenthetical prettier wrapped mid-phrase is invisible to
  the first two. That disagreement located a real defect this wave.
- **Do not add your own coinage to a cspell header.** Two invented words were
  caught this wave, each existing nowhere else in the repo — and they are
  deliberately not quoted here, because whitelisting them to make this very
  sentence pass is the anti-pattern eating itself. Reword instead; a dictionary
  entry that exists to make your own prose pass is not a spelling fix.
- **`eslint` is VACUOUS on `.css` and `.mdx`** — exits 0 while reporting the
  file ignored [measured]. Their real gates are `cspell` + `prettier --check` (+
  `tsc` for the mdx) + the 🔍.
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
