/**
 * @file Unit tests for `expandShorthand` — recursive boolean-shorthand expansion.
 *
 * ZOMBIES ordered: Zero → One → Many → Boundaries → Interfaces → Exceptions → Simple.
 *
 * The JEJ-specific feature this function delivers is **recursive** expansion:
 * sl-tracing's original `expandShorthand` was shallow (only expanded schemas
 * where every property was a direct boolean). JEJ needs to expand boolean
 * shorthand against schemas with nested object properties (e.g.
 * `statements.while.test`, `resolve.kinds.variable`). The recursive expander
 * walks into sub-schemas and sets every boolean leaf.
 */

import { describe, expect, it } from 'vitest';

import expandShorthand from '../expand-shorthand.js';
import type { JSONSchema } from '../types.js';

// ─── Zero: empty / null / undefined / non-object inputs ───────

describe('expandShorthand — Zero', () => {
	describe('empty/null/undefined', () => {
		it('returns {} for undefined input', () => {
			const schema: JSONSchema = { type: 'object', properties: {} };
			expect(expandShorthand(undefined, schema)).toEqual({});
		});

		it('returns {} for null input', () => {
			const schema: JSONSchema = { type: 'object', properties: {} };
			expect(expandShorthand(null, schema)).toEqual({});
		});

		it('returns {} for empty object input', () => {
			const schema: JSONSchema = { type: 'object', properties: {} };
			expect(expandShorthand({}, schema)).toEqual({});
		});
	});

	describe('non-object primitives pass through', () => {
		it('passes a number through unchanged', () => {
			const schema: JSONSchema = { type: 'object', properties: {} };
			expect(expandShorthand(42, schema)).toBe(42);
		});

		it('passes a string through unchanged', () => {
			const schema: JSONSchema = { type: 'object', properties: {} };
			expect(expandShorthand('bogus', schema)).toBe('bogus');
		});

		it('passes a boolean through unchanged at the top level', () => {
			const schema: JSONSchema = { type: 'object', properties: {} };
			expect(expandShorthand(true, schema)).toBe(true);
		});
	});
});

// ─── One: single-key inputs ───────────────────────────────────

describe('expandShorthand — One', () => {
	it('passes through a scalar value unchanged', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: { count: { type: 'number' } },
		};
		expect(expandShorthand({ count: 5 }, schema)).toEqual({ count: 5 });
	});

	it('passes a boolean through for a boolean-typed schema field (no wrapping)', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: { enabled: { type: 'boolean' } },
		};
		expect(expandShorthand({ enabled: true }, schema)).toEqual({ enabled: true });
	});

	it('expands `true` for an object-typed schema field with a single boolean leaf', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				group: {
					type: 'object',
					properties: { a: { type: 'boolean' } },
				},
			},
		};
		expect(expandShorthand({ group: true }, schema)).toEqual({
			group: { a: true },
		});
	});

	it('expands `false` for an object-typed schema field with a single boolean leaf', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				group: {
					type: 'object',
					properties: { a: { type: 'boolean' } },
				},
			},
		};
		expect(expandShorthand({ group: false }, schema)).toEqual({
			group: { a: false },
		});
	});
});

// ─── Many: multiple keys, multiple sub-properties, recursion ───

describe('expandShorthand — Many', () => {
	it('expands `true` to every boolean leaf in a flat sub-schema', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				group: {
					type: 'object',
					properties: {
						a: { type: 'boolean' },
						b: { type: 'boolean' },
						c: { type: 'boolean' },
					},
				},
			},
		};
		expect(expandShorthand({ group: true }, schema)).toEqual({
			group: { a: true, b: true, c: true },
		});
	});

	it('expands multiple top-level keys independently', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				alpha: { type: 'object', properties: { x: { type: 'boolean' } } },
				beta: { type: 'object', properties: { y: { type: 'boolean' } } },
			},
		};
		expect(expandShorthand({ alpha: true, beta: false }, schema)).toEqual({
			alpha: { x: true },
			beta: { y: false },
		});
	});

	it('recursively expands a 2-level nested object schema', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				outer: {
					type: 'object',
					properties: {
						inner: {
							type: 'object',
							properties: { leaf: { type: 'boolean' } },
						},
					},
				},
			},
		};
		expect(expandShorthand({ outer: true }, schema)).toEqual({
			outer: { inner: { leaf: true } },
		});
	});

	it('recursively expands a 4-level nested schema', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				l1: {
					type: 'object',
					properties: {
						l2: {
							type: 'object',
							properties: {
								l3: {
									type: 'object',
									properties: {
										l4: { type: 'boolean' },
									},
								},
							},
						},
					},
				},
			},
		};
		expect(expandShorthand({ l1: true }, schema)).toEqual({
			l1: { l2: { l3: { l4: true } } },
		});
	});

	it('recursively expands with mixed leaves at different depths', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				outer: {
					type: 'object',
					properties: {
						shallowLeaf: { type: 'boolean' },
						nested: {
							type: 'object',
							properties: {
								deepLeaf: { type: 'boolean' },
							},
						},
					},
				},
			},
		};
		expect(expandShorthand({ outer: true }, schema)).toEqual({
			outer: { shallowLeaf: true, nested: { deepLeaf: true } },
		});
	});
});

