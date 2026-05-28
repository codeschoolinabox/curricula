import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import validate from '../../embody/lib/validating/validate.js';
import type { LintDiagnostic } from '../../orchestrate/lib/editing/types.js';

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
 *   via {@link violationToDiagnostic}
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
function lintJej(code: string): readonly LintDiagnostic[] {
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
		rejections.map((violation) => violationToDiagnostic(violation)),
	);
}

export default lintJej;
