/**
 * @file `embody(code)` — Phase A mock factory for the JEJ snippet contract.
 *
 * Phase A scaffolding. The body is a **named-scenario discriminator** that
 * satisfies the `Snippet` contract from `./types.ts` without invoking any
 * `embody/lib/*` internals (the lib modules don't exist yet — they ship in
 * Phase B per `EMBODY-IMPL-HANDOFF.md`). Each named scenario fabricates
 * shape-valid stub data so downstream consumers (orchestrator, analysis
 * libs, lenses) can develop against specific status / validation / eval
 * outcomes before real internals exist.
 *
 * Phase A's gate: consumers compile and tests pass against the mock.
 *
 * @remarks **Replaced in Phase B.** The mock body is replaced when
 * `embody/lib/parse/`, `embody/lib/ast/`, `embody/lib/scope/`,
 * `embody/lib/validating/`, `embody/lib/formatting/`, and
 * `embody/lib/evaluating/` land. The factory's contract (signature,
 * frozen output, deep-freeze pass) is stable; only the body changes.
 * The named-scenario discriminator + the throw on unknown sentinels +
 * `EMBODY_MOCK_SCENARIOS` all delete in the Phase B cleanup commit.
 *
 * ## Eleven named scenarios
 *
 * The mock branches on `code` (exact `===` match) to one of 11 scenarios.
 * Anything not in the named set throws `Error: Unknown embody mock
 * scenario "..."`. This is intentional — orchestrator/lens dev passes
 * scenario sentinels (e.g. `embody("FAIL_AT_PARSE")`,
 * `embody("EVAL_TIMEOUT")`) while the mock is in place. Real JEJ source
 * will work in Phase B when real tokenization replaces this body.
 *
 * ```text
 * code: string
 *   |
 *   v
 * discriminate (exact === match)
 *   |
 *   |--- "OK"                  --> apex; all green; eval completes
 *   |--- "FAIL_AT_TOKENIZE"    --> tokenize fails; status all false
 *   |--- "FAIL_AT_PARSE"       --> parse fails; tokenized:T parsed:F
 *   |--- "FAIL_AT_CREATE"      --> create fails; parsed:T created:F
 *   |--- "VALIDATION_FAIL"     --> apex status; isJeJ:F + canned violation
 *   |--- "NON_DETERMINISTIC"   --> apex status; nonDeterminism.random:T
 *   |--- "PAUSES"              --> apex status; hasIo.user.total:1
 *   |--- "EVAL_ERROR"          --> apex status; run() outcome:'errored'
 *   |--- "EVAL_TIMEOUT"        --> apex status; run() outcome:'timed-out'
 *   |--- "EVAL_LIMIT"          --> apex status; run() outcome:'limit-exceeded'
 *   |--- "EVAL_CANCELLED"      --> apex status; run() outcome:'cancelled'
 *   |--- anything else         --> throw
 *   |
 *   v
 * assemble Snippet per types.ts § 12 staircase
 *   |
 *   v
 * deepFreezeInPlace — single freeze pass; visited-set cycle guard
 * handles the runInstance.snippet back-ref in apex-status modes
 *   |
 *   v
 * frozen Snippet
 * ```
 *
 * This is the Phase A *mock* discriminator path; the real eager-
 * construction lifecycle (tokenize → AST → validate → create → static
 * analyses) is in `embody/DOCS.md` § Data flow and replaces the
 * `assemble` node when Phase B lands.
 *
 * ## Naming convention
 *
 * - `FAIL_AT_<STAGE>` — the named stage's status flag is false.
 *   `FAIL_AT_TOKENIZE` sets `status.tokenized: false`; subsequent
 *   stages cascade-false per types.ts § 12 staircase.
 * - `EVAL_<OUTCOME>` — apex `status.*: true`, but `run()` resolves to
 *   a frozen `RunInstance` whose `endReport.outcome` is the named
 *   outcome (`'errored' | 'timed-out' | 'limit-exceeded' | 'cancelled'`).
 *   types.ts has no `status.evaluated` flag — eval failure is a
 *   per-call `endReport.outcome` concern, hence the asymmetric name.
 * - `OK`, `VALIDATION_FAIL`, `NON_DETERMINISTIC`, `PAUSES` — apex
 *   status with overlay flips. `OK` is the unmodified apex.
 *
 * ## Phase-A-shape stub fields (open holes preserved)
 *
 * Per `embody/DOCS.md` § "Open holes in the contract", several fields
 * are intentionally unspecified. The mock honors this:
 * - `Distribution.samples: []` (raw vs stats-only resolution open).
 * - `HasIo` ships only `total` keys; per-method counts (alert/prompt/
 *   confirm/log/etc) omitted (per-method-vs-sums-only resolution open).
 * - `Features` ships only the 12 fields enumerated in types.ts.
 * - The canned `Violation` for `VALIDATION_FAIL`, the eval-failure
 *   `EmbodyError` shapes, and the create-fail `errors.kind` are all
 *   Phase-A mock-shape; downstream tests should branch on the named
 *   field (e.g. `errors.phase === 'create'`, `validation.violations.
 *   length > 0`, `endReport.outcome === 'errored'`) rather than on
 *   specific kind/message/path values.
 *
 * ## Anti-patterns to avoid (Phase B handoff rule)
 *
 * Orchestrator and lens code MUST NOT branch on the sentinel string
 * identity (e.g. `if (snippet.source.code === 'EVAL_TIMEOUT') ...`).
 * Always branch on the resulting `Snippet`'s status / endReport /
 * validation fields. Sentinels are inputs to `embody()` only; they
 * are NOT consumed downstream. AR-4 / AR-5 audits should grep
 * consumer code for sentinel literal occurrences and fail any
 * non-test usage. This rule also lives in `EMBODY-IMPL-HANDOFF.md`.
 *
 * ## Public surface
 *
 * Default export: `embody(code: string): Snippet`. Internal-only per
 * `embody/README.md` (the package's public surface is the
 * `<StudyLenses>` orchestrator, not embody). Named export:
 * `EMBODY_MOCK_SCENARIOS` — a frozen `ReadonlyArray<string>` of the
 * 11 valid scenarios, used by the throw error message and by
 * orchestrator dev / test fixtures that want to enumerate scenarios.
 * `@internal` — Phase A scaffolding; deletes in Phase B.
 *
 * @see ./types.ts — the `Snippet` contract
 * @see ./DOCS.md — architectural sketch + § Open holes
 * @see ../REFACTOR-HANDOFF.md § Step 5 — authoritative spec
 * @see ../EMBODY-IMPL-HANDOFF.md — Phase B real-internals plan
 */

