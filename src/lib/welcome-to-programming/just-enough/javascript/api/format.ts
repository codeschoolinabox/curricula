/**
 * @file Formatting API — re-exports from the formatting module.
 *
 * @remarks Uses recast.prettyPrint() with a fixed configuration.
 * No options — code is always formatted the JeJ way.
 *
 * Fixed config: `{ useTabs: true, tabWidth: 4, quote: 'single', wrapColumn: 80 }`
 */

import format from '../lib/formatting/format.js';
import checkFormat from '../lib/formatting/check-format.js';

export { format, checkFormat };
