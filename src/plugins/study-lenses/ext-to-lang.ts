/**
 * @file Static extension → language mapping for the sibling walker.
 *
 * The sibling walker restricts enumeration to files whose extension is
 * a key here, then annotates each discovered file with the language
 * identifier this map returns. Keys include the leading dot; values
 * match the `LangName` strings used by the `defaults` map in
 * `lenses.json`.
 *
 * @remarks V1 is `.js` only. Adding a new language means adding one
 * entry here AND the site's `lenses.json` opting that language into
 * `defaults` (per the configured-languages rule — Module B and the
 * remark transformer both gate on `defaults`).
 */

import freezeInPlace from '../../lib/utils/freeze-in-place.js';

import type { LangName } from './types.js';

const EXT_TO_LANG: Readonly<Record<string, LangName>> = freezeInPlace({
	'.js': 'js',
});

export default EXT_TO_LANG;