import type { Node as AcornNode } from 'acorn';

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type {
	AugmentedASTNode,
	AugmentedToken,
	BindingEvent,
	BuiltinBinding,
	ControlFlow,
	EmbodyError,
	EndReport,
	EvaluateHandle,
	EvaluateOptions,
	Event,
	Features,
	HasIo,
	InitialScope,
	Metrics,
	Distribution,
	NodeEvent,
	NonDeterminism,
	Realm,
	RealmBindingEvent,
	RunInstance,
	Scope,
	ScopeEvent,
	Snippet,
	Source,
	StaticAnalyses,
	TokenEvent,
	Validation,
	Violation,
} from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Scenario list — single source of truth for the discriminator + throw message.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The 11 named scenarios accepted by `embody(code)`.
 *
 * @internal — Phase A mock scaffolding; deleted in Phase B when real
 * tokenization replaces the discriminator. NOT re-exported from any
 * package barrel.
 */
const EMBODY_MOCK_SCENARIOS = Object.freeze([
	'OK',
	'FAIL_AT_TOKENIZE',
	'FAIL_AT_PARSE',
	'FAIL_AT_CREATE',
	'VALIDATION_FAIL',
	'NON_DETERMINISTIC',
	'PAUSES',
	'EVAL_ERROR',
	'EVAL_TIMEOUT',
	'EVAL_LIMIT',
	'EVAL_CANCELLED',
] as const);

