import { describe, expect, it, vi } from 'vitest';

import isJej from '../../../../../lib/validating/is-jej.js';
import aithor from '../../aithor.js';
import conform from '../../conform.js';
import type {
	AithorConfig,
	AithorResult,
	AithorRuntime,
	ConformResult,
	FeatureSubset,
	RefusalCause,
	SizeBounds,
} from '../../types.js';
import makeWebllmRuntime from '../../webllm-runtime.js';
import aggregate from '../aggregate.js';
import CASE_SPECS from '../case-specs.js';
import computeMetricSet from '../compute-metric-set.js';
import formatReport from '../format-report.js';
import liftOutcome from '../lift-outcome.js';
import type {
	CaseSpec,
	ConformVerdict,
	EvalReport,
	MetricSet,
	Outcome,
	Reads,
} from '../types.js';

// Increment 5 — the impure driver (evals/DOCS.md "Sample" phase, plus the tail
// that lifts, folds, rolls up and renders). The real-model arm is GPU-gated and
// skips off-GPU; every other arm runs in headless Chromium.
// Exceptions: the driver's sole try/catch wraps isJej (evals/DOCS.md § "No read
// aborts a run" — the SOLE driver-wrapped read, a throw folding to
// admitted: false); it lives in admittedOf, which takes the admission function
// as a parameter so the fold is provable without mocking a module. Everything
// else propagates: § Exceptions covers both halves. Every loop and branch lives
// in a named helper, never in an it body.
// Triangulation: the refusing-runtime and scripted-runtime describes demand
// CONTRADICTORY reports from the same runProtocol, so no fixed return value
// passes both — the file is not a pass-everything stub on the GPU-less lane.
// The GPU arm calls that same runProtocol, so every headless arm is also a test
// of the gated arm's code path; the real runtime is all the gate adds.

vi.setConfig({ testTimeout: 60_000 });

type GpuNavigator = { gpu?: { requestAdapter: () => Promise<unknown> } };
const gpuAdapter = await (
	navigator as unknown as GpuNavigator
).gpu?.requestAdapter();
const gpuAvailable = gpuAdapter !== null && gpuAdapter !== undefined;

/** The sample protocol's replication count (evals/README.md § Sample protocol). */
const SAMPLES_PER_CASE = 5;

/**
 * The run's model pin — the one const a size-sweep edits (evals/README.md
 * § Models).
 *
 * @remarks
 * `''` means "let the runtime pick", which is what the ratified corpus asks for
 * on nine of its ten cases, so the shipped value is a literal no-op: the pin
 * mechanism lands, switched off, and the corpus keeps its semantics. Set it to
 * a catalog id and every "pick for me" case runs that artifact instead.
 *
 * A set pin deliberately does NOT override the one case that picks its model
 * explicitly: that explicit pick is a ratified fixture property
 * (`tests/case-specs.test.ts` asserts exactly one case picks), and silently
 * overriding it would defeat the invariant rather than sweep it.
 *
 * `runProtocol` takes the pin as a defaulted parameter rather than reading this
 * const directly, so the swept branch is exercised by a test instead of
 * shipping as dead code no run has ever taken.
 */
const DEFAULT_MODEL = '';

/**
 * What the report's `model` stamp says when not one sample resolved a model —
 * an all-refusal run has nothing to name, and naming the request anyway would
 * claim an artifact that never ran.
 */
const NO_MODEL_RESOLVED = '(none resolved)';

/** Joins the ids of a run that spanned more than one resolved artifact. */
const STAMP_SEPARATOR = ' + ';

/**
 * The witness passed where `liftOutcome` provably never reads it — the curated
 * and refusal branches (`lift-outcome.ts` returns before touching `reads` on
 * both).
 *
 * @remarks
 * Computing the reads uniformly is not an option: a refusal carries no
 * `program` at all, and feeding `''` in its place would be worse than useless —
 * `isJej('')` and `conform('', …)` both come back CLEAN, fabricating a
 * computed-looking read out of nothing. So the value is deliberately
 * pessimistic (not admitted, no violations observed): if the callee's contract
 * ever changes and this value starts being read, the corruption is loud rather
 * than plausible. The tests assert its VALUE, not its identity — the contract
 * is what the witness says, not that one object says it.
 */
