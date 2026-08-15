<!-- TRANSITIONAL — the skeleton every per-lens ledger is cut from. Copy it to
`<lens>.md`, fill it, and delete nothing structural. It retires with SPEC.md. -->
<!-- cspell:ignore socratize reenrichment dropdowns writeme parsons colorizing blankenate -->
<!-- cspell:ignore colour distractor distractors ledgered throughs unrebutted -->
<!-- cspell:ignore firstblock orphanclusters oldd clauding -->
<!-- cspell:ignore gsub RSTART RLENGTH -->

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
this template in exactly three ways and no others:

- **Seven `## Reference inventory` blocks**, one per member, each with its own
  `REF=` (or its own Gen-1 file pair), its own Gen-1-source line, and its own
  `instruments` value — they are not uniform, and one member has none at all.
- **Row ids are `fam-f-NNN`**, one namespace across the whole ledger. The member
  is named in the `affordance` cell, not in the id — a reader seeing `fam-f-012`
  must be able to tell which ledger to open, which a per-member prefix defeats.
- **`trace-debugging` has no runnable lister**
  ([SPEC.md § Roll-up](../SPEC.md#roll-up)). Its rows come from Pass 2 — a
  whole-file read of its Gen-2 documents — and its inventory block says so, so a
  thin result reads as an instrument limit rather than as a finding.

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

<!-- 1–5 · 1–5 (1–3 ref→src) · 4,5 — and say which, so a thin ledger below reads
     as an instrument limit rather than as a clean bill of health -->

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

A lens with no Gen-1 file writes the literal words
`no Gen-1 source: <lens> has no Gen-1 file` once, here, and both listers report
`n/a`.

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

⚠️ **Two limits, both of which must be recorded in this section rather than
discovered later:**

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
  grep -n 'styles\[' "$JSX"                                  # computed access
  awk '{print $2}' <orphan list> | grep -E '\-'              # kebab-case orphans
  ```

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
[measured 2026-08-15: both forms run against `annotate/DOCS.md`]. It escapes `|`
for the table cell, which is the one permitted transport modification.

**`UNSETTLED` is how a partial provenance set stays visibly partial.** No lister
reads both sides of R-2's union — listers 1–3 compare document sets, 4 and 5
read one Gen-1 file — so Pass 1 can witness only the tags its own instrument
saw. The marker is a positive token rather than a blank or a dash, because the
difference between an empty cell and an answered one is this ledger's whole
subject. One per row: a row with none has claimed a settled set. It is a close
condition.

| seed class                          | may witness at Pass 1              | never                       |
| ----------------------------------- | ---------------------------------- | --------------------------- |
| lister 1/3 heading or glossary term | `G2-doc`; `G3` where a port exists | `G1-*`, `G2-code`           |
| lister 4 orphan cluster             | `G1-dead`                          | any `G2-*`, `G3`, `G1-live` |
| lister 5 channel B                  | `G1-dead`                          | any `G2-*`, `G3`, `G1-live` |

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

`## Design owed` on a `revive` row is an **inline bolded label on its own line
under the row**, never a heading — two `revive` rows in one ledger would
otherwise collide under `MD024 siblings_only` and the pre-commit hook would
block the commit.

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

```bash
L=.planning-handoffs/lens-migration/ledgers/<lens>.md
grep -c '^| `<lens>-[0-9]\{3\}`' "$L"   # row count — must match the census and the id range
grep -c 'UNSETTLED' "$L"                 # must EQUAL the row count
grep -c 'PASS 1 — SEEDED' "$L"           # 1 — the banner
grep -c '| — |' "$L"                     # 0 — an em dash is not a value
grep -cE '\*\*`(walked|found)`\*\*|Design owed' "$L"                  # 0 at Pass 1
grep -cE '`(restore|supersede|drop|revive|already survives)`' "$L"    # 0 inside ## Rows
```

Then, per row, every heading token in `evidence` must `resolve` to exactly `1`
against the **source file**, not against the inventory — a mis-transcription
copied into both passes a check that compares them to each other. Use
[§ The minimum walk set](../FIDELITY-METHOD.md#the-minimum-walk-set)'s helper
and **not `grep -E`**: five of the six `does NOT do` headings carry a
parenthetical and one carries a `+`, so the regex form returns 0 on exactly the
class this rule exists for.

The conditions below are for **campaign close**, not for the seeding commit.

- **Every** row has a non-empty `discharged by` that **resolves** — on any
  disposition (human ruling 2026-08-14);
  [§ At AR-5](../FIDELITY-METHOD.md#at-ar-5) is the single definition.
- **No `UNSETTLED` survives.** `grep -c 'UNSETTLED' <ledger>` → 0. Until it is
  zero, an unsettled provenance set can reach AR-5 dressed as a settled one, and
  no gate check would see it.
- **The pass banner has been replaced**, not merely outgrown —
  `grep -c 'PASS 1 — SEEDED' <ledger>` → 0.
- **Open rows = 0**, under § At AR-5's single four-part definition — which
  includes an empty `walked` or `found` on any row those columns are required
  on, and an unrebutted quotation on a `revive` row.
- Every `restore — DEFERRED` row names an owner **and** a ruling, and the ruling
  resolves as a heading in the reference it cites.
- Pass 3's counter-ledger has been run and can no longer answer either question
  ([§ Pass 3](../FIDELITY-METHOD.md#pass-3--the-counter-ledger)).
- This lens's row in [SPEC.md § Roll-up](../SPEC.md#roll-up) has no blank cells.
