/**
 * @file Unit tests for `fillDefaults` — AJV default-filling pipeline stage.
 *
 * ZOMBIES ordered. Test scenarios adapted from the sl-tracing-era test
 * (which was well-structured for this function's behavior — we copied the
 * implementation verbatim, so the same coverage applies). Restructured
 * into ZOMBIES order for TDD discipline.
 *
 * Tests use draft-07-style schemas (no `$schema` declaration). AJV's 2020
 * class (used by JEJ's `ajv.ts`) accepts these under `strict: false`.
 */

import { describe, expect, it } from 'vitest';

import fillDefaults from '../fill-defaults.js';
import type { JSONSchema } from '../types.js';

// Test schema with a mix of default types — reusable across many tests
const schemaWithDefaults: JSONSchema = {
	type: 'object',
	properties: {
		direction: {
			type: 'string',
			enum: ['lr', 'rl'],
			default: 'lr',
		},
		remove: {
			type: 'array',
			default: [],
		},
		replace: {
			type: 'object',
			default: {},
		},
		maxLength: {
			type: 'integer',
			description: 'Optional limit, no default',
		},
	},
};

// Nested-defaults schema — for testing deep default application
const schemaWithNestedDefaults: JSONSchema = {
	type: 'object',
	properties: {
		config: {
			type: 'object',
			properties: {
				enabled: { type: 'boolean', default: true },
				level: { type: 'integer', default: 5 },
			},
			default: { enabled: true, level: 5 },
		},
	},
};

// ─── Zero: empty / null / undefined inputs ────────────────────

describe('fillDefaults — Zero', () => {
	it('fills all defaults when input is an empty object', () => {
		expect(fillDefaults({}, schemaWithDefaults)).toEqual({
			direction: 'lr',
			remove: [],
			replace: {},
		});
	});

	it('fills all defaults when input is undefined', () => {
		expect(fillDefaults(undefined, schemaWithDefaults)).toEqual({
			direction: 'lr',
			remove: [],
			replace: {},
		});
	});

	it('fills all defaults when input is null', () => {
		expect(fillDefaults(null, schemaWithDefaults)).toEqual({
			direction: 'lr',
			remove: [],
			replace: {},
		});
	});
});

// ─── One: single-key inputs ───────────────────────────────────

describe('fillDefaults — One', () => {
	it('preserves a single user-provided value and fills the rest', () => {
		expect(fillDefaults({ direction: 'rl' }, schemaWithDefaults)).toEqual({
			direction: 'rl',
			remove: [],
			replace: {},
		});
	});

	it('returns the schema default when the key is absent', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: { flag: { type: 'boolean', default: true } },
		};
		expect(fillDefaults({}, schema)).toEqual({ flag: true });
	});

	it('user-provided value overrides schema default', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: { flag: { type: 'boolean', default: true } },
		};
		expect(fillDefaults({ flag: false }, schema)).toEqual({ flag: false });
	});
});

// ─── Many: multi-key schemas + partial user input ─────────────

describe('fillDefaults — Many', () => {
	it('preserves all user-provided values', () => {
		const input = {
			direction: 'rl',
			remove: ['a', 'b'],
			replace: { x: 'y' },
		};
		expect(fillDefaults(input, schemaWithDefaults)).toEqual(input);
	});

	it('preserves optional fields without schema defaults', () => {
		const result = fillDefaults(
			{ direction: 'lr', maxLength: 100 },
			schemaWithDefaults,
		) as Record<string, unknown>;
		expect(result['maxLength']).toBe(100);
	});

	it('fills a nested-object default when top level is empty', () => {
		expect(fillDefaults({}, schemaWithNestedDefaults)).toEqual({
			config: { enabled: true, level: 5 },
		});
	});

	it('preserves partial nested user values and fills the rest', () => {
		expect(
			fillDefaults({ config: { enabled: false } }, schemaWithNestedDefaults),
		).toEqual({ config: { enabled: false, level: 5 } });
	});
});

// ─── Boundaries: coercion, removal, mutation guards ───────────

describe('fillDefaults — Boundaries', () => {
	it('coerces a string to an integer when schema expects integer', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				count: { type: 'integer', default: 0 },
			},
		};
		expect(fillDefaults({ count: '5' }, schema)).toEqual({ count: 5 });
	});

	it('coerces a string to a boolean when schema expects boolean', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				enabled: { type: 'boolean', default: false },
			},
		};
		expect(fillDefaults({ enabled: 'true' }, schema)).toEqual({
			enabled: true,
		});
	});

	it('removes unknown properties silently when additionalProperties: false', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				known: { type: 'string', default: 'default' },
			},
			additionalProperties: false,
		};
		const result = fillDefaults(
			{ known: 'value', unknown: 'should be removed' },
			schema,
		) as Record<string, unknown>;
		expect(result).toEqual({ known: 'value' });
		expect(result['unknown']).toBeUndefined();
	});

	it('does not mutate the input object', () => {
		const input = { direction: 'rl' };
		const snapshot = { ...input };
		fillDefaults(input, schemaWithDefaults);
		expect(input).toEqual(snapshot);
	});

	it('returns a new object, not the same reference', () => {
		const input = { direction: 'rl' };
		const result = fillDefaults(input, schemaWithDefaults);
		expect(result).not.toBe(input);
	});
});

// ─── Interfaces: schema shape edge cases ──────────────────────

describe('fillDefaults — Interfaces', () => {
	it('handles an empty schema (no properties) gracefully', () => {
		const emptySchema: JSONSchema = { type: 'object' };
		expect(fillDefaults({ anything: 'value' }, emptySchema)).toEqual({
			anything: 'value',
		});
	});

	it('handles a schema without any defaults (no-op)', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				foo: { type: 'string' },
				bar: { type: 'number' },
			},
		};
		expect(fillDefaults({ foo: 'x' }, schema)).toEqual({ foo: 'x' });
	});

	it('handles a schema with a nested `default: {}` object', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				nested: {
					type: 'object',
					properties: {
						inner: { type: 'string', default: 'hello' },
					},
					default: {},
				},
			},
		};
		// Empty default object triggers AJV to fill nested defaults
		expect(fillDefaults({}, schema)).toEqual({ nested: { inner: 'hello' } });
	});
});

// ─── Exceptions: AJV internal errors not caught here ──────────
// fillDefaults relies on AJV's useDefaults feature. Malformed schemas would
// throw synchronously from ajv.compile — that path is not this function's
// responsibility. Schema-level validation errors surface later in
// validate-config (the next pipeline stage). No exception tests here.

// ─── Simple: realistic JEJ shape ──────────────────────────────

describe('fillDefaults — Simple (JEJ-realistic)', () => {
	it('fills all defaults for a nested 4-layer schema', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				resolve: {
					type: 'object',
					properties: {
						dependent: { type: 'boolean', default: true },
						provenance: { type: 'boolean', default: true },
						kinds: {
							type: 'object',
							properties: {
								variable: { type: 'boolean', default: true },
								literal: { type: 'boolean', default: true },
							},
							default: {},
						},
					},
					default: {},
				},
			},
		};
		expect(fillDefaults({}, schema)).toEqual({
			resolve: {
				dependent: true,
				provenance: true,
				kinds: { variable: true, literal: true },
			},
		});
	});
});
