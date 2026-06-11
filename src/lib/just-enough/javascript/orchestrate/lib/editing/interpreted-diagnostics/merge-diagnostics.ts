import type { LintDiagnostic } from '../types.js';

/**
 * Supersede merge: interpreted diagnostics replace structural diagnostics at
 * the same position.
 *
 * @remarks **Predicate: positional identity** — an interpreted diagnostic
 * supersedes any structural diagnostic at the same `(line, column)`. Both
 * feeds locate the same acorn error at identical coordinates (`lintJej` uses
 * the parse error's `{line, column}`; the orchestrator's adapter uses
 * `errors.loc.start`), so position-identity captures exactly the contract's
 * "the SAME error shown both terse and interpreted" case. Unrelated diagnostics
 * from the two feeds coexist untouched.
 *
 * Pure: returns a new array; never mutates either input.
 *
 * @param structural - The pull-based feed (linter-callback results).
 * @param interpreted - The push-based feed (the field's current array).
 * @returns One merged diagnostic set, interpreted-first.
 */
export default function mergeDiagnostics(
	structural: readonly LintDiagnostic[],
	interpreted: readonly LintDiagnostic[],
): readonly LintDiagnostic[] {
	const surviving = structural.filter(
		(candidate) =>
			!interpreted.some(
				(replacement) =>
					replacement.line === candidate.line &&
					replacement.column === candidate.column,
			),
	);
	return [...interpreted, ...surviving];
}
