import attachLenses from './attach-lenses.js';
import deriveAccessibility from './derive-accessibility.js';
import deriveFacts from './derive-facts.js';
import gateLenses from './gate-lenses.js';
import joinStudy from './join-study.js';
import type { Embodiment, EmbodyOptions } from './types.js';

/**
 * The factory's boundary: derive the six fact stages from the source, map
 * each lifecycle phase's accessibility, gate and attach the roster's fitting
 * lenses, and join it all into the embodiment.
 *
 * @remarks
 * `type` defaults to `'module'`; `lenses` defaults to empty — embody imports
 * no roster of its own, the composition root passes one in. Synchronous,
 * pure, level-blind.
 */
export default function embody(
	source: string,
	options: EmbodyOptions = {},
): Embodiment {
	const { type = 'module', lenses = [] } = options;
	const facts = deriveFacts({ source, type });
	const study = joinStudy(
		deriveAccessibility(facts),
		attachLenses(gateLenses(facts, lenses)),
	);
	return { facts, study };
}
