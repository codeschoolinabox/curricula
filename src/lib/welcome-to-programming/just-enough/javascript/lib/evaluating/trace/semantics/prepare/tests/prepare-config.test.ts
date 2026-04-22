/**
 * @file Unit tests for `prepareConfig` — the 3-stage pipeline wrapper.
 *
 * ZOMBIES ordered. `prepareConfig` chains three stages:
 *   1. expand-shorthand (recursive boolean expansion)
 *   2. fill-defaults   (AJV useDefaults)
 *   3. validate-config (AJV allErrors, plain Error throws)
 *
 * These tests focus on **integration** — that the three stages run in order
 * and that their combined behavior is correct. Unit coverage of each stage
 * lives in its own test file.
 */

import { describe, expect, it } from 'vitest';

import prepareConfig from '../prepare-config.js';
import type { JSONSchema } from '../types.js';

// Test schema with shorthand support + defaults + required field
const testSchema: JSONSchema = {
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
		allowedCharClasses: {
			type: 'object',
			properties: {
				lowercase: { type: 'boolean', default: true },
				uppercase: { type: 'boolean', default: true },
				number: { type: 'boolean', default: true },
			},
			default: { lowercase: true, uppercase: true, number: true },
		},
	},
	required: ['direction'],
};

// ─── Zero: empty / null / undefined inputs ────────────────────

describe('prepareConfig — Zero', () => {
	it('fills all defaults for empty object input', () => {
		expect(prepareConfig({}, testSchema)).toEqual({
			direction: 'lr',
			remove: [],
			allowedCharClasses: { lowercase: true, uppercase: true, number: true },
		});
	});

	it('fills all defaults for null input', () => {
		expect(prepareConfig(null, testSchema)).toEqual({
			direction: 'lr',
			remove: [],
			allowedCharClasses: { lowercase: true, uppercase: true, number: true },
		});
	});

	it('fills all defaults for undefined input', () => {
		expect(prepareConfig(undefined, testSchema)).toEqual({
			direction: 'lr',
			remove: [],
			allowedCharClasses: { lowercase: true, uppercase: true, number: true },
		});
	});
});

// ─── One: single shorthand input ──────────────────────────────

describe('prepareConfig — One', () => {
	it('expands a single shorthand + fills other defaults', () => {
		expect(prepareConfig({ allowedCharClasses: false }, testSchema)).toEqual({
			direction: 'lr',
			remove: [],
			allowedCharClasses: { lowercase: false, uppercase: false, number: false },
		});
	});

	it('preserves a single explicit value + fills defaults', () => {
		expect(prepareConfig({ direction: 'rl' }, testSchema)).toEqual({
			direction: 'rl',
			remove: [],
			allowedCharClasses: { lowercase: true, uppercase: true, number: true },
		});
	});
});

// ─── Many: multiple inputs, preservation, recursive expansion ─

describe('prepareConfig — Many', () => {
	it('preserves all user-provided values through the pipeline', () => {
		const input = {
			direction: 'rl',
			remove: ['x', 'y'],
			allowedCharClasses: { lowercase: true, uppercase: false, number: true },
		};
		expect(prepareConfig(input, testSchema)).toEqual(input);
	});

	it('handles mixed shorthand and explicit values', () => {
		const input = {
			direction: 'rl',
			allowedCharClasses: true,
		};
		expect(prepareConfig(input, testSchema)).toEqual({
			direction: 'rl',
			remove: [],
			allowedCharClasses: { lowercase: true, uppercase: true, number: true },
		});
	});
});

// ─── Boundaries: pipeline order triangulation ─────────────────

describe('prepareConfig — Boundaries', () => {
	it('shorthand expands BEFORE defaults fill (triangulates stage order)', () => {
		// If fill-defaults ran before expand-shorthand, `allowedCharClasses: false`
		// would be interpreted by AJV as "this field's value is the boolean false"
		// (type mismatch — schema expects object), not as "expand to all-false".
		// The correct result requires expand-shorthand to run first and produce
		// the full nested structure that fill-defaults and validate-config then
		// accept as valid.
		const result = prepareConfig(
			{ allowedCharClasses: false },
			testSchema,
		) as Record<string, unknown>;
		const classes = result['allowedCharClasses'] as Record<string, unknown>;
		expect(classes['lowercase']).toBe(false);
		expect(classes['uppercase']).toBe(false);
		expect(classes['number']).toBe(false);
	});

	it('defaults apply only AFTER shorthand expansion', () => {
		// Triangulates the opposite: shorthand `true` should NOT be overridden
		// by a default value. If the stages ran in the wrong order, the defaults
		// would win and we'd see the default-spec values regardless of shorthand.
		const schemaWithAllFalseDefault: JSONSchema = {
			type: 'object',
			properties: {
				group: {
					type: 'object',
					properties: {
						a: { type: 'boolean', default: false },
						b: { type: 'boolean', default: false },
					},
					default: { a: false, b: false },
				},
			},
		};
		expect(prepareConfig({ group: true }, schemaWithAllFalseDefault)).toEqual({
			group: { a: true, b: true },
		});
	});
});

// ─── Interfaces: idempotency + ordering contract ──────────────

describe('prepareConfig — Interfaces', () => {
	it('is idempotent — double-prep produces identical output', () => {
		const first = prepareConfig({ allowedCharClasses: true }, testSchema);
		const second = prepareConfig(first, testSchema);
		expect(second).toEqual(first);
	});

	it('is idempotent for empty input as well', () => {
		const first = prepareConfig({}, testSchema);
		const second = prepareConfig(first, testSchema);
		expect(second).toEqual(first);
	});
});

// ─── Exceptions: validation errors bubble through ──────────────

describe('prepareConfig — Exceptions', () => {
	it('throws when validation fails (invalid enum value)', () => {
		expect(() => prepareConfig({ direction: 'invalid' }, testSchema)).toThrow(
			'Options validation failed',
		);
	});

	it('throws when a value cannot be coerced to the expected type', () => {
		// Nested object where the schema expects a string — not coercible
		expect(() =>
			prepareConfig({ direction: { nested: 'object' } }, testSchema),
		).toThrow('Options validation failed');
	});
});

// ─── Simple: realistic JEJ shape ──────────────────────────────

describe('prepareConfig — Simple (JEJ-realistic)', () => {
	it('{ resolve: true } produces canonical all-on resolve shape', () => {
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
		expect(prepareConfig({ resolve: true }, schema)).toEqual({
			resolve: {
				dependent: true,
				provenance: true,
				kinds: { variable: true, literal: true },
			},
		});
	});
});
