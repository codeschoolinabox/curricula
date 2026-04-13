/**
 * @file Integration tests for the config prep pipeline against options.schema.json.
 *
 * Exercises `prepareConfig` (expand → fill → validate) against the **canonical
 * real-world `options.schema.json`** — distinct from the unit tests in
 * `prepare-config.test.ts` which use small hand-crafted schemas. This file
 * catches regressions in the actual JEJ schema shape.
 *
 * Covers:
 *   - resolve: { dependent, provenance, kinds } — both flags default TRUE
 *   - `{ resolve: true }` shorthand naturally expands via recursive expander
 *   - errors top-level flag defaults TRUE
 *   - with top-level flag defaults TRUE
 *   - nested shorthands (statements, expression, scopes) expand recursively
 */

import { describe, expect, it } from 'vitest';

import prepareConfig from '../prepare-config.js';
import optionsSchema from '../../options-schema.js';

// ─── Helper ────────────────────────────────────────────────────
function prep(input: unknown = {}): Record<string, unknown> {
	return prepareConfig(input, optionsSchema) as Record<string, unknown>;
}

// =====================================================================
// prepareConfig — default filling (empty input → full structure)
// =====================================================================

describe('prepareConfig', () => {
	describe('default filling for empty input', () => {
		it('returns an object', () => {
			expect(typeof prep({})).toBe('object');
		});

		it('populates resolve as object', () => {
			expect(typeof prep({})['resolve']).toBe('object');
		});

		it('populates expression as object', () => {
			expect(typeof prep({})['expression']).toBe('object');
		});

		it('populates statements as object', () => {
			expect(typeof prep({})['statements']).toBe('object');
		});

		it('populates scopes as object', () => {
			expect(typeof prep({})['scopes']).toBe('object');
		});

		it('populates with default true', () => {
			expect(prep({})['with']).toBe(true);
		});

		it('populates errors default true', () => {
			expect(prep({})['errors']).toBe(true);
		});
	});

	describe('resolve defaults', () => {
		it('resolve.dependent defaults true', () => {
			const resolve = prep({})['resolve'] as Record<string, unknown>;
			expect(resolve['dependent']).toBe(true);
		});

		it('resolve.provenance defaults true', () => {
			const resolve = prep({})['resolve'] as Record<string, unknown>;
			expect(resolve['provenance']).toBe(true);
		});

		it('resolve.kinds is an object', () => {
			const resolve = prep({})['resolve'] as Record<string, unknown>;
			expect(typeof resolve['kinds']).toBe('object');
		});

		it('resolve.kinds.variable defaults true', () => {
			const resolve = prep({})['resolve'] as Record<string, unknown>;
			const kinds = resolve['kinds'] as Record<string, unknown>;
			expect(kinds['variable']).toBe(true);
		});

		it('resolve.kinds.literal defaults true', () => {
			const resolve = prep({})['resolve'] as Record<string, unknown>;
			const kinds = resolve['kinds'] as Record<string, unknown>;
			expect(kinds['literal']).toBe(true);
		});

		it('resolve.kinds.operator defaults true', () => {
			const resolve = prep({})['resolve'] as Record<string, unknown>;
			const kinds = resolve['kinds'] as Record<string, unknown>;
			expect(kinds['operator']).toBe(true);
		});

		it('resolve.kinds.template defaults true', () => {
			const resolve = prep({})['resolve'] as Record<string, unknown>;
			const kinds = resolve['kinds'] as Record<string, unknown>;
			expect(kinds['template']).toBe(true);
		});
	});

	describe('expression defaults (spot-check nested)', () => {
		it('expression.variables.read defaults true', () => {
			const expression = prep({})['expression'] as Record<string, unknown>;
			const variables = expression['variables'] as Record<string, unknown>;
			expect(variables['read']).toBe(true);
		});

		it('expression.operators.arithmetic defaults true', () => {
			const expression = prep({})['expression'] as Record<string, unknown>;
			const operators = expression['operators'] as Record<string, unknown>;
			expect(operators['arithmetic']).toBe(true);
		});

		it('expression.literals.string defaults true', () => {
			const expression = prep({})['expression'] as Record<string, unknown>;
			const literals = expression['literals'] as Record<string, unknown>;
			expect(literals['string']).toBe(true);
		});
	});

	describe('statements defaults (spot-check nested)', () => {
		it('statements.while.test defaults true', () => {
			const statements = prep({})['statements'] as Record<string, unknown>;
			const whileLoop = statements['while'] as Record<string, unknown>;
			expect(whileLoop['test']).toBe(true);
		});

		it('statements.for.iteration defaults true', () => {
			const statements = prep({})['statements'] as Record<string, unknown>;
			const forLoop = statements['for'] as Record<string, unknown>;
			expect(forLoop['iteration']).toBe(true);
		});

		it('statements.break defaults true', () => {
			const statements = prep({})['statements'] as Record<string, unknown>;
			expect(statements['break']).toBe(true);
		});
	});

	describe('scopes defaults (spot-check nested)', () => {
		it('scopes.script.enter defaults true', () => {
			const scopes = prep({})['scopes'] as Record<string, unknown>;
			const script = scopes['script'] as Record<string, unknown>;
			expect(script['enter']).toBe(true);
		});

		it('scopes.block.enter defaults true', () => {
			const scopes = prep({})['scopes'] as Record<string, unknown>;
			const block = scopes['block'] as Record<string, unknown>;
			expect(block['enter']).toBe(true);
		});
	});
});

