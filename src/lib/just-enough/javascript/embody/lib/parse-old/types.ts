/**
 * @file Types for the parse module.
 *
 * @remarks Owns the parse-related domain types used by both
 * `parseProgram` (the acorn primitive) and `parse` (the public
 * shaper). `ParseError` is the low-level shape produced by
 * `parseProgram`; `ParseResultError` is the API-shaped error
 * carried inside `ParseResult` from `parse(code)`.
 *
 * `lib/validating` re-imports `ParseError` from here for its own
 * `ValidationReport.parseError` field.
 */

import type { Node, Program } from 'acorn';

/**
 * A direct child AST node paired with the path segment that reaches
 * it from its parent.
 *
 * @remarks Produced by `getChildNodesWithPath`. The `segment` is a
 * single JSONPath step in the package's convention: `'init'` for an
 * object-valued property, `'body[0]'` for an element of an
 * array-valued property. The bracket index is the element's position
 * in the source array, so a null array hole (e.g. the gap in the
 * sparse array `[1, , 3]`) is omitted without shifting later
 * siblings' indices (`'elements[0]'`, `'elements[2]'`). A null
 * object-valued property (e.g. an absent `IfStatement.alternate`) is
 * simply not emitted — it has no segment at all. A walker composes a
 * full Program-rooted path by joining `parentPath` and `segment` with
 * `'.'` (e.g. `'$' + '.' + 'body[0]'` → `'$.body[0]'`).
 */
type ChildWithPath = {
	readonly child: Node;
	readonly segment: string;
};

/**
 * A line/column position in source code.
 *
 * @remarks Lines are 1-based, columns are 0-based — matching
 * acorn's output when `locations: true` is set. Local to this
 * module; structurally identical to (but intentionally separate
 * from) `lib/validating/types.ts`'s `SourcePosition` to keep
 * lib/parse free of cross-module type dependencies.
 */
type SourcePosition = {
	readonly line: number;
	readonly column: number;
};

/**
 * A parse error from acorn when the source cannot be parsed.
 *
 * @remarks Returned by `parseProgram` instead of thrown —
 * educational tools need graceful degradation for student code
 * with syntax errors.
 *
 * `location` points to the character where acorn gave up, which
 * is often (but not always) where the actual mistake is.
 * `parseProgram` supplies fallbacks (`line: 1`, `column: 0`)
 * when acorn omits the data, so both fields are always present.
 */
type ParseError = {
	readonly message: string;
	readonly location: SourcePosition;
};

/**
 * The error shape inside a `ParseResult` when parse failed.
 *
 * @remarks Discriminated by `kind: 'parse'` so this type slots
 * into broader result-error unions consistently. `column` is
 * always present (parseProgram supplies a fallback when acorn
 * omits it).
 */
type ParseResultError = {
	readonly kind: 'parse';
	readonly name: string;
	readonly message: string;
	readonly line: number;
	readonly column: number;
};

/**
 * Result from `parse()` — syntax check only, no language-level
 * validation.
 *
 * @remarks
 * - `ok: true` means acorn parsed successfully; `ast` is present
 * - `ok: false` means a syntax error; `error` is present
 * - `code` always echoes back the input source on both branches
 * - `scriptMode` is `true` when the program was parsed in script
 *   mode due to a `with` statement (module mode rejects `with`).
 *   Same naming as `ValidationReport.scriptMode` in lib/validating
 *   for cross-module consistency.
 *
 * **Discriminator convention.** Results discriminate on `ok` (a
 * boolean); errors discriminate on `kind` (a string literal). The
 * two-discriminator pattern is used consistently across the
 * codebase's result types.
 *
 * **AST immutability gap.** `ast` is typed `Readonly<Program>`
 * (shallow type-level immutability) but is **deep-frozen at
 * runtime** by `parse()`. TypeScript's structural typing does not
 * represent recursive readonly without a custom mapped type; the
 * runtime guarantee is stronger than the type declaration.
 * Consumer mutation attempts throw in strict mode.
 */
type ParseResult =
	| {
			readonly ok: true;
			readonly code: string;
			readonly ast: Readonly<Program>;
			readonly scriptMode?: true;
	  }
	| {
			readonly ok: false;
			readonly code: string;
			readonly error: ParseResultError;
	  };

export type { ChildWithPath, ParseError, ParseResult, ParseResultError };
