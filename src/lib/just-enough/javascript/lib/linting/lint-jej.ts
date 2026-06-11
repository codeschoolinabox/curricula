import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import validate from '../../embody/lib/validating/validate.js';
import type { LintDiagnostic } from '../../orchestrate/lib/editing/types.js';
import NOT_IN_JEJ_ENTRIES from '../documenting/not-in-jej.js';
import NOT_IN_JEJ_LABELS from '../documenting/not-in-jej-labels.js';

import violationToDiagnostic from './violation-to-diagnostic.js';

/**
 * Produces JEJ lint diagnostics for a code string.
 *
 * @remarks The editor's `linters` callback. Runs the snippet through
 * the JEJ validation gate (`validate`, which builds no embodiment) and
 * shapes the outcome into editor diagnostics:
 *
 * - clean / empty source → `[]`
 * - parse failure → one point diagnostic at the failure location
 *   (`severity: 'error'`), synthesized here (a parse failure is not a
 *   `Violation` — it carries a flat `line`/`column`, no source range)
 * - rejections (JEJ-subset violations) → one diagnostic per violation
 *   via {@link violationToDiagnostic}, with a `entry?: DocEntry`
 *   payload when the offending token resolves to a `not-in-jej.ts`
 *   entry. The editing layer's `to-cm-diagnostic` lifts the entry
 *   through `buildTooltipDom` on gutter-marker hover.
 *
 * Parse failure and rejections are mutually exclusive: `validate`
 * returns the parse branch before walking the AST, so a `!ok` result
 * that is not a parse failure always carries `rejections`. Never
 * throws (relies on `validate`'s never-throws-for-string contract).
 * Returns a deeply frozen array.
 *
 * @param code - snippet source.
 * @returns frozen lint diagnostics, empty for clean/empty input.
 */
export default function lintJej(code: string): readonly LintDiagnostic[] {
	const result = validate(code);

	// parse failure: synthesize one point diagnostic (no source range)
	if (result.error?.kind === 'parse') {
		const parseDiagnostic: LintDiagnostic = {
			line: result.error.line,
			column: result.error.column,
			severity: 'error',
			message: result.error.message,
			source: 'JEJ',
		};
		return deepFreezeInPlace([parseDiagnostic]);
	}

	// clean → [] (rejections absent); rejections → one diagnostic each.
	// A FormattingResultError (the other BaseResult.error member) never
	// occurs here — validate() does not format-check — and would
	// correctly fall through to [].
	const rejections = result.rejections ?? [];
	return deepFreezeInPlace(
		rejections.map(function attachEntry(violation): LintDiagnostic {
			const base = violationToDiagnostic(violation);
			const token = extractToken(code, violation.location);
			if (token == null) return base;
			return { ...base, entry: NOT_IN_JEJ_ENTRIES[token] };
		}),
	);
}

/**
 * Extract the JEJ-blocked token name from a violation's source range.
 *
 * @remarks Three-step lookup against `NOT_IN_JEJ_LABELS`:
 *   1. Direct slice match (covers keyword statements like `var`,
 *      `class`, `throw`, `try`, `import`, `this`, `=>`).
 *   2. First word of the slice (covers `function foo() {}`,
 *      `class Foo {}`, `async function …`).
 *   3. Last identifier in the slice (covers member-access patterns
 *      like `str.split` → `split`, `obj.__proto__` → `__proto__`).
 *
 * Returns `null` when no recognizable token matches a documented
 * label; the diagnostic falls back to its plain-text message in that
 * case. Coverage gaps are acceptable — gracefully degrades to the
 * existing message behavior.
 */
function extractToken(
	code: string,
	location: {
		readonly start: { readonly line: number; readonly column: number };
		readonly end: { readonly line: number; readonly column: number };
	},
): string | null {
	const start = positionToOffset(code, location.start);
	const end = positionToOffset(code, location.end);
	const slice = code.slice(start, end);

	if (NOT_IN_JEJ_LABELS.has(slice)) return slice;

	// First word — strips trailing arguments / body
	const firstWord = /^[\w$]+/.exec(slice)?.[0];
	if (firstWord != null && NOT_IN_JEJ_LABELS.has(firstWord)) {
		return firstWord;
	}

	// Arrow function — the '=>' may be embedded in a larger slice
	// (e.g. `(a, b) => a + b`). The label '=>' is a stable member of
	// NOT_IN_JEJ_LABELS, so no membership check is needed.
	if (slice.includes('=>')) return '=>';

	// Last identifier — strips MemberExpression prefix (e.g. 'str.split' → 'split')
	// eslint-disable-next-line sonarjs/slow-regex -- anchored end-of-string pattern; O(n) in the engine despite the linter heuristic
	const lastWord = /[\w$]+$/.exec(slice)?.[0];
	if (lastWord != null && NOT_IN_JEJ_LABELS.has(lastWord)) {
		return lastWord;
	}

	return null;
}

/**
 * Convert an acorn 1-based-line / 0-based-column position to a flat
 * character offset into the source string.
 */
function positionToOffset(
	code: string,
	pos: { readonly line: number; readonly column: number },
): number {
	const lines = code.split('\n');
	let offset = 0;
	for (
		let index = 0;
		index < pos.line - 1 && index < lines.length;
		index += 1
	) {
		offset += (lines[index]?.length ?? 0) + 1;
	}
	return offset + pos.column;
}
