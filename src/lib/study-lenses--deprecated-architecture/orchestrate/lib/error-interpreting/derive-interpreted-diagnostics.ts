/**
 * @file Adapter — derives the editor's interpreted gutter diagnostics from a
 * static embodiment's error.
 *
 * The orchestrator computes; the editor renders. This bridges the
 * error-interpreting lib (`interpretError`) and the editing layer's
 * `LintDiagnostic` shape: it reads the live embodiment's single static
 * `EmbodyError`, routes it through `interpretError`, and emits a located
 * `LintDiagnostic[]` the editor merges into its gutter alongside `lintJej`'s
 * structural markers. The editor never receives the embodiment — only these
 * located interpretation strings cross the boundary.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { Snippet } from '../../../../embody/types.js';
import type { LintDiagnostic } from '../editing/types.js';

import interpretError from './interpret-error.js';
import type { ErrorInput } from './types.js';

/**
 * Derives interpreted gutter diagnostics from an embodiment's static error.
 *
 * Reads `embodiment.errors` (a single `EmbodyError | null` from the static
 * embody staircase). When `null`, there is nothing to surface → `[]`. Otherwise
 * the error is routed through {@link interpretError} and shaped into one located
 * `LintDiagnostic`:
 *
 * - **message** — the `whatWentWrong` interpretation (concise plain-prose in
 *   Cycle 1; the editing layer renders hovers via `textContent`, so rich
 *   markdown / multi-section hovers are deferred — no `entry`).
 * - **line / column** — from `errors.loc` when present, else a file-level notice
 *   (line 1, column 0). The contract's intermediate `source.offsets` + char-
 *   offset tier has no input here — `EmbodyError` carries `loc | null`, never a
 *   bare offset (acorn supplies `loc` directly) — so it is reserved for a future
 *   error source that does carry an offset.
 * - **severity** — `'error'` (a hard gate failure).
 * - **source** — `'interpreted'`, distinct from `lintJej`'s `'JEJ'` markers so
 *   the editor renders the two feeds distinctly and supersedes the terse one for
 *   the same error.
 *
 * The phase hint passed to `interpretError` collapses the 5-value
 * `EmbodyError.phase` to interpretError's 2-value split: `evaluation → 'runtime'`,
 * everything else → `'parse'`. Static `snippet.errors` only ever carries a
 * static phase, so the `'runtime'` branch is the documented mapping reused by the
 * future Run-dock path, not produced here.
 *
 * Pure and never-throws ({@link interpretError} never throws). Returns a frozen
 * array.
 *
 * @param embodiment - the live static `Snippet` whose `errors` are interpreted
 * @returns a frozen `readonly LintDiagnostic[]` — empty when there is no error
 */
export default function deriveInterpretedDiagnostics(
	embodiment: Snippet,
): readonly LintDiagnostic[] {
	const { errors } = embodiment;
	if (errors === null) return deepFreezeInPlace([]);

	const { kind, message, phase, loc } = errors;

	// 5-value EmbodyError.phase → interpretError's 2-value split. Static
	// snippet.errors only ever carries a static phase, so the 'runtime' branch is
	// the documented mapping reused by the future Run-dock path, not produced here.
	const interpretPhase = phase === 'evaluation' ? 'runtime' : 'parse';

	const errorInput: ErrorInput = {
		name: kind,
		message,
		...(loc !== null && { line: loc.start.line, column: loc.start.column }),
	};

	const interpretation = interpretError(embodiment, errorInput, {
		phase: interpretPhase,
	});

	// Line targeting: errors.loc when present, else a file-level notice. The
	// contract's intermediate source.offsets + char-offset tier has no input —
	// EmbodyError carries loc | null, never a bare offset — so it is reserved for
	// a future error source that does carry one.
	const diagnostic: LintDiagnostic = {
		line: loc === null ? 1 : loc.start.line,
		column: loc === null ? 0 : loc.start.column,
		severity: 'error',
		message: interpretation.whatWentWrong,
		source: 'interpreted',
	};

	return deepFreezeInPlace([diagnostic]);
}
