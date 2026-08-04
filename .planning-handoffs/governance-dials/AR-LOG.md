<!-- cspell:ignore tadpotyping Tadpotyping Tadpoling Lilypadagogy greppable unrouted -->
<!-- cspell:ignore pathspec unpushed Authorisation unenforceability -->
<!-- cspell:ignore parameterisation institutionalise unspelled -->

<!--
  Inline ignores rather than cspell.json edits ON PURPOSE: cspell.json is one of
  the four files the human reverts at increment 2.5, so a word added there now
  would be reverted along with the four-track draft.
-->

# AR-LOG — governance-dials campaign (two tracks × three dials)

Campaign ruling home per
[DEV.md § Ruling provenance](../../DEV.md#ruling-provenance). Phase-0 design
session opened 2026-08-04. This campaign had **no AR-LOG and no recorded
baseline** before this file; both prior adversarial-review transcripts from the
superseded four-track campaign were consequently lost.

- **AR-5 baseline: `651ad312e38e2606b570e62ca795e457aacd9271`** [measured: `git
  rev-parse HEAD` at 2026-08-04T20:29:15Z]. ⚠ HEAD moved **four times** during
  the planning session alone (`8da55d2f` → `59a5ef60` → `651ad312`, all peer
  commits); unpushed count moved 229 → 232 → **235** [measured: `git rev-list
  --count origin/main..HEAD`]. Re-measure before AR-5 rather than trusting this
  line.
- **Governance floor: 0 errors, 61 advisories** [measured: `npm run
  check:governance`]. All 61 are `[claims]`. Green is a floor, not evidence —
  every mechanical gate was green while six blockers stood in the prior
  campaign.
- **Authorisation: full governance surface**, granted in-conversation 2026-08-04
  [relayed: human] — `CLAUDE.md`, `.claude/agents/*.md`, `.claude/skills/**`,
  `.claude/settings.json`, `DEV.md`, `AGENTS*.md`. The invariant requires
  in-conversation instruction; a plan file is not one.
- Plan: `~/.claude/plans/governance-campaign-resuming-recursive-quokka.md`
  (Plan-agent pass: **PAUSE**; `ar-1`: **PAUSE**; both folded in below before
  approval).
- Supersedes the four-track model (Frogramming / Vibetoading / Lilypadagogy /
  Tadpoling as tracks, with glyphs). **Nothing of that model is committed**
  [measured: `git show HEAD:<f> | grep -c territory-tracks` → 0 in `DEV.md`,
  `AGENTS.md`, `AGENTS.principal.md`]; it survives only as an uncommitted
  working-copy draft carrying **11** `#territory-tracks` links [measured: `grep
  -c territory-tracks <f>` → 3 / 4 / 4].

## Human rulings (append-only; same-turn writes)

- **R1 — 2026-08-04. Phase 0 collapses to three artifact-named steps** [relayed:
  human]: `0.1 README` · `0.2 twin` · `0.3 types + DOCS + tests`. Supersedes
  both the committed seven-step scheme and the superseded draft's eight-step
  insertion.
- **R2 — 2026-08-04. AR placement** [relayed: human]:
  `0.1 → 0.2 → AR-1 → 0.3 → AR-2 → review/commit → HUMAN GATE`. AR-1 challenges
  the README **and** the twin together.
- **R3 — 2026-08-04. The ubiquitous-language glossary survives** as a named,
  non-optional obligation **inside 0.1** [relayed: human], not as its own step.
  Old `0.1` meant _ubiquitous language_; new `0.1` means _README_ — the only
  step number whose meaning changes rather than disappears, and therefore the
  campaign's one silent-rot risk.
- **R4 — 2026-08-04. The default cell is
  `twinning: none · ceremony: medium · prospective`** [relayed: human, verbatim:
  "frogramming is not the default mode, it should be prescriptive, medium
  ceremony, no twinning"]. **Frogramming is NOT the default governance mode.**
  This contradicts committed text [read: `git show HEAD:AGENTS.principal.md` §
  Vibetoading and Frogramming — house terms — "This file governs **frogramming**
  behavior — Phase 0, ARs, full ceremony — for production work"], which the
  campaign must therefore amend.
- **R5 — 2026-08-04. `teacher` is an AUDIENCE, not the author's role** [relayed:
  human, verbatim: "teacher is an audience. the content is created both for
  learners to study and for teachers to use in class"]. **This overrules finding
  A from both reviewers** — see the disposition table.
- **R6 — 2026-08-04. Tests at 0.3 are written for real and committed skipped**
  [relayed: human]; Phase 1 un-skips one at a time in ZOMBIES order, and AR-3
  fires on each un-skip. Chosen over a plan-only artifact because a plan
  duplicates the thinking without banking it, and over a live red suite because
  that would expire Fake It early [read: `DEV.md § Fake It (Till You Make It)` —
  "it expires when the second test is written"].

## AR verdicts and dispositions

- **2026-08-04 `ar-1` verdict: PAUSE** [relayed: ar-1]. Three contract-level
  blockers (A, B, C below), plus concerns on evidence asymmetry in the dial
  naming, the widened extension of `prospective`, a `depth` misnomer, a
  partial-citation of ontology § 4, a non-existent hook branch, universal
  unenforceability, a stale baseline, the live `tadpotyping` skill, citation
  form, and plan-as-checklist completeness.
- **2026-08-04 Plan-agent design pass: PAUSE** [relayed: Plan agent]. Run in
  parallel with no shared context; landed independently on the same three
  blockers plus over-parameterisation, ceremony-value naming, and increment
  sequencing.

Both reviewers, independently, proposed substantially the same minimal
successor. That convergence is the strongest signal in the record and is not
dismissed by the dispositions below.

| #     | Finding                                                                                                                                                                                                                                                                                                        | Disposition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | `learner · teacher` is not a valid twin pair — `teacher` is a role the author occupies, and the corpus teaches **four** fluid roles on equal footing, of which the design silently takes two                                                                                                                   | **OVERRULED by R5.** `teacher` is a second _audience_ of the same artifact, not a role in the learning community: a teacher running material in class needs pacing, stuck-points, a misconception watch-list; a learner needs the explanation and exercises. Two readers, two generative models — which is § 4's own definition of a twin, and the case it names for documentation ("both _dev / reader twinning_ … AND _NM-twinning_"). Already half-built as the eight `teaching-tips.md` files. **Must be handed to the AR-1 re-run so it is not re-raised.** |
| **B** | The path→track function is partial — **83 tracked files** match no cell [relayed: ar-1], including all root governance (**5,118 lines** [relayed: Plan agent]); the campaign shipping this text is not routed by its own rule                                                                                  | **RESOLVED by R4.** The track only names which twin _vocabulary_ applies when twinning is raised above `none`. Since `none` is the default, an unrouted path owes neither twin and the question does not arise. Stated rule: **unnamed paths fall to the software track at `twinning: none`.** A stated default, not an inference.                                                                                                                                                                                                                               |
| **C** | `ontology.md` § 4 already models this repo as **one** coordinated cycle (curriculum = V, `lenses/embody` = F, "each shaping the other's next iteration… We are doing the innovation process we're teaching"), and names the failure of separating them ("absent coordination between affordance spaces")       | **PARTIALLY OPEN — the campaign's deepest unresolved question.** R5 shows the two crafts have genuinely different twin _structures_ (F+V vs V+V), which is a real craft boundary. It does **not** answer whether two tracks with per-file obligations institutionalise the failure § 4 warns of. **Must be handed to the AR-1 re-run as an explicit open question.**                                                                                                                                                                                             |
| **D** | The dials are not orthogonal — dial 1's value set depends on the track                                                                                                                                                                                                                                         | **ACCEPTED.** The orthogonality claim is withdrawn, not defended. What is claimed instead: the three _questions_ are the same on both tracks; only twinning's vocabulary changes. **The phrase "the same three dials on both tracks" must not appear in the governance text.**                                                                                                                                                                                                                                                                                   |
| **E** | "twinning depth" names an unordered lattice as a ladder (`both` is wider, not deeper)                                                                                                                                                                                                                          | **ACCEPTED.** The dial is named `twinning`, never `twinning depth`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **F** | `ceremony: none` is dishonest naming while AR-5 always fires, and duplicates an existing override phrase that already carries the audit-trail rule                                                                                                                                                             | **ACCEPTED.** Values are `full` / `medium` / `light`; **no value removes AR-5**, whose floor fires at the "Sprint complete — ready to push" prompt already defined in [AGENTS.principal.md § Git Checkpoints](../../AGENTS.principal.md#git-checkpoints).                                                                                                                                                                                                                                                                                                        |
| **G** | The new vocabulary collides worse than the old — `twin` **322** uses in the live corpus [measured: `grep -roi 'twin' spiralearn/frogramming-and-vibetoading/ \| wc -l`]; `track` already means _language variant_; `dial` already means the Belgian voice control; `ceremony` is taught as a _failure symptom_ | **OPEN — increment 1's whole job.** The ubiquitous-language step (R3) is run on the campaign's own vocabulary before any governance text is written. It **may rename the model's own nouns.**                                                                                                                                                                                                                                                                                                                                                                    |
| **H** | The disclosure mechanism rests on a hook branch that does not exist                                                                                                                                                                                                                                            | **ACCEPTED and fixed.** Confirmed independently: `session-start` appears **0** times in `scripts/repo-facts.mjs` [measured: `grep -c 'session-start' scripts/repo-facts.mjs`]. Dial settings go in the **commit body** and this AR-LOG — both `git grep`-able — never in a plan file, which [DEV.md § Ruling provenance](../../DEV.md#ruling-provenance) says "does not exist". No `AskUserQuestion` popup: the agent **states** the settings, it does not ask.                                                                                                  |
| **I** | Nothing in the design is mechanically checkable except the Epistemology block                                                                                                                                                                                                                                  | **ACCEPTED.** Inventory recorded below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **J** | No gate sequences the revert, so the text increments have no defined starting state                                                                                                                                                                                                                            | **ACCEPTED.** Increment 2.5 is an explicit human gate; the agent verifies zero residue before any text increment opens.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **K** | Increment 1 was padded — "is the dangling promise committed?" is one command                                                                                                                                                                                                                                   | **ACCEPTED and answered: draft-only.** All three `HUMANS.md#override-grammar` inbound links exist only in the working copy, so the defect dies with the revert. Increment 1 re-scoped to the glossary.                                                                                                                                                                                                                                                                                                                                                           |

## Honour-system inventory (finding I)

Recorded so the next campaign is not surprised. Of the design's rules, **exactly
one is mechanically checkable**: the `## Epistemology` block, via a heading grep
over READMEs — and under R4 it is the artifact that ships on almost every
module, which is what makes it worth wiring. It also answers a measured gap:
**45 directories under `src/` have a README and no `DOCS.md`** [measured: `find
src -name README.md | wc -l` → 147; `find src -name DOCS.md | wc -l` → 102] —
the default state, never declared.

Unenforceable by any current check: track-derived-from-path; the per-file union
rule; `frog`/`vibetoad` phrase recognition; that the agent states its dials;
that a `retrospective` artifact set is ever actually produced; and the AR-5
campaign-end trigger, which is a chat string. `check:governance` runs four
checks — `links`, `roster`, `claims`, `headings` — of which only `links`
produces errors, and **none reads step numbers**. `governance-guard.py` judges
Bash command shapes only.

## Standing hazards

- **⛔ `.claude/skills/tadpotyping/` — every claim in it is VOID until
  rewritten.** Untracked but **registered and loadable in every session**, and
  inside `check:governance`'s corpus despite being untracked. It drops **AR-1
  through AR-5, all of Phase 0, the ZOMBIES bar, per-directory `DOCS.md`, and
  the 🔍 checkpoint** — contradicting the design's own separation of ceremony
  from twinning. It routes on `"tadpotyping, my call"`, a phrase absent from
  `HUMANS.md`, and its own name is unspelled in `cspell.json`. It also disagrees
  with the docs on its own name — the docs say **Tadpoling**, the skill says
  **Tadpotyping**.
- **⛔ `retrospective` work is BLOCKED** pending a human ruling on invariant 2's
  Phase-0 ordering. R1 tightened this rather than loosening it: under
  `retrospective`, steps 0.1, 0.2 and the DOCS half of 0.3 all defer, so **AR-1
  has neither of its inputs**. R4 makes `prospective` the default, so this
  blocks only explicitly-routed work. Recommended option (a): the artifact set
  changes, the order does not; AR-2 relocates to the retrospective documentation
  step. **Its stated price, which the governance text must carry in these words:
  the Refactor step loses its structural target.**
- **A partial revert turns the checker red.** 8 of the 11 `#territory-tracks`
  links are cross-file (AGENTS → DEV), so reverting `DEV.md` alone yields **8
  `[links]` errors, exit 1**. Revert `DEV.md`, `AGENTS.md`,
  `AGENTS.principal.md` and `cspell.json` **together**.
- **Renumbering radius is ~135 sites across ~23 files**, of which ~85 are live
  peer-campaign handoffs. Two need an explicit "written under the seven-step
  scheme" stamp: `src/lib/embody/lib/evaluating/trace/syntax/PLAN.md` (+ its
  `development-guide.md`), which runs its **own** `0.1`–`0.8` scheme on a
  live-and-paused campaign, and `.planning-handoffs/study-lenses-jej-level.md`,
  a maintained 19-site parallel copy of the ceremony.
- **The one mechanical trap in the edit:** `roster.mjs` asserts `**Trigger:**`
  is the first non-blank prose line of each `### AR-N` section and that a
  `**Provide to agent:**` line survives. Reflow AR-1's trigger so a blank lands
  first and the roster check hard-errors.
- **`spiralearn/` carries two near-duplicate corpora** —
  `frogramming-and-vibetoading/` (live) and `welcome-to-frogramming/` (frozen
  but **still routed and served**, so a wrong-copy edit is publicly visible).
  All twelve same-named files differ. Cite by full path, always.
