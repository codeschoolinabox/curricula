/**
 * @file Layer 4a config pipeline tests (Node — no Worker needed).
 *
 * Tests prepareConfig, expandShorthand, fillDefaults, and validateConfig
 * with the real options.schema.json.
 */

import { describe, expect, it } from 'vitest';

import expandShorthand from '../configuring/expand-shorthand.js';
import fillDefaults from '../configuring/fill-defaults.js';
import prepareConfig from '../configuring/prepare-config.js';
import validateConfig from '../configuring/validate-config.js';
import optionsSchema from '../options-schema.js';

import type { JSONSchema } from '../configuring/types.js';

// =====================================================================
// prepareConfig (full pipeline with real schema)
// =====================================================================

describe('prepareConfig', () => {
	describe('default filling', () => {
		it('fills all 9 top-level keys for empty input', () => {
			const result = prepareConfig({}, optionsSchema) as Record<string, unknown>;

			expect(Object.keys(result).sort()).toEqual([
				'bindings', 'controlFlow', 'functions', 'literals',
				'operators', 'propertyAccess', 'scopes', 'templates', 'with',
			]);
		});

		it('defaults bindings.kind.let to true', () => {
			const result = prepareConfig({}, optionsSchema) as Record<string, unknown>;
			const bindings = result.bindings as Record<string, unknown>;
			const kind = bindings.kind as Record<string, unknown>;

			expect(kind.let).toBe(true);
		});

		it('defaults bindings.kind.const to true', () => {
			const result = prepareConfig({}, optionsSchema) as Record<string, unknown>;
			const bindings = result.bindings as Record<string, unknown>;
			const kind = bindings.kind as Record<string, unknown>;

			expect(kind.const).toBe(true);
		});

		it('defaults operators.pure.arithmetic to true', () => {
			const result = prepareConfig({}, optionsSchema) as Record<string, unknown>;
			const operators = result.operators as Record<string, unknown>;
			const pure = operators.pure as Record<string, unknown>;

			expect(pure.arithmetic).toBe(true);
		});

		it('defaults controlFlow.kind.loops.while to true', () => {
			const result = prepareConfig({}, optionsSchema) as Record<string, unknown>;
			const cf = result.controlFlow as Record<string, unknown>;
			const kind = cf.kind as Record<string, unknown>;
			const loops = kind.loops as Record<string, unknown>;

			expect(loops.while).toBe(true);
		});

		it('defaults filter arrays to empty', () => {
			const result = prepareConfig({}, optionsSchema) as Record<string, unknown>;
			const bindings = result.bindings as Record<string, unknown>;

			expect(bindings.filter).toEqual([]);
		});
	});

	describe('user value preservation', () => {
		it('preserves explicit false on a leaf boolean', () => {
			const result = prepareConfig(
				{ literals: { string: false } },
				optionsSchema,
			) as Record<string, unknown>;
			const literals = result.literals as Record<string, unknown>;

			expect(literals.string).toBe(false);
		});

		it('preserves sibling defaults alongside explicit false', () => {
			const result = prepareConfig(
				{ literals: { string: false } },
				optionsSchema,
			) as Record<string, unknown>;
			const literals = result.literals as Record<string, unknown>;

			expect(literals.number).toBe(true);
		});

		it('preserves user-provided filter array', () => {
			const result = prepareConfig(
				{ bindings: { filter: ['x', 'y'] } },
				optionsSchema,
			) as Record<string, unknown>;
			const bindings = result.bindings as Record<string, unknown>;

			expect(bindings.filter).toEqual(['x', 'y']);
		});
	});

	describe('flat shorthand expansion', () => {
		it('expands literals: false to all literal bools false', () => {
			const result = prepareConfig(
				{ literals: false },
				optionsSchema,
			) as Record<string, unknown>;
			const literals = result.literals as Record<string, unknown>;

			expect(literals.string).toBe(false);
			expect(literals.number).toBe(false);
			expect(literals.regex).toBe(false);
		});

		it('expands templates: true to all template bools true', () => {
			const result = prepareConfig(
				{ templates: true },
				optionsSchema,
			) as Record<string, unknown>;
			const templates = result.templates as Record<string, unknown>;

			expect(templates.begin).toBe(true);
			expect(templates.end).toBe(true);
		});
	});

	describe('recursive shorthand expansion', () => {
		it('expands operators: false recursively', () => {
			const result = prepareConfig(
				{ operators: false },
				optionsSchema,
			) as Record<string, unknown>;
			const operators = result.operators as Record<string, unknown>;
			const pure = operators.pure as Record<string, unknown>;

			expect(operators.shortCircuiting).toBe(false);
			expect(operators.assignment).toBe(false);
			expect(pure.arithmetic).toBe(false);
		});

		it('expands bindings.kind: false recursively', () => {
			const result = prepareConfig(
				{ bindings: { kind: false } },
				optionsSchema,
			) as Record<string, unknown>;
			const bindings = result.bindings as Record<string, unknown>;
			const kind = bindings.kind as Record<string, unknown>;

			expect(kind.let).toBe(false);
			expect(kind.const).toBe(false);
			expect(kind.global).toBe(false);
		});

		it('expands controlFlow.kind: false into nested loops', () => {
			const result = prepareConfig(
				{ controlFlow: { kind: false } },
				optionsSchema,
			) as Record<string, unknown>;
			const cf = result.controlFlow as Record<string, unknown>;
			const kind = cf.kind as Record<string, unknown>;
			const loops = kind.loops as Record<string, unknown>;

			expect(kind.conditionals).toBe(false);
			expect(loops.while).toBe(false);
			expect(loops.for).toBe(false);
		});

		it('expands operators.pure: false including negation sub-object', () => {
			const result = prepareConfig(
				{ operators: { pure: false } },
				optionsSchema,
			) as Record<string, unknown>;
			const operators = result.operators as Record<string, unknown>;
			const pure = operators.pure as Record<string, unknown>;
			const negation = pure.negation as Record<string, unknown>;

			expect(pure.arithmetic).toBe(false);
			expect(pure.typeof).toBe(false);
			expect(negation.logical).toBe(false);
			expect(negation.bitwise).toBe(false);
		});
	});

	describe('extra properties', () => {
		it('removes unknown top-level properties silently', () => {
			const result = prepareConfig(
				{ unknownField: true },
				optionsSchema,
			) as Record<string, unknown>;

			expect(result).not.toHaveProperty('unknownField');
		});

		it('still fills defaults when unknown properties are present', () => {
			const result = prepareConfig(
				{ unknownField: true },
				optionsSchema,
			) as Record<string, unknown>;

			expect(result).toHaveProperty('bindings');
		});
	});

	describe('edge cases', () => {
		it('handles null input', () => {
			const result = prepareConfig(null, optionsSchema) as Record<string, unknown>;

			expect(result).toHaveProperty('bindings');
		});

		it('handles undefined input', () => {
			const result = prepareConfig(undefined, optionsSchema) as Record<string, unknown>;

			expect(result).toHaveProperty('bindings');
		});
	});
});

