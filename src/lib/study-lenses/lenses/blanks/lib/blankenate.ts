/**
 * @file The blanks lens's tokenizer. Walks an Acorn AST + token stream,
 * rolls a per-eligible-token probability via bare `Math.random()`, and
 * returns the source with blanked positions replaced by length-matched
 * `_` placeholders plus an array of blank descriptors.
 *
 * Provenance: this file began as a mechanical JS→TS conversion of the
 * pre-V2 `public/static/blanks/blankenate.js` (Acorn AST walk + bare
 * `Math.random()` per token). The token-coverage algorithm has been
 * extended by V2-owned augmentations:
 *
 * - Delimiters category (token-stream walk over Acorn punctuator token
 *   labels — `(`, `)`, `{`, `}`, `${`, `[`, `]`, `;`, `,`, `.`, `=>`,
 *   `?`, `:`, `?.`, `...`, and `` ` ``).
 * - Keywords (token-stream walk using Acorn's `tok.type.keyword` flag
 *   plus a fixed `CONTEXTUAL_KEYWORDS` set covering `let` / `static` /
 *   `async` / `await` / `yield` / `of` / `as` / `from` / `get` / `set`).
 * - Identifiers extended to include `PrivateIdentifier` (`#x` class
 *   fields).
 * - Operators extended to include `LogicalExpression` (`&&`, `||`,
 *   `??`), `AssignmentPattern` default-parameter `=`, and
 *   `PropertyDefinition` class-field initializer `=`.
 * - Literals extended to include `TemplateElement` (template-literal
 *   text chunks).
 * - Generator `*` is AST-detected and classified as a delimiter
 *   (since Acorn's `tokTypes.star` token covers both generator `*`
 *   and arithmetic `*`, only the AST context can disambiguate).
 * - First-push-wins dedupe across overlapping classifiers (e.g.
 *   `typeof` is both a keyword and a unary operator; `null` / `true` /
 *   `false` are both keywords and `Literal` nodes). The classification
 *   ORDER is structural — see `DOCS.md` § Structural constraints.
 *
 * Style posture: this directory (`lenses/blanks/lib/**`) is
 * eslint-ignored per `eslint.config.mjs` § Global ignores — preserves
 * the legacy file's idiosyncratic style without fighting lint. The
 * algorithmic surface is V2-owned and is held by `tests/blankenate.test.ts`.
 *
 * Output contract per the lens-local `types.ts`: `BlankenateResult |
 * null` (null on internal parse failure; defense-in-depth — in
 * production the lens's `applicableTo` gate (`embodiment.status.parsed`)
 * prevents the lens from mounting on unparseable embodiments).
 */

import * as acorn from 'acorn';

import type { Blank, BlankenateResult } from '../types.js';

