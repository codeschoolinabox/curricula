/**
 * @file Converts raw JavaScript runtime values to ValueRepresentation.
 *
 * Used by advice functions to bridge raw values from Aran's runtime
 * to the typed event payloads expected by event generators.
 */

import type { ValueRepresentation } from '../types.js';

/**
 * Converts a raw JavaScript value to a ValueRepresentation object.
 *
 * @param value - Any JavaScript value encountered at runtime
 * @returns A frozen ValueRepresentation matching the value's type
 */
function representValue(value: unknown): ValueRepresentation {
	if (value === null) {
		return { type: 'object', value: null, isNull: true };
	}

	if (value === undefined) {
		return { type: 'undefined' };
	}

	const type = typeof value;

	if (type === 'string') {
		return { type: 'string', value: value as string };
	}

	if (type === 'boolean') {
		return { type: 'boolean', value: value as boolean };
	}

	if (type === 'number') {
		const num = value as number;

		if (Number.isNaN(num)) {
			return { type: 'number', value: num, isNaN: true };
		}

		if (!Number.isFinite(num)) {
			return num < 0
				? { type: 'number', value: num, isInfinity: true, isNegative: true }
				: { type: 'number', value: num, isInfinity: true };
		}

		// why Object.is: -0 === 0 is true in JS, so < 0 misses it
		if (num < 0 || Object.is(num, -0)) {
			return { type: 'number', value: num, isNegative: true };
		}

		return { type: 'number', value: num };
	}

	if (type === 'function') {
		const fn = value as Function;
		return { type: 'function', name: fn.name, arity: fn.length };
	}

	if (value instanceof RegExp) {
		return { type: 'regexp', pattern: value.source, flags: value.flags };
	}

	// fallback — JEJ learner code only uses primitives, so this rarely fires
	return { type: 'object', value: null, isNull: true };
}

export default representValue;
