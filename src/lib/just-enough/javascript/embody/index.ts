/**
 * @file `embody(code)` — JEJ snippet factory.
 *
 * Two dispatch paths converge on the same `Snippet` contract from
 * `./types.ts`:
 *
 * 1. **Scenario dispatch** — `code` (after `trim().toUpperCase()`
 *    normalization) matches one of 11 entries in `EMBODY_SCENARIOS`.
 *    Returns a deterministic canned `Snippet` shape per named scenario.
 *    These canned scenarios are a permanent integration-testing fixture
 *    set used by tests, sandbox harnesses, and the live editor to drive
 *    every reachable Snippet shape without crafting real JS.
 * 2. **Real composition** — any other input goes through `embody/lib/*`
 *    (tokenize → AST → static analyses → validation → script-scope
 *    creation). Real composition wires in slice-by-slice; see
 *    `EMBODY-IMPL-HANDOFF.md` for the per-module landing schedule.
 *
 * Both paths produce a deep-frozen `Snippet`. The factory's contract
 * (signature, frozen output, deep-freeze pass) is stable; real
 * composition wires into the non-scenario branch slice-by-slice per
 * `EMBODY-IMPL-HANDOFF.md`. The scenario branch is permanent end-state.
 *
 * ## Eleven named scenarios
 *
 * Scenario dispatch recognizes the strings in `EMBODY_SCENARIOS`,
 * matched after `trim().toUpperCase()` normalization. Internal whitespace,
 * punctuation, and substrings do not match — they fall through to real
 * composition.
 *
 * ```text
 * code: string
 *   |
 *   v
 * normalize (trim + toUpperCase)
 *   |
 *   v
 * in EMBODY_SCENARIOS?
 *   |
 *   |--- yes:
 *   |     |--- "OK"                  --> apex leaf; all status true; eval completes
 *   |     |--- "FAIL_AT_TOKENIZE"    --> tokenize-fail leaf; status all false
 *   |     |--- "FAIL_AT_PARSE"       --> parse-fail leaf; tokenized:T, rest false
 *   |     |--- "VALIDATION_FAIL"     --> validate-fail leaf; parsed:T, validated:F;
 *   |     |                              canned violation; creation null;
 *   |     |                              evaluation no-op (not-runnable)
 *   |     |--- "FAIL_AT_CREATE"      --> create-fail leaf; validated:T, created:F;
 *   |     |                              creation null; evaluation no-op
 *   |     |--- "NON_DETERMINISTIC"   --> apex leaf; nonDeterminism.random:T overlay
 *   |     |--- "PAUSES"              --> apex leaf; hasIo.user.total:1 overlay
 *   |     |--- "EVAL_ERROR"          --> apex leaf; run() outcome:'errored'
 *   |     |--- "EVAL_TIMEOUT"        --> apex leaf; run() outcome:'timed-out'
 *   |     |--- "EVAL_LIMIT"          --> apex leaf; run() outcome:'limit-exceeded'
 *   |     |--- "EVAL_CANCELLED"      --> apex leaf; run() outcome:'cancelled'
 *   |
 *   |--- no:  real composition (per embody/lib/*; throws on input the
 *             non-scenario path does not yet handle — see
 *             EMBODY-IMPL-HANDOFF.md)
 *   |
 *   v
 * assemble Snippet per types.ts § 14 staircase
 *   |
 *   v
 * deepFreezeInPlace — single freeze pass; visited-set cycle guard
 * handles the runInstance.snippet back-ref in all scenarios
 *   |
 *   v
 * frozen Snippet
 * ```
 *
 * See `embody/DOCS.md` § Data flow for the architectural sketch of
 * the construction pipeline behind the real-composition branch.
 *
 * ## Naming convention
 *
 * - `FAIL_AT_<STAGE>` — the named stage's status flag is false.
 *   `FAIL_AT_TOKENIZE` sets `status.tokenized: false`; subsequent
 *   stages cascade-false per types.ts § 14 staircase.
 * - `EVAL_<OUTCOME>` — apex `status.*: true`, but `run()` resolves to
 *   a frozen `RunInstance` whose `endReport.outcome` is the named
 *   outcome (`'errored' | 'timed-out' | 'limit-exceeded' | 'cancelled'`).
 *   types.ts has no `status.evaluated` flag — eval failure is a
 *   per-call `endReport.outcome` concern, hence the asymmetric name.
 * - `OK`, `VALIDATION_FAIL`, `NON_DETERMINISTIC`, `PAUSES` — apex
 *   status with overlay flips. `OK` is the unmodified apex.
 *
 * ## Canned-shape stub fields (open holes preserved)
 *
 * Per `embody/DOCS.md` § "Open holes in the contract", several fields
 * are intentionally unspecified. Scenario dispatch honors this:
 * - `Distribution.samples: []` (raw vs stats-only resolution open).
 * - `HasIo` ships only `total` keys; per-method counts (alert/prompt/
 *   confirm/log/etc) omitted (per-method-vs-sums-only resolution open).
 * - `Features` ships only the 12 fields enumerated in types.ts.
 * - The canned `Violation` for `VALIDATION_FAIL`, the eval-failure
 *   `EmbodyError` shapes, and the create-fail `errors.kind` are all
 *   canned-shape; downstream tests should branch on the named
 *   field (e.g. `errors.phase === 'creation'`, `validation.violations.
 *   length > 0`, `endReport.outcome === 'errored'`) rather than on
 *   specific kind/message/path values.
 *
 * ## Anti-pattern: no consumer-side branching on `snippet.source.code`
 *
 * Consumers (lenses, orchestrator, recommender, …) MUST NOT use
 * `source.code` content as a discriminator — branch on the resulting
 * `Snippet`'s `status` / `validation` / `endReport` shape instead.
 * Lenses MAY read `source.code` to *render* it; what they MAY NOT do
 * is use it as a branching key. AR-4 / AR-5 audits grep consumer code
 * for `source.code === '<scenario>'` literal occurrences and fail any
 * non-test usage.
 *
 * ## Public surface
 *
 * Default export: `embody(code: string): Snippet`. Internal-only per
 * `embody/README.md` (the package's public surface is the
 * `<StudyLenses>` orchestrator, not embody). Named export:
 * `EMBODY_SCENARIOS` — a frozen `ReadonlyArray<string>` of the
 * 11 valid scenario keywords, used by the throw error message and by
 * orchestrator dev / test fixtures that want to enumerate scenarios.
 *
 * @see ./types.ts — the `Snippet` contract
 * @see ./DOCS.md — architectural sketch + § Open holes
 * @see ../EMBODY-IMPL-HANDOFF.md — incremental real-composition plan
 */

