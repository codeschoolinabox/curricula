import format from '../../embody/lib/formatting/format.js';

/**
 * Format JEJ code via the canonical formatter at
 * `embody/lib/formatting/format.ts`. Thin delegating wrapper — the
 * canonical formatter owns the Prettier config and the graceful
 * degradation on any throw.
 *
 * @param code - any source text (possibly empty, possibly unparseable,
 *   possibly outside the JEJ subset)
 * @returns Promise resolving to the formatted code, or to the original
 *   code unchanged when the canonical formatter could not produce
 *   output — the canonical formatter's bare `catch` catches any
 *   Prettier throw (parse error, plugin error, internal error); the
 *   adapter inherits that contract and adds no catch of its own.
 *
 * @remarks
 * Matches the `FormatCallback` signature owned by
 * `orchestrate/lib/editing/types.ts`. The canonical formatter is the
 * single source of truth for "JEJ-canonical" formatting, shared with
 * the runtime gate `checkFormat` called inside `isJej` — what the
 * editor formats and what `isJej` considers canonical are
 * byte-identical by construction. The adapter performs no
 * transformation, no inspection, and no error swallowing of its own.
 * See `DOCS.md` § Decisions for the locked no-thickening contract.
 */
export default async function formatJej(code: string): Promise<string> {
	return format(code);
}