const NEVER_READ: Reads = Object.freeze({
	admitted: false,
	conform: Object.freeze({
		ok: false,
		featureViolations: Object.freeze([]),
		sizeViolations: Object.freeze([]),
	}),
});

/**
 * A JEJ-clean reply for the scripted lane: admitted by `isJej`, and carrying an
 * `if` — a feature outside every tight case's subset.
 *
 * @remarks
 * Both properties are load-bearing and neither is obvious. The trailing newline
 * is what makes it admitted (`isJej` compares against Prettier's output, which
 * always ends in one); without it admission is false and the admission arm
 * measures the fixture, not the driver. And the `if` is what makes the drift
 * arm mean anything: a feature-free reply such as `let count = 1;` maps to no
 * feature at all, so it CONFORMS to every tight subset and `featureDrift` comes
 * back empty — a vacuously passing assertion.
 */
const SCRIPTED_REPLY = `let count = 1;\nif (count > 0) {\n\tconsole.log(count);\n}\n`;

/** The scripted lane's resolved id — any catalog-shaped string; never loaded. */
const SCRIPTED_MODEL_ID = 'scripted-model-id';

/** The corpus's one explicit pick — the case a set pin must leave alone. */
const EXPLICIT_PICK_ID = 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC';

/** The real GPU run's budget — see the comment above the gated it for the derivation. */
const GPU_RUN_BUDGET_MS = 3_600_000;

