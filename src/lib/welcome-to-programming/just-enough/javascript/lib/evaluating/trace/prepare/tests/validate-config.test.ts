/**
 * @file Unit tests for `validateConfig` — AJV validation pipeline stage.
 *
 * ZOMBIES ordered. Scenarios adapted from the sl-tracing-era test, with two
 * JEJ-specific adjustments:
 *
 *   1. Error class: JEJ throws plain `Error` (sl-tracing used
 *      `OptionsInvalidError` from a dedicated errors module). Tests assert
 *      on `Error` + the "Options validation failed:" message prefix and
 *      field-path substrings.
 *   2. AJV instance: JEJ uses `ajv/dist/2020.js` to support draft-2020-12
 *      schemas, which is backwards-compatible with draft-07 schemas under
 *      `strict: false`.
 */

import { describe, expect, it } from 'vitest';

import validateConfig from '../validate-config.js';
import type { JSONSchema } from '../types.js';

// Test schema used across many tests
const testSchema: JSONSchema = {
	type: 'object',
	properties: {
		direction: {
			type: 'string',
			enum: ['lr', 'rl'],
		},
		remove: {
			type: 'array',
		},
		count: {
			type: 'integer',
		},
	},
	required: ['direction'],
	additionalProperties: false,
};

// ─── Zero: empty / null / undefined inputs ────────────────────

describe('validateConfig — Zero', () => {
	it('validates null input as empty object (when schema allows)', () => {
		const schemaNoRequired: JSONSchema = {
			type: 'object',
			properties: {},
		};
		expect(validateConfig(null, schemaNoRequired)).toEqual({});
	});

	it('validates undefined input as empty object (when schema allows)', () => {
		const schemaNoRequired: JSONSchema = {
			type: 'object',
			properties: {},
		};
		expect(validateConfig(undefined, schemaNoRequired)).toEqual({});
	});

	it('validates empty object against schema with no required fields', () => {
		const schemaNoRequired: JSONSchema = {
			type: 'object',
			properties: {
				optional: { type: 'string' },
			},
		};
		expect(validateConfig({}, schemaNoRequired)).toEqual({});
	});
});

// ─── One: single-property schemas ─────────────────────────────

describe('validateConfig — One', () => {
	it('returns data unchanged for a single valid property', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: { flag: { type: 'boolean' } },
		};
		expect(validateConfig({ flag: true }, schema)).toEqual({ flag: true });
	});

	it('returns the same reference (enables piping)', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: { flag: { type: 'boolean' } },
		};
		const input = { flag: true };
		expect(validateConfig(input, schema)).toBe(input);
	});

	it('throws when a required single property is missing', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: { flag: { type: 'boolean' } },
			required: ['flag'],
		};
		expect(() => validateConfig({}, schema)).toThrow(
			'Options validation failed',
		);
	});
});

// ─── Many: multi-property schemas + multi-error collection ────

describe('validateConfig — Many', () => {
	it('returns multi-property data unchanged when valid', () => {
		const input = { direction: 'lr', remove: [] };
		expect(validateConfig(input, testSchema)).toEqual(input);
	});

	it('collects multiple violations in one error message', () => {
		const input = { direction: 123, count: 'not a number' };
		// Both direction and count should appear in the combined message
		expect(() => validateConfig(input, testSchema)).toThrow(/direction/);
	});

	it('multi-error message mentions every violated field', () => {
		const input = { direction: 123, count: 'not-a-number' };
		try {
			validateConfig(input, testSchema);
			throw new Error('Expected validateConfig to throw');
		} catch (error) {
			const message = (error as Error).message;
			expect(message).toMatch(/direction/);
			expect(message).toMatch(/count/);
		}
	});
});

// ─── Boundaries: enum, additionalProperties, type errors ──────

describe('validateConfig — Boundaries', () => {
	it('throws for wrong type on a known property', () => {
		const input = { direction: 123 };
		expect(() => validateConfig(input, testSchema)).toThrow(Error);
	});

	it('error message includes the field path for type errors', () => {
		const input = { direction: 123 };
		expect(() => validateConfig(input, testSchema)).toThrow(/direction/);
	});

	it('throws for an invalid enum value', () => {
		const input = { direction: 'invalid' };
		expect(() => validateConfig(input, testSchema)).toThrow(Error);
	});

	it('error message lists allowed enum values', () => {
		const input = { direction: 'invalid' };
		expect(() => validateConfig(input, testSchema)).toThrow(/lr/);
	});

	it('throws when a required field is missing', () => {
		const input = { remove: [] };
		expect(() => validateConfig(input, testSchema)).toThrow(Error);
	});

	it('error message mentions the missing required field', () => {
		const input = { remove: [] };
		expect(() => validateConfig(input, testSchema)).toThrow(/direction/);
	});
});

// ─── Interfaces: contract surface ─────────────────────────────

describe('validateConfig — Interfaces', () => {
	it('error message is prefixed with "Options validation failed:"', () => {
		const input = { direction: 123 };
		expect(() => validateConfig(input, testSchema)).toThrow(
			/^Options validation failed:/,
		);
	});

	it('throws a plain Error (not a custom subclass)', () => {
		const input = { direction: 123 };
		try {
			validateConfig(input, testSchema);
			throw new Error('Expected validateConfig to throw');
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			// Constructor should be Error itself, not a subclass
			expect((error as Error).constructor).toBe(Error);
		}
	});
});

// ─── Exceptions: fail-loud paths ──────────────────────────────

describe('validateConfig — Exceptions', () => {
	it('throws with a non-empty error message', () => {
		const input = { direction: 123 };
		try {
			validateConfig(input, testSchema);
			throw new Error('Expected validateConfig to throw');
		} catch (error) {
			expect((error as Error).message.length).toBeGreaterThan(0);
		}
	});
});

// ─── Simple: realistic JEJ shape ──────────────────────────────

describe('validateConfig — Simple (JEJ-realistic)', () => {
	it('passes a fully-resolved resolve config (4-layer shape)', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				resolve: {
					type: 'object',
					properties: {
						dependent: { type: 'boolean' },
						provenance: { type: 'boolean' },
						kinds: {
							type: 'object',
							properties: {
								variable: { type: 'boolean' },
								literal: { type: 'boolean' },
							},
							additionalProperties: false,
						},
					},
					additionalProperties: false,
				},
			},
			additionalProperties: false,
		};
		const input = {
			resolve: {
				dependent: true,
				provenance: true,
				kinds: { variable: true, literal: true },
			},
		};
		expect(validateConfig(input, schema)).toEqual(input);
	});
});
