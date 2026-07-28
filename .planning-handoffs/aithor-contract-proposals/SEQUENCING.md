<!-- cspell:ignore aithor unparseable ungated repoints repoint -->

# Sequencing memo — aithor contract proposals

Which deltas land in which wave, with the per-wave evals-impact and
socket-re-pin obligations the charter requires. Companion to
`README.PROPOSED.md` / `types.PROPOSED.ts` / `DOCS.PROPOSED.md` (the end-state
drafts) and `AR-LOG.md` (the review trail). Nothing in this memo executes before
the maintainer ratifies the dossier; the evals keep measuring the COMMITTED
contract until each wave lands.

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

### Wave 1 — the shared allowlist leaf

The vendored machinery graduates out of the JEJ level into a new
`src/lib/study-lenses/lib/` leaf (name decided at extraction): the
`SyntaxAllowlist` / `NodeRule` / `ConstraintCheck` types, the default-deny walk,
the **paired parse** the walk's soundness is relative to (AR-1 blocker #2), the
**structural floor** the vary inventory unions (AR-1 #5), and the levels
region's `Violation` — moved per AR-1 #14 option (a), with the region
re-exporting it so every existing consumer keeps its import. jej repoints its
own imports to the leaf.

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

- **Evals impact — large, and this is the cheap moment** (the GPU driver does
  not exist yet; the corpus re-author lands before any driver is written): all
  10 CaseSpecs re-authored to the new config shape; `Quadrant` re-derived from
  `raw` instead of `validate`; `lift-outcome`'s path discriminant
  (`config.validate !== false`) rewritten; `featureDrift`'s Histogram re-keyed
  from the deleted `FeatureName` to node types; the two vary-hold cases
  re-expressed under `vary.syntax` + the structural floor; the evals README/DOCS
  "uncurated" vocabulary re-grounded on `raw`. The harness measures the
  committed contract until this wave lands, then re-shapes in the same wave.
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
