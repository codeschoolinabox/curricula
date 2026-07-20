import deepFreezeExcept from '../../utils/deep-freeze-except.js';

import attachLenses from './attach-lenses.js';
import deriveAccessibility from './derive-accessibility.js';
import deriveFacts from './derive-facts.js';
import gateLenses from './gate-lenses.js';
import joinStudy from './join-study.js';
import type { Embodiment, EmbodyOptions, Facts, Gateable } from './types.js';

/**
 * The factory's boundary: derive the six fact stages from the source, map
 * each lifecycle phase's accessibility, gate and attach the roster's fitting
 * lenses, and join it all into the frozen embodiment.
 *
 * @remarks
 * `type` defaults to `'module'`; `lenses` defaults to empty — embody imports
 * no roster of its own, the composition root passes one in. Synchronous,
 * pure, level-blind. Freeze-what-you-own: the structure embody built freezes
 * in place; attached lens refs and acorn's process-global token-type
 * singletons are excepted — foreign objects embody did not allocate.
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
	return deepFreezeExcept({ facts, study }, freezeExceptions(facts, lenses));
}

// freeze-what-you-own: lens refs belong to their defining modules, and each
// token's `type` is an acorn process-global singleton shared by every parse
// in the process — freezing either would reach outside the embodiment. The
// set is transient build-time state, discarded on return.
function freezeExceptions(
	facts: Facts,
	lenses: ReadonlyArray<Gateable>,
): ReadonlySet<object> {
	const except = new Set<object>(lenses);
	if (facts.tokens.ok) {
		for (const token of facts.tokens.value.tokens) {
			except.add(token.type);
		}
	}
	return except;
}
