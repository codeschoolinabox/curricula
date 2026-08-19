# environment-refusal

The engine-backed evaluators' shared environment refusal. Every evaluator that
runs on the machinery needs the same two capabilities before a run can exist — a
`Worker` to run in, and the `SharedArrayBuffer` its control channel (the pause
and call protocols) lives on — and the kind's contract answers their absence
with a structured refusal, never a throw ([`../../README.md`](../../README.md) §
Outcomes, errors, refusals, which owns the two-species refusal taxonomy this
module serves). This module is where the environment species is WORDED, once:
the deprecated region carried the probe byte-identical in two evaluators, and
two parallel Phase-0 units were about to re-duplicate it before the human ruled
the hoist (2026-08-18, P0-R's design review; the leaf split and this module's
name ruled 2026-08-19).

## What lives here

```text
environment-refusal/
├── refuse-absent-capability.ts   the pure decision leaf: evaluator name +
│                                 the two capability facts in, the one
│                                 refusal wording (or null) out
├── refuse-missing-capability.ts  the environment read: probes the globals,
│                                 delegates to the leaf
└── tests/                        the leaf's exhaustive suite (plain
                                  fixtures, wording pinned by equality) +
                                  the wrapper's node and browser rows
```

No `types.ts`: the module consumes the region's `EvaluatorRefusal`, and its one
own shape — the leaf's two-fact input record — is declared in the leaf file and
stays unexported; callers satisfy it structurally. The rule this departure
states for the next module: a `types.ts` exists to publish a boundary's types —
a module whose every shape is private to one file declares them there.

## The contract

```ts
function refuseMissingCapability(
	evaluatorName: string,
): EvaluatorRefusal | null;
```

- Reads the two capabilities and hands the facts to the pure leaf
  (`refuseAbsentCapability`), which words the refusal — or answers `null` when
  the environment can host a run, and whatever happens next is the evaluator's
  own business.
- The arm order is a commitment, pinned by the leaf's suite: the worker is named
  before the shared memory — the order a reader wants them named.
- The wording is pinned by exact-equality tests: the sentence is this region's
  ONE environment-refusal wording, and a drifted word is a red test, not a
  review catch.

The split is the repo's environment-boundary rule applied: the leaf is pure over
its two facts and exhaustively tested with plain fixtures; the wrapper alone
reads globals, and its two tiers cross the node/browser boundary by MOVING test
files (the node tier proves the worker refusal, the browser tier proves
both-present-answers-null — the deprecated port's own pair), never by mocking
the environment away.

This module words ENVIRONMENT refusals only. Spec refusals — a malformed or
out-of-gate spec — stay each evaluator's own, in its own words; the split is
canonical at the region root ([`../../README.md`](../../README.md) § Outcomes,
errors, refusals). The species are distinguishable by wording, not by data —
nothing on `EvaluatorRefusal` discriminates them, and whether the kind's refusal
shape grows a discriminating field is P0-K's question, named open in the ledger.
The residual — every capability present but the machinery still failing — is
nobody's refusal: it surfaces as the machinery defect it is.

The capabilities themselves are the MACHINERY's prerequisites, and the machinery
asserts the shared-memory one itself, on a different channel: a run ignited
without `SharedArrayBuffer` settles as an `EngineEnvironmentError` failure
(`lib/engine/worker/transport.ts`, guarded before its own `workerFactory` call).
The seam rule that keeps the two statements from being the same thing: this
module is the synchronous refusal at `main` — no handle ever exists — while the
engine's check is an at-ignition failure on a run that already started; neither
reaches a spawned worker. A machinery change that retires a prerequisite retires
it in both places; the region's copy is the one a consuming lens sees.

## Glossary — unit terms

- **capability** — an environment fact the machinery cannot run without: the
  worker, the shared memory its control channel lives on.
- **environment refusal** — the refusal species this module words (the region
  glossary owns the species pair): the environment cannot host a run, whatever
  the spec says.
- **the leaf** — the pure decision function: facts in, wording out; where the
  sentence and the arm order live.
- **the wrapper** — the one global-reading function; evaluators call it.

## Discharges

Recorded per HR-21 against the campaign's LOSS-LEDGER
(`.planning-handoffs/evaluators-api-restoration/LOSS-LEDGER.md`): this module
encodes the 2026-08-18 P0-R design-review ruling hoisting the shared environment
refusal into the region's `lib/` and the 2026-08-19 rulings naming it and
splitting the pure leaf from the environment read (both bullets in § Rulings of
record), and HR-17's refusal-as-data posture for the environment species. The
wording restores the deprecated port's probe sentences (its `run` and
`intercept` `index.ts` carried them byte-identical — the measured duplication
this module retires), and the wrapper's two-tier suite keeps the port's
browser-tier both-present row. No reference-surface ledger row names this
module: the quarry had no refusal channel — its variables gate threw — so the
module is kind-era machinery, not a restored member.

## Navigation

- Container: [`../README.md`](../README.md).
- The refusal shape and species taxonomy: [`../../types.ts`](../../types.ts) —
  `EvaluatorRefusal`; [`../../README.md`](../../README.md) § Outcomes, errors,
  refusals.
- The machinery's own post-spawn check:
  [`../../../lib/engine/README.md`](../../../lib/engine/README.md).
- Consumers: the engine-backed evaluators' `main` doors; each unit's own docs
  state where the environment read sits in its refusal order.
- Architecture: [`DOCS.md`](./DOCS.md).
