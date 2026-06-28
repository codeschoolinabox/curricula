/**
 * @file The aithor eval-harness contract in TypeScript — the domain model for
 * measuring how a real local model behaves through `aithor`'s two paths.
 *
 * @remarks
 * The eval is **measured, not asserted** ([`./EVAL.md`](./EVAL.md)): it runs
 * `aithor(program, config, realRuntime)` against a real model over a sample of
 * requests and reports **statistical rates** — never golden-pair assertions
 * (generation is non-reproducible; evals sample fresh). Two halves, cut by a seam
 * the same way `aithor` itself is:
 *
 * - a **pure core** — `computeMetricSet` / `aggregate` / `formatReport` — that
 *   consumes plain-data {@link Outcome}s and produces an {@link EvalReport}. It
 *   never touches a runtime, so it is Node-fake-testable with hand-authored
 *   {@link Outcome}s.
 * - an **impure driver** — runs the real model, reads each {@link AithorResult}
 *   plus the reused objective gates (`isJej`, `conform`), and **lifts** the pair
 *   into an {@link Outcome}. WebGPU/browser-only, manual/periodic.
 *
 * The {@link Outcome} is the boundary value: it carries exactly the
 * mechanically-readable distillate the core needs and nothing impure.
 *
 * **v1 builds the objective backbone + one heuristic theme floor.** The
 * charter's named targets (content / quality / theme *fidelity*) need a judge or
 * a human; their seam ({@link Judge}, {@link Rating}, {@link Target},
 * {@link JudgeVerdict}) is **designed and typed here but not implemented in v1**
 * — built only after a human decision on the judge model and a passing
 * calibration run. See [`./EVAL.md`](./EVAL.md) § The deferred judge seam.
 *
 * Reused unchanged from the module: the request `AithorConfig`, the result
 * `AithorResult` / `Meta` / `RefusalCause`, the feature vocabulary `FeatureName`,
 * the admission gate `isJej`, and the conformance check `conform` — none
 * redefined here.
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
 * One fully-specified request the harness samples, plus the eval-author truth
 * the config cannot carry.
 *
 * @remarks
 * - `config` — the verbatim request `aithor` receives (carries `validate`,
 *   `include`/`exclude`, `lines`/`complexity`, `model`, `prompt`).
 * - `program` — the seed: `''` composes from scratch, non-empty varies.
 * - `intent` — what the program must *do*, in plain words. The judge's content
 *   rubric (v2); not derivable from `config`.
 * - `themeKeywords` — the requested theme's surface words. **Author metadata**:
 *   theme is soft prose inside `config.prompt` (there is no theme field — nothing
 *   to gate), so the only honest source of the *requested* theme is the author
 *   writing it down. The heuristic theme floor matches these against the
 *   program's identifiers and string/template-literal contents.
 * - `expectedSatisfiable` — whether *any* program could satisfy the
 *   (subset × size × intent). Some tight curated requests are unsatisfiable by
 *   design ("sum a list with no loops"); for those a refusal is the **correct**
 *   outcome, so the report must separate "refused something satisfiable" (a
 *   signal) from "refused the unsatisfiable" (a contract pass).
 */
