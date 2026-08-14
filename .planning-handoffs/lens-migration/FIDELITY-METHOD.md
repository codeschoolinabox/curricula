<!-- TRANSITIONAL — retire with SPEC.md when the last lens ledger closes. What
survives is each lens's `## What this lens does NOT do` section, which this
method exists to make complete. -->
<!-- cspell:ignore blankenate parsonizer socratize reenrichment lezer dropdowns writeme parsons blankenated colorizing Gateable -->
<!-- cspell:ignore colour colours distractor distractors ledgered Leitner throughs unfilled -->
<!-- cspell:ignore PRNG affordances assertable unrenderable reopenable unrebutted bwMode QASM -->

# The fidelity method

Every session in this campaign reads this document **in full**. The scope is
read once; the method is used continuously.

## Why this exists

A migration is judged by what arrives, and what arrives is all anyone can see.
The things that do not arrive leave no trace — no failing test, no broken
import, no error. They simply stop existing, and the next reader has no way to
know they ever did.

This repository has now done it three times, and the third time is measured:
`parsons` reached the greenfield with its code intact and its tests _grown_,
while its README fell from 705 lines to 242 and its DOCS from 505 to 199 —
losing its glossary, its feedback legend, its educator hint-block contract, its
distractor-count affordance, and three individually-argued design decisions
flattened into a single generic `## Decisions` heading. Nothing failed. Nobody
noticed for weeks.

The method below is the instrument that would have caught it. Its whole design
principle: **an audit that can only check its own rows is complete by
construction and therefore worthless.** Every pass exists to catch what the
previous pass is structurally unable to see.

---

## Contents

