import { describe, expect, it } from 'vitest';

import traceInNode from './pipeline-harness.js';

describe('the lifecycle-anchor family', () => {
	it.skip('a trace opens with the four lifecycle anchors', () => {
		const { events } = traceInNode('let x = 1;');
		expect(
			events
				.slice(0, 4)
				.map((event) => (event.semantics === 'lifecycle' ? event.phase : null)),
		).toEqual(['source', 'tokens', 'ast', 'environment']);
	});

	it.skip('the anchor family passes every filter', () => {
		const { events } = traceInNode('let x = 1;', {
			expression: false,
			statements: false,
			scopes: false,
			resolve: { dependent: false },
		});
		expect(
			events.filter((event) => event.semantics === 'lifecycle'),
		).toHaveLength(4);
	});

	it.skip('anchors carry the whole-program stamp at nodePath $', () => {
		const code = 'let x = 1;';
		const { events } = traceInNode(code);
		expect(events[0]).toMatchObject({
			nodePath: '$',
			start: 0,
			end: code.length,
		});
	});

	it.skip('empty code traces to the anchor family', () => {
		const { events } = traceInNode('', { scopes: false });
		expect(events.map((event) => event.semantics)).toEqual([
			'lifecycle',
			'lifecycle',
			'lifecycle',
			'lifecycle',
		]);
	});
});
