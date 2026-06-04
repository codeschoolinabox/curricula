/**
 * Translates pure LintDiagnostic data into CodeMirror Diagnostic objects.
 *
 * @remarks This is the boundary where callback results (plain data)
 * become CM-specific types. Clamps line/column to valid document
 * ranges to prevent crashes from out-of-range callback results.
 *
 * @module to-cm-diagnostic
 */

import type { Diagnostic } from '@codemirror/lint';
import type { Text } from '@codemirror/state';

import buildTooltipDom from './build-tooltip-dom.js';
import type { LintDiagnostic, LinterCallback } from './types.js';

/**
 * Convert a {@link LintDiagnostic} to a CodeMirror {@link Diagnostic}.
 *
 * @remarks Clamps line/column to valid document ranges. Maps
 * `'rejection'` severity to `'warning'` (signaling teaching-boundary
 * rather than syntax error). When the diagnostic carries an `entry`
 * payload (rich DocEntry), wires `renderMessage` to lift it through
 * `buildTooltipDom` — same renderer the hover surface uses.
 *
 * @param doc - CodeMirror document (Text instance)
 * @param diagnostic - LintDiagnostic from a callback
 * @returns CodeMirror Diagnostic
 */
function toCMDiagnostic(document: Text, diagnostic: LintDiagnostic): Diagnostic {
	const { line, column, endLine, endColumn, severity, message, source, entry } =
		diagnostic;

	// Clamp line to valid range (1-based, doc.lines is max)
	const clampedLine = Math.max(1, Math.min(line || 1, document.lines));
	const lineInfo = document.line(clampedLine);
	const from = Math.min(lineInfo.from + (column || 0), lineInfo.to);

	let to: number;
	if (endLine == null) {
		// Highlight at least one character
		to = Math.min(from + 1, lineInfo.to);
	} else {
		const clampedEndLine = Math.max(1, Math.min(endLine, document.lines));
		const endLineInfo = document.line(clampedEndLine);
		to = Math.min(
			endLineInfo.from + (endColumn == null ? column || 0 : endColumn),
			endLineInfo.to,
		);
	}

	// perf: skip freeze — CM may mutate diagnostic objects internally
	// JeJ uses 'rejection' for subset violations — map to CM's
	// 'warning' severity (teaching boundary, not syntax error)
	const cmSeverity: Diagnostic['severity'] =
		severity === 'rejection' ? 'warning' : severity;
	const result: Diagnostic = {
		from,
		to,
		severity: cmSeverity,
		message: message || '',
		source: source || '',
	};

	// When the JEJ-aware linter attaches a rich DocEntry, lift it
	// through buildTooltipDom on hover. The token name shown in the
	// tooltip header is the doc-slice at the diagnostic's range.
	if (entry != null) {
		const token = document.sliceString(from, to);
		// perf: skip freeze — Diagnostic is CM-internal, mutable by CM
		result.renderMessage = function renderRichMessage(): Node {
			return buildTooltipDom(token, entry);
		};
	}

	return result;
}

/**
 * Run all linter callbacks safely, catching errors and filtering bad returns.
 *
 * @param callbacks - Linter functions to invoke
 * @param code - Current editor content
 * @returns Combined diagnostics from all linters
 */
function runLinterCallbacks(
	callbacks: readonly LinterCallback[],
	code: string,
): readonly LintDiagnostic[] {
	const results: readonly LintDiagnostic[] = [];

	for (const function_ of callbacks) {
		try {
			const linterResult = function_(code);
			if (Array.isArray(linterResult)) {
				results.push(...linterResult);
			}
		} catch (error: unknown) {
			console.warn('Linter callback threw:', error);
		}
	}

	return results;
}

export { toCMDiagnostic, runLinterCallbacks };
