/**
 * @file Deep merge utility for configuration objects
 * Provides recursive object merging with user configuration taking precedence
 */

import isPlainObject from './is-plain-object.js';

/**
 * Recursively deep merges two objects with user config taking precedence
 *
 * Handles arbitrary nesting depth with the following rules:
 * - User values always win for primitives, null, undefined
 * - Arrays are replaced completely (no element merging)
 * - Objects are merged recursively
 * - Type mismatches favor user values
 *
 * @param base - Base configuration (defaults)
 * @param user - User configuration (overrides)
 * @returns Deeply merged configuration where user values take precedence
 *
 * @example
 * // Simple override
 * deepMerge(
 *   { vars: { read: false, write: true } },
 *   { vars: { read: true } }
 * )
 * // Result: { vars: { read: true, write: true } }
 *
 * @example
 * // Array replacement
 * deepMerge(
 *   { filter: ['a', 'b'] },
 *   { filter: ['c'] }
 * )
 * // Result: { filter: ['c'] }
 *
 * @example
 * // Deep nesting
 * deepMerge(
 *   { a: { b: { c: 1, d: 2 } } },
 *   { a: { b: { c: 3 } } }
 * )
 * // Result: { a: { b: { c: 3, d: 2 } } }
 */
function deepMerge<T>(base: T, user: unknown): T {
	// User value always wins for primitives, null, undefined
	if (user === null || user === undefined || typeof user !== 'object') {
		return user as T;
	}

	// If base is not an object, user value wins
	// eslint-disable-next-line sonarjs/different-types-comparison -- T is generic, can be primitive
	if (base === null || base === undefined || typeof base !== 'object') {
		return user as T;
	}

	// Arrays: user array completely replaces base array (no element merging)
	if (Array.isArray(user)) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Generic utility pattern
		return [...user] as T;
	}

	// If base is array but user is object, user wins
	if (Array.isArray(base)) {
		return user as T;
	}

	// Both are objects: deep merge via map + fromEntries (immutable)
	const baseObject = base as Record<string, unknown>;
	const userObject = user as Record<string, unknown>;

	const userEntries = Object.keys(userObject)
		.filter((key) => Object.prototype.hasOwnProperty.call(userObject, key))
		.map(
			(key) =>
				[
					key,
					isPlainObject(userObject[key]) && isPlainObject(baseObject[key])
						? deepMerge(baseObject[key], userObject[key])
						: userObject[key],
				] as const,
		);

	// Base entries first, then user entries overwrite
	return Object.fromEntries([
		...Object.entries(baseObject),
		...userEntries,
	]) as T;
}

export default deepMerge;
