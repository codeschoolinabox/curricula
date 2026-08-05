<!-- cspell:ignore pathspec -->

# AR-LOG — the governance-dials campaign

Campaign ruling home per
[DEV.md § Ruling provenance](../../DEV.md#ruling-provenance). Phase-0 design
session opened 2026-08-04. This campaign had **no AR-LOG and no recorded
baseline** before this file; both prior adversarial-review transcripts from the
superseded four-track campaign were consequently lost.

**The slug `governance-dials` is a historical identifier, not vocabulary.** The
[Glossary](#glossary--agent-decisions-increment-1) retired `dial`, and this
file's title previously read "two tracks × three dials" — which collided
verbatim with a served curriculum line [read:
`spiralearn/welcome-to-frogramming/chapters.md:672` — "The chapter has two
tracks:"]. The directory name is frozen deliberately: a campaign is discovered
by `git ls-files '*AR-LOG*'` rather than by its slug [read: `DEV.md § Ruling
provenance`], so renaming a committed path would break R7's pathspec
mid-campaign and orphan `7ac0e36e`'s subject line for no semantic gain.

- **AR-5 baseline: `651ad312e38e2606b570e62ca795e457aacd9271`** [measured: `git
  rev-parse HEAD` at 2026-08-04T20:29:15Z]. ⚠ HEAD moved **four times** during
  the planning session alone (`8da55d2f` → `59a5ef60` → `651ad312`, all peer
  commits); unpushed count moved 229 → 232 → **235** [measured: `git rev-list
  --count origin/main..HEAD`]. Re-measure before AR-5 rather than trusting this
  line.
- **Governance floor: 0 errors, 61 advisories** [measured: `npm run
  check:governance`]. All 61 are `[claims]`.
  - ⚠ **Correction, 2026-08-05 (handoff) — the floor is now 62, and this line
    was the last place in the campaign still saying 61.** [measured: `npm run
    check:governance` → **0 errors, 62 advisories**.] It moved during the
    increment 7–9 session from a peer's `src/` churn reaching an `aran-weaving`
    claim — **no commit of this campaign caused it**. Roughly **51 of the 62**
    name `aran-weaving` alone, so the number is mostly one peer's surface and
    **can move again from edits nobody here makes**. That is why the standing
    order is to compare a **delta against a baseline measured in the same turn
    as the edit**, never against any figure written down — including this one.
    Found by a context-free handoff validator, which noted that this file is the
    first path in the AR-5 pathspec and that AR-5's sourced-claims lens targets
    exactly `[measured:]` figures: the campaign would have been reported to its
    own closing gate on a stale number of its own writing.

  Green is a floor, not evidence — every mechanical gate was green while six
  blockers stood in the prior campaign.

- **Authorisation: full governance surface**, granted in-conversation 2026-08-04
  [relayed: human] — `CLAUDE.md`, `.claude/agents/*.md`, `.claude/skills/**`,
  `.claude/settings.json`, `DEV.md`, `AGENTS*.md`. The invariant requires
  in-conversation instruction; a plan file is not one.
- Plan: `~/.claude/plans/governance-campaign-resuming-recursive-quokka.md`
  (Plan-agent pass: **PAUSE**; `ar-1`: **PAUSE**; both folded in below before
  approval).
- Supersedes the four-track model (Frogramming / Vibetoading / Lilypadagogy /
  Tadpoling as tracks, with glyphs). **Nothing of that model is committed _in
  the three root governance files_** [measured: `git show HEAD:<f> | grep -c
  territory-tracks` → 0 in `DEV.md`, `AGENTS.md`, `AGENTS.principal.md`]; there
  it survives only as an uncommitted working-copy draft carrying **11**
  `#territory-tracks` links [measured: `grep -c territory-tracks <f>` → 3 / 4 /
  4].
  - **⚠ Correction, 2026-08-04 (increment 1).** An earlier revision of this
    bullet claimed **"Nothing of that model is committed"** without the
    qualifier. **That is false repo-wide.** The vocabulary _is_ committed at
    HEAD in a peer campaign's ruling home: `track` appears as a classification
    noun on **10 lines** of `.planning-handoffs/evaluators-intercept/AR-LOG.md`
    [measured: `git grep -n '\btracks\?\b' HEAD --
    '.planning-handoffs/evaluators-intercept/AR-LOG.md'` → lines 53, 55, 57, 60,
    62, 63, 64, 69, 270, 271], including "the default 🔬 Frogramming track". The
    original measurement was sound; only three files were measured, and the
    conclusion was stretched past them.

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
- **R7 — 2026-08-04. `cspell.json` is KEPT, not reverted** [relayed: human,
  verbatim: "you can and should keep changes in cspell, don't revert them"].
  **The increment-2.5 revert is therefore THREE files, not four:**
  `git checkout -- DEV.md AGENTS.md AGENTS.principal.md`. Consequences: the
  superseded model's vocabulary (`Tadpole`, `Tadpoling`, `Lilypad`,
  `Lilypadagogy`, `Lilypadagogue`) stays in the dictionary — harmless, since a
  dictionary entry asserts only that a word is spelled correctly, never that the
  concept is live — and the draft's removal of a duplicate `"Frogram"` entry is
  kept as a genuine tidy-up. New campaign vocabulary goes in `cspell.json`, not
  in inline `cspell:ignore` directives. Safe for the checker: `cspell.json`
  carries no links, so reverting the other three alone cannot orphan a fragment.
  **Operational consequence, because R7 and the per-increment pathspecs
  otherwise deadlock:** when an increment coins a word, its commit stages
  `cspell.json` **in addition to** its own pathspec — e.g. increment 1 becomes
  `-- .planning-handoffs/governance-dials/ cspell.json`. That is the only
  sanctioned widening; it never extends to `DEV.md`, `AGENTS.md` or
  `AGENTS.principal.md`, which stay barred until the increment-2.5 revert.
  _(Increment 0 used an inline `cspell:ignore` for `pathspec`, which R7 has
  since voided; that one line is left in place rather than churned, and R7
  governs everything after it. A cold-start validator flagged the deadlock.)_
- **R8 — 2026-08-04. Prettier owns markdown emphasis style; markdownlint
  yields** [relayed: human, who asked that the two tools be aligned]. Prettier
  exposes no emphasis option and always emits `_underscore_` / `**asterisk**`,
  so with MD049 at `"consistent"` the two fought and the pre-commit hook always
  won. `MD049` is now `false` (same treatment as `MD013` line length, which the
  config already delegates to Prettier) and `MD050` is pinned to `"asterisk"`.
  Pinning MD049 to `"underscore"` instead was measured and rejected: it took the
  repo from **97 to 147** errors by flagging every not-yet-formatted file. Net
  effect **97 → 85** repo-wide errors [measured: `npm run lint:md`], with
  MD049/MD050 at zero and a stable prettier→markdownlint round-trip.
- **R9 — 2026-08-04. Ceremony is set by the human, per campaign or per
  increment; the agent does not state it.** [relayed: human, choosing "Resolve
  it now: the human sets it"] This resolves a contradiction increment 1 surfaced
  and **needs no amendment of any governance file**, because the committed text
  already says it [read: `git show HEAD:AGENTS.principal.md` § Execution
  mechanics — "**Ceremony is uniform — no agent-side lightening.** … Only the
  human grants exceptions, per increment or per campaign"]. The design had made
  ceremony a three-valued setting **defaulting to `medium`** that the _agent_
  states — agent-side lightening from `full`, in the invariant's own words.
  - **Scope: `ceremony` only.** R9 reverses finding H's disposition for this one
    setting. The others — which work a unit is (software / curriculum),
    `twin-doc`, and prospective / retrospective — **remain agent-stated**, so no
    `AskUserQuestion` popup returns for them, and finding H's "no dependence on
    an unwritten hook branch" is untouched.
  - **Restating R4's default cell in the ratified tokens**, since the
    [Glossary](#glossary--agent-decisions-increment-1) retired one of R4's
    words: the default is **`twin-doc: none` · `ceremony: medium` ·
    `prospective`**, and unnamed paths are **software work**. R4's substance is
    unchanged and **R4 itself is not edited** — a human ruling is superseded by
    a human ruling, which append-only permits. Without this line,
    `git grep twinning` would return R4 as the only human-ruled record of a
    retired token.
  - _Consequence, flagged rather than ruled:_ this campaign's own
    `ceremony: full` was agent-stated at increment 0. `full` is the maximum and
    lightens nothing, so no invariant was breached — the human confirms it at
    the increment-2 gate.

- **R10 — 2026-08-04. SCOPE: the full design ships. CP-A is REJECTED.**
  [relayed: human, choosing "Keep the full design"] All four settings ship
  across text increments 4–9 as planned: the two kinds of work, `twin-doc`,
  `ceremony`, and prospective/retrospective. Finding **L**'s arithmetic stands
  as an acknowledged cost — 48 cells, one exercised — and is not a reason to
  trim. Increment 3 therefore designs the section structure for the **whole**
  model.
- **R11 — 2026-08-04. BLOCKER 1: R4's `medium` default STANDS; the campaign
  amends § Execution mechanics instead.** [relayed: human, choosing "Keep R4
  `medium` + amend"] CP-B (default `full`, override grammar as the mechanism) is
  rejected. **Increment 5's scope is enlarged**: in addition to the invariant-2
  amendment already listed, it amends
  `AGENTS.principal.md § Execution mechanics` so that "Ceremony is uniform — no
  agent-side lightening" reads as **uniform _within a declared level_**, and
  names the default. Without that amendment the file would ship asserting
  uniformity while defaulting below maximum — the contradiction R9 did not
  reach. The amended text carries its own AR.
- **R12 — 2026-08-04. BLOCKER 2: the curriculum twin pair stays
  `learner · teacher`, and its NM-twin is SECOND-ORDER.** [relayed: human,
  verbatim: "it's a learner and a teacher, different twinnings. and the NM
  twinning isn't direct, it's rolled into twinning the others because you're
  twinning their twinning of it"]
  - **`learner` and `teacher` are distinct twins, not two readings of one
    audience.** They are different _twinnings_ — different generative models,
    different predictions. Collapsing them to `reader` is rejected; R5 is
    reaffirmed, not merely preserved.
  - **The curriculum author's NM-twin is real but indirect** — it is _nested
    inside_ the learner- and teacher-twins, because what the author models about
    a learner is centrally **the learner's own model of the machine**. You twin
    their twinning.
  - **This satisfies § 4's both-hats conjunction** [read: `ontology.md:472-480`]
    rather than departing from it: the F-twin is present, nested rather than
    beside. It is also what the corpus's own mechanism describes [read:
    `pedagogy.md:96-103` — "the two-layer misconception mechanism … many wrong
    models of the notional machine …"] and it has a V-side counterpart [read:
    `chapters.md:1379` — "**The V-side two-layer misconception** earns the
    rigor-parity"]. A misconception watch-list _is_ a model of the learner's
    wrong NM-model.
  - **Consequences.** The AR-1 re-run's blocker 2 is resolved without a third
    twin value and without asymmetric value sets. The §-4 citation defect
    recorded against finding A is **repaired by this ruling**, not merely
    disclosed. Plan open item 1 ("the taught NM has no slot on the curriculum
    side") is **CLOSED**: the slot exists and is second-order.

- **R13 — 2026-08-05. This campaign runs `ceremony: full`, AR-3 not
  applicable.** [relayed: human, choosing "full — the status quo"] This closes
  the gap
  [§ ⚠ OPEN — this campaign's own ceremony value has no recorded human ruling](#-open--this-campaigns-own-ceremony-value-has-no-recorded-human-ruling)
  opened against this campaign: every commit since increment 0 carried
  `ceremony: full` on an **agent-stated** basis, which R9 forbids. **The value
  does not change; its provenance does** — what was a default the agent supplied
  is now a level the human set. Nothing already committed becomes wrong; it
  becomes citable.
  - **The real gate set is unchanged and is restated here as the ruled one:**
    AR-1 on the design · an AR-2 analog on the section structure before prose ·
    **AR-4 in loss-lens-only mode per text increment (4–9)** · AR-5
    pathspec-scoped at close. AR-3 is n/a because no tests exist to challenge.
  - ⚠ **Correction to the campaign's own gate, found while ruling it.** `DEV.md`
    scopes AR-4's Loss lens to `README.md`/`DOCS.md` [read: `DEV.md` § AR-4:
    Implementation Audit — "diff every touched `README.md`/`DOCS.md` against the
    baseline"]. **Neither remaining increment touches either kind of file** —
    increment 7 is `HUMANS.md`, increment 8 is `.claude/agents/` plus `DEV.md`,
    increment 9 is this file. Read literally, this campaign's declared gate is a
    **no-op on its own last three increments**. The fix is in the dispatch
    prompt, not in `DEV.md`: every `ar-4` launch states that the lens applies to
    the named paths as authored documents, on the authority of
    [DEV.md § Documentation migration discipline](../../DEV.md#documentation-migration-discipline),
    which binds any authored artifact and is the bullet `DEV.md` itself cites.
    Widening the `DEV.md` bullet is a governance change owing its own AR and is
    **not** taken here.
  - **The settings line diverges from its own spec, and this is unfixable.**
    `DEV.md` specifies the middot form [read: `DEV.md` § Who decides, and where
    the answers are recorded — `work: software · twin-doc: none · …`]. **All 8
    committed instances in this campaign use ASCII hyphens** [measured: `git log
    --format=%B 651ad312..HEAD -- <campaign pathspec> | grep 'work: software' |
    od -c` → `w o r k : s o f t w a r e -`], and **7 of the campaign's 15
    commits carry no settings line at all**, including `a712a945`, a
    governance-surface edit [measured: `grep -c 'work: software'` over the same
    log → 8; `git log --oneline` over the same pathspec → 15]. The remaining
    increments **keep the hyphen form**, so one grep finds the whole campaign
    record, and the campaign's commit bodies are ASCII throughout by convention.
    Amend is forbidden, so the 7 bodies without a line stay without one. **A
    future reader who greps the middot form will miss this entire campaign** —
    grep the hyphen form.
- **R14 — 2026-08-05. `.claude/skills/tadpotyping/` is RETIRED, not rewritten.**
  [relayed: human, choosing "Retire it, bank the content"] The directory is
  deleted; its salvageable content is banked as a loss ledger in this file, and
  the capability it uniquely offered is recorded as an open need. Grounds, all
  measured before the ruling:
  - **No `ceremony` value can express what it dropped.** `ceremony` names
    **which reviews fire** and nothing else [read: `DEV.md` § ceremony — every
    row of its table contains only AR names]. Five of the skill's six DROPPED
    categories — all of Phase 0, the ZOMBIES bar, the per-directory `DOCS.md`,
    the 🔍 checkpoint — are outside that axis entirely, and the sixth is only
    partly expressible because **it drops AR-5, which no value removes** [read:
    `DEV.md` § ceremony — "**No value removes AR-5.**"].
  - **Its one unique offer is a blocked axis.** Skipping Phase 0 outright is
    what `retrospective` is ⛔ blocked for, pending a human ruling not yet made.
    Rewriting the skill would have shipped an unblocked back-door around a
    deliberately blocked door.
  - **Rewriting had no coherent middle.** Trimmed to what `ceremony: light`
    licenses it duplicates `DEV.md § Work routing and ceremony`; kept as it
    stands it exceeds the model. And it would have been a **second override
    channel** competing with increment 7's new ceremony grammar.
  - **Nothing depends on it** [measured: 0 inbound links from any corpus
    document; `npm run check:governance` unchanged with the directory removed;
    `.ls-lint.yml` carries no `.claude` rule; no hook or script enumerates
    `.claude/skills/`; 0 orphaned `cspell.json` entries, since this file keeps
    every one of them alive].
- **R15 — 2026-08-05. Increment 7's scope is ENLARGED to repair four stale
  Phase-0 recitals in `HUMANS.md`.** [relayed: human, choosing "Yes — fix all
  4"] The increment was scoped to `§ Override grammar` plus a
  `§ Update triggers` entry. A full read found the file teaching the retired
  seven-step scheme in four further places, including **the human's own Phase-0
  verification checklist**, which cannot see step 0.2 at all [measured: `grep
  -ci 'twin' HUMANS.md` → 0; `grep -ci 'epistemology' HUMANS.md` → 0]. This is
  the same prose-recital failure mode that shipped in both `AGENTS*.md` and was
  repaired at `445d4116` — same campaign, same shape, caught before landing this
  time.
  - **Disclosure, not absorbed:** increment 7 now carries **two deliverables**
    under one AR-4, which halves the review density the declared gate set buys
    per increment. Recorded here rather than left implicit, because this
    campaign's own `ar-1` objected to the last undisclosed scope exemption. The
    mitigation is in the AR-4 brief: report on both halves, and run the loss
    lens on the recital half specifically.

- **R16 — 2026-08-05. A mode that skips Phase 0 entirely does NOT exist; the
  question is CLOSED, answered NO.** [relayed: human, choosing "Invert to CLOSED
  — answered NO"] Increment 9's first draft recorded it as an OPEN NEED
  discharged by the pending `retrospective` ruling; `ar-1` returned a BLOCKER on
  both halves and the human took its counter-proposal. **The standing answer is
  already committed** — invariant 2 plus `DEV.md § Phase 0`'s do-not-skip block,
  both unconditional — and the retired skill was the only text in the repository
  that said otherwise. Two reasons the draft was wrong: (i) no `ceremony` value,
  override phrase, or ruling about `retrospective`'s artifact _ordering_ can
  create a Phase-0 skip; **only an amendment to invariant 2 can**, so the
  discharge condition was structurally incapable of paying; (ii) a recorded
  "open need to skip Phase 0" is a permanent, greppable back-door of exactly the
  kind R14 retired the skill to close. **A future ruling wanting such a mode
  must amend a non-negotiable invariant explicitly, not add a fourth setting
  key.** See § CLOSED — a mode that skips Phase 0 entirely does not exist.
- **R17 — 2026-08-05. The `DOCS-FLAG` definition is PROMOTED into `DEV.md`,
  under a narrow stated exception.** [relayed: human, choosing "Promote the
  definition into DEV.md now"] The retirement rule stands — _a retirement may
  record what it drops; it may not add convention_ — with one clause added:
  **_…but it may not leave undefined a convention `DEV.md` already uses._**
  `DEV.md` uses the marker and defines it nowhere [measured: `git grep -in
  'DOCS-FLAG' HEAD` → one hit, `DEV.md:2358`, an _instance_, not a definition],
  and the only definition in the repository was inside the file being deleted.
  Retiring under the unmodified rule would have left `DEV.md` **strictly worse
  than before this increment ran** — the one hole where the rule produced a
  worse repo than it inherited. **Exactly one item qualifies today.** BANK-1 and
  BANK-3 stay CANDIDATE; both genuinely would add convention.
- **R18 — 2026-08-05. The skill is removed by `mv`, not `rm`.** [relayed: human,
  choosing "mv to an out-of-tree path"] Destination
  `~/tadpotyping-retired-2026-08-05`, **named in the ledger** so the
  transcription stays auditable for as long as that copy survives. The file
  leaves the working tree, the checker's corpus and the session skill list, and
  still never enters history — so the DRAFT-swap precedent holds — while the
  human keeps a byte-exact copy, which is the only real answer to the ledger's
  acknowledged weakness. `ar-1` found the `mv` option had been offered in
  conversation and recorded nowhere; under "a ruling is cited or it does not
  exist", its disposition had not happened until this line.

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

- **2026-08-04 `ar-1` RE-RUN (increment 2) verdict: PAUSE** [relayed: ar-1].
  Baseline `f7580e74`; HEAD moved twice during the review to `e1f69580`, both
  foreign. **Three blockers** — (1) R9 does not resolve the ceremony
  contradiction; (2) R5's supporting citation is read against its sense and its
  evidence sits outside the routed tree; (3) the default cell's defense is
  incoherent. **Seven important**, three minor. It **confirmed as sound**: the
  `track`, `dial` and `twinning` retirements, R5's substance, and the `ceremony`
  keep ("right token, wrong write-up"). It **answered finding C**, which is now
  closed. Its lead counter-proposal is **CP-A**.
  - **Agent-resolved in this increment** (evidence corrections and additive
    spec, none of which reverses a human ruling): blocker 3 via the delegate
    field; concerns 5a, 5b, 5c, 6, 7 and 8 corrected in place; finding C closed;
    finding **L** lettered.
  - **Bubbled to the human**, unresolved by design: blockers 1 and 2, plus CP-A
    and CP-D. See
    [§ Open at the increment-2.5 gate](#open-at-the-increment-25-gate).
  - **One reviewer charge rejected on measurement:** that the `81` count "does
    not return at any commit". It returns at `af6e811d`, the SHA that was HEAD
    when it was measured, which the review did not test. Its underlying point
    stands and drove the SHA-pinning correction.
  - ⚠ **Its judgement on the increment-1 ceremony disclosure — recorded because
    it cuts against this campaign:** procedurally defensible, but the gate set
    that exempted increment 1 was **agent-authored at increment 0**, which R9
    now says was the human's to set; and the human ratified **conclusions, not
    evidence**. Increment 1 shipped four false claims into a permanent record,
    all four of the kind an AR catches and a ratification does not. **Adopted
    rule: any increment that retires or coins a governance noun carries an AR,
    whether or not it writes prose.**

| #     | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Disposition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | `learner · teacher` is not a valid twin pair — `teacher` is a role the author occupies, and the corpus teaches **four** fluid roles on equal footing, of which the design silently takes two                                                                                                                                                                                                                                                                                                                 | **OVERRULED by R5.** `teacher` is a second _audience_ of the same artifact, not a role in the learning community: a teacher running material in class needs pacing, stuck-points, a misconception watch-list; a learner needs the explanation and exercises. Two readers, two generative models. **R5's substance STANDS — it is a human ruling and the AR-1 re-run accepted it.** ⚠ But increment 2 corrected the evidence beneath it, twice: (i) the § 4 citation was read against its plain sense — "Documentation as a both-hats case" is a **conjunction**, V _and_ F, so the one passage insisting the documentation case needs an F-twin was cited as authority for a pair with **two V-twins and no F-twin**; (ii) "already half-built as the eight `teaching-tips.md` files" is **withdrawn** — all eight sit in `welcome-to-programming/` (6) and `welcome-to-algorithms/` (2), and **zero** are in the routed curriculum tree [measured: `find spiralearn -name 'teaching-tips*'`; `find spiralearn/frogramming-and-vibetoading -name 'teaching-tips*' \| wc -l` → 0]. The routed cell has no instance of its own twin, and the cited artifacts live in a tree this design freezes. **Consequence, escalated to the gate: the curriculum side owes an F-twin** — see [§ Open at the increment-2.5 gate](#open-at-the-increment-25-gate). |
| **B** | The path→track function is partial — **83 tracked files** match no cell [relayed: ar-1], including all root governance (**5,118 lines** [relayed: Plan agent]); the campaign shipping this text is not routed by its own rule                                                                                                                                                                                                                                                                                | **RESOLVED by R4.** The track only names which twin _vocabulary_ applies when twinning is raised above `none`. Since `none` is the default, an unrouted path owes neither twin and the question does not arise. Stated rule: **unnamed paths fall to the software track at `twinning: none`.** A stated default, not an inference.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **C** | `ontology.md` § 4 already models this repo as **one** coordinated cycle (curriculum = V, `lenses/embody` = F, "each shaping the other's next iteration… We are doing the innovation process we're teaching"), and names the failure of separating them ("absent coordination between affordance spaces")                                                                                                                                                                                                     | **CLOSED at increment 2 — the premise is wrong and the citation is misattributed.** (i) "absent coordination between affordance spaces" is **not in § 4**; it is at `ontology.md:258`, inside § 2, and its subject is two stances failing to coordinate _inside one artifact_ (encodings, name fields, date formats), not the curriculum↔`embody` pair [measured: `grep -rn 'absent coordination' --include='*.md' .`]. (ii) § 4 does **not** model the repo as one undifferentiated cycle — it names **exactly two artifacts**, "**the curriculum**" (V) and "**`lenses/embody`**" (F), as two translational artifacts "**in the same trading zone**" [read: `ontology.md:596-612`], and a trading zone requires two parties. **So naming two kinds of work is what § 4 does; the split does not institutionalise § 4's failure.** ⚠ The real defect is the **axis**: the design cuts by directory tree, § 4 cuts by which twin the artifact is grounded in — which folds the ontology's named F pole (`src/lib/embody/`) into undifferentiated "software work" and leaves the curriculum side with no F-twin. **Boundary to move, not a split to remove** — carried to the gate.                                                                                                                                                                  |
| **D** | The dials are not orthogonal — dial 1's value set depends on the track                                                                                                                                                                                                                                                                                                                                                                                                                                       | **ACCEPTED.** The orthogonality claim is withdrawn, not defended. What is claimed instead: the three _questions_ are the same on both tracks; only twinning's vocabulary changes. **The phrase "the same three dials on both tracks" must not appear in the governance text.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **E** | "twinning depth" names an unordered lattice as a ladder (`both` is wider, not deeper)                                                                                                                                                                                                                                                                                                                                                                                                                        | **ACCEPTED.** The dial is named `twinning`, never `twinning depth`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **F** | `ceremony: none` is dishonest naming while AR-5 always fires, and duplicates an existing override phrase that already carries the audit-trail rule                                                                                                                                                                                                                                                                                                                                                           | **ACCEPTED.** Values are `full` / `medium` / `light`; **no value removes AR-5**, whose floor fires at the "Sprint complete — ready to push" prompt already defined in [AGENTS.principal.md § Git Checkpoints](../../AGENTS.principal.md#git-checkpoints).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **G** | _As raised by both reviewers:_ "the new vocabulary collides worse than the old" — `twin` **322** uses in the live corpus [measured: `grep -roi 'twin' spiralearn/frogramming-and-vibetoading/ \| wc -l`]; `track` already means _language variant_; `dial` already means the Belgian voice control; `ceremony` is taught as a _failure symptom_. **Left standing as raised, not as a finding of fact — increment 1 measured two of these limbs to be understated, one overstated, and one false as stated.** | **CLOSED at increment 1.** See [§ Glossary](#glossary--agent-decisions-increment-1), which adjudicates every token against one uniform test. `track`, `dial` and `twinning` are **RETIRED**; **`ceremony` is KEPT** because the premise fails for it — the curriculum's taught term is the compound `ceremony-without-twin`, and governance owns the bare noun at HEAD.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **H** | The disclosure mechanism rests on a hook branch that does not exist                                                                                                                                                                                                                                                                                                                                                                                                                                          | **ACCEPTED and fixed.** Confirmed independently: `session-start` appears **0** times in `scripts/repo-facts.mjs` [measured: `grep -c 'session-start' scripts/repo-facts.mjs`]. Dial settings go in the **commit body** and this AR-LOG — both `git grep`-able — never in a plan file, which [DEV.md § Ruling provenance](../../DEV.md#ruling-provenance) says "does not exist". No `AskUserQuestion` popup: the agent **states** the settings, it does not ask.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **I** | Nothing in the design is mechanically checkable except the Epistemology block                                                                                                                                                                                                                                                                                                                                                                                                                                | **ACCEPTED.** Inventory recorded below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **J** | No gate sequences the revert, so the text increments have no defined starting state                                                                                                                                                                                                                                                                                                                                                                                                                          | **ACCEPTED.** Increment 2.5 is an explicit human gate; the agent verifies zero residue before any text increment opens.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **K** | Increment 1 was padded — "is the dangling promise committed?" is one command                                                                                                                                                                                                                                                                                                                                                                                                                                 | **ACCEPTED and answered: draft-only.** All three `HUMANS.md#override-grammar` inbound links exist only in the working copy, so the defect dies with the revert. Increment 1 re-scoped to the glossary.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **L** | **Over-parameterisation** — named in the Plan-agent PAUSE at the top of this section but never given a letter, so the campaign's own gate ("a resolution line for every finding A–K") could not catch it                                                                                                                                                                                                                                                                                                     | **ACCEPTED, and lettered at increment 2 so the gate reaches it.** The finding is correct on arithmetic: the design takes on **2 work kinds x 4 twin-doc values x 3 ceremony values x 2 documentation modes = 48 cells**, and by this file's own record every `retrospective` cell is BLOCKED, every `ceremony: full` docs-class cell is undefined, and curriculum twin-doc values are deferred entirely. **Exactly one cell — the default — is worked through.** Shipping 48 cells to serve 1 is the primary AR-1 lens. Carried to the gate as the strongest argument for the reviewer's CP-A.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## Glossary — agent decisions (increment 1)

The ubiquitous-language obligation R3 folds inside step 0.1, run on the
campaign's own nouns. It discharges that step's stated duty [read: `git show
HEAD:DEV.md` § 0.1 — "Watch for synonyms (two words for the same thing) and
homonyms (one word with two meanings). **Resolve them here**, not in code
review"] and closes **finding G**.

**These are agent decisions, not human rulings** — deliberately not filed under
[§ Human rulings](#human-rulings-append-only-same-turn-writes). Retiring a noun
is architectural, so the replacements went to the human before any governance
text is written; the human ratified **no collective noun** for the work kind and
**`twin-doc`** for the twin setting [relayed: human, 2026-08-04]. `ceremony`
produced a genuine contradiction, ruled as **R9**.

Design pass: **two Plan agents run in parallel with no shared context, both
returning PAUSE and converging** [relayed: Plan agents]. Three of this
glossary's own draft claims were false and are corrected in place below rather
than quietly dropped.

### The test

Three criteria, so that no ruling rests on taste. A governance term is
admissible only if:

⚠ **Correction, increment 2.** This paragraph first read "One criterion, applied
uniformly to all four tokens". That was false on the section's own face — only
criterion 1 is argued for all four tokens; criterion 2 is argued for `track`
alone and criterion 3 for `dial` and `twinning`. The honest description is
**three criteria, applied as each becomes relevant**, with criterion 1 as the
one that binds every token. The rulings do not change; the claim about their
uniformity does.

1. **Incumbency** — committed governance **at HEAD** already uses it in the
   **intended** sense, **or** the taught curriculum does not claim it. Measured
   at HEAD only: the uncommitted four-track draft earns nothing. This is a
   **disjunction**, so _zero incumbency alone retires nothing_ — `epistemology`
   and `retrospective` are kept on the second disjunct.
2. **Instrument cost** — can a maintainer find the governance sense with the
   tools this repo runs on?
   - ⚠ **Correction.** A draft of this section grounded this criterion in
     [DEV.md § Ruling provenance](../../DEV.md#ruling-provenance), claiming a
     governance term must be locatable in one grep. **That derivation is
     wrong.** That section governs locating a _ruling record_ through a fixed
     citation form; its own three sanctioned lookups are not unique either
     [measured: `git grep -c 'human ruling'`, `git grep -c "PINNED("`, `git
     ls-files '*AR-LOG*'`]. Instrument cost is real, but it is argued on its own
     merits and borrows no authority.
3. **Structural honesty** — the term's metaphor must not assert structure the
   model lacks. Extends accepted **finding E** one level up.

**The compound rule.** The corpus resolves a contested head-noun with a compound
— `ceremony-without-twin`, `Python-track`, `both-twins`, `predict-and-twin` —
and so does governance [read: `git show HEAD:AGENTS.md` — "the warning matching
its **risk class**"]. But a compound is only safe where the corpus has **not
already closed the compound's value set**; that exception is what disqualified
`twin-target` below.

### `ceremony` — **KEPT**: governance already owns it

Finding G's premise — "`ceremony` is taught as a _failure symptom_" —
**overstates for this token**. It is not simply false: the bare noun does appear
pejoratively in the curriculum (see the corrections below). What the
measurements show is that the _taught_ term is the compound, and that governance
holds the clear majority of the word's uses.

- **10 lines** of committed governance at HEAD carry it [measured: `git show
  HEAD:<f> | grep -ciE 'ceremony'` → `DEV.md` 1, `AGENTS.md` 4,
  `AGENTS.principal.md` 4, `HUMANS.md` 1].
- **81 lines** carried the word across all tracked `.md` **at `af6e811d`**
  [measured: `git grep -icE 'ceremony' af6e811d -- '*.md'`, summed]; **10** are
  in the two curriculum corpora — 5 live, 5 frozen [measured: `grep -rniE
  'ceremony'` over `frogramming-and-vibetoading/` + `welcome-to-frogramming/`].
  The stem needs no wildcard: the plural and adjectival forms are absent
  repo-wide [measured: `git grep -icE 'ceremonies|ceremonial' HEAD -- '*.md'` →
  no matching files].
  - **⚠ Correction, increment 2 — the number was pinned to a moving label.** It
    was written as "at HEAD it is 81", which self-invalidated the moment this
    campaign committed: the glossary's own text added ~32 lines carrying the
    word. Measured across the range [measured: `git grep -icE 'ceremony' <sha>
    -- '*.md'`, summed]: `7a5239b7` → **69**, `af6e811d` → **81**, `f7580e74` →
    **113**, `e1f69580` → **113**. **81 was correct when measured**, at
    `af6e811d`; it is not correct now, and "HEAD" was the wrong anchor for a
    durable record. **Repo-state counts in this file are SHA-pinned from here
    on.** (An AR-1 reviewer reported the command "does not return 81 at any
    commit"; it does, at `af6e811d`, which the review did not test. The
    reviewer's underlying point — that a HEAD-pinned count in a file whose own
    commit moves HEAD is self-invalidating — is correct and is why this
    correction exists.)
- The curriculum's **taught** term is the hyphenated compound
  **`ceremony-without-twin`**, and it is examined [read:
  `spiralearn/frogramming-and-vibetoading/chapters.md:605` — "🐣 … recognize
  ceremony-without-twin as a symptom, not a failure mode"].

⇒ Governance is not borrowing a taught term; it is **putting a value on a word
it already holds**.

⚠ **DISCLOSED WIDENING — added at increment 2, the same flag `prospective`
carries.** The incumbency above is real but is **narrower than the intended
sense**, and the first draft failed to say so while flagging a smaller widening
elsewhere. At HEAD `ceremony` is a **constant**, not a variable: 9 of its 10
committed governance lines are "full ceremony", "Ceremony is uniform", or
"skipping ceremony". The design replaces that constant with a **three-valued
setting whose default is below maximum**. Constant → variable is a _larger_
widening than `prospective`'s adjective → work mode. Two consequences must be
stated rather than absorbed:

- The campaign is **deleting part of the incumbency it claims** — increment 6
  inverts the house-terms body containing "full ceremony — for production work",
  and R4/R9 make "Ceremony is uniform" false as written. See the § Execution
  mechanics item in
  [§ Open at the increment-2.5 gate](#open-at-the-increment-25-gate).
- The earlier claim that governance holds "the clear majority of the word's
  uses" is **withdrawn**. At `e1f69580` root governance carries 10 lines and the
  two curriculum corpora carry 10 — parity. The largest single body is
  `.planning-handoffs/`, in the **count-noun** sense this campaign declines to
  reconcile.

What survives, and is sufficient: governance holds the **bare noun** in its own
sense, the curriculum's taught term is the compound, and the key-bound form is
measurably unambiguous — `ceremony:` appears on **13 lines** repo-wide
[measured: `git grep -inE 'ceremony:' e1f69580 -- '*.md'`], almost all of them
this campaign's own record.

**Three corrections to this glossary's own first draft**, each found by the
design pass and verified here:

- The headline count was first measured on the **contaminated working tree** (96
  lines) — the exact error this campaign's standing order forbids. **At HEAD it
  is 81**; the 15-line delta _is_ the retired draft [measured: `git show
  HEAD:<f>` vs working — `DEV.md` 1→12, `AGENTS.md` 4→6, `AGENTS.principal.md`
  4→6].
- "10 uses in **exactly** the intended sense" was **false**. One committed use
  is the pejorative [read: `git show HEAD:AGENTS.md` — "The ubiquitous language
  established in Phase 0 is **not optional ceremony**"]. The collision is partly
  _internal to governance_.
- "The curriculum never defines the bare noun" was **false** [read:
  `spiralearn/frogramming-and-vibetoading/ontology.md:486` — "personas done **as
  ceremony**"], and that sentence sits inside the very § 4 passage this ruling
  cites.

**Obligations that ship with the ruling:**

- **(a) Governance states the whole of § 4 — BOTH horns, and neither one
  alone.** § 4 cuts against a fixed maximum _and_ against a low default, and
  governance must carry both or it is quoting selectively in its own favour
  either way:
  - The horn that licenses a setting at all: [read: `ontology.md:461` —
    "**Strict process _with_ strong twinning is itself a failure mode**"] and
    [read: `ontology.md:468-470` — "processes _afford_ structure; twins _do_ the
    work … _You have to understand the rules in order to break them._"]. **A
    fixed maximum is what § 4 names a failure mode** — that is why the setting
    exists.
  - The horn that argues _against_ a low default, and which the first draft
    omitted: [read: `ontology.md:453-459` — twin-less processes "have evolved as
    effective guardrails / guides / checklists; they **carry accumulated wisdom
    against well-known failure patterns** … they aren't worthless without it
    either"]. **This is the sentence that licenses `ceremony: full` on twin-less
    work** — precisely the work `twin-doc: none` describes. A design whose
    default is `twin-doc: none · ceremony: medium` is lowering ceremony exactly
    where § 4 says the guardrails still carry value.
  - ⚠ **Correction, increment 2.** The first draft called `:453-459` "the
    flattering half" and quoted only the second horn. That got it backwards for
    this design: under a sub-maximum default it is `:453-459` that is
    inconvenient, and it was the half left out.
- **(b) No ceremony value is ever evidence of twinning.** `ceremony: full` never
  discharges a twin obligation.
- **(c) Always written key-bound** — `ceremony: full`, never a bare "the
  ceremony". See the count-noun hazard in
  [§ Standing hazards](#standing-hazards).

### `track` — **RETIRED** as a governance noun, no replacement

1. **Zero noun incumbency.** Every committed `track*` use is the **verb** [read:
   `git show HEAD:AGENTS.principal.md` — "design tracks the strongest available
   tier"] or the **git participle** [read: same — "tracked edits",
   "remote-tracking refs"; `git show HEAD:HUMANS.md` — "**Tracked** project
   guardrails"]. **None** is a classification noun.
2. **Instrument cost.** The new noun would arrive as a small minority among the
   **10** `track*` lines in the three root governance files, none of which is a
   classification noun — **6 verb, 4 git participle** [measured: `git show
   e1f69580:<f> | grep -niE '\btrack(s|ed|ing)?\b'` → `DEV.md` 1797, 1806, 2137,
   2145; `AGENTS.md` 460; `AGENTS.principal.md` 65, 410, 603, 712, 777].
   - ⚠ **Correction, increment 2.** This ground first said the field was
     "dominated by the git participle". Measured, it is dominated by the
     **verb** (6 vs 4). The conclusion survives — a new noun is a minority among
     10 non-noun uses either way — but the stated fact was wrong, and a
     criterion argued on its own merits cannot afford to be argued wrongly.
3. **The curriculum collision is broader than finding G recorded** — **five**
   sites across **four** regions, not one:
   - [read: `spiralearn/frogramming-and-vibetoading/guide.authors.md:268` — "A
     Python-track, a … Racket-track are all welcome adaptations"; three
     language-variant `-track` compounds are named on that line]
   - [read: `spiralearn/frogramming-and-vibetoading/README.md:369` — "JS is the
     primary **track**"] — a **bare noun in the live front-door README**, which
     the campaign had not found
   - [read: `spiralearn/welcome-to-programming/index.md:323,328,345` —
     "JavaScript (primary track)", "Python (parallel track)", "Python track
     completeness"]
   - [read: `spiralearn/welcome-to-frogramming/chapters.md:672` — "The chapter
     has **two tracks**:"] — colliding verbatim with this file's former title

**Replacement: none.** Governance writes **"software work"** and **"curriculum
work"** inline; the record key is `work:`. Both phrases are free [measured:
`grep -rniIE '<phrase>' --include='*.md' .` → "software work" 0; "curriculum
work" 0 real, 2 substring hits on "the curriculum work*ing*"], and `curriculum`
has **0** uses in committed governance [measured: `git show HEAD:<f> | grep -ciE
'curriculum'` over the four files]. Killing the collective noun also makes
finding D's banned phrase impossible to write.

⚠ **`work class` was proposed and is WITHDRAWN.** The curriculum **defines** the
collision, in the same file as the `track` one [read:
`spiralearn/frogramming-and-vibetoading/guide.authors.md:117` — "**Task classes
(chapters)** sequence easy-to-difficult. Within a class, support diminishes"],
and the human's own R5 verbatim uses it [read: R5 above — "for teachers to use
**in class**"].

### `dial` — **RETIRED**, no replacement

1. **Cross-campaign mechanical cost — the lead ground.** `dial` sits on a live
   **blocking pre-commit banned-term grep** whose rule is "review each match; do
   not auto-reject", maintained in four peer briefs [read:
   `.planning-handoffs/study-lenses-jej-level.md:573`;
   `study-lenses-phase0-2-keystone-contracts.md:144`;
   `study-lenses-phase1-entry.md:89`; `study-lenses-embody-phase1.md:422`]. That
   is a permanent attention tax on another campaign's commits. It binds only
   that campaign — this is a cost, not an authority.
2. **Zero incumbency** — 0 uses in committed governance at HEAD.
3. **Live `src/` senses in the exact target meaning** [read:
   `src/lib/embody/language-levels/just-enough-javascript/aithor/README.md:398`
   — "The three soft aspects are **independent dials**"; also `types.ts:294`;
   `src/lib/study-lenses/lenses/writeme/README.md:29` — "the **scaffolding
   dial**"].
4. **The corpus's ratified control noun is `slider`**, not `dial` [read:
   `ontology.md` § 11 — "the **human–AI slider** — per-task
   depth-of-involvement"; **31** hits in the live corpus, measured: `grep -rniE
   '\bsliders?\b' spiralearn/frogramming-and-vibetoading/`]. Adopting `dial`
   would give the corpus two words for one shape.
5. **Structural honesty, stated at its true strength.** A dial is a _graded_
   control, but the twin setting is an unordered lattice and the documentation
   setting is a binary. ⚠ The design pass weakened this: a rotary selector _is_
   called a dial, so the metaphor is **contested, not false**. It no longer
   carries the ruling alone, and is listed last rather than first.

The curriculum collision that finding G led with is the **weakest** ground, and
is recorded as such: **3 lines, one checklist bullet** [read:
`spiralearn/frogramming-and-vibetoading/narrative.md:146-149` — "**Check the
Belgian dial.** … dial it back … dial it forward"]. One worked metaphor, not a
defined term.

### `twinning` — **RETIRED** as a setting name → **`twin-doc`**

`twin` and `twinning` survive **only as cited references** to the taught
concept, anchored to `ontology.md` § 4 / § 7. Neither is ever a governance-owned
term.

1. **Zero corpus precedent for the governance sense.** [measured:
   `grep -rniE 'digital[ -]twin|twin[ -]document|twinned artifact|twin (file|doc|copy|version|artifact|text|page)|(document|file|artifact|doc)[ -]twin'`
   over **both** corpora → **0**]. Across its 322 occurrences the curriculum
   uses `twin` for a mental model, a target, a verb, a strand, a stance, grid
   labels and failure labels — **never for an artifact**.
2. **It is a taught strand name** [read: `ontology.md` § 7 `#### Twinning` —
   "Connections to target systems. Building a generative model of a process
   outside your own mind…"], carrying an L0 learning objective [read:
   `spiralearn/frogramming-and-vibetoading/study-lenses.md:222` — "**Twinning
   the NM is the curriculum's L0 learning objective.**"] and a cognitive-science
   identity claim [read: `ontology.md:820` — "twinning IS active inference"].
3. **The sense-shift is itself the taught failure.** The curriculum's `twinning`
   is a **stance** [read: `ontology.md:398` — "Twinning is the stance"]; a
   governance setting's would be an **artifact obligation**. Reporting
   `twinning: user` because a file exists is producing the artifact of a
   practice without the stance — which is precisely `ceremony-without-twin`. The
   setting would **license the failure it is named after.**
4. **No graded-knob precedent** — the § 4 2×2 is literal **NO/YES**, and the
   corpus's one continuous control is explicitly fenced off from this axis
   [read: `ontology.md` § 11 _Term hygiene_ — "The slider is **orthogonal to
   V/F** … the mode is _which twin_ you hold and the band is _how much_ you
   delegate"; and "**not a fourth structural axis**"].

**Replacement: `twin-doc`.** Free of the curriculum entirely [measured:
`grep -rniE 'twin[ -]doc' spiralearn/` → **0** across every region], and already
this house's own coinage [measured: `grep -c 'twin document' DEV.md` → **6**
lines in the working copy, `git show HEAD:DEV.md | grep -c` → **0**]. It names
the **artifact**, which is what the setting controls, and `twin-doc: none`
cannot be misread as "holds no twin". `twin` survives as the concept, narrowed —
not a fresh borrowing.

⚠ **`twin-target` was proposed and is WITHDRAWN**, on a point both reviewers
reached independently. It does not merely disambiguate — it names a **taught
closed set** [read: `spiralearn/frogramming-and-vibetoading/README.md:292` —
"You meet **every twin-target** in Ch0 at its boundary primitive; each chapter
then deepens one: the 🧑‍💻 _developer_ …, the 💻 _computer_ (Ch1), the _user_
(Ch2), the 🤖 _agent_ (Ch3)"; plus "yourself as poly-perspective being" at
`ontology.md:818`]. `learner` and `teacher` are **not** taught twin-targets, so
`twin-target: teacher` would assert a target the curriculum does not teach —
**re-opening finding A at the vocabulary level immediately after R5 closed it at
the design level**, and against increment 2's explicit brief that `ar-1` not
re-raise A. Adopting a corpus compound _verbatim_ is a stronger identity claim
than adopting its root.

**One thing the rename must not be permitted to hide.**
`twin-doc: none · ceremony: medium` breaks the _spelling_ that
`twinning: none · ceremony: medium` produced — correctly, since the governance
sense is document-not-cognition. **It does not answer whether the default cell
is defensible.**

**Answered at increment 2 — and the first draft's answer was incoherent.** It
invoked § 4's carve-out while failing that carve-out's stated condition. Read
both branches: the stance "can be V-flavored (user-experience-led **with the NM
delegated**) or F-flavored (NM-led **with user-research delegated**)" [read:
`ontology.md:371-379`]. In each branch one twin is held and the other is
**delegated to a named holder**. The carve-out never blesses delegating both,
and it never treats _absence_ as delegation. `twin-doc: none`, as first
specified, delegates to nobody — and § 4 names declared absence: "**Twin
ignored** — you know you should build a twin … but skip it" [read:
`ontology.md:415`], the both-NO corner it calls "the starting position the
curriculum brings learners _out of_" [read: `ontology.md:426-435`].

The draft also took both sides of a straight either/or eight lines apart: it
justified the `twinning` → `twin-doc` rename on the ground that the governance
sense is _document-not-cognition_, then defended the default with a carve-out
about _stance_. If the rename's rationale holds, the stance carve-out cannot
defend the setting; if the carve-out applies, the setting is stance-adjacent and
the rename's rationale weakens.

**RULING — the Epistemology block names the delegate. Three fields, not two:**

1. **which twin is not built**;
2. **to whom or what it is delegated** — a named holder: a validator, an
   upstream library's own docs, a linter, a peer module;
3. **what would falsify that delegation** — the condition under which this unit
   starts owing its own twin.

Worked shape: _"The NM twin is delegated to the JEJ validator and the
eslint-scope analyzer; if either stops being authoritative for scoping, this
module owes its own NM document."_

This is what moves the default cell out of "twin ignored" and into § 4's
legitimate, intentionally-delegated stance. It costs one sentence of spec and it
makes the block worth grepping for rather than a disclosure of a gap. **Without
field 2 the default cell is § 4's fourth corner with a disclosure attached** —
and that, not the spelling, was the defect the rename risked hiding.

### Checked and cleared, so `ar-1` need not re-open them

- **`epistemology`** — **0** in the live corpus, **0** in committed governance
  [measured: `grep -rniE 'epistemology'`]. Free.
- **`retrospective`** — **1** live-corpus hit, an adverb whose sense is
  _concordant_ with governance's [read: `ontology.md:462` — "derived
  retrospectively from observing practitioners who twin well"]. Zero governance
  incumbency; clears on the test's second disjunct.
- **`prospective`** — kept, but its incumbency is **narrower than the intended
  sense**: at HEAD it is an adjective on a document, not a work mode [read: `git
  show HEAD:DEV.md` — "written **prospectively** in Phase 0"]. Recorded as a
  **disclosed widening**, not as clean — which is what `ar-1`'s Concern 4 meant.
- **The `prescriptive` → `prospective` swap was unrecorded, and R4's verbatim
  says the opposite** [read: R4 above — "it should be **prescriptive**, medium
  ceremony, no twinning"]. The swap is **correct on the merits**, and here is
  the evidence that was missing: `prescriptive` is an examined objective [read:
  `spiralearn/frogramming-and-vibetoading/chapters.md:2041` — "🐥 Use the
  human–AI slider **prescriptively**"]. Recorded now as a ruling rather than
  left as an undisposed concern.
- **`full` / `medium` / `light`** — ⚠ **`medium` collides more than first
  judged.** The curriculum runs a taught three-valued scale of the same shape,
  sharing the middle value [read:
  `spiralearn/frogramming-and-vibetoading/chapters.md:53-58` — a chapter × layer
  table whose cells are **`sparse` / `medium` / `dense`**]. Key-binding
  (`ceremony: medium`) prevents the _reference_ from being ambiguous but does
  not stop a reader importing the wrong endpoints. **Kept, with the collision
  recorded rather than dismissed.**

### What the retirements ripple into

- **The campaign slug and its committed directory are frozen** — see the note
  under this file's title.
- **This file's title** — retitled in this increment.
- **R4's wording** — R4 names the default cell in a now-retired token. It is
  **not edited**; **R9 restates the cell in the ratified tokens** in the same
  append-only section, so the human-ruled record is current.
- **⚠ A committed peer campaign is blocked on `track`** [read:
  `.planning-handoffs/evaluators-intercept/AR-LOG.md:69` — a carried-forward
  gate item naming "the governance campaign landing § Territory tracks"].
  Retiring `track` with no successor would resolve that gate into nothing — the
  silent-rot hazard R3 names. **Increment 2 tells that campaign what replaced
  it.**
- **The plan's increment-4 heading and model tables.**
- **The peer banned-term list** — no action needed; retiring `dial` helps it.

## Open at the increment-2.5 gate

✅ **UPDATE 2026-08-04 — the three blocking items are ANSWERED.** The human
ruled scope (**R10** — full design ships, CP-A rejected), the ceremony
contradiction (**R11** — R4 stands, increment 5 amends § Execution mechanics),
and the curriculum F-twin (**R12** — `learner · teacher` stay distinct, the
NM-twin is second-order). Items 1, 2 and 3 below are retained as the record of
what was decided and why; **read them with their rulings**. Items 4, 5 and 6
remain open and do **not** block increment 3.

**The only thing still standing between here and increment 3 is the revert
itself** — `git checkout -- DEV.md AGENTS.md AGENTS.principal.md`, verified with
`git status --porcelain --` on those three returning empty.

Each item carries the reviewer's proposed resolution, per the PAUSE protocol.

1. **✅ ANSWERED by R11 — the ceremony contradiction R9 did not reach.** R9
   fixed _who narrates_ the value; the invariant governs _who grants the
   exception_. Committed baseline ceremony is **all five ARs** [read: `git show
   e1f69580:AGENTS.principal.md` § Incremental TDD Workflow]; `medium` fires
   **AR-1 and AR-5 only**, so the default silently removes AR-2, AR-3 and AR-4
   from every unit of work. The invariant sanctions exceptions "**per increment
   or per campaign**" — a standing repo-wide default is neither. And **nothing
   in the increment list amends the section**: increment 5 amends _invariant 2_
   (Phase-0 ordering), a different thing [read:
   `~/.claude/plans/governance-campaign-resuming-recursive-quokka.md:535`]. As
   planned, `AGENTS.principal.md` ships asserting "Ceremony is uniform — no
   agent-side lightening" **and** a sub-maximum default.
   - **Option (i) — CP-B, the reviewer's pick.** Default `ceremony: full`, and
     let `HUMANS.md § Override grammar` be the mechanism — it is already
     human-only, agent-never-proposes, and carries the audit-trail rule.
     `medium` becomes "skip AR-2, AR-3 and AR-4 this campaign, my call". Keeps
     the invariant literally true, needs no amendment, and makes the ceremony
     setting **redundant rather than contradictory**. ⚠ Cost: it reverses R4's
     `medium`, which is why it is the human's call and not the agent's.
   - **Option (ii) — keep R4.** Add an explicit § Execution mechanics amendment
     to increment 5's scope, restating uniformity _within a declared level_ and
     naming the default. Preserves R4; enlarges the surgery.
2. **✅ ANSWERED by R12 — the curriculum side owes an F-twin, and it is
   second-order.** § 4's "Documentation as a both-hats case" is a conjunction
   requiring V **and** F, and it is the passage R5's disposition cites while
   concluding a two-V pair. Plan open item 1 already suspected this ("exercise
   files _arguably_ owe an F-twin too"); it is not arguable — the cited sentence
   says so. **Options:** (a) make the curriculum pair
   `learner · teacher · the-NM-being-taught`; or (b) drop the pair to `reader`
   and let the F-twin ride the same `twin-doc` values software work uses. Either
   way the § 4 citation must be quoted for what it says.
3. **❌ REJECTED by R10 — CP-A, the reviewer's lead proposal: ship only the one
   enforceable rule.** The `## Epistemology` block (now three fields, per the
   delegate ruling) on every `src/` README, plus one heading check in
   `scripts/lib/check-governance/`, plus the house-terms fence R4 requires
   anyway. **Defer** the work-kind split, the twin-doc value sets, the ceremony
   setting and prospective/retrospective. Rationale is finding **L**: 48 cells,
   one worked through. It would dissolve items 1, 4 and 6 here and take the
   campaign from six text increments to two. It answers a measured gap — **44
   `src/` directories carry a README and no `DOCS.md`** against a committed
   convention requiring both.
4. **CP-D — a fourth `retrospective` option the earlier set missed.** Define
   `retrospective` as a **remediation mode for code that already exists**, never
   a mode of Phase 0. Then invariant 2 is not in conflict at all, because Phase
   0 governs _new module establishment_ — there is committed precedent for that
   scoping move [read: `git show e1f69580:HUMANS.md` § Override grammar, the
   "trivial fix mode" entry]. AR-1 and AR-2 are then correctly **absent** rather
   than degraded, and the 44-directory backlog gets a named mode. The reviewer
   also found option (a)'s price understated on four counts, the sharpest being
   that `ceremony: full · retrospective` fires five ARs while **no AR ever
   reviews a design** — which instantiates the very symptom `ceremony` is named
   after.
5. **The twin document's boundary against `DOCS.md` is unspecified** — and a
   third state already exists at HEAD: the blocked peer shipped twin content as
   a README section, `## What a consumer can predict` [measured: `git grep -n
   'What a consumer can predict' e1f69580`]. Either sanction that shape as a
   discharged twin, or say what happens to it.
6. **Finding C's residue — the boundary runs on the wrong axis.** Either name
   `src/lib/embody/` explicitly as the F-grounded artifact § 4 names, or drop
   the work-kind split and let the `twin-doc` value carry the distinction
   (`twin-doc: machine` _is_ "this is F work"), which also dissolves finding B
   without R4's unnamed-paths patch.

**Unchanged and still held by the human:** the increment-2.5 revert —
`git checkout -- DEV.md AGENTS.md AGENTS.principal.md`, **three files**; the
invariant-2 ruling that unblocks `retrospective`; and curriculum twin-doc
values.

⚠ **The revert's verification instrument must be `git status`, not a grep.** The
draft is **338 changed lines** across the three files, of which only **11**
contain the string `territory-tracks` [measured:
`git diff -U0 -- DEV.md AGENTS.md AGENTS.principal.md | grep -E '^[+-]' | grep -v '^[+-][+-][+-]'`,
total vs `grep -c territory-tracks`]. The draft's own section heading is
`## Territory tracks` — **a space, not a hyphen** — so a `territory-tracks` grep
never matches `DEV.md:917`, the section the model is named after. **A grep-only
gate can read green over a partial revert.** Verify with
`git status --porcelain -- DEV.md AGENTS.md AGENTS.principal.md` returning
**empty**, and re-run it immediately before staging any governance file, because
peers dirty this worktree continuously. (Caught by a context-free handoff
validator, not by the campaign.)

### Notice to the `evaluators-intercept` campaign — partial discharge

That campaign's close condition is "the governance campaign landing **§
Territory tracks**" [read:
`.planning-handoffs/evaluators-intercept/AR-LOG.md:69`]. **This file is the
notice; their file is not edited.**

- **§ Territory tracks will never land.** The four-track model is superseded,
  and increment 1 retired the noun `track` outright — see the
  [Glossary](#glossary--agent-decisions-increment-1).
- **The successor section has no name yet**, because `track` was retired with no
  replacement. **Naming it is increment 3's job** — it is the increment that
  decides what sections exist — and until it lands, that campaign's gate item
  has no target. This is exactly the silent-rot hazard R3 names.
- Their citation defect is separate and still open: their `:57` quotes a
  sentence that exists nowhere. Also theirs to fix.

⚠ **Process note, recorded because it is this campaign's own miss.** Two lines
in this file said "**Increment 2 must tell that campaign what replaced it**",
and increment 2 did not [measured: `git show b2060515 --stat` → 1 file changed,
this AR-LOG only]. **An obligation written into the record is not discharged by
being written.** Increment 3 completes it once the successor section is named.

### `setting` — coined without adjudication, owed an AR

The campaign's defining sentence now reads "two kinds of work × three
**settings**", and `setting` occupies the slot `dial` was retired from. **It was
never run through the Glossary's three-criteria test** — no incumbency
measurement, no corpus-collision check, no ruling. Under the rule this campaign
adopted at increment 2 — _any increment that retires or coins a governance noun
carries an AR_ — `setting` is a governance noun that entered the record with no
review. **Increment 3's `ar-2` adjudicates it before increment 4 writes it into
`DEV.md`.** (Also a context-free validator catch.)

## Section structure (increment 3)

The structural sketch, written before any governance prose, for `ar-2` to
challenge. Increment 3's deliverable per the campaign's declared gate set.

### Two naming decisions this increment owed

- **The `DEV.md` section is named `## Work routing and ceremony`** [relayed:
  human, 2026-08-05]. ⚠ **An earlier draft of this line named it
  `## What a unit of work owes`; `ar-2` rejected that and it is withdrawn.** The
  phrase was free, but the _noun_ was not: `DEV.md` already owns this concept as
  `increment` — **96** lines across the four governance files against **18**
  bare `unit`, of which the `DEV.md` ones are the _test_ sense — and the file
  reads **"One unit test = one increment of work"**, putting the two on either
  side of an equals sign [measured: `git show HEAD:DEV.md | grep -ciE
  '\bincrements?\b'` etc.]. Coining a rival scope noun is exactly the
  synonym-and-homonym pair step 0.1 exists to resolve. The chosen name coins no
  scope noun at all.
- **`setting` is RETIRED as a collective noun — no replacement.** It was coined
  without adjudication (flagged at increment 2) and it fails the Glossary's
  criterion 2: `git grep setting` is dominated by the harness config [measured,
  at `2055a838`: `settings.json` on **13** lines; `\bsettings?\b` in committed
  governance **13** — `DEV.md` 2, `AGENTS.md` 1, `AGENTS.principal.md` 1,
  `HUMANS.md` 9; live corpus **10**]. The three things are named individually —
  `twin-doc`, `ceremony`, and the documentation timing — exactly as the work
  kind gets no collective noun. **The campaign's own summary sentence must stop
  saying "three settings."**

### Heading tree

`DEV.md` — one new `## What a unit of work owes`, placed after
`## Citation and claim conventions` and before `## Development Workflow`, so it
reads before the workflow it modifies:

```text
## What a unit of work owes
### Software work and curriculum work      ← path-routed, mechanical
### twin-doc                                ← which reader owed a written account
### The Epistemology block                  ← the 3 fields, incl. the delegate
### ceremony                                ← which reviews fire; human-set
### Prospective and retrospective           ← incl. the standing block
### Where the answers are recorded          ← commit body + campaign AR-LOG
```

`AGENTS.md` and `AGENTS.principal.md` — **no restatement of the above.** Each
gets a short pointer, plus two edits they alone carry:

```text
§ Execution mechanics   ← R11's amendment: uniform WITHIN a declared level
§ Vibetoading and Frogramming — house terms
                        ← R4's fence: taught terms, never routing labels
```

### The rule that puts each thing where it goes

A rule binding every agent and tool lives in `DEV.md`, **one copy**, with both
`AGENTS*.md` pointing in [read: `HUMANS.md § Field protocols`]. So the model
itself is `DEV.md`'s; only the two amendments above are duplicated, and they are
duplicated because each file states its own execution rules.

### Which citations carry fragments

`.planning-handoffs/` is outside the checker's corpus, but **both `AGENTS*.md`
are inside it**, so their inbound fragments are verified. Every pointer from
`AGENTS*.md` into the new section must use the live anchor
`#what-a-unit-of-work-owes`. **No citation anywhere may point at a draft-only
heading** — `#territory-tracks` is dead and must appear nowhere.

### Out of scope for the three files

Increments 7–9 target `HUMANS.md § Override grammar`, `.claude/agents/ar-1.md`
and `ar-5.md`, and `.claude/skills/tadpotyping/`. **They are not part of this
DRAFT set** and remain owed.

### AR-2 analog verdict and the DRAFT set (increments 3–6)

**2026-08-04 `ar-2` verdict: PAUSE** [relayed: ar-2] — four blockers, all
verified independently and all fixed before prose was written:

1. **`§ Execution mechanics` exists only in `AGENTS.principal.md`** [measured:
   `git show HEAD:AGENTS.md | grep -c 'Execution mechanics'` → **0**]. The
   sketch had specified it for both files. Fixed: the _rule_ lives once in
   `DEV.md`; `AGENTS.principal.md` gets a corrected bullet, and **`AGENTS.md`
   gains a prompted block-quote it never had** — it is the file for models that
   need things prompted rather than assumed.
2. **The tree covered 1 of at least 6 `DEV.md` touch points.** All six are now
   written [relayed: human, "All six — make the DRAFTs complete"].
3. **The section name coined a rival scope noun** — see above.
4. **§ Out of scope answered the wrong question.** Now names what a _reader_
   might wrongly assume the section covers.

`ar-2` also ruled, against the reflex, **do not split `### ceremony`** — the
corpus carries both § 4 horns in one 20-line sub-subsection, and the real
problem was that the two horns describe a **relation** between `twin-doc` and
`ceremony`. The relation now sits in the section lead, where it governs both.

**The DRAFT set, ready to swap:** `DEV.DRAFT.md`, `AGENTS.DRAFT.md`,
`AGENTS.principal.DRAFT.md`, each built from **HEAD**, not the dirty working
copy [verified byte-identical to HEAD before editing]. The four-track draft
therefore never enters history, and the increment-2.5 revert becomes unnecessary
— the human deletes the dirty originals and renames these.

⚠ **Two live consequences of the DRAFT mechanism, both measured:**

- **`check:governance` reads 6 errors until the swap** [measured: `npm run
  check:governance`], all one cause — `./DEV.md#work-routing-and-ceremony` from
  the two `AGENTS.DRAFT` files, pointing at a heading that exists in
  `DEV.DRAFT.md` and not yet in the live `DEV.md`. **They resolve on rename.**
  The alternative — pointing at `./DEV.DRAFT.md#…` — would be wrong at merge.
- **The DRAFTs mask the `[headings]` loss check.** It fires only when a HEAD
  heading is missing from the **entire working corpus** [read:
  `scripts/lib/check-governance/headings.mjs`], and `DEV.DRAFT.md` currently
  holds all 93 of `DEV.md`'s HEAD headings. **While the DRAFTs exist, no heading
  deletion from the canonicals can raise an advisory.** The campaign's own
  loss-detection instrument is disabled by its own scaffolding. Re-run the check
  after the swap, when the masking lifts.

### Still owed after this DRAFT set

Not in the three files, and **not** silently dropped:

- `HUMANS.md § Override grammar` — the ceremony phrases the human uses to set a
  level, and a workflow-step entry in `§ Update triggers`.
- `.claude/agents/ar-1.md` and `ar-5.md` — both anchor to "the Phase 0 README
  spec" and need the twin named as an input. **Semantic, not numeric.**
- **`.claude/agents/ar-2.md` — newly urgent, and in no increment.** It carries
  three dead Phase-0 step numbers [measured: `git grep -nE 'step 0\.|Phase 0
  step' HEAD -- '.claude/'` → `ar-2.md:6` "(Phase 0 step 0.6)", `:41` "step
  0.1", `:42` "step 0.4"]. Under the three-step scheme now written into
  `DEV.DRAFT.md`, `0.6` and `0.4` name steps that do not exist and `0.1` means
  something else. Found by `ar-2` reviewing its own contract.
- `.claude/skills/tadpotyping/` — still VOID; its DROPPED list must gain the
  twin or `twin-doc: none` work silently starts owing one.

## STATE AS OF 2026-08-05 — read this before anything above

⚠ **Several sections above are now STALE. This block supersedes them.** They are
kept because they record how decisions were reached, but do not act on them.

**The design is MERGED.** `DEV.md § Work routing and ceremony` exists; Phase 0
is three artifact-named steps; both `AGENTS*.md` carry the pointer, the R4
fence, the R11 ceremony correction, and a Phase-0 summary that matches. The
three canonicals are committed and the four-track draft never entered history —
it was replaced by a DRAFT-file swap rather than the planned revert.

**Superseded by this block:**

- **The ⛔ do-not-commit order on `DEV.md`/`AGENTS.md`/`AGENTS.principal.md` is
  DISCHARGED.** It existed only while they carried the four-track draft
  [measured: `grep -c territory-tracks` on the three → **0/0/0**]. Committing
  them is now correct and required.
- **The increment-2.5 revert is MOOT** — never run, never needed. Every "partial
  revert turns the checker red / 8 of 11 links" warning is spent.
- **The renumbering radius is NOT ~135 sites across ~23 files.** Measured live
  after the rewrite: **12 lines**, and the largest holder (`ar-2.md`, 3) is
  closed. The recorded figure estimated a scheme that no longer exists.
- **§ Still owed after this DRAFT set** listed `ar-1.md` and `ar-2.md`; both are
  **closed** at `1ad540f6`. There is no DRAFT set any more.
- **§ Section structure's heading tree** still shows the withdrawn name
  `## What a unit of work owes` at its root. The ratified name is
  **`## Work routing and ceremony`**, as the two naming-decision bullets above
  the tree already say.
- **§ Notice to the `evaluators-intercept` campaign** says the successor section
  "has no name yet" and that naming it is increment 3's job. Increment 3 landed;
  **the successor is `DEV.md § Work routing and ceremony`.** That is the notice
  to relay — and it is still undischarged toward that campaign.
- **§ `setting` — coined without adjudication** reads as open. It was
  **adjudicated and RETIRED** at increment 3; see the naming bullets.

### ⚠ OPEN — this campaign's own `ceremony` value has no recorded human ruling

✅ **ANSWERED by R13, 2026-08-05 — this heading is kept for the record and is no
longer open.** The human set `ceremony: full` for the campaign, so the value is
now cited rather than agent-stated. **The two future-tense promises below were
never kept and are not retroactively true** — no confirmation happened at the
increment-2 gate; the confirmation happened at increment 7's gate, five
increments later, and only because a context-free validator found the gap. Read
the paragraph below as the finding, and R13 as its discharge.

Two lines in this file promise, in the future tense, that "the human confirms it
at the increment-2 gate". Increment 2 landed at `b2060515`; **no ruling records
the confirmation** [measured: `grep -n 'human confirms it'` → 2 hits, both
future-tense; no R-number records a ceremony value]. Under R9 and
[DEV.md § Ruling provenance](../../DEV.md#ruling-provenance) — "a ruling is
cited or it does not exist" — **this campaign's `ceremony: full` is still
agent-stated**, which is precisely what R9 forbids. Every commit body in this
campaign carries `ceremony: full` on that unconfirmed basis. **Ask the human to
confirm or set it, and record it as a ruling.** Found by a context-free
validator; the rule this campaign wrote bit the campaign that wrote it.

### Recording the value is not choosing it

A related gap the same validator found, worth stating once because agents will
hit it: **transcribing the human's ceremony value into a commit body is not
"stating" it.** R9 forbids the agent _choosing or lowering_ the level; the
commit-body line is the audit record of the human's choice. If no value has been
set, the agent asks — it does not pick one and write it down.

## Honour-system inventory (finding I)

Recorded so the next campaign is not surprised. Of the design's rules, **exactly
one is mechanically checkable**: the `## Epistemology` block, via a heading grep
over READMEs — and under R4 it is the artifact that ships on almost every
module, which is what makes it worth wiring. It also answers a measured gap:
**44 directories under `src/` have a README and no `DOCS.md`** [measured: `find
src -name README.md | wc -l` → 147; `find src -name DOCS.md | wc -l` → 103, at
2026-08-04T21:15Z — this drifted from 45 within one session as a peer landed a
`DOCS.md`, so re-measure rather than quote it] — the default state, never
declared.

Unenforceable by any current check: track-derived-from-path; the per-file union
rule; `frog`/`vibetoad` phrase recognition; that the agent states its dials;
that a `retrospective` artifact set is ever actually produced; and the AR-5
campaign-end trigger, which is a chat string. `check:governance` runs four
checks — `links`, `roster`, `claims`, `headings` — and **none reads step
numbers**. `governance-guard.py` judges Bash command shapes only.

**⚠ Correction, increment 2 (AR-1 re-run).** An earlier revision of the sentence
above said "**of which only `links` produces errors**". **That is false, and it
understated this repo's own enforcement.** Measured:

| check      | severity               | evidence                 |
| ---------- | ---------------------- | ------------------------ |
| `links`    | error                  | `links.mjs:106`          |
| `roster`   | **error**              | `roster.mjs:249`         |
| `claims`   | advisory **and** error | `claims.mjs:46` / `:278` |
| `headings` | advisory only          | `headings.mjs:29`        |

[measured:
`grep -on "severity: '[a-z]*'" scripts/lib/check-governance/{links,roster,claims,headings}.mjs`].
**Three of the four can error**; only `headings` is advisory-only. The plan file
had this right and the committed AR-LOG contradicted it. The honour-system
conclusion still holds — the design's rules remain almost entirely unenforced —
but it must not be argued from a false floor.

## Ceremony disclosures for this campaign

Recorded here rather than only in the plan, because this file is the canonical
record and `ceremony: full` nominally fires AR-4 per text increment.

- **Campaign ceremony: `full`, AR-3 not applicable** — no tests exist to
  challenge. Real gate set: AR-1 on the design · an AR-2 analog on the section
  _structure_ before prose · AR-4 in loss-lens-only mode per **text** increment
  (4–9) · AR-5 pathspec-scoped at close.
  - **R9 supersedes how this value is set**, not the value: ceremony is the
    human's to set, per campaign or per increment. This `full` was agent-stated
    at increment 0; `full` is the maximum and lightens nothing, so no invariant
    was breached, but **the human confirms it at the increment-2 gate**.
- **No AR fires on increment 1** (the glossary). It is not a text increment in
  the 4–9 sense — it writes no governance prose — and AR-1 at increment 2
  reviews the whole corrected design with the glossary included. This is a
  disclosure of scope, **not** an agent-side lightening: per
  [AGENTS.principal.md § Execution mechanics](../../AGENTS.principal.md#execution-mechanics)
  only the human grants ceremony exceptions, and this is not one — increment 1's
  output is reviewed, just at the next gate rather than its own.
- **⚠ `full` is undefined for docs-class work** — all three ceremony values are
  specified in ARs that presuppose code (AR-3 needs a failing test, AR-4 an
  implementation file). Carried as an open item; do not treat it as settled.

## Increment 9 — the tadpotyping retirement and its loss ledger

R14 retired `.claude/skills/tadpotyping/`. The skill was **never tracked**, so
deleting it leaves no commit, no diff, and no `git show <sha>:path` — **this
ledger is the only record that will exist.** That is a harder case than an
ordinary doc migration, and the sequencing below is the whole answer to it.

> ⚠ **This file is NOT transitional scaffolding and is NOT deleted at campaign
> close.**
> [DEV.md § What goes in docs vs. plans vs. handoffs](../../DEV.md#what-goes-in-docs-vs-plans-vs-handoffs)
> says handoff files under `.planning-handoffs/` are "deleted when their
> migration completes" and are "never a durable source of truth" — read
> literally, that is explicit license to delete the sole record of an
> irreversibly deleted governance instrument. It does not apply here: this file
> is a **ruling home** under
> [DEV.md § Ruling provenance](../../DEV.md#ruling-provenance), discovered by
> `git ls-files '*AR-LOG*'`, and § Increment 9 below is the only surviving
> account of a file that has no SHA. Flagged by `ar-1` as the retirement's
> bounded-context defect.

### Why the file was not committed first

**Three alternatives existed. All three are recorded, because a disposition that
is not written did not happen** [read:
[DEV.md § Ruling provenance](../../DEV.md#ruling-provenance) — "a ruling is
cited or it does not exist"].

- **Commit it, then delete it — REJECTED.** This campaign's binding precedent is
  that superseded governance does not enter history: the DRAFT-file swap existed
  precisely so the four-track draft "never enters history" [read: § AR-2 analog
  verdict and the DRAFT set]. A void governance document recoverable by SHA
  reads as authoritative to whoever finds it and enumerates nothing; the
  migration rule asks for **enumeration** [read:
  [DEV.md § Documentation migration discipline](../../DEV.md#documentation-migration-discipline)],
  which a SHA satisfies not at all.
- **`rm -rf` — REJECTED** [relayed: human, 2026-08-05, choosing `mv`].
- **`mv` out of tree — CHOSEN (R18), and PENDING as of this commit.**
  Destination `~/tadpotyping-retired-2026-08-05`, named here so the
  transcription stays auditable for as long as that copy survives. The file will
  leave the working tree, the checker's corpus, and the session skill list, and
  still never enter history. **The `mv` is the human's to run and had not run
  when this ledger was committed** [measured: `ls -la .claude/skills/` →
  `tadpotyping` still present; `ls ~/tadpotyping-retired-2026-08-05` → no such
  path]. The ledger lands first on purpose: committing it while the source is
  still on disk is what makes it auditable against that source, and the removal
  produces no diff, so nothing about it needs to ride in a commit.

⚠ **"Never tracked" was an accident, not a design property, and this increment
makes it permanent.** The DRAFT files were _built_ never to be committed — that
was their mechanism. This skill was authored as a live, registered, loadable
instrument in a directory where **tracking is the house norm and every one of
its four peers got its own commit** [measured: `git ls-files .claude/skills` →
`aran-weaving/` (+2 references), `btw/`, `fanout/`, `handoff/`; `git
check-ignore -v` on the tadpotyping path → exit 1, so it was never ignored]. It
was simply never staged. The "no commit, no diff, no `git show`" framing below
describes the consequence of an oversight the campaign is electing to make
permanent — not a property the artifact was given on purpose. (`ar-1` finding.)

**The honest cost:** a ledger is a lossy transcription, and once the file is
gone nobody can audit the transcription against its source. That is answered by
**sequencing, not by argument** — all three controls ran while the file still
existed: the ledger was drafted against the live file, `ar-1` reviewed the
retirement with the live file present, and `ar-4` ran the loss lens over the
ledger against the live file. That is the only moment at which both artifacts
exist, and this increment is built around it. R18's out-of-tree copy is the
fourth control, and the only one that outlives the deletion.

### The ledger

**BANKED** — quoted, because nothing in `DEV.md` carries it. Each is marked
**`CANDIDATE — not promoted`**: _a retirement may record what it drops; it may
not add convention._ Promoting any of these into `DEV.md` is a governance change
owing its own AR, its own increment, and the human's approval. Doing it inside a
retirement commit would be smuggling.

> **R17's narrow exception, added after `ar-1`:** _…but a retirement may not
> leave **undefined** a convention `DEV.md` already **uses**._ Writing down what
> an already-in-use marker means is documenting an existing convention, not
> adding one, and the rule as first stated produced the one outcome a loss
> ledger exists to prevent — a canonical file left using a marker it defines
> nowhere. **Exactly one item qualifies today (BANK-2);** BANK-1 and BANK-3 stay
> CANDIDATE, unchanged, because both genuinely would add convention.

**THE SOURCE SENTENCE THIS LEDGER IS COMPUTED OVER, quoted verbatim** — it is
the passage most in need of preservation and the first draft paraphrased it
[read: `.claude/skills/tadpotyping/SKILL.md:33-35`]:

> DROPPED: Phase 0 in full (ubiquitous language, README spec, `types.ts`-first,
> the DOCS.md architectural sketch), AR-1 through AR-5, the ZOMBIES test bar,
> the per-directory `DOCS.md`, and the 🔍 sandbox checkpoint.

⚠ **Correction, 2026-08-05 — R14 miscounted this sentence.** R14 says "5 of its
6 DROPPED categories" and its own enumeration names five in total. **The
sentence has FIVE top-level items**, not six: Phase 0 in full · AR-1 through
AR-5 · the ZOMBIES test bar · the per-directory `DOCS.md` · the 🔍 sandbox
checkpoint. The correct statement of R14's ground is: **four of the five are
outside the `ceremony` axis entirely, and the fifth — the ARs — is only partly
expressible, because `light` drops AR-1 through AR-4 but no value removes
AR-5.** R14's substance is unchanged and R14 itself is not edited; the count is
corrected here. Caught by `ar-1`, and it is this campaign's own adopted lesson
landing on its last increment — a false claim in an append-only record, of
exactly the kind an AR catches.

- **BANK-1 — "Defer nothing" (§ 3). CANDIDATE, not promoted.** Verbatim: _"no
  `TODO`, no `FIXME`, no 'clean this up later', no commented-out alternative
  kept 'just in case'. **If it is worth a deferral comment, it is worth doing
  now or worth not writing.**"_ **The loss is the application, not the
  principle** — and the ledger must not overstate it. **`AGENTS.principal.md`**
  carries the reasoning already [read:
  [AGENTS.principal.md § Adversarial Review Protocol](../../AGENTS.principal.md#adversarial-review-protocol)
  — "Deferred issues cost more than fixed ones: the context you hold now is
  worth more than the context you'd rebuild later"], with the analog at
  [AGENTS.md § Adversarial Review Protocol](../../AGENTS.md#adversarial-review-protocol);
  both apply it to **review findings**. _(An earlier revision of this bullet
  said `DEV.md` carries it and then evidenced `AGENTS.principal.md`. The quote
  was real; the file name was wrong.)_ What no file carries is the rule against
  writing the marker in the first place: `DEV.md` **detects** leftover markers
  at a gate but never forbids authoring them [measured: `grep -n 'TODO\|FIXME'
  DEV.md` → 2 hits, `:1555` using TODO approvingly and `:2185` an AR-4 detection
  question; no prohibition].
- **BANK-2 — the `DOCS-FLAG` paragraph (§ 3). PROMOTED to `DEV.md` (R17), the
  only item that is.** Verbatim: _"DEV.md's `DOCS-FLAG` marker is not a
  loophole. It records a KNOWN documentation drift that is genuinely outside the
  current change and names its fix; it is not a code deferral, and it does not
  travel into source."_ **The retired skill was the only document in this
  repository that defined a marker `DEV.md` actively uses** [measured: `git grep
  -in 'DOCS-FLAG' HEAD` → **one** hit, `DEV.md:2358`, and it is an _instance_
  ("**DOCS-FLAG**: § 11's own example shows a different, older 3-group
  scheme…"), not a definition; the only definition was `SKILL.md:60`. **Grep
  `HEAD`, not the working tree** — this ledger now quotes the term itself, so
  the working-tree count is self-polluted and will not reproduce.] Retiring it
  under the no-promotion rule would have left `DEV.md` **strictly worse than
  before this increment ran**: the marker used in the canonical file and defined
  nowhere in the corpus. That is the one hole where the rule produced a worse
  repo than it inherited, which is why R17 carves it and nothing else.
- **BANK-3 — "no grandfathering" (§ 5). CANDIDATE, not promoted.** Verbatim:
  _"There is NO grandfathering: surviving code does not inherit trust from
  having been written, and 'it already works' is not evidence it was designed."_
  [measured: `git grep -in 'grandfather' HEAD` → **0** repo-wide — again grep
  `HEAD`, since this bullet's own quoting pollutes the working tree]. The
  nearest live text is about _running_ ("'Should work' ≠ 'does work'"), not
  about _design_.
- **BANK-4 — the justification triad and the obligation to record it (§ 1, § 4).
  CANDIDATE, not promoted.** Verbatim: _"the track for work whose **complexity,
  deadline, or centrality** does not warrant the full cycle"_ and _"Name in the
  body which of complexity, deadline, or centrality bought the shortcut."_
  **Added after `ar-1` found it in none of the four buckets** [measured: `grep
  -in 'centrality\|deadline'` over this file before the fix → 0]. It is not the
  "build budget" frame, which is separately DROPPED below — it is the
  **obligation to record a ground**, and the gap it leaves is real: the merged
  design records the ceremony **value** and never **why**, while
  `DEV.md § Work routing and ceremony`'s lead asserts that "**low ceremony is
  earned by a strong twin**". Nothing anywhere records how a sub-maximum level
  was earned, so that claim is currently unfalsifiable by construction. The
  retired skill held the only such mechanism the repo ever had, crude as it was.

**DROPPED, with reasons** — enumerated so the drop is not silent:

- **§ 2's "ceremony for build budget."** Both negative clauses are **covered and
  improved**: `DEV.md § ceremony` says no value removes AR-5, and
  `§ Work routing and ceremony`'s lead says "**ceremony and `twin-doc` move
  inversely. Low ceremony is earned by a strong twin, not by a missing one.**"
  The _positive_ clause — that lowering ceremony buys **build budget** — is
  genuinely absent, and its absence is **deliberate**: the merged design grounds
  a sub-maximum ceremony in ontology § 4's twin relation, a **quality**
  argument. "Budget" is the exact rationalization the skip-resistance rule
  exists to catch, so banking it as a candidate would re-import the frame the
  design chose against.
- **The `hack:` commit prefix (§ 4).** A contradiction to drop, not a loss to
  record: used **zero** times in the repository's entire history [measured: `git
  log --all --format=%s | grep -c '^hack:'` → 0], while both `AGENTS*.md` state
  a closed prefix set (`add:` / `docs:` / `fix:` / `refactor:`). Its rationale
  sentence — "the commit record IS the audit trail" — is covered and improved by
  `DEV.md § Who decides, and where the answers are recorded`, which names
  **two** durable surfaces where the skill named one.
- **The routing phrase `"tadpotyping, my call"`.** [measured: `grep -c
  'tadpotyping' HUMANS.md` → 0] An override channel that never had human-side
  grammar. Removing it also removes a channel that would have **competed with
  increment 7's ceremony phrases**, which landed at `70c07a2b`.
- **The tadpole metaphor** ("the tadpole is not thrown away — it grows up").
  Dies with the retired `track` vocabulary. `Tadpole` and `Tadpoling` survive as
  `cspell.json` entries under R7, which is all a dictionary entry ever asserts.
- **The 🔍 sandbox-checkpoint waiver (§ 2). Added after `ar-4` returned a
  BLOCKER: the first draft put this item in NO bucket at all.** It was swept
  under "Phase 0 in full", and **that is wrong** — unlike the ZOMBIES bar and
  the per-directory `DOCS.md`, which really are 0.3 artifacts, the 🔍 checkpoint
  is a **Phase-1/2 step** with its own skip condition, unrelated to 0.1/0.2/0.3
  [read:
  [DEV.md § Sandbox Checkpoints](../../DEV.md#sandbox-checkpoints--user-observable-features)].
  So R16 does not reach it and it needed its own line.
  - **What is already committed, and is the standing answer:** the checkpoint is
    a **human-held gate** — "only the human skips, and the only legitimate skip
    is an increment with no user-visible surface, declared explicitly."
  - **The narrow delta the skill held, disclosed rather than escalated:** it
    allowed a waiver for work that _does_ have a user-visible surface, on
    complexity/deadline/centrality grounds. Nothing replaces that, and — per
    R16's reasoning — recording it as an unmet "need" would manufacture a second
    citable back-door around a gate the human already controls. **The honest
    statement is that the waiver is gone and the gate is unchanged**; a human
    who wants to skip a checkpoint on a user-observable increment says so
    directly, and it is visible in the conversation rather than licensed by a
    skill.

**COVERED — nothing banked**, each cited to its live home. Citations are
**dual-target** where the rule binds every agent, because the retired skill
bound every session regardless of model and a single-file citation asserts
coverage a non-principal agent cannot find:

- § 1's never-self-assign and its skip-resistance restatement —
  `DEV.md § ceremony` ("the agent never states it and never lowers it") and
  `DEV.md § Adversarial Review Protocol`'s skip-resistance rule.
- § 2's BINDING list — structural: `ceremony` names which reviews fire and
  nothing else, so the conventions were never in its scope.
- § 3's "that is a finding for the human — say so and stop" —
  `AGENTS.principal.md § Emergency Brake and Redirects` and
  `AGENTS.md § Emergency Brake`. ⚠ **Imperfect, and recorded as such:** those
  sections cover being _stuck or blocked_, while the skill's clause is
  specifically about a **budget** that "genuinely will not stretch." Since this
  ledger separately purges "budget" as a legitimate frame, citing a
  budget-contingent sentence as covered by a budget-agnostic mechanism sits in
  mild tension. Disclosed rather than smoothed over (`ar-4` finding).
- § 4's announce-each-commit and pushing-stays-with-the-human —
  `AGENTS.principal.md` invariant 5 and § Git Policy, and `AGENTS.md`'s analog.

**RESOLVED CONFLICT — not covered, and moved out of COVERED after `ar-1`:** §
1's _"The route may be scoped to one task or named for a campaign. **Ask which
if the human did not say**, and carry the answer into every commit body."_ The
first draft filed this under `DEV.md § ceremony`'s "per increment or per
campaign", which establishes only that two scopes **exist**. What an agent does
when the human's phrase fills the value slot and leaves the scope slot empty is
**not** answered there — and `HUMANS.md § Override grammar`'s "One thing the
agent may ask you, **and only this**" now arguably forbids that ask. Recorded as
a conflict this campaign created and did not resolve, not as content that
survived.

**BANKED IN ONE LINE — the authoring principle**, because whatever eventually
answers the open items below faces the same question: § 0's _"This skill is the
ceremony delta ONLY. Everything in DEV.md § Codebase Conventions binds
unchanged, and this file does not restate it."_ CANDIDATE, not promoted.

### CLOSED — a mode that skips Phase 0 entirely does NOT exist (R16)

⚠ **An earlier draft of this section recorded this as an OPEN NEED, discharged
by the pending `retrospective` ruling. Both halves of that were wrong**, and
`ar-1` returned a BLOCKER on it. Corrected in place rather than dropped, because
the reasoning matters more than the conclusion.

**The standing answer is NO, and it is already committed.** Phase 0 is
**non-negotiable invariant 2**, and the invariant preamble is unconditional
[read:
[AGENTS.principal.md § Non-Negotiable Invariants](../../AGENTS.principal.md#non-negotiable-invariants)
— "These apply unconditionally, regardless of task size, time pressure, or user
encouragement. They cannot be overridden by momentum"], reinforced at [read:
[DEV.md § Phase 0](../../DEV.md#phase-0-documentation-specification-before-any-code)
— "Agents routinely skip this phase under time pressure or when a task feels
small. Do not skip it. … Phase 0 is not overhead — it is the work."]. **The
retired skill was the only text in this repository that said otherwise, and it
is retired with it.**

**Why the first draft's discharge condition was structurally incapable of
paying.** It tied the need to the ruling on invariant 2's Phase-0 _ordering_ —
the one that unblocks `retrospective`. But no `ceremony` value, no
`HUMANS.md § Override grammar` phrase, and no ruling about artifact ordering can
create a Phase-0-skipping mode. **Only an amendment to invariant 2 itself can.**
The block asked a question about the invariant's _ordering_ to answer a question
about the invariant's _existence_ — R3's silent-rot hazard one layer deeper than
the draft saw.

**And a recorded "open need to skip Phase 0" is a citable back-door.** After
this increment, `git grep` would have returned a campaign ruling home stating
the capability is an unmet need awaiting a ruling. R14's own third ground was
that a rewrite "would have shipped an unblocked back-door around a deliberately
blocked door" — the draft re-opened that door in prose instead of in a skill
file, and under the skip-resistance rule it is exactly the citation an agent
under budget pressure would find and lean on.

**The honest half, kept:** the three mechanisms a reader might reach for do not
provide this, so nobody should go looking. `ceremony` names **which reviews
fire** and nothing else — every row of its table is an AR, and `light` does not
touch 0.1, 0.2 or 0.3. `retrospective` is ⛔ blocked, and even unblocked it
covers **deferral, not skipping** — it would leave types and tests standing,
where the skill dropped all of Phase 0. (⚠ R14's second ground told the human
that "skipping Phase 0 outright is what `retrospective` is blocked for"; that is
**withdrawn** — the real conflict was always with invariant 2. R14 stands on
grounds 1 and 3, both of which verify measured.) And `trivial fix mode`
explicitly refuses to be this [read: `HUMANS.md § Override grammar` — "Phase 0
is **not bypassed** — Phase 0 governs _new module establishment work_"].

**If a future ruling wants such a mode, it must amend a non-negotiable invariant
explicitly** — not add a fourth setting key, and not arrive as a skill.

### STILL OPEN — two gaps the retirement leaves, both with owners

Unlike the item above, these are not answered by anything committed.

1. **No re-review trigger for work that landed at low ceremony and became
   load-bearing.** The retired skill's § 5 carried one [read:
   `.claude/skills/tadpotyping/SKILL.md:88-89` — "Raise the promotion to the
   human when the code starts carrying weight the route never priced in."], and
   its mechanism ("promotion to any other track costs that track's Phase 0 in
   full") **dies with `track`** — the merged design has no promotion concept at
   all, because ceremony attaches to an increment or a campaign and never to
   code. **The design already has the right shape for this on a neighboring
   axis:** the `## Epistemology` block's third field is "what would falsify that
   delegation — the condition under which this module starts owing its own
   twin." There is no ceremony counterpart. **Owner: the next campaign that
   touches `DEV.md § ceremony`.** Either build the counterpart or record that
   the design refuses it by construction; silence is what this entry exists to
   prevent (`ar-1` finding).
2. **No mechanism records the GROUND for a sub-maximum ceremony level** — see
   BANK-4. `DEV.md § Work routing and ceremony` asserts that low ceremony "is
   **earned** by a strong twin", and nothing anywhere records how any given
   level was earned, so the claim is unfalsifiable by construction. **Owner: the
   same.**

⚠ **Both entries are written with owners and triggers deliberately.** A campaign
at close has no successor by default, and "the next campaign should take this
up" is the same construction as this file's own recorded miss — _an obligation
written into the record is not discharged by being written_ (`ar-1` CP-5).

### Records carried in from increment 8

Raised by `ar-4` as concern 7 — that two design-affecting calls were made with
no citable record. Both are recorded here rather than left in a commit body
alone:

- **Increment 7's `ar-4` concern 1 is DISCHARGED at `c35ebe5a`.** It found the
  level-versus-per-review-opt-out interaction rules freshly authored in
  `HUMANS.md` with no `DEV.md` anchor — new normative content in the human's
  operating manual, which that file's own lesson-routing table assigns to
  `DEV.md`. They now live in `DEV.md § ceremony`; `HUMANS.md` keeps the human's
  half and points in.
- **A plan deviation, taken deliberately.** The approved plan classified the
  missing AR-5 handoff floor on `§ AR-5`'s Trigger line as _record-only, do not
  fix_, reasoning that it was "a third `DEV.md` passage." **That reasoning was
  factually wrong** — Trigger and Skip are the same sentence and were already
  under edit in the same hunk — so it was fixed instead, quoting the clause
  verbatim from `§ ceremony`'s existing floor. `ar-4` verified the quote and
  judged the deviation justified rather than scope creep.

## Standing hazards

- **🪦 `.claude/skills/tadpotyping/` — RETIRED at increment 9 (R14).** ⚠ **The
  removal itself is PENDING and is the human's** — `mv` to
  `~/tadpotyping-retired-2026-08-05` per R18.
  - ⚠ **Correction, 2026-08-05 (handoff) — the stated reason was wrong, and the
    true one is stronger.** An earlier revision of this bullet said the agent is
    "hard-blocked from it by the global destructive-FS hook." **`mv` is not on
    that hook** [measured: `grep -n '\bmv\b'
    ~/.claude/hooks/block-destructive-fs.py` → no match; its `ALWAYS` set is
    `rm`, `rmdir`, `unlink`, `shred`, `srm`, `wipe`, `truncate`, `dd`, …, and
    `mv` appears in no deny list in either `settings.json`]. `rm` genuinely is
    blocked and `git rm` genuinely refuses an untracked path — but **`mv` was
    always available to the agent.** The real reason it is the human's:
    `.claude/skills/**` is **governance surface**, which "agents never edit
    without explicit human instruction in the current conversation" [read:
    [AGENTS.principal.md § Orchestrated delegation](../../AGENTS.principal.md#orchestrated-delegation)],
    and **no grant carries across conversations.**
    - ⚠ **Second correction, same bullet — read this against § Authorisation
      above.** A revision of this line said the path "was **not** among those
      the human authorized at plan approval." **That contradicts §
      Authorisation**, which records a full-governance-surface grant on
      2026-08-04 naming `.claude/skills/**` explicitly, and it is **withdrawn**.
      The path _was_ authorized — in **that** conversation. The 2026-08-05
      conversation that ran increments 7–9 granted a narrower set (`HUMANS.md`,
      `.claude/agents/ar-1.md`, `.claude/agents/ar-5.md`, `DEV.md`, this file),
      and § Authorisation's own closing sentence is what decides it: **"The
      invariant requires in-conversation instruction."** Caught by a second
      context-free validator, which noted the first correction had recreated the
      defect it was fixing — inside the file AR-5 reads first.

    Left as the human's on that ground, plus the ordinary one: an irreversible
    removal of a file with no git history is not an agent's call. **A wrong
    reason invites the next agent to check it, find it false, and act** — which
    a validator did to the first revision, and then did again to the second.
    **Until the `mv` runs, the skill is still on disk and still loadable in
    every session, and every claim in it is still VOID.** The ledger landed
    first and deliberately: it was reviewed against the live file by both `ar-1`
    and `ar-4`, which is the only moment both artifacts exist. It was never
    tracked, so the removal will produce no commit and no recoverable SHA; its
    content and every judgement below are banked in § Increment 9 — the
    tadpotyping retirement and its loss ledger. **What this bullet claimed while
    the skill was live, kept as the record of why it was a hazard:** every claim
    in it was VOID; it was untracked but **registered and loadable in every
    session**, and inside `check:governance`'s corpus despite being untracked;
    it dropped **AR-1 through AR-5, all of Phase 0, the ZOMBIES bar,
    per-directory `DOCS.md`, and the 🔍 checkpoint** — **contradicting the
    design's own separation of ceremony from twinning**; and it routed on
    `"tadpotyping, my call"`, a phrase absent from `HUMANS.md`. Those were true
    and are now moot. _(An earlier revision added "and its own name is unspelled
    in `cspell.json`". That was true when written and false by the time it was
    committed — `103ad736` added both spellings at `cspell.json:43-44`.
    Corrected here rather than left to rot.)_ ⚠ **The separation-of-concerns
    clause was itself dropped by increment 9's first draft and restored after
    `ar-4` caught it** — it is framed in the campaign's surviving concepts, not
    in retired `track` vocabulary, so losing it would have been a silent loss of
    the sharpest critique this bullet ever made.

  - ⚠ **Correction, 2026-08-05 (increment 9) — the name disagreement never
    existed.** This bullet claimed the skill "disagrees with the docs on its own
    name — the docs say **Tadpoling**, the skill says **Tadpotyping**." **That
    is false.** `Tadpoling` appears in exactly two places repo-wide,
    `cspell.json:42` and this file, and **no tracked governance file names this
    track at all** [measured: `git grep -in 'Tadpoling'` → `cspell.json:42` plus
    this file's own lines]. There were never two names in the docs — there was
    one name in an untracked skill, plus a dictionary entry left behind by the
    superseded four-track model and deliberately kept under R7. The charge was
    manufactured from a `cspell` entry read as a doctrinal claim, which is
    exactly what R7 says a dictionary entry is not: "a dictionary entry asserts
    only that a word is spelled correctly, never that the concept is live."
  - ⚠ **Correction, 2026-08-05 (increment 9) — "inside the corpus" was read as
    "deleting it would break the checker." It does not.** Corpus membership was
    real [read: `scripts/lib/check-governance/corpus.mjs` —
    `CORPUS_GLOBS = ['.claude/**/*.md', 'scripts/**/*.md']`, and the walk is a
    filesystem walk, so an untracked file is in the working corpus], but
    membership is what made its _contents_ checked, never what made its
    _existence_ required. Three reasons, each independently sufficient: (i)
    `[headings]` diffs **HEAD** headings against the working corpus, and an
    untracked file has no HEAD headings, so it can lose none; (ii) **no document
    in any corpus linked to it**, so `[links]` lost no target; (iii) `[roster]`
    reads `DEV.md` and `.claude/agents/ar-*.md` only. `.ls-lint.yml` carries no
    `.claude` rule, no hook or script enumerates `.claude/skills/`, and the
    skill was clean under both `markdownlint` and `cspell`, so it contributed
    nothing to either count.

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
  `[links]` errors, exit 1**. Revert **`DEV.md`, `AGENTS.md` and
  `AGENTS.principal.md` together — three files.** `cspell.json` is **not** in
  the set (R7) and is already committed, so including it would be a no-op that
  reads as a reversal of the ruling. _(This bullet said "and `cspell.json` …
  four" before R7 landed; a cold-start validator caught the contradiction
  against R7 in the same file.)_
- **⛔ Do not `git add` or commit `DEV.md`, `AGENTS.md` or `AGENTS.principal.md`
  before the increment-2.5 revert.** Each still carries the superseded
  four-track draft in the working copy. Committing any of them writes that draft
  into history permanently, turns the human's revert into a no-op, and makes
  undoing it require the history rewriting
  [§ Git Policy](../../AGENTS.principal.md#git-policy) forbids. The standing
  warning against _extending_ the draft does not cover _committing_ it — a
  cold-start validator put the odds of an agent walking into this at 30–40 %.
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
  - Increment 1 addendum: those two are the near-duplicate _pair_, but
    `spiralearn/` holds **six** entries in total — also
    `welcome-to-programming/`, `welcome-to-algorithms/`, `sandbox/`,
    `sandbox--pre-migration/` [measured: `ls -1 spiralearn/`].
    `welcome-to-programming/` carries taught vocabulary this campaign
    adjudicates, so a vocabulary sweep that reads only the pair is incomplete.
- **⚠ `ceremony` is a live COUNT NOUN in two peer campaigns, in this very
  directory.** **16 lines at HEAD** [measured:
  `git grep -niE 'ceremony [0-9]|ceremony (baseline|start|close)|post-ceremony|this ceremony' HEAD -- '.planning-handoffs/*'`],
  e.g. [read: `.planning-handoffs/evaluators-intercept/AR-LOG.md:5` — "Human
  rulings and AR resolutions for **ceremony 3** of the evaluators sprint"] and
  `:25` — "**ceremony baseline** `59a5ef60`". Governance's sense is a mass noun
  / scalar (`ceremony: full`); theirs is a countable sprint unit. The peers
  write it **bare**, so this campaign's key-bound convention mitigates its own
  text only. **Not this campaign's to retire — flagged, not fixed.**
- **⚠ A committed peer AR-LOG cites a sentence that exists nowhere.** [read:
  `.planning-handoffs/evaluators-intercept/AR-LOG.md:57` —
  `[read: AGENTS.principal.md § Non-Negotiable Invariants, 2 — "An agent never selects the track and never trims the list itself."]`].
  Measured: **0 occurrences at HEAD and 0 in the working-copy draft** [measured:
  `git show HEAD:AGENTS.principal.md | grep -c 'never selects the track'` → 0;
  `grep -c` on the working copy → 0]. A live provenance defect under
  [DEV.md § Ruling provenance](../../DEV.md#ruling-provenance) — "A ruling is
  cited or it does not exist." **Foreign; surface it to that campaign, do not
  edit their file.**
- **⚠ A committed peer campaign is BLOCKED on a section this campaign just
  retired the name of.** [read:
  `.planning-handoffs/evaluators-intercept/AR-LOG.md:69` — a carried-forward
  gate item naming "the governance campaign landing **§ Territory tracks**"].
  `track` is retired with **no successor noun**, so that gate item now points at
  a section that will never exist. **Increment 2 must tell that campaign what
  replaced it** — otherwise this is exactly the silent rot R3 names.
