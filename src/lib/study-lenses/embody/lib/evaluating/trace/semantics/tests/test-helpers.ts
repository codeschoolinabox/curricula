/**
 * @file Shared helpers for Layer 4a config pipeline browser tests.
 *
 * Provides ALL_ENABLED config, config override utility, and generator drain.
 * Each browser test file imports these to avoid duplication.
 */

import createTracingGenerator from '../tracing/index.js';

import type { TraceEvent } from '../tracing/types.js';

const ALL_ENABLED: Record<string, unknown> = {
	bindings: {
		kind: { let: true, const: true, global: true },
		events: {
			declare: true,
			initialize: true,
			available: true,
			assign: true,
			read: true,
		},
		filter: [],
	},
	propertyAccess: {
		dot: true,
		bracket: true,
		optionalChaining: true,
		filter: [],
	},
	operators: {
		pure: {
			arithmetic: true,
			addition: true,
			comparison: true,
			typeof: true,
			negation: { logical: true, bitwise: true },
			bitwise: true,
		},
		shortCircuiting: true,
		assignment: true,
		filter: [],
	},
	literals: {
		string: true,
		boolean: true,
		number: true,
		undefined: true,
		null: true,
		regex: true,
	},
	templates: { begin: true, evaluation: true, end: true },
	scopes: {
		kind: { script: true, block: true, module: true },
		events: {
			create: true,
			enter: true,
			interrupt: true,
			completion: true,
			leave: true,
		},
	},
	controlFlow: {
		kind: {
			conditionals: true,
			loops: { while: true, doWhile: true, for: true, forOf: true },
		},
		events: {
			test: true,
			branch: true,
			iteration: true,
			jump: true,
			do: true,
			initialize: true,
			increment: true,
		},
		filter: [],
	},
	functions: { call: true, return: true, filter: [] },
	with: true,
};

/** Deep-clone base, then set a nested dot-path to value. */
function withOverride(
	base: Record<string, unknown>,
	path: string,
	value: unknown,
): Record<string, unknown> {
	const clone = structuredClone(base) as Record<string, unknown>;
	const segments = path.split('.');
	let current: Record<string, unknown> = clone;

	for (let i = 0; i < segments.length - 1; i++) {
		current = current[segments[i]] as Record<string, unknown>;
	}

	current[segments[segments.length - 1]] = value;
	return clone;
}

/** Drains the async generator, collecting all yielded events and the return value. */
async function drainGenerator(
	code: string,
	config: Record<string, unknown> = ALL_ENABLED,
	maxMs: number | null = 30000,
): Promise<{ events: TraceEvent[]; result: Record<string, unknown> }> {
	const gen = createTracingGenerator(code, config, maxMs);
	const events: TraceEvent[] = [];

	let next = await gen.next();
	while (!next.done) {
		events.push(next.value);
		next = await gen.next();
	}

	return { events, result: next.value as Record<string, unknown> };
}

export { ALL_ENABLED, withOverride, drainGenerator };
