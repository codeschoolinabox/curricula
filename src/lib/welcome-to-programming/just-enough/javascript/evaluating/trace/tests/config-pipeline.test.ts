/**
 * @file Layer 4a config pipeline tests (Node — no Worker needed).
 *
 * Tests prepareConfig with the real options.schema.json: default filling,
 * shorthand expansion (flat and recursive), validation, edge cases.
 */

import { describe, expect, it } from 'vitest';

import prepareConfig from '../configuring/prepare-config.js';
import optionsSchema from '../options-schema.js';

describe('config pipeline', () => {
	describe('prepareConfig with real schema', () => {
		it('fills all defaults for empty input', () => {
			const result = prepareConfig({}, optionsSchema) as Record<string, unknown>;

			expect(result).toHaveProperty('bindings');
			expect(result).toHaveProperty('propertyAccess');
			expect(result).toHaveProperty('operators');
			expect(result).toHaveProperty('literals');
			expect(result).toHaveProperty('templates');
			expect(result).toHaveProperty('scopes');
			expect(result).toHaveProperty('controlFlow');
			expect(result).toHaveProperty('functions');
			expect(result).toHaveProperty('with');
		});

		it('defaults all booleans to true', () => {
			const result = prepareConfig({}, optionsSchema) as Record<string, unknown>;
			const bindings = result.bindings as Record<string, unknown>;
			const kind = bindings.kind as Record<string, unknown>;

			expect(kind.let).toBe(true);
			expect(kind.const).toBe(true);
		});

		it('preserves explicit false values', () => {
			const result = prepareConfig(
				{ literals: { string: false } },
				optionsSchema,
			) as Record<string, unknown>;
			const literals = result.literals as Record<string, unknown>;

			expect(literals.string).toBe(false);
			expect(literals.number).toBe(true);
		});

		it('expands flat shorthand: literals false', () => {
			const result = prepareConfig(
				{ literals: false },
				optionsSchema,
			) as Record<string, unknown>;
			const literals = result.literals as Record<string, unknown>;

			expect(literals.string).toBe(false);
			expect(literals.boolean).toBe(false);
			expect(literals.number).toBe(false);
			expect(literals.undefined).toBe(false);
			expect(literals.null).toBe(false);
			expect(literals.regex).toBe(false);
		});

		it('expands flat shorthand: templates true', () => {
			const result = prepareConfig(
				{ templates: true },
				optionsSchema,
			) as Record<string, unknown>;
			const templates = result.templates as Record<string, unknown>;

			expect(templates.begin).toBe(true);
			expect(templates.evaluation).toBe(true);
			expect(templates.end).toBe(true);
		});

		it('removes extra properties silently', () => {
			const result = prepareConfig(
				{ unknownField: true },
				optionsSchema,
			) as Record<string, unknown>;

			expect(result).not.toHaveProperty('unknownField');
			expect(result).toHaveProperty('bindings');
		});

		it('handles null input', () => {
			const result = prepareConfig(null, optionsSchema) as Record<string, unknown>;

			expect(result).toHaveProperty('bindings');
			expect(result).toHaveProperty('with');
		});

		it('handles undefined input', () => {
			const result = prepareConfig(undefined, optionsSchema) as Record<string, unknown>;

			expect(result).toHaveProperty('bindings');
			expect(result).toHaveProperty('with');
		});
	});

	describe('recursive shorthand expansion', () => {
		it('expands nested shorthand: operators false', () => {
			const result = prepareConfig(
				{ operators: false },
				optionsSchema,
			) as Record<string, unknown>;
			const operators = result.operators as Record<string, unknown>;
			const pure = operators.pure as Record<string, unknown>;

			expect(operators.shortCircuiting).toBe(false);
			expect(operators.assignment).toBe(false);
			expect(pure.arithmetic).toBe(false);
			expect(pure.addition).toBe(false);
		});

		it('expands nested shorthand: bindings.kind false', () => {
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

		it('expands nested shorthand: controlFlow.kind false', () => {
			const result = prepareConfig(
				{ controlFlow: { kind: false } },
				optionsSchema,
			) as Record<string, unknown>;
			const controlFlow = result.controlFlow as Record<string, unknown>;
			const kind = controlFlow.kind as Record<string, unknown>;
			const loops = kind.loops as Record<string, unknown>;

			expect(kind.conditionals).toBe(false);
			expect(loops.while).toBe(false);
			expect(loops.for).toBe(false);
		});

		it('expands nested shorthand: operators.pure false', () => {
			const result = prepareConfig(
				{ operators: { pure: false } },
				optionsSchema,
			) as Record<string, unknown>;
			const operators = result.operators as Record<string, unknown>;
			const pure = operators.pure as Record<string, unknown>;

			expect(pure.arithmetic).toBe(false);
			expect(pure.addition).toBe(false);
			expect(pure.comparison).toBe(false);
			expect(pure.typeof).toBe(false);
		});
	});
});
