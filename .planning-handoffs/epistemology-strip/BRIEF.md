<!-- cspell:ignore goldfishbrained socratizing Epistem Epistemolog checkability anaphor -->

# Brief — strip the `## Epistemology` block convention

> **Status:** decided by the maintainer 2026-08-06, **not** executed. The design
> question **was answered 2026-08-11** — see [§ Human rulings](#human-rulings),
> which supersedes the four exits below. This brief states the reason, the scope
> and the traps. Written by the session that found the defect, because the
> reason is the part that would be lost.
>
> **Validated context-free 2026-08-06** by a fresh agent holding only this file;
> its seven must-fix findings are applied below.

## Who does what — read this first

This brief hands off to **two** agents, not one:

1. **The design agent** reads this, takes the open question in § The design
   question to the maintainer, and **stops**. It edits nothing **except this
   brief**, where it records the rulings — required by
   [DEV.md § Ruling provenance](../../DEV.md#ruling-provenance)'s
   record-in-the-same-turn rule, and the reason `15d428db` and its successor
   exist. It touches no governance surface. Per
   [AGENTS.principal.md § Context Discipline](../../AGENTS.principal.md#context-discipline),
   a design unit surfacing mid-execution goes to a fresh session
   unconditionally.
2. **The executing agent** receives the maintainer's answer plus this brief and
   does the edits. § Ripple inventory, § Coordination and § Gates are addressed
   to it.

**Agent 1 has run and the design question is answered** (2026-08-11,
[§ Human rulings](#human-rulings)). If you are reading this now, **you are agent
2** — read § Human rulings before § The design question, whose four exits the
rulings supersede.

## The decision

The maintainer's words, verbatim, because the nuance is load-bearing:

> "I have read this section in DEV.md, it is solid if understood correctly but
> clearly it's misleading for goldfishbrained agents. we should remove it and
> all the ripple-fixes that implies."

This is **not** a judgement that the idea is wrong. It is a judgement that a
convention only a careful reader applies correctly is the wrong shape for a
repository whose primary authors are agents with no memory between sessions.

## What the convention is

At `twin-doc: none` — the default — a module README carries a `## Epistemology`
block with three fields [read: `DEV.md` § The Epistemology block — _"It has
three fields, and the second is the one that does the work"_]:

1. **which twin is not built**;
2. **to whom or what it is delegated** — a named holder;
3. **what would falsify that delegation** — the condition under which the module
   starts owing its own twin.

## The evidence that it does not survive contact

**It has exactly one instance in the repository, and that instance is
self-falsifying** [measured 2026-08-06: `git grep -l "^## Epistemology"` → two
files, `DEV.md` (the rule itself) and
`src/lib/study-lenses/lib/screening/README.md`].

The convention landed at `e91bcaf9`, **2026-08-05 11:03:24**; the screening
block was written at `24f0df7a`, **15:39:46 the same day** — four and a half
hours later [measured: `git log -1 --format=%ci` on each]. By a careful agent,
into a module whose domain-blindness had just been argued across four commits
and a sandbox checkpoint. Its field 3 reads:

> **Falsified if:** this leaf ever acquires a severity, an ordering by
> importance, a default table, or **a message a consumer is expected to show a
> reader unedited**

The leaf already had one when that sentence was written. It authors
`'${node.type}' isn't in the admitted syntax` [read:
`src/lib/study-lenses/lib/screening/collect-violations.ts` — the `applyRule`
helper's default-deny return], and the UI renders it into a live DOM node
uninterpreted [read: `src/lib/study-lenses/orchestrate/index.tsx` — ``
`${masked.levelLabel}: ${masked.cause.violation.message}` `` inside
`formatBlockedSentence`, whose result is the body of a `<p
data-enforcement-cause role="status">`]. That property is not incidental — it is
why the message was reworded mid-wave and why that increment needed a human at a
running dev server (human ruling 2026-08-05: the leaf's default-deny message is
reworded domain-blind — a behavior change, live at
`screening/collect-violations.ts`).

**Read the failure precisely.** Field 3 asks an author to name a future state
that would invalidate a present decision. Both errors are invisible at write
time and symmetric: too broad and it fires on arrival (what happened); too
narrow and it never fires and is decoration. Nothing at write time distinguishes
a good trigger from either.

## Two things to carry, not discard

1. **Field 2 is the good one, and `DEV.md` says so itself** — [read: `DEV.md` §
   The Epistemology block — _"Field 2 is not bookkeeping"_]. It separates "we
   considered the mental model and handed it to the JEJ validator" from "we
   never thought about it", a real distinction with a named failure behind it in
   `spiralearn/frogramming-and-vibetoading/ontology.md` § 4 (_twin ignored_).
   **If any part survives, it is this one.** Whether it survives was the
   maintainer's call — **and it was answered: HR-1 says it does not survive.**
   The ask names no delegate. This reasoning is kept because it is what the
   recorded objection to HR-1 rests on; it is **not** a live instruction to ask,
   and re-opening it is exactly what HR-1's objection block forbids.
2. **A standing design ruling taken in the same conversation** — absence is a
   safer baseline than recommendation, and recommendation is a later layer on
   top of the bare absence information (human ruling 2026-08-06, now a
   convention in
   [`lib/screening/README.md`](../../src/lib/study-lenses/lib/screening/README.md)).
   It is what field 3 got wrong, and it outlives this strip.

## Human rulings

Taken 2026-08-11, after agent 1 put § The design question to the maintainer.
**These supersede the four exits below**; that section is kept for its
reasoning, not as a live choice.

**HR-1 — step 0.2 becomes an ask** (human ruling 2026-08-11). It is an optional
stage, discharged by asking rather than by an artifact: the step opens by asking
the developer whether any twin docs are required, then proceeds or skips on the
answer. **The ask is a bare yes/no _on the "no" branch_ — no delegate is named**
(HR-3 adds a second beat on "yes"; do not transcribe "bare yes/no" as the whole
rule, because it is false on the yes branch). This supersedes `DEV.md` § Who
decides for `twin-doc` specifically: that value moves from agent-**stated** to
human-**asked**. It is a fifth exit, not one of (a)–(d) — it keeps step 0.2 (so
no renumbering, and non-`none` `twin-doc` values still have a producing step)
while removing the `## Epistemology` block as the discharge mechanism, because
the recorded answer _is_ the discharge.

> **Objection recorded and overruled.** Agent 1 argued the ask should be
> two-part — _"required? and if not, who holds the twin instead?"_ — on the
> ground that a bare "no" is the **bare absence** that
> `spiralearn/frogramming-and-vibetoading/ontology.md` § 4 names **_twin
> ignored_**, the first of its named twin failures, and that DEV.md's whole case
> for the delegate field is that naming a holder is what separates the
> legitimate case from it. The maintainer chose the bare yes/no with that
> objection in view. **Recorded as made; agent 2 does not re-litigate it.**

**HR-2 — the convention is deleted** (human ruling 2026-08-11). The
`## Epistemology` convention is removed from `DEV.md`, from every recital of it,
and from `ar-1.md` / `ar-5.md`.

> **⚠️ HR-2's clause about the one live instance is SUPERSEDED by HR-5.** As
> first recorded, HR-2 said `screening/README.md` "keeps its content as plain
> prose" and that the anaphor "needs no rewrite". **HR-5 reverses both.** The
> superseded wording is preserved here rather than deleted because agent 2 will
> otherwise read HR-5 as gratuitous.

**HR-3 — on "yes", a second beat asks which reader** (human ruling 2026-08-11).
HR-1's bare yes/no settles that no _delegate_ is named; it does not say which
twin doc is owed when the answer is yes. It is asked in two beats: _"Any twin
docs required?"_ and, only if yes, _"which reader?"_ — the menu branching on
work kind per HR-6. **`twin-doc` keeps all its values**, so the commit-body
settings line keeps its vocabulary and the **88 commit bodies** already carrying
one stay readable [measured 2026-08-11:
`git log --all --format=%B | grep -cE "twin-doc: [a-z]+"` → 88; 87 `none`, 1
`machine`. **Re-run it — this count rises with every commit**, and an earlier
draft of this line said 42, which was a different measurement entirely]. The
second beat fires only in the rare case; the near-universal path is still one
question with a one-word answer.

**HR-4 — ceremony is `full`** (human ruling 2026-08-11). Its docs-only gate set
is named: **AR-1 · AR-2 · AR-5**. AR-3 and AR-4 are **n/a** — they have no
inputs on a documentation changeset, since AR-3 needs a failing test and AR-4 an
implementation file. Naming the set explicitly is required rather than optional
[read: `DEV.md` § ceremony — _"A documentation-only campaign running `full` must
name its real gate set explicitly rather than assume one."_]. **This set is not
novel — it is the repo's recorded docs-only precedent, and this campaign is its
third use** [read: `DEV.md` § ceremony — _"The gate set docs-only work has
actually used, twice, and may adopt by citing it"_ (human ruling 2026-07-30,
followed 2026-08-05)]. Citing it is what that sentence invites, and the third
use is worth recording, because the same section carries a standing gap saying
the set is _"a precedent, not a ruling. Two campaigns used it."_ The settings
line is therefore:

```text
work: software · twin-doc: none · ceremony: full (AR-3, AR-4 n/a) · prospective
```

**AR-2's input artifact, named so agent 2 does not have to invent one.** The
recorded precedent fires AR-2 only "where a sketch or structural artifact is
among the changed files", and this changeset has no `DOCS.md` sketch and no
`types.ts` — which is what `ar-2.md`'s own Provide-line asks for. The structural
artifact here is **the rewritten Phase 0 artifact-order block in `DEV.md` §
Phase 0**, together with `AGENTS.md` invariant 2's recital of the same chain.
Hand the reviewer those two.

**HR-5 — the whole block goes; only the rationale paragraph survives, and it
DOES need its opening rewritten** (human ruling 2026-08-11). In
`src/lib/study-lenses/lib/screening/README.md`, the `## Epistemology` heading
**and all three fields** are deleted. What survives is the paragraph below it —
the two-consumers argument that is the module's best statement of why it is
domain-blind. **That paragraph opens on the bare anaphor "The delegation", whose
antecedent is the deleted block, so its opening must be rewritten** to state the
two-different-language-models claim without referring back. This **supersedes**
HR-2's "keeps its content as plain prose" and its "needs no rewrite", and it
re-opens § The one live instance's contingency, which HR-2 had closed the cheap
way. Every deleted field is enumerated in the loss ledger.

**HR-6 — the menu branches on work kind** (human ruling 2026-08-11). The second
beat's options are not one list: `twin-doc` carries **two** value sets, not one
[read: `DEV.md` § twin-doc — software work `machine · user · both · none`;
curriculum work `learner · teacher · both · none`]. So the second beat offers
**`machine`/`user`/`both` for software work** and **`learner`/`teacher`/`both`
for curriculum work**. The agent does not ask which kind — kind is derived from
the path mechanically [read: `DEV.md` § Software work and curriculum work —
_"The kind is **derived from the path**, mechanically. It is not chosen, argued,
or declared by preference"_] — so it offers the right menu without a third
question.

**HR-7 — HR-4 is campaign-wide, not strip-only** (human ruling 2026-08-11).
`ceremony: full` covers **every** commit in the epistemology-strip campaign,
including the brief-recording increments that precede the strip. HR-4 as first
worded said "for the strip"; this widens it, which is also what
`DEV.md § ceremony`'s uniformity rule wants — one level per campaign, applied to
every increment under it equally.

### Where each ruling ends up — a destination per ruling, not one mandate

This brief is **scheduled for deletion by doctrine** [read: `DEV.md` § What goes
in docs vs. plans vs. handoffs — _"Handoffs are transitional scaffolding,
deleted when their migration completes (git history retains them); they are
never a durable source of truth"_], and every campaign `AR-LOG.md` was deleted
repo-wide at `7c93080c`, so there is no fallback home. A ruling with no named
destination therefore dies with this file. **They do not all go to the same
place:**

| Ruling                 | End-state home                                                        | What "moved" looks like                                                                                                                                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HR-1 + HR-3 + HR-6** | `DEV.md` § Phase 0 (the step-0.2 line), § twin-doc, and § Who decides | **One** dated statement of the reshaped ask — the question, both branches, both value sets, where the answer lands — with HR-1/HR-3/HR-6 as its provenance line. They are one rule with two branches; transcribing them apart is how the "bare yes/no" wording goes over-broad. |
| **HR-2 + HR-5**        | discharged by the strip's own edits                                   | Durable trace is the surviving rewritten prose in `screening/README.md` plus the closing commit body's loss ledger. Nothing to promote into `DEV.md`.                                                                                                                           |
| **HR-4 + HR-7**        | commit bodies, campaign-scoped                                        | **Do NOT promote into `DEV.md` as a general rule** — it is this campaign's level, not a new universal. Optionally record the third use against § ceremony's "two campaigns used it" gap.                                                                                        |

**Agent 2's closing commit body enumerates what went where**, which
[DEV.md § Ruling provenance](../../DEV.md#ruling-provenance) already requires —
_"the campaign's closing commit body enumerates what went where"_.

## Execution order — read this before the ripple inventory

**The rest of this brief is organized by topic, not by sequence, and the natural
reading order is the wrong execution order.** A context-free agent handed this
file planned "sweep all seven files → then run the ARs → commit", which inverts
AR-1: its trigger is _before_ the contract locks [read: `DEV.md` § AR-1 —
_"During Phase 0, after the README (0.1) and the twin (0.2), before `types.ts`
locks the contract"_], and under HR-1 the **design** is the reshaped ask, while
the other ~25 sites are merely recitals of it. An AR-1 PAUSE arriving after
propagation means re-editing seven files, four of them governance surface in a
shared tree.

1. **Re-measure.** § Coordination's procedure, plus the three greps in § Gates.
2. **Draft the reshaped ask in `DEV.md` only** — the step-0.2 line in § Phase 0,
   with § twin-doc and § Who decides amended to match. This is the design.
3. **AR-1.** Hand it the drafted DEV.md sections. Resolve before propagating.
4. **Propagate to every recital** — `AGENTS.md`, `AGENTS.principal.md`,
   `HUMANS.md`'s four recitals, and **the four collision sites above**.
5. **`screening/README.md`** — HR-5's deletion plus the paragraph rewrite.
6. **`ar-1.md` / `ar-5.md` LAST among content edits** — but see the ordering
   conflict resolved below.
7. **AR-2**, then **AR-5** over the whole changeset, then commit by pathspec.

**Three placements this brief previously left to guesswork. These are agent-side
calls, made here so agent 2 does not re-decide them; overrule if you disagree.**

- **Where the reshaped ask is HOSTED** (it is cited from three sections, but one
  must hold it): **`DEV.md` § Phase 0, the step-0.2 line.** § twin-doc and § Who
  decides carry a pointer to it, not a copy. Rationale: it is a step _behavior_,
  and § Ruling provenance says a ruling lives "in the document the ruling
  governs" — here, the step it governs. One statement, two pointers, so the
  three cannot drift apart.
- **Where HR-5's surviving paragraph GOES:** fold it into
  `screening/README.md`'s existing **`## Why this module exists`**. Deleting the
  `## Epistemology` heading would otherwise leave it as untitled prose dangling
  after a bulleted `## Conventions` list. Rationale: it argues why the module
  exists domain-blind, which is that heading's subject.
- **The `ar-*.md`-LAST vs Loss-lens conflict.** § Coordination says edit them
  last; § Gates says AR-5 runs the Loss lens over the whole changeset. Both
  cannot hold, and `.claude/agents/ar-5.md` carries one of the largest single
  deletions in the strip. **Resolution: edit them BEFORE AR-5** so the Loss lens
  sees those deletions, and **accept the roster mismatch knowingly** — which §
  Coordination already offers as the alternative. A stale in-session agent
  description costs one session; a deletion no reviewer saw is permanent.

### ⛔ FOUR collisions, and three are invisible to both prescribed greps

**This is the highest-risk item in the whole changeset, because agent 2's own
done-check confirms the bug.** HR-1 reverses "the agent states `twin-doc`". That
sentence is recited in **four** places, and **none of the four contains
`Epistemology` or `0.2`** [measured 2026-08-11: `grep -rInE "states the other
three|state three of the four|other three answers" --include="*.md" .` → 4 hits;
the same list filtered on `Epistemolog|0\.2` → **0**]:

| Site                      | Text                                                                           |
| ------------------------- | ------------------------------------------------------------------------------ |
| `DEV.md:1279`             | "The agent states the other three — … `twin-doc`, and prospective/…"           |
| `DEV.md:1190`             | "An agent may state the other three answers, because their defaults are safe…" |
| `AGENTS.md:1040`          | "**You state three of the four answers; you never state `ceremony`.**"         |
| `AGENTS.principal.md:868` | "**You state three of the four answers; you never state `ceremony`.**"         |

Surface 1 does not reach them. Surface 2 does not reach them. So an agent 2 that
finishes the sweep, runs both greps clean and declares done per § Gates ships
`AGENTS.md` and `AGENTS.principal.md` still teaching _state it_ while `DEV.md`
says _ask_. **And `CLAUDE.md` routes each agent to only ONE of those two
files**, so the contradiction would not even be visible to any single reader —
half the agent population would silently keep the old behavior, and HR-1 would
be recorded as executed while being un-executed in practice.

**The third grep that catches them, which § Gates now requires:**

```bash
grep -rInE "states the other three|state three of the four|other three answers" --include="*.md" .
```

**Line numbers above will drift** — this file is edited daily. Re-run the grep;
do not navigate by the numbers.

**The original single-collision note, kept because its citation is the one that
explains WHY these sites are wrong:** HR-1 reverses a standing sentence [read:
`DEV.md` § Who decides, and where the answers are recorded — _"The agent states
the other three — the kind of work (derived from the path), `twin-doc`, and
prospective/retrospective — because each has a safe default and a question whose
answer is almost always the default is friction on a path that should have
none."_]. That sentence exists specifically to prevent the friction HR-1
introduces, so the strip must amend it rather than leave the two in
contradiction.

## The design question — ANSWERED 2026-08-11; kept for its reasoning

`DEV.md`'s Phase 0 sequence currently reads [read: `DEV.md` § Incremental
Development Workflow, the Phase 0 artifact-order block]:

```text
0.1  README          — incl. the ubiquitous-language glossary
0.2  the twin        — or the ## Epistemology block that discharges it
     → AR-1            challenges the README AND the twin, together
```

`twin-doc: none` is the **default**, so for the near-universal case the block
_is_ step 0.2. Four exits were offered; **the maintainer took a fifth** —
[§ Human rulings](#human-rulings). The four are kept below because the
trade-offs they name are the reasoning agent 2 needs, **not because any of them
is live**:

- **(a)** Step 0.2 survives as "the twin"; at `twin-doc: none` it is simply
  **not owed**. Phase 0 becomes two steps for most modules and AR-1 challenges
  the README alone.
- **(b)** Step 0.2 is removed entirely and Phase 0 is renumbered. **Widest
  ripple** — see the step-0.2 sites below.
- **(c)** Step 0.2 survives with a lighter discharge. Its concrete member, named
  because "a family of options" invites an agent to invent one: **keep fields 1
  and 2, drop field 3** — the minimal repair implied by the diagnosis above,
  since field 3 is the broken field.
- **(d)** Change the `twin-doc` default away from `none` — e.g. to `machine`, so
  `DOCS.md` _is_ the twin and step 0.2 always produces a real document, needing
  no discharge mechanism anywhere. Precedent exists: one module already declared
  `twin-doc: machine` on the ground that its own `DOCS.md` IS the machine twin,
  so no `## Epistemology` block was owed — the obligation keys to the declared
  value, not to a module's age (human ruling 2026-07-30). This removes the
  failing convention without renumbering.

**One fact material to the choice, which `DEV.md` gets wrong.** The block's
stated justification is that its fixed heading is _"the one rule in § Work
routing and ceremony that a check can find"_ [read: `DEV.md`, the `##
Epistemology` block format paragraph]. **Nothing checks it today** [measured
2026-08-06: `grep -rIn "Epistem" scripts/ .claude/hooks/` → no matches;
`scripts/check-governance.mjs` contains no reference to it]. `DEV.md`'s own
checklist item is a human/agent checklist, not a script. So option (b) forfeits
**zero** mechanical checkability, contrary to the reasoning recorded when the
convention was adopted.

## Ripple inventory — two surfaces, and the string grep is only the first

### Surface 1 — the literal string

> **⚠️ STALE, AND IT UNDERSTATES THE WORK TWICE OVER. Re-measure; do not size
> the job from this table.**
>
> 1. **The numbers moved.** This says 36 across 10 files; measured 2026-08-11 it
>    is **50 across 8** [measured: `git grep -c "Epistemology" -- .`], of which
>    **23 are in this brief itself** — which did not exist when the table was
>    written. The table's own six rows also sum to 24, not 36, and it omits
>    `src/lib/study-lenses/lib/screening/README.md`, the one live instance and
>    the highest-value target (§ The one live instance covers it separately).
> 2. **A token count is not an edit count.** The prose that must go is mostly
>    grep-invisible. `.claude/agents/ar-5.md` shows 4 mentions but the real
>    target is a **13-line focus-area block**, only two lines of which carry the
>    token — the rest reads _"Confirm the block is present and all three fields
>    are still filled: **Twin not built**, **Delegated to**, **Falsified
>    if**…"_. `DEV.md`'s block-format spec is ~15 lines behind 2 token hits; its
>    AR-5 focus area ~7 lines behind 1. **An agent sizing this as a token sweep
>    discovers mid-flight that it is rewriting three reviewer contracts.**

`git grep` searches tracked files only; an untracked sweep returns the same set
[measured: `grep -rIl "Epistemology" . --exclude-dir=node_modules
--exclude-dir=.git --exclude-dir=build --exclude-dir=.docusaurus`], so the file
list is complete even where the counts are not.

| File                     | Mentions |
| ------------------------ | -------- |
| `DEV.md`                 | 10       |
| `HUMANS.md`              | 4        |
| `.claude/agents/ar-5.md` | 4        |
| `AGENTS.md`              | 2        |
| `AGENTS.principal.md`    | 2        |
| `.claude/agents/ar-1.md` | 2        |

### Surface 2 — "step 0.2" and "the twin", which never say _Epistemology_

**Under option (b) every one of these becomes a dangling reference**, and the
string grep does not reach them [measured 2026-08-06: `git grep -n "0\.2" --
'*.md'`, filtered to governance files and to lines with no `Epistemology`]:

`.claude/agents/ar-1.md` (its **YAML frontmatter `description`**, plus body) ·
`.claude/agents/ar-5.md` · `AGENTS.md` (×2) · `AGENTS.principal.md` (×3,
including the `ar-1` trigger line) · `DEV.md` (the blocked-`retrospective`
rationale, the artifact-order line, the renumbering note, the step-0.2 heading
itself, the AR-1 trigger, the AR-5 provide-line) · `HUMANS.md` (×2).

Related axis: `twin-doc` appears 16× in `DEV.md` and `twin` 42× [measured: `git
grep -c` on each]. The `twin-doc: none` row is what _creates_ the obligation the
block discharges — removing the discharge without touching the axis leaves
`none` meaning "step 0.2 produces nothing", which is option (a) but must be
**written**, not left implied.

### The one live instance — and it is not a clean subtraction

`src/lib/study-lenses/lib/screening/README.md` carries the block **and, directly
below it, a rationale paragraph that depends on it**:

> The delegation is why the module is domain-blind rather than merely generic:
> it is not that a language model was too costly to build here, but that two
> consumers hold different ones — a language level's curriculum position, and a
> generator's screening of a candidate — and a single leaf holding either would
> be wrong for the other.

[read: that file, immediately after the `## Epistemology` block.] It opens on
the bare anaphor **"The delegation"**, whose antecedent is the block. Delete the
block alone and it dangles; delete the whole section and the module loses its
best statement of why it exists.

**ANSWERED by HR-5 — and it landed on the expensive branch, not the cheap one.**
The `## Epistemology` heading **and all three fields** are deleted; the
paragraph below survives, **and its opening must be rewritten** because "The
delegation" loses its antecedent. That is the branch this section describes as
"(a) or (b)": _the block goes and this paragraph needs a new home and a
rewritten opening_. An earlier ruling (HR-2) had closed this the cheap way and
HR-5 reversed it — so if you are working from a summary that says the opening
needs no rewrite, that summary is stale.

The original contingency table is kept below for its reasoning. **It is not a
live choice** — do not read it as a decision still to be made:

> under (a) or (b) the block goes and this paragraph needs a new home and a
> rewritten opening; under (c) the block is _edited_, not deleted; under (d) it
> may stay untouched. Do not treat "removing the block also removes the
> self-falsifying sentence" as the whole edit — it is true of the sentence and
> false of the file.

### OUT of scope — do not sweep

Dated records of what was true when they were written — a commit body, a
measurement in a log, a decision recorded at its moment — are **not** sweep
targets, even where a later decision made them wrong. One such record already
contains a measurement that is false today, correctly so. Editing a dated record
to match a later decision is record falsification. The sweep touches end-state
documents, never the history behind them.

## Obligations the executing agent owes

1. **A loss ledger is mandatory.** [read: `DEV.md` § Documentation migration
   discipline — _"an edit that removes content from a `README.md`, `DOCS.md`, or
   `types.ts` follows the same enumeration"_, and _"a staleness deletion is
   enumerated in the loss ledger like any other removal"_]. Every removed clause
   is enumerated in the commit body with its justification. AR-5's Loss lens
   fires on its absence.

   > **⚠️ This obligation used to read "and this changeset is nothing but
   > removal." That is FALSE under HR-1 and HR-3, and the correction matters
   > more than the sentence it replaces.** The strip removes the block **and
   > adds a workflow behavior** — an ask at step 0.2, in two beats, whose answer
   > is recorded. So agent 2 is writing a new step behavior, not running a
   > sweep: what is asked, when it fires, where the answer lands, and what "yes"
   > obligates all have to be _specified_, and that is what AR-1 challenges.
   > Reading this changeset as subtraction is the single most likely way to get
   > it wrong.

2. **`HUMANS.md` has a procedure written for exactly this change — use it.**
   [read: `HUMANS.md` § Update triggers — _"a workflow step changing shape —
   renamed, renumbered, merged, reordered, or gaining or losing a gate"_ is a
   listed trigger, and it warns _"this file recites that workflow in four places
   and they are not next to each other… you fix the section you happened to be
   editing, and three others keep teaching the old shape"_, then names the
   four]. That converts a search into a checklist.
3. **Where the maintainer's answer lands.**
   [DEV.md § Ruling provenance](../../DEV.md#ruling-provenance) gives two homes:
   a `PINNED(...)` beside the assertion a ruling settles, and a dated
   `(human ruling YYYY-MM-DD)` line in the document the ruling governs — plus
   the commit body of the turn it is given. The design question here is about
   `DEV.md`'s own convention, so its answer belongs in `DEV.md` at the section
   it changes, dated. **The answer was given 2026-08-11 and is parked in
   [§ Human rulings](#human-rulings) above**, under the same section's
   ride-the-campaign-artifact clause, because `DEV.md` cannot be edited outside
   the strip itself. **Moving HR-1 and HR-2 into `DEV.md` is part of agent 2's
   changeset, not optional cleanup**, and the closing commit body enumerates
   what went where.

## Coordination and traps

- **A parallel session owns these files.** It landed governance commits into
  `DEV.md`, `AGENTS.md`, `AGENTS.principal.md`, `ar-1.md` and `ar-5.md`
  throughout 2026-08-05 and 2026-08-06, and **overwrote another agent's
  in-flight edits twice in one day**. As of 2026-08-06 it had moved to an
  unrelated campaign and all six files were clean [measured: `git status
  --short` on them → empty]. **Re-measure before starting**, and prefer one
  commit so the window is small.

  **⚠️ Do NOT wait for a clean tree — it never comes, and an earlier draft of
  this bullet told you to wait.** This paragraph has named the dirty set twice
  and been wrong **both** times, in different directions: first `DEV.md` +
  `ar-2.md` + `ar-5.md`; hours later `AGENTS.md` + `AGENTS.principal.md` +
  `DEV.md` + `HUMANS.md`, with both `ar-*.md` gone clean [measured 2026-08-11,
  twice]. **Never navigate by a named dirty set. Run the procedure:**
  1. `git status --short --` on the eight in-scope files. Whatever it returns is
     the truth; this paragraph is not.
  2. For each dirty file, test for a **content** conflict — the only kind that
     matters:
     `git diff -- <file> | grep -nE "Epistemolog|0\.2|twin|other three"`.
  3. **No hits → PROCEED.** A peer editing a different region of the same file
     is the normal state of this worktree, and the pathspec commit form is what
     makes that safe. Both times this was measured, the answer was no hits.
  4. **Hits → serialize that file only**, never the wave. Finish the others,
     come back, re-measure.

- **⚠️ SUPERSEDED 2026-08-11 — the `pinned-guard.py` hook removal is no longer
  uncommitted; it LANDED.** This bullet used to warn that
  `.claude/settings.json` carried the removal as someone else's in-flight
  change. It does not any more: the file is **clean** and the hook is **absent
  from HEAD**, committed at `90c31797`, a commit titled `checkpoint` [measured
  2026-08-11: `git status --short -- .claude/settings.json` → empty; `grep -c
  "pinned-guard" .claude/settings.json` → 0; `git log --oneline -3 --
  .claude/settings.json`]. **The pathspec discipline still stands for every
  other reason** (this worktree is shared and peers stage concurrently — agent
  1's own commit had a foreign file already staged in the index and excluded it
  by pathspec). But the specific hazard named here is gone, and what replaced it
  is a standing governance fact worth its own attention: **the hook that made a
  human sign off before an agent could erase a `PINNED()` test ruling is no
  longer registered.** Out of this campaign's scope; surfaced because a reader
  of this bullet would otherwise conclude the opposite.
- **Edit the two `ar-*.md` files LAST.** Their `Epistemology` mentions sit in
  the YAML frontmatter `description:` fields, which are the live agent-roster
  text. Editing them mid-session does not refresh the roster — an AR spawned
  afterwards in the same session still carries the old description. If AR-1/AR-5
  will run on this changeset, edit those files after the reviews, or accept the
  mismatch knowingly.
- **No anchor breakage to worry about** [measured: `git grep -n
  "epistemology-block\|#the-epistemology"` → no matches]. Removing `DEV.md`'s
  `### The Epistemology block` heading breaks no cross-file link.
- **Expect advisory hook output on nearly every edit** — six of the seven
  in-scope files are in the governance-advisory corpus. Non-blocking.

### Findings the design agent measured that this brief did not originally carry

Added 2026-08-11 by agent 1, because they lived only in a session plan file and
[DEV.md § Ruling provenance](../../DEV.md#ruling-provenance) is explicit that
`~/.claude/plans/` is not a place a later reader can find anything.

- **An EIGHTH in-scope file this brief never named: `.claude/agents/ar-2.md`**
  [measured: `grep -c "ar-2"` on this brief's pre-2026-08-11 text → 0]. Its live
  YAML frontmatter `description` cites _"inside Phase 0 step 0.3"_ and its body
  cites steps 0.1 and 0.3 [read: `.claude/agents/ar-2.md`, frontmatter and the
  focus-area bullets]. Under HR-1 nothing renumbers, so it should need no edit —
  **verify that rather than inherit the assumption**, and note it is governance
  surface and live roster text like the other two `ar-*.md` files.
- **`scripts/lib/check-governance/roster.mjs` requires every `### AR-N:` section
  to open with a `**Trigger:**` line**, and errors if one does not [read: that
  file — _"section ${section.text} does not open with a **Trigger:** line"_].
  AR-1's Trigger line is being rewritten; keep the prefix.
- **`prettier`'s `proseWrap: always` hides mandatory sites from the obvious
  grep, and this fired live.** `**Falsified if**` is wrapped as
  `**Falsified\n if**` in `DEV.md`'s AR-5 focus area, so `grep "Falsified if"`
  misses the highest-consequence site in the repo; `HUMANS.md` says _"three
  **things**"_, not "three fields", so `grep "three fields"` misses that
  recital. **Search on opening tokens, never whole phrases.** Agent 1 hit this
  on its own commit: the `(human ruling 2026-08-11)` marker on HR-1 was reflowed
  across a line break and vanished from the very grep that was supposed to prove
  the ruling existed.
- **AR-5 will review a diff that rewrites AR-5's own contract.** `ar-5.md` and
  `DEV.md § AR-5` are both in the changeset. Decide knowingly whether the
  reviewer applies the old contract or the new one, and say which in the prompt.
- **Two `DEV.md` sites appeared AFTER this brief's 2026-08-06 inventory** — the
  count moved from 10 to 12 [measured 2026-08-11: `git grep -c "Epistemology" --
  DEV.md`]:
  - the **`## Epistemology` block is cited as the model** for a gap `ceremony`
    has not closed — _"has a **Falsified if** field for exactly this shape;
    `ceremony` has no counterpart"_, inside § ceremony's recorded-gaps list.
    Deleting the block **orphans that citation**; rewrite the bullet, do not
    delete around it.
  - the **"Phase 0 is new-module establishment work"** scoping was promoted out
    of `HUMANS.md` into `DEV.md`, and it names the block. Good news for HR-1: it
    fixes the ask's frequency at **once per new module**, not once per commit,
    which is what makes the ask cheap.

## Gates, and what "done" means

**Done is not "the grep is empty".** Done is: the chosen option's _new_ Phase 0
shape is stated coherently in every place that recites it, and no document still
teaches the old one. The grep is a necessary check, not a sufficient one.

- `npx prettier --check`, `npx markdownlint-cli2 --no-globs "<file>"`,
  `npx cspell <file>` on every changed file — all three honor file arguments
  (markdownlint-cli2 v0.21.0 does with `--no-globs`; verify if in doubt)
- `node --version` must be ≥ the engines floor or `cspell` will not run at all:
  `export PATH="$HOME/.nvm/versions/node/v22.11.0/bin:$PATH"` per Bash call
- `node scripts/check-governance.mjs` — **re-measure the baseline in the same
  turn**; it read `0 errors, 61 advisories` on 2026-08-05 and
  `0 errors, 62 advisories` on 2026-08-06, and the delta was foreign
- `git grep -c "Epistemology" -- .` afterwards: the remaining hits should be
  dated records and history only — no end-state document should still teach the
  stripped convention. **This grep alone CANNOT pass** while this brief exists:
  it is tracked and carries 23 mentions of its own [measured 2026-08-11]. See
  the open question below before treating a non-empty result as failure.
- **THE THIRD GREP, and the one that catches the silent failure** — the four
  collision sites carry neither `Epistemology` nor `0.2`, so the two greps above
  return clean while `AGENTS.md` and `AGENTS.principal.md` still teach the old
  rule. Run it, and confirm every hit now says the human is asked:

  ```bash
  grep -rInE "states the other three|state three of the four|other three answers" --include="*.md" .
  ```

- Re-read every step-0.2 site from Surface 2 and confirm none dangles. **Surface
  2's `DEV.md` list is short by at least two** — `git grep -n "0\.2" -- DEV.md`
  returned **8** lines on 2026-08-11 against the six enumerated, and the missing
  one includes the artifact-order line _"0.1 → 0.2 → 0.3 → the human gate, at
  every level"_, which carries no `Epistemology` token. Re-derive the list from
  the grep rather than working the enumeration. (Run the grep scoped to the
  governance files — unscoped over `*.md` it returns ~27 files, mostly
  `0.1 + 0.2 !== 0.3` float examples and a DOI.)

- Ceremony **is set**: `full`, gate set **AR-1 · AR-2 · AR-5** (AR-3, AR-4 n/a)
  — HR-4. Do not ask again, and do not lower it. AR-1 challenges the reshaped
  Phase 0 **design**, which under HR-1/HR-3 is a new workflow behavior and not a
  sweep; AR-2 challenges the shape the rewritten § Phase 0 states; AR-5 runs the
  Loss lens over the whole changeset.
- Commit with an explicit pathspec; this worktree is shared. **Never push.**

**⛔ OPEN — the maintainer's call, and agent 2 must not decide it alone: is this
brief DELETED at campaign close?** `DEV.md` § What goes in docs vs. plans vs.
handoffs says handoffs are "deleted when their migration completes", and the
`Epistemology` gate above cannot pass while this file lives. But deleting it
destroys the campaign's only record of the rulings and the recorded objection —
and per the disposition table, HR-4 + HR-7 have **no** `DEV.md` destination, so
they would survive only in commit bodies. **Ask before deleting.** If the answer
is delete, the loss ledger obligation covers the whole file.
