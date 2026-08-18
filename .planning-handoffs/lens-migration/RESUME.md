<!-- TRANSITIONAL — the campaign's resumption point. Delete when the campaign
closes; nothing here is end-state documentation. -->
<!-- cspell:ignore socratize reenrichment dropdowns writeme parsons colorizing spellme lezer blankenate -->
<!-- cspell:ignore colour distractor distractors ledgered throughs -->
<!-- cspell:ignore firstblock glossterm parsonizer parsonize errormsg recognises -->
<!-- cspell:ignore unbuilt ugrep affordances behaviour -->
<!-- cspell:ignore normalisation unrunnable -->

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
commit.** As of 2026-08-15 the gap-check below returns **`346cb845` plus every
commit of the 2026-08-15 session** — count them from the command, not from any
number written here or in [§ Seeding wave status](#seeding-wave-status), whose
SHA table was written mid-session and is short by the commits that followed it.
A commit cannot carry its own SHA, so the commit that adds a row is never in the
row it adds — but that explains one missing row, not seven. Before dispatching
AR-5, close the gap from the command and never from the table:

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

1. **`ledgers/<lens>.md` — the seeded per-lens ledgers.** **Two of eight are
   seeded** — `parsons` (47 rows, repaired at `dae045f3`) and `writeme` (45
   rows, the fidelity control). **You start at
   [the AR-2 PAUSE section](#-start-here--the-ar-2-pause-is-closed-the-next-deliverable-is-_family-fmds-inventory-shape)
   at the top of this file, not here and not at § Seeding wave status.**
   ~~`writeme` owes 13 cell re-cuts~~ — **DONE at `c734b5ad`**; `parsons` still
   owes its second-root re-seed. Remaining population: `blanks`, `dropdowns`,
   `annotate`, `variables`, `debug-props`, plus `_family-f.md` covering the
   seven evaluator-gated lenses.

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

## ⛔ START HERE — the AR-2 PAUSE is CLOSED; the next deliverable is `_family-f.md`'s inventory shape

**Session of 2026-08-18.** The three AR-2 blockers below are **resolved at
`74590c5a`**, together with a **fourth** the review had not found and five
batch-fixed non-blocking findings. Every one was re-measured before it was
fixed, and three of the review's own numbers did not reproduce — see
[§ What the 2026-08-18 session measured](#what-the-2026-08-18-session-measured).

**The next deliverable is
[`_family-f.md`'s inventory shape ALONE](#where-to-start--in-order), no rows.**
It is a gate, and the last two dispatches each collapsed it into a wave.

| SHA        | What                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `74590c5a` | `_TEMPLATE.md` + `FIDELITY-METHOD.md` — the four blockers, the per-member invocation form, and five batch-fixes. **This is the current template SHA** |

⚠️ **Do not read that SHA as current on trust** — it has moved three times in
one day and two stale copies shipped inside the warning against exactly that.
Re-derive it every time:
`git log --oneline -1 -- .planning-handoffs/lens-migration/ledgers/_TEMPLATE.md`

### The historical PAUSE record, kept for its reasoning

**Session of 2026-08-17. Three commits, all gated, nothing pushed. Both seeded
ledgers now pass a published transport check.** ~~`_family-f.md` CANNOT be cut
until three AR-2 blockers are resolved.~~ — **closed at `74590c5a`.**

| SHA        | What                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `3df1c727` | `_TEMPLATE.md` — seven amendments: the transport check published, five sanctioned transport modifications, `LC_ALL=C`, lister 4's third limit, the `no Gen-1 source` placement |
| `c734b5ad` | `ledgers/writeme.md` — every quotation is now its extractor's own output                                                                                                       |
| `d68eae89` | `ledgers/parsons.md` + `_TEMPLATE.md` — AR-1's re-check findings. **This is the current template SHA**                                                                         |

**Measured 2026-08-17 at `2c02e94a`:** 181 ahead of `origin/main`; 26 campaign
commits since `346cb845`; campaign dir clean. **Both numbers were already stale
when the context-free validation ran an hour later — 183 and 27.** Re-derive
everything; transcribe nothing, including from this line.

**The tree is shared and the interleave is heavy:** across `3df1c727..HEAD`,
**11 commits landed and 3 are this campaign's**. An earlier revision of this
sentence said "nine … only three are mine", which reproduces under no reading —
caught by the cold read. This is why AR-5 reviews an explicit SHA list and never
a range.

### The AR-2 PAUSE — three blockers, all verified, all binding `_family-f.md`

Full report is not restated here; these are the three that block. **Each was
reproduced by measurement, not relayed.**

1. **The published transport check has NO PARSE FLOOR, and its header says
   "Silent means clean."** A citation whose filename carries a path
   (`` `lib/README.md` ``) or which omits the `§` matches neither the numerator
   nor the `$cited` denominator, so `parsed == cited` holds at `0 == 0` and the
   row passes. **A wholly fabricated citation was planted and the check said
   nothing** [measured 2026-08-17, and reproduced independently by the cold
   read]. This is the silent-failure class the same commit cites as _"already
   recorded three times over"_, and the Pass-1 gate **47 lines above in the same
   file** already carries the `[ "$n" -gt 0 ]` floor that catches it
   (`_TEMPLATE.md:682` against `:729` — an earlier revision of this line said
   "ten lines above" and was wrong).

   ⚠️ **It gates WAVE 2 as well as Family F, and the first draft of this section
   said only Family F.** `dropdowns`, `variables` and six of Family F's seven
   have **no Gen-2 side**, so for them the G2 arm is a structural no-op
   indistinguishable from a clean bill. Anyone who fixed only the
   Family-F-facing parts would cut `dropdowns` and `variables` against the same
   silence. **Fix:** an unconditional census line
   (`parsed N citations across M rows`) plus a `FAIL: zero citations parsed`
   floor; delete "Silent means clean".

2. **The check is structurally unrunnable on `_family-f.md`.** It takes ONE
   reference root; Family F is seven members with seven references, six absent.
   Per-member invocation is blocked by a second template rule — ids are
   `fam-f-NNN` in one namespace with the member named in the `affordance` cell,
   so there is no id prefix to filter on. **Two template rules collide**, and
   `_TEMPLATE.md` § `_family-f.md` is the one exception was not amended (it
   still lists seven bullets and never mentions the check). **Fix:** an eighth
   exception bullet, plus a way for the check to resolve seven references.

   ⚠️ **The two candidate designs are NOT equivalent, and choosing between them
   is a HUMAN GATE rather than an agent's pick.** The cold read stalled at
   exactly this fork, which is what it was run to find. A **member-qualified
   citation form** (`Gen-2 <member>/README.md § …`) changes the citation grammar
   every future ledger writes, and would make `_family-f.md` the only ledger
   whose rows do not look like the other seven's. A **published seven-invocation
   form** leaves the grammar alone and costs a per-member marker the check can
   key on. Put both to the human with that trade named; do not pick one and
   proceed.

3. **Amendment 7 gives Family F an instruction it cannot follow.** It rules the
   `no Gen-1 source` line goes _"once, in `## Reference inventory`"_ — but the
   Family F exception mandates **disambiguated per-member headings**
   (`## Reference inventory — step-throughs`), so that heading never exists
   there. Right for the seven single-lens ledgers, undetermined for the one it
   names as hardest. **Fix:** add "in that member's own
   `## Reference inventory — <member>` block".

**Also open, not blocking:** the claim _"the normalisation is EXACTLY the
sanctioned modifications"_ is false **in both directions** — `norm()` misses a
lone `\*` (prettier escapes it; AR-2 measured **2** Gen-2 docs carrying
single-asterisk emphasis and the cold read measured **4** with a cruder regex —
**re-measure before citing either**) and over-forgives by unescaping path-link
brackets item 5 says take no escape. AR-2's recommendation, which is the right
one: **restate it as a named approximation with its edges listed**, because an
overstated invariant in a template is worse than a stated one — the next
reviewer stops looking. Also: the `<em>` trigger is undecidable as written
(over-predicts 3×, and missed `parsons-031`); replace the content predicate with
the empirical procedure that actually found it — paste, `prettier --write`,
`git diff`, and every cell prettier rewrote switches to `<em>`. Also: **THREE
dangling `./_family-f.md` links, not the one an earlier revision of this line
claimed** — `_TEMPLATE.md:171` (introduced by `3df1c727`, and the template is
copied eight times), `SPEC.md:1295` and `FIDELITY-METHOD.md:888`, both
pre-existing [measured 2026-08-17 by the cold read, re-verified here]. **Nothing
gates them: markdownlint returns 0 errors over all nine documents, because
`MD051` checks fragments and not paths.** They resolve the moment `_family-f.md`
is cut, which is why they survived — a forward reference and a broken one look
identical until someone clicks. Also: `FIDELITY-METHOD.md` § Columns still says
a quotation _"transports verbatim"_ and knows nothing of the five sanctioned
modifications — the same template/method conflict amendment 7 closed, one size
larger.

**Two things the cold read had to guess, now stated.** The transport check's
third argument has no published value anywhere in the campaign — it is
`src/lib/study-lenses/lenses/<lens>`, the Gen-3 port root, and a cold reader
inferred it correctly but had to. And the per-member Family F values this
session measured live in the plan file
`~/.claude/plans/read-planning-handoffs-lens-migration-re-cozy-squid.md`, which
is scratch and **not** authoritative: **re-measure them, never transcribe.**

### What this session settled, struck rather than ticked

- **`writeme`'s hand-cut cells are re-cut.** The published check reports **0
  divergent, 1 unquoted** against it; at `0f9257c8` the same command reports
  **14 divergent halves across 12 rows and 11 unquoted**. The survivor is
  `writeme-019`, where `firstblock` genuinely returns empty — the check reports
  it rather than being taught to ignore it.
- **The count of 13 was NOT revised.** `0f9257c8` measured 13 under a check with
  no concept of a sanctioned modification; under the five the template now
  names, `writeme-006` is reclassified, not recounted.
- **`parsons-031` was damaged and shipped**, found by the check on its first run
  against the sibling ledger — by AR-1 and AR-2 independently. Fixed in
  `d68eae89`. The process lesson is the point: a check was published and
  immediately not run against the corpus it governs.
- **Owed to Pass 2, named rather than rediscovered:** `writeme`'s eleven
  glossary rows carry a `G3` tag with no port-side quotation. `glossterm`
  returns a bullet for 11 of the 12 terms, so it is a deferral by choice.

## What the 2026-08-18 session measured

Every AR-2 blocker reproduced. **Three of the review's own numbers did not**,
and that is the point of re-measuring rather than relaying — a reviewer's count
is a hypothesis, and this campaign has now corrected six of them.

| the review said                                                           | measured 2026-08-18                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the `<em>` trigger "over-predicts 3×, and missed `parsons-031`"           | it over-predicts **6×** on `parsons` and **6×** on `writeme`, and **is silent on `parsons-031`** — nought for one on true positives. It has no discriminating power at all |
| the lone-`\*` blast radius is **2** Gen-2 docs (a cold reader said **4**) | a third regex says **5 of 8 doc pairs**, counts 1–8 each. Three instruments, three answers — **no count is published**, the edge is named instead                          |
| Family F is "seven members with seven references, six absent"             | **one** member (`trace-debugging`) has a Gen-2 directory, and Family F has no Gen-3 port — so the check has exactly **one** reference root to resolve                      |

**Two findings the review did not have**, both reproduced:

- **A per-row zero-citation floor — the fix RESUME proposed — is breakable in
  one mutation.** A fabrication placed _beside_ a good citation leaves
  `parsed == cited == 1` and `parsed > 0`, so the invariant and the floor are
  both silent. A third, looser counter (`lead`) is what closes it, and it scores
  **0 false positives** on both clean ledgers.
- **A fourth blocker in the same section**: `G3) [ "$PORT" = NONE ] && continue`
  was a silent skip live on **100 %** of Family F's rows.

**The instrument caught its own author twice**, which is the strongest thing
that can be said for it: prettier ate the significant spaces out of the new
member marker's inline code span — the exact hazard the template documents, in
the bullet specifying the marker — and a mutation aimed at the Pass-1 gate
landed outside the row slice and returned a false 0. Both were found by
re-running, neither by re-reading.

---

## Seeding wave status

**Session of 2026-08-16. Six commits, all gated, nothing pushed. TWO of eight
ledgers are now seeded.**

| SHA        | What                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `dae045f3` | `ledgers/parsons.md` — the exemplar's nine leaf-level defects, repaired. Still 47 rows                                                     |
| `ec13b412` | `ledgers/writeme.md` — the fidelity control. **45 rows**, two measured zeros                                                               |
| `e8f81de8` | `_TEMPLATE.md` — `glossterm` stops matching by regex. ~~the current template SHA~~ — **superseded; see the table at the top of this file** |
| `a4a90e0f` | `LISTERS-6-7-DESIGN.md` — a design for Gen-1's second root. **Embargo intact; nothing built**                                              |
| `35c44796` | `ledgers/writeme.md` — AR-1's two findings                                                                                                 |
| `0f9257c8` | `ledgers/writeme.md` — the counter-check's findings, including a defect it now names rather than hides                                     |

Measured at the end of the session: `markdownlint 0`, `cspell 0`, `prettier`
clean over all **nine** campaign documents — `SPEC.md`, `FIDELITY-METHOD.md`,
this file, `LISTERS-6-7-DESIGN.md`, and
`ledgers/{_TEMPLATE,_boundary,_playbook,parsons,writeme}.md` — with the campaign
dir clean in the working tree and the register check clean at **27 names**.

⚠️ **This paragraph named `e8f81de8` and was wrong within a day — twice over,
because `3df1c727` and `d68eae89` both amended the template after it.** That is
exactly the harm it warns about, committed by the paragraph that warns about it.
**Never read a template SHA from prose, including this sentence.** Re-derive it
with the command below, every time, and cite what the command says.

The historical text, kept because the reasoning is still right and only the
value rotted: ~~The template SHA moved to `e8f81de8`.~~ Every ledger commit
cites the template SHA it was cut from, and **the last two handoffs both carried
a stale one**. Re-derive it, never transcribe it:
`git log --oneline -1 -- .planning-handoffs/lens-migration/ledgers/_TEMPLATE.md`

### ~~What this session left OPEN, in the order it should be taken~~ — SUPERSEDED

⚠️ **This list is the 2026-08-16 session's and it is NOT the order to work in.**
Its item 1 was done at `c734b5ad` and its item 2 is blocked by the AR-2 PAUSE.
**A cold reader landed here, read an imperative four-item list under a heading
that says "in the order it should be taken", and would have spent a session
re-cutting thirteen cells that were re-cut the day before** — this canon's own
recorded failure mode, found by the context-free validation of this very file.
The live order is [§ Where to start](#where-to-start--in-order), and the live
status is the
[AR-2 PAUSE section](#-start-here--the-ar-2-pause-is-closed-the-next-deliverable-is-_family-fmds-inventory-shape).

1. ~~**13 of `writeme`'s 33 heading cells are owed a re-cut**~~ — **DONE**
   (`c734b5ad`). The published transport check now reports **0 divergent** on
   `writeme` and silence on `parsons`. Retained only for the reasoning that
   produced it: `writeme-011` is the case where `firstblock` returns a complete
   **240-character** block and makes **no cut at all**, because
   `length(buf) > 240` is false at exactly 240 — which is why a `…` in a cell
   was never proof the extractor put it there.
2. ~~**`_family-f.md`'s inventory shape alone**~~ — **BLOCKED** by the three
   AR-2 blockers at the top of this file. It stays the next real deliverable
   once they are closed.
3. **Wave 2** — `dropdowns`, `variables`, `debug-props`. Briefs are ready and
   their traps are measured; see § Wave-2 traps below.
4. **AR-5** over the campaign SHA list, then the push prompt.

**`LISTERS-6-7-DESIGN.md` is a DESIGN and the embargo still stands.** It owes a
human ruling plus AR-1 and AR-2 before it amends FIDELITY-METHOD, and building
it goes to a **fresh** session unconditionally. Everything in it tagged
`[relayed: plan-agent]` must be re-measured or struck first.

### Wave-2 traps, measured 2026-08-16 so the briefs carry them

Each would produce a **false** row if the brief omitted it:

- **`variables` — `annotatedCode` is NOT dead.** It is live at
  `VariablesLens.jsx:186`, `:198`, `:410`, feeding `dangerouslySetInnerHTML`;
  only the _CSS class_ is unreferenced. That is 1 of that ledger's 3 rows. The
  template's live-sibling rule covers it — a row asserting the learner cannot
  see something they can see is worse than no row.
- **`dropdowns` — lister 4 has a false-NEGATIVE mode.**
  `styles.distractorsLabel` (`:669`) and `styles.actionButtons` (`:713`) are
  referenced **only from commented-out JSX**, which `grep -q` matches, so both
  report as live. Its distractors and reset affordances are switched off by
  commenting — invisible to channel B and uncountable by channel A.
  ~~`_TEMPLATE` § Lister 4's limits block is owed a third bullet, and under
  amend-before-cut that lands before `dropdowns.md` is cut.~~ — **the bullet
  ALREADY LANDED in `3df1c727`**, carrying this exact measurement [read:
  `_TEMPLATE.md` § Lister 4, the first of its three limits]. **No amendment is
  owed; the brief cites the template rather than re-deriving it.**
- ~~**`debug-props` — two canon documents give the `no Gen-1 source` line two
  different, mutually exclusive homes.**~~ — **RESOLVED in `3df1c727` and
  refined at `74590c5a`.** Both documents now say `## Reference inventory`, and
  the cardinality is "once per inventory block" so `_family-f.md`'s per-member
  headings are reachable. **No amendment is owed before `debug-props` is cut.**
- **`quiz` and `socratize` glossary bullets are unreachable by `glossterm` under
  any matching strategy** — they put the whole phrase inside the bold span with
  no `—` separator. Both lenses are excluded, so it bites nowhere; do not
  re-derive it as a bug.

### Two environment facts that bite every published command

- **`grep` in an agent's shell is ugrep, and the two previous accounts of this
  were each wrong in a different direction.** The function body settles it
  [measured 2026-08-17: `type grep`]:

  ```bash
  exec -a ugrep "$_cc_bin" -G --ignore-files --hidden -I --exclude-dir=.git … "$@"
  ```

  Agent `grep` is the **`claude` binary exec'd under `argv[0]=ugrep`**, running
  embedded **ugrep 7.5.0** — `grep --version` says so. `/usr/bin/grep` is a
  different program, **BSD grep 2.6.0-FreeBSD**. So the first account ("
  `/usr/bin/grep` here is ugrep") was wrong about the **path**; the second ("no
  `ugrep` binary exists on this machine at all") was wrong about **existence** —
  `command -v ugrep` is empty because it is exec'd under an aliased `argv[0]`,
  never installed, and absence from `PATH` is not absence.

  **What actually differs, all measured 2026-08-17 against `/usr/bin/grep`:**

  | behaviour                  | agent `grep`                          | `/usr/bin/grep` |
  | -------------------------- | ------------------------------------- | --------------- |
  | ERE backreference `(ab)\1` | errors — `ugrep: error at position 9` | matches         |
  | `grep -- '-' file`         | **silently returns nothing**          | matches         |
  | `grep -e '-' file`         | matches                               | matches         |
  | a path under `.gitignore`  | **silently skipped**                  | searched        |
  | `--include='*.md'`         | **honoured, no warning**              | honoured        |

  ⚠️ **`--include=` is NOT ignored, and an earlier revision said it was.** All
  three spellings return the binary's exact result set with nothing on stderr.
  **The flag that actually drops files is the injected `--ignore-files`**: in a
  directory whose `.gitignore` holds `node_modules/`, agent `grep -rl needle .`
  returns `keep.txt` alone while the binary returns `keep.txt` **and**
  `node_modules/x.txt`. A command that "died on `--include=`" was almost
  certainly dying on this — same symptom, different cause, and the fix is
  different too.

  **No command this campaign publishes is affected** [measured 2026-08-17: the
  row-count, id-extraction, closed-row and banner-scan forms all return results
  identical to the binary]. The exposure is future commands, and the two rules
  are: use `-e` rather than `--` for a pattern that looks like a flag, and call
  `/usr/bin/grep` by absolute path whenever a result must be reproducible or
  must not honour ignore-files.

- **The registered `ar-1` agent failed seven times** on harness errors, always
  as a large agent doing wide read sweeps; a trivial Haiku probe proved the
  harness was up. What worked: narrow the reviewer's input set (the dispatcher's
  call under `DEV.md` § How to Run an Adversarial Review) and fall back to a
  `general-purpose` subagent on **sonnet** carrying the AR-1 prompt structure.
  **Name the tier drop when you do it** — a weaker gate, never a skipped one.

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

### R-7 — `ux/` twins, and what it does NOT change

**Human ruling 2026-08-15: every lens this campaign builds owes a `ux/` twin.**
Full text and the menu table are
[SPEC.md § R-7](./SPEC.md#r-7--every-lens-this-campaign-builds-owes-a-ux-twin);
do not restate it from here.

⚠️ **It does not change the settings line for seeding or family work.** A ledger
seeding session and a family-planning session are **Tier 0 and Tier 1** — no
lens Phase 0 runs, so no twin is owed and `twin-doc: none` stays correct. The
ruling binds at **Tier 2**, at each lens's own step 0.2. Writing
`twin-doc: user` on a ledger commit would be as wrong as writing `none` on a
lens commit.

The two places it bites before any lens session starts: **every Tier-2 handoff
must say the twin is owed**, and **AR-1's input set at each lens grows** to the
README plus the twin.

### Six standing rulings taken 2026-08-15

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

**Items 1 and 4's first half are DONE and struck rather than ticked** — a
completed item left on a start list is this canon's own recorded failure mode.
`ledgers/parsons.md`'s nine leaf-level defects landed in `dae045f3`, and
`writeme` was cut as the second exemplar in `ec13b412` (+ `35c44796`,
`0f9257c8`). What each fix actually was lives in those commit bodies; do not
re-derive it from here.

1. ~~**Re-cut `writeme`'s 13 hand-truncated `evidence` cells.**~~ **DONE**
   (`c734b5ad`), and `parsons-031`'s equivalent with it (`d68eae89`). Struck
   rather than ticked. Both ledgers now pass the published transport check — see
   [the AR-2 PAUSE section](#-start-here--the-ar-2-pause-is-closed-the-next-deliverable-is-_family-fmds-inventory-shape),
   which is where a fresh session starts.

2. ~~**RESOLVE THE THREE AR-2 BLOCKERS FIRST.**~~ **DONE at `74590c5a`** — four
   blockers, not three, plus five batch-fixed findings. Struck rather than
   ticked. The reasoning that produced them lives in that commit body; the
   template is now stable and `_family-f.md` can be cut from it.

3. **`_family-f.md`'s inventory shape alone**, as a probe before its rows. It is
   a **gate** — the last two dispatches each collapsed it into a wave. Its
   per-member values are measured and tabulated in the plan file this session
   wrote; re-measure rather than transcribe them.

4. **Wave 2 — `dropdowns`, `variables`, `debug-props`**, in parallel; none
   touches Gen-1's second root, so none waits on the unbuilt lister [measured
   2026-08-16]. ~~Two of them require a template amendment first, in its own
   commit.~~ — **neither does any more**: both amendments landed (`3df1c727`,
   `74590c5a`) and § Wave-2 traps records which. Their measured traps are in
   [§ Wave-2 traps](#wave-2-traps-measured-2026-08-16-so-the-briefs-carry-them),
   and two of them require a **template amendment first**, in its own commit,
   under the amend-before-cut ruling.

5. **Then `blanks` and `annotate`** — the two that run listers 1–3
   reference-to-source.

6. **THE WIDENED INSTRUMENT IS DESIGNED, NOT BUILT, AND STILL EMBARGOED.**
   [`LISTERS-6-7-DESIGN.md`](./LISTERS-6-7-DESIGN.md) (`a4a90e0f`) carries two
   checks with nine mutation tests, and reproduces both of the false results
   that motivated it. It amends nothing yet. Before it runs it owes a **human
   ruling**, then **AR-1 and AR-2** — AR-2's structural artifact on a docs
   changeset is the workflow-shaping block being rewritten, named in the prompt.
   Every claim in it tagged `[relayed: plan-agent]` must be re-measured or
   struck. **Building it goes to a fresh session unconditionally**
   ([AGENTS.principal.md § Handoff agency](../../AGENTS.principal.md#handoff-agency--the-agent-owns-the-call)).

7. **THEN re-seed `parsons`** against the widened root. The ledger still has
   **zero `G1-live` rows**; that is what the second-root ruling exists to fix.
   **Append; never renumber `001`–`047`.** Take the next id from the ledger as
   it stands when you start, not from a number written here.

8. **AR-5** over the campaign SHA list — never `baseline..HEAD`, foreign commits
   interleave — then the push prompt. **Pass 2 and Pass 3 remain owed on every
   ledger**, `parsons` and `writeme` included; the Pass-1 transcription
   counter-check run on `writeme` is **not** Pass 3 and its commit body says so.

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
- ~~§ The one addition's pre-commit-hook claim~~ and ~~§ The five listers' "zero
  `.md` files" premise~~ — **both corrected in place, `83bd304b`.** The human
  ruled that correcting a measurably false sentence is not re-deriving the
  method.
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