describe('the aithor eval driver', () => {
	describe('the model pin — off by default, a one-const sweep when set', () => {
		it('an empty pin leaves a "pick for me" case unchanged', () => {
			expect(
				pinnedSpec(specNamed('uncurated-scratch-loose'), '').config.model,
			).toBe('');
		});

		it('a set pin replaces a "pick for me" model', () => {
			expect(
				pinnedSpec(specNamed('uncurated-scratch-loose'), 'swept-id').config
					.model,
			).toBe('swept-id');
		});

		it('a set pin leaves an explicit pick alone', () => {
			expect(
				pinnedSpec(specNamed('curated-scratch-loose'), 'swept-id').config.model,
			).toBe(EXPLICIT_PICK_ID);
		});

		it('the shipped pin is off, so every case asks for its own model', async () => {
			const recorder = recordingRuntime(SCRIPTED_MODEL_ID, SCRIPTED_REPLY);
			await runProtocol(recorder.runtime, ignoreCase);

			expect(new Set(recorder.requested)).toEqual(
				new Set(CASE_SPECS.map((spec) => spec.config.model)),
			);
		});

		// The arm that makes the sweep falsifiable: with the pin OFF this is
		// indistinguishable from a driver that never calls pinnedSpec at all, so
		// the mechanism could otherwise ship as dead code and fail first on a real
		// hour-long GPU run.
		it('a set pin sweeps every "pick for me" case and spares the explicit one', async () => {
			const recorder = recordingRuntime(SCRIPTED_MODEL_ID, SCRIPTED_REPLY);
			await runProtocol(recorder.runtime, ignoreCase, 'swept-id');

			expect(new Set(recorder.requested)).toEqual(
				new Set(['swept-id', EXPLICIT_PICK_ID]),
			);
		});
	});

	describe('over a refusing runtime', () => {
		it('an all-refusal run still meets the smoke floor', async () => {
			const report = await runProtocol(
				refusingRuntime('no-model-available'),
				ignoreCase,
			);

			expect(report.smokeOk).toBe(true);
		});

		it('every case collects its full draw count', async () => {
			const report = await runProtocol(
				refusingRuntime('no-model-available'),
				ignoreCase,
			);

			expect(
				report.metricSets.every(
					(metricSet) => metricSet.samples === SAMPLES_PER_CASE,
				),
			).toBe(true);
		});

		it('the run totals every case’s draws', async () => {
			const report = await runProtocol(
				refusingRuntime('no-model-available'),
				ignoreCase,
			);

			expect(report.totalSamples).toBe(CASE_SPECS.length * SAMPLES_PER_CASE);
		});

		it('every case reports a total bring-up refusal rate', async () => {
			const report = await runProtocol(
				refusingRuntime('no-model-available'),
				ignoreCase,
			);

			expect(
				report.metricSets.every(
					(metricSet) => metricSet.bringUpRefusalRate.proportion === 1,
				),
			).toBe(true);
		});

		// Identity, not just shape: every case refuses identically here, so a
		// driver that scrambled which caseId owns which sample set would pass all
		// the rate assertions above untouched.
		it('reports every case under its own id, in corpus order', async () => {
			const report = await runProtocol(
				refusingRuntime('no-model-available'),
				ignoreCase,
			);

			expect(report.metricSets.map((metricSet) => metricSet.caseId)).toEqual(
				CASE_SPECS.map((spec) => spec.id),
			);
		});

		it('carries each case’s quadrant through the fold', async () => {
			const report = await runProtocol(
				refusingRuntime('no-model-available'),
				ignoreCase,
			);

			expect(report.metricSets.map((metricSet) => metricSet.quadrant)).toEqual(
				CASE_SPECS.map((spec) => spec.quadrant),
			);
		});
	});

	describe('over a scripted runtime', () => {
		it('every case reaches its full sample count, so the floor holds', async () => {
			const report = await runProtocol(
				scriptedRuntime(SCRIPTED_MODEL_ID, SCRIPTED_REPLY),
				ignoreCase,
			);

			expect(report.smokeOk).toBe(true);
		});

		it('nothing refuses at bring-up', async () => {
			const report = await runProtocol(
				scriptedRuntime(SCRIPTED_MODEL_ID, SCRIPTED_REPLY),
				ignoreCase,
			);

			expect(
				report.metricSets.every(
					(metricSet) => metricSet.bringUpRefusalRate.numerator === 0,
				),
			).toBe(true);
		});

		it('the loose uncurated case records full admission', async () => {
			const report = await runProtocol(
				scriptedRuntime(SCRIPTED_MODEL_ID, SCRIPTED_REPLY),
				ignoreCase,
			);

			expect(
				metricSetOf(report, 'uncurated-scratch-loose').admissionRate,
			).toEqual({
				numerator: SAMPLES_PER_CASE,
				denominator: SAMPLES_PER_CASE,
				proportion: 1,
			});
		});

		it('the tight uncurated case records the raw program’s feature drift', async () => {
			const report = await runProtocol(
				scriptedRuntime(SCRIPTED_MODEL_ID, SCRIPTED_REPLY),
				ignoreCase,
			);

			expect(
				metricSetOf(report, 'uncurated-scratch-tight').featureDrift,
			).toEqual({ if: SAMPLES_PER_CASE });
		});

		it('the tight uncurated case records no conformance', async () => {
			const report = await runProtocol(
				scriptedRuntime(SCRIPTED_MODEL_ID, SCRIPTED_REPLY),
				ignoreCase,
			);

			expect(
				metricSetOf(report, 'uncurated-scratch-tight').conformanceRate
					?.numerator,
			).toBe(0);
		});

		// The curated half of the fold: a loose curated case admits and conforms on
		// the first attempt, so a real curated-success flows lift -> fold -> format
		// on every scripted run. smokeOk counts WELL-FORMED outcomes and cannot
		// tell a success from a refusal, so without this the whole curated path
		// could regress green.
		it('the loose curated case succeeds on its first attempt', async () => {
			const report = await runProtocol(
				scriptedRuntime(SCRIPTED_MODEL_ID, SCRIPTED_REPLY),
				ignoreCase,
			);

			expect(
				metricSetOf(report, 'curated-scratch-loose').attemptDistribution,
			).toEqual({ 1: SAMPLES_PER_CASE });
		});

		// Presence IS the path claim: a curated case measures no admission,
		// because a curated success is admitted by construction.
		it('a curated case carries no admission rate at all', async () => {
			const report = await runProtocol(
				scriptedRuntime(SCRIPTED_MODEL_ID, SCRIPTED_REPLY),
				ignoreCase,
			);

			expect(
				'admissionRate' in metricSetOf(report, 'curated-scratch-loose'),
			).toBe(false);
		});

		it('the rendered report carries a section for every case', async () => {
			const report = await runProtocol(
				scriptedRuntime(SCRIPTED_MODEL_ID, SCRIPTED_REPLY),
				ignoreCase,
			);

			expect(sectionCountOf(formatReport(report))).toBe(CASE_SPECS.length);
		});

		it('reports each case to the progress callback exactly once, in order', async () => {
			const seen: MetricSet[] = [];
			await runProtocol(
				scriptedRuntime(SCRIPTED_MODEL_ID, SCRIPTED_REPLY),
				(metricSet) => seen.push(metricSet),
			);

			expect(seen.map((metricSet) => metricSet.caseId)).toEqual(
				CASE_SPECS.map((spec) => spec.id),
			);
		});
	});

	describe('the run stamp — provenance measured, not requested', () => {
		it('names no model when none resolved', async () => {
			const report = await runProtocol(
				refusingRuntime('no-model-available'),
				ignoreCase,
			);

			expect(report.model).toBe(NO_MODEL_RESOLVED);
		});

		it('names the one model that resolved', async () => {
			const report = await runProtocol(
				scriptedRuntime(SCRIPTED_MODEL_ID, SCRIPTED_REPLY),
				ignoreCase,
			);

			expect(report.model).toBe(SCRIPTED_MODEL_ID);
		});

		// A non-pinned selection descends its fallback chain silently, so one run
		// really can span two artifacts. Sorted, so the stamp does not depend on
		// which case happened to draw which.
		it('names every model a run spanned, sorted', async () => {
			const report = await runProtocol(
				alternatingRuntime('zeta-model', 'alpha-model', SCRIPTED_REPLY),
				ignoreCase,
			);

			expect(report.model).toBe(`alpha-model${STAMP_SEPARATOR}zeta-model`);
		});
	});

	describe('the reads — computed where consumed, witnessed where not', () => {
		it('an uncurated ok result reads the returned program', async () => {
			const reads = await readsFor(
				specNamed('uncurated-scratch-tight'),
				okResult(SCRIPTED_REPLY),
			);

			expect(reads.conform.featureViolations).toEqual(['if']);
		});

		it('an uncurated ok result carries the admission verdict', async () => {
			const reads = await readsFor(
				specNamed('uncurated-scratch-tight'),
				okResult(SCRIPTED_REPLY),
			);

			expect(reads.admitted).toBe(true);
		});

		it('a curated ok result yields the never-read witness', async () => {
			const reads = await readsFor(
				specNamed('curated-scratch-loose'),
				okResult(SCRIPTED_REPLY),
			);

			expect(reads).toEqual(NEVER_READ);
		});

		it('a refusal yields the never-read witness', async () => {
			const reads = await readsFor(
				specNamed('uncurated-scratch-tight'),
				refusedResult('attempt-bound-exhausted'),
			);

			expect(reads).toEqual(NEVER_READ);
		});

		// The driver and liftOutcome each resolve the path independently, so they
		// must agree on the parent contract's default. Every corpus case sets
		// validate explicitly, which leaves that default untested — this arm is
		// where the two would be caught drifting apart.
		it('a case that omits validate is curated by default, as liftOutcome reads it', async () => {
			const spec = specNamed('uncurated-scratch-tight');
			const defaulted: CaseSpec = {
				...spec,
				config: { prompt: spec.config.prompt, model: spec.config.model },
			};

			expect(await readsFor(defaulted, okResult(SCRIPTED_REPLY))).toEqual(
				NEVER_READ,
			);
		});
	});

	describe('the case’s requested constraints — read off the spec', () => {
		it('a tight case’s subset is the features it asked for', () => {
			expect(subsetOf(specNamed('uncurated-scratch-tight').config)).toEqual({
				include: ['while'],
				exclude: [],
			});
		});

		it('a loose case asks for all of JEJ', () => {
			expect(subsetOf(specNamed('uncurated-scratch-loose').config)).toEqual({
				include: [],
				exclude: [],
			});
		});

		it('a tight case’s bounds are the dimensions it asked for', () => {
			expect(boundsOf(specNamed('uncurated-scratch-tight').config)).toEqual({
				lines: 8,
				complexity: 2,
			});
		});

		it('an absent dimension is omitted, never carried as undefined', () => {
			expect(
				Object.keys(boundsOf(specNamed('uncurated-scratch-loose').config)),
			).toEqual([]);
		});
	});

	describe('exceptions — the one wrapped read, and everything else', () => {
		it('an admission throw folds to not-admitted, never aborting the run', async () => {
			const admitted = await admittedOf(SCRIPTED_REPLY, () =>
				Promise.reject(new Error('prettier exploded')),
			);

			expect(admitted).toBe(false);
		});

		// The other half of the contract: nothing else is swallowed. A thrown
		// generation means aithor did NOT return a structured value end-to-end,
		// which is exactly what the smoke floor claims it did.
		it('a thrown generation propagates instead of folding into a refusal', async () => {
			await expect(
				runProtocol(explodingRuntime(SCRIPTED_MODEL_ID), ignoreCase),
			).rejects.toThrow('generation exploded');
		});

		// Fail-fast at the boundary, mirroring liftOutcome's own guards: an ok
		// result with nothing to read is the caller's defect. Falling back to ''
		// would be worse than a throw — it reads CLEAN.
		it('an ok result carrying no program is a malformed boundary value', async () => {
			await expect(
				readsFor(specNamed('uncurated-scratch-tight'), {
					ok: true,
					meta: { model: SCRIPTED_MODEL_ID, attempts: 1 },
				}),
			).rejects.toThrow('carries no program');
		});
	});

	describe('corpus preconditions the driver assumes', () => {
		// The driver reads an uncurated case's subset/size straight off its
		// config. A vary resolves its holds INSIDE aithor, below the seam, so an
		// uncurated vary case would be conformed against the wrong subset —
		// silently. This arm goes red instead.
		it('no uncurated case carries a vary', () => {
			expect(
				CASE_SPECS.filter(
					(spec) => spec.config.validate === false && spec.config.vary,
				),
			).toEqual([]);
		});
	});

	describe('bundling in real Chromium', () => {
		it('builds the WebLLM runtime without invoking the engine', () => {
			expect(typeof makeWebllmRuntime().loadModel).toBe('function');
		});
	});

	// The real thing: every case sampled against a threaded runtime. Budgeted at
	// an hour, derived rather than guessed, because this run is nothing like the
	// precedent's ONE generation:
	//   - 50-110 model calls (4 uncurated x 5 single calls, plus 6 curated x 5
	//     samples x up to MAX_ATTEMPTS 3). At the coder family's max_tokens a
	//     maxed reply is 9-17s, so the calls alone reach ~31 minutes at the tail.
	//   - TWO cold downloads, not one. Nine cases ask for '' and resolve to the
	//     runtime's cost-aware pick (the 1.5B coder: local-llm's pickDefault
	//     takes the largest rung under a 2048MB ceiling, code-specialized
	//     breaking the tie); the tenth pins the 0.5B explicitly. Threading one
	//     runtime object still caches each of those, so it is two bring-ups, not
	//     fifty — but it is not one.
	// evals/README.md's "single-digit minutes" describes the median run; this
	// budget has to survive the tail, and 30 minutes did not cover its own
	// arithmetic.
	// retry is pinned to 0, which does not contradict the browser project's
	// retry: 2 — that setting's own WHY scopes it to "browser tests spawn Workers
	// with SharedArrayBuffer pause protocol", and this driver spawns no Worker.
	// Retrying here would burn three hours and up to ~330 real inferences on one
	// failure.
	describe('the real GPU run', () => {
		it.skipIf(!gpuAvailable)(
			'prints the eval report and meets the smoke floor',
			{ timeout: GPU_RUN_BUDGET_MS, retry: 0 },
			async () => {
				const report = await runProtocol(makeWebllmRuntime(), logCase);
				console.log(formatReport(report));

				expect(report.smokeOk).toBe(true);
			},
		);
	});
});

