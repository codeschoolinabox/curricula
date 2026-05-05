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
 * deepFreezeInPlace(snippet)
 * (WeakSet cycle guard handles RunInstance.snippet back-ref)
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

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type {
	NodeEvent,
	RealmBindingEvent,
	Snippet,
	Source,
	TokenEvent,
	Validation,
} from './types.js';

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

/** Empty token-events generator. Yields nothing. Reused by O / create-fail modes. */
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
function embody(code: string): Snippet {
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

export default embody;