- [The unit is the affordance](#the-unit-is-the-affordance)
- [Columns](#columns)
- [Disposition vocabulary](#disposition-vocabulary)
- [The three passes](#the-three-passes)
- [The five listers](#the-five-listers)
- [The calibration cases](#the-calibration-cases)
- [Worked rows](#worked-rows)
- [Gate checks](#gate-checks)
- [Failure modes this method has already hit](#failure-modes-this-method-has-already-hit)

---

## The unit is the affordance

A **row** is one enumerated, independently falsifiable claim about what a
learner or a reader can **do**, **see**, or **know**.

Not a heading. Not a file. Not a feature in the marketing sense. Headings are a
cheap mechanical _seed_ for rows, and they are why `parsons` was diagnosable at
all — but a heading-shaped ledger would never have found
`ParsonsLens.module.css`, where 27 of 37 class definitions describe a complete
drag-and-drop board that never rendered, because Gen-1 shipped an `<iframe>`
instead. Nothing in any heading, anywhere, points at that.

An affordance is written in the voice of whoever it serves:

- _The learner can see, for any blank they have not yet solved, how many letters
  the answer has — before revealing any of them._
- _A reader of this module can find out why the grader flags the fewest lines
  that must move, rather than everything after the first mistake._

The test of a well-formed affordance: **someone could go and check.** Either at
a running sandbox, or by opening one named file. If a row cannot be falsified,
it is a feeling, and it will be discharged by a shrug.

---

## Columns

| Column          | Contents                                                                                                                                                                         | Rule                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#`             | `<lens>-NNN`                                                                                                                                                                     | Stable **forever**. Rows are appended; never renumbered, never re-sorted. Handoffs cite these ids, and a renumber silently re-points every citation.                                                                                                                                                                                                                                                 |
| `affordance`    | One sentence, in the voice of the reader it serves                                                                                                                               | Must be falsifiable at a running sandbox or by opening one named file.                                                                                                                                                                                                                                                                                                                               |
| `provenance`    | One or more of `G1-live` · `G1-dead` · `G2-code` · `G2-doc` · `G3`                                                                                                               | This is **literally the set-union** R-2 describes. A row carrying only `G3` is an `ADDITION`. `G2-doc` and `G2-code` are tracked **independently** — parsons proves documentation and behavior can migrate at different rates.                                                                                                                                                                       |
| `evidence`      | File + heading or **test title** + a quoted fragment, **for every provenance tag**                                                                                               | Cite quarry content by heading or test _title_, **never by line number** — the quarry has been reformatted by a sanctioned prettier sweep at least once, and every line number in the old handoffs rotted.                                                                                                                                                                                           |
| `disposition`   | One value from the closed vocabulary below                                                                                                                                       | `supersede` requires a named strength argument; `drop` requires human sign-off.                                                                                                                                                                                                                                                                                                                      |
| `discharged by` | The named artifact that will carry it — a README heading, a test title, a CSS token, a type member, a config field                                                               | **Empty, on a `restore` or `revive` row, means the row is OPEN.** This column is what makes "faithful" checkable rather than assertable.                                                                                                                                                                                                                                                             |
| `gate`          | `P0` · `P1:<increment>` · `sandbox` · `AR-5`                                                                                                                                     | Which gate closes it.                                                                                                                                                                                                                                                                                                                                                                                |
| `walked`        | **Required on every `revive` and `ADDITION` row.** The Gen-2 `README.md` and `DOCS.md` sections _read_ while checking whether a written judgment already covers this affordance. | Section names, not grep strings. A heading search does not discharge this column — the ruling that closed the difficulty/hints coupling lives under a heading containing none of that feature's Gen-1 terms.                                                                                                                                                                                         |
| `found`         | **Required alongside `walked`.** Per walked section: the **strongest sentence bearing against this row**, quoted — or the literal words `nothing bearing on this row`.           | This is the column that turns a search log into a finding. `walked` alone failed: a row once named the correct Gen-2 section and still reported "nothing speaks against this", while that section's first sentence said the mechanism _is gone_. **An unrebutted quotation on a `revive` row is an OPEN row**, and an empty `walked` or `found` cell on a `revive` or `ADDITION` row is an OPEN row. |

---

## Disposition vocabulary

**Adopted from the evaluator public-API restoration campaign's ratified set
(their HR-4), plus exactly one addition.**

**Not verbatim, and the difference is recorded rather than passed off as
neutral** — the same standard this campaign applies to every other transport.
The adoption is faithful in substance but reworded throughout: their `member`
becomes this campaign's `affordance`, _"an enrichment the reference lacked"_
becomes _"an enrichment neither reference had"_ (because R-2 gives this campaign
two references, not one), `restore-as-doc` gains an explicit gloss, and their
HR-8 style qualifier is dropped as belonging to their region.

Two reasons not to invent a fresh vocabulary: it is already **ratified in this
repository**, so a reviewer can look it up in a committed ledger rather than
taking this document's word for it; and one vocabulary across campaigns means
Family F's rows can be handed to the evaluators campaign **with only `revive`
needing an explanation** — that value is this campaign's addition and the
recipient does not hold it, so a boundary handoff must carry its definition
along with the rows.

No claim is made that the registered `ar-*` reviewers know this vocabulary:
nothing under `.claude/` mentions any of its values, and they read their focus
areas from `DEV.md`. What they can do is follow the citation.

| Value                                    | Meaning                                                                                             |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `restore`                                | **The default.** The affordance returns, reference-faithful.                                        |
| `supersede`                              | A port-side or new design wins — **only with a named strength argument.**                           |
| `drop`                                   | The affordance does not return — **only with human sign-off.**                                      |
| `ADDITION`                               | An enrichment neither reference had, riding in reference style.                                     |
| `restore-as-doc`                         | The affordance returns as a **documentation** obligation — the behavior already survived.           |
| `already survives`                       | No loss. It lives on, possibly under another name.                                                  |
| `drop-as-loss`                           | A drop recorded **with its loss acknowledged**.                                                     |
| `restore — DEFERRED (<owner>, <ruling>)` | Restores, discharged by the named future campaign. Spelling pinned — both the owner and the ruling. |

### The one addition — `revive`

R-2 creates a state that campaign never had, because it never quarried a
generation whose best ideas were switched off.

> **`revive`** — the affordance exists **only** as `G1-dead`. It never ran. No
> learner ever used it and no behavior was ever observed. Restoring it is
> therefore **not transport — it is a build against recovered intent.**
>
> A `revive` row carries a mandatory **`## Design owed`** note naming what must
> be decided before it can be built, and it **cannot be discharged by a diff.**

This value exists to stop the campaign's most likely sizing failure: a family
session reading "port the dead code" as transport and finding greenfield.
`revive` is counted separately from `restore` in SPEC.md's roll-up precisely so
that mis-sizing is visible before the work starts rather than during it.

### Choosing between `supersede` and `restore` — the evidence rule

R-2 says Gen-2 is not the judge of appeal, so `supersede` is **not** available
for "Gen-2's version looks better to me." It is available only when Gen-2's own
documentation records a **deliberate** replacement together with its reason, and
the row must carry **that sentence, quoted**.

No quotable sentence → the disposition is `restore`, and the Gen-1 affordance
comes back. An agent's aesthetic judgment is never the strength argument.

---

## The three passes

**The order is the instrument.** Running them out of order, or skipping the
third, produces a ledger that is complete by construction.

### Pass 1 — mechanical seeding

Five listers (below) run over the sources. They **open rows and close none.**

`DEV.md § Documentation migration discipline` is explicit that an empty
mechanical listing never discharges a ledger — a clean grep is evidence about
the grep, not about the content.

### Pass 2 — whole-file reading, by a fresh agent

One reader per source file, **end to end**. Invariant 9 binds absolutely here:
never assign one agent lines 1–100 and another 100–200. Summaries compress away
exactly the anomalies an audit exists to find.

Pass 2 adds the rows no lister can see: plain constraint sentences in running
prose, cells inside tables, the contents of code fences, link targets, and
**semantic weakening** — a `must` that became a `should`, an "always" that
became "generally", a hard invariant restated as a preference.

**The reader must be fresh.** The agent that performed the migration is
structurally blind to what it decided to leave out; that decision felt correct
at the time and left no residue in its context.

### Pass 3 — the counter-ledger

A second fresh agent receives the ledger and the sources and **two** questions.

**Question 1 — missing rows:**

> Name three affordances present in the sources and absent from this ledger.

**Question 2 — wrong rows:**

> Name three rows whose evidence does not support their disposition, and one row
> whose `provenance` set is incomplete.

If it can answer either, the ledger is not done. Iterate and ask again.

**Question 2 exists because question 1 alone provably misses a whole class of
defect.** This campaign's own AR-1 found three rows that were _present_,
_well-written_, and _wrong about their own evidence_: one citing an instrument
whose output contradicts it, one `revive` whose disqualifying Gen-2 ruling was
cleared with a heading grep, and one `ADDITION` a reference already carried. A
counter-ledger asked only "what is missing" cannot see any of them — every one
was there.

**Passes 1 and 2 check the ledger against itself; only pass 3 attacks it.** A
campaign that skips pass 3 has bought the _appearance_ of an audit, which is
worse than no audit because it licenses confidence.

---

## The five listers

Pass-1 mechanics. Each finds a class of loss the others cannot.

### 1 · Heading survival

Diff the section-heading sets of the reference document and the port. This is
what made the parsons regression visible in one command.

### 2 · Named-decision survival

Count headings matching `^## Why` in the reference DOCS versus the port, and
count generic `## Decisions` headings in the port.

**This is the highest-signal detector found in this codebase.** Measured across
the three landed lenses:

| Lens        | Gen-2 `## Why …` | Gen-3 `## Why …` | generic `## Decisions` |
| ----------- | ---------------- | ---------------- | ---------------------- |
| writeme     | 9                | **9**            | 0                      |
| parsons     | 4                | **0**            | 1                      |
| debug-props | 3                | **0**            | 1                      |

**The trigger is the fall in the `## Why …` count, not the presence of
`## Decisions`.** `## Decisions` is an ordinary heading in this codebase — it
appears in 23 of 104 `DOCS.md` files under `src/`, including never-migrated
greenfield modules and `lenses/DOCS.md` itself [measured: `grep -rln '^##
Decisions'`]. Treating its presence as a defect would have a family session
scoring house style as loss.

What the parsons and debug-props data actually show is a **disappearance**: 4 →
0 and 3 → 0 named decisions, against writeme's 9 → 9. A generic `## Decisions`
heading appearing _where named ones used to be_ is a corroborating hint that the
set was flattened; on its own it is nothing.

Why the named form matters: it makes each decision findable, citable and
individually challengeable. The flattened form makes the set unfalsifiable — you
cannot notice that the third one is missing.

### 3 · Glossary and term survival

Bold terms defined under `## Glossary`, plus backticked identifiers appearing in
the reference prose. A term that stops being defined stops being shared
vocabulary, which is how two modules drift into meaning different things by the
same word.

### 4 · Orphan CSS

Classes defined in a Gen-1 `.module.css` and never referenced from its `.jsx`.

**This is the only lister that finds design intent expressed as styling**, and
it is not a corner case.

**The instrument, published — because the counts move when it does.** Three
readings of "a class is defined here" were tried on one lens and gave three
different answers, so the table below means nothing without the command that
produced it:

```bash
# per lens: definitions = class tokens at the head of a rule, at any indentation
#           (so classes inside @media blocks are counted)
#           orphans    = those with no `styles.<name>` reference in the .jsx
defined=$(grep -oE '^[[:space:]]*\.[a-zA-Z][a-zA-Z0-9_-]*[[:space:]]*[,{]' "$CSS" \
  | grep -oE '\.[a-zA-Z][a-zA-Z0-9_-]*' | sed 's/^\.//' | sort -u)
for c in $defined; do grep -q "styles\.$c\b" "$JSX" || echo "$c"; done
```

**What it does not catch, stated rather than hidden:** a class appearing as the
_first_ element of a descendant selector (`.bwMode .codeContent { … }` registers
`.codeContent`, not `.bwMode`). So **the orphan counts are a lower bound.**
Where a specific class matters to a row, check it directly with
`grep -c "styles\.<name>" <jsx>` rather than inferring it from this table —
`.bwMode` is exactly such a case, and it is dead by direct check even though the
lister misses it.

| Gen-1 lens       | orphan / total |
| ---------------- | -------------- |
| `ParsonsLens`    | **27 / 37**    |
| `QASMEditorLens` | 20 / 43        |
| `DropDownsLens`  | 8 / 25         |
| `PrintLens`      | 5 / 21         |
| `VariablesLens`  | 3 / 25         |
| `BlanksLens`     | 2 / 43         |
| `HighlightLens`  | 1 / 47         |
| `WritemeLens`    | 0 / 43         |

The ordinal signal is stable across every instrument tried, and it is the signal
that matters: **parsons is the outlier by a wide margin.** Its stylesheet
describes a complete native board — `blocksPanel`, `solutionPanel`,
`insertZone`, `dropMessage`, `checkButton`, `hint`, `feedback`, `guess-entry`,
`blockNumber`, `blockType` — that the shipped `<iframe>` never rendered. No
heading anywhere mentions any of it.

### 5 · Switched-off code — **two channels, and the dangerous one greps as live**

This lister has two independent halves, and running only the first is the
methodological trap this campaign already fell into once.

**Channel A — commented-out code.** Lines beginning `//`, and `{/* … */}` JSX
blocks, whose content is code rather than prose.

**Channel B — suppressed features.** `{false && …}` render guards,
`{SOME_CONSTANT && …}` where the constant is hardcoded falsy, and **exports
commented out at the module boundary** (`// export const render = …`, which
leaves a lens registered but unrenderable).

### Channel A produces a list, never a count

This is the correction that matters, and it was learned the expensive way: an
earlier revision of this document published a channel-A table of per-lens line
counts. Those numbers were an artifact of one regex. Widening the pattern moved
`BlanksLens` from 0 to 23 and `WritemeLens` from 0 to 13, while `ParsonsLens`
stayed at 0 through both patterns **despite carrying a commented-out iframe
`sandbox` attribute** — a security-relevant suppression that no reasonable
code-shape regex catches, because the line looks like prose [measured: two
pattern variants over the six Gen-1 render lenses].

So: **channel A emits a list of candidate lines for pass 2 to read, and never a
headline number.** A count here is false precision, and false precision in an
audit is worse than an admitted gap, because it stops people looking.

### Channel B produces a count, and it is the channel that matters

Channel B is reliably countable, and **it is invisible to channel A and to every
other lister**, because the code inside a falsy guard is syntactically live,
un-commented, and greps exactly like shipping code.

Measured across the whole Gen-1 lens tree:

| Channel-B hit                  | Where                                                                                          | What it suppresses                                     |
| ------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `{false && showHints && …}`    | `BlanksLens` — the tree's only falsy render guard                                              | roughly 190 lines of fully-written three-tier hints UI |
| `// export const render`       | `TracingLens`, `StepThroughsLens`                                                              | the entire lens — registered but unrenderable          |
| `// export const renderConfig` | `StepThroughsLens`, `run-javascript`, `trace-javascript`, `ask-javascript`, `tables-universal` | each lens's configuration surface                      |

[measured: `grep -n '^// *export const \(render\|execute\|renderConfig\)'` and
`grep -c '{false &&'` across the Gen-1 lenses directory]

Two consequences a family session must carry:

- **`TracingLens` and `StepThroughsLens` are dead in Gen-1** despite appearing
  complete. "Gen-1 shipped it" is not a claim any reader can make from file
  size.
- **`ask-javascript`'s suppressed `renderConfig` is a boundary obligation.** It
  is handed to the socratize-quiz campaign, and a suppressed configuration
  surface is exactly the kind of thing a recipient is owed rather than left to
  rediscover.

**Never sum the two channels.** Channel A is a reading list of unknown length;
channel B is a count of suppressed features. `BlanksLens`'s single channel-B hit
outweighs every channel-A line in the tree.

---

## The calibration cases

Two worked examples, from two lenses, chosen because they look identical from a
distance and take opposite dispositions. Every family session reads both before
writing its first row.

They are also the section this document got wrong **twice**, in two successive
AR-1 passes, in the same direction each time. Both errors are recorded in place,
because a method document that hides its own failures is asking to be trusted
rather than checked.

### Case 1 — the blanks hints panel: switched off, and superseded anyway

Gen-1 built a three-tier hints panel: Easy lists every blank with its expected
answer; Medium shows a remaining count; Hard shows the score alone. It had a
learner-facing `<select>` with four options — `auto`, `easy`, `medium`, `hard` —
and on `auto` a deliberate inversion: higher difficulty means more blanks and
therefore _more_ hints. The whole panel sits behind the file's single
`{false && showHints && ...}` guard and **has never run** [measured: lister 5
channel B — one occurrence in `BlanksLens.jsx`].

Never ran. Dead code with obvious learner intent. Under R-2's base rule that is
`revive` — and **it is not**, because Gen-2 replaced the entire mechanism and
wrote down why, in two places:

> _"ships a **cursor-scoped, on-demand, positional** hints panel per
> user-directed redesign. **The legacy 3-tier system
> (`'auto' | 'easy' | 'medium' | 'hard'` controlling rendered richness) is
> gone** — replaced by:"_ … _"The 3-tier system coupled scaffolding intensity to
> difficulty, but the user's pedagogical goal is the inverse: the learner
> chooses how much help to ask for, blank by blank. **The 'tier' is now
> emergent** — how many blanks the learner chooses to peek at across a session
> is itself the scaffolding gradient."_
>
> — Gen-2 `blanks/README.md` § Hints panel contract
>
> ---
>
> _"An earlier design (now reversed) auto-derived a 3-tier hints config from the
> difficulty slider … **User-directed redesign rejected this coupling on
> pedagogical grounds: the learner, not the slider, should control
> scaffolding.**"_
>
> — Gen-2 `blanks/DOCS.md` § Why hints are orthogonal to difficulty

**The whole enum is dead — the menu and the coupling both** (human ruling
2026-08-13). The ladder survives, but _emergent_: the learner's own per-blank
reveal count is the gradient. **This ground is closed**; a session that wants
difficulty-derived scaffolding raises it with the human directly rather than
routing around the ruling as an `ADDITION`.

**Two failures, recorded.** The first draft of this section cleared Gen-2 with
_"no hint-level heading exists there"_ — a heading grep, forbidden by § Pass 1 —
and proposed reviving the coupling. The fix added the mandatory `walked` column.
The second draft **filled that column with the correct section name** and still
reported "nothing there speaks against a learner-chosen ladder", while that
section's first sentence says the system _is gone_. So `walked` alone was not
enough: it records where you looked, not what you found. Hence the `found`
column — see [Columns](#columns).

### Case 2 — the annotate line-highlight tool: switched off, and genuinely revivable

Gen-1's `HighlightLens` is titled "Highlight & Annotate", and its **namesake
tool is commented out of the toolbar** while remaining the default
`selectedTool`, with working click handlers — so a Gen-1 learner opened the lens
holding a tool with no visible button [read: `HighlightLens.jsx`, the `tools`
array's first entry is a comment].

Same shape as case 1: dead, designed, obviously intended. But walk Gen-2 and the
answer inverts:

> _"Tool extensions — `arrow` and `circle` were stubbed in the prior art
> ('coming soon'); **the line-level `highlight` tool was half-implemented and
> dropped at migration. Restoration is its own increment per tool.**"_
>
> — Gen-2 `annotate/README.md` § Future direction

That is a **deferral with an explicit restoration path**, not a reversal. Gen-2
did not decide against the tool; it ran out of increment. → **`revive`**, and
the strongest kind: the port-side reference itself blesses the restoration.

**`## Design owed`**: what a line-level highlight means once the surface is
colored semantically — a line tint under the token colors, or a gutter mark
beside them; whether highlights live in the same per-view annotation namespace
as strokes and notes; and what happens to a highlight when the producer switches
to the fallback, since line geometry does not depend on tokenization but the
coloring underneath it changes.

### What the two cases teach

**Identical evidence shape, opposite dispositions, and only the quoted Gen-2
sentence separates them.** One reference says _is gone_; the other says
_restoration is its own increment_. Everything else about the two features —
dead in Gen-1, designed, pedagogically motivated, already styled — is the same.

That is why `evidence` demands a quotation rather than a citation, why `walked`
demands section names rather than grep strings, and why `found` demands the
strongest sentence **against** the row rather than an unsupported negative.

## Worked rows

Both calibration cases written out as rows, plus one row that shows the opposite
error. `walked` and `found` are shown as their own lines under the row they
belong to, because those cells are prose and the table is already wide.

| #              | affordance                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | provenance                  | evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | disposition                                                                                                                                                         | discharged by                                                                                             | gate                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `blanks-041`   | The learner can choose how much help the hints give — full answers, a remaining count, or the score alone.                                                                                                                                                                                                                                                                                                                                                                                                                                      | `G1-dead` + `G2-doc`        | Gen-1 `BlanksLens.jsx`: `hintsLevel` state with four options; the level `<select>` sits inside a commented-out control block and the panel it feeds is behind the file's single `{false && showHints && (` guard [measured: lister 5 channel B — one occurrence]. The panel's styling is present but reachable only from inside that guard and from commented JSX, so **the orphan-CSS lister does not report it** — `BlanksLens` has two orphans, `loadingIcon` and `loadingState` [measured: lister 4]. | **`supersede`** — strength: a recorded human replacement of the whole mechanism, quoted below. **Ground closed** (human ruling 2026-08-13).                         | README § What this lens does NOT do                                                                       | `P0`                                 |
|                | **`walked`** — Gen-2 `blanks/README.md` §§ Hints panel contract, What this lens does NOT do, Future direction; Gen-2 `blanks/DOCS.md` §§ Why per-blank feedback ships on, Why hints are orthogonal to difficulty.                                                                                                                                                                                                                                                                                                                               |                             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                     |                                                                                                           |                                      |
|                | **`found`** — README § Hints panel contract: _"**The legacy 3-tier system (`'auto' \| 'easy' \| 'medium' \| 'hard'` controlling rendered richness) is gone** — replaced by:"_ and _"**The 'tier' is now emergent** — how many blanks the learner chooses to peek at across a session is itself the scaffolding gradient."_ DOCS § Why hints are orthogonal to difficulty: _"**User-directed redesign rejected this coupling on pedagogical grounds: the learner, not the slider, should control scaffolding.**"_ Not rebutted — the row yields. |                             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                     |                                                                                                           |                                      |
| `blanks-042`   | For the blank the cursor is in, the learner can reveal one more letter at a time, each shown at its true position among bullets.                                                                                                                                                                                                                                                                                                                                                                                                                | `G2-doc` + `G2-code`        | Gen-2 `blanks/README.md` § Hints panel contract — _"per user-directed redesign"_; the positional reveal and the FNV-1a/mulberry32 stable order are specified there and implemented in `index.tsx`.                                                                                                                                                                                                                                                                                                        | **`supersede`** — strength: positional reveal teaches placement; an out-of-order letter inventory does not. It is also the emergent ladder `blanks-041` yielded to. | README § Hints panel contract · test _"reveal exposes one position at its true index"_                    | `P0`                                 |
| `blanks-043`   | The learner can ask for Socratic questions about the program they are working on.                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `G1-live` + `G2-doc`        | Gen-1 `BlanksLens.jsx`: the `🤔 Ask Me` header button. Gen-2 `blanks/README.md` § Ask Me — out of scope — _"it operates on the original embodiment (not the blankenated source) and is a cross-lens orchestrator concern; mounting it inside the blanks lens would duplicate the surface across every lens"_.                                                                                                                                                                                             | **`restore — DEFERRED (orchestrator, Gen-2 blanks README § Ask Me — out of scope)`**                                                                                | orchestrator surface, not this lens                                                                       | —                                    |
| `annotate-007` | The learner can tint a whole source line to mark it, using the lens's own namesake tool.                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `G1-dead` + `G2-doc`        | Gen-1 `HighlightLens.jsx`: `{ id: 'highlight', name: 'Highlight', icon: '🖍️' … }` is commented out of the `tools` array while `'highlight'` remains the initial `selectedTool`, with working line-click handlers — a default tool with no button. Gen-2 never ported it.                                                                                                                                                                                                                                  | **`revive`** — never ran, and the port-side reference explicitly blesses restoring it.                                                                              | README § Tool contract · `types.ts` `Tool` · test _"clicking a line applies the active colour"_ · sandbox | `P0` → `P1:highlight-tool` → sandbox |
|                | **`walked`** — Gen-2 `annotate/README.md` §§ Tool contract, What this lens does NOT do, Future direction; Gen-2 `annotate/DOCS.md` §§ Why two views one lens, Future direction.                                                                                                                                                                                                                                                                                                                                                                 |                             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                     |                                                                                                           |                                      |
|                | **`found`** — README § Future direction: _"the line-level `highlight` tool was half-implemented and **dropped at migration. Restoration is its own increment per tool.**"_ This is a deferral with a named restoration path, **not** a reversal — it supports the row rather than bearing against it. Nothing else bearing on this row.                                                                                                                                                                                                         |                             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                     |                                                                                                           |                                      |
|                | **`## Design owed`** — it never ran, so there is no observed behavior to port. What a line tint means once the surface is colored semantically (a tint under the token colours, or a gutter mark beside them); whether highlights share the per-view annotation namespace with strokes and notes; what happens to a highlight when the producer falls back to Prism, since line geometry is tokenization-independent but the colours underneath change.                                                                                         |                             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                     |                                                                                                           |                                      |
| `parsons-018`  | An educator can attach guidance to a line with a block comment, and the learner can reveal it as a hint.                                                                                                                                                                                                                                                                                                                                                                                                                                        | `G2-doc` + `G2-code` + `G3` | Gen-2 README § Hint blocks (educator guidance) — **absent from Gen-3** [measured: heading diff]. But Gen-2 `lib/extract-hints.ts` is 59 lines and Gen-3's is **69** [measured: `wc -l`] — the behavior survived and grew.                                                                                                                                                                                                                                                                                 | **`restore-as-doc`**                                                                                                                                                | README § Hint blocks                                                                                      | `P0`                                 |

Three rows carry the method's whole argument.

**`blanks-041` and `annotate-007` are the same shape and opposite answers.**
Both are Gen-1 features that never ran, both are pedagogically motivated, both
are already styled. The only thing separating them is one sentence in the Gen-2
document: _is gone_ versus _restoration is its own increment_. Neither row could
be given a disposition without walking Gen-2 and quoting what was found there —
which is why `walked` and `found` are required columns rather than good
practice.

**`parsons-018`** keeps the campaign honest in the other direction: the
documentation was lost, the behavior was not. A ledger that cannot express that
difference produces make-work, and make-work on a live wired lens is regression
risk for no gain.

## Gate checks

### At each lens's Phase-0 human gate

The Phase-0 commit body carries a **`## Discharges`** section listing the row
ids those artifacts encode. The check is mechanical:

1. `git show <phase0-sha>` lists ids.
2. Every listed id resolves to a row in the lens's ledger.
3. Every `restore` or `revive` row scheduled `P0` appears in the list.

**Where this section lives is Gate-1 open question 2 and is not settled.** The
evaluators campaign puts it in the module README; `DEV.md` bans process
narration from end-state docs and names the commit body as a loss ledger's home,
and the commit body is additionally immutable, since amend is forbidden. Until
the human rules, follow this document and put it in the commit body — and if the
ruling goes the other way, the ledgers do not change, only where the list is
printed.

### At AR-5

Already inside AR-5's mandate: content present at baseline, absent from the
result, and missing from the loss ledgers — checked **before** judging style.
What this campaign adds is that rows have ids a reviewer can count.

**Open rows at AR-5 must be zero, or each remaining one must carry a named
deferral owner and its ruling.**

**And every non-empty `discharged by` must RESOLVE.** Emptiness is what makes a
row open; nothing has been checking that a _filled_ cell points at anything
real. Without this, a ledger can reach 100% closed, pass all three passes and
both gate checks, and have produced no README heading, no test and no type
member. At AR-5:

- a named README or DOCS heading exists in the lens's committed docs;
- a named test title appears in a passing run;
- a named type member, config field or CSS token compiles or is declared.

Every `discharged by` value is already written in a checkable form, so this
costs a grep per row and closes the ledger's central promise.

### Two ledgers are narrative, and exempt from § Columns

[`ledgers/_playbook.md`](./ledgers/_playbook.md) and
[`ledgers/_boundary.md`](./ledgers/_boundary.md) are **narrative ledgers**: a
heading-by-heading transport record and a recipient register. They carry
dispositions and evidence but no `#` ids, no `provenance`, and no
`discharged by`, because their units are document sections and hand-offs rather
than learner affordances.

The roll-up counts them as **rows only**, with the disposition columns dashed.
`_boundary.md` additionally organizes by recipient status — handed across,
refused by the contract, dropped — which is **not** an extension of the closed
vocabulary: "refused" is prose describing why a `drop` was ruled, and every row
under it carries a vocabulary value.

Per-lens ledgers are **not** exempt. They use § Columns exactly.

### At campaign close

SPEC.md's roll-up must have no blank cells, and no boundary row may lack an
acknowledged recipient.

---

## Failure modes this method has already hit

Recorded so they are not rediscovered.

- **A ledger built from recollection.** The socratize-quiz campaign's first loss
  ledger was written from memory of the sources rather than from a
  heading-by-heading walk, and its AR-1 rejected it outright. **Every ledger in
  this campaign is built by walking, with the source open.** If you find
  yourself writing a row you did not just read, stop and go read it.
- **Line-number citations that rotted.** The quarry has been reformatted by a
  sanctioned prettier sweep, and every line number written before it is now
  wrong. Cite by heading or test title.
- **Counting only channel A of lister 5.** Described above. The first pass of
  this campaign's own seeding made exactly this error and reported Gen-1's
  render lenses as nearly free of dead pedagogy, when one guard hid the largest
  single piece of it.
- **Summing incomparable counts.** Channel A lines and channel B guards measure
  different things. A roll-up that adds them is worse than one that reports
  neither, because it looks precise.
- **A `revive` cleared by a heading grep.** The first draft of § The calibration
  trio wrote it as a _pair_, cleared Gen-2 with _"no hint-level heading exists
  there"_, and proposed reviving a coupling a human had explicitly reversed. The
  ruling lives under `## Why hints are orthogonal to difficulty` — a heading
  containing none of the feature's Gen-1 vocabulary. **This is why `walked` is a
  required column and not advice.**
- **An `[measured:]` tag naming the wrong instrument.** That same draft
  attributed the hints panel's styling to the orphan-CSS lister, whose output
  says the opposite: the classes are referenced, just from inside a falsy guard
  and from commented JSX. The two counts could not both be true and the document
  printed both. **A tag names the command that produced the claim, not the
  instrument that sounds right.**
- **A count published from an unstable pattern.** The first channel-A table was
  an artifact of one regex; widening it moved two lenses from 0 to 23 and 0
  to 13. See § 5 — channel A now emits a list, never a number.
- **The instrument turning on its own author.** This campaign's plan was itself
  rewritten mid-session and silently lost three of its own findings — the
  calibration material among them — recovered only because someone grepped for
  them afterward. **Migration is transport, not authorship, applies to campaign
  documents too.**

The last four entries were all found by this campaign's own AR-1, on this
campaign's own canon, before a single lens was touched. That is the instrument
working. It is also the reason none of them is stated here as hypothetical.