/**
 * The whole protocol: every {@link CaseSpec} sampled `SAMPLES_PER_CASE` times
 * against one runtime, folded per case and rolled up into one report.
 *
 * @remarks
 * The runtime object is threaded, never rebuilt — aithor brings a model up once
 * per request, and the load cache lives in the runtime's closure, keyed by
 * resolved id. Passing the SAME object to every call is therefore what makes
 * the run one bring-up per DISTINCT model rather than one per sample; the
 * corpus resolves two (see the GPU arm's budget note), not one.
 *
 * `onCaseDone` fires as each case folds. It exists because this is one long
 * `it`: a run that dies at case seven must still leave cases one through six in
 * the output.
 *
 * `modelPin` defaults to {@link DEFAULT_MODEL} and is a parameter so a sweep is
 * testable rather than merely shipped.
 */
async function runProtocol(
	runtime: AithorRuntime,
	onCaseDone: (metricSet: MetricSet) => void,
	modelPin: string = DEFAULT_MODEL,
): Promise<EvalReport> {
	const metricSets: MetricSet[] = [];
	const drawn: Outcome[] = [];

	// Sequential by design: the cases share one bring-up, and fifty concurrent
	// inferences would contend for the one GPU rather than finish sooner.
	for (const spec of CASE_SPECS) {
		const outcomes = await sampleCase(pinnedSpec(spec, modelPin), runtime);
		const metricSet = computeMetricSet(outcomes, {
			caseId: spec.id,
			quadrant: spec.quadrant,
			expectedSatisfiable: spec.expectedSatisfiable,
		});

		metricSets.push(metricSet);
		// Outcomes outlive their fold ONLY to reach stampFor: provenance is a
		// run-level fact and MetricSet carries no model field, so the raw
		// outcomes are the last place the resolved ids still exist. This is one
		// edge beyond the DOCS.md sketch, which routes Outcome into the fold
		// alone.
		drawn.push(...outcomes);
		onCaseDone(metricSet);
	}

	return aggregate(
		metricSets,
		stampFor(drawn),
		new Date().toISOString(),
		SAMPLES_PER_CASE,
	);
}

