<!-- TRANSITIONAL — the skeleton every per-lens ledger is cut from. Copy it to
`<lens>.md`, fill it, and delete nothing structural. It retires with SPEC.md. -->
<!-- cspell:ignore socratize reenrichment dropdowns writeme parsons colorizing blankenate -->
<!-- cspell:ignore colour distractor distractors ledgered throughs unrebutted -->

# `<lens>` — fidelity ledger

Method: [FIDELITY-METHOD.md](../FIDELITY-METHOD.md), read in full before the
first row. Scope and disposition: [SPEC.md](../SPEC.md).

**Row ids are stable forever.** Append; never renumber, never re-sort. Handoffs
cite these ids, and a renumber silently re-points every citation.

---

## Reference inventory

Pasted from one run, not retyped — this is what `walked` is checked against, so
a reviewer's "what was skipped?" is a set difference against a printed list
rather than a re-derivation.

```bash
REF=src/lib/study-lenses--deprecated-architecture/lenses/<lens>
for f in README.md DOCS.md; do echo "== $f"; grep -nE '^#+ ' "$REF/$f"; done
echo "== types.ts"; wc -l "$REF/types.ts"
grep -nE '@remarks|^type |^\s+readonly ' "$REF/types.ts"
```

<!-- paste the output here, verbatim -->

**Gen-1 source**, for the provenance negative every non-G1 row owes
([§ The exemption needs evidence too](../FIDELITY-METHOD.md#the-minimum-walk-set)):

<!-- either the Gen-1 file pair, or the literal words:
     no Gen-1 source: <lens> has no Gen-1 file -->

**Instruments that could run**, matching this lens's row in
[SPEC.md § Roll-up](../SPEC.md#roll-up):

<!-- 1–5 · 1–5 (1–3 ref→src) · 4,5 — and say which, so a thin ledger below reads
     as an instrument limit rather than as a clean bill of health -->

---

## Rows

Columns and their rules: [§ Columns](../FIDELITY-METHOD.md#columns). **The order
below is frozen** — eight ledgers are read side by side.

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

<!-- specimen — delete when the first real row lands:

| `<lens>-001` | The learner can … | `G1-dead` + `G2-doc` | Gen-1 `XxxLens.jsx`: … ; Gen-2 `README.md` § …: _"…"_ | **`revive`** | README § … · test _"…"_ | `P0` → `P1:<increment>` |
|              | **`walked`** — against § Reference inventory. **drops:** … **future:** … **out of scope:** … **naming:** `empty`. **named decision:** … **contract:** … **glossary:** … **type contract:** `types.ts` read in full. | | | | | |
|              | **`found`** — **drops:** _"…"_ **out of scope:** _"…"_ **future, naming, named decision, contract, glossary, type contract:** nothing bearing on this row. | | | | | |
|              | **`## Design owed`** — what must be decided before it can be built. | | | | | |

-->

---

## Close conditions

- Every `restore` and `revive` row has a non-empty `discharged by` that
  **resolves** ([§ At AR-5](../FIDELITY-METHOD.md#at-ar-5)).
- **Open rows = 0**, under § At AR-5's single four-part definition — which
  includes an empty `walked` or `found` on any row those columns are required
  on, and an unrebutted quotation on a `revive` row.
- Every `restore — DEFERRED` row names an owner **and** a ruling, and the ruling
  resolves as a heading in the reference it cites.
- Pass 3's counter-ledger has been run and can no longer answer either question
  ([§ Pass 3](../FIDELITY-METHOD.md#pass-3--the-counter-ledger)).
- This lens's row in [SPEC.md § Roll-up](../SPEC.md#roll-up) has no blank cells.
