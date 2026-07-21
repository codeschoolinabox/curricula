/**
 * @file The aithor eval-harness contract in TypeScript — the domain model for
 * measuring how a real local model behaves through `aithor`'s two paths.
 *
 * @remarks
 * The eval is **measured, not asserted** ([`./README.md`](./README.md)): it runs
 * `aithor(program, config, realRuntime)` against a real model over a sample of
 * requests and reports **statistical rates** — never golden-pair assertions
 * (generation is non-reproducible; evals sample fresh). Two halves, cut by a seam
 * the same way `aithor` itself is:
 *
 * - a **pure core** — `computeMetricSet` / `aggregate` / `formatReport` — that
 *   consumes plain-data {@link Outcome}s and produces an {@link EvalReport}. It
 *   never touches a runtime, so it is Node-fake-testable with hand-authored
 *   {@link Outcome}s.
 * - an **impure driver** — runs the real model, reads each `AithorResult` plus
 *   the reused objective gates (`isJej`, `conform`), and **lifts** the pair into
 *   an {@link Outcome}. WebGPU/browser-only, manual/periodic.
 *
 * The {@link Outcome} is the boundary value: it carries exactly the
 * mechanically-readable distillate the core needs and nothing impure.
 *
 * **What this measures: constraint-fit at the learner's technical level.** Does
 * the model produce programs that fit the requested _linguistic constraints_
 * (admission + conformance), and how reliably does the curated loop deliver one
 * (success / refusal-cause / attempt-count)? The semantic dimensions the module
 * README names — _content_, _quality_, _theme fidelity_ — are **deliberately not
 * measured here**: their vagueness is pedagogically intended (it teaches learners
 * to decipher programs and to distrust LLMs), and endless practice at a learner's
 * technical level beats finite thematically-perfect practice. They are a future
 * aspiration, revisited when local models are lighter and stronger — so this
 * contract carries no judge, no rating, and no theme score.
 *
 * Reused unchanged from the module: the request `AithorConfig`, the result `Meta`
 * / `RefusalCause`, the feature vocabulary `FeatureName`, the admission gate
 * `isJej`, and the conformance check `conform` — none redefined here.
 */

import type { AithorConfig, FeatureName, RefusalCause } from '../types.js';

// ─── Case (the request shape we sample) ───────────────────────────────

/**
 * The curated/uncurated × seeded/from-scratch quadrant a case sits in — a
 * derived label (`config.validate` × whether `program` is empty), carried for
 * grouping and reporting, not a separate axis.
 */
type Quadrant =
	| 'uncurated-scratch'
	| 'uncurated-seeded'
	| 'curated-scratch'
	| 'curated-seeded';

/**
 * One fully-specified request the harness samples.
 *
 * @remarks
 * - `config` — the verbatim request `aithor` receives (carries `validate`,
 *   `include`/`exclude`, `lines`/`complexity`, `model`, and the natural-language
 *   `prompt`). The prompt is the whole ask — there is no separate `intent` or
 *   `theme` field: the eval measures only constraint-fit, never what the prompt
 *   asked for semantically.
 * - `program` — the seed: `''` composes from scratch, non-empty varies.
 * - `expectedSatisfiable` — whether _any_ program could satisfy the
 *   (subset × size) the prompt asks for. Some tight curated requests are
 *   unsatisfiable by design ("sum a list with no loops"); for those a refusal is
 *   the **correct** outcome, so the report must separate "refused something
 *   satisfiable" (a signal) from "refused the unsatisfiable" (a contract pass).
 */
type CaseSpec = {
	readonly id: string;
	readonly quadrant: Quadrant;
	readonly program: string;
	readonly config: AithorConfig;
	readonly expectedSatisfiable: boolean;
};

// ─── Outcome (the per-sample distillate the core consumes) ────────────

