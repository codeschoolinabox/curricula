/**
 * @file Debug: verify Worker loading and execution in vitest browser mode.
 */

import { expect, it } from 'vitest';

import createTracingGenerator from '../index.js';

it('generator produces result for simple code', async () => {
	const ALL = {
		bindings: { kind: { let: true }, events: { declare: true, initialize: true, available: true } },
		literals: { number: true },
		scopes: { kind: { module: true, block: true }, events: { create: true, enter: true, completion: true, leave: true } },
	};

	const gen = createTracingGenerator('let x = 5;\n', ALL, 5000);
	const events: unknown[] = [];

	let next = await gen.next();
	while (!next.done) {
		events.push(next.value);
		console.log('Event:', JSON.stringify(next.value));
		next = await gen.next();
	}

	const result = next.value as Record<string, unknown>;
	console.log('Result:', JSON.stringify(result, null, 2));
	console.log('Event count:', events.length);

	expect(result).toBeDefined();
});
