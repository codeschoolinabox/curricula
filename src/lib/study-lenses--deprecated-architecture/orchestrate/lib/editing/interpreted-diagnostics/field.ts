import { StateField } from '@codemirror/state';

import type { LintDiagnostic } from '../types.js';
import setInterpretedDiagnosticsEffect from './set-effect.js';

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

export default interpretedDiagnosticsField;
