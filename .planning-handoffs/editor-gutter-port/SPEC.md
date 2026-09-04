<!-- TRANSITIONAL — campaign scaffolding for the editor/gutter port. Deleted when
the campaign completes; git history retains it. Never a durable source of truth —
the end-state docs are. -->

# Editor support + gutter symbols — campaign SPEC

Plan of record: `~/.claude/plans/your-task-is-to-abundant-aho.md`.

## ⛔ Execution gate

**Only Phase 0 steps 0.b–0.d have run.** Steps 0.1 onward are blocked until the
human holds the `orchestrate-ux` 0.2-close review (human ruling R6, 2026-09-02;
re-affirmed 2026-09-03 with the collision table in hand).

Re-check before proceeding: `.planning-handoffs/orchestrate-ux/RESUME.md` must
no longer read _"THE NEXT ACTION IS THE HUMAN'S 0.2-CLOSE REVIEW"_.

## Baselines — measured 2026-09-03, re-measure at unblock

| fact                     | value                                                                                                                                                                     | evidence                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| HEAD                     | `b98e746b184c469a1a9f88bf8c04f1d548562fa9`                                                                                                                                | `git rev-parse HEAD`                                                           |
| node                     | v20.11.0, **below** `engines >=22.11.0`                                                                                                                                   | `node --version`                                                               |
| tsc errors               | **13**, in `embody/…/aithor/` (9) and `study-lenses/lib/local-llm/` (4) — **none on the editor path**                                                                     | `npx tsc --noEmit \| grep -c "error TS"`                                       |
| greenfield failing tests | **1 file / 1 test** — `study-lenses/lib/local-llm/tests/feasibility.test.ts > an unknown model id does not throw`. 185 files pass, 5003 tests pass.                       | `npx vitest run --project unit src/lib/study-lenses/`                          |
| quarry failing tests     | **5 files**, all under `embody/` (aithor ×2, trace/variables ×2, embody-trace-variable-lifecycle) — **none in the six ported packages**. 151 files pass, 3463 tests pass. | `npx vitest run --project unit src/lib/study-lenses--deprecated-architecture/` |
| foreign dirty files      | **42** across ~6 peer campaigns                                                                                                                                           | `git status --porcelain \| wc -l`                                              |

⚠ HEAD moved three times during the planning session (`dd8b85cb` → `3a8eb19b` →
`b98e746b`). Every worker brief carries the foreign-dirty list, or a worker
reads a peer's edit as its own breakage.

## The generations

| gen    | where                                                                                      | standing                                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| QUARRY | `src/lib/study-lenses--deprecated-architecture/`                                           | **READ-ONLY. Copy, never modify.** _"read-only quarry now — never edit it, copy from it if needed"_ [read: `src/theme/MDXComponents.js:5-9`] |
| TARGET | `src/lib/study-lenses/orchestrate/editor/` and `src/lib/study-lenses/language-levels/jej/` | the contract                                                                                                                                 |

Six ported packages: `orchestrate/lib/editing/`,
`orchestrate/lib/error-interpreting/`, `lib/linting/`, `lib/documenting/`,
`lib/completing/`, `lib/formatting-editor/`. 41 non-test source files.

## Why this ledger exists, and what is adopted

**The obligation already binds — no adoption ceremony.**
`DEV.md § Documentation migration discipline` reads _"When moving, splitting, or
restructuring documentation **(or any authored artifact)**, content transports
**verbatim by default**"_. Source code is an authored artifact.
`lens-migration/SPEC.md:513`
(`editor | **excluded** — not a lens; it belongs to the orchestrator`) removes
the editor from **that campaign's scope**; it cannot exempt it from `DEV.md`.

**What IS adopted, named as such:**

- from `.planning-handoffs/evaluators-api-restoration/LOSS-LEDGER.md` (the
  **ratified code parent**, human ruling 2026-08-06): the column set
  `member | classification | rationale | evidence`, and the disposition
  vocabulary.
- from `lens-migration/FIDELITY-METHOD.md` (the **prose fork** of that parent):
  the three-pass discipline, the `walked`/`found` columns, the
  list-never-a-count rule, and the gate ordering.