/**
 * A flattened, JSON-safe read of `conform`'s verdict — the violated features and
 * dimensions, without the AST (which the core never needs). Derived from a
 * `ConformResult` at the boundary by mapping each violation to its `feature` or
 * `dimension`.
 *
 * @remarks
 * On the uncurated path `conform` is run as a **measurement, not a gate** — it
 * characterizes the model's drift on output `aithor` never gates. `conform` is
 * value-not-throw (an unparseable candidate yields `{ ok: false, violations: [] }`),
 * so this read never aborts a run.
 */
type ConformVerdict = {
	readonly ok: boolean;
	readonly featureViolations: readonly FeatureName[];
	readonly sizeViolations: readonly ('lines' | 'complexity')[];
};

/**
 * One uncurated (`validate: false`) sample's distillate: the raw program with the
 * admission/conformance **gap** read off it. `aithor` never gated this output, so
 * `admitted` and `conform` measure how far the raw generation drifted, not a
 * guarantee.
 *
 * @remarks
 * - `admitted` — `isJej(program)` on the byte-exact raw program.
 * - `conform` — `conform(program, subset, size)` flattened (the case's subset/size).
 * - `model` — the resolved id from the result's `Meta` (which model actually ran).
 */
type UncuratedOutcome = {
	readonly kind: 'uncurated';
	readonly admitted: boolean;
	readonly conform: ConformVerdict;
	readonly model: string;
};

/**
 * One curated (`validate: true`) success sample's distillate. Admission and
 * conformance are **omitted by construction**: a curated success is admitted AND
 * conformant by definition (the loop guarantees it — "the boundary holds"), so
 * there is nothing to _measure_ about them (the charter's "asserted, not
 * measured on the curated path"). What is measurable here is the **load** the
 * loop paid.
 *
 * @remarks
 * - `attempts` — the model-call count the success took: `1` (first try) through
 *   `3` (`MAX_ATTEMPTS`). From the result's `Meta.attempts`. The literal
 *   `1 | 2 | 3` tracks aithor's `MAX_ATTEMPTS` (currently 3); retuning that bound
 *   widens this union (and `attemptDistribution`'s key set).
 * - `model` — the resolved id from the result's `Meta`.
 */
type CuratedSuccessOutcome = {
	readonly kind: 'curated-success';
	readonly attempts: 1 | 2 | 3;
	readonly model: string;
};

/**
 * One sample that refused — a named cause and the path it arose on. A refusal
 * carries no `Meta` (no successful program), so no `model`.
 *
 * @remarks
 * `path` is the case's `validate` fork: bring-up refusals (`no-model-available`,
 * `unknown-model`) arise on **either** path; `attempt-bound-exhausted` is
 * curated-only. Carried so the Outcome is independently interpretable (the
 * lift-outcome unit asserts each `AithorResult` shape maps to the right variant
 * without re-deriving the path).
 */
type RefusalOutcome = {
	readonly kind: 'refusal';
	readonly cause: RefusalCause;
	readonly path: 'curated' | 'uncurated';
};

/**
 * The mechanically-readable distillate of one Sample — produced by the impure
 * driver (which ran `aithor` + `isJej` + `conform`), consumed by the pure core.
 * A discriminated union (on `kind`) over the three terminal shapes `aithor` can
 * reach. Plain data only: no runtime handle, no `AithorResult`, no AST.
 */
type Outcome = UncuratedOutcome | CuratedSuccessOutcome | RefusalOutcome;

/** One execution of a CaseSpec against the real model — a fresh, non-reproducible draw. */
type Sample = {
	readonly caseId: string;
	readonly outcome: Outcome;
};

// ─── Metrics (the pure-core roll-up) ──────────────────────────────────

/**
 * A rate that is honest about its denominator — never a bare float.
 *
 * @remarks
 * `proportion` is `numerator / denominator`, or `NaN` when `denominator` is `0`
 * (rendered `—` by `formatReport`; a rate over no samples is undefined, not zero).
 */
type Rate = {
	readonly numerator: number;
	readonly denominator: number;
	readonly proportion: number;
};