type CaseSpec = {
	readonly id: string;
	readonly quadrant: Quadrant;
	readonly program: string;
	readonly config: AithorConfig;
	readonly intent: string;
	readonly themeKeywords: readonly string[];
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
 * - `themeScore` — the heuristic theme-keyword overlap (0..1), or **absent** when
 *   the raw program did not parse (a datum — "theme not assessable" — never zero).
 * - `model` — the resolved id from the result's `Meta` (which model actually ran).
 */
type UncuratedOutcome = {
	readonly kind: 'uncurated';
	readonly admitted: boolean;
	readonly conform: ConformVerdict;
	readonly themeScore?: number;
	readonly model: string;
};

/**
 * One curated (`validate: true`) success sample's distillate. Admission and
 * conformance are **omitted by construction**: a curated success is admitted AND
 * conformant by definition (the loop guarantees it — "the boundary holds"), so
 * there is nothing to *measure* about them (the charter's "asserted, not
 * measured on the curated path"). What is measurable here is the **load** the
 * loop paid.
 *
 * @remarks
 * - `attempts` — the model-call count the success took: `1` (first try) through
 *   `3` (`MAX_ATTEMPTS`). From the result's `Meta.attempts`.
 * - `themeScore` — the heuristic theme-keyword overlap (0..1). Always present: a
 *   curated success is admitted JEJ, so it provably parses.
 * - `model` — the resolved id from the result's `Meta`.
 */
type CuratedSuccessOutcome = {
	readonly kind: 'curated-success';
	readonly attempts: 1 | 2 | 3;
	readonly themeScore: number;
	readonly model: string;
};

/**
 * One sample that refused — a named cause and the path it arose on. A refusal
 * carries no `Meta` (no successful program), so no `model` and no theme.
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
 * summary), an unrelated concept. A key absent from the map counted zero.
 */
type Histogram<K> = ReadonlyMap<K, number>;

/**
 * A mean 0..1 score with the sample count behind it — for the heuristic theme
 * floor (and, in v2, judge ratings). `n` is mandatory: a mean with no visible
 * sample count is false precision.
 *
 * @remarks
 * `mean` is `NaN` when `n` is `0` (no parseable sample to score). v1 reports
 * `mean` + `n` only; dispersion (a standard deviation) becomes mandatory in v2
 * where a judge's non-determinism stacks on the generator's (see
 * [`./EVAL.md`](./EVAL.md)
 * § The deferred judge seam).
 */
type ScoreSummary = {
	readonly mean: number;
	readonly n: number;
};

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
 * - `themeKeywordPresence` — both: mean heuristic theme-keyword overlap over
 *   samples whose program parsed (absent when none did).
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
	readonly themeKeywordPresence?: ScoreSummary;
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
 *   **well-formed** Outcomes (success *or* refusal), proving the harness ran and
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

// ─── v2 — the judge seam (DESIGNED, NOT BUILT in v1) ──────────────────

/**
 * The provenance stamped on a {@link Rating}: how the number was produced.
 *
 * @remarks
 * `'objective'` — mechanical (the heuristic theme floor; reused gates).
 * `'judge'` — an LLM-as-judge (v2). `'human'` — a human rating (v2). The
 * aggregator **refuses to pool across mechanisms for the same target** — a
 * heuristic theme-keyword floor is never averaged with a judge's theme fidelity.
 * v1's objective metrics are uniformly `'objective'`, so they are not
 * individually stamped; `Mechanism` rides {@link Rating}, which v1 does not emit.
 */
type Mechanism = 'objective' | 'judge' | 'human';

/**
 * The charter's three named, **semantic** eval targets — measured by a judge or a
 * human in v2 (v1 ships only an objective theme-keyword *floor*, not theme
 * *fidelity*).
 */
type Target = 'content' | 'quality' | 'theme';

/**
 * One judge's (or human's) verdict on one (sample, target) — a 0..1 score with
 * its provenance. `rationale` is kept for audit, never aggregated.
 */
type Rating = {
	readonly target: Target;
	readonly score: number;
	readonly mechanism: Mechanism;
	readonly rationale?: string;
};

/**
 * A judge's value-not-throw verdict on one (program, target). Mirrors `aithor`'s
 * `ok`-boolean / value-not-throw posture: a judge that cannot produce a parseable
 * number yields `{ ok: false }` and the aggregator treats that (sample, target) as
 * **unrated** (excluded from `n`), **never** as a score of zero.
 */
type JudgeVerdict =
	| { readonly ok: true; readonly score: number; readonly rationale?: string }
	| { readonly ok: false; readonly cause: 'unparseable' | 'judge-unavailable' };

/**
 * What a judge IS — surfaced on every report so a number's source is never
 * hidden. `calibration` (when present) is the judge's mean-absolute-error against
 * the human-labeled anchor set; a judge target rate is reportable as a *fidelity
 * rate* only when calibration clears a human-set threshold (else flagged
 * `uncalibrated`).
 */
type JudgeDescriptor = {
	readonly kind: 'heuristic' | 'local-llm' | 'cloud';
	readonly model?: string;
	readonly calibration?: { readonly mae: number; readonly n: number };
};

/**
 * The injected judge seam — the same shape of seam as `AithorRuntime`, so the
 * pure core stays fake-testable with a fake judge and v2 is a plug-in, not a
 * reshape. Designed here; **not implemented in v1**.
 *
 * @remarks
 * One method per target keeps the rubric per-target and lets a heuristic judge
 * implement only the targets it can (theme) and defer the rest
 * (`judge-unavailable`). Multi-sample judging is K repeated `rate` calls averaged
 * — there is no sampling knob on a local model.
 */
type Judge = {
	readonly describe: () => JudgeDescriptor;
	readonly rate: (
		target: Target,
		program: string,
		evalCase: Pick<CaseSpec, 'intent' | 'themeKeywords' | 'config'>,
	) => Promise<JudgeVerdict>;
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
	ScoreSummary,
	MetricSet,
	EvalReport,
	// v2 — designed, not built
	Mechanism,
	Target,
	Rating,
	JudgeVerdict,
	JudgeDescriptor,
	Judge,
};
