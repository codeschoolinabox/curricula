import type { Options } from 'acorn';

import freezeInPlace from '@utils/freeze-in-place.js';

/**
 * @file The package's published parse contract, as data — the settings a caller
 * parses an unsettled source with, so the facts it screens are shaped exactly
 * like the settled pipeline's. One named configuration, so a caller reaching
 * for the package's parse shape does not re-type it and get it subtly wrong.
 *
 * @remarks
 * Two options, and the absences are load-bearing. The language year is
 * **numeric**: a scope analyzer's version gate is a numeric comparison that
 * silently degrades on a string, so one shared numeral keeps a tokenizer, a
 * parser, and a scope analysis reading the source at the same language version.
 * Source spans are on because a violation's range is character offsets — and
 * `locations` is absent for that same reason: this package never converts to
 * line/column. The parse **goal** is absent deliberately: it is the one setting
 * that legitimately varies per source, so a caller supplies it at the call.
 *
 * `Required<Pick<…>>` is the contract in the type: dropping either option is a
 * compile error, and excess-property checking on the literal below makes adding
 * a third one an error too.
 *
 * The leaf publishes these settings and never parses. A published constant is a
 * convention, not an enforcement — nothing compels a caller to use it, and no
 * type expresses the precondition.
 */

const PARSE_SETTINGS = freezeInPlace<
	Required<Pick<Options, 'ecmaVersion' | 'ranges'>>
>({
	ecmaVersion: 2024,
	ranges: true,
});

export default PARSE_SETTINGS;
