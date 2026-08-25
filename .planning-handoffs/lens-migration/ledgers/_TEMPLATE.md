<!-- TRANSITIONAL — the skeleton every per-lens ledger is cut from. Copy it to
`<lens>.md`, fill it, and delete nothing structural. It retires with SPEC.md. -->
<!-- cspell:ignore socratize reenrichment dropdowns writeme parsons colorizing blankenate -->
<!-- cspell:ignore colour distractor distractors ledgered throughs unrebutted -->
<!-- cspell:ignore firstblock orphanclusters oldd clauding -->
<!-- cspell:ignore gsub RSTART RLENGTH -->
<!-- cspell:ignore glossterm normalised normalisation parsonizer -->
<!-- cspell:ignore behaviour behaviours affordances pointcut QASM -->
<!-- cspell:ignore towc multibyte Normalising -->
<!-- cspell:ignore keyable legitimise nocite quotemeta mktemp licence unrun -->
<!-- cspell:ignore capitalisation loosenings initialised -->
<!-- structure-check.sh awk locals; see § The structural-integrity check: -->
<!-- cspell:ignore isledger lslice bslice bbanner lrow ochar incomment hasreal -->
<!-- transport-check.sh schema locals; see § The transport check: -->
<!-- cspell:ignore QCOL RCOL NCELL PCOL provless istemplate -->
<!-- gen1-arm.sh locals; see § The Gen-1 arm: -->
<!-- cspell:ignore toks unesc qmisplaced uninitialised -->

# `<lens>` — fidelity ledger

Method: [FIDELITY-METHOD.md](../FIDELITY-METHOD.md), read in full before the
first row. Scope and disposition: [SPEC.md](../SPEC.md).

**Row ids are stable forever.** Append; never renumber, never re-sort. Handoffs
cite these ids, and a renumber silently re-points every citation.

## The pass banner is mandatory

A ledger states which pass it is at, in one greppable token, immediately under
the title (human ruling 2026-08-15). Until Pass 2 runs, that is:

> **PASS 1 — SEEDED, NOT AUDITED.** Every row below is OPEN by construction, and
> that is this pass's contract:
> [§ Pass 1](../FIDELITY-METHOD.md#pass-1--mechanical-seeding)'s listers **open
> rows and close none**. Every `provenance` set carries `UNSETTLED`. **This
> ledger makes no fidelity claim.** Its thinness is a property of the
> instruments, not a finding — do not read a row's absence as evidence of
> anything, and do not hand this ledger to a lens session:
> [SPEC.md § The two handoff tiers](../SPEC.md#the-two-handoff-tiers) requires a
> completed ledger.

**At Pass 1 the invariant is `open == rows`; at AR-5 it is `open == 0`.** One
definition — [§ At AR-5](../FIDELITY-METHOD.md#at-ar-5)'s — run as an equality
instead of a zero. A Pass-1 ledger carrying a _closed_ row is the defect, not a
head start: § Pass 1 says the listers close none, so a closed row means the
seeder closed something.

The token is what makes the banner enforceable rather than decorative. A Tier-2
handoff is not final while `grep -c 'PASS 1 — SEEDED' <its cited ledger>` is
non-zero.

**Start at `<lens>-001`** (human ruling 2026-08-14). FIDELITY-METHOD § Worked
rows exhibits five ids that look real — `blanks-041`, `annotate-007` and the
rest. They are **illustrative and their ids are not reserved**: do not
transcribe them, and do not leave a gap for them. Their `walked`, `found` and
quoted evidence may be lifted if this ledger reaches the same affordance, but
the id is this ledger's to assign.

## `_family-f.md` is the one exception to everything below

Family F is **seven lenses in one ledger** (human ruling 2026-08-14), because
SPEC § Roll-up counts it as one row with one link. It therefore differs from
this template as follows — **not "in exactly three ways", which was true before
`## Source inventory` existed and is not true now**:

- **Seven per-member inventory blocks**, each with its own `REF=` (or its own
  Gen-1 file pair), its own Gen-1-source line, and its own `instruments` value —
  they are not uniform, and one member has none at all.

  ⚠️ **Their headings must be disambiguated per member** —
  `## Reference inventory — step-throughs`,
  `## Source inventory — step-throughs` — because seven identical
  `## Reference inventory` H2s are siblings and `MD024 siblings_only` fires on
  them [measured 2026-08-15: three sibling copies → **2 errors**; the
  disambiguated form → **0**]. This is the same collision the `Design owed` rule
  below avoids at label granularity, one level up. It also gives each member's
  `### Lister 4` / `### Lister 5` a distinct parent, which they need for the
  same reason.

- **Six per-member `### Lister 5` blocks and two `### Lister 4` blocks**, per
  SPEC § Roll-up's Family F table — `step-throughs` and `tracing` have a
  `.module.css`; the four action lenses do not; `trace-debugging` has neither.
- **`### Seed census` carries non-contiguous id ranges per instrument**, because
  seven members interleave in one `fam-f` namespace. The one-range-per-row shape
  below cannot express that — add a member column.
- **Fix the seeding order across members before the first id is assigned.**
  Member-major or instrument-major is a free choice exactly once: under _append,
  never renumber_ it is permanent from `fam-f-001` onward.
- **Row ids are `fam-f-NNN`**, one namespace across the whole ledger. The member
  is named in the `affordance` cell, not in the id — a reader seeing `fam-f-012`
  must be able to tell which ledger to open, which a per-member prefix defeats.
- ⚠️ **In this ledger, "instrument" means a lister and never Aran.** Family F is
  the one ledger where the ambiguity bites: `tracing`'s Gen-1 engine IS an
  instrumentation library (`aran-build.js`, `advice/`, `pointcut.js`,
  `shadowing/`), and `trace-debugging`'s Gen-2 tests carry `instrumentBoundary`
  and `instrumentVariables` [measured 2026-08-15]. The repo's established sense
  is code instrumentation — `embody/README.md`'s _"NM-instrumented tiers"_ — and
  this campaign's is a measuring device. Write "lister" wherever the sentence
  would otherwise carry both senses at once.
- **`trace-debugging` has no runnable lister**
  ([SPEC.md § Roll-up](../SPEC.md#roll-up)). Its rows come from Pass 2 — a
  whole-file read of its Gen-2 documents — and its inventory block says so, so a
  thin result reads as an instrument limit rather than as a finding.
- ⚠️ **Every row carries its member as a keyable marker, and
  [§ The transport check](#the-transport-check) is run once per member** (human
  ruling 2026-08-18). The bullet above already says the member "is named in the
  `affordance` cell"; **named in prose is not keyable**, so this fixes the form:
  the member's slug, backticked, is the **first token of the `affordance`
  cell**, separated from the sentence by a spaced em dash. The separator carries
  significant spaces, so it is shown **only** in the fence below and never in an
  inline code span — `MD038` forbids the spaces there and prettier silently eats
  them, which is this template's own recorded hazard and it damaged **this
  bullet** on its first write:

  ```text
  | `fam-f-012` | `tracing` — The learner can step one statement at a time … |
  ```

  The preflight below is the authority on the exact bytes; read the separator
  off that grep, not off any prose.

  It is a **label, not part of the sentence**, so FIDELITY-METHOD § Columns'
  _"one sentence, in the voice of the reader it serves"_ and § What Pass 1
  writes' binding rule both stay true unchanged. It is **Family-F-only** — never
  copy it into a single-lens ledger; `MEMBER` defaults to `all`, so the other
  seven ledgers' invocation is byte-unchanged. It does not trip the Pass-1
  gate's em-dash check, which requires the em dash to sit between two pipes as a
  cell value [measured 2026-08-18: 4 marked rows → **0**; one planted em-dash
  cell value → **1**].

  **The check takes ONE reference root, and Family F needs exactly one.**
  Measured 2026-08-18: of the seven members only **`trace-debugging`** has a
  Gen-2 directory, and Family F has no Gen-3 port at all — so six of the seven
  runs assert `NONE` on both sides rather than resolving anything. That is what
  makes `NONE`-as-an-assertion load-bearing here: without it, six of seven
  invocations are no-ops and this marker buys nothing.

  ⛔ **THIS INVOCATION IS NOT READY. Do not cut `_family-f.md` against it.**
  AR-1 and AR-2 independently measured two defects in the form below,
  2026-08-18, and both are open:
  1. **It is a census, not a floor** — the exact defect the check itself was
     amended to remove, reintroduced one level up by its own caller. The loop
     never inspects the per-member exit status and ends on an `echo`, so **seven
     `FAIL` lines still exit 0**. Every inner failure also degrades to a silent
     `0` in the sum via `${r:-0}`. And `covered:` prints a number beside a `$n`
     that is not in scope — **it asserts nothing.**
  2. **A correctly-seeded Pass-1 ledger is guaranteed red.** `trace-debugging`
     has `instruments: none` and seeds entirely from Pass 2, so it contributes
     **zero rows at Pass 1** — and it is the only member of the seven with a
     real `REF`. The floor therefore FAILs on it, naming three causes that are
     all false. A routine FAIL trains the seeder to ignore FAIL lines, which is
     what kills a floor everywhere else.

  **The fix is designed and measured but deliberately not applied here**,
  because three consecutive rounds of same-session fixes each introduced the
  defect they removed. It goes to a fresh session: a published zero-row roster
  so `rows=0` is an _assertion_ for its declared members and a _breach_ for
  everyone else (an `EXPECT` argument was built and measured working in both
  directions), plus a wrapper that accumulates status, takes the Pass-1 gate's
  `$n` as an argument, asserts `total == n`, and exits non-zero.

  ⚠️ **No heredoc.** This fence sits inside a list item, so every line carries a
  two-space indent — and an indented `EOF` does **not** terminate `<<EOF`. Under
  the raw extraction an agent in this repo actually uses (`sed -n '<range>p'`),
  the terminator and the `covered:` line are swallowed as heredoc **data**: two
  bogus member runs are injected, the sum assertion never executes, and nothing
  reaches stderr [measured 2026-08-18, AR-2 — the swallowed form ran and printed
  `member=EOF` and `member=echo`]. The `for` loop below has no such edge, and
  that half of it is verified: raw extraction now runs seven members and prints
  `covered:`.

  ```bash
  L=.planning-handoffs/lens-migration/ledgers/_family-f.md
  G2=src/lib/study-lenses--deprecated-architecture/lenses
  MEMBERS='step-throughs tracing run-javascript debug-javascript trace-javascript tables-universal trace-debugging'

  # Preflight: every row carries a marker naming ONE OF THE SEVEN. The roster is
  # the acceptance set, not a character class -- a shape-valid misspelling is
  # the likelier failure and a character class cannot see it.
  ALT=$(printf '%s' "$MEMBERS" | tr ' ' '|')
  awk '/^## Rows/{on=1;next} /^## Close conditions/{on=0} on' "$L" \
    | grep '^| `fam-f-[0-9]\{3\}`' \
    | grep -vE "^\| \`fam-f-[0-9]{3}\` *\| *\`($ALT)\` — " \
    | awk '{print "UNMARKED-ROW: " $2}'

  # One run per member. NONE is an ASSERTION, not an absence.
  total=0
  for member in $MEMBERS; do
    ref=NONE; [ "$member" = trace-debugging ] && ref="$G2/trace-debugging"
    sh transport-check.sh "$L" "$ref" NONE "$member" > /tmp/fam-f-$member.out
    cat /tmp/fam-f-$member.out
    r=$(sed -n 's/^CENSUS .*rows=\([0-9]*\) .*/\1/p' /tmp/fam-f-$member.out)
    total=$(( total + ${r:-0} ))
  done
  echo "covered: $total rows -- must equal the Pass-1 gate's \$n"
  ```

  **The sum is the assertion and the preflight is the diagnosis** — neither
  alone suffices, and the reason is measured rather than assumed [all measured
  2026-08-18 on a four-row fixture, intact → 2 + 1 + 1 = 4]:

  | fault                 | sum        | preflight                                                                                                                                                                                                        |
  | --------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | marker **deleted**    | falls to 3 | `UNMARKED-ROW` names the row                                                                                                                                                                                     |
  | marker **misspelled** | falls to 3 | `UNMARKED-ROW` names the row — **only because the roster is the acceptance set**; under a `[a-z][a-z-]*` character class it was **silent**, and a short sum with a clean preflight is a diagnosis-free shortfall |

  ⚠️ **Two successive revisions justified running both instruments with an
  overshoot claim, and NEITHER reproduced.** First "a duplicated **marker**
  overshoots the sum" — it does not: the perl filter anchors `\Q$M\E` to the
  first cell position, so each row is claimable by at most one member. Then its
  replacement, "a duplicated **row id** does overshoot" — it does not either:
  the id increments the perl `$rows` counter and the Pass-1 `rows()` count
  identically, measured **5 = 5** on a fixture with `fam-f-002` duplicated
  [measured 2026-08-18]. The second claim shipped inside the paragraph
  retracting the first, which is this canon's recorded failure mode committed
  one revision later.

  **The case that does reproduce is slice asymmetry.** A `fam-f` row placed
  **outside** the `## Rows`…`## Close conditions` slice is counted by the perl
  filter, which does not slice, and is invisible to the preflight, which does:
  **covered 5 against a sliced `n` of 4, preflight silent** [measured
  2026-08-18]. That is the real "the sum catches what the preflight cannot"
  case, and it is why both run.

  ⚠️ **The marker proves membership, not correctness, and that cost is accepted
  rather than hidden.** Six of the seven members run with `REF=NONE PORT=NONE`,
  so a `tracing` row mismarked `step-throughs` is checked identically either way
  and **is invisible**. Only a mismark involving `trace-debugging` surfaces, and
  only as `EMPTY-EXTRACT`. Pass 2 owns that reading; do not let this section
  read as though it were covered.

---

## Reference inventory

Pasted from one run, not retyped — this is what `walked` is checked against, so
a reviewer's "what was skipped?" is a set difference against a printed list
rather than a re-derivation.

```bash
REF=src/lib/study-lenses--deprecated-architecture/lenses/<lens>
if [ -d "$REF" ]; then
  for f in README.md DOCS.md; do echo "== $f"; grep -nE '^#+ ' "$REF/$f"; done
  echo "== types.ts"; wc -l "$REF/types.ts"
  grep -nE '@remarks|^type |^\s+readonly ' "$REF/types.ts"
else
  echo "no Gen-2 reference — $REF does not exist"
fi
```

**The `else` branch is not decoration.** `$REF` does not exist for `dropdowns`,
`variables`, or six of Family F's seven members, and a bare run against a
missing directory prints three `grep: no such file` lines and exits non-zero —
which reads as a broken command rather than as a stated fact. The branch is what
makes an absent reference a **filled** cell: those literal words are what
[§ Where a reference document does not exist](../FIDELITY-METHOD.md#where-a-reference-document-does-not-exist)
requires `walked` and `found` to carry, cited once from here rather than
repeated across forty rows. Two consequences travel with it — **`supersede` is
structurally unavailable** on such a lens, and listers 1–3 cannot run.

<!-- paste the output here, verbatim -->

**Gen-1 source**, for the provenance negative every non-G1 row owes
([§ The exemption needs evidence too](../FIDELITY-METHOD.md#the-exemption-needs-evidence-too)):

<!-- either the Gen-1 file pair, or the literal words:
     no Gen-1 source: <lens> has no Gen-1 file -->

**Instruments that could run**, matching this lens's row in
[SPEC.md § Roll-up](../SPEC.md#roll-up):

<!-- One of the eight values SPEC § Roll-up actually uses:
       1–5 · 1–5 (1–3 ref→src) · 1–3 · 4,5 · 5 · none · mixed — see below · n/a
     Say which, so a thin ledger below reads as an instrument limit rather than
     as a clean bill of health. `1–3` is debug-props; `5` and `none` are Family
     F members; `mixed` is Family F itself. -->

---

## Source inventory

`## Reference inventory` above prints the **reference** side. This section
prints the **source** side — listers 4 and 5, which read a Gen-1 file and
nothing else (human ruling 2026-08-15). It exists because for `dropdowns`,
`variables` and six of Family F's seven, those two are the **only** instruments
that can run, so their output _is_ the seed and had nowhere to live.

Same discipline as above: **pasted from one run, not retyped.** The last Pass 1
was run and its outputs died with the session that produced them; committing the
instrument output beside the rows it produced is what makes a reviewer's "what
was skipped?" a set difference instead of a re-derivation.

⚠️ **The `no Gen-1 source` line lives in `## Reference inventory`, NOT here, and
this sentence used to say the opposite.** Both documents said "once", in two
different places:
[FIDELITY-METHOD § The exemption needs evidence too](../FIDELITY-METHOD.md#the-exemption-needs-evidence-too)
puts it in `## Reference inventory`; an earlier revision of this section put it
"once, **here**". Resolved toward the method, because both committed ledgers
already do it that way and the alternative would have split one fact across two
sections in eight ledgers [read: `parsons.md` and `writeme.md`, each carrying
their **Gen-1 source** line under `## Reference inventory`].

A lens with no Gen-1 file therefore writes the literal words
`no Gen-1 source: <lens> has no Gen-1 file` **once per inventory block** — once
per ledger in a single-lens ledger, and **once per affected member** in
[`_family-f.md`](./_family-f.md), in that member's own
`## Reference inventory — <member>` — and both listers report `n/a` here, citing
it rather than repeating it.

⚠️ **The per-member half is not a refinement; without it the rule is impossible
to follow.** Amendment 7 said "once, in `## Reference inventory`", and the
Family F exception above mandates **disambiguated per-member headings**, so a
bare `## Reference inventory` heading **never exists in that ledger at all**.
The rule named a place that cannot be reached in the one ledger it calls
hardest. In a multi-member ledger `<lens>` in the literal words is the
**member's** slug, never `fam-f`. Measured 2026-08-18: six of Family F's seven
members have no Gen-2 reference and exactly **one** (`trace-debugging`) owes the
Gen-1 line — so the placement decides seven blocks rather than one, and gets one
of them wrong under the old wording.

**`_family-f.md` is not yet cut, and several documents forward-link it.** They
all resolve the moment it lands, and **nothing gates them meanwhile**: `MD051`
checks fragments, not paths, so markdownlint stays at 0 over a link that goes
nowhere. **Do not transcribe the site list — derive it**, because an earlier
revision enumerated three sites while the same commit was adding a fourth:

```bash
grep -rnoE '\]\((\./)?(ledgers/)?_family-f\.md\)' \
  .planning-handoffs/lens-migration --include='*.md'
```

That is the cut commit's checklist, recorded here because this is the document
its author is reading — and published as a command for the same reason every
other count in this file is.

### ⚠️ The Gen-1 quarry root is TWO directories, not one

**Human ruling 2026-08-15.** Gen-1 source is
`…/0--study-lenses--it-begins/src/lenses/` **and**
`…/0--study-lenses--it-begins/public/static/`. Listers 4 and 5 run over both.

The `src/lenses/` file is frequently a **shell**; the pedagogy is in
`public/static/`. Measured 2026-08-15:

| lens                         | shell in `src/lenses/`    | engine in `public/static/`                                                                                         |
| ---------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `parsons`                    | `ParsonsLens.jsx` **181** | `parsonizer/parsons.js` **1367** · `component.js` **574** · `lis.js` **148**; `public/parsons-iframe.html` **586** |
| `blanks`                     | `BlanksLens.jsx` 914      | `blanks/blankenate.js`                                                                                             |
| `tables-universal`           | 134                       | `wc-trace-table/`                                                                                                  |
| `tracing`                    | `TracingLens.jsx` 313     | `aran-build.js`, `advice/`, `pointcut.js`, `shadowing/`, `trace-*.js`                                              |
| `ask-javascript` (`bnd-001`) | 412                       | `ask/component/ask-questions.js`                                                                                   |
| ~~the coloring foundation~~  | —                         | ~~`prism/`~~ — **NOT A QUARRY SOURCE, human ruling 2026-08-19**                                                    |

[measured 2026-08-15: `grep -ohE '(public\|static\|/static)/[A-Za-z0-9_./-]+'`
over `src/lenses/*.jsx`, and `wc -l` on the parsonizer set]

⚠️ **`prism/` is struck (human ruling 2026-08-19): _"prism is incidental, we'll
create a code styling for all lenses to share."_** The foundation is a fresh
shared build, not a port, and R-1 already retains Prism as a **library** rather
than as quarried content. **Do not open a row against `public/static/prism/`.**
The reasoning lives once, in
[SPEC.md § Gen 1's second root](../SPEC.md#gen-1s-second-root--the-lens-file-is-often-only-a-shell);
this is the copy that governs a seeder and it deliberately does not restate it.

**Seven of the eighteen Gen-1 lens files reference an iframe** (`EditorLens`,
`ParsonsLens`, `TracingLens`, `StepThroughsLens`, `QASMEditorLens`,
`run-javascript`, `debug-javascript`) [measured 2026-08-15: `grep -lE
'iframe'`], so "the Gen-1 lens file" is routinely not where the lens lived.

**Why this is a ruling and not a note:** a ledger scoped to `src/lenses/` alone
reports the shell and calls it Gen-1. The first ledger seeded did exactly that —
47 rows, **zero `G1-live`**, `instruments 1–5, all five ran` — while three of
its own rows quoted `component.js` and `lis.js` by name. R-2 sets the fidelity
target as the union of Gen-1 and Gen-2 behaviours, and a shell is not the
behaviour.

**Use `dist/` for nothing.** It is a build output of `public/` and duplicates it
[measured 2026-08-15: both trees carry the same parsonizer file set].

### Lister 4 — orphan CSS

Classes defined in the Gen-1 `.module.css` and never referenced from its `.jsx`,
**clustered by the stylesheet's own banner comments** — a `/* … */` alone at
column 0 starts a cluster; anything before the first banner is `(prologue)`.

```bash
GEN1="/Users/master/Documents/0-teach-code/0-spiralearn/0-study-lenses-committee/zz--oldd-clauding-and-context-dump/0--study-lenses--it-begins/src/lenses"
CSS="$GEN1/<Lens>.module.css"; JSX="$GEN1/<Lens>.jsx"
awk '
  /^\/\*/ { banner=$0; gsub(/^\/\*[[:space:]]*|[[:space:]]*\*\/$/,"",banner); next }
  /^[[:space:]]*\.[a-zA-Z][a-zA-Z0-9_-]*[[:space:]]*[,{]/ {
    if (match($0,/\.[a-zA-Z][a-zA-Z0-9_-]*/)) {
      c=substr($0,RSTART+1,RLENGTH-1)
      if (!(c in seen)) { seen[c]=1; cluster[c]=(banner=="" ? "(prologue)" : banner) }
    }
  }
  END{ for (c in cluster) print cluster[c] "\t" c }
' "$CSS" | while IFS=$'\t' read -r cl c; do
  grep -q "styles\.$c\b" "$JSX" || echo "$cl	$c"
done | sort
```

**One row per cluster containing at least one orphan**, named by the banner's
own words, with `evidence` listing every orphan in it. The cluster key is the
_source's_ authorship, not the seeder's — which is what makes the partition
reproducible rather than a judgment. Canon itself reads `ParsonsLens`'s 27 as
**one** thing ("a complete drag-and-drop board that never rendered"), so a rule
emitting 27 rows would contradict the sentence the instrument was written from.

⚠️ **A cluster row states the stylesheet, not the learner.** This is the one
place where "the unit is the affordance" and "one row per cluster" pull against
each other, and the resolution is that **at Pass 1 the unit is the cluster,
honestly labelled**; Pass 2 turns it into affordances by appending ids. So
write:

> _Twenty class definitions in the stylesheet's pre-banner region —
> `blocksPanel`, `solutionPanel`, `insertZone`, … — describe UI surfaces the
> shipped 181-line `<iframe>` shell never renders._

and **not** _"The learner can drag blocks from a pool panel into a solution
panel"_. The second infers behaviour from class names, is not falsifiable by
opening one named file, and silently bundles three affordances (a board, a
control bar, a feedback pair) into one row while naming only the first.

**Before writing any cluster row, check the `.jsx` for a live sibling.** An
orphan often has a renamed live twin, and a row asserting the learner cannot see
something they can see is worse than no row [measured 2026-08-15:
`ParsonsLens`'s `parsons-fallback` is an orphan, but `.fallbackContainer` is
referenced at `ParsonsLens.jsx:52` and defined 3× — a styled fallback **does**
render].

⚠️ **Three limits, all of which must be recorded in this section rather than
discovered later:**

- **A class referenced ONLY from commented-out JSX reports as LIVE.** This is
  the lister's false-**negative** mode and it is the dangerous direction: the
  two limits below make an orphan list too long or unverifiable, and a reader
  checks. This one makes it too **short**, so a dead affordance never opens a
  row at all and nothing signals the omission. `grep -q "styles\.<name>"` cannot
  tell a live reference from one inside `{/* … */}`. Measured 2026-08-17 on
  `DropDownsLens.jsx`: `styles.distractorsLabel` (`:669`) and
  `styles.actionButtons` (`:713`) are each referenced exactly once, both inside
  commented-out JSX, and both report as live — so that lens's distractors and
  reset affordances are switched off by commenting, invisible to channel B
  (which greps `{false &&` and module-boundary exports, not JSX comments) and
  uncountable by channel A (which emits a reading list and never a verdict).
  **Before accepting a clean orphan result, grep the `.jsx` for `styles.` inside
  comment blocks** and carry what you find to Pass 2.

- **The partition is reproducible, not semantic.** Measured on `ParsonsLens`, 20
  of 27 orphans fall before the first banner and land in one undifferentiated
  `(prologue)` cluster [measured 2026-08-15, this command]. Pass 2 splits by
  reading and **appends** ids; it never renumbers, so a split costs nothing.
- **The count runs in _both_ directions, not just low.** FIDELITY-METHOD § 4
  calls the counts a lower bound, which covers descendant selectors — but
  computed access makes false **positives** possible too, and kebab-case classes
  are unreachable by `styles.<name>` at all. Run both direct checks and record
  the result, empty or not:

  ```bash
  grep -n 'styles\[' "$JSX"                     # computed access -> false POSITIVES
  <the orphan command above> | cut -f2 | grep -- '-'   # kebab-case -> unverifiable
  ```

  A kebab-case orphan cannot be confirmed by the lister at all, because
  `styles.parsons-modal` is not expressible — direct-check each one by name and
  record the result. And **a lister that ran and found nothing writes
  `measured zero — <command> → 0`, never silence**: the census row reads `0`
  rather than being omitted. This is what keeps the campaign's fidelity control
  honest — `WritemeLens` has **0** orphans [measured 2026-08-15], and a blank
  section there is indistinguishable from an instrument that could not run,
  which is the exact confusion SPEC § Roll-up's `instruments` column exists to
  prevent.

  Measured on today's tree: `BlanksLens.jsx:735` and `WritemeLens.jsx:710` use
  computed access; `ParsonsLens` carries six kebab-case orphans. Every orphan a
  direct check touches carries its own `[measured: <command> → <result>]`.

### Lister 5 — switched-off code

**Two channels, and they are never summed** — channel A is a reading list of
unknown length, channel B a count of suppressed features.

**Channel B first, because it is the one that matters and the one that counts.**
`{false && …}` guards, `{CONST && …}` where the constant is hardcoded falsy, and
exports commented out at the module boundary:

```bash
grep -nE '^// *export const (render|execute|renderConfig)' "$JSX"
grep -n '{false &&' "$JSX"
```

<!-- paste as a table: hit | line | what it suppresses. Each opens ONE row. -->

**Channel A opens no rows at Pass 1.** Its own definition — lines whose content
is code rather than prose — is a _reading_, and a seeder filtering them with a
regex is doing Pass 2's work with an instrument that cannot do it.
[§ 5](../FIDELITY-METHOD.md#5--switched-off-code--two-channels-and-the-dangerous-one-greps-as-live)
rules it emits "a list of candidate lines for pass 2 to read, and never a
headline number". So the list is **carried here for Pass 2 and never counted**:

<details>
<summary>Channel A — candidate lines for Pass 2. A reading list, not a count.</summary>

<!-- paste line numbers + one phrase each. NO headline number, here or in the
     commit body. A count here is false precision, and false precision in an
     audit is worse than an admitted gap because it stops people looking. -->

</details>

### Seed census

The arithmetic a reviewer checks, so no row comes from nowhere and no hit
vanishes. One line per instrument: hits → rows opened → id range, each carrying
the command that produced it. Then the **remainders** — every instrument hit
that did _not_ open a row, named as a remainder rather than dropped, because a
hit with no row and no remainder line is indistinguishable from a hit nobody
ran.

<!-- e.g.
| instrument | hits | rows opened | ids | note |
| ---------- | ---- | ----------- | --- | ---- |
| lister 1/3 headings | 36 | 33 | 001-033 | less 2 H1 titles, less `## Glossary` (its terms seed separately) |
| lister 3 glossary   | 11 | 11 | 034-044 | |
| lister 4 clusters   | 27 orphans | 3 | 045-047 | clustered by banner |
| lister 5 channel B  | 1  | 1  | 048     | |
| lister 5 channel A  | list | 0 | —      | carried above for Pass 2; never counted |
-->

---

## Rows

Columns and their rules: [§ Columns](../FIDELITY-METHOD.md#columns). **The order
below is frozen** — eight ledgers are read side by side.

### What Pass 1 writes, and what it leaves

**Pass 1 transports; it does not author** (human ruling 2026-08-15). Every cell
it writes is a verbatim substring of a named source location, a token from a
closed set, or the output of a published command — so the check on a Pass-1
ledger is a re-run and a diff, not a judgment.

| column           | Pass 1                                                      |
| ---------------- | ----------------------------------------------------------- |
| `#`              | filled, in the seeding order below                          |
| `affordance`     | filled — **and bound to its quote**, see below              |
| `provenance`     | **only the tags this lister witnessed**, plus `UNSETTLED`   |
| `evidence`       | filled — file + `§ Heading` + the first block, verbatim     |
| `disposition`    | **empty** — § Pass 1's listers close none                   |
| `discharged by`  | **empty** — it names an artifact that does not exist yet    |
| `gate`           | **empty**, never `—`; § Columns bans the em dash as a value |
| `walked`         | **absent — no line at all**                                 |
| `found`          | **absent — no line at all**                                 |
| `## Design owed` | **absent** — written only when Pass 2 writes `revive`       |

**The binding rule on `affordance`: the sentence may contain no claim its quote
does not support.** That is what makes an interpretive cell reviewable — a
reader holds the sentence and the quote side by side and needs nothing else. A
plausible sentence written from a heading _name_, without opening the section,
is this campaign's recorded failure mode: present, well-written, and wrong about
its own evidence.

So `evidence` is not composed. It is extracted, by one published command, so
eight ledgers quote by the same rule and a reviewer can re-run it:

````bash
firstblock() { # firstblock <file> <heading name as written>
  awk -v n="$2" '
    /^#+ /{ h=$0; sub(/^#+ +/,"",h)
            if (index(h,n)==1) { inside=1; next }
            if (inside) exit }
    inside { if ($0 ~ /^[[:space:]]*$/) { if (got) exit; next }
             if ($0 ~ /^```/) { fence=1; next }
             buf = (got ? buf " " : "") $0; got = 1
             if ($0 ~ /^\|/ || fence) exit }
    END{ gsub(/\|/,"\\|",buf)
         if (length(buf) > 240) { buf=substr(buf,1,240); sub(/[^ ]*$/,"",buf); buf=buf "…" }
         print buf }' "$1"
}
````

It matches a **literal prefix**, exactly as
[§ The minimum walk set](../FIDELITY-METHOD.md#the-minimum-walk-set)'s `resolve`
does — so parentheses and `+` are text, truncating a heading stays legal, and
`Why two views one lens` returns empty against `Why two views, one lens`
[measured 2026-08-15: both forms run against `annotate/DOCS.md`].

⚠️ **Run both extractors under `LC_ALL=C`, and treat that as part of the command
rather than as advice.** BSD `awk` aborts on a byte it cannot convert in a UTF-8
locale, and it aborts **to stderr while printing nothing to stdout** — so inside
`$(firstblock …)` the failure is invisible and the caller captures an empty
string. Measured 2026-08-17 over every heading in the four `writeme` documents:
exactly **one** heading differs between locales — the port README's
`§ Navigation` returns **242 bytes** under `LC_ALL=C` and **0 bytes** under
`LC_ALL=en_US.UTF-8`, with `awk: towc: multibyte conversion failure` on stderr.
All four files are valid UTF-8, so the abort is the tool's, not the source's.

The consequence is the one this campaign keeps re-learning: a reviewer who
re-runs "the published extractor" in an ordinary UTF-8 shell gets `""`, sees no
error, and concludes the cell was **invented**. That is the silent-failure class
[SPEC.md § The register check](../SPEC.md#the-register-check) already records
three times over — a check that reports success, or absence, over nothing.

**`firstblock` covers heading-seeded rows only.** Glossary rows take
`glossterm`, and lister-4 / lister-5 rows cite no heading at all and take
neither. Say which rule produced which cell; a blanket "every quotation was
extracted by `firstblock`" is false the moment a ledger has a glossary, and
every Gen-2 lens has one (8 of 8).

```bash
glossterm() { # glossterm <file> <bold term as written>
  awk -v n="$2" 'index($0, "- **" n "** —") == 1 { print $0 "…"; exit }' "$1"
}
```

⚠️ **`glossterm` matched a regex until 2026-08-16, and returned nothing for any
term containing a metacharacter.** The published form interpolated the term into
`$0 ~ "…"`, so `Diff (toggle)` was read as `Diff` followed by a **group**
matching the literal `toggle` — the parentheses vanished, the space with them,
and it searched for a run-together term that appears nowhere. It reported the
term absent from **both** sides, which reads as a definitional loss and is not
one [measured 2026-08-16 against `writeme/README.md`, where the term is defined
on line 133: regex form → empty; literal-prefix form → the bullet].

**This is the third helper in this campaign to carry that defect, and the other
two were already fixed.** `resolve` and `firstblock` both match with `index()`
for exactly this reason — see
[FIDELITY-METHOD § The minimum walk set](../FIDELITY-METHOD.md#the-minimum-walk-set),
where five of the six `does NOT do` headings carry a parenthetical and one
carries a `+`, so `grep -E` returns 0 on precisely the class the rule exists
for. `glossterm` was the one that kept the regex. It now matches a **literal
prefix**, like its two siblings.

**Blast radius, measured rather than assumed** [measured 2026-08-16 across the
eight Gen-2 lens glossaries, then each hit read in place]: **two terms** —
`writeme`'s `Diff (toggle)` and `trace-debugging`'s `Admission error (text)`.
`writeme`'s ledger already carries the caveat on `writeme-038` and was seeded
with the corrected form, so **`trace-debugging` is the one still ahead**: it is
a Family F member, so `_family-f.md` must be cut with this form and not the old
one.

**A first count of four was wrong, and the two it over-counted are a different
defect worth its own line.** `quiz`'s `Mastery` and `socratize`'s `Register`
bullets put the whole phrase **inside** the bold span with no `—` separator
after it — `- **Mastery — two channels.** Per-…` — so they do not match
`glossterm`'s contract under **any** matching strategy, literal or regex. That
is a source-convention divergence, not a helper defect, and it bites this
campaign nowhere: both lenses are excluded
([SPEC.md § Standing exclusions](../SPEC.md#standing-exclusions)). A ledger that
ever does seed one of them extracts those two terms by hand and says so.

**Five transport modifications are sanctioned, and none of them is authored.**
Every one is forced by the formatter or the linter — a cell that refused them
would not survive `prettier --write` or would fail the markdownlint gate. **A
sixth is not yours to invent**: if the extractor's output cannot be pasted, say
so in the row and raise it here rather than quietly reshaping the quote.

1. `|` → `\|`, which `firstblock` applies so the cell survives the table.
2. prettier's whitespace collapse, which flattens a quoted table row's column
   padding to single spaces.
3. prettier's escape of an emphasis marker at a truncation point. A
   240-character cut can land inside an emphasis span, leaving an unmatched
   marker that prettier escapes to keep the markdown valid [measured 2026-08-15:
   5 of `parsons.md`'s 47 rows]. Read it as a signal, not damage — it marks a
   quote truncated mid-emphasis, and the fix is to lengthen or re-cut the quote,
   never to unescape it by hand.
4. **Backticks around an extracted line that is markup.** `firstblock` takes a
   fence's first line, and for a JSX or HTML fence that line is a tag —
   `<div data-lens="writeme"`. Pasted bare it is inline HTML, which `MD033`
   rejects for any element outside its allowed list. Wrap it in a code span.
   **This modification is visible in the ledger and must be, so it is named in
   the row's annotation** — the existing form
   `(a fence; the extractor takes its first line)` is where it goes. A fence
   whose first line is not markup — `flowchart TD` — takes no backticks, and a
   table row takes none either.
5. **Escaping `[` and `]` inside a quoted intra-document link.** A quote
   carrying `[Text](#fragment)` resolves against the **ledger**, not the source,
   so `MD051/link-fragments` fires unless the brackets are escaped [measured
   2026-08-17 on `writeme-006`: unescaped → 1 MD051 error; escaped → 0]. A
   **path** link — `[../README.md](../README.md)` — needs no escape and takes
   none.

⚠️ **Number 3 has bitten this very paragraph.** An earlier revision wrote bullet
3 with a code span containing asterisks nested inside a bold span, and prettier
elided the spaces around every later code span in it and escaped the closing
marker — the published rule was itself unreadable for two revisions. Which is
the general hazard: **a code span containing `_` or `*`, nested inside an
emphasis span, breaks prettier's pairing for the remainder of the cell**
[measured 2026-08-17 by isolation: two table rows differing only in that code
span, one byte-identical after `prettier --write`, the other rewritten].

**Where that hazard lands in an evidence cell, wrap the quotation in `<em>`
instead of `_…_`.** The cell content then round-trips byte-identically and `em`
is already on `MD033`'s allowed list, so no config changes [measured 2026-08-17:
fixture round-trip; read: `.markdownlint-cli2.jsonc` `MD033.allowed_elements`].
This is a **rendering** choice, not a sixth transport modification — the quoted
characters are unchanged, which is the whole point.

⚠️ **The paragraph above is the mechanism, and the mechanism is NOT the
trigger.** Read as a content predicate it over-fires badly on rows needing no
<em>…</em> at all, and no published regex for it has ever reproduced: two
readings taken the same day on the same file returned **6** hits and **14**.
**Publish no count here.** § Publish the number by publishing the command
forbids stating one without a settled method, and an earlier revision of this
paragraph shipped a bare number anyway — then had its own spaces eaten by
prettier, in the paragraph teaching that hazard, for the third recorded time.

<em>The predicate cannot even be evaluated on the row that motivated it.</em>
`parsons-031` already carries <em>…</em>, so a predicate scoped to underscore
cells is silent on it **because the fix is applied**, not because the predicate
is blind. An earlier revision published that silence as evidence; the reasoning
was circular. **Ask prettier; do not predict.**

```bash
# Does this cell need <em>? Isolate it -- a whole-ledger diff also shows
# prettier's column re-padding (modification 2), which is not this hazard.
CELL='<the finished evidence cell, pasted as a single-quoted argument>'
F=/tmp/em-probe.md
printf '| a | b |\n| - | - |\n| x | %s |\n' "$CELL" > "$F"; cp "$F" "$F.orig"
npx prettier --write "$F" >/dev/null
diff "$F.orig" "$F" || echo 'prettier rewrote it -> wrap the quotation in <em>'
```

**Isolation is the load-bearing word.** The original finding was taken exactly
this way — "by isolation: two table rows differing only in that code span". A
procedure keyed on a ledger-wide `git diff` would say **every** cell needs
`<em>`, because prettier re-pads the whole table whenever any cell's width
changes. The check's parser already accepts `<em>"…"</em>`, so switching a cell
costs no change to any instrument.

So "re-run and diff" means **diff normalised**, and the normalisation is the
`norm()` and `unwrap_markup()` in [§ The transport check](#the-transport-check)
— **one statement of it, in runnable form, and this sentence deliberately does
not restate the clauses.** Comparing raw bytes makes a formatter normalisation
indistinguishable from a mis-transcription, which is the one thing this check
exists to tell apart.

⚠️ **This sentence used to enumerate three unescapes while the code did five**,
which is the defect it now avoids by pointing rather than listing: the prose a
reader hits first disagreed with the command that governs, and an ordinary
reader would have taken the prose. That is the same failure one level down from
the one that made this check necessary — a ledger publishing a number whose
method lived somewhere else. **A rule with two statements has no statement.**

⚠️ **Normalising is not the same as being blind, and the difference is a close
condition.** A normalisation that also ignored backticks would hide modification
4; one that ignored whitespace near a code span would hide the number-3 hazard.
Both were tried on `writeme` and both produced a smaller, friendlier divergence
count over a ledger whose own prose described the defects they hid. **The check
below is the published one; widening it to make a ledger pass is the failure it
exists to prevent.**

**`UNSETTLED` is how a partial provenance set stays visibly partial.** No lister
reads both sides of R-2's union — listers 1–3 compare document sets, 4 and 5
read one Gen-1 file — so Pass 1 can witness only the tags its own instrument
saw. The marker is a positive token rather than a blank or a dash, because the
difference between an empty cell and an answered one is this ledger's whole
subject. One per row: a row with none has claimed a settled set. It is a close
condition.

| seed class                          | may witness at Pass 1                     | never                       |
| ----------------------------------- | ----------------------------------------- | --------------------------- |
| lister 1/3 heading or glossary term | `G2-doc`; `G3` on an **exact name match** | `G1-*`, `G2-code`           |
| lister 4 orphan cluster             | `G1-dead`                                 | any `G2-*`, `G3`, `G1-live` |
| lister 5 channel B                  | `G1-dead`                                 | any `G2-*`, `G3`, `G1-live` |

**`G3` is witnessed only on an exact heading-name match, level-insensitive** —
`### Data flow` against `## Data flow` counts, `## Public API` against
`## The lens object` does not. **A rename is a reading**, so a candidate
successor is recorded in `evidence` and left for Pass 2 rather than tagged.
Without this, "a port exists" would license `G3` on every heading row and eight
ledgers would each pick their own threshold, making SPEC § Roll-up's columns
incomparable.

**`absent from the port` is a statement about the heading set and nothing
else.** It means no port heading carries this name. It says **nothing** about
whether the behaviour survived — that is Pass 2's to settle. The distinction is
not pedantic: FIDELITY-METHOD § Worked rows' `parsons-018` is the case where the
documentation was lost and the behaviour **grew** (`lib/extract-hints.ts` 59 →
69 lines), so a row can be honestly `absent from the port` and still be
`restore-as-doc`. Prefer the unambiguous phrase
**`heading absent from the port`** in new ledgers.

**Three annotation classes are permitted in an `evidence` cell, and no others**
— they are the seeder's, not the source's, so they are fenced rather than free:
`candidate successor: <heading>` · `candidate rename: <heading>` · an
**instrument caveat** (what the lister structurally could not see). Anything
that pre-argues a disposition — "mandatory under R-5", "this is a policy
question, not a loss finding" — is Pass 2's judgment written into a Pass-1 cell,
and the gate cannot catch it.

**Seeding order**, so eight sessions produce the same id for the same seed:
reference README headings in file order → DOCS headings in file order → glossary
terms → lister-4 clusters → lister-5 channel B. **Skip the H1 title** (it names
the document, not an affordance) and skip `## Glossary` itself where its terms
are seeded separately. Named decisions open no extra rows — they are headings,
already seeded; lister 2's contribution is the count comparison in the census.

**A row is opened by a _place_, not a _token_.** Headings, glossary entries, CSS
rule-block clusters and channel-B guards open rows. Backticked identifiers and
individual class names do not — they are **evidence** on the row whose place
contains them. `blanks` alone carries 337 unique backticked tokens, and
[§ The unit is the affordance](../FIDELITY-METHOD.md#the-unit-is-the-affordance)
already rules a row is not a heading and not a file. Every instrument hit that
opens no row is named in `### Seed census` as a remainder.

`walked` and `found` are written as **their own lines beneath the row they
belong to**, because those cells are prose and the table is already wide. Both
carry the **same eight class labels in the same order**; a class with no member
in this lens is `empty`.

`Design owed` on a `revive` row is an **inline bolded label on its own line
under the row**, never a heading — two `revive` rows in one ledger would
otherwise collide under `MD024 siblings_only`.

⚠️ **And nothing would stop you committing it.** The pre-commit hook runs
`prettier --write` and no linter at all [read: `.husky/pre-commit` → `npx
lint-staged`; `package.json` `lint-staged` `*.md` → `prettier --write`], so an
`MD024` collision lands committed and surfaces later at `npm run lint:md`, in
someone else's repo-wide run. Run the markdownlint gate yourself, path-scoped,
before every commit. (FIDELITY-METHOD § The one addition — `revive` states the
rule with the same false mechanism; it is owed a correction there.)

| #            | affordance | provenance | evidence | disposition | discharged by | gate |
| ------------ | ---------- | ---------- | -------- | ----------- | ------------- | ---- |
| `<lens>-001` |            |            |          |             |               |      |

<!-- PASS-1 specimen — this is the shape a seeding session writes. Four cells
     filled, three empty, no walked/found line. Delete when the first real row
     lands:

| `<lens>-001` | An educator can attach guidance to a line with a block comment, and the learner can reveal it as a hint. | `G2-doc` + UNSETTLED | Gen-2 `README.md` § Hint blocks (educator `/* … */` guidance): _"<firstblock output, verbatim>"_ | | | |

     Note what is NOT there: no disposition, no `discharged by`, no `gate`, no
     `walked`, no `found`. The affordance sentence claims nothing its quote does
     not support. `G2-code` is absent because no lister read Gen-2 code, and
     `G1-*` is absent because no lister read Gen-1 — which is exactly what
     UNSETTLED records.

-->

<!-- COMPLETED specimen — the end state, after Pass 2 and Pass 3. A seeding
     session does NOT write this. Delete when the first real row lands:

| `<lens>-001` | The learner can … | `G1-dead` + `G2-doc` | Gen-1 `XxxLens.jsx`: … ; Gen-2 `README.md` § …: _"…"_ | **`revive`** | README § … · test _"…"_ | `P0` → `P1:<increment>` |
|              | **`walked`** — against § Reference inventory. **drops:** … **future:** … **out of scope:** … **naming:** `empty`. **named decision:** … **contract:** … **glossary:** … **type contract:** `types.ts` read in full. | | | | | |
|              | **`found`** — **drops:** _"…"_ **out of scope:** _"…"_ **future, naming, named decision, contract, glossary, type contract:** nothing bearing on this row. | | | | | |
|              | **`## Design owed`** — what must be decided before it can be built. | | | | | |

-->

---

## Close conditions

**The Pass-1 gate runs before the seeding commit**, and it is the inverse of the
close conditions rather than a weaker version of them — `open == rows`, and
every judgment cell still empty. Run it on the ledger, not from memory:

⚠️ **Slice the row table first. A whole-file grep matches this document's own
prose about the check** — every ledger cut from this template explains
`UNSETTLED` and names the banner in running text, so a bare
`grep -c 'UNSETTLED'` counts those too. Measured on the first ledger seeded:
**51 against 47 rows**, and the banner counted **2** [measured 2026-08-15: `git
show c0bd56a6:…/parsons.md | grep -c 'UNSETTLED'`]. That is the same defect
[SPEC.md § The register check](../SPEC.md#the-register-check) already records
twice — _a check embedded in the document it checks must not match on text it
itself contains_ — and the first version published here had it. **The 51st hit
is the sentence reporting the number**, which is why an earlier revision of this
paragraph said 50: it was measured before it was written.

**Run every command from the repository root.** `L=` and `REF=` are
repo-relative; `GEN1=` is absolute.

```bash
L=.planning-handoffs/lens-migration/ledgers/<ledger-file>.md
LENS=<row-id-prefix>   # NOT the file stem -- for `_family-f.md` this is `fam-f`
CENSUS=<the ### Seed census total>
slice() { awk '/^## Rows/{on=1;next} /^## Close conditions/{on=0} on' "$1"; }
rows()  { slice "$1" | grep "^| \`$LENS-[0-9]\{3\}\`"; }
n=$(rows "$L" | wc -l | tr -d ' '); echo "rows: $n"
[ "$n" -gt 0 ] || echo "FAIL: zero rows matched -- LENS must be the id prefix, not the file stem"
[ "$n" = "$CENSUS" ] || echo "FAIL: row count does not match the seed census total"
[ "$(rows "$L" | grep -c 'UNSETTLED')" = "$n" ] || echo "FAIL: a row claims a settled provenance set"
[ "$(rows "$L" | grep -cE '\|[[:space:]]*—[[:space:]]*\|')" = 0 ] || echo "FAIL: em dash used as a value"
[ "$(rows "$L" | grep -cE '`(restore|supersede|drop|revive|already survives|drop-as-loss|restore-as-doc)( [^`]*)?`')" = 0 ] || echo "FAIL: a row is closed"
[ "$(slice "$L" | grep -cE '^\|.*(\*\*`(walked|found)`\*\*|Design owed)')" = 0 ] || echo "FAIL: walk columns written at Pass 1"
[ "$(grep -c '^> \*\*PASS 1 — SEEDED' "$L")" = 1 ] || echo "FAIL: banner missing or duplicated"
rows "$L" | grep -oE "^\| \`$LENS-([0-9]{3})\`" | grep -oE '[0-9]{3}' \
  | awk 'NR!=$1+0{print "FAIL: id gap or duplicate at position "NR": "$0; exit}'
```

Five of those lines exist because the first published version of this gate was
**half dead**, and only one of its six checks had been mutation-tested. Each fix
is a measurement, not a precaution [all measured 2026-08-15 against
`ledgers/parsons.md` plus a planted mutation]:

| line                      | why it is written that way                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LENS=<row-id-prefix>`    | the file stem and the id prefix differ for `_family-f.md`. With `LENS=_family-f` the old gate printed `rows: 0` and **not one FAIL** over a real 47-row ledger.                                                                                                                                                                                                                                                                                                                                           |
| `[ "$n" -gt 0 ]`          | without it, a wrong `LENS` makes every remaining check trivially true.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `[ "$n" = "$CENSUS" ]`    | restores the "must match the census" assertion, which was silently dropped when this gate was corrected.                                                                                                                                                                                                                                                                                                                                                                                                  |
| em dash, padded           | prettier runs on every staged `.md` and **pads table cells to column width**, so the literal `\| — \|` never survives to the commit. Planted em dashes: **1 hit before prettier, 0 after**; the padded form finds **4**. The check died at exactly the moment the file became committable.                                                                                                                                                                                                                |
| `( [^`]\*)?` on the value | `restore — DEFERRED (<owner>, <ruling>)` is a real disposition, and both the bare pattern **and** a `( — DEFERRED)?` suffix miss it, because the parenthetical sits inside the backticks. The trailing-space anchor is what stops `` `dropMessage` `` — a CSS class in a lister-4 evidence cell — tripping the `drop` alternative: an unanchored `[^`]\*` scores **1 false positive on the clean exemplar**. Planted one at a time, all eight vocabulary values are caught and the clean ledger scores 0. |
| walk check on `slice`     | `walked`/`found` are written as **continuation lines whose first cell is empty** (see the COMPLETED specimen above), so `rows()` never sees them. Planted continuation line: `rows()`-scoped **0**, `slice`-scoped **1**.                                                                                                                                                                                                                                                                                 |
| `exit` on the awk         | one missing row otherwise prints a FAIL for every later row — 44 lines for one defect.                                                                                                                                                                                                                                                                                                                                                                                                                    |

Note a deliberate consequence of the `slice`-scoped walk check: it also fires if
the template's specimens are left undeleted. That is intended — delete them.

The banner check is anchored to `^> **PASS 1 — SEEDED` — the blockquote form —
precisely so the close-conditions bullet below, which names the same string in
prose, does not satisfy it.

**Mutation-test every check before trusting the gate, not one of them.** A gate
that prints nothing is indistinguishable from a gate that matched nothing, and
publishing this one after testing a single check is how five of its six lines
shipped dead. Plant one mutation per check in a scratch copy under `/tmp` and
confirm each fires.

Then, per row, every heading token in `evidence` must `resolve` to exactly `1`
against the **source file**, not against the inventory — a mis-transcription
copied into both passes a check that compares them to each other. Use
[§ The minimum walk set](../FIDELITY-METHOD.md#the-minimum-walk-set)'s helper
and **not `grep -E`**: five of the six `does NOT do` headings carry a
parenthetical and one carries a `+`, so the regex form returns 0 on exactly the
class this rule exists for.

### The structural-integrity check — run this one FIRST

**The Pass-1 gate above checks SHAPE, § The transport check below checks
TRANSPORT, and this checks STRUCTURE — whether the lines those two read are
document content at all, or code-block content.** It runs **before** both,
because a ledger that did not render makes every other gate vacuous while
leaving all of them green.

On 2026-08-20 `parsons.md` carried a `bash` fence opened with **four** backticks
and closed with **three**. A three-backtick line does not close a four-backtick
fence, so 418 lines — all 120 rows, the whole of `## Rows` and the whole of
`## Close conditions` — sat inside a code block. **Every published gate reported
clean**, and the table below is not recalled from that incident: it was
reproduced this session against a live mutant, a blank-line-padded four-backtick
fence run through `prettier --write` so that nothing cosmetic gives it away [all
measured 2026-08-20 on a scratch copy under `/private/tmp`].

| gate                | verdict over a ledger whose 120 rows are ALL buried                                      |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `markdownlint-cli2` | `Summary: 0 error(s)` — a giant code block is valid markdown                             |
| `prettier --check`  | `All matched files use Prettier code style!`                                             |
| the Pass-1 gate     | `rows: 120`, and not one of its eight checks emits a FAIL line                           |
| the transport check | `rows=120 parsed=57 nocite=76` — **byte-identical** to the clean ledger's output, exit 0 |
| **this check**      | **exit 1**, `buried-rows=120`                                                            |

**Neither obvious one-line form works, and both were measured before this one
was written.**

- ``grep -cE '^`{4,}'`` **must be 0** is wrong: a four-backtick fence is
  **legal**, and this template carries a paired one so that its `firstblock`
  body can contain a three-backtick line [measured 2026-08-20: 2 hits, both
  halves of one pair]. The rule would fail the document that defines it. ⚠️ Note
  the **doubled** delimiters: a single-backtick code span cannot contain a
  backtick, so the obvious spelling of this very rule does not render. An
  earlier statement of it elsewhere in the campaign is written that way.
- ``grep -cE '^`{3,}'`` **must be even** is unreliable rather than wrong. It
  does fire at `390e8d54` — 17 markers, odd — but only because it miscounts the
  stray ` ``` ` line as a fence marker. **The fence that did the burying was
  itself correctly paired**, opened at 383 and closed at 801, so a form that
  counted only real fence markers would see balance and pass. Parity is a
  property of the markers; what matters is a property of the **content**.

So the check asks the only question that matters: **are the row lines, the two
slice headings and the banner **rendered, or buried**?**

⛔ **The question is "does it render", NOT "is it fenced", and the first
published version of this check got that wrong.** A fence is one burial
mechanism; an **unterminated HTML comment** is another, and it is the one this
very document instructs a seeder to create — § Rows carries two `<!-- … -->`
specimen blocks each marked _"Delete when the first real row lands"_, and
deleting the body while missing the closing `-->` buries everything below it to
EOF. Measured 2026-08-20 by AR-2 and reproduced: the template's own specimen
opener, planted above `## Rows` in `parsons.md` and run through
`prettier --write`, produced **five** green gates — `prettier --check` clean,
`markdownlint-cli2` `0 error(s)`, the Pass-1 gate `rows: 120`, the transport
check `rows=120 parsed=57 nocite=76` exit 0, **and this check itself
`live-rows=120 buried-rows=0 unclosed=0` exit 0**. A balanced comment around the
same span gives the identical five-green result.

**So the check tracks both mechanisms in one pass**, and a third mechanism, if
one is ever found, is an argument for asserting on rendered output rather than
for a fourth arm.

```bash
# structure-check.sh <doc.md> [row-id-prefix]
#
# Run from the repository root, on every campaign document. The row and slice
# arms are LEDGER-ONLY and switch themselves off elsewhere -- a check that must
# not be run on two thirds of its own campaign's files gets run on them anyway,
# and its failures get learned-to-ignore.
#
# For a LEDGER, invoke it with the row-id prefix -- `structure-check.sh <doc>`
# alone is a FAIL, by design. On this template that argument is the literal
# `<lens>`, and the path is REPO-RELATIVE, not campaign-relative:
#   structure-check.sh .planning-handoffs/lens-migration/ledgers/_TEMPLATE.md '<lens>'
# ⚠️ An earlier revision published `ledgers/_TEMPLATE.md`, which from the
# repository root gives `awk: can't open file` and exit 2 -- while the campaign
# resumption point's loudest warning trains a reader to run from the root
# [measured 2026-08-24 by a context-free reader, running the published form].
set -u
LC_ALL=C; export LC_ALL
awk -v lens="${2:-}" '
  # BURIAL is the union of two mechanisms. `buried` is evaluated at the START of
  # each line, so a delimiter line never counts as its own content.
  function scan_comment(   s, i) {
    # Per OCCURRENCE, never per line start: the cspell:ignore headers of every
    # ledger open and close a comment on one line, and a per-line-start form
    # reads the first of them as burying the entire document.
    s = $0
    while (1) {
      if (!incomment) { i = index(s, "<!--"); if (!i) return
                        incomment=1; cline=NR; s = substr(s, i+4) }
      else            { i = index(s, "-->");  if (!i) return
                        incomment=0;          s = substr(s, i+3) }
    }
  }
  function fence_line(   t, ch, k, info) {
    t = $0; sub(/^[ \t]{0,3}/, "", t); ch = substr(t,1,1)
    if (ch != "`" && ch != "~") return 0
    k = 0; while (substr(t, k+1, 1) == ch) k++
    if (k < 3) return 0
    info = substr(t, k+1)
    if (!open) {
      if (ch == "`" && index(info, "`") > 0) return 0   # illegal backtick info string
      open=1; ochar=ch; olen=k; oline=NR; return 1
    }
    # CommonMark: a closer matches the opener char, is at least as long, and
    # carries no info string. All three clauses are load-bearing -- dropping any
    # one of them lets the `390e8d54` stray line close a fence it cannot close.
    if (ch == ochar && k >= olen && info ~ /^[ \t]*$/) { open=0; return 1 }
    return 0
  }
  # A fence delimiter inside a comment is comment text, and `<!--` inside a
  # fence is fence text. Each mechanism suppresses the other; neither nests.
  { buried = (open || incomment)
    if (!incomment) { if (fence_line()) next }
    if (!open) scan_comment() }

  # Ledger-hood is keyed on `## Rows` ALONE, and counted whether the heading is
  # buried or live -- a burial that swallows it must not also switch the check
  # off. The two narrative ledgers carry no `## Rows`; `_boundary.md` does carry
  # `## Close conditions`, so keying on either would make it a ledger and then
  # demand a row prefix it has no rows for.
  /^## Rows[ \t]*$/             { isledger=1; if (buried) bslice++; else lslice++ }
  /^## Close conditions[ \t]*$/ {             if (buried) bslice++; else lslice++ }
  /^> \*\*PASS 1 — SEEDED/      { if (buried) bbanner++ }
  lens != "" && $0 ~ ("^\\| `" lens "-[0-9][0-9][0-9]`") {
    if (buried) { brow++; if (!frow) frow = NR } else lrow++ }

  # The skeleton announces itself IN ITS OWN TEXT -- its specimen rows literally
  # read `<lens>-001`. Keyed here, on the document, and never on the argument.
  # `^\|` is load-bearing: a specimen quoted INSIDE a cell is escaped and does
  # not match, so no other campaign document sets this [measured 2026-08-21:
  # exactly one file matches, `_TEMPLATE.md`, 3 lines].
  /^\| `<[a-z]+>-[0-9][0-9][0-9]`/    { istemplate=1 }
  # ...and a real ledger announces ITSELF, by carrying a real-slug row. Required
  # ABSENT below, because `istemplate` alone is set by a LEFTOVER specimen row
  # too -- and an undeleted specimen plus the published placeholder invocation
  # co-occur naturally at the seeding commit, the one moment § When this check
  # runs names. Measured 2026-08-21: `_TEMPLATE.md` 0 real-slug rows,
  # `parsons.md` 120, a ledger with a leftover specimen 120.
  /^\| `[a-z][a-z0-9-]*-[0-9][0-9][0-9]`/ { hasreal=1 }

  END {
    bad = 0
    # Arm 1 -- an unterminated container. EVERY document, ledger or not.
    if (open) {
      printf "FAIL STRUCT-FENCE-UNCLOSED: %d-%s fence opened at line %d is never closed\n",
             olen, (ochar=="`" ? "backtick" : "tilde"), oline; bad=1 }
    if (incomment) {
      printf "FAIL STRUCT-COMMENT-UNCLOSED: HTML comment opened at line %d is never closed\n",
             cline; bad=1 }

    if (!isledger) {
      printf "STRUCT-CENSUS doc=not-a-ledger unclosed-fence=%d unclosed-comment=%d -- row and slice arms N/A\n",
             (open?1:0), (incomment?1:0)
      exit bad }

    # THIS TEMPLATE is a ledger by shape and NOT one by status. Its specimen
    # rows are SUPPOSED to sit inside the two `<!-- … -->` blocks § Rows tells a
    # seeder to delete -- so buried rows are expected here and a defect anywhere
    # else. Reported, never silently exempted.
    #
    # ⛔ BOTH conditions, and the document one is the load-bearing half. An
    # earlier form branched on `lens ~ /[<>]/` alone -- the CALLER-supplied
    # prefix -- so `structure-check.sh parsons.md <lens>` printed a clean census
    # over a real 120-row ledger, buried rows and all [measured 2026-08-20 by
    # AR-2, reproduced]. That is verbatim the `LENS=_family-f` defect Arm 5
    # below claims to have forestalled, re-inherited on a new branch -- and made
    # SHORTER to reach, because § The structural-integrity check publishes
    # `_TEMPLATE.md <lens>` as the canonical invocation and swapping the
    # filename is exactly how a published invocation gets reused.
    if (istemplate && !hasreal && lens ~ /^<[a-z]+>$/) {
      if (lslice != 2) { printf "FAIL STRUCT-SLICE-BROKEN: %d live slice headings, expected 2\n", lslice+0; bad=1 }
      # The template branch carries its own floor: a skeleton has specimen rows,
      # and zero of them means the prefix did not match what the document uses.
      if (lrow + brow == 0) { printf "FAIL STRUCT-NO-SPECIMENS: no `%s-NNN` rows -- this is not the skeleton\n", lens; bad=1 }
      printf "STRUCT-CENSUS doc=template specimen-rows-live=%d specimen-rows-commented=%d unclosed-fence=%d unclosed-comment=%d\n",
             lrow+0, brow+0, (open?1:0), (incomment?1:0)
      exit bad }

    # Arm 1b -- a real ledger carrying SPECIMEN rows. § Rows tells a seeder to
    # delete both specimen blocks; nothing was checking that they had been. The
    # Pass-1 gate cannot: its walk check keys on `**`walked`**` / `**`found`** /
    # `Design owed`, which a specimen row does not carry, and its id-sequence
    # and census checks only see `<lens-slug>-NNN` rows [measured 2026-08-21 by
    # AR-2]. An undeleted specimen also flips `istemplate` on a real ledger,
    # which is how it reached the template branch at all.
    if (istemplate && hasreal) {
      printf "FAIL STRUCT-SPECIMEN-LEFT: a real ledger still carries `<lens>-NNN` specimen rows -- § Rows says delete them\n"; bad=1 }

    # Arms 2-4 -- containment. A LEDGER only. "Buried" means fenced OR
    # commented; the arms deliberately do not distinguish, because the reader
    # cannot either.
    if (bslice)  { printf "FAIL STRUCT-BURIED-SLICE-HEADING: %d of `## Rows` / `## Close conditions` are buried\n", bslice; bad=1 }
    if (bbanner) { printf "FAIL STRUCT-BURIED-BANNER: the PASS 1 banner is buried\n"; bad=1 }
    if (brow)    { printf "FAIL STRUCT-BURIED-ROWS: %d `%s-NNN` row lines are buried, first at line %d\n", brow, lens, frow; bad=1 }
    if (lslice != 2) { printf "FAIL STRUCT-SLICE-BROKEN: %d live `## Rows`/`## Close conditions` headings, expected 2\n", lslice+0; bad=1 }

    # Arm 5 -- THE FLOOR, a refusal rather than a report. Without it a wrong
    # prefix makes every row arm trivially true, which is exactly how the Pass-1
    # gate once printed `rows: 0` and not one FAIL over a real 47-row ledger.
    if (lens == "") { printf "FAIL STRUCT-NO-PREFIX: this document is a ledger; pass its row-id prefix\n"; bad=1 }
    else if (lrow == 0) { printf "FAIL STRUCT-ZERO-ROWS: no live `%s-NNN` rows -- wrong prefix, or every row is buried\n", lens; bad=1 }

    printf "STRUCT-CENSUS lens=%s live-rows=%d buried-rows=%d buried-slice=%d buried-banner=%d unclosed-fence=%d unclosed-comment=%d\n",
           lens, lrow+0, brow+0, bslice+0, bbanner+0, (open?1:0), (incomment?1:0)
    exit bad
  }' "$1"
```

⚠️ **A consequence to expect rather than debug: on THIS template `live-rows`
falls from 3 to 1.** Two of its three specimen rows sit inside the `<!-- … -->`
blocks § Rows tells a seeder to delete, so the earlier form was counting
commented-out rows as live — which is the same blindness one level down.

**Mutation-tested one plant at a time, not one representative** — publishing the
Pass-1 gate on a single tested check is how five of its six lines shipped dead
[all measured 2026-08-20 against scratch copies of `parsons.md` and this
template]:

| mutation                                                                                                                                    | expected                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a five-backtick fence appended, never closed                                                                                                | `STRUCT-FENCE-UNCLOSED`, naming the opening line                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| the honest burying fence above, `prettier --write`-normalised                                                                               | `STRUCT-BURIED-ROWS: 120`, plus buried-slice and both floor arms                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| a fence opened at the top, shifting every later pairing by one                                                                              | `STRUCT-BURIED-BANNER` — the banner lands inside, the rows do not                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `## Close conditions` deleted                                                                                                               | `STRUCT-SLICE-BROKEN: 1 live … expected 2`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| a real ledger, prefix argument omitted                                                                                                      | `STRUCT-NO-PREFIX`. Under an earlier form this printed a clean census                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| a real ledger, prefix `parsnip` instead of `parsons`                                                                                        | `STRUCT-ZERO-ROWS`. This is the Pass-1 gate's `LENS=_family-f` defect, forestalled                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **this template**, invoked from the repository root as `structure-check.sh .planning-handoffs/lens-migration/ledgers/_TEMPLATE.md '<lens>'` | **exit 0**, `doc=template specimen-rows-live=1 specimen-rows-commented=2`. A ``'^`{4,}'`` must-be-0 rule would have failed it. ⚠️ **The invocation is part of the expectation**: the prefix argument is not optional for a document carrying `## Rows`, and `structure-check.sh _TEMPLATE.md` alone is a deliberate `STRUCT-NO-PREFIX` FAIL. An earlier revision of this row published the verdict without the argv that produces it, and `6c3e6d16`'s body then asserted the bare form exits 0 — false as invoked, immutable, and corrected here |
| the two narrative ledgers, `_boundary.md` and `_playbook.md`                                                                                | `doc=not-a-ledger`, exit 0. An earlier form failed both, and 4 other campaign docs                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `390e8d54:…/parsons.md`, the real historical break                                                                                          | exit 1, `buried-rows=120 buried-slice=2` — while all four gates above stay green                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

**When it runs.** On **every** campaign document, at **every** commit that
touches one — not only at the seeding commit, and not only on ledgers. This
trigger is stated here rather than left to be inferred, because
[§ When this check runs](#when-this-check-runs--it-had-no-trigger-for-seven-of-the-eight-ledgers)
records what an untriggered check is worth: the transport check existed, was
mutation-tested, and had a stated trigger for exactly one of the eight ledgers.

### The transport check

**The Pass-1 gate above checks SHAPE. This checks TRANSPORT**, which is the only
thing Pass 1 can get wrong — § What Pass 1 writes says _"Pass 1 transports; it
does not author"_, and until this existed, nothing mechanical held a ledger to
it. It re-runs the published extractors for every citation a ledger makes and
diffs the stored quotation against the output.

**Publish the number by publishing the command.** A ledger that states a
divergence count without the command that produced it launders an unstated
method into a citable fact — which is exactly what happened on `writeme` and is
why this section exists.

```bash
# transport-check.sh <ledger.md> <ref-root|NONE> <port-root|NONE> [member|all]
#
# Prints one line per finding, then a `CENSUS ...` line, then FAILs and exits 1
# if the row pattern matched nothing. NO OUTPUT AT ALL means the check itself
# died -- that is the only silence, and it is never clean.
#
# The FAIL is the `[ "$n" -gt 0 ]` floor § Close conditions' Pass-1 gate already
# carries (cited by section, never by line count -- "47 lines above" was 67 by
# the next day). This check shipped without it; an earlier revision then shipped a
# CENSUS line and called THAT the floor, which it is not -- `rows=0` printed a
# tidy line and exited 0 [measured 2026-08-18, AR-2]. A census reports; a floor
# refuses. § The register check's class -- a check that reports success, or
# absence, over nothing -- is now recorded a fifth time, twice by the check
# written to enforce it.
set -u
LC_ALL=C; export LC_ALL          # both extractors abort on UTF-8; see above
L="$1"; REF="$2"; PORT="${3:-NONE}"; MEMBER="${4:-all}"; export REF PORT MEMBER
REC=$(mktemp); OUT=$(mktemp); trap 'rm -f "$REC" "$OUT"' EXIT
# firstblock() and glossterm() -- paste verbatim from § What Pass 1 writes.

# norm() is a NAMED APPROXIMATION of the sanctioned transport modifications --
# close enough to run, and NOT an equality. Its edges, named so a future reader
# amends this template rather than patching a run:
#   under-covers  a lone `\*` is not unescaped, though prettier escapes
#                 single-asterisk emphasis at a truncation point under
#                 modification 3. FALSE POSITIVE. **No count is published
#                 here**: three instruments have returned three different
#                 counts of single-asterisk emphasis across the eight Gen-2 doc
#                 pairs, and § Publish the number by publishing the command
#                 forbids stating one without a settled method. Widening norm()
#                 to close it is an amendment, measured, in its own commit.
#   wider than 2  s/\s+/ /g collapses ALL whitespace, not only prettier's
#                 table-cell padding. It cannot INSERT a separator, so it does
#                 not hide the code-span hazard's space elision.
# The bracket clause is FRAGMENT-TARGETED, not unconditional: modification 5
# sanctions an escape on an intra-document `](#fragment)` link and explicitly
# says a PATH link takes none, so unescaping both normalised an unsanctioned
# escape into agreement -- a false negative [measured 2026-08-18: escaping
# writeme-011's Gen-3 path link -> DIVERGENT under this form, SILENT under the
# unconditional one; writeme-006's fragment link stays clean under both].
norm() { perl -pe 's/\\\*\\\*/**/g; s/\\_/_/g; s/\\\|/|/g;
                   s/\\\[(.*?)\\\]\((#[^)]*)\)/[$1]($2)/g;
                   s/\s+/ /g; s/^ +//; s/ +$//'; }
# Modification 4, applied to the STORED side only and only where the extractor's
# own output is markup, so it cannot launder backticks onto a prose quote.
unwrap_markup() { case "$1" in '<'*) printf '%s' "$2" | perl -pe 's/^`(.*)`$/$1/';;
                               *) printf '%s' "$2";; esac; }

perl -ne '
  BEGIN { $M = $ENV{MEMBER};
          $noref = ($ENV{REF} eq "NONE" && $ENV{PORT} eq "NONE");
          # ⛔ EVERY column index initialised. An uninitialised one makes
          # `$X >= 0` TRUE on undef, so its guard can never be false and
          # `$c[undef]` silently reads cell 0 -- the empty string left of the
          # leading pipe. `$PCOL` shipped that way and was blind on any
          # Gen-1-only ledger, the shape `dropdowns`, `variables` and six of
          # Family F will have [measured 2026-08-24 by AR-1: renaming the
          # `provenance` header produced byte-identical output on an all-G1
          # fixture]. It agreed on `parsons` by luck of its 44 Gen-2/3 rows.
          $QCOL = -1; $RCOL = -1; $ECOL = -1; $PCOL = -1; $NCELL = 0; $LEGACY = 0; }

  # SCHEMA. The column layout is READ OFF THE LEDGER’S OWN HEADER ROW and never
  # hardcoded as an index -- so a not-yet-migrated ledger carrying `evidence`
  # resolves to the legacy layout and this check behaves byte-identically to the
  # one-cell form on it. That is what lets the check land before the data.
  $ISLEDGER = 1 if /^## Rows[ \t]*$/;
  if (!$SEEN && /^\|\s*#\s*\|/) {
    $SEEN = 1;
    my @h = split /(?<!\\)\|/, $_, -1; $NCELL = scalar @h;
    for my $i (0..$#h) { my $t = $h[$i]; $t =~ s/^\s+|\s+$//g;
      $QCOL = $i if $t eq "quoted"; $RCOL = $i if $t eq "reasoned"; $ECOL = $i if $t eq "evidence";
      $PCOL = $i if $t eq "provenance"; }
    # SCHEMA RESOLUTION IS TOTAL, never a fallback chain. Four states, three
    # legal. An earlier form tested only `$QCOL < 0 && $ECOL >= 0` and so
    # resolved `evidence` + `reasoned` -- the insert done, the rename not -- to
    # LEGACY, which skips the whole `reasoned` arm below. A full citation AND a
    # transported quotation planted in `reasoned` then produced 0 findings and
    # exit 0, with a census byte-identical to the clean ledger [measured
    # 2026-08-20, AR-2]. That is a check reporting success over nothing, inside
    # the increment written to stop it. `evidence` is the name in every
    # committed ledger and in FIDELITY-METHOD § Columns, so the half-done state
    # this missed is the LIKELIER half.
    if    ($QCOL >= 0 && $RCOL >= 0) { }                                     # two-cell
    elsif ($ECOL >= 0 && $QCOL < 0 && $RCOL < 0) { $QCOL = $ECOL; $LEGACY = 1 }  # legacy
    elsif ($ECOL >= 0 && $RCOL >= 0) { $SCHEMA = "half-migrated -- `reasoned` present beside `evidence`" }
    elsif ($QCOL >= 0 && $RCOL <  0) { $SCHEMA = "half-migrated -- `quoted` present, `reasoned` absent" }
    else                             { $SCHEMA = "unresolved -- no header row carrying `quoted` or `evidence`" }
    # `provenance` is resolved by the SAME total resolver, so a missing one is a
    # NAMED refusal rather than an inferred NOCITE-MISMATCH blaming the grammar.
    $SCHEMA = "unresolved -- no `provenance` column" if $PCOL < 0 && !$SCHEMA;
    next;
  }
  next unless /^\| `([a-z0-9-]+-\d{3})`/; my $id = $1;
  next if $M ne "all" && !/^\| `[a-z0-9-]+-\d{3}` *\| *`\Q$M\E` /;
  $rows++;

  # CELL SCOPING, on the UNESCAPED pipe -- the delimiter GFM itself uses, and
  # the correct inverse of transport modification 1 (`|` -> `\|`). This is NOT
  # the naive field split the one-cell form rightly avoided: a raw /\|/ split
  # truncates the SIX rows across the two committed ledgers that carry a literal
  # escaped pipe inside a cell [measured 2026-08-20: parsons-003, -022, -081,
  # -091, -104 and writeme-018; THREE of them -- parsons-003, parsons-022 and
  # writeme-018 -- are Gen-2/3 rows the check parses today, so the naive form
  # loses live citations, not just cells [re-measured 2026-08-20 by AR-2: the
  # published figure of two was wrong].
  my @c = split /(?<!\\)\|/, $_, -1;
  print join("\t",$id,"-","-","!RAGGED", scalar(@c)." cells against header ".$NCELL),"\n"
      if $NCELL && @c != $NCELL;
  my $q = ($QCOL >= 0 && $QCOL <= $#c) ? $c[$QCOL] : "";
  my $r = ($RCOL >= 0 && $RCOL <= $#c) ? $c[$RCOL] : "";

  # THE PARSE ARM, scoped to `quoted`. Adjacency is now STRUCTURAL rather than
  # incidental: citation and quotation must share a cell, so a `|` between them
  # cannot parse. The one-cell form got that property only from `\s*` happening
  # not to match a pipe.
  my $n = 0;
  while ($q =~ /Gen-([23])\s*`([A-Za-z.]+\.md)`\s*§\s*(.*?):\s*(?:_"(.*?)"_|<em>"(.*?)"<\/em>)/g) {
    my $quote = defined $4 ? $4 : $5;
    print join("\t", $id, "G$1", $2, $3, $quote), "\n"; $n++;
  }
  $parsed += $n;

  # THE THREE COUNTERS, all scoped to `quoted` TOGETHER. Scoping the parse arm
  # while leaving these line-scoped would let citation-shaped prose in `reasoned`
  # inflate `cited` and manufacture UNQUOTED findings on clean rows.
  my $cited = () = $q =~ /Gen-[23]\s*`[A-Za-z.]+\.md`\s*§/g;
  my $lead  = () = $q =~ /Gen-[23]\s*`?[A-Za-z0-9._\/-]+\.md`?/g;
  print join("\t",$id,"-","-","!MALFORMED","$cited of $lead leads parse"),"\n" if $lead > $cited;
  print join("\t",$id,"-","-","!UNQUOTED", "$n of $cited cited"),"\n"          if $cited > $n;

  # THE `reasoned` ARM. Transported extractor output in the derivation cell is a
  # BREACH, not a finding -- because without it the wrong split silently drains
  # the check and exits 0, which is the failure the ruling was taken to prevent.
  # ⛔ THE REFUSAL REUSES THE ACCEPTANCE GRAMMAR, and must. An earlier form
  # refused `Gen-[123]` at ANY extension plus a bare `_"` anywhere -- both
  # strictly WIDER than what `quoted` accepts, so they refused forms that have
  # no legal home in either cell. Measured 2026-08-20 by AR-2: a `reasoned`
  # clause citing a RULING (`_"Pass 1 transports; it does not author"_`) -- the
  # house idiom of this campaign, 80 occurrences across its documents --
  # breached the whole ledger, and so did ordinary derivation prose naming a
  # Gen-1 file. A false BREACH blocks a correct migration and gets worked
  # around, which is worse than a missed one.
  #
  # ⚠️ AND `$mc` IS PROVISIONAL, ruled so on 2026-08-24. Refusing a bare
  # citation in `reasoned` answers a question amendment 6 owns -- MAY A SEEDER
  # DERIVATION CITE ITS SOURCE? -- and the answer here is currently no. Today
  # the ledgers escape by convention accident only: 27 rows carry an annotation
  # and ZERO write a citation in the canonical idiom, because they say
  # "candidate successor: port README" rather than "Gen-3 `README.md`". The same
  # fact written canonically breaches the ledger, and § What Pass 1 writes
  # explicitly permits that annotation class. Narrowing `$mc` to citation-PLUS-
  # quotation and demoting a bare citation to a finding is the change the rule
  # above points at. This note is here, and not only in the resumption point,
  # because THIS file is what gets copied into eight ledgers and that file
  # retires with the campaign.
  unless ($LEGACY) {
    my $mc = () = $r =~ /Gen-[23]\s*`[A-Za-z.]+\.md`\s*§/g;
    my $mq = () = $r =~ /Gen-[23]\s*`[A-Za-z.]+\.md`\s*§\s*.*?:\s*(?:_"|<em>")/g;
    print join("\t",$id,"-","-","!MISPLACED-CITATION","$mc in reasoned"),"\n" if $mc;
    print join("\t",$id,"-","-","!MISPLACED-QUOTATION","$mq in reasoned"),"\n" if $mq;
  }

  # THE SELF-CHECK ON `nocite`, so that no derivation of it has to live in
  # prose. A row carrying no `G2`/`G3` provenance tag is a row this grammar
  # cannot reach by construction, so `nocite` and `provless` must agree. Three
  # successive revisions of § The transport check published a DERIVATION of the
  # NO-CITATION set instead: the first went stale by 73 rows, the second was
  # wrong in the same shape, and the third asserted that the check enforced it
  # when the check had no counter reading `provenance` at all [measured
  # 2026-08-20 by AR-2 -- a negative grep over the assembled check]. That third
  # form is the worst of the three, because being told a self-check exists is
  # what stops anyone re-deriving it. This is that self-check.
  # ⚠️ `G2-` OR `G3`, never `G[23]-`. The provenance vocabulary is `G1-live`,
  # `G1-dead`, `G2-code`, `G2-doc` and a BARE `G3` -- the Gen-3 tag carries no
  # hyphen, so a hyphen-anchored class silently misses it. No row is `G3`-only
  # in either committed ledger today [measured 2026-08-20: 0 of 120 and 0 of 45],
  # so `G[23]-` agreed with `nocite` by luck of the current data rather than by
  # being right -- and FIDELITY-METHOD § Columns rules that a row carrying only
  # `G3` is an ADDITION, so the first one written would have raised a false
  # BREACH against a correct ledger.
  $provless++ if $PCOL >= 0 && $PCOL <= $#c && $c[$PCOL] !~ /G2-|G3/;
  # `unreachable` is the side compared against `provless`, and it is NOT
  # `nocite`. A row carrying a Gen-2/3 pointer the grammar cannot read is
  # UNREACHABLE-BY-DEFECT and lands in `nocite`; a row carrying no pointer at
  # all is unreachable BY CONSTRUCTION. Comparing `nocite` to `provless`
  # collapsed those two -- which is the same two-reasons distinction the struck
  # NO-CITATION derivation failed on, re-made one revision later -- and turned a
  # published MALFORMED-CITATION finding into a whole-ledger BREACH claiming the
  # two-cell contract was violated when a quotation was merely mis-transcribed
  # [measured 2026-08-21 by AR-2]. `lead == 0` is the by-construction side.
  $unreachable++ if $lead == 0;
  if ($n == 0) { $nocite++;
    print join("\t",$id,"-","-","!NO-CITATION","-"),"\n" unless $noref; }
  END { # Ledger-hood is INCREMENT 1 PREDICATE, reused rather than re-invented.
        # `_boundary.md` and `_playbook.md` are the two narrative ledgers and
        # carry no `## Rows`; an earlier form refused `_boundary.md` with
        # `BREACH SCHEMA unresolved` (exit 1) where the pre-rewrite check
        # exited 0, so the two gates published one commit apart gave opposite
        # answers to "is this a ledger" [measured 2026-08-20, AR-2].
        # ⚠️ One heading must not be a kill switch for the whole gate stack.
        # `## Rows` is what `slice()`, the Pass-1 gate and both of these gates
        # key on, so renaming it made a ledger report `doc=not-a-ledger` at exit
        # 0 in BOTH gates -- and suppressed a real schema breach that had
        # refused a moment earlier [measured 2026-08-20 by AR-2]. A document
        # carrying a ledger-shaped header row while missing `## Rows` is
        # therefore a refusal, not an exemption. Verified safe on the two
        # narrative ledgers: `_boundary.md`s two `| # |` headers name neither
        # column, and `_playbook.md` has no header row at all.
        if (!$ISLEDGER) {
          if ($QCOL >= 0 || $ECOL >= 0) {
            print join("\t","-","-","-","!SCHEMA",
              "ledger-shaped header row but no `## Rows` heading -- slice(), the Pass-1 gate and both gates key on it"),"\n" }
          else { print join("\t","-","-","-","!NOT-A-LEDGER","-"),"\n" } }
        elsif ($SCHEMA) { print join("\t","-","-","-","!SCHEMA",$SCHEMA),"\n" }
        print join("\t","-","-","-","!NOCITE-MISMATCH",
                   "unreachable=".($unreachable+0)." provless=".($provless+0)),"\n"
            if $ISLEDGER && !$noref && ($unreachable+0) != ($provless+0);
        print join("\t","-","-","-","!CENSUS",
        "member=$M ref=$ENV{REF} rows=".($rows+0)
        ." parsed=".($parsed+0)." nocite=".($nocite+0)
        ." unreachable=".($unreachable+0)." provless=".($provless+0)),"\n" }
' "$L" > "$REC"

# NOT `$(while ... case ...)`: the `)` closing a case pattern terminates the
# command substitution, and the whole loop dies with `syntax error near ;;`
# [measured 2026-08-18 -- it did]. Redirect to a file instead.
while IFS=$'\t' read -r id side file head stored; do
  case "$head" in
    '!CENSUS')      echo "CENSUS $stored";                   continue;;
    '!UNQUOTED')    echo "$id UNQUOTED ($stored)";           continue;;
    '!MALFORMED')   echo "$id MALFORMED-CITATION ($stored)"; continue;;
    '!NO-CITATION') echo "$id NO-CITATION";                  continue;;
    '!RAGGED')      echo "BREACH $id RAGGED-ROW ($stored)";  continue;;
    '!MISPLACED-CITATION')  echo "BREACH $id MISPLACED-CITATION ($stored)";  continue;;
    '!MISPLACED-QUOTATION') echo "BREACH $id MISPLACED-QUOTATION ($stored)"; continue;;
    '!SCHEMA')      echo "BREACH SCHEMA $stored";            continue;;
    '!NOT-A-LEDGER') echo "doc=not-a-ledger -- no \`## Rows\`; schema and reasoned arms N/A"; continue;;
    '!NOCITE-MISMATCH') echo "BREACH NOCITE-MISMATCH ($stored) -- rows unreachable by the grammar do not match rows carrying no G2/G3 tag"; continue;;
  esac
  case "$side" in
    G2) [ "$REF"  = NONE ] && { echo "$id G2 UNEXPECTED-CITATION $file § $head"; continue; }
        src="$REF/$file";;
    G3) [ "$PORT" = NONE ] && { echo "$id G3 UNEXPECTED-CITATION $file § $head"; continue; }
        src="$PORT/$file";;
  esac
  [ -f "$src" ] || { echo "$id $side MISSING-SOURCE $src"; continue; }
  if [ "$head" = "Glossary" ]; then
    term=$(printf '%s' "$stored" | perl -ne 'print $1 if /^- \*\*(.+?)\*\* —/')
    out=$(glossterm "$src" "$term")
  else out=$(firstblock "$src" "$head"); fi
  [ -z "$out" ] && { echo "$id $side EMPTY-EXTRACT ($head)"; continue; }
  [ "$(printf '%s' "$out" | norm)" = "$(unwrap_markup "$out" "$stored" | norm)" ] \
    || echo "$id $side DIVERGENT"
done < "$REC" > "$OUT"
cat "$OUT"

# THE FLOOR -- a refusal, not a report. Without it a wrong ledger path, a wrong
# MEMBER, or a moved id prefix all print one tidy census line and exit 0.
n=$(sed -n 's/^CENSUS .*rows=\([0-9]*\) .*/\1/p' "$OUT")
[ -n "$n" ] || { echo "FAIL: no CENSUS line -- the check did not complete"; exit 1; }
# The rows floor is a LEDGER assertion. On `_boundary.md` and `_playbook.md` --
# the two narrative ledgers, which carry no `## Rows` -- zero rows is the
# correct answer, not a wrong path, and failing them is how a gate teaches its
# reader to ignore it.
if ! /usr/bin/grep -q '^doc=not-a-ledger' "$OUT"; then
  [ "$n" -gt 0 ] || { echo "FAIL: zero rows matched -- wrong ledger path, wrong MEMBER, or the id prefix moved"; exit 1; }
fi
# THE SECOND FLOOR. A BREACH is a violated two-cell contract, not a finding
# about a quotation, so it refuses rather than reports. `rows > 0` alone cannot
# see a botched migration: the wrong split leaves rows=120 and exits 0 while the
# check's reach silently drains [measured 2026-08-20 -- see § The amendment gate].
b=$(/usr/bin/grep -c '^BREACH ' "$OUT" || true)
[ "$b" -eq 0 ] || { echo "FAIL: $b structural breach(es) -- the two-cell contract is violated"; exit 1; }
exit 0
```

The four sentinel arms must `continue` **before** `case "$side"`, or `set -u`
aborts on the unset `$src`. `MEMBER`, `REF` and `PORT` reach the perl program
through `%ENV` rather than by interpolation into its text, so a member slug
cannot inject; `\Q…\E` is perl's quotemeta, the regex analogue of the `index()`
literal-prefix discipline `firstblock`, `glossterm` and `resolve` all carry.

**Six properties are load-bearing and each cost a bug to find:**

- **Exact diff, never containment.** A containment test sees content the seeder
  _dropped_ and is blind to content they _added_, so it cannot see modification
  4 at all. The first version of this check was a containment test and reported
  a ledger clean that had backticks the extractor never emitted.
- **Whitespace around the citation's backticks and `§` is optional**, because
  the prettier hazard deletes exactly those characters — a strict pattern stops
  matching the very cell the hazard damaged, and the row is skipped in silence.
- **`parsed == cited` is necessary and NOT sufficient — it holds at `0 == 0`.**
  A row whose second citation is unreadable while its first is fine otherwise
  passes half-checked; that is how `writeme-028` hid its Gen-3 half behind a
  closing marker prettier had escaped. But both sides are computed by the **same
  grammar**, so a citation outside that grammar is invisible to both [measured
  2026-08-18: two wholly fabricated citations planted in a scratch copy of the
  clean `parsons.md` — one whose filename carried a path, one omitting the `§` —
  and the check printed **nothing**]. A whole-ledger census does not close it
  either: the mutant reported **57 citations across 49 rows** against the clean
  **57 across 47** — citations flat, only the row count moved.
- **Three counters, and the strict one is never widened.**
  `parsed ⊆ cited ⊆ lead`. `lead` matches a Gen-2/3 pointer at a **`.md`** path,
  backticked or not, so `lead > cited` is a heading citation the published
  grammar cannot read. Widening `cited` to accept a path would legitimise an
  unsanctioned citation form; adding a looser **counter** whose only output is
  `MALFORMED-CITATION` can produce more findings and never fewer. **That is the
  opposite of widening the check**, and it is said here because a reviewer
  applying that rule mechanically will otherwise reject it.

  ⚠️ **`lead` is NOT the outer bound of "citations the grammar cannot read", and
  its residual is stated rather than left to be discovered.** Measured
  2026-08-18, each planted beside a good citation: an **extension-less**
  reference (``Gen-2 `README` § …``) and a **bare** one (`Gen-2 § …`) are
  **totally silent** through all three counters. An unbackticked reference that
  keeps its extension does fire, which is why no fourth counter is added — the
  optional `` `? `` already covers it, and an unbackticked counter was measured
  firing on **8** `writeme` rows carrying ordinary prose like "Gen-2 block".

  ⚠️ **`lead` stays `.md`-only, and an attempt to widen it to code files was
  reverted the same day.** `.ts` in the extension class makes a **legitimate**
  `G2-code` citation a finding: FIDELITY-METHOD § Worked rows' own `parsons-018`
  cites _"Gen-2 `lib/extract-hints.ts` is 59 lines"_, and under the widened form
  that row reports `MALFORMED-CITATION` [measured 2026-08-18]. The publication
  gate did not catch it because it was run on the two seeded ledgers — and
  `G2-code` is in the **never** column for every Pass-1 seed class, so a Pass-1
  ledger structurally cannot carry a code citation. **A false-positive rate
  measured only where the false positive is impossible is not a measurement**;
  it is the same circularity struck three sections above for the `<em>`
  predicate. Any future widening is gated on a corpus that can exhibit the
  failure — § Worked rows is one.

- **`NONE` is an assertion, on both arms.** `G3) [ "$PORT" = NONE ] && continue`
  was a silent skip of the same class as the missing floor, three lines away and
  live on **100 % of Family F's rows**, which have no Gen-3 port at all. `NONE`
  now means _this ledger cites no heading on that side, and here are the rows I
  checked_ — which is also what stops `dropdowns` and `variables`, whose whole
  G2 arm is a structural no-op, reading as a clean bill.
- **`nocite` is a COVERAGE REPORT, not a finding, and it is derived by the check
  rather than published here.** ⚠️ ~~The `NO-CITATION` set must equal the union
  of the lister-4 and lister-5 id ranges in `### Seed census`; `parsons` =
  `045`–`047`, its three lister-4 clusters~~ — **STRUCK 2026-08-20: that
  derivation was stale by 73 rows and nothing was checking it.** A row lands in
  `NO-CITATION` for two unrelated reasons — it cites nothing, or it cites
  something this grammar cannot read — and the struck rule could not tell them
  apart, so an append of Gen-1 rows moved the set silently and read as a clean
  bill. **It identified a set by what it LACKED.**

  ⚠️ **The first replacement was wrong too, and in the same shape.** It said
  _"identify the lister rows positively, by the `lister-N cluster` anchor form"_
  — which describes only the lister subset while sitting under a heading about
  the whole `NO-CITATION` set, so a reader applying it predicts three and
  measures the Gen-1 population [found 2026-08-20 by AR-2, reproduced]. **A
  correction that re-instantiates the defect it corrects is this campaign's
  recorded failure mode, and it happened here one paragraph after the strike.**

  ⚠️ **And the SECOND replacement was worse than the first two, which is why the
  mechanism now exists in the check rather than in this bullet.** It said _"the
  check derives both sides in the same run"_ — describing a self-check that
  **had never been written**: the assembled check maintained seven counters and
  not one of them read the `provenance` cell [measured 2026-08-20 by AR-2, a
  negative grep over the extracted program]. A stale derivation is bad; a
  derivation that tells the reader a self-check exists is worse, because it is
  the sentence that stops anyone re-deriving it.

  **So the mechanism is now real and this bullet publishes no figure.** The
  check counts `provless` — rows whose `provenance` carries no `G2`/`G3` tag —
  beside `nocite`, prints both on the `CENSUS` line, and raises
  `BREACH NOCITE-MISMATCH` when they disagree. A row unreachable by the Gen-2/3
  grammar and a row carrying no Gen-2/3 tag are the same row by construction, so
  the equality is an invariant of the ledger rather than a number in prose, and
  the next append re-derives it instead of staling it. Until a Gen-1 arm exists,
  `nocite` counts the rows this check does not reach — it is **not** a defect
  count. `writeme` = **empty** still holds, because `WritemeLens` has 0 orphans.

  ⚠️ **This adds a field to the `CENSUS` line, so the census is no longer
  byte-identical to the pre-rewrite form.** § The amendment gate's two clean
  regressions are stated as **findings** — `parsons` 0 divergent, `writeme`
  exactly `writeme-019 UNQUOTED (1 of 2 cited)` — and those are unchanged and
  still byte-identical. It is the census line, which reports rather than
  asserts, that grew.

**Mutation-test every changed line before trusting the gate, not one of them.**
Publishing this check on five plants is how it shipped without a floor. All
thirteen below were planted one at a time in a `/tmp` scratch copy and each
confirmed to fire [all measured 2026-08-18]:

| mutation                                            | expected                                                                                                                                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| run it against **this template**                    | `rows=0 parsed=0` — the specimen ids are `` `<lens>-001` `` and `<` is outside the id class — **plus `FAIL: zero rows matched`, exit 1**. The floor landed after this row was written and the row was never swept for it |
| fabrication whose filename carries a path           | that id under **both** `MALFORMED-CITATION (0 of 1 leads parse)` and `NO-CITATION`; `parsons` nocite rises by exactly 1                                                                                                  |
| fabrication omitting the `§`                        | the same pair                                                                                                                                                                                                            |
| baseline `NO-CITATION` set, nothing planted         | `parsons` = every `G1-*` row and no other; `writeme` = none. **Derived in the run, never transcribed** — the literal id range this row used to publish is exactly what went stale                                        |
| fabrication **beside** a good citation, path form   | `MALFORMED-CITATION (1 of 2 leads parse)`; nocite **unchanged** — the floor alone is blind here, which is why `lead` exists                                                                                              |
| fabrication **beside** a good citation, no-`§` form | the same                                                                                                                                                                                                                 |
| `lead` false-positive gate, both clean ledgers      | **0** rows where `lead > cited`. **Gate publication on this**                                                                                                                                                            |
| `REF=NONE` with a well-formed Gen-2 citation        | `UNEXPECTED-CITATION`                                                                                                                                                                                                    |
| `PORT=NONE` with a well-formed Gen-3 citation       | `UNEXPECTED-CITATION`. Under the pre-amendment form: **silent**                                                                                                                                                          |
| `REF=NONE PORT=NONE` on a 4-row fixture             | no per-row `NO-CITATION` spam; census carries `rows=4 parsed=1 nocite=3`                                                                                                                                                 |
| member filter, `MEMBER=<slug>`                      | ⛔ **UNVERIFIABLE TODAY** — `_family-f.md` is not cut, so there is nothing to run it against. per-member `rows=` sums to the whole-ledger `rows=`                                                                        |
| member filter with one marker deleted               | ⛔ **UNVERIFIABLE TODAY** — same reason. the sum falls **short** and the preflight names `UNMARKED-ROW`                                                                                                                  |
| `norm()`'s fragment-targeted bracket clause         | an escaped **path** link → `DIVERGENT`; `writeme-006`'s escaped **fragment** link stays clean                                                                                                                            |

More rows, each added because a reviewer broke the check in that exact place
[all measured 2026-08-18]:

| mutation                                                                       | expected                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **modification 4** — backticks laundered onto a prose quotation                | `DIVERGENT`. The row whose absence made the amendment gate blind; see below                                                                                                                                                                                                                                                                                                                                    |
| a fabrication citing a **non-`.md`** file (`types.ts`) beside a good citation  | ⛔ **THIS ROW IS FALSE AND WAS FALSE BEFORE THE TWO-CELL REWRITE.** It documents the **reverted** widened `lead`; the shipping `lead` is `.md`-only, so the plant produces **no line at all** under the published check and under this one alike [both measured 2026-08-20 on the same plant]. Kept, struck, rather than deleted: a corpus row that never fired is the thing this table exists to make visible |
| the row pattern matches nothing — wrong path, wrong `MEMBER`, ~~moved prefix~~ | `FAIL: zero rows matched`, **exit 1**. ⚠️ The **moved-prefix** clause is false: the id regex is `[a-z0-9-]+-\d{3}`, so renaming `parsons-NNN` to `parsnip-NNN` still yields `rows=120` under both forms. Wrong path and wrong `MEMBER` do fire [measured 2026-08-20]                                                                                                                                           |
| Family F preflight, marker misspelled into a **shape-valid** slug              | ⛔ **UNVERIFIABLE TODAY** — `_family-f.md` is not cut. `UNMARKED-ROW`; under a `[a-z][a-z-]*` character class it was **silent**                                                                                                                                                                                                                                                                                |

**And these for the two-cell arms**, added when the check was cell-scoped [all
measured 2026-08-20, each planted alone against the check as extracted back out
of this file]. A `BREACH` is a violated contract rather than a finding about a
quotation, so every one of these **exits 1**:

| mutation                                                             | expected                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the header's `quoted` column renamed                                 | `BREACH SCHEMA unresolved`. The check refuses rather than reading column 4 by index                                                                                                                                                                                    |
| `quoted` present, `reasoned` renamed away                            | `BREACH SCHEMA half-migrated`                                                                                                                                                                                                                                          |
| a `\|` unescaped inside a cell — the prettier/`MD056` damage class   | `BREACH parsons-091 RAGGED-ROW (14 cells against header 9)`                                                                                                                                                                                                            |
| a quotation planted in the `reasoned` cell                           | `BREACH parsons-086 MISPLACED-QUOTATION (1 in reasoned)`                                                                                                                                                                                                               |
| a citation planted in the `reasoned` cell                            | `BREACH parsons-086 MISPLACED-CITATION (1 in reasoned)`                                                                                                                                                                                                                |
| `evidence` **and** `reasoned` in one header — the rename half missed | `BREACH SCHEMA half-migrated -- reasoned present beside evidence`. Under a fallback chain this resolved to LEGACY and drained the whole `reasoned` arm at exit 0                                                                                                       |
| `## Rows` renamed on a ledger-shaped document                        | `BREACH SCHEMA ledger-shaped header row but no ## Rows`. One heading must not switch the gate stack off                                                                                                                                                                |
| `nocite` and `provless` forced apart                                 | `BREACH NOCITE-MISMATCH`. Both clean ledgers agree on the first run — `parsons` 76/76, `writeme` 0/0                                                                                                                                                                   |
| a synthetic **`G3`-only** row, the `ADDITION` shape                  | **SILENT.** Under a `G[23]-` character class it was a false `BREACH NOCITE-MISMATCH (nocite=0 provless=1)`: the Gen-3 tag carries no hyphen, and no `G3`-only row exists in either ledger today, so the counters agreed by luck of the data rather than by being right |

**And these for
[§ The structural-integrity check](#the-structural-integrity-check--run-this-one-first)**,
whose template branch is the newest code in either gate:

| mutation                                                          | expected                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a **real ledger** invoked with the placeholder prefix `'<lens>'`  | `FAIL STRUCT-ZERO-ROWS`, exit 1. Branching on the ARGUMENT alone printed a clean census over a live 120-row ledger                                                                                                                                                                                                                                                                                               |
| **this template** invoked with a real lens prefix                 | `FAIL STRUCT-ZERO-ROWS`, exit 1 — the template branch requires BOTH the document flag and the argument shape                                                                                                                                                                                                                                                                                                     |
| this template invoked with an unused placeholder, `'<other>'`     | `FAIL STRUCT-NO-SPECIMENS`, exit 1 — the template branch has its own floor and cannot be entered vacuously                                                                                                                                                                                                                                                                                                       |
| a real ledger carrying a **leftover specimen row**, either prefix | `FAIL STRUCT-SPECIMEN-LEFT`, exit 1. Nothing else catches it: the Pass-1 gate's walk check keys on `walked`/`found`/`Design owed`, which a specimen row does not carry, and its id and census checks see only real-slug rows. The leftover ALSO flips `istemplate`, which is how it reached the template branch — so both conditions co-occur at the seeding commit, the one moment § When this check runs names |

⚠️ **Two of these were mis-planted first and passed, which is the point of
planting them one at a time.** A `MISPLACED-QUOTATION` plant appended to the end
of the row line landed in `gate`, not `reasoned`, and the check correctly said
nothing. **A plant that does not land where you think it did reads exactly like
a check that does not fire.** Plant by splitting the row on the unescaped pipe
and writing the named field, never by appending to the line.

### The Gen-1 arm

**§ The transport check re-runs an EXTRACTOR and diffs. Gen-1 has no
extractor**, because it cites non-markdown source with no headings — so this arm
asserts **substring-and-count** instead. It is the missing arm
[SPEC.md § The register check](../SPEC.md#the-register-check) has been owed
since `fd6066b3`, and until it existed `parsons`'s 78 Gen-1 citations were
invisible at all three counters.

**Three assertion kinds, and collapsing them into one `grep -F` is wrong-signed
on two of the three:**

| kind      | assertion                                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| `PRESENT` | the fragment occurs in the anchor's file, and where the citation carries `(N×)` the anchor occurs **exactly** N times |
| `ABSENT`  | the anchor occurs exactly **0** times — the `occurs 0 times` family, which a substring gate reports backwards         |
| `SET`     | a lister-4 cluster: every listed class name, and the declared count against the listed count                          |

**Count OCCURRENCES, never lines.** `grep -c` counts matching lines, and
`parsons-104` asserts `prettyPrint` at 8× — a line-counting check is wrong the
moment two land on one line.

**Refusals are visible and ARITHMETIC.** Every citation is either checked or
named on a `REFUSED` line, and the census refuses to close unless
`checked + refused == citations`. A form this arm cannot check is **named**,
never skipped — that is the whole difference between this and the silent
`nocite` it replaces.

```bash
# gen1-arm.sh <ledger.md> <gen1-root> <row-id-prefix>
#
# Run from the repository root. <gen1-root> is absolute and must be PINNED and
# reported: the quarry carries three copies of every cited file and they are not
# identical -- parsons-iframe.html differs across all three roots by 16 lines
# [measured 2026-08-21]. The findings below happen to be root-insensitive, and
# that is a measurement, not an assumption.
set -u
LC_ALL=C; export LC_ALL
ROOT="$2" LENS="$3" perl -e '
my ($root,$lens) = ($ENV{ROOT}, $ENV{LENS});
open my $fh, "<", $ARGV[0] or die "cannot open $ARGV[0]\n";
# All three initialised: an undefined $RCOL makes `$RCOL < 0` FALSE, which sends
# every legacy ledger down the else-branch and refuses it as unresolved.
my ($QCOL,$RCOL,$ECOL) = (-1,-1,-1);
my (%src, @find, $cites,$checked,$refused,$present,$absent,$set,$quotes);

sub slurp { my $p = shift; return $src{$p} if exists $src{$p};
  my $t; if (open my $s, "<", $p) { local $/; $t = <$s> } $src{$p} = $t; return $t }

# Undo ONLY the sanctioned transport escapes. NOT norm(): norm() collapses
# whitespace, and parsons-113 quotes a two-space literal whose two spaces are
# the entire subject of the row.
sub unesc { my $s = shift;
  $s =~ s/\\\|/|/g; $s =~ s/\\\*/*/g; $s =~ s/\\_/_/g; $s =~ s/\\\[/[/g; $s =~ s/\\\]/]/g; $s }
sub occ { my ($hay,$n) = @_; my ($c,$p) = (0,0);
  while (($p = index($hay,$n,$p)) >= 0) { $c++; $p += length($n) } $c }

while (my $line = <$fh>) {
  $ISLEDGER = 1 if $line =~ /^## Rows[ \t]*$/;
  if (!$SEEN && $line =~ /^\|\s*#\s*\|/) {
    $SEEN = 1;
    my @h = split /(?<!\\)\|/, $line, -1;
    for my $i (0..$#h) { my $t=$h[$i]; $t =~ s/^\s+|\s+$//g;
      $QCOL=$i if $t eq "quoted"; $RCOL=$i if $t eq "reasoned"; $ECOL=$i if $t eq "evidence" }
    # SCHEMA RESOLUTION IS TOTAL here too, for the same reason it is total in
    # § The transport check: a fallback chain reaches an unnamed state silently.
    if    ($QCOL >= 0 && $RCOL >= 0) { }
    elsif ($ECOL >= 0 && $QCOL < 0 && $RCOL < 0) { $QCOL = $ECOL }
    else  { $SCHEMA = "unresolved or half-migrated -- no single cell holds extractor output" }
    next }
  next unless $line =~ /^\| `(\Q$lens\E-\d{3})`/; my $id = $1;
  $rows++;
  my @c = split /(?<!\\)\|/, $line, -1;
  my $q = ($QCOL >= 0 && $QCOL <= $#c) ? $c[$QCOL] : $line;
  # A Gen-1 citation ON THE ROW but not in the cell that is supposed to hold
  # extractor output is the WRONG SPLIT, and it is the case a citations-count
  # floor cannot see -- because `writeme` legitimately carries zero Gen-1
  # citations, so "zero" is not by itself wrong. This is the same misplacement
  # § The transport check refuses, asserted for the Gen-1 grammar.
  if ($line =~ /Gen-1\s*`/ && $q !~ /Gen-1\s*`/) { $misplaced++;
    push @find, "GEN1-MISPLACED-CITATION $id -- a Gen-1 citation is on the row but not in the extractor-output cell" }
  # ⛔ AND THE SYMMETRIC SIGNAL FOR QUOTATIONS, which is the one that matters
  # most. A PARTIAL split -- citation left in `quoted`, the fragment carried
  # into `reasoned` with the derivation prose it was embedded in -- passes every
  # other floor: rows is intact, the citation is where it belongs so `misplaced`
  # is 0, and `checked + refused == citations` still holds. Measured 2026-08-24
  # by AR-1: ALL SEVENTEEN `GEN1-QUOTE-ABSENT` findings vanished, the whole
  # published defect set, at exit 0. It is also the likeliest half-done
  # migration, because moving derivation prose takes the fragment inside it.
  if ($RCOL >= 0 && $RCOL <= $#c) {
    my $lq = () = $line =~ /(?:<em>"|(?<!\\)_")/g;
    my $qq = () = $q    =~ /(?:<em>"|(?<!\\)_")/g;
    my $rq = () = $c[$RCOL] =~ /(?:<em>"|(?<!\\)_")/g;
    if ($rq > 0 && $q =~ /Gen-1\s*`/) { $qmisplaced += $rq;
      push @find, "GEN1-MISPLACED-QUOTATION $id -- $rq quotation(s) sit in the derivation cell on a Gen-1 row" } }
  next unless $q =~ /Gen-1\s*`/;

  # Segment the cell at each Gen-1 file citation, so every fragment is scoped to
  # its NEAREST PRECEDING anchor. First-anchor-governs measured 47% false
  # positives on cells citing two files; nearest-preceding measured 0.
  my @seg;
  while ($q =~ /Gen-1\s*`([A-Za-z0-9._-]+\.(?:js|jsx|css|html))`/g) {
    push @seg, { file => $1, start => $+[0] } }
  for my $i (0..$#seg) {
    $seg[$i]{end}  = ($i < $#seg) ? $seg[$i+1]{start} : length($q);
    $seg[$i]{text} = substr($q, $seg[$i]{start}, $seg[$i]{end} - $seg[$i]{start});
    $cites++ }

  for my $s (@seg) {
    my $f = $s->{file};
    my $path = "$root/" . ( $f =~ /^ParsonsLens/       ? "src/lenses/$f"
                          : $f eq "parsons-iframe.html" ? "public/$f"
                          :                              "public/static/parsonizer/$f" );
    my $body = slurp($path);
    unless (defined $body) { push @find, "REFUSED $id GEN1-MISSING-SOURCE $path"; $refused++; $missing++; next }
    my $t = $s->{text};

    if ($t =~ /lister-4 cluster/) {                       # --- SET
      my ($decl)   = $t =~ /\*\*(\d+) orphan classes\*\*/;
      my ($banner) = $t =~ /lister-4 cluster `([^`]*)`/;
      # DEDUPE. The declared count is of DISTINCT classes; the cell mentions
      # some of them more than once, because an annotation names them again.
      # Counting mentions made `parsons-047` report "declares 2, lists 5" over a
      # correct row [measured 2026-08-21 by AR-1: `parsons-fallback` ×4,
      # `codeContainer` ×3]. `045` and `046` agreed only because their
      # annotations happen not to re-mention a class -- agreed by luck of the
      # data, which is the reasoning that earned `57564e01` its own commit.
      my %seen; my @names = grep { $_ ne $banner && !$seen{$_}++ }
                            $t =~ /`([A-Za-z][A-Za-z0-9_-]*)`/g;
      unless (defined $decl) { push @find, "REFUSED $id GEN1-SET-NO-COUNT"; $refused++; next }
      push @find, "GEN1-SET-COUNT $id declares $decl, lists ".scalar(@names)." distinct" if @names != $decl;
      $set++; $checked++; next }

    if ($t =~ /occurs?\s+\*\*0\s*(?:times)?\*\*|\(0×\)|occurs? nowhere/) {   # --- ABSENT
      # The zero-claim is bound to the tokens it is made ABOUT. An unbound form
      # tested every backticked token in the segment and produced TWELVE false
      # positives: a segment routinely carries present-assertions and an
      # absence-assertion together.
      if ($t =~ /the function/) {
        push @find, "REFUSED $id GEN1-SCOPED-ZERO (absence asserted of a function, not the file)"; $refused++; next }
      my @toks;
      while ($t =~ /((?:`[^`]+`(?:\s*,\s*|\s+and\s+|\s+)?)+?)(?:all\s+)?occurs?\s+(?:\*\*0|nowhere)/g) {
        push @toks, $1 =~ /`([^`]+)`/g }
      unless (@toks) { push @find, "REFUSED $id GEN1-ZERO-UNBOUND"; $refused++; next }
      for my $k (@toks) { my $n = occ($body, unesc($k));
        push @find, "GEN1-UNEXPECTED-PRESENT $id `$k` occurs $n times, row asserts 0" if $n }
      $absent++; $checked++; next }

    my ($anchor) = $t =~ /^\s*,\s*`([^`]+)`/;             # --- PRESENT
    my ($decl)   = $t =~ /`[^`]+`\s*\((\d+)×/;
    if (!defined $anchor) { push @find, "REFUSED $id GEN1-NO-ANCHOR (prose descriptor, not a greppable token)"; $refused++; next }
    if (!defined $decl)   { push @find, "REFUSED $id GEN1-NO-COUNT `$anchor` (unfalsifiable as a count claim)"; $refused++; next }
    my $n = occ($body, unesc($anchor));
    push @find, "GEN1-COUNT $id `$anchor` occurs $n, row declares $decl" if $n != $decl;

    my @frag = $t =~ /<em>"(.*?)"<\/em>/g;
    push @frag, $t =~ /(?<!\\)_"(.*?)"_/g;
    for my $fr (@frag) { $quotes++;
      if ($fr =~ /…\s*$/) { push @find, "REFUSED $id GEN1-TRAILING-ELLIPSIS (an extractor cut cannot be reproduced)"; $refused++; next }
      # A mid-string … is an ELISION: assert each piece in order, never the
      # composed whole. Three distinct meanings of … live in these rows.
      my @parts = split /\s*…\s*/, unesc($fr);
      my ($from, $ok) = (0, 1);
      for my $p (@parts) { next unless length $p;
        my $at = index($body, $p, $from);
        if ($at < 0) { $ok = 0; last } $from = $at + length($p) }
      push @find, "GEN1-QUOTE-ABSENT $id ".(@parts>1 ? "(elided, in order) " : "").q{"}.substr($fr,0,72).q{"} unless $ok }
    $present++; $checked++ }
}
print "$_\n" for @find;
printf "GEN1-CENSUS lens=%s root=%s citations=%d checked=%d refused=%d missing=%d present=%d absent=%d set=%d quotations=%d misplaced=%d/%d findings=%d\n",
  $lens, $root, $cites+0, $checked+0, $refused+0, $missing+0, $present+0, $absent+0,
  $set+0, $quotes+0, $misplaced+0, $qmisplaced+0, scalar(@find);
# THE FLOORS. ⛔ The arithmetic one is NOT sufficient on its own: `checked +
# refused == citations` holds trivially at 0 + 0 == 0, so a wrong row-id prefix,
# a wrong ledger path, a wrong quarry root and the WRONG SPLIT of a migrated
# ledger all printed a tidy census and exited 0 [all measured 2026-08-21 by
# AR-1]. That is the `LENS=_family-f` defect a third time, and the last of those
# cases is precisely a botched migration -- where § The transport check refuses
# and this arm waved it through. A floor that cannot fail is a report.
my $bad = 0;
if ($SCHEMA)  { print "FAIL: SCHEMA $SCHEMA\n"; $bad = 1 }
# The floor is on ROWS, not citations. `writeme` carries 45 rows and ZERO Gen-1
# citations, legitimately -- so "no citations" is a fact about a ledger and only
# "no rows" is a broken invocation.
# ⛔ The not-a-ledger exemption is a POSITIVE signal this check printed itself,
# never the absence of one. Gating the rows floor on `$ISLEDGER` let a wrong
# path onto any of the campaign`s five non-ledger documents exit 0 with
# `citations=0` [measured 2026-08-24 by AR-1 on `SPEC.md` and
# `FIDELITY-METHOD.md`] -- and a non-ledger is the LIKELIER wrong path, being
# five of the nine. § The transport check does not have this hole; this now
# mirrors it.
if (!$ISLEDGER) { print "doc=not-a-ledger -- no `## Rows`; Gen-1 arms N/A\n" }
elsif (($rows+0) == 0) {
  print "FAIL: zero rows matched -- wrong ledger path, wrong row-id prefix, or the prefix moved\n"; $bad = 1 }
if (($misplaced+0) > 0) {
  printf "FAIL: %d Gen-1 citation(s) sit outside the extractor-output cell -- the ledger is split wrong\n", $misplaced+0; $bad = 1 }
if (($qmisplaced+0) > 0) {
  printf "FAIL: %d quotation(s) sit in the derivation cell on Gen-1 rows -- the ledger is split PARTIALLY, and this arm would otherwise report nothing\n", $qmisplaced+0; $bad = 1 }
if (($checked+0) + ($refused+0) != ($cites+0)) {
  printf "FAIL: census does not close -- %d checked + %d refused != %d citations\n", $checked+0, $refused+0, $cites+0; $bad = 1 }
# A MISSING SOURCE FILE is a broken invocation, not an unfalsifiable citation
# form. ⛔ ANY of them refuses, not only 100%: the published path resolver is
# parsons-shaped, so on another ledger SOME files resolve and others do not, and
# a `== refused` threshold exits 0 over silently unchecked citations [measured
# 2026-08-24 by AR-1: one row citing a nonexistent file gave refused=10, exit 0].
# Partial-missing is the EXPECTED state for seven of the eight ledgers until the
# resolver moves to `## Source inventory`.
if (($missing+0) > 0) {
  printf "FAIL: %d citation(s) refused for a missing source -- check the quarry root and the file-to-path map\n", $missing+0; $bad = 1 }
exit($bad ? 1 : 0);
' "$1"
```

**Run against the real quarry on 2026-08-21, `parsons` at 120 rows**, root
pinned to the `spiral-lens` tree this ledger names:

```text
GEN1-CENSUS lens=parsons citations=78 checked=69 refused=9
            present=62 absent=4 set=3 quotations=138 findings=28
```

**Seventeen `GEN1-QUOTE-ABSENT`, and they are three different things:**

| class                                                           | rows                                               | count |
| --------------------------------------------------------------- | -------------------------------------------------- | ----- |
| the set RESUME already names, reproduced **independently**      | `050`, `052`, `058`, `066` ×2, `068`, `072`, `076` | **8** |
| ⛔ **NEW — no instrument had ever checked these**               | `050`, `051` ×2, `056`, `108` ×2, `110`            | **7** |
| **not defects** — an artefact of the one-cell schema, see below | `109` ×2                                           | **2** |

**The 7 new ones are the fragments the 2026-08-19 stopgap SKIPPED as
truncated**, and they are the same defect class as the published 8 — a
multi-line rule composed onto one line. Hand-verified: `parsons-110` quotes
`ul.incorrect { … background-color: #ffefef; }` where the source carries `;\n}`,
so the composed form is not a byte-run in the file. **The skip was the only
reason they looked clean.** They are named here rather than repaired, because
they belong to other commit groups and a repair is its own unit with its own
gate run.

⛔ **The 2 on `parsons-109` are the ruling arguing for itself, and they cannot
be fixed in a one-cell ledger.** That row cites `parsons.css`; its ⚠️ annotation
then quotes `parsons-iframe.html` content while naming that file as **bare
prose** rather than as a `Gen-1` citation, so nearest-preceding-anchor scoping
attributes the fragments to the wrong file. No mechanical scoping can separate
them while annotation and extractor output share a cell. **Under the two-cell
schema the annotation is `reasoned`, this arm never sees it, and both vanish.**

⛔ **AND ONE MORE, WHICH IS THIS SECTION FINDING ITS OWN DOCTRINE VIOLATED:**

```text
GEN1-COUNT parsons-119 `log_errors` occurs 8, row declares 7
```

`log_errors` occurs **8 times across 7 lines** in `parsons.js` [measured
2026-08-21: `grep -o … | wc -l` → 8; `grep -c` → 7]. **The row's count was taken
by LINE** — verbatim the defect this section opens by warning against. It is a
**16th** genuine defect. An earlier revision published 26 of its own 28 findings
and left this one unnamed, which is precisely the arithmetic the census exists
to prevent; the section had run the arm, found its own doctrine's instance, and
not reported it.

⚠️ ~~A reach table here compared one-cell `25 of 78` checked against two-cell
`75 of 78`.~~ **STRUCK 2026-08-21.** Those figures contradicted the census
printed thirty lines above them — `checked=69 refused=9`, same ledger, same
schema — and their stated method was _"measured with empty stubs"_, which is not
a command. § Publish the number by publishing the command forbids exactly that,
and this file cites that rule three times. **The reach claim is real and is now
stated qualitatively**: annotation prose and extractor output share a cell
today, so a mechanical arm cannot always tell which file a fragment belongs to —
`parsons-109` is the worked instance — and the two-cell schema removes that
ambiguity by construction. Whoever needs a number publishes the command.

⚠️ **A second claim went with it: that the migrated schema leaves `0` quotations
unchecked.** That does not follow from the schema. This arm reads quotations
from `<em>"…"</em>` and `_"…"_` only, so a **code-span** quotation is unreadable
under either schema — reaching zero needs a third quotation form here, which
collides head-on with open **amendment 8**, whose whole content is that a
quotation carrying significant whitespace, `*` or a bare `_` **must** move to a
code span. That collision is owed to whichever session holds both.

**The nine refusals, transcribed from the run and not from the design** — `049`,
`061`, `073`, `075`, `085`, `093` `GEN1-NO-ANCHOR`; `064`, `065`
`GEN1-NO-COUNT`; `094` `GEN1-SCOPED-ZERO`, whose absence is asserted **of a
function** while the token occurs 6× in the file, so a file-scoped check would
be wrong-signed.

**Its mutation corpus** — this arm shipped with none, which is the thing § The
amendment gate forbids twice, and the SET dedupe defect above is what a missing
corpus costs [all measured 2026-08-21, planted one at a time against the arm as
extracted back out of this file]:

| mutation                                                                                         | expected                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| clean `parsons`                                                                                  | `citations=78 checked=69 refused=9`, exit 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| clean `writeme`, which carries **zero** Gen-1 citations legitimately                             | `citations=0`, exit **0**. ⛔ A `citations > 0` floor would fail a correct ledger — the floor is on ROWS                                                                                                                                                                                                                                                                                                                                                                                                     |
| wrong row-id prefix                                                                              | `FAIL: zero rows matched`, exit 1                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| wrong ledger path                                                                                | the same                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| wrong quarry root                                                                                | `FAIL: every citation refused for a missing source`, exit 1 — the reason `GEN1-MISSING-SOURCE` is counted apart from the refusal class                                                                                                                                                                                                                                                                                                                                                                       |
| **a migrated ledger split the WRONG way**, citation in `reasoned`                                | `FAIL: … Gen-1 citation(s) sit outside the extractor-output cell`, exit 1. **The count is fixture-dependent and deliberately not transcribed** — an earlier revision published `74`, and a faithful plant of this row's own description gives `76`                                                                                                                                                                                                                                                           |
| ⛔ **a PARTIAL split** — the citation stays in `quoted`, the `<em>` fragment moves to `reasoned` | `FAIL: … quotation(s) sit in the derivation cell on Gen-1 rows`, exit 1. **Without this arm the run reported `findings=10` at exit 0 — all seventeen `GEN1-QUOTE-ABSENT` findings, the entire published defect set, silently deleted** [measured 2026-08-24 by AR-1]. Every other floor passes: rows intact, the citation is where it belongs so `misplaced` is 0, and the arithmetic holds. It is also the LIKELIEST half-done migration, because moving derivation prose takes the fragment embedded in it |
| the `provenance` column renamed, on a ledger carrying Gen-2/3 rows                               | `BREACH SCHEMA unresolved -- no provenance column`, exit 1 (§ The transport check)                                                                                                                                                                                                                                                                                                                                                                                                                           |
| the same, on an **all-Gen-1** ledger — the shape six of Family F will have                       | the same. Under an uninitialised `$PCOL` this was **byte-identical to the clean run**, because `unreachable == provless == rows` either way                                                                                                                                                                                                                                                                                                                                                                  |
| a wrong path landing on a **non-ledger** campaign document                                       | `doc=not-a-ledger`, exit 0 — a POSITIVE signal the check prints itself, never the absence of one. Five of the nine campaign documents are non-ledgers, so this is the likelier wrong path                                                                                                                                                                                                                                                                                                                    |
| one row citing a **nonexistent** source file                                                     | `FAIL: 1 citation(s) refused for a missing source`, exit 1. A `missing == refused` threshold exited 0 here, and partial-missing is the EXPECTED state for seven ledgers until the path map moves to `## Source inventory`                                                                                                                                                                                                                                                                                    |
| the same ledger split correctly                                                                  | exit 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| a cluster whose annotation **re-mentions** a listed class                                        | **SILENT.** Counting mentions rather than distinct names reported `parsons-047` as "declares 2, lists 5" over a correct row                                                                                                                                                                                                                                                                                                                                                                                  |

⚠️ **Every one of the four refusing rows above exited 0 before 2026-08-21**,
because the only floor was `checked + refused == citations`, which holds at
`0 + 0 == 0`. A floor that cannot fail is a report — the `LENS=_family-f` defect
for the third time in this file, and the wrong-split row is the case that
matters most, since it is exactly what a botched migration produces and § The
transport check refuses it while this arm waved it through.

⚠️ **`073` is `GEN1-NO-ANCHOR` here and was `GEN1-ZERO-UNBOUND` in the drafting
run**, because the published ABSENT predicate is narrower than the draft one and
the row falls through to the PRESENT arm instead. It is refused and named either
way and the census closes at nine either way — but an earlier revision of this
paragraph carried the draft label, which would have been a sentence wrong about
its own evidence, in the section written to catch exactly that. **The list above
is `grep '^REFUSED'` over the check as extracted back out of this file**, which
is the only form of it worth publishing.

**When it runs.** On **every ledger carrying a `Gen-1` citation** — at the
seeding commit beside the Pass-1 gate and § The transport check, and again at
campaign close. Stated here because
[§ When this check runs](#when-this-check-runs--it-had-no-trigger-for-seven-of-the-eight-ledgers)
is written in the singular about the transport check and names neither this arm
nor § The structural-integrity check, and that section's own title records what
an untriggered check is worth.

⛔ **THREE THINGS THIS SECTION OWES, named rather than left to be discovered.**
Deferred by human ruling of 2026-08-24 to the session that re-cuts the ledgers,
because each is a relocation rather than a correction:

1. **The path resolver is parsons-only.** The file→path map hardcodes
   `public/static/parsonizer/`, `public/` and `src/lenses/`. A `blanks` ledger
   citing `BlanksLens.jsx` — a file that **exists** — gets `GEN1-MISSING-SOURCE`
   over a fabricated quotation [measured 2026-08-21 by AR-1 on a two-row
   fixture]. **Seven of the eight ledgers inherit this.** The map belongs
   per-ledger in `## Source inventory`, beside the existing `REF=` idiom, and
   the Gen-1 root belongs there with it.
2. **The parsons run and its findings belong in
   `parsons.md § Close conditions`**, not in the skeleton every ledger is copied
   from. This file opens with _"delete nothing structural"_ and now carries a
   lens-specific run; `parsons.md`'s own § Close conditions already has the home
   and the table.
3. **This section is not reachable from anywhere inside this file.** It is
   linked from RESUME and from the cspell header, and from no check that
   precedes it.

⚠️ **Amendment 4 is discharged by this section and is to be struck from RESUME's
list.** _"A citation anchor for a non-markdown, non-test source"_ has been in
use by rows `048`–`120` and unpublished since STEP 1a; the grammar this arm
parses **is** that anchor, now written down. Struck explicitly rather than left
implicit — a deliverable that closes silently is the failure
[§ The Gen-3 direct-check appendix](../RESUME.md) records.

### The amendment gate — the two clean regressions are NOT it

`writeme` must still report exactly `writeme-019 UNQUOTED (1 of 2 cited)` with
**0 divergent**, and `parsons` **0 divergent** [measured 2026-08-18]. Necessary,
and **nowhere near sufficient** — an earlier revision published them as the
whole gate.

⚠️ **What is held byte-identical is the FINDING LINES, not the whole run.** The
`CENSUS` line has since gained `unreachable=` and `provless=`, so a whole-run
diff against a transcript from before 2026-08-20 shows a difference that is not
a regression. This section's own distinction governs — _"a census reports; a
floor refuses"_ — and growing a reporting line does not relax an assertion. Two
immutable commit bodies (`6c3e6d16`, `0d815dfb`) claim byte-identity of the
**output**; that is now true only of the findings, and this is where the
correction lives because those bodies cannot carry it.

⚠️ **A zero baseline cannot detect a loosening.** Both regressions sit at 0
divergent, so widening `norm()` leaves 0 at 0. AR-2 performed the exact widening
§ Normalising is not the same as being blind forbids — adding a clause that
ignores backticks, which hides modification 4 by name — and **both published
regressions came back byte-identical** [measured 2026-08-18]. A future author
could make that edit, pass every gate this section published, and cite the
`lead` bullet's _"adding a looser counter is the opposite of widening"_ as
licence.

**So the gate is the mutation corpus, not the regressions.** After any change to
`norm()`, `unwrap_markup()`, `firstblock`, `glossterm`, `parsed`, `cited`,
`lead`, **the schema resolver, the unescaped-pipe cell split, `$mc`, `$mq`, the
`RAGGED` arm or the BREACH floor** — or to **any of § The Gen-1 arm's `unesc`,
`occ`, the segmenter, the ABSENT token-binding, the SET dedupe or its four
floors** — **every mutation table in § The transport check, § The
structural-integrity check and § The Gen-1 arm must still fire**, and then the
two regressions must hold.

⚠️ **Counting the tables in prose is banned here, and this sentence is why.** It
said _"both tables"_ while three existed, then _"all three"_ while four did, and
the paragraph recording the first slip stood beside its own re-instantiation
[found 2026-08-21 by AR-1]. **The tables are named, never numbered** — a name
cannot go stale when a table is added. (`firstblock` and `glossterm` are named
because they supply half the comparison and are pasted in from another section,
so editing them does not look like editing the check. The six added 2026-08-20
are named for the same reason: a cell split can be widened and both refusals
loosened without any of the original seven being touched.) The modification-4
row exists because its absence is what let one widening through: published
`norm()` → `parsons-001 G2 DIVERGENT`, widened → silent.

⚠️ **The trigger list said "both tables" while three existed**, for one commit
[found 2026-08-20 by AR-2]. A stale count in the sentence that decides when the
gate runs is worse than a stale count in a finding, because nothing downstream
re-derives it.

⛔ **AN APOSTROPHE IN A COMMENT BREAKS THE WHOLE CHECK, SILENTLY.** The perl and
awk programs above live inside single-quoted shell strings, so a `'` anywhere
inside one — including in an explanatory comment — terminates the program early
and the rest is handed to the shell. This shipped: a comment reading _"the
campaign's own house idiom"_ produced
`Can't open own: No such file or directory` and an exit status of 2, and a
harness that only inspected stdout read the empty result as a clean pass
[measured 2026-08-20]. Two consequences, both mechanical: **write no apostrophe
inside these blocks** — rephrase, as this file now does — and **give any harness
that runs an extracted check a floor on the extraction itself**, because an
empty script exits 0 and prints nothing, which is indistinguishable from a check
that found nothing.

⛔ **AND THE CORPUS IS STILL NOT SUFFICIENT. Do not read the paragraph above as
a closed gate.** AR-2 measured loosenings that pass the whole corpus **and**
both regressions byte-identically; two reproduced independently here — folding
case (`$_=lc $_`) and stripping the truncation ellipsis [measured 2026-08-18;
two of AR-2's four did not reproduce under this harness, so the count is two,
not four, and the disagreement is itself recorded rather than resolved by
preference]. Case-folding hides a real capitalisation mis-transcription.

**Why a corpus of plants cannot be the gate.** Of its rows, only two exercise
`norm()` at all, and both are single-point plants — so it detects only
loosenings that intersect its points. It is a **regression suite wearing a
gate's name**, which is structurally the same failure as the zero baseline it
replaced, just scoring non-zero somewhere other than where the loosening lands.

**The design that closes it, measured but deliberately not applied here** (three
consecutive same-session fix rounds each introduced the defect they removed;
this goes to a fresh session): pair every sanctioned modification with its
mis-transcription. For each of modifications 1–5 plus the truncation ellipsis, a
**fixture pair** — the sanctioned form, which must be SILENT, and the same span
mis-transcribed, which must be DIVERGENT. Twelve assertions. A loosening is
_defined_ as making a mis-transcription silent, so the gate has to contain
mis-transcriptions and not only fabrications. Every bypass above dies on the
second half of its pair.

### When this check runs — it had no trigger for seven of the eight ledgers

⚠️ **Until now the only ledger with a stated trigger was the one that cannot use
the single-lens form.** The check appeared in this document's Family F bullet
and nowhere else — not in the Pass-1 gate, not in the close conditions, and
nowhere in `FIDELITY-METHOD.md` § Gate checks [measured 2026-08-18, AR-2]. **A
mutation-tested check nobody is required to run is worth what an unrun check is
worth**, which is this campaign's founding complaint about its own predecessors.

**It runs twice on every ledger:** once at the **seeding commit**, beside the
Pass-1 gate — that gate checks SHAPE and this one checks TRANSPORT, and neither
substitutes for the other — and again at **campaign close**, below. Paste its
output into the commit body; a stated count without the command that produced it
is what § Publish the number by publishing the command forbids.

The conditions below are for **campaign close**, not for the seeding commit.

- **Every** row has a non-empty `discharged by` that **resolves** — on any
  disposition (human ruling 2026-08-14);
  [§ At AR-5](../FIDELITY-METHOD.md#at-ar-5) is the single definition.
- **No `UNSETTLED` survives** — `rows "$L" | grep -c 'UNSETTLED'` → 0, using the
  slice helper above and **not** a whole-file grep, which this very bullet would
  otherwise satisfy forever. Until it is zero, an unsettled provenance set can
  reach AR-5 dressed as a settled one and no gate check would see it.
- **The pass banner has been replaced**, not merely outgrown —
  `grep -c '^> \*\*PASS 1 — SEEDED' <ledger>` → 0. Anchored to the blockquote
  form for the same reason.
- **Open rows = 0**, under § At AR-5's single four-part definition — which
  includes an empty `walked` or `found` on any row those columns are required
  on, and an unrebutted quotation on a `revive` row.
- Every `restore — DEFERRED` row names an owner **and** a ruling, and the ruling
  resolves as a heading in the reference it cites.
- Pass 3's counter-ledger has been run and can no longer answer either question
  ([§ Pass 3](../FIDELITY-METHOD.md#pass-3--the-counter-ledger)).
- This lens's row in [SPEC.md § Roll-up](../SPEC.md#roll-up) has no blank cells.
- [§ The transport check](#the-transport-check) has been re-run at close and its
  output pasted — **exit 0, and every finding line accounted for in the ledger's
  own prose**. A `FAIL` line, or no output at all, closes nothing.
