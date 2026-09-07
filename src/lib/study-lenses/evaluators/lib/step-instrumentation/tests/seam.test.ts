import { describe, expect, it } from 'vitest';

import resolveOptions from '../resolve-options.js';

describe('resolveOptions — the one validation boundary', () => {
	it.skip('empty options yields the unfiltered shape', () => {
		const resolved = resolveOptions({});
		expect(resolved.data).toEqual({
			scopes: true,
			value: true,
			logs: true,
			dt: true,
		});
	});

	it.skip('boolean layer shorthand expands recursively', () => {
		const resolved = resolveOptions({ statements: false });
		expect(resolved.statements.while).toEqual({
			test: false,
			iteration: false,
		});
	});

	it.skip('shorthand and explicit forms resolve identically', () => {
		expect(resolveOptions({ expression: { literals: true } })).toEqual(
			resolveOptions({
				expression: {
					literals: {
						string: true,
						number: true,
						bigint: true,
						boolean: true,
						null: true,
						undefined: true,
						regex: true,
						array: true,
						object: true,
					},
				},
			}),
		);
	});

	it.skip('an unknown key refuses at any level', () => {
		expect(() =>
			resolveOptions({
				statements: { whlie: true } as never,
			}),
		).toThrow(/unknown/i);
	});

	it.skip('both lists on one filter refuse', () => {
		expect(() =>
			resolveOptions({
				expression: {
					variables: { filter: { include: ['a'], exclude: ['b'] } },
				},
			}),
		).toThrow(/mutually exclusive/i);
	});

	it.skip('an empty include list filters nothing; empty + exclude is legal', () => {
		const resolved = resolveOptions({
			expression: {
				variables: { filter: { include: [], exclude: ['secret'] } },
			},
		});
		expect(resolved.expression.variables.filter).toMatchObject({
			mode: 'exclude',
		});
	});

	it.skip('duplicate names in a list refuse', () => {
		expect(() =>
			resolveOptions({
				expression: { variables: { filter: { include: ['a', 'a'] } } },
			}),
		).toThrow(/unique/i);
	});

	it.skip('template evaluation without begin refuses (the co-gate)', () => {
		expect(() =>
			resolveOptions({
				expression: { templates: { begin: false, evaluation: true } },
			}),
		).toThrow(/begin/i);
	});

	it.skip('data.value off with resolve on refuses (a value-less resolve is content-free)', () => {
		expect(() =>
			resolveOptions({ resolve: true, data: { value: false } }),
		).toThrow(/value/i);
	});

	it.skip('expression off with dependent resolves refuses', () => {
		expect(() =>
			resolveOptions({ expression: false, resolve: { dependent: true } }),
		).toThrow(/dependent/i);
	});
});