// ─── Boundaries: edge cases in user input vs schema shape ─────

describe('expandShorthand — Boundaries', () => {
	it('recurses into user-provided object values (not just top-level)', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				outer: {
					type: 'object',
					properties: {
						inner: {
							type: 'object',
							properties: { leaf: { type: 'boolean' } },
						},
					},
				},
			},
		};
		expect(expandShorthand({ outer: { inner: true } }, schema)).toEqual({
			outer: { inner: { leaf: true } },
		});
	});

	it('preserves an explicit object value while expanding a sibling shorthand', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				alpha: { type: 'object', properties: { x: { type: 'boolean' } } },
				beta: { type: 'object', properties: { y: { type: 'boolean' } } },
			},
		};
		expect(
			expandShorthand({ alpha: true, beta: { y: false } }, schema),
		).toEqual({ alpha: { x: true }, beta: { y: false } });
	});

	it('passes an explicit array value through unchanged', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				filter: { type: 'array', items: { type: 'string' } },
			},
		};
		expect(expandShorthand({ filter: ['x', 'y'] }, schema)).toEqual({
			filter: ['x', 'y'],
		});
	});

	it('omits array leaves when expanding a boolean shorthand', () => {
		// When expanding `true` against a schema that has a mix of boolean
		// and array properties, only the boolean leaves get the value.
		// Arrays are left for fillDefaults to populate.
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				group: {
					type: 'object',
					properties: {
						enabled: { type: 'boolean' },
						filter: { type: 'array', items: { type: 'string' } },
					},
				},
			},
		};
		expect(expandShorthand({ group: true }, schema)).toEqual({
			group: { enabled: true },
		});
	});

	it('does not mutate its input', () => {
		const input = { group: true } as Record<string, unknown>;
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				group: { type: 'object', properties: { a: { type: 'boolean' } } },
			},
		};
		expandShorthand(input, schema);
		expect(input).toEqual({ group: true });
	});
});

// ─── Interfaces: schema-shape edge cases ──────────────────────

describe('expandShorthand — Interfaces', () => {
	it('passes unknown keys (not in the schema) through untouched', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: { known: { type: 'boolean' } },
		};
		expect(expandShorthand({ unknown: 'value' }, schema)).toEqual({
			unknown: 'value',
		});
	});

	it('handles a schema with no properties field gracefully', () => {
		const schema: JSONSchema = { type: 'object' };
		expect(expandShorthand({ anything: true }, schema)).toEqual({
			anything: true,
		});
	});

	it('does not wrap a boolean value whose schema field is type boolean', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: { flag: { type: 'boolean' } },
		};
		expect(expandShorthand({ flag: true }, schema)).toEqual({ flag: true });
	});
});

// ─── Exceptions: expandShorthand is total (never throws) ──────
// The recursive expander does not validate — validation errors are surfaced
// later in validate-config. There are no exception test cases here by design.

// ─── Simple: realistic JEJ-shaped inputs ──────────────────────

describe('expandShorthand — Simple (JEJ-realistic)', () => {
	it('{ resolve: true } expands dependent + provenance + all kinds', () => {
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
								operator: { type: 'boolean' },
							},
						},
					},
				},
			},
		};
		expect(expandShorthand({ resolve: true }, schema)).toEqual({
			resolve: {
				dependent: true,
				provenance: true,
				kinds: { variable: true, literal: true, operator: true },
			},
		});
	});

	it('{ resolve: { kinds: false } } disables only kinds, flags untouched', () => {
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
						},
					},
				},
			},
		};
		expect(
			expandShorthand({ resolve: { kinds: false } }, schema),
		).toEqual({ resolve: { kinds: { variable: false, literal: false } } });
	});

	it('{ statements: true } recursively fills while/for/doWhile leaves', () => {
		const schema: JSONSchema = {
			type: 'object',
			properties: {
				statements: {
					type: 'object',
					properties: {
						while: {
							type: 'object',
							properties: {
								test: { type: 'boolean' },
								iteration: { type: 'boolean' },
							},
						},
						for: {
							type: 'object',
							properties: {
								setup: { type: 'boolean' },
								test: { type: 'boolean' },
								iteration: { type: 'boolean' },
							},
						},
						break: { type: 'boolean' },
					},
				},
			},
		};
		expect(expandShorthand({ statements: true }, schema)).toEqual({
			statements: {
				while: { test: true, iteration: true },
				for: { setup: true, test: true, iteration: true },
				break: true,
			},
		});
	});
});
