/**
 * Translates pure LintDiagnostic data into CodeMirror Diagnostic objects.
 *
 * @remarks This is the boundary where callback results (plain data)
 * become CM-specific types. Clamps line/column to valid document
 * ranges to prevent crashes from out-of-range callback results.
 *
 * @module to-cm-diagnostic
 */

import type { Text } from '@codemirror/state';
import type { Diagnostic } from '@codemirror/lint';

import type { LintDiagnostic, LinterCallback } from './types.js';

/**
 * Convert a {@link LintDiagnostic} to a CodeMirror {@link Diagnostic}.
 *
 * @remarks Clamps line/column to valid document ranges. Maps
 * `'rejection'` severity to `'error'` for JeJ compatibility.
 *
 * @param doc - CodeMirror document (Text instance)
 * @param diagnostic - LintDiagnostic from a callback
 * @returns CodeMirror Diagnostic
 */
function toCMDiagnostic(doc: Text, diagnostic: LintDiagnostic): Diagnostic {
	const { line, column, endLine, endColumn, severity, message, source } = diagnostic;

	// Clamp line to valid range (1-based, doc.lines is max)
	const clampedLine = Math.max(1, Math.min(line || 1, doc.lines));
	const lineInfo = doc.line(clampedLine);
	const from = Math.min(lineInfo.from + (column || 0), lineInfo.to);

	let to: number;
	if (endLine != null) {
		const clampedEndLine = Math.max(1, Math.min(endLine, doc.lines));
		const endLineInfo = doc.line(clampedEndLine);
		to = Math.min(endLineInfo.from + (endColumn != null ? endColumn : column || 0), endLineInfo.to);
	} else {
		// Highlight at least one character
		to = Math.min(from + 1, lineInfo.to);
	}

	// perf: skip freeze — CM may mutate diagnostic objects internally
	// JeJ uses 'rejection' for errors — map to CM's 'error' severity
	return {
		from,
		to,
		severity: severity === 'rejection' ? 'error' : severity,
		message: message || '',
		source: source || '',
	};
}

/**
 * Run all linter callbacks safely, catching errors and filtering bad returns.
 *
 * @param callbacks - Linter functions to invoke
 * @param code - Current editor content
 * @returns Combined diagnostics from all linters
 */
function runLinterCallbacks(callbacks: readonly LinterCallback[], code: string): LintDiagnostic[] {
	const results: LintDiagnostic[] = [];

	for (const fn of callbacks) {
		try {
			const linterResult = fn(code);
			if (Array.isArray(linterResult)) {
				results.push(...linterResult);
			}
		} catch (err: unknown) {
			console.warn('Linter callback threw:', err);
		}
	}

	return results;
}

export { toCMDiagnostic, runLinterCallbacks };