/** `SAMPLES_PER_CASE` fresh draws of one case, each lifted to an `Outcome`. */
async function sampleCase(
	spec: CaseSpec,
	runtime: AithorRuntime,
): Promise<readonly Outcome[]> {
	const outcomes: Outcome[] = [];

	for (let draw = 0; draw < SAMPLES_PER_CASE; draw += 1) {
		outcomes.push(await drawOnce(spec, runtime));
	}

	return outcomes;
}

/**
 * One draw: `aithor` for the result, the reads where they are consumed, then
 * the lift.
 *
 * @remarks
 * Deliberately does not catch. A thrown `aithor` means it did not return a
 * structured value end-to-end, which is exactly what the smoke floor claims it
 * did — swallowing that would turn the run's one honest assertion into a lie.
 */
async function drawOnce(
	spec: CaseSpec,
	runtime: AithorRuntime,
): Promise<Outcome> {
	const result = await aithor(spec.program, spec.config, runtime);
	const reads = await readsFor(spec, result);

	return liftOutcome(spec, result, reads);
}

/** The case as the run should ask for it — see {@link DEFAULT_MODEL} for the pin. */
function pinnedSpec(spec: CaseSpec, model: string): CaseSpec {
	// An unset pin is the shipped no-op; an explicit pick is the corpus's, not
	// the sweep's, so both leave the case exactly as the corpus wrote it.
	if (model === '' || spec.config.model !== '') return spec;

	return { ...spec, config: { ...spec.config, model } };
}

