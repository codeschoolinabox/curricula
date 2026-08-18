<!-- TRANSITIONAL — retire with SPEC.md when the last lens ledger closes. What
survives is each lens's `## What this lens does NOT do` section, which this
method exists to make complete. -->
<!-- cspell:ignore blankenate parsonizer socratize reenrichment lezer dropdowns writeme parsons blankenated colorizing Gateable -->
<!-- cspell:ignore colour colours distractor distractors ledgered Leitner throughs unfilled -->
<!-- cspell:ignore PRNG affordances assertable unrenderable reopenable unrebutted bwMode QASM -->
<!-- cspell:ignore socratizing ontract oldd clauding -->
<!-- cspell:ignore recognises firstblock glossterm -->

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
  - [The minimum walk set](#the-minimum-walk-set)
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

| Column          | Contents                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `#`             | `<lens>-NNN`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Stable **forever**. Rows are appended; never renumbered, never re-sorted. Handoffs cite these ids, and a renumber silently re-points every citation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `affordance`    | One sentence, in the voice of the reader it serves                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Must be falsifiable at a running sandbox or by opening one named file.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `provenance`    | One or more of `G1-live` · `G1-dead` · `G2-code` · `G2-doc` · `G3`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | This is **literally the set-union** R-2 describes. A row carrying only `G3` is an `ADDITION`. `G2-doc` and `G2-code` are tracked **independently** — parsons proves documentation and behavior can migrate at different rates.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `evidence`      | File + heading or **test title** + a quoted fragment, **for every provenance tag**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Cite quarry content by heading or test _title_, **never by line number** — the quarry has been reformatted by a sanctioned prettier sweep at least once, and every line number in the old handoffs rotted. **A quotation transports verbatim, emphasis included**: bold present in the source is kept, bold absent from it is never added, quote marks are not restyled, and any truncation is marked. **"Verbatim" is bounded by the five sanctioned transport modifications** — each forced by the formatter or the linter, none of them authored — enumerated once, in [`ledgers/_TEMPLATE.md` § What Pass 1 writes](./ledgers/_TEMPLATE.md#what-pass-1-writes-and-what-it-leaves), together with the `<em>` rendering choice and the check that holds a ledger to them. This column states the standard; the template states the exceptions, and neither restates the other. `DEV.md`'s _migration is transport, not authorship_ binds **this campaign's own documents**, not only the ledgers — the calibration cases turn on which sentence was written, so re-marking its emphasis is not a styling choice. |
| `disposition`   | One value from the closed vocabulary below                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `supersede` requires a named strength argument; `drop` requires human sign-off.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `discharged by` | The named artifact that will carry it — a README heading, a test title, a CSS token, a type member, a config field                                                                                                                                                                                                                                                                                                                                                                                                                                                 | **Empty means the row is OPEN — on every row, whatever its disposition** (human ruling 2026-08-14). A `drop` or `already survives` row names the README heading that records it, which R-5 makes mandatory anyway; there is no disposition whose content is "nothing was written down". The single definition of open is [§ At AR-5](#at-ar-5)'s, which this restates for proximity and must not diverge from.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `gate`          | `P0` · `P1:<increment>` · `sandbox` · `AR-5` · `deferred`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Which gate closes it. `deferred` is the value a `restore — DEFERRED` row takes, and it is checked by [§ At AR-5](#at-ar-5)'s deferral rule rather than by a gate in this campaign. **`—` is not that value** — an em dash reads as _not filled in_, and the difference between an empty cell and an answered one is this ledger's whole subject.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `walked`        | **Required on every row carrying `G1-live` or `G1-dead` provenance, and on every `ADDITION` row.** The reference sections _read_ while checking whether a written judgment already covers this affordance — written as **one labelled clause per heading class**, each carrying its section names or the word `empty`. See [§ The minimum walk set](#the-minimum-walk-set).                                                                                                                                                                                        | Section names, not grep strings, and **every name must resolve** — as a _literal prefix_ of a real heading, matched by [§ The minimum walk set](#the-minimum-walk-set)'s `resolve` helper, which must return exactly `1`. Truncating a heading is legal — `Why per-blank feedback ships on` resolves against `blanks/DOCS.md`, not its README — mis-transcribing one is not. **Do not use `grep -E` for this.** Five of the six `does NOT do` headings carry a parenthetical and one carries a `+`, so a regex form returns 0 on exactly the class this rule was written for [measured 2026-08-14: `grep -cE '^#+ What this lens does NOT do (lens-specific drops only)' blanks/README.md` → **0**; the same name through `resolve` → **1**]. An earlier revision published the regex form; it did not run. A heading search does not discharge this column: the ruling that closed the difficulty/hints coupling lives under a heading containing none of that feature's Gen-1 terms.                                                                                                                             |
| `found`         | **Required alongside `walked`, carrying the same eight labels in the same order.** Per label: every section under it that **bears** on the row, quoted — or the literal words `nothing bearing on this row`. **"Bears" is wide: a sentence bears whether it supports the row or tells against it.** Batching is allowed **only inside the named-decision label**, where a lens can carry nine `## Why …` headings; every other label names its sections. A class that is `empty` in `walked` is `empty` here — an absent class is not a section that bore nothing. | This is the column that turns a search log into a finding. `walked` alone failed: a row once named the correct Gen-2 section and still reported "nothing speaks against this", while that section's first sentence said the mechanism _is gone_. **An unrebutted quotation on a `revive` row is an OPEN row**, and an empty `walked` or `found` cell on **any row the column is required on** is an OPEN row. Where a reference document does not exist, the cell is **filled** with that fact, not left empty — see [§ The minimum walk set](#the-minimum-walk-set).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

### The minimum walk set

`walked` says which sections were read. Without a floor, a row can name one
convenient section and pass — which is how `annotate-007`, this document's own
worked row, reached AR-1 having never opened Gen-2 `annotate/DOCS.md` § Out of
scope, § Naming, or `annotate/types.ts`, **each of which carries a statement
bearing on it**.

**The trigger is provenance, not disposition.** Disposition is the _product_ of
the walk —
[§ Choosing between `supersede` and `restore`](#choosing-between-supersede-and-restore--the-evidence-rule)
says a row with no quotable reference sentence _becomes_ `restore` — so keying
the requirement to disposition is circular, and it would leave `restore`, the
default and largest population, asserting an unsupported negative about the
reference with no walk behind it. That is the defect `found` exists to kill.
Keying to provenance is non-circular, because provenance is settled first. It
also exempts the right rows: `blanks-042` is `G2-doc + G2-code`, and walking
Gen-2 to adjudicate a Gen-2 affordance is circular in the other direction.

**The set is derived from the lens's own documents, not enumerated here.** A
fixed list of heading names is unsatisfiable against this quarry three ways
[measured 2026-08-14 across the eight Gen-2 lens directories, per the commands
in the table below]: `## Naming` exists in **1 of 8**; the named-decision set
lives in **DOCS** (3–9 each) while every README has exactly one `## Why …`; and
**5 of the 6** `does NOT do` headings carry a parenthetical
(`(lens-specific drops only)` ×4, quiz's `(Slice A drops + lens-specific)`), so
exact-name matching misses them.

A **heading class** is matched by prefix — so
`## What this lens does NOT do (lens-specific drops only)` and
`### Out of scope (this lens)` both match. A lens with no member of a class
walks that class `empty` and says so.

| heading class  | matched by (README **and** DOCS unless stated) | measured presence              |
| -------------- | ---------------------------------------------- | ------------------------------ |
| drops          | `^#+ What this lens does NOT do` (README)      | 6 of 8                         |
| future         | `^#+ Future direction`                         | README 6 of 8 · DOCS 8 of 8    |
| out of scope   | `^#+ .*[Oo]ut of scope`                        | 9 headings — 8 DOCS + 1 README |
| naming         | `^#+ Naming` (DOCS)                            | 1 of 8                         |
| named decision | `^#+ Why[[:space:]]`                           | README 1 each · DOCS 3–9       |
| contract       | `^#+ .*[Cc]ontract[[:space:]]*$`               | 15 headings across 7 of 8      |
| glossary       | `^#+ Glossary` (README)                        | 8 of 8                         |
| type contract  | `types.ts`, **read in full**                   | 8 of 8, 60–305 lines           |

**Eight classes, not the six an earlier revision published.** The three added
ones are where this document's own exhibits were actually decided, and reaching
them through the "also walked" escape hatch made the mechanical floor decorative
on precisely the rows that matter: `blanks-041`'s supersession quote lives in
README § **Hints panel contract**, `blanks-043`'s ruling in README § **Ask Me —
out of scope**, `annotate-007`'s `discharged by` in README § **Tool contract**.
Two further corrections in the same table: **named decision** was pinned to
`^##` and silently dropped `trace-debugging/DOCS.md` § Why the orchestration
seam exists — the one Family F lens the class applies to — and **out of scope**
was DOCS-only, which is what hid `blanks-043`'s ruling. `^#+` throughout now
[measured 2026-08-14, per row, across the eight Gen-2 lens directories].

The added cost is **6 more headings for blanks and 3 for annotate**, once per
ledger rather than per row [measured 2026-08-14: the three added classes over
both lenses], so the inventory argument below is unaffected.

**The `resolve` helper**, published because a rule nobody can run is not a rule:

```bash
resolve() { # resolve <file> <heading name as written>; must print exactly 1
  awk -v n="$2" '/^#+ /{h=$0; sub(/^#+ +/,"",h); if (index(h,n)==1) c++} END{print c+0}' "$1"
}
```

It matches a **literal prefix**, so parentheses and `+` are text rather than
metacharacters, truncation stays legal, and `Why two views one lens` still
returns 0 against `Why two views, one lens` — which is the whole point.

Applying the named-decision class to **both** documents satisfies the original
proposal literally — it asked for "every `## Why …`" on the README, where there
is exactly one — while putting the requirement where the decisions actually are.

**`types.ts` is in the set because no heading can point at it.** Gen-2
`annotate/types.ts` documents the dropped tool on the `Tool` type's `@remarks`,
and keeps `CodeSpanTree`'s lines distinct _"so the wrapper can attach per-line
affordances (line-number gutter, future line-level annotation tool
restoration)"_ — a structural provision for the very restoration `annotate-007`
proposes, behind no heading in either markdown document. The files total **1,526
lines across eight lenses** [measured 2026-08-14: `wc -l
src/lib/study-lenses--deprecated-architecture/lenses/*/types.ts`], so this is
one read per ledger, not a cost per row.

**The inventory is printed once per ledger, not once per row.** Every per-lens
ledger is cut from [`ledgers/_TEMPLATE.md`](./ledgers/_TEMPLATE.md), which fixes
the document shape eight independent sessions would otherwise each invent, and
opens with a `## Reference inventory` section — the complete heading list of the
reference documents plus the `types.ts` line count — pasted from:

```bash
REF=src/lib/study-lenses--deprecated-architecture/lenses/<lens>
for f in README.md DOCS.md; do echo "== $f"; grep -nE '^#+ ' "$REF/$f"; done
echo "== types.ts"; wc -l "$REF/types.ts"
grep -nE '@remarks|^type |^\s+readonly ' "$REF/types.ts"   # the type-contract universe
```

The `types.ts` lines are printed because otherwise the **type contract** class
is the one class with no enumerable universe, and `found`'s obligation under it
would be unfalsifiable. Gen-2 lenses carry 2–12 `@remarks` blocks each [measured
2026-08-14: `grep -c '@remarks'` per lens].

`walked` is then written as **one labelled clause per heading class**, so a
reviewer's "what was skipped?" is a single pass down eight labels rather than a
diff against that list. The alternative — every row transcribing the full
heading list with the walked ones marked — multiplies transcription by the row
count, and mis-transcription is the failure this column already has on record:
`annotate-007` shipped `Why two views one lens` for a heading that reads
`Why two views, one lens`. **A cure whose mechanism is the disease it treats is
not a cure**, which is why the resolve rule in § Columns replaces it: the comma
is now caught by a grep rather than by a proofreader.

#### Where a reference document does not exist

Its whole share of the set is empty. `walked` and `found` carry the literal
words `no Gen-2 reference — <path> does not exist`, cited once from the ledger's
`## Reference inventory`. **That is a filled cell, not an empty one, and the row
is not OPEN for that reason.**

One consequence follows, and it is a real constraint rather than a formality:
**`supersede` is structurally unavailable on such a lens.**
[§ Choosing between `supersede` and `restore`](#choosing-between-supersede-and-restore--the-evidence-rule)
requires a quoted reference sentence recording a deliberate replacement, and
there is none to quote. Every row is `restore`, `revive`, `drop`, `ADDITION` or
`already survives`.

#### The exemption needs evidence too

A row escapes the walk by **not** carrying `G1-live` or `G1-dead` — and "there
is no Gen-1 ancestor" is an unsupported negative about Gen-1, which is the
defect `found` exists to kill, relocated one column left. `evidence` demands a
quote per **present** provenance tag and nothing for an absent one, so nothing
mechanical catches an omitted G1 tag.

**So a row whose provenance omits both G1 tags carries a one-line Gen-1
negative** naming what was searched: the lister-4 or lister-5 output it came
from, or the literal words `no Gen-1 source: <lens> has no Gen-1 file`. Where
the lens has no Gen-1 file at all, that line is stated **once per inventory
block** and cited, not repeated across forty rows — once per ledger in a
single-lens ledger, in `## Reference inventory`, and **once per affected
member** in [`ledgers/_family-f.md`](./ledgers/_family-f.md), in that member's
own `## Reference inventory — <member>`. In a multi-member ledger `<lens>` in
the literal words is the **member's** slug, never `fam-f`.

⚠️ **"once per ledger" was wrong for the one ledger it matters most in, and it
named a heading that does not exist there.**
[`ledgers/_TEMPLATE.md`](./ledgers/_TEMPLATE.md) § `_family-f.md` is the one
exception mandates disambiguated per-member headings, so no bare
`## Reference inventory` exists in that ledger at all [measured 2026-08-18: six
of Family F's seven members have no Gen-2 reference and exactly one,
`trace-debugging`, owes the Gen-1 line]. Corrected here rather than reported,
under the standing ruling that correcting a measurably false sentence is not
re-deriving the method.

Without this the walk requirement is opt-out by omission, and the opt-out is
invisible. (The worked exemption holds on its merits: `blanks-042` is
`G2-doc + G2-code`, and Gen-1 `BlanksLens.jsx` has no per-letter positional
reveal to tag — but that is a fact someone checked, and the row does not say
so.)

**The population is stated by rule, not by roster**, because a roster of it goes
stale the way this campaign's register did. The rule: **any lens with a per-lens
ledger and no Gen-2 directory.** The qualifier is load-bearing — 19 of the
register's 27 names have no Gen-2 directory, but the extras route to
`_boundary.md`, which carries no per-lens rows at all. Measured today that is
**nine** of the register's names — `dropdowns`, `variables`, `print`,
`run-javascript`, `debug-javascript`, `trace-javascript`, `tables-universal`,
`step-throughs`, `tracing` [measured 2026-08-14: `ls -d
src/lib/study-lenses--deprecated-architecture/lenses/*/` → annotate, blanks,
debug-props, lib, parsons, quiz, socratize, trace-debugging, writeme]. Six of
those nine are Family F, so **`_family-f.md` is the largest ledger this clause
governs**, not an afterthought to `dropdowns` and `variables`.

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

| Value                                    | Meaning                                                                                                                                                                                                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `restore`                                | **The default.** The affordance returns, reference-faithful.                                                                                                                                                                                                   |
| `supersede`                              | A port-side or new design wins — **only with a named strength argument.**                                                                                                                                                                                      |
| `drop`                                   | The affordance does not return — **only with human sign-off.**                                                                                                                                                                                                 |
| `ADDITION`                               | An enrichment neither reference had, riding in reference style.                                                                                                                                                                                                |
| `restore-as-doc`                         | The affordance returns as a **documentation** obligation — the behavior already survived.                                                                                                                                                                      |
| `already survives`                       | No loss. It lives on, possibly under another name.                                                                                                                                                                                                             |
| `drop-as-loss`                           | A drop recorded **with its loss acknowledged**.                                                                                                                                                                                                                |
| `restore — DEFERRED (<owner>, <ruling>)` | Restores, discharged by the named future campaign. Spelling pinned — both the owner and the ruling. Checked at AR-5 against its owner and its ruling citation, not against an artifact in this tree — [§ At AR-5](#at-ar-5). Its `gate` cell reads `deferred`. |

### The one addition — `revive`

R-2 creates a state that campaign never had, because it never quarried a
generation whose best ideas were switched off.

> **`revive`** — the affordance exists **only** as `G1-dead`. It never ran. No
> learner ever used it and no behavior was ever observed. Restoring it is
> therefore **not transport — it is a build against recovered intent.**
>
> A `revive` row carries a mandatory **`## Design owed`** note naming what must
> be decided before it can be built, and it **cannot be discharged by a diff.**
> Write it as a **bolded inline label on its own line under the row, never as a
> heading** — two `revive` rows in one ledger would collide under markdownlint's
> `MD024 siblings_only`. [`ledgers/_TEMPLATE.md`](./ledgers/_TEMPLATE.md) shows
> the form.

⚠️ **Nothing would stop you committing that collision, and an earlier revision
of the note above said otherwise.** The pre-commit hook runs `prettier --write`
and no linter, so an `MD024` collision lands committed and surfaces later in
someone else's repo-wide run. Run the markdownlint gate yourself, path-scoped,
before every commit [read: `.husky/pre-commit` → `npx lint-staged`;
`package.json` `lint-staged` `*.md` → `prettier --write`].

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

> **Two notes added 2026-08-15, after the first ledger was seeded.**
>
> **An inapplicable lister returns FALSE output, not absent output — and that is
> the dangerous case.** A lister that cannot run is visible in the `instruments`
> cell; a lister that _runs on the wrong source shape_ returns a confident
> number nobody questions. Measured against Gen-1's second root
> ([SPEC.md § Gen 1's second root](./SPEC.md#gen-1s-second-root--the-lens-file-is-often-only-a-shell)):
> lister 4 over `parsonizer/parsons.css` + `parsons.js` recognises **1** class
> of the stylesheet's 17 and reports it as an orphan — **and it is not one**;
> lister 5 channel B returns **0** because it greps React idioms a jQuery file
> cannot contain. Neither result is a finding. **Before running any lister on a
> source shape it was not written for, say so and stop** — § Failure modes'
> standing rule is that a false entry is worse than a missing one.
>
> **Pass 1's operative rules live in
> [`ledgers/_TEMPLATE.md`](./ledgers/_TEMPLATE.md), not here.** The pass banner,
> the Pass-1 gate, the `firstblock` and `glossterm` extractors, the seed-class
> provenance table, the `UNSETTLED` marker, the annotation-class fence and the
> cluster-row rule are all specified there. This document remains the authority
> on **what a row is**; the template is the authority on **what Pass 1 writes
> into one**. Read both before seeding — "read this in full before the first
> row" is necessary and no longer sufficient.

Pass-1 mechanics. Each finds a class of loss the others cannot.

**Listers 1–3 are comparative and need a document on both sides; 4 and 5 read
one source.** Which of them can run is a property of the lens's population, and
it is stated per ledger rather than assumed:

| ledger                              | listers 1–3                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| `parsons`, `writeme`, `debug-props` | run as specified — Gen-2 reference against the landed Gen-3 port                       |
| `blanks`, `annotate`                | run **reference-to-source** — see below (human ruling 2026-08-14)                      |
| `dropdowns`, `variables`            | **cannot run** — no Gen-2 directory, and neither lens has a Gen-1 `.md` on either root |
| `_family-f.md` (7 members)          | **six cannot run** — only `trace-debugging` has a Gen-2 directory                      |

**`blanks` and `annotate`: Gen-2 documents as the reference, the Gen-1
`.jsx`/`.module.css` pair as the source side** (human ruling 2026-08-14). Their
Gen-3 port is what this campaign is about to write, so there is nothing on the
port side yet. What this produces is **not a heading-survival verdict** — Gen-1
has no headings, so a text diff would report total loss and mean nothing. It is
a **union worksheet**: every Gen-2 heading, named decision and glossary term
opens a candidate row whose provenance set is then settled against Gen-1 **by
reading**. That is R-2's union, enumerated.

**The cost, stated rather than hidden:** for these two ledgers listers 1–3 emit
candidates a reader adjudicates, not a mechanical result. § Pass 1 already
licenses exactly that — _"They open rows and close none"_ — and the adjudication
is Pass 2's job, where it was always going to happen.

**`dropdowns` and `variables` seed from listers 4 and 5 alone** (human ruling
2026-08-14). Their ledgers will be visibly thinner than the others, and that
thinness is an **instrument limit, not a clean bill of health** — SPEC's roll-up
carries an `instruments` column so the two cannot be confused. The design work
those ledgers cannot surface is closed by follow-on DDD sessions, which is what
the ruling directs: hand off what is available.

**Family F is the largest population of the same problem**, not a footnote to
it: six of its seven members have no Gen-2 directory either. Its ledger seeds
from listers 4 and 5 for those six, and reference-to-port for `trace-debugging`
alone.

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
GEN1="/Users/master/Documents/0-teach-code/0-spiralearn/0-study-lenses-committee/zz--oldd-clauding-and-context-dump/0--study-lenses--it-begins/src/lenses"
CSS="$GEN1/<Lens>.module.css"; JSX="$GEN1/<Lens>.jsx"
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
> user-directed redesign. The legacy 3-tier system
> (`'auto' | 'easy' | 'medium' | 'hard'` controlling rendered richness) is gone
> — replaced by:"_ … _The 3-tier system coupled scaffolding intensity to
> difficulty, but the user's pedagogical goal is the inverse: the learner
> chooses how much help to ask for, blank by blank. The "tier" is now emergent —
> how many blanks the learner chooses to peek at across a session is itself the
> scaffolding gradient._
>
> (The second fragment is set in italics without outer quote marks because the
> source's own double quotes around "tier" would nest. Emphasis in both
> fragments is the source's: only `cursor-scoped, on-demand, positional` carries
> it.)
>
> — Gen-2 `blanks/README.md` § Hints panel contract
>
> ---
>
> _"An earlier design (now reversed) auto-derived a 3-tier hints config from the
> difficulty slider … User-directed redesign rejected this coupling on
> pedagogical grounds: **the learner, not the slider, should control
> scaffolding**."_
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

> _"**Tool extensions** — `arrow` and `circle` were stubbed in the prior art
> ("coming soon"); the line-level `highlight` tool was half-implemented and
> dropped at migration. Restoration is its own increment per tool."_
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

> **These five rows are ILLUSTRATIVE, and their ids are not reserved** (human
> ruling 2026-08-14). A seeding session starts its ledger at `<lens>-001` and
> **does not transcribe them** — `blanks-041` does not imply forty earlier rows,
> and no ledger owes a gap to accommodate one. They live here, in the method, as
> worked examples of what a conforming row looks like; the ledgers derive their
> own rows and number them from 001.
>
> The one thing that follows and must not be lost: **a seeded ledger will very
> likely re-derive these same affordances under different ids.** That is
> expected and is not a stable-id violation — the stable-id rule governs a row
> once it exists in a ledger, and these have never been in one. If a seeding
> session reaches the same affordance, it may lift this section's `walked`,
> `found` and quoted evidence wholesale rather than re-walking; the adjudication
> was done here and survived four review rounds.

| #              | affordance                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | provenance                  | evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | disposition                                                                                                                                                         | discharged by                                                                                   | gate                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------ |
| `blanks-041`   | The learner can choose how much help the hints give — full answers, a remaining count, or the score alone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `G1-dead` + `G2-doc`        | Gen-1 `BlanksLens.jsx`: `hintsLevel` state with four options; the level `<select>` sits inside a commented-out control block and the panel it feeds is behind the file's single `{false && showHints && (` guard [measured: lister 5 channel B — one occurrence]. The panel's styling is present but reachable only from inside that guard and from commented JSX, so **the orphan-CSS lister does not report it** — `BlanksLens` has two orphans, `loadingIcon` and `loadingState` [measured: lister 4]. | **`supersede`** — strength: a recorded human replacement of the whole mechanism, quoted below. **Ground closed** (human ruling 2026-08-13).                         | README § What this lens does NOT do                                                             | `P0`                                 |
|                | **`walked`** — against `ledgers/blanks.md` § Reference inventory. **drops:** README § What this lens does NOT do. **future:** README § Future direction; DOCS § Future direction. **out of scope:** DOCS § Out of scope. **naming:** `empty` — blanks' DOCS has no such heading. **contract:** README §§ Toolbar contract, View contract, Hints panel contract, Editor header contract. **glossary:** README § Glossary. **named decision:** README § Why this lens exists; DOCS §§ Why this module exists, Why preserve learner answers across view-mode toggle, Why per-blank feedback ships on, Why hints are orthogonal to difficulty, Why drop the seeded RNG, Why position-aware evaluation is in scope, Why drop URL config sync. **type contract:** `blanks/types.ts` read in full.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |                             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                     |                                                                                                 |                                      |
|                | **`found`** — **five sections bear on this row and all five confirm the supersession.** **contract:** README § Hints panel contract: _"ships a **cursor-scoped, on-demand, positional** hints panel per user-directed redesign. The legacy 3-tier system (`'auto' \| 'easy' \| 'medium' \| 'hard'` controlling rendered richness) is gone"_ and _The "tier" is now emergent — how many blanks the learner chooses to peek at across a session is itself the scaffolding gradient._ (italics mine — the source's own double quotes around "tier" would nest.) **named decision:** DOCS § Why hints are orthogonal to difficulty: _"User-directed redesign rejected this coupling on pedagogical grounds: **the learner, not the slider, should control scaffolding**."_ DOCS § Why per-blank feedback ships on: _"the design and styling exist in full … v1 splits the two affordances the legacy conflated"_ and _"Disabling it in legacy was a ship cut, not a design decision"_ — so the panel returns while its 3-tier control does not, which is what `supersede` means here. **drops:** README § What this lens does NOT do: _"**Hints panel ships ENABLED at parity.** Legacy compiled it out with `{false && showHints && (...)}` (line 672); the design and styling exist and are load-bearing pedagogically."_ **type contract:** `types.ts`, the config type's `@remarks` Naming note: _"vocabulary matches the legacy `BlanksLens.jsx` directly (`blank`, `blankenated`, `content type`, `view mode`, `hints level`, `correctness`)"_ — **the term `hints level` outlived the mechanism it named**; the greenfield must not silently reuse it for the emergent ladder. **glossary:** README § Glossary defines `view mode` as "hints panel eligible", naming the panel without its 3-tier control — consistent with the supersession. Not rebutted anywhere — the row yields. **future, naming, out of scope:** nothing bearing on this row.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |                             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                     |                                                                                                 |                                      |
| `blanks-042`   | For the blank the cursor is in, the learner can reveal one more letter at a time, each shown at its true position among bullets.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `G2-doc` + `G2-code`        | Gen-2 `blanks/README.md` § Hints panel contract — _"per user-directed redesign"_; the positional reveal and the FNV-1a/mulberry32 stable order are specified there and implemented in `index.tsx`.                                                                                                                                                                                                                                                                                                        | **`supersede`** — strength: positional reveal teaches placement; an out-of-order letter inventory does not. It is also the emergent ladder `blanks-041` yielded to. | README § Hints panel contract · test _"reveal exposes one position at its true index"_          | `P0`                                 |
| `blanks-043`   | The learner can ask for Socratic questions about the program they are working on.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `G1-live` + `G2-doc`        | Gen-1 `BlanksLens.jsx`: the `🤔 Ask Me` header button. Gen-2 `blanks/README.md` § Ask Me — out of scope — _"it operates on the original embodiment (not the blankenated source) and is a cross-lens orchestrator concern; mounting it inside the blanks lens would duplicate the surface across every lens"_.                                                                                                                                                                                             | **`restore — DEFERRED (orchestrator, Gen-2 blanks README § Ask Me — out of scope)`**                                                                                | orchestrator surface, not this lens                                                             | deferred                             |
|                | **`walked`** — against `ledgers/blanks.md` § Reference inventory. **drops:** README § What this lens does NOT do. **future:** README § Future direction; DOCS § Future direction. **out of scope:** README § Ask Me — out of scope; DOCS § Out of scope. **naming:** `empty`. **named decision:** README § Why this lens exists; DOCS §§ Why this module exists, Why preserve learner answers across view-mode toggle, Why per-blank feedback ships on, Why hints are orthogonal to difficulty, Why drop the seeded RNG, Why position-aware evaluation is in scope, Why drop URL config sync. **contract:** README §§ Toolbar contract, View contract, Hints panel contract, Editor header contract. **glossary:** README § Glossary. **type contract:** `blanks/types.ts` read in full.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |                             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                     |                                                                                                 |                                      |
|                | **`found`** — **three sections bear on this row and all three place the affordance outside the lens, none of them denying it.** **out of scope:** README § Ask Me — out of scope: _"The Socratic study companion (`socratizing/` module) is **not part of this lens**. It operates on the original embodiment (not the blankenated source) and is a cross-lens orchestrator concern … The orchestrator owns Ask Me at the level above."_ DOCS § Out of scope: _"**Socratic study companion (Ask Me / socratizing).** Lives in the SL orchestrator one layer up — operates on the original embodiment rather than the blankenated source, so it's cross-lens rather than per-lens."_ **type contract:** `types.ts`, the config type's `@remarks` Naming note: _"The Socratic study companion (`socratizing/`) is NOT a blanks concern — it lives at the SL orchestrator."_ All three name a **relocation with an owner**, not a removal — which is exactly what `restore — DEFERRED (orchestrator, …)` encodes, and why the row is deferred rather than dropped. **drops, future, naming, named decision, contract, glossary:** nothing bearing on this row.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |                             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                     |                                                                                                 |                                      |
| `annotate-007` | The learner can tint a whole source line to mark it, using the lens's own namesake tool.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `G1-dead` + `G2-doc`        | Gen-1 `HighlightLens.jsx`: `{ id: 'highlight', name: 'Highlight', icon: '🖍️' … }` is commented out of the `tools` array while `'highlight'` remains the initial `selectedTool`, with working line-click handlers — a default tool with no button. Gen-2 never ported it.                                                                                                                                                                                                                                  | **`revive`** — never ran, and the port-side reference explicitly blesses restoring it.                                                                              | README § Tool contract · `types.ts` `Tool` · test _"clicking a line applies the active colour"_ | `P0` → `P1:highlight-tool` → sandbox |
|                | **`walked`** — against `ledgers/annotate.md` § Reference inventory. **drops:** README § What this lens does NOT do. **future:** README § Future direction; DOCS § Future direction. **out of scope:** DOCS § Out of scope. **naming:** DOCS § Naming. **named decision:** README § Why this lens exists; DOCS §§ Why this module exists, Why two views, one lens, Why `prism-react-renderer` over `prismjs` direct. **contract:** README §§ Tool contract, View contract. **glossary:** README § Glossary. **type contract:** `annotate/types.ts` read in full.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |                             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                     |                                                                                                 |                                      |
|                | **`found`** — **six sections bear on this row: five support it, one bears against it, and the adverse one is answered in its own paragraph.** **future:** README § Future direction and DOCS § Future direction — the latter reads _"- **Tool extensions.** `arrow`, `circle`, line-level `highlight` restoration — each is one increment per tool."_, a fifth explicit restoration path. Then: README § Future direction: _"**Tool extensions** — `arrow` and `circle` were stubbed in the prior art ("coming soon"); the line-level `highlight` tool was half-implemented and dropped at migration. Restoration is its own increment per tool."_ DOCS § Out of scope: _"**Tool extensions** — `arrow`, `circle`, line-level `highlight`."_ DOCS § Naming — **bearing against**: _"WS4 Phase 0 renamed it to `annotate` because the lens does annotation-on-top-of-display (pen + eraser + note over code or flowchart), not token/line highlighting"_, which is the recorded rationale for excluding line highlighting from the lens's identity; **the same section's next clause governs** — _"restoring it as a fourth tool inside `annotate` is on the Future direction list"_ — so the row stands. `types.ts` § the `Tool` type's `@remarks`: _"Pre-refactor tool catalog also included `arrow`, `circle`, and a line-level `highlight`; those were stubbed-and-deferred and are not in the v1 catalog."_ `types.ts` § `CodeSpanTree` — **the strongest support, and structural rather than prose**: _"lines are kept distinct so the wrapper can attach per-line affordances (line-number gutter, future line-level annotation tool restoration)"_ — Gen-2 kept the data shape **for this restoration**. Every deferral names a restoration path; none is a reversal. **contract:** README § Tool contract enumerates `pen`, `eraser`, `note` and no more — the v1 catalog, consistent with the deferral rather than against it. **glossary:** README § Glossary defines _"**Tool** — the active annotation interaction. One of `pen` … `eraser` … `note`"_, the same closed enumeration. Neither denies the restoration; both fix what v1 shipped. **out of scope:** DOCS § Out of scope: _"**Tool extensions** — `arrow`, `circle`, line-level `highlight`."_ **type contract:** `types.ts` § the `Tool` type's `@remarks`: _"Pre-refactor tool catalog also included `arrow`, `circle`, and a line-level `highlight`; those were stubbed-and-deferred and are not in the v1 catalog."_ and § `CodeSpanTree`: _"lines are kept distinct so the wrapper can attach per-line affordances (line-number gutter, future line-level annotation tool restoration)"_ — Gen-2 kept the data shape **for this restoration**. **drops, naming, named decision:** nothing bearing on this row. |                             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                     |                                                                                                 |                                      |
|                | **`## Design owed`** — it never ran, so there is no observed behavior to port. What a line tint means once the surface is colored semantically (a tint under the token colours, or a gutter mark beside them); whether highlights share the per-view annotation namespace with strokes and notes; what happens to a highlight when the producer falls back to Prism, since line geometry is tokenization-independent but the colours underneath change.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |                             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                     |                                                                                                 |                                      |
| `parsons-018`  | An educator can attach guidance to a line with a block comment, and the learner can reveal it as a hint.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `G2-doc` + `G2-code` + `G3` | Gen-2 README § Hint blocks (educator guidance) — **absent from Gen-3** [measured: heading diff]. But Gen-2 `lib/extract-hints.ts` is 59 lines and Gen-3's is **69** [measured: `wc -l`] — the behavior survived and grew.                                                                                                                                                                                                                                                                                 | **`restore-as-doc`**                                                                                                                                                | README § Hint blocks                                                                            | `P0`                                 |

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

**Open rows at AR-5 must be zero, and this is the single definition of open** —
§ Columns points here and restates none of it, because two definitions is how
`blanks-043` came to be closed by one rule and open by another. **A row is open
when any of these holds:**

1. its `discharged by` cell is empty — **on any disposition, including `drop`,
   `already survives` and `drop-as-loss`** (human ruling 2026-08-14). Those
   three name the README heading recording the drop, which
   [SPEC.md § R-5](./SPEC.md#rulings-of-record) already makes mandatory for
   every lens this campaign migrates;
2. its `discharged by` cell is filled but does not resolve (below);
3. it is a row the walk columns are required on and its `walked` or `found` cell
   is empty ([§ Columns](#columns));
4. it is a `revive` row carrying an unrebutted quotation in `found`.

A `restore — DEFERRED` row is **not** open on any of these counts — it resolves
under the deferral rule below, and its `gate` cell reads `deferred`.

**Every non-empty `discharged by` must resolve to something.** Nothing has been
checking that a _filled_ cell points at anything real. Without this, a ledger
can reach 100% closed, pass all three passes and both gate checks, and have
produced no README heading, no test and no type member.

**For every row except `restore — DEFERRED`**, the cell names an artifact in
this tree and the check is that the artifact exists:

- a named README or DOCS heading exists in the lens's committed docs;
- a named test title appears in a passing run;
- a named type member, config field or CSS token compiles or is declared.

**A `restore — DEFERRED` row is discharged by a named owner, not by an artifact
in this tree** — that is what the disposition says, and the artifact check above
cannot reach it. It is not excused; it takes a different two-part check, and its
`gate` cell reads `deferred`:

- the **owner token** in the disposition's `(<owner>, <ruling>)` parenthetical
  appears in the `discharged by` cell — `blanks-043`'s `orchestrator` appears in
  `orchestrator surface, not this lens`. Token containment, not string equality:
  the two cells say the same thing at different lengths on purpose;
- the **ruling** in that parenthetical resolves as a heading in the reference
  document it cites, which _is_ in this tree —
  `Gen-2 blanks README § Ask Me — out of scope` resolves under
  `grep -nE '^#+ Ask Me' <ref>/blanks/README.md`.

**What that check does not buy, said plainly: it verifies form, not agreement.**
Both halves are written by the same author in the same breath, so a row can pass
while naming an owner nobody agreed to. The standard for a deferral to a
_campaign_ is the one [`ledgers/_boundary.md`](./ledgers/_boundary.md) § Close
conditions already sets — a commit in the recipient's own tree whose body cites
the row id — and a deferral to a **region** rather than a campaign needs the
same Gate-1 owner naming that `bnd-003` requires, for the same reason: a
directory cannot acknowledge anything.

Every `discharged by` value is already written in a checkable form, so this
costs a grep per row and closes the ledger's central promise.

### The two narrative ledgers, per ledger

[`ledgers/_playbook.md`](./ledgers/_playbook.md) and
[`ledgers/_boundary.md`](./ledgers/_boundary.md) are **narrative ledgers**: a
heading-by-heading transport record and a recipient register. Their units are
document sections and hand-offs rather than learner affordances, so parts of §
Columns do not apply.

**They do not exempt identically, and an earlier revision of this section was
wrong about its own premise** — it said neither carries `#` ids, while
`_boundary.md` carries `bnd-001`…`bnd-009` and its own close condition needs
them [measured 2026-08-14:
`grep -oE 'bnd-[0-9]{3}' ledgers/_boundary.md | sort -u` → 9 ids].

|                    | `_boundary.md`                                                    | `_playbook.md`                                                     |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| unit               | a hand-off                                                        | a playbook heading                                                 |
| `#` ids            | **required** — `bnd-001`…`bnd-009`; § Close conditions cites them | **not carried** — rows are addressed by the heading they transport |
| `provenance`       | exempt                                                            | exempt                                                             |
| `discharged by`    | exempt                                                            | exempt                                                             |
| `walked` / `found` | exempt — it carries no `revive` or `ADDITION` row                 | exempt — its `ADDITION`s are transport, not affordances            |
| roll-up columns    | `rows` **and `open`**                                             | `rows` only                                                        |

**`_boundary.md` keeps its `open` count**, because its close condition is
entirely about open rows: a boundary row with no acknowledged recipient is an
OPEN row at campaign close. Dashing that column would contradict the ledger's
only close condition.

**What the boundary rows actually carry is recipient, status and ground — not a
disposition value.** A second false premise rode the earlier revision: it
claimed "every row under [§ Refused] carries a vocabulary value". None does.
Measured across the whole file, `ADDITION`, `already survives`, `drop-as-loss`
and `restore-as-doc` appear **zero** times; the single `restore` and `supersede`
hits are `bnd-002`'s prose about what R-1 did to the playbook's decision (1);
the two `revive` hits are `bnd-001` noting that the _vocabulary value itself_
travels to the recipient; and every `drop` hit is prose, a banner, or the cspell
ignore list [measured 2026-08-14: `grep -c '<value>' ledgers/_boundary.md` for
each of the eight values, then each hit read in place]. The § Refused and §
Dropped tables have no disposition column at all. "Refused" is prose describing
why a drop was ruled — it is not an extension of the closed vocabulary, and it
is not a substitute for one either.

**The `walked`/`found` exemption is a measured statement about today's rows, not
a license for tomorrow's.** If a row in **either** narrative ledger is ever
written with disposition `revive` or `ADDITION` **in the affordance sense**, it
carries `walked` and `found` like any other row. (`_playbook.md`'s existing
`ADDITION`s are transport additions, a different sense its § Vocabulary declares
— that is the exemption, and it does not extend to affordances.)

Per-lens ledgers — including [`ledgers/_family-f.md`](./ledgers/_family-f.md),
which is not narrative — are **not** exempt from anything. They use § Columns
exactly.

### At campaign close

SPEC.md's roll-up must have no blank cells, and no boundary row may lack an
acknowledged recipient.

**And the register check must run clean** —
[SPEC.md § The register check](./SPEC.md#the-register-check). It enforces one
direction — every name the three trees and the wired roster produce **has a
row**; that a name has only **one** row is read, not run, as that section says.
It runs at Gate 1 as well, because the register goes stale between drafts rather
than between campaigns.

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
- **A `revive` cleared by a heading grep.** The first draft of
  [§ The calibration cases](#the-calibration-cases) wrote it as a _pair_,
  cleared Gen-2 with _"no hint-level heading exists there"_, and proposed
  reviving a coupling a human had explicitly reversed. The ruling lives under
  `## Why hints are orthogonal to difficulty` — a heading containing none of the
  feature's Gen-1 vocabulary. **This is why `walked` is a required column and
  not advice.**
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

- **An unsupported negative in a `found` cell — twice, in the two worked rows,
  written by the author of the rule forbidding it.** `blanks-041` closed with
  "the remaining walked sections bear nothing" while three of its newly-required
  sections bore on it, including a `types.ts` note recording that the term
  `hints level` survived the mechanism it named. `annotate-007` claimed "all
  four support it" while DOCS § Naming carries the recorded rationale for
  excluding line highlighting from the lens's identity. Both were caught by AR-1
  round 4, in the same commit that introduced the minimum walk set. **The rule
  and its violation were written by the same hand in the same pass** — which is
  the argument for the walk set being mechanical (a printed inventory and six
  labelled clauses) rather than a standard of care.
- **A ledger certifying a transport that did not happen.**
  [`ledgers/_playbook.md`](./ledgers/_playbook.md) asserted five module names
  were "specifically transported" into SPEC.md; four were not, and two of them
  appeared in the whole campaign exactly once — inside the sentence certifying
  them. A **false** ledger entry is worse than a missing one: a missing one
  invites a reader to look, a false one stops them. Corrected before the
  deletion it licensed.

The four entries above these two were found by this campaign's own AR-1, on this
campaign's own canon, before a single lens was touched; these two were found by
its fourth round, on the fix for the first three. That is the instrument
working. It is also the reason none of them is stated here as hypothetical.
