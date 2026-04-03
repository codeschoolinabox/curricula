/**
 * @file Types for the formatting module.
 *
 * @remarks The formatting module uses recast.prettyPrint() with
 * a fixed configuration. No options type is needed — format
 * always uses the JeJ config:
 *
 * ```ts
 * { useTabs: true, tabWidth: 4, quote: 'single', wrapColumn: 80 }
 * ```
 */

/**
 * Result from `checkFormat()`.
 *
 * @remarks `formatted` is `true` when the input code exactly
 * matches the output of `format(code)` (string comparison).
 *
 * Graceful degradation: if recast throws during formatting,
 * returns `{ formatted: true }` — don't block learners on
 * formatter bugs.
 */
type CheckFormatResult = {
	readonly formatted: boolean;
};

export type { CheckFormatResult };
