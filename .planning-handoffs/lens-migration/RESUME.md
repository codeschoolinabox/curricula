<!-- TRANSITIONAL — the campaign's resumption point. Delete when the campaign
closes; nothing here is end-state documentation. -->
<!-- cspell:ignore socratize reenrichment dropdowns writeme parsons colorizing spellme lezer blankenate -->
<!-- cspell:ignore colour distractor distractors ledgered throughs -->
<!-- cspell:ignore firstblock glossterm parsonizer -->

# RESUME — where this campaign stands and what comes next

You are picking up a campaign whose **establishment tier is committed, whose
method is now stable, and whose execution tier is unwritten**. Read this file,
then [SPEC.md](./SPEC.md) for scope and
[FIDELITY-METHOD.md](./FIDELITY-METHOD.md) in full for the instrument. Do not
re-derive either; they cost four adversarial review rounds to get right and the
rulings inside them are the human's, not negotiable by an agent.

## Read this first, because it is the thing most likely to bite you

**This canon failed its own instrument four times, in the same way each time.**
AR-1 ran four rounds and returned PAUSE on all four. Two of round 2's three
blockers were **introduced by round 1's fixes**. The pattern is specific and you
will reproduce it if you are not watching for it:

> A correction is written as a new paragraph, and **the corrected text is left
> standing beside it.** The document then says two opposite things, and a reader
> working from the list rather than the prose gets the wrong one.

That is how a ruled question stayed on an open-questions list, how a withdrawn
count survived in two documents of three, and how a recipient fix landed in one
file of two. **Strike, do not rebut.** When something is ruled, remove it from
wherever it was asked and leave a pointer to the ruling.

The second pattern, equally reproducible:

> A row or claim that is **present, well-written, and wrong about its own
> evidence** — an `[measured:]` tag naming an instrument whose output
> contradicts it, a `revive` cleared by a heading grep, a coordination row
> naming a lens `scanning` when the lens is `spellme` and `lib/scanning` is a
> library.

AR-1's own process note, which is correct and cheap: **after any fix pass,
verify the diff — every sentence the fix touched, plus every sentence that cites
it.** That alone would have caught three of round 3's blockers in minutes.

Third, and it applies to reviewers too: **a reviewer's count is a hypothesis.**
Of the reviewer-supplied numbers accepted this campaign, three did not reproduce
and were corrected rather than adopted. Re-measure before you write.

## What is committed

| SHA        | What                                                                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `92ae22e2` | The campaign canon — `SPEC.md`, `FIDELITY-METHOD.md`, `ledgers/_playbook.md`, `ledgers/_boundary.md`. 2120 insertions, no source file touched.      |
| `28763bdc` | Family A's open-questions list, struck rather than rebutted.                                                                                        |
| `245555c6` | This resumption point.                                                                                                                              |
| `9c5ec699` | The transport ledger stops certifying a transport that did not happen — four module names carried into SPEC's source inventories.                   |
| `633dd4b1` | `MIGRATION-PLAYBOOK.md` deleted (571 lines); four citation repairs; the sibling campaign's citation re-pointed.                                     |
| `d6192465` | The four structural amendments — the walk set, the deferral carve-out, the per-ledger exemption, the register check.                                |
| `8e22a1c7` | Four quotations stop wearing emphasis the source never had, plus the round-3 cleanup list.                                                          |
| `f7ea553f` | AR-2's fix pass — the resolve helper, eight heading classes, one open-row definition, and `ledgers/_TEMPLATE.md`.                                   |
| `f28fe23e` | AR-5's fix pass — the register check stops matching itself, `bnd-009` stops misquoting `spellme`, the gate command stops linting zero files.        |
| `cb5eeedc` | The context-free validation's fix pass — the register check runs verbatim, the `spellme` correction reaches its third file, Tier-1 is two families. |
| `d0b71810` | The launch prompt's cold read — `instruments` corrected for two ledgers; the worked-row ids and Family F's shape ruled.                             |

**AR-5 baseline for this campaign: `6d1a811f`.** Review by **explicit SHA
list**, never `baseline..HEAD` — the tree is shared and foreign commits
interleave. Five landed between this session's own commits.

