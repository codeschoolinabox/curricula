/**
 * @file Unit tests for the shared config-prop decoder (Module I).
 *
 * Pure function; inputs are literal values; no fixtures or FS.
 */

import { describe, expect, it } from 'vitest';

import parseLensConfig from '../parse-lens-config.js';

describe('parseLensConfig', () => {
	it('null → null', () => {
		expect(parseLensConfig(null)).toBeNull();
	});

	it('undefined → null', () => {
		expect(parseLensConfig(undefined)).toBeNull();
	});

	it('non-null object → returned as-is', () => {
		const input = { ask: false, debug: true };
		expect(parseLensConfig(input)).toBe(input);
	});

	it('JSON string that parses to object → returns parsed object', () => {
		expect(parseLensConfig('{"ask":false,"debug":true}')).toEqual({
			ask: false,
			debug: true,
		});
	});

	it('empty string → returns empty string raw (valid bare-string config)', () => {
		expect(parseLensConfig('')).toBe('');
	});

	it('non-JSON string → returns raw string', () => {
		expect(parseLensConfig('freeform')).toBe('freeform');
	});

	it('JSON-parseable non-object string ("42") → returns raw string', () => {
		expect(parseLensConfig('42')).toBe('42');
	});

	it('JSON-parseable boolean string ("true") → returns raw string', () => {
		expect(parseLensConfig('true')).toBe('true');
	});

	it('JSON-parseable array string → returns raw string (array is not an object config)', () => {
		expect(parseLensConfig('[1,2,3]')).toBe('[1,2,3]');
	});

	it('number input (not a string) → null', () => {
		expect(parseLensConfig(42)).toBeNull();
	});

	it('boolean input → null', () => {
		expect(parseLensConfig(true)).toBeNull();
	});
});