type EmbodyMockScenario = (typeof EMBODY_MOCK_SCENARIOS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — shape-valid stubs reused across scenarios.
// ─────────────────────────────────────────────────────────────────────────────

/** Build a `Source` from the input string. */
function buildSource(code: string): Source {
	return { code, offsets: [0] };
}

/** Empty realm-bindings generator. Yields nothing. */
function* emptyRealmStream(): Generator<RealmBindingEvent> {
	// intentionally empty — no events in the mock
}

/** Empty token-events generator. Yields nothing. */
function* emptyTokenizeStream(): Generator<TokenEvent> {
	// intentionally empty — no events in the mock
}

/** Empty AST-node-events generator. Yields nothing. */
function* emptyParseStream(): Generator<NodeEvent> {
	// intentionally empty — no events in the mock
}

/** Empty create-stream — yields no scope or binding events. */
function* emptyCreateStream(): Generator<ScopeEvent | BindingEvent> {
	// intentionally empty — no events in the mock
}

/** Empty async event stream for `EvaluateHandle`. Yields nothing, completes immediately. */
async function* emptyEvaluateAsyncIterator(): AsyncGenerator<Event> {
	// intentionally empty — no events in the mock
}

/** No-op cancel for `EvaluateHandle`. Phase A mock does not schedule cancellation. */
function noOpCancel(): void {
	// intentional no-op
}

/**
 * Build a single stub `AugmentedToken` representing the synthetic eof
 * marker for `code`. The label `'eof'` is chosen so `innermostNode:
 * null` complies with the contract comment at types.ts line 92
 * ("null only for 'eof'"). Per-call fresh `TokenType` literal honors
 * DOCS.md § "Per-instance, no shared state".
 */
function makeStubToken(code: string): AugmentedToken {
	return {
		type: {
			label: 'eof',
			keyword: undefined,
			beforeExpr: false,
			startsExpr: false,
			isAssign: false,
			binop: null,
			prefix: false,
			postfix: false,
		},
		value: undefined,
		start: code.length,
		end: code.length,
		loc: {
			start: { line: 1, column: code.length },
			end: { line: 1, column: code.length },
		},
		text: '',
		index: 0,
		innermostNode: null,
		innermostPath: null,
		prevToken: null,
		nextToken: null,
		leadingGap: null,
	};
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
 * arbitrary among the four sources; granularity not modeled in
 * Phase A. If a lens differentiates by source, add `NON_DETERMINISTIC_
 * CLOCK` / `_USER_INPUT` / `_LOCALE` modes on demand.
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

/** Construct a `BuiltinBinding` for the canned realm-binding tables below. */
function builtin(
	name: string,
	category: BuiltinBinding['category'],
	origin: BuiltinBinding['origin'],
): BuiltinBinding {
	return { name, category, origin };
}

/**
 * Build a stub `Realm` carrying the canonical ECMA-262 intrinsics and
 * standard HTML host bindings (per types.ts § 3 lines 215-218). The
 * set is enumerated by types.ts and is therefore not an open hole.
 */
function makeStubRealm(): Realm {
	const objectRegister: BuiltinBinding['category'] = 'object-register';
	const callable: BuiltinBinding['category'] = 'function';
	const constant: BuiltinBinding['category'] = 'constant';
	const ecmaOrigin: BuiltinBinding['origin'] = 'ecma';
	const hostOrigin: BuiltinBinding['origin'] = 'host';
	return {
		intrinsics: {
			Math: builtin('Math', objectRegister, ecmaOrigin),
			Date: builtin('Date', objectRegister, ecmaOrigin),
			Number: builtin('Number', objectRegister, ecmaOrigin),
			String: builtin('String', objectRegister, ecmaOrigin),
			Boolean: builtin('Boolean', callable, ecmaOrigin),
			parseInt: builtin('parseInt', callable, ecmaOrigin),
			parseFloat: builtin('parseFloat', callable, ecmaOrigin),
			Infinity: builtin('Infinity', constant, ecmaOrigin),
			NaN: builtin('NaN', constant, ecmaOrigin),
			undefined: builtin('undefined', constant, ecmaOrigin),
		},
		host: {
			console: builtin('console', objectRegister, hostOrigin),
			alert: builtin('alert', callable, hostOrigin),
			prompt: builtin('prompt', callable, hostOrigin),
			confirm: builtin('confirm', callable, hostOrigin),
		},
	};
}

/** Build a stub `InitialScope` — kind 'script', empty bindings, no outer. */
function makeStubInitialScope(): InitialScope {
	return { kind: 'script', bindings: [], outer: null, nodePath: '$' };
}

/**
 * Build the stub `AugmentedASTNode` (Program root) for apex-status
 * scenarios. `acornNode` is a manual literal coerced to acorn's
 * `Node` type (Phase A acceptable; Phase B uses real acorn output).
 */
function makeStubProgram(code: string): AugmentedASTNode {
	const acornNode = {
		type: 'Program',
		start: 0,
		end: code.length,
		body: [],
		sourceType: 'script',
	} as unknown as AcornNode;
	return {
		type: 'Program',
		start: 0,
		end: code.length,
		loc: {
			start: { line: 1, column: 0 },
			end: { line: 1, column: code.length },
		},
		path: '$',
		text: code,
		parent: null,
		children: [],
		tokens: [],
		comments: [],
		firstToken: null,
		lastToken: null,
		acornNode,
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

/**
 * Build a `RunInstance` shell with the supplied `endReport`. The
 * `snippet` back-ref is wired up after the outer Snippet is
 * constructed; see `buildApexSnippet` for the assignment.
 */
function makeStubRunInstance(
	initialScope: Scope,
	endReport: EndReport,
): RunInstance {
	return {
		events: [],
		endReport,
		finalEnvironment: initialScope,
		runMetrics: { steps: 0, durationMs: 0, iterationCount: 0 },
		snippet: undefined as unknown as Snippet,
	};
}

/**
 * Build the canned `EmbodyError` for an evaluate-phase failure. The
 * `kind` and `message` are Phase-A mock-shape; downstream tests should
 * branch on `endReport.outcome`, NOT on these specifics.
 */
function makeEvalError(outcome: EndReport['outcome']): EmbodyError {
	return {
		phase: 'evaluate',
		kind: 'EvalError',
		message: `mock: evaluate-phase ${outcome} (Phase A sentinel)`,
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
 * Phase-A mock-shape: downstream tests should assert
 * `validation.violations.length > 0` rather than specific
 * kind/message/path values.
 */
function makeStubViolation(): Violation {
	return {
		kind: 'FunctionDeclaration',
		message: 'mock: JEJ does not allow function declarations (Phase A sentinel)',
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
 * Build the `validation` summary for a stage-failure mode. All five
 * fields explicit per types.ts § 5. Reused by `FAIL_AT_*` modes —
 * none of them populate `static`, so `validation` is shape-valid
 * defaults rather than derived.
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

/** Build the `FAIL_AT_TOKENIZE` Snippet — status all false. */
function buildFailAtTokenizeSnippet(code: string): Snippet {
	const snippet: Snippet = {
		status: { tokenized: false, parsed: false, created: false },
		source: buildSource(code),
		parse: { tokens: [] },
		validation: buildStageFailValidation(),
		errors: {
			phase: 'parse:tokenize',
			kind: 'SyntaxError',
			message: 'mock: tokenize-phase failure (Phase A sentinel)',
			loc: null,
		},
		streams: {
			realm: emptyRealmStream,
			parse: { tokenize: emptyTokenizeStream, parse: emptyParseStream },
		},
	};
	return deepFreezeInPlace(snippet);
}

/** Build the `FAIL_AT_PARSE` Snippet — tokenize OK, parse fails. */
function buildFailAtParseSnippet(code: string): Snippet {
	const snippet: Snippet = {
		status: { tokenized: true, parsed: false, created: false },
		source: buildSource(code),
		parse: { tokens: [makeStubToken(code)] },
		validation: buildStageFailValidation(),
		errors: {
			phase: 'parse:ast',
			kind: 'SyntaxError',
			message: 'mock: parse-phase failure (Phase A sentinel)',
			loc: null,
		},
		streams: {
			realm: emptyRealmStream,
			parse: { tokenize: emptyTokenizeStream, parse: emptyParseStream },
		},
	};
	return deepFreezeInPlace(snippet);
}

/** Build the `FAIL_AT_CREATE` Snippet — parse OK, creation fails. `static` absent; `streams.evaluate` absent. */
function buildFailAtCreateSnippet(code: string): Snippet {
	const ast = makeStubProgram(code);
	const snippet: Snippet = {
		status: { tokenized: true, parsed: true, created: false },
		source: buildSource(code),
		parse: {
			tokens: [makeStubToken(code)],
			comments: [],
			ast,
			nodesByPath: { $: ast },
			tokensByOffset: {},
			nodesByOffset: { 0: ast },
		},
		validation: buildStageFailValidation(),
		errors: {
			phase: 'create',
			kind: 'SyntaxError',
			message: 'mock: create-phase failure (Phase A sentinel)',
			loc: null,
		},
		streams: {
			realm: emptyRealmStream,
			parse: { tokenize: emptyTokenizeStream, parse: emptyParseStream },
			create: emptyCreateStream,
		},
	};
	return deepFreezeInPlace(snippet);
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
 * apex-status scenarios (`OK`, `VALIDATION_FAIL`, `NON_DETERMINISTIC`,
 * `PAUSES`, `EVAL_ERROR`, `EVAL_TIMEOUT`, `EVAL_LIMIT`,
 * `EVAL_CANCELLED`) share this code path with different overlays.
 *
 * Eager `RunInstance` construction with back-ref wired to the snippet
 * identity; `deepFreezeInPlace(runInstance)` walks `.snippet` into
 * the snippet graph in one pass and is cycle-safe via the visited-
 * set guard.
 */
function buildApexSnippet(code: string, overlay: ApexOverlay): Snippet {
	const ast = makeStubProgram(code);
	const initialScope = makeStubInitialScope();
	const tokens = [makeStubToken(code)];
	const staticAnalyses: StaticAnalyses = {
		realm: makeStubRealm(),
		initialScope,
		bindings: [],
		dependencies: [],
		features: makeStubFeatures(),
		metrics: makeStubMetrics(code, tokens.length),
		controlFlow: makeStubControlFlow(),
		nonDeterminism: makeStubNonDeterminism(overlay.nonDeterminismOverride),
		hasIo: makeStubHasIo(overlay.hasIoUserTotal),
	};
	const runInstance = makeStubRunInstance(
		initialScope,
		makeApexEndReport(overlay.evalOutcome),
	);
	const nd = staticAnalyses.nonDeterminism;
	const validation: Validation = {
		isJeJ: overlay.violations.length === 0,
		// Derive per types.ts lines 380-381.
		isDeterministic: !(nd.random || nd.clock || nd.userInput || nd.locale),
		doesPause: staticAnalyses.hasIo.user.total > 0,
		formatted: true,
		violations: overlay.violations,
	};
	const snippet: Snippet = {
		status: { tokenized: true, parsed: true, created: true },
		source: buildSource(code),
		parse: {
			tokens,
			comments: [],
			ast,
			nodesByPath: { $: ast },
			tokensByOffset: {},
			nodesByOffset: { 0: ast },
		},
		static: staticAnalyses,
		validation,
		errors: null,
		streams: {
			realm: emptyRealmStream,
			parse: { tokenize: emptyTokenizeStream, parse: emptyParseStream },
			create: emptyCreateStream,
			evaluate: {
				run: (_options?: EvaluateOptions): Promise<RunInstance> =>
					Promise.resolve(runInstance),
				intercept: (_options?: EvaluateOptions): EvaluateHandle =>
					makeStubEvaluateHandle(runInstance),
				trace: {
					syntax: (_options?: EvaluateOptions): EvaluateHandle =>
						makeStubEvaluateHandle(runInstance),
					semantics: (_options?: EvaluateOptions): EvaluateHandle =>
						makeStubEvaluateHandle(runInstance),
				},
			},
		},
	};
	// Wire the back-ref before freezing. The mutation is intentional
	// and contained to the construction window — neither the snippet
	// nor the runInstance is observable in its pre-freeze state.
	// eslint-disable-next-line functional/immutable-data
	(runInstance as { snippet: Snippet }).snippet = snippet;

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
	VALIDATION_FAIL: {
		violations: [makeStubViolation()],
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
// Discriminator entry point.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a frozen `Snippet` for the given scenario sentinel. Phase A
 * mock body — see file header for the eleven-scenario discriminator
 * and the Phase B replacement plan.
 *
 * @param code - One of the strings in `EMBODY_MOCK_SCENARIOS`. Any
 *   other input throws.
 * @returns A deep-frozen `Snippet` whose status / validation / static /
 *   eval outcome reflects the named scenario.
 * @throws `Error` when `code` is not a recognized scenario sentinel.
 */
function embody(code: string): Snippet {
	if (code === 'FAIL_AT_TOKENIZE') {
		return buildFailAtTokenizeSnippet(code);
	}
	if (code === 'FAIL_AT_PARSE') {
		return buildFailAtParseSnippet(code);
	}
	if (code === 'FAIL_AT_CREATE') {
		return buildFailAtCreateSnippet(code);
	}
	if (Object.hasOwn(APEX_OVERLAYS, code)) {
		return buildApexSnippet(code, APEX_OVERLAYS[code]);
	}
	throw new Error(
		`Unknown embody mock scenario: ${JSON.stringify(code)}. Expected one of: ${EMBODY_MOCK_SCENARIOS.join(', ')}.`,
	);
}

export default embody;

/* eslint-disable import/no-named-export -- Phase A mock scaffolding;
   EMBODY_MOCK_SCENARIOS is the @internal source-of-truth list used by
   the throw error message and by orchestrator dev / test fixtures.
   Deletes in Phase B alongside the discriminator. Type re-export
   rides alongside per the same justification. */
export { EMBODY_MOCK_SCENARIOS };
export type { EmbodyMockScenario };
/* eslint-enable import/no-named-export */
