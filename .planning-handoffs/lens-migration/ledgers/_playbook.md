<!-- TRANSITIONAL — the omission record for the playbook's retirement. It travels
with the transported content and retires with SPEC.md. -->
<!-- cspell:ignore socratize socratizing reenrichment lezer dropdowns writeme parsons colorizing Gateable jsdom parse-old blankenate -->
<!-- cspell:ignore colour distractor distractors ledgered throughs reloadable ordinally -->

# `MIGRATION-PLAYBOOK.md` → `SPEC.md` — transport loss ledger

Per `DEV.md § Documentation migration discipline`: the transport of
`src/lib/study-lenses/lenses/MIGRATION-PLAYBOOK.md` (571 lines) into
[SPEC.md](../SPEC.md) is **verbatim by default**; every omission, merge, reword
or replacement is enumerated here with its justification.

**Method.** A heading-by-heading walk over all 22 of the playbook's headings
[measured: `grep -n '^#\{1,4\} '`], with the file read end to end this session.
Not from recollection — the socratize-quiz campaign's AR-1 rejected a
recollection-built ledger, and that precedent binds here.

**Why the playbook retires rather than sitting beside the SPEC.** Two control
panels is how stale facts survive: the playbook currently instructs agents that
`built-in-lenses.ts` is `[]` "today", when it has held three lenses since
`47234d7c`. Its own banner says it is transitional and should be deleted when
the migration completes; this campaign _is_ that migration, so it retires now,
into its successor.