`FIDELITY-METHOD` is downstream of the code ledger, not upstream: [read:
`FIDELITY-METHOD.md` § Disposition vocabulary — *"Adopted from the evaluator
public-API restoration campaign's ratified set (their HR-4), plus exactly one
addition"*].

## Dispositions

`restore` (the default) · `supersede` (**requires the quoted greenfield
sentence**) · `restore-as-doc` · `already survives` · `ADDITION` · `drop` /
`drop-as-loss` (**human sign-off, never an agent's**) ·
`restore — DEFERRED (<owner>, <ruling>)` · `revive` (dead-or-test-only quarry
code; mandatory bolded `**Design owed**` line) · `re-home` (the capability
survives but changes owner; **must name both the losing and the gaining file**).

`policy` is a **column** (`named | inline | n/a`), not a disposition.

## The census — what Pass 1 asserts against

### C1 · exported-symbol survival — THREE arms, and the third was missing

**CENSUS = 59 named symbols** [measured 2026-09-03 over the 41 source files].

- arm 1, behavior files (`^export default function`): **22**
- arm 2, value files (`^export default NAME;`): **16**
- arm 3, named exports: **21**

⚠ **Arm 3 needs two forms, and the published one-line regex returns 2 of 21.**
Two of the three `types.ts` files export through a trailing block:

```text
orchestrate/lib/editing/types.ts:269          export type {
orchestrate/lib/error-interpreting/types.ts:96 export type {
```

`^export (type|const|interface) NAME` matches neither. A prior design pass
published "19 type members"; the measured figure is **21**, and its lister would
have found **2**. The block arm is mandatory.

⚠ **Arm 2 is what a one-arm lister loses**, and it is the entire pedagogical
payload: `DOC_TABLE`, `NOT_IN_JEJ_ENTRIES`, `EXPLANATIONS`, `KEYWORDS`,
`CURATED_MEMBERS`, `SUPPRESSED_GLOBALS`, `interpretedDiagnosticsField`,
`setInterpretedDiagnosticsEffect`. It exists because [read:
`AGENTS.principal.md` § Critical Conventions — *"Constant files keep `const NAME
= …; export default NAME;` — the bottom name-export marks a value file, the top
inline export marks a behavior file"*].

### C2 · table-entry survival — PARSE, never grep

**85 doc-table entries**: keywords 16 · globals 16 · members 28 · not-in-jej 25.

⚠ The grep form returns **84**. Measured, both forms, 2026-09-03 — the two keys
it loses are named so no future reader "simplifies" the parse form away:

```text
'=>'              not-in-jej.ts   (quoted key)   — the arrow-function explanation
['__proto__']     not-in-jej.ts:205 (computed key)
```

`'=>'` is the entry `lint-jej.ts:104` already mis-routes (see the `revive`/fix
row). Losing it silently would erase the evidence of its own bug.

Also: `EXPLANATIONS` = 20 patterns.

### C3 · test-title survival — this replaces byte-identity

**20 test files · 288 `it()`/`test()` · 270 unique titles · 336 `expect()`**
[measured 2026-09-03; scope includes `orchestrate/editor/tests/`].

Titles carry ZOMBIES labels verbatim and are directly re-assertable, e.g.
`Boundaries — post-destroy: onChange does not fire on dropped setter writes`.

**A quarry test title that no ported title covers is an OPEN row.** Adjudicated
per-title in Pass 2 — some titles are _about_ the deleted position-conversion
layer and correctly do not port. **270 is a universe, not a target.**

### C4 · policy-in-control-flow — a LIST, never a count

13 lines listed 2026-09-03, and **that number is not a finding**: a numeric-
literal arm of the same lister returns ~47, mostly CSS noise. No single
instrument yields a true total. [read: `FIDELITY-METHOD` § Channel A — *"A count
here is false precision, and false precision in an audit is worse than an
admitted gap"*]. The list is seeded into `LEDGER.md` as `policy: inline` rows.

### Every lister carries a floor

`[ "$n" -gt 0 ]` — **exit 1 when it matches nothing**, and refuse when any cited
quarry file does not resolve. Mutation-tested 2026-09-03: run against an empty
input the C1 arms print `0` and **exit 0**. A census reports; a floor refuses
[read: `_TEMPLATE.md` § The transport check].

## The four supersede-authorizing quotations — captured verbatim

Captured now because all four live in files `orchestrate-ux` 0.3 will rewrite.
R-2 demands _the words, in the document, in quotation marks, in the row_.

**Q1** — `src/lib/study-lenses/orchestrate/editor/README.md` § Diagnostics are
supplied, never derived:

> The editor ships no validator. Every diagnostic it renders — the
> selected-level gutter's markers included — arrives orchestrator-supplied, fed
> exclusively from the region's one memoized validate. This is the double-parse
> guard: nothing in the editor parses the program for judgment; CodeMirror's own
> tokenizer highlights syntax and does nothing more.

→ supersedes the whole `linters: LinterCallback[]` PULL architecture.
`lint-jej.ts:37` calls `validate(code)` itself; that is the second parse this
sentence forbids.

**Q2** — `src/lib/study-lenses/language-levels/types.ts:118-123`:

> Editor-support data in three channels — completion, hover, format — consumed
> by the one generic editor adapter when the level is selected. The channels'
> inner shapes belong to that adapter's contract; a level ships data, never
> editor code. Lint diagnostics are NOT here: they are a presentation adapter
> over the same validate result, never a second validation source.

→ the same ruling from the level side, independently.

**Q3** — `src/lib/study-lenses/orchestrate/editor/lib/create-editor.ts:78-85`:

> v1-trimmed surface: minimalSetup + line numbers + bracket matching + JS syntax
> highlighting + the editing affordance, and nothing more. NOT basicSetup — it
> bundles autocompletion, whose popup would reach the learner outside the
> adapter-only completion rule (completion arrives exclusively through the level
> adapter; see ../README.md § The level-adapter seam). CodeMirror's tokenizer
> highlights; it never judges — diagnostics arrive orchestrator-supplied.

→ ⚠ **Human ruling R1 OVERRIDES this one** (_"baseline rich, levels can either
add new layers or gutter info or extend/overwrite existing ones"_). The row
records the override against the quoted sentence; it does not pretend the
sentence is absent.

**Q4** — `src/lib/study-lenses/lib/screening/types.ts:97-101`:

> Offsets, not line/column. Every parsed node carries them unconditionally, so a
> violation's range is always constructible from a parsed tree alone, while a
> line/column range would depend on a parse option no caller is compelled to
> set. A consumer wanting line/column holds the source and counts; screening
> never converts, having no source text of its own.

→ supersedes `positionToOffset` (`lint-jej.ts:120-134`). ⚠ **It RELOCATES who
computes line/column; it does not delete them.** All 20 `EXPLANATIONS` patterns
embed `{{line}}` in authored prose. A worker reading Q4 as a mandate to strip
`{{line}}` commits the single largest silent loss available in this port. That
is a `re-home` row, never a rewrite of the prose.

## Rulings of record

- **R-A · Gen-2 is a floor, not a ceiling** (inherited from
  `lens-migration/SPEC.md` R-2). Quarry code that is dead or defective but
  carries good learner intention is **ported and fixed**, not inventoried as
  lost. A `supersede` needs the quoted sentence; an agent may never invoke it on
  its own reading of "the greenfield seems better".
- **R-B · No boundary edit into `orchestrate-ux`.** This campaign does not edit
  `orchestrate/editor/README.md`, `orchestrate/editor/DOCS.md`, or
  `orchestrate/types.ts` — settled receipt sites for rows A1/A2/D6/G7 and 0.3's
  primary deliverable. Corrections are written as boundary rows naming
  `orchestrate-ux` as recipient, closed by a commit in its tree citing the row
  id.
- **R-C · Rows A14 and G7 bind.** The gutter is class 1, travels with the
  editor, is annotated for the selected level only, and does not render in the
  band. Settled 2026-08-19. These are obeyed, never designed.
- **R-D · The census is a universe, not a target.** 59 symbols, 85 table keys,
  270 test titles. A row per non-arriving member, adjudicated — not a
  completeness score.

## Settings line

```text
work: software · twin-doc: user · ceremony: full · prospective
```

L1 (the frozen-data transport) only:
`ceremony: full (AR-3 n/a · AR-4 n/a — frozen-data transport, docs-only precedent 2026-07-30, followed 2026-08-05)`.
