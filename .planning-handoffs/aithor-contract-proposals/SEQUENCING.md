<!-- cspell:ignore aithor unparseable ungated repoints repoint resh -->

# Sequencing memo — aithor contract proposals

Which deltas land in which wave, with the per-wave evals-impact and
socket-re-pin obligations the charter requires. Companion to
`README.PROPOSED.md` / `types.PROPOSED.ts` / `DOCS.PROPOSED.md` (the end-state
drafts). Nothing in this memo executes before the maintainer ratifies the
dossier; the evals keep measuring the COMMITTED contract until each wave lands.

## The recommendation deviates from the charter's default — argued

The charter's default order was 5c → 1+4 → 2+3 → 6 → 5a/5b → 7. The recommended
merge folds the aithor-side content of P2 (the raw opt-in replacing `validate`)
and P3 (posture-blindness) into the core reshape wave: they ARE the same
`AithorConfig`/gate-derivation decision, and a separate "gating semantics" wave
would re-open the same types and re-author the evals corpus twice. P4 likewise
collapses into the core wave's injected-gate seam (its reshape out of the config
is argued below). The maintainer ratifies or strikes this merge at the gate.

## Wave map

**Standing — 5c, every wave.** `prompt` + `model` remain the only required
`AithorConfig` fields; every field this dossier adds is optional. Checked per
wave; the consumer's `GeneratorRequest = { prompt, model }` strict-subset
guarantee is re-affirmed in each wave's flag note.

### Wave 1 — the shared screening leaf

