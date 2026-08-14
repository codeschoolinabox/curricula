<!-- TRANSITIONAL — the campaign's resumption point. Delete when the campaign
closes; nothing here is end-state documentation. -->
<!-- cspell:ignore socratize reenrichment dropdowns writeme parsons colorizing spellme lezer blankenate -->
<!-- cspell:ignore colour distractor distractors ledgered throughs -->

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

| SHA        | What                                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `92ae22e2` | The campaign canon — `SPEC.md`, `FIDELITY-METHOD.md`, `ledgers/_playbook.md`, `ledgers/_boundary.md`. 2120 insertions, no source file touched. |
| `28763bdc` | Family A's open-questions list, struck rather than rebutted.                                                                                   |
| `245555c6` | This resumption point.                                                                                                                         |
| `9c5ec699` | The transport ledger stops certifying a transport that did not happen — four module names carried into SPEC's source inventories.              |
| `633dd4b1` | `MIGRATION-PLAYBOOK.md` deleted (571 lines); four citation repairs; the sibling campaign's citation re-pointed.                                |
| `d6192465` | The four structural amendments — the walk set, the deferral carve-out, the per-ledger exemption, the register check.                           |
| `8e22a1c7` | Four quotations stop wearing emphasis the source never had, plus the round-3 cleanup list.                                                     |

**AR-5 baseline for this campaign: `6d1a811f`.** Review by **explicit SHA
list**, never `baseline..HEAD` — the tree is shared and foreign commits
interleave.

Measured 2026-08-14 at the end of step 0: `markdownlint 0`, `cspell 0`,
`prettier` clean on all **six** canon documents; lens suite **562 passed / 79
skipped / 8 todo** across 19 passed + 1 skipped files; `tsc --noEmit` 0. The
drift from the 559/18 an earlier revision published is entirely the concurrent
`spellme` session's untracked tests — foreign, not this campaign's. Re-measure
before you rely on any of it.

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

1. **`ledgers/<lens>.md` — the seeded per-lens ledgers.** Pass 1 (mechanical
   seeding) has been _run_ but not _written up_; its outputs are gone with the
   session that produced them, so re-run the listers. Population: `blanks`,
   `dropdowns`, `annotate`, `parsons`, `writeme`, `variables`, `debug-props`,
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
3. **`families/{A,C,F}.md`** — Tier-1 handoffs. **Only three**: A (occlusion), C
   (the landed cohort), F (ledger only). `annotate` and `variables` are
   singletons and get Tier-2 handoffs directly — see SPEC § The two handoff
   tiers for why, and note that their vocabulary requirements are already Gate-1
   questions 4 and 5.
4. **`handoffs/{annotate,variables}.md`** — Tier-2, direct.
5. **Context-free validation of every handoff** (invariant 12) before any is
   final.
6. **AR-5** over the SHA list, then the push prompt. Nothing is pushed.

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

- **`lenses/spellme/` and `lib/scanning/` are untracked and being built right
  now** by another session. `spellme` declares the same two Wong hues that
  already mean _correct/wrong_ in parsons and _even/odd blank parity_ in Gen-2
  blanks — three surfaces, three meanings, two hues. The coloring foundation
  cannot choose a palette without reaching that author. Carried as `bnd-009`.
- **`lib/scanning` is a third `facts.tokens` derivation** on the tier
  `lib/colorizing` is headed for. Whether three siblings should derive from one
  fact independently is a bounded-context question this campaign answers for two
  of the three.

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
