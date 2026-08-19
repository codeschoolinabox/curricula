<!-- TRANSITIONAL — the campaign's resumption point. Delete when the campaign
closes; nothing here is end-state documentation. -->
<!-- cspell:ignore socratize reenrichment dropdowns writeme parsons colorizing spellme lezer blankenate -->
<!-- cspell:ignore colour distractor distractors ledgered throughs -->
<!-- cspell:ignore firstblock glossterm parsonizer parsonize errormsg recognises -->
<!-- cspell:ignore unbuilt ugrep affordances behaviour behavioural flexbox -->
<!-- cspell:ignore normalisation unrunnable -->
<!-- cspell:ignore loosenings capitalisation enshittifying keyable unbuildable -->
<!-- cspell:ignore normalises undercounted oldd clauding zakey nocite -->
<!-- a human ruling quoted verbatim; do not translate it and do not "fix" it: -->
<!-- cspell:ignore séparé -->

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
| `fd6066b3` | **STEP 1a** — Gen-1's second root read by hand, 3073 lines across seven files; 33 rows appended as `048`–`080`; two stale claims struck.            |

⚠️ **This table is short by every campaign commit that landed between `d0b71810`
and the row above, and by everything after it.** It is not a register. Close the
gap from the command in the paragraph below, never from this table.

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
row it adds — but that explains one missing row, not the dozens the command
actually returns. Before dispatching AR-5, close the gap from the command and
never from the table:

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

