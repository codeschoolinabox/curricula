import deepFreezeExcept from '@utils/deep-freeze-except.js';

import type { Facts } from '../../../embody/types.js';

import type { AssembledParseFacts } from './types.js';

/**
 * Assemble the parse facts a level consumes — once per settle — from the
 * embodiment's parse stages, or yield the undetermined signal when the
 * program did not parse.
 *
 * @remarks
 * Values, never envelopes: the assembly projects the stage values (the token
 * stream, the set-aside comments, the syntax tree) and no stage envelope,
 * cause, or embody type crosses into a level. When the tokens or ast stage
 * failed there is nothing to assemble — the result is `null`, and no level
 * is ever consulted about it (the undetermined verdict is the caller's own).
 * Freeze-what-you-own: the assembled envelope is frozen; the three carried
 * values are the embodiment's, left untouched.
 *
 * @param facts - The embodiment's fact slice for the settled snippet.
 * @returns The assembled parse facts, or `null` — the undetermined signal.
 */
export default function assembleParseFacts(facts: Facts): AssembledParseFacts {
	// 1. Either parse stage failed: nothing to assemble, no level consulted.
	if (!facts.tokens.ok || !facts.ast.ok) {
		return null;
	}

	// 2. Project the stage values — the envelope is owned here, the values
	// stay the embodiment's (freeze-what-you-own).
	const { tokens, comments } = facts.tokens.value;
	const ast = facts.ast.value;
	return deepFreezeExcept(
		{ ast, comments, tokens },
		new Set<object>([ast, comments, tokens]),
	);
}
