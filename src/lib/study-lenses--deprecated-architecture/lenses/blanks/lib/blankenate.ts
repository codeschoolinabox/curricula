/**
 * @file The blanks lens's blank selector. Parses the snippet, delegates token
 * classification to `lib/classifying`, filters the classified tokens to the
 * learner's enabled content types (any-match over the category set), rolls a
 * per-eligible-token probability via bare `Math.random()`, and returns the
 * source with selected positions replaced by length-matched `_` placeholders
 * plus an array of blank descriptors.
 *
 * Classification is NOT this file's job. The five-category house taxonomy lives
 * in `lib/classifying` (`../../../lib/classifying/classify-tokens.js`) — total,
 * pure, and semantic: `typeof` / `in` / `instanceof` / `void` / `delete` are
 * operators and `null` / `true` / `false` are literals (not keywords, despite
 * Acorn's `.keyword` flag); contextual keywords (`let`, `of`, …) are keywords
 * wherever they appear. blanks is classifying's first consumer and owns ONLY
 * SELECTION — the content-type filter, the probability roll, and the
 * placeholder replacement — per `lib/classifying/README.md` § Consumers.
 * Adopting the shared taxonomy corrected the legacy walk's lexical
 * mis-binnings; the per-config behavior delta is held by
 * `tests/blankenate.test.ts` § "lib/classifying adoption — partial-config
 * overlap matrix".
 *
 * Style posture: this file is linted (idiomatic V2). Its `lib/` siblings
 * `no-paste-extension.ts` (vendored) and `evaluate-correctness.ts` stay
 * eslint-ignored per `eslint.config.mjs` § Global ignores pending their own
 * restyle. The selection surface is V2-owned and is held by
 * `tests/blankenate.test.ts`.
 *
 * Output contract per the lens-local `types.ts`: `BlankenateResult | null`
 * (null on internal parse failure; defense-in-depth — in production the lens's
 * `applicableTo` gate (`embodiment.status.parsed`) prevents the lens from
 * mounting on unparseable embodiments). `classifyTokens` THROWS on null inputs
 * (unlike `lib/completing`'s never-throw posture), so the parse-failure path
 * MUST return `null` before classify is reached.
 */

import * as acorn from 'acorn';

import classifyTokens from '../../../lib/classifying/classify-tokens.js';
import type { Category } from '../../../lib/classifying/types.js';
import type { Blank, BlankenateResult } from '../types.js';

export default function blankenate(
	code: string,
	probability: number = 0.2,
	config: ContentTypeFlags = DEFAULT_CONTENT_TYPE_FLAGS,
): BlankenateResult | null {
	// Length-matched placeholders: each blank is replaced by `_` repeated
	// `original.length` times. Cascade: blankedCode.length === code.length
	// always; positions align 1:1 between the two; the wrapper's lock-shift
	// arithmetic collapses to zero.

	// Phase 1 — PARSE. Collect the Acorn token stream during parse (classifying
	// needs both the token stream and the AST). The lens re-parses internally
	// rather than consuming `embodiment.raw.{tokens,ast}`: those are nullable
	// `RawAcorn`, so plumbing them would change the signature + call site —
	// deferred as the documented double-parse Future item. On a parse failure
	// return `null` BEFORE classify: `classifyTokens` throws on null inputs.
	const tokens: acorn.Token[] = [];
	let tree: acorn.Node;
	try {
		tree = acorn.parse(code, {
			ecmaVersion: 2022,
			sourceType: 'module',
			// Acorn's onToken is push-based; this local stream never escapes
			// (passed by value to classifyTokens), so collecting here keeps the
			// snippet to a single parse.
			// eslint-disable-next-line functional/immutable-data -- local stream, never escapes
			onToken: (token) => tokens.push(token),
		});
	} catch {
		return null;
	}

	// Phase 2 — CLASSIFY. Delegate the entire taxonomy: one frozen
	// `ClassifiedToken` per non-empty source token, each with a single home
	// category (and a role this lens ignores). Eof and zero-length tokens are
	// dropped inside `classifyTokens`.
	const classified = classifyTokens({ code, tokens, ast: tree });

	// Phase 3 — FILTER. Keep tokens whose category is one of the learner's
	// enabled content types (any-match over the single-element category set).
	const enabled = enabledCategories(config);
	const eligible = classified.filter((token) =>
		token.categories.some((category) => enabled.has(category)),
	);

	// Phase 4 — ROLL. Bare per-token `Math.random()` (legacy parity; seeded RNG
	// is a Future-direction item — inject `random()` at the call site then). At
	// probability 1 every eligible token blanks; at 0, none. The randomness is
	// exercise variety, not security.
	// eslint-disable-next-line sonarjs/pseudo-random -- exercise variety, not security
	const selected = eligible.filter(() => Math.random() < probability);

	// Phase 5 — BUILD. One `Blank` per selected token, in source-ascending
	// order (classifying returns source order). `type` is the token's home
	// category; `original` is the verbatim source slice (`token.text`).
	const blanks: Blank[] = selected.map((token, index) => ({
		id: `blank_${index}`,
		original: token.text,
		type: token.categories[0],
		start: token.start,
		end: token.end,
	}));

	// Replace right-to-left so an earlier substitution never shifts a later
	// token's offsets. The `blanks` array itself stays source-ascending.
	const blankedCode = blanks
		.toReversed()
		.reduce(
			(source, blank) =>
				source.slice(0, blank.start) +
				'_'.repeat(blank.original.length) +
				source.slice(blank.end),
			code,
		);

	// Phase 6 — FREEZE. The wrapper memoizes the call result; freezing closes
	// the mutation window where a consumer could re-sort or push into the
	// memoized blanks array and silently corrupt later renders. Per DEV.md § 13.
	return Object.freeze({
		blankedCode,
		blanks: Object.freeze(blanks),
		originalCode: code,
	});
}

// Map the wrapper-internal boolean `ContentTypeFlags` to the set of enabled
// classifying `Category` values (plural flag → singular category). The any-match
// filter in Phase 3 reads this set.
function enabledCategories(config: ContentTypeFlags): ReadonlySet<Category> {
	return new Set(
		FLAG_TO_CATEGORY.filter(([flag]) => config[flag]).map(
			([, category]) => category,
		),
	);
}

// `ContentTypeFlags` is deliberately NOT exported — per DOCS.md § Phase 1 +
// README.md § Two-layer module, the boolean-map representation is
// wrapper-internal-only. The wrapper constructs the shape inline at the call
// site; TypeScript infers it from the `blankenate` parameter signature.
type ContentTypeFlags = {
	readonly keywords: boolean;
	readonly identifiers: boolean;
	readonly operators: boolean;
	readonly literals: boolean;
	readonly delimiters: boolean;
};

// The default when a caller omits `config` (legacy signature default; the
// wrapper always passes an explicit derived map, so this is the contract
// floor, not the production path). A named constant rather than an inline
// object literal so the default is shared + read-only, never re-allocated.
const DEFAULT_CONTENT_TYPE_FLAGS: ContentTypeFlags = {
	keywords: true,
	identifiers: true,
	operators: false,
	literals: false,
	delimiters: false,
};

// The plural-flag → singular-`Category` pairs `enabledCategories` filters over.
// Module-scoped so it is allocated once, not per call.
const FLAG_TO_CATEGORY: ReadonlyArray<
	readonly [keyof ContentTypeFlags, Category]
> = [
	['keywords', 'keyword'],
	['identifiers', 'identifier'],
	['operators', 'operator'],
	['literals', 'literal'],
	['delimiters', 'delimiter'],
];
