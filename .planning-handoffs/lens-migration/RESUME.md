<!-- TRANSITIONAL — the campaign's resumption point. Delete when the campaign
closes; nothing here is end-state documentation. -->
<!-- cspell:ignore socratize reenrichment dropdowns writeme parsons colorizing spellme lezer blankenate -->
<!-- cspell:ignore colour distractor distractors ledgered throughs -->

# RESUME — where this campaign stands and what comes next

You are picking up a campaign whose **establishment tier is committed and whose
execution tier is unwritten**. Read this file, then [SPEC.md](./SPEC.md) for
scope and [FIDELITY-METHOD.md](./FIDELITY-METHOD.md) in full for the instrument.
Do not re-derive either; they cost three adversarial review rounds to get right
and the rulings inside them are the human's, not negotiable by an agent.

## Read this first, because it is the thing most likely to bite you

**This canon failed its own instrument three times, in the same way each time.**
AR-1 ran three rounds and returned PAUSE on all three. Two of round 2's three
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

**AR-5 baseline for this campaign: `6d1a811f`.** Review by **explicit SHA
list**, never `baseline..HEAD` — the tree is shared and foreign commits
interleave.

Measured at the last check: `markdownlint 0`, `cspell 0`, `prettier` clean on
all four documents; lens suite unchanged at **559 passed / 8 todo** across 18
files; `tsc --noEmit` 0. Re-measure before you rely on any of it.

## What is not written yet

In dependency order. None of it is started.

**Step 0 comes before the ledgers, and it is not optional.** The four structural
findings in § AR-1 round 3's outstanding findings change what a ledger row _is_
— the minimum walk set, the `restore — DEFERRED` carve-out, the narrative-ledger
exemption, and the register check. Land them in `SPEC.md` and
`FIDELITY-METHOD.md` first. Row ids are declared stable forever, so amending the
method after eight ledgers exist means either re-cutting rows or living with two
generations of them.

**And retire the playbook.** `src/lib/study-lenses/lenses/MIGRATION-PLAYBOOK.md`
is **still present and still tracked at 571 lines** [measured: `git ls-files`,
`wc -l`], while `SPEC.md`'s third paragraph asserts in the present tense that it
"supersedes and retires" it and `_playbook.md` says it "retires now". It still
tells agents `built-in-lenses.ts` is empty. The transport ledger is written; the
deletion is not done. A live stale control panel is the hazard the campaign
opens by naming, and it is currently the campaign's own.