// =====================================================================
// Recursive shorthand expansion — the JEJ-specific feature
// =====================================================================

describe('recursive shorthand expansion', () => {
	describe('{ resolve: true }', () => {
		it('expands resolve.dependent to true', () => {
			const resolve = prep({ resolve: true })['resolve'] as Record<
				string,
				unknown
			>;
			expect(resolve['dependent']).toBe(true);
		});

		it('expands resolve.provenance to true', () => {
			const resolve = prep({ resolve: true })['resolve'] as Record<
				string,
				unknown
			>;
			expect(resolve['provenance']).toBe(true);
		});

		it('expands resolve.kinds.variable to true', () => {
			const resolve = prep({ resolve: true })['resolve'] as Record<
				string,
				unknown
			>;
			const kinds = resolve['kinds'] as Record<string, unknown>;
			expect(kinds['variable']).toBe(true);
		});

		it('expands resolve.kinds.operator to true', () => {
			const resolve = prep({ resolve: true })['resolve'] as Record<
				string,
				unknown
			>;
			const kinds = resolve['kinds'] as Record<string, unknown>;
			expect(kinds['operator']).toBe(true);
		});
	});

	describe('{ resolve: false }', () => {
		it('expands resolve.dependent to false', () => {
			const resolve = prep({ resolve: false })['resolve'] as Record<
				string,
				unknown
			>;
			expect(resolve['dependent']).toBe(false);
		});

		it('expands resolve.provenance to false', () => {
			const resolve = prep({ resolve: false })['resolve'] as Record<
				string,
				unknown
			>;
			expect(resolve['provenance']).toBe(false);
		});

		it('expands resolve.kinds.variable to false', () => {
			const resolve = prep({ resolve: false })['resolve'] as Record<
				string,
				unknown
			>;
			const kinds = resolve['kinds'] as Record<string, unknown>;
			expect(kinds['variable']).toBe(false);
		});
	});

	describe('{ statements: true } recursively', () => {
		it('expands statements.while.test to true', () => {
			const statements = prep({ statements: true })['statements'] as Record<
				string,
				unknown
			>;
			const whileLoop = statements['while'] as Record<string, unknown>;
			expect(whileLoop['test']).toBe(true);
		});

		it('expands statements.for.setup to true', () => {
			const statements = prep({ statements: true })['statements'] as Record<
				string,
				unknown
			>;
			const forLoop = statements['for'] as Record<string, unknown>;
			expect(forLoop['setup']).toBe(true);
		});

		it('expands statements.break to true', () => {
			const statements = prep({ statements: true })['statements'] as Record<
				string,
				unknown
			>;
			expect(statements['break']).toBe(true);
		});
	});

	describe('{ statements: false } recursively', () => {
		it('expands statements.while.test to false', () => {
			const statements = prep({ statements: false })['statements'] as Record<
				string,
				unknown
			>;
			const whileLoop = statements['while'] as Record<string, unknown>;
			expect(whileLoop['test']).toBe(false);
		});

		it('expands statements.break to false', () => {
			const statements = prep({ statements: false })['statements'] as Record<
				string,
				unknown
			>;
			expect(statements['break']).toBe(false);
		});
	});

	describe('{ expression: true } recursively', () => {
		it('expands expression.operators.arithmetic to true', () => {
			const expression = prep({ expression: true })['expression'] as Record<
				string,
				unknown
			>;
			const operators = expression['operators'] as Record<string, unknown>;
			expect(operators['arithmetic']).toBe(true);
		});

		it('expands expression.literals.string to true', () => {
			const expression = prep({ expression: true })['expression'] as Record<
				string,
				unknown
			>;
			const literals = expression['literals'] as Record<string, unknown>;
			expect(literals['string']).toBe(true);
		});
	});

	describe('{ scopes: false } recursively', () => {
		it('expands scopes.script.enter to false', () => {
			const scopes = prep({ scopes: false })['scopes'] as Record<
				string,
				unknown
			>;
			const script = scopes['script'] as Record<string, unknown>;
			expect(script['enter']).toBe(false);
		});

		it('expands scopes.block.enter to false', () => {
			const scopes = prep({ scopes: false })['scopes'] as Record<
				string,
				unknown
			>;
			const block = scopes['block'] as Record<string, unknown>;
			expect(block['enter']).toBe(false);
		});
	});
});

