/**
 * @file VENDORED — mechanical JS→TS conversion of the legacy
 * `public/static/blanks/blankenate.js` from the pre-V2 study-lenses
 * app. Walks an Acorn AST, rolls a per-eligible-token probability via
 * bare `Math.random()`, and returns the source with blanked positions
 * replaced by the `__` placeholder plus an array of blank descriptors.
 *
 * Vendoring posture (per the handoff plan at
 * `~/.claude/plans/you-re-picking-up-handoff-zazzy-ullman.md` §
 * Decisions locked: "Vendoring (blankenate algorithm)"):
 *
 * - Mechanical conversion only — preserve semantics, do not re-port.
 * - This directory (`lenses/blanks/lib/**`) is eslint-ignored per
 *   `eslint.config.mjs` § Global ignores; the legacy file's style is
 *   preserved as-is.
 * - Reproducibility via seeded RNG is a Future direction item; v1
 *   preserves the legacy's bare `Math.random()` per-token roll.
 *
 * Output contract per the lens-local `types.ts`:
 * `BlankenateResult | null` (null on internal parse failure;
 * defense-in-depth — in production the lens's `applicableTo` gate
 * (`embodiment.status.parsed`) prevents the lens from mounting on
 * unparseable embodiments).
 */

import * as acorn from 'acorn';

import type { Blank, BlankenateResult } from '../types.js';

/**
 * The wrapper-internal boolean map derived from `ContentType[]` on
 * render. Not exported as a type per the architectural sketch
 * (wrapper-internal only); kept lib-local here as the algorithm's
 * input shape.
 */
type ContentTypeFlags = {
	readonly keywords: boolean;
	readonly identifiers: boolean;
	readonly operators: boolean;
	readonly literals: boolean;
	// Inc 6.6 extension: delimiter tokens (parens, brackets, braces,
	// `${`, semicolons, commas, dots). Sourced from Acorn's token
	// stream (not AST nodes — delimiters are not standalone nodes).
	readonly delimiters: boolean;
};

// SL1 Blanks Generation Logic
// Uses Acorn parser to intelligently create blanks based on AST analysis.
//
// Inc 6.k: removed the vendored `jsKeywords` set and `isKeyword` helper —
// they were never read by the blanking path. Keywords are detected via
// AST node-type matching (FunctionDeclaration, IfStatement, etc.) in the
// AST walk below; the legacy set was dead code from the original
// vendored module.

type BlankedToken = {
	start: number;
	end: number;
	original: string;
	type: Blank['type'];
};

// Inc 6.k: removed the vendored `findOperatorPosition` helper —
// dead code in the v1 control flow (the operator-AST-walk in
// `walkNode` inlines its own per-node-type position finder for
// BinaryExpression, AssignmentExpression, VariableDeclarator,
// AssignmentPattern, UnaryExpression, UpdateExpression).

// Inc 6.6: delimiter token labels Acorn emits. These are TokenType.label
// values (acorn.tokTypes.parenL.label === '(' etc.).
//
// Brace nuance (template-literal disambiguation):
// - `{` is unambiguous — Acorn's `tokTypes.braceL` (label `{`) is
//   ONLY emitted for block/object braces. Template-expression opens
//   are a separate token, `tokTypes.dollarBraceL` (label `${`), which
//   covers both the `$` and `{` characters as one 2-char token.
// - `}` is shared by block/object/template-expression close
//   (`tokTypes.braceR`, label `}`). Both forms blank as `}`; the
//   learner types `}` either way, so the label-only filter is
//   pedagogically sound for blanking even without sub-classification.
//   Richer taxonomy (template-close vs block-close) is a Future
//   direction item (would require a brace-context stack walking the
//   token stream).
//
// Inc 6.k: comprehensive Acorn-punctuator coverage. The previously
// excluded `=>`, `?`, `:`, `?.`, `...` are now in the set — user-
// directed reversal of the Inc 6.6 AR-3 exclusion (those were
// "semantic markers" but the learner should practice them just like
// `(` and `,`).
//
// Still excluded by design (each with a single-line rationale):
//   `` ` `` (backtick) — template-literal delimiter; analogous to
//     `'`/`"` quotes which are part of the string-literal token, not
//     separately blanked. Blanking it obscures "this is a template".
//   `template` / `invalidTemplate` (string content between
//     interpolations) — these are content like string literals;
//     would join `literals` not `delimiters` if blanked.
//   `/` — regex literal delimiters are part of the `regexp` token
//     (Acorn emits `tokTypes.regexp` as one), not separate.
//   `eof` — not a syntactic character.
//
// Ternary `?` / `:` are classified as DELIMITERS here, not under
// `operators`. The operators category remains AST-walk-driven for
// BinaryExpression / UnaryExpression / UpdateExpression /
// AssignmentExpression operator strings. `?` / `:` are token-stream
// punctuation; DOCS.md § Categories documents this split.
//
// Acorn's `tokTypes.colon` is the SAME TokenType for every `:`
// context: ternary `a ? b : c`, object literal `{k: v}`, switch-case
// `case 1:`, labeled statement `lbl: while ...`. Adding `:` to
// DELIMITER_LABELS blanks all of them uniformly (the learner types
// `:` either way; the position-specific meaning is the learner's to
// recover from context). Same for `tokTypes.question`: ternary `?`
// is the only JS context (optional chaining is its own token
// `tokTypes.questionDot` with label `?.`).
const DELIMITER_LABELS = new Set<string>([
	'(',
	')',
	'{',
	'}',
	'${',
	'[',
	']',
	';',
	',',
	'.',
	'=>',
	'?',
	':',
	'?.',
	'...',
]);

