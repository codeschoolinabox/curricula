/**
 * @file `embody(code)` — Phase A mock factory for the JEJ snippet contract.
 *
 * Phase A scaffolding. The body is a **mock** that satisfies the `Snippet`
 * contract from `./types.ts` without invoking any `embody/lib/*` internals
 * (the lib modules don't exist yet — they ship in Phase B per
 * `EMBODY-IMPL-HANDOFF.md`). The mock fabricates shape-valid stub data per
 * status-mode so downstream consumers (orchestrator, analysis libs, lenses)
 * can pin against the contract end-to-end before real internals exist.
 *
 * Phase A's gate: consumers compile and tests pass against the mock.
 *
 * @remarks **Replaced in Phase B.** The mock body is replaced module by
 * module as `embody/lib/parse/`, `embody/lib/ast/`, `embody/lib/scope/`,
 * `embody/lib/validating/`, `embody/lib/formatting/`, and
 * `embody/lib/evaluating/` land. The factory's contract (signature,
 * frozen output, deep-freeze pass) is stable; only the body changes.
 *
 * ## Four-mode discriminator
 *
 * The mock branches on `code` (exact `===` match) into four modes covering
 * the four staircase rungs of `Snippet.status`. This is the only place
 * the input string gates behavior; all four modes assemble a Snippet that
 * conforms to types.ts § 12 (lines 776-780) staircase semantics.
 *
 * ```text
 * code: string
 *   |
 *   v
 * discriminate (exact === match)
 *   |
 *   |--- code === ""                         --> Z mode (tokenize-fail)
 *   |                                            status: {t:F, p:F, c:F}
 *   |                                            errors.phase: 'parse:tokenize'
 *   |
 *   |--- code === parse-fail sentinel        --> O mode (parse-fail)
 *   |                                            status: {t:T, p:F, c:F}
 *   |                                            errors.phase: 'parse:ast'
 *   |
 *   |--- code === create-fail sentinel       --> create-fail mode
 *   |                                            status: {t:T, p:T, c:F}
 *   |                                            errors.phase: 'create'
 *   |
 *   |--- else                                --> M mode (happy)
 *   |                                            status: {t:T, p:T, c:T}
 *   |                                            errors: null
 *   |
 *   v
 * assemble Snippet per types.ts § 12 staircase
 *   |
 *   v
 * deepFreezeInPlace(snippet) — single freeze pass; visited-set
 * cycle guard handles the runInstance.snippet back-ref in happy mode
 *   |
 *   v
 * frozen Snippet
 * ```
 *
 * The sentinel string literals are introduced in the O / create-fail
 * increments (kept out of this JSDoc to avoid the `*` + `/` comment-end
 * interaction).
 *
 * ## Why the create-fail mode is fabricated
 *
 * The spec at REFACTOR-HANDOFF.md § Step 5 enumerates three modes (empty,
 * parse-fail-sentinel, happy). The `!created` rung is added to fill the
 * staircase gap so Step 7 analysis libs reading `embodiment.static.*` (a
 * `created`-gated field) have a fixture to test the create-fail
 * short-circuit against. The fabricated `errors.phase: 'create'` ships
 * with `kind: 'SyntaxError'` and a clearly-labeled mock message; Step 7
 * tests should treat the `kind` and `message` as Phase-B-locked shape
 * (assert `errors.phase === 'create'`, NOT specific kind/message).
 *
 * ## EvaluateHandle iteration semantics (Phase A)
 *
 * The `streams.evaluate.intercept`/`trace.{syntax,semantics}` handles in
 * happy mode yield zero events (the async iterator completes immediately),
 * `.cancel()` is a no-op (no microtask scheduling, no .result rejection),
 * and `.result` resolves with the same canned `RunInstance` that
 * `streams.evaluate.run()` produces. In create-fail mode, `streams.evaluate`
 * is absent from the streams partial bag entirely.
 *
 * ## Open holes — minimum-shape-only stubs
 *
 * Per `embody/DOCS.md` § "Open holes in the contract", several fields are
 * intentionally unspecified. Stubs use minimum-shape-only values:
 * - `Distribution.samples: []` (empty array; min/max/mean/median = 0)
 * - `HasIo` ships only `total: 0`; per-method keys omitted (optional in types.ts)
 * - `Features` ships only the 12 fields enumerated in types.ts; all `false`
 *
 * Each stub helper has a `// open-hole stub` comment.
 *
 * ## Public surface
 *
 * Default export: `embody(code: string): Snippet`. Internal-only per
 * `embody/README.md` (the package's public surface is the
 * `<StudyLenses>` orchestrator, not embody). The `embodyMock` override
 * builder for tests lands in a separate co-located file when
 * increment S is added; this file ships only the `embody` factory to
 * honor DEV.md § 1's single-default-export rule.
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
} from './types.js';

/** Sentinel: `code` exactly equal to this string selects parse-fail mode. */
const SENTINEL_PARSE_FAIL = '/' + '* MOCK_PARSE_FAIL *' + '/';