**Vocabulary.** Same closed set as every ledger in this campaign
([FIDELITY-METHOD.md](../FIDELITY-METHOD.md#disposition-vocabulary)), with the
transport senses: `restore` = transported, `supersede` = replaced by a ruling or
a measurement, `drop` = omitted with sign-off, `already survives` = the content
lives elsewhere unchanged.

---

## By heading

### Title + preamble (lines 1–17)

**OMITTED.** Session framing — "This is your control panel for the week", "It's
written to _you_ — the person sequencing the work", and the week-shaped scope.
The `<!-- TRANSITIONAL -->` banner is reproduced in spirit at the top of
SPEC.md. The verification date line ("Verified against live code 2026-07-22; the
E1 re-source inventory … re-measured 2026-07-30") is **superseded**: every
number in SPEC.md was re-measured 2026-08-13, and carrying a stale verification
date forward would be worse than carrying none.

### `## Context & paths (agents read this first)`

**TRANSPORTED** into SPEC.md § Paths, with four changes, each recorded:

- The path-convention paragraph (bare region refs resolve under
  `src/lib/study-lenses/`; `study-lenses--deprecated-architecture/` refs are
  relative to `src/lib/`) — **transported verbatim in substance.**
- The Gen-1 absolute path — **transported verbatim.**
- Rows dropped as no longer addressed by this campaign: _Tracer (copy A)_,
  _Tracer handoff notes (Stream E)_, _Engine / evaluators_. **`drop`** — Stream
  E is void and the evaluator region belongs to the restoration campaign. The
  tracer paths survive in that campaign's own artifacts.
- Row **added**: `lib/colorizing/` (to be built), and `lib/scoping/` beside the
  scope fact. **`ADDITION`.**
- The _Coloring input_ row pointed at `study-lenses/embody/types.ts` (`Tokens`,
  `Environment`). **`supersede`** — R-1 makes the semantic producer's input
  `lib/classifying`, not raw tokens. SPEC.md's row names both.
- "Every path above was confirmed present 2026-07-22" → re-measured 2026-08-13.

### `## The situation in one screen`

**TRANSPORTED** into SPEC.md § The three generations, and **enriched**: the
playbook's table said what each generation is "used for"; SPEC.md's says what
each is _authoritative for_, which is the distinction R-2 turns on.

The four **locked decisions** each get their own disposition:

1. _"coloring = a shared facts-driven read-only highlighter — EXCEPTION:
   socratize stays un-colorized"_ — **`supersede`** by R-1 for the mechanism (it
   is now three producers with a semantic default and a Prism fallback, and it
   is not read-only-only). **The socratize exception is `restore`d verbatim**
   and restated in SPEC.md § Standing exclusions with its ruling reference.
2. _"quiz + socratize are EXCLUDED (owned by the socratize-quiz campaign)"_ —
   **`restore`**, and strengthened: SPEC.md additionally carries their R-4a
   (quiz coloring is theirs to rule) which the playbook did not know about.
3. _"four static ports — blanks, annotate, variables, dropdowns"_ —
   **`supersede`** by R-4 and R-6: the port set is blanks, dropdowns, annotate,
   variables, plus parsons and writeme as the landed cohort; `print` is dropped.
4. _"trace-debugging is IN, as an independent stream"_ — **`supersede`**;
   already void in the playbook's own Stream-E block, and Family F is
   ledger-only.

### `## What you're shipping this week`

**Structure OMITTED** — the week framing, the "Foundation / Four static ports /
Stream E / (If time) Wave 2" shipping list, and its Mermaid diagram. SPEC.md's
own DAG replaces the diagram and is not a redraw of it: two of the playbook's
subgraphs are void and its Wave-1 nodes are now families.

**Live residue TRANSPORTED:**

- _"Wave 2 — print, markdown-shell, parsons chip-coloring backfill"_ — the
  **parsons chip-coloring backfill survives** as Family C work; `print` is
  **`drop`**ped by R-6 with a boundary row; `markdown-shell` is **`drop`**ped as
  refused by the snippet contract, also with a boundary row.
- **§ Coordination read** — its Wave-1 clauses (Foundation gates the ports; the
  ports are independent of each other; fan them out in parallel) are
  **transported** into SPEC.md § Sequencing and gates, corrected by measurement:
  roughly half the campaign does **not** wait on the foundation, which the
  playbook did not distinguish. Its Stream-E clauses are void by its own text.
- **The ⛔ Stream-E supersession block** (E1 superseded / E3 re-gated / E2
  partly discharged, human ruling 2026-08-11) — **`already survives`**: the
  ruling is the evaluators campaign's, recorded there. SPEC.md § Standing
  exclusions points at it rather than restating a ruling it does not own. The
  one fact this campaign _does_ carry forward is E2's live residue —
  **production COOP/COEP is still open; the configured headers are dev-server
  only** — because a future Family F build will hit it.
- **§ Dispatch discipline** — _"never dispatch a downstream agent before its
  upstream has MERGED"_ — **`restore`d** in substance as SPEC.md's gate ordering
  and the two-tier handoff contract.

### `## The contract every lens must hit (your acceptance yardstick)`

**TRANSPORTED essentially verbatim** into SPEC.md § The contract every lens must
hit — the `Lens` type sketch, the directory shape, the authoritative-references
list, and the phase assignments.

Two changes: the phase list is extended for the campaign's actual port set
(dropdowns → `source`), and the trace-debugging phase assignment is
**`drop`**ped as belonging to a ledger-only family. The playbook's `Facts`
one-liner comment is transported.

**`ADDITION`:** SPEC.md notes that a lens has no `index.ts` — the entry point is
`index.tsx`. The playbook's directory line implied it; a cold reader misread it.

### `## Golden rules to enforce (reject work that breaks these)`

**All seven TRANSPORTED**, three with amendments marked _in place_ so a reader
sees both the original rule and what changed:

- **Rule 1** (porting ≠ shipping) — amended: the roster is no longer empty, so
  joining it is an append, and the sandbox harness must not also inject a lens
  the roster now provides or `joinLensRoster` throws duplicate-name at mount.
  That mechanism detail is **transported from the playbook's own 0b prompt**,
  where it was buried.
- **Rule 4** (coloring shared and facts-driven, no Prism) — **`supersede`** by
  R-1. Prism is deliberately retained as the no-parse fallback.
- **Rule 6** (no retired vocabulary) — amended: the playbook said "no committed
  banned-terms file exists — confirm the current set with the maintainer (0c can
  pin it)". **Still true** [measured 2026-08-13: no such file in the tree], so
  SPEC.md names the contract-delta table as the working list and instructs
  family sessions to extend it. Recording that the gap persists is the honest
  disposition; silently promoting the delta table to "the" list would not be.
- Rules 2, 3, 5, 7 — **`restore`** verbatim in substance.

### `## FOUNDATION (do first)` — `### 0a`, `### 0b`, `### 0c`

- **0a — facts-driven read-only highlighter (`lenses/lib/`).** **`supersede`.**
  Its _goal_ survives and grew; its **placement is wrong** and this is a
  measurement, not a preference: ESLint zone 2c forbids `orchestrate/**` from
  importing `lenses/lib/**`, and the orchestrator's editor is a third
  colorization consumer via `minimalSetup`'s `defaultHighlightStyle`. The
  playbook could not have known — 0a predates that consumer being counted. Its
  DoD line _"consumed by at least one lens in a smoke test"_ is transported and
  strengthened into the cross-producer equivalence test plus a preview page. Its
  agent prompt is **`drop`**ped in favour of `handoffs/foundation.md`.
- **0b — roster wiring + policy.** **`already survives`** — executed.
  `built-in-lenses.ts` exports parsons, writeme and debug-props [read]. Its one
  unexecuted half, **the built-in roster policy** (which lenses ship by default
  versus mount only by injection), is **`restore`d as an open question** into
  Family C's handoff, since that family owns the landed cohort. Its prompt is
  dropped as executed.
- **0c — porting checklist.** **`supersede`** by
  [FIDELITY-METHOD.md](../FIDELITY-METHOD.md) plus SPEC.md § The two handoff
  tiers, which together cover more than the one-page checklist it asked for. The
  **contract deltas** it was to bake in are **transported verbatim in
  substance** into SPEC.md § Contract deltas, plus one delta the playbook did
  not carry: **`URLManager` config sync is relocated, not deleted.** An earlier
  draft of this row classified it `ADDITION` from a Gen-1 reading; that was
  wrong — Gen-2 had already ruled on it, and more richly. Corrected disposition:
  **`restore — DEFERRED (orchestrator, Gen-2 blanks DOCS § Why drop URL config sync)`**,
  carrying the sentence _"URL coordination (shareable / reloadable exercise
  settings) is properly orchestrator-domain; if it lands later it belongs to the
  orchestrator's URL-state surface, with this lens still reading the resolved
  values through its `config` prop"_. A lens holds no URL or `localStorage`
  channel; the capability is deferred, not gone.

### `## WAVE 1 — the four static ports`

The four **source/target/dependency/DoD** entries are **transported** into
SPEC.md's family sections, redistributed: blanks and dropdowns into Family A,
annotate into Family B, variables into Family D.

The four **agent prompts** are **`drop`**ped. Each is superseded by a two-tier
handoff that carries strictly more — measured inventories, the ledger, the ruled
cross-lens decisions, named sandbox checkpoints, and foreign-debt baselines.
Their load-bearing content is not lost; specifically transported:

- blanks: the `lib/` engine names (`blankenate`, `evaluate-correctness`,
  `no-paste-extension`), the `lib/classifying` dependency, CodeMirror for the
  editable surface, and _"the load-bearing pedagogy (NOT a shell)"_.
- annotate: the `prism-react-renderer` → shared-coloring instruction
  (**`supersede`**d in mechanism by R-1, which keeps Prism as the fallback), the
  `js2flowchart` retention, and the **injection-safety constraint — never pass a
  debug-mode print config**, which is transported into SPEC.md § Family B as a
  named constraint rather than left in a prompt.
- variables: _"do NOT re-run scope analysis — the fact holds it, with
  positions"_, and the `Scope`/`ScopeVariable`/`ScopeReference`/`resolved` shape
  pointer.
- dropdowns: _"classify from `facts.tokens`, do not re-tokenize"_, distractors,
  and a difficulty control.

The **annotate decision-to-make** — adopt `js2flowchart` for the flowchart or
defer the flowchart and ship colored-view-only first — is **`restore`d** as an
open question into Family B's handoff.

### `## STREAM E` — `### E2`, `### E1`, `### E3`

**`drop`**ped in full, including all three agent prompts. The playbook itself
marks each ⛔ SUPERSEDED with a human ruling of 2026-08-11 and says "do not
dispatch". Carrying void prompts into a successor is how a superseded
instruction gets executed by a reader who skims the banner.

Two facts inside them survive and are transported, because they are measurements
rather than instructions:

- **E2's residue** — webpack worker-chunk emission is proven live by
  `src/pages/trace-debugging-smoke.tsx`, but that path imports the
  deprecated-architecture engine copy, not `study-lenses/lib/engine`; and
  **COOP/COEP is configured for the dev server only**, so production isolation
  is open. → SPEC.md § Family F.
- **E3's warning** — the Gen-2 trace-debugging projections are written against
  the OLD tracer shape (`event.event`, five outcomes) and will not lift
  verbatim. → a Family F ledger row, so the rebuild's consumer does not
  rediscover it.

E1's detailed re-source inventory (11 non-engine imports over 8 names across
`scope/`, `validating/`, `parse-old/`) is **`already survives`** — it is the
evaluators restoration campaign's material, tracked there as ScopeAnalysis
re-homing.