1. **`ledgers/<lens>.md` — the seeded per-lens ledgers.** Pass 1 (mechanical
   seeding) has been _run_ but not _written up_; its outputs are gone with the
   session that produced them, so re-run the listers. Population: `blanks`,
   `dropdowns`, `annotate`, `parsons`, `writeme`, `variables`, `debug-props`,
   plus `_family-f.md` covering the seven evaluator-gated lenses.

   ⚠️ **Three of the five listers cannot run as written on four of the seven
   ledgers, and resolving that is a human ruling, not an agent's call** — it
   decides what a row _is_, and row ids are stable forever. Listers 1, 2 and 3
   are **comparative by construction** ("diff the heading sets", "count `## Why`
   in the reference versus the port"). The population:

   | Ledger                              | Gen-1 | Gen-2 docs | Gen-3 port | Listers 1–3                 |
   | ----------------------------------- | ----- | ---------- | ---------- | --------------------------- |
   | `parsons`, `writeme`, `debug-props` | ✅    | ✅         | ✅         | run as specified            |
   | `blanks`, `annotate`                | ✅    | ✅         | **absent** | **no port to diff**         |
   | `dropdowns`, `variables`            | ✅    | **absent** | **absent** | **no document either side** |

   And **the Gen-1 tree contains zero `.md` files** [measured: `find … -name
   '*.md'` → 0] — it is `.jsx` + `.module.css` only. So for `dropdowns` and
   `variables` the ledger seeds from listers 4 and 5 over one `.jsx`/`.css`
   pair, which produces exactly the "suspiciously small ledger" the roll-up
   exists to surface — with no way to tell a real signal from an instrument
   artifact. **Ask before seeding.**

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

## AR-1 round 3's outstanding findings

All verified against source; none is fixed. Round 3's blockers 1, 3 and 4 and
its IMPORTANTs 5, 7, 11 **were** fixed and are not listed.

**Structural — fix before writing ledgers, because they get more expensive once
rows exist and handoffs cite ids:**

- **A mandatory minimum walk set for `revive`/`ADDITION` rows.** `found` fixed
  the reported-negative problem but not the never-opened-section problem:
  nothing constrains _which_ Gen-2 sections a row walks. AR-1's proposal —
  require README `## What this lens does NOT do`, `## Future direction`, every
  `## Why …`; DOCS `### Out of scope`, `## Future direction`, `## Naming`; plus
  `types.ts` JSDoc (the annotate `Tool` case has no heading pointing at it) —
  and have `walked` name the **full heading list with the walked ones marked**,
  so a reviewer sees what was skipped. The campaign's own `annotate-007` row
  fails this today: it never opened `annotate/DOCS.md § Out of scope`, which
  carries a third statement on that row.
- **`restore — DEFERRED` needs carving out of the AR-5 RESOLVE rule.** Its
  `discharged by` names an owner and a ruling, not an artifact in this tree, so
  every deferral row fails a check written for artifacts. Worked row
  `blanks-043` demonstrates the problem.
- **The narrative-ledger exemption is over-broad and wrong about its premise.**
  `_boundary.md` _does_ have ids (`bnd-001`…`bnd-009`) and its own close
  condition needs them. Narrow the exemption to `provenance` + `discharged by`;
  keep ids, and keep `walked`/`found` on the `ADDITION` rows both ledgers carry.
- **The register wants to be a check, not a sentence.** SPEC's totality claim
  went stale _within minutes_ of being written — `lenses/spellme/` and
  `lib/scanning/` appeared between drafts. There is an untracked
  `scripts/lib/check-tables/` in this repo; a script that enumerates lens
  directories across all three trees plus the roster names in `lenses/README.md`
  and diffs them against the register's rows would close this permanently.

**Routing:**

- **Gate-1 questions 4 and 5 are requirements, not rulings.** They are phrased
  as questions a human answers; they are analysis the foundation's Phase 0
  performs. Restate them inside SPEC § The coloring foundation, where F0 will
  read them, and leave Gate 1 holding notice rather than a decision it cannot
  make.
- **`_boundary.md` routes two decisions to Gate 1 that Gate 1's agenda does not
  carry** — naming an owner for `bnd-003` and a human owner per handed-across
  row. Add them or the boundary rows are open at close by construction.
- **F0's "four-consumer conformance sketch" is never enumerated**, while § The
  coloring foundation calls the orchestrator's editor "a third colorization
  consumer". Three producers, three consumers, four-consumer sketch — pick one
  vocabulary and count once.

**Cleanup (CONSIDER-level, none changes a disposition or a gate):** a
`restore — DEFERRED` written without its `(<owner>, <ruling>)` parenthetical in
SPEC **§ Family A**, in the determinism paragraph (§ Contract deltas has the
correctly formed one — an earlier revision of this list pointed at the wrong
section); a stale "§ The calibration trio" reference in FIDELITY-METHOD §
Failure modes; `annotate-007`'s `walked` citing "Why two views one lens" when
the heading is "Why two views, one lens"; § Case 1 adding bold to a Gen-2
quotation that has none, unmarked; Family A's content-type table leaving ✅/✗
undefined when Gen-1 dropdowns ships `operators: false` and `primitives: false`;
`lenses/README.md § The roster` naming "the run lens" while the register's row
is `run-javascript`; SPEC's Gen-1 total of 14,377 counting `index.js` (179) and
the test file (123); the 30 lens files — 18 `.jsx` plus 12 `.module.css` — total
14,075, and the `.jsx` alone total 8,161.

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
- **Run all four gates before every commit**:
  `npx markdownlint-cli2 --no-globs`, `npx cspell`, `npx prettier --check`, and
  `npx tsc --noEmit` if you touch source. Prettier was missed for three AR
  rounds; it is enforced at pre-commit and it reflows, which invalidates
  line-number citations.
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
