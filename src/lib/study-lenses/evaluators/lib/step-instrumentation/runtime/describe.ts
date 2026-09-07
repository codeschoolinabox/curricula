/**
 * The deep snapshot codec, capture side (`data.scopes` legs only). Adapts
 * klve's describe (Kelley van Evert, jsviz.klve.nl) under the ruled
 * repairs: descriptor-read own enumerable string-keyed DATA properties,
 * getters never invoked; bigint/symbol/null-prototype arms; latched
 * promise brand; honest built-in minimum arms (Error/Date/Map/Set).
 *
 * @param value - The value to snapshot at this moment.
 * @returns The described [descriptor, heap] pair — identity preserved
 *   within, severed across snapshots.
 */
import type { DescribedValue } from '../types.js';

export default function describe(_value: unknown): DescribedValue {
	throw new Error('not implemented — Phase 1 un-skips the suite');
}