/**
 * Build a `Source` from the input string. Reused by O / M / create-fail
 * modes.
 *
 * Fake It: `offsets` is always `[0]` (single-line). Real offset
 * computation lands in Phase B's tokenizer; for the Phase A mock the
 * empty array suffices to satisfy the type contract since no consumer
 * line-lookup logic exercises offsets in Phase A.
 */
function buildSource(code: string): Source {
	return { code, offsets: [0] };
}

/**
 * Build the `validation` summary for a non-happy mode. All five fields
 * explicit per types.ts § 5. Reused by Z, O, and create-fail modes.
 *
 * open-hole stub: per REFACTOR-HANDOFF.md § Step 5 line 242, all
 * non-happy modes ship the same validation object (`isJeJ: true`,
 * `isDeterministic: true`, `doesPause: false`, `formatted: true`,
 * `violations: []`). The `isJeJ: true` for a snippet that failed to
 * tokenize is a known soft inconsistency — per the spec, the mock
 * doesn't compute JEJ-ness on un-tokenized source. M4 enforces the
 * derivation rules `isDeterministic = !any(nonDeterminism)` and
 * `doesPause = hasIo.user.total > 0` (per types.ts lines 380-381) for
 * happy mode where `static` is populated.
 */
function buildEmptyValidation(): Validation {
	return {
		isJeJ: true,
		isDeterministic: true,
		doesPause: false,
		formatted: true,
		violations: [],
	};
}

/** Empty realm-bindings generator. Yields nothing. Reused by Z, O, create-fail modes. */
function* emptyRealmStream(): Generator<RealmBindingEvent> {
	// intentionally empty — no events in the mock
}

/** Empty token-events generator. Yields nothing. Reused by Z, O, and create-fail modes. */
function* emptyTokenizeStream(): Generator<TokenEvent> {
	// intentionally empty — no events in the mock
}

/**
 * Empty AST-node-events generator. Yields nothing. Present so the
 * `streams.parse` slot satisfies the full structural type from types.ts;
 * staircase semantics (Z mode shouldn't yield AST events) are guarded by
 * `status.parsed`, not by slot presence.
 */
function* emptyParseStream(): Generator<NodeEvent> {
	// intentionally empty — no events in the mock
}