/**
 * The report's `model` stamp, read off what actually ran rather than off the
 * request.
 *
 * @remarks
 * Measured, not claimed — the harness's own charter applied to its provenance.
 * A non-pinned selection descends its fallback chain silently, so a run CAN
 * span more than one artifact; naming every distinct id that resolved makes
 * that visible in the header instead of invisible. Sorted, so the stamp does
 * not depend on case order.
 */
function stampFor(outcomes: readonly Outcome[]): string {
	// A refusal never reached a model, so it names none; every other variant
	// carries the id that actually ran.
	const resolved = outcomes.flatMap((outcome) =>
		outcome.kind === 'refusal' ? [] : [outcome.model],
	);
	const distinct = Array.from(new Set(resolved)).toSorted((left, right) =>
		left.localeCompare(right, 'en-US'),
	);

	if (distinct.length === 0) return NO_MODEL_RESOLVED;

	return distinct.join(STAMP_SEPARATOR);
}

/**
 * The reads, computed on the one branch `liftOutcome` consumes them and
 * witnessed everywhere else (see {@link NEVER_READ}).
 */
async function readsFor(spec: CaseSpec, result: AithorResult): Promise<Reads> {
	// The parent contract's resolution, same as liftOutcome's: an absent
	// validate defaults to curated.
	const curated = spec.config.validate !== false;
	if (curated || !result.ok) return NEVER_READ;

	const { program } = result;
	if (program === undefined) {
		throw new Error('readsFor: an ok AithorResult carries no program');
	}

	return {
		admitted: await admittedOf(program),
		conform: verdictFor(spec.config, program),
	};
}