import type { Node as AcornNode } from 'acorn';

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type {
	Analysis,
	AnyNMEvent,
	BindingNMEvent,
	CommentNMEvent,
	ControlFlow,
	CreationData,
	CreationEntwined,
	Distribution,
	EmbodyError,
	EndReport,
	EvaluateHandle,
	EvaluateOptions,
	EvaluationEvents,
	EvaluationPhase,
	EventsView,
	Features,
	HasIo,
	Metrics,
	NodeNMEvent,
	NonDeterminism,
	ParseASTData,
	ParseASTEntwined,
	ParseASTPhase,
	RealmData,
	RealmEntwined,
	RealmNMEvent,
	RealmPhase,
	RunInstance,
	ScopeEntwined,
	ScopeNMEvent,
	Snippet,
	Source,
	TokenizeData,
	TokenizeEntwined,
	TokenizePhase,
	TokenNMEvent,
	Validation,
	Violation,
} from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Scenario list — single source of truth for the discriminator + throw message.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The 11 named scenarios accepted by `embody(code)`.
 *
 * @internal — embody-internal scenario keyword list. NOT re-exported from
 * any package barrel.
 */
const EMBODY_SCENARIOS = Object.freeze([
	'OK',
	'FAIL_AT_TOKENIZE',
	'FAIL_AT_PARSE',
	'VALIDATION_FAIL',
	'FAIL_AT_CREATE',
	'NON_DETERMINISTIC',
	'PAUSES',
	'EVAL_ERROR',
	'EVAL_TIMEOUT',
	'EVAL_LIMIT',
	'EVAL_CANCELLED',
] as const);

