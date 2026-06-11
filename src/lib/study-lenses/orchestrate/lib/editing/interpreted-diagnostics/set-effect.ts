import { StateEffect } from '@codemirror/state';

import type { LintDiagnostic } from '../types.js';

/**
 * StateEffect carrying a freshly pushed interpreted-diagnostics array.
 *
 * @remarks Dispatched by `EditorInstance.setInterpretedDiagnostics` (see
 * `create-editor.ts`). Each push REPLACES the field's previous array —
 * pushes are not cumulative.
 */
const setInterpretedDiagnosticsEffect =
	StateEffect.define<readonly LintDiagnostic[]>();

export default setInterpretedDiagnosticsEffect;