/**
 * Build a single stub `AugmentedToken` representing the synthetic eof
 * marker for `code`. Used by O / create-fail / M modes where
 * `parse.tokens` must be non-empty per types.ts § 2 ("includes 'eof'
 * as the last element").
 *
 * The label `'eof'` is chosen so `innermostNode: null` complies with
 * the contract comment at types.ts line 92 ("null only for 'eof'").
 * Per-call fresh `TokenType` literal honors DOCS.md § "Per-instance,
 * no shared state" — no module-level shared object.
 *
 * If a future increment adds canned events, `event.node` must `===`
 * `snippet.parse.ast` (identity, not equality) per DOCS.md
 * § "Single static AST shared across runs".
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

/**
 * Builds a frozen `Snippet` for the given `code` string. Phase A mock body —
 * see file header for the four-mode discriminator and the Phase B replacement
 * plan.
 *
 * @param code - The JEJ source string. Empty string and well-known
 *   sentinel comments select non-happy modes; any other string is happy mode.
 * @returns A deep-frozen `Snippet` whose `status` reflects the staircase
 *   rung determined by `code`. All required fields per types.ts § 12 are
 *   present; optional fields gated by `status.*` follow the staircase rules.
 */
/** Build a zero-default `Distribution` — open-hole stub per DOCS.md § Open holes. */
function makeStubDistribution(): Distribution {
	return { min: 0, max: 0, mean: 0, median: 0, samples: [] };
}

/**
 * Build a `Metrics` deriving the safely-computable fields from
 * inputs (source.chars, source.lines, tokens). Distributions and
 * the rest stay zero per open-hole stub discipline.
 *
 * `Distribution.samples: []` is deliberate — DOCS.md § Open holes
 * leaves the raw-vs-stats-only resolution open.
 */
