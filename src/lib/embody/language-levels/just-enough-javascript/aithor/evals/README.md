# aithor — Eval Harness

> Phase-2 design spec. **Measured, not asserted.** This harness runs
> `aithor(program, config, realRuntime)` against a **real local model** over a
> sample of requests and reports **statistical rates** — never golden-pair
> assertions (generation is non-reproducible; evals sample fresh). The
> architectural sketch (pure core ↔ impure driver, the data-flow diagram) is
> [`./DOCS.md`](./DOCS.md); the contract in TypeScript is
> [`./types.ts`](./types.ts).

## What this is, and the charter it honors

The module's [`../README.md`](../README.md) § Testing posture commits to an eval
it has not yet built:

> **Measured, not asserted.** Only the program's content, quality, and _theme_
> fidelity are statistical rates over a real model (an eval). Feature and size
> conformance are _asserted_ on the curated path — they are gated by `conform`,
> not measured.

Everything aithor built in Phase 1 is deterministic or faked (fake models, fake
runtimes). Nothing measures real generation. This harness does — under the
module's standing design commitments ([`../README.md`](../README.md) § Design
commitments): generation is **not reproducible** ("the same request yields
_different_ programs … Evals sample fresh; there are no golden pairs"), and a
variation is **related, not faithful**. So an eval is a roll-up of **rates over
fresh samples**, with provenance — not a fixture of expected outputs.

**What this harness actually measures: constraint-fit at the learner's technical
level.** The README names three semantic targets — _content_, _quality_, _theme
fidelity_ — but this harness **deliberately does not measure them.** The
decision is pedagogical, not technical (a small local model could be prompted or
judged for them, just not reliably):

- A program that fits the requested **linguistic constraints** is _at the
  learner's technical level_ — that is the thing worth measuring. Its semantic
  validity / meaningfulness / thematic coherence is **less relevant**, and the
  vagueness there is the **lesson**, not a defect: deciphering an odd-but-valid
  program, and learning that an LLM cannot be fully trusted, are the point.
- **Endless practice at a learner's technical level beats finite, thematically-
  perfect practice.** Measuring (and chasing) content/quality/theme would trade
  the first for the second.

So the README's "eval measures content / quality / theme" stands as a **future
aspiration** — revisited when local models are lighter and stronger. This
harness measures what is mechanically trustworthy now, and there is **no judge,
no rating, and no theme score** anywhere in the contract.

## Scope — the objective backbone

v1 measures only mechanically-computable statistical rates, reusing the module's
own objective computers verbatim — admission `isJej`
([`../../../../lib/validating/is-jej.ts`](../../../../lib/validating/is-jej.ts)),
conformance `conform` ([`../conform.ts`](../conform.ts)), and aithor's own
result `Meta`/`Refusal`. No new judgment. Reuse signatures (verbatim, so wiring
is unambiguous): the two directly-wired computers are
`conform(code, subset, size): ConformResult` and `isJej(code): Promise<boolean>`
(`parseProgram` is internal to `conform`, not called by the eval).

| Metric                     | Path      | Numerator / Denominator                                           |
| -------------------------- | --------- | ----------------------------------------------------------------- |
| admission (drift)          | uncurated | `isJej(program)` true ÷ non-bring-up uncurated samples            |
| conformance (drift)        | uncurated | `conform(raw, subset, size).ok` ÷ same                            |
| feature / size drift       | uncurated | Histogram of violated features / dimensions over drifting samples |
| success rate               | curated   | curated-success ÷ non-bring-up curated samples                    |
| attempt-bound refusal rate | curated   | `attempt-bound-exhausted` ÷ same                                  |
| attempt distribution       | curated   | over {1,2,3} for curated-success samples                          |
| bring-up refusal rate      | both      | (`no-model-available` + `unknown-model`) ÷ all samples            |

The two uncurated `(drift)` rows characterize the **model's drift on output
aithor never gates** ("the gap between asked-for and got is real and
intentional"), so they are _not_ aithor's conformance; they measure how far raw
generation departs from the constraints. (`Meta.attempts` is absent on a
refusal, so an `attempt-bound-exhausted` refusal silently spent the full bound;
the attempt distribution reads successes only, and the attempt-bound refusal
rate captures the spent-and-refused load — together they are exhaustive.)
Content, quality, and theme fidelity are **not in this table** — deferred per
the pedagogy above.

**The by-construction omission (how this honors "asserted, not measured on
curated").** On the curated **success** path a returned program is admitted
**and** conformant by construction — the loop guarantees it (the README's "the
boundary holds, fail-loud"). There is therefore nothing to _measure_ about
curated admission/conformance: it is 100% by definition. So a curated
`MetricSet` carries **no** `admissionRate`/`conformanceRate` — encoded as a test
(they are `undefined` on a curated MetricSet). v1 measures the **gap** where
conformance is _not_ gated (the uncurated path) and the **refusal/attempt load**
where the loop pays for tightness (the curated path — "tight curated requests
cost more"). This is the literal shape of "measured, not asserted."

## Ubiquitous language (the eval nouns)

The contract is [`./types.ts`](./types.ts); this is the vocabulary.

- **CaseSpec** — one fully-specified request the harness samples:
  `{ id, quadrant, program, config: AithorConfig, expectedSatisfiable }`. The
  `config` is the verbatim request `aithor` receives; the natural-language ask
  rides in `config.prompt` (the whole ask — there is no separate `intent` or
  `theme` field, since the eval measures only constraint-fit).
  `expectedSatisfiable` records whether _any_ program could satisfy the (subset
  × size) — some curated requests are unsatisfiable by design ("sum a list with
  no loops"), for which a refusal is the **correct** outcome. It is an
  **unverified author assertion** (whether a subset × size × prose request is
  satisfiable is not mechanically decidable), so a "refused something
  satisfiable" signal is only as trustworthy as the label.
- **Sample** — one execution of a CaseSpec against the real model:
  `{ caseId, outcome }`. Non-reproducible — a fresh draw, no seed, no golden
  pair. (Distinct from the level's `Metrics.samples`, a numeric-observation
  count.)
- **Outcome** — the mechanically-readable distillate of one Sample, produced by
  the impure driver and consumed by the pure core (so the core never touches a
  runtime). A discriminated union over the three terminal shapes aithor can
  reach: _uncurated_ (raw, with the admission/conformance **gap** read off it),
  _curated success_ (admitted + conformant **by construction**, so those are not
  re-read), and _refusal_ (a named cause). See [`./types.ts`](./types.ts).
- **Rate** — `{ numerator, denominator, proportion }`. Honest about its
  denominator — never a bare float. `proportion` is `NaN` when the denominator
  is zero, rendered `—`.
- **Histogram** — a frequency count over a small closed key set (refusal causes,
  attempt counts {1,2,3}, drifting features/dimensions). Named `Histogram` (not
  `Distribution`) to avoid collision with the level's exported `Distribution`
  (`embody/types.ts` — a min/max/mean/median stats summary), an unrelated
  concept.
- **MetricSet** — the per-case roll-up of Outcomes into Rates and Histograms.
  Uncurated-only and curated-only fields are path-gated (the by-construction
  omission above).
- **EvalReport** — the run-level roll-up:
  `{ generatedAt, model, totalSamples, metricSets, smokeOk }`. `generatedAt` is
  provenance, **never** a reproducibility claim.

## Sample protocol

- **Cases** — the four quadrants (`validate` × seeded/from-scratch), each in a
  **tight** variant (small `include`, low `lines`/`complexity` — where
  attempt-bound load shows) and a **loose** variant (empty `include` = full JEJ,
  no bounds) → ~6–8 base CaseSpecs, plus curated-seeded **vary** cases (the
  hard-tier holds over a seed — vary is exclusive with raw constraint fields
  and yields the same curated-path metrics; the soft tier is never measured).
  At least one tight curated case is `expectedSatisfiable: false`, so the
  report can separate "refused something satisfiable" (a signal) from "refused
  the unsatisfiable" (a contract **pass**).
- **Samples** — `SAMPLES_PER_CASE = 5` for v1. Generation is non-reproducible,
  so a rate needs replication; 5 keeps a full GPU run to single-digit minutes.
- **Aggregation** — rates report raw `n/d`; the harness prints **no** confidence
  interval at N=5 (false precision). v1 conclusions are **directional, not
  significant**, and the report says so. No seeds, no golden pairs — each Sample
  is a fresh draw.

## Models

Default `Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC` — the smallest catalog coder,
with no required GPU features (so an explicit pick never feasibility-refuses),
and already proven through aithor's seam in
[`../tests/aithor-webllm.browser.test.ts`](../tests/aithor-webllm.browser.test.ts).
The harness is parameterized by a single `DEFAULT_MODEL` const so a
**size-sweep** (→ 1.5B / 7B, to characterize the README's "smaller … weaker
programs, larger the reverse") is a config edit, not a redesign. A sweep is
confirmatory, not required for v1. A near-zero curated success-rate on a tight
case is **the model, not the harness** — expected for the 0.5B.

## Report, not gate

"Measured, not asserted" means the harness **reports**; it never fails a build
on a rate (a non-reproducible number would flake CI). The **only** assertion is
a **smoke floor**:

- `smokeOk` = **every case produced `SAMPLES_PER_CASE` well-formed Outcomes
  (success _or_ refusal)** — _not_ "≥1 success." A legitimately-hard curated
  case may correctly refuse every sample; that must keep the floor green. The
  floor proves the harness executed and aithor returned structured values
  end-to-end, nothing about quality.

Results are recorded two ways: the GPU driver **prints** the formatted table to
the test console, and a real run is **committed** as
[`./sample-report.md`](./sample-report.md) (added after the first GPU run) — the
manual attestation, mirroring the campaign's "commit a real GPU run" discipline
(cf. the browser-fidelity tests). There is no quality floor-gate; a
regression-watch threshold, if ever added, would be advisory only.

## Run environment

A real model needs **WebGPU → browser-only** (Node has no GPU). The harness
splits along that line — a **pure core** (rate computation + aggregation,
Node-fake- testable with hand-authored Outcomes, no GPU) behind an **impure
driver** (a GPU-gated `*.browser.test.ts` that runs the real model, auto-skips
off-GPU). The structure and the data-flow diagram are [`./DOCS.md`](./DOCS.md).
Files live in this `aithor/evals/` directory (plural — distinct from the
unrelated learner-trace engine `embody/lib/evaluating/`, and from JS `eval`).

## Out of scope

- **The settled contract** — [`../types.ts`](../types.ts),
  [`../README.md`](../README.md), [`../DOCS.md`](../DOCS.md) are not changed by
  the eval; a crux that seems to need a contract change is surfaced at the human
  gate, not edited silently. (The README's "eval measures content/quality/theme"
  line is knowingly left as a future aspiration — see above.)
- **The completed Phase-1 units** — `conform`, `build-prompt`, `load-model`,
  `make-aithor-runtime`, `aithor`, `webllm-runtime` and their tests are reused,
  not touched.
- **Consumer wiring** — lenses/chapters calling `aithor()` belong to
  embody/orchestrate/engine, not this harness.
- **Content / quality / theme fidelity** — a future eval, when local models are
  lighter and stronger; no judge, rating, or theme score exists in v1.

## Related

- [`../README.md`](../README.md) — the module spec; § Testing posture is the
  eval charter, § Design commitments the non-reproducibility ground.
- [`../DOCS.md`](../DOCS.md) — the module's architectural sketch (the pure-core
  / two-seam precedent this harness's [`./DOCS.md`](./DOCS.md) mirrors).
- [`./types.ts`](./types.ts), [`./DOCS.md`](./DOCS.md) — the eval contract and
  its architecture sketch.
- [`../conform.ts`](../conform.ts),
  [`../../../../lib/validating/is-jej.ts`](../../../../lib/validating/is-jej.ts)
  — the objective computers reused verbatim.
- [`../tests/aithor-webllm.browser.test.ts`](../tests/aithor-webllm.browser.test.ts)
  — the real-model GPU-lane precedent.