/**
 * The admission read — the SOLE driver-wrapped call (evals/DOCS.md § "No read
 * aborts a run"): a throw folds to `admitted: false`, because a degenerate
 * candidate is data, not a crash.
 *
 * @remarks
 * `admit` is a parameter defaulting to the real `isJej` — the same injected-seam
 * idiom `aithor` uses for its runtime — so the fold is provable without mocking
 * a module the rest of the file depends on.
 */
async function admittedOf(
	program: string,
	admit: (code: string) => Promise<boolean> = isJej,
): Promise<boolean> {
	try {
		return await admit(program);
	} catch {
		return false;
	}
}

/** The conformance read against the CASE's requested subset and bounds. */
function verdictFor(config: AithorConfig, program: string): ConformVerdict {
	return flattenVerdict(conform(program, subsetOf(config), boundsOf(config)));
}

/**
 * A `ConformResult` flattened to the core's feature / dimension lists.
 *
 * @remarks
 * The two arms are exhaustive over `ConformanceViolation` as it stands — a
 * closed union of `feature` and `size` this file does not own. A third member
 * added upstream would fall through BOTH filters and vanish from the histograms
 * silently rather than fail, so widening that union in `aithor/types.ts`
 * obliges widening this.
 */
function flattenVerdict(result: ConformResult): ConformVerdict {
	return {
		ok: result.ok,
		featureViolations: result.violations.flatMap((violation) =>
			violation.kind === 'feature' ? [violation.feature] : [],
		),
		sizeViolations: result.violations.flatMap((violation) =>
			violation.kind === 'size' ? [violation.dimension] : [],
		),
	};
}

/**
 * The subset the CASE asked for.
 *
 * @remarks
 * Read off the CaseSpec, not off what aithor resolved — on the uncurated path
 * aithor gates nothing, so the question this read answers is "did the raw
 * output fit what the learner asked for", and the learner's ask is the spec
 * (evals/types.ts § ConformVerdict). An absent `include` asks for all of JEJ.
 */
function subsetOf(config: AithorConfig): FeatureSubset {
	return { include: config.include ?? [], exclude: config.exclude ?? [] };
}