function makeStubMetrics(code: string, tokensCount: number): Metrics {
	return {
		source: {
			chars: code.length,
			lines: code.split('\n').length,
		},
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

/** Build a zero-default `NonDeterminism`. */
function makeStubNonDeterminism(): NonDeterminism {
	return { random: false, clock: false, userInput: false, locale: false };
}

/**
 * Build a zero-default `HasIo` — only `total: 0` keys; per-method keys
 * omitted (open-hole stub per DOCS.md § Open holes).
 */
function makeStubHasIo(): HasIo {
	return {
		user: { total: 0 },
		dev: { total: 0 },
		total: 0,
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
 * Build a stub `Realm` carrying the canonical ECMA-262
 * intrinsics (per types.ts § 3 line 216) and the standard HTML host
 * bindings (per types.ts line 217). Per-call fresh records honor
 * DOCS.md § "Per-instance, no shared state".
 *
 * The set is enumerated by types.ts and is therefore not an open hole;
 * locking these names is by design. Per-method shape (the
 * `BuiltinBinding` interface) is separately locked in types.ts § 3.
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

/** Build a stub `InitialScope` — kind 'script', empty bindings, no outer. M2 enriches. */
function makeStubInitialScope(): InitialScope {
	return { kind: 'script', bindings: [], outer: null, nodePath: '$' };
}

/**
 * Build the stub `AugmentedASTNode` (Program root) for happy mode.
 * `acornNode` carries the underlying acorn-shape (a `Node` per acorn
 * typings) with a `body: []` array since we don't fabricate statements.
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
 * Build an `EvaluateHandle` whose async iterator yields zero events,
 * `.cancel()` is a no-op, and `.result` resolves with the supplied
 * `runInstance`. Used by intercept and trace.{syntax, semantics} stubs.
 */
function makeStubEvaluateHandle(runInstance: RunInstance): EvaluateHandle {
	return {
		[Symbol.asyncIterator]: emptyEvaluateAsyncIterator,
		result: Promise.resolve(runInstance),
		cancel: noOpCancel,
	};
}

/**
 * Build a stub `RunInstance` for happy mode. Eager construction per the
 * plan's locked design (AR-2 Concern A resolution): one canned
 * RunInstance per `embody(code)` call; back-ref `snippet` set after the
 * outer Snippet is constructed but before the deep-freeze pass — the
 * cycle is closed in a single freeze and cycle-safe via the WeakSet
 * guard in `@utils/deep-freeze-in-place`.
 *
 * `events: []` and a stub `Scope` for `finalEnvironment` keep the
 * happy-mode RunInstance shape-valid without fabricating evaluation
 * data.
 */
function makeStubRunInstance(initialScope: Scope): RunInstance {
	return {
		events: [],
		endReport: { ok: true, error: null, outcome: 'completed' },
		finalEnvironment: initialScope,
		runMetrics: { steps: 0, durationMs: 0, iterationCount: 0 },
		// `snippet` is wired up after the outer Snippet object exists;
		// see buildHappyModeSnippet for the assignment.
		snippet: undefined as unknown as Snippet,
	};
}

function embody(code: string): Snippet {
	if (code === '') {
		return buildEmptySnippet(code);
	}
	if (code === SENTINEL_PARSE_FAIL) {
		return buildParseFailSnippet(code);
	}
	return buildHappyModeSnippet(code);
}

/** Build the empty-mode (tokenize-fail) Snippet. */
function buildEmptySnippet(code: string): Snippet {
	const snippet: Snippet = {
		status: { tokenized: false, parsed: false, created: false },
		source: buildSource(code),
		parse: { tokens: [] },
		validation: buildEmptyValidation(),
		errors: {
			phase: 'parse:tokenize',
			kind: 'SyntaxError',
			message: 'empty source',
			loc: null,
		},
		streams: {
			realm: emptyRealmStream,
			parse: {
				tokenize: emptyTokenizeStream,
				parse: emptyParseStream,
			},
		},
	};
	return deepFreezeInPlace(snippet);
}

/**
 * Build the happy-mode Snippet (any non-empty, non-sentinel input).
 * All status booleans true; full parse graph + static analyses + every
 * stream slot. Eager `RunInstance` construction with back-ref wired
 * to the snippet identity; deep-freeze handles the cycle natively.
 *
 * Replaces the empty-mode return for any input that is not the empty
 * string and not a known sentinel.
 */
function buildHappyModeSnippet(code: string): Snippet {
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
		nonDeterminism: makeStubNonDeterminism(),
		hasIo: makeStubHasIo(),
	};
	const runInstance = makeStubRunInstance(initialScope);
	const nd = staticAnalyses.nonDeterminism;
	const validation: Validation = {
		isJeJ: true,
		// derive per types.ts lines 380-381 — keeps the implementation
		// honest if a future increment flips a nonDeterminism stub.
		isDeterministic: !(nd.random || nd.clock || nd.userInput || nd.locale),
		doesPause: staticAnalyses.hasIo.user.total > 0,
		formatted: true,
		violations: [],
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
			parse: {
				tokenize: emptyTokenizeStream,
				parse: emptyParseStream,
			},
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

	// Freeze the runInstance first so its walk includes runInstance.snippet
	// (the back-ref to the snippet object); that walk freezes the entire
	// snippet graph in one pass. The visited-set cycle guard inside
	// `@utils/deep-freeze-in-place` prevents infinite recursion. Functions
	// (the streams.evaluate.* closures inside snippet) are not walked
	// recursively but are themselves frozen by Object.freeze, which is
	// what the deep-freeze utility applies. Both runInstance and snippet
	// are fully frozen after this single call.
	deepFreezeInPlace(runInstance);
	return snippet;
}

/**
 * Build the parse-fail-sentinel-mode Snippet. Tokenize succeeded
 * (status.tokenized: true), parse failed (status.parsed: false).
 */
function buildParseFailSnippet(code: string): Snippet {
	const errors: EmbodyError = {
		phase: 'parse:ast',
		kind: 'SyntaxError',
		message: 'mock: parse failure (Phase A sentinel)',
		loc: null,
	};
	const snippet: Snippet = {
		status: { tokenized: true, parsed: false, created: false },
		source: buildSource(code),
		parse: { tokens: [makeStubToken(code)] },
		validation: buildEmptyValidation(),
		errors,
		streams: {
			realm: emptyRealmStream,
			parse: {
				tokenize: emptyTokenizeStream,
				parse: emptyParseStream,
			},
		},
	};
	return deepFreezeInPlace(snippet);
}

export default embody;