The vendored machinery graduates out of the JEJ level into
`src/lib/study-lenses/lib/screening/`, the name decided at extraction: the
`SyntaxAllowlist` / `NodeRule` / `ConstraintCheck` types, the default-deny walk,
the **paired parse** the walk's soundness is relative to (AR-1 blocker #2), the
**structural floor** the vary inventory unions (AR-1 #5), and the levels
region's `Violation` — moved per AR-1 #14 option (a), with the region
re-exporting it so every existing consumer keeps its import. jej repoints its
own imports to the leaf.

Where they landed: `SyntaxAllowlist` / `NodeRule` / `ConstraintCheck`, the walk,
its traversal helpers, the violation factory, `Violation` and `SourceRange` all
now live in `src/lib/study-lenses/lib/screening/`; the levels region re-exports
`Violation` and `SourceRange` type-only, so every level-side consumer kept its
import. The structural floor was authored at extraction and is
`screening/structural-floor.ts`. The per-increment SHAs are the authoritative
record [read: the wave's own commit bodies, one per increment].
**Parse-settings: pin against the now-committed published-parse contract**
(refreshed 2026-07-30 — the repo RULED after this memo was first written): the
walk takes a pre-parsed `Program` "as the caller parsed it," so the settings
live with callers, and the package has since pinned its published parse —
**ESTree-shaped facts (no `ParenthesizedExpression` node; the once-live
embody-vs-jej `preserveParens` divergence is CLOSED — `8d46e88b` dropped the
inert allowlist entry), character offsets, numeric ECMA year, stable node
paths** (`c3e19091` pins the contract; `edd84e6a` records the decisions; the
instrument's one parse is `src/lib/study-lenses/embody/derive-ast.ts`). The
leaf's paired parse adopts THAT contract; nothing is inferred from a dataset's
authorship anymore.

- **Cross-territory obligation (maintainer flag):** this wave writes in the jej
  tree (import repoints) and the levels region's `types.ts` (the re-export). The
  jej level's own policy data does not change.
- **Evals impact:** none — the harness never imports the walk.
- **Socket re-pin:** none.

### Wave 2 — the core contract reshape (P1 + P2 + P4; P3 documented)

The dossier's drafts land as the committed `README.md` / `types.ts` / `DOCS.md`,
and the implementation follows them: the gate hierarchy with the derived tier,
the injected gate (`Finding[] | 'undetermined'`), the `raw` opt-in replacing
`validate`, the allowlist slot replacing `include`/`exclude`, steering vs gating
named everywhere, `vary.syntax` (renamed from `languageLevel`) inventorying node
types through the leaf. P3 lands as documentation only: aithor is posture-blind;
the orchestrator computes `level ∪ featuresOf(seed)` and threads the union as
the dataset (P7's integration step).

- **Evals impact — large** (refreshed 2026-07-30: the GPU driver LANDED on
  2026-07-28 — `02ddc503` and its docs trio — so the original "re-author before
  the driver exists" cheap-moment clause is struck; the driver is now IN scope):
  all 10 CaseSpecs re-authored to the new config shape; `Quadrant` re-derived
  from `raw` instead of `validate`; `lift-outcome`'s path discriminant
  (`config.validate !== false`) rewritten; `featureDrift`'s Histogram re-keyed
  from the deleted `FeatureName` to node types; the two vary-hold cases
  re-expressed under `vary.syntax` + the structural floor; the evals README/DOCS
  "uncurated" vocabulary re-grounded on `raw`; **plus the landed driver**
  (`evals/tests/run-eval.browser.test.ts` + its named reads-boundary type)
  re-pointed at the reshaped config, and a fresh real sample run after the
  reshape (the committed sample attestation describes the pre-reshape contract).
  The harness measures the committed contract until this wave lands, then
  re-shapes in the same wave.
- **Socket re-pin — FLAG REQUIRED (maintainer relays to the consumer stream):**
  the `Generator*` redeclarations in `orchestrate/generator/types.ts` transcribe
  `AithorResult` / `Refusal` / `Meta` / the config's required fields. The
  required-field guarantee survives verbatim (5c); `RefusalCause` / `NextStep` /
  `Refusal` / `AithorResult` are unchanged; `Meta` may gain the OPTIONAL `tier`
  field (gate item) — additive, so the transcription keeps working, but the
  consumer should re-pin deliberately. The socket README's pinned signature
  (`aithor(program, config, runtime)`) survives; the options bag is a later,
  additive fourth argument (Wave 4).
- **The bare-call transition (AR-1 #4, human-ruled):** on landing, a bare
  `{ prompt, model }` curated call gates on parse alone; the "admitted JEJ"
  guarantee moves into the injection slots and returns at the consumer's
  socket-swap integration (P7 threads the level's allowlist + gate). The
  consumer is mock-bound today, so no learner-facing surface weakens before that
  integration; `Meta.tier` (proposed) keeps the surface honest either way.

### Wave 3 — the seat (P6)

Pure relocation to `src/lib/study-lenses/lib/aithor/`: content-stable move,
import repoints (acorn stays direct; the allowlist machinery from the Wave-1
leaf; local-llm relative paths shorten), link re-homing in the docs, tests and
evals move with the module. The vitest browser project's glob
(`src/lib/**/*.browser.test.ts`) covers the destination unchanged.

- **Preconditions:** Waves 1–2 landed (the reshape dissolves the embody/ level
  imports that made the seat unreachable; the leaf supplies the machinery a lib
  module may import).
- **Evals impact:** path moves only.
- **Socket re-pin:** none (no type changes). **Maintainer flag:** the seat
  itself — the module leaves the JEJ level's directory.

### Wave 4 — the per-call options (P5a + P5b)

Additive, written once against the final seat: the fourth optional argument
(`signal`, `onProgress`), the progress events (resolve / bring-up with the
loader-relayed fetch ratio / attempt / gating / repair), the seam-boundary
cancellation checks with the reject-with-reason exit (human-ruled, AR-1 #12),
and the `ModelLoader` progress relay (human-ruled, AR-2 #1 — aithor-internal).

- **Cross-module obligation (maintainer flag, named not assumed):** TRUE
  in-flight interruption — aborting a running fetch, load, or generation — needs
  local-llm's `load` and `LoadedModel.generate` to accept a signal. Until that
  lands in local-llm's contract (another leaf's territory), aithor's cancel is
  honestly tiered: reject-at-the-next-seam-boundary.
- **Evals impact:** none required (the harness drives no cancellation; the
  options bag is optional).
- **Socket re-pin:** none in shape — the consumer socket already carries
  `options?: { onPhase?, signal? }`; its `GeneratorPhase` mapping from aithor's
  progress events is consumer-side wiring, and the reject-vs-never-settle seam
  behavior is already conformant per the socket's own contract (it swallows the
  abort rejection).

### Later — P7 (orchestrator-owned, out of this tree)

The level-side descriptor: an optional constraints field on the LanguageLevel
spine, the posture union computed orchestrator-side, the socket threading
dataset + curried gate + steering text into real aithor calls. Nothing for the
aithor stream to build; the dossier pins what arrives (allowlist, gate,
steering) and the `steering` slot is the descriptor's designed hook.

## Questions this memo names without deciding (other territories)

- **Union semantics under warn** (orchestrator's, via the maintainer): when the
  level's rule for a node type is a `ConstraintCheck` and the seed's usage
  violates the check, does the union relax the rule to `true` or keep the check?
  And does `featuresOf(seed)` extend `admittedGlobals` by the seed's escaped
  references (feasible orchestrator-side, where the scope analysis lives)?
- **local-llm signal extension** (the local-llm leaf's, via the maintainer):
  signatures for signal-accepting `load`/`generate`; until then Wave 4's tiered
  cancel stands on its own.

## Gate items (the maintainer rules at the Phase-0 → Phase-1 gate)

**Where the ruling lands:** the gate's rulings — ratifications, amendments,
strikes — are recorded as a `## The gate ruling` section in THIS memo, dated,
and in the commit body that lands it, then mirrored into the charter memory's
addendum. A post-gate session verifies the ruling here before opening any wave;
an absent section means the gate has not ruled.

**THE GATE HAS RULED — see § The gate ruling (2026-07-30) at the end of this
memo.** The seven items below are its subjects, kept as the questions that were
put; the answers are there.

1. **The rawness fate** — `raw: true` amends ratified P2's letter (argued:
   Chapter-4 pedagogy and drift telemetry need the surface; always-curated holds
   as instrument policy).
2. **The P4 collapse** — lifecycle profiles move out of `AithorConfig` into the
   consumer-curried gate (argued: the price of the domain-blind lib seat; the
   `'undetermined'` arm carries the ratified carve-out).
3. **The wave merge** — this memo's deviation from the charter's default order.
4. **`Meta.tier`** — the proposed optional tier-honesty field (additive; flagged
   to the consumer stream either way).
5. **Wave 1's cross-territory writes** (jej repoints; `Violation` moves with a
   region re-export).
6. **The local-llm signal extension** as a named future obligation.
7. **The cancel exit** — reject-with-reason was human-ruled at AR-1
   presentation; recorded here for the gate's visibility since it binds the
   consumer stream's swallow obligation.

## The gate ruling (2026-07-30)

The maintainer ruled at the Phase-0 → Phase-1 gate, via in-session questions, on
the seven items above. **The gate is PASSED — waves may open**, in the ratified
order, each as its own full-ceremony campaign (human ruling 2026-07-30).

| Item | Subject                                                                             | Ruling                                                                                                                                                       |
| ---- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | Rawness fate (`raw: true` amends ratified P2)                                       | **RATIFIED.** The explicit uncurated opt-in stands; always-curated holds as instrument policy (the consumer never passes it).                                |
| 2    | P4 collapse (profile out of the config)                                             | **RATIFIED.** Lifecycle profiles live in the consumer-curried injected gate; the `'undetermined'` arm carries the never-gates-what-it-can't-parse carve-out. |
| 3    | The wave merge (4 waves vs the charter's 6)                                         | **RATIFIED.** Leaf extraction → core reshape (P1+P2+P4) → the move → options API; P7 later, orchestrator-side.                                               |
| 4    | `Meta.tier` (optional tier-honesty field)                                           | **RATIFIED.** The field lands; additive-optional; the consumer stream re-pins deliberately (flag stands).                                                    |
| 5    | Wave-1 cross-territory writes (jej repoints; `Violation` moves w/ region re-export) | **Acknowledged/authorized** — executed at Wave 1, under its own ceremony.                                                                                    |
| 6    | local-llm signal extension                                                          | **Acknowledged** as a named future obligation in another leaf's territory; Wave 4's tiered cancel stands on its own until it lands.                          |
| 7    | Cancel exit (reject-with-reason)                                                    | **Acted** — already human-ruled at the AR-1 presentation; the gate confirms it; the consumer socket's swallow obligation stands as documented.               |

Same-day context recorded with the ruling: the maintainer separately
re-confirmed the three sketch-review rulings ("1 yes · 3 propagate · 4+5 ok"),
and this memo was refreshed in the same commit for two post-dossier repo events
— the eval driver landed (2026-07-28) and the published-parse contract was
pinned ESTree-shaped and offset-based (2026-07-30), closing the `preserveParens`
divergence Wave 1's caution had warned about.

### Carried into Wave 2

- **A Wave-2 design risk (2026-08-05):** the node-type inventory will re-admit
  `var` unless it maps rules deliberately — the leaf's default-deny message is
  domain-blind, so nothing else stops it.
- **DISCHARGED at `ec84bc30` (2026-08-25).** This memo's Wave-2 spec had
  contradicted what Wave 1 shipped: `README.PROPOSED.md` described a
  declaration-admitting floor and `types.PROPOSED.ts` imported from the pre-move
  `allowlisting` path. Both corrected. A review then found a third, larger
  contradiction of the same class — all three drafts claimed the leaf owns a
  parse, when it publishes settings and never parses — and that is corrected
  too. Recorded as discharged rather than deleted, so a reader knows the
  obligation closed and where.
- **Model routing for Wave 2 (human ruling 2026-08-25):** Phase 0 runs on
  **Fable**, Phase 1 on **Opus**. The mechanism Phase 0 = Fable buys is that
  `ar-2` and `ar-5` carry no `model:` pin and inherit the spawning session's
  model, so the sketch and pre-merge gates track the authoring tier. **Both
  halves depart from `HUMANS.md` § Model selection rules**, which names Opus for
  Phase-0 design and Sonnet for post-gate TDD; the ruling overrides it
  deliberately, because a 353-test contract reshape with a full evals re-author
  is not routine increment work. Recorded here per
  [DEV.md § Ruling provenance](../../DEV.md#ruling-provenance) — a ruling whose
  end-state home does not exist yet rides its campaign's durable artifact.
- **Phase 0 owes a loss ledger, and it is large (2026-08-25).** Landing the
  drafts as the committed contract deletes ~22KB: `README.md` 49,370 → 33,656,
  `types.ts` 24,170 → 19,381, `DOCS.md` 17,100 → 15,341 [measured]. `DEV.md` §
  Documentation migration discipline binds an enumeration built by hand from the
  baseline diff.
- **`types.PROPOSED.ts`'s imports do not compile at the Wave-2 seat
  (2026-08-25):** they are written from the Wave-3 seat. Re-base them at
  landing; `npx tsc --noEmit` is the gate.

## Wave 2 is PAUSED (human ruling 2026-08-26)

**Wave 2 does not open until the local-llm campaign clears its Phase-0 → Phase-1
human gate** (not until the whole campaign lands) — the precise condition is
under § What unblocks Wave 2 below. Brief:
[`../local-llm-lifecycle/BRIEF.md`](../local-llm-lifecycle/BRIEF.md).

**Why.** Wave 2's Phase 0 locks aithor's runtime seam — `ModelLoader`,
`ResolvedModel`, `AithorRuntime`. Two measurements taken while planning Wave 2
showed that seam is an adapter for a shape that is about to be fixed:

- **`load` has three failure channels** — it throws on an unknown model name,
  returns a `LoadFailure` on a device limit, and rejects on a probe fault [read:
  `aithor/load-model.ts` @file]. `load-model.ts` is **89 lines** and its test
  file **276 lines** [measured: `wc -l`], existing only to absorb those three
  into one vocabulary.
- **local-llm's generation half was never modelled.** `load` carries
  feasibility, a descent, an attempts ledger and terminal causes; `generate` is
  `(prompt) => Promise<GenerationResult>` with no cancel, no fallback, no
  device-loss recovery and no ownership. Three of the module's twelve § Out of
  scope items sit on that one axis.

Writing aithor's contract first would carefully specify an adapter for a shape
whose need is about to be removed. Nothing in `src/` imports aithor [measured:
`git grep -n "from.*aithor" -- src` → the one outside reference is a comment],
and local-llm's only consumer is aithor, so this is the cheapest moment the
reordering will ever cost.

**What unblocks Wave 2:** the local-llm campaign's Phase-0 → Phase-1 human gate
passing, and its settle-item 7 (where the five-cause → `NextStep` derivation
lives) answered — that is the piece Wave 2's seam is built on.

### Rulings carried from the Wave-2 planning session (2026-08-25)

Recorded here because they were made in a session that produced no commit, and a
plan file is not a record [read: `DEV.md` § Ruling provenance]. They stand for
Wave 2 when it resumes, **except where the local-llm campaign changes the
contract they were made against** — re-confirm each at resumption.

1. **Phase 0 runs on Fable, Phase 1 on Opus** — re-affirming the 2026-08-25
   ruling above. `ar-2` and `ar-5` carry no `model:` pin and inherit the
   spawning session, so authoring Phase 0 on Fable is what buys Fable-tier
   judgment at the sketch and pre-merge gates.
2. **The end-state contract lands whole — the Wave-4 surface is IN.**
   `AithorOptions`, `AithorProgressEvent`, `ModelLoader.onProgress` and the
   4-arg `aithor(program, config, runtime?, options?)` signature were ruled to
   land at Wave 2 as declared types and documented contract. **This supersedes §
   Wave 2's "the options bag is a later, additive fourth argument (Wave 4)."**
   ⚠️ **Most exposed to the pause:** it was ruled when `signal` had no
   downstream support at all. The local-llm campaign may make it honorable, or
   may reshape it. Re-confirm before landing.
3. **`types.ts` lands with a declared red typecheck.** Literal 0.3 — "type
   errors after this step become the TODO list for implementation." The commit
   body states the exact error count and file set; Phase 1's invariant is that
   the error set shrinks monotonically, never grows.
4. **The twin ask is RE-ASKED, never inherited.** The 2026-08-25 answer was
   `machine`, but a plan file is not a record and the answer is re-asked across
   a session boundary [read: `DEV.md` § Phase 0, 0.2]. No twin exists for
   aithor, so silence at the re-ask resolves to `none`, not to `machine`.

**Where Wave 2's planning survives:**
`~/.claude/plans/read-claude-plans-wave2-aithor-core-resh-buzzing-rabbit.md`
carries eleven measured findings (F1–F11) — the broken draft imports, the
`preserveParens` false-violation trap, the two-way `SourceRange` choice, the
never-existent `evals/sample-report.md`, the WebLLM ceiling — plus a 37-step
checklist. It is a plan file, so it is not a record; the findings are worth
re-reading, the rulings above are the record.