// Inc 6.k: contextual keywords — tokens Acorn emits as `name` (label
// === 'name', .keyword undefined) but ES treats as keywords in some
// positions. Module-level to avoid per-call Set allocation; AR-4
// IMPORTANT fix.
const CONTEXTUAL_KEYWORDS = new Set<string>([
	'let',
	'static',
	'async',
	'await',
	'yield',
	'of',
	'as',
	'from',
	'get',
	'set',
]);

function blankenate(
	code: string,
	probability: number = 0.2,
	config: ContentTypeFlags = {
		keywords: true,
		identifiers: true,
		literals: false,
		operators: false,
		delimiters: false,
	},
): BlankenateResult | null {
	// Inc 6.7: length-matched placeholders. Each blank is replaced by
	// `_` repeated original.length times (was fixed `'__'` regardless
	// of original length). Cascades: blankedCode.length ===
	// originalCode.length always; positions align 1:1 between the two;
	// the wrapper's lock-shift arithmetic collapses to zero.

	// Inc 6.6: collect Acorn tokens during parse for delimiter
	// classification. AST walk handles identifier/literal/keyword/operator;
	// the token stream handles the delimiters that have no standalone
	// AST node.
	const tokens: Array<{ type: any; value: any; start: number; end: number }> =
		[];

	let tree: any = null;
	try {
		tree = acorn.parse(code, {
			ecmaVersion: 2022,
			sourceType: 'module',
			onToken: (token: any) => {
				tokens.push({
					type: token.type,
					value: token.value,
					start: token.start,
					end: token.end,
				});
			},
		});
	} catch (err) {
		console.error('Parse error:', err);
		return null;
	}

	const blankedTokens: BlankedToken[] = [];

	// Inc 6.6: walk the token stream for delimiters. Independent of the
	// AST walk below — same probability check per token; same
	// blankedTokens accumulator (sort + replace logic applies uniformly).
	if (config.delimiters) {
		for (const tok of tokens) {
			const label =
				tok.type && typeof tok.type.label === 'string' ? tok.type.label : '';
			if (DELIMITER_LABELS.has(label) && Math.random() < probability) {
				blankedTokens.push({
					start: tok.start,
					end: tok.end,
					original: label,
					type: 'delimiter',
				});
			}
		}
	}

	// Inc 6.k: walk the token stream for keywords. Two paths:
	//
	// 1. Reserved keywords (Acorn flags TokenType with `.keyword`):
	//    function, if, else, for, while, do, return, var, const, class,
	//    extends, import, export, default, try, catch, finally, throw,
	//    new, this, super, switch, case, break, continue, typeof,
	//    instanceof, in, void, delete, null, true, false, with,
	//    debugger.
	//
	// 2. Contextual keywords (Acorn tokenizes as `name` tokens — same
	//    TokenType as plain identifiers; their keyword-ness is context-
	//    dependent in the spec): `let`, `static`, `async`, `await`,
	//    `yield`, `of`, `as`, `from`, `get`, `set`. We match by `value`
	//    against a fixed set. Pedagogically these ARE keywords the
	//    learner should practice, even if the parser treats them as
	//    identifiers in some contexts.
	//
	// Overlap notes:
	// - `typeof`, `delete`, `void` are ALSO unary operators (AST walk).
	//   The token-stream pass runs first; dedup collapses to keyword.
	// - `null`, `true`, `false` are simultaneously keyword tokens AND
	//   Literal AST nodes. Same dedup rule applies.
	// - Contextual keywords may sometimes appear as regular variable
	//   names (e.g. `let x = 1` vs `var let = 1` — both legal). The
	//   contextual-set match here blanks them either way. Acceptable
	//   pedagogically: if the learner sees `let` or `static` they
	//   should practice the keyword regardless of position. Negative
	//   lock test: see `blankenate.test.ts` § "Inc 6.k — comprehensive
	//   token coverage".
	if (config.keywords) {
		for (const tok of tokens) {
			const kw =
				tok.type && typeof tok.type.keyword === 'string'
					? tok.type.keyword
					: '';
			const isReservedKeyword = kw !== '';
			const isContextualKeyword =
				!isReservedKeyword &&
				tok.type &&
				tok.type.label === 'name' &&
				typeof tok.value === 'string' &&
				CONTEXTUAL_KEYWORDS.has(tok.value);
			if (
				(isReservedKeyword || isContextualKeyword) &&
				Math.random() < probability
			) {
				// Inc 6.k AR-4: source slice is authoritative; uniformly
				// derive `original` from the source for every classifier.
				// Decouples from Acorn's internal `.keyword` string.
				const original = code.substring(tok.start, tok.end);
				blankedTokens.push({
					start: tok.start,
					end: tok.end,
					original,
					type: 'keyword',
				});
			}
		}
	}

	// Simple AST walker for blanking
	const walkNode = (node: any): void => {
		if (!node || typeof node !== 'object') return;

		// Blank identifiers (incl. PrivateIdentifier — `#x` in class
		// bodies; same pedagogical category as regular identifiers).
		if (
			config.identifiers &&
			(node.type === 'Identifier' || node.type === 'PrivateIdentifier') &&
			Math.random() < probability
		) {
			blankedTokens.push({
				start: node.start,
				end: node.end,
				original: code.substring(node.start, node.end),
				type: 'identifier',
			});
		}

		// Blank literals.
		// Use the verbatim source slice for `original` (not String(node.value)).
		// Acorn's node.value for a string literal strips the quotes
		// ('positive' for `"positive"`), but the source range
		// [start, end) the blank covers INCLUDES the quotes. When the
		// learner types over the __ they reproduce the source verbatim
		// (with quotes); the evaluator compares their typed text to
		// `original` and would mismatch on a quote-stripped original.
		// Same applies to RegExp literals (Acorn returns a RegExp object;
		// String() coerces to '/foo/g' but the source slice is canonical).
		if (
			config.literals &&
			(node.type === 'Literal' || node.type === 'RegExpLiteral') &&
			Math.random() < probability
		) {
			blankedTokens.push({
				start: node.start,
				end: node.end,
				original: code.substring(node.start, node.end),
				type: 'literal',
			});
		}

		// Inc 6.k: keywords are now detected via the token-stream walk
		// below (after the AST walk), using Acorn's `tok.type.keyword`
		// flag. The previous AST-walk-based detection covered only a
		// hardcoded subset of keyword-bearing node types (`function`,
		// `if`, `for`, `while`, `return`, `const`/`let`/`var`, `class`,
		// `try`, `catch`, `throw`, `new`) — missing `else`, `extends`,
		// `import`, `export`, `default`, `static`, `super`, `this`,
		// `async`, `await`, `yield`, `finally`, `switch`, `case`,
		// `break`, `continue`, `of`, `in`, `get`, `set`, etc. Switching
		// to the token-stream `keyword` flag catches them all uniformly.

		// Blank operators (binary, assignment, unary, update, and
		// AssignmentPattern for default-parameter `=` — added Inc 6.k).
		if (
			config.operators &&
			(node.operator ||
				node.type === 'VariableDeclarator' ||
				node.type === 'AssignmentPattern') &&
			Math.random() < probability
		) {
			let operatorStart = -1;

			if (node.type === 'BinaryExpression') {
				// For binary expressions, operator is between left and right
				const leftEnd = node.left.end;
				const rightStart = node.right.start;
				const betweenText = code.substring(leftEnd, rightStart);
				const operatorIndex = betweenText.indexOf(node.operator);
				if (operatorIndex !== -1) {
					operatorStart = leftEnd + operatorIndex;
				}
			} else if (node.type === 'AssignmentExpression') {
				// Similar to binary expressions
				const leftEnd = node.left.end;
				const rightStart = node.right.start;
				const betweenText = code.substring(leftEnd, rightStart);
				const operatorIndex = betweenText.indexOf(node.operator);
				if (operatorIndex !== -1) {
					operatorStart = leftEnd + operatorIndex;
				}
			} else if (node.type === 'VariableDeclarator' && node.init) {
				// Handle initialization operator in variable declarations (const x = 5)
				const idEnd = node.id.end;
				const initStart = node.init.start;
				const betweenText = code.substring(idEnd, initStart);
				const operatorIndex = betweenText.indexOf('=');
				if (operatorIndex !== -1) {
					operatorStart = idEnd + operatorIndex;
					// For VariableDeclarator, we need to set the operator manually since it's not in node.operator
					node.operator = '=';
				}
			} else if (node.type === 'AssignmentPattern' && node.right) {
				// Inc 6.k: default-parameter `=` lives between
				// node.left (the param) and node.right (the default).
				// `function f(x = 0)` and `({ a = 1 } = {})` both
				// use AssignmentPattern nodes with no `.operator` field.
				const leftEnd = node.left.end;
				const rightStart = node.right.start;
				const betweenText = code.substring(leftEnd, rightStart);
				const operatorIndex = betweenText.indexOf('=');
				if (operatorIndex !== -1) {
					operatorStart = leftEnd + operatorIndex;
					node.operator = '=';
				}
			} else if (node.type === 'UnaryExpression') {
				// For unary expressions, operator is at the beginning
				if (node.prefix) {
					const nodeText = code.substring(node.start, node.argument.start);
					const operatorIndex = nodeText.indexOf(node.operator);
					if (operatorIndex !== -1) {
						operatorStart = node.start + operatorIndex;
					}
				} else {
					// Postfix unary (like i++)
					const nodeText = code.substring(node.argument.end, node.end);
					const operatorIndex = nodeText.indexOf(node.operator);
					if (operatorIndex !== -1) {
						operatorStart = node.argument.end + operatorIndex;
					}
				}
			} else if (node.type === 'UpdateExpression') {
				// Update expressions (++ and --)
				if (node.prefix) {
					const nodeText = code.substring(node.start, node.argument.start);
					const operatorIndex = nodeText.indexOf(node.operator);
					if (operatorIndex !== -1) {
						operatorStart = node.start + operatorIndex;
					}
				} else {
					// Postfix
					const nodeText = code.substring(node.argument.end, node.end);
					const operatorIndex = nodeText.indexOf(node.operator);
					if (operatorIndex !== -1) {
						operatorStart = node.argument.end + operatorIndex;
					}
				}
			}

			if (
				operatorStart !== -1 &&
				(node.operator ||
					node.type === 'VariableDeclarator' ||
					node.type === 'AssignmentPattern')
			) {
				blankedTokens.push({
					start: operatorStart,
					end: operatorStart + node.operator.length,
					original: node.operator,
					type: 'operator',
				});
			}
		}

		// Recursively walk child nodes
		for (const key in node) {
			if (
				key === 'parent' ||
				key === 'leadingComments' ||
				key === 'trailingComments'
			)
				continue;
			const child = node[key];
			if (Array.isArray(child)) {
				child.forEach(walkNode);
			} else if (child && typeof child === 'object') {
				walkNode(child);
			}
		}
	};

	walkNode(tree);

	// Inc 6.k: dedupe blanks at the same `[start, end)` position. Some
	// tokens are classifiable under MULTIPLE categories (e.g. `typeof`
	// is both a keyword and a unary operator; `null` is both a keyword
	// and a Literal). The two stream walks (delimiters, keywords) run
	// BEFORE the AST walk, so first-pushed wins — the more-specific
	// classification (keyword for `typeof`/`delete`/`void`/`null`/
	// `true`/`false`) takes precedence over the broader operator /
	// literal one.
	{
		const seen = new Set<string>();
		const deduped: BlankedToken[] = [];
		for (const t of blankedTokens) {
			const key = `${t.start}:${t.end}`;
			if (seen.has(key)) continue;
			seen.add(key);
			deduped.push(t);
		}
		blankedTokens.length = 0;
		blankedTokens.push(...deduped);
	}

	// Sort blanks by position (reverse order for replacement)
	blankedTokens.sort((a, b) => b.start - a.start);

	// Generate blanked code
	let blankedCode = code;
	const blanks: Blank[] = [];

	for (let i = 0; i < blankedTokens.length; i++) {
		const token = blankedTokens[i]!;
		const blankId = `blank_${i}`;

		blanks.push({
			id: blankId,
			original: token.original,
			type: token.type,
			start: token.start,
			end: token.end,
		});

		// Replace with length-matched blank placeholder (Inc 6.7).
		blankedCode =
			blankedCode.substring(0, token.start) +
			'_'.repeat(token.original.length) +
			blankedCode.substring(token.end);
	}

	// Freeze the returned object + blanks array. The wrapper memoizes
	// the call result; freezing closes the mutation window where a
	// consumer could re-sort or push into the memoized blanks array
	// and silently corrupt later renders. Per DEV.md § 13.
	return Object.freeze({
		blankedCode,
		blanks: Object.freeze(blanks.reverse()), // Return in original order
		originalCode: code,
	});
}

// `ContentTypeFlags` is deliberately NOT exported — per DOCS.md
// § Phase 1 + README.md § Two-layer module, the boolean-map
// representation is wrapper-internal-only. The wrapper constructs
// the shape inline at the call site; TypeScript infers it from the
// `blankenate` parameter signature.
export default blankenate;