⚠️ **Nothing here is pushed, and "unpushed" is far bigger than this campaign.**
`main` has **no upstream configured**, so `git log @{u}..HEAD` returns 0 and
reads as clean. Measured against the remote, local `main` is **83 commits ahead
of `origin/main`**, of which **12 are this campaign's**; the rest belong to
other campaigns and concurrent sessions [measured 2026-08-14: `git rev-list
--count origin/main..HEAD`]. **A push publishes all 83.** Whoever holds that
gate is deciding for every campaign in the tree, not just this one.

⚠️ **This table and the 83 above are both stale, and the gap is bigger than one
commit.** The gap-check below returns **seven** rows as of 2026-08-15 —
`346cb845` plus the six in [§ Seeding wave status](#seeding-wave-status), which
is the current state and supersedes the numbers in this section. A commit cannot
carry its own SHA, so the commit that adds a row is never in the row it adds —
but that explains one missing row, not seven. Before dispatching AR-5, close the
gap from the command and never from the table:

```bash
git log --oneline d0b71810..HEAD -- .planning-handoffs/lens-migration/
```

Anything it returns is a campaign commit missing from the list above.

**Do not filter by the settings line.** `ceremony: full (AR-3, AR-4 n/a)` is the
docs-only-campaign convention, not this campaign's signature — it matches **19**
commits ahead of `origin/main`, only 9 of them this session's; the other 10 are
the epistemology-strip campaign's [measured 2026-08-14]. **Touching
`.planning-handoffs/lens-migration/` is the discriminator**, and it suffices:
`633dd4b1` also reached the deleted playbook under `src/` and the sibling
campaign's SPEC, but it touched three files here too. The one time this check
was skipped, AR-5 was nearly dispatched without the commit that had redefined
what a ledger row is.

Measured 2026-08-14 at the end of step 0: `markdownlint 0`, `cspell 0`,
`prettier` clean on all **six** canon documents; lens suite **562 passed / 82
skipped / 8 todo** across 19 passed + 1 skipped files [measured: `npx vitest run
src/lib/study-lenses/lenses`]; `tsc --noEmit` 0. The drift from the 559/18 an
earlier revision published is entirely the concurrent `spellme` session's
untracked tests — foreign, not this campaign's. Re-measure before you rely on
any of it.

## What is not written yet

In dependency order. Step 0 is done; nothing below it is started.

**Step 0 is done.** The four structural findings that changed what a ledger row
_is_ have landed, so the ledgers below can be seeded against a stable method:

| finding                    | where it now lives                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| minimum walk set           | [FIDELITY-METHOD.md § The minimum walk set](./FIDELITY-METHOD.md#the-minimum-walk-set) — keyed to **provenance**, not disposition                 |
| `restore — DEFERRED`       | [FIDELITY-METHOD.md § At AR-5](./FIDELITY-METHOD.md#at-ar-5) — a two-part owner+ruling check, plus the `deferred` gate value                      |
| narrative-ledger exemption | [FIDELITY-METHOD.md § The two narrative ledgers, per ledger](./FIDELITY-METHOD.md#the-two-narrative-ledgers-per-ledger) — per ledger, not blanket |
| the register               | [SPEC.md § The register check](./SPEC.md#the-register-check) — a runnable command, not a sentence                                                 |

**The playbook is retired.** Deleted 2026-08-14; its transport ledger was
corrected first, because it certified four module names as transported that
measurably were not. Both acts are recorded in § What is committed. Nothing here
is owed.

1. **`ledgers/<lens>.md` — the seeded per-lens ledgers.** **One of eight is
   seeded and it needs re-seeding** — see
   [§ Seeding wave status](#seeding-wave-status), which supersedes this item and
   is where you start. Remaining population: `blanks`, `dropdowns`, `annotate`,
   `writeme`, `variables`, `debug-props`, plus `_family-f.md` covering the seven
   evaluator-gated lenses.

   **The lister question is ruled (human, 2026-08-14) — do not re-ask it.**
   Which listers run on which ledger is now stated in
   [FIDELITY-METHOD.md § The five listers](./FIDELITY-METHOD.md#the-five-listers),
   and each ledger's coverage is carried in SPEC § Roll-up's `instruments`
   column so a thin ledger reads as an instrument limit rather than as a clean
   bill of health. In short: `blanks` and `annotate` run listers 1–3
   Gen-2-reference against Gen-1-source; `dropdowns`, `variables` and six of
   Family F's seven seed from listers 4 and 5 alone, and the design work that
   cannot surface is closed by follow-on DDD sessions.

2. **`handoffs/foundation.md`** — the coloring foundation. This is the keystone
   and it gates most of the rest.
3. **`families/{A,C}.md`** — Tier-1 handoffs. **Only two**, matching
   [SPEC.md § The two handoff tiers](./SPEC.md#the-two-handoff-tiers): A
   (occlusion) and C (the landed cohort). **Family F gets no handoff at all** —
   its deliverable is a completed ledger and nothing else, so there is no
   `families/F.md` to write. `annotate` and `variables` are singletons and get
   Tier-2 handoffs directly, and their vocabulary requirements are already
   Gate-1 questions 4 and 5. **Five handoffs in total**: foundation, A, C,
   annotate, variables.
4. **`handoffs/{annotate,variables}.md`** — Tier-2, direct.
5. **Context-free validation of every handoff** (invariant 12) before any is
   final.
6. **AR-5** over the SHA list, then the push prompt. Nothing is pushed.

## Seeding wave status

**Session of 2026-08-15. Five commits, all gated, nothing pushed.** Start here.

| SHA        | What                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------- |
| `68a99d14` | `_TEMPLATE.md` — `## Source inventory`, the no-Gen-2 `else` branch, two published extractors |
| `1393ec0e` | `_TEMPLATE.md` — the Pass-1 gate stops counting the prose that describes it                  |
| `c0bd56a6` | `ledgers/parsons.md` — the first ledger. 47 rows, zero dispositions                          |
| `df6bb319` | `_TEMPLATE.md` — the gate survives mutation tests on all six checks; Gen-1 grows a root      |
| `25ad7ab1` | `SPEC.md` — § The three generations and § Paths record the second Gen-1 root                 |

Measured at the end of the session: `markdownlint 0`, `cspell 0`, `prettier`
clean over all **seven** campaign documents — `SPEC.md`, `FIDELITY-METHOD.md`,
this file, and `ledgers/{_TEMPLATE,_boundary,_playbook,parsons}.md` — with the
campaign dir clean in the working tree and the register check clean at 27 names.

**Do not trust any commit count printed here.** HEAD moved four times during
this session and twice more during its own handoff validation. Run the numbers
rather than reading them:

```bash
git rev-list --count origin/main..HEAD                              # NEVER @{u}..HEAD
git rev-list --count origin/main..68a99d14^                         # before this session
git log --oneline 68a99d14^..HEAD -- .planning-handoffs/lens-migration/   # this session's
git log --oneline 68a99d14^..HEAD                                   # everything, incl. foreign
```

For calibration only, and stale by the time you read it: **88** before the
session, **6** campaign commits, **3** foreign, **97** total [all measured
2026-08-15 at `1c6736c9`]. An earlier revision of this paragraph published "94 …
5 this session's and 2 foreign" — wrong on the count of my own commits, and
wrong in a way no reader could have caught without re-running it.

⚠️ **The gap-check command in § What is committed returns SEVEN commits, not
one.** `346cb845` is a real campaign commit missing from that table as well as
this session's six, so the table is **two** generations behind, not "one commit
behind by construction". Close the gap from the command, never from the table.

### Six standing rulings this session took

1. **`affordance` is a sentence bound to its quote.** `evidence` carries the
   cited section's first block, extracted by the published `firstblock`. The
   binding rule: **the sentence may contain no claim its quote does not
   support.**
2. **Full census, not diff-only.** Every reference heading, named decision and
   glossary term opens a row — survivors included, disposition empty.
3. **The template is amended before a ledger is cut**, and every ledger commit
   cites the template SHA it was cut from.
4. **Exemplar → gate → fan out**, rather than fanning eight at once.
5. **Gen-1 source is TWO roots** — `src/lenses/` and `public/static/`. Recorded
   in `SPEC.md` § Gen 1's second root and `_TEMPLATE.md` § The Gen-1 quarry
   root.
6. **`writeme` is the second exemplar**, before the remaining six. It is the
   fidelity control and it exercises the measured-zero path `parsons` cannot.

### Where to start — in order

1. **Fix `ledgers/parsons.md`.** AR-1 and AR-2 both returned PAUSE on
   `c0bd56a6`; the template-level findings are fixed in `df6bb319`, the
   **leaf-level ones are not**. Open, all reproduced against source:
   - the § Rows preamble certifies that every quotation came from `firstblock`.
     **False for 14 of 47 rows** — the 11 glossary cells were hand-cut at the
     source's line wrap, and the 3 cluster rows cite no heading. Re-derive the
     glossary cells with `glossterm` (now published in the template).
   - `absent from the port` appears ~20 times undefined. The template now
     defines it as a statement about the heading set only; apply the wording.
   - the `G3` exact-match rule is stated in the ledger; it now lives in the
     template. Cite, do not restate.
   - **`parsons-047` is wrong about its own evidence.** `.fallbackContainer` is
     live (`ParsonsLens.jsx:52`, 3 CSS defs), so a styled fallback **does**
     render; and `codeContainer` is the in-page parsonizer integration layer,
     not fallback styling. **Rewrite it as a statement about the stylesheet,
     exactly as `parsons-045` below** — do **not** split it. One row per cluster
     is the Pass-1 rule and splitting is a Pass-2 act; an earlier revision of
     this bullet said "split the row", which no Pass-1 session may do.
   - **`parsons-045` performs the reading it says it defers** and covers 4 of
     its 20 classes. Rewrite as a statement about the stylesheet, per the
     template's new cluster-row rule.
   - **`parsons-011`** asserts the learner is not told the distractor count; the
     source says the collapsed summary is spoiler-free and the count **is**
     revealed on expand.
   - **`parsons-012`** says "session"; `parsons-027` in the same ledger quotes
     "Cross-mount persistence … or history". Use "since this lens mounted".
   - **two evidence cells carry authored judgments** the template now fences to
     three annotation classes. **Strip these two phrases**: `parsons-014`'s "and
     mandatory under SPEC § R-5", and `parsons-021`'s "⚠️ `DEV.md` bans status
     content from end-state docs, so this row's disposition is a policy
     question, not a loss finding". Both pre-argue a disposition. **The five
     "candidate successor / candidate rename" notes stay** — `parsons-001`,
     `-005`, `-029`, `-030`, `-031` — they are a permitted annotation class.
     _(An earlier revision of this bullet said "four cells", listed `-014` and
     `-021` among the ones that are fine, and counted three candidate-successor
     notes. All three numbers were wrong and the sentence contradicted itself.)_
   - the whole-file `UNSETTLED` count in `parsons.md:366` is **51**, not 50.
   - **`parsons.md`'s § Reference inventory still certifies "instruments
     **1–5**, and all five **ran**"** while the ledger carries **zero `G1-live`
     rows**. That sentence is the reason the widened-root ruling exists and it
     must not survive the fix pass: until the second root has an instrument
     (item 2), the honest form names what ran over `src/lenses/` and states that
     the engines were not reached.
   - **after any of the above, re-run the Pass-1 gate and update
     `### Seed census`.** The gate asserts `rows == CENSUS`, so a changed row
     count fails it until the census total and the affected instrument row are
     edited too.
2. **BUILD THE WIDENED INSTRUMENT — this is design work, not a re-run.** The
   second Gen-1 root is a ruled scope with **no runnable lister**, and pointing
   the existing ones at it produces false numbers rather than no numbers
   [measured 2026-08-15 against `public/static/parsonizer/parsons.js`, a
   1367-line jQuery IIFE]:
   - **lister 4 can never succeed there.** It tests for `styles.<name>`; the
     file has **0** such references and names classes as string literals
     (`'sortable-code'`). Its stylesheet `parsonizer/parsons.css` holds 19 class
     definitions the published command would call 19 orphans — all false.
   - **lister 5 channel B returns a vacuous zero.** It greps
     `// export const render|execute|renderConfig` and `{false &&` — React
     idioms a jQuery file cannot contain.

   So this step needs a class-reference test that reads string literals and
   `class="…"` attributes, and a switched-off-code test for pre-module
   JavaScript. Files in scope for `parsons`: `parsonizer/parsons.js` 1367,
   `component.js` 574, `lis.js` 148, `parsons.css` (19 class defs),
   `parsonize-selection.js`, and `public/parsons-iframe.html` 586 [all measured
   2026-08-15]. **Do not skip to seeding.** § Failure modes' whole point is that
   a number from an inapplicable instrument is worse than an admitted gap.

   > **Two documents claimed `_TEMPLATE.md` already carried a widened orphan
   > command. It does not** — every `GEN1=` in the campaign ends `/src/lenses`
   > [measured 2026-08-15: `grep -n 'GEN1='` across all seven documents]. Struck
   > here and in `SPEC.md` rather than left standing.

3. **THEN re-seed `parsons`** with that instrument. The ledger currently has
   **zero `G1-live` rows**; that is what the ruling exists to fix. **Append;
   never renumber `001`–`047`.** Take the next id from the ledger as it stands
   when you start — item 1 may itself have appended — not from a number written
   here.
4. **Cut `writeme`** as the second exemplar, then **`_family-f.md`'s inventory
   shape alone** as a probe before its rows.
5. **Fan out the remaining six** — `blanks`, `annotate`, `dropdowns`,
   `variables`, `debug-props`, and Family F's rows.
6. **AR-5** over the SHA list above plus whatever this session adds, then the
   push prompt.

### Owed to FIDELITY-METHOD, deliberately not edited from here

RESUME says do not re-derive the method, so these are reported rather than
fixed. All four reproduced [measured 2026-08-15]:

- **§ 4's "the orphan counts are a lower bound" runs both ways.** Computed
  access makes false **positives** possible — `styles[status]` at
  `BlanksLens.jsx:735`, `styles[feedback.type]` at `WritemeLens.jsx:710` — and
  kebab-case classes are unreachable by `styles.<name>` at all (`ParsonsLens`
  has six).
- **§ At AR-5's four-part open-row definition has no clause for an empty
  `disposition`, `gate`, `evidence` or `affordance`.** A row with only an id and
  a resolving `discharged by` counts as closed — and Pass-1 ledgers make that
  the starting shape of every row.
- **§ The one addition — `revive` says the pre-commit hook would block an MD024
  collision. It would not.** The hook runs `prettier --write` and no linter
  [read: `.husky/pre-commit` → `npx lint-staged`; `package.json` `lint-staged`
  `*.md`]. Run markdownlint yourself, path-scoped, before every commit.
- **§ 4's orphan command is written for the `src/lenses/` pair** and does not
  reach the second Gen-1 root, and **no widened form exists anywhere** — every
  `GEN1=` in the campaign ends `/src/lenses` [measured 2026-08-15: `grep -n
  'GEN1='` across all seven documents]. An earlier revision of this line said
  the template carried one. Building it is item 2 above.

A fourth, for Gate 1 rather than the method: SPEC § Roll-up's `instruments`
column cannot express a **third** reason for thinness — _unfinished_. A one-cell
`pass` column (`1` · `2` · `3` · `closed`) would close it.

## AR-1 rounds 3 and 4 — what is still open

**The four structural findings are LANDED** (2026-08-14) — § What is not written
yet carries the table of where each went. Struck from this list rather than
ticked, because a ruled item left on an open list is this canon's own recorded
failure mode.

**Round 4 ran on the fix for rounds 1–3 and returned PAUSE with five blockers.
All five were verified against source and all five reproduced.** Two were the
fix itself committing the defect it was written to prevent — both worked rows
shipped unsupported negatives in `found`. That is recorded in
[FIDELITY-METHOD.md § Failure modes](./FIDELITY-METHOD.md#failure-modes-this-method-has-already-hit),
where it belongs, and it is the strongest available argument for the walk set
being mechanical rather than a standard of care.

**Still open — routing, none of it structural:**

- **Gate-1 questions 4 and 5 are requirements, not rulings.** They are phrased
  as questions a human answers; they are analysis the foundation's Phase 0
  performs. Restate them inside SPEC § The coloring foundation, where F0 will
  read them, and leave Gate 1 holding notice rather than a decision it cannot
  make.
- **F0's "four-consumer conformance sketch" is never enumerated**, while § The
  coloring foundation calls the orchestrator's editor "a third colorization
  consumer". Three producers, three consumers, four-consumer sketch — pick one
  vocabulary and count once.

_(`_boundary.md`'s two routing items are closed: SPEC § Open questions for Gate
1 now puts owner-naming for `bnd-003`, `bnd-004` and `bnd-009` on Gate 1's
agenda explicitly.)_

**Still open — cleanup, none of it changing a disposition or a gate:**

- `lenses/README.md § The roster` names "the run lens" while the register's row
  is `run-javascript`. **Deliberately not taken here**: that file is an
  end-state module doc under `src/`, which `DEV.md`'s end-state rules do bind,
  and editing it from a campaign commit is scope creep. **Owner: unassigned** —
  it needs a session that owns the lenses region.
- **`src/lib/study-lenses/MVP-ROADMAP.md` carries a claim this campaign's
  deletion made false**: it says the tree-wide roadmap was deleted and "the only
  surviving strategy doc — `lenses/MIGRATION-PLAYBOOK.md` — covers `lenses/`
  alone". That file is now gone. Same disposition and same reason as the item
  above — an end-state doc under `src/`, **owner: unassigned**. (A concurrent
  session has an uncommitted deletion of that file in the working tree; that is
  theirs, does not repair the committed state, and is not something this
  campaign relies on.)
- Everything else on the round-3 cleanup list landed in the quotation-fidelity
  commit; see that commit's body for the enumeration.

## Operating instructions

- **Read the governance chain first**: `CLAUDE.md` at the repo root routes you
  to `AGENTS.md` or `AGENTS.principal.md` by model id, then `DEV.md`. Router
  text reaching a spawned subagent has been observed both present and absent —
  read it explicitly, do not assume.
- **Both trees must be in scope.** `0-curricula` **and**
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-study-lenses-committee/`.
  Every Gen-1 reading depends on the second; without it a worker reports BLOCKED
  on its first tool call.
- **The tree is shared with a concurrent session.** HEAD moved twice during the
  session that wrote this. **Commit by explicit pathspec** — a hook enforces
  `git commit … -- <paths>`, and a pathspec commit takes _working-tree_ content,
  so run `git status --short -- <paths>` first and confirm every listed change
  is yours.
- **Run all four gates before every commit, and each one needs your paths:**

  ```bash
  npx prettier --write "$FILES"        # FIRST -- it reflows
  npx markdownlint-cli2 --no-globs "$FILES"
  npx cspell --words-only --unique "$FILES"
  npx prettier --check "$FILES"
  npx tsc --noEmit                      # only if you touched source
  ```

  ⚠️ **`npx markdownlint-cli2 --no-globs` with no path argument lints ZERO files
  and prints `Summary: 0 error(s)`** — a green report over nothing [measured
  2026-08-14: `Linting: 0 file(s)`]. `--no-globs` disables the config's
  `**/*.md`, so the paths are not optional. The other two fail loudly when run
  bare, which is why this is the one that gets copied forward broken; an earlier
  revision of this very bullet shipped the no-op form. Repo-wide is
  `npm run lint:md`.

  Prettier runs first because it reflows, which invalidates line-number
  citations; it is also enforced at pre-commit, and it was missed for three AR
  rounds.

- **cspell**: diff the unknown-word _set_ (`npx cspell --words-only --unique`),
  never grep for words you expect. Add genuinely-new terms to an inline
  `<!-- cspell:ignore … -->` at the top of the file — the house pattern, see
  `lenses/parsons/README.md`.
- **`ceremony` is the human's and you never state it.** `twin-doc` is asked at
  each lens's own Phase 0 step 0.2; record `none` if no answer comes. The commit
  body carries the settings line.
- **Model:** design work (the foundation handoff, the family handoffs) wants the
  strongest tier available — `ar-2` and `ar-5` inherit whatever you run on.
  Ledger seeding is mechanical and can ride cheaper.

## Two live coordination facts

- **`lenses/spellme/` and `lib/scanning/` are now COMMITTED** by the concurrent
  session — 9 and 5 tracked files [measured 2026-08-14: `git ls-files`]. Earlier
  revisions of this file called them untracked and said `spellme` "declares the
  same two Wong hues"; **both statements are false and the second one inverts
  the fact.** `spellme` names two semantic roles and binds **no hue to either**,
  deferring the pair to this package precisely because parsons and Gen-2 blanks
  already overload it [read: `spellme/README.md` — _"The roles are named here;
  the hues are not"_ (human ruling 2026-08-14)]. So the coloring foundation does
  **not** owe that author a blocking coordination round — it has already been
  handed the decision. Full row: `bnd-009`.
- **`lib/scanning` is a third `facts.tokens` derivation** on the tier
  `lib/colorizing` is headed for, and it is now committed beside
  `lib/classifying`. Whether three siblings should derive from one fact
  independently is a bounded-context question this campaign answers for two of
  the three.

## The one thing not to lose

The campaign exists because three generations of lenses lost pedagogy nobody
wrote down, and because the instrument that would have caught it did not exist.
It now exists, it has been tested against its own author three times, and it
found real defects every time.

**Its value is entirely in being run rather than cited.** A ledger that is
filled in from recollection, a `walked` cell naming sections that were grepped
rather than read, a `found` cell asserting an unsupported negative — each of
those produces a document that looks like an audit and licenses exactly the
confidence that lost the pedagogy in the first place.
