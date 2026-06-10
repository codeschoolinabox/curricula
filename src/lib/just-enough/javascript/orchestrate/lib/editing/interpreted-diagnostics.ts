/**
 * Push-based interpreted-diagnostics feed for the pull-based linter pipeline.
 *
 * @remarks The editor's diagnostic pipeline is PULL-based: `linter()` re-runs
 * the combined linter callbacks on doc changes and derives diagnostics from
 * the code string. Interpreted diagnostics are PUSH-based, embodiment-keyed
 * data the orchestrator computes OUTSIDE the editor (from its live
 * embodiment's `errors`) and hands in as a plain `readonly LintDiagnostic[]`
 * — they are NOT derivable from the doc string, and they arrive on a React
 * prop change with NO accompanying doc change. This module is the injection
 * seam between the two cadences:
 *
 * - `effect` — the StateEffect a push dispatches.
 * - `field` — the StateField holding the latest pushed array. The linter
 *   pipeline (`build-extensions.ts`) reads it inside the combined linter and
 *   declares `needsRefresh` on field change, so a push re-arms the lint pass.
 * - `merge` — the supersede merge combining the structural (pull) feed with
 *   the interpreted (push) feed into one diagnostic set.
 *
 * ⚠️ **Load-bearing CM fact (`@codemirror/lint` 6.9.5)** — do NOT "simplify"
 * this seam into a ref-held array + `forceLinting`: `forceLinting` →
 * `plugin.force()` runs ONLY while the lint plugin's internal `set` flag is
 * true, and `set` flips true ONLY on `docChanged`, a lint-config facet
 * change, or a truthy `needsRefresh(update)`. A transaction that changes
 * neither doc nor field (as with a plain ref write) leaves `set === false`
 * and `forceLinting` silently no-ops — the gutter would never repaint on the
 * orchestrator's debounce settle. The StateEffect/StateField + `needsRefresh`
 * pair is what re-arms the plugin; the regression test for this is the
 * "repaint on prop update" case in `../../editor/tests/index.test.tsx`.
 *
 * @module interpreted-diagnostics
 */

import { StateEffect, StateField } from '@codemirror/state';

import type { LintDiagnostic } from './types.js';

/**
 * StateEffect carrying a freshly pushed interpreted-diagnostics array.
 *
 * @remarks Dispatched by `EditorInstance.setInterpretedDiagnostics` (see
 * `create-editor.ts`). Each push REPLACES the field's previous array —
 * pushes are not cumulative.
 */
const setInterpretedDiagnosticsEffect =
	StateEffect.define<readonly LintDiagnostic[]>();

/**
 * StateField holding the latest pushed interpreted-diagnostics array.
 *
 * @remarks Starts empty; updated only by {@link setInterpretedDiagnosticsEffect}.
 * The combined linter reads this field as its second input (alongside the
 * linter-callback results), so the field is data, not presentation — it never
 * renders anything by itself.
 */
const interpretedDiagnosticsField = StateField.define<
	readonly LintDiagnostic[]
>({
	create: () => [],
	update(value, transaction) {
		let next = value;
		for (const effect of transaction.effects) {
			if (effect.is(setInterpretedDiagnosticsEffect)) {
				next = effect.value;
			}
		}
		return next;
	},
});

/**
 * Supersede merge: interpreted diagnostics replace structural diagnostics at
 * the same position.
 *
 * @remarks **Predicate: positional identity** — an interpreted diagnostic
 * supersedes any structural diagnostic at the same `(line, column)`. Both
 * feeds locate the same acorn error at identical coordinates (`lintJej` uses
 * the parse error's `{line, column}`; the orchestrator's adapter uses
 * `errors.loc.start`), so position-identity captures exactly the contract's
 * "the SAME error shown both terse and interpreted" case (see
 * `../../editor/DOCS.md` § Diagnostic surface). Unrelated diagnostics from
 * the two feeds coexist untouched.
 *
 * **Deliberate non-goals** (scope fence — do not extend without a contract
 * change): no range-overlap matching, no message-similarity heuristics, no
 * severity arbitration, no dedup WITHIN either feed, and no dispatch on the
 * free-form `source` string (the merge works positionally on the two input
 * arrays, so it never has to trust the `'interpreted'` / `'JEJ'` tag
 * convention).
 *
 * **Clamping boundary.** `toCMDiagnostic`'s range clamping runs AFTER this
 * merge, so two diagnostics with distinct pre-clamp `(line, column)` pairs
 * that happen to clamp to the same document position are NOT superseded —
 * both render at that gutter row. Acceptable within the positional-identity
 * contract (out-of-range coordinates signal a producer bug, not a merge
 * concern).
 *
 * Pure: returns a new array; never mutates either input.
 *
 * @param structural - The pull-based feed (linter-callback results).
 * @param interpreted - The push-based feed (the field's current array).
 * @returns One merged diagnostic set, interpreted-first.
 */
function mergeDiagnostics(
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

// perf: skip freeze — holds CM StateEffect/StateField instances (CM-internal,
// inherently stateful); the namespace itself is module-private by convention.
const interpretedDiagnostics = {
	effect: setInterpretedDiagnosticsEffect,
	field: interpretedDiagnosticsField,
	merge: mergeDiagnostics,
};

export default interpretedDiagnostics;