export default function blankenate(
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
	// Length-matched placeholders: each blank is replaced by `_`
	// repeated `original.length` times. Cascade: blankedCode.length ===
	// originalCode.length always; positions align 1:1 between the two;
	// the wrapper's lock-shift arithmetic collapses to zero.

	// Collect Acorn tokens during parse for delimiter classification.
	// AST walk handles identifier / literal / operator; the token stream
	// handles keywords and the delimiters that have no standalone
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

	// Walk the token stream for delimiters. Independent of the AST walk
	// below — same probability check per token; same `blankedTokens`
	// accumulator (sort + replace logic applies uniformly).
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

	// Walk the token stream for keywords. Two paths:
	//
	// 1. Reserved keywords (Acorn flags TokenType with `.keyword`):
	//    function, if, else, for, while, do, return, var, const, class,
	//    extends, import, export, default, try, catch, finally, throw,
	//    new, this, super, switch, case, break, continue, typeof,
	//    instanceof, in, void, delete, null, true, false, with, debugger.
	//
	// 2. Contextual keywords (Acorn tokenizes as `name` tokens — same
	//    TokenType as plain identifiers; their keyword-ness is context-
	//    dependent in the spec): `let`, `static`, `async`, `await`,
	//    `yield`, `of`, `as`, `from`, `get`, `set`. Matched by `value`
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
	//   should practice the keyword regardless of position. See
	//   `blankenate.test.ts` for the negative-lock test on this
	//   intentional false-positive.
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
				// Source slice is authoritative; uniformly derive
				// `original` from the source for every classifier.
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

		// Generator `*` (e.g. `function* g()` or class method `*gen()`)
		// — classified as a DELIMITER. AST-detected because Acorn's
		// `tokTypes.star` token covers BOTH generator `*` and arithmetic
		// `a * b`; only generator should classify as delimiter
		// (arithmetic stays under operators via the BinaryExpression
		// branch). Three AST-shape cases:
		//   - FunctionDeclaration / FunctionExpression with
		//     `.generator === true`: `*` lives between `function` and
		//     the id (or params if anonymous).
		//   - MethodDefinition with `.value.generator === true`:
		//     `*` lives between `node.start` and `node.key.start`
		//     (covers `*gen()`, `static *gen()`, `*#priv()`).
		//   - Property with `.value.generator === true` (object-literal
		//     shorthand `{ *gen() {} }`): same shape as MethodDefinition.
		// The probability roll happens AFTER the AST shape resolves and
		// the `*` is located, so non-matching nodes don't burn rolls.
		if (config.delimiters) {
			let starStart = -1;
			if (
				(node.type === 'FunctionDeclaration' ||
					node.type === 'FunctionExpression') &&
				node.generator === true
			) {
				const boundary =
					(node.id && node.id.start) ||
					(node.params && node.params[0] && node.params[0].start) ||
					(node.body && node.body.start) ||
					node.end;
				const text = code.substring(node.start, boundary);
				const idx = text.indexOf('*');
				if (idx !== -1) starStart = node.start + idx;
			} else if (
				(node.type === 'MethodDefinition' || node.type === 'Property') &&
				node.value &&
				node.value.generator === true &&
				node.key &&
				typeof node.key.start === 'number'
			) {
				const text = code.substring(node.start, node.key.start);
				const idx = text.indexOf('*');
				if (idx !== -1) starStart = node.start + idx;
			}
			if (starStart !== -1 && Math.random() < probability) {
				blankedTokens.push({
					start: starStart,
					end: starStart + 1,
					original: '*',
					type: 'delimiter',
				});
			}
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

		// TemplateElement string content (the text chunks between ` and
		// ${, between } and ${, or between } and `) blanks under the
		// literals category. Pedagogically these ARE literal content
		// (just like `'hello'` is).
		//
		// `node.end > node.start` skips empty chunks (e.g. the empty
		// span between two adjacent interpolations `${a}${b}`) — a
		// zero-length blank would be meaningless.
		//
		// Backticks ARE in DELIMITER_LABELS (above) and blank under
		// `delimiters=true` independently of this TemplateElement /
		// literals path. No position overlap — backtick tokens and
		// TemplateElement nodes cover disjoint source ranges
		// (TemplateElement.start is AFTER the opening backtick, .end
		// is BEFORE the closing backtick).
		if (
			config.literals &&
			node.type === 'TemplateElement' &&
			node.end > node.start &&
			Math.random() < probability
		) {
			blankedTokens.push({
				start: node.start,
				end: node.end,
				original: code.substring(node.start, node.end),
				type: 'literal',
			});
		}

		// Keywords are detected via the token-stream walk above —
		// Acorn's `tok.type.keyword` flag catches reserved keywords
		// uniformly, plus the CONTEXTUAL_KEYWORDS set covers contextual
		// keywords that tokenize as `name`.

		// Blank operators. Covered AST node types:
		//   - BinaryExpression / LogicalExpression: `+ - * / % == === !=`
		//     etc. (BinaryExpression) and `&& || ??` (LogicalExpression
		//     — Acorn splits short-circuit into its own node type).
		//   - AssignmentExpression: `= += -= ||= ??=` etc.
		//   - UnaryExpression: `!` `~` `typeof` `void` `delete` etc.
		//   - UpdateExpression: `++` `--` (pre and post).
		//   - VariableDeclarator: synthetic `=` from `const x = 1`.
		//   - AssignmentPattern: synthetic `=` from `function f(x = 0)`
		//     and destructuring defaults.
		//   - PropertyDefinition: synthetic `=` from `class A { x = 1 }`
		//     and static / private field initializers.
		if (
			config.operators &&
			(node.operator ||
				node.type === 'VariableDeclarator' ||
				node.type === 'AssignmentPattern' ||
				node.type === 'PropertyDefinition') &&
			Math.random() < probability
		) {
			let operatorStart = -1;

			if (
				node.type === 'BinaryExpression' ||
				node.type === 'LogicalExpression'
			) {
				// Binary AND logical expressions share the same shape:
				// `node.left`, `node.right`, `node.operator`. Acorn splits
				// `&&` / `||` / `??` into LogicalExpression nodes;
				// `+` / `-` / `*` / `==` / `===` / etc. into BinaryExpression.
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
				// Default-parameter `=` lives between node.left (the
				// param) and node.right (the default). Both
				// `function f(x = 0)` and `({ a = 1 } = {})` use
				// AssignmentPattern nodes with no `.operator` field.
				const leftEnd = node.left.end;
				const rightStart = node.right.start;
				const betweenText = code.substring(leftEnd, rightStart);
				const operatorIndex = betweenText.indexOf('=');
				if (operatorIndex !== -1) {
					operatorStart = leftEnd + operatorIndex;
					node.operator = '=';
				}
			} else if (node.type === 'PropertyDefinition' && node.value && node.key) {
				// Class-field initializer `=` lives between node.key
				// (the field name — Identifier or PrivateIdentifier)
				// and node.value (the initializer expression). Covers:
				//   class A { x = 1; }            (instance field)
				//   class A { #count = 0; }       (private field)
				//   class A { static MAX = 100; } (static field)
				// PropertyDefinition has no `.operator` field — same
				// shape as VariableDeclarator / AssignmentPattern in
				// that regard.
				const keyEnd = node.key.end;
				const valueStart = node.value.start;
				const betweenText = code.substring(keyEnd, valueStart);
				const operatorIndex = betweenText.indexOf('=');
				if (operatorIndex !== -1) {
					operatorStart = keyEnd + operatorIndex;
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
					node.type === 'AssignmentPattern' ||
					node.type === 'PropertyDefinition')
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

	// Dedupe blanks at the same `[start, end)` position. Some tokens
	// are classifiable under MULTIPLE categories (e.g. `typeof` is both
	// a keyword and a unary operator; `null` is both a keyword and a
	// Literal). The two token-stream walks (delimiters, keywords) run
	// BEFORE the AST walk, so first-pushed wins — the more-specific
	// classification (keyword for `typeof` / `delete` / `void` / `null`
	// / `true` / `false`) takes precedence over the broader operator /
	// literal one. See `DOCS.md` § Structural constraints for the
	// token-classification precedence invariant.
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

		// Replace with length-matched blank placeholder.
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
	// Delimiter tokens (parens, brackets, braces, `${`, semicolons,
	// commas, dots, etc.) — sourced from Acorn's token stream (not
	// AST nodes — delimiters are not standalone nodes).
	readonly delimiters: boolean;
};

type BlankedToken = {
	start: number;
	end: number;
	original: string;
	type: Blank['type'];
};

// Delimiter token labels Acorn emits. These are TokenType.label
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
// Excluded from DELIMITER_LABELS by design:
//   `template` / `invalidTemplate` (string content between
//     interpolations) — these are blanked, but under LITERALS not
//     DELIMITERS, via AST-walk on `TemplateElement` nodes.
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
	'`', // template-literal opener/closer
]);

// Contextual keywords — tokens Acorn emits as `name` (label === 'name',
// `.keyword` undefined) but ES treats as keywords in some positions.
// Module-level to avoid per-call Set allocation.
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
