/**
 * Structural classification of a cap's marked throw (the iteration-guard
 * classifier pattern): the trip record by reference, or null — total over
 * unknown, never throws, never a message match. IN-REALM only: the marker
 * does not survive a structured clone.
 *
 * @param thrown - Any thrown value.
 * @returns The trip record, or null for every non-trip.
 */
import type { CapTrip } from '../types.js';

export default function readCapTrip(_thrown: unknown): CapTrip | null {
	throw new Error('not implemented — Phase 1 un-skips the suite');
}