// =====================================================================
// Fine-grained overrides
// =====================================================================

describe('fine-grained overrides', () => {
	it('{ resolve: { provenance: false } } preserves provenance false', () => {
		const resolve = prep({ resolve: { provenance: false } })['resolve'] as Record<
			string,
			unknown
		>;
		expect(resolve['provenance']).toBe(false);
	});

	it('{ resolve: { provenance: false } } still defaults dependent true', () => {
		const resolve = prep({ resolve: { provenance: false } })['resolve'] as Record<
			string,
			unknown
		>;
		expect(resolve['dependent']).toBe(true);
	});

	it('{ resolve: { dependent: false } } preserves dependent false', () => {
		const resolve = prep({ resolve: { dependent: false } })['resolve'] as Record<
			string,
			unknown
		>;
		expect(resolve['dependent']).toBe(false);
	});

	it('{ resolve: { kinds: { variable: false } } } disables only variable', () => {
		const resolve = prep({
			resolve: { kinds: { variable: false } },
		})['resolve'] as Record<string, unknown>;
		const kinds = resolve['kinds'] as Record<string, unknown>;
		expect(kinds['variable']).toBe(false);
	});

	it('{ resolve: { kinds: { variable: false } } } leaves other kinds default true', () => {
		const resolve = prep({
			resolve: { kinds: { variable: false } },
		})['resolve'] as Record<string, unknown>;
		const kinds = resolve['kinds'] as Record<string, unknown>;
		expect(kinds['literal']).toBe(true);
	});

	it('{ resolve: { kinds: true } } expands all kinds to true', () => {
		const resolve = prep({ resolve: { kinds: true } })['resolve'] as Record<
			string,
			unknown
		>;
		const kinds = resolve['kinds'] as Record<string, unknown>;
		expect(kinds['variable']).toBe(true);
	});

	it('{ errors: false } preserves errors false', () => {
		expect(prep({ errors: false })['errors']).toBe(false);
	});

	it('{ with: false } preserves with false', () => {
		expect(prep({ with: false })['with']).toBe(false);
	});
});

// =====================================================================
// Idempotency
// =====================================================================

describe('idempotency', () => {
	it('double-prep produces the same result', () => {
		const first = prep({ resolve: true });
		const second = prep(first);
		expect(second).toEqual(first);
	});

	it('triple-prep produces the same result', () => {
		const first = prep({ statements: true });
		const second = prep(first);
		const third = prep(second);
		expect(third).toEqual(first);
	});
});
