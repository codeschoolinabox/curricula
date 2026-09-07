/**
 * The options seam: expand boolean shorthand, fill defaults, validate
 * against the schema (unknown keys refused; per-list include/exclude
 * mutual exclusion; empty lists inert; uniqueItems), and verify the
 * cross-field co-gates (template begin/evaluation; the two incoherent
 * configurations refused). The one validation boundary — nothing
 * downstream re-validates.
 *
 * Phase-1 body transports the semantics prepare/ pipeline (the live,
 * recursive expander), per the module README's reuse inventory.
 *
 * @param options - The raw options surface; empty is first-class.
 * @returns The expanded, defaults-filled, frozen resolved form.
 * @throws The typed options failure on an invalid surface.
 */
import type {
	ResolvedStepInstrumentationOptions,
	StepInstrumentationOptions,
} from './types.js';

export default function resolveOptions(
	_options: StepInstrumentationOptions = {},
): ResolvedStepInstrumentationOptions {
	throw new Error('not implemented — Phase 1 un-skips the suite');
}