### `## Definition of Done — apply before you accept any lens`

**TRANSPORTED** into SPEC.md § Definition of Done, with the Stream-E bullet
**`drop`**ped (marked ⛔ VOID in the playbook itself) and four `ADDITION`s from
this campaign's rulings: coloring through the foundation rather than "0a or
CodeMirror"; `## What this lens does NOT do` present and complete (R-5); ledger
open rows = 0; and the sandbox reachability check spelled out as a command and a
page rather than named in passing.

### `## Open questions to settle as you go`

Five questions, each with its own disposition:

1. **E1's scope + node-path source** — **`already survives`**; the playbook
   already marks it ⛔ VOID as a dispatch gate and hands the question to the
   restoration campaign's P0-V.
2. **Built-in roster policy (0b)** — **`restore`d** into Family C's handoff (see
   0b above).
3. **quiz/socratize boundary** — **`restore`d** into SPEC.md § Standing
   exclusions, and _answered_ rather than left open: the boundary is confirmed
   against that campaign's SPEC, including their R-4 and R-4a.
4. **annotate deps (flowchart now or later)** — **`restore`d** into Family B's
   handoff.
5. **Tracer cap (`seconds` vs `iterations`)** — **`already survives`**;
   evaluator-region material.

### `## Source pointers (all verified 2026-07-22)`

