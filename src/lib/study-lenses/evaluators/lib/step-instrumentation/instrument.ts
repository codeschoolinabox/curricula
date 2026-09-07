/**
 * The Babel transform (plugin name `stepperize` — both ancestors' own
 * field): capture-gated wraps per the resolved options, the unconditional
 * meta-control channel (counting, receiver caches, the return wrap, the
 * function-body try/finally, the top-level error wrap), synthetic
 * scope/branch/iteration events, the decline roster, and the constitutive
 * stamps (nodePath + loc + offsets from THIS parse).
 *
 * Adapts the klve tracer core by Kelley van Evert (jsviz.klve.nl) under
 * the repaired postures the module README § The transform contract binds.
 *
 * @param input - code + explicit sourceType + resolved options (+ optional
 *   namespace, `'__V__'` default).
 * @returns The instrumented text, the namespace it baked, the declines
 *   manifest, and the programStamp `createCollector` consumes.
 * @throws The typed instrument failure (parse/codegen with Babel's own
 *   position; the `with` refusal). Empty code is NOT a failure.
 */
import type { InstrumentInput, InstrumentedProgram } from './types.js';

export default function instrument(
	_input: InstrumentInput,
): InstrumentedProgram {
	throw new Error('not implemented — Phase 1 un-skips the suite');
}
