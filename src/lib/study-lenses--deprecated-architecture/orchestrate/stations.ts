/**
 * @file The canonical station order of the phases panel — source · realm ·
 * parse · creation · evaluation, left → right.
 *
 * One frozen array, single source of the panel's left → right layout. The
 * three panel derivations consume it: the roster derivation builds its
 * full five-key record over it, the availability derivation filters it
 * order-preservingly (so the non-contiguous hidden set falls out for
 * free), and the status derivation maps every member. The `Station` type
 * itself lives with `LensModule` in `../lenses/types.ts` (the lens
 * declares it, so the lens peer owns the type); this constant is the
 * orchestrator's ORDERING of those members — the layout teaches the
 * lifecycle, so the order is a pedagogical contract, not a convenience.
 */

import type { Station } from '../lenses/types.js';

const STATIONS: readonly Station[] = Object.freeze([
	'source',
	'realm',
	'parse',
	'creation',
	'evaluation',
]);

export default STATIONS;