/**
 * A frequency count over a small closed key set — refusal causes, attempt counts
 * `{1,2,3}`, drifting {@link FeatureName}s, or size dimensions.
 *
 * @remarks
 * Named `Histogram` (not `Distribution`) to avoid collision with the level's
 * exported `Distribution` (`embody/types.ts` — a min/max/mean/median stats
 * summary), an unrelated concept. A key absent from the record counted zero.
 * Plain data — a frozen partial record, never a `Map` — so the freeze reaches
 * its entries and it survives `JSON` untruncated.
 */
type Histogram<K extends string | number> = Readonly<
	Partial<Record<K, number>>
>;

/**
 * The per-case roll-up of {@link Outcome}s into rates and histograms.
 *
 * @remarks
 * **Path-gated.** The uncurated-only and curated-only fields are present only for
 * a case of that path; a curated `MetricSet` carries **no** `admissionRate` /
 * `conformanceRate` (100% by construction — the by-construction omission), and an
 * uncurated `MetricSet` carries no `successRate` / `attemptBoundRefusalRate` /
 * `attemptDistribution` (no loop). `bringUpRefusalRate` is on both. The presence
 * of a field IS the path claim — encoded as a test.
 *
 * - `samples` — N collected for this case.
 * - `expectedSatisfiable` — copied from the case, so the report can read an
 *   `attemptBoundRefusalRate` as signal (satisfiable) vs. expected (not).
 * - `bringUpRefusalRate` — both paths: (`no-model-available` + `unknown-model`) ÷
 *   all samples.
 * - `admissionRate` / `conformanceRate` — uncurated: the **drift** gap, ÷
 *   non-bring-up uncurated samples.
 * - `featureDrift` / `sizeDrift` — uncurated: which features/dimensions drifted,
 *   counted across drifting samples.
 * - `successRate` / `attemptBoundRefusalRate` — curated: ÷ non-bring-up curated
 *   samples.
 * - `attemptDistribution` — curated: over `{1,2,3}` for curated-success samples
 *   only (a refusal carries no attempt count — that "spent the full bound, got
 *   nothing" load surfaces in `attemptBoundRefusalRate`, so the two are
 *   exhaustive together).
 */
type MetricSet = {
	readonly caseId: string;
	readonly quadrant: Quadrant;
	readonly samples: number;
	readonly expectedSatisfiable: boolean;
	readonly bringUpRefusalRate: Rate;
	// uncurated-only
	readonly admissionRate?: Rate;
	readonly conformanceRate?: Rate;
	readonly featureDrift?: Histogram<FeatureName>;
	readonly sizeDrift?: Histogram<'lines' | 'complexity'>;
	// curated-only
	readonly successRate?: Rate;
	readonly attemptBoundRefusalRate?: Rate;
	readonly attemptDistribution?: Histogram<1 | 2 | 3>;
};

/**
 * The run-level roll-up of all per-case {@link MetricSet}s, plus provenance and
 * the one floor.
 *
 * @remarks
 * - `generatedAt` — ISO timestamp; **provenance only**, never a reproducibility
 *   claim (generation is non-reproducible — a re-run yields different programs).
 * - `model` — the default model these cases targeted (a size-sweep changes this).
 * - `smokeOk` — the ONLY floor: every case produced its full `samples` count of
 *   **well-formed** Outcomes (success _or_ refusal), proving the harness ran and
 *   `aithor` returned structured values end-to-end. **Not** "≥1 success" — a
 *   legitimately-hard curated case may correctly refuse every sample. There is no
 *   quality floor; the eval reports, it does not gate.
 */
type EvalReport = {
	readonly generatedAt: string;
	readonly model: string;
	readonly totalSamples: number;
	readonly metricSets: readonly MetricSet[];
	readonly smokeOk: boolean;
};

// ─── Exports ──────────────────────────────────────────────────────────

export type {
	Quadrant,
	CaseSpec,
	ConformVerdict,
	UncuratedOutcome,
	CuratedSuccessOutcome,
	RefusalOutcome,
	Outcome,
	Sample,
	Rate,
	Histogram,
	MetricSet,
	EvalReport,
};