/** The bounds the CASE asked for; an absent dimension is omitted, never `undefined`. */
function boundsOf(config: AithorConfig): SizeBounds {
	// Spread-when-present, not `lines: config.lines` — under
	// exactOptionalPropertyTypes an explicit undefined is not an absent key, and
	// a `lines: 0` bound must survive.
	return {
		...(config.lines === undefined ? {} : { lines: config.lines }),
		...(config.complexity === undefined
			? {}
			: { complexity: config.complexity }),
	};
}

/** A runtime whose bring-up always refuses — no model, no generation. */
function refusingRuntime(cause: RefusalCause): AithorRuntime {
	return { loadModel: () => Promise.resolve({ cause }) };
}

/** A runtime that brings up and answers every generate call with the same program. */
function scriptedRuntime(resolvedId: string, program: string): AithorRuntime {
	return {
		loadModel: () =>
			Promise.resolve({
				model: {
					generate: () => Promise.resolve({ raw: program, code: program }),
				},
				resolvedId,
			}),
	};
}

/** A scripted runtime that resolves a different id on each successive bring-up. */
function alternatingRuntime(
	firstId: string,
	secondId: string,
	program: string,
): AithorRuntime {
	const ids = [firstId, secondId];
	let call = 0;
	return {
		loadModel: () => {
			const resolvedId = ids[call % ids.length] ?? firstId;
			call += 1;
			return Promise.resolve({
				model: {
					generate: () => Promise.resolve({ raw: program, code: program }),
				},
				resolvedId,
			});
		},
	};
}

/** A runtime that brings up cleanly and then throws on generation. */
function explodingRuntime(resolvedId: string): AithorRuntime {
	return {
		loadModel: () =>
			Promise.resolve({
				model: {
					generate: () => Promise.reject(new Error('generation exploded')),
				},
				resolvedId,
			}),
	};
}

/** A scripted runtime that also records the model id each bring-up was asked for. */
function recordingRuntime(
	resolvedId: string,
	program: string,
): { readonly runtime: AithorRuntime; readonly requested: readonly string[] } {
	const requested: string[] = [];
	const scripted = scriptedRuntime(resolvedId, program);
	return {
		requested,
		runtime: {
			loadModel: (name: string) => {
				requested.push(name);
				return scripted.loadModel(name);
			},
		},
	};
}

/** The corpus entry with this id, or a throw naming the id that is missing. */
function specNamed(caseId: string): CaseSpec {
	const spec = CASE_SPECS.find((candidate) => candidate.id === caseId);
	if (spec === undefined) {
		throw new Error(`specNamed: no case "${caseId}" in the corpus`);
	}

	return spec;
}

/** The report's entry for this case, or a throw naming the id that is missing. */
function metricSetOf(report: EvalReport, caseId: string): MetricSet {
	const metricSet = report.metricSets.find(
		(candidate) => candidate.caseId === caseId,
	);
	if (metricSet === undefined) {
		throw new Error(`metricSetOf: no metric set for "${caseId}"`);
	}

	return metricSet;
}

/** A successful `AithorResult` carrying this program. */
function okResult(program: string): AithorResult {
	return {
		ok: true,
		program,
		meta: { model: SCRIPTED_MODEL_ID, attempts: 1 },
	};
}

/** A refused `AithorResult` with this cause. */
function refusedResult(cause: RefusalCause): AithorResult {
	return { ok: false, refusal: { cause } };
}

/** How many per-case sections the rendered report opened (format-report.ts). */
function sectionCountOf(rendered: string): number {
	return rendered.split('\n').filter((line) => line.startsWith('## ')).length;
}

/** The non-GPU arms want no progress noise in CI. */
function ignoreCase(): void {
	return undefined;
}

/** The GPU arm's trail — an hour-long it must say where it got to. */
function logCase(metricSet: MetricSet): void {
	console.log(
		`[eval] ${metricSet.caseId}: ${metricSet.samples} samples collected`,
	);
}
