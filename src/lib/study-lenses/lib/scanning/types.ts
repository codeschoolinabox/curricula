/**
 * @file Canonical types for the scanning module.
 *
 * The domain model in TypeScript: the fourteen input-element kinds
 * ECMA-262's goal symbols produce (the specification's vocabulary, not
 * the parser's labels — every keyword is an IdentifierName, and `/`,
 * `/=` and `}` are not Punctuator), the parser-shaped input, and the
 * tiling per-element output shape.
 *
 * See `./README.md` for the kind table, the two one-token rules that
 * fold templates and disambiguate a right brace, and the tiling
 * invariant these types encode.
 */

import type * as acorn from 'acorn';

/**
 * The fourteen kinds an input element can be, per the goal symbols
 * defined in ECMA-262's clause 12 preamble (15th edition, ES2024 — the
 * numbering moves between editions).
 *
 * The last four are **trivia**: they wrap no parser token and exist here
 * only because tiling demands that every character belong to something.
 * Widening or re-binning this union is a cross-consumer contract event,
 * not a local edit.
 */
export type InputElementKind =
	| 'IdentifierName'
	| 'PrivateIdentifier'
	| 'Punctuator'
	| 'DivPunctuator'
	| 'RightBracePunctuator'
	| 'NumericLiteral'
	| 'StringLiteral'
	| 'Template'
	| 'TemplateSubstitutionTail'
	| 'RegularExpressionLiteral'
	| 'Comment'
	| 'HashbangComment'
	| 'WhiteSpace'
	| 'LineTerminator';

/**
 * Input to `deriveInputElements`, declared in the parser's own terms —
 * what this module walks. Since the embody integration (human rulings
 * 2026-08-17 and 2026-08-18), a consumer holding an `Embodiment` does
 * not build this input at all: the factory calls the derivation once
 * per settle and publishes the result at
 * `facts.tokens.value.inputElements`. A direct caller outside the
 * embodiment's reach projects these from its facts behind a
 * successful-tokens check; tests construct the same shapes with a
 * direct `acorn.tokenizer` call.
 *
 * Deliberately NOT an `Embodiment`: this leaf imports no package region,
 * and acorn is a dependency rather than a region.
 */
export type ScanInput = {
	readonly code: string;
	readonly tokens: ReadonlyArray<acorn.Token>;
	readonly comments: ReadonlyArray<acorn.Comment>;
};

/**
 * One input element. `text` is always the verbatim source slice (never
 * the parser's processed value); `[start, end)` is zero-indexed and
 * half-open into the input `code`.
 *
 * `kind` for a `WhiteSpace` or `LineTerminator` element names a maximal
 * **run**, not a single character — the specification makes each
 * character its own element and `<CR><LF>` two, and this module
 * collapses each maximal run of one kind into one element so a surface
 * can draw it. It is the module's one deliberate departure, it never
 * merges the two kinds, and the specification's reading is recoverable
 * by splitting a run's `text` per character.
 *
 * `tokenIndices` holds positions in the caller's own `tokens` array —
 * indices, never the token objects. An acorn token's `type` is a
 * process-global singleton shared by every parse in the process, so an
 * element holding a token by reference could not also be frozen without
 * reaching outside this module and freezing the parser's own tables.
 * Indices freeze, serialize, and survive a structured clone, and a
 * consumer that needs more than this module publishes indexes back into
 * the array it already holds. Trivia elements carry none.
 *
 * Because the index is into the **input** stream rather than into any
 * output, it is also the **join key** between derivations over the same
 * tokens: neither this module's array nor a sibling's is one-to-one with
 * the token stream, so nothing else lines them up.
 *
 * A `Comment` element carries no reference back to the `acorn.Comment`
 * it came from, deliberately. The only field that object adds beyond the
 * span is its own type — and that is precisely the field this module
 * corrects for a hashbang, so publishing it would hand a consumer the
 * reading this module exists to replace.
 */
export type InputElement = {
	readonly kind: InputElementKind;
	readonly start: number;
	readonly end: number;
	readonly text: string;
	readonly tokenIndices: ReadonlyArray<number>;
};