// =====================================================================
// expandShorthand (individual function with real schema)
// =====================================================================

describe('expandShorthand', () => {
	describe('no shorthand present', () => {
		it('returns unchanged when field is already an object', () => {
			const input = { literals: { string: true, number: false } };

			const result = expandShorthand(input, optionsSchema) as Record<string, unknown>;
			const literals = result.literals as Record<string, unknown>;

			expect(literals.string).toBe(true);
			expect(literals.number).toBe(false);
		});

		it('passes through non-boolean non-object values', () => {
			const input = { bindings: { filter: ['x'] } };

			const result = expandShorthand(input, optionsSchema) as Record<string, unknown>;
			const bindings = result.bindings as Record<string, unknown>;

			expect(bindings.filter).toEqual(['x']);
		});
	});

	describe('recursive expansion', () => {
		it('expands mixed-type schema recursively (boolean leaves + object branches)', () => {
			const input = { operators: false };

			const result = expandShorthand(input, optionsSchema) as Record<string, unknown>;
			const operators = result.operators as Record<string, unknown>;
			const pure = operators.pure as Record<string, unknown>;

			expect(operators.shortCircuiting).toBe(false);
			expect(pure.arithmetic).toBe(false);
		});

		it('omits filter arrays from expansion (fillDefaults handles them)', () => {
			const input = { operators: false };

			const result = expandShorthand(input, optionsSchema) as Record<string, unknown>;
			const operators = result.operators as Record<string, unknown>;

			expect(operators).not.toHaveProperty('filter');
		});
	});

	describe('immutability', () => {
		it('returns new object (does not mutate input)', () => {
			const input = { literals: false } as Record<string, unknown>;

			expandShorthand(input, optionsSchema);

			expect(input.literals).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('handles undefined options', () => {
			const result = expandShorthand(undefined, optionsSchema);

			expect(result).toEqual({});
		});

		it('handles null options', () => {
			const result = expandShorthand(null, optionsSchema);

			expect(result).toEqual({});
		});

		it('handles empty options object', () => {
			const result = expandShorthand({}, optionsSchema);

			expect(result).toEqual({});
		});
	});
});

// =====================================================================
// fillDefaults (individual function with real schema)
// =====================================================================

describe('fillDefaults', () => {
	describe('fills missing fields', () => {
		it('fills all top-level keys from empty input', () => {
			const result = fillDefaults({}, optionsSchema) as Record<string, unknown>;

			expect(result).toHaveProperty('bindings');
			expect(result).toHaveProperty('with');
		});

		it('fills nested defaults for partial input', () => {
			const result = fillDefaults(
				{ literals: { string: false } },
				optionsSchema,
			) as Record<string, unknown>;
			const literals = result.literals as Record<string, unknown>;

			expect(literals.string).toBe(false);
			expect(literals.number).toBe(true);
		});
	});

	describe('preserves user values', () => {
		it('preserves user-provided boolean over default', () => {
			const result = fillDefaults(
				{ with: false },
				optionsSchema,
			) as Record<string, unknown>;

			expect(result.with).toBe(false);
		});

		it('preserves user-provided filter array', () => {
			const result = fillDefaults(
				{ functions: { filter: ['add'] } },
				optionsSchema,
			) as Record<string, unknown>;
			const functions = result.functions as Record<string, unknown>;

			expect(functions.filter).toEqual(['add']);
		});
	});

	describe('immutability', () => {
		it('returns new object (does not mutate input)', () => {
			const input = { with: false };
			const copy = { ...input };

			fillDefaults(input, optionsSchema);

			expect(input).toEqual(copy);
		});
	});

	describe('edge cases', () => {
		it('handles undefined input', () => {
			const result = fillDefaults(undefined, optionsSchema) as Record<string, unknown>;

			expect(result).toHaveProperty('bindings');
		});

		it('handles null input', () => {
			const result = fillDefaults(null, optionsSchema) as Record<string, unknown>;

			expect(result).toHaveProperty('bindings');
		});
	});
});

// =====================================================================
// validateConfig (individual function with real schema)
// =====================================================================

describe('validateConfig', () => {
	describe('valid input', () => {
		it('returns data for valid filled config', () => {
			const filled = fillDefaults({}, optionsSchema);
			const result = validateConfig(filled, optionsSchema);

			expect(result).toBeDefined();
		});

		it('returns same reference (enables piping)', () => {
			const filled = fillDefaults({}, optionsSchema);
			const result = validateConfig(filled, optionsSchema);

			expect(result).toBe(filled);
		});
	});

	describe('invalid input', () => {
		it('throws Error for wrong type', () => {
			expect(() => validateConfig(
				{ bindings: 'not an object' },
				optionsSchema,
			)).toThrow(Error);
		});

		it('error message includes field path', () => {
			expect(() => validateConfig(
				{ bindings: 'not an object' },
				optionsSchema,
			)).toThrow(/bindings/);
		});
	});

	describe('edge cases', () => {
		it('validates empty object against schema without required', () => {
			const emptySchema: JSONSchema = { type: 'object', properties: {} };

			const result = validateConfig({}, emptySchema);

			expect(result).toEqual({});
		});

		it('handles null input as empty object', () => {
			const emptySchema: JSONSchema = { type: 'object', properties: {} };

			expect(validateConfig(null, emptySchema)).toEqual({});
		});
	});
});
