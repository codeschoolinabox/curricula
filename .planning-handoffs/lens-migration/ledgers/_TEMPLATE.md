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
<!-- cspell:ignore capitalisation loosenings -->

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
          $noref = ($ENV{REF} eq "NONE" && $ENV{PORT} eq "NONE"); }
  next unless /^\| `([a-z0-9-]+-\d{3})`/; my $id = $1;
  next if $M ne "all" && !/^\| `[a-z0-9-]+-\d{3}` *\| *`\Q$M\E` /;
  $rows++; my $n = 0;
  while (/Gen-([23])\s*`([A-Za-z.]+\.md)`\s*§\s*(.*?):\s*(?:_"(.*?)"_|<em>"(.*?)"<\/em>)/g) {
    my $q = defined $4 ? $4 : $5;
    print join("\t", $id, "G$1", $2, $3, $q), "\n"; $n++;
  }
  $parsed += $n;
  my $cited = () = /Gen-[23]\s*`[A-Za-z.]+\.md`\s*§/g;
  my $lead  = () = /Gen-[23]\s*`?[A-Za-z0-9._\/-]+\.md`?/g;
  print join("\t",$id,"-","-","!MALFORMED","$cited of $lead leads parse"),"\n" if $lead > $cited;
  print join("\t",$id,"-","-","!UNQUOTED", "$n of $cited cited"),"\n"          if $cited > $n;
  if ($n == 0) { $nocite++;
    print join("\t",$id,"-","-","!NO-CITATION","-"),"\n" unless $noref; }
  END { print join("\t","-","-","-","!CENSUS",
        "member=$M ref=$ENV{REF} rows=".($rows+0)
        ." parsed=".($parsed+0)." nocite=".($nocite+0)),"\n" }
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
[ "$n" -gt 0 ] || { echo "FAIL: zero rows matched -- wrong ledger path, wrong MEMBER, or the id prefix moved"; exit 1; }
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
- **The `NO-CITATION` set is derived, not judged.** With a reference root it
  must equal the union of the lister-4 and lister-5 id ranges in
  `### Seed census` — those are the rows § What Pass 1 writes says cite no
  heading at all. **Both committed ledgers already satisfy it**: `parsons` =
  `045`–`047`, its three lister-4 clusters; `writeme` = **empty**, because
  `WritemeLens` has 0 orphans. Publish the derivation and never the number —
  `writeme` already contradicts any threshold.

**Mutation-test every changed line before trusting the gate, not one of them.**
Publishing this check on five plants is how it shipped without a floor. All
thirteen below were planted one at a time in a `/tmp` scratch copy and each
confirmed to fire [all measured 2026-08-18]:

| mutation                                            | expected                                                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| run it against **this template**                    | `rows=0 parsed=0` — the specimen ids are `` `<lens>-001` `` and `<` is outside the id class. Without the census: total silence |
| fabrication whose filename carries a path           | that id under **both** `MALFORMED-CITATION (0 of 1 leads parse)` and `NO-CITATION`; `parsons` nocite 3 → **4**                 |
| fabrication omitting the `§`                        | the same pair                                                                                                                  |
| baseline `NO-CITATION` set, nothing planted         | `parsons` = `045`,`046`,`047`; `writeme` = none                                                                                |
| fabrication **beside** a good citation, path form   | `MALFORMED-CITATION (1 of 2 leads parse)`; nocite **stays 3** — the floor alone is blind here, which is why `lead` exists      |
| fabrication **beside** a good citation, no-`§` form | the same                                                                                                                       |
| `lead` false-positive gate, both clean ledgers      | **0** rows where `lead > cited`. **Gate publication on this**                                                                  |
| `REF=NONE` with a well-formed Gen-2 citation        | `UNEXPECTED-CITATION`                                                                                                          |
| `PORT=NONE` with a well-formed Gen-3 citation       | `UNEXPECTED-CITATION`. Under the pre-amendment form: **silent**                                                                |
| `REF=NONE PORT=NONE` on a 4-row fixture             | no per-row `NO-CITATION` spam; census carries `rows=4 parsed=1 nocite=3`                                                       |
| member filter, `MEMBER=<slug>`                      | per-member `rows=` sums to the whole-ledger `rows=` — 2 + 1 + 1 = 4                                                            |
| member filter with one marker deleted               | the sum falls **short** (3 of 4) and the preflight names `UNMARKED-ROW`                                                        |
| `norm()`'s fragment-targeted bracket clause         | an escaped **path** link → `DIVERGENT`; `writeme-006`'s escaped **fragment** link stays clean                                  |

Four more rows, each added because a reviewer broke the check in that exact
place [all measured 2026-08-18]:

| mutation                                                                      | expected                                                                                 |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **modification 4** — backticks laundered onto a prose quotation               | `DIVERGENT`. The row whose absence made the amendment gate blind; see below              |
| a fabrication citing a **non-`.md`** file (`types.ts`) beside a good citation | `MALFORMED-CITATION (1 of 2 leads parse)`. Under a `.md`-only `lead`, **no line at all** |
| the row pattern matches nothing — wrong path, wrong `MEMBER`, moved prefix    | `FAIL: zero rows matched`, **exit 1**. A `CENSUS` line alone is a report, not a floor    |
| Family F preflight, marker misspelled into a **shape-valid** slug             | `UNMARKED-ROW`. Under a `[a-z][a-z-]*` character class it was **silent**                 |

### The amendment gate — the two clean regressions are NOT it

`writeme` must still report exactly `writeme-019 UNQUOTED (1 of 2 cited)` with
**0 divergent**, and `parsons` **0 divergent** [measured 2026-08-18]. Necessary,
and **nowhere near sufficient** — an earlier revision published them as the
whole gate.

⚠️ **A zero baseline cannot detect a loosening.** Both regressions sit at 0
divergent, so widening `norm()` leaves 0 at 0. AR-2 performed the exact widening
§ Normalising is not the same as being blind forbids — adding a clause that
ignores backticks, which hides modification 4 by name — and **both published
regressions came back byte-identical** [measured 2026-08-18]. A future author
could make that edit, pass every gate this section published, and cite the
`lead` bullet's _"adding a looser counter is the opposite of widening"_ as
licence.

**So the gate is the mutation corpus, not the regressions.** After any change to
`norm()`, `unwrap_markup()`, `firstblock`, `glossterm`, `parsed`, `cited` or
`lead`, **every row of both tables above must still fire**, and then the two
regressions must hold. (`firstblock` and `glossterm` are named because they
supply half the comparison and are pasted in from another section, so editing
them does not look like editing the check.) The modification-4 row exists
because its absence is what let one widening through: published `norm()` →
`parsons-001 G2 DIVERGENT`, widened → silent.

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
