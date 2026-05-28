import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { Violation } from '../../embody/lib/validating/types.js';
import type { LintDiagnostic } from '../../orchestrate/lib/editing/types.js';

/**
 * Maps a single JEJ `Violation` to the editor's `LintDiagnostic` shape.
 *
 * @remarks Pure 1:1 shape translation. Flattens the violation's source
 * range to the diagnostic's `line`/`column` (from `start`) and
 * `endLine`/`endColumn` (from `end`). Both `SourceRange.end` and
 * `LintDiagnostic.endColumn` are acorn-exclusive offsets, so the
 * endpoint is copied straight through — no ±1 adjustment (the
 * inclusive→exclusive question is moot; see DOCS.md § Structural
 * constraints). `severity` (`'rejection'`) passes through; `source` is
 * tagged `'JEJ'`. The violation's `nodeType` and `nodePath` have no
 * `LintDiagnostic` field and are intentionally dropped.
 *
 * @param violation - a JEJ-subset violation from the validating pipeline.
 * @returns a frozen `LintDiagnostic`.
 */
function violationToDiagnostic(violation: Violation): LintDiagnostic {
	const { location, severity, message } = violation;
	return deepFreezeInPlace({
		line: location.start.line,
		column: location.start.column,
		endLine: location.end.line,
		endColumn: location.end.column,
		severity,
		message,
		source: 'JEJ',
	});
}

export default violationToDiagnostic;