**MERGED** into SPEC.md § Paths, which is the same content at greater precision.
The date is **superseded** by re-measurement 2026-08-13. The tracer and
evaluator pointers are dropped with the rest of Stream E.

---

## Explicitly NOT omitted

Checked against the reading, so a reviewer does not have to rediscover that
these were considered:

- **The three-generation model itself** — transported, and it is the campaign's
  spine.
- **"Porting ≠ shipping"** — transported as golden rule 1 and enforced twice
  more, in the Definition of Done and in every Tier-2 handoff.
- **"Port the pedagogy, not a shell"**, including its citation of the quarry's
  own record of prior compliant-shell reverts — transported as golden rule 2.
- **The two-layer module rule** — transported as golden rule 3, and it is also
  the lens region's own contract.
- **The sandbox verification recipe** (`npm start` → the orchestrate sandbox
  page; a wired lens appears in its phase's `<select>`) — transported into §
  Paths and § Definition of Done.
- **The governance instruction** that every agent reads `CLAUDE.md` at the repo
  root first, then its own governance file per that router — transported as
  golden rule 7 and repeated in every handoff, deliberately, because router
  reach into a spawned subagent has been observed both present and absent.

## What this transport did NOT preserve, and accepts

- **The playbook's voice.** It was written to one person sequencing one week, in
  the second person. SPEC.md is written to many sessions across an open-ended
  campaign. That is a reword, not a loss, but it is a real change and it is
  recorded here rather than passed off as neutral.
- **Its copy-paste prompts.** Ten agent prompts are dropped in favour of
  handoffs. The claim that the handoffs carry strictly more is checkable — each
  Tier-2 handoff is context-free validated before it is final, which no prompt
  in the playbook ever was.
