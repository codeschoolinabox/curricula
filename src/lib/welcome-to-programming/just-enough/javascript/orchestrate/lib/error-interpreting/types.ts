/**
 * @file Types for the error-interpreting module.
 *
 * Defines the input, output, and internal types for interpreting
 * JEJ program errors into human-friendly explanations.
 */

// ─── Input types ────────────────────────────────────────────

/**
 * Raw error information from a JEJ program execution.
 *
 * @remarks Deliberately minimal — accepts any JavaScript error
 * shape without coupling to the JEJ API's `ResultError` type.
 * `line` is 1-based, `column` is 0-based (matching acorn).
 */
type ErrorInput = {
	readonly name: string;
	readonly message: string;
	readonly line?: number;
	readonly column?: number;
};

/**
 * Optional context to guide interpretation.
 *
 * @remarks `phase` helps disambiguate errors that share the same
 * name across parse and runtime contexts (e.g. `SyntaxError`
 * from acorn vs. `SyntaxError` from a malformed regex at runtime).
 */
type InterpretOptions = {
	readonly phase?: 'parse' | 'runtime';
};

// ─── Output types ───────────────────────────────────────────

/**
 * Details extracted from the error and source code.
 *
 * @remarks Populated by `extract-context.ts` using a combination
 * of error message parsing and optional AST analysis. All fields
 * are optional — extraction is best-effort.
 */
type ErrorContext = {
	readonly errorName: string;
	readonly errorMessage: string;
	readonly line?: number;
	readonly column?: number;
	readonly name?: string;
	readonly actualType?: string;
	readonly expression?: string;
	readonly suggestion?: string;
};

/**
 * A structured, human-friendly interpretation of a JEJ error.
 *
 * @remarks All text fields contain markdown. Template placeholders
 * (`{{name}}`, `{{line}}`, etc.) are already interpolated.
 *
 * Returned objects are always deep-frozen.
 */
type ErrorInterpretation = {
	readonly whatWentWrong: string;
	readonly howToFix: string;
	readonly likelyMisunderstanding: string;
	readonly howToAdjust: string;
	readonly seeAlso?: string;
	readonly context?: ErrorContext;
};

// ─── Internal types ─────────────────────────────────────────

/**
 * An explanation pattern from `explanations.ts`.
 *
 * @remarks The `match` field is a substring matched
 * case-insensitively against `error.message`. Text fields are
 * templates containing `{{placeholder}}` tokens that are
 * interpolated at interpretation time by `interpolate-template.ts`.
 */
type ExplanationPattern = {
	readonly id: string;
	readonly errorName: string;
	readonly match: string;
	readonly phase?: 'parse' | 'runtime';
	readonly seeAlso?: string;
	readonly whatWentWrong: string;
	readonly howToFix: string;
	readonly likelyMisunderstanding: string;
	readonly howToAdjust: string;
};

// ─── Exports ────────────────────────────────────────────────

export type {
	ErrorContext,
	ErrorInput,
	ErrorInterpretation,
	ExplanationPattern,
	InterpretOptions,
};