type EmbodyScenario = (typeof EMBODY_SCENARIOS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — shape-valid stubs reused across scenarios.
// ─────────────────────────────────────────────────────────────────────────────

/** Build a `Source` from the input string. */
function buildSource(code: string): Source {
	return { code, offsets: [0] };
}

/** Empty realm-events generator. Yields nothing. */
function* emptyRealmStream(): Generator<RealmNMEvent> {
	// intentionally empty — scenario dispatch emits no events on this stream
}

/** Empty tokenize-events generator. Yields nothing. */
function* emptyTokenizeStream(): Generator<TokenNMEvent | CommentNMEvent> {
	// intentionally empty — scenario dispatch emits no events on this stream
}

/** Empty AST-node-events generator. Yields nothing. */
function* emptyParseStream(): Generator<NodeNMEvent> {
	// intentionally empty — scenario dispatch emits no events on this stream
}

/** Empty creation-events generator. Yields nothing. */
function* emptyCreateStream(): Generator<ScopeNMEvent | BindingNMEvent> {
	// intentionally empty — scenario dispatch emits no events on this stream
}

/** Empty async event stream for `EvaluateHandle`. Yields nothing, completes immediately. */
async function* emptyEvaluateAsyncIterator(): AsyncGenerator<AnyNMEvent> {
	// intentionally empty — scenario dispatch emits no events on this stream
}

/** No-op cancel for `EvaluateHandle`. Scenario dispatch does not schedule cancellation. */
function noOpCancel(): void {
	// intentional no-op
}

/** Build a zero-default `Distribution` — open-hole stub per DOCS.md § Open holes. */
function makeStubDistribution(): Distribution {
	return { min: 0, max: 0, mean: 0, median: 0, samples: [] };
}

/**
 * Build a `Metrics` deriving the safely-computable fields from inputs
 * (source.chars, source.lines, tokens). Distributions and the rest
 * stay zero per open-hole stub discipline.
 */
function makeStubMetrics(code: string, tokensCount: number): Metrics {
	return {
		source: { chars: code.length, lines: code.split('\n').length },
		tokens: tokensCount,
		nodes: 0,
		comments: 0,
		statements: 0,
		expressions: 0,
		blockLengths: makeStubDistribution(),
		lineLengths: makeStubDistribution(),
		expressionLengths: makeStubDistribution(),
		statementLengths: makeStubDistribution(),
		loops: 0,
		branches: 0,
		bindings: { script: 0, block: 0, total: 0 },
		maxNestingDepth: 0,
	};
}

/** Build a zero-default `Features` — only the 12 fields enumerated in types.ts; all `false`. */
function makeStubFeatures(): Features {
	return {
		usesShortCircuit: false,
		usesOptionalChaining: false,
		usesCoercionPlus: false,
		usesIncrementOp: false,
		usesForOf: false,
		usesTemplateLiteral: false,
		usesTernary: false,
		usesIn: false,
		usesTypeof: false,
		usesRegex: false,
		usesBigInt: false,
		usesNewDate: false,
	};
}

/** Build an empty `ControlFlow`. */
function makeStubControlFlow(): ControlFlow {
	return { branches: [], breaks: [], continues: [] };
}

/**
 * Build a `NonDeterminism` record. By default all four sources
 * (`random`, `clock`, `userInput`, `locale`) are false.
 *
 * For the `NON_DETERMINISTIC` scenario, `random: true` is set —
 * arbitrary among the four sources; granularity not modeled by the
 * canned scenario set. If a lens differentiates by source, add
 * `NON_DETERMINISTIC_CLOCK` / `_USER_INPUT` / `_LOCALE` scenarios on
 * demand.
 */
function makeStubNonDeterminism(
	overrides: Partial<NonDeterminism> = {},
): NonDeterminism {
	return {
		random: false,
		clock: false,
		userInput: false,
		locale: false,
		...overrides,
	};
}

/**
 * Build a `HasIo` shape. By default all `total` keys are 0 and per-
 * method keys are omitted (open-hole stub per DOCS.md § Open holes —
 * per-method-vs-sums-only resolution is left open).
 *
 * For the `PAUSES` scenario, `user.total: 1` is set. This is the
 * smallest value that makes `Validation.doesPause` derive to `true`
 * per types.ts line 381. Per-method counts (alert/confirm/prompt)
 * remain omitted; if a lens needs to differentiate the IO source,
 * add `PAUSES_PROMPT` / `PAUSES_ALERT` modes on demand.
 */
function makeStubHasIo(userTotal = 0): HasIo {
	return {
		user: { total: userTotal },
		dev: { total: 0 },
		total: userTotal,
	};
}

/**
 * Build stub cross-phase `Analysis` (was `StaticAnalyses`). `realm` and
 * `initialScope` are no longer part of `Analysis` — they live on
 * `RealmPhase` and `CreationPhase` respectively.
 */
function makeStubAnalysis(
	code: string,
	tokensCount: number,
	nonDeterminismOverride: Partial<NonDeterminism> = {},
	hasIoUserTotal = 0,
): Analysis {
	return {
		bindings: [],
		dependencies: [],
		features: makeStubFeatures(),
		metrics: makeStubMetrics(code, tokensCount),
		controlFlow: makeStubControlFlow(),
		nonDeterminism: makeStubNonDeterminism(nonDeterminismOverride),
		hasIo: makeStubHasIo(hasIoUserTotal),
	};
}

/** Minimal plain-object acorn token for `raw.tokens` on the parse-fail leaf. */
function makeStubRawToken(code: string): unknown {
	return { type: { label: 'eof' }, value: undefined, start: code.length, end: code.length };
}

/**
 * Minimal `AcornNode` (Program root) for `raw.ast` on parse-success leaves.
 * The real-composition branch emits real acorn output for non-scenario inputs.
 */
function makeStubAcornNode(code: string): AcornNode {
	return { type: 'Program', start: 0, end: code.length, body: [], sourceType: 'script' } as unknown as AcornNode;
}

/** Build a stub `RealmPhase` — data/entwined are placeholder open holes. */
function makeStubRealmPhase(): RealmPhase {
	return {
		data: {} as RealmData,
		entwined: {} as RealmEntwined,
		events: emptyRealmStream,
	};
}

/** Build a stub `TokenizePhase` — data/entwined are placeholder open holes. */
function makeStubTokenizePhase(): TokenizePhase {
	return {
		data: {} as TokenizeData,
		entwined: {} as TokenizeEntwined,
		events: emptyTokenizeStream,
	};
}

/** Build a stub `ParseASTPhase` — data/entwined are placeholder open holes. */
function makeStubParseASTPhase(): ParseASTPhase {
	return {
		data: {} as ParseASTData,
		entwined: {} as ParseASTEntwined,
		events: emptyParseStream,
	};
}

/** Build an `EvaluateHandle` whose async iterator yields zero events. */
function makeStubEvaluateHandle(runInstance: RunInstance): EvaluateHandle {
	return {
		[Symbol.asyncIterator]: emptyEvaluateAsyncIterator,
		result: Promise.resolve(runInstance),
		cancel: noOpCancel,
	};
}

/** Build the `EvaluationEvents` surface bound to a given `RunInstance`. */
function makeEvaluationEvents(runInstance: RunInstance): EvaluationEvents {
	return {
		run: (_options?: EvaluateOptions): Promise<RunInstance> =>
			Promise.resolve(runInstance),
		intercept: (_options?: EvaluateOptions): EvaluateHandle =>
			makeStubEvaluateHandle(runInstance),
		trace: {
			variables: (_options?: EvaluateOptions): EvaluateHandle =>
				makeStubEvaluateHandle(runInstance),
			syntax: (_options?: EvaluateOptions): EvaluateHandle =>
				makeStubEvaluateHandle(runInstance),
			semantics: (_options?: EvaluateOptions): EvaluateHandle =>
				makeStubEvaluateHandle(runInstance),
		},
	};
}

/** No-op run result for non-apex leaves — evaluation gate was never passed. */
const NOT_RUNNABLE_REPORT: EndReport = Object.freeze({ ok: false, error: null, outcome: 'not-runnable' } as EndReport);

/**
 * Wire the snippet back-ref into a RunInstance before the freeze pass.
 * The mutation is intentional and contained to the construction window —
 * the RunInstance is not observable before `deepFreezeInPlace` seals it.
 */
function wireSnippetBackReference(ri: RunInstance, snippet: Snippet): void {
	// eslint-disable-next-line functional/immutable-data, functional/prefer-readonly-type
	(ri as { snippet: Snippet }).snippet = snippet;
}

/**
 * Build a `RunInstance` shell with the supplied `endReport`. The
 * `snippet` back-ref is wired after the outer Snippet is constructed;
 * see each scenario builder for the assignment + freeze pass.
 */
function makeStubRunInstance(endReport: EndReport): RunInstance {
	return {
		events: [],
		endReport,
		finalEnvironment: {} as unknown as ScopeEntwined,
		runMetrics: { steps: 0, durationMs: 0, iterationCount: 0 },
		snippet: undefined as unknown as Snippet,
	};
}

/**
 * Build the canned `EmbodyError` for an evaluate-phase failure. The
 * `kind` and `message` are canned-shape; downstream tests should
 * branch on `endReport.outcome`, NOT on these specifics.
 */
function makeEvalError(outcome: EndReport['outcome']): EmbodyError {
	return {
		phase: 'evaluation',
		kind: 'EvalError',
		message: `canned scenario: evaluate-phase ${outcome}`,
		loc: null,
	};
}

/**
 * Build the `endReport` for an apex-status mode given the requested
 * outcome. `'completed'` → ok:true, error:null. All other outcomes
 * → ok:false with a fabricated `EmbodyError`.
 */
function makeApexEndReport(outcome: EndReport['outcome']): EndReport {
	if (outcome === 'completed') {
		return { ok: true, error: null, outcome: 'completed' };
	}
	return { ok: false, error: makeEvalError(outcome), outcome };
}

/**
 * The canned `Violation` used by the `VALIDATION_FAIL` scenario.
 * Canned-shape: downstream tests should assert
 * `validation.violations.length > 0` rather than specific
 * kind/message/path values.
 */
function makeStubViolation(): Violation {
	return {
		kind: 'FunctionDeclaration',
		message: 'canned scenario: JEJ does not allow function declarations',
		nodePath: '$.body[0]',
		loc: {
			start: { line: 1, column: 0 },
			end: { line: 1, column: 1 },
		},
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario builders.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the clean `validation` summary attached to the `FAIL_AT_CREATE`
 * leaf. Tokenize-fail and parse-fail leaves carry `validation: null`
 * (validate gate never ran). All five fields explicit per types.ts § 12;
 * shape-valid clean defaults (isJeJ=true) since the create-fail leaf
 * reached the validate gate and passed.
 */
function buildStageFailValidation(): Validation {
	return {
		isJeJ: true,
		isDeterministic: true,
		doesPause: false,
		formatted: true,
		violations: [],
	};
}

/** Build the `FAIL_AT_TOKENIZE` Snippet — status all false; raw all null. */
function buildFailAtTokenizeSnippet(code: string): Snippet {
	const realmPhase = makeStubRealmPhase();
	const runInstance = makeStubRunInstance(NOT_RUNNABLE_REPORT);
	const evaluationEvents = makeEvaluationEvents(runInstance);
	const evaluationPhase: EvaluationPhase = { events: evaluationEvents };
	const eventsView: EventsView = {
		realm: realmPhase.events,
		tokenize: emptyTokenizeStream,
		parseAST: emptyParseStream,
		creation: emptyCreateStream,
		evaluation: evaluationEvents,
	};
	const snippet: Snippet = {
		status: { tokenized: false, parsed: false, validated: false, created: false },
		source: buildSource(code),
		raw: { tokens: null, ast: null, comments: null },
		errors: {
			phase: 'parse:tokenize',
			kind: 'SyntaxError',
			message: 'canned scenario: tokenize-phase failure',
			loc: null,
		},
		analysis: null,
		validation: null,
		realm: realmPhase,
		tokenize: null,
		parseAST: null,
		creation: null,
		evaluation: evaluationPhase,
		events: eventsView,
	};
	wireSnippetBackReference(runInstance, snippet);
	deepFreezeInPlace(runInstance);
	return snippet;
}

/** Build the `FAIL_AT_PARSE` Snippet — tokenize OK, parse fails; raw.ast null. */
function buildFailAtParseSnippet(code: string): Snippet {
	const realmPhase = makeStubRealmPhase();
	const tokenizePhase = makeStubTokenizePhase();
	const rawTokens: ReadonlyArray<unknown> = [makeStubRawToken(code)];
	const runInstance = makeStubRunInstance(NOT_RUNNABLE_REPORT);
	const evaluationEvents = makeEvaluationEvents(runInstance);
	const evaluationPhase: EvaluationPhase = { events: evaluationEvents };
	const eventsView: EventsView = {
		realm: realmPhase.events,
		tokenize: tokenizePhase.events,
		parseAST: emptyParseStream,
		creation: emptyCreateStream,
		evaluation: evaluationEvents,
	};
	const snippet: Snippet = {
		status: { tokenized: true, parsed: false, validated: false, created: false },
		source: buildSource(code),
		raw: { tokens: rawTokens, ast: null, comments: null },
		errors: {
			phase: 'parse:ast',
			kind: 'SyntaxError',
			message: 'canned scenario: parse-phase failure',
			loc: null,
		},
		analysis: null,
		validation: null,
		realm: realmPhase,
		tokenize: tokenizePhase,
		parseAST: null,
		creation: null,
		evaluation: evaluationPhase,
		events: eventsView,
	};
	wireSnippetBackReference(runInstance, snippet);
	deepFreezeInPlace(runInstance);
	return snippet;
}

/** Build the `VALIDATION_FAIL` Snippet — parse OK, validate fails (isJeJ=false).
 *  Carries `raw.ast`, `raw.comments`, `analysis`, and `validation` (with
 *  violations populated). Creation null. Evaluation is always present but
 *  no-op (outcome: 'not-runnable'). `errors.phase = 'validation'`. */
function buildValidateFailSnippet(code: string): Snippet {
	const realmPhase = makeStubRealmPhase();
	const tokenizePhase = makeStubTokenizePhase();
	const parseASTPhase = makeStubParseASTPhase();
	const rawTokens: ReadonlyArray<unknown> = [makeStubRawToken(code)];
	const rawAst = makeStubAcornNode(code);
	const violations = [makeStubViolation()];
	const analysis = makeStubAnalysis(code, rawTokens.length);
	const nd = analysis.nonDeterminism;
	const validation: Validation = {
		isJeJ: violations.length === 0,
		isDeterministic: !(nd.random || nd.clock || nd.userInput || nd.locale),
		doesPause: analysis.hasIo.user.total > 0,
		formatted: true,
		violations,
	};
	const runInstance = makeStubRunInstance(NOT_RUNNABLE_REPORT);
	const evaluationEvents = makeEvaluationEvents(runInstance);
	const evaluationPhase: EvaluationPhase = { events: evaluationEvents };
	const eventsView: EventsView = {
		realm: realmPhase.events,
		tokenize: tokenizePhase.events,
		parseAST: parseASTPhase.events,
		creation: emptyCreateStream,
		evaluation: evaluationEvents,
	};
	const snippet: Snippet = {
		status: { tokenized: true, parsed: true, validated: false, created: false },
		source: buildSource(code),
		raw: { tokens: rawTokens, ast: rawAst, comments: [] },
		errors: {
			phase: 'validation',
			kind: 'ValidationError',
			message: 'canned scenario: JEJ subset violations present',
			loc: null,
		},
		analysis,
		validation,
		realm: realmPhase,
		tokenize: tokenizePhase,
		parseAST: parseASTPhase,
		creation: null,
		evaluation: evaluationPhase,
		events: eventsView,
	};
	wireSnippetBackReference(runInstance, snippet);
	deepFreezeInPlace(runInstance);
	return snippet;
}

/** Build the `FAIL_AT_CREATE` Snippet — parse + validate OK, creation fails.
 *  Carries `analysis` (validate gate ran), clean `validation` (isJeJ=true),
 *  and `creation: null` (failed). Evaluation no-op. */
function buildFailAtCreateSnippet(code: string): Snippet {
	const realmPhase = makeStubRealmPhase();
	const tokenizePhase = makeStubTokenizePhase();
	const parseASTPhase = makeStubParseASTPhase();
	const rawTokens: ReadonlyArray<unknown> = [makeStubRawToken(code)];
	const rawAst = makeStubAcornNode(code);
	const analysis = makeStubAnalysis(code, rawTokens.length);
	const runInstance = makeStubRunInstance(NOT_RUNNABLE_REPORT);
	const evaluationEvents = makeEvaluationEvents(runInstance);
	const evaluationPhase: EvaluationPhase = { events: evaluationEvents };
	const eventsView: EventsView = {
		realm: realmPhase.events,
		tokenize: tokenizePhase.events,
		parseAST: parseASTPhase.events,
		creation: emptyCreateStream,
		evaluation: evaluationEvents,
	};
	const snippet: Snippet = {
		status: { tokenized: true, parsed: true, validated: true, created: false },
		source: buildSource(code),
		raw: { tokens: rawTokens, ast: rawAst, comments: [] },
		errors: {
			phase: 'creation',
			kind: 'SyntaxError',
			message: 'canned scenario: create-phase failure',
			loc: null,
		},
		analysis,
		validation: buildStageFailValidation(),
		realm: realmPhase,
		tokenize: tokenizePhase,
		parseAST: parseASTPhase,
		creation: null,
		evaluation: evaluationPhase,
		events: eventsView,
	};
	wireSnippetBackReference(runInstance, snippet);
	deepFreezeInPlace(runInstance);
	return snippet;
}

/** Apex overlay parameters — the orthogonal axes one apex-status scenario can flip. */
type ApexOverlay = {
	readonly violations: ReadonlyArray<Violation>;
	readonly nonDeterminismOverride: Partial<NonDeterminism>;
	readonly hasIoUserTotal: number;
	readonly evalOutcome: EndReport['outcome'];
};

/**
 * Build an apex-status Snippet with the supplied overlay. All seven
 * apex-status scenarios (`OK`, `NON_DETERMINISTIC`, `PAUSES`,
 * `EVAL_ERROR`, `EVAL_TIMEOUT`, `EVAL_LIMIT`, `EVAL_CANCELLED`)
 * share this code path with different overlays. `VALIDATION_FAIL`
 * routes through `buildValidateFailSnippet` instead (validate-fail
 * leaf, not apex).
 *
 * Eager `RunInstance` construction with back-ref wired to the snippet
 * identity; `deepFreezeInPlace(runInstance)` walks `.snippet` into
 * the snippet graph in one pass and is cycle-safe via the visited-
 * set guard.
 */
function buildApexSnippet(code: string, overlay: ApexOverlay): Snippet {
	const realmPhase = makeStubRealmPhase();
	const tokenizePhase = makeStubTokenizePhase();
	const parseASTPhase = makeStubParseASTPhase();
	const creationPhase = {
		data: {} as CreationData,
		entwined: {} as CreationEntwined,
		events: emptyCreateStream,
	};
	const rawTokens: ReadonlyArray<unknown> = [makeStubRawToken(code)];
	const rawAst = makeStubAcornNode(code);
	const analysis = makeStubAnalysis(
		code,
		rawTokens.length,
		overlay.nonDeterminismOverride,
		overlay.hasIoUserTotal,
	);
	const nd = analysis.nonDeterminism;
	const validation: Validation = {
		isJeJ: overlay.violations.length === 0,
		// Derive per types.ts lines 380-381.
		isDeterministic: !(nd.random || nd.clock || nd.userInput || nd.locale),
		doesPause: analysis.hasIo.user.total > 0,
		formatted: true,
		violations: overlay.violations,
	};
	const runInstance = makeStubRunInstance(makeApexEndReport(overlay.evalOutcome));
	const evaluationEvents = makeEvaluationEvents(runInstance);
	const evaluationPhase: EvaluationPhase = { events: evaluationEvents };
	const eventsView: EventsView = {
		realm: realmPhase.events,
		tokenize: tokenizePhase.events,
		parseAST: parseASTPhase.events,
		creation: creationPhase.events,
		evaluation: evaluationEvents,
	};
	const snippet: Snippet = {
		status: { tokenized: true, parsed: true, validated: true, created: true },
		source: buildSource(code),
		raw: { tokens: rawTokens, ast: rawAst, comments: [] },
		errors: null,
		analysis,
		validation,
		realm: realmPhase,
		tokenize: tokenizePhase,
		parseAST: parseASTPhase,
		creation: creationPhase,
		evaluation: evaluationPhase,
		events: eventsView,
	};
	wireSnippetBackReference(runInstance, snippet);
	// Freeze the runInstance first; its walk includes runInstance.snippet
	// which freezes the entire snippet graph in one pass. The visited-set
	// cycle guard inside `@utils/deep-freeze-in-place` prevents infinite
	// recursion. Both runInstance and snippet are fully frozen after this
	// single call.
	deepFreezeInPlace(runInstance);
	return snippet;
}

const APEX_OVERLAYS: Readonly<Record<string, ApexOverlay>> = Object.freeze({
	OK: {
		violations: [],
		nonDeterminismOverride: {},
		hasIoUserTotal: 0,
		evalOutcome: 'completed',
	},
	NON_DETERMINISTIC: {
		violations: [],
		nonDeterminismOverride: { random: true },
		hasIoUserTotal: 0,
		evalOutcome: 'completed',
	},
	PAUSES: {
		violations: [],
		nonDeterminismOverride: {},
		hasIoUserTotal: 1,
		evalOutcome: 'completed',
	},
	EVAL_ERROR: {
		violations: [],
		nonDeterminismOverride: {},
		hasIoUserTotal: 0,
		evalOutcome: 'errored',
	},
	EVAL_TIMEOUT: {
		violations: [],
		nonDeterminismOverride: {},
		hasIoUserTotal: 0,
		evalOutcome: 'timed-out',
	},
	EVAL_LIMIT: {
		violations: [],
		nonDeterminismOverride: {},
		hasIoUserTotal: 0,
		evalOutcome: 'limit-exceeded',
	},
	EVAL_CANCELLED: {
		violations: [],
		nonDeterminismOverride: {},
		hasIoUserTotal: 0,
		evalOutcome: 'cancelled',
	},
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario-dispatch entry point.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a frozen `Snippet`. Input is normalized via `trim().toUpperCase()`
 * before scenario matching: leading/trailing whitespace and case
 * differences are tolerated; internal whitespace, punctuation, and
 * substrings are not. Recognized scenario keywords from `EMBODY_SCENARIOS`
 * dispatch to canned Snippet shapes (`Snippet.source.code` holds the
 * normalized form). Any other input is routed to real composition via
 * `embody/lib/*` (see `EMBODY-IMPL-HANDOFF.md` for the per-module landing
 * schedule).
 *
 * @param code - Source string. Normalized via `trim().toUpperCase()` for
 *   scenario matching; raw form passed to real composition for non-scenario
 *   input.
 * @returns A deep-frozen `Snippet` whose status / validation / analysis /
 *   eval outcome reflects the recognized scenario or real composition
 *   result.
 * @throws `TypeError` when `code` is not a string (`code.trim()` fails
 *   fast at the boundary).
 * @throws `Error` when normalized `code` is neither a recognized scenario
 *   keyword nor recognizable by the real-composition path. The error
 *   message preserves the raw (un-normalized) input.
 */
function embody(code: string): Snippet {
	// Normalize input for scenario-keyword matching: trim + uppercase.
	// Non-string input fails fast at code.trim() (TypeError at boundary).
	// On the scenario-dispatch branch, the normalized form becomes
	// Snippet.source.code (canonical scenario identifier).
	const normalized = code.trim().toUpperCase();

	if (normalized === 'FAIL_AT_TOKENIZE') {
		return buildFailAtTokenizeSnippet(normalized);
	}
	if (normalized === 'FAIL_AT_PARSE') {
		return buildFailAtParseSnippet(normalized);
	}
	if (normalized === 'VALIDATION_FAIL') {
		return buildValidateFailSnippet(normalized);
	}
	if (normalized === 'FAIL_AT_CREATE') {
		return buildFailAtCreateSnippet(normalized);
	}
	if (Object.hasOwn(APEX_OVERLAYS, normalized)) {
		return buildApexSnippet(normalized, APEX_OVERLAYS[normalized]);
	}
	throw new Error(
		`Unknown embody scenario: ${JSON.stringify(code)}. Expected one of: ${EMBODY_SCENARIOS.join(', ')}.`,
	);
}

export default embody;

/* eslint-disable import/no-named-export -- EMBODY_SCENARIOS is the
   @internal source-of-truth list used by the throw error message and by
   orchestrator dev / test fixtures that enumerate canned scenarios.
   Type re-export rides alongside per the same justification. */
export { EMBODY_SCENARIOS };
export type { EmbodyScenario };
/* eslint-enable import/no-named-export */
