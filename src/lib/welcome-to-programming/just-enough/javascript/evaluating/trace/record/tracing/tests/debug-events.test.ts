import { expect, it } from 'vitest';

import instrument from '../instrument.js';
import createAspect from '../weaving/create-aspect.js';

it('dump event structure', () => {
	const config = {
		bindings: {
			kind: { let: true, const: true },
			events: { declare: true, initialize: true, available: true, read: true, assign: true },
		},
		literals: { number: true, string: true },
		scopes: {
			kind: { block: true, module: true },
			events: { create: true, enter: true, completion: true, leave: true },
		},
	};
	const { instrumentedCode } = instrument('let x = 5;\n', config);
	const aspect = createAspect(config);

	for (const [name, fn] of Object.entries(aspect.adviceGlobals)) {
		(globalThis as Record<string, unknown>)[name] = fn;
	}

	const events: unknown[] = [];
	(globalThis as Record<string, unknown>).__jej_onEvent = (e: unknown) => events.push(e);

	// eslint-disable-next-line no-new-func
	new Function(instrumentedCode)();

	// Cleanup
	for (const name of Object.keys(aspect.adviceGlobals)) {
		delete (globalThis as Record<string, unknown>)[name];
	}
	delete (globalThis as Record<string, unknown>).__jej_onEvent;

	console.log('Event count:', events.length);
	for (let i = 0; i < events.length; i++) {
		console.log(`Event ${i}:`, JSON.stringify(events[i], null, 2));
	}

	expect(events.length).toBeGreaterThan(0);
});
