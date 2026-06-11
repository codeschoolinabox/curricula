import type { LintDiagnostic, LinterCallback } from './types.js';

/**
 * Run all linter callbacks safely, catching errors and filtering bad returns.
 *
 * @param callbacks - Linter functions to invoke
 * @param code - Current editor content
 * @returns Combined diagnostics from all linters
 */
export default function runLinterCallbacks(
	callbacks: readonly LinterCallback[],
	code: string,
): LintDiagnostic[] {
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