In dependency order. ~~Step 0 is done; nothing below it is started.~~ — **struck
2026-08-19: STEP 1a has landed at `fd6066b3`**, and item 1's second-root re-seed
with it.
[§ START HERE](#-start-here--step-1-is-the-parsons-twin-pilot-step-2-is-the-template-amendments)
is the sole authority on what comes next; this section is an inventory, not an
order.

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
   seeded** — `parsons` (~~47 rows, repaired at `dae045f3`~~ — **80 rows as of
   `fd6066b3`**) and `writeme` (45 rows, the fidelity control). **You start at
   [§ START HERE](#-start-here--step-1-is-the-parsons-twin-pilot-step-2-is-the-template-amendments)
   at the top of this file, not here and not at § Seeding wave status.**
   ~~`writeme` owes 13 cell re-cuts~~ — **DONE at `c734b5ad`**; ~~`parsons`
   still owes its second-root re-seed~~ — **DONE at `fd6066b3`**. Remaining
   population: `blanks`, `dropdowns`, `annotate`, `variables`, `debug-props`,
   plus `_family-f.md` covering the seven evaluator-gated lenses.

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

## ⛔ START HERE — STEP 1 is the `parsons` twin pilot; STEP 2 is the template amendments

**Two units, in this order, ONE SESSION EACH. The order is ruled — it is not the
reading session's to re-pick, and neither is collapsing them into one session.**

|             | unit                                                                                                                    | why it sits here                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| ~~STEP 1a~~ | ~~the Gen-1 second-root read and the ledger append~~                                                                    | **DONE at `fd6066b3`** — 33 rows appended, `048`–`080`. Struck rather than ticked                    |
| **STEP 1b** | the [`parsons` twin pilot](#step-1--the-parsons-twin-pilot) — **YOU START HERE**                                        | it is the human's quality gate on the whole campaign, and its ledger is now widened                  |
| **STEP 2**  | [three template amendments](#step-2--three-template-amendments-then-_family-fmd), then `_family-f.md`'s inventory shape | the amendments unblock `_family-f.md` and four further ledgers. **A FOURTH is now owed — see below** |

⚠️ **STEP 1 split into two units on 2026-08-19, by human ruling, and the split
is not the reading session's to re-collapse.** Two measurements forced it: the
ledger carried **zero `G1-live` rows**, so a twin could not say what a Gen-1
learner did without inventing it; and **20** of its rows carry
`heading absent from the port`, which is a fact about a heading set and not
about a learner. The human ruled: read `public/static/parsonizer/` first, and
direct-check Gen-3 source separately. **STEP 1a discharged the first half.**

**Why the twin first** (human ruling 2026-08-19). If a twin cannot demonstrate
understanding of `parsons` — the lens with the richest measured loss and the
only ledger that is complete, gate-clean and passing the transport check — then
the migration approach itself needs rethinking, and template mechanics built
first would be built at risk. It also exercises two untested things at once: the
twin gate, and **whether a Pass-1 ledger is sufficient to write a twin from at
all**. If it is not, that is a finding about the ledger method that reshapes
STEP 2's priorities.

**The cost, stated rather than hidden:** the template stays in its known-broken
state one session longer. That is tolerable **only** because both defects are
marked ⛔ in `_TEMPLATE.md` at the point of use, so nothing can be cut against
them by accident. **Do not cut `_family-f.md` in either step.**

⚠️ **One session each, and STEP 2 starts from a fresh context.** A twin drafted
inside a context spent on transport-check shell debugging is the wrong
instrument for reading a lens, and the reverse is equally true — three
consecutive same-session fix rounds in this campaign each introduced the defect
they removed. Hand off between the steps
([AGENTS.principal.md § Handoff agency](../../AGENTS.principal.md#handoff-agency--the-agent-owns-the-call)).

### STEP 1 — the `parsons` twin pilot

⛔ **THE TWIN IS CO-AUTHORED WITH THE HUMAN. It is not drafted alone and handed
over for approval, and reading it that way produces the artifact R-7 exists to
prevent.** R-7's words:
[the twin is _"the coordination artifact between the human and the agent"_](./SPEC.md#r-7--every-lens-this-campaign-builds-owes-a-ux-twin),
and at the gate the human **_"corrects intent in place"_** — edits the document,
not a review comment on it. **The human is present from the drafting, not
summoned at the end.**

Three things follow, and a session that misses them has run the wrong shape:

- **Bring the human the beats as they form**, not a finished document. A twin
  the human first sees complete has already spent its correction budget on
  prose.
- **"Corrects intent in place" means the diff is the record.** Commit the draft
  before the gate so the corrections land as a legible diff — that diff is the
  pilot's single most valuable output, the only direct measurement of how far an
  agent's reading of a past generation drifts from the person who remembers it.
- **Ratification catches present-and-wrong; it does NOT catch absent.** The
  human can correct a beat that is on the page and cannot ratify one that was
  never drafted. That asymmetry is
  [FIDELITY-METHOD § Pass 3](./FIDELITY-METHOD.md#pass-3--the-counter-ledger)'s
  own argument one level up, and it is why the re-investigation's readers must
  be **uncontaminated by what STEP 1a already opened** — brief them on the file,
  never on the existing rows.

⚠️ **This was stated once in this file, 250 lines below, inside a paragraph that
is now struck** — so a reader arriving at § START HERE met a _gate_ and not a
co-authorship. Recorded here, where the work happens (human question,
2026-08-19).

**Human ruling 2026-08-18: twin `parsons` alone, as a pilot**, before any other
lens gets one. Two reasons, and the second is the load-bearing one:

- It is the campaign's patient and its richest measured loss — README 705→242,
  DOCS 505→199, **4 of 4 named decisions gone**, and 27 of 37 stylesheet classes
  describing a drag-and-drop board the shipped `<iframe>` never rendered. If a
  twin cannot demonstrate understanding here it cannot anywhere.
- **The twin gate has never been run.** Every mechanism published this session
  that was not exercised turned out to be broken. One pilot proves the gate
  before six sessions ride on it.

**SCOPE IT TO ONE CLAIM.** The human's ruling carries two — _"you understood the
existing behavior in past-gen lenses"_ and _"you preserved and extended it"_.
Only the first is provable at Pass 1: a Pass-1 ledger is a mechanical census
with verbatim quotations and **no dispositions** (§ Pass 1 closes none, by
contract). So the pilot twin says **what Gen-1 and Gen-2 did, every item citing
a `parsons-NNN` row id**, and does **not** say what the port will do. Saying the
second from a Pass-1 ledger is the confabulation this whole exercise exists to
catch.

⚠️ **It is NOT blocked by the three template amendments above, and an earlier
reading of the sequencing said it was** [measured 2026-08-18]. Those amendments
gate **cutting a new ledger**. The pilot cuts none: ~~`parsons`' ledger is
seeded, 47 rows~~ — **80 rows as of `fd6066b3`**, gate-clean and passing the
transport check; its Gen-1 pair, Gen-2 docs and landed Gen-3 port all exist, and
the twin can be checked against a running lens. **It can run in parallel with
the amendment work, or before it.**

⚠️ **`built-in-lenses.ts` is NOT under `lenses/`, and an earlier revision of
this bullet implied it was.** The registry is
`src/lib/study-lenses/orchestrate/lib/composing/built-in-lenses.ts`;
`src/lib/study-lenses/lenses/built-in-lenses.ts` **does not exist** [measured
2026-08-19]. `parsonsLens` is imported there and is first in the `builtInLenses`
array.

**What STEP 1a changed for the twin, and it is the whole reason the split
happened.** The ledger now carries **33 `G1-live` / `G1-dead` rows cut from a
whole-file read of Gen-1's second root** (`048`–`080`), so the twin has
something to cite for what a Gen-1 learner actually met. Read
[`ledgers/parsons.md` § Seed census](./ledgers/parsons.md) for the per-file map
and, more importantly, for the **remainders** — the read returned roughly 110
candidate affordances and STEP 1a opened 33.

### ⛔ STEP 1a's rows are weighted toward the WRAPPERS, and the re-investigation fixes it

**Human ruling 2026-08-19, in two parts — the second amends the first and the
amendment is the operative one:** _"you can re-investigate the parsons nesting
doll as we create the user-twin, this will also help you cut past the cruft and
to the value"_ … _"ou en passe séparé, ça va informer le twin-creation."_

~~The re-investigation is not a separate corrective pass — it happens inside the
twin drafting.~~ — **STRUCK. That was the reading session over-tightening a
ruling that did not say it.** What is ruled is the **purpose**: the
re-investigation **informs the twin**. The **sequencing is free** — inside the
drafting, or as its own pass feeding it. Either shape discharges it.

**What the separate-pass shape buys, since it is now explicitly allowed.** STEP
1a's own evidence argues for it: the deepest returns came from **fresh agents
reading one file end to end with no downstream framing**, and a reader who
already knows which journey beat they are serving finds the affordance that
serves it. A pass over `parsons.js` that answers only _what could the learner
do_ is the same instrument that worked, pointed at the core this time. **The
cost is one more session boundary**, and the campaign's own rule sends
design-ahead work to a fresh context anyway.

**What does NOT change either way:** the twin still cites `parsons-NNN` ids and
never re-derives an affordance, so any row the re-investigation opens must land
in the ledger **before** the twin cites it — appended, never renumbered.

⚠️ **A free sequencing is a fork, and this canon's own lesson is that every
routing failure here happened where a reader had to choose. So take a default
rather than a decision:** run the re-investigation **first, as its own pass**,
and open its rows before drafting. Both shapes are sanctioned; this one is
recommended, for the reason above and because the ordering constraint runs one
way — the twin needs rows that exist, and a row invented mid-draft to serve a
journey beat is the confabulation the whole exercise exists to catch. **A
session that prefers the other shape takes it and says so; it is not re-opening
a ruling.**

Gen-1 `parsons` is a nesting doll: `ParsonsLens.jsx` → `<iframe>` →
`parsons-iframe.html` → `parsons.js` → `lis.js`. **`parsons.js` is the core**;
everything above it is container. STEP 1a's 33 rows are distributed the wrong
way round [measured 2026-08-19]:

| source                                          | lines    | rows   |
| ----------------------------------------------- | -------- | ------ |
| `parsons-iframe.html` — the container           | 586      | 13     |
| `component.js` — a wrapper the host never loads | 574      | 5      |
| `ParsonsLens.jsx` — the shell                   | 181      | 3      |
| **`parsons.js` — THE CORE**                     | **1367** | **10** |
| `lis.js`                                        | 148      | 2      |

**21 of 33 rows come from wrappers; the core got 12.** The whole-file read of
`parsons.js` reported roughly 60 affordances and STEP 1a opened ten. **Three
live, learner- or reader-facing families were dropped and are NOT named in §
Seed census's remainders** — Prism syntax highlighting of the fragments,
unconditional HTML-escaping of every fragment, and the whole `user_actions` /
`solutionHash` action-logging surface. Open rows for them as the twin reaches
them, appending from the ledger's current last id.

**Two cross-agent questions the STEP 1a reports already settle, which its rows
left as uncertainty — verify and close them:**

- `parsons-iframe.html`'s guess history hangs on `parsonWidget.user_actions`,
  which its own reader could not confirm. `parsons.js` **does** expose it —
  `this.user_actions = []` and `this.user_actions.push(logData)` [measured
  2026-08-19]. **The 📝 Review Guesses history works.**
- `trackGuess` looks up `ul-sortable-code`, an id absent from the iframe's
  markup. `parsons.js` mints it — `'<ul id="ul-' + destinationID + '">'` — and
  the iframe passes `sortableId: 'sortable-code'` [both measured 2026-08-19].
  **The per-guess DOM snapshot really is captured.**

⚠️ **`prism/` is NOT owed a read** (human ruling 2026-08-19, recorded where it
governs:
[SPEC.md § Gen 1's second root](./SPEC.md#gen-1s-second-root--the-lens-file-is-often-only-a-shell)).
The coloring foundation is a fresh shared build. **But `parsons.js` calls
`Prism.highlightAllUnder` unguarded**, so the twin may still owe a row about
what the learner _saw_ — the affordance is in `parsons.js`, which was read; the
library behind it is not quarried.

⚠️ **Three findings from that read reshape the twin before it is drafted. Do not
re-derive them; do re-measure any number you intend to publish.**

1. **There are THREE Gen-1 parsons boards and TWO never rendered.**
   `ParsonsLens.module.css` describes a native React board (rows `045`–`047`);
   `parsonizer/parsons.css` describes a floated two-column board **overridden at
   runtime**; `parsons-iframe.html`'s flexbox board is what the learner met. A
   wire-frame drawn from "the Gen-1 stylesheet" is drawn from the wrong one —
   and this is what makes wire-frames drawable at all, since
   `parsons-iframe.html` is literal DOM.
2. **`parsons-010`'s provenance does not hold up.** Gen-2 says hint blocks were
   ported from `component.js`; the deployed host never loads that file, and the
   two paths do **opposite** things with a block comment — `component.js`
   renders it above the puzzle (`parsons-074`), the deployed host strips it
   (`parsons-059`).
3. **Gen-1 shipped the engine over learner source in an iframe with NO sandbox
   attribute at all** (`parsons-078`). The commented form beside it is strictly
   _more_ restrictive. Any Gen-2/Gen-3 that adds one is a behavioural change,
   not a like-for-like port.

**The second half of the human's 2026-08-19 ruling is STEP 1b's to execute:** a
**Gen-3 direct-check appendix**, tagged apart from the journey body, over the
**20** rows carrying `heading absent from the port`. It records an observation
about the port and **never fills a disposition** — that is Pass 2's.
`parsons-010` is the ledger's own worked warning that documentation and
behaviour migrate at different rates.

⚠️ **~~21~~ — the number is 20, and the error is this canon's own signature
defect committed inside the document that warns about it.** A whole-file
`grep -c` returns **21**; the 21st hit is the `## Rows` preamble sentence that
_names_ the annotation. Row-scoped it is **20** [measured 2026-08-19 by the
context-free validation:
`grep -n 'heading absent from the port' ledgers/parsons.md | grep -cE '^[0-9]+:\| .parsons-'`].
`_TEMPLATE.md` § Close conditions records exactly this trap — _a check embedded
in the document it checks must not match on text it itself contains_ — and it
was quoted in the same session that then published 21 twice under a
`[measured:]` tag. **Derive this set row-scoped, and never from a bare grep.**

⚠️ **Two traps measured in STEP 1a that will bite the twin session.** **(a) A
blank line between the last table row and a new one ends the table**, and
`prettier --write` then reflows the rows into prose — 12 rows were destroyed
this way and the Pass-1 gate fell from 80 to 49 before it was caught. Quotations
go in `<em>`, and **paired HTML tags inside an evidence cell end the table too**
(an opening tag alone is fine — `parsons-003` carries one). **(b) Run every gate
again AFTER `prettier --write`, not only before.**

Take it in a **fresh session** —
[AGENTS.principal.md § Handoff agency](../../AGENTS.principal.md#handoff-agency--the-agent-owns-the-call)
sends a design-ahead unit to one unconditionally, and a twin drafted from a
context full of transport-check debugging is the wrong instrument for reading a
lens.

### STEP 2 — three template amendments, then `_family-f.md`

**All three are template amendments, and standing ruling 3 binds every one of
them before a ledger is cut.** The third is the `[COPY]`/`[METHOD]` marking in §
Two human rulings below — it is easy to miss because it sits under a different
heading, and the previous two revisions of this section undercounted it.

⚠️ **THERE ARE NOW FOUR, and the heading above still says three.** Two were
added by STEP 1a (`fd6066b3`) and are recorded here rather than absorbed
silently:

- **AMENDMENT 4 — `_TEMPLATE.md` publishes no citation anchor for a
  non-markdown, non-test source.** § Columns bans line numbers and offers
  _heading_ or _test title_; a jQuery IIFE has neither. Rows `048`–`080` cite by
  **function name, method name or string literal**, extending rows `045`–`047`'s
  use of the source's own structural marker (the stylesheet's banner comments).
  Standing ruling 3 binds a ledger **cut**, not an append, so those rows are not
  blocked — but the grammar is unpublished, and the next ledger that reads a
  code root will invent its own unless this lands. It also wants a mechanical
  resolve check, for the reason § The minimum walk set already gives: _the comma
  is now caught by a grep rather than by a proofreader._
- **AMENDMENT 5 — the mutation-test procedure cannot tell a live check from a
  failed plant.** § Close conditions says _"Plant one mutation per check … and
  confirm each fires"_ — it never says confirm the mutation **landed**. Measured
  2026-08-19: three of the Pass-1 gate's eight checks first reported as DEAD,
  and all three plants had silently no-oped because `sed '0,/re/'` is a GNU
  extension BSD sed ignores. Re-planted with `awk`, **all 8 fire.** A live check
  read as dead is the same class of error as a dead check read as live, and this
  procedure produces the first as easily as the gate produced the second. The
  fix is one line: `diff` the mutant against the clean copy and require a
  non-empty result before believing the gate's silence.

⚠️ **Read "designed and measured" as DIAGNOSED and measured.** The diagnoses
below all reproduce and are worth trusting. **The fixes are sketches, not
specs** — a context-free reader measured that neither can be built from what is
written, and listed exactly what is missing. Those gaps are named inline below
rather than papered over, and closing them is design work, which is why it goes
to a fresh session rather than to another round from the author of the sketch.

1. **The Family F invocation is a census, not a floor** — `_TEMPLATE.md`, the
   8th bullet of § `_family-f.md` is the one exception, under its ⛔ banner.
   Seven `FAIL` lines exit 0; inner failures degrade to a silent `0` via
   `${r:-0}`; and `covered:` prints a number beside a `$n` that is not in scope,
   so it asserts nothing. **And a correctly seeded Pass-1 ledger is guaranteed
   red**: `trace-debugging` seeds entirely from Pass 2, contributes zero rows,
   and is the only member of seven with a real `REF` — so the floor FAILs on it
   naming three causes that are all false, which trains a seeder to ignore FAIL
   lines everywhere else. **Designed fix, measured working in both directions:**
   an `EXPECT` fifth argument making `rows=0` an assertion for declared-empty
   members and a breach for everyone else, plus a wrapper that accumulates
   status, takes the Pass-1 gate's `$n` as an argument, asserts `total == n`,
   and exits non-zero.

2. **The mutation corpus is not a sufficient amendment gate** — `_TEMPLATE.md` §
   The amendment gate, under its ⛔ banner. Loosenings pass the whole corpus
   **and** both regressions byte-identically; two reproduced here — case-folding
   and stripping the truncation ellipsis — and case-folding hides a real
   capitalisation mis-transcription. Only two corpus rows exercise `norm()` at
   all and both are single-point plants, so it catches only loosenings that
   intersect its points. **Designed fix:** pair every sanctioned modification
   with its mis-transcription — six pairs, twelve assertions, the sanctioned
   form must be SILENT and the mis-transcribed span must be DIVERGENT. A
   loosening is _defined_ as making a mis-transcription silent, so the gate has
   to contain mis-transcriptions and not only fabrications.

### What the sketches do NOT yet answer — measured by a context-free reader

Four gaps, each of which forces an implementer to invent published data. Settle
them as part of the amendment rather than in passing:

1. **The declared-empty roster is never published.** `_TEMPLATE.md` promises "a
   published zero-row roster" and no such list exists. `trace-debugging` is
   inferable; the other six are **not** — the four action lenses seed from
   lister 5 channel B alone, and the template separately mandates that a lister
   finding nothing writes `measured zero → 0`. **Is a measured-zero channel-B
   member declared-empty, or a breach?** That is the whole question and nothing
   answers it. Name the new list something other than `roster`: `MEMBERS`
   already means the seven-member acceptance set, 21 lines away.
2. **`EXPECT`'s other direction is unstated.** A declared-empty member that
   returns `rows > 0` — breach, or pass? "Measured working in both directions"
   describes the measurement, not the semantics.
3. **`transport-check.sh` has no home.** It is named twice campaign-wide, both
   times as a bare relative filename. Nothing says whether it is committed or
   scratch, or that the runnable file is the check's fence **with `firstblock`
   and `glossterm` spliced in AHEAD of the perl block** — get that order wrong
   and you get a script that runs and reports nothing.

   ✅ **The splice recipe above is now EXERCISED, not just published** [measured
   2026-08-19]. Assembled exactly as written — `set -u`, `LC_ALL=C`, the arg
   block, then `firstblock`/`glossterm`/`norm`/`unwrap_markup`, **then** the
   perl program — it reproduces `_TEMPLATE.md` § The amendment gate's published
   baseline **to the number**: `parsons` NO-CITATION = `045`,`046`,`047`,
   `rows=47 parsed=57 nocite=3`, **0 DIVERGENT**, exit 0. So the recipe is
   right, the file stays scratch, and rebuilding it costs one paste rather than
   a debugging session. **It still has no home, and that is still the gap** —
   what is closed is the doubt about whether the recipe works.

4. **The twelve fixture-pair assertions are specified and unlocated**, and one
   pair looks unbuildable. "The same span mis-transcribed" never says of what;
   modifications 1, 2 and 3 have no named anchor row. And **modification 2 is
   prettier's whitespace collapse while `norm()` ends in `s/\s+/ /g`** — so a
   whitespace-only mis-transcription normalises to the identical string and its
   "must be DIVERGENT" half can never fire. Either that pair gets a different
   definition or it gets a stated carve-out.

**Then** `_family-f.md`'s inventory shape ALONE, no rows. It is a gate and the
last two dispatches each collapsed it into a wave.

⛔ **And it cannot pass its own gates as currently defined.** A shape-only
ledger has zero rows; zero rows FAIL the Pass-1 gate (by message — that gate
`echo`s and does not exit) **and** the transport check's floor (exit 1), and the
published Family F loop emits seven FAILs while exiting 0. All three named
causes in both FAIL messages are false. **Settle this before cutting**, and note
both options carry a cost the previous revision did not state: exempting a
shape-only cut means editing two gates, which is a _fourth_ template amendment
that standing ruling 3 then also binds before the cut; and committing the shape
together with its first rows is precisely what this gate exists to prevent — the
last two dispatches each collapsed it into a wave.

### This session's commits

| SHA        | What                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| `74590c5a` | `_TEMPLATE.md` + `FIDELITY-METHOD.md` — four blockers, the per-member invocation form, five batch-fixes |
| `5c807630` | `RESUME.md` — four stale claims struck                                                                  |
| `2ed6af19` | The round-1/2 AR fix pass — six blockers                                                                |
| `e1c88969` | `SPEC.md` — **R-7 amended: the `ux/` twin gate** (human ruling 2026-08-18)                              |
| `1da6763c` | The `lead` reversion, the second false overshoot claim struck, both ⛔ markers                          |
| `9172cb72` | This resumption point re-opened on the round-3 PAUSE                                                    |
| `7c191507` | The context-free validation's fix pass — a second start list, five stale claims                         |

⚠️ **Do not read that SHA as current on trust** — it moved five times in one day
and two stale copies shipped inside the warning against exactly that. Re-derive
it every time:
`git log --oneline -1 -- .planning-handoffs/lens-migration/ledgers/_TEMPLATE.md`

### Two human rulings of 2026-08-18, and where each sits in the order

- **The `ux/` twin is the coordination artifact between human and agent**, and
  the place a port proves it understood the lens it replaces rather than
  degrading it. Landed in `SPEC.md` § R-7 at `e1c88969`: the agent drafts at
  step 0.2, **a named twin gate fires before AR-1**, the human ratifies, and the
  twin **cites ledger row ids** instead of restating them. ⚠️ **Measured
  2026-08-18: zero lenses this campaign owns have a `ux/`, and zero Tier-2
  handoffs exist — so the ruling has no carrier yet.**

  ~~**Position in the order: NO ACTION THIS SESSION.**~~ — **STRUCK 2026-08-19.
  It now says the opposite of the ruled order, and a reader landing here instead
  of at § START HERE would do nothing.** The human's 2026-08-18/19 ruling made
  the `parsons` twin the **immediate** unit, ahead of the template amendments.
  [§ START HERE](#-start-here--step-1-is-the-parsons-twin-pilot-step-2-is-the-template-amendments)
  is the sole authority on order and this paragraph defers to it.

  The reasoning below is kept because it is still right about **where the twin
  binds in general**, and only wrong about this pilot: the twin binds at **Tier
  2**, at each lens's own step 0.2, and Tier 0 / Tier 1 commits keep
  `twin-doc: none` — so seeding a ledger and planning a family owe nothing. ⚠️
  **The pilot is neither, and nothing rules it.** It writes a lens's twin with
  no lens Phase 0 running, so `twin-doc: user` on a ledger commit and `none` on
  a lens commit are both named as wrong while the pilot's own value is not named
  at all. **STEP 1b asks the human at its own step 0.2 rather than inferring
  it** — the twin ask is re-asked, never remembered
  ([DEV.md § Phase 0](../../DEV.md#phase-0-documentation-specification-before-any-code)).
  STEP 1a recorded `twin-doc: user` on the human's explicit answer this session.

- **`_TEMPLATE.md` is to be marked `[COPY]` / `[METHOD]` per section**, with the
  header rule changed to match what both seeded ledgers already do — copy the
  COPY sections, cite the METHOD sections by link. **NOT YET APPLIED, and it is
  a BLOCKER ON `_family-f.md`**: standing ruling 3 says the template is amended
  before a ledger is cut from it, and this is a template amendment. **Do it in
  the same commit group as the two ⛔ designs, before the ledger.** AR-1's "five
  of twelve sections" is its count and did not reproduce against a naive heading
  grep — **derive the partition yourself** rather than transcribing either
  number:

  ```bash
  grep -nE '^#{2,3} ' .planning-handoffs/lens-migration/ledgers/_TEMPLATE.md
  grep -n '_TEMPLATE.md#' .planning-handoffs/lens-migration/ledgers/parsons.md \
    .planning-handoffs/lens-migration/ledgers/writeme.md
  ```

  The second command is the empirical answer: **the sections both seeded ledgers
  cite by link are exactly the `[METHOD]` set.** The header rule to change is
  the HTML comment on lines 1-2, _"Copy it to `<lens>.md`, fill it, and delete
  nothing structural."_ The split into a sibling file is a deferred follow-on;
  the marking is not.

### Why round 4 goes to a fresh session

**Three consecutive rounds of same-session fixes each introduced the defect they
removed.** Round 1 shipped a check with no parse floor. Round 2 shipped a census
and called it a floor. Round 3 shipped a false overshoot claim inside the
paragraph retracting a false overshoot claim.
[AGENTS.principal.md § Handoff agency](../../AGENTS.principal.md#handoff-agency--the-agent-owns-the-call)
names this exactly — _"a learned lesson repeats as an error → hand off at the
next clean boundary"_. A fourth round would be an agent anchored to its own
design reviewing its own fix.

**A reviewer's count is a hypothesis in both directions.** Of the numbers the
two AR rounds supplied, three did not reproduce: the `<em>` predicate's "3×" is
6×; the lone-`\*` blast radius has now returned three different values from
three instruments; and AR-2's "four measured bypasses" reproduced as **two**.
All three are recorded rather than adopted — and the two that did reproduce were
fixed.

### The historical PAUSE record, kept for its reasoning

**Session of 2026-08-17. Three commits, all gated, nothing pushed. Both seeded
ledgers now pass a published transport check.** ~~`_family-f.md` CANNOT be cut
until three AR-2 blockers are resolved.~~ — **closed at `74590c5a`.**

| SHA        | What                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `3df1c727` | `_TEMPLATE.md` — seven amendments: the transport check published, five sanctioned transport modifications, `LC_ALL=C`, lister 4's third limit, the `no Gen-1 source` placement |
| `c734b5ad` | `ledgers/writeme.md` — every quotation is now its extractor's own output                                                                                                       |
| `d68eae89` | `ledgers/parsons.md` + `_TEMPLATE.md` — AR-1's re-check findings. ~~the current template SHA~~ — **superseded; re-derive it, never read it here**                              |

**Measured 2026-08-17 at `2c02e94a`:** 181 ahead of `origin/main`; 26 campaign
commits since `346cb845`; campaign dir clean. **Both numbers were already stale
when the context-free validation ran an hour later — 183 and 27.** Re-derive
everything; transcribe nothing, including from this line.

**The tree is shared and the interleave is heavy:** across `3df1c727..HEAD`,
**11 commits landed and 3 are this campaign's**. An earlier revision of this
sentence said "nine … only three are mine", which reproduces under no reading —
caught by the cold read. This is why AR-5 reviews an explicit SHA list and never
a range.

### ~~The AR-2 PAUSE — three blockers, all verified, all binding `_family-f.md`~~ — CLOSED at `74590c5a`, kept for its reasoning

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
   file** already carries the `[ "$n" -gt 0 ]` floor that catches it (**cite the
   sections, not line numbers — both of these rotted within a day: `:682`/`:729`
   were already `869`/`916` on 2026-08-18** [measured]. An earlier revision of
   this line said "ten lines above"; the correction to "47" is also wrong, and
   the real distance was 67 when last measured. This is the third rotted
   line-number citation in one paragraph, which is why § Columns bans citing by
   line number at all.)

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

   ⛔ **RULED 2026-08-18 — do NOT re-ask this.** The human chose the **published
   per-member invocation form**: citation grammar unchanged, all eight ledgers
   keep one row shape, and the accepted cost is a keyable member marker. It is
   recorded where it governs, in `_TEMPLATE.md` § `_family-f.md` is the one
   exception, 8th bullet. The rest of this item is the reasoning that produced
   the fork, kept because it is still right about the trade: A
   **member-qualified citation form** (`Gen-2 <member>/README.md § …`) changes
   the citation grammar every future ledger writes, and would make
   `_family-f.md` the only ledger whose rows do not look like the other seven's.
   A **published seven-invocation form** leaves the grammar alone and costs a
   per-member marker the check can key on.

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
`git diff`, and every cell prettier rewrote switches to `<em>`. Also: ~~**THREE
dangling `./_family-f.md` links**~~ — **FOUR, and all three line numbers
transcribed here had rotted by the next day** [measured 2026-08-18 by the
context-free validation]. `_TEMPLATE.md` § Source inventory now publishes the
derivation and forbids transcribing the list, in the same words this paragraph
disobeyed: _"Do not transcribe the site list — derive it, because an earlier
revision enumerated three sites while the same commit was adding a fourth."_ Run
it rather than reading a list:

```bash
grep -rnoE '\]\((\./)?(ledgers/)?_family-f\.md\)' \
  .planning-handoffs/lens-migration --include='*.md'
```

**Nothing gates them: markdownlint returns 0 errors over all nine documents,
because `MD051` checks fragments and not paths.** is cut, which is why they
survived — a forward reference and a broken one look identical until someone
clicks. Also: `FIDELITY-METHOD.md` § Columns still says a quotation _"transports
verbatim"_ and knows nothing of the five sanctioned modifications — the same
template/method conflict amendment 7 closed, one size larger.

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
| `dae045f3` | `ledgers/parsons.md` — the exemplar's nine leaf-level defects, repaired. 47 rows **as of that commit**; 80 since `fd6066b3`                |
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
**The live order and the live status are both
[§ START HERE](#-start-here--step-1-is-the-parsons-twin-pilot-step-2-is-the-template-amendments)**
— it is the only authority on what comes next. § Where to start is kept for the
reasoning in its struck items and defers to it.

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

⚠️ **The gap-check command in § What is committed returns FAR more than one, and
any number written here rots within a day.** It said "SEVEN" on 2026-08-15 and
returned **35** on 2026-08-18 — with **18 campaign commits appearing nowhere in
this file at all** [measured 2026-08-18 by the context-free validation]. The
table is generations behind, not "one commit behind by construction". **Close
the gap from the command and never from any number, including this sentence's.**

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

⚠️ **This list DEFERS to
[§ START HERE](#-start-here--step-1-is-the-parsons-twin-pilot-step-2-is-the-template-amendments),
which is the sole authority on order.** It is kept because items 5-9 are live
and duplicated nowhere. **Items 1 and 2 are struck rather than ticked** — a
completed item left on a start list is this canon's own recorded failure mode —
and its numbering has been re-derived twice, so trust the strikes and not the
numbers. `ledgers/parsons.md`'s nine leaf-level defects landed in `dae045f3`,
and `writeme` was cut as the second exemplar in `ec13b412` (+ `35c44796`,
`0f9257c8`). What each fix actually was lives in those commit bodies; do not
re-derive it from here.

1. ~~**Re-cut `writeme`'s 13 hand-truncated `evidence` cells.**~~ **DONE**
   (`c734b5ad`), and `parsons-031`'s equivalent with it (`d68eae89`). Struck
   rather than ticked. Both ledgers now pass the published transport check — see
   [the AR-2 PAUSE section](#-start-here--step-1-is-the-parsons-twin-pilot-step-2-is-the-template-amendments),
   which is where a fresh session starts.

2. ~~**RESOLVE THE THREE AR-2 BLOCKERS FIRST.**~~ **DONE at `74590c5a`** — four
   blockers, not three, plus five batch-fixed findings. Struck rather than
   ticked. ~~The template is now stable and `_family-f.md` can be cut from it.~~
   — **FALSE, and struck: a ROUND-3 PAUSE opened on the fix pass.** Two blockers
   are open and both are marked ⛔ in `_TEMPLATE.md` at the point of use.

3. ~~**THE TWO OPEN ⛔ DESIGNS**~~ — **FIVE open template amendments as of
   2026-08-19, and this item said two.** The two ⛔ designs (the Family F
   invocation is a census rather than a floor; the mutation corpus is not a
   sufficient amendment gate), plus the `[COPY]`/`[METHOD]` marking, plus the
   two STEP 1a added — the missing citation anchor for a code source, and the
   mutation-test procedure that cannot tell a live check from a failed plant.
   **All five are enumerated with their measurements in
   [§ START HERE](#-start-here--step-1-is-the-parsons-twin-pilot-step-2-is-the-template-amendments),
   which is the authority on order and on the count.** Under standing ruling 3
   the template is amended before a ledger is **cut** from it, so this is a rule
   and not a preference — and it is why STEP 1a, which **appended**, was not
   blocked by any of them.

4. **`_family-f.md`'s inventory shape alone**, as a probe before its rows. It is
   a **gate** — the last two dispatches each collapsed it into a wave. Its
   per-member values must be re-measured, never transcribed.

   ⚠️ **Open question the next session must settle before cutting it: a
   shape-only ledger has ZERO rows, and zero rows currently FAIL both gates** —
   the Pass-1 gate's `[ "$n" -gt 0 ]` and the transport check's floor, the
   latter exiting 1 [measured 2026-08-18 by the context-free validation]. Either
   a shape-only cut is exempt from both and says so, or the inventory shape is
   committed together with its first rows. Nothing in the canon rules it today.

5. **Wave 2 — `dropdowns`, `variables`, `debug-props`**, in parallel; none
   touches Gen-1's second root, so none waits on the unbuilt lister [measured
   2026-08-16]. ~~Two of them require a template amendment first, in its own
   commit.~~ — **neither does any more**: both amendments landed (`3df1c727`,
   `74590c5a`) and § Wave-2 traps records which. Their measured traps are in
   [§ Wave-2 traps](#wave-2-traps-measured-2026-08-16-so-the-briefs-carry-them).

6. **Then `blanks` and `annotate`** — the two that run listers 1–3
   reference-to-source.

7. **THE WIDENED INSTRUMENT IS DESIGNED, NOT BUILT, AND STILL EMBARGOED.**
   [`LISTERS-6-7-DESIGN.md`](./LISTERS-6-7-DESIGN.md) (`a4a90e0f`) carries two
   checks with nine mutation tests, and reproduces both of the false results
   that motivated it. It amends nothing yet. Before it runs it owes a **human
   ruling**, then **AR-1 and AR-2** — AR-2's structural artifact on a docs
   changeset is the workflow-shaping block being rewritten, named in the prompt.
   Every claim in it tagged `[relayed: plan-agent]` must be re-measured or
   struck. **Building it goes to a fresh session unconditionally**
   ([AGENTS.principal.md § Handoff agency](../../AGENTS.principal.md#handoff-agency--the-agent-owns-the-call)).

8. ~~**THEN re-seed `parsons`** against the widened root. The ledger still has
   **zero `G1-live` rows**~~ — **DONE at `fd6066b3`, struck rather than
   ticked.** 33 rows appended as `048`–`080` from a whole-file hand-read, not
   from the embargoed lister. The ledger carries **36** rows tagged `G1-live` or
   `G1-dead` [measured 2026-08-19, row-scoped]. **Append; never renumber** — and
   that now means never renumbering `001`–`080`. Take the next id from the
   ledger as it stands when you start, **not from a number written here**.

9. **AR-5** over the campaign SHA list — never `baseline..HEAD`, foreign commits
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

  ⚠️ **That path is the TREE, not the Gen-1 root — it is five directory levels
  short, and a worker that globs from it finds ELEVEN `parsonizer` directories**
  [measured 2026-08-19 by the context-free validation: `find … -type d -name
  parsonizer | wc -l` → **11**, including `dist/` copies SPEC says to use for
  nothing]. **The campaign has two Gen-1 roots in circulation and rules between
  them nowhere:**

  ```text
  …/0-study-lenses-committee/zz--oldd-clauding-and-context-dump/0--study-lenses--it-begins/   # FIDELITY-METHOD § 4's GEN1=
  …/0-study-lenses-committee/zz--oldd-clauding-and-context-dump/spiral-lens/                  # what Gen-2 names, quoted at parsons-021
  ```

  **Measured 2026-08-19, per file, with `diff -q`:** six of the seven files STEP
  1a read are **byte-identical** across the two. The seventh,
  `public/parsons-iframe.html`, **differs** — 8 lines, only the asset-path
  prefix (`/19-07-2025/static/…` against `/static/…`), both 586 lines. STEP 1a
  read `spiral-lens/` and its rows cite assets by **filename, not path**, so
  none depends on the divergence. **Which root the campaign means is a Gate-1
  question**, and until it is answered, name the root you read in the ledger.
  There is also a **third** tree R-7 depends on and neither declaration covers —
  `0-zakey/0-planning-and-collaborating/` holds the persona and story templates
  R-7 tells a twin session to use.

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
